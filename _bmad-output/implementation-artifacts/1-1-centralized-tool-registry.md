# Story 1.1: Centralized Tool Registry

Status: done

## Story

As a user,
I want all tools organized through a single registry that powers the dashboard,
so that I can browse a consistent, up-to-date tool catalog from the central dashboard.

## Acceptance Criteria

**AC-1: Registry exists with all 6 tools**

**Given** the application source code
**When** a developer inspects `src/constants/tool-registry.ts`
**Then** a `TOOL_REGISTRY` array exists containing entries for all 6 existing tools (Color Converter, Base64 Encoder, Image Converter, Image Resizer, Unix Timestamp, PX to REM)
**And** each entry includes: `key` (kebab-case), `name`, `category`, `emoji`, `description`, `seo` (title + description), `routePath`, and `component` (lazy import)

**AC-2: Dashboard consumes registry instead of manual constants**

**Given** the home page dashboard
**When** the page renders
**Then** tool cards are generated from `TOOL_REGISTRY` instead of manual `FEATURE_TITLE` constants and hardcoded lazy imports
**And** existing drag-and-drop layout and persistent preferences continue to work unchanged

**AC-3: TypeScript enforces registry entry shape**

**Given** a `ToolRegistryEntry` type defined in `src/types/constants/tool-registry.ts`
**When** a registry entry is created
**Then** TypeScript enforces all required fields are present with correct types

**AC-4: No regression in existing tool behavior**

**Given** the existing 6 tools
**When** the registry is consumed by the dashboard
**Then** all 6 tools render and function identically to the pre-registry behavior (no regression)

## Tasks / Subtasks

### Task 1: Define the `ToolRegistryEntry` type (AC-3)

**File to create:** `src/types/constants/tool-registry.ts`

- [x] 1.1. Define `ToolCategory` as a union type covering existing categories: `'Color' | 'Encoding' | 'Image' | 'Time' | 'Unit'`
- [x] 1.2. Define `ToolSeo` type with `title: string` and `description: string` fields
- [x] 1.3. Define `ToolRegistryEntry` type with all required fields: `key`, `name`, `category`, `emoji`, `description`, `seo`, `routePath`, `component`
- [x] 1.4. Define `ToolRegistryKey` as a union of the 6 existing tool kebab-case keys (for type-safe lookups)
- [x] 1.5. Export all types

### Task 2: Update type barrel exports (AC-3)

**File to modify:** `src/types/constants/index.ts`

- [x] 2.1. Add `export * from './tool-registry'` to the barrel export

### Task 3: Create the `TOOL_REGISTRY` constant (AC-1)

**File to create:** `src/constants/tool-registry.ts`

- [x] 3.1. Import `lazy` from React
- [x] 3.2. Import the `ToolRegistryEntry` type
- [x] 3.3. Define `TOOL_REGISTRY` as `Array<ToolRegistryEntry>` containing entries for all 6 existing tools
- [x] 3.4. Each entry must have a `component` field using `lazy()` with the named-export destructuring pattern matching the existing lazy import pattern
- [x] 3.5. Create a `TOOL_REGISTRY_MAP` derived lookup: `Record<string, ToolRegistryEntry>` keyed by `key` for O(1) access
- [x] 3.6. Entries sorted alphabetically by `key`

### Task 4: Update constants barrel exports (AC-1)

**File to modify:** `src/constants/index.ts`

- [x] 4.1. Add `export * from './tool-registry'` to the barrel export
- [x] 4.2. Keep `export * from './feature'` for now (backward compatibility during migration; to be removed in a later story)

### Task 5: Migrate `usePersistFeatureLayout` to support registry keys (AC-2, AC-4)

**File to modify:** `src/hooks/persist/usePersistFeatureLayout.ts`
**File to modify:** `src/types/hooks/persist.ts`

- [x] 5.1. Update `UsePersistFeatureLayout` type to accept `ToolRegistryKey | FeatureKey | null` as the payload type (backward-compatible union)
- [x] 5.2. Add a migration helper that maps old `FeatureKey` values to new `ToolRegistryKey` values on store hydration
- [x] 5.3. Ensure the Zustand `persist` middleware continues to use `{ name: 'feature_layout' }` storage key to preserve existing user data
- [x] 5.4. The store `value` default must use the new registry keys

