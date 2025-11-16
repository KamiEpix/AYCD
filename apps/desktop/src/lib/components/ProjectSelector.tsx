import React, { useEffect, useState } from 'react';
import { useProject } from '@/lib/contexts/ProjectContext';
import './ProjectSelector.css';

export function ProjectSelector() {
  const { projects, isLoading, error, loadProjects, createProject, openProject } = useProject();
  const [newProjectName, setNewProjectName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await createProject(newProjectName.trim());
      setNewProjectName('');
      setShowCreateForm(false);
    } catch (e) {
      console.error('Failed to create project:', e);
    }
  };

  const handleOpenProject = async (projectPath: string) => {
    try {
      await openProject(projectPath);
    } catch (e) {
      console.error('Failed to open project:', e);
    }
  };

  return (
    <div className="project-selector">
      <header>
        <h1>AYCD Projects</h1>
        <p className="subtitle">Local-first writing and worldbuilding</p>
      </header>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="actions">
        {!showCreateForm && (
          <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
            + New Project
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="create-form">
          <h3>Create New Project</h3>
          <form onSubmit={handleCreateProject}>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name (e.g., my-novel)"
              autoFocus
            />
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={!newProjectName.trim()}>
                Create
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewProjectName('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="projects-list">
        {isLoading ? (
          <div className="loading">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <p>No projects yet. Create your first project to get started!</p>
          </div>
        ) : (
          <>
            <h3>Recent Projects</h3>
            <div className="project-grid">
              {projects.map((project) => (
                <button
                  key={project.id}
                  className="project-card"
                  onClick={() => handleOpenProject(project.path)}
                >
                  <div className="project-icon">📁</div>
                  <div className="project-info">
                    <h4>{project.name}</h4>
                    <p className="project-path">{project.path}</p>
                    <p className="project-date">
                      Modified {new Date(project.modifiedAt * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
