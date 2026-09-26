#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod fs_ops;
mod models;
mod server;

use std::env;
use std::io::Write;
use std::net::TcpStream;
use std::path::PathBuf;
use std::process::Command;
use std::thread;
use std::time::Duration;

use server::AppServer;

fn main() {
    let args: Vec<String> = env::args().collect();
    let initial_path = args.get(1).map(PathBuf::from);

    let current_dir = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let workspace_root = match &initial_path {
        Some(p) if p.is_dir() => p.clone(),
        Some(p) if p.is_file() => p.parent().unwrap_or(&current_dir).to_path_buf(),
        _ => {
            if current_dir.to_string_lossy().to_lowercase().contains("system32") {
                env::current_exe()
                    .ok()
                    .and_then(|p| p.parent().map(|d| d.to_path_buf()))
                    .unwrap_or(current_dir)
            } else {
                current_dir
            }
        }
    };

    let host = "127.0.0.1";
    let default_port = 13579;

    // Check if an existing MarkView instance is already active
    if let Ok(mut stream) = TcpStream::connect(format!("{}:{}", host, default_port)) {
        let _ = stream.write_all(b"HEAD / HTTP/1.0\r\nHost: 127.0.0.1\r\n\r\n");
        // An instance is already serving, open it in browser and exit
        let _ = open::that(format!("http://{}:{}", host, default_port));
        return;
    }

    // Try binding default port or fall back to subsequent ports
    let mut selected_port = default_port;
    let mut server_instance = None;

    for port in default_port..(default_port + 10) {
        match AppServer::new(host, port, workspace_root.clone()) {
            Ok(s) => {
                selected_port = port;
                server_instance = Some(s);
                break;
            }
            Err(_) => continue,
        }
    }

    let server = match server_instance {
        Some(s) => s,
        None => return,
    };

    let app_url = format!("http://{}:{}", host, selected_port);

    // Spawn desktop window in separate thread once server is genuinely ready
    let host_port = format!("{}:{}", host, selected_port);
    let url_clone = app_url.clone();
    thread::spawn(move || {
        let start = std::time::Instant::now();
        while start.elapsed() < Duration::from_secs(5) {
            if TcpStream::connect(&host_port).is_ok() {
                break;
            }
            thread::sleep(Duration::from_millis(50));
        }
        thread::sleep(Duration::from_millis(150));
        launch_desktop_window(&url_clone);
    });

    server.run();
}

fn launch_desktop_window(url: &str) {
    let profile_dir = env::var("LOCALAPPDATA")
        .map(|p| format!("{}\\MarkView\\profile", p))
        .unwrap_or_else(|_| "C:\\temp\\markview_profile".to_string());

    let browser_paths = [
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "msedge.exe",
        "chrome.exe",
    ];

    for browser in browser_paths {
        let child = Command::new(browser)
            .args([
                &format!("--app={}", url),
                &format!("--user-data-dir={}", profile_dir),
                "--window-size=1280,840",
                "--no-first-run",
                "--no-default-browser-check",
                "--disable-session-crashed-bubble",
            ])
            .spawn();

        if let Ok(mut c) = child {
            // When the desktop window is closed by the user, terminate backend cleanly
            thread::spawn(move || {
                let _ = c.wait();
                std::process::exit(0);
            });
            return;
        }
    }

    // Fallback to default browser
    let _ = open::that(url);
}