### Task 6: Refactor `src/pages/home/index.tsx` to consume `TOOL_REGISTRY` (AC-2, AC-4)

**File to modify:** `src/pages/home/index.tsx`

- [x] 6.1. Remove all 6 manual `lazy()` import statements at the top of the file
- [x] 6.2. Remove the `FEATURE_TITLE` import
- [x] 6.3. Import `TOOL_REGISTRY` and `TOOL_REGISTRY_MAP` from `@/constants`
- [x] 6.4. Replace the `AppContainer` switch statement with a registry-based lookup:
  - Look up the registry entry from `value[position]` using `TOOL_REGISTRY_MAP`
  - If found, render the entry's `component` wrapped in a `<Card>` with `title` from the entry's `name`
  - If not found (null), render the `<AddButton>`
- [x] 6.5. Replace the `SelectAppDialog` to iterate `TOOL_REGISTRY` instead of `Object.keys(FEATURE_TITLE)`
  - Display `entry.emoji` + `entry.name` instead of just `FEATURE_TITLE[value as FeatureKey]`
  - Use `entry.key` as the value passed to `setter()`
- [x] 6.6. Verify Suspense boundaries remain in place around lazy-loaded components

### Task 7: Verify no regression (AC-4)

- [x] 7.1. Run `pnpm build` to confirm TypeScript compilation succeeds with zero errors (only pre-existing `useDebounceCallback.ts` error remains — zero errors from story changes)
- [x] 7.2. Run `pnpm lint` to confirm no linting violations
- [x] 7.3. Run `pnpm format:check` to confirm formatting compliance
- [x] 7.4. Run `pnpm test` to confirm all existing unit tests pass
- [x] 7.5. Manually verify in the browser that all 6 tools render correctly in their card positions
- [x] 7.6. Manually verify that closing a card, selecting a different tool from the dialog, and refreshing the page preserves layout preferences

## Dev Notes

### Architecture Patterns and Constraints

This story is the **foundational building block** for the entire platform. The `TOOL_REGISTRY` becomes the single source of truth consumed by every downstream feature:

```
TOOL_REGISTRY (single source of truth)
    |-->  routes.tsx         -> generates tool routes (Story 1.2)
    |-->  Home page          -> renders card grid (THIS STORY)
    |-->  Sidebar            -> renders category groups (Story 1.3)
    |-->  CommandPalette     -> fuzzy search results (Story 1.4)
    |-->  Pre-renderer       -> generates static HTML per route (Story 1.2)
    +-->  SEO meta tags      -> title, description, OG per route (Story 1.2)
```

Only the **Home page consumption** is in scope for this story. Do NOT wire up routes, sidebar, command palette, or SEO in this story.

### Exact File Paths to Create

| File | Purpose |
|------|---------|
| `src/types/constants/tool-registry.ts` | Type definitions for registry entries |
| `src/constants/tool-registry.ts` | The `TOOL_REGISTRY` array and `TOOL_REGISTRY_MAP` lookup |

### Exact File Paths to Modify

| File | Nature of Change |
|------|-----------------|
| `src/types/constants/index.ts` | Add barrel export for `tool-registry` |
| `src/constants/index.ts` | Add barrel export for `tool-registry` |
| `src/pages/home/index.tsx` | Replace switch + manual lazy imports with registry-based rendering |
| `src/hooks/persist/usePersistFeatureLayout.ts` | Migrate default values + support both old and new key formats |
| `src/types/hooks/persist.ts` | Update type to accept both `FeatureKey` and `ToolRegistryKey` |

### Files to NOT Modify (Out of Scope)

| File | Reason |
|------|--------|
| `src/routes.tsx` | Tool routes are Story 1.2 |
| `src/App.tsx` | Sidebar/layout changes are Story 1.3+ |
| `src/constants/feature.ts` | Keep for backward compatibility; remove in a later story |
| `src/types/constants/feature.ts` | Keep `FeatureKey` type; remove in a later story |
| Any component in `src/components/feature/` | Tool refactoring is Epic 3 |

### Type Definition Structure

The type file `src/types/constants/tool-registry.ts` must follow this exact pattern:

