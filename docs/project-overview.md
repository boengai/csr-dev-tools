# CSR Developer Tools - Project Overview

**Generated:** 2026-02-11 | **Scan Level:** Quick | **Mode:** Initial Scan

## Executive Summary

CSR Developer Tools is a **100% client-side** single-page application (SPA) that provides browser-based developer utilities. All processing happens locally in the user's browser with zero server dependencies, ensuring complete data privacy.

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

## Features

| Feature | Component | Description |
|---------|-----------|-------------|
| Color Converter | `ColorConvertor` | Convert between HEX, RGB, HSL, OKLCH, LAB, LCH formats |
| Base64 Encoder | `EncodingBase64` | Encode and decode Base64 strings |
| Image Converter | `ImageConvertor` | Convert between image formats (PNG, JPG, WebP, etc.) |
| Image Resizer | `ImageResizer` | Resize images with custom dimensions |
| Unix Timestamp | `TimeUnixTimestamp` | Convert between Unix timestamps and human-readable dates |
| PX to REM | `UnitPxToRem` | Convert pixel values to REM units |

## Technology Stack Summary

| Category | Technology | Version |
|----------|-----------|---------|
| **UI Framework** | React | 19.2.4 |
| **Language** | TypeScript | 5.9.3 (strict mode) |
| **Build Tool** | Vite | 7.3.1 |
| **Routing** | TanStack Router | 1.159.5 |
| **Server State** | TanStack React Query | 5.90.21 |
| **Styling** | Tailwind CSS | 4.1.18 (v4 via Vite plugin) |
| **Component Variants** | tailwind-variants | 3.2.2 |
| **Accessible Primitives** | Radix UI | Dialog, Select, Tabs, Toast |
| **Animations** | Motion | 12.34.0 |
| **Client State** | Zustand | 5.0.11 |
| **File Processing** | JSZip | 3.10.1 (lazy-loaded) |
| **Linter** | oxlint | 1.46.0 |
| **Formatter** | oxfmt | 0.31.0 (alpha) |
| **Test Runner** | Vitest | 4.0.18 |

## Architecture Type

**Component-based SPA** with lazy-loaded routes.

- All routes use `lazyRouteComponent()` for code splitting
- Feature components are lazy-loaded per tool
- No server/API layer -- all processing is client-side
- Zustand stores for client state, React Query configured but no server calls
- Tailwind CSS v4 with CSS-first configuration (no JS config file)

## Key Architectural Constraints

1. **Zero server dependencies** -- all tools must run 100% in the browser
2. **No default exports** for components (only page-level route components)
3. **ESM only** with `verbatimModuleSyntax: true`
4. **Type definitions separated** into `src/types/` mirroring the source structure
5. **Barrel exports** via `index.ts` files at every folder level

## Related Documentation

- [Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Component Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)
