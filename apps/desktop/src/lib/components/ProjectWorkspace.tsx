import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Node } from 'slate';
import { useProject } from '@/lib/contexts/ProjectContext';
import { useDocument } from '@/lib/contexts/DocumentContext';
import { DocumentBrowser } from './DocumentBrowser';
import { PlateEditor } from '@aycd/editor';
import './ProjectWorkspace.css';

const toPlainText = (content: string): string => {
  if (!content) return '';

  try {
    const value = JSON.parse(content);
    if (Array.isArray(value)) {
      return value.map((node) => Node.string(node)).join('\n');
    }
  } catch {
    // fall back to the original string
  }

  return content;
};

const countWords = (text: string): number => {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
};

const getDocumentCategory = (path?: string) => {
  if (!path) return 'General';
  const segments = path.split('/').filter(Boolean);
  if (segments.length < 2) return 'General';
  return segments[segments.length - 2];
};

export function ProjectWorkspace() {
  const { current: currentProject, closeProject } = useProject();
  const { current: currentDocument, loadDocuments, saveCurrentDocument, closeDocument } = useDocument();

  const [editorContent, setEditorContent] = useState('');
  const [editorPlainText, setEditorPlainText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [liveWordCount, setLiveWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [lastAutosaveTime, setLastAutosaveTime] = useState(0);

  const lastSavedContentRef = useRef('');
  const autosaveTimerRef = useRef<number>();

  useEffect(() => {
    if (currentProject) {
      loadDocuments(currentProject.path);
    }

    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
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

  useEffect(() => {
    if (currentDocument) {
      setEditorContent(currentDocument.content);
      const plain = toPlainText(currentDocument.content);
      setEditorPlainText(plain);
      lastSavedContentRef.current = currentDocument.content;
      setHasUnsavedChanges(false);
      setLiveWordCount(countWords(plain));
      setCharacterCount(plain.length);
    }
  }, [currentDocument]);

  useEffect(() => {
    setLiveWordCount(countWords(editorPlainText));
    setCharacterCount(editorPlainText.length);
  }, [editorPlainText]);

  useEffect(() => {
    if (!currentDocument) return;
    const isDirty = editorContent !== lastSavedContentRef.current;
    setHasUnsavedChanges(isDirty);

    if (isDirty && !isSaving) {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      autosaveTimerRef.current = window.setTimeout(() => {
        handleSave(true);
      }, 1800);
    }
  }, [editorContent, currentDocument, isSaving]);

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
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseProject = () => {
    closeProject();
  };

  const handleCloseDocument = () => {
    if (hasUnsavedChanges) {
      const confirmed = confirm('You have unsaved changes. Close without saving?');
      if (!confirmed) return;
    }
    closeDocument();
  };

  const handleEditorChange = useCallback((serialized: string, plainText: string) => {
    setEditorContent(serialized);
    setEditorPlainText(plainText);
  }, []);

  const docCategory = useMemo(() => getDocumentCategory(currentDocument?.path), [currentDocument?.path]);
  const autosaveCopy = useMemo(() => {
    if (hasUnsavedChanges) return 'Unsaved changes';
    if (lastAutosaveTime === 0) return 'Autosave waiting';
    return `Synced at ${new Date(lastAutosaveTime).toLocaleTimeString()}`;
  }, [hasUnsavedChanges, lastAutosaveTime]);

  return (
    <div className="workspace">
      <header className="workspace-hero">
        <div>
          <p className="workspace-eyebrow">Project</p>
          <h1>{currentProject?.name ?? 'Untitled Project'}</h1>
          <p className="workspace-path">{currentProject?.path}</p>
        </div>
        <div className="workspace-hero-stats">
          <div className="stat-card">
            <span>Words</span>
            <strong>{liveWordCount.toLocaleString()}</strong>
          </div>
          <div className="stat-card">
            <span>Characters</span>
            <strong>{characterCount.toLocaleString()}</strong>
          </div>
          <div className="stat-card muted">
            <span>Status</span>
            <strong>{autosaveCopy}</strong>
          </div>
        </div>
        <div className="workspace-hero-actions">
          <button className="ghost" onClick={handleCloseDocument} disabled={!currentDocument}>
            Close document
          </button>
          <button className="outline" onClick={handleCloseProject}>
            Leave project
          </button>
        </div>
      </header>

      <div className="workspace-main">
        <DocumentBrowser />

        <section className="workspace-editor-panel">
          {currentDocument ? (
            <>
              <div className="document-summary">
                <div>
                  <p className="workspace-eyebrow">Active document</p>
                  <h2>{currentDocument.title}</h2>
                  <p className="workspace-path subtle">{currentDocument.path}</p>
                </div>
                <div className="document-tags">
                  <span className={`badge ${currentDocument.documentType}`}>
                    {currentDocument.documentType === 'world' ? 'World bible' : 'Narrative'}
                  </span>
                  <span className="badge ghost">{docCategory}</span>
                  <span className="badge soft">{currentDocument.metadata?.status ?? 'draft'}</span>
                </div>
              </div>

              <div className="editor-stack">
                <div className="editor-shell">
                  <div className="editor-actions">
                    <div className="editor-stats">
                      <span>{liveWordCount} words</span>
                      <span className="dot" />
                      <span>{characterCount} characters</span>
                      {hasUnsavedChanges && <span className="badge warn">Unsaved</span>}
                      {!hasUnsavedChanges && lastAutosaveTime > 0 && (
                        <span className="badge success">Synced</span>
                      )}
                    </div>
                    <div className="action-buttons">
                      <button className="outline" onClick={() => handleSave()} disabled={!hasUnsavedChanges || isSaving}>
                        {isSaving ? 'Saving…' : hasUnsavedChanges ? 'Save' : 'Saved'}
                      </button>
                    </div>
                  </div>
                  <PlateEditor content={editorContent} onChange={handleEditorChange} />
                </div>
                <aside className="insight-panel">
                  <p className="workspace-eyebrow">Live insights</p>
                  <div className="insight-grid">
                    <div>
                      <span className="insight-label">Autosave</span>
                      <strong>{autosaveCopy}</strong>
                    </div>
                    <div>
                      <span className="insight-label">Mode</span>
                      <strong>{currentDocument.documentType === 'world' ? 'Worldbuilding' : 'Story'}</strong>
                    </div>
                    <div>
                      <span className="insight-label">Last updated</span>
                      <strong>
                        {new Date(currentDocument.modifiedAt * 1000).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </strong>
                    </div>
                    <div>
                      <span className="insight-label">Created</span>
                      <strong>{new Date(currentDocument.createdAt * 1000).toLocaleDateString()}</strong>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <div className="no-document">
              <p>Select or create a document to begin crafting.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
