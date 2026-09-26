use std::io::Cursor;
use std::path::PathBuf;
use std::sync::Arc;
use tiny_http::{Header, Method, Response, Server};

use crate::fs_ops::{read_document, save_document, scan_workspace};
use crate::models::{ApiResponse, SaveRequest};

const HTML_APP: &str = include_str!("../web/index.html");

pub struct AppServer {
    workspace_root: PathBuf,
    server: Arc<Server>,
}

impl AppServer {
    pub fn new(host: &str, port: u16, workspace: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        let server = Server::http(format!("{}:{}", host, port))
            .map_err(|e| format!("Failed to bind server: {}", e))?;
        
        Ok(Self {
            workspace_root: workspace,
            server: Arc::new(server),
        })
    }

    pub fn run(&self) {
        println!("MarkView backend listening on http://{}", self.server.server_addr());

        for mut request in self.server.incoming_requests() {
            let url = request.url().to_string();
            let method = request.method().clone();

            let (path_part, query_part) = match url.split_once('?') {
                Some((p, q)) => (p, q),
                None => (url.as_str(), ""),
            };

            let headers = vec![
                Header::from_bytes(&b"Content-Type"[..], &b"application/json; charset=utf-8"[..]).unwrap(),
                Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap(),
                Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"Content-Type"[..]).unwrap(),
            ];

            match (&method, path_part) {
                // Static Embedded App HTML
                (&Method::Get, "/") | (&Method::Get, "/index.html") => {
                    let html_header = Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap();
                    let response = Response::new(
                        200.into(),
                        vec![html_header],
                        Cursor::new(HTML_APP.as_bytes()),
                        Some(HTML_APP.len()),
                        None,
                    );
                    let _ = request.respond(response);
                }

                // Workspace File List
                (&Method::Get, "/api/workspace") => {
                    let files = scan_workspace(&self.workspace_root);
                    let body = serde_json::to_string(&files).unwrap_or_else(|_| "[]".into());
                    let response = Response::new(
                        200.into(),
                        headers,
                        Cursor::new(body.into_bytes()),
                        None,
                        None,
                    );
                    let _ = request.respond(response);
                }

                // Read Document
                (&Method::Get, "/api/read") => {
                    let doc_path = extract_query_param(query_part, "path");
                    if doc_path.is_empty() {
                        let res: ApiResponse<()> = ApiResponse::err("Missing path parameter".to_string());
                        let body = serde_json::to_string(&res).unwrap_or_default();
                        let response = Response::new(
                            400.into(),
                            headers,
                            Cursor::new(body.into_bytes()),
                            None,
                            None,
                        );
                        let _ = request.respond(response);
                        continue;
                    }

                    let target_path = if !PathBuf::from(&doc_path).is_absolute() {
                        self.workspace_root.join(&doc_path)
                    } else {
                        PathBuf::from(doc_path)
                    };

                    match read_document(&target_path) {
                        Ok(data) => {
                            let body = serde_json::to_string(&data).unwrap_or_default();
                            let response = Response::new(
                                200.into(),
                                headers,
                                Cursor::new(body.into_bytes()),
                                None,
                                None,
                            );
                            let _ = request.respond(response);
                        }
                        Err(e) => {
                            let res: ApiResponse<()> = ApiResponse::err(format!("Read error: {}", e));
                            let body = serde_json::to_string(&res).unwrap_or_default();
                            let response = Response::new(
                                404.into(),
                                headers,
                                Cursor::new(body.into_bytes()),
                                None,
                                None,
                            );
                            let _ = request.respond(response);
                        }
                    }
                }

                // Save Document
                (&Method::Post, "/api/save") => {
                    let mut content_str = String::new();
                    let _ = request.as_reader().read_to_string(&mut content_str);

                    let res = match serde_json::from_str::<SaveRequest>(&content_str) {
                        Ok(req) => {
                            let target_path = if req.path.is_empty() || req.path == "未命名文档.md" {
                                self.workspace_root.join("未命名文档.md")
                            } else if !PathBuf::from(&req.path).is_absolute() {
                                self.workspace_root.join(&req.path)
                            } else {
                                PathBuf::from(&req.path)
                            };
                            match save_document(target_path.to_string_lossy().as_ref(), &req.html_content) {
                                Ok(_) => ApiResponse::ok("Document saved"),
                                Err(e) => ApiResponse::err(format!("Save error: {}", e)),
                            }
                        }
                        Err(e) => ApiResponse::err(format!("Parse error: {}", e)),
                    };

                    let body = serde_json::to_string(&res).unwrap_or_default();
                    let response = Response::new(
                        200.into(),
                        headers,
                        Cursor::new(body.into_bytes()),
                        None,
                        None,
                    );
                    let _ = request.respond(response);
                }

                // Fallback
                _ => {
                    let response = Response::from_string("Not Found").with_status_code(404);
                    let _ = request.respond(response);
                }
            }
        }
    }
}

fn extract_query_param(query_str: &str, key: &str) -> String {
    for pair in query_str.split('&') {
        if let Some((k, v)) = pair.split_once('=') {
            if k == key {
                return urlencoding_decode(v);
            }
        }
    }
    String::new()
}

fn urlencoding_decode(input: &str) -> String {
    let mut result = Vec::new();
    let mut chars = input.bytes();
    while let Some(b) = chars.next() {
        if b == b'%' {
            if let (Some(h1), Some(h2)) = (chars.next(), chars.next()) {
                if let Ok(byte) = u8::from_str_radix(
                    &format!("{}{}", h1 as char, h2 as char),
                    16,
                ) {
                    result.push(byte);
                    continue;
                }
            }
        } else if b == b'+' {
            result.push(b' ');
            continue;
        }
        result.push(b);
    }
    String::from_utf8_lossy(&result).to_string()
}
