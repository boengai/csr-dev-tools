---
story: 18.5
title: Text Sort & Dedupe
status: done
epic: 18
---

# Story 18.5: Text Sort & Dedupe

Status: done

## Story

As a **user**,
I want **to sort lines alphabetically, numerically, or by length, and optionally remove duplicates and empty lines**,
So that **I can quickly clean up lists, log files, and text data**.

**Epic:** Epic 18 — Developer Productivity Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (CopyButton, FieldForm — complete)
**Story Key:** 18-5-text-sort-dedupe

## Acceptance Criteria

### AC1: Tool Registered and Renders Inline

**Given** the Text Sort & Dedupe tool registered in `TOOL_REGISTRY` under the Text category
**When** the user navigates to it (via sidebar, command palette, or `/tools/text-sort-dedupe` route)
**Then** it renders inline with a textarea input, sort/filter controls, and output area
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Multiple Sort Modes

**Given** the sort mode selector
**When** the user selects a sort mode
**Then** the following modes are available: A→Z (alphabetical ascending), Z→A (alphabetical descending), Length ↑ (shortest first), Length ↓ (longest first), and Numeric (natural number sort)
**And** the default mode is A→Z

### AC3: Live Sorting with Debounce

**Given** text input in the textarea
**When** the user types or changes sort options
**Then** the output updates after a 300ms debounce
**And** each option change triggers a re-process with current state

### AC4: Remove Duplicates Toggle

**Given** the "Dedupe" toggle button
**When** enabled
**Then** duplicate lines are removed (keeps first occurrence)
**And** deduplication happens before sorting

### AC5: Remove Empty Lines Toggle

**Given** the "No Empty" toggle button
**When** enabled
**Then** empty and whitespace-only lines are removed from the output

### AC6: Trim Lines Toggle

**Given** the "Trim" toggle button
**When** enabled
**Then** leading and trailing whitespace is trimmed from each line

### AC7: Line Count Display

**Given** text has been processed
**When** the result is displayed
**Then** a line count summary shows "X → Y lines" (before → after processing)

### AC8: Copy Sorted Output

**Given** sorted/processed output is displayed
**When** the user clicks `CopyButton`
**Then** the processed text is copied to clipboard

### AC9: Numeric Sort with Mixed Content

**Given** the numeric sort mode
**When** input contains both numeric and non-numeric lines
**Then** numeric lines are sorted by parsed value (ascending)
**And** non-numeric lines are sorted alphabetically after numeric lines

### AC10: Unit Tests Cover Sort and Processing Logic

**Given** unit tests in `src/utils/text-sort.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: A→Z sort, Z→A sort, length ascending, length descending, numeric sort, remove duplicates, remove empty lines, trim whitespace, line counts, and numeric sort with non-numeric lines

## Tasks / Subtasks

- [x] Task 1: Create text sort utility functions (AC: #2, #3, #4, #5, #6, #7, #9, #10)
  - [x] 1.1 Create `src/utils/text-sort.ts` with `sortAndProcessText(input: string, options: TextSortOptions): TextSortResult`
  - [x] 1.2 Define `SortMode` type as union `'az' | 'za' | 'length-asc' | 'length-desc' | 'numeric'`
  - [x] 1.3 Define `TextSortOptions` type with `sortMode`, `removeDuplicates`, `removeEmpty`, `trimLines` fields
  - [x] 1.4 Define `DEFAULT_SORT_OPTIONS` constant (A→Z, no dedup, no empty removal, no trim)
  - [x] 1.5 Define `TextSortResult` type with `output`, `lineCountBefore`, `lineCountAfter` fields
  - [x] 1.6 Implement processing pipeline: split lines → trim (optional) → remove empty (optional) → deduplicate (optional) → sort by selected mode
  - [x] 1.7 Implement `localeCompare` for A→Z and Z→A sorts
  - [x] 1.8 Implement length-based sorts using `a.length - b.length`
  - [x] 1.9 Implement numeric sort using `parseFloat` with fallback to `localeCompare` for NaN values (non-numeric lines sorted after numeric)
  - [x] 1.10 Export `sortAndProcessText`, `SortMode`, `TextSortOptions`, `TextSortResult`, `DEFAULT_SORT_OPTIONS`

- [x] Task 2: Write unit tests for text sort utilities (AC: #10)
  - [x] 2.1 Create `src/utils/text-sort.spec.ts`
  - [x] 2.2 Test A→Z sort (cherry, apple, banana → apple, banana, cherry)
  - [x] 2.3 Test Z→A sort (→ cherry, banana, apple)
  - [x] 2.4 Test length ascending sort (bb, aaa, c → c, bb, aaa)
  - [x] 2.5 Test length descending sort (→ aaa, bb, c)
  - [x] 2.6 Test numeric sort (10, 2, 1, 20 → 1, 2, 10, 20)
  - [x] 2.7 Test remove duplicates (a, b, a, c, b → a, b, c)
  - [x] 2.8 Test remove empty lines (a, "", b, "", c → a, b, c)
  - [x] 2.9 Test trim whitespace ("  a  ", "  b  " → "a", "b")
  - [x] 2.10 Test line counts (before: 5, after: 3 with dedup + remove empty)
  - [x] 2.11 Test numeric sort with non-numeric lines (10, hello, 2, world → 2, 10, hello, world)

- [x] Task 3: Create TextSortDedupe component (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [x] 3.1 Create `src/components/feature/text/TextSortDedupe.tsx` as named export
  - [x] 3.2 Render inline layout with tool description from registry
  - [x] 3.3 Add `FieldForm` type="textarea" for input with 8 rows and placeholder
  - [x] 3.4 Add `FieldForm` type="select" for sort mode with 5 options (A→Z, Z→A, Length ↑, Length ↓, Numeric)
  - [x] 3.5 Add three toggle buttons: "Dedupe", "No Empty", "Trim" — using visual toggle pattern (`border-primary bg-primary/20` when active)
  - [x] 3.6 Implement `toggle()` helper that updates state and triggers re-process with correct current values
  - [x] 3.7 Use `useDebounceCallback` with 300ms delay for text input changes
  - [x] 3.8 Re-process immediately when sort mode or toggle options change
  - [x] 3.9 Display line count summary: "X → Y lines"
  - [x] 3.10 Display processed output in `<pre>` block with max-height scroll and `CopyButton`

- [x] Task 4: Add to type system (AC: #1)
  - [x] 4.1 Add `'text-sort-dedupe'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts`

- [x] Task 5: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 5.1 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts` with category `'Text'`, emoji `'🔀'`, lazy-loaded component
  - [x] 5.2 Add pre-render route in `vite.config.ts` toolRoutes array

