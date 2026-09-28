use std::path::{Path, PathBuf};
use std::sync::mpsc::{channel, Sender};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize, Debug)]
pub struct FileChangedPayload {
    pub path: String,
    pub content: String,
}

#[derive(Clone)]
struct InternalSaveRecord {
    path: PathBuf,
    timestamp: Instant,
    content: String,
}

struct WatcherState {
    watcher: Option<RecommendedWatcher>,
    watched_dir: Option<PathBuf>,
    target_file: Option<PathBuf>,
    original_path_str: Option<String>,
    last_save: Option<InternalSaveRecord>,
    last_emitted_content: Option<String>,
}

#[derive(Clone)]
pub struct FileWatcher {
    state: Arc<Mutex<WatcherState>>,
    event_tx: Sender<PathBuf>,
}

impl FileWatcher {
    pub fn new(app_handle: AppHandle) -> Result<Self, String> {
        Self::new_with_callback(move |payload| {
            let _ = app_handle.emit("file-changed", payload);
        })
    }

    pub fn new_with_callback<F>(on_change: F) -> Result<Self, String>
    where
        F: Fn(FileChangedPayload) + Send + 'static,
    {
        let (tx, rx) = channel::<PathBuf>();
        let state = Arc::new(Mutex::new(WatcherState {
            watcher: None,
            watched_dir: None,
            target_file: None,
            original_path_str: None,
            last_save: None,
            last_emitted_content: None,
        }));

        let state_clone = Arc::clone(&state);

        // Background worker thread for debouncing and processing events
        thread::spawn(move || {
            while let Ok(path) = rx.recv() {
                // 200ms debounce loop to aggregate multiple rapid filesystem events
                let mut latest_path = path;
                let debounce_duration = Duration::from_millis(200);
                let mut deadline = Instant::now() + debounce_duration;

                loop {
                    let remaining = deadline.saturating_duration_since(Instant::now());
                    if remaining.is_zero() {
                        break;
                    }
                    match rx.recv_timeout(remaining) {
                        Ok(p) => {
                            latest_path = p;
                            deadline = Instant::now() + debounce_duration;
                        }
                        Err(_) => {
                            break;
                        }
                    }
                }

                // Check whether the modified path matches our current watched target
                let (target_opt, orig_path_str_opt, last_save_opt) = {
                    let lock = state_clone.lock().unwrap();
                    (
                        lock.target_file.clone(),
                        lock.original_path_str.clone(),
                        lock.last_save.clone(),
                    )
                };

                if let Some(target) = target_opt {
                    let canonical_latest = latest_path.canonicalize().ok();
                    let canonical_target = target.canonicalize().ok();

                    let is_target = latest_path == target
                        || (canonical_latest.is_some() && canonical_latest == canonical_target)
                        || (latest_path.file_name() == target.file_name()
                            && (latest_path.parent() == target.parent()
                                || latest_path.parent().and_then(|p| p.canonicalize().ok())
                                    == target.parent().and_then(|p| p.canonicalize().ok())));

                    if is_target {
                        if let Ok(content) = std::fs::read_to_string(&target) {
                            let mut is_self_save = false;

                            if let Some(ref last_save) = last_save_opt {
                                let same_path = last_save.path == target
                                    || (last_save.path.canonicalize().ok().is_some()
                                        && last_save.path.canonicalize().ok() == canonical_target);

                                if same_path
                                    && last_save.timestamp.elapsed() < Duration::from_millis(1500)
                                    && last_save.content == content
                                {
                                    is_self_save = true;
                                }
                            }

                            // Deduplicate: check if content equals what was already emitted
                            let is_duplicate_content = {
                                let lock = state_clone.lock().unwrap();
                                lock.last_emitted_content.as_deref() == Some(content.as_str())
                            };

                            if !is_self_save && !is_duplicate_content {
                                {
                                    let mut lock = state_clone.lock().unwrap();
                                    lock.last_emitted_content = Some(content.clone());
                                }

                                let emitted_path = orig_path_str_opt
                                    .unwrap_or_else(|| target.to_string_lossy().to_string());
                                let payload = FileChangedPayload {
                                    path: emitted_path,
                                    content,
                                };
                                on_change(payload);
                            }
                        }
                    }
                }
            }
        });

        Ok(Self {
            state,
            event_tx: tx,
        })
    }

