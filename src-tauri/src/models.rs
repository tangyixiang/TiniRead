use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceFile {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub snippet: String,
    pub word_count: usize,
    pub modified: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentData {
    pub path: String,
    pub title: String,
    pub content: String,
    pub html_content: String,
    pub word_count: usize,
    pub modified: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentDocument {
    pub id: String,
    pub file_path: String,
    pub file_name: String,
    pub title: String,
    pub snippet: String,
    pub word_count: usize,
    pub last_opened_at: u64,
    pub scroll_progress: f64,
    pub is_pinned: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentHighlight {
    pub id: String,
    pub file_path: String,
    pub selected_text: String,
    pub color: String,
    pub note: Option<String>,
    pub created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentWorkspace {
    pub path: String,
    pub name: String,
    pub last_opened_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceInfo {
    pub path: String,
    pub name: String,
    pub files: Vec<WorkspaceFile>,
}