- [x] Task 6: Create barrel exports (AC: #1)
  - [x] 6.1 Create `src/components/feature/text/index.ts` with `export { TextSortDedupe } from './TextSortDedupe'`
  - [x] 6.2 Add `export * from './text'` to `src/components/feature/index.ts`
  - [x] 6.3 Add `export * from './text-sort'` to `src/utils/index.ts`

- [x] Task 7: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7, #8, #9, #10)
  - [x] 7.1 Run `pnpm lint` — no errors
  - [x] 7.2 Run `pnpm test` — all tests pass (10 new tests)
  - [x] 7.3 Run `pnpm build` — build succeeds, tool chunk is separate

## Dev Notes

### Processing Pattern — Debounced Inline with Toggle Re-triggers

The Text Sort & Dedupe tool combines **debounced text input** with **immediate option changes**:

| Trigger | Method |
|---------|--------|
| Text input change | `useDebounceCallback` 300ms → `process(val, sortMode, dedup, empty, trim)` |
| Sort mode change | Direct call to `process()` with new mode + current state |
| Toggle button click | `toggle()` helper → direct call to `process()` with flipped flag |

The `toggle()` helper is notable — it constructs the correct options object inline to avoid React state batching issues:
```typescript
const toggle = (setter, current, field) => {
  const next = !current
  setter(next)
  const opts = { dedup: removeDuplicates, empty: removeEmpty, trim: trimLines, [field]: next }
  process(input, sortMode, opts.dedup, opts.empty, opts.trim)
}
```

### Processing Pipeline Order

1. Split input by newlines
2. Trim lines (if enabled)
3. Remove empty lines (if enabled)
4. Remove duplicates via `new Set()` (if enabled) — preserves first occurrence order
5. Sort by selected mode

**Order matters:** Trimming before deduplication ensures `"  foo  "` and `"foo"` are treated as duplicates when both trim and dedup are enabled.

### Numeric Sort Strategy

Uses `parseFloat()` with a three-tier comparison:
- Both NaN → `localeCompare` (alphabetical fallback)
- One NaN → NaN sorts last (returns +1 or -1)
- Both numeric → numeric comparison

This ensures mixed content (numbers + text) sorts predictably: numbers first (ascending), then text (alphabetical).

### Previous Story Intelligence

From Story 18-4 (Image Color Picker):
- **Toggle button pattern** confirmed — same visual style used for Dedupe/No Empty/Trim toggles
- **State management for multiple toggles** — each toggle has independent `useState` + coordinated re-processing

From Story 18-2 (Cron Expression Parser):
- **`useDebounceCallback` + direct calls** pattern — debounce for text input, immediate for option changes
- **Inline layout** pattern confirmed for tools with moderate UI complexity

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion.md#Story 18.5] — Story requirements
- [Source: src/utils/text-sort.ts] — Text sort utility implementation
- [Source: src/components/feature/text/TextSortDedupe.tsx] — Component implementation

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no issues encountered during implementation.

### Completion Notes List

- Created `sortAndProcessText()` utility with 5 sort modes, 3 processing options (trim, dedup, remove empty), and line count tracking
- Defined `SortMode`, `TextSortOptions`, `TextSortResult` types and `DEFAULT_SORT_OPTIONS` constant
- Numeric sort handles mixed content gracefully — numbers first, then text alphabetically
- 10 unit tests covering all 5 sort modes, 3 processing options, line counts, and mixed numeric/text sorting
- TextSortDedupe component with inline layout, textarea input, sort mode select, 3 toggle buttons with coordinated re-processing, debounced input, line count display, and output with CopyButton
- Tool registered in TOOL_REGISTRY with lazy-loaded Text category entry

### File List

| Status | File | Description |
|--------|------|-------------|
| Created | `src/utils/text-sort.ts` | SortMode, TextSortOptions, TextSortResult, DEFAULT_SORT_OPTIONS, sortAndProcessText |
| Created | `src/utils/text-sort.spec.ts` | 10 unit tests for text sort utilities |
| Created | `src/components/feature/text/TextSortDedupe.tsx` | Text Sort & Dedupe component with inline layout |
| Created | `src/components/feature/text/index.ts` | Text feature barrel export |
| Modified | `src/types/constants/tool-registry.ts` | Added 'text-sort-dedupe' to ToolRegistryKey |
| Modified | `src/constants/tool-registry.ts` | Added text-sort-dedupe registry entry |
| Modified | `src/components/feature/index.ts` | Added text barrel re-export |
| Modified | `src/utils/index.ts` | Added text-sort barrel re-export |
| Modified | `vite.config.ts` | Added text-sort-dedupe pre-render route |
