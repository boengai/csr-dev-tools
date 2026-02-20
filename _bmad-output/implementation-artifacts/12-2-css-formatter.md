---
story: 12.2
title: CSS Formatter/Minifier
status: done
epic: 12
---

# Story 12.2: CSS Formatter/Minifier

## Story

As a **user**,
I want **to paste CSS and see it beautified or minified**,
So that **I can clean up stylesheets or prepare them for production**.

**Epic:** Epic 12 — Code & Markup Formatters
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (CopyButton, FieldForm)
**Story Key:** 12-2-css-formatter

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the CSS Formatter tool registered in `TOOL_REGISTRY` under the Code category
**When** the user navigates to it (via sidebar, command palette, or `/tools/css-formatter` route)
**Then** it renders with a card button to open the full-screen dialog
**And** a one-line description is shown from the registry entry
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Beautify CSS

**Given** the user pastes valid CSS
**When** the value is entered
**Then** beautified CSS appears in real-time (debounced 300ms) with configurable indent (2/4 spaces or tab)

### AC3: Minify CSS

**Given** a "Minify" mode is selected
**When** CSS is entered
**Then** the output is minified (whitespace/comments removed)

### AC4: Copy Result

**Given** the formatted/minified output
**When** the user clicks `CopyButton`
**Then** the result is copied to clipboard

### AC5: Error Handling

**Given** invalid CSS
**When** entered
**Then** best-effort formatting with toast error if formatting fails

### AC6: Unit Tests

**Given** unit tests in `src/utils/css-format.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: valid CSS formatting, 4-space indent, minification, comment removal, empty input

## Tasks / Subtasks

- [x] Task 1: Create CSS format utility functions (AC: #2, #3, #6)
  - [x] 1.1 Create `src/utils/css-format.ts` with `formatCss()` and `minifyCss()`
  - [x] 1.2 Import `css` beautifier from `js-beautify` library
  - [x] 1.3 Support configurable indent (2/4 spaces or tab)
  - [x] 1.4 Implement minification via regex-based whitespace/comment removal

- [x] Task 2: Write unit tests (AC: #6)
  - [x] 2.1 Create `src/utils/css-format.spec.ts`
  - [x] 2.2 Test formatting minified CSS produces indented output
  - [x] 2.3 Test 4-space indent option
  - [x] 2.4 Test minification removes whitespace
  - [x] 2.5 Test minification removes comments
  - [x] 2.6 Test empty input returns empty string

- [x] Task 3: Create CssFormatter component (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Create `src/components/feature/code/CssFormatter.tsx` as named export
  - [x] 3.2 Implement dialog-based layout with source/result split panels
  - [x] 3.3 Add mode select (Beautify/Minify) and indent select (2/4/tab)
  - [x] 3.4 Use `useDebounceCallback` with 300ms delay
  - [x] 3.5 Show CopyButton on result output
  - [x] 3.6 Handle errors via toast notifications

- [x] Task 4: Register tool and update exports (AC: #1)
  - [x] 4.1 Add `'css-formatter'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add export to `src/components/feature/code/index.ts`
  - [x] 4.4 Add barrel export to `src/utils/index.ts`

## Dev Notes

### Previous Story Intelligence

From Story 12.1 (HTML Formatter):
- Code category and directory already established
- Dialog-based layout pattern for code tools confirmed
- `js-beautify` library already installed as dependency
- Debounced 300ms processing pattern used for all code formatters

### Architecture Pattern

Uses the **dialog-based formatter pattern** — card shows description + open button, full editing happens in screen-sized dialog with split panels (source left, result right, stacked on mobile).

### Processing Pattern

- **Trigger:** On input change, debounced 300ms
- **Beautify:** Uses `js-beautify` CSS module with configurable indent
- **Minify:** Custom regex-based approach (removes comments, collapses whitespace, removes unnecessary semicolons)

### Key Implementation Details

- Mode toggle: `'beautify' | 'minify'` — defaults to beautify
- Indent options only shown in beautify mode
- `minifyCss` uses regex chain: strip comments → collapse around delimiters → remove trailing semicolons → collapse whitespace
- Error handling via `useToast` — no `useToolError` needed for this pattern

### File Locations

| File | Purpose |
|------|---------|
| `src/utils/css-format.ts` | `formatCss()`, `minifyCss()` utility functions |
| `src/utils/css-format.spec.ts` | 6 unit tests |
| `src/components/feature/code/CssFormatter.tsx` | Component (151 lines) |

## Dev Agent Record

### Completion Notes List

- Created `formatCss` and `minifyCss` utility functions using `js-beautify` CSS module
- CssFormatter component with dialog layout, mode/indent selects, debounced processing
- 6 unit tests covering formatting, indentation, minification, and edge cases

### File List

| File | Action |
|------|--------|
| `src/utils/css-format.ts` | NEW |
| `src/utils/css-format.spec.ts` | NEW |
| `src/components/feature/code/CssFormatter.tsx` | NEW |
| `src/components/feature/code/index.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/constants/tool-registry.ts` | MODIFIED |
| `vite.config.ts` | MODIFIED |

## Senior Developer Review (AI)
**Reviewer:** csrteam | **Date:** 2026-02-20 | **Status:** Approved with fixes applied

### Findings & Fixes Applied
| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| M1 | MEDIUM | `minifyCss` regex corrupts CSS values inside string literals containing `{}:;,` | Fixed — string literals now preserved via placeholder extraction before minification |
| M2 | MEDIUM | E2E test only covered beautify mode | Fixed — added minify mode E2E test |
| L1 | LOW | Minify test didn't assert exact output | Fixed — test now asserts `body{color:red;margin:0}` |
| L2 | LOW | Missing tab indent test for formatCss | Accepted — low impact |

### Files Modified During Review
- `src/utils/css-format.ts` — Fixed minifyCss to preserve CSS string literals
- `src/utils/css-format.spec.ts` — Added 2 tests (string preservation, data URI), strengthened minify assertion
- `e2e/code-tools-extended.spec.ts` — Added minify mode E2E test

### Change Log
- 2026-02-20: Code review backfill — 2 MEDIUM fixed, 2 LOW (1 fixed, 1 accepted)
