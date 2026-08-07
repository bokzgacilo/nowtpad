use serde::Serialize;
use std::{fs, path::PathBuf, sync::Mutex};
#[cfg(any(target_os = "macos", target_os = "ios", target_os = "android"))]
use tauri::{Emitter, Manager};

struct PendingOpenPaths(Mutex<Vec<String>>);

#[derive(Serialize)]
struct NativeOpenedFile {
    path: String,
    name: String,
    content: String,
}

#[derive(Serialize)]
struct NativeOpenResult {
    files: Vec<NativeOpenedFile>,
    unsupported: Vec<String>,
}

#[tauri::command]
fn take_initial_open_paths(state: tauri::State<'_, PendingOpenPaths>) -> Vec<String> {
    let mut paths = state.0.lock().expect("pending open paths lock poisoned");
    std::mem::take(&mut *paths)
}

#[tauri::command]
fn read_native_paths(paths: Vec<String>) -> NativeOpenResult {
    let mut files = Vec::new();
    let mut unsupported = Vec::new();

    for path in paths {
        let path_buf = PathBuf::from(&path);
        let name = path_buf
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or(&path)
            .to_string();

        match fs::read_to_string(&path_buf) {
            Ok(content) => files.push(NativeOpenedFile {
                path,
                name,
                content,
            }),
            Err(_) => unsupported.push(name),
        }
    }

    NativeOpenResult { files, unsupported }
}

fn startup_open_paths() -> Vec<String> {
    std::env::args()
        .skip(1)
        .filter_map(|arg| {
            let path = PathBuf::from(arg);
            path.is_file().then(|| path.to_string_lossy().into_owned())
        })
        .collect()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(PendingOpenPaths(Mutex::new(startup_open_paths())))
        .invoke_handler(tauri::generate_handler![
            take_initial_open_paths,
            read_native_paths
        ])
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .build(tauri::generate_context!())
        .expect("error while building nowtpad")
        .run(|_app, _event| {
            #[cfg(any(target_os = "macos", target_os = "ios", target_os = "android"))]
            if let tauri::RunEvent::Opened { urls } = _event {
                let paths: Vec<String> = urls
                    .into_iter()
                    .filter_map(|url| url.to_file_path().ok())
                    .filter(|path| path.is_file())
                    .map(|path| path.to_string_lossy().into_owned())
                    .collect();

                if !paths.is_empty() {
                    if let Some(state) = _app.try_state::<PendingOpenPaths>() {
                        if let Ok(mut pending) = state.0.lock() {
                            pending.extend(paths.clone());
                        }
                    }
                    let _ = _app.emit("open-files", paths);
                }
            }
        });
}
