# Development Environment Setup


This guide walks you through setting up a development environment for AYCD on all supported platforms.

## Prerequisites

### Required Software

1. **Node.js v24.6.0** (Current)
   - Install from [nodejs.org](https://nodejs.org/)
   - Verify: `node -v` should show v24.6.0+

2. **pnpm** (via Corepack)
   ```bash
   corepack enable
   corepack prepare pnpm@latest --activate
   pnpm -v  # Verify installation
   ```

3. **Rust 1.89.0** (stable, MSVC toolchain for Windows)
   ```bash
   # Install Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # Windows: MSVC toolchain
   rustup toolchain install stable-x86_64-pc-windows-msvc
   rustup default stable-x86_64-pc-windows-msvc
   
   # Verify
   rustc -V  # Should show 1.89.0
   cargo -V
   ```

4. **Visual Studio 2022 Build Tools** (Windows only)
   - Download from [visualstudio.microsoft.com](https://visualstudio.microsoft.com/downloads/)
   - Install "Desktop development with C++" workload
   - Ensure MSVC v143 toolset is selected

5. **WebView2 Runtime** (Windows)
   - Version 139.0.3405.102+
   - Usually pre-installed on Windows 11
   - Manual install: [developer.microsoft.com/microsoft-edge/webview2](https://developer.microsoft.com/microsoft-edge/webview2/)

### Optional Tools

- **VS Code** with extensions:
  - Svelte for VS Code
  - rust-analyzer
  - Tailwind CSS IntelliSense
  - Error Lens
  - Prettier

- **Git** (for version control)
- **GitHub CLI** (for rapid commits)

## Project Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd aycd
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# Verify Tauri CLI installation
pnpm tauri -V  # Should show @tauri-apps/cli 2.x
```

### 3. Environment Configuration

Create `.env` in project root (optional for development):

```env
# Development settings
VITE_DEV_PORT=5173
RUST_LOG=info
RUST_BACKTRACE=1

# AI Provider keys (optional, for testing)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
```

**⚠️ Never commit `.env` to version control**

### 4. Verify Installation

```bash
# Run all checks
pnpm check:all

# Individual checks
pnpm type-check     # TypeScript validation
pnpm lint           # ESLint checks
pnpm format:check   # Prettier formatting
```

## Development Workflow

### Starting Development Server

```bash
# Start Tauri dev server (hot reload enabled)
pnpm dev

# Start with Rust debugging
pnpm dev:debug

# Frontend only (no Tauri)
pnpm dev:web
```

The app will open automatically. Changes to Svelte/TS files hot-reload instantly. Rust changes require full restart.

### Project Structure Navigation

```
aycd/
├── apps/
│   └── desktop/              # Main application
│       ├── src/              # Svelte frontend
│       │   ├── lib/          # Reusable components
│       │   │   ├── components/
│       │   │   ├── stores/
│       │   │   └── utils/
│       │   ├── routes/       # SvelteKit routes (if using)
│       │   ├── styles/       # Global CSS
│       │   └── main.ts       # Entry point
│       └── src-tauri/        # Rust backend
│           ├── src/
│           │   ├── commands/ # Tauri IPC commands
│           │   ├── models/   # Data structures
│           │   ├── services/ # Business logic
│           │   └── main.rs   # Tauri entry
│           ├── Cargo.toml    # Rust dependencies
│           └── tauri.conf.json
├── packages/
│   ├── core/                 # Shared types
│   ├── editor/               # Plate.js editor
│   └── canvas/               # Konva canvas
├── docs/                     # This documentation
└── package.json              # Workspace root
```

### Common Tasks

#### Adding a Tauri Command

1. **Create command in Rust**:
```rust
// apps/desktop/src-tauri/src/commands/documents.rs

#[tauri::command]
pub async fn save_document(
    path: String,
    content: String,
) -> Result<(), String> {
    // Implementation
    Ok(())
}
```

2. **Register in main.rs**:
```rust
// apps/desktop/src-tauri/src/main.rs

mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::save_document,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. **Call from frontend**:
```typescript
// apps/desktop/src/lib/api/documents.ts

import { invoke } from '@tauri-apps/api/core';

export async function saveDocument(path: string, content: string) {
  await invoke('save_document', { path, content });
}
```

#### Adding a Svelte Component

```bash
# Create component file
touch apps/desktop/src/lib/components/MyComponent.svelte
```

```svelte
<!-- apps/desktop/src/lib/components/MyComponent.svelte -->
<script lang="ts">
  import { writable } from 'svelte/store';
  
  let count = $state(0);
  
  function increment() {
    count++;
  }
</script>

<button onclick={increment}>
  Count: {count}
</button>

<style>
  button {
    @apply px-4 py-2 bg-blue-500 text-white rounded;
  }
</style>
```

#### Adding a Rust Dependency

```bash
cd apps/desktop/src-tauri
cargo add <crate-name>
```

Or manually edit `Cargo.toml`:
```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
```

#### Running Tests

```bash
# Frontend tests (Vitest)
pnpm test

# Rust tests
cd apps/desktop/src-tauri
cargo test

# E2E tests (WebdriverIO or similar)
pnpm test:e2e
```

## Building for Production

### Development Build

```bash
pnpm build:dev
```

Outputs to `apps/desktop/src-tauri/target/debug/`

### Production Build

```bash
# Full release build
pnpm build

# Platform-specific
pnpm build:win   # Windows
pnpm build:mac   # macOS
pnpm build:linux # Linux
```

Outputs to `apps/desktop/src-tauri/target/release/bundle/`

### Build Artifacts

- **Windows**: `.exe` installer, `.msi` (optional)
- **macOS**: `.app` bundle, `.dmg` disk image
- **Linux**: `.AppImage`, `.deb` (optional)

## Troubleshooting

### Common Issues

#### 1. "command not found: pnpm"

```bash
# Enable Corepack
corepack enable
corepack prepare pnpm@latest --activate
```

#### 2. Rust compilation errors on Windows

```bash
# Ensure MSVC toolchain is default
rustup default stable-x86_64-pc-windows-msvc

# Verify Visual Studio Build Tools are installed
# Check that "Desktop development with C++" is selected
```

#### 3. "Failed to resolve module" in Vite

```bash
# Clear Vite cache
rm -rf apps/desktop/node_modules/.vite
pnpm install
```

#### 4. Tauri dev server won't start

```bash
# Check ports
netstat -ano | findstr :5173  # Windows
lsof -i :5173                 # macOS/Linux

# Kill process on port 5173 and retry
```

#### 5. SQLite errors in Rust

```bash
# Ensure SQLite development libraries are installed
# Windows: Usually bundled with Rust build
# macOS: brew install sqlite
# Linux: sudo apt-get install libsqlite3-dev
```

### Debug Mode

Enable verbose logging:

```bash
# Frontend
VITE_LOG_LEVEL=debug pnpm dev

# Rust
RUST_LOG=debug pnpm dev

# Both
VITE_LOG_LEVEL=debug RUST_LOG=debug pnpm dev
```

## Performance Profiling

### Frontend

```bash
# Vite bundle analyzer
pnpm build --mode analyze

# Chrome DevTools
# Open app, F12 → Performance tab → Record
```

### Rust

```bash
# Flamegraph profiling
cargo install flamegraph
cargo flamegraph --bin aycd

# CPU profiling with perf (Linux)
perf record -g ./target/release/aycd
perf report
```

## Code Quality Tools

### Pre-commit Hooks (Recommended)

Install Husky:

```bash
pnpm add -D husky
pnpm husky install

# Add pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
pnpm type-check
pnpm lint
pnpm format:check
EOF

chmod +x .husky/pre-commit
```

### CI/CD Checks

See `.github/workflows/ci.yml` for automated checks on every commit:

- Type checking
- Linting
- Formatting
- Unit tests
- Build verification

## Quick Reference

### Essential Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm type-check       # Check TypeScript
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier

# Building
pnpm build            # Production build
pnpm build:dev        # Debug build

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Unit tests only
pnpm test:e2e         # E2E tests

# Utilities
pnpm clean            # Clean build artifacts
pnpm reset            # Clean + reinstall
pnpm check:all        # Run all quality checks
```

### File Watchers

- **Vite**: Watches `apps/desktop/src/**`
- **Tauri**: Watches `apps/desktop/src-tauri/src/**`
- **Cargo**: Watches `apps/desktop/src-tauri/Cargo.toml`

### Port Usage

- **5173**: Vite dev server (frontend)
- **1420**: Tauri dev server (internal)

---

**Next Steps**: Read `04_Features.md` for detailed feature specifications.
