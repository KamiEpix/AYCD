/**
 * Project-related types
 */

export interface Project {
  id: string;
  name: string;
  path: string;
  createdAt: number;
  modifiedAt: number;
  settings?: ProjectSettings;
}

export interface ProjectSettings {
  theme?: 'light' | 'dark' | 'auto';
  defaultView?: 'editor' | 'canvas' | 'timeline';
  aiEnabled?: boolean;
  aiProvider?: string;
}

export interface CreateProjectInput {
  name: string;
  path: string;
  template?: 'blank' | 'novel' | 'screenplay' | 'worldbuilding';
}
