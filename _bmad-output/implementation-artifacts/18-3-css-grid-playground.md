---
story: 18.3
title: CSS Grid Playground
status: done
epic: 18
---

# Story 18.3: CSS Grid Playground

Status: done

## Story

As a **user**,
I want **to visually build CSS Grid layouts by adjusting columns, rows, gaps, and alignment**,
So that **I can experiment with grid properties and copy the resulting CSS**.

**Epic:** Epic 18 — Developer Productivity Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (CopyButton, FieldForm — complete), Story 9.1 (CSS category — complete)
**Story Key:** 18-3-css-grid-playground

## Acceptance Criteria

### AC1: Tool Registered and Renders Inline

**Given** the CSS Grid Playground tool registered in `TOOL_REGISTRY` under the CSS category
**When** the user navigates to it (via sidebar, command palette, or `/tools/css-grid-playground` route)
**Then** it renders inline with controls, a live grid preview, and CSS output
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Configurable Grid Properties

**Given** the input controls
**When** the user adjusts them
**Then** the following properties are configurable: columns (`grid-template-columns` as free text, e.g., `1fr 1fr 1fr`), rows (`grid-template-rows` as free text, e.g., `auto auto`), gap (0-48px via range slider), justify-items (start/center/end/stretch via select), and align-items (start/center/end/stretch via select)

### AC3: Live Grid Preview

**Given** any input value changes
**When** the user adjusts a control
**Then** the live preview updates immediately showing colored grid items arranged according to the CSS Grid properties
**And** grid items are numbered (1, 2, 3...) with distinct colors from a 10-color palette
**And** the CSS output string updates simultaneously

### AC4: Adjustable Item Count

**Given** the item count slider (1-12)
**When** the user changes the count
**Then** the grid preview shows the specified number of colored items
**And** the default is 6 items

### AC5: Copy CSS Output

**Given** the CSS output
**When** the user clicks `CopyButton`
**Then** the complete CSS Grid property block is copied to clipboard (multi-line with `display: grid;` and all properties)

### AC6: Sensible Defaults

**Given** the tool loads
**When** the page renders
**Then** defaults are applied: columns `1fr 1fr 1fr`, rows `auto auto`, gap `8px`, justify-items `stretch`, align-items `stretch`, 6 items
**And** the preview is immediately visible with a working grid layout

### AC7: Unit Tests Cover CSS Generation

**Given** unit tests in `src/utils/css-grid.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: default grid CSS, custom columns/rows, gap values, and alignment options

## Tasks / Subtasks

- [x] Task 1: Create CSS Grid utility functions (AC: #3, #5, #6, #7)
  - [x] 1.1 Create `src/utils/css-grid.ts` with `generateGridCss(container: GridContainerProps, itemCount: number): string`
  - [x] 1.2 Define `GridJustifyItems` and `GridAlignItems` types as union of `'start' | 'center' | 'end' | 'stretch'`
  - [x] 1.3 Define `GridContainerProps` type with `columns`, `rows`, `gap`, `justifyItems`, `alignItems` fields
  - [x] 1.4 Define `DEFAULT_GRID_CONTAINER` constant with sensible defaults
  - [x] 1.5 Generate multi-line CSS output: `display: grid;`, `grid-template-columns`, `grid-template-rows`, `gap`, `justify-items`, `align-items`
  - [x] 1.6 Export `generateGridCss`, `GridContainerProps`, `GridJustifyItems`, `GridAlignItems`, `DEFAULT_GRID_CONTAINER`

- [x] Task 2: Write unit tests for CSS Grid utilities (AC: #7)
  - [x] 2.1 Create `src/utils/css-grid.spec.ts`
  - [x] 2.2 Test default grid CSS contains all 6 properties
  - [x] 2.3 Test custom columns and rows values
  - [x] 2.4 Test gap value rendering
  - [x] 2.5 Test alignment options (justify-items, align-items)

- [x] Task 3: Create GridPlayground component (AC: #1, #2, #3, #4, #5, #6)
  - [x] 3.1 Create `src/components/feature/css/GridPlayground.tsx` as named export
  - [x] 3.2 Render inline layout with tool description from registry
  - [x] 3.3 Add `FieldForm` type="text" for columns input (placeholder: `1fr 1fr 1fr`)
  - [x] 3.4 Add `FieldForm` type="text" for rows input (placeholder: `auto auto`)
  - [x] 3.5 Add `FieldForm` type="range" for gap (0-48px) with label showing current value
  - [x] 3.6 Add `FieldForm` type="select" for justify-items and align-items (start/center/end/stretch options)
  - [x] 3.7 Add `FieldForm` type="range" for item count (1-12) with label showing current value
  - [x] 3.8 Render live grid preview with `style` prop applying all CSS Grid properties directly
  - [x] 3.9 Render numbered grid items with rotating 10-color palette (`ITEM_COLORS` array)
  - [x] 3.10 Display CSS output in `<pre>` block with `CopyButton`
  - [x] 3.11 Compute CSS string on every render via `generateGridCss()` — synchronous, no debounce

- [x] Task 4: Add to type system (AC: #1)
  - [x] 4.1 Add `'css-grid-playground'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts`

- [x] Task 5: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 5.1 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts` with category `'CSS'`, emoji `'🔲'`, lazy-loaded component
  - [x] 5.2 Add pre-render route in `vite.config.ts` toolRoutes array

