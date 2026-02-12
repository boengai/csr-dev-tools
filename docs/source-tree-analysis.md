# CSR Developer Tools - Source Tree Analysis

**Generated:** 2026-02-11 | **Scan Level:** Quick

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
├── LICENSE                 # MIT License
├── README.md               # Project documentation
├── _bmad/                  # BMAD workflow tooling (AI agent infrastructure)
├── _bmad-output/           # BMAD generated artifacts
│   └── project-context.md  # AI agent implementation rules
├── docs/                   # Generated project documentation (this folder)
├── dist/                   # Production build output
├── public/                 # Static assets served as-is
│   └── fonts/              # Noto Emoji font files
└── src/                    # Application source code (see below)
```

## Source Directory (`src/`)

```
src/
├── main.tsx                # ★ Entry point: React root, Router, QueryClient
├── App.tsx                 # Root layout: header, outlet, footer, toast
├── routes.tsx              # TanStack Router: route tree, lazy loading
├── index.css               # Global styles, Tailwind @theme config
├── vite-env.d.ts           # Vite client type declarations
│
├── components/             # All UI components
│   ├── index.ts            # Barrel export
│   ├── common/             # Reusable UI primitives
│   │   ├── animate/        # TwinkleStarsAnimate (background stars)
│   │   ├── button/         # Button (motion-enhanced, variant-styled)
│   │   ├── card/           # Card (feature tool container)
│   │   ├── dialog/         # Dialog (Radix-based modal)
│   │   ├── emoji/          # NotoEmoji (Noto Emoji font renderer)
│   │   ├── form/           # FieldForm (label + input wrapper)
│   │   ├── icon/           # SVG icon components (Copy, Download, etc.)
│   │   ├── input/          # TextInput, TextAreaInput, SelectInput, UploadInput
│   │   ├── progress-bar/   # ProgressBar (animated progress indicator)
│   │   ├── table/          # DataCellTable (key-value display)
│   │   ├── tabs/           # Tabs (Radix-based tab component)
│   │   └── toast/          # ToastProvider (Radix toast + Zustand)
│   └── feature/            # Feature-specific tool components
│       ├── color/          # ColorConvertor
│       ├── encoding/       # EncodingBase64
│       ├── image/          # ImageConvertor, ImageResizer
│       │   └── input/      # ImageFormatSelectInput, ImageQualitySelectInput
│       ├── time/           # TimeUnixTimestamp
│       └── unit/           # UnitPxToRem
│
├── constants/              # Application constants
│   ├── index.ts            # Barrel export
│   ├── feature.ts          # FEATURE_TITLE record (feature display names)
│   ├── image.ts            # Image format/quality constants
│   └── route.ts            # ROUTE_PATH record (route path strings)
│
├── hooks/                  # Custom React hooks
│   ├── index.ts            # Barrel export
│   ├── useCopyToClipboard.ts   # Clipboard API wrapper
│   ├── useDebounce.ts          # Debounced value hook
│   ├── useDebounceCallback.ts  # Debounced callback hook
│   ├── state/              # Zustand stores
│   │   ├── index.ts
│   │   └── useToast.ts     # Toast notification store
│   └── persist/            # Persistent state hooks
│       ├── index.ts
│       └── usePersistFeatureLayout.ts  # Feature card layout persistence
│
├── pages/                  # Route page components (default exports)
│   ├── home/               # Home page (tool dashboard)
│   │   └── index.tsx       # Feature card grid, lazy-loaded tools
│   └── showcase/           # Showcase page
│       └── index.tsx       # Component showcase
│
├── types/                  # TypeScript type definitions (mirrors src/ structure)
│   ├── index.ts            # Barrel re-export
│   ├── components/
│   │   ├── common/         # Props + variant types for each component
│   │   │   ├── animate.ts, button.ts, card.ts, dialog.ts
│   │   │   ├── form.ts, input.ts, table.ts, tabs.ts, toast.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── constants/
│   │   ├── color.ts, feature.ts, image.ts, route.ts, time.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── persist.ts, state.ts, types.ts
│   │   └── index.ts
│   └── utils/
│       ├── image.ts, tailwind-variants.ts
│       └── index.ts
│
└── utils/                  # Pure utility functions
    ├── index.ts            # Barrel export
    ├── color.ts            # Color format conversion (HEX, RGB, HSL, OKLCH, LAB, LCH)
    ├── color.spec.ts       # Tests for color utilities (15 tests)
    ├── file.ts             # File handling utilities
    ├── image.ts            # Image processing utilities
    ├── tailwind-variants.ts # Custom tv() wrapper with twMerge config
    └── time.ts             # Time/date utilities
```

## Critical Folders

| Folder | Purpose | Key Files |
|--------|---------|-----------|
| `src/components/common/` | Reusable UI primitives | Button, Card, Dialog, Input variants |
| `src/components/feature/` | Tool implementations | ColorConvertor, ImageConvertor, etc. |
| `src/hooks/state/` | Zustand stores | useToast |
| `src/hooks/persist/` | Persistent state | usePersistFeatureLayout |
| `src/types/` | All type definitions | Mirrors src/ structure exactly |
| `src/utils/` | Pure logic functions | Color conversion, image processing |
| `src/pages/` | Route pages | Home dashboard, Showcase |
| `src/constants/` | App constants | Routes, features, image configs |

## Entry Points

| Entry Point | File | Purpose |
|-------------|------|---------|
| Application | `src/main.tsx` | React root mount, Router + QueryClient setup |
| Root Layout | `src/App.tsx` | Page layout with header, outlet, toast |
| Router | `src/routes.tsx` | Route definitions with lazy loading |
| Styles | `src/index.css` | Global CSS + Tailwind v4 theme config |
