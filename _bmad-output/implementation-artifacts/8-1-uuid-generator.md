# Story 8.1: UUID Generator

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to generate UUIDs with a single click or in bulk**,
So that **I can quickly get unique identifiers for my development work**.

**Epic:** Epic 8 — Generator Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (useToolError, CopyButton — complete)
**Story Key:** 8-1-uuid-generator

## Acceptance Criteria

### AC1: Tool Registered and Renders Inline

**Given** the UUID Generator tool registered in `TOOL_REGISTRY` under the Generator category
**When** the user navigates to it (via sidebar, command palette, or `/tools/uuid-generator` route)
**Then** it renders inline with a count input, generate button, and UUID output
**And** a one-line description is shown from the registry entry
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Single UUID Generation

**Given** the tool renders
**When** the component mounts
**Then** one UUID v4 is pre-generated as a smart default so the output is immediately useful
**And** the UUID is displayed in the output region with a `CopyButton`

### AC3: Bulk UUID Generation

**Given** the user selects bulk generation
**When** they specify a count (1-100 via number input) and click "Generate"
**Then** the requested number of UUIDs are displayed, each on its own line with individual `CopyButton`s
**And** a "Copy All" secondary button copies all UUIDs (newline-separated)

### AC4: UUID v4 Format Validation

**Given** the tool generates UUIDs
**When** any UUID is generated
**Then** it matches the UUID v4 format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx` where y is `[89ab]`
**And** generation uses `crypto.randomUUID()` (Web Crypto API) — zero network requests

### AC5: Count Input Validation

**Given** the count input field
**When** the user enters a value outside 1-100
**Then** the count is clamped to the valid range (min 1, max 100)
**And** the "Generate" button remains functional

### AC6: Empty State Behavior

**Given** the tool renders
**When** the pre-generated UUID is displayed
**Then** the count input defaults to 1
**And** the output region shows the single pre-generated UUID immediately

### AC7: Unit Tests Cover All UUID Scenarios

**Given** unit tests in `src/utils/uuid.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: UUID v4 format validation, uniqueness across bulk generation, bulk count limits, single generation, and edge cases

## Tasks / Subtasks

