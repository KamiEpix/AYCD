use anyhow::{Context, Result};
use chrono::Utc;
use serde_json;
use std::fs;
use std::path::{Path, PathBuf};

use crate::models::Document;
use super::file_service::{ensure_dir, write_file, read_file};

/// Creates a new document in the specified category
pub fn create_document(
    project_path: &Path,
    title: &str,
    category: &str,
    subcategory: Option<&str>,
) -> Result<Document> {
    // Build the document path
    let mut doc_path = project_path.to_path_buf();
    doc_path.push(category);

    if let Some(subcat) = subcategory {
        doc_path.push(subcat);
    }

    // Ensure directory exists
    ensure_dir(&doc_path)?;

    // Create filename from title (sanitized)
    let filename = sanitize_filename(title);
    doc_path.push(format!("{}.md", filename));

    // Check if file already exists
    if doc_path.exists() {
        anyhow::bail!("Document already exists: {}", doc_path.display());
    }

    // Create document metadata
    let now = Utc::now().timestamp();
    let document = Document {
        id: uuid::Uuid::new_v4().to_string(),
        project_id: String::new(), // Will be set by caller
        path: doc_path.to_string_lossy().to_string(),
        title: title.to_string(),
        content: String::new(),
        word_count: 0,
        created_at: now,
        modified_at: now,
        metadata: None,
    };

    // Write empty markdown file with frontmatter
    let content = format!(
        "---\nid: {}\ntitle: {}\ncreated: {}\n---\n\n# {}\n\n",
        document.id, title, now, title
    );
    write_file(&doc_path, &content)?;

    Ok(document)
}

/// Reads a document from the file system
pub fn read_document(document_path: &Path) -> Result<Document> {
    if !document_path.exists() {
        anyhow::bail!("Document not found: {}", document_path.display());
    }

    let content = read_file(document_path)?;
    let metadata = fs::metadata(document_path)?;

    // Parse frontmatter if present
    let (frontmatter, body) = parse_frontmatter(&content);

    // Extract metadata from frontmatter or use defaults
    let id = frontmatter
        .get("id")
        .and_then(|v| v.as_str())
        .unwrap_or_else(|| "")
        .to_string();

    let title = frontmatter
        .get("title")
        .and_then(|v| v.as_str())
        .or_else(|| {
            // Extract title from first heading
            body.lines()
                .find(|line| line.starts_with("# "))
                .map(|line| line.trim_start_matches("# ").trim())
        })
        .unwrap_or_else(|| {
            // Use filename as fallback
            document_path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Untitled")
        })
        .to_string();

    let created_at = frontmatter
        .get("created")
        .and_then(|v| v.as_i64())
        .unwrap_or_else(|| {
            metadata
                .created()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs() as i64)
                .unwrap_or(0)
        });

    let modified_at = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    let word_count = count_words(&body);

    Ok(Document {
        id,
        project_id: String::new(),
        path: document_path.to_string_lossy().to_string(),
        title,
        content,
        word_count,
        created_at,
        modified_at,
        metadata: None,
    })
}

/// Updates a document's content
pub fn update_document(document_path: &Path, content: &str) -> Result<()> {
    if !document_path.exists() {
        anyhow::bail!("Document not found: {}", document_path.display());
    }

    write_file(document_path, content)?;
    Ok(())
}

/// Deletes a document
pub fn delete_document(document_path: &Path) -> Result<()> {
    if !document_path.exists() {
        anyhow::bail!("Document not found: {}", document_path.display());
    }

    fs::remove_file(document_path)
        .with_context(|| format!("Failed to delete document: {}", document_path.display()))?;

    Ok(())
}

/// Lists all documents in a directory
pub fn list_documents_in_dir(dir_path: &Path) -> Result<Vec<Document>> {
    if !dir_path.exists() {
        return Ok(Vec::new());
    }

    let mut documents = Vec::new();

    for entry in fs::read_dir(dir_path)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
            match read_document(&path) {
                Ok(doc) => documents.push(doc),
                Err(e) => eprintln!("Failed to read document {}: {}", path.display(), e),
            }
        }
    }

    // Sort by modified date (most recent first)
    documents.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));

    Ok(documents)
}

/// Lists all documents in a project recursively
pub fn list_all_documents(project_path: &Path) -> Result<Vec<Document>> {
    let mut all_documents = Vec::new();

    // Search in WORLD and NARRATIVE directories
    for main_category in &["WORLD", "NARRATIVE"] {
        let category_path = project_path.join(main_category);
        if category_path.exists() {
            collect_documents_recursive(&category_path, &mut all_documents)?;
        }
    }

    // Sort by modified date
    all_documents.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));

    Ok(all_documents)
}

/// Recursively collects documents from a directory
fn collect_documents_recursive(dir: &Path, documents: &mut Vec<Document>) -> Result<()> {
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            collect_documents_recursive(&path, documents)?;
        } else if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
            match read_document(&path) {
                Ok(doc) => documents.push(doc),
                Err(e) => eprintln!("Failed to read document {}: {}", path.display(), e),
            }
        }
    }

    Ok(())
}

/// Sanitizes a filename by removing invalid characters
fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '-',
            _ => c,
        })
        .collect::<String>()
        .trim()
        .to_string()
}

/// Parses YAML frontmatter from markdown content
fn parse_frontmatter(content: &str) -> (serde_json::Value, String) {
    if !content.starts_with("---\n") {
        return (serde_json::json!({}), content.to_string());
    }

    // Find the end of frontmatter
    if let Some(end_pos) = content[4..].find("\n---\n") {
        let frontmatter_str = &content[4..end_pos + 4];
        let body = &content[end_pos + 9..];

        // Parse YAML frontmatter as JSON (simple key-value pairs)
        let mut map = serde_json::Map::new();
        for line in frontmatter_str.lines() {
            if let Some((key, value)) = line.split_once(':') {
                let key = key.trim().to_string();
                let value = value.trim();

                // Try to parse as number first, then string
                if let Ok(num) = value.parse::<i64>() {
                    map.insert(key, serde_json::json!(num));
                } else {
                    map.insert(key, serde_json::json!(value));
                }
            }
        }

        return (serde_json::Value::Object(map), body.to_string());
    }

    (serde_json::json!({}), content.to_string())
}

/// Counts words in text
fn count_words(text: &str) -> usize {
    text.split_whitespace().count()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_sanitize_filename() {
        assert_eq!(sanitize_filename("My Novel: Chapter 1"), "My Novel- Chapter 1");
        assert_eq!(sanitize_filename("Test/File"), "Test-File");
    }

    #[test]
    fn test_count_words() {
        assert_eq!(count_words("Hello world"), 2);
        assert_eq!(count_words("  Multiple   spaces  "), 2);
        assert_eq!(count_words(""), 0);
    }

    #[test]
    fn test_create_and_read_document() {
        let temp_dir = env::temp_dir().join("aycd_doc_test");
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(&temp_dir).unwrap();

        let doc = create_document(&temp_dir, "Test Chapter", "NARRATIVE", Some("Drafts")).unwrap();
        assert_eq!(doc.title, "Test Chapter");
        assert!(doc.path.contains("Test-Chapter.md"));

        let read_doc = read_document(&PathBuf::from(&doc.path)).unwrap();
        assert_eq!(read_doc.title, "Test Chapter");

        fs::remove_dir_all(&temp_dir).unwrap();
    }
}
