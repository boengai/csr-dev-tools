---
project_name: 'csr-dev-tools'
user_name: 'csrteam'
date: '2026-02-11'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 53
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Core

- **React** 19.2.4 — UI framework (JSX via react-jsx)
- **TypeScript** 5.9.3 — Strict mode, target ES2022, verbatimModuleSyntax
- **Vite** 7.3.1 — Build tool with @vitejs/plugin-react 5.1.4
- **TanStack Router** 1.159.5 — Routing with lazy-loaded routes
- **TanStack React Query** 5.90.21 — Server state (gcTime: 1hr, staleTime: 1min, retry: false)

### Styling

- **Tailwind CSS** 4.1.18 — v4 via @tailwindcss/vite plugin (NOT PostCSS)
- **tailwind-variants** 3.2.2 — Component variant styling via custom `tv()` wrapper
- **tailwind-merge** 3.4.0 — Optional peer dep of tailwind-variants, required for `twMerge: true`
- **Radix UI** — Accessible primitives (dialog 1.1.15, select 2.2.6, tabs 1.1.13, toast 1.2.15)
- **Motion** 12.34.0 — Animations (import from `motion/react`, NOT `framer-motion`)

### State & Data

- **Zustand** 5.0.11 — Client-side state management (stores in hooks/state/)
- **JSZip** 3.10.1 — ZIP file handling (dynamically imported only when zipping multiple files)

### Dev Tooling

- **pnpm** 10.11.0 — Package manager (enforced via packageManager field)
- **Node.js** >= 24.5.0 — Minimum runtime version
- **oxlint** 1.46.0 — Fast linter (`.oxlintrc.json`), replaces ESLint
- **oxfmt** 0.31.0 — Fast formatter (`.oxfmtrc.json`), replaces Prettier (alpha; Tailwind class sorting enabled)
- **Vitest** 4.0.18 — Test runner (node environment, globals enabled)
- **vite-tsconfig-paths** 6.1.0 — Path alias resolution for `@/*`

### Module System

- ESM only (`"type": "module"` in package.json)
- `verbatimModuleSyntax: true` — Use `import type` for type-only imports

## Critical Implementation Rules

### Language-Specific Rules

- **Let TypeScript infer where possible** — No `@typescript-eslint/typedef` rule. Rely on TypeScript inference for local variables and return types. Explicit annotations required for: function parameters, empty arrays (`Array<T>`), reduce accumulators, ambiguous/complex types, and exported function signatures.
- **`type` over `interface`** — oxlint rule `typescript/consistent-type-definitions: ['error', 'type']`. Always use `type Foo = {}`, never `interface Foo {}`.
- **`Generic<T>` over `T[]`** — oxlint rule `typescript/array-type: ['error', { default: 'generic' }]`. Use `Array<string>`, not `string[]`.
- **`import type` for type-only imports** — `verbatimModuleSyntax: true` requires separating type imports: `import type { Foo } from './bar'`
- **No semicolons** — oxfmt config: `semi: false`
- **Single quotes** — oxfmt config: `singleQuote: true`
- **Trailing commas everywhere** — oxfmt config: `trailingComma: 'all'`
- **120 char line width** — oxfmt config: `printWidth: 120`
- **No `console.log`** — oxlint rule: `no-console: 'warn'`
- **No `debugger`** — oxlint rule: `no-debugger: 'error'`
- **Path alias** — Always use `@/` path alias for src imports (e.g., `import { Button } from '@/components'`), never relative paths like `../../`

### Framework-Specific Rules

#### Component Patterns

- **Named exports for components** — All components use named exports (`export const Button`), NOT default exports. Exception: page components use `export default function PageName()` for lazy-loading compatibility.
- **Tailwind-variants for styling** — Use the project's custom `tv()` from `@/utils`, not `tailwind-variants` directly. Define a `CompVariant<T>` typed variants object above the component.
- **Motion for animations** — Import from `motion/react` (NOT `framer-motion`). Use `motion.div`, `motion.button` etc. with `whileHover`, `whileTap`, `initial`, `animate` props.
- **Radix UI for accessible primitives** — Use Radix UI components for dialogs, selects, tabs, toasts. Do not build custom implementations of these.
- **JSX curly brace presence** — oxlint enforces `react/jsx-curly-brace-presence: { children: 'never', props: 'never' }`. Use `prop="value"` not `prop={"value"}`.

