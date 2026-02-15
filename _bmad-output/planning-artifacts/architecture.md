---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-02-12'
inputDocuments:
  - product-brief-csr-dev-tools-2026-02-11.md
  - prd.md
  - prd-validation-report.md
  - ux-design-specification.md
deprecationNotes:
  - 'ToolLayout deprecated and removed (story 3-1) — each tool owns its own layout'
  - 'OutputDisplay deprecated and removed (story 3-1) — not needed; CopyButton still active'
  - project-context.md
  - docs/index.md
  - docs/project-overview.md
  - docs/architecture.md
  - docs/source-tree-analysis.md
  - docs/component-inventory.md
  - docs/development-guide.md
workflowType: 'architecture'
project_name: 'csr-dev-tools'
user_name: 'csrteam'
date: '2026-02-12'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

38 FRs across 12 categories. The dominant pattern is tool-specific transformation capabilities (FR1-FR25) — each tool takes input in one format and produces output in another. Platform requirements (FR26-FR31) cover navigation, discovery, and customization (FR32 theme toggle dropped — dark-only). Contributor/quality requirements (FR33-FR38) define the developer experience for adding tools and maintaining quality.

Architecturally, the tool FRs are highly independent — each tool is a self-contained unit with no dependencies on other tools. This is an explicit design choice (no tool-to-tool pipelines). Platform FRs are shared infrastructure that all tools depend on.

**Non-Functional Requirements:**

25 NFRs across 5 domains. The architecture-shaping NFRs are:

- **NFR1/NFR2:** Performance targets — <100ms for text tools, <3s for image tools up to 10MB
- **NFR8:** Adding new tools must not increase initial page load — demands strict code splitting
- **NFR9:** Zero network requests for tool processing — the foundational architectural constraint
- **NFR10-NFR12:** Zero cookies, tracking, third-party scripts, or data persistence — eliminates analytics, monitoring, and server-side concerns
- **NFR14-NFR18:** WCAG 2.1 AA accessibility — all interactive elements keyboard-accessible, screen reader compatible
- **NFR21:** Offline functionality after initial load — implies service worker potential
- **NFR23-NFR25:** Per-tool SEO with unique meta tags, semantic HTML — requires route-level meta management in an SPA

**Scale & Complexity:**

- Primary domain: Client-side web application (React SPA)
- Complexity level: Low-to-medium
- Estimated architectural components: ~45 (30 existing + ~15 new from UX spec)

### Technical Constraints & Dependencies

**Hard Constraints (non-negotiable):**
1. Zero server-side processing — all tools run 100% in browser
2. No user accounts, no authentication, no sessions
3. No analytics, no cookies, no tracking of any kind
4. No tool-to-tool pipelines — each tool is standalone
5. Static hosting only — deployable to any CDN/static host
6. ESM only with `verbatimModuleSyntax: true`

**Established Technology Stack (brownfield):**
- React 19.2.4, TypeScript 5.9.3, Vite 7.3.1
- TanStack Router 1.159.5 (lazy-loaded routes)
- Tailwind CSS 4.1.18 (CSS-first config via `@theme`, no JS config)
- tailwind-variants 3.2.2 (via custom `tv()` wrapper from `@/utils`)
- Radix UI (Dialog, Select, Tabs, Toast)
- Motion 12.34.0 (import from `motion/react`)
- Zustand 5.0.11 (client state)
- oxlint 1.46.0 + oxfmt 0.31.0 (linting/formatting)
- Vitest 4.0.18 (testing, node environment)
- pnpm 10.11.0 (package manager, exact versions)

**Code Conventions (enforced):**
- Named exports for components, default exports only for page components
- `type` over `interface`, `Array<T>` over `T[]`
- `import type` for type-only imports
- Types separated in `src/types/` mirroring source structure
- Barrel exports via `index.ts` at every folder level
- `@/` path alias for all src imports

### Cross-Cutting Concerns Identified

1. **Code Splitting & Bundle Discipline** — Every tool is a lazy-loaded chunk. Adding tools must not bloat the initial bundle. Affects: route registration, component imports, dynamic imports for heavy libraries (e.g., JSZip pattern).

2. **Tool Component Ownership** — Each tool owns its own layout structure, following consistent patterns (useToast error toasts for errors, CopyButton for output copying). No shared layout wrapper — tools are self-contained. Affects: every feature component, mobile stacking, accessibility tab order.

3. **Accessibility (WCAG 2.1 AA)** — Keyboard navigation, screen reader compatibility, contrast ratios, focus management. Affects: every interactive component, all new sidebar/command palette components, all tool inputs/outputs.

4. **Theme System** — Dark-only. OKLCH color space. No light theme variant — the space/universe identity commits fully to dark. Affects: all components, all tools, all new UI elements. Must be consistent across existing and new components.

5. **Clipboard & Output Pattern** — Copy-to-clipboard with toast confirmation is used across nearly every tool. Standardized via `CopyButton` component (OutputDisplay was deprecated — not needed).

6. **Mobile Responsiveness** — 375px minimum viewport, 44x44px touch targets, single-column stacking. Affects: sidebar (overlay on mobile), command palette, all tool layouts, action buttons.

7. **Per-Tool SEO** — Each tool needs unique title, meta description, Open Graph tags. Requires route-level meta tag management within the SPA architecture.

8. **Contributor Onboarding** — Adding a new tool follows a documented 8-step pattern in CONTRIBUTING.md. Architecture must make this pattern clear and friction-free: create component, add types, barrel exports, registry entry, update types, validation, unit tests, E2E test.

## Starter Template Evaluation

### Primary Technology Domain

Client-side web application (React SPA) — identified from project requirements and existing codebase.

### Starter Options Considered

**Not applicable — brownfield project.**

csr-dev-tools is a shipped MVP with 6 live tools, an established component library (30 components), a defined project structure, and pinned dependency versions. The architectural foundation is proven and running. No starter template evaluation is needed.

