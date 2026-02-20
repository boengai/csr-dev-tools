---
story: 19.3
title: Markdown Table Generator
status: done
epic: 19
---

# Story 19.3: Markdown Table Generator

Status: done

## Story

As a **user**,
I want **to visually build a table by adding rows and columns, then copy the Markdown output**,
So that **I can create Markdown tables without memorizing the pipe syntax**.

**Epic:** Epic 19 — Developer Reference & Utility Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (CopyButton, FieldForm — complete)
**Story Key:** 19-3-markdown-table-generator

## Acceptance Criteria

### AC1: Tool Registered and Opens in Dialog

**Given** the Markdown Table Generator tool registered in `TOOL_REGISTRY` under the Code category
**When** the user navigates to it (via sidebar, command palette, or `/tools/markdown-table-generator` route)
**Then** it opens a dialog with the table editor and Markdown output
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Configurable Table Dimensions

**Given** the table configuration controls
**When** the user adjusts rows and columns
**Then** rows are configurable from 2 to 20 (default 3, including header row)
**And** columns are configurable from 2 to 10 (default 3)
**And** the visual grid updates to match

### AC3: Editable Cell Content

**Given** the visual table grid
**When** the user clicks on a cell
**Then** they can type text into the cell via a text input
**And** the first row is treated as the header row (visually distinguished)

### AC4: Column Alignment Control

**Given** each column header
**When** the user clicks an alignment control
**Then** they can cycle through: left (default), center, right
**And** the alignment is reflected in the Markdown separator row (`:---`, `:---:`, `---:`)

### AC5: Live Markdown Output

**Given** any cell content or alignment change
**When** the user edits the table
**Then** the Markdown output updates in real-time
**And** the output uses proper pipe table syntax with aligned separators

### AC6: Copy Markdown Output

**Given** the Markdown output
**When** the user clicks `CopyButton`
**Then** the complete Markdown table is copied to clipboard

### AC7: Add/Remove Rows and Columns

**Given** the table configuration
**When** the user adds or removes rows/columns
**Then** existing cell content is preserved for remaining cells
**And** new cells default to empty strings
**And** minimum dimensions are enforced (2 rows including header, 2 columns)

### AC8: Unit Tests Cover Markdown Generation

