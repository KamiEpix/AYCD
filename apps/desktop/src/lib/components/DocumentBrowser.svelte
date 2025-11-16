<script lang="ts">
  import { documentStore } from '$stores/document.svelte';
  import { projectStore } from '$stores/project.svelte';
  import ModeSwitcher from './ModeSwitcher.svelte';

  let showCreateForm = $state(false);
  let newDocTitle = $state('');
  let selectedSubcategory = $state('Drafts');

  const categories = {
    world: ['Cast', 'Places', 'Objects', 'Systems', 'Lore'],
    narrative: ['Drafts', 'Final', 'Research', 'Planning'],
  };

  // Update default subcategory when mode changes
  $effect(() => {
    const mode = documentStore.mode;
    selectedSubcategory = categories[mode][0];
  });

  async function handleCreateDocument() {
    if (!newDocTitle.trim() || !projectStore.current) return;

    try {
      await documentStore.createDocument(
        projectStore.current.path,
        newDocTitle.trim(),
        documentStore.mode,
        selectedSubcategory,
        selectedSubcategory
      );
      newDocTitle = '';
      showCreateForm = false;
    } catch (e) {
      console.error('Failed to create document:', e);
    }
  }

  async function handleOpenDocument(docPath: string) {
    try {
      await documentStore.openDocument(docPath);
    } catch (e) {
      console.error('Failed to open document:', e);
    }
  }

  function getCategoryIcon(path: string): string {
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
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString();
  }
</script>

<div class="document-browser">
  <header>
    <div class="header-top">
      <h2>Documents</h2>
      {#if !showCreateForm}
        <button class="btn-create" onclick={() => (showCreateForm = true)}>+ New Document</button>
      {/if}
    </div>
    <ModeSwitcher />
  </header>

  {#if showCreateForm}
    <div class="create-form">
      <h3>Create New {documentStore.mode === 'world' ? 'World' : 'Narrative'} Document</h3>
      <form
        onsubmit={(e) => {
          e.preventDefault();
          handleCreateDocument();
        }}
      >
        <input type="text" bind:value={newDocTitle} placeholder="Document title..." autofocus />

        <select bind:value={selectedSubcategory}>
          {#each categories[documentStore.mode] as subcat}
            <option value={subcat}>{subcat}</option>
          {/each}
        </select>

        <div class="form-actions">
          <button type="submit" class="btn-primary" disabled={!newDocTitle.trim()}>
            Create
          </button>
          <button
            type="button"
            class="btn-secondary"
            onclick={() => {
              showCreateForm = false;
              newDocTitle = '';
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  {/if}

  <div class="documents-list">
    {#if documentStore.isLoading}
      <div class="loading">Loading documents...</div>
    {:else if documentStore.filteredDocuments.length === 0}
      <div class="empty-state">
        <p>
          No {documentStore.mode === 'world' ? 'world' : 'narrative'} documents yet. Create your
          first document to get started!
        </p>
      </div>
    {:else}
      <div class="document-grid">
        {#each documentStore.filteredDocuments as doc (doc.path)}
          <button
            class="document-card"
            class:active={documentStore.current?.path === doc.path}
            onclick={() => handleOpenDocument(doc.path)}
          >
            <div class="doc-icon">{getCategoryIcon(doc.path)}</div>
            <div class="doc-info">
              <h4>{doc.title}</h4>
              <p class="doc-meta">
                {doc.wordCount} words · {formatDate(doc.modifiedAt)}
              </p>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .document-browser {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: rgba(0, 0, 0, 0.2);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }

  header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  header h2 {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .btn-create {
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .btn-create:hover {
    transform: translateY(-1px);
  }

  .create-form {
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .create-form h3 {
    margin-bottom: 0.75rem;
    font-size: 1rem;
    color: #667eea;
  }

  .create-form input[type='text'] {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.375rem;
    background: rgba(0, 0, 0, 0.2);
    color: white;
    font-size: 0.875rem;
  }

  .create-form input[type='text']:focus {
    outline: none;
    border-color: #667eea;
  }

  select {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.375rem;
    background: rgba(0, 0, 0, 0.2);
    color: white;
    font-size: 0.875rem;
    cursor: pointer;
  }

  select:focus {
    outline: none;
    border-color: #667eea;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn-primary,
  .btn-secondary {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .documents-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .loading,
  .empty-state {
    text-align: center;
    padding: 2rem 1rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .document-grid {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .document-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    color: white;
  }

  .document-card:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(102, 126, 234, 0.5);
  }

  .document-card.active {
    background: rgba(102, 126, 234, 0.2);
    border-color: #667eea;
  }

  .doc-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .doc-info {
    flex: 1;
    min-width: 0;
  }

  .doc-info h4 {
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .doc-meta {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }
</style>
