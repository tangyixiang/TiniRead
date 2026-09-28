use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use rusqlite::{params, Connection};
use uuid::Uuid;

use crate::models::{DocumentHighlight, RecentDocument, RecentWorkspace};

pub struct Database {
    conn: Mutex<Connection>,
}

fn get_now_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

fn get_db_path() -> PathBuf {
    let base = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    let app_dir = base.join("com.tiniread.desktop");
    if !app_dir.exists() {
        let _ = fs::create_dir_all(&app_dir);
    }
    app_dir.join("tiniread.db")
}

impl Database {
    pub fn init() -> Result<Self, String> {
        let db_path = get_db_path();
        let conn = Connection::open(&db_path).map_err(|e| format!("Failed to open DB: {}", e))?;
        Self::init_with_conn(conn)
    }

    #[cfg(test)]
    pub fn init_memory() -> Result<Self, String> {
        let conn = Connection::open_in_memory().map_err(|e| e.to_string())?;
        Self::init_with_conn(conn)
    }

    fn init_with_conn(conn: Connection) -> Result<Self, String> {
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS recent_documents (
                id TEXT PRIMARY KEY,
                file_path TEXT UNIQUE NOT NULL,
                file_name TEXT NOT NULL,
                title TEXT NOT NULL,
                snippet TEXT NOT NULL,
                word_count INTEGER DEFAULT 0,
                last_opened_at INTEGER NOT NULL,
                scroll_progress REAL DEFAULT 0.0,
                is_pinned INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS document_highlights (
                id TEXT PRIMARY KEY,
                file_path TEXT NOT NULL,
                selected_text TEXT NOT NULL,
                color TEXT NOT NULL,
                note TEXT,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS recent_workspaces (
                path TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                last_opened_at INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_highlights_file_path ON document_highlights(file_path);
            "#,
        )
        .map_err(|e| format!("Failed to create tables: {}", e))?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn list_recent_docs(&self) -> Result<Vec<RecentDocument>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, file_path, file_name, title, snippet, word_count, last_opened_at, scroll_progress, is_pinned 
                 FROM recent_documents 
                 ORDER BY is_pinned DESC, last_opened_at DESC 
                 LIMIT 50",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |row| {
                let is_pinned_num: i32 = row.get(8)?;
                Ok(RecentDocument {
                    id: row.get(0)?,
                    file_path: row.get(1)?,
                    file_name: row.get(2)?,
                    title: row.get(3)?,
                    snippet: row.get(4)?,
                    word_count: row.get::<_, i64>(5)? as usize,
                    last_opened_at: row.get::<_, i64>(6)? as u64,
                    scroll_progress: row.get(7)?,
                    is_pinned: is_pinned_num != 0,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut docs = Vec::new();
        for doc in rows {
            if let Ok(d) = doc {
                docs.push(d);
            }
        }
        Ok(docs)
    }

    pub fn record_document_open(
        &self,
        file_path: &str,
        file_name: &str,
        title: &str,
        snippet: &str,
        word_count: usize,
    ) -> Result<RecentDocument, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let now = get_now_timestamp();
        let new_id = Uuid::new_v4().to_string();

        conn.execute(
            r#"
            INSERT INTO recent_documents (id, file_path, file_name, title, snippet, word_count, last_opened_at, scroll_progress, is_pinned)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0.0, 0)
            ON CONFLICT(file_path) DO UPDATE SET
                file_name = excluded.file_name,
                title = excluded.title,
                snippet = excluded.snippet,
                word_count = excluded.word_count,
                last_opened_at = excluded.last_opened_at
            "#,
            params![new_id, file_path, file_name, title, snippet, word_count as i64, now as i64],
        )
        .map_err(|e| e.to_string())?;

        let mut stmt = conn
            .prepare(
                "SELECT id, file_path, file_name, title, snippet, word_count, last_opened_at, scroll_progress, is_pinned 
                 FROM recent_documents WHERE file_path = ?1",
            )
            .map_err(|e| e.to_string())?;

        let doc = stmt
            .query_row(params![file_path], |row| {
                let is_pinned_num: i32 = row.get(8)?;
                Ok(RecentDocument {
                    id: row.get(0)?,
                    file_path: row.get(1)?,
                    file_name: row.get(2)?,
                    title: row.get(3)?,
                    snippet: row.get(4)?,
                    word_count: row.get::<_, i64>(5)? as usize,
                    last_opened_at: row.get::<_, i64>(6)? as u64,
                    scroll_progress: row.get(7)?,
                    is_pinned: is_pinned_num != 0,
                })
            })
            .map_err(|e| e.to_string())?;

        Ok(doc)
    }

    pub fn remove_recent_doc(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM recent_documents WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn clear_recent_docs(&self) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM recent_documents", [])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn update_scroll_progress(&self, file_path: &str, progress: f64) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE recent_documents SET scroll_progress = ?1 WHERE file_path = ?2",
            params![progress, file_path],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_highlights_by_file(&self, file_path: &str) -> Result<Vec<DocumentHighlight>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, file_path, selected_text, color, note, created_at 
                 FROM document_highlights 
                 WHERE file_path = ?1 
                 ORDER BY created_at ASC",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![file_path], |row| {
                Ok(DocumentHighlight {
                    id: row.get(0)?,
                    file_path: row.get(1)?,
                    selected_text: row.get(2)?,
                    color: row.get(3)?,
                    note: row.get(4)?,
                    created_at: row.get::<_, i64>(5)? as u64,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut list = Vec::new();
        for h in rows {
            if let Ok(item) = h {
                list.push(item);
            }
        }
        Ok(list)
    }

    pub fn list_all_highlights(&self) -> Result<Vec<DocumentHighlight>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, file_path, selected_text, color, note, created_at 
                 FROM document_highlights 
                 ORDER BY created_at DESC 
                 LIMIT 200",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |row| {
                Ok(DocumentHighlight {
                    id: row.get(0)?,
                    file_path: row.get(1)?,
                    selected_text: row.get(2)?,
                    color: row.get(3)?,
                    note: row.get(4)?,
                    created_at: row.get::<_, i64>(5)? as u64,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut list = Vec::new();
        for h in rows {
            if let Ok(item) = h {
                list.push(item);
            }
        }
        Ok(list)
    }

    pub fn add_highlight(
        &self,
        file_path: &str,
        selected_text: &str,
        color: &str,
        note: Option<String>,
    ) -> Result<DocumentHighlight, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let id = Uuid::new_v4().to_string();
        let now = get_now_timestamp();

        conn.execute(
            r#"
            INSERT INTO document_highlights (id, file_path, selected_text, color, note, created_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            "#,
            params![id, file_path, selected_text, color, note, now as i64],
        )
        .map_err(|e| e.to_string())?;

        Ok(DocumentHighlight {
            id,
            file_path: file_path.to_string(),
            selected_text: selected_text.to_string(),
            color: color.to_string(),
            note,
            created_at: now,
        })
    }

    pub fn delete_highlight(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM document_highlights WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT value FROM app_settings WHERE key = ?1")
            .map_err(|e| e.to_string())?;
        let mut rows = stmt
            .query_map(params![key], |row| row.get::<_, String>(0))
            .map_err(|e| e.to_string())?;

        if let Some(Ok(val)) = rows.next() {
            Ok(Some(val))
        } else {
            Ok(None)
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let now = get_now_timestamp();
        conn.execute(
            r#"
            INSERT INTO app_settings (key, value, updated_at)
            VALUES (?1, ?2, ?3)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = excluded.updated_at
            "#,
            params![key, value, now as i64],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn record_workspace_open(&self, path: &str, name: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let now = get_now_timestamp();
        conn.execute(
            r#"
            INSERT INTO recent_workspaces (path, name, last_opened_at)
            VALUES (?1, ?2, ?3)
            ON CONFLICT(path) DO UPDATE SET
                name = excluded.name,
                last_opened_at = excluded.last_opened_at
            "#,
            params![path, name, now as i64],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_recent_workspaces(&self) -> Result<Vec<RecentWorkspace>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT path, name, last_opened_at FROM recent_workspaces ORDER BY last_opened_at DESC LIMIT 15")
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |row| {
                Ok(RecentWorkspace {
                    path: row.get(0)?,
                    name: row.get(1)?,
                    last_opened_at: row.get::<_, i64>(2)? as u64,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut list = Vec::new();
        for item in rows {
            if let Ok(w) = item {
                if !w.path.ends_with("/Documents/TiniRead")
                    && !w.path.ends_with("\\Documents\\TiniRead")
                    && std::path::Path::new(&w.path).exists()
                {
                    list.push(w);
                }
            }
        }
        Ok(list)
    }

    pub fn remove_recent_workspace(&self, path: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM recent_workspaces WHERE path = ?1", params![path])
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_settings_and_workspaces() {
        let db = Database::init_memory().unwrap();

        // 1. Settings persistence
        db.set_setting("current_workspace", "/tmp/demo_workspace").unwrap();
        let val = db.get_setting("current_workspace").unwrap();
        assert_eq!(val, Some("/tmp/demo_workspace".to_string()));

        db.set_setting("last_active_doc", "/tmp/demo_workspace/doc1.md").unwrap();
        let doc_val = db.get_setting("last_active_doc").unwrap();
        assert_eq!(doc_val, Some("/tmp/demo_workspace/doc1.md".to_string()));

        // 2. Recent workspaces
        let temp_dir = std::env::temp_dir().join(format!("tiniread_ws_test_{}", get_now_timestamp()));
        std::fs::create_dir_all(&temp_dir).unwrap();
        let ws_path = temp_dir.to_str().unwrap();

        db.record_workspace_open(ws_path, "tiniread_ws_test").unwrap();
        let list = db.list_recent_workspaces().unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].name, "tiniread_ws_test");
        assert_eq!(list[0].path, ws_path);

        // 3. Remove workspace
        db.remove_recent_workspace(ws_path).unwrap();
        let list_after = db.list_recent_workspaces().unwrap();
        assert_eq!(list_after.len(), 0);

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}

