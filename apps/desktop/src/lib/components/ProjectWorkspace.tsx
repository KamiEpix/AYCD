import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useProject } from '@/lib/contexts/ProjectContext';
import { useDocument } from '@/lib/contexts/DocumentContext';
import { DocumentBrowser } from './DocumentBrowser';
import { PlateEditor } from '@aycd/editor';
import './ProjectWorkspace.css';

export function ProjectWorkspace() {
  const { current: currentProject, closeProject } = useProject();
  const { current: currentDocument, loadDocuments, saveCurrentDocument, closeDocument } = useDocument();

  const [editorContent, setEditorContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [liveWordCount, setLiveWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [lastAutosaveTime, setLastAutosaveTime] = useState(0);

  const lastSavedContentRef = useRef('');
  const autosaveTimerRef = useRef<number>();

  // Load documents when workspace opens
  useEffect(() => {
    if (currentProject) {
      loadDocuments(currentProject.path);
    }

    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcuts);

    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcuts);
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [currentProject, loadDocuments]);

  // Sync editor content with current document
  useEffect(() => {
    if (currentDocument) {
      setEditorContent(currentDocument.content);
      lastSavedContentRef.current = currentDocument.content;
      setHasUnsavedChanges(false);
    }
  }, [currentDocument]);

  // Track content changes and autosave
  useEffect(() => {
    if (currentDocument) {
      const isDirty = editorContent !== lastSavedContentRef.current;
      setHasUnsavedChanges(isDirty);
      setLiveWordCount(countWords(editorContent));
      setCharacterCount(editorContent.length);

      // Debounced autosave
      if (isDirty && !isSaving) {
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
        }
        autosaveTimerRef.current = window.setTimeout(() => {
          handleSave(true);
        }, 2000);
      }
    }
  }, [editorContent, currentDocument, isSaving]);

  const countWords = (text: string): number => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  const handleSave = async (isAutosave = false) => {
    if (!currentDocument) return;

    setIsSaving(true);
    try {
      await saveCurrentDocument(editorContent);
      lastSavedContentRef.current = editorContent;
      setHasUnsavedChanges(false);
      setLastAutosaveTime(Date.now());

      if (!isAutosave) {
        console.log('Document saved successfully');
      }
    } catch (e) {
      console.error('Failed to save:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseProject = () => {
    closeProject();
  };

  const handleCloseDocument = () => {
    if (hasUnsavedChanges) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to close this document?');
      if (!confirmed) return;
    }
    closeDocument();
  };

  const handleEditorChange = useCallback((content: string) => {
    setEditorContent(content);
  }, []);

  return (
    <div className="workspace">
      <header className="workspace-header">
        <div className="project-info">
          <h2>{currentProject?.name}</h2>
          <p className="project-path">{currentProject?.path}</p>
        </div>
        <button className="btn-close" onClick={handleCloseProject}>
          Close Project
        </button>
      </header>

      <div className="workspace-content">
        <DocumentBrowser />

        <div className="editor-panel">
          {currentDocument ? (
            <>
              <div className="editor-header">
                <div className="title-section">
                  <h3>{currentDocument.title}</h3>
                  <span className="doc-type-badge">
                    {currentDocument.documentType === 'world' ? '🗺️ World' : '📖 Narrative'}
                  </span>
                </div>
                <div className="editor-actions">
                  <div className="stats">
                    <span className="stat-item">{liveWordCount} words</span>
                    <span className="stat-separator">·</span>
                    <span className="stat-item">{characterCount} characters</span>
                    {hasUnsavedChanges ? (
                      <span className="unsaved-indicator" title="Unsaved changes">
                        ●
                      </span>
                    ) : lastAutosaveTime > 0 ? (
                      <span className="saved-indicator" title="All changes saved">
                        ✓
                      </span>
                    ) : null}
                  </div>
                  <button
                    className="btn-save"
                    onClick={() => handleSave()}
                    disabled={isSaving || !hasUnsavedChanges}
                  >
                    {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save' : 'Saved'}
                  </button>
                  <button className="btn-close-doc" onClick={handleCloseDocument}>
                    Close
                  </button>
                </div>
              </div>
              <div className="editor-container">
                <PlateEditor content={editorContent} onChange={handleEditorChange} />
              </div>
            </>
          ) : (
            <div className="no-document">
              <p>Select or create a document to start writing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