**Given** unit tests in `src/utils/markdown-table.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: basic table generation, column alignment (left/center/right), empty cells, special characters (pipes escaped), single row (header only), max dimensions

## Tasks / Subtasks

- [x] Task 1: Create markdown-table utility (AC: #4, #5, #8)
  - [x] 1.1 Create `src/utils/markdown-table.ts` with `generateMarkdownTable(data: Array<Array<string>>, alignments: Array<ColumnAlignment>): string`
  - [x] 1.2 Define `ColumnAlignment` type: `'left' | 'center' | 'right'`
  - [x] 1.3 Generate header row with pipe separators
  - [x] 1.4 Generate separator row with alignment markers (`:---`, `:---:`, `---:`)
  - [x] 1.5 Generate data rows with pipe separators
  - [x] 1.6 Escape pipe characters (`|`) in cell content
  - [x] 1.7 Pad cells for consistent column widths
  - [x] 1.8 Export `generateMarkdownTable`, `ColumnAlignment`

- [x] Task 2: Write unit tests (AC: #8)
  - [x] 2.1 Create `src/utils/markdown-table.spec.ts`
  - [x] 2.2 Test basic 3x3 table with left alignment
  - [x] 2.3 Test center alignment separator `:---:`
  - [x] 2.4 Test right alignment separator `---:`
  - [x] 2.5 Test mixed alignments across columns
  - [x] 2.6 Test empty cells produce valid Markdown
  - [x] 2.7 Test pipe characters in cell content are escaped
  - [x] 2.8 Test single data row (header + 1 row)
  - [x] 2.9 Test column width padding for readability
  - [x] 2.10 Test header-only table (2 rows: header + separator)

- [x] Task 3: Create MarkdownTableGenerator component (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 3.1 Create `src/components/feature/code/MarkdownTableGenerator.tsx` as named export
  - [x] 3.2 Dialog-based layout using `Dialog` component with `size="screen"`
  - [x] 3.3 Row/column count controls using `FieldForm` type="number"
  - [x] 3.4 Render editable grid: text inputs for each cell, header row visually distinguished
  - [x] 3.5 Alignment buttons per column (cycle through left → center → right)
  - [x] 3.6 Compute Markdown output via `generateMarkdownTable()` on every state change
  - [x] 3.7 Display Markdown output in monospace code block with `CopyButton`
  - [x] 3.8 Show tool description from `TOOL_REGISTRY_MAP['markdown-table-generator']`
  - [x] 3.9 Manage 2D array state for cell content: `Array<Array<string>>`

- [x] Task 4: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 4.1 Add `'markdown-table-generator'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY` (Code category, 📊 emoji)
  - [x] 4.3 Add pre-render route in `vite.config.ts`

- [x] Task 5: Create barrel exports (AC: #1)
  - [x] 5.1 Add `export { MarkdownTableGenerator } from './MarkdownTableGenerator'` to `src/components/feature/code/index.ts`
  - [x] 5.2 Add `export * from './markdown-table'` to `src/utils/index.ts`

- [x] Task 6: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [x] 6.1 Run `pnpm lint` — no errors
  - [x] 6.2 Run `pnpm format:check` — no formatting issues
  - [x] 6.3 Run `pnpm test` — all tests pass
  - [x] 6.4 Run `pnpm build` — build succeeds

## Dev Notes

### Dialog-Based Tool

This tool uses a dialog because the table grid requires significant horizontal space. Follow the UrlEncoder pattern for dialog-based tools: card view shows "Open" button, dialog contains the full editor.

### Processing Pattern — Synchronous, No Debounce

Like BoxShadowGenerator: pure string generation from 2D array state. No async, no external deps.

### UI Layout (Dialog)

```
┌─── Dialog: Markdown Table Generator ─────────────────────────────┐
│                                                                   │
│  Rows: [- 3 +]    Columns: [- 3 +]                               │
│                                                                   │
│  ┌─────────┬─────────┬─────────┐                                  │
│  │ Header1 │ Header2 │ Header3 │  ← header row (bold/bg)          │
│  │  [L]    │  [C]    │  [R]    │  ← alignment toggles             │
│  ├─────────┼─────────┼─────────┤                                  │
│  │ Cell    │ Cell    │ Cell    │                                   │
│  ├─────────┼─────────┼─────────┤                                  │
│  │ Cell    │ Cell    │ Cell    │                                   │
│  └─────────┴─────────┴─────────┘                                  │
│                                                                   │
│  ──────────── dashed divider ─────────────                        │
│                                                                   │
│  Markdown Output                                     [Copy]       │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │ | Header1 | Header2 | Header3 |                          │    │
│  │ | :------ | :-----: | ------: |                          │    │
│  │ | Cell    | Cell    | Cell    |                          │    │
│  └───────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────┘
```

### Architecture Compliance

- **Named export only** — `export const MarkdownTableGenerator`
- **Lazy-loaded** — code split via registry
- **100% client-side** — pure string generation
- **No new dependencies**
- **Dialog pattern** — uses `Dialog` component with injected open/close

### Previous Story Intelligence

From Story 19.1 (CSS Border Radius Generator):
- Synchronous processing pattern — no debounce needed for string generation
- FieldForm for range/number inputs

From Story 19.2 (URL Parser):
- Inline display of structured output with CopyButton per section

### References

- [Source: src/components/feature/encoding/UrlEncoder.tsx] — Dialog-based tool pattern
- [Source: _bmad-output/planning-artifacts/epics-expansion.md#Story 19.3] — Epic definition
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey union

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/utils/markdown-table.ts` | NEW | generateMarkdownTable(), ColumnAlignment type |
| `src/utils/markdown-table.spec.ts` | NEW | Unit tests (~10 tests) |
| `src/components/feature/code/MarkdownTableGenerator.tsx` | NEW | Markdown Table Generator component |
| `src/types/constants/tool-registry.ts` | MODIFY | Add 'markdown-table-generator' to ToolRegistryKey |
| `src/constants/tool-registry.ts` | MODIFY | Add registry entry |
| `src/components/feature/code/index.ts` | MODIFY | Add barrel export |
| `src/utils/index.ts` | MODIFY | Add markdown-table barrel export |
| `vite.config.ts` | MODIFY | Add pre-render route |

## Dev Agent Record

### Agent Model Used

Unknown (story file not updated by dev agent)

### Debug Log References

None recorded.

### Completion Notes List

- Created `generateMarkdownTable()` with pipe separators, alignment markers, pipe escaping, and padded column widths
- 10 unit tests covering basic table, center/right/mixed alignment, empty cells, pipe escaping, single data row, padding, header-only, and empty data
- MarkdownTableGenerator dialog component with row/col FieldForm controls, editable grid, alignment cycling buttons, live Markdown preview with CopyButton
- Tool registered in TOOL_REGISTRY under Code category, barrel exports, pre-render route

### File List

| Status | File | Description |
|--------|------|-------------|
| Created | `src/utils/markdown-table.ts` | generateMarkdownTable(), ColumnAlignment type |
| Created | `src/utils/markdown-table.spec.ts` | 10 unit tests for Markdown table generation |
| Created | `src/components/feature/code/MarkdownTableGenerator.tsx` | Markdown Table Generator component |
| Modified | `src/types/constants/tool-registry.ts` | Added 'markdown-table-generator' to ToolRegistryKey |
| Modified | `src/constants/tool-registry.ts` | Added registry entry |
| Modified | `src/components/feature/code/index.ts` | Added barrel export |
| Modified | `src/utils/index.ts` | Added markdown-table barrel export |
| Modified | `vite.config.ts` | Added pre-render route |

### Change Log

- 2026-02-20: Story file backfilled — status updated to done, tasks checked, Dev Agent Record populated

## Senior Developer Review (AI)

**Reviewer:** csrteam (backfill review)
**Date:** 2026-02-20
**Verdict:** Done (all issues fixed)

### Findings Fixed

| Severity | Finding | Fix Applied |
|----------|---------|-------------|
| MEDIUM | AC2 specifies default 3 rows (including header) but implementation defaulted to 4 | Changed default rows from 4 to 3 in useState, createGrid, and handleReset |
| MEDIUM | Task 3.3 specifies FieldForm for row/column controls but raw `<input>` was used | Replaced raw inputs with `FieldForm type="number"` for consistency |
