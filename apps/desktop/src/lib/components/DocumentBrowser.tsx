import React, { useState, useEffect } from 'react';
import { useDocument } from '@/lib/contexts/DocumentContext';
import { useProject } from '@/lib/contexts/ProjectContext';
import { ModeSwitcher } from './ModeSwitcher';
import './DocumentBrowser.css';

const categories = {
  world: ['Cast', 'Places', 'Objects', 'Systems', 'Lore'],
  narrative: ['Drafts', 'Final', 'Research', 'Planning'],
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

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !currentProject) return;

    try {
      await createDocument(currentProject.path, newDocTitle.trim(), mode, selectedSubcategory);
      setNewDocTitle('');
      setShowCreateForm(false);
    } catch (e) {
      console.error('Failed to create document:', e);
    }
  };

  const handleOpenDocument = async (docPath: string) => {
    try {
      await openDocument(docPath);
    } catch (e) {
      console.error('Failed to open document:', e);
    }
  };

  const handleRefresh = async () => {
    if (currentProject) {
      await loadDocuments(currentProject.path);
    }
  };

  const getCategoryIcon = (path: string): string => {
    if (path.includes('WORLD/Cast')) return '👤';
    if (path.includes('WORLD/Places')) return '🗺️';
    if (path.includes('WORLD/Objects')) return '⚔️';
    if (path.includes('WORLD/Systems')) return '⚙️';
    if (path.includes('WORLD/Lore')) return '📜';
    if (path.includes('NARRATIVE/Drafts')) return '📝';
    if (path.includes('NARRATIVE/Final')) return '✅';
    if (path.includes('NARRATIVE/Research')) return '🔍';
    if (path.includes('NARRATIVE/Planning')) return '📋';
    return '📄';
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="document-browser">
      <header>
        <div className="header-top">
          <h2>Documents</h2>
          <div className="header-actions">
            {!showCreateForm && (
              <>
                <button className="btn-refresh" onClick={handleRefresh} title="Refresh documents">
                  🔄
                </button>
                <button className="btn-create" onClick={() => setShowCreateForm(true)}>
                  + New Document
                </button>
              </>
            )}
          </div>
        </div>
        <ModeSwitcher />
      </header>

      {showCreateForm && (
        <div className="create-form">
          <h3>Create New {mode === 'world' ? 'World' : 'Narrative'} Document</h3>
          <form onSubmit={handleCreateDocument}>
            <input
              type="text"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder="Document title..."
              autoFocus
            />
            <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)}>
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
          <div className="loading">Loading documents...</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="empty-state">
            <p>No {mode === 'world' ? 'world' : 'narrative'} documents yet.</p>
            <p>Create your first document to get started!</p>
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
                  <h4>{doc.title}</h4>
                  <p className="doc-meta">
                    {doc.wordCount} words · {formatDate(doc.modifiedAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
