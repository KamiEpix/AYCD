# Database Schema & Data Models


This document describes the storage model for AYCD, including the SQLite schema and the corresponding TypeScript data models.

## Storage Architecture

AYCD uses a **hybrid storage model**:

1. **Files (Source of Truth)**: Markdown files for human-readable content
2. **SQLite (Index)**: Fast queries, relations, metadata
3. **Tantivy (Search)**: Full-text search index

```
Files (.md, .json)  →  SQLite (index)  →  Tantivy (search)
   ↑                       ↓
   └────── Rebuild ────────┘
```

**Philosophy**: Files are portable and survive the app. SQLite is a *cache* that can always be rebuilt.

---

## SQLite Schema

Location: `{project}/.aycd/index.sqlite`

### Projects Table

```sql
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    last_opened INTEGER,
    settings TEXT,  -- JSON blob
    CONSTRAINT valid_path CHECK (length(path) > 0)
);

CREATE INDEX idx_projects_last_opened ON projects(last_opened DESC);
```

**TypeScript Model**:
```typescript
interface Project {
  id: string;
  name: string;
  path: string;
  createdAt: number;
  lastOpened: number | null;
  settings: ProjectSettings;
}

interface ProjectSettings {
  defaultView: 'editor' | 'canvas' | 'timeline';
  theme: 'light' | 'dark' | 'auto';
  aiProvider: string | null;
  wordCountGoal: number | null;
}
```

---

### Documents Table

```sql
CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    path TEXT NOT NULL,        -- Relative to project root
    parent_id TEXT,             -- For hierarchical structure
    type TEXT NOT NULL,         -- 'chapter', 'scene', 'character', etc.
    title TEXT NOT NULL,
    content TEXT,               -- Full content (optional, for speed)
    word_count INTEGER DEFAULT 0,
    character_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',  -- 'draft', 'revision', 'final'
    order_index INTEGER,        -- For manual ordering
    created_at INTEGER NOT NULL,
    modified_at INTEGER NOT NULL,
    tags TEXT,                  -- JSON array
    metadata TEXT,              -- JSON blob for custom fields
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_parent ON documents(parent_id);
CREATE INDEX idx_documents_type ON documents(project_id, type);
CREATE INDEX idx_documents_modified ON documents(modified_at DESC);
CREATE INDEX idx_documents_status ON documents(status);
CREATE UNIQUE INDEX idx_documents_path ON documents(project_id, path);
```

**TypeScript Model**:
```typescript
interface Document {
  id: string;
  projectId: string;
  path: string;
  parentId: string | null;
  type: DocumentType;
  title: string;
  content?: string;  // May be lazy-loaded
  wordCount: number;
  characterCount: number;
  status: 'draft' | 'revision' | 'final';
  orderIndex: number;
  createdAt: number;
  modifiedAt: number;
  tags: string[];
  metadata: Record<string, any>;
}

type DocumentType = 
  | 'chapter'
  | 'scene'
  | 'character'
  | 'location'
  | 'object'
  | 'note'
  | 'research';
```

---

### Canvas Tables

#### Canvas Nodes

```sql
CREATE TABLE canvas_nodes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    canvas_id TEXT NOT NULL DEFAULT 'main',
    type TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    width REAL NOT NULL DEFAULT 200,
    height REAL NOT NULL DEFAULT 150,
    content TEXT,
    color TEXT,
    linked_document_id TEXT,
    metadata TEXT,  -- JSON for custom properties
    created_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_document_id) REFERENCES documents(id) ON DELETE SET NULL
);

CREATE INDEX idx_canvas_nodes_project ON canvas_nodes(project_id, canvas_id);
CREATE INDEX idx_canvas_nodes_linked ON canvas_nodes(linked_document_id);
```

**TypeScript Model**:
```typescript
interface CanvasNode {
  id: string;
  projectId: string;
  canvasId: string;
  type: 'character' | 'scene' | 'location' | 'note';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color?: string;
  linkedDocumentId?: string;
  metadata: Record<string, any>;
  createdAt: number;
}
```

#### Canvas Connections

```sql
CREATE TABLE canvas_connections (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    canvas_id TEXT NOT NULL DEFAULT 'main',
    from_node_id TEXT NOT NULL,
    to_node_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'relationship',
    label TEXT,
    color TEXT,
    metadata TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (from_node_id) REFERENCES canvas_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (to_node_id) REFERENCES canvas_nodes(id) ON DELETE CASCADE
);

CREATE INDEX idx_canvas_connections_project ON canvas_connections(project_id, canvas_id);
CREATE INDEX idx_canvas_connections_from ON canvas_connections(from_node_id);
CREATE INDEX idx_canvas_connections_to ON canvas_connections(to_node_id);
```

