# Feature Specifications


This document specifies the major features of AYCD, grouped into tiers from the minimal viable product through future releases.

---

## 1. Project Management

### ✅ Tier 1: Core Project Operations

#### 1.1 Project Creation

**User Story**: As a writer, I want to create a new project so I can start organizing my work.

**Acceptance Criteria**:
- Click "New Project" button
- Enter project name and select location
- Choose template (Blank, Novel, Screenplay, etc.)
- Project folder structure is created automatically
- SQLite database is initialized
- Project opens immediately

**Technical Implementation**:
```typescript
// Tauri command
#[tauri::command]
async fn create_project(
    name: String,
    path: PathBuf,
    template: ProjectTemplate,
) -> Result<Project, String>

// Frontend call
const project = await invoke('create_project', {
  name: 'My Novel',
  path: '~/Documents/AYCD/my-novel',
  template: 'novel'
});
```

**File Structure Created**:
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

#### 1.2 Project Opening

**User Story**: As a writer, I want to open recent projects quickly.

**Acceptance Criteria**:
- Recent projects list on welcome screen
- Double-click to open
- Opens in <2 seconds for typical projects
- Restores last-opened files and scroll position
- Handles corrupted databases gracefully

**Performance Requirements**:
- Load project metadata: <100ms
- Initialize SQLite: <200ms
- Render UI: <500ms
- Total: <2s cold start

#### 1.3 File Organization

**User Story**: As a writer, I want to organize files in folders.

**Acceptance Criteria**:
- Sidebar tree view (folders + files)
- Drag-and-drop to move files
- Create/rename/delete folders
- Icons for file types
- Keyboard navigation (j/k, Enter to open)

**File Operations**:
```rust
#[tauri::command]
async fn create_file(path: PathBuf, file_type: FileType) -> Result<File, String>

#[tauri::command]
async fn move_file(from: PathBuf, to: PathBuf) -> Result<(), String>

#[tauri::command]
async fn delete_file(path: PathBuf) -> Result<(), String>
```

### 🔄 Tier 2: Enhanced Organization

#### 1.4 Tags and Metadata

**User Story**: As a writer, I want to tag files for flexible organization.

**Features**:
- Add multiple tags to any file
- Color-coded tags
- Filter by tags in sidebar
- Tag suggestions based on file content

#### 1.5 Search and Filter

**User Story**: As a writer, I want to find files instantly.

**Features**:
- Global search (Cmd/Ctrl+P)
- Search within project
- Filter by type, date, tags, status
- Search results preview

### 🚀 Tier 3: Advanced Management

#### 1.6 Git Integration

**User Story**: As a writer, I want version control for my work.

**Features**:
- Initialize Git repository
- Commit from UI
- View history
- Branch for experimental edits

---

## 2. Writing Engine

### ✅ Tier 1: Core Editor

#### 2.1 Rich Text Editing

**User Story**: As a writer, I want a distraction-free editor with Markdown support.

**Acceptance Criteria**:
- Markdown syntax highlighting
- Live preview (optional)
- Auto-save every 5 seconds
- Undo/redo with full history
- Word count in status bar
- Focus mode (hide sidebar)

**Editor Implementation**:
```typescript
// Plate.js configuration
import { createPlateEditor } from '@platejs/core';

const editor = createPlateEditor({
  plugins: [
    createParagraphPlugin(),
    createHeadingPlugin(),
    createBoldPlugin(),
    createItalicPlugin(),
    createCodeBlockPlugin(),
    // ... more plugins
  ],
  value: initialContent,
  onChange: (value) => {
    debouncedSave(value);
  },
});
```

**Performance Requirements**:
- Render 10,000+ words without lag
- Typing latency: <16ms (60fps)
- Auto-save: debounced 500ms
- Memory: <50MB per document

#### 2.2 Chapter/Scene Organization

**User Story**: As a writer, I want to organize my writing into chapters and scenes.

**Acceptance Criteria**:
- Hierarchical document structure
- Drag-and-drop reordering in outline
- Collapsible sections
- Quick navigation between scenes
- Automatic word count per section

**Data Model**:
```typescript
interface Document {
  id: string;
  title: string;
  type: 'chapter' | 'scene' | 'note';
  parentId?: string;
  order: number;
  wordCount: number;
  status: 'draft' | 'revision' | 'final';
  content: string; // Markdown
}
```

#### 2.3 Distraction-Free Mode

**User Story**: As a writer, I want to hide all UI and just write.

