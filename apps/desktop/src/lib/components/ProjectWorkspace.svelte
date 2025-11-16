<script lang="ts">
  import { projectStore } from '$stores/project.svelte';

  function handleCloseProject() {
    projectStore.closeProject();
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
    <div class="placeholder">
      <h3>🎨 Workspace Coming Soon</h3>
      <p>This is where the editor, canvas, and timeline will appear.</p>
      <p class="status">✅ Project structure created successfully!</p>
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
    overflow: auto;
  }

  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    padding: 2rem;
  }

  .placeholder h3 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .placeholder p {
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 0.5rem;
  }

  .status {
    color: #10b981;
    font-weight: 600;
    margin-top: 2rem;
  }
</style>