    pub fn watch_file(&self, file_path_str: &str) -> Result<(), String> {
        let path = PathBuf::from(file_path_str);
        let absolute_path = if let Ok(canonical) = path.canonicalize() {
            canonical
        } else if path.is_absolute() {
            path
        } else {
            std::env::current_dir()
                .map_err(|e| e.to_string())?
                .join(path)
        };

        let parent_dir = if let Some(p) = absolute_path.parent() {
            p.canonicalize().unwrap_or_else(|_| p.to_path_buf())
        } else {
            return Err("Invalid file path: missing parent directory".to_string());
        };

        let initial_content = std::fs::read_to_string(&absolute_path).ok();

        let mut lock = self.state.lock().unwrap();

        // If already watching the same directory and file, just update initial content
        if lock.watched_dir.as_ref() == Some(&parent_dir)
            && lock.target_file.as_ref() == Some(&absolute_path)
        {
            lock.last_emitted_content = initial_content;
            return Ok(());
        }

        // Clean up previous watcher if parent directory changed
        if lock.watched_dir.as_ref() != Some(&parent_dir) {
            lock.watcher = None;
            lock.watched_dir = None;

            let tx = self.event_tx.clone();
            let mut watcher = RecommendedWatcher::new(
                move |res: Result<Event, notify::Error>| {
                    if let Ok(event) = res {
                        match event.kind {
                            EventKind::Modify(_)
                            | EventKind::Create(_)
                            | EventKind::Any => {
                                for path in event.paths {
                                    let _ = tx.send(path);
                                }
                            }
                            _ => {}
                        }
                    }
                },
                Config::default(),
            )
            .map_err(|e| format!("Failed to create watcher: {}", e))?;

            watcher
                .watch(&parent_dir, RecursiveMode::NonRecursive)
                .map_err(|e| format!("Failed to watch directory: {}", e))?;

            lock.watcher = Some(watcher);
            lock.watched_dir = Some(parent_dir);
        }

        lock.target_file = Some(absolute_path);
        lock.original_path_str = Some(file_path_str.to_string());
        lock.last_emitted_content = initial_content;
        Ok(())
    }

    pub fn unwatch_file(&self) {
        let mut lock = self.state.lock().unwrap();
        lock.watcher = None;
        lock.watched_dir = None;
        lock.target_file = None;
        lock.original_path_str = None;
        lock.last_save = None;
        lock.last_emitted_content = None;
    }

    pub fn record_internal_save(&self, path: &Path, content: &str) {
        let canonical_path = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());
        let mut lock = self.state.lock().unwrap();
        lock.last_save = Some(InternalSaveRecord {
            path: canonical_path,
            timestamp: Instant::now(),
            content: content.to_string(),
        });
        lock.last_emitted_content = Some(content.to_string());
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_watcher_external_edit() {
        let temp_dir = std::env::temp_dir().join(format!("tiniread_test_{}", std::process::id()));
        let _ = std::fs::create_dir_all(&temp_dir);
        let test_file = temp_dir.join("test_watch.md");
        std::fs::write(&test_file, "# Original").unwrap();

        let (notify_tx, notify_rx) = channel::<FileChangedPayload>();
        let watcher = FileWatcher::new_with_callback(move |payload| {
            let _ = notify_tx.send(payload);
        })
        .unwrap();

        watcher.watch_file(test_file.to_string_lossy().as_ref()).unwrap();

        // 1. Internal save should be ignored
        watcher.record_internal_save(&test_file, "# Internal Saved Content");
        std::fs::write(&test_file, "# Internal Saved Content").unwrap();
        std::thread::sleep(Duration::from_millis(400));
        assert!(notify_rx.try_recv().is_err(), "Internal save should not emit event");

        // 2. External modification should trigger event
        std::fs::write(&test_file, "# Modified by External Program").unwrap();
        let received = notify_rx.recv_timeout(Duration::from_secs(3));
        assert!(received.is_ok(), "External modification should trigger event");
        let payload = received.unwrap();
        assert_eq!(payload.content, "# Modified by External Program");

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
