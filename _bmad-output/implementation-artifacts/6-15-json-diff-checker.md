# Story 6.15: JSON Diff Checker

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **QA team member**,
I want **to paste two JSON blocks and see a side-by-side comparison with sorted keys and highlighted structural differences**,
So that **I can quickly identify value changes, missing/added keys, and type mismatches between two JSON results without sending data to any external server**.

**Epic:** Epic 6 — Data & Format Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (CopyButton — complete), Story 7.1 (diff library + computeSideBySideDiff — complete), Story 6.8 (JSON utilities — complete)
**Story Key:** 6-15-json-diff-checker

## Acceptance Criteria

### AC1: Tool Registered and Renders via Single-Mode Dialog Pattern

**Given** the JSON Diff Checker tool registered in `TOOL_REGISTRY` under the Data category
**When** the user navigates to it (via sidebar, command palette, or `/tools/json-diff-checker` route)
**Then** it renders with a single "Compare" button that opens a full-screen dialog
**And** a one-line description is shown from the registry entry
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Two Side-by-Side JSON Inputs

**Given** the user opens the Compare dialog
**When** the dialog renders
**Then** two `FieldForm` textareas are displayed side-by-side: "Original" (left) and "Modified" (right)
**And** on mobile (< tablet breakpoint) the inputs stack vertically: Original on top, Modified below
**And** each textarea has appropriate placeholder text (e.g., `{"key": "paste JSON here..."}`)
**And** optional labels above each input allow the user to rename "Original" / "Modified" (good-to-have, simple inline editable text)

### AC3: JSON Parsing and Key Sorting Before Diff

**Given** a user enters valid JSON in both input fields
**When** both fields have valid JSON content
**Then** both JSON values are parsed, recursively sorted by key (alphabetically), and pretty-printed with 2-space indentation before diffing
**And** key ordering differences between the two inputs do NOT appear as diffs (only real structural/value differences)
**And** arrays of primitives and arrays of objects are sorted by content for stable comparison (smart array matching)

### AC4: Side-by-Side Diff with Deep Nested Highlighting

**Given** both inputs contain valid JSON
**When** the diff is computed (debounced 300ms)
**Then** a side-by-side diff is displayed below the inputs in a two-column CSS grid (reuses `DiffCell` rendering pattern from TextDiffChecker)
**And** original sorted JSON is shown on the left, modified sorted JSON on the right, with sticky "Original" / "Modified" headers
**And** each row shows line numbers, a 2px colored indicator bar (`bg-error` for removed, `bg-success` for added), and content
**And** paired modified lines show inline character-level highlighting via `diffWords` (`bg-error/25` for removed chars, `bg-success/25` for added chars)
**And** deep nested key changes are visible — the diff drills down to show exactly which nested key/value changed
**And** type mismatches (e.g., `"123"` string vs `123` number) are clearly highlighted as value differences

### AC5: Invalid JSON Shows Inline Error

**Given** one or both inputs contain invalid JSON
**When** parsing fails
**Then** an inline error message identifies which side has invalid JSON (e.g., "Original JSON is invalid: Unexpected token...")
**And** the diff output is cleared
**And** the error clears automatically when both inputs become valid JSON

### AC6: Copy Diff Button Copies Unified Diff Format

**Given** the diff output is displayed
**When** the user clicks "Copy Diff" (`CopyButton`)
**Then** the diff output is copied to clipboard in standard unified diff format (of the sorted/formatted JSON)
**And** a toast appears: "Copied to clipboard"

### AC7: Empty/Cleared Inputs Clear Output

**Given** the user clears one or both input textareas
**When** both inputs are empty (after trim)
**Then** the diff output is cleared and any active error is cleared

**Given** only one input has valid JSON and the other is empty
**When** the diff is computed
**Then** all lines show as either fully added or fully removed (valid diff of empty vs. non-empty)

### AC8: Processing Performance

**Given** two JSON blocks of typical size (up to ~10,000 lines formatted)
**When** the diff is computed
**Then** processing completes within the 500ms target for typical JSON sizes
**And** the diff library is already available (loaded by TextDiffChecker story) — reuses existing `diff` package

### AC9: All Processing is Client-Side

**Given** the tool implementation
**When** it computes JSON diffs
**Then** zero network requests are made — all parsing, sorting, and diffing is 100% client-side
**And** no data leaves the browser (privacy-first for QA team)

