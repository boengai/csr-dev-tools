# Contributing to CSR Dev Tools

Thank you for your interest in contributing! This guide walks you through everything you need to add a new tool or improve the project.

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | >= 24.5.0 |
| pnpm | 10.11.0 |

> **pnpm is required.** This project enforces pnpm via the `packageManager` field in `package.json`. Do not use npm or yarn.

## Getting Started

```bash
# Clone the repository
git clone https://github.com/boengai/csr-dev-tools.git
cd csr-dev-tools

# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Branches

| Branch | Holds | Takes |
|--------|-------|-------|
| `main` | The production React site | Bug fixes only, until the Dioxus cutover, plus the UX parity harness and the spec selector changes that must pass against React first (`docs/ux/parity.md`). A check fails any pull request that changes the set of tool keys. |
| `develop` | The Dioxus migration ([issue 5](https://github.com/boengai/csr-dev-tools/issues/5)) | Migration work. It merges into `main` once, at cutover. Go/no-go said go (ADR-0031). The React app stays buildable here until the map decides when to retire it. |
| `spike/dioxus` | The disposable spike, cut from `develop` | Never merges. Go/no-go kept none of its code; it stays as a reference (ADR-0031). |

- Both `main` and `develop` change through pull requests, and the `ci` check must pass. `main` also requires `tool-freeze`. Once the anti-slop gates are built, `develop` also requires `dioxus` and `pr-body` (`docs/quality/gates.md`, ADR-0036).
- Squash-merge your own work into `main`. Only the maintainer merges into `develop`, and agents never do (ADR-0036).
- **A fix reaches `develop` after it lands on `main`**: open a `main` → `develop` pull request and use a **merge commit**, not a squash or a cherry-pick. If the tool is already ported, port the fix in the same pull request. For that, or to resolve conflicts, branch from `develop`, merge `main` into it, and open the pull request from there.
- At cutover, remove `tool-freeze` from the `main` ruleset and delete `tool-freeze.yml` and its script.

Pushes to `develop` and `spike/dioxus` deploy to <https://develop.csr-dev-tools.pages.dev> and <https://spike-dioxus.csr-dev-tools.pages.dev>. Neither is indexed. Production deploys are started by hand from `main`.

## Adding a New Tool

> **Start from a layout shell.** Every tool declares a required `layout` (`transformer`, `codec`, `comparator`, `generator`, `file-processor`, or `custom` with an ADR) in `src/constants/tool-routes.ts`, and is built from that layout's shell. Read [docs/ux/README.md](docs/ux/README.md) and ADR-0027 first; `CLAUDE.md` → "Adding a new tool" has the current registration steps. The hand-built example below predates the shells and the `tool-routes.ts` split.

Follow these 8 steps to add a tool. The example below adds a fictional "Hash Generator" tool in a `generator` domain.

### Step 1: Create the Tool Component

Create your component in `src/components/feature/{domain}/`.

```
src/components/feature/generator/HashGenerator.tsx
```

```tsx
import { useState } from 'react'

import { CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast } from '@/hooks'

const toolEntry = TOOL_REGISTRY_MAP['hash-generator']

export const HashGenerator = () => {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const { toast } = useToast()

  const handleChange = (val: string) => {
    setInput(val)
    if (val.trim() === '') {
      setOutput('')
      return
    }
    try {
      // your conversion logic here
      setOutput(val)
    } catch {
      toast({ action: 'add', item: { label: 'Something went wrong', type: 'error' } })
    }
  }

  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-4">
      {toolEntry?.description && (
        <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>
      )}
      <FieldForm
        label="Input"
        name="input"
        onChange={handleChange}
        placeholder="Enter text..."
        suffix={<CopyButton label="Input" value={input} />}
        type="text"
        value={input}
      />
      <FieldForm
        label="Output"
        name="output"
        onChange={() => {}}
        placeholder=""
        suffix={<CopyButton label="Output" value={output} />}
        type="text"
        value={output}
      />
    </div>
  )
}
```

Key points:

- Use `useToast` with `type: 'error'` for error handling — errors display as toast notifications (3s duration)
- Use `TOOL_REGISTRY_MAP` to get the tool entry for description text
- Named export (`export const HashGenerator`) — no default export
- Import shared components from `@/components/common`

### Step 2: Add Types

If your tool needs custom types, add them in `src/types/components/feature/{domain}/` (create the directories if they don't exist — the types directory mirrors the source structure).

```
src/types/components/feature/generator/hash-generator.ts
```

```ts
export type HashAlgorithm = 'md5' | 'sha1' | 'sha256'

