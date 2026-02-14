# Story 3.7: Dashboard Layout Persistence Baseline

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **my dashboard tool card arrangement to persist and work reliably with the new registry-based system**,
So that **my personalized layout is preserved across sessions after the registry migration**.

**Epic:** Epic 3 — Existing Tool Baseline & Enhancement
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Stories 3.1-3.6 (all existing tools refactored — complete)
**Story Key:** 3-7-dashboard-layout-persistence-baseline

## Acceptance Criteria

### AC1: Registry-Based Layout Rendering

**Given** the existing `usePersistFeatureLayout` hook
**When** the dashboard renders tools from `TOOL_REGISTRY`
**Then** tool cards are rendered at their persisted positions using registry entries
**And** layout preferences persist across browser sessions via localStorage

### AC2: Pre-Registry Migration

**Given** a user with an existing saved layout using old feature keys (e.g., `BASE64_ENCODER`, `COLOR_CONVERTER`)
**When** they load the app after the registry migration
**Then** their layout preferences are preserved — old keys migrate to new registry keys (e.g., `BASE64_ENCODER` → `'base64-encoder'`)
**And** no layout data is lost
**And** unknown or removed keys are gracefully cleared to `null`

### AC3: New Tool Graceful Integration

**Given** new tools are added to `TOOL_REGISTRY` in the future
**When** the dashboard loads
**Then** new tools appear in the selection dialog without disrupting the user's existing arrangement
**And** positions with existing tools remain unchanged
**And** new tools can be assigned to empty positions via the existing dialog

### AC4: Migration Utility Tests

**Given** the `migrateValue` function extracted to `src/utils/dashboard.ts`
**When** `pnpm test` runs
**Then** migration logic has comprehensive test coverage: old keys, new keys, unknown keys, null positions, mixed states, empty layouts, and corrupted data
**And** all existing tests continue to pass with no regressions

### AC5: Layout Validation

**Given** the layout validation utility `isValidLayoutValue`
**When** called with a layout record
**Then** it validates that all position keys are valid non-negative integers, all tool keys are valid `ToolRegistryKey` values or `null`, and no tool key appears in more than one position

## Tasks / Subtasks

