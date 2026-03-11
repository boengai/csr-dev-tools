# CSR Developer Tools - Source Tree Analysis

**Generated:** 2026-03-11 | **Scan Level:** Quick

## Project Root

```
csr-dev-tools/
├── .oxlintrc.json          # oxlint configuration (TypeScript + React plugins)
├── .oxfmtrc.json           # oxfmt formatter configuration (Tailwind sorting)
├── .npmrc                  # pnpm config (save-exact=true)
├── .vscode/                # VS Code workspace settings
│   └── settings.json       # oxc formatter + oxlint on-save
├── .vscode.example/        # Example VS Code settings for contributors
│   └── settings.json
├── index.html              # SPA entry HTML (mounts #root)
├── package.json            # Dependencies, scripts, engine constraints
├── pnpm-lock.yaml          # Lockfile
├── tsconfig.json           # TypeScript project references
├── tsconfig.app.json       # App TypeScript config (strict, ES2022, react-jsx)
├── tsconfig.node.json      # Node TypeScript config (for vite.config.ts)
├── vite.config.ts          # Vite config (React + tsconfig paths + Tailwind)
├── vitest.config.ts        # Vitest config (node env, globals, tsconfig paths)
├── playwright.config.ts    # Playwright E2E test configuration
├── LICENSE                 # MIT License
├── README.md               # Project documentation
├── _bmad/                  # BMAD workflow tooling (AI agent infrastructure)
├── _bmad-output/           # BMAD generated artifacts
│   └── project-context.md  # AI agent implementation rules
├── docs/                   # Generated project documentation (this folder)
├── dist/                   # Production build output
├── e2e/                    # Playwright E2E test specs
│   ├── platform/           # Platform-level E2E tests (home, navigation)
│   └── *.spec.ts           # 34 tool-specific E2E test files
├── public/                 # Static assets served as-is
│   └── fonts/              # Noto Emoji font files
└── src/                    # Application source code (see below)
```

## Source Directory (`src/`)