export type HashGeneratorResult = {
  algorithm: HashAlgorithm
  hash: string
  input: string
}
```

Rules:

- Use `type` not `interface`
- Use `Array<T>` not `T[]`
- Use `import type` for type-only imports

### Step 3: Add Barrel Exports

Add `index.ts` barrel exports up the chain so the component is importable from `@/components`.

1. **Domain barrel** — `src/components/feature/generator/index.ts`:

   ```ts
   export * from './HashGenerator.tsx'
   ```

2. **Feature barrel** — update `src/components/feature/index.ts`:

   ```ts
   export * from './color'
   export * from './encoding'
   export * from './generator'   // add this line
   export * from './image'
   export * from './time'
   export * from './unit'
   ```

3. **Types barrel** (if you added types) — create `src/types/components/feature/generator/index.ts` and update `src/types/components/index.ts`.

### Step 4: Add Registry Entry

Register your tool in `src/constants/tool-registry.ts`:

```ts
{
  category: 'Generator',
  component: lazy(() =>
    import('@/components/feature/generator/HashGenerator').then(
      ({ HashGenerator }: { HashGenerator: ComponentType }) => ({
        default: HashGenerator,
      }),
    ),
  ),
  description: 'Generate MD5, SHA-1, and SHA-256 hashes from text',
  emoji: '🔑',
  key: 'hash-generator',
  name: 'Hash Generator',
  routePath: '/tools/hash-generator',
  seo: {
    description: 'Generate MD5, SHA-1, and SHA-256 hashes online. Free browser-based hash generator.',
    title: 'Hash Generator - CSR Dev Tools',
  },
},
```

All fields are required:

| Field | Description |
|-------|-------------|
| `category` | Tool category grouping (e.g., `'Color'`, `'Encoding'`, `'Image'`) |
| `component` | Lazy-loaded component using the named-export-to-default pattern |
| `description` | Short description shown on the tool page |
| `emoji` | Emoji displayed on dashboard cards |
| `key` | Unique kebab-case identifier, used for routing |
| `name` | Display name |
| `routePath` | URL path — must be `/tools/{key}` |
| `seo` | SEO metadata with `title` and `description` |

Routes are auto-generated from the registry. No manual route setup needed. Once registered, your tool automatically appears in the sidebar navigation, command palette, and gets a dedicated route (`/tools/{key}`). The dashboard is a fixed 6-slot favorites grid — new tools do NOT auto-appear there. Users can swap dashboard slots via the selection dialog.

### Step 5: Update Types (if needed)

If your tool introduces a **new category** or **new key**, update `src/types/constants/tool-registry.ts`:

```ts
// Add your category to the union
export type ToolCategory = 'Color' | 'Encoding' | 'Generator' | 'Image' | 'Time' | 'Unit'

// Add your key to the union
export type ToolRegistryKey =
  | 'base64-encoder'
  | 'color-converter'
  | 'hash-generator'    // add this
  | 'image-converter'
  | 'image-resizer'
  | 'px-to-rem'
  | 'unix-timestamp'
```

### Step 6: Add Validation Functions (if needed)

If your tool needs input validation, add validators to `src/utils/validation.ts`:

```ts
export const isValidHash = (value: string): boolean => {
  return /^[a-f0-9]+$/i.test(value)
}
```

Rules:

- Validators return `boolean`, never throw
- Add tests in `src/utils/validation.spec.ts`

### Step 7: Write Unit Tests

Create co-located test files as `*.spec.ts` alongside the source file they test.

```
src/utils/hash.spec.ts
```

```ts
import { generateHash } from '@/utils'

describe('generateHash', () => {
  describe('MD5', () => {
    it('generates correct hash for "hello"', () => {
      expect(generateHash('hello', 'md5')).toBe('5d41402abc4b2a76b9719d911017c592')
    })

    it('returns empty string for empty input', () => {
      expect(generateHash('', 'md5')).toBe('')
    })
  })
})
```

Testing conventions:

- **Vitest** with globals enabled — use `describe`, `it`, `expect` directly (no imports needed)
- **Node environment** — tests are for pure logic, not component rendering
- **Co-located** — `hash.spec.ts` next to `hash.ts`
- **`@/` imports** work in test files via `vite-tsconfig-paths`

### Step 8: Write E2E Test

Create an E2E test in `e2e/{tool-key}.spec.ts` following the existing pattern.

```ts
import { expect, test } from '@playwright/test'