**TypeScript Model**:
```typescript
interface CanvasConnection {
  id: string;
  projectId: string;
  canvasId: string;
  fromNodeId: string;
  toNodeId: string;
  type: 'relationship' | 'conflict' | 'dependency' | 'influence';
  label?: string;
  color?: string;
  metadata: Record<string, any>;
  createdAt: number;
}
```

---

### Timeline Tables

#### Timeline Events

```sql
CREATE TABLE timeline_events (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    timeline_id TEXT NOT NULL DEFAULT 'main',
    title TEXT NOT NULL,
    date TEXT NOT NULL,       -- ISO 8601 or custom format
    duration INTEGER,          -- In seconds
    description TEXT,
    linked_scene_id TEXT,
    tags TEXT,                 -- JSON array
    metadata TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_scene_id) REFERENCES documents(id) ON DELETE SET NULL
);

CREATE INDEX idx_timeline_events_project ON timeline_events(project_id, timeline_id);
CREATE INDEX idx_timeline_events_date ON timeline_events(date);
CREATE INDEX idx_timeline_events_linked ON timeline_events(linked_scene_id);
```

**TypeScript Model**:
```typescript
interface TimelineEvent {
  id: string;
  projectId: string;
  timelineId: string;
  title: string;
  date: string;  // ISO 8601: "2025-11-15T14:30:00Z" or custom
  duration?: number;  // Seconds
  description: string;
  linkedSceneId?: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: number;
}
```

#### Timelines

```sql
CREATE TABLE timelines (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    calendar_system TEXT DEFAULT 'gregorian',
    is_default BOOLEAN DEFAULT 0,
    color TEXT,
    metadata TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_timelines_project ON timelines(project_id);
CREATE UNIQUE INDEX idx_timelines_default ON timelines(project_id, is_default) WHERE is_default = 1;
```

**TypeScript Model**:
```typescript
interface Timeline {
  id: string;
  projectId: string;
  name: string;
  calendarSystem: 'gregorian' | 'custom';
  isDefault: boolean;
  color?: string;
  metadata: Record<string, any>;
  createdAt: number;
}
```

---

### Tags Table

```sql
CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, name)
);

CREATE INDEX idx_tags_project ON tags(project_id);
```

**TypeScript Model**:
```typescript
interface Tag {
  id: string;
  projectId: string;
  name: string;
  color?: string;
  createdAt: number;
}
```

---

### AI Logs Table

```sql
CREATE TABLE ai_logs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    cost REAL,  -- USD
    created_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_logs_project ON ai_logs(project_id, created_at DESC);
CREATE INDEX idx_ai_logs_provider ON ai_logs(provider);
```

**TypeScript Model**:
```typescript
interface AILog {
  id: string;
  projectId: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'local';
  model: string;
  prompt: string;
  response: string;
  promptTokens: number;
  completionTokens: number;
  cost: number | null;
  createdAt: number;
}
```

---

## Tantivy Search Index

Location: `{project}/.aycd/search/`

**Index Schema**:
```rust
use tantivy::schema::*;

fn build_schema() -> Schema {
    let mut schema_builder = Schema::builder();
    
    schema_builder.add_text_field("id", STRING | STORED);
    schema_builder.add_text_field("path", STRING | STORED);
    schema_builder.add_text_field("title", TEXT | STORED);
    schema_builder.add_text_field("content", TEXT);
    schema_builder.add_text_field("type", STRING | STORED);
    schema_builder.add_text_field("tags", TEXT);
    schema_builder.add_i64_field("modified_at", INDEXED | STORED);
    
    schema_builder.build()
}
```

**Indexed Fields**:
- `id`: Document ID (unique)
- `path`: File path (for linking)
- `title`: Document title (boosted in search)
- `content`: Full text content
- `type`: Document type (for filtering)
- `tags`: Space-separated tags
- `modified_at`: Unix timestamp (for date range)

**Search Query Examples**:
```rust
// Simple query
let query = query_parser.parse_query("betrayal")?;

// With filters
let query = query_parser.parse_query("betrayal AND type:scene AND modified_at:[2025-01-01 TO 2025-12-31]")?;

// Phrase search
let query = query_parser.parse_query("\"she heard wolves\"")?;
```

---

## File System Structure

