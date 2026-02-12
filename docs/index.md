# CSR Developer Tools - Documentation Index

**Generated:** 2026-02-11 | **Workflow:** initial_scan (quick)

## Project Overview

- **Type:** Monolith (single-part)
- **Primary Language:** TypeScript 5.9.3
- **Framework:** React 19.2.4 + Vite 7.3.1
- **Architecture:** Component-based SPA with lazy-loaded routes
- **Constraint:** 100% client-side -- zero server dependencies

## Quick Reference

- **Tech Stack:** React 19 + TypeScript 5.9 + Vite 7.3 + Tailwind CSS 4
- **Entry Point:** `src/main.tsx`
- **Architecture Pattern:** Component-based SPA
- **State:** Zustand (client) + React Query (configured, unused)
- **Styling:** Tailwind CSS v4 + tailwind-variants + Radix UI
- **Linting/Formatting:** oxlint + oxfmt
- **Testing:** Vitest 4 (node environment, 15 tests)

## Generated Documentation

- [Project Overview](./project-overview.md) -- Executive summary, features, tech stack
- [Architecture](./architecture.md) -- Architecture patterns, component hierarchy, state management
- [Source Tree Analysis](./source-tree-analysis.md) -- Annotated directory structure, critical folders
- [Component Inventory](./component-inventory.md) -- All UI components categorized
- [Development Guide](./development-guide.md) -- Setup, scripts, code style, testing, adding tools

## Existing Documentation

- [README.md](../README.md) -- Project overview, features, setup instructions
- [Project Context (AI Rules)](../_bmad-output/project-context.md) -- Implementation rules for AI agents
- [LICENSE](../LICENSE) -- MIT License

## Getting Started

```bash
# Prerequisites: Node.js >= 24.5.0, pnpm 10.11.0

# Install
pnpm install

# Develop
pnpm dev          # http://localhost:5173

# Quality
pnpm lint         # oxlint
pnpm format       # oxfmt
pnpm test         # Vitest

# Build
pnpm build        # TypeScript + Vite production build
pnpm preview      # Preview build locally
```

## Features (6 tools)

| Tool | Component | Domain |
|------|-----------|--------|
| Color Converter | `ColorConvertor` | `feature/color/` |
| Base64 Encoder | `EncodingBase64` | `feature/encoding/` |
| Image Converter | `ImageConvertor` | `feature/image/` |
| Image Resizer | `ImageResizer` | `feature/image/` |
| Unix Timestamp | `TimeUnixTimestamp` | `feature/time/` |
| PX to REM | `UnitPxToRem` | `feature/unit/` |
