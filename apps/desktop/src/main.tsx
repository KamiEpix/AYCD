import './styles/app.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ProjectProvider } from '@/lib/contexts/ProjectContext';
import { DocumentProvider } from '@/lib/contexts/DocumentContext';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <ProjectProvider>
      <DocumentProvider>
        <App />
      </DocumentProvider>
    </ProjectProvider>
  </React.StrictMode>
);
