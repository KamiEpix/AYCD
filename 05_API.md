# Tauri IPC API Reference


This reference documents the Tauri IPC commands exposed by the AYCD backend and how to call them from the frontend.

## Overview

All backend operations use Tauri's `invoke` system. Commands are defined in Rust and called from TypeScript.

**Frontend call pattern**:
```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke<ReturnType>('command_name', { 
  param1: value1,
  param2: value2,
});
```

**Rust command pattern**:
```rust
#[tauri::command]
async fn command_name(param1: Type1, param2: Type2) -> Result<ReturnType, String> {
    // Implementation
    Ok(result)
}
```

---

## Project Management

### `create_project`

Create a new project with folder structure and database.

**Parameters**:
```typescript
{
  name: string;        // Project name
  path: string;        // Absolute path to project folder
  template: string;    // 'blank' | 'novel' | 'screenplay'
}
```

**Returns**:
```typescript
{
  id: string;
  name: string;
  path: string;
  createdAt: number;   // Unix timestamp
}
```

**Example**:
```typescript
const project = await invoke('create_project', {
  name: 'My Novel',
  path: '/Users/me/Documents/AYCD/my-novel',
  template: 'novel',
});
```

**Rust signature**:
```rust
#[tauri::command]
async fn create_project(
    name: String,
    path: String,
    template: String,
) -> Result<Project, String>
```

---

### `open_project`

Open an existing project and initialize database connection.

**Parameters**:
```typescript
{
  path: string;  // Absolute path to project folder
}
```

**Returns**:
```typescript
{
  id: string;
  name: string;
  path: string;
  lastOpened: number;
  fileCount: number;
  wordCount: number;
}
```

**Example**:
```typescript
const project = await invoke('open_project', {
  path: '/Users/me/Documents/AYCD/my-novel',
});
```

---

### `get_recent_projects`

Get list of recently opened projects.

**Parameters**: None

**Returns**:
```typescript
Array<{
  id: string;
  name: string;
  path: string;
  lastOpened: number;
  thumbnail?: string;  // Base64 encoded image
}>
```

**Example**:
```typescript
const recent = await invoke<RecentProject[]>('get_recent_projects');
```

---

### `close_project`

Close current project and cleanup resources.

**Parameters**: None

**Returns**: `void`

**Example**:
```typescript
await invoke('close_project');
```

---

## File Operations

### `list_files`

List all files in a directory (recursive).

**Parameters**:
```typescript
{
  path: string;      // Relative path within project
  includeHidden?: boolean;
}
```

**Returns**:
```typescript
Array<{
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;      // Bytes
  modified: number;  // Unix timestamp
  wordCount?: number; // For text files
}>
```

**Example**:
```typescript
const files = await invoke('list_files', {
  path: 'manuscript',
  includeHidden: false,
});
```

---

### `read_file`

Read file contents.

**Parameters**:
```typescript
{
  path: string;  // Relative path within project
}
```

**Returns**:
```typescript
{
  content: string;
  metadata: {
    wordCount: number;
    characterCount: number;
    lineCount: number;
    modified: number;
  };
}
```

**Example**:
```typescript
const file = await invoke('read_file', {
  path: 'manuscript/chapter-01.md',
});
```

---

### `save_file`

Save file contents (atomic write).

**Parameters**:
```typescript
{
  path: string;
  content: string;
  createBackup?: boolean;  // Default: true
}
```

**Returns**: `void`

**Example**:
```typescript
await invoke('save_file', {
  path: 'manuscript/chapter-01.md',
  content: markdownContent,
  createBackup: true,
});
```

**Implementation notes**:
- Writes to temp file first
- Validates write succeeded
- Renames temp to target (atomic)
- Updates SQLite index
- Updates search index

---

### `create_file`

Create a new file.

**Parameters**:
```typescript
{
  path: string;
  type: 'markdown' | 'json' | 'txt';
  template?: string;  // Optional template ID
}
```

**Returns**:
```typescript
{
  id: string;
  path: string;
  created: number;
}
```

**Example**:
```typescript
const file = await invoke('create_file', {
  path: 'world/characters/protagonist.md',
  type: 'markdown',
  template: 'character-sheet',
});
```

---

### `delete_file`

Delete a file (with confirmation).

**Parameters**:
```typescript
{
  path: string;
  permanent?: boolean;  // Skip trash, default: false
}
```

**Returns**: `void`

**Example**:
```typescript
await invoke('delete_file', {
  path: 'drafts/old-chapter.md',
  permanent: false,  // Move to trash
});
```

---

### `move_file`

Move or rename a file.

**Parameters**:
```typescript
{
  from: string;
  to: string;
}
```

**Returns**: `void`