```
src/
├── main.tsx                # ★ Entry point: React root, Router, QueryClient
├── App.tsx                 # Root layout: sidebar, header, outlet, toast
├── routes.tsx              # TanStack Router: route tree, lazy loading
├── index.css               # Global styles, Tailwind @theme config (OKLCH)
├── vite-env.d.ts           # Vite client type declarations
│
├── components/             # All UI components
│   ├── index.ts            # Barrel export
│   ├── common/             # Reusable UI primitives (30 components)
│   │   ├── animate/        # TwinkleStarsAnimate (background stars)
│   │   ├── button/         # Button, CopyButton (motion-enhanced)
│   │   ├── card/           # Card (feature tool container)
│   │   ├── command-palette/ # CommandPalette, SearchInput (⌘K search)
│   │   ├── dialog/         # Dialog (Radix-based modal)
│   │   ├── dropdown-menu/  # DropdownMenu (Radix-based)
│   │   ├── emoji/          # NotoEmoji (Noto Emoji font renderer)
│   │   ├── error-boundary/ # ToolErrorBoundary (per-tool error handling)
│   │   ├── form/           # FieldForm (label + input wrapper)
│   │   ├── icon/           # 18 SVG icon components
│   │   ├── input/          # 10 input types: Text, TextArea, Select, Upload,
│   │   │                   #   Code, Color, Checkbox, RadioGroup, Range, Switch
│   │   ├── output/         # CodeOutput (formatted code display)
│   │   ├── progress-bar/   # ProgressBar (animated progress indicator)
│   │   ├── settings/       # SettingsDialog (user preferences)
│   │   ├── sidebar/        # Sidebar, SidebarCategory, SidebarToolItem
│   │   ├── table/          # DataCellTable (key-value display)
│   │   ├── tabs/           # Tabs (Radix-based tab component)
│   │   └── toast/          # ToastProvider (Radix toast + Zustand)
│   └── feature/            # Feature-specific tool components (82 components)
│       ├── code/           # 13 tools: JsonToTypeScript, MermaidRenderer, etc.
│       ├── color/          # 2 tools: ColorConvertor, ColorPaletteGenerator
│       ├── css/            # 6 tools: FlexboxPlayground, GridPlayground, etc.
│       ├── data/           # 14 tools: DbDiagram, JsonFormatter, etc.
│       │   └── db-diagram/ # Complex sub-component: visual DB diagram builder
│       │       ├── DbDiagram.tsx, TableNode.tsx, RelationshipEdge.tsx
│       │       ├── DiagramToolbar.tsx, DiagramListPanel.tsx
│       │       ├── Import/Export panels (SQL, DBML, JSON Schema, Mermaid, TS)
│       │       ├── diagramReducer.ts, useDiagramHandlers.ts
│       │       └── types.ts, constants.ts
│       ├── encoding/       # 5 tools: Base64, JwtDecoder, UrlEncoder, etc.
│       ├── generator/      # 6 tools: Password, UUID, QR Code, Hash, etc.
│       ├── image/          # 16 tools: BackgroundRemover, Cropper, etc.
│       │   └── input/      # Shared: ImageFormatSelectInput, ImageQualitySelectInput
│       ├── network/        # 1 tool: IpSubnetCalculator
│       ├── security/       # 5 tools: BcryptHasher, CertificateDecoder, etc.
│       ├── text/           # 8 tools: RegexTester, TextDiffChecker, etc.
│       ├── time/           # 4 tools: CronExpressionParser, TimezoneConverter, etc.
│       └── unit/           # 2 tools: UnitPxToRem, AspectRatioCalculator
│
├── constants/              # Application constants
│   ├── index.ts            # Barrel export
│   ├── feature.ts          # Feature constants
│   ├── image.ts            # Image format/quality constants
│   ├── route.ts            # ROUTE_PATH record: HOME (/), TOOLS (/tools)
│   └── tool-registry.ts    # ★ Central registry: 77+ tools with lazy imports,
│                           #   categories, metadata, SEO, and descriptions
│
├── hooks/                  # Custom React hooks
│   ├── index.ts            # Barrel export
│   ├── useCopyToClipboard.ts   # Clipboard API wrapper
│   ├── useDebounce.ts          # Debounced value hook
│   ├── useDebounceCallback.ts  # Debounced callback hook
│   ├── useKeyboardShortcuts.ts # Global keyboard shortcut handler
│   ├── useToolSeo.ts           # Dynamic SEO metadata per tool
│   ├── state/              # Zustand stores
│   │   ├── index.ts
│   │   ├── useToast.ts             # Toast notification store
│   │   ├── useCommandPaletteStore.ts # Command palette state
│   │   └── useSidebarStore.ts       # Sidebar visibility state
│   └── persist/            # Persistent state hooks (localStorage)
│       ├── index.ts
│       ├── useInputLocalStorage.ts      # Tool input persistence
│       ├── usePersistFeatureLayout.ts   # Feature card layout preference
│       └── usePersistSettings.ts        # User settings persistence
│
├── pages/                  # Route page components (default exports)
│   ├── home/               # Home page (tool dashboard)
│   │   └── index.tsx       # Searchable tool grid with categories
│   └── tools/              # Tool page (dynamic route)
│       └── index.tsx       # Resolves $toolKey → lazy-loads component
│
├── types/                  # TypeScript type definitions (mirrors src/ structure)
│   ├── index.ts            # Barrel re-export
│   ├── components/         # Props + variant types for each component
│   │   ├── common/         # Types for common components
│   │   └── index.ts
│   ├── constants/          # Types for constants (RoutePath, ToolRegistryEntry, etc.)
│   │   └── index.ts
│   ├── hooks/              # Types for hooks and stores
│   │   └── index.ts
│   └── utils/              # Types for utility functions
│       └── index.ts
│
└── utils/                  # Pure utility functions (85 modules)
    ├── index.ts            # Barrel export
    ├── tailwind-variants.ts # Custom tv() wrapper with twMerge config
    ├── color.ts            # Color format conversion (HEX, RGB, HSL, OKLCH, LAB, LCH)
    ├── image.ts            # Image processing utilities
    ├── file.ts             # File handling utilities
    ├── time.ts             # Time/date utilities
    ├── dashboard.ts        # Dashboard/tool grid utilities
    ├── validation.ts       # Input validation utilities
    ├── ... (80+ more utility modules)
    ├── db-diagram*.ts      # 9 modules for DB diagram feature
    └── *.spec.ts           # 84 co-located test files (~1,427 test cases)
```

## Critical Folders

| Folder | Purpose | Key Files |
|--------|---------|-----------|
| `src/constants/tool-registry.ts` | Central tool definition | All 77+ tools registered here |
| `src/components/common/` | Reusable UI primitives | 30 components across 18 categories |
| `src/components/feature/` | Tool implementations | 82 components across 12 categories |
| `src/hooks/state/` | Zustand stores | Toast, CommandPalette, Sidebar |
| `src/hooks/persist/` | Persistent state | Layout, Settings, Input persistence |
| `src/types/` | All type definitions | Mirrors src/ structure exactly |
| `src/utils/` | Pure logic functions | 85 modules with 84 test files |
| `src/pages/` | Route pages | Home dashboard, Dynamic tool page |
| `e2e/` | E2E test specs | 34 tool tests + 2 platform tests |

## Entry Points

| Entry Point | File | Purpose |
|-------------|------|---------|
| Application | `src/main.tsx` | React root mount, Router + QueryClient setup |
| Root Layout | `src/App.tsx` | Page layout with sidebar, header, outlet, toast |
| Router | `src/routes.tsx` | Route definitions: `/` and `/tools/$toolKey` |
| Styles | `src/index.css` | Global CSS + Tailwind v4 theme config (OKLCH) |
| Tool Registry | `src/constants/tool-registry.ts` | All tool definitions and lazy imports |
