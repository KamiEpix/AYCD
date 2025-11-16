# System Architecture


This document describes the high-level and low-level architecture of AYCD, including core design decisions, data flow, and performance budgets.

## High-Level Overview

```
┌──────────────────────────────────────────────────────────┐
│                     Svelte 5 Frontend                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Editor  │  │  Canvas  │  │ Timeline │  │  Search  │  │
│  │ (Plate)  │  │ (Konva)  │  │ (Custom) │  │  (UI)    │  │
│  └────┬─────┘  └────┬─────┘  └─────┬────┘  └─────┬────┘  │
│       └────────────┬┴────────────┬─┘             │       │
│                    │   Tauri IPC │               │       │
├────────────────────┼─────────────┼───────────────┼───────┤
│                    ▼             ▼               ▼       │
│               Rust Backend (Tauri)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   File   │  │ Database │  │  Search  │  │    AI    │  │
│  │  System  │  │ (SQLite) │  │(Tantivy) │  │ Adapters │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Local Storage  │
                  │  ~/AYCD/        │
                  │  - projects/    │
                  │  - .aycd/       │
                  └─────────────────┘
```

## Core Architectural Decisions

### 1. Local-First Data Model

**Decision**: All data stored locally as human-readable files + SQLite index

**Rationale**:
- User owns their data
- Works offline by default
- Survives app uninstall
- Version control friendly (Git)
- Fast random access via index

**Structure**:
```
~/AYCD/
 └── projects/
 	 ├── my-novel/
	 │	 ├── WORLD/
	 │	 │   ├── Cast/          (Characters & NPCs)
	 │	 │   ├── Places/        (Locations & Geography)
	 │	 │   ├── Objects/       (Items, Artifacts, Technology)
	 │	 │   ├── Systems/       (Magic systems, Politics, Economics)
	 │	 │   └── Lore/          (History, Mythology, Culture)
	 │	 └── NARRATIVE/
	 │	     ├── Drafts/        (Active writing)
	 │	     ├── Final/         (Completed works)
	 │	     ├── Research/      (Notes & references)
	 │	     └── Planning/      (Outlines & structure)
     ├── project.json           # Project metadata
     ├── index.sqlite           # Fast lookup index
     ├── search/                # Tantivy search index
     └── cache/                 # Temporary data
```



### 2. Hybrid Rendering Architecture

**Decision**: Svelte 5 shell + React islands for rich text editing

**Rationale**:
- Svelte 5 runes = minimal bundle, reactive primitives
- Plate.js (React) = best-in-class rich text editor
- Web Components bridge = zero framework conflicts
- Each system optimized for its strength

**Implementation**:
```typescript
// Svelte wraps React editor as Web Component
import { PlateEditor } from '@aycd/editor';

<PlateEditor 
  content={$currentDocument}
  onChange={handleChange}
/>
```

### 3. Tauri IPC Layer

**Decision**: All file/DB operations go through Rust commands

**Rationale**:
- Security: sandboxed file access
- Performance: parallel I/O in Rust
- Type safety: shared TypeScript types
- Error handling: Result<T, E> pattern

**Pattern**:
```rust
// Backend
#[tauri::command]
async fn save_document(
    path: String,
    content: String,
) -> Result<(), String> {
    // Validation + atomic write
}

// Frontend
await invoke('save_document', { path, content });
```

### 4. Database Strategy

**SQLite for indexing, files for source of truth**

**Rationale**:
- Files = portable, readable, version-controllable
- SQLite = fast queries, relations, full-text search prep
- Rebuilding index from files is always possible

**Schema Philosophy**:
```sql
-- Documents table is a CACHE, not source of truth
CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL UNIQUE,
    title TEXT,
    word_count INTEGER,
    modified_at INTEGER,
    -- Indexed for fast queries
    INDEX idx_modified (modified_at)
);
```

### 5. Canvas Architecture

**Decision**: Konva.js for 2D rendering, quadtree for hit detection

**Rationale**:
- GPU acceleration for 60fps
- Object pooling for memory efficiency
- Spatial indexing for large canvases (1000+ nodes)
- Layer-based rendering for complexity isolation

**Performance Budget**:
- Initial render: <100ms for 500 nodes
- Pan/zoom: 60fps minimum
- Node creation: <16ms (single frame)
- Memory: <2MB per 100 nodes

### 6. Search Architecture

**Decision**: Tantivy for full-text, SQLite for structured queries

**Rationale**:
- Tantivy = Rust-native, fast, small index size
- Incremental updates via file watcher
- Search-as-you-type with <50ms P95
- Faceted search (by type, date, status, etc.)

