# CSR Developer Tools - Architecture

**Updated:** 2026-03-20 | **Scan Level:** Quick

## Architecture Pattern

**Component-based SPA** with centralized tool registry, dynamic routing, lazy-loaded components, Zustand state management, and Radix UI accessible primitives.

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| UI Framework | React | 19.2.4 | Component rendering, JSX via react-jsx |
| Language | TypeScript | 5.9.3 | Strict mode, target ES2022, verbatimModuleSyntax |
| Build Tool | Vite | 7.3.1 | Dev server, HMR, production bundling |
| Routing | TanStack Router | 1.166.3 | Dynamic tool routing with lazy loading |
| Server State | TanStack React Query | 5.90.21 | Configured but unused (no server calls) |
| Styling | Tailwind CSS | 4.2.1 | v4 via @tailwindcss/vite plugin |
| Typography | @tailwindcss/typography | 0.5.19 | Prose styling for markdown preview |
| Variants | tailwind-variants | 3.2.2 | Component variant API via custom `tv()` wrapper |
| Merge | tailwind-merge | 3.4.0 | Peer dep of tailwind-variants for class deduplication |
| Primitives | Radix UI | Various | Dialog, Select, Switch, Tabs, Toast, Dropdown Menu |
| Animation | Motion | 12.35.1 | Animations via `motion/react` (NOT framer-motion) |
| Client State | Zustand | 5.0.11 | Lightweight stores in `hooks/state/` |
| Code Editor | @uiw/react-codemirror | 4.25.8 | JSON, SQL syntax highlighting |
| Code Editor | @monaco-editor/react | 4.7.0 | TypeScript playground with full IntelliSense |
| Diagrams | @xyflow/react | 12.10.1 | Database diagram flow visualization |
| Diagrams | mermaid | 11.12.3 | Mermaid diagram rendering |
| HTML Sanitize | dompurify | 3.3.2 | XSS-safe HTML rendering |
| AI/ML | @huggingface/transformers | 3.8.1 | In-browser image background removal |
| Data Formats | graphql | Various | GraphQL schema viewing |
| WASM | Rust crates (13) | Various | Hashing, bcrypt, HMAC, diff, CSV, color, XML/YAML/TOML parsing, JS/HTML/CSS/SQL formatting, QR codes, Markdown |
| Crypto | @peculiar/x509 | Various | X.509 certificate decoding |
| Image | react-image-crop | 11.0.10 | Image cropping UI |
| JSON | ajv, jsonpath-plus | Various | JSON schema validation, JSONPath queries |
| File Processing | JSZip | 3.10.1 | ZIP generation (dynamic import, lazy-loaded) |
| Linting | oxlint | 1.51.0 | Fast linter with TypeScript + React plugins |
| Formatting | oxfmt | 0.36.0 | Fast formatter with Tailwind class sorting |
| Unit Testing | Vitest | 4.0.18 | Node environment, globals enabled |
| E2E Testing | Playwright | 1.58.2 | Cross-browser end-to-end testing |
| Path Aliases | vite-tsconfig-paths | 6.1.1 | Resolves `@/*` path alias in Vite and Vitest |

## Application Architecture

```
[Browser]
  └── React SPA (main.tsx entry)
        ├── TanStack Router (routes.tsx)
        │     ├── / (Home page) ──→ Tool dashboard with search & grid
        │     └── /tools/$toolKey ──→ Dynamic tool page (from registry)
        ├── Tool Registry (constants/tool-registry.ts)
        │     └── 80 tools with lazy-loaded components, metadata, SEO
        ├── Zustand Stores (hooks/state/)
        │     ├── useToast ──→ Toast notification state
        │     ├── useCommandPaletteStore ──→ Command palette open/search state
        │     └── useSidebarStore ──→ Sidebar visibility state
        ├── Persistent State (hooks/persist/)
        │     ├── usePersistFeatureLayout ──→ Feature card layout preference
        │     ├── usePersistSettings ──→ User settings persistence
        │     └── useInputLocalStorage ──→ Tool input value persistence
        └── Utility Functions (utils/)
              ├── 89 utility modules covering all tool logic
              └── 88 co-located spec files (~1,554 unit tests)
```

## Component Architecture

