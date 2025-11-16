# AYCD - Anything You Can Do


AYCD is a local-first, privacy-first writing environment for long-form creative projects. This README introduces the project, how it is structured, and where to explore next in the documentation set.

**A locally-hosted, privacy-first writing platform for serious creators.**

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## What Is This?

AYCD is a unified creative writing ecosystem built for speed, privacy, and power. It combines:

- **Distraction-free editor** with Markdown support
- **Visual canvas** for story mapping and world-building
- **Timeline tools** for complex narrative chronology
- **Local AI integration** (your keys, your models, zero cloud dependencies)
- **Offline-first architecture** (no internet required)

## Core Principles

1. **Local-First**: Your files, your machine, human-readable formats
2. **Privacy-First**: No telemetry, no cloud sync, no data exfiltration
3. **Performance-First**: <3s startup, <100ms file ops, 60fps canvas
4. **AI-Optional**: Elite tool without AI; superhuman with it

## Tech Stack

- **Frontend**: Svelte 5 + TypeScript + Tailwind v4
- **Backend**: Tauri 2 (Rust)
- **Editor**: Plate.js (React island in Svelte)
- **Canvas**: Konva + svelte-konva
- **Database**: SQLite (local only)
- **Search**: Tantivy (Rust full-text search)

## Project Structure

```
aycd/
├── apps/
│   └── desktop/          # Main Tauri app
│       ├── src/          # Svelte frontend
│       └── src-tauri/    # Rust backend
├── packages/
│   ├── core/             # Shared TypeScript types
│   ├── editor/           # Plate.js editor component
│   └── canvas/           # Konva canvas component
└── docs/                 # This documentation
```

## Development Timeline

**10-day sprint to MVP**

- Days 1-3: Core architecture + file management
- Days 4-6: Editor + Canvas integration
- Days 7-8: Timeline + Search
- Days 9-10: AI integration + polish

## Success Metrics

- ✅ Startup < 3 seconds
- ✅ File operations < 100ms
- ✅ Canvas @ 60fps
- ✅ Memory usage < 500MB
- ✅ Zero data loss
- ✅ Fully offline-capable

## Documentation Index

1. **README.md** (this file)
2. **Architecture.md** - System design & technical decisions
3. **Setup.md** - Development environment setup
4. **Features.md** - Complete feature specifications
5. **API.md** - Tauri command reference
6. **Schema.md** - Database models & data structures
7. **UI_Guide.md** - Component library & design system
8. **AI_Integration.md** - Provider setup & prompt engineering
9. **Build.md** - Deployment & distribution

## Quick Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm dev:debug        # Start with Rust debugging
pnpm type-check       # TypeScript validation

# Building
pnpm build            # Production build
pnpm build:win        # Windows-specific build
pnpm build:mac        # macOS-specific build

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Unit tests only
pnpm test:e2e         # End-to-end tests

# Code quality
pnpm lint             # Lint all code
pnpm format           # Format with Prettier
pnpm check            # Full validation (types + lint + format)
```

## Getting Help

- **Issues**: GitHub Issues for bugs and feature requests
- **Discussions**: GitHub Discussions for questions
- **Discord**: [Coming soon]

## License

Proprietary - All rights reserved (for now)

---

**Built with ❤️ and excessive amounts of caffeine**
