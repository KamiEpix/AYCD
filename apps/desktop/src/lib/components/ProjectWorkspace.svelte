<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { projectStore } from '$stores/project.svelte';
  import { documentStore } from '$stores/document.svelte';
  import DocumentBrowser from './DocumentBrowser.svelte';

  let editorContent = $state('');
  let isSaving = $state(false);
  let hasUnsavedChanges = $state(false);
  let liveWordCount = $state(0);
  let autosaveTimer: number | undefined;
  let lastSavedContent = '';

  // Load documents when workspace opens
  onMount(async () => {
    if (projectStore.current) {
      await documentStore.loadDocuments(projectStore.current.path);
    }

    // Add keyboard shortcut listener
    window.addEventListener('keydown', handleKeyboardShortcuts);
  });

  onDestroy(() => {
    // Cleanup
    window.removeEventListener('keydown', handleKeyboardShortcuts);
    if (autosaveTimer) {
      clearInterval(autosaveTimer);
    }
  });

  // Sync editor content with current document
  $effect(() => {
    if (documentStore.current) {
      editorContent = documentStore.current.content;
      lastSavedContent = documentStore.current.content;
      hasUnsavedChanges = false;
      liveWordCount = countWords(editorContent);
    }
  });

  // Track content changes for dirty state
  $effect(() => {
    if (documentStore.current) {
      hasUnsavedChanges = editorContent !== lastSavedContent;
      liveWordCount = countWords(editorContent);
    }
  });

  // Setup autosave timer when document opens
  $effect(() => {
    if (documentStore.current) {
      // Clear existing timer
      if (autosaveTimer) {
        clearInterval(autosaveTimer);
      }

      // Set up new autosave timer (30 seconds)
      autosaveTimer = window.setInterval(() => {
        if (hasUnsavedChanges && !isSaving) {
          handleSave(true); // true = autosave
        }
      }, 30000);
    } else {
      // Clear timer when no document
      if (autosaveTimer) {
        clearInterval(autosaveTimer);
        autosaveTimer = undefined;
      }
    }
  });

  function handleCloseProject() {
    documentStore.clearDocuments();
    projectStore.closeProject();
  }

  async function handleSave(isAutosave = false) {
    if (!documentStore.current) return;

    isSaving = true;
    try {
      await documentStore.saveCurrentDocument(editorContent);
      lastSavedContent = editorContent;
      hasUnsavedChanges = false;

      if (!isAutosave) {
        console.log('Document saved successfully');
      }
    } catch (e) {
      console.error('Failed to save:', e);
    } finally {
      isSaving = false;
    }
  }

  function handleCloseDocument() {
    if (hasUnsavedChanges) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to close this document?');
      if (!confirmed) return;
    }
    documentStore.closeDocument();
  }

  function handleKeyboardShortcuts(e: KeyboardEvent) {
    // Ctrl+S (Windows/Linux) or Cmd+S (Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  }

  function countWords(text: string): number {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
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
            <span class="word-count">
              {liveWordCount} words
              {#if hasUnsavedChanges}
                <span class="unsaved-indicator" title="Unsaved changes">●</span>
              {/if}
            </span>
            <button class="btn-save" onclick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
              {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save *' : 'Saved'}
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
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .unsaved-indicator {
    color: #f59e0b;
    font-size: 0.5rem;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
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
