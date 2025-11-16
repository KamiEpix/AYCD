import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Project } from '@aycd/core';
import * as projectApi from '@/lib/api/projects';

interface ProjectContextValue {
  // State
  current: Project | null;
  projects: Project[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProjects: () => Promise<void>;
  createProject: (name: string, customPath?: string) => Promise<Project>;
  openProject: (projectPath: string) => Promise<Project>;
  closeProject: () => void;
  updateCurrentProject: (updates: Partial<Project>) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await projectApi.listProjects();
      setProjects(result);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);
      console.error('Failed to load projects:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(async (name: string, customPath?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const project = await projectApi.createProject({
        name,
        path: customPath || ''
      });
      setProjects(prev => [project, ...prev]);
      setCurrentProject(project);
      return project;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);
      console.error('Failed to create project:', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openProject = useCallback(async (projectPath: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const project = await projectApi.openProject(projectPath);
      setCurrentProject(project);
      return project;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);
      console.error('Failed to open project:', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeProject = useCallback(() => {
    setCurrentProject(null);
  }, []);

  const updateCurrentProject = useCallback(async (updates: Partial<Project>) => {
    if (!currentProject) {
      throw new Error('No project is currently open');
    }

    const updatedProject = { ...currentProject, ...updates };

    try {
      await projectApi.updateProject(updatedProject);
      setCurrentProject(updatedProject);

      // Update in projects list
      setProjects(prev => {
        const index = prev.findIndex(p => p.id === updatedProject.id);
        if (index !== -1) {
          const newProjects = [...prev];
          newProjects[index] = updatedProject;
          return newProjects;
        }
        return prev;
      });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);
      console.error('Failed to update project:', e);
      throw e;
    }
  }, [currentProject]);

  const value: ProjectContextValue = {
    current: currentProject,
    projects,
    isLoading,
    error,
    loadProjects,
    createProject,
    openProject,
    closeProject,
    updateCurrentProject,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
