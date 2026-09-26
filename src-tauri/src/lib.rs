mod fs_ops;
mod models;

use std::env;
use std::path::PathBuf;
use models::{DocumentData, WorkspaceFile};

#[tauri::command]
fn scan_workspace(path: Option<String>) -> Vec<WorkspaceFile> {
    let target_dir = match path {
        Some(p) if !p.is_empty() => PathBuf::from(p),
        _ => env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
    };
    fs_ops::scan_workspace(&target_dir)
}

#[tauri::command]
fn read_document(path: String) -> Result<DocumentData, String> {
    let p = PathBuf::from(path);
    fs_ops::read_document(&p).map_err(|e| format!("Read error: {}", e))
}

#[tauri::command]
fn save_document(path: String, html_content: String) -> Result<(), String> {
    fs_ops::save_document(&path, &html_content).map_err(|e| format!("Save error: {}", e))
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