**Acceptance Criteria**:
- Keyboard shortcut (F11) to toggle
- Hide sidebar, toolbar, status bar
- Optional typewriter mode (cursor stays centered)
- Optional dark background
- Exit with same shortcut or Esc

### 🔄 Tier 2: Writing Assistance

#### 2.4 Goal Tracking

**User Story**: As a writer, I want to set word count goals.

**Features**:
- Daily word count goal
- Session timer
- Progress bar in status bar
- Streak tracking
- Goal completion notifications

#### 2.5 Style Analysis

**User Story**: As a writer, I want insights into my writing patterns.

**Features**:
- Sentence length distribution
- Passive voice detection
- Adverb usage heatmap
- Dialogue ratio
- Reading level estimation

**Implementation**:
```rust
#[tauri::command]
async fn analyze_document(path: PathBuf) -> Result<StyleAnalysis, String> {
    let content = fs::read_to_string(path)?;
    
    Ok(StyleAnalysis {
        word_count: count_words(&content),
        sentence_count: count_sentences(&content),
        avg_sentence_length: calculate_avg_sentence_length(&content),
        passive_voice_count: detect_passive_voice(&content),
        // ... more metrics
    })
}
```

#### 2.6 Find and Replace

**User Story**: As a writer, I want powerful search and replace.

**Features**:
- Case-sensitive/insensitive search
- Regex support
- Replace in selection or entire project
- Find in all files
- Preview replacements before applying

### 🚀 Tier 3: Advanced Writing Tools

#### 2.7 Comments and Annotations

**User Story**: As a writer, I want to leave notes without cluttering my text.

**Features**:
- Inline comments (like Google Docs)
- Threaded discussions
- Resolve/unresolve comments
- Tag collaborators (if applicable)

#### 2.8 Version Comparison

**User Story**: As a writer, I want to compare drafts.

**Features**:
- Side-by-side diff view
- Word-level changes highlighted
- Accept/reject changes
- Merge tool for conflicts

---

## 3. Canvas/Visual Mode

### ✅ Tier 1: Core Canvas

#### 3.1 Infinite Canvas

**User Story**: As a writer, I want a visual space to map my story.

**Acceptance Criteria**:
- Infinite 2D canvas (pan and zoom)
- Smooth 60fps interactions
- Mini-map for navigation
- Grid (optional, toggle)
- Dark/light theme support

**Technical Implementation**:
```typescript
// Konva configuration
import Konva from 'konva';

const stage = new Konva.Stage({
  container: 'canvas-container',
  width: window.innerWidth,
  height: window.innerHeight,
  draggable: true, // Enable panning
});

// Layers
const backgroundLayer = new Konva.Layer();
const nodesLayer = new Konva.Layer();
const connectionsLayer = new Konva.Layer();
const uiLayer = new Konva.Layer();
```

**Performance Budget**:
- 60fps panning/zooming
- 1000+ nodes without degradation
- Initial load: <500ms
- Memory: <2MB per 100 nodes

#### 3.2 Node Creation

**User Story**: As a writer, I want to create cards for characters, scenes, and locations.

**Acceptance Criteria**:
- Double-click to create node
- Choose node type (Character, Scene, Location, Note)
- Resize and position nodes
- Edit content inline or in sidebar
- Auto-layout option (grid, hierarchical)

**Node Types**:
```typescript
interface CanvasNode {
  id: string;
  type: 'character' | 'scene' | 'location' | 'note';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color?: string;
  linkedDocumentId?: string; // Link to manuscript file
}
```

#### 3.3 Connections

**User Story**: As a writer, I want to show relationships between elements.

**Acceptance Criteria**:
- Drag between nodes to create connection
- Connection types (relationship, conflict, dependency, etc.)
- Directional arrows
- Label connections
- Delete connections

**Implementation**:
```typescript
interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: 'relationship' | 'conflict' | 'dependency';
  label?: string;
  color?: string;
}
```

### 🔄 Tier 2: Advanced Canvas

#### 3.4 Groups and Layers

**User Story**: As a writer, I want to organize nodes into groups.

**Features**:
- Select multiple nodes
- Create group (visual container)
- Collapse/expand groups
- Layer management (z-index)
- Lock nodes to prevent accidental moves

#### 3.5 Templates and Presets

**User Story**: As a writer, I want reusable canvas layouts.

**Features**:
- Save canvas as template
- Pre-built templates (character arcs, plot structure, etc.)
- Import/export canvas as JSON

#### 3.6 Image Import

**User Story**: As a writer, I want to add images for visual reference.

