---
story: 16.4
title: String Escape/Unescape
status: done
epic: 16
---

# Story 16.4: String Escape/Unescape

## Story

As a **user**,
I want **to escape and unescape strings for different contexts (HTML, JavaScript, URL, JSON)**,
So that **I can safely embed content in different contexts**.

**Epic:** Epic 16 — Text Utilities
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (CopyButton, FieldForm, Button)
**Story Key:** 16-4-string-escape-unescape

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the String Escape/Unescape tool registered in `TOOL_REGISTRY` under the Text category
**When** the user navigates to it
**Then** it renders with card buttons for Escape and Unescape modes

### AC2: Escape Modes

**Given** the tool interface
**When** the user selects an escape mode
**Then** modes available: HTML, JavaScript, JSON, URL, XML

### AC3: Real-Time Processing

**Given** the user enters text in the input
**When** the value changes
**Then** escaped/unescaped output appears in real-time (debounced 300ms) based on selected mode and direction

### AC4: HTML Entities

**Given** HTML entities mode
**When** escaping `<script>alert("XSS")</script>`
**Then** output: `&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;`

### AC5: Unit Tests

**Given** unit tests in `src/utils/string-escape.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: all escape modes (HTML, JS, JSON, URL, XML), roundtrip, empty input

## Tasks / Subtasks

- [x] Task 1: Create string escape utilities (AC: #2, #3, #4, #5)
  - [x] 1.1 Create `src/utils/string-escape.ts` with `escapeString()` and `unescapeString()`
  - [x] 1.2 Define `EscapeMode` type: `'html' | 'javascript' | 'json' | 'url' | 'xml'`
  - [x] 1.3 Implement HTML entities (escape map: `& < > " '`)
  - [x] 1.4 Implement JavaScript escape (`\n`, `\t`, `\"`, `\\`)
  - [x] 1.5 Implement JSON escape (similar to JS)
  - [x] 1.6 Implement URL encoding (`encodeURIComponent` / `decodeURIComponent`)
  - [x] 1.7 Implement XML entities (similar to HTML but with `&apos;`)

- [x] Task 2: Write unit tests (AC: #5)
  - [x] 2.1 Create `src/utils/string-escape.spec.ts`
  - [x] 2.2 Test HTML escape/unescape
  - [x] 2.3 Test JavaScript escape/unescape
  - [x] 2.4 Test JSON escape/unescape
  - [x] 2.5 Test URL escape/unescape
  - [x] 2.6 Test XML escape/unescape
  - [x] 2.7 Test empty strings

- [x] Task 3: Create StringEscapeUnescape component (AC: #1, #2, #3)
  - [x] 3.1 Create `src/components/feature/text/StringEscapeUnescape.tsx` as named export
  - [x] 3.2 Two card buttons: "Escape" and "Unescape" opening dialog in respective direction
  - [x] 3.3 Dialog with mode select + direction toggle (Escape/Unescape buttons)
  - [x] 3.4 Split panels with source input and result output
  - [x] 3.5 Use `useDebounceCallback` with 300ms delay
  - [x] 3.6 Direction toggle using `Button` variant switching (default/secondary)
  - [x] 3.7 Mode/direction changes trigger immediate reprocessing

- [x] Task 4: Register tool and update exports (AC: #1)
  - [x] 4.1 Add `'string-escape-unescape'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add export to `src/components/feature/text/index.ts`
  - [x] 4.4 Add barrel export to `src/utils/index.ts`

## Dev Notes

### Previous Story Intelligence

From Story 16.3 (Lorem Ipsum Generator):
- Text category complete after this story
- This uses dialog-based bidirectional pattern (more complex than lorem ipsum)

### Architecture Pattern

**Dialog-based bidirectional tool** with mode selection. Combines the bidirectional pattern (escape/unescape) from data converters with mode selection (HTML/JS/JSON/URL/XML).

### Key Implementation Details

- No external library — character-level escape map lookups
- `HTML_ESCAPE_MAP` / `HTML_UNESCAPE_MAP`: maps `&`, `<`, `>`, `"`, `'` to HTML entities
- `XML_ESCAPE_MAP` / `XML_UNESCAPE_MAP`: same as HTML but uses `&apos;` instead of `&#39;`
- JavaScript/JSON escape: handles `\n`, `\t`, `\\`, `\"` with regex replace
- URL escape: wraps `encodeURIComponent()` / `decodeURIComponent()`
- Direction toggle uses `Button` with `variant` switching between `'default'` and `'secondary'`
- Mode and direction changes call `process()` directly (no debounce) for existing source text
- Toast notification on error: `"Unable to {direction} — input contains invalid sequences"`

### File Locations

| File | Purpose |
|------|---------|
| `src/utils/string-escape.ts` | `escapeString()`, `unescapeString()`, escape maps |
| `src/utils/string-escape.spec.ts` | 11 unit tests |
| `src/components/feature/text/StringEscapeUnescape.tsx` | Component (166 lines) |

## Dev Agent Record

### Completion Notes List

- Created string escape/unescape utilities for 5 modes with character map lookups
- StringEscapeUnescape component with mode select, direction toggle, debounced processing
- 11 unit tests covering all escape modes and roundtrip verification

### File List

| File | Action |
|------|--------|
| `src/utils/string-escape.ts` | NEW |
| `src/utils/string-escape.spec.ts` | NEW |
| `src/components/feature/text/StringEscapeUnescape.tsx` | NEW |
| `src/components/feature/text/index.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/constants/tool-registry.ts` | MODIFIED |
| `vite.config.ts` | MODIFIED |

### Change Log

| Date | Change |
|------|--------|
| 2026-02-20 | Code review (backfill): added `\b`/`\f`/`\v` JS escape sequences; added roundtrip tests for all modes |

### Senior Developer Review (AI)

**Reviewer:** boengai | **Date:** 2026-02-20 | **Status:** Approved

**Findings Fixed:**
- [M3] `escapeJavaScript` now handles `\b` (backspace, via `\x08`), `\f` (form feed), `\v` (vertical tab)
- [M3] `unescapeJavaScript` switch now includes `case 'b'`, `case 'f'`, `case 'v'`
- [M4] Added 5 roundtrip tests verifying `unescape(escape(input)) === input` for all modes (HTML, JS, JSON, URL, XML)

**Notes:**
- All 5 escape modes working correctly
- HTML entities match AC4 spec exactly
- Error handling via toast on invalid unescape sequences confirmed
- Direction toggle and mode change with immediate reprocessing verified
