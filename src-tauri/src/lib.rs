mod db;
mod fs_ops;
mod models;
mod watcher;

use std::env;
use std::path::PathBuf;
use db::Database;
use models::{
    DocumentData, DocumentHighlight, RecentDocument, RecentWorkspace, WorkspaceInfo,
};
use watcher::FileWatcher;

#[tauri::command]
fn scan_workspace(path: Option<String>, db: tauri::State<Database>) -> Result<WorkspaceInfo, String> {
    let target_dir = if let Some(p) = path.filter(|s| !s.is_empty()) {
        let p_buf = PathBuf::from(&p);
        if !p_buf.is_dir() {
            return Err("目录不存在".to_string());
        }
        p_buf
    } else if let Ok(Some(saved_path)) = db.get_setting("current_workspace") {
        if saved_path.is_empty()
            || saved_path.ends_with("/Documents/TiniRead")
            || saved_path.ends_with("\\Documents\\TiniRead")
        {
            let _ = db.set_setting("current_workspace", "");
            return Ok(WorkspaceInfo {
                path: String::new(),
                name: String::new(),
                files: Vec::new(),
            });
        }
        let p = PathBuf::from(&saved_path);
        if p.is_dir() {
            p
        } else {
            let _ = db.set_setting("current_workspace", "");
            return Ok(WorkspaceInfo {
                path: String::new(),
                name: String::new(),
                files: Vec::new(),
            });
        }
    } else {
        return Ok(WorkspaceInfo {
            path: String::new(),
            name: String::new(),
            files: Vec::new(),
        });
    };

    let target_dir_canonical = target_dir
        .canonicalize()
        .unwrap_or_else(|_| target_dir.clone());
    let path_str = target_dir_canonical.to_string_lossy().to_string();
    let name_str = target_dir_canonical
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("工作区")
        .to_string();

    let _ = db.set_setting("current_workspace", &path_str);
    let _ = db.record_workspace_open(&path_str, &name_str);

    let files = fs_ops::scan_workspace(&target_dir_canonical);

    Ok(WorkspaceInfo {
        path: path_str,
        name: name_str,
        files,
    })
}

#[tauri::command]
fn read_document(path: String, db: tauri::State<Database>) -> Result<DocumentData, String> {
    let target_path = if !PathBuf::from(&path).is_absolute() {
        if let Ok(Some(ws)) = db.get_setting("current_workspace") {
            if !ws.is_empty() {
                PathBuf::from(ws).join(&path)
            } else {
                PathBuf::from(&path)
            }
        } else {
            PathBuf::from(&path)
        }
    } else {
        PathBuf::from(&path)
    };
    let doc = fs_ops::read_document(&target_path).map_err(|e| format!("Read error: {}", e))?;

    let file_path_str = target_path.to_string_lossy().to_string();
    let file_name = target_path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("未命名文档.md")
        .to_string();
    let snippet = doc
        .content
        .lines()
        .find(|l| !l.trim().is_empty() && !l.trim().starts_with('#'))
        .map(|l| l.trim().chars().take(80).collect())
        .unwrap_or_else(|| "暂无描述".to_string());

    let _ = db.record_document_open(&file_path_str, &file_name, &doc.title, &snippet, doc.word_count);
    let _ = db.set_setting("last_active_doc", &file_path_str);

    Ok(doc)
}

#[tauri::command]
fn save_document(
    path: String,
    html_content: String,
    db: tauri::State<Database>,
    watcher: tauri::State<FileWatcher>,
) -> Result<String, String> {
    let target_path = if !PathBuf::from(&path).is_absolute() {
        if let Ok(Some(ws)) = db.get_setting("current_workspace") {
            if !ws.is_empty() {
                PathBuf::from(ws).join(&path)
            } else {
                PathBuf::from(&path)
            }
        } else {
            PathBuf::from(&path)
        }
    } else {
        PathBuf::from(&path)
    };

    fs_ops::save_document(target_path.to_string_lossy().as_ref(), &html_content)
        .map_err(|e| format!("Save error: {}", e))?;

    // Record internal save to prevent watcher loop
    watcher.record_internal_save(&target_path, &html_content);

    let file_path_str = target_path.to_string_lossy().to_string();
    let file_name = target_path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("未命名文档.md")
        .to_string();
    let snippet = html_content.chars().take(80).collect::<String>();
    let _ = db.record_document_open(&file_path_str, &file_name, &file_name, &snippet, html_content.chars().count());
    let _ = db.set_setting("last_active_doc", &file_path_str);

    Ok(file_path_str)
}

