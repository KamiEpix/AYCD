# CLAUDE.md — AI Developer Guide for AYCD

This document is addressed to the AI developer agent (“Claude”) working in this repository.

Your job is to help build and maintain AYCD Creator according to the architecture and principles described in the docs alongside this file.

---

## 1. Mission

You are here to:

1. Implement features for **AYCD Creator**, a local-first writing and worldbuilding app.
2. Respect the product’s **North Star**:
   - Local-first.
   - Block graph → many views.
   - AI optional.
   - Aggressive performance budgets.
3. Keep the codebase coherent, documented, and maintainable.

When in doubt, choose clarity and simplicity over cleverness.

---

## 2. Context & Orientation

Before making changes:

1. Read these docs (or the updated set, if present):
   - `1-Overview.md`
   - `2-Architecture.md`
   - `3-Features.md`
   - `4-Data-Model.md`
   - `5-Frontend.md`
   - `6-Core-Engine.md`
   - `7-AI-Integration.md`
   - `8-Dev-Guidelines.md`
   - `9-Roadmap.md`

2. Scan the repo layout (at minimum):
   - `/app` — Svelte frontend.
   - `/core` — Rust engine.
   - `/adapters` — AI provider implementations.
   - `/recipes` — default TOML recipes.
   - `/samples` — golden projects and perf fixtures.

3. Identify which layer your change belongs to:
   - UI only (Svelte).
   - Engine only (Rust).
   - End-to-end (both).

---

## 3. How to Work in This Repo

### 3.1 General Behavior

When you receive a request to modify or extend the code:

1. **Restate the task** in your own words to ensure understanding.
2. **Identify impacted modules**:
   - Which files must be touched?
   - Which tests should exist or be added?
3. **Propose a plan**:
   - Short, stepwise outline of changes.
   - Note any migration/compatibility risks.

Then execute that plan and show the resulting code as complete files or patches.

### 3.2 File Editing Strategy

When editing:

- Prefer *small, focused changes*.
- Keep related logic together in the same module.
- If refactoring:
  - First write tests (or enhance existing ones).
  - Then refactor.
  - Then run tests.

Always keep the project buildable:

- Frontend: `pnpm tauri dev` (or equivalent dev command).
- Engine: `cargo test`.

If you can’t run commands (in your environment), reason carefully about whether changes are likely to compile and avoid risky rewrites.

---

## 4. Frontend Rules (Svelte + TS)

1. Follow the guidelines in `5-Frontend.md` and `8-Dev-Guidelines.md`.
2. Use:
   - Svelte stores for shared state.
   - A thin `api/` layer for Tauri IPC calls.
3. Avoid:
   - Inline business logic in Svelte components when it can live in stores or Rust.
   - Heavy computations on the UI thread for canvas, timeline, or graph.

When adding UI:

- Make sure it is keyboard accessible.
- Ensure it degrades gracefully without AI enabled.

---

## 5. Engine Rules (Rust)

1. Follow the conventions in `6-Core-Engine.md` and `8-Dev-Guidelines.md`.
2. For new features:
   - Add or update Rust unit tests.
   - Maintain strong typing and clear error handling.
3. When touching storage or the data model:
   - Confirm changes align with `4-Data-Model.md`.
   - Avoid breaking existing project layouts without a migration path.

---

## 6. AI Integration Rules

1. AI is **never mandatory** for core functionality.
2. All AI usage must go through provider adapters and recipes as described in `7-AI-Integration.md`.
3. Respect:
   - Airplane mode.
   - Provider enable/disable flags.
   - Config from `.aycd/config.json`.

When adding a new recipe:

1. Define a TOML file under `.aycd/recipes/`.
2. Include:
   - Inputs.
   - System/user templates.
   - Defaults.
   - Post-processing hooks.
3. Wire it into the engine and UI in a way that:
   - Makes prompts visible to the user.
   - Allows them to inspect outputs and logs.

---

## 7. Performance & Safety

Always consider the performance budgets in `1-Overview.md`, `6-Core-Engine.md`, and `8-Dev-Guidelines.md`.

- Avoid:
  - O(n²) operations on large block sets.
  - Unbounded in-memory data structures.
- Prefer:
  - Streaming.
  - Incremental indexing.
  - Rust-side heavy lifting.

If a requested change would obviously violate performance or architectural constraints, flag this explicitly and propose alternatives.

---

## 8. Communication & Documentation

When you generate code changes:

1. Provide:
   - A clear summary of what changed.
   - Any new or updated commands and how to run them.
   - Notes about migrations or upgrade steps (if any).

2. Keep comments meaningful:
   - Explain *why* non-obvious decisions were made.
   - Reference relevant sections of these docs when helpful.

3. If something in the existing code contradicts these docs:
   - Highlight the discrepancy.
   - Suggest how to reconcile it (update docs vs. refactor code).

---

## 9. What Not to Do

- Do not:
  - Introduce new dependency-heavy frameworks without strong justification.
  - Bypass the provider adapter layer for AI calls.
  - Break local-first assumptions by requiring a network connection for basic operations.
  - Hard-code API keys, secrets, or environment-specific paths.

- Avoid:
  - Large, unreviewable changes that touch too many modules at once.
  - “Magic” behavior that is hard to explain or test.

---

## 10. Final Reminder

Your primary objectives here:

1. **Protect the core principles** of AYCD (local-first, performance, user control).
2. **Make the codebase clearer and more maintainable** with each change.
3. **Implement features faithfully** to the spec in the docs while being explicit when trade-offs are necessary.

If a user’s request conflicts with these constraints, explain the trade-offs and propose a path that keeps AYCD’s long-term health intact.
