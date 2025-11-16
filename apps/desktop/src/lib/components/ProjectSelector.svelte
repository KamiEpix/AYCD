<script lang="ts">
  import { onMount } from 'svelte';
  import { projectStore } from '$stores/project.svelte';

  let newProjectName = $state('');
  let showCreateForm = $state(false);

  onMount(async () => {
    await projectStore.loadProjects();
  });

  async function handleCreateProject() {
    if (!newProjectName.trim()) return;

    try {
      await projectStore.createProject(newProjectName.trim());
      newProjectName = '';
      showCreateForm = false;
    } catch (e) {
      console.error('Failed to create project:', e);
    }
  }

  async function handleOpenProject(projectPath: string) {
    try {
      await projectStore.openProject(projectPath);
    } catch (e) {
      console.error('Failed to open project:', e);
    }
  }
</script>

<div class="project-selector">
  <header>
    <h1>AYCD Projects</h1>
    <p class="subtitle">Local-first writing and worldbuilding</p>
  </header>

  {#if projectStore.error}
    <div class="error-banner">
      <strong>Error:</strong> {projectStore.error}
    </div>
  {/if}

  <div class="actions">
    {#if !showCreateForm}
      <button class="btn-primary" onclick={() => (showCreateForm = true)}>
        + New Project
      </button>
    {/if}
  </div>

  {#if showCreateForm}
    <div class="create-form">
      <h3>Create New Project</h3>
      <form
        onsubmit={(e) => {
          e.preventDefault();
          handleCreateProject();
        }}
      >
        <input
          type="text"
          bind:value={newProjectName}
          placeholder="Project name (e.g., my-novel)"
          autofocus
        />
        <div class="form-actions">
          <button type="submit" class="btn-primary" disabled={!newProjectName.trim()}>
            Create
          </button>
          <button
            type="button"
            class="btn-secondary"
            onclick={() => {
              showCreateForm = false;
              newProjectName = '';
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  {/if}

  <div class="projects-list">
    {#if projectStore.isLoading}
      <div class="loading">Loading projects...</div>
    {:else if projectStore.projects.length === 0}
      <div class="empty-state">
        <p>No projects yet. Create your first project to get started!</p>
      </div>
    {:else}
      <h3>Recent Projects</h3>
      <div class="project-grid">
        {#each projectStore.projects as project (project.id)}
          <button class="project-card" onclick={() => handleOpenProject(project.path)}>
            <div class="project-icon">📁</div>
            <div class="project-info">
              <h4>{project.name}</h4>
              <p class="project-path">{project.path}</p>
              <p class="project-date">
                Modified {new Date(project.modifiedAt * 1000).toLocaleDateString()}
              </p>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .project-selector {
    max-width: 900px;
    margin: 0 auto;
    padding: 3rem 2rem;
  }

  header {
    text-align: center;
    margin-bottom: 3rem;
  }

  h1 {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    color: rgba(255, 255, 255, 0.6);
    font-size: 1.1rem;
  }

  .error-banner {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 2rem;
    color: #fca5a5;
  }

  .actions {
    margin-bottom: 2rem;
  }

  .btn-primary,
  .btn-secondary {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
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

  .create-form {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .create-form h3 {
    margin-bottom: 1rem;
    color: #667eea;
  }

  .create-form input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    color: white;
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .create-form input:focus {
    outline: none;
    border-color: #667eea;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
  }

  .projects-list {
    margin-top: 2rem;
  }

  .projects-list h3 {
    margin-bottom: 1rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .loading,
  .empty-state {
    text-align: center;
    padding: 3rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .project-card {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    color: white;
  }

  .project-card:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: #667eea;
    transform: translateY(-2px);
  }

  .project-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }

  .project-info {
    flex: 1;
    min-width: 0;
  }

  .project-info h4 {
    font-size: 1.1rem;
    margin-bottom: 0.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .project-path {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.5);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 0.25rem;
  }

  .project-date {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
  }
</style>