#[tauri::command]
fn get_recent_workspaces(db: tauri::State<Database>) -> Result<Vec<RecentWorkspace>, String> {
    db.list_recent_workspaces()
}

#[tauri::command]
fn remove_recent_workspace(db: tauri::State<Database>, path: String) -> Result<(), String> {
    db.remove_recent_workspace(&path)
}

#[tauri::command]
fn get_last_active_doc(db: tauri::State<Database>) -> Result<Option<String>, String> {
    db.get_setting("last_active_doc")
}

#[tauri::command]
fn watch_file(
    watcher: tauri::State<FileWatcher>,
    db: tauri::State<Database>,
    path: String,
) -> Result<(), String> {
    if path.is_empty() {
        watcher.unwatch_file();
        Ok(())
    } else {
        let target_path = if !PathBuf::from(&path).is_absolute() {
            if let Ok(Some(ws)) = db.get_setting("current_workspace") {
                if !ws.is_empty() {
                    PathBuf::from(ws).join(&path)
                } else {
                    PathBuf::from(&path)
                }
            } else {
                PathBuf::from(&path)
            }
        } else {
            PathBuf::from(&path)
        };
        watcher.watch_file(target_path.to_string_lossy().as_ref())
    }
}

#[tauri::command]
fn unwatch_file(watcher: tauri::State<FileWatcher>) -> Result<(), String> {
    watcher.unwatch_file();
    Ok(())
}

#[tauri::command]
fn get_recent_documents(db: tauri::State<Database>) -> Result<Vec<RecentDocument>, String> {
    db.list_recent_docs()
}

#[tauri::command]
fn remove_recent_document(db: tauri::State<Database>, id: String) -> Result<(), String> {
    db.remove_recent_doc(&id)
}

#[tauri::command]
fn clear_recent_documents(db: tauri::State<Database>) -> Result<(), String> {
    db.clear_recent_docs()
}

#[tauri::command]
fn update_document_progress(db: tauri::State<Database>, path: String, progress: f64) -> Result<(), String> {
    db.update_scroll_progress(&path, progress)
}

#[tauri::command]
fn get_document_highlights(db: tauri::State<Database>, path: String) -> Result<Vec<DocumentHighlight>, String> {
    db.list_highlights_by_file(&path)
}

#[tauri::command]
fn get_all_highlights(db: tauri::State<Database>) -> Result<Vec<DocumentHighlight>, String> {
    db.list_all_highlights()
}

#[tauri::command]
fn save_document_highlight(
    db: tauri::State<Database>,
    file_path: String,
    selected_text: String,
    color: String,
    note: Option<String>,
) -> Result<DocumentHighlight, String> {
    db.add_highlight(&file_path, &selected_text, &color, note)
}

#[tauri::command]
fn delete_document_highlight(db: tauri::State<Database>, id: String) -> Result<(), String> {
    db.delete_highlight(&id)
}

#[tauri::command]
fn open_file_dialog() -> Option<String> {
    let file = rfd::FileDialog::new()
        .add_filter("Markdown", &["md", "markdown", "mdown", "txt"])
        .pick_file();
    file.map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
fn save_file_dialog(default_name: Option<String>) -> Option<String> {
    let file = rfd::FileDialog::new()
        .add_filter("Markdown", &["md", "markdown"])
        .set_file_name(default_name.as_deref().unwrap_or("未命名文档.md"))
        .save_file();
    file.map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
fn open_folder_dialog() -> Option<String> {
    let folder = rfd::FileDialog::new().pick_folder();
    folder.map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
fn drag_window(window: tauri::Window) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_maximize_window(window: tauri::Window) -> Result<(), String> {
    let maximized = window.is_maximized().map_err(|e| e.to_string())?;
    if maximized {
        window.unmaximize().map_err(|e| e.to_string())
    } else {
        window.maximize().map_err(|e| e.to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = Database::init().expect("failed to initialize sqlite database");

    tauri::Builder::default()
        .manage(db)
        .setup(|app| {
            use tauri::Manager;
            let file_watcher = FileWatcher::new(app.handle().clone())
                .map_err(|e| Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)) as Box<dyn std::error::Error>)?;
            app.manage(file_watcher);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scan_workspace,
            get_recent_workspaces,
            remove_recent_workspace,
            get_last_active_doc,
            read_document,
            save_document,
            watch_file,
            unwatch_file,
            get_recent_documents,
            remove_recent_document,
            clear_recent_documents,
            update_document_progress,
            get_document_highlights,
            get_all_highlights,
            save_document_highlight,
            delete_document_highlight,
            open_file_dialog,
            save_file_dialog,
            open_folder_dialog,
            drag_window,
            toggle_maximize_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

