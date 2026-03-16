# Story 7.1: Text Diff Checker

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to paste two text blocks and see line-by-line differences highlighted**,
So that **I can quickly identify changes between two versions of code or text**.

**Epic:** Epic 7 — Text Analysis Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (useToolError, CopyButton — complete)
**Story Key:** 7-1-text-diff-checker

## Acceptance Criteria

### AC1: Tool Registered and Renders via Single-Mode Dialog Pattern

**Given** the Text Diff Checker tool registered in `TOOL_REGISTRY` under the Text category
**When** the user navigates to it (via sidebar, command palette, or `/tools/text-diff-checker` route)
**Then** it renders with a single "Compare" button that opens a full-screen dialog
**And** a one-line description is shown from the registry entry
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Two Side-by-Side Text Inputs for Original and Modified

**Given** the user opens the Compare dialog
**When** the dialog renders
**Then** two `TextAreaInput` fields are displayed side-by-side: "Original" (left) and "Modified" (right)
**And** on mobile (< tablet breakpoint) the inputs stack vertically: Original on top, Modified below
**And** each textarea has appropriate placeholder text (e.g., "Paste original text here..." / "Paste modified text here...")

### AC3: Side-by-Side Diff with Inline Highlighting

**Given** a user enters text in both input fields
**When** both fields have content
**Then** a side-by-side diff is computed in real-time (debounced 300ms) and displayed below the inputs in a two-column CSS grid
**And** original text is shown on the left, modified text on the right, with sticky "Original" / "Modified" headers
**And** each row shows line numbers, a 2px colored indicator bar (`bg-error` for removed, `bg-success` for added), and content
**And** paired modified lines show inline character-level highlighting via `diffWords` (`bg-error/25` for removed chars, `bg-success/25` for added chars)
**And** removed-only lines show on the left with an empty right cell, added-only lines show on the right with an empty left cell
**And** unchanged lines are shown in default styling on both sides
**And** diff output is displayed in a monospace font, scrollable container

### AC4: Copy Diff Button Copies Unified Diff Format

**Given** the diff output is displayed
**When** the user clicks "Copy Diff" (`CopyButton`)
**Then** the diff output is copied to clipboard in standard unified diff format (as produced by `createPatch`)
**And** a toast appears: "Copied to clipboard"

### AC5: Empty/Cleared Inputs Clear Output

**Given** the user clears one or both input textareas
**When** both inputs are empty (after trim)
**Then** the diff output is cleared
**And** any active error is cleared

**Given** only one input has content and the other is empty
**When** the diff is computed
**Then** all lines show as either fully added or fully removed (valid diff of empty vs. non-empty)

### AC6: Processing Performance

**Given** two text blocks of typical size (up to ~10,000 lines)
**When** the diff is computed
**Then** processing completes within the 500ms target for typical text sizes
**And** the diff library is dynamically imported on first use (does not increase initial bundle)

### AC7: All Processing is Client-Side via diff Library

**Given** the tool implementation
**When** it computes diffs
**Then** zero network requests are made — all diffing uses the `diff` (jsdiff) library 100% client-side
**And** the `diff` package is dynamically imported (code-split) like the `yaml` package pattern
**And** TypeScript types are built-in with `diff` v8+ — no `@types/diff` needed

### AC8: Unit Tests Cover All Diff Scenarios