```typescript
import type { ComponentType } from 'react'

export type ToolCategory = 'Color' | 'Encoding' | 'Image' | 'Time' | 'Unit'

export type ToolSeo = {
  description: string
  title: string
}

export type ToolRegistryEntry = {
  category: ToolCategory
  component: React.LazyExoticComponent<ComponentType>
  description: string
  emoji: string
  key: ToolRegistryKey
  name: string
  routePath: string
  seo: ToolSeo
}

export type ToolRegistryKey =
  | 'base64-encoder'
  | 'color-converter'
  | 'image-converter'
  | 'image-resizer'
  | 'px-to-rem'
  | 'unix-timestamp'
```

**IMPORTANT:** Object keys in the type must be alphabetically sorted per project convention. Fields in the `ToolRegistryEntry` type must be in alphabetical order: `category`, `component`, `description`, `emoji`, `key`, `name`, `routePath`, `seo`.

### Registry Constant Pattern

The `src/constants/tool-registry.ts` file must follow this exact pattern:

```typescript
import { lazy } from 'react'

import type { ToolRegistryEntry } from '@/types'

export const TOOL_REGISTRY: Array<ToolRegistryEntry> = [
  {
    category: 'Encoding',
    component: lazy(() =>
      import('@/components/feature/encoding/EncodingBase64').then(
        ({ EncodingBase64 }: { EncodingBase64: React.ComponentType }) => ({
          default: EncodingBase64,
        }),
      ),
    ),
    description: 'Encode and decode Base64 strings in the browser',
    emoji: '🔤',
    key: 'base64-encoder',
    name: 'Base64 Encoder',
    routePath: '/tools/base64-encoder',
    seo: {
      description: 'Encode and decode Base64 strings online. Convert text to Base64 and back instantly in your browser.',
      title: 'Base64 Encoder - CSR Dev Tools',
    },
  },
  {
    category: 'Color',
    component: lazy(() =>
      import('@/components/feature/color/ColorConvertor').then(
        ({ ColorConvertor }: { ColorConvertor: React.ComponentType }) => ({
          default: ColorConvertor,
        }),
      ),
    ),
    description: 'Convert colors between HEX, RGB, HSL, OKLCH, LAB, and LCH formats',
    emoji: '🎨',
    key: 'color-converter',
    name: 'Color Converter',
    routePath: '/tools/color-converter',
    seo: {
      description: 'Convert colors between HEX, RGB, HSL, OKLCH, LAB, and LCH formats online. Free browser-based color converter.',
      title: 'Color Converter - CSR Dev Tools',
    },
  },
  {
    category: 'Image',
    component: lazy(() =>
      import('@/components/feature/image/ImageConvertor').then(
        ({ ImageConvertor }: { ImageConvertor: React.ComponentType }) => ({
          default: ImageConvertor,
        }),
      ),
    ),
    description: 'Convert images between PNG, JPG, WebP, GIF, BMP, and AVIF formats',
    emoji: '🖼️',
    key: 'image-converter',
    name: 'Image Converter',
    routePath: '/tools/image-converter',
    seo: {
      description: 'Convert images between PNG, JPG, WebP, GIF, BMP, and AVIF formats online. Free browser-based image converter.',
      title: 'Image Converter - CSR Dev Tools',
    },
  },
  {
    category: 'Image',
    component: lazy(() =>
      import('@/components/feature/image/ImageResizer').then(
        ({ ImageResizer }: { ImageResizer: React.ComponentType }) => ({
          default: ImageResizer,
        }),
      ),
    ),
    description: 'Resize images to custom dimensions with aspect ratio control',
    emoji: '📐',
    key: 'image-resizer',
    name: 'Image Resizer',
    routePath: '/tools/image-resizer',
    seo: {
      description: 'Resize images to custom width and height dimensions online. Free browser-based image resizer.',
      title: 'Image Resizer - CSR Dev Tools',
    },
  },
  {
    category: 'Unit',
    component: lazy(() =>
      import('@/components/feature/unit/UnitPxToRem').then(
        ({ UnitPxToRem }: { UnitPxToRem: React.ComponentType }) => ({
          default: UnitPxToRem,
        }),
      ),
    ),
    description: 'Convert between PX and REM units with configurable base font size',
    emoji: '📏',
    key: 'px-to-rem',
    name: 'PX to REM',
    routePath: '/tools/px-to-rem',
    seo: {
      description: 'Convert between PX and REM CSS units online. Configurable base font size. Free browser-based unit converter.',
      title: 'PX to REM - CSR Dev Tools',
    },
  },
  {
    category: 'Time',
    component: lazy(() =>
      import('@/components/feature/time/TimeUnixTimestamp').then(
        ({ TimeUnixTimestamp }: { TimeUnixTimestamp: React.ComponentType }) => ({
          default: TimeUnixTimestamp,
        }),
      ),
    ),
    description: 'Convert between Unix timestamps and human-readable dates',
    emoji: '🕐',
    key: 'unix-timestamp',
    name: 'Unix Timestamp',
    routePath: '/tools/unix-timestamp',
    seo: {
      description: 'Convert between Unix timestamps and human-readable dates online. Free browser-based timestamp converter.',
      title: 'Unix Timestamp - CSR Dev Tools',
    },
  },
]

export const TOOL_REGISTRY_MAP = TOOL_REGISTRY.reduce<Record<string, ToolRegistryEntry>>(
  (acc, entry) => {
    acc[entry.key] = entry
    return acc
  },
  {},
)
```