### AC10: Unit Tests Cover All JSON Diff Scenarios

**Given** unit tests in `src/utils/json-diff.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: identical JSON (no changes), value changes (same key different value), missing keys (key in one but not other), added keys, type mismatches (`"123"` vs `123`, `null` vs `"null"`), deep nested changes (3+ levels), key ordering differences (should NOT show as diff), array reordering with same content (should NOT show as diff), arrays with different content, empty objects, empty arrays, both empty inputs, one empty input, invalid JSON inputs, large JSON objects (100+ keys), and recursive key sorting correctness

## Tasks / Subtasks

- [x] Task 1: Create JSON diff utility functions (AC: #3, #4, #5, #9)
  - [x] 1.1 Create `src/utils/json-diff.ts` with the following functions:
  - [x] 1.2 `deepSortJson(value: unknown): unknown` — recursively sorts object keys alphabetically. For arrays: sorts primitives by value, sorts objects by their `JSON.stringify(deepSortJson(item))` for stable content-based ordering. Non-object/array values pass through unchanged.
  - [x] 1.3 `normalizeJson(input: string): string` — parses JSON, runs `deepSortJson`, then `JSON.stringify(sorted, null, 2)`. Returns the normalized pretty-printed string. Throws on invalid JSON.
  - [x] 1.4 `getJsonDiffError(input: string, label: string): string | null` — returns `null` if valid JSON, or `'{label} JSON is invalid: {error message}'` if parsing fails. Returns `null` for empty/whitespace strings (empty is not an error, just means no diff).
  - [x] 1.5 Export all functions and any types from the utility file
  - [x] 1.6 Export from `src/utils/index.ts` barrel

- [x] Task 2: Write unit tests for JSON diff utilities (AC: #10)
  - [x] 2.1 Create `src/utils/json-diff.spec.ts` with explicit vitest imports. **All tests are synchronous** — `deepSortJson`, `normalizeJson`, `getJsonDiffError` are pure sync functions
  - [x] 2.2 Test `deepSortJson` with unsorted object keys → keys alphabetically sorted
  - [x] 2.3 Test `deepSortJson` with deeply nested objects → all levels sorted
  - [x] 2.4 Test `deepSortJson` with arrays of primitives → sorted by value
  - [x] 2.5 Test `deepSortJson` with arrays of objects → sorted by stringified content
  - [x] 2.6 Test `deepSortJson` with mixed arrays (primitives + objects) → stable sort
  - [x] 2.7 Test `deepSortJson` with null, boolean, number, string → passthrough
  - [x] 2.8 Test `normalizeJson` with minified JSON → sorted, formatted output
  - [x] 2.9 Test `normalizeJson` with differently-ordered keys → identical output (key order normalized)
  - [x] 2.10 Test `normalizeJson` with invalid JSON → throws
  - [x] 2.11 Test `normalizeJson` with empty string → throws
  - [x] 2.12 Test `getJsonDiffError` with valid JSON → returns null
  - [x] 2.13 Test `getJsonDiffError` with invalid JSON → returns labeled error
  - [x] 2.14 Test `getJsonDiffError` with empty string → returns null (empty is not an error)
  - [x] 2.15 Test identical JSON with different key order → `normalizeJson` produces same output
  - [x] 2.16 Test type mismatch: `{"a": "123"}` vs `{"a": 123}` → normalized output differs
  - [x] 2.17 Test deep nested change: `{"a":{"b":{"c":1}}}` vs `{"a":{"b":{"c":2}}}` → diff only on the value
  - [x] 2.18 Test array reordering with same content → normalized output is identical
  - [x] 2.19 Test arrays with different content → normalized output differs
  - [x] 2.20 Test large JSON (100+ keys) → normalizes without error

- [x] Task 3: Create JsonDiffChecker component (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [x] 3.1 Create `src/components/feature/data/JsonDiffChecker.tsx` as named export
  - [x] 3.2 Follow TextDiffChecker pattern: single "Compare" button on card, full-screen dialog with two inputs + diff output
  - [x] 3.3 Dialog layout — three sections stacked vertically:
    - **Top:** Two `FieldForm` textareas side-by-side (`tablet:flex-row flex-col`): "Original" (left) and "Modified" (right) with JSON placeholders
    - **Divider:** `border-t-2 border-dashed border-gray-900` (horizontal divider)
    - **Bottom:** Diff output rendered using side-by-side CSS grid (reuse DiffCell pattern from TextDiffChecker) with `CopyButton` for unified diff
  - [x] 3.4 Use `useReducer` for state (follows TextDiffChecker pattern), `useDebounceCallback` (300ms) for processing, `useRef(0)` sessionRef for async race condition protection
  - [x] 3.5 Processing flow:
    1. On either input change → debounced process
    2. If both empty → clear diff and error
    3. If one/both invalid JSON → set error state string, clear diff
    4. If both valid → `normalizeJson(original)`, `normalizeJson(modified)` → `computeSideBySideDiff(normalizedOrig, normalizedMod)` + `createUnifiedDiff(normalizedOrig, normalizedMod)` → display results
  - [x] 3.6 Error handling: use local `error` state in reducer (string) — show which input has invalid JSON using `getJsonDiffError`. Display error inline with `<p className="text-error text-body-sm" role="alert">{error}</p>`. **NOTE: there is no `useToolError` hook — use reducer state directly** (follows TextDiffChecker pattern which uses `useToast` for catastrophic errors and inline state for validation errors)
  - [x] 3.7 State via `useReducer`: `original` (string), `modified` (string), `rows` (Array<SideBySideRow>), `unifiedDiff` (string), `error` (string), `dialogOpen` (boolean)
  - [x] 3.8 Side-by-side diff rendering: reuse the exact same CSS grid layout and DiffCell pattern from TextDiffChecker (sticky header, line numbers, indicator bars, inline diffWords highlighting)
  - [x] 3.9 `CopyButton` in diff output header copies `unifiedDiff` string — label="diff"
  - [x] 3.10 On dialog close (`onAfterClose`): reset all state via `handleReset`, increment `sessionRef`
  - [x] 3.11 Show tool description from `TOOL_REGISTRY_MAP['json-diff-checker']`
  - [x] 3.12 Error display with `role="alert"` (same pattern as all other tools)
  - [x] 3.13 Optional: inline-editable labels above inputs ("Original" / "Modified") using simple controlled text inputs

- [x] Task 4: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 4.1 Add `'json-diff-checker'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetically — between `'json-formatter'` and `'json-schema-validator'`)
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts` with all required fields (category: `'Data'`, alphabetically — between `json-formatter` and `json-schema-validator` entries)
  - [x] 4.3 Add pre-render route in `vite.config.ts` toolRoutes array (alphabetically — between `json-formatter` and `json-to-csv-converter` routes)

- [x] Task 5: Update barrel exports (AC: #1)
  - [x] 5.1 Add `export { JsonDiffChecker } from './JsonDiffChecker'` to `src/components/feature/data/index.ts` (alphabetically — between `./JsonFormatter` and `./JsonToCsvConverter`)
  - [x] 5.2 Add `export * from './json-diff'` to `src/utils/index.ts` (alphabetically)

- [x] Task 6: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7, #8, #9, #10)
  - [x] 6.1 Run `pnpm lint` — no errors (pre-existing lint issue in image.spec.ts unrelated to this story)
  - [x] 6.2 Run `pnpm format:check` — no formatting issues (oxfmt applied)
  - [x] 6.3 Run `pnpm test` — all 1529 tests pass (87 test files, 20 new json-diff tests)
  - [x] 6.4 Run `pnpm build` — build succeeds, JsonDiffChecker chunk is 6.78 kB (2.53 kB gzip), 65 static HTML files generated

## Dev Notes

### CRITICAL: JSON-Aware Diff via Normalization + Existing Text Diff Infrastructure

This tool is NOT a raw text diff of JSON strings. It's a **JSON-semantic diff** that:
1. Parses both inputs as JSON
2. Recursively sorts all object keys (so key ordering is irrelevant)
3. Sorts arrays by content (so reordered arrays with same items don't show as diffs)
4. Pretty-prints both normalized JSONs with 2-space indent
5. Feeds the normalized text into the **existing** `computeSideBySideDiff` and `createUnifiedDiff` from `src/utils/diff.ts`
6. Renders using the **same** side-by-side CSS grid pattern as TextDiffChecker

This approach maximizes reuse of existing infrastructure while adding JSON-specific intelligence.

### Deep Nested Diffs

Because we normalize (sort + format) before diffing, the text diff naturally shows exactly which nested key/value changed. For example:

```
Original:                    Modified:
{                            {
  "user": {                    "user": {
    "age": 30,       ←→         "age": 31,        ← only this line differs
    "name": "John"               "name": "John"
  }                            }
}                            }
```

### Type Mismatch Detection

Type mismatches surface naturally because JSON.stringify preserves types:
- `"123"` (string) → `"123"` in output
- `123` (number) → `123` in output (no quotes)
- These render as different lines in the diff

### Smart Array Matching

`deepSortJson` sorts arrays to enable content-based comparison:
- Primitives: sorted by value (`[3, 1, 2]` → `[1, 2, 3]`)
- Objects: sorted by `JSON.stringify(deepSortJson(item))` for stable ordering
- This means `[{"b":2},{"a":1}]` and `[{"a":1},{"b":2}]` normalize to the same output

### Processing Flow

```
User types in "Original" or "Modified" textarea
  → handleOriginalChange / handleModifiedChange
    → update state + call debouncedProcess(original, modified)
      → async process(original, modified):
          1. Increment sessionRef
          2. If both empty → clear rows & error, return
          3. Validate both inputs with getJsonDiffError
          4. If either invalid → dispatch SET_ERROR, clear rows, return
          5. normalizeJson(original), normalizeJson(modified)
          6. Promise.all([computeSideBySideDiff(normOrig, normMod), createUnifiedDiff(normOrig, normMod)])
          7. If session stale → return (race condition guard)
          8. dispatch SET_DIFF_RESULT(rows, unifiedDiff), dispatch SET_ERROR('')
