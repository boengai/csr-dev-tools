# Story 7.2: Regex Tester

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to test a regular expression against sample text and see matches highlighted in real-time**,
So that **I can iterate on regex patterns quickly without switching to a terminal or external tool**.

**Epic:** Epic 7 — Text Analysis Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (useToolError, CopyButton — complete)
**Story Key:** 7-2-regex-tester

## Acceptance Criteria

### AC1: Tool Registered and Renders via Single-Mode Dialog Pattern

**Given** the Regex Tester tool registered in `TOOL_REGISTRY` under the Text category
**When** the user navigates to it (via sidebar, command palette, or `/tools/regex-tester` route)
**Then** it renders with a single "Test Regex" button that opens a full-screen dialog
**And** a one-line description is shown from the registry entry
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Pattern Input with Flag Toggles

**Given** the user opens the Test Regex dialog
**When** the dialog renders
**Then** a `TextInput` is displayed for the regex pattern with placeholder `\d+`
**And** three flag toggle buttons are displayed next to the pattern label: `g` (global, ON by default), `i` (case-insensitive, OFF), `m` (multiline, OFF)
**And** active flag toggles are visually distinct (filled/highlighted) from inactive ones (outline)

### AC3: Test String Input

**Given** the dialog is rendered
**When** the user views the test string section
**Then** a `TextAreaInput` is displayed for the test string with placeholder "Enter text to test against..."
**And** the textarea is below the pattern input, separated by spacing

### AC4: Live Match Highlighting in Output Region

**Given** a user enters a valid regex pattern and test string
**When** both fields have content
**Then** all matches are highlighted in the output region in real-time (debounced 150ms)
**And** matched text segments are rendered with `bg-primary/20 text-primary` styling
**And** non-matched text is rendered in default styling (`text-gray-400`)
**And** a match count is displayed (e.g., "3 matches found")
**And** output is displayed in a monospace font, scrollable container

### AC5: Capture Groups Displayed in Match Details