```
App.tsx (root, lazy-loaded)
├── Sidebar (categorized tool navigation)
├── CommandPalette (⌘K quick tool search)
├── SettingsDialog (user preferences)
├── Outlet (router)
│   ├── Home Page
│   │   ├── Tool grid (searchable, filterable)
│   │   └── Layout toggle (grid/list via usePersistFeatureLayout)
│   └── Tools Page (/tools/$toolKey)
│       ├── ToolErrorBoundary (error handling per tool)
│       └── Lazy-loaded tool component (from registry)
│           ├── Code tools (14): JsonToTypeScript, MermaidRenderer, ProtobufCodec, TypescriptPlayground...
│           ├── Data tools (15): DbDiagram, JsonDiffChecker, JsonFormatter, CsvConverter...
│           ├── Image tools (12): BackgroundRemover, SplashScreenGenerator, SvgViewer...
│           ├── Text tools (8): RegexTester, TextDiffChecker, WordCounter...
│           ├── CSS tools (6): FlexboxPlayground, GridPlayground, CssAnimationBuilder...
│           ├── Encoding tools (5): EncodingBase64, JwtDecoder, UrlParser...
│           ├── Generator tools (3): PasswordGenerator, QrCodeGenerator, UuidGenerator
│           ├── Security tools (8): AesEncryptDecrypt, BcryptHasher, HashGenerator, RsaKeyGenerator...
│           ├── Time tools (4): CronExpressionParser, TimezoneConverter...
│           ├── Color tools (2): ColorConvertor, ColorPaletteGenerator
│           ├── Unit tools (2): UnitPxToRem, AspectRatioCalculator
│           └── Network tools (1): IpSubnetCalculator
└── ToastProvider (global toast notifications)
```

## Routing

| Path | Page | Loading |
|------|------|---------|
| `/` | Home (dashboard with searchable tool grid) | `lazyRouteComponent` |
| `/tools/$toolKey` | Dynamic tool page (resolved from registry) | `lazyRouteComponent` |
| `*` (not found) | Redirects to `/` | Built-in |

Router config: `defaultPreload: 'intent'`, `scrollRestoration: true`

## State Management

| Store | Location | Purpose |
|-------|----------|---------|
| `useToast` | `hooks/state/useToast.ts` | Global toast notification state |
| `useCommandPaletteStore` | `hooks/state/useCommandPaletteStore.ts` | Command palette open/close and search state |
| `useSidebarStore` | `hooks/state/useSidebarStore.ts` | Sidebar visibility state |
| `usePersistFeatureLayout` | `hooks/persist/usePersistFeatureLayout.ts` | Persisted feature card layout preference |
| `usePersistSettings` | `hooks/persist/usePersistSettings.ts` | Persisted user settings |
| `useInputLocalStorage` | `hooks/persist/useInputLocalStorage.ts` | Persisted tool input values across sessions |

Pattern: `create<T>()((set: StoreApi<T>['setState']) => ({...}))`

## Custom Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `useCopyToClipboard` | `hooks/useCopyToClipboard.ts` | Clipboard API wrapper with toast feedback |
| `useDebounce` | `hooks/useDebounce.ts` | Debounced value hook |
| `useDebounceCallback` | `hooks/useDebounceCallback.ts` | Debounced callback hook |
| `useKeyboardShortcuts` | `hooks/useKeyboardShortcuts.ts` | Global keyboard shortcut handler |
| `useToolSeo` | `hooks/useToolSeo.ts` | Dynamic SEO metadata per tool page |

## Styling Architecture

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no PostCSS, no JS config)
- **CSS-first config** via `@theme` in `src/index.css` using OKLCH color space
- **@tailwindcss/typography** for prose styling (markdown preview)
- **tailwind-variants** for component variants using custom `tv()` wrapper from `@/utils`
- **CompVariant<T>** type for typed variant definitions
- **oxfmt** sorts Tailwind classes inside `tv()` calls automatically
- **No inline ternary classNames**: All conditional class logic MUST use `tv()` variants — inline ternary in `className` is banned
- **Custom breakpoints**: `tablet:` (48rem), `laptop:` (80rem), `desktop:` (120rem)
- **Default breakpoints removed**: Do NOT use `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

## Build & Bundle Strategy

- **Code splitting** per route via `lazyRouteComponent()`
- **Feature-level code splitting** -- each tool is its own lazy-loaded chunk via registry
- **Heavy dependency lazy imports** -- WASM modules, JSZip, Monaco Editor, Mermaid, HuggingFace loaded on demand
- **Entry point**: `src/main.tsx` → mounts React app with router and query provider

## Testing Strategy

- **Unit Tests**: Vitest 4 with node environment, globals enabled
  - 88 spec files co-located in `src/utils/` (~1,554 test cases)
  - Pure function testing -- no DOM/component tests
  - Path aliases `@/*` work in tests via `vite-tsconfig-paths`
- **E2E Tests**: Playwright 1.58.2
  - 37 tool-specific E2E specs in `e2e/`
  - 2 platform specs in `e2e/platform/` (home, navigation)
  - Cross-browser testing support

## Module System

- **ESM only** (`"type": "module"`)
- **verbatimModuleSyntax**: `import type` required for type-only imports
- **Path alias**: `@/*` maps to `src/*`
- **Barrel exports**: Every folder has `index.ts` re-exporting siblings

## Tool Registry Pattern

All tools are registered in `src/constants/tool-registry.ts` with:
- **Key**: Unique tool identifier (used as route parameter)
- **Component**: Lazy-loaded via dynamic import
- **Category**: Classification (code, data, image, text, css, etc.)
- **Metadata**: Emoji, title, description
- **SEO**: Title and description for dynamic meta tags
