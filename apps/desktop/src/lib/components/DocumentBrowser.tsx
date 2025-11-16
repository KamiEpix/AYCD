import React, { useEffect, useMemo, useState } from 'react';
import { useDocument } from '@/lib/contexts/DocumentContext';
import { useProject } from '@/lib/contexts/ProjectContext';
import { ModeSwitcher } from './ModeSwitcher';
import './DocumentBrowser.css';

const sectionMap: Record<'world' | 'narrative', string[]> = {
  world: ['Cast', 'Places', 'Objects', 'Systems', 'Lore'],
  narrative: ['Drafts', 'Final', 'Research', 'Planning'],
};

const queueCopy = {
  world: 'Queue new cast entries, realms, and systems that need fleshing out next.',
  narrative: 'Stage drafts, rewrites, and beats so your story keeps moving.',
};

const sectionColorMap: Partial<Record<string, string>> = {
  Cast: 'var(--aycd-amber)',
  Places: 'var(--aycd-sand)',
  Objects: 'var(--aycd-rose)',
  Systems: 'var(--aycd-teal)',
  Lore: 'var(--aycd-plum)',
  Drafts: 'var(--aycd-amber)',
  Final: 'var(--aycd-teal)',
  Research: 'var(--aycd-plum)',
  Planning: 'var(--aycd-sand)',
};

export function DocumentBrowser() {
  const { filteredDocuments, current, isLoading, mode, createDocument, openDocument, loadDocuments } = useDocument();
  const { current: currentProject, closeProject } = useProject();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(sectionMap[mode][0]);
  const [filter, setFilter] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSelectedCategory(sectionMap[mode][0]);
    setExpandedSections({});
  }, [mode]);

  const queuePreview = useMemo(
    () => [...filteredDocuments].sort((a, b) => b.modifiedAt - a.modifiedAt).slice(0, 3),
    [filteredDocuments]
  );

  const filteredList = useMemo(() => {
    if (!filter.trim()) return filteredDocuments;
    const query = filter.toLowerCase();
    return filteredDocuments.filter((doc) => doc.title.toLowerCase().includes(query));
  }, [filter, filteredDocuments]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, typeof filteredDocuments> = {};
    filteredList.forEach((doc) => {
      const category = doc.metadata?.category ?? 'Unsorted';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category]?.push(doc);
    });

    return Object.entries(groups)
      .map(([category, docs]) => [category, [...docs].sort((a, b) => a.title.localeCompare(b.title))] as const)
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredList]);

  const handleCreateDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newDocTitle.trim() || !currentProject) return;

    try {
      await createDocument(currentProject.path, newDocTitle.trim(), mode, selectedCategory);
      setNewDocTitle('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  const handleOpenDocument = async (docPath: string) => {
    try {
      await openDocument(docPath);
    } catch (error) {
      console.error('Failed to open document:', error);
    }
  };

  const handleRefresh = async () => {
    if (currentProject) {
      await loadDocuments(currentProject.path);
    }
  };

  const toggleSection = (category: string) => {
    setExpandedSections((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const handleLeaveProject = () => {
    closeProject();
  };

  return (
    <aside className="document-browser">
      <header className="browser-heading">
        <div>
          <p className="browser-eyebrow">Active {mode === 'world' ? 'world bible' : 'narrative workspace'}</p>
          <h2>{currentProject?.name ?? 'Untitled project'}</h2>
          <p className="browser-subtle">{currentProject?.path ?? 'No project path selected'}</p>
        </div>
        <div className="browser-heading-actions">
          <button className="ghost" onClick={handleRefresh}>
            Sync
          </button>
          <button className="ghost danger" onClick={handleLeaveProject}>
            Leave
          </button>
        </div>
      </header>

      <div className="browser-controls">
        <ModeSwitcher />
        <div className="browser-search">
          <input
            type="text"
            placeholder={mode === 'world' ? 'Search people, places, systems…' : 'Search drafts, beats…'}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
          <button onClick={() => setShowCreateForm((prev) => !prev)}>{showCreateForm ? 'Close' : 'New'}</button>
        </div>
      </div>

      {showCreateForm && (
        <form className="browser-create" onSubmit={handleCreateDocument}>
          <label className="field">
            <span>Title</span>
            <input type="text" value={newDocTitle} onChange={(event) => setNewDocTitle(event.target.value)} autoFocus />
          </label>
          <label className="field">
            <span>Category</span>
            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
              {sectionMap[mode].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <div className="create-actions">
            <button type="submit" className="solid" disabled={!newDocTitle.trim()}>
              Create
            </button>
            <button type="button" onClick={() => setShowCreateForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="browser-tree">
        {isLoading ? (
          <div className="tree-empty">Loading documents…</div>
        ) : groupedByCategory.length === 0 ? (
          <div className="tree-empty">Nothing filed yet. Start by creating a document.</div>
        ) : (
          groupedByCategory.map(([category, docs]) => {
            const isExpanded = expandedSections[category] ?? true;
            return (
              <div key={category} className="tree-section">
                <button className="tree-toggle" onClick={() => toggleSection(category)}>
                  <span
                    className={`tree-indicator ${isExpanded ? 'open' : ''}`}
                    style={{ backgroundColor: sectionColorMap[category] ?? 'rgba(255, 255, 255, 0.2)' }}
                  />
                  <span className="tree-label">{category}</span>
                  <span className="tree-count">{docs.length}</span>
                </button>
                {isExpanded && (
                  <ul>
                    {docs.map((doc) => (
                      <li key={doc.path}>
                        <button
                          className={`tree-leaf ${current?.path === doc.path ? 'active' : ''}`}
                          onClick={() => handleOpenDocument(doc.path)}
                        >
                          <div className="leaf-body">
                            <span className="leaf-title">{doc.title}</span>
                            <span className="leaf-meta">{doc.wordCount.toLocaleString()} words</span>
                          </div>
                          <span className="leaf-date">{new Date(doc.modifiedAt * 1000).toLocaleDateString()}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>

      <footer className="browser-queue">
        <div className="queue-header">
          <div>
            <p className="browser-eyebrow">Queue</p>
            <p className="queue-copy">{queueCopy[mode]}</p>
          </div>
          <span>{queuePreview.length} staged</span>
        </div>
        {queuePreview.length === 0 ? (
          <div className="queue-empty">Pin a document to get rolling.</div>
        ) : (
          <div className="queue-items">
            {queuePreview.map((doc) => (
              <button key={doc.path} className="queue-item" onClick={() => handleOpenDocument(doc.path)}>
                <div>
                  <p className="queue-title">{doc.title}</p>
                  <p className="queue-meta">Updated {new Date(doc.modifiedAt * 1000).toLocaleDateString()}</p>
                </div>
                <span className="queue-words">{doc.wordCount.toLocaleString()} wds</span>
              </button>
            ))}
          </div>
        )}
      </footer>
    </aside>
  );
}