- [x] Task 1: Add 'Generator' category to type system and sidebar (AC: #1)
  - [x] 1.1 Add `'Generator'` to `ToolCategory` union type in `src/types/constants/tool-registry.ts` (alphabetically between `'Encoding'` and `'Image'`)
  - [x] 1.2 Add `'Generator'` to `CATEGORY_ORDER` array in `src/components/common/sidebar/Sidebar.tsx` (alphabetically between `'Encoding'` and `'Image'`)

- [x] Task 2: Create UUID utility functions (AC: #2, #3, #4, #7)
  - [x] 2.1 Create `src/utils/uuid.ts` with `generateUuid(): string` wrapping `crypto.randomUUID()`
  - [x] 2.2 Add `generateBulkUuids(count: number): Array<string>` that generates `count` UUIDs via repeated `crypto.randomUUID()` calls, clamping count to 1-100
  - [x] 2.3 Export both functions as named exports

- [x] Task 3: Write unit tests for UUID utilities (AC: #7)
  - [x] 3.1 Create `src/utils/uuid.spec.ts` with explicit vitest imports (`import { describe, expect, it } from 'vitest'`)
  - [x] 3.2 Test `generateUuid` returns valid UUID v4 format (`/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`)
  - [x] 3.3 Test `generateUuid` returns different values on consecutive calls (uniqueness)
  - [x] 3.4 Test `generateBulkUuids(1)` returns array of 1 valid UUID
  - [x] 3.5 Test `generateBulkUuids(10)` returns array of 10 unique valid UUIDs
  - [x] 3.6 Test `generateBulkUuids(100)` returns array of 100 UUIDs (max boundary)
  - [x] 3.7 Test `generateBulkUuids(0)` clamps to 1 (minimum boundary)
  - [x] 3.8 Test `generateBulkUuids(150)` clamps to 100 (maximum boundary)
  - [x] 3.9 Test all generated UUIDs in bulk are unique (Set size === array length)

- [x] Task 4: Create UuidGenerator component (AC: #1, #2, #3, #4, #5, #6)
  - [x] 4.1 Create `src/components/feature/generator/UuidGenerator.tsx` as named export
  - [x] 4.2 Render inline (no dialog) — count input, generate button, and output all visible immediately
  - [x] 4.3 Inline layout:
    - **Top:** Count `FieldForm` (type="number", min=1, max=100, default=1) + "Generate" `Button`
    - **Divider:** `border-t-2 border-dashed border-gray-900`
    - **Bottom:** Output region with list of UUIDs, each with individual `CopyButton` + "Copy All" button at top
  - [x] 4.4 Pre-generate one UUID on mount via `useState(() => [generateUuid()])` (smart default)
  - [x] 4.5 "Generate" button click → call `generateBulkUuids(count)` → display results
  - [x] 4.6 Each UUID displayed in monospace font, one per line, with adjacent `CopyButton`
  - [x] 4.7 "Copy All" `CopyButton` at output header copies all UUIDs newline-separated
  - [x] 4.8 Show tool description from `TOOL_REGISTRY_MAP['uuid-generator']`
  - [x] 4.9 No debounce needed — generator uses explicit button click, not on-change

- [x] Task 5: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 5.1 Add `'uuid-generator'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetically after `'url-encoder-decoder'`)
  - [x] 5.2 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts` (alphabetically after `url-encoder-decoder` entry)
  - [x] 5.3 Add pre-render route in `vite.config.ts` toolRoutes array (alphabetically after `url-encoder-decoder`)

- [x] Task 6: Update barrel exports (AC: #1)
  - [x] 6.1 Create `src/components/feature/generator/index.ts` with `export { UuidGenerator } from './UuidGenerator'`
  - [x] 6.2 Add `export * from './generator'` to `src/components/feature/index.ts` (alphabetically between `'./encoding'` and `'./image'`)
  - [x] 6.3 Add `export * from './uuid'` to `src/utils/index.ts` (alphabetically between `'./url'` and `'./validation'`)

- [x] Task 7: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 7.1 Run `pnpm lint` — no errors
  - [x] 7.2 Run `pnpm format:check` — no formatting issues
  - [x] 7.3 Run `pnpm test` — all tests pass (467 existing + ~9 new = ~476)
  - [x] 7.4 Run `pnpm build` — build succeeds, tool chunk is separate, no impact on initial bundle

## Dev Notes

### CRITICAL: First Generator Category Tool — New Category Setup Required

This is the **first tool in the 'Generator' category**. Unlike previous stories that added tools to existing categories (Text, Data, Encoding), this story requires creating the new `'Generator'` category in three places:

1. **`ToolCategory` type** (`src/types/constants/tool-registry.ts`) — add `'Generator'` to union
2. **`CATEGORY_ORDER` array** (`src/components/common/sidebar/Sidebar.tsx`) — add `'Generator'` alphabetically
3. **Feature barrel** (`src/components/feature/index.ts`) — add `'./generator'` export

This is the same pattern that was done when `'Text'` was added in story 7-1.

### Inline Layout with Synchronous Processing — No Debounce

This tool renders **inline** (like `UnitPxToRem` / `TimeUnixTimestamp`) with **synchronous processing** (native `crypto.randomUUID()` — NO dynamic import, NO debounce). Unlike text tools that need large input/output textareas and use dialogs, the UUID Generator's simple inputs fit inline. No `useDebounceCallback` needed.

1. **Synchronous processing** — `crypto.randomUUID()` is native Web Crypto API, zero latency, no async. No `useDebounceCallback`, no `sessionRef`.
2. **Button-click trigger** — "Generate" button calls `generateBulkUuids(count)` directly. This matches the architecture's input processing pattern: "generators on explicit button click."
3. **Pre-generated output** — on mount, auto-generate 1 UUID via `useState(() => [generateUuid()])` so the output is immediately useful.
4. **Bulk output rendering** — map over UUID array, each UUID in its own row with individual `CopyButton`.
5. **"Copy All" button** — `CopyButton` with `value={uuids.join('\n')}` for bulk copy.

### UI Layout (Inline)

```
┌──────────────────────────────────────────────────┐
│  Generate random UUID v4 identifiers...           │
│  Count          [  1  ]   [ Generate ]            │
│  ──────────── dashed divider ──────────           │
│  Generated UUIDs (1)              [Copy All]      │
│  ┌──────────────────────────────────────────────┐ │
│  │ f47ac10b-58cc-4372-a567-0e02b2c3d479  [📋]  │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Processing Flow

```
Component mounts
  → Auto-generate 1 UUID via useState(() => [generateUuid()])
  → Display immediately

User changes count input
  → setCount(clamp(value, 1, 100))
  → No auto-generation (wait for button click)

User clicks "Generate"
  → generateBulkUuids(count)
  → setUuids(result)
  → Display all UUIDs with individual CopyButtons

User clicks "Copy All"
  → CopyButton copies uuids.join('\n')
  → Toast: "Copied to clipboard"
```

### No External Library Decision

**Decision:** Use native `crypto.randomUUID()` — no npm dependency needed.

**Rationale:**
- `crypto.randomUUID()` is a Web Crypto API available in all modern browsers (Chrome 92+, Firefox 95+, Safari 15.4+)
- Returns a proper RFC 4122 v4 UUID string
- Cryptographically secure random number generator under the hood
- Zero bundle cost, zero dynamic import overhead
- Already covered by the project's browser support targets (latest 2 versions of Chrome, Firefox, Safari, Edge)

**Why not a library (e.g., `uuid` npm package)?**
- Native API is sufficient for v4 UUIDs
- No need for v1, v3, v5 UUID variants (out of scope per FR22)
- Zero dependency = zero supply chain risk
- `uuid` package would add ~3.5kB for functionality we get for free

### Existing Utility: `isValidUuid`

`src/utils/validation.ts` already exports `isValidUuid` (line 50-51):
```typescript
export const isValidUuid = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
```

This is used in tests to validate generated UUIDs — no need to create a new validator.

### Architecture Compliance

- **TOOL_REGISTRY entry required** — tool must be discoverable via sidebar, command palette, dashboard selection dialog, and direct URL. Dashboard is a fixed 6-slot favorites grid — new tools do NOT auto-appear there [Source: architecture.md#Tool Registry]
- **NEW `'Generator'` category** — must be added to `ToolCategory` union and `CATEGORY_ORDER` [Source: src/types/constants/tool-registry.ts]
- **Named export only** — `export const UuidGenerator` (never `export default`) [Source: project-context.md#Named exports]
- **Lazy-loaded component** — registry uses `lazy(() => import(...).then(({ UuidGenerator }) => ({ default: UuidGenerator })))` [Source: architecture.md#Code Splitting]
- **100% client-side** — zero network requests for UUID generation [Source: architecture.md#Hard Constraints]
- **useToolError for errors** — even though this tool is unlikely to produce errors, the hook should be initialized for consistency [Source: architecture.md#Error Handling]
- **Generator process pattern** — on explicit button click (NOT on-change debounce) [Source: architecture.md#Process Patterns]

### Library & Framework Requirements

- **No new dependency** — uses native Web Crypto API `crypto.randomUUID()`
- **Existing imports used:** `useState` from React, `Button`, `CopyButton`, `FieldForm` from `@/components/common`, `TOOL_REGISTRY_MAP` from `@/constants`, `useToolError` from `@/hooks`
- **NOT importing:** `useDebounceCallback` (not needed for generators)

### File Structure Requirements

**Files to CREATE:**

```
src/utils/uuid.ts                                     — generateUuid(), generateBulkUuids()
src/utils/uuid.spec.ts                                — Unit tests for UUID utilities (~9 tests)
src/components/feature/generator/UuidGenerator.tsx     — UUID Generator component
src/components/feature/generator/index.ts              — Barrel export for generator domain
```

**Files to MODIFY:**

```
src/types/constants/tool-registry.ts          — Add 'Generator' to ToolCategory, 'uuid-generator' to ToolRegistryKey
src/components/common/sidebar/Sidebar.tsx     — Add 'Generator' to CATEGORY_ORDER
src/constants/tool-registry.ts                — Add uuid-generator registry entry
src/components/feature/index.ts               — Add './generator' barrel export
src/utils/index.ts                            — Add uuid barrel export
vite.config.ts                                — Add uuid-generator pre-render route
```

**Files NOT to modify:**
- Any existing tool components
- `src/hooks/useToolError.ts` — reused as-is
- `src/utils/validation.ts` — `isValidUuid` already exists, used only in tests
- `src/hooks/useDebounceCallback.ts` — not used (generator pattern)

### Testing Requirements

**Unit tests (`src/utils/uuid.spec.ts`):**

```typescript
import { describe, expect, it } from 'vitest'

import { generateBulkUuids, generateUuid } from '@/utils/uuid'

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('uuid utilities', () => {
  describe('generateUuid', () => {
    it('should return a valid UUID v4 format', () => {
      const uuid = generateUuid()
      expect(uuid).toMatch(UUID_V4_REGEX)
    })

    it('should return different values on consecutive calls', () => {
      const uuid1 = generateUuid()
      const uuid2 = generateUuid()
      expect(uuid1).not.toBe(uuid2)
    })
  })

  describe('generateBulkUuids', () => {
    it('should generate 1 UUID when count is 1', () => {
      const uuids = generateBulkUuids(1)
      expect(uuids).toHaveLength(1)
      expect(uuids[0]).toMatch(UUID_V4_REGEX)
    })

    it('should generate the requested number of UUIDs', () => {
      const uuids = generateBulkUuids(10)
      expect(uuids).toHaveLength(10)
      for (const uuid of uuids) {
        expect(uuid).toMatch(UUID_V4_REGEX)
      }
    })

    it('should generate 100 UUIDs at max boundary', () => {
      const uuids = generateBulkUuids(100)
      expect(uuids).toHaveLength(100)
    })

    it('should clamp count to minimum of 1 when given 0', () => {
      const uuids = generateBulkUuids(0)
      expect(uuids).toHaveLength(1)
    })

    it('should clamp count to maximum of 100 when exceeding limit', () => {
      const uuids = generateBulkUuids(150)
      expect(uuids).toHaveLength(100)
    })

    it('should generate all unique UUIDs in bulk', () => {
      const uuids = generateBulkUuids(50)
      const uniqueSet = new Set(uuids)
      expect(uniqueSet.size).toBe(uuids.length)
    })
  })
})
```

**No E2E test in this story** — E2E tests are written separately per the testing strategy. Unit tests cover the core UUID generation logic.

### TOOL_REGISTRY Entry (Copy-Paste Ready)

```typescript
{
  category: 'Generator',
  component: lazy(() =>
    import('@/components/feature/generator/UuidGenerator').then(
      ({ UuidGenerator }: { UuidGenerator: ComponentType }) => ({
        default: UuidGenerator,
      }),
    ),
  ),
  description: 'Generate random UUID v4 identifiers, single or in bulk',
  emoji: '🆔',
  key: 'uuid-generator',
  name: 'UUID Generator',
  routePath: '/tools/uuid-generator',
  seo: {
    description:
      'Generate random UUID v4 identifiers online. Create single or bulk unique IDs instantly in your browser with one click.',
    title: 'UUID Generator - CSR Dev Tools',
  },
}
```

### ToolCategory Type Update (Copy-Paste Ready)

```typescript
export type ToolCategory = 'Color' | 'Data' | 'Encoding' | 'Generator' | 'Image' | 'Text' | 'Time' | 'Unit'
```

### ToolRegistryKey Type Update (Copy-Paste Ready)

```typescript
export type ToolRegistryKey =
  | 'base64-encoder'
  | 'color-converter'
  | 'image-converter'
  | 'image-resizer'
  | 'json-formatter'
  | 'json-to-csv-converter'
  | 'json-to-yaml-converter'
  | 'jwt-decoder'
  | 'px-to-rem'
  | 'regex-tester'
  | 'text-diff-checker'
  | 'unix-timestamp'
  | 'url-encoder-decoder'
  | 'uuid-generator'
```

### Sidebar CATEGORY_ORDER Update (Copy-Paste Ready)

```typescript
const CATEGORY_ORDER: Array<ToolCategory> = ['Color', 'Data', 'Encoding', 'Generator', 'Image', 'Text', 'Time', 'Unit']
```

### Vite Config Pre-Render Route (Copy-Paste Ready)

```typescript
{
  description:
    'Generate random UUID v4 identifiers online. Create single or bulk unique IDs instantly in your browser with one click.',
  path: '/tools/uuid-generator',
  title: 'UUID Generator - CSR Dev Tools',
  url: '/tools/uuid-generator',
},
```

### Generator Barrel Export (Copy-Paste Ready)

```typescript
// src/components/feature/generator/index.ts
export { UuidGenerator } from './UuidGenerator'
```

### Feature Barrel Update (Copy-Paste Ready)

```typescript
export * from './color'
export * from './data'
export * from './encoding'
export * from './generator'
export * from './image'
export * from './text'
export * from './time'
export * from './unit'
```

### Utils Barrel Update (Copy-Paste Ready)

Add between `'./url'` and `'./validation'`:
```typescript
export * from './uuid'
```

### Previous Story Intelligence

From Story 7-2 (Regex Tester — most recent completed story):
- **Single-mode dialog pattern proven** — one button on card, opens full-screen dialog with `Dialog` component, `size="screen"`, `onAfterClose` for cleanup
- **Synchronous processing proven** — native API (RegExp) with no dynamic import, no sessionRef, no async. UUID Generator follows the same synchronous pattern.
- **Ghost/outline button variant standardized** — card buttons use `variant="default"`
- **467 tests exist** — expect ~476 after adding UUID tests (~9 new)
- **Commit prefix:** Use `✨: story 8-1 UUID Generator`

From Story 7-1 (Text Diff Checker — new category setup reference):
- **New category setup pattern** — when 'Text' category was added: updated ToolCategory type, added to CATEGORY_ORDER, created feature barrel. UUID Generator follows the same pattern for 'Generator' category.

### Git Intelligence

Recent commits analyzed:
```
03a11da 🔄: epic 7 retrospective
3a16012 ✨: story 7-2 Regex Tester with live match highlighting
bd8da26 🐛: loading center
a0f73b0 ✨: story 7-1 Text Diff Checker with side-by-side view
bfb5153 🔄: epic 6 retrospective
```

**Pattern:** New tool feature uses `✨: story X-Y Tool Name` commit prefix.
**Files in typical story:** utility function, utility tests, tool component, barrel exports, registry entry, types, vite.config.ts.
**Simpler than text tools:** No debounce needed, no dynamic import, no async processing, no complex output rendering.

### Project Structure Notes

- **New domain directory:** `src/components/feature/generator/` — must be created (first Generator tool)
- **New category:** `'Generator'` must be added to ToolCategory union, CATEGORY_ORDER, and feature barrel
- **No type file needed** — component has no custom props (follows JsonFormatter, RegexTester patterns)
- **UUID types not needed** — utility functions are simple enough (string in, string/array out) that separate type definitions aren't warranted
- **Existing validation** — `isValidUuid` already in `src/utils/validation.ts` with 11 test cases in `src/utils/validation.spec.ts`

### Error Messages

| Scenario | Behavior |
|----------|----------|
| Component mounts | Pre-generate 1 UUID, display immediately, no error |
| User clicks Generate | Generate UUIDs, display results, no error |
| Count input empty | Default to 1 (no error) |
| Count < 1 | Clamp to 1 (no error) |
| Count > 100 | Clamp to 100 (no error) |

Note: This tool has minimal error potential since `crypto.randomUUID()` cannot fail under normal conditions. The `useToolError` hook is initialized for architectural consistency but is unlikely to be triggered.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 8.1] — Full AC definitions and story requirements
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 8] — Epic objectives and FR coverage (FR22)
- [Source: _bmad-output/planning-artifacts/prd.md] — FR22: Users can generate UUIDs (single or bulk)
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Registry] — Registry entry pattern with all required fields
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — `uuid-generator` key, `Generator` category
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Generators: on explicit button click
- [Source: _bmad-output/planning-artifacts/architecture.md#Hard Constraints] — Zero server-side processing
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Tool component file structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Message Format] — Concise, actionable, with example
- [Source: _bmad-output/project-context.md] — 53 project rules (named exports, type not interface, Array<T>, etc.)
- [Source: src/components/feature/data/JsonFormatter.tsx] — Single-mode dialog pattern + synchronous processing reference
- [Source: src/components/feature/text/RegexTester.tsx] — Synchronous native API processing reference
- [Source: src/utils/validation.ts:50-51] — Existing `isValidUuid` validator
- [Source: src/utils/validation.spec.ts:332-371] — Existing UUID validation test cases (11 tests)
- [Source: src/constants/tool-registry.ts] — Current registry with 13 tools, alphabetical ordering
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey union to update, ToolCategory to extend
- [Source: src/components/common/sidebar/Sidebar.tsx:13] — CATEGORY_ORDER to update with 'Generator'
- [Source: src/hooks/useToolError.ts] — Error handling hook (clearError, error, setError)
- [Source: vite.config.ts] — Pre-render routes pattern
- [Source: _bmad-output/implementation-artifacts/7-2-regex-tester.md] — Previous story: synchronous native API pattern
- [Source: _bmad-output/implementation-artifacts/7-1-text-diff-checker.md] — Previous story: new category setup pattern
- [Source: MDN — crypto.randomUUID()] — Web Crypto API UUID v4 generation
- [Source: RFC 4122] — UUID v4 format specification

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- FieldForm `type="number"` did not support `min`/`max` props — added `min?: number` and `max?: number` to `NumberInputForm` type in `form.ts`. Props flow through via `...props` spread in TextInput.

### Completion Notes List

- Task 1: Added `'Generator'` to `ToolCategory` union and `CATEGORY_ORDER` — first Generator category tool.
- Task 2: Created `src/utils/uuid.ts` with `generateUuid()` and `generateBulkUuids()` using native `crypto.randomUUID()`.
- Task 3: Created 8 unit tests covering UUID v4 format, uniqueness, bulk generation, and boundary clamping (0→1, 150→100).
- Task 4: Built `UuidGenerator` component following single-mode dialog pattern with pre-generated UUID on open, count input with clamping, individual + bulk copy buttons.
- Task 5: Registered `uuid-generator` in `TOOL_REGISTRY`, `ToolRegistryKey` type, and vite pre-render routes.
- Task 6: Created generator barrel export and updated feature/utils barrel files.
- Task 7: All verification gates passed — 0 lint errors, format clean, 475 tests pass, build succeeds with separate 2.16 kB chunk.

### Change Log

- 2026-02-14: Implemented UUID Generator tool (Story 8.1) — new Generator category, uuid utility functions, UuidGenerator component with single-mode dialog pattern, 8 unit tests, full registry integration.
- 2026-02-14: Code review — Fixed TextInput type pass-through (M1), added 3 edge case tests (M2). 478 tests pass. Approved.
- 2026-02-14: Refactored to inline layout — removed Dialog pattern (button→dialog→content) in favor of inline rendering (like UnitPxToRem/TimeUnixTimestamp). Pre-generates UUID on mount via lazy useState initializer. Chunk size reduced from 2.16 kB to 1.78 kB.

### File List

**Created:**
- `src/utils/uuid.ts`
- `src/utils/uuid.spec.ts`
- `src/components/feature/generator/UuidGenerator.tsx`
- `src/components/feature/generator/index.ts`

**Modified:**
- `src/types/components/common/form.ts` — Added min/max props to NumberInputForm type
- `src/types/constants/tool-registry.ts` — Added 'Generator' to ToolCategory, 'uuid-generator' to ToolRegistryKey
- `src/components/common/sidebar/Sidebar.tsx` — Added 'Generator' to CATEGORY_ORDER
- `src/components/common/input/TextInput.tsx` — Fixed input type to pass through actual type prop (was hardcoded to "text")
- `src/constants/tool-registry.ts` — Added uuid-generator registry entry
- `src/components/feature/index.ts` — Added './generator' barrel export
- `src/utils/index.ts` — Added './uuid' barrel export
- `vite.config.ts` — Added uuid-generator pre-render route

## Senior Developer Review (AI)

**Reviewer:** csrteam (Claude Opus 4.6)
**Date:** 2026-02-14
**Outcome:** Approved with fixes applied

### Review Summary

All 7 Acceptance Criteria verified as IMPLEMENTED. All 21 subtasks marked [x] confirmed against code. Git changed files match story File List exactly (0 discrepancies). All verification gates pass: 0 lint errors, format clean, 478 tests pass, build succeeds.

### Findings (2 MEDIUM, 3 LOW)

**M1 [FIXED]: `min`/`max` props on FieldForm inert at HTML level**
`TextInput.tsx` hardcoded `type="text"` on the `<input>` element, making min/max HTML attributes inert for number inputs. Fixed by passing the actual `type` prop through to the input element. This makes FieldForm `type="number"` render a native number input with working min/max, step controls, and mobile numeric keyboard.
- Fix: `src/components/common/input/TextInput.tsx:48` — `type="text"` → `type={type}`

**M2 [FIXED]: Missing edge case tests for `generateBulkUuids`**
AC7 requires edge case coverage. Added 3 tests: negative count (`-1` → length 1), fractional count (`5.7` → length 5), NaN count (`NaN` → length 1).
- Fix: `src/utils/uuid.spec.ts` — 3 new tests added (8 → 11 tests, total 475 → 478)

**L1 [NOT FIXED]: Dead error display JSX** — `useToolError()` initialized but `setError` never called; error display block (lines 90-93) is dead code. Architecturally intentional for consistency.

**L2 [NOT FIXED]: Explicit vitest imports** — `uuid.spec.ts` imports from 'vitest' despite globals:true. Redundant but harmless. Story spec mandated explicit imports.

**L3 [NOT FIXED]: Mobile numeric keyboard** — Resolved by M1 fix. TextInput now renders `type="number"` for number inputs, which triggers numeric keyboards on mobile.
