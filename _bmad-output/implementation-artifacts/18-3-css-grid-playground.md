---
story: 18.3
title: CSS Grid Playground
status: done
epic: 18
---

# Story 18.3: CSS Grid Playground

## Tool Metadata
- **Key:** `css-grid-playground`
- **Name:** Grid Playground
- **Category:** CSS
- **Emoji:** 🔲
- **Route:** `/tools/css-grid-playground`
- **SEO Title:** CSS Grid Playground - CSR Dev Tools
- **SEO Description:** Visual CSS Grid layout builder. Experiment with grid properties and copy the CSS.

## Acceptance Criteria

**Given** the user opens the Grid Playground
**When** the default state loads
**Then** a 3-column, 2-row grid with 6 colored items is displayed

**Given** the user changes grid-template-columns or grid-template-rows
**When** the values are entered
**Then** the grid updates in real-time with the new layout

**Given** the user adjusts the gap slider
**When** changed
**Then** the grid gap updates visually

**Given** the user changes justify-items or align-items
**When** selected
**Then** the grid items reposition according to the selected alignment

**Given** the user adjusts the item count slider
**When** changed
**Then** items are added/removed from the grid (1-12)

**Given** any property is changed
**When** changed
**Then** the generated CSS text updates and is copyable

## Previous Story Intelligence (from 18.1, 18.2)
- Follow FlexboxPlayground pattern exactly — inline, no dialog, select inputs for enums
- CopyButton on CSS output section

## Implementation Checklist
1. [x] Create `src/utils/css-grid.ts` with `generateGridCss()`, `GridContainerProps`, defaults
2. [x] Create `src/utils/css-grid.spec.ts` — 4 tests
3. [x] Create `src/components/feature/css/GridPlayground.tsx` — inline with live preview
4. [x] Register in `TOOL_REGISTRY`
5. [x] Add `'css-grid-playground'` to `ToolRegistryKey` union
6. [x] Export from `src/utils/index.ts`

## File List
| File | Action |
|------|--------|
| `src/utils/css-grid.ts` | NEW |
| `src/utils/css-grid.spec.ts` | NEW |
| `src/components/feature/css/GridPlayground.tsx` | NEW |
| `src/constants/tool-registry.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |

## Unit Tests
- 4 tests, all passing
- Covers: default CSS output, custom columns/rows, gap values, alignment options
