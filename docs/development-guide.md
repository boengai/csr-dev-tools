# CSR Developer Tools - Development Guide

**Updated:** 2026-03-20 | **Scan Level:** Quick

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
| `pnpm test` | Run Vitest unit tests in single-run mode |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm test:e2e:ui` | Run Playwright E2E tests with interactive UI |
| `pnpm test:e2e:headed` | Run Playwright E2E tests in headed browser |

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

### Styling Rules

- **No inline ternary in `className`** -- all conditional class logic must use `tv()` variants from `@/utils`
  ```tsx
  // ❌ BANNED
  <div className={isActive ? 'bg-primary' : 'bg-gray-800'} />

  // ✅ CORRECT — use tv() variants
  const styles = tv({ base: '...', variants: { active: { true: 'bg-primary', false: 'bg-gray-800' } } })
  <div className={styles({ active: isActive })} />
  ```

## Testing

### Unit Tests (Vitest)

- **Framework**: Vitest 4.0.18
- **Environment**: Node (not jsdom)
- **Globals**: Enabled (`describe`, `it`, `expect` available without import)
- **Test files**: Co-located as `*.spec.ts` alongside source files in `src/utils/`
- **Coverage**: 88 spec files with ~1,554 test cases
- **Path aliases**: `@/*` works in tests via `vite-tsconfig-paths`

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm vitest
```

### E2E Tests (Playwright)

- **Framework**: Playwright 1.58.2
- **Test files**: `e2e/` directory
  - 37 tool-specific test specs
  - 2 platform tests in `e2e/platform/` (home, navigation)

```bash
# Run E2E tests (headless)
pnpm test:e2e

# Run with interactive UI
pnpm test:e2e:ui

# Run in headed browser mode
pnpm test:e2e:headed
```

## Type Declarations

**All type declarations must live in `src/types/`** — never declare types inline in component, utility, or constant files.

### Rules

- **No inline types**: Do not declare `type` aliases in `src/components/`, `src/utils/`, `src/constants/`, or `src/hooks/`
- **Utils types**: Create `src/types/utils/<name>.ts`, import in the util file, and re-export for consumers
  ```ts
  // src/types/utils/hash.ts
  export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512'

  // src/utils/hash.ts
  import type { HashAlgorithm } from '@/types/utils/hash'
  export type { HashAlgorithm } from '@/types/utils/hash'
  ```
- **Component types**: Create `src/types/components/feature/<category>/<name>.ts`, import from the specific path
  ```ts
  // src/types/components/feature/code/javaScriptMinifier.ts
  export type State = { ... }
  export type Action = { ... }

  // src/components/feature/code/JavaScriptMinifier.tsx
  import type { State, Action } from '@/types/components/feature/code/javaScriptMinifier'
  ```
- **Barrel exports**: Utils types are re-exported through `src/types/utils/index.ts`. Component types are **not** barrel-exported (to avoid name collisions like `State`, `Action`, `ConvertMode`)
- **Use `type` not `interface`** and `Array<T>` not `T[]` (enforced by oxlint)

## Adding a New Tool

1. **Create utility** in `src/utils/<name>.ts` with pure logic functions
2. **Create types** in `src/types/utils/<name>.ts` for any types the utility needs
3. **Create tests** in `src/utils/<name>.spec.ts` (co-located)
4. **Create feature component** in `src/components/feature/<category>/<Name>.tsx`
5. **Add component types** in `src/types/components/feature/<category>/<name>.ts` (if needed)
6. **Add barrel exports** up the chain (`index.ts` files) for utils types
7. **Register in tool registry** in `src/constants/tool-registry.ts`:
   - Key, category, emoji, title, description
   - Lazy-loaded component import
   - SEO metadata (title, description)
8. **Add E2E test** in `e2e/<name>.spec.ts`

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

## Design System

- **Color space**: OKLCH throughout (defined in `src/index.css` `@theme`)
- **Primary color**: Purple (oklch 0.55 0.22 310)
- **Font**: Space Mono (monospace)
- **Dark theme**: Default and only theme
- **Shadows**: Custom OKLCH-based shadows (sm, md, lg, xl, glow)
- **Border radius**: `--radius-sm: 4px`, `--radius-card: 6px`
