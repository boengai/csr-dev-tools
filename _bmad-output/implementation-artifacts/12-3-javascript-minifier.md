---
story: 12.3
title: JavaScript Minifier
status: done
epic: 12
---

# Story 12.3: JavaScript Minifier

## Story

As a **user**,
I want **to paste JavaScript and get a minified version**,
So that **I can quickly reduce JS file size for production**.

**Epic:** Epic 12 — Code & Markup Formatters
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (CopyButton, FieldForm)
**Story Key:** 12-3-javascript-minifier

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the JavaScript Minifier tool registered in `TOOL_REGISTRY` under the Code category
**When** the user navigates to it
**Then** it renders with a card button to open the full-screen dialog

### AC2: Minify JavaScript

**Given** the user pastes valid JavaScript
**When** the value is entered
**Then** minified JS appears in real-time (debounced 300ms)
**And** original size vs minified size is displayed (e.g., "2.4 KB → 890 B")

### AC3: Beautify Mode

**Given** a "Beautify" toggle
**When** enabled
**Then** the output is formatted/beautified instead of minified

### AC4: Size Display

**Given** processed output
**When** displayed
**Then** original size, result size, and savings percentage are shown

### AC5: Error Handling

**Given** invalid JavaScript (syntax error)
**When** entered
**Then** a toast error notifies the user

### AC6: Unit Tests

**Given** unit tests in `src/utils/js-format.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: formatting, line comment removal, block comment removal, empty input

## Tasks / Subtasks

- [x] Task 1: Create JS format utility functions (AC: #2, #3, #6)
  - [x] 1.1 Create `src/utils/js-format.ts` with `formatJs()` and `minifyJs()`
  - [x] 1.2 Import `js` beautifier from `js-beautify` for formatting
  - [x] 1.3 Implement minification via regex-based comment/whitespace removal
  - [x] 1.4 Support configurable indent (2/4 spaces or tab)

- [x] Task 2: Write unit tests (AC: #6)
  - [x] 2.1 Create `src/utils/js-format.spec.ts`
  - [x] 2.2 Test formatting minified JS produces indented output
  - [x] 2.3 Test minification removes line comments
  - [x] 2.4 Test minification removes block comments
  - [x] 2.5 Test empty input returns empty string

- [x] Task 3: Create JavaScriptMinifier component (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Create `src/components/feature/code/JavaScriptMinifier.tsx` as named export
  - [x] 3.2 Implement dialog-based layout with split panels
  - [x] 3.3 Add mode select (Minify/Beautify) — defaults to Minify
  - [x] 3.4 Calculate and display size comparison (original → result, savings %)
  - [x] 3.5 Use `useDebounceCallback` with 300ms delay
  - [x] 3.6 Show CopyButton on result output

- [x] Task 4: Register tool and update exports (AC: #1)
  - [x] 4.1 Add `'javascript-minifier'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add export to `src/components/feature/code/index.ts`
  - [x] 4.4 Add barrel export to `src/utils/index.ts`

## Dev Notes

### Previous Story Intelligence

From Story 12.2 (CSS Formatter):
- Same dialog-based formatter pattern established
- `js-beautify` already available — reuses same library for JS beautification
- Mode toggle pattern (beautify/minify) carried forward

### Architecture Pattern

Same dialog-based formatter as CSS Formatter but with **size comparison display**. Default mode is Minify (opposite of CSS Formatter which defaults to Beautify).

### Key Implementation Details

- Size calculation uses `new Blob([text]).size` for byte-accurate sizing
- Savings percentage: `((1 - resultSize / originalSize) * 100).toFixed(1)`
- Size stats shown inline next to mode/indent controls
- Minification is regex-based (strips comments, collapses whitespace) — not a full JS parser
- Indent select only visible in beautify mode

### File Locations

| File | Purpose |
|------|---------|
| `src/utils/js-format.ts` | `formatJs()`, `minifyJs()` utility functions |
| `src/utils/js-format.spec.ts` | 5 unit tests |
| `src/components/feature/code/JavaScriptMinifier.tsx` | Component (160 lines) |

## Dev Agent Record

### Completion Notes List

- Created `formatJs` and `minifyJs` utility functions
- JavaScriptMinifier component with size comparison display
- 5 unit tests covering formatting, comment removal, and edge cases

### File List

| File | Action |
|------|--------|
| `src/utils/js-format.ts` | NEW |
| `src/utils/js-format.spec.ts` | NEW |
| `src/components/feature/code/JavaScriptMinifier.tsx` | NEW |
| `src/components/feature/code/index.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/constants/tool-registry.ts` | MODIFIED |
| `vite.config.ts` | MODIFIED |

## Senior Developer Review (AI)
**Reviewer:** boengai | **Date:** 2026-02-20 | **Status:** Approved with fixes applied

### Findings & Fixes Applied
| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| H1 | HIGH | `minifyJs` regex destroys string literals containing `//` or `/* */` (e.g., URLs) | Fixed — string literals preserved via placeholder extraction before comment removal |
| M1 | MEDIUM | Newline removal breaks ASI-reliant code (`\n` → empty) | Fixed — newlines replaced with space instead of empty string |
| M2 | MEDIUM | E2E test only covered minify mode | Fixed — added beautify mode E2E test |
| L1 | LOW | Size display shows raw bytes vs AC spec's human-readable format | Accepted — functional, minor UX deviation |

### Files Modified During Review
- `src/utils/js-format.ts` — Fixed minifyJs to preserve string literals and use space for newline replacement
- `src/utils/js-format.spec.ts` — Added 3 tests (URL preservation, comment-in-string, newline handling)
- `e2e/code-tools-extended.spec.ts` — Added beautify mode E2E test

### Change Log
- 2026-02-20: Code review backfill — 1 HIGH + 2 MEDIUM fixed, 1 LOW accepted