import { card, copyButton, errorMessage, toast, toolInput } from './helpers/selectors'

test.describe('Hash Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/hash-generator')
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(card.title(page, 'Hash Generator')).toBeVisible()
    await expect(
      page.getByText('Generate MD5, SHA-1, and SHA-256 hashes from text'),
    ).toBeVisible()
  })

  test('generates hash from input', async ({ page }) => {
    const input = toolInput.byLabel(page, 'Input')
    await input.fill('hello')

    await expect(toolInput.byLabel(page, 'Output')).not.toHaveValue('', { timeout: 2000 })
  })

  test('copy button triggers toast notification', async ({ page }) => {
    const input = toolInput.byLabel(page, 'Input')
    await input.fill('hello')

    await copyButton.byLabel(page, 'Output').click()
    await expect(toast.copied(page)).toBeVisible({ timeout: 2000 })
  })

  test('shows error for invalid input', async ({ page }) => {
    // test error scenario specific to your tool
    await expect(errorMessage.any(page)).not.toBeVisible()
  })
})
```

Use the shared helpers from `e2e/helpers/`:

| Helper | Purpose |
|--------|---------|
| `selectors.ts` | Shared selectors for sidebar, command palette, inputs, outputs, copy button, toast, card, error messages |
| `fixtures.ts` | Shared test data (colors, base64, timestamps, tool keys/names/routes) |

## Code Conventions

These rules are enforced by oxlint and oxfmt. Your PR will fail CI if they are violated.

| Rule | Example |
|------|---------|
| `type` not `interface` | `type Props = { name: string }` |
| `Array<T>` not `T[]` | `Array<string>` not `string[]` |
| `import type` for type-only imports | `import type { Props } from '@/types'` |
| `@/` path alias for all src imports | `import { Button } from '@/components'` |
| No semicolons | Enforced by oxfmt |
| Single quotes | Enforced by oxfmt |
| Trailing commas | Enforced by oxfmt |
| Named exports only | `export const Foo` not `export default` (exception: page components) |
| `motion/react` for animations | Never `framer-motion` |
| `tv()` from `@/utils` for Tailwind variants | Not directly from `tailwind-variants` |
| Custom breakpoints only | `tablet:`, `laptop:`, `desktop:` — never `sm:`, `md:`, `lg:`, `xl:`, `2xl:` |
| Alphabetical imports | External first, then type-only `@/types`, then internal `@/` |
| 120 char line width | Enforced by oxfmt |

## Responsive Breakpoints

This project uses **custom breakpoints** defined in `src/index.css`. The default Tailwind breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`) are removed via `--breakpoint-*: initial`.

| Breakpoint | Class prefix | Width | Use case |
|------------|-------------|-------|----------|
| tablet | `tablet:` | 48rem (768px) | Side-by-side layouts, expanded nav |
| laptop | `laptop:` | 80rem (1280px) | Multi-column grids, wider content |
| desktop | `desktop:` | 120rem (1920px) | Full-width layouts, additional columns |

**Never use** `sm:`, `md:`, `lg:`, `xl:`, or `2xl:` — they are not defined and will have no effect.

```tsx
// Correct
<div className="flex flex-col tablet:flex-row" />

// Wrong — these breakpoints do not exist
<div className="flex flex-col md:flex-row" />
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server on port 5173 |
| `pnpm build` | TypeScript check + Vite production build |
| `pnpm lint` | Run oxlint |
| `pnpm lint:fix` | Run oxlint with auto-fix |
| `pnpm format` | Format source files with oxfmt |
| `pnpm format:check` | Check formatting without writing |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:e2e` | Run E2E tests (Playwright) |
| `pnpm test:e2e:ui` | Run E2E tests with Playwright UI |
| `pnpm test:e2e:headed` | Run E2E tests in headed browser |
| `pnpm preview` | Preview production build on port 5173 |

## Project Structure

