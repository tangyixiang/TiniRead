use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;
use pulldown_cmark::{html, Options, Parser};

use crate::models::{DocumentData, WorkspaceFile};

pub fn scan_workspace(root: &Path) -> Vec<WorkspaceFile> {
    let mut files = Vec::new();
    scan_dir_recursive(root, &mut files, 0, 4);
    files.sort_by_key(|a| std::cmp::Reverse(a.modified));
    files
}

fn is_ignored_dir(name: &str) -> bool {
    if name.starts_with('.') {
        return true;
    }
    matches!(
        name,
        "target"
            | "node_modules"
            | "dist"
            | "build"
            | "Library"
            | "Music"
            | "Pictures"
            | "Movies"
            | "Applications"
            | "System"
            | ".Trash"
    )
}

fn scan_dir_recursive(dir: &Path, files: &mut Vec<WorkspaceFile>, depth: usize, max_depth: usize) {
    if depth > max_depth {
        return;
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let dir_name = path.file_name().and_then(|s| s.to_str()).unwrap_or("");
                if !is_ignored_dir(dir_name) {
                    scan_dir_recursive(&path, files, depth + 1, max_depth);
                }
            } else if path.is_file() {
                let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("");
                if ext.eq_ignore_ascii_case("md")
                    || ext.eq_ignore_ascii_case("markdown")
                    || ext.eq_ignore_ascii_case("mdown")
                {
                    let name = path
                        .file_name()
                        .and_then(|s| s.to_str())
                        .unwrap_or("untitled.md")
                        .to_string();

                    let metadata = entry.metadata().ok();
                    let modified = metadata
                        .and_then(|m| m.modified().ok())
                        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                        .map(|d| d.as_secs())
                        .unwrap_or(0);

                    let content = fs::read_to_string(&path).unwrap_or_default();
                    let word_count = content.chars().count();
                    let snippet = extract_snippet(&content);

                    files.push(WorkspaceFile {
                        name,
                        path: path.to_string_lossy().to_string(),
                        is_dir: false,
                        snippet,
                        word_count,
                        modified,
                    });
                }
            }
        }
    }
}

pub fn read_document(path: &Path) -> std::io::Result<DocumentData> {
    let content = fs::read_to_string(path)?;
    let metadata = fs::metadata(path)?;
    let modified = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let title = extract_title(&content, path);
    let html_content = markdown_to_html(&content);
    let word_count = content.chars().count();

    Ok(DocumentData {
        path: path.to_string_lossy().to_string(),
        title,
        content,
        html_content,
        word_count,
        modified,
    })
}

pub fn save_document(path_str: &str, content: &str) -> std::io::Result<()> {
    let path = PathBuf::from(path_str);
    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent)?;
        }
    }

    let markdown_text = if content.contains("<p>") || content.contains("<br>") {
        html_to_markdown_simple(content)
    } else {
        content.to_string()
    };
    fs::write(&path, markdown_text)?;

    Ok(())
}

fn extract_title(content: &str, path: &Path) -> String {
    for line in content.lines() {
        let trimmed = line.trim();
        if let Some(title) = trimmed.strip_prefix("# ") {
            return title.trim().to_string();
        }
    }
    path.file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("无标题文档")
        .to_string()
}

fn extract_snippet(content: &str) -> String {
    for line in content.lines() {
        let trimmed = line.trim();
        if !trimmed.is_empty() && !trimmed.starts_with('#') {
            return trimmed.chars().take(100).collect();
        }
    }
    "暂无正文描述".to_string()
}

pub fn markdown_to_html(markdown_input: &str) -> String {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_HEADING_ATTRIBUTES);

    let parser = Parser::new_ext(markdown_input, options);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);
    html_output
}

fn html_to_markdown_simple(html: &str) -> String {
    let mut text = html.to_string();
    text = text.replace("<br>", "\n");
    text = text.replace("<br/>", "\n");
    text = text.replace("</p>", "\n\n");
    text = text.replace("<p>", "");
    text = text.replace("&nbsp;", " ");
    text = text.replace("&amp;", "&");
    text = text.replace("&lt;", "<");
    text = text.replace("&gt;", ">");
    text
}
