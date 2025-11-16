use crate::models::Document;
use crate::services::document_service;
use std::path::PathBuf;

/// Creates a new document in the project
#[tauri::command]
pub async fn create_document(
    project_path: String,
    title: String,
    category: String,
    subcategory: Option<String>,
) -> Result<Document, String> {
    let path = PathBuf::from(project_path);
    let subcat = subcategory.as_deref();

    document_service::create_document(&path, &title, &category, subcat)
        .map_err(|e| format!("Failed to create document: {}", e))
}

/// Reads a document's content
#[tauri::command]
pub async fn read_document(document_path: String) -> Result<Document, String> {
    let path = PathBuf::from(document_path);

    document_service::read_document(&path)
        .map_err(|e| format!("Failed to read document: {}", e))
}

/// Updates a document's content
#[tauri::command]
pub async fn update_document(document_path: String, content: String) -> Result<(), String> {
    let path = PathBuf::from(document_path);

    document_service::update_document(&path, &content)
        .map_err(|e| format!("Failed to update document: {}", e))
}

/// Deletes a document
#[tauri::command]
pub async fn delete_document(document_path: String) -> Result<(), String> {
    let path = PathBuf::from(document_path);

    document_service::delete_document(&path)
        .map_err(|e| format!("Failed to delete document: {}", e))
}

/// Lists all documents in a specific directory
#[tauri::command]
pub async fn list_documents_in_dir(dir_path: String) -> Result<Vec<Document>, String> {
    let path = PathBuf::from(dir_path);

    document_service::list_documents_in_dir(&path)
        .map_err(|e| format!("Failed to list documents: {}", e))
}

/// Lists all documents in the project
#[tauri::command]
pub async fn list_all_documents(project_path: String) -> Result<Vec<Document>, String> {
    let path = PathBuf::from(project_path);

    document_service::list_all_documents(&path)
        .map_err(|e| format!("Failed to list all documents: {}", e))
}
