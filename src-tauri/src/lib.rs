use sha2::{Sha256, Digest};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![sha256])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn sha256(content: String) -> String {
  format!("{:x}", Sha256::digest(content))
}