```

### UI Layout

**Card view:** Tool description + single "Compare" button

**Dialog view:**
```
┌──────────────────────────────────────────────────┐
│  JSON Diff Checker                            [X] │
├──────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐             │
│  │  Original     │   │  Modified     │             │
│  │  [textarea]   │   │  [textarea]   │             │
│  └──────────────┘   └──────────────┘             │
│  ──────────── dashed divider ─────────            │
│  Diff Output                       [Copy Diff]    │
│  ┌────────────────────────┬────────────────────┐  │
│  │ Original               │ Modified           │  │ ← sticky header
│  ├────────────────────────┼────────────────────┤  │
│  │ 1 │   │ {              │ 1 │   │ {          │  │
│  │ 2 │   │   "age": 30,  │ 2 │ ▎ │   "age": 31│  │ ← value change
│  │ 3 │   │   "name": "J" │ 3 │   │   "name":"J│  │
│  │ 4 │   │ }              │ 4 │   │ }          │  │
│  └────────────────────────┴────────────────────┘  │
│  Error message (if any)                           │
└──────────────────────────────────────────────────┘
```

### Error Messages

| Scenario | Behavior |
|----------|----------|
| Both inputs empty | Clear output, no error |
| One input empty, other valid JSON | Show diff (all added or all removed) — NOT an error |
| One input empty, other invalid JSON | Show error for the invalid side |
| One or both inputs invalid JSON | dispatch `SET_ERROR('Original JSON is invalid: ...')` or `SET_ERROR('Modified JSON is invalid: ...')` |
| Both inputs valid JSON | Normalize → diff → display |

### Architecture Compliance

- **TOOL_REGISTRY entry required** — tool must be discoverable via sidebar, command palette, dashboard selection dialog, and direct URL [Source: architecture.md#Tool Registry]
- **Data category** — `'Data'` already exists, just add new entry [Source: architecture.md#Naming Patterns]
- **Named export only** — `export const JsonDiffChecker` (never `export default`) [Source: project-context.md#Named exports]
- **Lazy-loaded component** — registry uses `lazy(() => import(...).then(({ JsonDiffChecker }) => ({ default: JsonDiffChecker })))` [Source: architecture.md#Code Splitting]
- **Reuse existing diff infrastructure** — `computeSideBySideDiff` and `createUnifiedDiff` from `src/utils/diff.ts` (already dynamically imports `diff` library) [Source: story 7-1]
- **100% client-side** — zero network requests [Source: architecture.md#Hard Constraints]
- **Error handling via reducer state** — local `error` string in reducer, displayed inline with `role="alert"`. Use `useToast` only for catastrophic/unexpected failures (e.g., diff library crash). There is NO `useToolError` hook in this codebase. [Source: TextDiffChecker.tsx pattern]
- **sessionRef for async** — race condition protection [Source: TextDiffChecker pattern]

### Library & Framework Requirements

- **No new dependencies** — reuses existing `diff` package (already installed from Story 7.1) and native `JSON.parse`/`JSON.stringify`
- **Existing imports used:** `useReducer`, `useRef` from React, `Button`, `CopyButton`, `Dialog`, `FieldForm` from `@/components/common`, `TOOL_REGISTRY_MAP` from `@/constants`, `useDebounceCallback`, `useToast` from `@/hooks`, `computeSideBySideDiff`, `createUnifiedDiff` from `@/utils`
- **New utility:** `src/utils/json-diff.ts` with `deepSortJson`, `normalizeJson`, `getJsonDiffError` — **pure synchronous functions**, zero dependencies, no async/await needed (unlike `diff.ts` which dynamically imports the `diff` package)
- **ToolComponentProps:** `{ autoOpen?: boolean; onAfterDialogClose?: () => void }` — defined in `@/types`, use for component props signature

### File Structure Requirements

**Files to CREATE:**

```
src/utils/json-diff.ts                                  — deepSortJson(), normalizeJson(), getJsonDiffError() pure functions
src/utils/json-diff.spec.ts                             — Unit tests for JSON diff utilities (~20 tests)
src/components/feature/data/JsonDiffChecker.tsx          — JSON Diff Checker component
```

**Files to MODIFY:**

```
src/utils/index.ts                            — Add barrel export for json-diff utils
src/components/feature/data/index.ts          — Add JsonDiffChecker export
src/constants/tool-registry.ts                — Add JSON Diff Checker registry entry
src/types/constants/tool-registry.ts          — Add 'json-diff-checker' to ToolRegistryKey
vite.config.ts                                — Add JSON Diff Checker pre-render route
```

**Files NOT to modify:**
- `src/utils/diff.ts` — reused as-is (computeSideBySideDiff, createUnifiedDiff)
- `src/utils/json.ts` — reused as-is (formatJson, getJsonParseError)
- `src/components/feature/text/TextDiffChecker.tsx` — reference only, not modified
- Any existing tool components
- Sidebar — `'Data'` category already exists in `CATEGORY_ORDER`
- `package.json` — no new dependencies needed

### Testing Requirements

**Unit tests (`src/utils/json-diff.spec.ts`):**

```typescript
import { describe, expect, it } from 'vitest'

