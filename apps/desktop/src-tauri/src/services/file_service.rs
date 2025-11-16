use anyhow::{Context, Result};
use std::fs;
use std::path::{Path, PathBuf};

/// Validates that a path is safe and within allowed boundaries
pub fn validate_path(path: &Path, base_path: &Path) -> Result<PathBuf> {
    let canonical = fs::canonicalize(path)
        .with_context(|| format!("Failed to canonicalize path: {:?}", path))?;

    let canonical_base = fs::canonicalize(base_path)
        .with_context(|| format!("Failed to canonicalize base path: {:?}", base_path))?;

    if !canonical.starts_with(&canonical_base) {
        anyhow::bail!("Path traversal attempt detected: {:?}", path);
    }

    Ok(canonical)
}

/// Ensures a directory exists, creating it if necessary
pub fn ensure_dir(path: &Path) -> Result<()> {
    if !path.exists() {
        fs::create_dir_all(path)
            .with_context(|| format!("Failed to create directory: {:?}", path))?;
    }
    Ok(())
}

/// Reads a file to string with error handling
pub fn read_file(path: &Path) -> Result<String> {
    fs::read_to_string(path)
        .with_context(|| format!("Failed to read file: {:?}", path))
}

/// Writes a file atomically (write to temp, then rename)
pub fn write_file(path: &Path, content: &str) -> Result<()> {
    let temp_path = path.with_extension("tmp");

    fs::write(&temp_path, content)
        .with_context(|| format!("Failed to write temp file: {:?}", temp_path))?;

    fs::rename(&temp_path, path)
        .with_context(|| format!("Failed to rename temp file to: {:?}", path))?;

    Ok(())
}

/// Deletes a file safely
pub fn delete_file(path: &Path) -> Result<()> {
    if path.exists() {
        fs::remove_file(path)
            .with_context(|| format!("Failed to delete file: {:?}", path))?;
    }
    Ok(())
}

/// Lists all files in a directory (non-recursive)
pub fn list_files(dir: &Path) -> Result<Vec<PathBuf>> {
    let mut files = Vec::new();

    for entry in fs::read_dir(dir)
        .with_context(|| format!("Failed to read directory: {:?}", dir))?
    {
        let entry = entry?;
        let path = entry.path();

        if path.is_file() {
            files.push(path);
        }
    }

    Ok(files)
}

/// Lists all subdirectories in a directory (non-recursive)
pub fn list_dirs(dir: &Path) -> Result<Vec<PathBuf>> {
    let mut dirs = Vec::new();

    for entry in fs::read_dir(dir)
        .with_context(|| format!("Failed to read directory: {:?}", dir))?
    {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            dirs.push(path);
        }
    }

    Ok(dirs)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_ensure_dir() {
        let temp_dir = env::temp_dir().join("aycd_test_ensure_dir");
        let _ = fs::remove_dir_all(&temp_dir); // Clean up if exists

        assert!(!temp_dir.exists());
        ensure_dir(&temp_dir).unwrap();
        assert!(temp_dir.exists());

        fs::remove_dir_all(&temp_dir).unwrap();
    }

    #[test]
    fn test_write_and_read_file() {
        let temp_file = env::temp_dir().join("aycd_test_file.txt");
        let content = "Hello, AYCD!";

        write_file(&temp_file, content).unwrap();
        let read_content = read_file(&temp_file).unwrap();

        assert_eq!(content, read_content);

        delete_file(&temp_file).unwrap();
        assert!(!temp_file.exists());
    }
}
