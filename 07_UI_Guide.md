# UI/UX Guidelines & Design System


This guide defines the visual language, interaction patterns, and reusable components that make up AYCD's user interface.

## Design Principles

1. **Clarity Over Cleverness**: Intuitive UI beats impressive animations
2. **Speed Over Beauty**: 60fps interactions, instant feedback
3. **Accessibility First**: Keyboard navigation, screen readers, high contrast
4. **Consistency**: Same patterns everywhere
5. **Progressive Disclosure**: Hide complexity until needed

---

## Color System

### Tailwind v4 Configuration

Using CSS variables for theme switching:

```css
/* apps/desktop/src/styles/globals.css */
@import "tailwindcss";

:root {
  /* Primary palette */
  --color-primary-50: 240 249 255;
  --color-primary-100: 224 242 254;
  --color-primary-500: 59 130 246;
  --color-primary-600: 37 99 235;
  --color-primary-900: 30 58 138;

  /* Neutral palette */
  --color-neutral-50: 250 250 250;
  --color-neutral-100: 245 245 245;
  --color-neutral-200: 229 229 229;
  --color-neutral-800: 38 38 38;
  --color-neutral-900: 23 23 23;
  
  /* Semantic colors */
  --color-success: 34 197 94;
  --color-warning: 234 179 8;
  --color-error: 239 68 68;
  
  /* Editor-specific */
  --color-editor-bg: 255 255 255;
  --color-editor-text: 23 23 23;
  --color-editor-selection: 59 130 246;
}

[data-theme="dark"] {
  --color-editor-bg: 23 23 23;
  --color-editor-text: 250 250 250;
  --color-neutral-50: 23 23 23;
  --color-neutral-900: 250 250 250;
}
```

### Usage in Components

```svelte
<script lang="ts">
  // Component logic
</script>

<div class="bg-neutral-50 dark:bg-neutral-900">
  <button class="bg-primary-500 hover:bg-primary-600 text-white">
    Save
  </button>
</div>
```

---

## Typography

### Font Stack

```css
/* Prose (editor) */
--font-prose: "iA Writer Quattro", "Georgia", serif;

/* UI */
--font-ui: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

/* Code */
--font-code: "JetBrains Mono", "Fira Code", monospace;
```

### Type Scale

```typescript
// apps/desktop/src/lib/config/typography.ts

export const typeScale = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2.0,
};
```

### Usage

```svelte
<h1 class="text-3xl font-bold leading-tight">
  Project Title
</h1>

<p class="text-base leading-relaxed font-prose">
  Body text uses comfortable line height for reading.
</p>
```

---

## Layout System

### Main App Layout

```svelte
<!-- apps/desktop/src/lib/components/AppShell.svelte -->
<script lang="ts">
  import { sidebarOpen } from '$lib/stores/ui';
</script>

<div class="flex h-screen overflow-hidden">
  <!-- Sidebar -->
  {#if $sidebarOpen}
    <aside class="w-64 border-r border-neutral-200 dark:border-neutral-800">
      <slot name="sidebar" />
    </aside>
  {/if}

  <!-- Main content -->
  <main class="flex-1 overflow-auto">
    <slot />
  </main>

  <!-- Optional right panel -->
  <aside class="w-80 border-l border-neutral-200 dark:border-neutral-800">
    <slot name="panel" />
  </aside>
</div>
```

### Editor Layout

```svelte
<!-- apps/desktop/src/lib/components/EditorLayout.svelte -->
<div class="h-full flex flex-col">
  <!-- Toolbar -->
  <header class="h-12 border-b border-neutral-200 px-4 flex items-center gap-2">
    <slot name="toolbar" />
  </header>

  <!-- Editor area -->
  <div class="flex-1 overflow-auto p-8">
    <div class="max-w-3xl mx-auto">
      <slot />
    </div>
  </div>

  <!-- Status bar -->
  <footer class="h-8 border-t border-neutral-200 px-4 flex items-center justify-between text-sm text-neutral-600">
    <slot name="status" />
  </footer>
</div>
```

---

## Component Library

### Button

```svelte
<!-- apps/desktop/src/lib/components/ui/Button.svelte -->
<script lang="ts">
  type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
  type Size = 'sm' | 'md' | 'lg';

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    onclick,
    children,
  }: {
    variant?: Variant;
    size?: Size;
    disabled?: boolean;
    loading?: boolean;
    onclick?: () => void;
    children?: any;
  } = $props();

  const baseClasses = 'inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
    secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 focus:ring-neutral-500',
    ghost: 'hover:bg-neutral-100 text-neutral-700 focus:ring-neutral-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
</script>

<button
  class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]}"
  {disabled}
  {onclick}
>
  {#if loading}
    <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  {/if}
  {@render children?.()}
</button>
```

