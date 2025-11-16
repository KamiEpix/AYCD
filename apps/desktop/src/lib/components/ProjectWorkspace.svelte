<script lang="ts">
  import { onMount } from 'svelte';
  import { projectStore } from '$stores/project.svelte';
  import { documentStore } from '$stores/document.svelte';
  import DocumentBrowser from './DocumentBrowser.svelte';

  let editorContent = $state('');
  let isSaving = $state(false);

  // Load documents when workspace opens
  onMount(async () => {
    if (projectStore.current) {
      await documentStore.loadDocuments(projectStore.current.path);
    }
  });

  // Sync editor content with current document
  $effect(() => {
    if (documentStore.current) {
      editorContent = documentStore.current.content;
    }
  });

  function handleCloseProject() {
    documentStore.clearDocuments();
    projectStore.closeProject();
  }

  async function handleSave() {
    if (!documentStore.current) return;

    isSaving = true;
    try {
      await documentStore.saveCurrentDocument(editorContent);
    } catch (e) {
      console.error('Failed to save:', e);
    } finally {
      isSaving = false;
    }
  }

  function handleCloseDocument() {
    documentStore.closeDocument();
  }
</script>

<div class="workspace">
  <header class="workspace-header">
    <div class="project-info">
      <h2>{projectStore.current?.name}</h2>
      <p class="project-path">{projectStore.current?.path}</p>
    </div>
    <button class="btn-close" onclick={handleCloseProject}>Close Project</button>
  </header>

  <div class="workspace-content">
    <DocumentBrowser />

    <div class="editor-panel">
      {#if documentStore.current}
        <div class="editor-header">
          <div class="title-section">
            <h3>{documentStore.current.title}</h3>
            <span class="doc-type-badge">
              {documentStore.current.documentType === 'world' ? '🗺️ World' : '📖 Narrative'}
            </span>
          </div>
          <div class="editor-actions">
            <span class="word-count">{documentStore.current.wordCount} words</span>
            <button class="btn-save" onclick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button class="btn-close-doc" onclick={handleCloseDocument}>Close</button>
          </div>
        </div>
        <textarea
          class="editor"
          bind:value={editorContent}
          placeholder="Start writing..."
          spellcheck="true"
        ></textarea>
      {:else}
        <div class="no-document">
          <p>Select or create a document to start writing</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .workspace {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .workspace-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .project-info h2 {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .project-path {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .btn-close {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.375rem;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-close:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .workspace-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .editor-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .title-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .editor-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .doc-type-badge {
    padding: 0.25rem 0.5rem;
    background: rgba(102, 126, 234, 0.2);
    border: 1px solid rgba(102, 126, 234, 0.3);
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
  }

  .editor-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .word-count {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .btn-save,
  .btn-close-doc {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-save {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .btn-save:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .btn-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-close-doc {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .btn-close-doc:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .editor {
    flex: 1;
    padding: 2rem;
    background: rgba(0, 0, 0, 0.1);
    border: none;
    color: white;
    font-family: 'Georgia', serif;
    font-size: 1.125rem;
    line-height: 1.8;
    resize: none;
  }

  .editor:focus {
    outline: none;
  }

  .editor::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  .no-document {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgba(255, 255, 255, 0.5);
  }
</style>
