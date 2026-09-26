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