- [x] Task 1: Extract migration and validation logic to pure utilities (AC: #2, #4, #5)
  - [x] 1.1 Create `src/utils/dashboard.ts` with `migrateLayoutValue` (extracted from hook) and `isValidLayoutValue` functions
  - [x] 1.2 Update `src/utils/index.ts` — add barrel export for `dashboard.ts`
  - [x] 1.3 Refactor `usePersistFeatureLayout.ts` — import and use `migrateLayoutValue` from utils instead of inline

- [x] Task 2: Write regression tests for migration and validation (AC: #4)
  - [x] 2.1 Create `src/utils/dashboard.spec.ts` with tests for `migrateLayoutValue`:
    - Old feature keys → registry keys (all 6)
    - Already-migrated registry keys preserved
    - Unknown keys cleared to null
    - Null positions preserved
    - Mixed old/new/unknown keys
    - Empty layout `{}`
    - Partial layout (fewer than 6 positions)
  - [x] 2.2 Tests for `isValidLayoutValue`:
    - Valid default layout (all 6 tools)
    - Layout with null positions (empty slots)
    - Layout with unknown tool key (invalid)
    - Layout with duplicate tool key (invalid)
    - Empty layout (valid)

- [x] Task 3: Ensure new tools integrate without disruption (AC: #3)
  - [x] 3.1 Review and verify that `SelectAppDialog` renders all `TOOL_REGISTRY` entries regardless of current layout state
  - [x] 3.2 Verify that adding a new entry to TOOL_REGISTRY does not require changes to `usePersistFeatureLayout` or layout migration
  - [x] 3.3 Add a test case in `dashboard.spec.ts` that validates migration handles unknown future keys gracefully

- [x] Task 4: Linting, formatting & build verification (AC: #4)
  - [x] 4.1 Run `pnpm lint` — no errors
  - [x] 4.2 Run `pnpm format:check` — no formatting issues
  - [x] 4.3 Run `pnpm build` — build succeeds with no TypeScript errors
  - [x] 4.4 Run `pnpm test` — all tests pass (282 existing + new dashboard tests), no regressions

## Dev Notes

### CRITICAL: Current Dashboard Layout Architecture

The dashboard uses a **position-based assignment system** (not drag-and-drop) where users assign tools to 6 fixed grid positions via a selection dialog. The persistence layer is Zustand with `persist` middleware to localStorage.

#### Current System Components

1. **`usePersistFeatureLayout` hook** (`src/hooks/persist/usePersistFeatureLayout.ts`) — Zustand store with `persist` middleware
2. **Home page** (`src/pages/home/index.tsx`) — Renders 6 positions, each with `AppContainer`
3. **`SelectAppDialog`** (inline in home page) — Dialog to assign a tool to a position
4. **Card component** (`src/components/common/card/Card.tsx`) — Animated wrapper with close button

#### Layout State Shape

```typescript
// localStorage key: 'feature_layout'
// State shape:
{
  value: {
    0: 'image-converter',    // position 0 → tool key
    1: 'unix-timestamp',     // position 1 → tool key
    2: 'base64-encoder',     // etc.
    3: 'color-converter',
    4: 'image-resizer',
    5: 'px-to-rem',
  }
}
```

Each position maps to a `ToolRegistryKey | null`. When `null`, the position shows an "Add" button.

#### Migration Logic (Currently Inline in Hook)

The hook contains a `migrateValue` function and supporting constants:

```typescript
// Legacy → Registry key mapping
const FEATURE_KEY_TO_REGISTRY_KEY: Record<string, ToolRegistryKey> = {
  BASE64_ENCODER: 'base64-encoder',
  COLOR_CONVERTER: 'color-converter',
  IMAGE_CONVERTOR: 'image-converter',
  IMAGE_RESIZER: 'image-resizer',
  PX_TO_REM: 'px-to-rem',
  UNIX_TIMESTAMP: 'unix-timestamp',
}

const REGISTRY_KEY_SET = new Set<string>(Object.values(FEATURE_KEY_TO_REGISTRY_KEY))

const migrateValue = (value: Record<number, string | null>): Record<number, ToolRegistryKey | null> => {
  const migrated: Record<number, ToolRegistryKey | null> = {}
  for (const [position, key] of Object.entries(value)) {
    if (key !== null && key in FEATURE_KEY_TO_REGISTRY_KEY) {
      migrated[Number(position)] = FEATURE_KEY_TO_REGISTRY_KEY[key]
    } else if (key !== null && REGISTRY_KEY_SET.has(key)) {
      migrated[Number(position)] = key as ToolRegistryKey
    } else {
      migrated[Number(position)] = null
    }
  }
  return migrated
}
```

**This must be extracted** to `src/utils/dashboard.ts` for testability (Vitest uses node env, no Zustand mocking).

#### What MUST Change

1. **Extract `migrateLayoutValue` to `src/utils/dashboard.ts`** — Pure function, testable with Vitest
2. **Extract `FEATURE_KEY_TO_REGISTRY_KEY` and `REGISTRY_KEY_SET`** — Constants needed by the utility
3. **Add `isValidLayoutValue` utility** — Validates layout state integrity (valid keys, no duplicates)
4. **Write comprehensive tests** — Migration and validation edge cases
5. **Refactor hook to import from utils** — Hook becomes thin wrapper around pure functions

#### What to PRESERVE

1. **Zustand `persist` middleware** — The persistence layer works correctly
2. **Version 1 with migration** — Migration infrastructure is correct
3. **`setter(position, payload)` API** — Consumer API is stable
4. **localStorage key `'feature_layout'`** — Changing this would break existing user data
5. **Default layout** — All 6 tools in positions 0-5
6. **`SelectAppDialog` behavior** — Dialog-based tool assignment works correctly
7. **6 fixed grid positions** — Desktop 3x2, tablet 2x3, mobile 1x6

#### NOTE: No Drag-and-Drop

The epic AC references "drag-and-drop card reordering continues to function" — however, **no drag-and-drop library exists in the project**. The current system uses dialog-based assignment (click empty slot → pick tool from list). This story focuses on ensuring the persistence baseline is solid. Drag-and-drop reordering would be a separate enhancement if desired.

### CRITICAL: Utility Functions to Extract

**Create `src/utils/dashboard.ts`:**

```typescript
import type { ToolRegistryKey } from '@/types'

// Legacy → Registry key mapping for migration
const FEATURE_KEY_TO_REGISTRY_KEY: Record<string, ToolRegistryKey> = {
  BASE64_ENCODER: 'base64-encoder',
  COLOR_CONVERTER: 'color-converter',
  IMAGE_CONVERTOR: 'image-converter',
  IMAGE_RESIZER: 'image-resizer',
  PX_TO_REM: 'px-to-rem',
  UNIX_TIMESTAMP: 'unix-timestamp',
}

// Set for O(1) lookup during migration
const REGISTRY_KEY_SET = new Set<string>(Object.values(FEATURE_KEY_TO_REGISTRY_KEY))

/**
 * Migrates layout values from old feature keys to new registry keys.
 * - Old feature keys (e.g., BASE64_ENCODER) → new registry keys (e.g., 'base64-encoder')
 * - Already-valid registry keys → preserved as-is
 * - Unknown keys → cleared to null
 * - Null positions → preserved as null
 */
export const migrateLayoutValue = (
  value: Record<number, string | null>,
): Record<number, ToolRegistryKey | null> => {
  const migrated: Record<number, ToolRegistryKey | null> = {}
  for (const [position, key] of Object.entries(value)) {
    if (key !== null && key in FEATURE_KEY_TO_REGISTRY_KEY) {
      migrated[Number(position)] = FEATURE_KEY_TO_REGISTRY_KEY[key]
    } else if (key !== null && REGISTRY_KEY_SET.has(key)) {
      migrated[Number(position)] = key as ToolRegistryKey
    } else {
      migrated[Number(position)] = null
    }
  }
  return migrated
}

/**
 * Validates a layout value for integrity:
 * - All tool keys must be valid ToolRegistryKey or null
 * - No duplicate tool keys across positions
 */
export const isValidLayoutValue = (
  value: Record<number, string | null>,
  validKeys: Set<string>,
): boolean => {
  const seen = new Set<string>()
  for (const key of Object.values(value)) {
    if (key === null) continue
    if (!validKeys.has(key)) return false
    if (seen.has(key)) return false
    seen.add(key)
  }
  return true
}
```

### CRITICAL: Refactored Hook

After extraction, `usePersistFeatureLayout.ts` becomes thinner:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { StoreApi, UseBoundStore } from 'zustand'

import type { UsePersistFeatureLayout } from '@/types'

import { migrateLayoutValue } from '@/utils'

export const usePersistFeatureLayout: UseBoundStore<StoreApi<UsePersistFeatureLayout>> =
  create<UsePersistFeatureLayout>()(
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
            return { ...state, value: migrateLayoutValue(state.value) }
          }
          return persistedState as UsePersistFeatureLayout
        },
        name: 'feature_layout',
        version: 1,
      },
    ),
  )
