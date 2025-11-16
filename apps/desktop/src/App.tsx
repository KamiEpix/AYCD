import React from 'react';
import { ProjectSelector } from '@/lib/components/ProjectSelector';
import { ProjectWorkspace } from '@/lib/components/ProjectWorkspace';
import { useProject } from '@/lib/contexts/ProjectContext';

export function App() {
  const { current } = useProject();

  return current ? <ProjectWorkspace /> : <ProjectSelector />;
}
