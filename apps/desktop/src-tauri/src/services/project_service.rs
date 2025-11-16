use anyhow::{Context, Result};
use serde_json;
use std::path::{Path, PathBuf};
use chrono::Utc;

use crate::models::Project;
use super::file_service::{ensure_dir, write_file, read_file};

/// Default AYCD projects root directory
pub fn get_projects_root() -> Result<PathBuf> {
    let home = dirs::home_dir()
        .ok_or_else(|| anyhow::anyhow!("Could not determine home directory"))?;

    Ok(home.join("AYCD").join("projects"))
}

/// Initialize the standard AYCD project folder structure
fn init_project_structure(project_path: &Path) -> Result<()> {
    // Create main project directory
    ensure_dir(project_path)?;

    // Create WORLD subdirectories
    let world = project_path.join("WORLD");
    ensure_dir(&world.join("Cast"))?;         // Characters & NPCs
    ensure_dir(&world.join("Places"))?;       // Locations & Geography
    ensure_dir(&world.join("Objects"))?;      // Items, Artifacts, Technology
    ensure_dir(&world.join("Systems"))?;      // Magic, Politics, Economics
    ensure_dir(&world.join("Lore"))?;         // History, Mythology, Culture

    // Create NARRATIVE subdirectories
    let narrative = project_path.join("NARRATIVE");
    ensure_dir(&narrative.join("Drafts"))?;   // Active writing
    ensure_dir(&narrative.join("Final"))?;    // Completed works
    ensure_dir(&narrative.join("Research"))?; // Notes & references
    ensure_dir(&narrative.join("Planning"))?; // Outlines & structure

    // Create cache and search directories
    ensure_dir(&project_path.join("cache"))?;
    ensure_dir(&project_path.join("search"))?;

    Ok(())
}

/// Creates a new AYCD project with the standard structure
pub fn create_project(name: &str, custom_path: Option<PathBuf>) -> Result<Project> {
    let project_path = if let Some(path) = custom_path {
        path.join(name)
    } else {
        get_projects_root()?.join(name)
    };

    // Check if project already exists
    if project_path.exists() {
        anyhow::bail!("Project already exists at: {:?}", project_path);
    }

    // Initialize folder structure
    init_project_structure(&project_path)?;

    // Create project metadata
    let now = Utc::now().timestamp();
    let project = Project {
        id: uuid::Uuid::new_v4().to_string(),
        name: name.to_string(),
        path: project_path.to_string_lossy().to_string(),
        created_at: now,
        modified_at: now,
    };

    // Write project.json
    let project_json_path = project_path.join("project.json");
    let project_json = serde_json::to_string_pretty(&project)
        .context("Failed to serialize project metadata")?;
    write_file(&project_json_path, &project_json)?;

    Ok(project)
}

/// Opens an existing project by reading its metadata
pub fn open_project(project_path: &Path) -> Result<Project> {
    let project_json_path = project_path.join("project.json");

    if !project_json_path.exists() {
        anyhow::bail!("Not a valid AYCD project: project.json not found");
    }

    let content = read_file(&project_json_path)?;
    let project: Project = serde_json::from_str(&content)
        .context("Failed to parse project.json")?;

    Ok(project)
}

/// Lists all projects in the default projects directory
pub fn list_projects() -> Result<Vec<Project>> {
    let projects_root = get_projects_root()?;

    if !projects_root.exists() {
        return Ok(Vec::new());
    }

    let mut projects = Vec::new();

    for entry in std::fs::read_dir(&projects_root)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            match open_project(&path) {
                Ok(project) => projects.push(project),
                Err(_) => continue, // Skip invalid projects
            }
        }
    }

    // Sort by most recently modified
    projects.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));

    Ok(projects)
}

/// Updates project metadata
pub fn update_project(project: &Project) -> Result<()> {
    let project_path = PathBuf::from(&project.path);
    let project_json_path = project_path.join("project.json");

    let project_json = serde_json::to_string_pretty(project)
        .context("Failed to serialize project metadata")?;
    write_file(&project_json_path, &project_json)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    use std::fs;

    #[test]
    fn test_create_and_open_project() {
        let temp_dir = env::temp_dir().join("aycd_test_projects");
        let _ = fs::remove_dir_all(&temp_dir);

        // Create project
        let project = create_project("test-novel", Some(temp_dir.clone())).unwrap();
        assert_eq!(project.name, "test-novel");

        // Verify structure
        let project_path = PathBuf::from(&project.path);
        assert!(project_path.join("WORLD/Cast").exists());
        assert!(project_path.join("NARRATIVE/Drafts").exists());
        assert!(project_path.join("project.json").exists());

        // Open project
        let opened = open_project(&project_path).unwrap();
        assert_eq!(opened.id, project.id);
        assert_eq!(opened.name, project.name);

        fs::remove_dir_all(&temp_dir).unwrap();
    }
}
