---
story: 16.1
title: Text Case Converter
status: done
epic: 16
---

# Story 16.1: Text Case Converter

## Story

As a **user**,
I want **to convert text between different case formats**,
So that **I can quickly transform variable names and text for different coding conventions**.

**Epic:** Epic 16 — Text Utilities
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (CopyButton, FieldForm, Button)
**Story Key:** 16-1-text-case-converter

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the Text Case Converter tool registered in `TOOL_REGISTRY` under the Text category
**When** the user navigates to it
**Then** it renders with a card button to open the full-screen dialog

### AC2: All Case Conversions Displayed

**Given** the user enters text
**When** content is provided
**Then** all case conversions display simultaneously: camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, Title Case, UPPERCASE, lowercase, Sentence case, dot.case, path/case

### AC3: Copy Individual Results

**Given** each output
**When** displayed
**Then** each has its own CopyButton

### AC4: Intelligent Word Splitting

**Given** multi-word or mixed-case input
**When** entered
**Then** the converter intelligently splits on spaces, underscores, hyphens, and camelCase boundaries

### AC5: Unit Tests

**Given** unit tests in `src/utils/text-case.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: all case conversions from various input formats, empty input, camelCase boundary splitting

## Tasks / Subtasks

- [x] Task 1: Create text case utility functions (AC: #2, #4, #5)
  - [x] 1.1 Create `src/utils/text-case.ts` with all case conversion functions
  - [x] 1.2 Implement `splitWords()` — splits on spaces, underscores, hyphens, dots, slashes, and camelCase boundaries
  - [x] 1.3 Export: `toCamelCase`, `toPascalCase`, `toSnakeCase`, `toKebabCase`, `toConstantCase`, `toTitleCase`, `toSentenceCase`, `toUpperCase`, `toLowerCase`, `toDotCase`, `toPathCase`

- [x] Task 2: Write unit tests (AC: #5)
  - [x] 2.1 Create `src/utils/text-case.spec.ts`
  - [x] 2.2 Test camelCase from space/snake/kebab/PascalCase input
  - [x] 2.3 Test PascalCase, snakeCase, kebabCase conversions
  - [x] 2.4 Test CONSTANT_CASE, Title Case, Sentence case
  - [x] 2.5 Test UPPERCASE, lowercase
  - [x] 2.6 Test dot.case and path/case (including from dot.case input)
  - [x] 2.7 Test empty input returns empty string

- [x] Task 3: Create TextCaseConverter component (AC: #1, #2, #3)
  - [x] 3.1 Create `src/components/feature/text/TextCaseConverter.tsx` as named export
  - [x] 3.2 Dialog-based layout with source input on left, results list on right
  - [x] 3.3 Use `CASES` array mapping labels to conversion functions
  - [x] 3.4 Each result shown in monospace code block with individual CopyButton
  - [x] 3.5 Use `useDebounceCallback` with 300ms delay
  - [x] 3.6 Results panel is scrollable (`overflow-auto`)

- [x] Task 4: Register tool and update exports (AC: #1)
  - [x] 4.1 Add `'text-case-converter'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add export to `src/components/feature/text/index.ts`
  - [x] 4.4 Add barrel export to `src/utils/index.ts`

## Dev Notes

### Architecture Pattern

**Dialog-based multi-output tool** — single input produces 11 simultaneous outputs, each with its own CopyButton. Results displayed in scrollable list.

### Key Implementation Details

- No external library — pure JavaScript string manipulation
- `splitWords()` uses regex chain: `([a-z])([A-Z])` for camelCase boundaries, `([A-Z]+)([A-Z][a-z])` for acronym boundaries, then splits on `[\s_\-./]+`
- All conversion functions are thin wrappers around `splitWords()` → `map()` → `join()`
- `CASES` array maps each label to its conversion function for rendering
- Empty results show placeholder text "Enter text to see conversions"

### File Locations

| File | Purpose |
|------|---------|
| `src/utils/text-case.ts` | 11 case conversion functions + `splitWords()` |
| `src/utils/text-case.spec.ts` | 14 unit tests |
| `src/components/feature/text/TextCaseConverter.tsx` | Component (124 lines) |

## Dev Agent Record

### Completion Notes List

- Created 11 text case conversion functions with intelligent word splitting
- TextCaseConverter component with dialog layout showing all conversions simultaneously
- 14 unit tests covering all case formats and input variations

### File List

| File | Action |
|------|--------|
| `src/utils/text-case.ts` | NEW |
| `src/utils/text-case.spec.ts` | NEW |
| `src/components/feature/text/TextCaseConverter.tsx` | NEW |
| `src/components/feature/text/index.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/constants/tool-registry.ts` | MODIFIED |
| `vite.config.ts` | MODIFIED |

### Change Log

| Date | Change |
|------|--------|
| 2026-02-20 | Code review (backfill): added digit-boundary tests for `splitWords` (`text-case.spec.ts`) |

### Senior Developer Review (AI)

**Reviewer:** boengai | **Date:** 2026-02-20 | **Status:** Approved

**Findings Fixed:**
- [M5] Added digit-boundary tests for `splitWords` letter-to-digit and digit-to-letter regex handling (`text-case.spec.ts`)

**Notes:**
- All ACs verified and implemented correctly
- 11 case conversions working as specified
- CopyButton on each result confirmed
- `splitWords` handles all documented boundary types