### Established Foundation (Brownfield Baseline)

**Rationale:** The existing codebase IS the starter. All technology decisions were made during MVP development and are documented in `project-context.md` with 53 rules. The architecture builds on this foundation rather than replacing it.

**Architectural Decisions Already Established:**

**Language & Runtime:**
- TypeScript 5.9.3 (strict mode, ES2022 target, `verbatimModuleSyntax: true`)
- ESM only (`"type": "module"`)
- Node.js >= 24.5.0

**UI Framework:**
- React 19.2.4 (JSX via react-jsx automatic runtime)
- TanStack Router 1.159.5 (lazy-loaded file-based routing, `defaultPreload: 'intent'`, scroll restoration)
- TanStack React Query 5.90.21 (configured with `gcTime: 1hr`, `staleTime: 1min`, `retry: false` — no server calls)

**Styling Solution:**
- Tailwind CSS 4.1.18 via `@tailwindcss/vite` plugin (CSS-first config in `src/index.css`, no JS config file)
- tailwind-variants 3.2.2 via custom `tv()` wrapper from `@/utils` with `twMerge: true`
- Radix UI for accessible primitives (Dialog, Select, Tabs, Toast)
- Motion 12.34.0 for animations (import from `motion/react`)
- OKLCH color space, dark-first theme, Space Mono typography

**State Management:**
- Zustand 5.0.11 for client state (`hooks/state/`)
- Persistent state hooks (`hooks/persist/`) for cross-session data (layout preferences)
- No server state — React Query configured but unused by design

**Build Tooling:**
- Vite 7.3.1 with `@vitejs/plugin-react` 5.1.4
- Code splitting per route via `lazyRouteComponent()`
- Feature-level code splitting — each tool is its own chunk
- `vite-tsconfig-paths` 6.1.0 for `@/*` alias resolution

**Testing Framework:**
- Vitest 4.0.18 (node environment, globals enabled)
- Co-located test files as `*.spec.ts`
- Pure function testing — no DOM/component tests
- 15 existing tests in `color.spec.ts`

**Code Quality:**
- oxlint 1.46.0 (replaces ESLint) — `type` over `interface`, `Array<T>` over `T[]`, no console.log
- oxfmt 0.31.0 (replaces Prettier) — no semicolons, single quotes, trailing commas, 120 char width, Tailwind class sorting in `tv()` calls

**Code Organization:**
```
src/
  components/common/    — Reusable UI primitives (14 components)
  components/feature/   — Tool implementations by domain (6 tools)
  constants/            — App-wide constants (routes, features, image config)
  hooks/state/          — Zustand stores
  hooks/persist/        — Persistent state hooks
  pages/                — Route page components (default export)
  types/                — Type definitions mirroring src/ structure
  utils/                — Pure utility functions
```

**Development Experience:**
- `pnpm dev` — Dev server on port 5173 with HMR
- `pnpm build` — `tsc -b && vite build`
- `pnpm lint` / `pnpm format` — oxlint + oxfmt
- `pnpm test` — Vitest single run
- VS Code integration via oxc extension

**Note:** No project initialization story is needed. The first implementation work will build on this existing foundation.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. Routing architecture — hybrid (dashboard cards + dedicated tool routes)
2. Tool registry architecture — centralized `TOOL_REGISTRY` as single source of truth
3. Per-tool SEO — build-time pre-rendering via Vite plugin

**Important Decisions (Shape Architecture):**
4. Platform layout state — separate Zustand stores per concern
5. Error handling — `useToast` with `type: 'error'` + per-tool Error Boundary
6. Input validation — shared validation utilities in `src/utils/validation.ts`
7. Testing strategy — unit tests (logic) + E2E tests (user journeys)
8. CI/CD pipeline — full quality gates (lint, format, test, build, E2E, Lighthouse CI)

**Deferred Decisions (Post-MVP):**
- Offline/service worker support (NFR21 noted as future consideration)
- Plugin architecture for community-submitted tools (Phase 3)

### Data Architecture

**Not applicable.** Zero server dependencies, no database, no server-side data. All data is ephemeral — processed in-browser and never persisted beyond the session. Layout preferences persisted via Zustand `persist` middleware to localStorage.

### Authentication & Security

**Not applicable.** No user accounts, no authentication, no sessions — permanent architectural boundary. Client-side security is enforced by the zero-network constraint (NFR9): no data leaves the browser, no third-party scripts (NFR11), no cookies or tracking (NFR10).

### API & Communication Patterns

**Not applicable.** No server API, no backend communication. All tool processing is client-side. The only network activity is initial static asset loading.

### Frontend Architecture

**Routing: Hybrid Dashboard + Dedicated Routes**
- Decision: Tools live on both the dashboard (inline cards for quick use) AND have dedicated routes (`/tools/{tool-slug}`) for SEO and direct access
- Rationale: Dashboard preserves the existing card grid UX; dedicated routes satisfy FR27 (unique URL per tool) and NFR23-25 (per-tool SEO)
- Affects: Route registration, tool component rendering modes (card vs. page), navigation patterns
- Implementation: Tools accept a `mode` variant and own their layout — no shared layout wrapper

**Per-Tool SEO: Build-Time Pre-Rendering**
- Decision: Use a Vite pre-rendering plugin to generate static HTML per tool route at build time
- Rationale: Full SEO coverage (crawlers + social previews) without server runtime, stays within static hosting constraint
- Affects: Build pipeline, tool route registration, SEO metadata in tool registry
- Implementation: Pre-renderer consumes tool registry routes, generates HTML with correct meta tags

**Tool Registry: Centralized `TOOL_REGISTRY`**
- Decision: Single registry object mapping each tool to all its metadata (name, category, emoji, description, SEO fields, route path, component lazy import)
- Rationale: Single source of truth consumed by sidebar, command palette, router, pre-renderer, and dashboard selection dialog. Simplifies "add a tool" workflow to one registry entry + component files
- Note: The dashboard is a fixed 6-slot favorites grid. New tools do NOT auto-appear on the dashboard — they appear in the selection dialog, sidebar, command palette, and their dedicated route
- Affects: Replaces current `FEATURE_TITLE` constants and manual lazy imports in `home/index.tsx`
- Implementation: `src/constants/tool-registry.ts` with `ToolRegistryEntry` type