**Features**:
- Drag-and-drop images onto canvas
- World map annotations
- Mood boards
- Reference art

### 🚀 Tier 3: Interactive Canvas

#### 3.7 Filters and Views

**User Story**: As a writer, I want to filter what I see on the canvas.

**Features**:
- Show/hide by node type
- Filter by tag or status
- Timeline view (nodes arranged chronologically)
- Focus mode (dim unrelated nodes)

---

## 4. Timeline

### ✅ Tier 1: Basic Timeline

#### 4.1 Event Creation

**User Story**: As a writer, I want to organize events chronologically.

**Acceptance Criteria**:
- Create events with date/time
- Multiple timelines (main plot, subplots, character arcs)
- Drag events to reorder
- Link events to scenes
- Detect conflicts (overlapping events)

**Data Model**:
```typescript
interface TimelineEvent {
  id: string;
  title: string;
  date: string; // ISO 8601 or custom calendar
  duration?: number; // In minutes/hours/days
  description: string;
  linkedSceneId?: string;
  timelineId: string;
  tags: string[];
}
```

#### 4.2 Multi-Scale View

**User Story**: As a writer, I want to zoom from centuries to minutes.

**Acceptance Criteria**:
- Zoom levels: year, month, day, hour
- Scroll to navigate time
- Jump to date
- Today marker (if applicable)

### 🔄 Tier 2: Advanced Timeline

#### 4.3 Character Lanes

**User Story**: As a writer, I want to see each character's timeline.

**Features**:
- Separate lane per character
- POV indicators
- Age calculation
- Highlight overlaps (characters in same scene)

#### 4.4 Custom Calendars

**User Story**: As a fantasy writer, I want custom calendars.

**Features**:
- Define months, days, holidays
- Multiple calendars (e.g., two warring nations)
- Convert between calendars
- Season/moon phase overlays

### 🚀 Tier 3: Timeline Intelligence

#### 4.5 Conflict Detection

**User Story**: As a writer, I want to catch timeline errors.

**Features**:
- Impossible overlaps (character in two places)
- Age inconsistencies
- Historical accuracy checks (if using real dates)
- Suggestions for fixes

---

## 5. Search

### ✅ Tier 1: Core Search

#### 5.1 Full-Text Search

**User Story**: As a writer, I want to find any text in my project.

**Acceptance Criteria**:
- Search across all files
- Highlight matches in results
- Preview context (2 lines before/after)
- Jump to result in editor
- Search-as-you-type (150ms debounce)
- Performance: <50ms P95 for 100k+ words

**Technical Implementation**:
```rust
// Tantivy search
use tantivy::Index;

#[tauri::command]
async fn search(query: String, filters: SearchFilters) -> Result<Vec<SearchResult>, String> {
    let index = Index::open_in_dir(&index_path)?;
    let searcher = index.reader()?.searcher();
    
    // Parse query
    let query = query_parser.parse_query(&query)?;
    
    // Execute search
    let results = searcher.search(&query, &TopDocs::with_limit(100))?;
    
    // Map to SearchResult structs
    Ok(map_results(results))
}
```

#### 5.2 Filters

**User Story**: As a writer, I want to narrow search results.

**Acceptance Criteria**:
- Filter by file type (Character, Scene, Note, etc.)
- Filter by date range
- Filter by tags
- Filter by status (Draft, Revision, Final)
- Combine filters (AND/OR logic)

### 🔄 Tier 2: Enhanced Search

#### 5.3 Regex Search

**User Story**: As a power user, I want regex patterns.

**Features**:
- Regex mode toggle
- Syntax highlighting for regex
- Common pattern shortcuts
- Replace with regex

#### 5.4 Search History

**User Story**: As a writer, I want to reuse recent searches.

**Features**:
- Recent searches dropdown
- Save searches as named queries
- Pin frequent searches

### 🚀 Tier 3: Semantic Search

#### 5.5 AI-Powered Search

**User Story**: As a writer, I want to search by meaning, not just keywords.

**Features**:
- Vector embeddings for semantic similarity
- "Find similar scenes" feature
- Concept search ("scenes with betrayal themes")

---

## 6. Export

### ✅ Tier 1: Basic Export

#### 6.1 Markdown Export

**User Story**: As a writer, I want to export my work as Markdown.

**Acceptance Criteria**:
- Export single file or entire project
- Preserve folder structure
- Clean formatting
- Include front matter (metadata)

#### 6.2 PDF Export

**User Story**: As a writer, I want professional PDF output.