**Critical notes on the registry:**

- The array is sorted alphabetically by `key`
- Each entry's object keys are sorted alphabetically
- The `component` field uses the exact same lazy-import-with-named-export-destructuring pattern that currently exists in `src/pages/home/index.tsx`
- `routePath` values follow the pattern `/tools/{key}` but are explicit strings (not computed), as specified by architecture
- SEO `title` format: `{Tool Name} - CSR Dev Tools`
- SEO `description`: max 155 characters, action-oriented

### FeatureKey to ToolRegistryKey Mapping

This is the critical mapping for the `usePersistFeatureLayout` migration:

| Old `FeatureKey` | New `ToolRegistryKey` |
|-----------------|----------------------|
| `'BASE64_ENCODER'` | `'base64-encoder'` |
| `'COLOR_CONVERTER'` | `'color-converter'` |
| `'IMAGE_CONVERTOR'` | `'image-converter'` |
| `'IMAGE_RESIZER'` | `'image-resizer'` |
| `'PX_TO_REM'` | `'px-to-rem'` |
| `'UNIX_TIMESTAMP'` | `'unix-timestamp'` |

### Persist Store Migration Strategy

The `usePersistFeatureLayout` store currently persists to localStorage under key `feature_layout`. Users visiting after this change will have old `FeatureKey` values (e.g., `'COLOR_CONVERTER'`) in their localStorage.

The migration approach:

1. **Keep the same localStorage key** (`feature_layout`) to avoid data loss
2. **Add an `onRehydrateStorage` handler** in the Zustand `persist` config that maps old FeatureKey values to new ToolRegistryKey values
3. **Update the store's default values** to use the new ToolRegistryKey format
4. **Update the type** to accept both `FeatureKey | ToolRegistryKey | null` during the transition period

Example migration logic:

```typescript
const FEATURE_KEY_TO_REGISTRY_KEY: Record<string, string> = {
  BASE64_ENCODER: 'base64-encoder',
  COLOR_CONVERTER: 'color-converter',
  IMAGE_CONVERTOR: 'image-converter',
  IMAGE_RESIZER: 'image-resizer',
  PX_TO_REM: 'px-to-rem',
  UNIX_TIMESTAMP: 'unix-timestamp',
}

const migrateValue = (value: Record<number, string | null>): Record<number, string | null> => {
  const migrated: Record<number, string | null> = {}
  for (const [position, key] of Object.entries(value)) {
    if (key && key in FEATURE_KEY_TO_REGISTRY_KEY) {
      migrated[Number(position)] = FEATURE_KEY_TO_REGISTRY_KEY[key]
    } else {
      migrated[Number(position)] = key
    }
  }
  return migrated
}
```

Use Zustand persist's `version` and `migrate` options to handle this:

