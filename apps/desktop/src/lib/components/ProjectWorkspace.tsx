import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Node } from 'slate';
import { useProject } from '@/lib/contexts/ProjectContext';
import { useDocument } from '@/lib/contexts/DocumentContext';
import { DocumentBrowser } from './DocumentBrowser';
import { PlateEditor } from '@aycd/editor';
import './ProjectWorkspace.css';
import type { WebviewWindow } from '@tauri-apps/api/window';

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

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

const defaultPinnedOptions = {
  trackRevisions: true,
  focusMode: false,
  anchorTimeline: true,
};

const highlightLegend = [
  { id: 'amber', label: 'Beats & pacing', copy: 'Use for major plot swings and rhythmic cues.' },
  { id: 'sand', label: 'Lore & canon', copy: 'Mark bible notes that need to sync across worlds.' },
  { id: 'rose', label: 'Relationships', copy: 'Tag character chemistry, tensions, and threads.' },
  { id: 'teal', label: 'Systems', copy: 'Call out rules, abilities, and mechanics.' },
  { id: 'plum', label: 'Needs revision', copy: 'Flag fragments that need a deeper rewrite.' },
];

export function ProjectWorkspace() {
  const { current: currentProject } = useProject();
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
  const [windowControlsReady, setWindowControlsReady] = useState(false);
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);

  const lastSavedContentRef = useRef('');
  const autosaveTimerRef = useRef<number>();
  const tauriWindowRef = useRef<WebviewWindow | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.__TAURI_INTERNALS__) {
      return;
    }

    let disposed = false;
    import('@tauri-apps/api/window').then(({ appWindow }) => {
      if (disposed) return;
      tauriWindowRef.current = appWindow;
      setWindowControlsReady(true);
      appWindow.isMaximized().then((result) => {
        if (!disposed) {
          setIsWindowMaximized(result);
        }
      });
    });

    return () => {
      disposed = true;
    };
  }, []);

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

  const handleCloseDocument = () => {
    if (hasUnsavedChanges) {
      const confirmed = confirm('You have unsaved changes. Close without saving?');
      if (!confirmed) return;
    }
    closeDocument();
  };

  const handleWindowMinimize = useCallback(() => {
    tauriWindowRef.current?.minimize();
  }, []);

  const handleWindowToggleMaximize = useCallback(async () => {
    const instance = tauriWindowRef.current;
    if (!instance) return;

    const maximized = await instance.isMaximized();
    if (maximized) {
      await instance.unmaximize();
      setIsWindowMaximized(false);
    } else {
      await instance.maximize();
      setIsWindowMaximized(true);
    }
  }, []);

  const handleWindowClose = useCallback(() => {
    tauriWindowRef.current?.close();
  }, []);

  const handleEditorChange = useCallback((serialized: string, plainText: string) => {
    setEditorContent(serialized);
    setEditorPlainText(plainText);
  }, []);

  const docCategory = useMemo(() => getDocumentCategory(currentDocument?.path), [currentDocument?.path]);
  const syncCopy = useMemo(() => {
    if (hasUnsavedChanges) return 'Unsaved changes';
    if (lastAutosaveTime === 0) return 'Autosave waiting';
    return `Synced at ${new Date(lastAutosaveTime).toLocaleTimeString()}`;
  }, [hasUnsavedChanges, lastAutosaveTime]);

  const [pinnedOptions, setPinnedOptions] = useState(defaultPinnedOptions);

  const handleResetPinned = () => {
    setPinnedOptions(defaultPinnedOptions);
  };

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

  const dockTabs = useMemo(() => {
    const ordered: typeof documents = currentDocument ? [currentDocument] : [];
    const recents = [...documents].sort((a, b) => b.modifiedAt - a.modifiedAt);
    recents.forEach((doc) => {
      if (!ordered.find((entry) => entry.path === doc.path)) {
        ordered.push(doc);
      }
    });
    return ordered.slice(0, 6);
  }, [currentDocument, documents]);

  const togglePinnedOption = (key: keyof typeof pinnedOptions) => {
    setPinnedOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenFromNavigator = (path: string) => {
    openDocument(path).catch((error) => {
      console.error('Failed to open document:', error);
    });
  };

  return (
    <div className="workspace-frame">
      <header className="window-chrome" data-tauri-drag-region>
        <div className="chrome-left">
          <span className="chrome-project">{currentProject?.name ?? 'Select a project'}</span>
          {currentDocument ? (
            <>
              <span className="chrome-separator">›</span>
              <span className="chrome-document">{currentDocument.title}</span>
            </>
          ) : (
            <span className="chrome-muted">Choose a document</span>
          )}
        </div>
        <div className="chrome-center" data-tauri-drag-region />
        <div className="chrome-right">
          <div className="chrome-controls" data-tauri-drag-region="false">
            <button
              className="chrome-btn"
              aria-label="Minimize"
              onClick={handleWindowMinimize}
              disabled={!windowControlsReady}
            >
              <span className="chrome-icon minus" />
            </button>
            <button
              className="chrome-btn"
              aria-label={isWindowMaximized ? 'Restore window' : 'Maximize window'}
              onClick={handleWindowToggleMaximize}
              disabled={!windowControlsReady}
            >
              <span className={`chrome-icon ${isWindowMaximized ? 'restore' : 'square'}`} />
            </button>
            <button
              className="chrome-btn danger"
              aria-label="Close window"
              onClick={handleWindowClose}
              disabled={!windowControlsReady}
            >
              <span className="chrome-icon close" />
            </button>
          </div>
        </div>
      </header>

      <div className="workspace-main">
        <div className="workspace-rail">
          <DocumentBrowser />
        </div>

        <main className="editor-stack">
          {currentDocument ? (
            <>
              <div className="editor-headline">
                <div>
                  <p className="workspace-eyebrow">
                    {currentDocument.documentType === 'world' ? 'World bible' : 'Narrative'} · {docCategory}
                  </p>
                  <h1>{currentDocument.title}</h1>
                  <p className="workspace-path subtle">{currentDocument.path}</p>
                </div>
                <div className="editor-actions">
                  <button className="ghost" onClick={handleCloseDocument}>
                    Close document
                  </button>
                  <button className="solid" onClick={() => handleSave()} disabled={!hasUnsavedChanges || isSaving}>
                    {isSaving ? 'Saving…' : hasUnsavedChanges ? 'Save' : 'Saved'}
                  </button>
                </div>
              </div>

              <div className="editor-insights">
                <span>{characterCount.toLocaleString()} characters</span>
                <span>{liveWordCount.toLocaleString()} words</span>
                <span>Updated {new Date(currentDocument.modifiedAt * 1000).toLocaleDateString()}</span>
                <span className={hasUnsavedChanges ? 'warn' : 'ok'}>{syncCopy}</span>
              </div>

              <div className="editor-shell">
                <PlateEditor content={editorContent} onChange={handleEditorChange} />
              </div>
            </>
          ) : (
            <div className="no-document">
              <div>
                <p className="workspace-eyebrow">Nothing open</p>
                <p className="subtle">Pick a file in the navigator to start writing.</p>
              </div>
            </div>
          )}
        </main>

        <aside className="workspace-inspector">
          <section className="inspector-panel">
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

          <section className="inspector-panel pinboard">
            <div className="panel-head">
              <p className="workspace-eyebrow">Pinned options</p>
              <button className="link-button" onClick={handleResetPinned}>
                Reset
              </button>
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

          <section className="inspector-panel highlight-panel">
            <div className="panel-head">
              <p className="workspace-eyebrow">Highlight legend</p>
              <span>Color cues</span>
            </div>
            <ul className="highlight-list">
              {highlightLegend.map((tone) => (
                <li key={tone.id}>
                  <span className="highlight-dot" data-tone={tone.id} />
                  <div>
                    <p className="highlight-label">{tone.label}</p>
                    <p className="highlight-copy">{tone.copy}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <footer className="workspace-dock">
        <div className="dock-tabs" role="tablist">
          {dockTabs.length === 0 ? (
            <span className="dock-empty">Open documents will appear here for quick switching.</span>
          ) : (
            dockTabs.map((doc) => (
              <button
                key={doc.path}
                role="tab"
                className={`dock-tab ${currentDocument?.path === doc.path ? 'active' : ''}`}
                onClick={() => handleOpenFromNavigator(doc.path)}
              >
                <span className="tab-title">{doc.title}</span>
                <span className="tab-meta">{doc.metadata?.category ?? getDocumentCategory(doc.path)}</span>
              </button>
            ))
          )}
        </div>
      </footer>
    </div>
  );
}
