// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;
mod services;

use commands::*;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::projects::create_project,
            commands::projects::open_project,
            commands::projects::list_projects,
            commands::projects::get_projects_root,
            commands::projects::update_project,
            commands::documents::create_document,
            commands::documents::read_document,
            commands::documents::update_document,
            commands::documents::delete_document,
            commands::documents::list_documents_in_dir,
            commands::documents::list_all_documents,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
