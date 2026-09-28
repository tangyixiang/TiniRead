mod fs_ops;
mod models;

use std::env;
use std::path::PathBuf;
use models::{DocumentData, WorkspaceFile};

fn get_default_workspace_dir() -> PathBuf {
    if let Ok(cur) = env::current_dir() {
        let root = if cur.file_name().and_then(|s| s.to_str()) == Some("src-tauri") {
            cur.parent().unwrap_or(&cur).to_path_buf()
        } else {
            cur
        };
        if root.join("Cargo.toml").exists() && root.join("package.json").exists() {
            return root;
        }
    }

    if let Some(doc_dir) = dirs::document_dir() {
        let app_dir = doc_dir.join("TiniRead");
        if !app_dir.exists() {
            let _ = std::fs::create_dir_all(&app_dir);
            let welcome_file = app_dir.join("欢迎使用 TiniRead.md");
            if !welcome_file.exists() {
                let default_content = "# 欢迎使用 TiniRead\n\nTiniRead 是一款轻量本地 Markdown 阅读与编辑工具。\n\n## 功能特性\n- 极简专注：支持阅读与文本双模式自由切换\n- 双栏与三栏视图：灵活适应多种屏幕尺寸与多任务场景\n- 纯本地存储：文档完全保存在您的本地磁盘中\n- 流畅快捷：支持快捷键保存与本地文件拖拽打开\n\n默认工作区位于：`~/Documents/TiniRead`。您可以将 Markdown 文件存放在此目录下。\n";
                let _ = std::fs::write(&welcome_file, default_content);
            }
        }
        return app_dir;
    }

    PathBuf::from(".")
}

#[tauri::command]
fn scan_workspace(path: Option<String>) -> Vec<WorkspaceFile> {
    let target_dir = match path {
        Some(p) if !p.is_empty() => PathBuf::from(p),
        _ => get_default_workspace_dir(),
    };
    fs_ops::scan_workspace(&target_dir)
}

#[tauri::command]
fn read_document(path: String) -> Result<DocumentData, String> {
    let target_path = if !PathBuf::from(&path).is_absolute() {
        let base_dir = get_default_workspace_dir();
        base_dir.join(path)
    } else {
        PathBuf::from(path)
    };
    fs_ops::read_document(&target_path).map_err(|e| format!("Read error: {}", e))
}

#[tauri::command]
fn save_document(path: String, html_content: String) -> Result<(), String> {
    let base_dir = get_default_workspace_dir();
    let target_path = if path.is_empty() || path == "未命名文档.md" {
        base_dir.join("未命名文档.md")
    } else if !PathBuf::from(&path).is_absolute() {
        base_dir.join(&path)
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