**Given** unit tests in `src/utils/diff.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: identical texts (no changes), completely different texts, single line additions, single line removals, mixed changes (add + remove + unchanged), empty original (all added), empty modified (all removed), both empty (no diff), multiline texts, Unicode content, large texts (performance), and unified diff format output

## Tasks / Subtasks

- [x] Task 1: Install diff library (AC: #6, #7)
  - [x] 1.1 Run `pnpm add diff` (exact version pinned automatically via .npmrc `save-exact=true`)
  - [x] 1.2 Verify `diff` v8+ is installed (ships with TypeScript types built-in — do NOT install `@types/diff`)
  - [x] 1.3 Verify no increase to initial bundle (dynamic import only)

- [x] Task 2: Create diff utility functions (AC: #3, #4, #5, #7)
  - [x] 2.1 Create `src/utils/diff.ts` with async functions using `await import('diff')` pattern (follows `yaml.ts` exactly)
  - [x] 2.2 `computeLineDiff(original: string, modified: string): Promise<Array<DiffChange>>` — uses `diffLines` from `diff` package, maps result to `Array<DiffChange>` where `DiffChange = { added: boolean, removed: boolean, value: string }`
  - [x] 2.3 `createUnifiedDiff(original: string, modified: string): Promise<string>` — uses `createPatch('text', original, modified, '', '', { context: 3 })` from `diff` package, returns unified diff string
  - [x] 2.4 Both functions handle empty inputs: if both empty, return empty array / empty string. If one is empty, return valid diff (all added or all removed).
  - [x] 2.5 Export `DiffChange` type from the utility file
  - [x] 2.6 Export from `src/utils/index.ts` barrel
  - [x] 2.7 `computeSideBySideDiff(original: string, modified: string): Promise<Array<SideBySideRow>>` — uses `diffLines` for line-level changes, pairs removed/added lines and runs `diffWords` for inline spans
  - [x] 2.8 New types: `InlineSpan`, `DiffLineType`, `SideBySideRow` exported from `diff.ts`

- [x] Task 3: Write unit tests for diff utilities (AC: #8)
  - [x] 3.1 Create `src/utils/diff.spec.ts` following `yaml.spec.ts` async test pattern (explicit vitest imports)
  - [x] 3.2 Test `computeLineDiff` with identical texts → all unchanged
  - [x] 3.3 Test `computeLineDiff` with completely different texts → removed + added
  - [x] 3.4 Test `computeLineDiff` with single line added
  - [x] 3.5 Test `computeLineDiff` with single line removed
  - [x] 3.6 Test `computeLineDiff` with mixed changes (some added, some removed, some unchanged)
  - [x] 3.7 Test `computeLineDiff` with empty original → all lines added
  - [x] 3.8 Test `computeLineDiff` with empty modified → all lines removed
  - [x] 3.9 Test `computeLineDiff` with both empty → empty array
  - [x] 3.10 Test `computeLineDiff` with multiline texts
  - [x] 3.11 Test `computeLineDiff` with Unicode content (emoji, CJK)
  - [x] 3.12 Test `computeLineDiff` with large text (1000+ lines) — completes without error
  - [x] 3.13 Test `createUnifiedDiff` produces unified diff format (contains `---`, `+++`, `@@` markers)
  - [x] 3.14 Test `createUnifiedDiff` with identical texts → minimal/empty patch
  - [x] 3.15 Test `createUnifiedDiff` with added-only changes
  - [x] 3.16 Test `createUnifiedDiff` with removed-only changes
  - [x] 3.17 Test `createUnifiedDiff` with both empty → empty/minimal patch

- [x] Task 4: Create TextDiffChecker component (AC: #1, #2, #3, #4, #5, #6)
  - [x] 4.1 Create `src/components/feature/text/TextDiffChecker.tsx` as named export
  - [x] 4.2 Follow single-mode dialog pattern from `JsonFormatter.tsx`: one "Compare" button on card, opens full-screen dialog
  - [x] 4.3 Dialog layout — three sections stacked vertically:
    - **Top:** Two `FieldForm` textareas side-by-side (`tablet:flex-row flex-col`): "Original" (left) and "Modified" (right) with appropriate labels and placeholders
    - **Divider:** `border-t-2 border-dashed border-gray-900` (horizontal divider)
    - **Bottom:** Diff output rendered as custom JSX (not a textarea) — scrollable container with monospace font, colored line rendering, and `CopyButton` for unified diff
  - [x] 4.4 Use `useToolError` for error state, `useDebounceCallback` (300ms) for processing, `useRef(0)` sessionRef for async race condition protection (follows `JsonToYamlConverter.tsx` async pattern)
  - [x] 4.5 Process function is **async** — dynamically imports `diff` package. Uses `sessionRef` to cancel stale results (identical to YAML pattern)
  - [x] 4.6 State: `original` (string), `modified` (string), `rows` (Array<SideBySideRow>), `unifiedDiff` (string), `dialogOpen` (boolean)
  - [x] 4.7 Debounced process: call `computeSideBySideDiff` and `createUnifiedDiff` when either input changes
  - [x] 4.8 Side-by-side rendering: CSS grid (2 columns) with sticky header, line numbers, 2px indicator bars, and inline `diffWords` character-level highlighting (`bg-error/25` / `bg-success/25`)
  - [x] 4.9 `CopyButton` in diff output header copies `unifiedDiff` string — label="diff"
  - [x] 4.10 On empty inputs (both trimmed empty): clear `diffResult`, `unifiedDiff`, and error
  - [x] 4.11 On dialog close (`onAfterClose`): reset all state via `handleReset`, increment `sessionRef`
  - [x] 4.12 Show tool description from `TOOL_REGISTRY_MAP['text-diff-checker']`
  - [x] 4.13 Error display with `role="alert"` (same pattern as all other tools)
  - [x] 4.14 Create `src/components/feature/text/index.ts` barrel export

- [x] Task 5: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 5.1 Add `'Text'` to `ToolCategory` union in `src/types/constants/tool-registry.ts` (alphabetically between `'Time'` and `'Unit'`)
  - [x] 5.2 Add `'text-diff-checker'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetically between `'px-to-rem'` and `'unix-timestamp'`)
  - [x] 5.3 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts` (alphabetically by key — between `px-to-rem` and `unix-timestamp` entries)
  - [x] 5.4 Add pre-render route in `vite.config.ts` toolRoutes array (alphabetically between `px-to-rem` and `unix-timestamp`)
  - [x] 5.5 Add `'Text'` to `CATEGORY_ORDER` array in `src/components/common/sidebar/Sidebar.tsx` (alphabetically between `'Time'` and `'Unit'`)

- [x] Task 6: Update barrel exports (AC: #1)
  - [x] 6.1 Add `export * from './text'` to `src/components/feature/index.ts` (alphabetically between `'./time'` and `'./unit'`)
  - [x] 6.2 Add `export * from './diff'` to `src/utils/index.ts` (alphabetically between `'./dashboard'` and `'./file'`)

- [x] Task 7: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [x] 7.1 Run `pnpm lint` — no errors
  - [x] 7.2 Run `pnpm format:check` — no formatting issues
  - [x] 7.3 Run `pnpm test` — all tests pass (422 existing + 16 new = 438)
  - [x] 7.4 Run `pnpm build` — build succeeds, tool chunk is separate (3.23 kB), no impact on initial bundle

## Dev Notes

### CRITICAL: Single-Mode Dialog Pattern with Async Processing + Side-by-Side Diff Rendering

This tool uses the **single-mode pattern** from `JsonFormatter.tsx` (one button on card → opens dialog) combined with the **async processing pattern** from `JsonToYamlConverter.tsx` (dynamic import, `sessionRef` for race conditions). **Key difference from data tools**: the output is NOT a textarea — it's a side-by-side CSS grid with inline character-level highlighting.

1. **Async processing with sessionRef** — `diff` library is dynamically imported like `yaml`, so use `sessionRef.current++` to protect against stale results
2. **Two INPUTS, one OUTPUT** — unlike data tools (one input, one output), this has two input textareas (Original, Modified) and a side-by-side diff grid below
3. **Side-by-side diff rendering** — CSS grid (2 columns) with sticky header ("Original" / "Modified"), line numbers, 2px indicator bars, and inline `diffWords` spans. Uses `computeSideBySideDiff` which pairs removed/added lines and runs `diffWords` for character-level highlighting
4. **CopyButton copies unified diff** — not the rendered colored output, but the standard unified diff format from `createPatch`

### UI Layout

**Card view:** Tool description + single "Compare" button (ghost/outline variant per recent standardization)

**Dialog view:**
```
┌──────────────────────────────────────────────────┐
│  Text Diff Checker                            [X] │
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
│  │ 1 │   │ unchanged      │ 1 │   │ unchanged  │  │
│  │ 2 │ ▎ │ removed text   │ 2 │ ▎ │ added text │  │ ← inline spans
│  │   │   │                │ 3 │ ▎ │ added only │  │
│  └────────────────────────┴────────────────────┘  │
│  Error message (if any)                           │
└──────────────────────────────────────────────────┘
```

**Mobile (stacked):**
```
┌────────────────────┐
│ Text Diff       [X] │
├────────────────────┤
│ ┌────────────────┐  │
│ │ Original        │  │
│ │ [textarea]      │  │
│ └────────────────┘  │
│ ┌────────────────┐  │
│ │ Modified        │  │
│ │ [textarea]      │  │
│ └────────────────┘  │
│ ── dashed divider ── │
│ ┌────────────────┐  │
│ │ Diff Output     │  │
│ │ [Copy Diff]     │  │
│ │ + added         │  │
│ │ - removed       │  │
│ └────────────────┘  │
│ Error               │
└────────────────────┘
```

### Diff Library Decision: `diff` (jsdiff) v8+

**Decision:** Use the `diff` npm package (jsdiff) — dynamically imported to avoid initial bundle impact.

**Rationale:**
- Most popular JavaScript diff library (~8,000 dependents on npm)
- Implements Myers' O(ND) difference algorithm — proven, performant
- `diffLines()` provides exactly the line-by-line diff we need
- `createPatch()` generates standard unified diff for the Copy feature
- v8+ ships with built-in TypeScript types — no `@types/diff` needed
- Lightweight (~25KB unpacked), no dependencies of its own
- Well-maintained (active development on GitHub)

**Usage pattern (matches yaml.ts):**
```typescript
const { diffLines, createPatch } = await import('diff')
const changes = diffLines(original, modified)
const patch = createPatch('text', original, modified, '', '', { context: 3 })
```

**Code splitting:** The `diff` package will be in its own chunk, loaded only when the Text Diff Checker dialog is opened. Same pattern as `yaml` package for JSON↔YAML tool.

### Side-by-Side Diff Rendering Approach

`computeSideBySideDiff` produces an array of `SideBySideRow`, each containing left/right line number, content, type, and optional inline spans.

**Algorithm:**
1. `diffLines(original, modified)` for line-level changes
2. Walk changes, tracking left/right line number counters:
   - **Unchanged block**: both sides get the line, both counters increment
   - **Removed block**: accumulate as pending
   - **Added block**: pair with pending removed lines. For each pair, run `diffWords(oldLine, newLine)` to get inline spans. Excess unpaired lines become standalone rows
3. Flush any remaining pending removed lines at end

**Rendering:**
- CSS grid `grid-cols-2` with `grid-cols-subgrid` per row so both sides align
- Each cell: line number (gray, `select-none`, right-aligned) + 2px indicator bar + content with optional inline spans
- Line bg: `bg-error/10` (removed), `bg-success/10` (added)
- Inline highlight: `bg-error/25` (removed chars), `bg-success/25` (added chars) — more opaque than line bg
- Text: `text-error` (removed), `text-success` (added), `text-gray-400` (unchanged)
- Sticky header with "Original" / "Modified" labels
- Both sides scroll together naturally (single grid container)

### Processing Flow

```
User types in "Original" or "Modified" textarea
  → handleOriginalChange / handleModifiedChange
    → update state + call debouncedProcess(original, modified)
      → async process(original, modified):
          1. Increment sessionRef
          2. If both empty → clear rows & error, return
          3. Promise.all([computeSideBySideDiff(orig, mod), createUnifiedDiff(orig, mod)])
          4. If session stale → return (race condition guard)
          5. setRows(sideBySide)
          6. setUnifiedDiff(patch)
          7. clearError()
