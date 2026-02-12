# CSR Developer Tools - Architecture

**Generated:** 2026-02-11 | **Scan Level:** Quick

## Architecture Pattern

**Component-based SPA** with lazy-loaded routes, Zustand state management, and Radix UI accessible primitives.

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| UI Framework | React | 19.2.4 | Component rendering, JSX via react-jsx |
| Language | TypeScript | 5.9.3 | Strict mode, target ES2022, verbatimModuleSyntax |
| Build Tool | Vite | 7.3.1 | Dev server, HMR, production bundling |
| Routing | TanStack Router | 1.159.5 | Lazy-loaded file-based routing |
| Server State | TanStack React Query | 5.90.21 | Configured but unused (no server calls) |
| Styling | Tailwind CSS | 4.1.18 | v4 via @tailwindcss/vite plugin |
| Variants | tailwind-variants | 3.2.2 | Component variant API via custom `tv()` wrapper |
| Merge | tailwind-merge | 3.4.0 | Peer dep of tailwind-variants for class deduplication |
| Primitives | Radix UI | Various | Dialog, Select, Tabs, Toast (accessible, unstyled) |
| Animation | Motion | 12.34.0 | Animations via `motion/react` (NOT framer-motion) |
| Client State | Zustand | 5.0.11 | Lightweight stores in `hooks/state/` |
| File Processing | JSZip | 3.10.1 | ZIP generation (dynamic import, lazy-loaded) |
| Linting | oxlint | 1.46.0 | Fast linter with TypeScript + React plugins |
| Formatting | oxfmt | 0.31.0 | Fast formatter with Tailwind class sorting (alpha) |
| Testing | Vitest | 4.0.18 | Node environment, globals enabled |
| Path Aliases | vite-tsconfig-paths | 6.1.0 | Resolves `@/*` path alias in Vite and Vitest |

## Application Architecture

```
[Browser]
  └── React SPA (main.tsx entry)
        ├── TanStack Router (routes.tsx)
        │     ├── / (Home page) ──→ Feature components (lazy-loaded)
        │     └── /showcase ──→ Showcase page
        ├── Zustand Stores (hooks/state/)
        │     └── useToast ──→ Toast notification state
        ├── Persistent State (hooks/persist/)
        │     └── usePersistFeatureLayout ──→ Feature card layout
        └── Utility Functions (utils/)
              ├── color.ts ──→ Color format conversion
              ├── image.ts ──→ Image processing
              ├── file.ts ──→ File utilities
              └── time.ts ──→ Time/date utilities
```

## Component Architecture

```
App.tsx (root, lazy-loaded)
├── TwinkleStarsAnimate (background animation)
├── Outlet (router)
│   ├── Home Page
│   │   ├── Feature Cards (lazy-loaded per tool)
│   │   │   ├── ColorConvertor
│   │   │   ├── EncodingBase64
│   │   │   ├── ImageConvertor
│   │   │   ├── ImageResizer
│   │   │   ├── TimeUnixTimestamp
│   │   │   └── UnitPxToRem
│   │   └── Common Components
│   │       ├── Button, Card, Dialog
│   │       ├── TextInput, SelectInput, TextAreaInput, UploadInput
│   │       ├── Tabs, ProgressBar, FieldForm
│   │       ├── DataCellTable
│   │       └── Icon components (Copy, Download, Upload, etc.)
│   └── Showcase Page
└── ToastProvider (global toast notifications)
```

## Routing

| Path | Page | Loading |
|------|------|---------|
| `/` | Home (dashboard with tool cards) | `lazyRouteComponent` |
| `/showcase` | Showcase | `lazyRouteComponent` |
| `*` (not found) | Redirects to `/` | Built-in |

Router config: `defaultPreload: 'intent'`, `scrollRestoration: true`

## State Management

| Store | Location | Purpose |
|-------|----------|---------|
| `useToast` | `hooks/state/useToast.ts` | Global toast notification state |
| `usePersistFeatureLayout` | `hooks/persist/usePersistFeatureLayout.ts` | Persisted feature card layout |

Pattern: `create<T>()((set: StoreApi<T>['setState']) => ({...}))`

## Styling Architecture

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no PostCSS, no JS config)
- **CSS-first config** via `@theme` in `src/index.css`
- **tailwind-variants** for component variants using custom `tv()` wrapper from `@/utils`
- **CompVariant<T>** type for typed variant definitions
- **oxfmt** sorts Tailwind classes inside `tv()` calls automatically

## Build & Bundle Strategy

- **Code splitting** per route via `lazyRouteComponent()`
- **Feature-level code splitting** -- each tool is its own lazy-loaded chunk
- **JSZip lazy import** -- only loaded when zipping multiple images
- **Entry point**: `src/main.tsx` → mounts React app with router and query provider

## Testing Strategy

- **Vitest 4** with node environment and globals enabled
- **Co-located test files**: `*.spec.ts` alongside source (e.g., `color.spec.ts`)
- **Pure function testing only** -- no DOM/component tests
- **15 tests** in `src/utils/color.spec.ts` covering color conversion logic

## Module System

- **ESM only** (`"type": "module"`)
- **verbatimModuleSyntax**: `import type` required for type-only imports
- **Path alias**: `@/*` maps to `src/*`
- **Barrel exports**: Every folder has `index.ts` re-exporting siblings
