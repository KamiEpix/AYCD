<script lang="ts">
  import ProjectSelector from '$components/ProjectSelector.svelte';
  import ProjectWorkspace from '$components/ProjectWorkspace.svelte';
  import { projectStore } from '$stores/project.svelte';
</script>

{#if projectStore.current}
  <ProjectWorkspace />
{:else}
  <ProjectSelector />
{/if}