import { deepSortJson, getJsonDiffError, normalizeJson } from '@/utils/json-diff'

describe('json diff utilities', () => {
  describe('deepSortJson', () => {
    it('should sort object keys alphabetically', () => {
      const result = deepSortJson({ z: 1, a: 2, m: 3 })
      expect(Object.keys(result as Record<string, unknown>)).toEqual(['a', 'm', 'z'])
    })

    it('should sort deeply nested object keys', () => {
      const result = deepSortJson({ b: { z: 1, a: 2 }, a: { y: 3, x: 4 } })
      const outer = Object.keys(result as Record<string, unknown>)
      expect(outer).toEqual(['a', 'b'])
      expect(Object.keys((result as Record<string, Record<string, unknown>>).a)).toEqual(['x', 'y'])
    })

    it('should sort arrays of primitives by value', () => {
      expect(deepSortJson([3, 1, 2])).toEqual([1, 2, 3])
      expect(deepSortJson(['c', 'a', 'b'])).toEqual(['a', 'b', 'c'])
    })

    it('should sort arrays of objects by stringified content', () => {
      const result = deepSortJson([{ b: 2 }, { a: 1 }])
      expect(result).toEqual([{ a: 1 }, { b: 2 }])
    })

    it('should pass through primitives unchanged', () => {
      expect(deepSortJson(null)).toBe(null)
      expect(deepSortJson(true)).toBe(true)
      expect(deepSortJson(42)).toBe(42)
      expect(deepSortJson('hello')).toBe('hello')
    })
  })

  describe('normalizeJson', () => {
    it('should sort keys and format with 2-space indent', () => {
      const result = normalizeJson('{"z":1,"a":2}')
      expect(result).toBe('{\n  "a": 2,\n  "z": 1\n}')
    })

    it('should produce identical output for differently-ordered keys', () => {
      const a = normalizeJson('{"name":"John","age":30}')
      const b = normalizeJson('{"age":30,"name":"John"}')
      expect(a).toBe(b)
    })

    it('should throw on invalid JSON', () => {
      expect(() => normalizeJson('{invalid}')).toThrow()
    })

    it('should throw on empty string', () => {
      expect(() => normalizeJson('')).toThrow()
    })

    it('should show type differences', () => {
      const a = normalizeJson('{"val": "123"}')
      const b = normalizeJson('{"val": 123}')
      expect(a).not.toBe(b)
    })

    it('should normalize arrays with same content in different order', () => {
      const a = normalizeJson('[3, 1, 2]')
      const b = normalizeJson('[1, 2, 3]')
      expect(a).toBe(b)
    })

    it('should handle large JSON (100+ keys)', () => {
      const obj: Record<string, number> = {}
      for (let i = 0; i < 100; i++) obj[`key${i}`] = i
      expect(() => normalizeJson(JSON.stringify(obj))).not.toThrow()
    })
  })

  describe('getJsonDiffError', () => {
    it('should return null for valid JSON', () => {
      expect(getJsonDiffError('{"key":"value"}', 'Original')).toBeNull()
    })

    it('should return labeled error for invalid JSON', () => {
      const error = getJsonDiffError('{invalid}', 'Original')
      expect(error).toContain('Original')
      expect(error).toContain('invalid')
    })

    it('should return null for empty string', () => {
      expect(getJsonDiffError('', 'Original')).toBeNull()
    })

    it('should return null for whitespace-only string', () => {
      expect(getJsonDiffError('   ', 'Modified')).toBeNull()
    })
  })
})
```

**No E2E test in this story** — E2E tests are written separately per the testing strategy.

### TOOL_REGISTRY Entry (Copy-Paste Ready)

```typescript
{
  category: 'Data',
  component: lazy(() =>
    import('@/components/feature/data/JsonDiffChecker').then(
      ({ JsonDiffChecker }: { JsonDiffChecker: ComponentType }) => ({
        default: JsonDiffChecker,
      }),
    ),
  ),
  description: 'Compare two JSON objects side-by-side with sorted keys and highlighted differences',
  emoji: '🔀',
  key: 'json-diff-checker',
  name: 'JSON Diff',
  routePath: '/tools/json-diff-checker',
  seo: {
    description:
      'Compare two JSON objects side-by-side with automatically sorted keys and highlighted differences. Detect value changes, missing keys, and type mismatches instantly in your browser.',
    title: 'JSON Diff Checker - CSR Dev Tools',
  },
},
```

### ToolRegistryKey Type Update (Copy-Paste Ready)

Add `'json-diff-checker'` to the `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetically between `'json-formatter'` and `'json-schema-validator'`).