```typescript
persist<UsePersistFeatureLayout>(
  (set) => ({
    setter: (position, payload) =>
      set((state) => ({
        value: { ...state.value, [position]: payload },
      })),
    value: {
      0: 'image-converter',
      1: 'unix-timestamp',
      2: 'base64-encoder',
      3: 'color-converter',
      4: 'image-resizer',
      5: 'px-to-rem',
    },
  }),
  {
    migrate: (persistedState, version) => {
      if (version === 0) {
        const state = persistedState as UsePersistFeatureLayout
        return { ...state, value: migrateValue(state.value) }
      }
      return persistedState as UsePersistFeatureLayout
    },
    name: 'feature_layout',
    version: 1,
  },
)
```

### Home Page Refactor: Switch Statement Replacement

The current `AppContainer` switch statement (lines 81-120 in `src/pages/home/index.tsx`) maps `FeatureKey` values to hardcoded component + title combinations. Replace with a registry-based lookup:

**Before (current):**
```typescript
switch (value[position]) {
  case 'BASE64_ENCODER':
    return (
      <Card onClose={handleClose} title={FEATURE_TITLE.BASE64_ENCODER}>
        <EncodingBase64 />
      </Card>
    )
  case 'COLOR_CONVERTER':
    // ... etc for all 6 tools
  default:
    return <AddButton onClick={() => onOpenDialog(position)} />
}
```

**After (registry-based):**
```typescript
const registryKey = value[position]
if (registryKey) {
  const entry = TOOL_REGISTRY_MAP[registryKey]
  if (entry) {
    const ToolComponent = entry.component
    return (
      <Card onClose={handleClose} title={entry.name}>
        <ToolComponent />
      </Card>
    )
  }
}
return <AddButton onClick={() => onOpenDialog(position)} />
```

### Home Page Refactor: SelectAppDialog Replacement

The current `SelectAppDialog` (lines 131-175 in `src/pages/home/index.tsx`) iterates `Object.keys(FEATURE_TITLE)`. Replace with registry iteration:

**Before (current):**
```typescript
const list = Object.keys(FEATURE_TITLE).map((value) => ({
  at: appPosition[value] ?? null,
  value,
}))
```

**After (registry-based):**
```typescript
const list = TOOL_REGISTRY.map((entry) => ({
  at: appPosition[entry.key] ?? null,
  entry,
}))
```

And update the rendering:
```typescript
{list.map(({ at, entry }) => (
  <li key={entry.key}>
    <button
      className="hover:bg-primary/30 flex w-full cursor-pointer items-center justify-between rounded p-2 text-left disabled:pointer-events-none disabled:opacity-50"
      disabled={at !== null}
      onClick={() => handleSelectApp(entry.key)}
    >
      <span>
        <span className="mr-2">{entry.emoji}</span>
        {entry.name}
      </span>
      {at !== null && <span className="bg-secondary rounded px-1 text-xs text-white">#{at + 1}</span>}
    </button>
  </li>
))}
```

### Code Conventions Checklist

The implementing agent MUST follow all of these conventions. Violations will cause lint/format failures:

- [ ] Use `type` keyword, never `interface` (oxlint: `typescript/consistent-type-definitions`)
- [ ] Use `Array<T>` syntax, never `T[]` (oxlint: `typescript/array-type`)
- [ ] Use `import type` for type-only imports (enforced by `verbatimModuleSyntax`)
- [ ] No semicolons (oxfmt: `semi: false`)
- [ ] Single quotes (oxfmt: `singleQuote: true`)
- [ ] Trailing commas everywhere (oxfmt: `trailingComma: 'all'`)
- [ ] 120 character line width maximum (oxfmt: `printWidth: 120`)
- [ ] No `console.log` statements (oxlint: `no-console`)
- [ ] Use `@/` path alias for all `src/` imports, never relative paths
- [ ] Named exports for all non-page components
- [ ] Alphabetical ordering of object keys, props, and import groups
- [ ] Import ordering: external libs, blank line, `import type` from `@/types`, blank line, internal `@/` imports
- [ ] Import from `motion/react`, never `framer-motion`
- [ ] kebab-case folder names, PascalCase component files, camelCase utility/hook files

### Anti-Patterns to Avoid

1. **Do NOT eagerly import any tool component** -- all tools must remain lazy-loaded via `lazy()`. Importing a tool component at the top of any file (not wrapped in `lazy()`) will bloat the initial bundle.