**Platform Layout State: Separate Zustand Stores**
- Decision: `useSidebarStore` and `useCommandPaletteStore` as separate Zustand stores
- Rationale: Granular subscriptions, avoids unnecessary re-renders, consistent with existing Zustand patterns (`useToast`, `usePersistFeatureLayout`)
- Affects: Sidebar, command palette, header hamburger, keyboard shortcut handlers
- Implementation: New stores in `src/hooks/state/`

**Input Validation: Shared Utilities**
- Decision: Reusable validators in `src/utils/validation.ts` (`isValidHex`, `isValidBase64`, etc.) with tool-specific validators co-located with their tools
- Rationale: Pure functions, lightweight, testable with Vitest, fits existing `utils/` pattern
- Affects: All tool input handling, error state triggering

**Error Handling: Standardized Hook + Error Boundary**
- Decision: `useToast` Zustand store with `type: 'error'` for operational errors. Errors display as toast notifications (3s auto-dismiss). React Error Boundary per tool for unexpected crashes.
- Rationale: Consistent error UX through a single toast system — no per-tool error state boilerplate
- Affects: Every tool component

### Infrastructure & Deployment

**Hosting: Cloudflare Pages**
- Decision: Static site hosted on Cloudflare Pages, deployed via existing GitHub Actions pipeline
- Rationale: Free tier with unlimited bandwidth, global CDN, already implemented
- Affects: Build output format (static), pre-rendering output

**CI/CD: Full Quality Pipeline**
- Decision: GitHub Actions pipeline with lint + format check + unit tests + build (with pre-rendering) + E2E tests + Lighthouse CI
- Rationale: Lighthouse scores are explicit PRD success criteria (NFR7, NFR18, NFR23). E2E tests validate user journeys. Automated quality gates prevent regression.
- Affects: PR workflow, merge requirements, build time

**Testing: Unit + E2E**
- Decision: Unit tests (Vitest, node env) for pure logic and validation. E2E tests (Playwright) for user-facing journeys in a real browser. No component testing layer.
- Rationale: Two clean testing levels — logic correctness and user experience — without the overhead of a middle component testing layer
- Affects: Test infrastructure, CI pipeline, contributor testing workflow

### Decision Impact Analysis

**Implementation Sequence:**
1. Centralized tool registry — foundation that everything else depends on
2. Per-tool route registration — consumes registry, enables hybrid routing
3. Sidebar + Command Palette — consume registry for navigation
4. Pre-rendering setup — consumes registry routes for build-time SEO
5. Shared validation utilities — consumed by new and refactored tools
6. Error handling standardization — `useToast` (error toasts) + Error Boundaries
7. E2E test infrastructure + Lighthouse CI — quality gates

**Cross-Component Dependencies:**
- Tool Registry → Routes, Dashboard, Sidebar, Command Palette, Pre-renderer, SEO
- useToast (error toasts) → Tool components (errors shown via toast notifications)
- Zustand stores → Sidebar ↔ Header hamburger, Command Palette ↔ keyboard shortcuts
- Pre-rendering → Tool Registry (routes), SEO metadata (tool entries)
- CI pipeline → Unit tests, E2E tests, Lighthouse, build (with pre-rendering)

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 10 areas where AI agents could make different choices. These patterns supplement the 53 rules in `project-context.md` — they cover new architectural patterns introduced by our decisions.

### Naming Patterns

**Code Naming (reinforced + extended):**

All existing naming rules from `project-context.md` remain in effect. Additional patterns for new constructs:

| Construct | Convention | Example |
|-----------|-----------|---------|
| Tool registry key | `kebab-case` matching route slug | `'color-converter'`, `'json-formatter'` |
| Tool route path | `/tools/{tool-key}` | `/tools/color-converter` |
| Tool category | `PascalCase` enum value | `'Color'`, `'Encoding'`, `'Image'` |
| Zustand store | `use{Feature}Store` | `useSidebarStore`, `useCommandPaletteStore` |
| Validation util | `isValid{Format}` returning `boolean` | `isValidHex()`, `isValidBase64()` |
| Error toast | `useToast` with `type: 'error'` | `toast({ action: 'add', item: { label: msg, type: 'error' } })` |
| SEO title | `{Tool Name} - CSR Dev Tools` | `'Color Converter - CSR Dev Tools'` |
| SEO description | Max 155 chars, action-oriented | `'Convert colors between HEX, RGB, HSL formats...'` |
| E2E test file | `{tool-key}.spec.ts` in `e2e/` | `e2e/color-converter.spec.ts` |

### Structure Patterns

**Tool Registry Entry Pattern:**

Every tool MUST have a registry entry in `src/constants/tool-registry.ts` with this exact structure:

```typescript
{
  key: 'json-formatter',              // kebab-case, unique, matches route slug
  name: 'JSON Formatter',             // Display name
  category: 'Data',                   // One of the defined categories
  emoji: '📋',                        // Single emoji for sidebar/dashboard
  description: 'Format and validate JSON with syntax highlighting',
  seo: {
    title: 'JSON Formatter - CSR Dev Tools',
    description: 'Format, validate, and beautify JSON online...',
  },
  routePath: '/tools/json-formatter', // Derived from key, but explicit
  component: lazy(() => import('@/components/feature/data/JsonFormatter')),
}
```

**Required fields:** All fields above are mandatory. No optional fields.

**Tool Component File Structure:**

```
src/components/feature/{domain}/
  {ToolName}.tsx          — Main component (named export)
  input/                  — Tool-specific input components (if needed)
    {ToolName}Input.tsx
src/types/components/feature/{domain}/
  {tool-name}.ts          — Types for the tool
```