**Example**:
```typescript
await invoke('move_file', {
  from: 'drafts/ch01.md',
  to: 'manuscript/chapter-01.md',
});
```

---

## Search

### `search`

Full-text search across project.

**Parameters**:
```typescript
{
  query: string;
  filters?: {
    types?: string[];     // ['markdown', 'note']
    tags?: string[];
    dateRange?: {
      from: number;
      to: number;
    };
  };
  limit?: number;         // Default: 100
}
```

**Returns**:
```typescript
Array<{
  id: string;
  path: string;
  title: string;
  snippet: string;        // Highlighted match
  score: number;          // Relevance 0-1
  matches: Array<{
    lineNumber: number;
    text: string;
    ranges: [number, number][];  // Highlight positions
  }>;
}>
```

**Example**:
```typescript
const results = await invoke('search', {
  query: 'betrayal',
  filters: {
    types: ['markdown'],
    tags: ['chapter'],
  },
  limit: 50,
});
```

---

### `rebuild_search_index`

Rebuild search index from scratch (background task).

**Parameters**: None

**Returns**:
```typescript
{
  taskId: string;
}
```

**Example**:
```typescript
const { taskId } = await invoke('rebuild_search_index');

// Listen for progress
await listen('search-index-progress', (event) => {
  console.log(`Progress: ${event.payload.percent}%`);
});
```

---

## Canvas Operations

### `get_canvas`

Load canvas data for a project.

**Parameters**:
```typescript
{
  canvasId: string;  // Default: 'main'
}
```

**Returns**:
```typescript
{
  id: string;
  nodes: Array<{
    id: string;
    type: 'character' | 'scene' | 'location' | 'note';
    x: number;
    y: number;
    width: number;
    height: number;
    content: string;
    color?: string;
    linkedDocumentId?: string;
  }>;
  connections: Array<{
    id: string;
    fromNodeId: string;
    toNodeId: string;
    type: string;
    label?: string;
  }>;
}
```

**Example**:
```typescript
const canvas = await invoke('get_canvas', {
  canvasId: 'main',
});
```

---

### `save_canvas`

Save canvas state (nodes + connections).

**Parameters**:
```typescript
{
  canvasId: string;
  nodes: CanvasNode[];
  connections: Connection[];
}
```

**Returns**: `void`

**Example**:
```typescript
await invoke('save_canvas', {
  canvasId: 'main',
  nodes: currentNodes,
  connections: currentConnections,
});
```

---

### `create_node`

Create a single canvas node.

**Parameters**:
```typescript
{
  canvasId: string;
  node: {
    type: 'character' | 'scene' | 'location' | 'note';
    x: number;
    y: number;
    content: string;
  };
}
```

**Returns**:
```typescript
{
  id: string;  // Generated node ID
}
```

---

## Timeline Operations

### `get_timeline`

Load timeline events.

**Parameters**:
```typescript
{
  timelineId: string;  // Default: 'main'
}
```

**Returns**:
```typescript
{
  id: string;
  events: Array<{
    id: string;
    title: string;
    date: string;        // ISO 8601 or custom format
    duration?: number;
    description: string;
    linkedSceneId?: string;
    tags: string[];
  }>;
}
```

**Example**:
```typescript
const timeline = await invoke('get_timeline', {
  timelineId: 'main',
});
```

---

### `save_timeline_event`

Create or update timeline event.

**Parameters**:
```typescript
{
  event: TimelineEvent;
}
```

**Returns**:
```typescript
{
  id: string;
}
```

---

### `detect_timeline_conflicts`

Find overlapping or inconsistent events.

**Parameters**:
```typescript
{
  timelineId: string;
}
```

**Returns**:
```typescript
Array<{
  type: 'overlap' | 'age_inconsistency' | 'impossible_travel';
  eventIds: string[];
  description: string;
  severity: 'error' | 'warning';
}>
```

**Example**:
```typescript
const conflicts = await invoke('detect_timeline_conflicts', {
  timelineId: 'main',
});

conflicts.forEach(conflict => {
  console.warn(`Conflict: ${conflict.description}`);
});
```

---

## AI Integration

### `chat`

Send a chat message to AI provider (non-streaming).

**Parameters**:
```typescript
{
  provider: 'openai' | 'anthropic' | 'gemini' | 'local';
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  params?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}
```

**Returns**:
```typescript
{
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;  // USD estimate
}
```

**Example**:
```typescript
const response = await invoke('chat', {
  provider: 'anthropic',
  messages: [
    { role: 'system', content: 'You are a creative writing assistant.' },
    { role: 'user', content: 'Expand this beat: {{beat}}' },
  ],
  params: {
    model: 'claude-3-opus-20240229',
    temperature: 0.7,
    maxTokens: 600,
  },
});
```