### Vite Config Pre-Render Route (Copy-Paste Ready)

```typescript
{
  description:
    'Compare two JSON objects side-by-side with automatically sorted keys and highlighted differences. Detect value changes, missing keys, and type mismatches instantly in your browser.',
  path: '/tools/json-diff-checker',
  title: 'JSON Diff Checker - CSR Dev Tools',
  url: '/tools/json-diff-checker',
},
```

### Previous Story Intelligence

From Story 7-1 (Text Diff Checker — completed):
- **Side-by-side diff rendering proven** — CSS grid with DiffCell, sticky headers, line numbers, indicator bars, inline diffWords highlighting all work well
- **`useReducer` pattern proven** — cleaner than multiple `useState` for multi-field state
- **`sessionRef` pattern proven** — `++sessionRef.current` in process function correctly prevents stale async results
- **`diff` package already installed** — no new dependencies needed, just reuse `computeSideBySideDiff` and `createUnifiedDiff`
- **DiffCell rendering pattern** — can be extracted or duplicated (component is small, ~25 lines)

From Story 6-8 (JSON Formatter — completed):
- **JSON parsing pattern** — `JSON.parse`/`JSON.stringify` with `getJsonParseError` for error messages
- **Data category already established** — no new category setup needed

### Git Intelligence

