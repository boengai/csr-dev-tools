# CSR Developer Tools - Development Guide

**Generated:** 2026-02-11 | **Scan Level:** Quick

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | >= 24.5.0 | Enforced via `engines` in package.json |
| pnpm | 10.11.0 | Enforced via `packageManager` field |

## Installation

```bash
# Clone the repository
git clone https://github.com/boengai/csr-dev-tools.git
cd csr-dev-tools

# Install dependencies (pnpm only)
pnpm install
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server on `http://localhost:5173` |
| `pnpm build` | TypeScript check + Vite production build (`tsc -b && vite build`) |
| `pnpm preview` | Preview production build on port 5173 |
| `pnpm lint` | Run oxlint linter |
| `pnpm lint:fix` | Auto-fix linting issues |
| `pnpm format` | Format all source files with oxfmt |
| `pnpm format:check` | Check formatting without writing |
| `pnpm test` | Run Vitest in single-run mode |

## Environment Setup

No `.env` file is needed. The application is 100% client-side with no API keys or server configuration.

### VS Code Setup

1. Install the **oxc** extension (`oxc.oxc-vscode`)
2. Copy `.vscode.example/settings.json` to `.vscode/settings.json` (or use the existing one)
3. Settings configure:
   - Format on save with oxfmt
   - Auto-fix oxlint issues on save
   - TypeScript SDK from node_modules

## Build Process

```
pnpm build
  └── tsc -b          # TypeScript type checking (project references)
  └── vite build      # Vite production bundler
        ├── React plugin
        ├── vite-tsconfig-paths (resolves @/* aliases)
        └── @tailwindcss/vite (Tailwind CSS v4)
```

Output: `dist/` directory with static HTML, CSS, JS chunks.

## Code Style & Linting

### oxlint Rules (`.oxlintrc.json`)

| Rule | Level | Description |
|------|-------|-------------|
| `typescript/array-type` | error | Use `Array<T>` not `T[]` |
| `typescript/consistent-type-definitions` | error | Use `type` not `interface` |
| `react/jsx-curly-brace-presence` | error | No unnecessary curly braces in JSX |
| `react/rules-of-hooks` | error | Enforce React hooks rules |
| `react/exhaustive-deps` | warn | Warn on missing hook dependencies |
| `react/only-export-components` | warn | Only export components from component files |
| `no-console` | warn | Warn on console.log usage |
| `no-debugger` | error | No debugger statements |

### oxfmt Rules (`.oxfmtrc.json`)

| Setting | Value |
|---------|-------|
| `printWidth` | 120 |
| `useTabs` | false |
| `tabWidth` | 2 |
| `semi` | false |
| `singleQuote` | true |
| `trailingComma` | all |
| Tailwind sorting | Enabled (including `tv()` function calls) |

## Testing

- **Framework**: Vitest 4.0.18
- **Environment**: Node (not jsdom)
- **Globals**: Enabled (`describe`, `it`, `expect` available without import)
- **Test files**: Co-located as `*.spec.ts` alongside source files
- **Path aliases**: `@/*` works in tests via `vite-tsconfig-paths`

Current test suite: 15 tests in `src/utils/color.spec.ts`

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm vitest
```

## Adding a New Tool

1. Create feature component in `src/components/feature/{domain}/`
2. Add types in `src/types/` mirroring the component path
3. Add barrel exports up the chain (`index.ts` files)
4. Add feature key to `src/constants/feature.ts` and `FeatureKey` type
5. Register lazy import and case in `src/pages/home/index.tsx`
6. Add route if tool gets its own page

## Responsive Breakpoints

Custom breakpoints are defined in `src/index.css`. Default Tailwind breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`) are removed.

| Class prefix | Width | Use case |
|-------------|-------|----------|
| `tablet:` | 48rem (768px) | Side-by-side layouts |
| `laptop:` | 80rem (1280px) | Multi-column grids |
| `desktop:` | 120rem (1920px) | Full-width layouts |

Never use `sm:`, `md:`, `lg:`, `xl:`, or `2xl:` — they have no effect.

## TypeScript Configuration

- **Strict mode** enabled
- **Target**: ES2022
- **JSX**: react-jsx (automatic runtime)
- **Module**: ESNext with bundler resolution
- **verbatimModuleSyntax**: true (requires `import type` for type-only imports)
- **Path alias**: `@/*` → `src/*`
- **Project references**: `tsconfig.app.json` (app code) + `tsconfig.node.json` (config files)

## Dependency Management

- **pnpm only** -- enforced via `packageManager` field
- **Exact versions** -- all deps pinned (`.npmrc` has `save-exact=true`)
- **Use `pnpm add`** -- `.npmrc` handles exact versioning automatically

## Git Conventions

- **Commit prefixes**: Emoji-based (e.g., `📝:` docs, `🤖:` automation, `🐛:` bugfix)
- **Branch strategy**: Feature branches off `main`
