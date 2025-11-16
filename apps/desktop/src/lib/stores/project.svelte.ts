/**
 * Project state management
 * Tracks current project and available projects
 */

import type { Project } from '@aycd/core';
import * as projectApi from '$api/projects';

// Current active project
let currentProject = $state<Project | null>(null);

// List of all available projects
let projects = $state<Project[]>([]);

// Loading states
let isLoading = $state(false);
let error = $state<string | null>(null);

/**
 * Loads all available projects
 */
async function loadProjects() {
  isLoading = true;
  error = null;

  try {
    const result = await projectApi.listProjects();
    projects = result;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error('Failed to load projects:', e);
  } finally {
    isLoading = false;
  }
}

/**
 * Creates a new project
 */
async function createProject(name: string, customPath?: string) {
  isLoading = true;
  error = null;

  try {
    const project = await projectApi.createProject({
      name,
      path: customPath || ''
    });
    projects = [project, ...projects];
    currentProject = project;
    return project;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error('Failed to create project:', e);
    throw e;
  } finally {
    isLoading = false;
  }
}

/**
 * Opens an existing project
 */
async function openProject(projectPath: string) {
  isLoading = true;
  error = null;

  try {
    const project = await projectApi.openProject(projectPath);
    currentProject = project;
    return project;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error('Failed to open project:', e);
    throw e;
  } finally {
    isLoading = false;
  }
}

/**
 * Closes the current project
 */
function closeProject() {
  currentProject = null;
}

/**
 * Updates the current project metadata
 */
async function updateCurrentProject(updates: Partial<Project>) {
  if (!currentProject) {
    throw new Error('No project is currently open');
  }

  const updatedProject = { ...currentProject, ...updates };

  try {
    await projectApi.updateProject(updatedProject);
    currentProject = updatedProject;

    // Update in projects list
    const index = projects.findIndex((p) => p.id === updatedProject.id);
    if (index !== -1) {
      projects[index] = updatedProject;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error('Failed to update project:', e);
    throw e;
  }
}

// Export the store interface
export const projectStore = {
  // State (read-only getters)
  get current() {
    return currentProject;
  },
  get projects() {
    return projects;
  },
  get isLoading() {
    return isLoading;
  },
  get error() {
    return error;
  },

  // Actions
  loadProjects,
  createProject,
  openProject,
  closeProject,
  updateCurrentProject,
};