**Acceptance Criteria**:
- Beautiful typography
- Configurable margins, fonts, spacing
- Page numbers
- Chapter breaks
- Table of contents (optional)

**Implementation**:
```rust
// Using wkhtmltopdf or similar
#[tauri::command]
async fn export_pdf(
    content: String,
    options: PdfOptions,
) -> Result<PathBuf, String> {
    let html = markdown_to_html(&content)?;
    let styled_html = apply_pdf_styles(&html, &options)?;
    let pdf_path = generate_pdf(&styled_html)?;
    Ok(pdf_path)
}
```

### 🔄 Tier 2: Advanced Export

#### 6.3 DOCX Export

**User Story**: As a writer, I want to export to Microsoft Word.

**Features**:
- Preserve formatting
- Styles for headings, quotes, etc.
- Track changes support
- Comments preservation

#### 6.4 EPUB Export

**User Story**: As a writer, I want to create ebooks.

**Features**:
- Valid EPUB 3.0
- Cover image
- Table of contents
- Metadata (author, title, ISBN)

### 🚀 Tier 3: Publishing Export

#### 6.5 Industry Formats

**User Story**: As a screenwriter, I want industry-standard formats.

**Features**:
- Final Draft (.fdx)
- Fountain
- Celtx
- Formatted for submission

---

## 7. AI Integration

### ✅ Tier 1: Provider Setup

#### 7.1 Provider Configuration

**User Story**: As a writer, I want to use my preferred AI provider.

**Acceptance Criteria**:
- Add API keys via settings
- Choose default provider (OpenAI, Anthropic, Google, Local)
- Per-project provider override
- Test connection button
- API keys stored securely in OS keychain

**UI Flow**:
```
Settings → AI Providers → Add Provider
  → Select: OpenAI / Anthropic / Gemini / Local
  → Enter API key (validated on save)
  → Set as default (optional)
  → Save
```

#### 7.2 Basic Chat

**User Story**: As a writer, I want to chat with AI about my work.

**Acceptance Criteria**:
- Open chat panel (Cmd/Ctrl+Shift+A)
- Send messages with project context
- AI responds with streaming
- Token count and cost estimate visible
- Clear conversation button

**Implementation**:
```typescript
// Frontend
import { invoke } from '@tauri-apps/api/core';

async function* chatStream(message: string) {
  const stream = await invoke<ReadableStream>('chat_stream', {
    provider: 'anthropic',
    message,
    context: currentProjectContext,
  });

  for await (const chunk of stream) {
    yield chunk;
  }
}
```

### 🔄 Tier 2: AI Recipes

#### 7.3 Prompt Templates

**User Story**: As a writer, I want reusable prompts.

**Features**:
- Create custom prompts
- Variables in prompts ({{character_name}}, {{scene}})
- Organize in folders
- Share recipes with community

**Recipe Format (TOML)**:
```toml
[metadata]
id = "expand_beat"
name = "Expand Beat to Scene"
version = "1.0"

[defaults]
model = "gpt-4o-mini"
temperature = 0.7
max_tokens = 600

[template]
system = "You are a creative writing assistant."
user = """
Expand this beat into a full scene:

{{beat}}

Style: {{style}}
POV: {{pov}}
Target length: ~500 words
"""
```

#### 7.4 Batch Operations

**User Story**: As a writer, I want to process multiple items with AI.

**Features**:
- Select multiple scenes
- Apply recipe to all
- Progress indicator
- Review and edit results before saving

### 🚀 Tier 3: Advanced AI

#### 7.5 Local RAG (Retrieval Augmented Generation)

**User Story**: As a writer, I want AI to reference my entire project.

**Features**:
- Vector embedding index of all documents
- AI searches project for relevant context
- Cite sources in AI responses
- Update embeddings on file save

#### 7.6 AI Suggestions

**User Story**: As a writer, I want proactive AI assistance.

**Features**:
- Autocomplete suggestions (inline)
- "Continue writing" button
- Plot hole detection
- Consistency checker (character names, dates, etc.)

---

## Performance Requirements Summary

| Feature | Metric | Target |
|---------|--------|--------|
| App Startup | Cold start | <3s |
| File Load | 10MB document | <5s |
| Editor | Typing latency | <16ms |
| Canvas | Pan/zoom | 60fps |
| Search | P95 latency | <50ms |
| Export | 120k words to PDF | <10s |
| AI Chat | First token | <2s |
| Memory | Typical project | <500MB |

---

**Feature Prioritization**: Build Tier 1 features completely before starting Tier 2. Ship working software every 2-3 days.