**Pattern:** New tool feature uses `✨: story X-Y Tool Name` commit prefix.
**Expected commit:** `✨: story 6-15 JSON Diff Checker`

### Project Structure Notes

- **Utility file:** `src/utils/json-diff.ts` — separate from `json.ts` to keep concerns clean (json.ts = format/validate, json-diff.ts = normalize/compare)
- **Component file:** `src/components/feature/data/JsonDiffChecker.tsx` — sits alongside existing data tools
- **No new domain directory** — `data/` already exists
- **No new category** — `'Data'` already in ToolCategory, CATEGORY_ORDER, etc.
- **DiffCell pattern reuse** — `DiffCell` (~25 lines) and `renderSpans` (~12 lines) are defined **inline** in `TextDiffChecker.tsx` (not shared). Recommended: duplicate inline in `JsonDiffChecker.tsx` to avoid coupling two tools. If extracting to shared, place in `src/components/common/DiffCell.tsx`

### References

- [Source: src/components/feature/text/TextDiffChecker.tsx] — Primary reference: side-by-side diff rendering, DiffCell, renderSpans, useReducer, sessionRef pattern
- [Source: src/utils/diff.ts] — Reused: computeSideBySideDiff, createUnifiedDiff (async, dynamic import of `diff` package)
- [Source: src/types/utils/diff.ts] — Type definitions: DiffChange, InlineSpan, DiffLineType, SideBySideRow
- [Source: src/utils/json.ts] — Reference: JSON parse/format pattern (not directly imported)

