// Data models and structures
// Rust representations of core domain entities

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    #[serde(alias = "created_at")]
    pub created_at: i64,
    #[serde(alias = "modified_at")]
    pub modified_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DocumentType {
    World,
    Narrative,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Document {
    pub id: String,
    #[serde(alias = "project_id")]
    pub project_id: String,
    pub path: String,
    pub title: String,
    pub content: String,
    #[serde(alias = "document_type")]
    pub document_type: DocumentType, // WORLD vs NARRATIVE mode
    #[serde(alias = "word_count")]
    pub word_count: usize,
    #[serde(alias = "created_at")]
    pub created_at: i64,
    #[serde(alias = "modified_at")]
    pub modified_at: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

// Future models will be added here:
// pub mod canvas;
// pub mod timeline;
// pub mod ai;
