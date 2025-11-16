use crate::models::Project;
use crate::services::project_service;
use std::path::PathBuf;

/// Creates a new AYCD project
#[tauri::command]
pub async fn create_project(name: String, custom_path: Option<String>) -> Result<Project, String> {
    let path = custom_path.map(PathBuf::from);

    project_service::create_project(&name, path)
        .map_err(|e| format!("Failed to create project: {}", e))
}

/// Opens an existing project
#[tauri::command]
pub async fn open_project(project_path: String) -> Result<Project, String> {
    let path = PathBuf::from(project_path);

    project_service::open_project(&path)
        .map_err(|e| format!("Failed to open project: {}", e))
}

/// Lists all projects in the default directory
#[tauri::command]
pub async fn list_projects() -> Result<Vec<Project>, String> {
    project_service::list_projects()
        .map_err(|e| format!("Failed to list projects: {}", e))
}

/// Gets the default projects root directory path
#[tauri::command]
pub async fn get_projects_root() -> Result<String, String> {
    project_service::get_projects_root()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| format!("Failed to get projects root: {}", e))
}

/// Updates project metadata
#[tauri::command]
pub async fn update_project(project: Project) -> Result<(), String> {
    project_service::update_project(&project)
        .map_err(|e| format!("Failed to update project: {}", e))
}