```
{project_root}/
├── manuscript/
│   ├── chapter-01.md
│   ├── chapter-02.md
│   └── ...
├── world/
│   ├── characters/
│   │   ├── protagonist.md
│   │   └── antagonist.md
│   ├── locations/
│   │   ├── city-one.md
│   │   └── forest.md
│   └── objects/
│       └── magic-sword.md
├── research/
│   └── references.md
└── .aycd/
    ├── project.json        # Project metadata
    ├── config.json         # User preferences
    ├── index.sqlite        # Database index
    ├── search/             # Tantivy index
    │   ├── .managed.json
    │   └── meta.json
    └── cache/              # Temporary data
        └── thumbnails/
```

**project.json**:
```json
{
  "id": "proj_abc123",
  "name": "My Novel",
  "version": "1.0.0",
  "created": 1700000000000,
  "template": "novel",
  "settings": {
    "defaultView": "editor",
    "theme": "dark",
    "wordCountGoal": 50000
  }
}
```

**config.json**:
```json
{
  "aiProviders": {
    "default": "anthropic",
    "openai": {
      "model": "gpt-4o-mini",
      "temperature": 0.7
    },
    "anthropic": {
      "model": "claude-3-opus-20240229",
      "temperature": 0.7
    }
  },
  "editor": {
    "fontSize": 16,
    "fontFamily": "iA Writer Mono",
    "lineHeight": 1.6
  }
}
```

---

## Data Consistency Rules

### 1. File → Database Sync

- **On file save**: Update SQLite + Tantivy immediately
- **On file delete**: Remove from SQLite + Tantivy
- **On file move**: Update path in SQLite

### 2. Database → File Validation

- **On app start**: Check all database paths exist
- **If missing**: Mark as deleted or prompt user
- **Rebuild option**: Scan files, rebuild database

### 3. Conflict Resolution

- **File modified externally**: Detect via mtime, prompt user
- **Database out of sync**: Trust file, rebuild index
- **Concurrent saves**: Last write wins (warn user)

---

## Migration Strategy

**Schema Versioning**:
```sql
CREATE TABLE schema_version (
    version INTEGER PRIMARY KEY,
    applied_at INTEGER NOT NULL
);
```

**Migration Example**:
```rust
async fn migrate_to_v2(db: &Database) -> Result<(), Error> {
    let current = get_schema_version(db).await?;
    
    if current < 2 {
        db.execute("ALTER TABLE documents ADD COLUMN order_index INTEGER").await?;
        db.execute("INSERT INTO schema_version (version, applied_at) VALUES (2, ?)", [now()]).await?;
    }
    
    Ok(())
}
```

---

## Performance Optimization

### 1. Indexes

- Create indexes on frequently queried columns
- Use compound indexes for common filter combinations
- Avoid indexes on high-cardinality text fields

### 2. Caching

```rust
use lru::LruCache;

struct DocumentCache {
    cache: LruCache<String, Document>,  // ID -> Document
}

impl DocumentCache {
    fn new() -> Self {
        Self {
            cache: LruCache::new(100.try_into().unwrap()),
        }
    }
    
    async fn get(&mut self, id: &str, db: &Database) -> Result<Document, Error> {
        if let Some(doc) = self.cache.get(id) {
            return Ok(doc.clone());
        }
        
        let doc = fetch_from_db(id, db).await?;
        self.cache.put(id.to_string(), doc.clone());
        Ok(doc)
    }
}
```

### 3. Batch Operations

```rust
// Bad: N queries
for doc in documents {
    save_document(db, &doc).await?;
}

// Good: Single transaction
let tx = db.begin().await?;
for doc in documents {
    save_document_tx(&tx, &doc).await?;
}
tx.commit().await?;
```

---

## Backup Strategy

### 1. Automatic Backups

- **On save**: Create `.bak` file (last 3 versions kept)
- **Daily**: ZIP entire project to `~/.aycd/backups/`
- **Before risky operations**: Full backup

### 2. Restore

```rust
#[tauri::command]
async fn restore_backup(backup_path: PathBuf, target_path: PathBuf) -> Result<(), String> {
    // Validate backup
    validate_zip(&backup_path)?;
    
    // Extract to temp
    let temp = extract_to_temp(&backup_path)?;
    
    // Verify integrity
    verify_project_structure(&temp)?;
    
    // Move to target
    fs::rename(temp, target_path)?;
    
    Ok(())
}
```

---

**Next**: See `07_UI_Guide.md` for component library and design system.
```

I'll create the remaining 3 documentation files to complete the set.
