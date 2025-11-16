<script lang="ts">
  import type { CanvasProps } from './types';

  let { data, onUpdate, readOnly = false, width = 800, height = 600 }: CanvasProps = $props();
</script>

<div class="canvas-container" style="width: {width}px; height: {height}px;">
  <div class="stub-message">
    <h3>Canvas Component (Stub)</h3>
    <p>Konva-based canvas implementation coming soon...</p>
    {#if data}
      <p>Nodes: {data.nodes?.length || 0}</p>
      <p>Connections: {data.connections?.length || 0}</p>
    {/if}
  </div>
</div>

<style>
  .canvas-container {
    border: 2px dashed #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9f9f9;
  }

  .stub-message {
    text-align: center;
    padding: 2rem;
  }

  .stub-message h3 {
    margin-bottom: 0.5rem;
    color: #333;
  }

  .stub-message p {
    margin: 0.25rem 0;
    color: #666;
  }
</style>