**New Platform Component Location:**

```
src/components/common/sidebar/       — Sidebar, SidebarCategory, SidebarToolItem
src/components/common/command-palette/ — CommandPalette, SearchInput
src/components/common/button/        — Button, CopyButton
src/components/common/error-boundary/ — ToolErrorBoundary
```

**E2E Test Structure:**

```
e2e/
  {tool-key}.spec.ts     — One file per tool
  platform/
    sidebar.spec.ts      — Platform feature tests
    command-palette.spec.ts
    navigation.spec.ts
  helpers/
    selectors.ts         — Shared test selectors
    fixtures.ts          — Shared test data
```

### Format Patterns

**Tool Processing Output:**

- Text outputs: always trimmed, no trailing newline
- Color values: lowercase hex (`#3b82f6` not `#3B82F6`), standard format strings (`rgb(59, 130, 246)`)
- Numeric outputs: no unnecessary decimal places (`16` not `16.00`, but `16.5` when fractional)
- File downloads: filename format `{descriptive-name}.{ext}` (`resized-image.png` not `output.png`)

**Error Message Format:**

- Concise, actionable, no blame: `'Enter a valid hex color (e.g., #3B82F6)'`
- Always include an example of valid input in parentheses
- Never technical jargon: `'Enter a valid hex color'` not `'Invalid hexadecimal color string'`
- Never modal, always inline below the relevant input

### Communication Patterns

**Zustand Store Pattern:**

All new stores follow the existing pattern exactly:

```typescript
// src/hooks/state/useSidebarStore.ts
import { create } from 'zustand'

import type { StoreApi } from 'zustand'

import type { UseSidebarStore } from '@/types'

export const useSidebarStore = create<UseSidebarStore>()(
  (set: StoreApi<UseSidebarStore>['setState']) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  }),
)
```

**Rules:**
- Actions are verb-based: `open`, `close`, `toggle`, `set{Property}`
- Boolean state uses `is` prefix: `isOpen`, `isVisible`
- Store types defined in `src/types/hooks/state.ts`
- No derived state in stores — compute in components or selectors

**Toast Notification Pattern:**

- Copy success: `'Copied to clipboard'` (no variation)
- Download success: `'Downloaded {filename}'`
- Error: `'{Error message}'` using the `error` variant
- Duration: 2500ms auto-dismiss (existing default)
- No custom toast types — use existing `useToast` store

**Keyboard Shortcut Pattern:**

