<script lang="ts">
  import { documentStore } from '$stores/document.svelte';
  import type { DocumentType } from '@aycd/core';

  function handleModeSwitch(mode: DocumentType) {
    documentStore.setMode(mode);
  }
</script>

<div class="mode-switcher">
  <button
    class="mode-btn"
    class:active={documentStore.mode === 'world'}
    onclick={() => handleModeSwitch('world')}
  >
    🗺️ World
  </button>
  <button
    class="mode-btn"
    class:active={documentStore.mode === 'narrative'}
    onclick={() => handleModeSwitch('narrative')}
  >
    📖 Narrative
  </button>
</div>

<style>
  .mode-switcher {
    display: flex;
    gap: 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    padding: 0.25rem;
    border-radius: 0.5rem;
  }

  .mode-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    color: rgba(255, 255, 255, 0.6);
  }

  .mode-btn:hover {
    color: rgba(255, 255, 255, 0.8);
  }

  .mode-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
</style>