```

### CRITICAL: Test Strategy

**Create `src/utils/dashboard.spec.ts`:**

```typescript
import { describe, expect, it } from 'vitest'

import { isValidLayoutValue, migrateLayoutValue } from '@/utils/dashboard'

describe('dashboard utilities', () => {
  describe('migrateLayoutValue', () => {
    // Old feature keys → registry keys
    it('should migrate all old feature keys to registry keys', () => {
      const old = {
        0: 'IMAGE_CONVERTOR',
        1: 'UNIX_TIMESTAMP',
        2: 'BASE64_ENCODER',
        3: 'COLOR_CONVERTER',
        4: 'IMAGE_RESIZER',
        5: 'PX_TO_REM',
      }
      const result = migrateLayoutValue(old)
      expect(result).toEqual({
        0: 'image-converter',
        1: 'unix-timestamp',
        2: 'base64-encoder',
        3: 'color-converter',
        4: 'image-resizer',
        5: 'px-to-rem',
      })
    })

    // Already-migrated keys preserved
    it('should preserve already-migrated registry keys', () => {
      const current = {
        0: 'image-converter',
        1: 'unix-timestamp',
        2: 'base64-encoder',
      }
      expect(migrateLayoutValue(current)).toEqual(current)
    })

    // Unknown keys cleared to null
    it('should clear unknown keys to null', () => {
      const value = { 0: 'UNKNOWN_TOOL', 1: 'does-not-exist' }
      expect(migrateLayoutValue(value)).toEqual({ 0: null, 1: null })
    })

    // Null positions preserved
    it('should preserve null positions', () => {
      const value = { 0: 'image-converter', 1: null, 2: null }
      expect(migrateLayoutValue(value)).toEqual({
        0: 'image-converter',
        1: null,
        2: null,
      })
    })

    // Mixed old/new/unknown/null keys
    it('should handle mixed key types correctly', () => {
      const value = {
        0: 'BASE64_ENCODER',      // old → should migrate
        1: 'color-converter',      // already new → should preserve
        2: 'INVALID_KEY',          // unknown → should clear
        3: null,                   // null → should preserve
      }
      expect(migrateLayoutValue(value)).toEqual({
        0: 'base64-encoder',
        1: 'color-converter',
        2: null,
        3: null,
      })
    })

    // Empty layout
    it('should handle empty layout', () => {
      expect(migrateLayoutValue({})).toEqual({})
    })

    // Partial layout (fewer than 6 positions)
    it('should handle partial layout with fewer than 6 positions', () => {
      const value = { 0: 'COLOR_CONVERTER', 1: 'px-to-rem' }
      expect(migrateLayoutValue(value)).toEqual({
        0: 'color-converter',
        1: 'px-to-rem',
      })
    })
  })

  describe('isValidLayoutValue', () => {
    const validKeys = new Set([
      'base64-encoder',
      'color-converter',
      'image-converter',
      'image-resizer',
      'px-to-rem',
      'unix-timestamp',
    ])

    // Valid default layout
    it('should validate default layout with all 6 tools', () => {
      const value = {
        0: 'image-converter',
        1: 'unix-timestamp',
        2: 'base64-encoder',
        3: 'color-converter',
        4: 'image-resizer',
        5: 'px-to-rem',
      }
      expect(isValidLayoutValue(value, validKeys)).toBe(true)
    })

    // Layout with null positions
    it('should validate layout with null positions', () => {
      const value = { 0: 'color-converter', 1: null, 2: null }
      expect(isValidLayoutValue(value, validKeys)).toBe(true)
    })

    // Layout with unknown tool key
    it('should reject layout with unknown tool key', () => {
      const value = { 0: 'unknown-tool', 1: 'color-converter' }
      expect(isValidLayoutValue(value, validKeys)).toBe(false)
    })

    // Layout with duplicate tool key
    it('should reject layout with duplicate tool key', () => {
      const value = { 0: 'color-converter', 1: 'color-converter' }
      expect(isValidLayoutValue(value, validKeys)).toBe(false)
    })

    // Empty layout
    it('should validate empty layout', () => {
      expect(isValidLayoutValue({}, validKeys)).toBe(true)
    })

    // All nulls
    it('should validate layout with all null positions', () => {
      const value = { 0: null, 1: null, 2: null }
      expect(isValidLayoutValue(value, validKeys)).toBe(true)
    })
  })
})
```

**~13 tests total** covering: migration (7 cases) + validation (6 cases).

**DO NOT test Zustand store behavior or component rendering** — those are integration concerns, not pure function concerns. No DOM/browser mocks per project rules.

### CRITICAL: Home Page Review

**`src/pages/home/index.tsx`** — The home page renders 6 positions in a responsive grid:

- Desktop: 3 columns x 2 rows (each card ~50vh)
- Tablet: 2 columns x 3 rows
- Mobile: 1 column x 6 rows

Each position renders an `AppContainer` that:
1. Reads `usePersistFeatureLayout().value[position]` to get the tool key
2. Looks up `TOOL_REGISTRY_MAP[registryKey]` to get the tool entry
3. Renders the tool's lazy-loaded component inside a `Card`
4. Shows an "Add" button if the position is `null`

The `SelectAppDialog` renders ALL `TOOL_REGISTRY` entries, disabling tools already placed. This means:
- **New tools automatically appear** in the dialog when added to `TOOL_REGISTRY`
- **No changes to the home page** are needed for new tools
- **No changes to the persistence hook** are needed for new tools

### Architecture Compliance

- **No ToolLayout** — ToolLayout was deprecated in story 3-1; this story doesn't modify tool components
- **useToolError not needed** — This story deals with layout persistence, not tool error handling
- **Named exports** — All new utility functions use named exports [Source: project-context.md#Anti-Patterns]
- **`import type` for types** — Required by `verbatimModuleSyntax` [Source: project-context.md#Language-Specific Rules]
- **`type` not `interface`** — oxlint enforced [Source: project-context.md#Language-Specific Rules]
- **`Array<T>` not `T[]`** — oxlint enforced [Source: project-context.md#Language-Specific Rules]
- **100% client-side** — Layout persistence is pure localStorage, zero network requests [Source: architecture.md#NFR9]
- **No `console.log`** — oxlint enforced [Source: project-context.md#Code Quality Rules]
- **Zustand persist middleware** — Standard pattern for cross-session state [Source: architecture.md#State Boundaries]

### Library & Framework Requirements

- **Zustand 5.0.11** — `create<T>()()` pattern with `persist` middleware
- **Zustand `persist` middleware** — Version 1 migration, `name: 'feature_layout'` localStorage key
- **No new dependencies** — This story only extracts and tests existing logic; no new packages needed
- **No drag-and-drop library** — Not in scope for this baseline story

### Project Structure Notes

**Files to CREATE:**
- `src/utils/dashboard.ts` — Pure utility functions: `migrateLayoutValue`, `isValidLayoutValue`
- `src/utils/dashboard.spec.ts` — ~13 regression tests

**Files to MODIFY:**
- `src/hooks/persist/usePersistFeatureLayout.ts` — Refactor: import `migrateLayoutValue` from utils, remove inline logic
- `src/utils/index.ts` — Add barrel export for `dashboard.ts`

**Files NOT to modify:**
- `src/pages/home/index.tsx` — Home page already renders correctly from TOOL_REGISTRY
- `src/constants/tool-registry.ts` — Registry is complete and unchanged
- `src/types/hooks/persist.ts` — Type definition is already correct
- `src/components/common/card/Card.tsx` — Card component is stable
- Any tool components — This story is about layout, not tools

### Previous Story Intelligence (Story 3.6)

From story 3-6 (PX to REM Converter refactor):

- **282 tests passing** — 20 unit + 51 image + 57 color + 19 base64 + 8 CopyButton + 6 useToolError + 101 validation + 20 px-to-rem
- **Build/lint/format all clean** at story 3-6 completion
- **Commit pattern**: `♻️: story 3-6` for refactor stories
- **Utility extraction pattern**: Create pure functions in `src/utils/{domain}.ts`, add barrel export, write co-located tests
- **Code review fixes applied**: base validation gap, helper text conditional rendering, synchronous empty-field clearing
- **Import ordering convention**: External → type-only → internal `@/` (alphabetical within each group)

### Git Intelligence

Recent commits:
```
537bffb ♻️: story 3-6
eeca4d0 ♻️: story 3-5
247ff83 ♻️:  story 3-4
dcbafc9 ♻️: story 3-3
a2a4c19 🐛: search and navigate
162e9c0 ♻️: story 3.2
b0fd290 ♻️: story 3.1
```

**Pattern**: `♻️:` prefix for refactor stories. This story should use `♻️: story 3-7`.

**Story 3-6 changed files (from `git diff HEAD~1 --stat`):**
- `src/components/feature/unit/UnitPxToRem.tsx` — 137 lines changed
- `src/utils/unit.ts` — NEW: 7 lines
- `src/utils/unit.spec.ts` — NEW: 93 lines
- `src/utils/index.ts` — MODIFIED: 1 line
- Sprint status + story file

### Latest Technical Information

**Zustand Persist Middleware (v5.0.11):**
- `persist<T>(config, options)` wraps the store with automatic localStorage sync
- `migrate` callback runs when stored `version` < current `version`
- `version` field enables incremental migrations (0 → 1 → 2...)
- `name` is the localStorage key
- State hydration is synchronous on first render
- No breaking changes or deprecations affecting this implementation

**localStorage:**
- 5-10MB storage limit per origin (browser-dependent)
- Synchronous API, blocking on the main thread
- Data persists until explicitly cleared or storage is full
- No serialization concerns for our data shape (simple Record of strings/nulls)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.7] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#FR30] — Dashboard drag-and-drop customization
- [Source: _bmad-output/planning-artifacts/epics.md#FR31] — Persistent layout preferences
- [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries] — usePersistFeatureLayout: Global, persisted, Home page consumer
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow] — TOOL_REGISTRY → Home page → card grid
- [Source: _bmad-output/project-context.md] — 53 project rules (types, imports, naming, etc.)
- [Source: _bmad-output/implementation-artifacts/3-6-px-to-rem-converter-refactor-spec-and-tests.md] — Previous story patterns (utility extraction, test strategy, barrel exports)
- [Source: src/hooks/persist/usePersistFeatureLayout.ts] — Current implementation with inline migration
- [Source: src/pages/home/index.tsx] — Dashboard layout with AppContainer and SelectAppDialog
- [Source: src/constants/tool-registry.ts] — TOOL_REGISTRY with 6 tools and TOOL_REGISTRY_MAP
- [Source: src/types/hooks/persist.ts] — UsePersistFeatureLayout type
- [Source: src/components/common/card/Card.tsx] — Card component with motion animations

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered.

### Completion Notes List

- Extracted `migrateLayoutValue` and `isValidLayoutValue` from inline hook to `src/utils/dashboard.ts` as pure testable functions
- Refactored `usePersistFeatureLayout.ts` to import `migrateLayoutValue` from utils barrel — hook is now a thin Zustand wrapper
- Added barrel export in `src/utils/index.ts`
- Wrote 17 comprehensive tests (9 migration + 8 validation) covering: old keys, new keys, unknown keys, null positions, mixed states, empty layouts, partial layouts, future tool keys, duplicates, corrupted data, position key validation
- Verified SelectAppDialog renders all TOOL_REGISTRY entries (line 79 of home/index.tsx: `TOOL_REGISTRY.map()`)
- Verified new TOOL_REGISTRY entries require zero changes to persistence or migration
- All 299 tests pass (282 existing + 17 new), 0 regressions
- Lint: 0 errors (3 pre-existing warnings), Format: clean, Build: successful

#### Code Review Fixes Applied (2026-02-14)

- [HIGH] AC5: Added position key validation to `isValidLayoutValue` — now validates keys are non-negative integers via `Object.entries()` + `Number.isInteger()` check
- [MEDIUM] AC4: Added corrupted data test case for `migrateLayoutValue` — tests `undefined`, numeric, and boolean values from tampered localStorage
- [MEDIUM] Added position key validation tests for `isValidLayoutValue` — negative keys and non-integer keys
- [LOW] Replaced `in` operator with `Object.hasOwn()` in `migrateLayoutValue` to prevent prototype chain lookups
- [NOTE] `isValidLayoutValue` is not integrated at runtime (no callers in production code). This is by design — AC5 specifies the utility's behavior, not its integration point. Future stories may integrate it into the persist hook's hydration path.

### Change Log

- 2026-02-14: Extracted dashboard layout migration and validation utilities; added 14 regression tests; refactored persistence hook to use shared utils
- 2026-02-14: Code review fixes — AC5 position key validation, AC4 corrupted data test, `Object.hasOwn()` safety, +3 tests (14→17)

### File List

- `src/utils/dashboard.ts` — NEW: `migrateLayoutValue`, `isValidLayoutValue` pure utility functions
- `src/utils/dashboard.spec.ts` — NEW: 17 tests for migration and validation
- `src/utils/index.ts` — MODIFIED: added barrel export for `dashboard`
- `src/hooks/persist/usePersistFeatureLayout.ts` — MODIFIED: refactored to import `migrateLayoutValue` from `@/utils`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED: story status updated
- `_bmad-output/implementation-artifacts/3-7-dashboard-layout-persistence-baseline.md` — MODIFIED: story file updated