- Register in a centralized `useKeyboardShortcuts` hook at the app level
- `Cmd+K` / `Ctrl+K` — Command Palette toggle (reserved)
- Tool-specific shortcuts: none (tools don't have keyboard shortcuts)
- Shortcuts use `useEffect` with `keydown` listener, check `metaKey` (Mac) or `ctrlKey` (Windows)

### Process Patterns

**Tool Input Processing:**

| Tool Type | Processing Trigger | Debounce |
|-----------|-------------------|----------|
| Text conversion (color, encoding, units, timestamp) | On input change | 150ms debounce |
| File processing (image resize, convert) | On explicit action button click | None |
| Generator (UUID, password, hash) | On explicit "Generate" button click | None |
| Live preview (box shadow, regex) | On input change | 150ms debounce |

**Error Handling Flow:**

1. **Prevention first** — constrain inputs (disabled options, input masks, format hints)
2. **Validation** — `isValid{Format}()` check on input change (debounced)
3. **Error display** — `toast({ action: 'add', item: { label: msg, type: 'error' } })` shows error as a toast notification (3s auto-dismiss)
4. **Crash recovery** — `ToolErrorBoundary` catches unexpected errors, shows "Something went wrong" with a Reset button

**Loading State Pattern:**

- Text tools: never show loading (processing is instant)
- File tools: show `ProgressBar` only when processing exceeds 300ms
- Route-level: skeleton card outline with pulse animation while lazy chunk loads
- No spinners anywhere — use progress bars or skeleton states only

### Enforcement Guidelines

**All AI Agents MUST:**

1. Read `project-context.md` (53 rules) AND this architecture document before implementing any code
2. Add tools via the centralized `TOOL_REGISTRY` — never register tools manually in page components
3. Use `useToast` with `type: 'error'` for error handling — never implement custom error state in tools
4. Use shared validators from `src/utils/validation.ts` — never duplicate validation logic
5. Follow the exact Zustand store pattern — never create stores with different conventions
6. Ensure every tool works in both card and page mode — never build single-mode tools
7. Each tool owns its own layout — no shared layout wrapper component

**Pattern Verification:**

- `pnpm lint` catches naming violations (oxlint rules)
- `pnpm format:check` catches formatting violations (oxfmt rules)
- `pnpm test` catches logic regressions (Vitest)
- E2E tests catch tool behavior regressions (Playwright)
- Lighthouse CI catches performance/accessibility regressions
- PR review checklist verifies registry entry, error toast usage, and both rendering modes

### Pattern Examples

**Good — Adding a new tool:**
```typescript
// 1. Registry entry in src/constants/tool-registry.ts
{ key: 'jwt-decoder', name: 'JWT Decoder', category: 'Encoding', emoji: '🔑', ... }

// 2. Component owns its own layout, uses useToast for errors
export const JwtDecoder = () => {
  const { toast } = useToast()
  // on error: toast({ action: 'add', item: { label: msg, type: 'error' } })
  return (
    <Card>
      {/* Tool header, inputs, outputs, actions — tool owns its layout */}
      <CopyButton value={output} />
    </Card>
  )
}

// 3. Validation uses shared util
import { isValidJwt } from '@/utils/validation'
```

**Anti-Patterns to Avoid:**
```typescript
// ❌ Manual registration in home/index.tsx instead of registry
// ❌ Custom error state: const [error, setError] = useState('')
// ❌ Inline validation: if (input.length < 3) setError('too short')
// ❌ Default export for tool component
// ❌ import from 'framer-motion' instead of 'motion/react'
// ❌ interface ToolProps {} instead of type ToolProps = {}
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
csr-dev-tools/
├── .github/
│   └── workflows/
│       ├── deploy.yml                    # Existing: Cloudflare Pages deploy
│       ├── ci.yml                        # ← NEW: lint + format + test + build
│       └── lighthouse.yml                # ← NEW: Lighthouse CI on PR
├── .oxlintrc.json                        # oxlint config
├── .oxfmtrc.json                         # oxfmt config
├── .npmrc                                # pnpm config (save-exact=true)
├── .vscode/
│   └── settings.json                     # VS Code workspace settings
├── .vscode.example/
│   └── settings.json                     # Example settings for contributors
├── index.html                            # SPA entry HTML
├── package.json                          # Dependencies, scripts, engine constraints
├── pnpm-lock.yaml
├── tsconfig.json                         # TypeScript project references
├── tsconfig.app.json                     # App TypeScript config
├── tsconfig.node.json                    # Node TypeScript config
├── vite.config.ts                        # Vite config (React + paths + Tailwind + pre-render)
├── vitest.config.ts                      # Vitest config
├── playwright.config.ts                  # ← NEW: Playwright E2E config
├── lighthouserc.cjs                      # ← NEW: Lighthouse CI config (.cjs for ESM compat)
├── LICENSE
├── README.md
├── CONTRIBUTING.md                       # ← NEW: Contributor guide (FR33)
│
├── docs/                                 # Project documentation
│   ├── index.md
│   ├── project-overview.md
│   ├── architecture.md
│   ├── source-tree-analysis.md
│   ├── component-inventory.md
│   └── development-guide.md
│
├── public/
│   └── fonts/
│       └── NotoColorEmoji-Regular.ttf
│
├── e2e/                                  # ← NEW: Playwright E2E tests
│   ├── color-converter.spec.ts           # Per-tool E2E tests
│   ├── base64-encoder.spec.ts
│   ├── image-converter.spec.ts
│   ├── image-resizer.spec.ts
│   ├── unix-timestamp.spec.ts
│   ├── px-to-rem.spec.ts
│   ├── platform/
│   │   ├── sidebar.spec.ts
│   │   ├── command-palette.spec.ts
│   │   ├── navigation.spec.ts
│   │   └── seo.spec.ts
│   └── helpers/
│       ├── selectors.ts                  # Shared test selectors
│       └── fixtures.ts                   # Shared test data
│
├── dist/                                 # Production build output (gitignored)
│
└── src/
    ├── main.tsx                          # Entry point: React root, Router, QueryClient
    ├── App.tsx                           # Root layout: header, sidebar, outlet, toast
    ├── routes.tsx                        # TanStack Router: route tree (consumes TOOL_REGISTRY)
    ├── index.css                         # Global styles, Tailwind @theme config
    ├── vite-env.d.ts
    │
    ├── components/
    │   ├── index.ts                      # Barrel export
    │   ├── common/
    │   │   ├── index.ts
    │   │   ├── animate/
    │   │   │   ├── TwinkleStarsAnimate.tsx
    │   │   │   └── index.ts
    │   │   ├── button/
    │   │   │   ├── Button.tsx
    │   │   │   ├── CopyButton.tsx        # ← NEW: standardized copy-to-clipboard
    │   │   │   └── index.ts
    │   │   ├── card/
    │   │   │   ├── Card.tsx
    │   │   │   └── index.ts
    │   │   ├── command-palette/          # ← NEW
    │   │   │   ├── CommandPalette.tsx
    │   │   │   ├── SearchInput.tsx
    │   │   │   └── index.ts
    │   │   ├── dialog/
    │   │   │   ├── Dialog.tsx
    │   │   │   └── index.ts
    │   │   ├── emoji/
    │   │   │   ├── NotoEmoji.tsx
    │   │   │   └── index.ts
    │   │   ├── error-boundary/           # ← NEW
    │   │   │   ├── ToolErrorBoundary.tsx
    │   │   │   └── index.ts
    │   │   ├── form/
    │   │   │   ├── FieldForm.tsx
    │   │   │   └── index.ts
    │   │   ├── icon/
    │   │   │   ├── AlertIcon.tsx
    │   │   │   ├── ArrowIcon.tsx
    │   │   │   ├── CheckIcon.tsx
    │   │   │   ├── ChevronIcon.tsx
    │   │   │   ├── CopyIcon.tsx
    │   │   │   ├── DownloadIcon.tsx
    │   │   │   ├── HamburgerIcon.tsx     # ← NEW
    │   │   │   ├── ImageIcon.tsx
    │   │   │   ├── InfoIcon.tsx
    │   │   │   ├── PlusIcon.tsx
    │   │   │   ├── RefreshIcon.tsx
    │   │   │   ├── SearchIcon.tsx        # ← NEW
    │   │   │   ├── TrashIcon.tsx
    │   │   │   ├── UploadIcon.tsx
    │   │   │   ├── XIcon.tsx
    │   │   │   └── index.ts
    │   │   ├── input/
    │   │   │   ├── SelectInput.tsx
    │   │   │   ├── TextAreaInput.tsx
    │   │   │   ├── TextInput.tsx
    │   │   │   ├── UploadInput.tsx
    │   │   │   └── index.ts
    │   │   ├── progress-bar/
    │   │   │   ├── ProgressBar.tsx
    │   │   │   └── index.ts
    │   │   ├── sidebar/                  # ← NEW
    │   │   │   ├── Sidebar.tsx
    │   │   │   ├── SidebarCategory.tsx
    │   │   │   ├── SidebarToolItem.tsx
    │   │   │   ├── CategoryBadge.tsx
    │   │   │   └── index.ts
    │   │   ├── table/
    │   │   │   ├── DataCellTable.tsx
    │   │   │   └── index.ts
    │   │   ├── tabs/
    │   │   │   ├── Tabs.tsx
    │   │   │   └── index.ts
    │   │   ├── toast/
    │   │   │   ├── ToastProvider.tsx
    │   │   │   └── index.ts
    │   │
    │   └── feature/
    │       ├── index.ts
    │       ├── color/
    │       │   ├── ColorConvertor.tsx
    │       │   └── index.ts
    │       ├── encoding/
    │       │   ├── EncodingBase64.tsx
    │       │   ├── JwtDecoder.tsx        # ← NEW (Phase 2)
    │       │   ├── UrlEncoder.tsx        # ← NEW (Phase 2)
    │       │   └── index.ts
    │       ├── image/
    │       │   ├── ImageConvertor.tsx
    │       │   ├── ImageResizer.tsx
    │       │   ├── input/
    │       │   │   ├── ImageFormatSelectInput.tsx
    │       │   │   ├── ImageQualitySelectInput.tsx
    │       │   │   └── index.ts
    │       │   └── index.ts
    │       ├── time/
    │       │   ├── TimeUnixTimestamp.tsx
    │       │   └── index.ts
    │       ├── unit/
    │       │   ├── UnitPxToRem.tsx
    │       │   └── index.ts
    │       ├── data/                     # ← NEW (Phase 2)
    │       │   ├── JsonFormatter.tsx
    │       │   ├── JsonYamlConverter.tsx
    │       │   ├── JsonCsvConverter.tsx
    │       │   └── index.ts
    │       ├── text/                     # ← NEW (Phase 2)
    │       │   ├── TextDiffChecker.tsx
    │       │   ├── RegexTester.tsx
    │       │   └── index.ts
    │       ├── generator/                # ← NEW (Phase 2)
    │       │   ├── UuidGenerator.tsx
    │       │   ├── PasswordGenerator.tsx
    │       │   ├── HashGenerator.tsx
    │       │   └── index.ts
    │       └── css/                      # ← NEW (Phase 2)
    │           ├── BoxShadowGenerator.tsx
    │           └── index.ts
    │
    ├── constants/
    │   ├── index.ts
    │   ├── feature.ts                    # FEATURE_TITLE (existing, consumed by registry)
    │   ├── image.ts
    │   ├── route.ts                      # ROUTE_PATH (extended with tool routes)
    │   └── tool-registry.ts              # ← NEW: centralized TOOL_REGISTRY
    │
    ├── hooks/
    │   ├── index.ts
    │   ├── useCopyToClipboard.ts
    │   ├── useDebounce.ts
    │   ├── useDebounceCallback.ts
    │   ├── useKeyboardShortcuts.ts       # ← NEW: centralized shortcut handler
    │   ├── useToolSeo.ts                      # Tool SEO metadata hook
    │   ├── state/
    │   │   ├── index.ts
    │   │   ├── useToast.ts
    │   │   ├── useSidebarStore.ts        # ← NEW
    │   │   └── useCommandPaletteStore.ts # ← NEW
    │   └── persist/
    │       ├── index.ts
    │       └── usePersistFeatureLayout.ts
    │
    ├── pages/
    │   ├── home/
    │   │   └── index.tsx                 # Dashboard: card grid (consumes TOOL_REGISTRY)
    │   ├── tool/                         # ← NEW: dedicated tool route pages
    │   │   └── index.tsx                 # Tool page wrapper (consumes TOOL_REGISTRY)
    │   └── showcase/
    │       └── index.tsx
    │
    ├── types/
    │   ├── index.ts
    │   ├── components/
    │   │   ├── index.ts
    │   │   ├── common/
    │   │   │   ├── animate.ts
    │   │   │   ├── button.ts
    │   │   │   ├── card.ts
    │   │   │   ├── command-palette.ts    # ← NEW
    │   │   │   ├── dialog.ts
    │   │   │   ├── error-boundary.ts     # ← NEW
    │   │   │   ├── form.ts
    │   │   │   ├── input.ts
    │   │   │   ├── sidebar.ts            # ← NEW
    │   │   │   ├── table.ts
    │   │   │   ├── tabs.ts
    │   │   │   ├── toast.ts
    │   │   │   └── index.ts
    │   │   └── index.ts
    │   ├── constants/
    │   │   ├── color.ts
    │   │   ├── feature.ts
    │   │   ├── image.ts
    │   │   ├── route.ts
    │   │   ├── time.ts
    │   │   ├── tool-registry.ts          # ← NEW
    │   │   └── index.ts
    │   ├── hooks/
    │   │   ├── persist.ts
    │   │   ├── state.ts                  # Extended with sidebar + command palette types
    │   │   ├── types.ts
    │   │   └── index.ts
    │   └── utils/
    │       ├── image.ts
    │       ├── tailwind-variants.ts
    │       ├── validation.ts             # ← NEW
    │       └── index.ts
    │
    └── utils/
        ├── index.ts
        ├── color.ts
        ├── color.spec.ts                 # 15 existing tests
        ├── file.ts
        ├── image.ts
        ├── tailwind-variants.ts
        ├── time.ts
        ├── validation.ts                 # ← NEW: shared validation utilities
        └── validation.spec.ts            # ← NEW: validation tests
```

### Architectural Boundaries

**Component Boundaries:**

```
┌─────────────────────────────────────────────────────┐
│ App.tsx (Root Layout)                                │
│  ├── Header (hamburger toggle, logo, theme, Cmd+K)  │
│  ├── Sidebar (collapsible, consumes TOOL_REGISTRY)   │
│  ├── CommandPalette (modal, consumes TOOL_REGISTRY)   │
│  ├── Outlet (TanStack Router)                        │
│  │   ├── Home Page (dashboard card grid)             │
│  │   │   └── Tool Cards (compact mode)               │
│  │   ├── Tool Page (dedicated route)                 │
│  │   │   └── Tool Component (full mode)              │
│  │   └── Showcase Page                               │
│  └── ToastProvider                                   │
└─────────────────────────────────────────────────────┘
```

**State Boundaries:**

| Store | Scope | Persisted | Consumers |
|-------|-------|-----------|-----------|
| `useToast` | Global | No | Any component via toast actions |
| `usePersistFeatureLayout` | Global | Yes (localStorage) | Home page dashboard |
| `useSidebarStore` | Global | No | Header, Sidebar, mobile overlay |
| `useCommandPaletteStore` | Global | No | Header, CommandPalette, keyboard handler |
| `useToast` (errors) | Global | No | Tool components show errors via `type: 'error'` toast |

**Data Flow:**

```
TOOL_REGISTRY (single source of truth)
    │
    ├──→ routes.tsx         → generates tool routes
    ├──→ Home page          → populates selection dialog (dashboard is fixed 6-slot favorites grid)
    ├──→ Sidebar            → renders category groups
    ├──→ CommandPalette     → fuzzy search results
    ├──→ Pre-renderer       → generates static HTML per route
    └──→ SEO meta tags      → title, description, OG per route

User Input → Tool Component → Pure Utility Function → Output Display
                │                                         │
                └── useToast (type: 'error') ────────────────┘
                └── useCopyToClipboard ──→ useToast (type: 'success')
```

### Requirements to Structure Mapping

**FR Category Mapping:**

| FR Category | Directory | Key Files |
|------------|-----------|-----------|
| Tool Processing (FR1-FR4) | `components/feature/` | Each tool component owns its layout |
| Color Tools (FR5-FR7) | `components/feature/color/` | `ColorConvertor.tsx` |
| Encoding Tools (FR8-FR10) | `components/feature/encoding/` | `EncodingBase64.tsx`, `JwtDecoder.tsx`, `UrlEncoder.tsx` |
| Image Tools (FR11-FR14) | `components/feature/image/` | `ImageConvertor.tsx`, `ImageResizer.tsx` |
| Time & Unit Tools (FR15-FR16) | `components/feature/time/`, `feature/unit/` | `TimeUnixTimestamp.tsx`, `UnitPxToRem.tsx` |
| Data & Format Tools (FR17-FR19) | `components/feature/data/` | `JsonFormatter.tsx`, `JsonYamlConverter.tsx`, `JsonCsvConverter.tsx` |
| Text Tools (FR20-FR21) | `components/feature/text/` | `TextDiffChecker.tsx`, `RegexTester.tsx` |
| Generator Tools (FR22-FR24) | `components/feature/generator/` | `UuidGenerator.tsx`, `PasswordGenerator.tsx`, `HashGenerator.tsx` |
| CSS Tools (FR25) | `components/feature/css/` | `BoxShadowGenerator.tsx` |
| Navigation & Discovery (FR26-FR29) | `components/common/sidebar/`, `command-palette/` | `Sidebar.tsx`, `CommandPalette.tsx` |
| Customization (FR30-FR31) | `hooks/persist/`, `App.tsx` | `usePersistFeatureLayout.ts` |
| Contributor Experience (FR33-FR35) | `CONTRIBUTING.md`, `constants/tool-registry.ts` | Registry pattern, docs |
| Documentation & Quality (FR36-FR38) | `components/feature/`, `CONTRIBUTING.md` | Tool components (descriptions, tooltips), contributor guide |

**Cross-Cutting Concerns Mapping:**

| Concern | Primary Location | Supporting Files |
|---------|-----------------|-----------------|
| Code Splitting | `routes.tsx`, `constants/tool-registry.ts` | Vite config, lazy imports |
| Accessibility | `components/common/` (Radix primitives) | All tool components |
| Theme System | `src/index.css` (`@theme`) | All components via Tailwind |
| Error Handling | `hooks/state/useToast.ts`, `common/error-boundary/` | All tool components |
| Validation | `utils/validation.ts` | Per-tool validation in feature dirs |
| SEO | `constants/tool-registry.ts` (metadata) | Pre-render plugin, `pages/tool/` |
| Mobile Responsiveness | `components/feature/` | Sidebar (mobile overlay), all tool components |

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** PASS

All technology choices are compatible:
- React 19 + TanStack Router + Vite 7 — proven working stack (existing MVP)
- Zustand stores (new sidebar/command palette) follow identical pattern to existing stores (useToast)
- Radix UI for new accessible components (sidebar navigation) — consistent with existing Dialog, Select, Tabs usage
- Motion for new animations (sidebar slide, palette fade) — consistent with existing button animations
- Playwright for E2E tests is independent of Vitest unit tests — no conflicts
- Pre-rendering via Vite plugin integrates into existing `pnpm build` without changing the build toolchain
- No contradictory decisions found

**Pattern Consistency:** PASS

- Naming conventions extend cleanly to all new constructs
- Tool registry key naming (`kebab-case`) aligns with route path convention (`/tools/{key}`)
- New Zustand stores follow exact same `create<T>()()` pattern as existing stores
- New components follow same `tv()` variant pattern, barrel exports, and type separation
- Error handling unified through `useToast` — both success and error notifications use the same `ToastProvider` rendering system

**Structure Alignment:** PASS

- New directories follow existing `components/common/{name}/` and `components/feature/{domain}/` patterns
- E2E tests in `e2e/` clearly separated from unit tests in `src/utils/*.spec.ts`
- Type files mirror source structure exactly — no structural divergence

### Requirements Coverage Validation

**Functional Requirements Coverage:** 38/38 COVERED

| FR Range | Category | Architectural Support |
|----------|----------|----------------------|
| FR1-FR4 | Tool Processing | Tool component ownership, client-side processing, `CopyButton` |
| FR5-FR7 | Color Tools | Existing `ColorConvertor` (refactored, owns its own layout) |
| FR8-FR10 | Encoding Tools | Existing `EncodingBase64` + new `JwtDecoder`, `UrlEncoder` |
| FR11-FR14 | Image Tools | Existing `ImageConvertor`/`ImageResizer` |
| FR15-FR16 | Time & Unit | Existing `TimeUnixTimestamp`, `UnitPxToRem` |
| FR17-FR19 | Data & Format | New `JsonFormatter`, `JsonYamlConverter`, `JsonCsvConverter` |
| FR20-FR21 | Text Tools | New `TextDiffChecker`, `RegexTester` |
| FR22-FR24 | Generators | New `UuidGenerator`, `PasswordGenerator`, `HashGenerator` |
| FR25 | CSS Tools | New `BoxShadowGenerator` |
| FR26-FR29 | Navigation | `Sidebar`, `CommandPalette`, tool routes, responsive layout |
| FR30-FR31 | Customization | `usePersistFeatureLayout` |
| FR33-FR35 | Contributors | `CONTRIBUTING.md`, `TOOL_REGISTRY` pattern, tests |
| FR36-FR38 | Documentation | Tool components (description, placeholders, tooltips) |

**Non-Functional Requirements Coverage:** 25/25 COVERED

| NFR | Requirement | Architectural Support |
|-----|------------|----------------------|
| NFR1-NFR2 | Performance targets | Client-side processing, no network overhead |
| NFR3-NFR7 | Web vitals + Lighthouse | Lighthouse CI in pipeline, code splitting, lazy loading |
| NFR8 | No bundle bloat | `TOOL_REGISTRY` with lazy imports, per-tool code splitting |
| NFR9 | Zero network for processing | Hard constraint — no API layer exists |
| NFR10-NFR12 | Privacy & security | No cookies, no tracking, no third-party scripts |
| NFR13 | Dependency auditing | CI pipeline can include `pnpm audit` |
| NFR14-NFR18 | Accessibility | Radix UI primitives, WCAG 2.1 AA, Lighthouse CI |
| NFR19-NFR20 | Regression testing | Vitest (unit) + Playwright (E2E), CI pipeline |
| NFR21 | Offline after load | Deferred (service worker — future consideration) |
| NFR22 | No runtime errors | TypeScript strict mode, Error Boundaries, E2E tests |
| NFR23-NFR25 | SEO | Build-time pre-rendering, per-tool meta tags via registry |

### Implementation Readiness Validation

**Decision Completeness:** PASS
- 9 architectural decisions documented with rationale, affects, and implementation notes
- All technology versions pinned (brownfield — no version ambiguity)
- Deferred decisions explicitly listed with rationale

**Structure Completeness:** PASS
- Complete directory tree with ~120 files/directories defined
- All new files marked with `← NEW` for clarity
- Existing files preserved — brownfield baseline intact

**Pattern Completeness:** PASS
- 10 conflict points identified and resolved
- Naming table covers all new constructs
- Code examples provided (good patterns + anti-patterns)
- Process patterns fully specified

### Gap Analysis Results

**Critical Gaps:** 0

**Important Gaps:** 2

1. **Pre-rendering plugin selection** — decided on build-time pre-rendering but no specific Vite plugin chosen. Implementation-level detail — the implementing agent should evaluate current options and select the best maintained one.

2. **Playwright version not pinned** — E2E framework decided but no version specified. The implementing agent should install the latest stable version and pin it.

**Nice-to-Have Gaps:** 2

1. **Web Worker pattern for image tools** — if image processing is slow on large files, Web Workers could offload computation. Pattern can be added when needed.
2. ~~**Light theme token definitions**~~ — **NOT PLANNED:** Dark-only theme decision. No light theme tokens needed.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed (38 FRs, 25 NFRs, 53 project rules)
- [x] Scale and complexity assessed (low-to-medium)
- [x] Technical constraints identified (6 hard constraints)
- [x] Cross-cutting concerns mapped (8 concerns)

**Architectural Decisions**
- [x] Critical decisions documented (routing, registry, SEO)
- [x] Technology stack fully specified (brownfield baseline)
- [x] Integration patterns defined (registry → all consumers)
- [x] Performance considerations addressed (code splitting, lazy loading, Lighthouse CI)

**Implementation Patterns**
- [x] Naming conventions established (10 new construct patterns)
- [x] Structure patterns defined (registry entry, file structure, E2E)
- [x] Communication patterns specified (Zustand stores, toasts, keyboard shortcuts)
- [x] Process patterns documented (input processing, error handling, loading states)

**Project Structure**
- [x] Complete directory structure defined (~120 files/dirs)
- [x] Component boundaries established (state diagram, data flow)
- [x] Integration points mapped (registry → 6 consumers)
- [x] Requirements to structure mapping complete (all 38 FRs + 25 NFRs)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Brownfield foundation eliminates technology risk — the stack is proven and running
- Centralized `TOOL_REGISTRY` is an elegant single-source-of-truth that simplifies everything downstream
- Hybrid routing gives both UX and SEO benefits without compromising either
- Strong existing conventions (53 rules) supplemented by 10 new pattern definitions minimizes agent drift
- Full CI pipeline (lint, format, test, E2E, Lighthouse) catches regressions automatically

**Areas for Future Enhancement:**
- Service worker for offline support (NFR21 — explicitly deferred)
- Web Worker pattern for heavy image processing (if needed)
- Plugin architecture for community tool submissions (Phase 3)
- ~~Light theme token definition~~ — NOT PLANNED (dark-only theme)

### Implementation Handoff

**AI Agent Guidelines:**

1. Read `project-context.md` (53 rules) AND this architecture document before implementing any code
2. Follow all architectural decisions exactly as documented
3. Use implementation patterns consistently across all components
4. Respect project structure and boundaries
5. Refer to this document for all architectural questions
6. When in doubt, follow the existing pattern in the codebase

**First Implementation Priority:**
1. Create `TOOL_REGISTRY` in `src/constants/tool-registry.ts` — migrate existing 6 tools into registry entries
2. Set up hybrid routing — per-tool routes generated from registry
3. Refactor existing tools to use `useToast` for errors and standardized patterns
4. Build sidebar system — consumes registry for category navigation
5. Build Command Palette — consumes registry for search
