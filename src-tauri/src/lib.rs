mod fs_ops;
mod models;

use std::env;
use std::path::PathBuf;
use models::{DocumentData, WorkspaceFile};

#[tauri::command]
fn scan_workspace(path: Option<String>) -> Vec<WorkspaceFile> {
    let target_dir = match path {
        Some(p) if !p.is_empty() => PathBuf::from(p),
        _ => {
            let cur = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
            if cur.file_name().and_then(|s| s.to_str()) == Some("src-tauri") {
                cur.parent().unwrap_or(&cur).to_path_buf()
            } else {
                cur
            }
        }
    };
    fs_ops::scan_workspace(&target_dir)
}

#[tauri::command]
fn read_document(path: String) -> Result<DocumentData, String> {
    let target_path = if !PathBuf::from(&path).is_absolute() {
        let cur = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        let root = if cur.file_name().and_then(|s| s.to_str()) == Some("src-tauri") {
            cur.parent().unwrap_or(&cur).to_path_buf()
        } else {
            cur
        };
        root.join(path)
    } else {
        PathBuf::from(path)
    };
    fs_ops::read_document(&target_path).map_err(|e| format!("Read error: {}", e))
}

#[tauri::command]
fn save_document(path: String, html_content: String) -> Result<(), String> {
    let target_path = if path.is_empty() || path == "未命名文档.md" {
        let cur = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        let root = if cur.file_name().and_then(|s| s.to_str()) == Some("src-tauri") {
            cur.parent().unwrap_or(&cur).to_path_buf()
        } else {
            cur
        };
        root.join("未命名文档.md")
    } else if !PathBuf::from(&path).is_absolute() {
        let cur = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        let root = if cur.file_name().and_then(|s| s.to_str()) == Some("src-tauri") {
            cur.parent().unwrap_or(&cur).to_path_buf()
        } else {
            cur
        };
        root.join(&path)
    } else {
        PathBuf::from(path)
    };
    fs_ops::save_document(target_path.to_string_lossy().as_ref(), &html_content)
        .map_err(|e| format!("Save error: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            scan_workspace,
            read_document,
            save_document
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