**Index Strategy**:
```rust
// Documents indexed on save
struct DocumentIndex {
    id: String,
    content: String,      // Full text
    title: String,        // Boosted field
    tags: Vec<String>,    // Facet
    created: DateTime,    // Range filter
}
```

### 7. AI Integration

**Decision**: Adapter pattern for multiple providers, local-first preference

**Rationale**:
- No vendor lock-in
- Privacy: prefer local models
- Flexibility: swap providers per task
- Transparency: log all prompts/responses

**Adapter Interface**:
```typescript
interface AIProvider {
  chat(messages: Message[], params: ChatParams): Promise<string>;
  chatStream(messages: Message[], params: ChatParams): AsyncIterator<string>;
  tokenCount(text: string): number;
  costEstimate(tokens: number): number;
}
```

## Data Flow Examples

### Document Save Flow

```
User types in editor
    │
    ▼
Debounced onChange (500ms)
    │
    ▼
Svelte store update
    │
    ▼
invoke('save_document') ──────────┐
    │                              │
    ▼                              ▼
Rust validates path          Update SQLite index
    │                              │
    ▼                              ▼
Atomic file write           Update search index
    │                              │
    ▼                              ▼
Success ◄────────────────── Broadcast file change
    │
    ▼
UI confirmation
```

### Search Flow

```
User types query
    │
    ▼
Debounced input (150ms)
    │
    ▼
invoke('search') ──────────┐
    │                       │
    ▼                       ▼
Tantivy query         Parse filters
    │                       │
    ▼                       ▼
Get results (IDs)    Apply facets
    │                       │
    ▼                       ▼
SQLite JOIN for metadata
    │
    ▼
Return ranked results
    │
    ▼
Render in UI with highlights
```

### Canvas Render Flow

```
Load project
    │
    ▼
invoke('get_canvas_data')
    │
    ▼
Konva stage initialization
    │
    ▼
Create layers (Background, Nodes, Connections, UI)
    │
    ▼
Render visible viewport only ──┐
    │                            │
    ▼                            │
Object pooling for nodes        │
    │                            │
    ▼                            │
GPU-accelerated transform       │
    │                            │
    ▼                            │
60fps render loop ◄─────────────┘
```

## Performance Optimizations

### 1. Lazy Loading

- Canvas nodes: only render viewport +20% buffer
- Documents: load metadata first, content on demand
- Search index: incremental updates, not full rebuilds
- Images: progressive loading with blurhash placeholders

### 2. Caching Strategy

```rust
// Three-tier cache
L1: In-memory LRU (recent documents)
L2: SQLite (indexed metadata)
L3: Filesystem (source of truth)
```

### 3. Debouncing & Throttling

- File saves: 500ms debounce
- Search input: 150ms debounce
- Canvas pan: 16ms throttle (60fps)
- Window resize: 250ms debounce

### 4. Background Processing

```rust
// Tokio tasks for non-blocking operations
tokio::spawn(async move {
    rebuild_search_index().await;
});
```

## Security Considerations

### 1. Path Validation

```rust
fn validate_path(path: &str, project_root: &Path) -> Result<PathBuf, Error> {
    let canonical = fs::canonicalize(path)?;
    if !canonical.starts_with(project_root) {
        return Err(Error::PathTraversal);
    }
    Ok(canonical)
}
```

### 2. IPC Sandboxing

- All file operations go through Tauri commands
- No direct filesystem access from frontend
- Path traversal prevention
- Rate limiting on expensive operations

### 3. AI Provider Security

- API keys stored in OS keychain (not files)
- Per-project provider allowlist
- Request/response logging for audit
- No data sent without explicit user action

## Scalability Limits

### Current Architecture Supports

- Projects: 1000+ files
- Document size: 10MB+ per file
- Canvas nodes: 2000+ visible objects
- Search corpus: 100MB+ indexed content
- Concurrent operations: 10+ simultaneous

### Known Bottlenecks

1. **SQLite write locks**: Single writer at a time
   - Mitigation: Batch updates, use WAL mode
2. **Canvas memory**: Linear growth with node count
   - Mitigation: Object pooling, viewport culling
3. **Search index size**: Grows with corpus
   - Mitigation: Compression, periodic optimization

## Future Architecture Considerations

### Phase 2 (Optional)

- **CRDT sync**: For multi-device collaboration
- **Vector embeddings**: For semantic search
- **Plugin system**: WASM-based extensions
- **Cloud backup**: E2EE optional sync

### Phase 3 (Possible)

- **Mobile apps**: React Native with shared core
- **Web version**: WASM + IndexedDB
- **Real-time collab**: WebRTC peer-to-peer

---

**Design Philosophy**: Optimize for the 90% use case (single user, local machine, <1000 files). Make rare use cases (huge projects, collaboration) possible but not required.