#### Routing

- **Lazy-loaded routes** — All routes use `lazyRouteComponent(() => import('@/pages/...'))`. Pages are default-exported functions.
- **Route constants** — Route paths defined in `@/constants` as `ROUTE_PATH` record, typed with `RoutePath`.

#### State Management

- **Zustand stores** — Located in `src/hooks/state/`. Use `create<T>()()` pattern with explicit `StoreApi` typing. Example: `create<UseToast>()((set: StoreApi<UseToast>['setState']) => ({...}))`.
- **Persistent state** — Located in `src/hooks/persist/`. For state that persists across sessions.
- **No prop drilling** — Use Zustand stores for shared state rather than passing props through multiple levels.

#### Data Fetching

- **React Query defaults** — `retry: false`, `staleTime: 60s`, `gcTime: 1hr`. Don't override these unless there's a specific reason.
- **100% client-side** — Zero server API calls for tool processing. This is an architectural constraint, not a preference.

#### Import Ordering (manual convention — no automated sorting)

1. External library imports (alphabetical)
2. Blank line
3. Type-only imports from `@/types`
4. Blank line
5. Internal `@/` imports (alphabetical)

Note: perfectionist plugin was removed with ESLint. Import ordering is a manual convention. oxfmt's experimental import sorting is disabled to avoid a known bug with Tailwind class removal.

### Testing Rules

- **Vitest 4** with globals enabled — Use `describe`, `it`, `expect` directly without importing (globals: true in config)
- **Test file naming** — Co-located with source as `*.spec.ts` (e.g., `utils/color.spec.ts` alongside `utils/color.ts`)
- **Test environment** — `node` (not jsdom). Tests are for pure logic/utilities, not component rendering.
- **Path aliases in tests** — `vite-tsconfig-paths` is configured in `vitest.config.ts`, so `@/` imports work in test files
- **Test structure** — Use nested `describe` blocks for grouping: outer for module, inner for function/scenario. Use template literals in `it()` descriptions to show test values.
- **Type annotations in tests** — Let TypeScript infer where possible; annotate only when needed for clarity or complex types
- **No mocking of browser APIs** — Tools are pure functions; test the logic directly without DOM or browser mocks

### Code Quality & Style Rules

#### File & Folder Structure

- **kebab-case folders** — All folder names use kebab-case (e.g., `progress-bar/`, `react-dialog/`)
- **PascalCase component files** — React component files use PascalCase (e.g., `Button.tsx`, `ColorConvertor.tsx`)
- **camelCase utility/hook files** — Hooks and utils use camelCase (e.g., `useCopyToClipboard.ts`, `color.ts`)
- **Barrel exports** — Every folder has an `index.ts` that re-exports from siblings. Import from the barrel, not the file directly.

#### Source Directory Layout

```
src/
  components/
    common/         # Reusable UI components (Button, Card, Dialog, etc.)
    feature/        # Feature-specific components organized by domain (color/, image/, time/, etc.)
  constants/        # App-wide constants (routes, feature keys, image config)
  hooks/
    state/          # Zustand stores
    persist/        # Persistent state hooks
  pages/            # Route page components (default export)
  types/            # Type definitions mirroring src/ structure
    components/
    constants/
    hooks/
    utils/
  utils/            # Pure utility functions
```

#### Types Organization

- **Types mirror source structure** — `src/types/components/common/button.ts` matches `src/components/common/button/Button.tsx`
- **Types separate from implementation** — All type definitions live in `src/types/`, not co-located with components
- **Props types** — Component props named `{Component}Props` (e.g., `ButtonProps`), variant types named `{Component}Variants` (e.g., `ButtonVariants`)

#### Naming Conventions

- **Constants** — UPPER_SNAKE_CASE (e.g., `ROUTE_PATH`, `FEATURE_TITLE`)
- **Components** — PascalCase (e.g., `ColorConvertor`, `ToastProvider`)
- **Hooks** — camelCase with `use` prefix (e.g., `useToast`, `useCopyToClipboard`)
- **Utilities** — camelCase (e.g., `convertColor`, `formatRgb`)
- **Alphabetical ordering** — Object keys, props, and imports should be alphabetically sorted (manual convention, no longer enforced by a plugin)

