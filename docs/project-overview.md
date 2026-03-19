# CSR Developer Tools - Project Overview

**Updated:** 2026-03-20 | **Scan Level:** Quick

## Executive Summary

CSR Developer Tools is a **100% client-side** single-page application (SPA) that provides browser-based developer utilities. All processing happens locally in the user's browser with zero server dependencies, ensuring complete data privacy. The project has grown from 6 initial tools to **80 developer tools** across 12 categories.

## Project Identity

| Field | Value |
|-------|-------|
| **Name** | csr-dev-tools |
| **Version** | 0.1.0 |
| **License** | MIT |
| **Repository Type** | Monolith |
| **Project Type** | Web (Client-Side React SPA) |
| **Package Manager** | pnpm 10.11.0 |
| **Node.js Requirement** | >= 24.5.0 |

## Tool Categories (80 tools)

| Category | Count | Examples |
|----------|-------|---------|
| Data | 15 | JSON Formatter, JSON Diff, CSV Converter, YAML/TOML/XML Converters, DB Diagram Builder |
| Code | 14 | JSON to TypeScript, SQL Formatter, Mermaid Renderer, Protobuf Codec, TypeScript Playground |
| Image | 12 | Background Remover, Favicon Generator, Splash Screen Generator, SVG Viewer |
| Security | 8 | AES Encrypt/Decrypt, Bcrypt Hasher, Hash/HMAC Generator, RSA/SSH Key tools |
| Text | 8 | Regex Tester, Text Diff, Lorem Ipsum, Word Counter, Case Converter |
| CSS | 6 | Flexbox Playground, Grid Playground, Animation Builder, Gradient Generator |
| Encoding | 5 | Base64, JWT Decoder, URL Encoder/Parser, Number Base Converter |
| Time | 4 | Unix Timestamp, Cron Parser, Crontab Generator, Timezone Converter |
| Generator | 3 | Password, UUID, QR Code |
| Color | 2 | Color Converter, Color Palette Generator |
| Unit | 2 | PX to REM, Aspect Ratio Calculator |
| Network | 1 | IP Subnet Calculator |

## Technology Stack Summary

| Category | Technology | Version |
|----------|-----------|---------|
| **UI Framework** | React | 19.2.4 |
| **Language** | TypeScript | 5.9.3 (strict mode) |
| **Build Tool** | Vite | 7.3.1 |
| **Routing** | TanStack Router | 1.166.3 |
| **Server State** | TanStack React Query | 5.90.21 |
| **Styling** | Tailwind CSS | 4.2.1 (v4 via Vite plugin) |
| **Component Variants** | tailwind-variants | 3.2.2 |
| **Accessible Primitives** | Radix UI | Dialog, Select, Switch, Tabs, Toast, Dropdown Menu |
| **Animations** | Motion | 12.35.1 |
| **Client State** | Zustand | 5.0.11 |
| **Code Editor** | CodeMirror / Monaco Editor | Various |
| **Diagrams** | Mermaid + React Flow (@xyflow) | 11.12.3 / 12.10.1 |
| **AI/ML** | @huggingface/transformers | 3.8.1 |
| **File Processing** | JSZip | 3.10.1 (lazy-loaded) |
| **Linter** | oxlint | 1.51.0 |
| **Formatter** | oxfmt | 0.36.0 |
| **Unit Test Runner** | Vitest | 4.0.18 |
| **E2E Test Runner** | Playwright | 1.58.2 |

## Architecture Type

**Component-based SPA** with dynamic tool routing and lazy-loaded components.

- Tool registry (`tool-registry.ts`) defines all 80 tools with lazy-loaded components
- Dynamic routing via `/tools/$toolKey` for individual tool pages
- Home page dashboard with searchable tool grid
- Sidebar navigation with categorized tool listing
- Command palette for quick tool access
- All processing is client-side -- no server/API layer
- Zustand stores for client state, React Query configured but no server calls
- Tailwind CSS v4 with CSS-first configuration (no JS config file)

## Key Architectural Constraints

1. **Zero server dependencies** -- all tools must run 100% in the browser
2. **No default exports** for components (only page-level route components)
3. **ESM only** with `verbatimModuleSyntax: true`
4. **Type definitions separated** into `src/types/` mirroring the source structure
5. **Barrel exports** via `index.ts` files at every folder level
6. **Tool registry pattern** -- all tools registered in centralized `tool-registry.ts`

## Related Documentation

- [Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Component Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)
