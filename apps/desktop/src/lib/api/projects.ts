/**
 * Project management API
 * Communicates with Rust backend via Tauri IPC
 */

import { invoke } from '@tauri-apps/api/core';
import type { Project, CreateProjectInput } from '@aycd/core';

/**
 * Creates a new AYCD project
 */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  return await invoke<Project>('create_project', {
    name: input.name,
    customPath: input.path,
  });
}

/**
 * Opens an existing project by path
 */
export async function openProject(projectPath: string): Promise<Project> {
  return await invoke<Project>('open_project', { projectPath });
}

/**
 * Lists all projects in the default directory
 */
export async function listProjects(): Promise<Project[]> {
  return await invoke<Project[]>('list_projects');
}

/**
 * Gets the default projects root directory path
 */
export async function getProjectsRoot(): Promise<string> {
  return await invoke<string>('get_projects_root');
}

/**
 * Updates project metadata
 */
export async function updateProject(project: Project): Promise<void> {
  await invoke('update_project', { project });
}