### Development Workflow Rules

#### Package Management

- **pnpm only** — Enforced via `packageManager` field. Never use npm or yarn.
- **Exact versions** — All dependencies pinned to exact versions (no `^` or `~` prefixes). Enforced by `.npmrc` with `save-exact=true`.
- **`pnpm add`** — `.npmrc` enforces `save-exact=true` automatically, no need for `--save-exact` flag

#### Scripts

- `pnpm dev` — Dev server on port 5173
- `pnpm build` — TypeScript check + Vite production build (`tsc -b && vite build`)
- `pnpm lint` — oxlint (run `pnpm lint:fix` for auto-fixable issues)
- `pnpm format` — oxfmt format all source files
- `pnpm format:check` — oxfmt check formatting without writing
- `pnpm test` — Vitest single run
- `pnpm preview` — Preview production build on port 5173

#### Adding a New Tool

1. Create feature component in `src/components/feature/{domain}/`
2. Add types in `src/types/` mirroring the component path
3. Add barrel exports up the chain (`index.ts` files)
4. Add feature key to constants and `FeatureKey` type
5. Register lazy import and case in `src/pages/home/index.tsx`
6. Add route if tool gets its own page

#### Git Conventions

- **Commit prefixes** — Emoji prefixes observed in history (e.g., `📝:` for docs, `🤖:` for automation, `🐛:` for bugfix)
- **Branch strategy** — Feature branches off `main`

### Critical Don't-Miss Rules

#### Anti-Patterns to Avoid

- **NEVER use `npm`, `npx`, or `yarn`** — This project uses **pnpm exclusively**. All commands must use `pnpm` (e.g., `pnpm build`, `pnpm dev`, `pnpm test`). Never run `npx vite build`, `npm install`, or any non-pnpm command. Enforced via the `packageManager` field in `package.json`.
- **NEVER add server-side processing** — All tools must run 100% in the browser. No API calls, no server dependencies. If it can't run client-side, it doesn't belong in this project.
- **NEVER use default exports for components** — Only page-level route components use `export default`. Everything else is named exports.
- **NEVER import from `framer-motion`** — The package is `motion`, import from `motion/react`.
- **NEVER use `interface`** — Always `type`. oxlint will error.
- **NEVER use `string[]` syntax** — Always `Array<string>`. oxlint will error.
- **NEVER add redundant type annotations** — Let TypeScript infer types for local variables and simple assignments. Only annotate when inference is insufficient (parameters, empty arrays, complex/ambiguous types).
- **NEVER import types inline** — Use `import type` on a separate line. `verbatimModuleSyntax` will error.
- **NEVER create a Radix-equivalent component from scratch** — If Radix UI has a primitive for it, use it.

#### Edge Cases

- **Tailwind CSS v4** — No `tailwind.config.js` file. Tailwind v4 uses CSS-first config via `@theme` in `index.css`. Do NOT create a JS config file.
- **tailwind-variants v3** — `CreateTV` and `TV` types were removed. Don't annotate the `tv` export, let it infer. `twMergeConfig.extends` changed to `twMergeConfig.extend`. `tailwind-merge` is an optional peer dep that must be installed explicitly.
- **oxlint + oxfmt** — Replaces ESLint + Prettier. oxfmt is alpha (0.31.0); Tailwind class sorting is enabled but experimental import sorting is disabled to avoid a known CSS class removal bug.
- **JSZip lazy loading** — JSZip is NOT imported at the top of `ImageConvertor.tsx`. It uses `const { default: JSZip } = await import('jszip')` inline, only when multiple images need zipping.
- **`experimentalTailwindcss.functions: ['tv']`** — oxfmt's Tailwind plugin is configured to sort classes inside `tv()` calls. Use `tv()` from `@/utils`, not directly from the library.

#### Performance Rules

- **Lazy load all feature components** — Every tool/feature uses `lazy(() => import(...))` with named export destructuring pattern
- **Code splitting per route** — Routes use `lazyRouteComponent`. Never eagerly import page components.
- **No bundle bloat** — Adding new tools must not increase the initial bundle. Each tool is its own chunk.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-02-11
