<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import React from 'react';
  import ReactDOM from 'react-dom/client';
  import { PlateEditor } from '@aycd/editor';

  interface Props {
    content?: string;
    onChange?: (content: string) => void;
    readOnly?: boolean;
  }

  let { content = '', onChange, readOnly = false }: Props = $props();

  let containerRef: HTMLDivElement;
  let reactRoot: ReturnType<typeof ReactDOM.createRoot> | null = null;

  onMount(() => {
    if (containerRef) {
      // Create React root and render Plate editor
      reactRoot = ReactDOM.createRoot(containerRef);
      renderEditor();
    }
  });

  onDestroy(() => {
    // Cleanup React root
    if (reactRoot) {
      reactRoot.unmount();
      reactRoot = null;
    }
  });

  // Re-render when props change
  $effect(() => {
    if (reactRoot) {
      renderEditor();
    }
  });

  function renderEditor() {
    if (!reactRoot) return;

    reactRoot.render(
      React.createElement(PlateEditor, {
        content,
        onChange,
        readOnly,
      })
    );
  }
</script>

<div bind:this={containerRef} class="rich-text-editor-wrapper"></div>

<style>
  .rich-text-editor-wrapper {
    height: 100%;
    width: 100%;
  }
</style>
