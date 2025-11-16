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
  const {
    current: currentDocument,
    loadDocuments,
    saveCurrentDocument,
    closeDocument,
    documents,
    openDocument,
    mode,
  } = useDocument();

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

  const [pinnedOptions, setPinnedOptions] = useState({
    trackRevisions: true,
    focusMode: false,
    anchorTimeline: true,
  });

  const navigatorDocuments = useMemo(() => {
    return documents
      .filter((doc) => doc.documentType === mode)
      .sort((a, b) => b.modifiedAt - a.modifiedAt)
      .slice(0, 6);
  }, [documents, mode]);

  const outline = useMemo(() => {
    if (!editorContent) return [] as { id: string; title: string; level: number }[];
    try {
      const parsed = JSON.parse(editorContent);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((node: any, index: number) => {
          const type = node?.type;
          if (typeof type === 'string' && /^h[1-3]$/.test(type)) {
            return {
              id: `${type}-${index}`,
              title: Node.string(node),
              level: Number(type.replace('h', '')),
            };
          }
          return null;
        })
        .filter(Boolean) as { id: string; title: string; level: number }[];
    } catch {
      return [];
    }
  }, [editorContent]);

  const dockTabs = navigatorDocuments;

  const togglePinnedOption = (key: keyof typeof pinnedOptions) => {
    setPinnedOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenFromNavigator = (path: string) => {
    openDocument(path).catch((error) => {
      console.error('Failed to open document:', error);
    });
  };

  return (
    <div className="workspace-shell">
      <header className="workspace-titlebar" data-drag-region>
        <div className="titlebar-left">
          <span className="app-mark">AYCD Creator</span>
          <div className="breadcrumbs">
            <span>{currentProject?.name ?? 'Untitled project'}</span>
            <span className="crumb">›</span>
            <span className="muted">{currentDocument?.title ?? 'No document selected'}</span>
          </div>
        </div>
        <div className="titlebar-center">
          <button className="command-btn" onClick={handleCloseProject}>
            Leave project
          </button>
        </div>
        <div className="titlebar-right">
          <div className="titlebar-stats">
            <span>{liveWordCount.toLocaleString()} words</span>
            <span className="dot" />
            <span>{autosaveCopy}</span>
          </div>
          <div className="window-controls">
            <button aria-label="Minimize" />
            <button aria-label="Maximize" />
            <button aria-label="Close" onClick={handleCloseDocument} disabled={!currentDocument} />
          </div>
        </div>
      </header>

      <div className="workspace-columns">
        <DocumentBrowser />

        <main className="workspace-editor-panel">
          {currentDocument ? (
            <>
              <div className="editor-header">
                <div>
                  <p className="editor-eyebrow">
                    {currentDocument.documentType === 'world' ? 'World bible' : 'Narrative'} · {docCategory}
                  </p>
                  <h1>{currentDocument.title}</h1>
                  <p className="workspace-path subtle">{currentDocument.path}</p>
                </div>
                <div className="editor-actions">
                  <button className="ghost" onClick={handleCloseDocument}>
                    Close tab
                  </button>
                  <button className="solid" onClick={() => handleSave()} disabled={!hasUnsavedChanges || isSaving}>
                    {isSaving ? 'Saving…' : hasUnsavedChanges ? 'Save' : 'Saved'}
                  </button>
                </div>
              </div>

              <div className="editor-telemetry">
                <span>{characterCount.toLocaleString()} characters</span>
                <span className="dot" />
                <span>Updated {new Date(currentDocument.modifiedAt * 1000).toLocaleDateString()}</span>
                <span className="dot" />
                <span className={hasUnsavedChanges ? 'warn' : 'ok'}>{hasUnsavedChanges ? 'Unsaved' : 'Synced'}</span>
              </div>

              <div className="editor-surface">
                <PlateEditor content={editorContent} onChange={handleEditorChange} />
              </div>
            </>
          ) : (
            <div className="no-document">
              <p>Select a document on the left or create a new one.</p>
            </div>
          )}
        </main>

        <aside className="workspace-sidecar">
          <section className="sidecar-panel">
            <div className="panel-head">
              <p className="workspace-eyebrow">Outline</p>
              <span>{outline.length} sections</span>
            </div>
            {outline.length === 0 ? (
              <p className="panel-empty">Structure emerges as you add headings.</p>
            ) : (
              <ul className="outline-list">
                {outline.map((entry) => (
                  <li key={entry.id} style={{ paddingLeft: `${(entry.level - 1) * 0.75}rem` }}>
                    <span>{entry.title || 'Untitled'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="sidecar-panel">
            <div className="panel-head">
              <p className="workspace-eyebrow">Pinned options</p>
              <span>Quick toggles</span>
            </div>
            <div className="pin-grid">
              <button
                className={`pin ${pinnedOptions.trackRevisions ? 'active' : ''}`}
                onClick={() => togglePinnedOption('trackRevisions')}
              >
                <strong>Track revisions</strong>
                <span>Mark edits for later review.</span>
              </button>
              <button
                className={`pin ${pinnedOptions.focusMode ? 'active' : ''}`}
                onClick={() => togglePinnedOption('focusMode')}
              >
                <strong>Focus mode</strong>
                <span>Dim menus and chrome.</span>
              </button>
              <button
                className={`pin ${pinnedOptions.anchorTimeline ? 'active' : ''}`}
                onClick={() => togglePinnedOption('anchorTimeline')}
              >
                <strong>Anchor timeline</strong>
                <span>Lock chronology to this doc.</span>
              </button>
            </div>
          </section>

          <section className="sidecar-panel">
            <div className="panel-head">
              <p className="workspace-eyebrow">Navigator</p>
              <span>{navigatorDocuments.length} recent</span>
            </div>
            {navigatorDocuments.length === 0 ? (
              <p className="panel-empty">Open files will land here for quick hopping.</p>
            ) : (
              <ul className="navigator-list">
                {navigatorDocuments.map((doc) => (
                  <li key={doc.path}>
                    <button
                      onClick={() => handleOpenFromNavigator(doc.path)}
                      className={currentDocument?.path === doc.path ? 'active' : ''}
                    >
                      <div>
                        <span className="title">{doc.title}</span>
                        <span className="meta">{doc.wordCount.toLocaleString()} words</span>
                      </div>
                      <span className="date">{new Date(doc.modifiedAt * 1000).toLocaleDateString()}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      <footer className="workspace-dock">
        <div className="dock-tabs">
          {dockTabs.map((doc) => (
            <button
              key={doc.path}
              className={`dock-tab ${currentDocument?.path === doc.path ? 'active' : ''}`}
              onClick={() => handleOpenFromNavigator(doc.path)}
            >
              <span className="tab-title">{doc.title}</span>
              <span className="tab-meta">{doc.metadata?.category ?? 'General'}</span>
            </button>
          ))}
          {dockTabs.length === 0 && <span className="dock-empty">Open documents will appear here.</span>}
        </div>
        <div className="dock-status">
          <span>{liveWordCount.toLocaleString()} words</span>
          <span className="dot" />
          <span>{autosaveCopy}</span>
        </div>
      </footer>
    </div>
  );
}
