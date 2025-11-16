<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';

  let name = $state('');
  let greeting = $state('');

  async function greet() {
    greeting = await invoke<string>('greet', { name });
  }
</script>

<main class="container">
  <h1>Welcome to AYCD</h1>

  <div class="card">
    <p class="subtitle">Local-first writing and worldbuilding platform</p>

    <div class="greeting-form">
      <input
        type="text"
        bind:value={name}
        placeholder="Enter your name..."
        onkeydown={(e) => e.key === 'Enter' && greet()}
      />
      <button onclick={greet}>Greet</button>
    </div>

    {#if greeting}
      <p class="greeting">{greeting}</p>
    {/if}
  </div>

  <div class="info">
    <p>
      <strong>Status:</strong> Project structure initialized ✓
    </p>
    <p>
      <strong>Next steps:</strong> Run <code>pnpm dev</code> to start development
    </p>
  </div>
</main>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
  }

  h1 {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    padding: 2rem;
    min-width: 400px;
    margin-bottom: 2rem;
  }

  .subtitle {
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 1.5rem;
  }

  .greeting-form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    color: white;
    font-size: 1rem;
  }

  input:focus {
    outline: none;
    border-color: #667eea;
  }

  button {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }

  button:hover {
    transform: translateY(-2px);
  }

  button:active {
    transform: translateY(0);
  }

  .greeting {
    text-align: center;
    font-size: 1.25rem;
    color: #667eea;
    padding: 1rem;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 0.5rem;
  }

  .info {
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
  }

  .info p {
    margin: 0.5rem 0;
  }

  code {
    background: rgba(0, 0, 0, 0.3);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-family: 'Courier New', monospace;
    color: #667eea;
  }
</style>
