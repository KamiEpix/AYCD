// Tauri IPC Commands
// All frontend-callable functions are defined here

pub mod projects;
pub mod documents;

/// Example greeting command
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to AYCD.", name)
}

// Future command modules will be added here:
// pub mod search;
// pub mod ai;