**Given** the regex pattern contains capture groups (e.g., `(\d+)\.(\d+)`)
**When** matches are found
**Then** each match is listed in a match details section below the highlighted text
**And** each match shows: full match text, index position, and numbered capture groups
**And** named capture groups (if present) show group names alongside values
**And** undefined groups display as "undefined" (when optional groups don't match)

### AC6: Copy All Matches

**Given** match results are displayed
**When** the user clicks the `CopyButton` ("Copy matches")
**Then** all match results are copied to clipboard in a formatted text representation
**And** format includes: match number, full match, index, and capture groups per match

### AC7: Invalid Regex Pattern Error

**Given** a user enters an invalid regex pattern (e.g., `[`, `(?<>test)`, `*`)
**When** the pattern cannot be compiled
**Then** an inline error appears: the regex `SyntaxError` message from the engine
**And** the highlighted output and match details are cleared

### AC8: Empty/Cleared Inputs Clear Output

**Given** the user clears the pattern or test string
**When** either input becomes empty (after trim)
**Then** the highlighted output, match details, and match count are cleared
**And** any active error is cleared

### AC9: Flag Toggle Behavior

**Given** the flag toggles are displayed
**When** the user toggles a flag
**Then** the regex is recompiled with the updated flags and results update in real-time
**And** toggling `g` OFF shows only the first match; toggling `g` ON shows all matches
**And** toggling `i` ON makes matching case-insensitive
**And** toggling `m` ON makes `^` and `$` match line boundaries

### AC10: Processing Performance and Safety

**Given** the tool implementation
**When** it processes regex
**Then** it uses native JavaScript `RegExp` — zero network requests, 100% client-side
**And** match collection is capped at 5,000 matches to prevent memory exhaustion on greedy global patterns
**And** if the cap is hit, a warning is appended: "Showing first 5,000 matches"

### AC11: Unit Tests Cover All Regex Scenarios

**Given** unit tests in `src/utils/regex.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: simple patterns, global vs non-global matching, capture groups (numbered and named), all three flags (g, i, m), invalid patterns (SyntaxError), no matches, empty inputs, Unicode patterns and text, match count limit (MAX_MATCHES), highlight segment generation, and copy format output

## Tasks / Subtasks

- [x] Task 1: Create regex utility functions (AC: #4, #5, #6, #7, #8, #10)
  - [x] 1.1 Create `src/utils/regex.ts` with synchronous functions (native RegExp — no dynamic import needed)
  - [x] 1.2 `executeRegex(pattern: string, flags: string, text: string): RegexResult` — compiles `new RegExp(pattern, flags)`, runs `matchAll` (with `g`) or `exec` (without `g`), returns `{ matches, error, capped }`
  - [x] 1.3 `buildHighlightSegments(text: string, matches: Array<RegexMatch>): Array<HighlightSegment>` — splits text into alternating non-match/match segments based on match indices and lengths
  - [x] 1.4 `formatMatchesForCopy(matches: Array<RegexMatch>): string` — formats matches as human-readable text for clipboard (match number, full match, index, groups)
  - [x] 1.5 Constant `MAX_MATCHES = 5000` — cap on matches collected per execution
  - [x] 1.6 Error handling: catch `SyntaxError` from `new RegExp()` constructor, return `{ matches: [], error: error.message, capped: false }`
  - [x] 1.7 Handle `g` flag logic: with `g` → `text.matchAll(regex)`, without `g` → `regex.exec(text)` (first match only with groups)
  - [x] 1.8 Export types: `RegexMatch`, `RegexResult`, `HighlightSegment` from the utility file
  - [x] 1.9 Export from `src/utils/index.ts` barrel

- [x] Task 2: Write unit tests for regex utilities (AC: #11)
  - [x] 2.1 Create `src/utils/regex.spec.ts` with explicit vitest imports (`import { describe, expect, it } from 'vitest'`)
  - [x] 2.2 Test `executeRegex` with simple pattern `\d+` against `"abc 123 def 456"` — finds 2 matches with `g`
  - [x] 2.3 Test `executeRegex` without `g` flag — returns only first match
  - [x] 2.4 Test `executeRegex` with capture groups `(\w+)@(\w+)` — groups populated correctly
  - [x] 2.5 Test `executeRegex` with named capture groups `(?<user>\w+)@(?<domain>\w+)` — namedGroups populated
  - [x] 2.6 Test `executeRegex` with `i` flag — case-insensitive matching
  - [x] 2.7 Test `executeRegex` with `m` flag — `^` matches line starts
  - [x] 2.8 Test `executeRegex` with invalid pattern `[` — returns error message, empty matches
  - [x] 2.9 Test `executeRegex` with no matches — returns empty matches array, no error
  - [x] 2.10 Test `executeRegex` with empty pattern — matches empty string at every position (valid but degenerate)
  - [x] 2.11 Test `executeRegex` with empty text — returns empty matches
  - [x] 2.12 Test `executeRegex` with Unicode pattern and text (emoji, CJK characters)
  - [x] 2.13 Test `executeRegex` match count limit — pattern that produces >5000 matches is capped at MAX_MATCHES with `capped: true`
  - [x] 2.14 Test `buildHighlightSegments` — correct segment splitting for multiple matches
  - [x] 2.15 Test `buildHighlightSegments` — adjacent/overlapping match handling
  - [x] 2.16 Test `buildHighlightSegments` — no matches returns single non-match segment
  - [x] 2.17 Test `buildHighlightSegments` — match at start/end of text
  - [x] 2.18 Test `formatMatchesForCopy` — produces readable formatted text with match number, full match, index, and groups
  - [x] 2.19 Test `formatMatchesForCopy` — empty matches returns empty string

- [x] Task 3: Create RegexTester component (AC: #1, #2, #3, #4, #5, #6, #7, #8, #9, #10)
  - [x] 3.1 Create `src/components/feature/text/RegexTester.tsx` as named export
  - [x] 3.2 Follow single-mode dialog pattern from `JsonFormatter.tsx`: one "Test Regex" button on card, opens full-screen dialog
  - [x] 3.3 Dialog layout — three sections stacked vertically:
    - **Top:** Pattern `FieldForm` (type="text") with flag toggle buttons rendered in the label area
    - **Middle:** Test string `FieldForm` (type="textarea", 8 rows) with placeholder
    - **Divider:** `border-t-2 border-dashed border-gray-900`
    - **Bottom:** Output region with highlighted text rendering + match details list + `CopyButton`
  - [x] 3.4 Use `useToolError` for error state, `useDebounceCallback` (150ms) for real-time processing
  - [x] 3.5 Process function is **synchronous** — native RegExp, no dynamic import needed (unlike diff/yaml tools). No `sessionRef` needed.
  - [x] 3.6 State: `pattern` (string), `testString` (string), `flags` (object: `{ g: boolean, i: boolean, m: boolean }` — default `{ g: true, i: false, m: false }`), `result` (RegexResult | null), `segments` (Array<HighlightSegment>), `dialogOpen` (boolean)
  - [x] 3.7 Debounced process: call `executeRegex` and `buildHighlightSegments` when pattern, testString, or flags change
  - [x] 3.8 Flag toggles: three `<button>` elements styled as pills — active state: `bg-primary/20 text-primary border-primary`, inactive: `bg-transparent text-gray-500 border-gray-700`. Each toggle calls handler that updates flags state and triggers reprocessing.
  - [x] 3.9 Highlighted output rendering: map over `segments` array, render matched segments with `bg-primary/20 text-primary rounded-xs` and non-matched as plain `text-gray-400`. Container is monospace, scrollable, `rounded-lg border border-gray-800 bg-gray-950`.
  - [x] 3.10 Match details section: below highlighted text, show each match with "Match N: "full match" at index X" and numbered groups. Each match in a subtle card-like row.
  - [x] 3.11 Match count header: "N matches found" (or "1 match found" for singular) above the output. Show "Showing first 5,000 matches" warning if capped.
  - [x] 3.12 `CopyButton` in output header copies formatted match results via `formatMatchesForCopy` — label="matches"
  - [x] 3.13 On empty inputs (pattern or testString trimmed empty): clear result, segments, and error
  - [x] 3.14 On dialog close (`onAfterClose`): reset all state via `handleReset`
  - [x] 3.15 Show tool description from `TOOL_REGISTRY_MAP['regex-tester']`
  - [x] 3.16 Error display with `role="alert"` (same pattern as all other tools)

- [x] Task 4: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 4.1 Add `'regex-tester'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetically between `'px-to-rem'` and `'text-diff-checker'`)
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts` (alphabetically by key — between `px-to-rem` and `text-diff-checker` entries)
  - [x] 4.3 Add pre-render route in `vite.config.ts` toolRoutes array (alphabetically between `px-to-rem` and `text-diff-checker`)

- [x] Task 5: Update barrel exports (AC: #1)
  - [x] 5.1 Add `export { RegexTester } from './RegexTester'` to `src/components/feature/text/index.ts` (alphabetically — before TextDiffChecker)
  - [x] 5.2 Add `export * from './regex'` to `src/utils/index.ts` (alphabetically — between `'./px-to-rem'` or wherever it fits before `'./tailwind-variants'`)

- [x] Task 6: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7, #8, #9, #10, #11)
  - [x] 6.1 Run `pnpm lint` — no errors
  - [x] 6.2 Run `pnpm format:check` — no formatting issues
  - [x] 6.3 Run `pnpm test` — all tests pass (448 existing + 19 new = 467)
  - [x] 6.4 Run `pnpm build` — build succeeds, tool chunk is separate (5.39 kB), no impact on initial bundle

## Dev Notes

### CRITICAL: Single-Mode Dialog Pattern with Synchronous Processing + Custom Highlight Rendering

This tool uses the **single-mode pattern** from `JsonFormatter.tsx` (one button on card → opens dialog) with **synchronous processing** (native `RegExp` — NO dynamic import, NO `sessionRef`). **Key difference from TextDiffChecker**: processing is synchronous (no async, no race conditions to guard), and the output uses custom highlighted span rendering instead of a diff grid.

1. **Synchronous processing** — `RegExp` is native JavaScript, no library to dynamically import. Use simple try-catch around `new RegExp()` constructor for validation. No `sessionRef` needed (follows `JsonFormatter.tsx`, NOT `TextDiffChecker.tsx` async pattern).
2. **Three inputs affect output** — pattern + flags + test string. Any change to any of these triggers debounced reprocessing.
3. **Highlighted text rendering** — custom JSX mapping over `HighlightSegment` array. Matched segments get `bg-primary/20 text-primary`, non-matched get `text-gray-400`. Monospace container.
4. **Match details list** — below highlighted text. Each match shows full match, index, and capture groups.
5. **Flag toggles** — inline with pattern label. Three pill buttons that update flags state object.
6. **CopyButton copies formatted text** — not the highlighted HTML, but a human-readable text representation of all matches.

### UI Layout

**Card view:** Tool description + single "Test Regex" button (ghost/outline variant per standardization)

**Dialog view:**
```
┌──────────────────────────────────────────────────┐
│  Regex Tester                                 [X] │
├──────────────────────────────────────────────────┤
│  Pattern                          [g] [i] [m]    │
│  ┌──────────────────────────────────────────────┐ │
│  │ (\w+)@(\w+)\.(\w+)                           │ │
│  └──────────────────────────────────────────────┘ │
│  Test String                                      │
│  ┌──────────────────────────────────────────────┐ │
│  │ Contact us at hello@example.com or            │ │
│  │ support@company.org for help                  │ │
│  └──────────────────────────────────────────────┘ │
│  ──────────── dashed divider ─────────            │
│  2 matches found                   [Copy matches] │
│  ┌──────────────────────────────────────────────┐ │
│  │ Contact us at [hello@example.com] or          │ │ ← highlighted
│  │ [support@company.org] for help                │ │
│  │                                               │ │
│  │ Match 1: "hello@example.com" at index 14      │ │
│  │   Group 1: "hello"                            │ │
│  │   Group 2: "example"                          │ │
│  │   Group 3: "com"                              │ │
│  │ Match 2: "support@company.org" at index 38    │ │
│  │   Group 1: "support"                          │ │
│  │   Group 2: "company"                          │ │
│  │   Group 3: "org"                              │ │
│  └──────────────────────────────────────────────┘ │
│  Error message (if any)                           │
└──────────────────────────────────────────────────┘
```

**Mobile (stacked):**
```
┌────────────────────┐
│ Regex Tester   [X] │
├────────────────────┤
│ Pattern [g][i][m]  │
│ ┌────────────────┐ │
│ │ \d+             │ │
│ └────────────────┘ │
│ Test String        │
│ ┌────────────────┐ │
│ │ abc 123 def    │ │
│ └────────────────┘ │
│ ── dashed divider ──│
│ 1 match found      │
│ [Copy matches]     │
│ ┌────────────────┐ │
│ │ abc [123] def  │ │
│ │                │ │
│ │ Match 1: "123" │ │
│ │   at index 4   │ │
│ └────────────────┘ │
│ Error              │
└────────────────────┘
```

### No External Library Decision

**Decision:** Use native JavaScript `RegExp` — no npm dependency needed.

**Rationale:**
- `RegExp` is a built-in JavaScript object — zero bundle cost, zero dynamic import overhead
- `String.prototype.matchAll()` (ES2020) provides all matches with capture groups in one call
- `regex.exec()` provides first-match-with-groups for non-global patterns
- `new RegExp(pattern, flags)` constructor accepts user-typed pattern strings directly — no escaping issues since HTML input values preserve raw characters (user types `\d+`, input value IS the 3-char string `\d+`)
- Error handling via try-catch on constructor — `SyntaxError` thrown for invalid patterns

**Processing approach:**
```
With g flag:  [...text.matchAll(new RegExp(pattern, flags))]  → all matches with groups
Without g:    new RegExp(pattern, flags).exec(text)           → first match with groups
```

**No backtracking timeout protection:** Native `RegExp` in Chromium has no execution timeout. A proper solution requires Web Workers. For this MVP, we cap match count at 5,000 and note that Web Worker timeout could be added as a future enhancement. Firefox and Safari have built-in regex timeouts.

### Highlight Rendering Approach

`buildHighlightSegments` produces an array of `HighlightSegment`, each marking text as matched or unmatched.

**Algorithm:**
1. Sort matches by index (should already be sorted by `matchAll`)
2. Walk through text character by character:
   - From current position to next match start → non-match segment
   - Match content → match segment with matchIndex
   - Advance position past match end
3. Remaining text after last match → non-match segment
4. Handle zero-length matches (e.g., empty pattern `""`) — skip to avoid infinite loops

**Rendering:**
- Container: `overflow-auto rounded-lg border border-gray-800 bg-gray-950 p-3 font-mono text-sm whitespace-pre-wrap break-words`
- Matched segments: `<span className="bg-primary/20 text-primary rounded-xs">matched text</span>`
- Non-matched segments: `<span className="text-gray-400">plain text</span>`
- Preserves whitespace and newlines via `whitespace-pre-wrap`

### Processing Flow

```
User types in pattern, test string, or toggles a flag
  → handlePatternChange / handleTestStringChange / handleFlagToggle
    → update state + call debouncedProcess()
      → synchronous process():
          1. If pattern empty or testString empty → clear results & error, return
          2. executeRegex(pattern, flagString, testString)
          3. If error → setError(error), clear segments/result, return
          4. buildHighlightSegments(testString, matches)
          5. setResult(regexResult)
          6. setSegments(highlights)
          7. clearError()
```

### Flag Toggle Implementation

Flags are stored as an object `{ g: true, i: false, m: false }` in state. Converted to a flag string for `RegExp` constructor by joining active flags: `Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join('')`.

Flag toggle buttons use the same styling pattern as other interactive elements in the project:
- Active: `bg-primary/20 text-primary border border-primary font-bold`
- Inactive: `bg-transparent text-gray-500 border border-gray-700`
- Size: `min-w-8 h-7 px-2 rounded text-xs font-mono`
- Accessible: `aria-pressed={isActive}`, `aria-label="Toggle {flag} flag"`

### Error Messages

| Scenario | Behavior |
|----------|----------|
| Both inputs empty | Clear output, no error |
| Pattern empty, text present | Clear output, no error |
| Text empty, pattern present | Clear output, no error |
| Invalid pattern (`[`, `*`, etc.) | `setError(syntaxError.message)` — the native error message is descriptive enough |
| Valid pattern, no matches | Show "0 matches found", empty highlight output, no error |
| Valid pattern, matches found | Show highlighted text + match details |
| Match cap hit (>5000) | Show results + warning "Showing first 5,000 matches" |

### Architecture Compliance

- **TOOL_REGISTRY entry required** — tool must be discoverable via sidebar, command palette, dashboard selection dialog, and direct URL. Dashboard is a fixed 6-slot favorites grid — new tools do NOT auto-appear there [Source: architecture.md#Tool Registry]
- **Existing `'Text'` category** — already exists from story 7-1, no category changes needed [Source: src/types/constants/tool-registry.ts]
- **Named export only** — `export const RegexTester` (never `export default`) [Source: project-context.md#Named exports]
- **Lazy-loaded component** — registry uses `lazy(() => import(...).then(({ RegexTester }) => ({ default: RegexTester })))` [Source: architecture.md#Code Splitting]
- **No dynamic import for processing** — RegExp is native, unlike diff/yaml which need dynamic imports. This simplifies the component (no sessionRef, no async). [Source: native JavaScript API]
- **100% client-side** — zero network requests for regex testing [Source: architecture.md#Hard Constraints]
- **useToolError for errors** — never implement custom error state [Source: architecture.md#Error Handling]
- **useDebounceCallback(150ms)** — live preview pattern per architecture process patterns [Source: architecture.md#Process Patterns]

### Library & Framework Requirements

- **No new dependency** — uses native JavaScript `RegExp` and `String.prototype.matchAll()`
- **Existing imports used:** `useState` from React, `Button`, `CopyButton`, `Dialog`, `FieldForm` from `@/components/common`, `TOOL_REGISTRY_MAP` from `@/constants`, `useDebounceCallback`, `useToolError` from `@/hooks`
- **Utility functions** are synchronous (no dynamic import needed)

### File Structure Requirements

**Files to CREATE:**

```
src/utils/regex.ts                                    — executeRegex(), buildHighlightSegments(), formatMatchesForCopy() + types
src/utils/regex.spec.ts                               — Unit tests for regex utilities (~18 tests)
src/components/feature/text/RegexTester.tsx            — Regex Tester component
```

**Files to MODIFY:**

```
src/utils/index.ts                            — Add barrel export for regex utils
src/components/feature/text/index.ts          — Add RegexTester export
src/constants/tool-registry.ts                — Add Regex Tester registry entry
src/types/constants/tool-registry.ts          — Add 'regex-tester' to ToolRegistryKey
vite.config.ts                                — Add Regex Tester pre-render route
```

**Files NOT to modify:**
- Any existing tool components
- `src/types/constants/tool-registry.ts` ToolCategory — `'Text'` already exists
- `src/components/common/sidebar/Sidebar.tsx` — `'Text'` already in CATEGORY_ORDER
- `src/components/feature/index.ts` — `'./text'` barrel already exported
- `src/hooks/useToolError.ts` — reused as-is
- `src/hooks/useDebounceCallback.ts` — reused as-is

### Testing Requirements

**Unit tests (`src/utils/regex.spec.ts`):**

```typescript
import { describe, expect, it } from 'vitest'

import { buildHighlightSegments, executeRegex, formatMatchesForCopy } from '@/utils/regex'

describe('regex utilities', () => {
  describe('executeRegex', () => {
    it('should find all matches with global flag', () => {
      const result = executeRegex('\\d+', 'g', 'abc 123 def 456')
      expect(result.error).toBeNull()
      expect(result.matches).toHaveLength(2)
      expect(result.matches[0].fullMatch).toBe('123')
      expect(result.matches[1].fullMatch).toBe('456')
    })

    it('should find only first match without global flag', () => {
      const result = executeRegex('\\d+', '', 'abc 123 def 456')
      expect(result.error).toBeNull()
      expect(result.matches).toHaveLength(1)
      expect(result.matches[0].fullMatch).toBe('123')
    })

    it('should extract numbered capture groups', () => {
      const result = executeRegex('(\\w+)@(\\w+)', 'g', 'user@host')
      expect(result.matches[0].groups).toEqual(['user', 'host'])
    })

    it('should extract named capture groups', () => {
      const result = executeRegex('(?<user>\\w+)@(?<domain>\\w+)', 'g', 'user@host')
      expect(result.matches[0].namedGroups).toEqual({ user: 'user', domain: 'host' })
    })

    it('should support case-insensitive flag', () => {
      const result = executeRegex('hello', 'gi', 'Hello HELLO hello')
      expect(result.matches).toHaveLength(3)
    })

    it('should support multiline flag', () => {
      const result = executeRegex('^\\w+', 'gm', 'hello\nworld')
      expect(result.matches).toHaveLength(2)
      expect(result.matches[0].fullMatch).toBe('hello')
      expect(result.matches[1].fullMatch).toBe('world')
    })

    it('should return error for invalid pattern', () => {
      const result = executeRegex('[', 'g', 'test')
      expect(result.error).not.toBeNull()
      expect(result.matches).toHaveLength(0)
    })

    it('should return empty matches when no match found', () => {
      const result = executeRegex('xyz', 'g', 'abc def')
      expect(result.error).toBeNull()
      expect(result.matches).toHaveLength(0)
    })

    it('should handle empty text', () => {
      const result = executeRegex('\\d+', 'g', '')
      expect(result.error).toBeNull()
      expect(result.matches).toHaveLength(0)
    })

    it('should handle empty pattern with global flag', () => {
      const result = executeRegex('', 'g', 'abc')
      expect(result.error).toBeNull()
      // Empty pattern matches at every position — capped behavior
      expect(result.matches.length).toBeGreaterThan(0)
    })

    it('should handle Unicode patterns and text', () => {
      const result = executeRegex('[\\u{1F600}-\\u{1F64F}]', 'gu', 'Hello 😀 World 😃!')
      expect(result.error).toBeNull()
      expect(result.matches).toHaveLength(2)
    })

    it('should cap matches at MAX_MATCHES', () => {
      // Pattern that matches every character position
      const text = 'a'.repeat(10000)
      const result = executeRegex('a', 'g', text)
      expect(result.matches.length).toBeLessThanOrEqual(5000)
      expect(result.capped).toBe(true)
    })
  })

  describe('buildHighlightSegments', () => {
    it('should split text into match and non-match segments', () => {
      const matches = [
        { fullMatch: '123', groups: [], index: 4, namedGroups: undefined },
        { fullMatch: '456', groups: [], index: 12, namedGroups: undefined },
      ]
      const segments = buildHighlightSegments('abc 123 def 456 ghi', matches)
      expect(segments).toHaveLength(5)
      expect(segments[0]).toEqual({ isMatch: false, text: 'abc ' })
      expect(segments[1]).toEqual({ isMatch: true, matchIndex: 0, text: '123' })
      expect(segments[2]).toEqual({ isMatch: false, text: ' def ' })
      expect(segments[3]).toEqual({ isMatch: true, matchIndex: 1, text: '456' })
      expect(segments[4]).toEqual({ isMatch: false, text: ' ghi' })
    })

    it('should return single non-match segment when no matches', () => {
      const segments = buildHighlightSegments('hello world', [])
      expect(segments).toHaveLength(1)
      expect(segments[0]).toEqual({ isMatch: false, text: 'hello world' })
    })

    it('should handle match at start of text', () => {
      const matches = [{ fullMatch: 'abc', groups: [], index: 0, namedGroups: undefined }]
      const segments = buildHighlightSegments('abc def', matches)
      expect(segments[0]).toEqual({ isMatch: true, matchIndex: 0, text: 'abc' })
      expect(segments[1]).toEqual({ isMatch: false, text: ' def' })
    })

    it('should handle match at end of text', () => {
      const matches = [{ fullMatch: 'def', groups: [], index: 4, namedGroups: undefined }]
      const segments = buildHighlightSegments('abc def', matches)
      expect(segments[0]).toEqual({ isMatch: false, text: 'abc ' })
      expect(segments[1]).toEqual({ isMatch: true, matchIndex: 0, text: 'def' })
    })
  })

  describe('formatMatchesForCopy', () => {
    it('should format matches with groups for clipboard', () => {
      const matches = [
        { fullMatch: 'hello@world', groups: ['hello', 'world'], index: 0, namedGroups: undefined },
      ]
      const output = formatMatchesForCopy(matches)
      expect(output).toContain('Match 1')
      expect(output).toContain('hello@world')
      expect(output).toContain('Group 1: hello')
      expect(output).toContain('Group 2: world')
    })

    it('should return empty string for no matches', () => {
      expect(formatMatchesForCopy([])).toBe('')
    })
  })
})
```

**No E2E test in this story** — E2E tests are written separately per the testing strategy. Unit tests cover the core regex logic.

### TOOL_REGISTRY Entry (Copy-Paste Ready)

```typescript
{
  category: 'Text',
  component: lazy(() =>
    import('@/components/feature/text/RegexTester').then(
      ({ RegexTester }: { RegexTester: ComponentType }) => ({
        default: RegexTester,
      }),
    ),
  ),
  description: 'Test regex patterns against sample text with live match highlighting',
  emoji: '🔍',
  key: 'regex-tester',
  name: 'Regex Tester',
  routePath: '/tools/regex-tester',
  seo: {
    description:
      'Test regular expressions against sample text with live match highlighting and capture group details. Iterate on regex patterns instantly in your browser.',
    title: 'Regex Tester - CSR Dev Tools',
  },
}
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
```

### Vite Config Pre-Render Route (Copy-Paste Ready)

```typescript
{
  description:
    'Test regular expressions against sample text with live match highlighting and capture group details. Iterate on regex patterns instantly in your browser.',
  path: '/tools/regex-tester',
  title: 'Regex Tester - CSR Dev Tools',
  url: '/tools/regex-tester',
},
```

### Text Barrel Export Update (Copy-Paste Ready)

```typescript
export { RegexTester } from './RegexTester'
export { TextDiffChecker } from './TextDiffChecker'
```

### Previous Story Intelligence

From Story 7-1 (Text Diff Checker — same epic, completed):
- **Single-mode dialog pattern proven** — one button on card, opens full-screen dialog with `Dialog` component, `size="screen"`, `onAfterClose` for cleanup
- **Text category already established** — `'Text'` in ToolCategory, CATEGORY_ORDER, and feature barrel. No category setup needed for this story.
- **Barrel export for `./text` already in** `src/components/feature/index.ts`
- **Ghost/outline button variant standardized** — card buttons use `variant="default"` (not `"ghost"` or `"outline"`)
- **448 tests exist** — expect ~466 after adding regex tests (~18 new)
- **Commit prefix:** Use `✨: story 7-2 Regex Tester`
- **Key difference from 7-1:** This tool is SYNCHRONOUS (native RegExp) vs 7-1's ASYNC (dynamic import of `diff` library). No sessionRef, no async/await, no Promise.all.

### Git Intelligence

Recent commits analyzed:
```
a0f73b0 ✨: story 7-1 Text Diff Checker with side-by-side view
bfb5153 🔄: epic 6 retrospective
20d98d4 💄: standardize tool card buttons to ghost/outline variant
288d0e3 📝: miss commit
5215e73 ✨: story 6-3 JSON to CSV Converter
```

**Pattern:** New tool feature uses `✨: story X-Y Tool Name` commit prefix.
**Files in typical story:** utility function, utility tests, tool component, barrel exports, registry entry, types, vite.config.ts.
**Simpler than 7-1:** No new npm dependency (native RegExp), no new category setup, fewer files to modify.

### Project Structure Notes

- **Existing domain directory:** `src/components/feature/text/` already exists from story 7-1
- **Existing category:** `'Text'` already in all 3 places (ToolCategory, CATEGORY_ORDER, feature barrel)
- **No type file needed** — component has no custom props (follows JsonFormatter, TextDiffChecker patterns)
- **Regex types** — `RegexMatch`, `RegexResult`, `HighlightSegment` defined and exported from `src/utils/regex.ts` (co-located with utility, same pattern as `DiffChange` in `src/utils/diff.ts`)
- **New utility file:** `src/utils/regex.ts` — synchronous (no dynamic import), unlike `src/utils/diff.ts` / `src/utils/yaml.ts`
- **Tests co-located:** `src/utils/regex.spec.ts` — follows `src/utils/diff.spec.ts` pattern (explicit vitest imports)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.2] — Full AC definitions and story requirements
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 7] — Epic objectives and FR coverage (FR21)
- [Source: _bmad-output/planning-artifacts/prd.md#Text Tools] — FR21: Test regular expressions against sample text with live match highlighting
- [Source: _bmad-output/planning-artifacts/prd.md#Performance] — NFR1: Processing under 100ms (text tools)
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Registry] — Registry entry pattern with all required fields
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — `regex-tester` key, `Text` category
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Live preview: on input change, 150ms debounce
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Message Format] — Concise, actionable, with example
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Tool component file structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Hard Constraints] — Zero server-side processing
- [Source: _bmad-output/project-context.md] — 53 project rules (named exports, type not interface, etc.)
- [Source: src/components/feature/data/JsonFormatter.tsx] — Single-mode dialog pattern + synchronous processing reference
- [Source: src/components/feature/text/TextDiffChecker.tsx] — Sibling tool in same domain (dialog pattern, but async)
- [Source: src/utils/diff.ts] — Utility pattern reference (but this tool's utils are synchronous)
- [Source: src/constants/tool-registry.ts] — Current registry with 12 tools, alphabetical ordering
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey union to update (ToolCategory already has 'Text')
- [Source: src/components/common/sidebar/Sidebar.tsx:13] — CATEGORY_ORDER already has 'Text'
- [Source: src/hooks/useToolError.ts] — Error handling hook (clearError, error, setError)
- [Source: src/hooks/useDebounceCallback.ts] — Debounce utility (default 800ms, override to 150ms)
- [Source: vite.config.ts] — Pre-render routes pattern
- [Source: _bmad-output/implementation-artifacts/7-1-text-diff-checker.md] — Previous story learnings, file patterns, test count
- [Source: MDN — RegExp constructor] — Native regex compilation and SyntaxError handling
- [Source: MDN — String.prototype.matchAll()] — ES2020 global match with groups
- [Source: MDN — RegExp.prototype.exec()] — Single match with groups (non-global)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Implemented `executeRegex`, `buildHighlightSegments`, and `formatMatchesForCopy` utility functions in `src/utils/regex.ts` with full type exports (`RegexMatch`, `RegexResult`, `HighlightSegment`)
- All 19 unit tests pass covering: global/non-global matching, capture groups (numbered + named), all three flags (g/i/m), invalid patterns, empty inputs, Unicode, match capping at 5000, highlight segment generation, copy format output, adjacent matches
- RegexTester component follows single-mode dialog pattern (JsonFormatter reference) with synchronous processing — no sessionRef needed
- Flag toggles (g/i/m) inline with pattern label, accessible with aria-pressed
- Highlighted output uses custom span rendering with match/non-match segments
- Match details section with full match, index, and capture group display
- CopyButton copies human-readable formatted match text
- Registered in TOOL_REGISTRY with lazy loading, pre-render route added
- Full suite: 467 tests pass (448 existing + 19 new), 0 regressions
- Build succeeds with separate chunk `RegexTester-Cqvu2eli.js` (5.39 kB gzip: 2.11 kB)

### Change Log

- 2026-02-14: Story 7-2 Regex Tester — implemented regex testing tool with live match highlighting, capture group details, flag toggles, and 19 unit tests
- 2026-02-14: Code review — fixed 3 MEDIUM issues: (M1) corrected alphabetical order of `./regex` and `./jwt` exports in `src/utils/index.ts`, (M2) documented undisclosed `src/pages/tool/index.tsx` formatting change in File List, (M3) added `aria-live="polite"` to output region in `RegexTester.tsx` for WCAG 2.1 AA screen reader support

### File List

**Created:**
- `src/utils/regex.ts` — regex utility functions and types
- `src/utils/regex.spec.ts` — 19 unit tests for regex utilities
- `src/components/feature/text/RegexTester.tsx` — Regex Tester component

**Modified:**
- `src/utils/index.ts` — added regex barrel export (review fix: corrected alphabetical order)
- `src/components/feature/text/index.ts` — added RegexTester export
- `src/components/feature/text/RegexTester.tsx` — review fix: added aria-live="polite" to output region
- `src/constants/tool-registry.ts` — added regex-tester registry entry
- `src/pages/tool/index.tsx` — formatting cleanup (JSX attribute spacing, class ordering)
- `src/types/constants/tool-registry.ts` — added 'regex-tester' to ToolRegistryKey
- `vite.config.ts` — added regex-tester pre-render route
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status updates
- `_bmad-output/implementation-artifacts/7-2-regex-tester.md` — story file updates