**Usage**:
```svelte
<Button variant="primary" onclick={handleSave}>
  Save Document
</Button>

<Button variant="ghost" size="sm">
  Cancel
</Button>

<Button variant="danger" loading={deleting}>
  Delete
</Button>
```

### Input

```svelte
<!-- apps/desktop/src/lib/components/ui/Input.svelte -->
<script lang="ts">
  let {
    value = $bindable(''),
    type = 'text',
    placeholder,
    label,
    error,
    disabled = false,
  }: {
    value?: string;
    type?: 'text' | 'email' | 'password' | 'number';
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
  } = $props();
</script>

<div class="space-y-1">
  {#if label}
    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
      {label}
    </label>
  {/if}
  
  <input
    {type}
    {placeholder}
    {disabled}
    bind:value
    class="
      block w-full rounded border px-3 py-2
      bg-white dark:bg-neutral-900
      border-neutral-300 dark:border-neutral-700
      focus:border-primary-500 focus:ring-1 focus:ring-primary-500
      disabled:opacity-50 disabled:cursor-not-allowed
      {error ? 'border-red-500' : ''}
    "
  />
  
  {#if error}
    <p class="text-sm text-red-500">{error}</p>
  {/if}
</div>
```

### Modal

```svelte
<!-- apps/desktop/src/lib/components/ui/Modal.svelte -->
<script lang="ts">
  let {
    open = $bindable(false),
    title,
    children,
  }: {
    open?: boolean;
    title: string;
    children?: any;
  } = $props();

  function close() {
    open = false;
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-black/50 transition-opacity"
      onclick={close}
    ></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-lg w-full p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">{title}</h2>
          <button 
            onclick={close}
            class="text-neutral-400 hover:text-neutral-600"
          >
            ✕
          </button>
        </div>

        <!-- Content -->
        <div>
          {@render children?.()}
        </div>
      </div>
    </div>
  </div>
{/if}
```

### Toast Notifications

```svelte
<!-- apps/desktop/src/lib/components/ui/Toast.svelte -->
<script lang="ts">
  import { toasts } from '$lib/stores/ui';
  import { fade, fly } from 'svelte/transition';

  function dismiss(id: string) {
    toasts.remove(id);
  }
</script>

<div class="fixed top-4 right-4 z-50 space-y-2">
  {#each $toasts as toast (toast.id)}
    <div
      transition:fly={{ y: -20 }}
      class="
        bg-white dark:bg-neutral-800 
        border border-neutral-200 dark:border-neutral-700
        rounded-lg shadow-lg p-4 min-w-[300px]
        flex items-start gap-3
      "
    >
      <!-- Icon -->
      <div class="flex-shrink-0">
        {#if toast.type === 'success'}
          <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        {:else if toast.type === 'error'}
          <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        {/if}
      </div>

      <!-- Content -->
      <div class="flex-1">
        <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {toast.message}
        </p>
      </div>

      <!-- Dismiss -->
      <button
        onclick={() => dismiss(toast.id)}
        class="flex-shrink-0 text-neutral-400 hover:text-neutral-600"
      >
        ✕
      </button>
    </div>
  {/each}
</div>
```

**Usage**:
```typescript
import { toasts } from '$lib/stores/ui';

toasts.success('Document saved successfully');
toasts.error('Failed to save document');
```

---

## Keyboard Shortcuts

### Global Shortcuts

```typescript
// apps/desktop/src/lib/config/shortcuts.ts

export const shortcuts = {
  // File operations
  newFile: 'Cmd+N',
  openFile: 'Cmd+O',
  save: 'Cmd+S',
  saveAs: 'Cmd+Shift+S',
  
  // Navigation
  commandPalette: 'Cmd+K',
  search: 'Cmd+F',
  nextTab: 'Cmd+]',
  prevTab: 'Cmd+[',
  
  // Views
  toggleSidebar: 'Cmd+B',
  togglePanel: 'Cmd+\\',
  focusMode: 'F11',
  
  // Editor
  bold: 'Cmd+B',
  italic: 'Cmd+I',
  undo: 'Cmd+Z',
  redo: 'Cmd+Shift+Z',
  
  // AI
  aiChat: 'Cmd+Shift+A',
  aiComplete: 'Alt+Space',
};
```

### Implementation