2. **Do NOT create a new localStorage key** for the persist store. Keep `{ name: 'feature_layout' }`. Changing the key will wipe all existing user layout preferences.

3. **Do NOT remove `src/constants/feature.ts` or `src/types/constants/feature.ts`** in this story. Other parts of the codebase may still reference `FeatureKey`. These files will be cleaned up in a later story after all consumers are migrated.

4. **Do NOT use `React.lazy` with default imports** when the target component uses named exports. The existing pattern uses `.then()` to destructure the named export and wrap it as `{ default: NamedExport }`. This is required because all feature components use named exports (`export const ColorConvertor`), not default exports.

5. **Do NOT add route definitions** in this story. Route generation from `TOOL_REGISTRY` is Story 1.2 scope.

6. **Do NOT modify any component in `src/components/feature/`**. Tool refactoring to use `ToolLayout` is Epic 3 scope.

7. **Do NOT use `interface`** -- the project uses `type` exclusively. oxlint will error.

8. **Do NOT use `string[]`** -- use `Array<string>`. oxlint will error.

9. **Do NOT use `React` namespace for types** when direct imports are available. Use `import type { ComponentType, LazyExoticComponent } from 'react'` instead of `React.ComponentType`.

### Testing Requirements

- **No new unit tests** are required for this story (the registry is a data constant, not logic)
- **All existing tests must continue to pass** (`pnpm test`)
- **TypeScript compilation** must succeed (`pnpm build` which runs `tsc -b` first)
- **Linting must pass** (`pnpm lint`)
- **Formatting must pass** (`pnpm format:check`)
- **Manual browser verification** is required: all 6 tools must render and function identically in the dashboard card grid, and layout persistence must survive a page refresh

### Project Structure Notes

This story aligns with the project structure defined in the architecture document:

```
src/
  constants/
    index.ts                    # Modified: add tool-registry barrel export
    feature.ts                  # UNCHANGED (backward compat, remove later)
    tool-registry.ts            # NEW: TOOL_REGISTRY + TOOL_REGISTRY_MAP
  types/
    constants/
      index.ts                  # Modified: add tool-registry barrel export
      feature.ts                # UNCHANGED (backward compat, remove later)
      tool-registry.ts          # NEW: ToolRegistryEntry, ToolRegistryKey, etc.
    hooks/
      persist.ts                # Modified: widen type to accept ToolRegistryKey
  hooks/
    persist/
      usePersistFeatureLayout.ts  # Modified: migrate defaults + add version/migrate
  pages/
    home/
      index.tsx                 # Modified: registry-based rendering
```

### References

- Architecture document: `_bmad-output/planning-artifacts/architecture.md` -- Section "Tool Registry: Centralized TOOL_REGISTRY", Section "Structure Patterns > Tool Registry Entry Pattern", Section "Implementation Handoff > First Implementation Priority"
- Epics document: `_bmad-output/planning-artifacts/epics.md` -- Story 1.1 acceptance criteria, Epic 1 overview
- Project context: `_bmad-output/project-context.md` -- All 53 rules, especially "Adding a New Tool" workflow, "Anti-Patterns to Avoid", "Performance Rules"
- Implementation readiness report: `_bmad-output/planning-artifacts/implementation-readiness-report-2026-02-12.md` -- Confirms this is the first story in the critical path
- Current source files that define the "before" state:
  - `src/constants/feature.ts` -- Current `FEATURE_TITLE` constant being replaced
  - `src/types/constants/feature.ts` -- Current `FeatureKey` type being supplemented
  - `src/pages/home/index.tsx` -- Current dashboard with manual lazy imports and switch statement
  - `src/hooks/persist/usePersistFeatureLayout.ts` -- Current persist store with `FeatureKey` values
  - `src/types/hooks/persist.ts` -- Current persist store type definition

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Pre-existing `useDebounceCallback.ts` TS error (`Type 'Timeout' is not assignable to type 'number'`) — unrelated to story changes, not modified