---

### `chat_stream`

Send a chat message with streaming response.

**Parameters**: Same as `chat`

**Returns**: Stream of chunks

**Example**:
```typescript
import { listen } from '@tauri-apps/api/event';

// Start stream
const streamId = await invoke('chat_stream', { ...params });

// Listen for chunks
const unlisten = await listen(`chat-stream-${streamId}`, (event) => {
  const chunk = event.payload as string;
  appendToUI(chunk);
});

// Listen for completion
await listen(`chat-complete-${streamId}`, (event) => {
  unlisten();
  const { usage, cost } = event.payload;
  console.log(`Used ${usage.totalTokens} tokens, cost: $${cost}`);
});
```

---

### `run_recipe`

Execute an AI recipe (template + parameters).

**Parameters**:
```typescript
{
  recipeId: string;
  variables: Record<string, string>;  // Template variables
  provider?: string;  // Override default
}
```

**Returns**:
```typescript
{
  result: string;
  usage: TokenUsage;
  cost?: number;
}
```

**Example**:
```typescript
const result = await invoke('run_recipe', {
  recipeId: 'expand_beat',
  variables: {
    beat: 'She heard wolves approaching.',
    style: 'noir',
    pov: 'Mina',
  },
  provider: 'openai',
});
```

---

## Export Operations

### `export_markdown`

Export project or file as Markdown.

**Parameters**:
```typescript
{
  scope: 'file' | 'folder' | 'project';
  path?: string;  // Required if scope is file/folder
  includeMetadata?: boolean;
}
```

**Returns**:
```typescript
{
  outputPath: string;  // Path to exported file(s)
  fileCount: number;
  wordCount: number;
}
```

---

### `export_pdf`

Export as PDF with formatting options.

**Parameters**:
```typescript
{
  content: string;
  options: {
    paperSize: 'letter' | 'a4';
    margins: { top: number; bottom: number; left: number; right: number };
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    includePageNumbers: boolean;
    includeToc: boolean;
  };
}
```

**Returns**:
```typescript
{
  outputPath: string;
  pageCount: number;
  sizeBytes: number;
}
```

**Example**:
```typescript
const pdf = await invoke('export_pdf', {
  content: markdownContent,
  options: {
    paperSize: 'letter',
    margins: { top: 72, bottom: 72, left: 72, right: 72 },
    fontSize: 12,
    fontFamily: 'Times New Roman',
    lineHeight: 1.5,
    includePageNumbers: true,
    includeToc: true,
  },
});
```

---

## Background Tasks

### `get_task_status`

Get status of a long-running task.

**Parameters**:
```typescript
{
  taskId: string;
}
```

**Returns**:
```typescript
{
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;  // 0-100
  message?: string;
  error?: string;
}
```

**Example**:
```typescript
const status = await invoke('get_task_status', {
  taskId: 'search-rebuild-123',
});

if (status.status === 'failed') {
  console.error(status.error);
}
```

---

## Error Handling

All commands return `Result<T, String>` in Rust. Frontend handles errors with try/catch:

```typescript
try {
  await invoke('save_file', { path, content });
} catch (error) {
  // error is a string from Rust
  showNotification({
    type: 'error',
    message: `Failed to save: ${error}`,
  });
}
```

**Common error patterns**:
- `"Path traversal detected"` - Security violation
- `"File not found: {path}"` - Missing file
- `"Permission denied"` - Can't write to path
- `"Invalid JSON"` - Parsing error
- `"API key not found"` - Missing AI credentials

---

## Event System

Tauri supports event-based communication for background tasks:

**Frontend (listen)**:
```typescript
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen('file-changed', (event) => {
  const { path } = event.payload;
  console.log(`File changed: ${path}`);
  refreshFileInUI(path);
});

// Later: cleanup
unlisten();
```

**Backend (emit)**:
```rust
use tauri::Manager;

#[tauri::command]
async fn watch_files(app: tauri::AppHandle) -> Result<(), String> {
    tokio::spawn(async move {
        // File watcher loop
        app.emit_all("file-changed", FileChangePayload { path: "...".into() }).unwrap();
    });
    Ok(())
}
```

**Common events**:
- `file-changed` - File modified on disk
- `search-index-progress` - Search indexing progress
- `export-progress` - Export task progress
- `ai-stream-chunk` - AI response streaming

---

## Performance Notes

- **Debounce saves**: Frontend should debounce save calls (500ms)
- **Batch operations**: Use `save_canvas` over multiple `create_node` calls
- **Incremental search**: Search index updates incrementally on file save
- **Background tasks**: Long operations (export, index rebuild) run async with progress events

---

**Next**: See `06_Schema.md` for database structure and data models.