```

### Error Messages

| Scenario | Behavior |
|----------|----------|
| Both inputs empty | Clear output, no error |
| One input empty | Show diff (all added or all removed) — NOT an error |
| Diff library fails to load | `setError('Unable to compute diff')` |
| Both have content | Compute and display diff |

Note: Unlike data conversion tools, the diff checker has almost no error states. Any text input is valid — there's no "invalid format" scenario. The only error would be a catastrophic failure loading the diff library.

### Architecture Compliance

- **TOOL_REGISTRY entry required** — tool must be discoverable via sidebar, command palette, dashboard selection dialog, and direct URL. Dashboard is a fixed 6-slot favorites grid — new tools do NOT auto-appear there [Source: architecture.md#Tool Registry]
- **New `'Text'` category** — must be added to `ToolCategory` union AND `CATEGORY_ORDER` array in Sidebar [Source: src/types/constants/tool-registry.ts, src/components/common/sidebar/Sidebar.tsx]
- **Named export only** — `export const TextDiffChecker` (never `export default`) [Source: project-context.md#Named exports]
- **Lazy-loaded component** — registry uses `lazy(() => import(...).then(({ TextDiffChecker }) => ({ default: TextDiffChecker })))` [Source: architecture.md#Code Splitting]
- **Dynamic import for diff library** — `await import('diff')` inside utility functions, same as `await import('yaml')` [Source: architecture.md#NFR8, yaml.ts pattern]
- **100% client-side** — zero network requests for diffing [Source: architecture.md#Hard Constraints]
- **useToolError for errors** — never implement custom error state [Source: architecture.md#Error Handling]
- **sessionRef for async** — race condition protection for dynamically imported library [Source: JsonToYamlConverter.tsx pattern]

### Library & Framework Requirements

- **New dependency:** `diff` v8+ (install via `pnpm add diff`) — TypeScript types built-in, no `@types/diff`
- **Existing imports used:** `useState`, `useRef` from React, `Button`, `CopyButton`, `Dialog`, `FieldForm` from `@/components/common`, `TOOL_REGISTRY_MAP` from `@/constants`, `useDebounceCallback`, `useToolError` from `@/hooks`
- **Dynamic import in utility:** `await import('diff')` — loaded on first use, chunked separately by Vite

### File Structure Requirements

**Files to CREATE:**

```
src/utils/diff.ts                                     — computeLineDiff(), createUnifiedDiff() async functions + DiffChange type
src/utils/diff.spec.ts                                — Unit tests for diff utilities (~17 tests)
src/components/feature/text/TextDiffChecker.tsx        — Text Diff Checker component
src/components/feature/text/index.ts                   — Barrel export for text domain
```

**Files to MODIFY:**

```
package.json                                  — Add 'diff' dependency (via pnpm add)
pnpm-lock.yaml                               — Auto-updated by pnpm add
src/utils/index.ts                            — Add barrel export for diff utils
src/components/feature/index.ts               — Add barrel export for text domain
src/constants/tool-registry.ts                — Add Text Diff Checker registry entry
src/types/constants/tool-registry.ts          — Add 'Text' to ToolCategory, 'text-diff-checker' to ToolRegistryKey
vite.config.ts                                — Add Text Diff Checker pre-render route
src/components/common/sidebar/Sidebar.tsx     — Add 'Text' to CATEGORY_ORDER array
```

**Files NOT to modify:**
- Any existing tool components
- `src/types/constants/tool-registry.ts` ToolRegistryEntry — no structural changes needed
- `src/hooks/useToolError.ts` — reused as-is
- `src/hooks/useDebounceCallback.ts` — reused as-is
- Any existing utility files

### Testing Requirements

**Unit tests (`src/utils/diff.spec.ts`):**

```typescript
import { describe, expect, it } from 'vitest'