### Completion Notes List
- Created `ToolRegistryEntry`, `ToolRegistryKey`, `ToolCategory`, `ToolSeo` types with alphabetically sorted fields per project convention
- Created `TOOL_REGISTRY` array with all 6 tools and `TOOL_REGISTRY_MAP` for O(1) lookups
- Added Zustand persist migration (version 0 → 1) to map old `FeatureKey` values to new `ToolRegistryKey` values seamlessly
- Refactored home page: replaced switch statement with registry-based lookup, replaced `SelectAppDialog` with registry iteration showing emoji + name
- Removed all 6 manual `lazy()` imports from home page — now powered by registry `component` field
- Kept `feature.ts` and `FeatureKey` type for backward compatibility as specified
- All automated checks pass: lint (0 errors), format (clean), tests (15/15 passed)
- Manual browser verification required (Tasks 7.5, 7.6)
- **[Intentional]** Display names corrected: "Color Convertor" → "Color Converter", "Image Convertor" → "Image Converter" (American English spelling standardization, per story spec)

### Senior Developer Review (AI)

**Reviewer:** csrteam | **Date:** 2026-02-13

**Issues Found:** 1 High, 4 Medium, 2 Low | **Fixed:** 4 (1H + 3M) | **Pre-existing fixed:** 1 (M4)

| ID | Severity | File | Issue | Resolution |
|----|----------|------|-------|------------|
| H1 | High | `src/constants/tool-registry.ts` | Display names changed from "Convertor" to "Converter" — AC-4 says "identically" but story spec defines corrected spelling | Documented as intentional; no code change needed |
| M1 | Medium | `src/constants/tool-registry.ts:1` | Inline type import `import { type ComponentType, lazy }` violates "NEVER import types inline" convention | **Fixed** — split into separate `import type` statement |
| M2 | Medium | `src/hooks/persist/usePersistFeatureLayout.ts:22` | Unsafe cast `key as ToolRegistryKey \| null` in migration — corrupt localStorage data passes through without validation | **Fixed** — added `REGISTRY_KEY_SET` validation; unknown values default to `null` |
| M3 | Medium | `src/constants/tool-registry.ts:123` | `TOOL_REGISTRY_MAP` typed as `Record<string, ToolRegistryEntry>` (non-sparse) — misleading type safety | **Fixed** — changed to `Partial<Record<string, ToolRegistryEntry>>` |
| M4 | Medium | `src/pages/home/index.tsx:94` | Dialog title `position ? position + 1 : ''` fails for position 0 (falsy check, not null check) | **Fixed** — changed to `position !== null ? position + 1 : ''` (pre-existing bug) |
| L1 | Low | `src/pages/home/index.tsx:2` | Pre-existing inline type import `import { type ButtonHTMLAttributes, ... }` | Not fixed — pre-existing, out of story scope |
| L2 | Low | `src/hooks/persist/usePersistFeatureLayout.ts:1` | Pre-existing inline type import `import { create, type StoreApi, ... }` | Not fixed — pre-existing, out of story scope |

**Post-fix verification:** lint (0 errors), format (clean), tests (15/15 passed)

### Change Log
| Task | File | Action | Status |
|------|------|--------|--------|
| 1 | `src/types/constants/tool-registry.ts` | Create | Done |
| 2 | `src/types/constants/index.ts` | Modify (add barrel export) | Done |
| 3 | `src/constants/tool-registry.ts` | Create | Done |
| 4 | `src/constants/index.ts` | Modify (add barrel export) | Done |
| 5 | `src/hooks/persist/usePersistFeatureLayout.ts` | Modify (migration) | Done |
| 5 | `src/types/hooks/persist.ts` | Modify (widen type) | Done |
| 6 | `src/pages/home/index.tsx` | Modify (registry refactor) | Done |
| 7 | N/A | Verification (build, lint, test, manual) | Done |
| Review | `src/constants/tool-registry.ts` | Fix inline type import + Partial Record type | Done |
| Review | `src/hooks/persist/usePersistFeatureLayout.ts` | Fix unsafe cast in migration | Done |
| Review | `src/pages/home/index.tsx` | Fix dialog title bug (position 0) | Done |

### File List
- `src/types/constants/tool-registry.ts` (new)
- `src/types/constants/index.ts` (modified)
- `src/constants/tool-registry.ts` (new)
- `src/constants/index.ts` (modified)
- `src/hooks/persist/usePersistFeatureLayout.ts` (modified)
- `src/types/hooks/persist.ts` (modified)
- `src/pages/home/index.tsx` (modified)