```
csr-dev-tools/
├── e2e/                          # Playwright E2E tests
│   ├── helpers/
│   │   ├── fixtures.ts           # Shared test data
│   │   └── selectors.ts          # Shared page selectors
│   ├── platform/
│   │   └── home.spec.ts          # Dashboard E2E test
│   └── color-converter.spec.ts   # Example tool E2E test
├── src/
│   ├── components/
│   │   ├── common/               # Shared UI (Button, Card, Dialog, FieldForm, etc.)
│   │   └── feature/              # Tool components by domain
│   │       ├── color/            # ColorConvertor
│   │       ├── encoding/         # EncodingBase64
│   │       ├── image/            # ImageConvertor, ImageResizer
│   │       ├── time/             # TimeUnixTimestamp
│   │       └── unit/             # UnitPxToRem
│   ├── constants/
│   │   ├── tool-registry.ts      # Tool registry — add your tool here
│   │   ├── feature.ts
│   │   ├── image.ts
│   │   └── route.ts
│   ├── hooks/
│   │   ├── state/                # Zustand stores
│   │   ├── persist/              # Persistent state hooks
│   │   └── index.ts
│   ├── pages/                    # Route page components (default export)
│   ├── types/                    # Type definitions mirroring src/ structure
│   │   ├── components/
│   │   ├── constants/
│   │   │   └── tool-registry.ts  # ToolCategory, ToolRegistryKey, ToolRegistryEntry
│   │   ├── hooks/
│   │   └── utils/
│   └── utils/                    # Pure utility functions + co-located *.spec.ts tests
│       ├── color.ts / color.spec.ts
│       ├── validation.ts / validation.spec.ts
│       └── ...
├── .github/workflows/
│   ├── ci.yml                    # CI pipeline (lint, format, test, build, E2E)
│   └── lighthouse.yml            # Lighthouse CI (perf, a11y, SEO >= 90)
├── .oxlintrc.json                # oxlint configuration
├── .oxfmtrc.json                 # oxfmt configuration
├── playwright.config.ts          # Playwright config (Chromium, localhost:5173)
├── vitest.config.ts              # Vitest config (node env, globals)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Testing

### Unit Tests (Vitest)

- **Environment:** Node (not jsdom) — tests target pure logic, not DOM
- **Location:** Co-located `*.spec.ts` files next to source (e.g., `color.spec.ts` beside `color.ts`)
- **Globals:** `describe`, `it`, `expect` are available without importing
- **Path aliases:** `@/` imports work in tests via `vite-tsconfig-paths`
- **Run:** `pnpm test`

### E2E Tests (Playwright)

- **Browser:** Chromium only
- **Base URL:** `http://localhost:5173` (dev server auto-starts)
- **Shared selectors:** Import from `e2e/helpers/selectors.ts` — covers sidebar, command palette, tool inputs/outputs, copy button, toast, card, and error messages
- **Shared fixtures:** Import from `e2e/helpers/fixtures.ts` — test data for colors, base64, timestamps, px/rem, tool keys/names/routes
- **Run:** `pnpm test:e2e`

## PR Checklist

Copy this checklist into your PR description:

```markdown
- [ ] Registry entry added in `src/constants/tool-registry.ts` with all required fields
- [ ] `ToolCategory` and `ToolRegistryKey` types updated (if new category or key)
- [ ] Barrel exports added/updated in `index.ts` files
- [ ] `useToast` with `type: 'error'` used for error handling
- [ ] Unit tests written (co-located `*.spec.ts`)
- [ ] E2E test written (`e2e/{tool-key}.spec.ts`)
- [ ] `pnpm lint` passes
- [ ] `pnpm format:check` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds
```

## CI/CD Quality Gates

Every pull request runs through these automated checks. CI also runs on each push to `main` and `develop`:

**CI Pipeline** (`.github/workflows/ci.yml`):

1. **Lint** — `pnpm lint` (oxlint)
2. **Format Check** — `pnpm format:check` (oxfmt)
3. **Typecheck** — `pnpm typecheck`
4. **Unit Tests** — `pnpm test` (Vitest)
5. **Build** — `pnpm build` (TypeScript + Vite)
6. **E2E Tests** — `pnpm test:e2e` (Playwright, Chromium)

**Tool Freeze** (`.github/workflows/tool-freeze.yml`), on pull requests into `main` only: the set of tool keys must not change.

**Lighthouse CI** (`.github/workflows/lighthouse.yml`):

- Performance >= 90
- Accessibility >= 90
- SEO >= 90

The CI pipeline, and Tool Freeze for `main`, must pass before a PR can be merged. Lighthouse is not required yet.