- [x] Task 6: Wire barrel exports (AC: #1)
  - [x] 6.1 Add `export { GridPlayground } from './GridPlayground'` to `src/components/feature/css/index.ts`
  - [x] 6.2 Add `export * from './css-grid'` to `src/utils/index.ts`

- [x] Task 7: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 7.1 Run `pnpm lint` — no errors
  - [x] 7.2 Run `pnpm test` — all tests pass (4 new tests)
  - [x] 7.3 Run `pnpm build` — build succeeds, tool chunk is separate

## Dev Notes

### Processing Pattern — Synchronous Inline, No Debounce

Like Box Shadow Generator (9-1), this tool uses **synchronous live preview** — `generateGridCss()` is pure string concatenation, no debounce needed. Text inputs for columns/rows update the grid immediately on every keystroke.

### CSS Grid Preview Architecture

The preview renders an actual CSS Grid container using inline `style` prop — not a simulated layout. This means the user sees exactly what the CSS will produce:

```typescript
style={{
  alignItems: container.alignItems,
  display: 'grid',
  gap: `${container.gap}px`,
  gridTemplateColumns: container.columns,
  gridTemplateRows: container.rows,
  justifyItems: container.justifyItems,
}}
```

Grid items use a rotating 10-color palette for visual distinction. Each item shows its 1-based index number.

### CSS Output Format

Multi-line CSS block with all 6 properties:
```css
display: grid;
grid-template-columns: 1fr 1fr 1fr;
grid-template-rows: auto auto;
gap: 8px;
justify-items: stretch;
align-items: stretch;
```

### Existing CSS Category

The CSS category was established in Story 9-1 (Box Shadow Generator). This story adds a second tool to the category — no category bootstrap needed. The `css/index.ts` barrel already exists.

### Previous Story Intelligence

From Story 18-2 (Cron Expression Parser):
- **Inline layout pattern** confirmed — tools that don't need large workspace render directly in the card
- **`FieldForm` type="select"** works for dropdown options (used here for justify-items and align-items)

From Story 9-1 (Box Shadow Generator):
- **CSS category already exists** — `'CSS'` in ToolCategory and CATEGORY_ORDER
- **`css/index.ts` barrel exists** — just add new export
- **Range slider with label** pattern: include current value in label string (e.g., `Gap: 8px`)

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion.md#Story 18.3] — Story requirements
- [Source: src/utils/css-grid.ts] — CSS Grid utility implementation
- [Source: src/components/feature/css/GridPlayground.tsx] — Component implementation

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no issues encountered during implementation.

### Completion Notes List

- Created `generateGridCss()` utility producing 6-line CSS output for grid containers
- Defined `GridContainerProps`, `GridJustifyItems`, `GridAlignItems` types and `DEFAULT_GRID_CONTAINER` constant
- 4 unit tests covering default CSS, custom columns/rows, gap values, and alignment options
- GridPlayground component with live CSS Grid preview using real inline styles, text inputs for columns/rows, range sliders for gap and item count, select dropdowns for alignment, and CSS output with CopyButton
- 10-color palette for numbered grid items
- Tool registered in TOOL_REGISTRY as second CSS category tool (alongside Box Shadow Generator)

### File List

| Status | File | Description |
|--------|------|-------------|
| Created | `src/utils/css-grid.ts` | GridContainerProps, GridJustifyItems, GridAlignItems, DEFAULT_GRID_CONTAINER, generateGridCss |
| Created | `src/utils/css-grid.spec.ts` | 4 unit tests for CSS Grid utilities |
| Created | `src/components/feature/css/GridPlayground.tsx` | CSS Grid Playground component with live preview |
| Modified | `src/components/feature/css/index.ts` | Added GridPlayground export |
| Modified | `src/types/constants/tool-registry.ts` | Added 'css-grid-playground' to ToolRegistryKey |
| Modified | `src/constants/tool-registry.ts` | Added css-grid-playground registry entry |
| Modified | `src/utils/index.ts` | Added css-grid barrel re-export |
| Modified | `vite.config.ts` | Added css-grid-playground pre-render route |

## Senior Developer Review (AI)

**Reviewer:** boengai (backfill review)
**Date:** 2026-02-20
**Verdict:** Done (all issues fixed)

### Findings Fixed

| Severity | Finding | Fix Applied |
|----------|---------|-------------|
| HIGH | Missing prerender route in `vite.config.ts` | Added `/tools/css-grid-playground` prerender route |
| MEDIUM | Unsanitized `columns`/`rows` user input in `generateGridCss` — CSS injection risk via `;{}` chars | Added `sanitizeGridTrack()` helper that strips `;`, `{`, `}`, `\`, `<`, `>` from track values |

### Change Log

- 2026-02-20: Backfill code review — added CSS track sanitization and missing prerender route
