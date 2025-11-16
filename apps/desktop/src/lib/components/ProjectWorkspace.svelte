<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { projectStore } from '$stores/project.svelte';
  import { documentStore } from '$stores/document.svelte';
  import DocumentBrowser from './DocumentBrowser.svelte';

  let editorContent = $state('');
  let isSaving = $state(false);
  let hasUnsavedChanges = $state(false);
  let liveWordCount = $state(0);
  let characterCount = $state(0);
  let lineCount = $state(1);
  let autosaveTimer: number | undefined;
  let lastSavedContent = '';
  let lastAutosaveTime = $state<number>(0);

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
      clearTimeout(autosaveTimer);
    }
  });

  // Sync editor content with current document
  $effect(() => {
    if (documentStore.current) {
      editorContent = documentStore.current.content;
      lastSavedContent = documentStore.current.content;
      hasUnsavedChanges = false;
      // Note: liveWordCount is updated by the tracking effect below
    }
  });

  // Track content changes for dirty state and trigger autosave
  $effect(() => {
    if (documentStore.current) {
      hasUnsavedChanges = editorContent !== lastSavedContent;
      liveWordCount = countWords(editorContent);
      characterCount = editorContent.length;
      lineCount = editorContent.split('\n').length;

      // Debounced autosave: save 2 seconds after typing stops
      if (hasUnsavedChanges && !isSaving) {
        if (autosaveTimer) {
          clearTimeout(autosaveTimer);
        }
        autosaveTimer = window.setTimeout(() => {
          handleSave(true);
        }, 2000); // 2 seconds after typing stops
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
      lastAutosaveTime = Date.now();

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
            <div class="stats">
              <span class="stat-item">{liveWordCount} words</span>
              <span class="stat-separator">·</span>
              <span class="stat-item">{characterCount} characters</span>
              {#if hasUnsavedChanges}
                <span class="unsaved-indicator" title="Unsaved changes">●</span>
              {:else if lastAutosaveTime > 0}
                <span class="saved-indicator" title="All changes saved">✓</span>
              {/if}
            </div>
            <button class="btn-save" onclick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
              {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save' : 'Saved'}
            </button>
            <button class="btn-close-doc" onclick={handleCloseDocument}>Close</button>
          </div>
        </div>
        <div class="editor-container">
          <div class="line-numbers">
            {#each Array(lineCount) as _, i}
              <div class="line-number">{i + 1}</div>
            {/each}
          </div>
          <textarea
            class="editor"
            bind:value={editorContent}
            placeholder="Start writing..."
            spellcheck="true"
          ></textarea>
        </div>
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

  .stats {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .stat-item {
    font-variant-numeric: tabular-nums;
  }

  .stat-separator {
    opacity: 0.3;
  }

  .unsaved-indicator {
    color: #f59e0b;
    font-size: 0.5rem;
    animation: pulse 2s ease-in-out infinite;
    margin-left: 0.25rem;
  }

  .saved-indicator {
    color: #10b981;
    font-size: 0.75rem;
    margin-left: 0.25rem;
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

  .editor-container {
    flex: 1;
    display: flex;
    background: rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }

  .line-numbers {
    padding: 3rem 1rem 3rem 2rem;
    background: rgba(0, 0, 0, 0.15);
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    user-select: none;
    min-width: 3.5rem;
    text-align: right;
  }

  .line-number {
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
    font-size: 0.875rem;
    line-height: 1.96875rem; /* Matches editor line-height of 1.75 * 1.125rem */
    color: rgba(255, 255, 255, 0.25);
    height: 1.96875rem;
  }

  .editor {
    flex: 1;
    padding: 3rem 4rem 3rem 2rem;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.95);
    font-family: 'Charter', 'Iowan Old Style', 'Georgia', 'Cambria', 'Times New Roman', serif;
    font-size: 1.125rem;
    line-height: 1.75;
    resize: none;
    letter-spacing: 0.01em;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .editor:focus {
    outline: none;
  }

  .editor::placeholder {
    color: rgba(255, 255, 255, 0.25);
    font-style: italic;
  }

  .no-document {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgba(255, 255, 255, 0.5);
  }
</style>
