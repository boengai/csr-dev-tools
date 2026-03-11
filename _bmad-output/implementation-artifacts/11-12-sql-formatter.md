---
story: 12.4
title: SQL Formatter
status: done
epic: 12
---

# Story 12.4: SQL Formatter

## Story

As a **user**,
I want **to paste SQL and see it formatted with proper indentation and keyword highlighting**,
So that **I can make complex queries readable**.

**Epic:** Epic 12 — Code & Markup Formatters
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (CopyButton, FieldForm)
**Story Key:** 12-4-sql-formatter

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the SQL Formatter tool registered in `TOOL_REGISTRY` under the Code category
**When** the user navigates to it
**Then** it renders with a card button to open the full-screen dialog

### AC2: Format SQL with Uppercase Keywords

**Given** the user pastes a SQL query
**When** the value is entered
**Then** formatted SQL appears with uppercase keywords, proper indentation, and one clause per line

### AC3: Dialect Selection

**Given** dialect selection
**When** the user picks a dialect (Standard SQL, PostgreSQL, MySQL, SQLite, BigQuery)
**Then** formatting adapts to dialect-specific syntax

### AC4: Configurable Indent

**Given** a configurable indent option
**When** changed (2/4 spaces)
**Then** formatting updates accordingly

### AC5: Copy Result

**Given** the formatted output
**When** the user clicks `CopyButton`
**Then** the formatted SQL is copied to clipboard

### AC6: Unit Tests

**Given** unit tests in `src/utils/sql-format.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: simple SELECT formatting, dialect support, empty input

## Tasks / Subtasks

- [x] Task 1: Create SQL format utility (AC: #2, #3, #4, #6)
  - [x] 1.1 Create `src/utils/sql-format.ts` with `formatSql()`
  - [x] 1.2 Import `format` from `sql-formatter` library
  - [x] 1.3 Define `SqlDialect` type with supported dialects
  - [x] 1.4 Support configurable indent (2/4 spaces), keyword uppercase

- [x] Task 2: Write unit tests (AC: #6)
  - [x] 2.1 Create `src/utils/sql-format.spec.ts`
  - [x] 2.2 Test simple SELECT produces uppercase keywords
  - [x] 2.3 Test dialect support (MySQL)
  - [x] 2.4 Test empty input returns empty string

- [x] Task 3: Create SqlFormatter component (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Create `src/components/feature/code/SqlFormatter.tsx` as named export
  - [x] 3.2 Implement dialog-based layout with split panels
  - [x] 3.3 Add dialect select (Standard SQL, PostgreSQL, MySQL, SQLite, BigQuery)
  - [x] 3.4 Add indent select (2/4 spaces)
  - [x] 3.5 Use `useDebounceCallback` with 300ms delay
  - [x] 3.6 Show CopyButton on result output

- [x] Task 4: Register tool and update exports (AC: #1)
  - [x] 4.1 Add `'sql-formatter'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add export to `src/components/feature/code/index.ts`
  - [x] 4.4 Add barrel export to `src/utils/index.ts`

## Dev Notes

### Previous Story Intelligence

From Story 12.3 (JavaScript Minifier):
- Dialog-based formatter pattern well established
- Code category barrel exports already set up

### Architecture Pattern

Format-only tool (no minify mode). Uses `sql-formatter` library for dialect-aware SQL formatting. Keywords are automatically uppercased.

### Key Implementation Details

- `SqlDialect` type: `'sql' | 'postgresql' | 'mysql' | 'sqlite' | 'bigquery'`
- Default dialect: `'sql'` (Standard SQL)
- `keywordCase: 'upper'` enforced in all dialects
- No tab indent option (only 2/4 spaces) unlike CSS/JS formatters
- Dialect and indent changes trigger immediate reprocessing of existing source

### File Locations

| File | Purpose |
|------|---------|
| `src/utils/sql-format.ts` | `formatSql()`, `SqlDialect` type |
| `src/utils/sql-format.spec.ts` | 3 unit tests |
| `src/components/feature/code/SqlFormatter.tsx` | Component (152 lines) |

## Dev Agent Record

### Completion Notes List

- Created `formatSql` utility using `sql-formatter` library with dialect and indent support
- SqlFormatter component with dialect/indent selects, debounced processing
- 3 unit tests covering formatting, dialect support, and empty input

### File List

| File | Action |
|------|--------|
| `src/utils/sql-format.ts` | NEW |
| `src/utils/sql-format.spec.ts` | NEW |
| `src/components/feature/code/SqlFormatter.tsx` | NEW |
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
| M1 | MEDIUM | E2E test minimal — no dialect switching coverage | Fixed — added dialect change E2E test |
| L1 | LOW | SqlDialect type in utils file instead of src/types/ | Accepted — minor, type is small and co-located usage is practical |
| L2 | LOW | Only 3 unit tests | Accepted — sql-formatter library handles the heavy lifting; tests cover the critical paths |

### Files Modified During Review
- `e2e/code-tools-extended.spec.ts` — Added dialect change E2E test

### Change Log
- 2026-02-20: Code review backfill — 1 MEDIUM fixed, 2 LOW accepted