import { computeLineDiff, createUnifiedDiff } from '@/utils/diff'

describe('diff utilities', () => {
  describe('computeLineDiff', () => {
    it('should return unchanged for identical texts', async () => {
      const result = await computeLineDiff('hello\nworld', 'hello\nworld')
      expect(result).toHaveLength(1)
      expect(result[0].added).toBe(false)
      expect(result[0].removed).toBe(false)
      expect(result[0].value).toContain('hello')
    })

    it('should detect added lines', async () => {
      const result = await computeLineDiff('line1\n', 'line1\nline2\n')
      const added = result.filter((c) => c.added)
      expect(added.length).toBeGreaterThan(0)
      expect(added[0].value).toContain('line2')
    })

    it('should detect removed lines', async () => {
      const result = await computeLineDiff('line1\nline2\n', 'line1\n')
      const removed = result.filter((c) => c.removed)
      expect(removed.length).toBeGreaterThan(0)
      expect(removed[0].value).toContain('line2')
    })

    it('should detect mixed changes', async () => {
      const result = await computeLineDiff('a\nb\nc\n', 'a\nx\nc\n')
      expect(result.some((c) => c.added)).toBe(true)
      expect(result.some((c) => c.removed)).toBe(true)
      expect(result.some((c) => !c.added && !c.removed)).toBe(true)
    })

    it('should handle empty original (all added)', async () => {
      const result = await computeLineDiff('', 'new line\n')
      expect(result.some((c) => c.added)).toBe(true)
      expect(result.every((c) => !c.removed)).toBe(true)
    })

    it('should handle empty modified (all removed)', async () => {
      const result = await computeLineDiff('old line\n', '')
      expect(result.some((c) => c.removed)).toBe(true)
      expect(result.every((c) => !c.added)).toBe(true)
    })

    it('should handle both empty', async () => {
      const result = await computeLineDiff('', '')
      expect(result).toHaveLength(0)
    })

    it('should handle completely different texts', async () => {
      const result = await computeLineDiff('alpha\nbeta\n', 'gamma\ndelta\n')
      expect(result.some((c) => c.removed)).toBe(true)
      expect(result.some((c) => c.added)).toBe(true)
    })

    it('should handle multiline texts with partial changes', async () => {
      const original = 'line1\nline2\nline3\nline4\n'
      const modified = 'line1\nmodified\nline3\nline4\nnew line\n'
      const result = await computeLineDiff(original, modified)
      expect(result.length).toBeGreaterThan(1)
    })

    it('should handle Unicode content', async () => {
      const result = await computeLineDiff('hello 🌍\n', 'hello 🌍\nnew 日本語\n')
      const added = result.filter((c) => c.added)
      expect(added.length).toBeGreaterThan(0)
      expect(added[0].value).toContain('日本語')
    })

    it('should handle large texts without error', async () => {
      const lines = Array.from({ length: 1000 }, (_, i) => `line ${i}`)
      const original = lines.join('\n') + '\n'
      const modified = lines.map((l, i) => (i === 500 ? 'changed' : l)).join('\n') + '\n'
      const result = await computeLineDiff(original, modified)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('createUnifiedDiff', () => {
    it('should produce unified diff format with markers', async () => {
      const result = await createUnifiedDiff('hello\n', 'world\n')
      expect(result).toContain('---')
      expect(result).toContain('+++')
      expect(result).toContain('@@')
    })

    it('should produce minimal output for identical texts', async () => {
      const result = await createUnifiedDiff('same\n', 'same\n')
      // Identical texts produce a patch with no hunks
      expect(result).not.toContain('@@')
    })

    it('should show added lines with + prefix', async () => {
      const result = await createUnifiedDiff('a\n', 'a\nb\n')
      expect(result).toContain('+b')
    })

    it('should show removed lines with - prefix', async () => {
      const result = await createUnifiedDiff('a\nb\n', 'a\n')
      expect(result).toContain('-b')
    })

    it('should handle both empty inputs', async () => {
      const result = await createUnifiedDiff('', '')
      expect(result).not.toContain('@@')
    })
  })
})
```

**No E2E test in this story** — E2E tests are written separately per the testing strategy. Unit tests cover the core diff logic.

### TOOL_REGISTRY Entry (Copy-Paste Ready)

```typescript
{
  category: 'Text',
  component: lazy(() =>
    import('@/components/feature/text/TextDiffChecker').then(
      ({ TextDiffChecker }: { TextDiffChecker: ComponentType }) => ({
        default: TextDiffChecker,
      }),
    ),
  ),
  description: 'Compare two text blocks and see line-by-line differences highlighted',
  emoji: '📝',
  key: 'text-diff-checker',
  name: 'Text Diff',
  routePath: '/tools/text-diff-checker',
  seo: {
    description:
      'Compare two text blocks and see line-by-line differences highlighted online. Spot changes between versions of code or text instantly in your browser.',
    title: 'Text Diff Checker - CSR Dev Tools',
  },
}
```

### ToolRegistryKey Type Update (Copy-Paste Ready)

```typescript
export type ToolCategory = 'Color' | 'Data' | 'Encoding' | 'Image' | 'Text' | 'Time' | 'Unit'

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
  | 'text-diff-checker'
  | 'unix-timestamp'
  | 'url-encoder-decoder'
```

### Vite Config Pre-Render Route (Copy-Paste Ready)

```typescript
{
  description:
    'Compare two text blocks and see line-by-line differences highlighted online. Spot changes between versions of code or text instantly in your browser.',
  path: '/tools/text-diff-checker',
  title: 'Text Diff Checker - CSR Dev Tools',
  url: '/tools/text-diff-checker',
},
```

### Sidebar CATEGORY_ORDER Update (Copy-Paste Ready)

```typescript
const CATEGORY_ORDER: Array<ToolCategory> = ['Color', 'Data', 'Encoding', 'Image', 'Text', 'Time', 'Unit']
```

### Previous Story Intelligence

From Story 6-3 (JSON to CSV Converter — previous epic, completed):
- **Two-mode dialog pattern proven** — but this story uses SINGLE-mode (simpler)
- **Async pattern from 6-2 proven** — `sessionRef` + dynamic import works cleanly for YAML; same pattern applies to `diff`
- **Build verified** — test files use explicit vitest imports (`import { describe, expect, it } from 'vitest'`) — DO THIS from the start
- **Error message pattern** — specific, actionable, with example of valid input. Less relevant here since diff has almost no error states.
- **422 tests exist** — expect ~439 after adding diff tests (~17 new)
- **Ghost/outline button variant standardized** — card buttons use `variant="default"` (not `"ghost"` or `"outline"`)
- **Commit prefix:** Use `✨: story 7-1 Text Diff Checker`

### Git Intelligence

Recent commits analyzed:
```
bfb5153 🔄: epic 6 retrospective
20d98d4 💄: standardize tool card buttons to ghost/outline variant
288d0e3 📝: miss commit
5215e73 ✨: story 6-3 JSON to CSV Converter
016f81a ✨: story 6-2 JSON to YAML Converter
dbbf974 ✨: story 6-1 JSON Formatter/Validator
```

**Pattern:** New tool feature uses `✨: story X-Y Tool Name` commit prefix.
**Files in typical story:** utility function, utility tests, tool component, barrel exports, registry entry, types, vite.config.ts, sidebar update.
**New in this story:** `pnpm add diff` (new dependency — first since `yaml` in story 6-2). Also first tool in a new domain directory (`text/`) and new category (`'Text'`).

### Project Structure Notes

- **New domain directory:** `src/components/feature/text/` must be created — first tool in the Text category
- **New category:** `'Text'` must be added in 3 places: `ToolCategory` type, `CATEGORY_ORDER` sidebar array, and registry entry
- **Feature barrel needs update:** `src/components/feature/index.ts` must add `export * from './text'`
- **Utils barrel needs update:** `src/utils/index.ts` must add `export * from './diff'`
- **No type file needed** — component has no custom props (follows JsonFormatter, JsonToCsvConverter patterns)
- **DiffChange type** — defined and exported from `src/utils/diff.ts` (co-located with utility, not in `src/types/`)
- **New utility file:** `src/utils/diff.ts` — parallel to `src/utils/yaml.ts` (async pattern)
- **Tests co-located:** `src/utils/diff.spec.ts` — parallel to `src/utils/yaml.spec.ts` (async test pattern)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.1] — Full AC definitions and story requirements
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 7] — Epic objectives and FR coverage (FR20)
- [Source: _bmad-output/planning-artifacts/prd.md#Text Tools] — FR20: Compare two text inputs with line-by-line differences highlighted
- [Source: _bmad-output/planning-artifacts/prd.md#Performance] — NFR1: Processing under 100ms (text tools), FR4: Results within 500ms
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Registry] — Registry entry pattern with all required fields
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — `text-diff-checker` key, `Text` category
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Text conversion: on input change, 300ms debounce
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Message Format] — Concise, actionable, with example
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Tool component file structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Hard Constraints] — Zero server-side processing
- [Source: _bmad-output/project-context.md] — 53 project rules (named exports, type not interface, etc.)
- [Source: src/components/feature/data/JsonFormatter.tsx] — Single-mode dialog pattern reference
- [Source: src/components/feature/data/JsonToYamlConverter.tsx] — Async processing with sessionRef pattern reference
- [Source: src/utils/yaml.ts] — Async utility with dynamic import pattern reference
- [Source: src/utils/yaml.spec.ts] — Async test pattern reference
- [Source: src/constants/tool-registry.ts] — Current registry with 11 tools, alphabetical ordering
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey and ToolCategory unions to update
- [Source: src/components/common/sidebar/Sidebar.tsx:13] — CATEGORY_ORDER array to update
- [Source: src/hooks/useToolError.ts] — Error handling hook
- [Source: src/hooks/useDebounceCallback.ts] — Debounce utility (300ms)
- [Source: vite.config.ts] — Pre-render routes pattern
- [Source: _bmad-output/implementation-artifacts/6-3-json-to-csv-converter.md] — Previous story learnings
- [Source: https://www.npmjs.com/package/diff] — diff (jsdiff) npm package, v8.0.3
- [Source: https://github.com/kpdecker/jsdiff] — jsdiff GitHub repository

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

No issues encountered. All tasks completed in a single pass.

### Completion Notes List

- Installed `diff` v8.0.3 — TypeScript types built-in, no `@types/diff` needed
- Created `src/utils/diff.ts` with `computeLineDiff()`, `createUnifiedDiff()`, and `computeSideBySideDiff()` async functions using `await import('diff')` pattern
- New types: `InlineSpan`, `DiffLineType`, `SideBySideRow` for side-by-side diff computation
- Created 26 unit tests in `src/utils/diff.spec.ts` covering: identical texts, completely different texts, added/removed/mixed lines, empty inputs (both/original/modified), multiline, Unicode, large text (1000+ lines), unified diff format output, and side-by-side diff (paired modified lines with inline spans, unequal pairing, line number continuity)
- Created `TextDiffChecker` component following single-mode dialog pattern (JsonFormatter) with async sessionRef pattern (JsonToYamlConverter)
- Side-by-side CSS grid rendering with sticky header, line numbers, 2px indicator bars, and inline `diffWords` character-level highlighting
- CopyButton copies unified diff format via `createPatch`
- Registered tool in TOOL_REGISTRY with new `'Text'` category
- Added pre-render route in vite.config.ts
- All 448 tests pass, lint clean, format clean, build succeeds
- TextDiffChecker chunk: 5.70 kB (code-split, no initial bundle impact)

### Senior Developer Review (AI)

**Reviewer:** csrteam on 2026-02-14
**Outcome:** Approved with fixes applied

**Findings (6 total: 1 High, 3 Medium, 2 Low):**

- [x] [AI-Review][HIGH] Diff highlighting used hardcoded `bg-emerald-500/10`/`bg-red-500/10` instead of theme tokens `bg-success/10 text-success` / `bg-error/10 text-error` (AC3 non-compliance) → **FIXED**
- [x] [AI-Review][MEDIUM] Layout competition between input section (`size-full grow`) and diff output (`flex-1`) — compressed diff output on shorter viewports → **FIXED**: changed input section to `min-h-0 flex-1`
- [x] [AI-Review][MEDIUM] Diff output container lacked accessibility attributes (NFR14-NFR18) → **FIXED**: added `role="region" aria-label="Diff output"`
- [ ] [AI-Review][MEDIUM] `sessionRef` increment pattern in `process` deviates from `JsonToYamlConverter` reference → **KEPT AS-IS**: on analysis, the TextDiffChecker pattern (`++sessionRef.current` in process) is actually superior — it correctly prevents stale async results during rapid input, while the reference pattern can allow stale results to update state
- [ ] [AI-Review][LOW] `DiffChange` type co-located in `src/utils/diff.ts` instead of `src/types/utils/diff.ts` per convention
- [x] [AI-Review][LOW] Missing trailing newline edge case test → **FIXED**: added test for `computeLineDiff('hello\n', 'hello')`

**Post-fix verification:** 448 tests pass, lint clean, format clean, build succeeds (5.70 kB chunk)

### Change Log

- 2026-02-14: Story 7-1 Text Diff Checker implemented — new diff utility, 16 unit tests, TextDiffChecker component, new Text category in registry and sidebar
- 2026-02-14: Code review — fixed theme color tokens (H1), layout competition (M1), accessibility attributes (M2), added trailing newline test (L2). 3 fixes applied, 2 items deferred.
- 2026-02-14: Side-by-side diff view — replaced unified diff rendering with CSS grid side-by-side layout. Added `computeSideBySideDiff` with `diffWords` inline highlighting, `DiffCell` component, sticky headers, line numbers, indicator bars. Added 8 new tests (448 total). Chunk grew from 3.26 kB to 5.70 kB.
- 2026-03-16: Added localStorage input persistence using `useInputLocalStorage` hook. Original/modified inputs pulled out of reducer, restored on mount with auto-diff recompute. Cleared on dialog close.

### File List

**Created:**
- src/utils/diff.ts
- src/utils/diff.spec.ts
- src/components/feature/text/TextDiffChecker.tsx
- src/components/feature/text/index.ts

**Modified:**
- package.json (added `diff` dependency)
- pnpm-lock.yaml (auto-updated)
- src/utils/index.ts (added diff barrel export)
- src/components/feature/index.ts (added text barrel export)
- src/constants/tool-registry.ts (added Text Diff Checker registry entry)
- src/types/constants/tool-registry.ts (added 'Text' to ToolCategory, 'text-diff-checker' to ToolRegistryKey)
- vite.config.ts (added text-diff-checker pre-render route)
- src/components/common/sidebar/Sidebar.tsx (added 'Text' to CATEGORY_ORDER)