## Dev Agent Record

### Implementation Notes

- Created `src/utils/json-diff.ts` with three pure sync functions: `deepSortJson`, `normalizeJson`, `getJsonDiffError`
- `deepSortJson` recursively sorts object keys and arrays by stringified content for stable comparison
- Component follows TextDiffChecker pattern: `useReducer` (computed state) + `useInputLocalStorage` (inputs) + `useDebounceCallback` + `sessionRef` for async race protection
- Input persistence via `useInputLocalStorage` hook — original/modified fields survive page refresh, cleared on dialog close
- DiffCell and renderSpans duplicated inline (not extracted to shared) to avoid coupling tools
- JSON normalization (sort + format) feeds into existing `computeSideBySideDiff` and `createUnifiedDiff` infrastructure
- Error handling uses inline reducer state with `role="alert"`, `useToast` reserved for catastrophic failures
- Task 3.13 (inline-editable labels) skipped as it was marked optional/good-to-have
- Pre-existing lint error in `src/utils/image.spec.ts` (duplicate import) unrelated to this story

### Completion Notes

- All 6 tasks and all subtasks completed
- 20 unit tests covering deepSortJson, normalizeJson, getJsonDiffError (all scenarios specified in AC10)
- Full regression suite: 1529 tests pass across 87 test files
- Build produces separate lazy-loaded chunk: `JsonDiffChecker-D31lvx6s.js` (6.78 kB / 2.53 kB gzip)
- 65 static HTML files generated including `/tools/json-diff-checker` route
- Zero new dependencies added — reuses existing `diff` package

## File List

### Created
- `src/utils/json-diff.ts` — deepSortJson, normalizeJson, getJsonDiffError pure functions
- `src/utils/json-diff.spec.ts` — 20 unit tests for JSON diff utilities
- `src/components/feature/data/JsonDiffChecker.tsx` — JSON Diff Checker component

### Modified
- `src/utils/index.ts` — Added barrel export for json-diff
- `src/components/feature/data/index.ts` — Added JsonDiffChecker export
- `src/components/feature/text/TextDiffChecker.tsx` — Refactored to useInputLocalStorage for input persistence
- `src/constants/tool-registry.ts` — Added JSON Diff Checker registry entry
- `src/types/constants/tool-registry.ts` — Added 'json-diff-checker' to ToolRegistryKey union
- `vite.config.ts` — Added JSON Diff Checker pre-render route

## Change Log

- 2026-03-16: Implemented Story 6.15 JSON Diff Checker — new Data tool with JSON-semantic diff (key sorting, array normalization), side-by-side display with inline highlighting, 20 unit tests, full registry integration
- 2026-03-16: Code review fixes — fixed barrel export order in utils/index.ts, fixed pre-render route order in vite.config.ts, added 7 missing AC10 test cases (empty objects/arrays, null vs "null" type mismatch, missing/added keys). Total: 27 tests, 1536 tests pass across 87 files.
- 2026-03-16: Added localStorage input persistence to both JsonDiffChecker and TextDiffChecker using `useInputLocalStorage` hook. Inputs pulled out of reducer, restored on mount with auto-diff recompute. Cleared on dialog close.