```svelte
<!-- apps/desktop/src/lib/components/ShortcutHandler.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { shortcuts } from '$lib/config/shortcuts';

  onMount(() => {
    function handleKeydown(e: KeyboardEvent) {
      const key = [
        e.ctrlKey && 'Ctrl',
        e.metaKey && 'Cmd',
        e.shiftKey && 'Shift',
        e.altKey && 'Alt',
        e.key.toUpperCase(),
      ].filter(Boolean).join('+');

      // Match against shortcuts
      const action = Object.entries(shortcuts).find(([, shortcut]) => shortcut === key)?.[0];
      
      if (action) {
        e.preventDefault();
        handleShortcut(action);
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  function handleShortcut(action: string) {
    switch (action) {
      case 'save':
        saveDocument();
        break;
      case 'commandPalette':
        openCommandPalette();
        break;
      // ... more cases
    }
  }
</script>
```

---

## Accessibility

### Focus Management

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  let firstFocusable: HTMLElement;

  onMount(() => {
    // Auto-focus first element in modal
    firstFocusable?.focus();
  });
</script>

<div role="dialog" aria-labelledby="modal-title">
  <h2 id="modal-title">Create New Project</h2>
  
  <input 
    bind:this={firstFocusable}
    type="text"
    aria-label="Project name"
  />
</div>
```

### ARIA Labels

```svelte
<!-- Buttons with icons -->
<button aria-label="Close" onclick={close}>
  <svg>...</svg>
</button>

<!-- Loading states -->
<button aria-busy={loading} aria-live="polite">
  {#if loading}
    Saving...
  {:else}
    Save
  {/if}
</button>

<!-- Form validation -->
<input
  type="text"
  aria-invalid={!!error}
  aria-describedby={error ? 'error-message' : undefined}
/>
{#if error}
  <p id="error-message" role="alert">{error}</p>
{/if}
```

### Screen Reader Support

```svelte
<!-- Skip navigation -->
<a href="#main-content" class="sr-only focus:not-sr-only">
  Skip to main content
</a>

<main id="main-content">
  <!-- Content -->
</main>

<!-- CSS for sr-only -->
<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  
  .focus\:not-sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    padding: 0.5rem 1rem;
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }
</style>
```

---

## Animation & Transitions

### Principles

1. **Purposeful**: Animations guide attention, don't distract
2. **Fast**: 150-300ms for UI transitions
3. **Smooth**: Ease-out for entering, ease-in for exiting
4. **Respectful**: Honor `prefers-reduced-motion`

### Examples

```svelte
<script lang="ts">
  import { fade, slide, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
</script>

<!-- Fade in/out -->
<div transition:fade={{ duration: 200 }}>
  Content
</div>

<!-- Slide down -->
<div transition:slide={{ duration: 300, easing: quintOut }}>
  Dropdown menu
</div>

<!-- Fly in from side -->
<div transition:fly={{ x: 300, duration: 250 }}>
  Sidebar
</div>

<!-- Respect reduced motion -->
<style>
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
```

---

## Dark Mode

### Implementation

```typescript
// apps/desktop/src/lib/stores/theme.ts
import { writable } from 'svelte/store';

type Theme = 'light' | 'dark' | 'auto';

function createThemeStore() {
  const { subscribe, set } = writable<Theme>('auto');

  function init() {
    const saved = localStorage.getItem('theme') as Theme || 'auto';
    set(saved);
    applyTheme(saved);
  }

  function applyTheme(theme: Theme) {
    const isDark = theme === 'dark' || 
      (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }

  return {
    subscribe,
    set: (theme: Theme) => {
      set(theme);
      localStorage.setItem('theme', theme);
      applyTheme(theme);
    },
    init,
  };
}

export const theme = createThemeStore();
```

**Usage**:
```svelte
<script lang="ts">
  import { theme } from '$lib/stores/theme';
  import { onMount } from 'svelte';

  onMount(() => {
    theme.init();
  });
</script>

<select bind:value={$theme} onchange={() => theme.set($theme)}>
  <option value="light">Light</option>
  <option value="dark">Dark</option>
  <option value="auto">Auto</option>
</select>
```

---

## Performance Guidelines

### 1. Virtual Lists

For large lists (1000+ items):

```svelte
<script lang="ts">
  import { VirtualList } from 'svelte-virtual-list';

  let items: Document[] = $state([]);
</script>

<VirtualList {items} let:item height="500px" itemHeight={50}>
  <DocumentRow document={item} />
</VirtualList>
```

### 2. Lazy Loading Images

```svelte
<script lang="ts">
  let loaded = $state(false);
</script>

<img
  src={loaded ? imageSrc : placeholder}
  onload={() => loaded = true}
  alt="Description"
  loading="lazy"
/>
```

### 3. Debouncing Input

```typescript
import { debounce } from '$lib/utils/timing';

const debouncedSearch = debounce(async (query: string) => {
  await invoke('search', { query });
}, 300);
```

---

**Next**: See `08_AI_Integration.md` for provider setup and prompt engineering.
