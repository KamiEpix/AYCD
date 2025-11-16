import React, { useState, useEffect, useMemo } from 'react';
import { useDocument } from '@/lib/contexts/DocumentContext';
import { useProject } from '@/lib/contexts/ProjectContext';
import { ModeSwitcher } from './ModeSwitcher';
import './DocumentBrowser.css';

const categories = {
  world: ['Cast', 'Places', 'Objects', 'Systems', 'Lore'],
  narrative: ['Drafts', 'Final', 'Research', 'Planning'],
};

const queueCopy = {
  world: 'Keep the atlas organized. Queue characters, realms, and lore that need attention next.',
  narrative: 'Line up drafts, scenes, and revisions to keep the narrative flowing.',
};

export function DocumentBrowser() {
  const { filteredDocuments, current, isLoading, mode, createDocument, openDocument, loadDocuments } = useDocument();
  const { current: currentProject } = useProject();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState(categories[mode][0]);

  useEffect(() => {
    setSelectedSubcategory(categories[mode][0]);
  }, [mode]);

  const queuePreview = useMemo(() => filteredDocuments.slice(0, 3), [filteredDocuments]);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !currentProject) return;

    try {
      await createDocument(currentProject.path, newDocTitle.trim(), mode, selectedSubcategory);
      setNewDocTitle('');
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create document:', err);
    }
  };

  const handleOpenDocument = async (docPath: string) => {
    try {
      await openDocument(docPath);
    } catch (err) {
      console.error('Failed to open document:', err);
    }
  };

  const handleRefresh = async () => {
    if (currentProject) {
      await loadDocuments(currentProject.path);
    }
  };

  const getCategoryIcon = (path: string): string => {
    if (path.includes('WORLD/Cast')) return '🧙‍♂️';
    if (path.includes('WORLD/Places')) return '🗺️';
    if (path.includes('WORLD/Objects')) return '🧿';
    if (path.includes('WORLD/Systems')) return '⚙️';
    if (path.includes('WORLD/Lore')) return '📜';
    if (path.includes('NARRATIVE/Drafts')) return '📝';
    if (path.includes('NARRATIVE/Final')) return '✅';
    if (path.includes('NARRATIVE/Research')) return '🔍';
    if (path.includes('NARRATIVE/Planning')) return '📋';
    return '📄';
  };

  const formatDate = (timestamp: number): string => new Date(timestamp * 1000).toLocaleDateString();

  return (
    <aside className="document-browser">
      <div className="browser-header">
        <div>
          <p className="browser-eyebrow">Navigator</p>
          <h2>Documents</h2>
          <p className="browser-helper">Warm, glassy surfaces keep your world and prose close at hand.</p>
        </div>
        <div className="browser-buttons">
          <button className="btn-refresh" onClick={handleRefresh} title="Refresh documents">
            Refresh
          </button>
          <button className="btn-create" onClick={() => setShowCreateForm((prev) => !prev)}>
            {showCreateForm ? 'Close' : 'New document'}
          </button>
        </div>
      </div>

      <div className="browser-controls">
        <ModeSwitcher />
        <span className="mode-caption">
          {mode === 'world' ? 'Characters · Regions · Lore' : 'Drafts · Chapters · Edits'}
        </span>
      </div>

      {showCreateForm && (
        <div className="create-form glass">
          <h3>Create new {mode === 'world' ? 'world' : 'narrative'} document</h3>
          <form onSubmit={handleCreateDocument}>
            <input
              type="text"
              value={newDocTitle}
              onChange={(event) => setNewDocTitle(event.target.value)}
              placeholder="Give it a name…"
              autoFocus
            />
            <select value={selectedSubcategory} onChange={(event) => setSelectedSubcategory(event.target.value)}>
              {categories[mode].map((subcat) => (
                <option key={subcat} value={subcat}>
                  {subcat}
                </option>
              ))}
            </select>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={!newDocTitle.trim()}>
                Create
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewDocTitle('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="documents-list">
        {isLoading ? (
          <div className="loading">Loading documents…</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="empty-state">
            <p>No {mode === 'world' ? 'world' : 'narrative'} documents yet.</p>
            <p>Use the queue to stage your first entry.</p>
          </div>
        ) : (
          <div className="document-grid">
            {filteredDocuments.map((doc) => (
              <button
                key={doc.path}
                className={`document-card ${current?.path === doc.path ? 'active' : ''}`}
                onClick={() => handleOpenDocument(doc.path)}
              >
                <div className="doc-icon">{getCategoryIcon(doc.path)}</div>
                <div className="doc-info">
                  <div className="doc-title-row">
                    <h4>{doc.title}</h4>
                    <span className="doc-count">{doc.wordCount} wds</span>
                  </div>
                  <p className="doc-meta">Updated {formatDate(doc.modifiedAt)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="document-queue">
        <div className="queue-header">
          <p className="browser-eyebrow">Queue</p>
          <span className="queue-copy">{queueCopy[mode]}</span>
        </div>
        {queuePreview.length === 0 ? (
          <div className="queue-empty">Nothing staged yet—pin a document to the queue by opening it.</div>
        ) : (
          <div className="queue-items">
            {queuePreview.map((doc) => (
              <div key={doc.path} className="queue-card">
                <div>
                  <p className="queue-title">{doc.title}</p>
                  <p className="queue-meta">{doc.wordCount} words • {formatDate(doc.modifiedAt)}</p>
                </div>
                <button className="queue-open" onClick={() => handleOpenDocument(doc.path)}>
                  Open
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
