# AYCD - Anything You Can Do

A local-first, privacy-first writing and worldbuilding platform for serious creators.

## Project Structure

This repository has been initialized with the following structure:

```
aycd/
├── apps/
│   └── desktop/              # Main Tauri application
│       ├── src/              # Svelte frontend
│       │   ├── lib/          # Components, stores, API
│       │   ├── styles/       # Global CSS + Tailwind
│       │   ├── App.svelte    # Root component
│       │   └── main.ts       # Entry point
│       ├── src-tauri/        # Rust backend
│       │   ├── src/
│       │   │   ├── commands/ # Tauri IPC commands
│       │   │   ├── models/   # Data structures
│       │   │   ├── services/ # Business logic
│       │   │   └── main.rs   # Application entry
│       │   ├── Cargo.toml    # Rust dependencies
│       │   └── tauri.conf.json
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
├── packages/
│   ├── core/                 # Shared TypeScript types
│   ├── editor/               # Plate.js editor (stub)
│   └── canvas/               # Konva canvas (stub)
├── docs/                     # Complete documentation set
│   ├── 01_README.md
│   ├── 02_Architecture.md
│   ├── 03_Setup.md
│   ├── 04_Features.md
│   ├── 05_API.md
│   ├── 06_Schema.md
│   ├── 07_UI_Guide.md
│   ├── 08_AI_Integration.md
│   └── 09_Build.md
├── CLAUDE.md                 # AI developer guide
├── package.json              # Workspace root
├── pnpm-workspace.yaml
└── tsconfig.json

```

## Quick Start

### Prerequisites

- Node.js v20+ (v24.6.0 recommended)
- pnpm (via Corepack)
- Rust 1.89.0+
- Visual Studio 2022 Build Tools (Windows only)

### Installation

```bash
# Enable pnpm via Corepack
corepack enable
corepack prepare pnpm@latest --activate

# Install all dependencies
pnpm install

# Start development server
pnpm dev
```

The app will launch automatically. Changes to frontend code will hot-reload. Rust changes require a restart.

## Development Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm dev:debug        # Start with Rust debugging
pnpm dev:web          # Frontend only (no Tauri)

# Building
pnpm build            # Production build
pnpm build:dev        # Debug build
pnpm build:win        # Windows-specific
pnpm build:mac        # macOS-specific
pnpm build:linux      # Linux-specific

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Unit tests only
pnpm test:e2e         # E2E tests

# Code Quality
pnpm type-check       # TypeScript validation
pnpm lint             # ESLint
pnpm format           # Format with Prettier
pnpm check            # Type + lint + format checks
pnpm check:all        # All checks + tests

# Utilities
pnpm clean            # Clean build artifacts
pnpm reset            # Clean + reinstall
```

## Tech Stack

- **Frontend**: Svelte 5 + TypeScript + Tailwind v4
- **Backend**: Tauri 2 (Rust)
- **Editor**: Plate.js (React island, stub)
- **Canvas**: Konva (stub)
- **Database**: SQLite (local only)
- **Search**: Tantivy (full-text search)

## Core Principles

1. **Local-First**: Your files, your machine, human-readable formats
2. **Privacy-First**: No telemetry, no cloud sync, no data exfiltration
3. **Performance-First**: <3s startup, <100ms file ops, 60fps canvas, <500MB memory
4. **AI-Optional**: Elite without AI, supercharged with it

## Documentation

See the `docs/` directory for comprehensive documentation:

- **01_README.md** - Project overview
- **02_Architecture.md** - System design
- **03_Setup.md** - Development setup
- **04_Features.md** - Feature specs
- **05_API.md** - Tauri commands
- **06_Schema.md** - Data models
- **07_UI_Guide.md** - UI/UX system
- **08_AI_Integration.md** - AI providers
- **09_Build.md** - Build & distribution

## Current Status

✅ Project structure initialized
✅ Monorepo configured (pnpm workspaces)
✅ Tauri 2 + Svelte 5 setup
✅ TypeScript configuration
✅ Tailwind v4 configured
✅ Shared type packages created
✅ Basic Rust backend structure
✅ Development tooling (ESLint, Prettier, etc.)

🚧 Editor package (stub)
🚧 Canvas package (stub)
🚧 Timeline features
🚧 Search integration
🚧 AI integration

## Next Steps

1. Verify installation: `pnpm install`
2. Test development server: `pnpm dev`
3. Begin feature implementation (see roadmap in `docs/09_Build.md`)

## License

Proprietary - All rights reserved

---

**Built with ❤️ for writers, worldbuilders, and creators**
