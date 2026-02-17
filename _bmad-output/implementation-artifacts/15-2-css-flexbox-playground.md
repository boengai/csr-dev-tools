---
story: 15.2
title: CSS Flexbox Playground
status: done
epic: 15
---

# Story 15.2: CSS Flexbox Playground

## Story

As a **user**,
I want **to visually configure CSS flexbox properties and see the layout result**,
So that **I can learn and experiment with flexbox without writing code**.

**Epic:** Epic 15 — CSS & Design Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (CopyButton, FieldForm)
**Story Key:** 15-2-css-flexbox-playground

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the CSS Flexbox Playground tool registered in `TOOL_REGISTRY` under the CSS category
**When** the user navigates to it
**Then** it renders inline with container controls, visual preview, and CSS output

### AC2: Container Properties

**Given** the flexbox playground
**When** the user views the interface
**Then** they can configure container properties: flex-direction, justify-content, align-items, flex-wrap, gap

### AC3: Child Item Management

**Given** the child items
**When** the user interacts
**Then** they can add/remove items (3-10) and configure per-item properties (flex-grow, flex-shrink, order)

### AC4: Live Visual Layout

**Given** any property change
**When** the user adjusts a control
**Then** the visual layout updates in real-time
**And** the CSS output for both container and items updates

### AC5: Copy CSS

**Given** the CSS output
**When** CopyButton is clicked
**Then** the complete CSS for the flexbox layout is copied

### AC6: Unit Tests

**Given** unit tests in `src/utils/flexbox.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: container CSS generation, item CSS, multiple items, property variations, defaults

## Tasks / Subtasks

- [x] Task 1: Create flexbox utility functions (AC: #2, #3, #6)
  - [x] 1.1 Create `src/utils/flexbox.ts` with `generateFlexboxCss()`
  - [x] 1.2 Define types: `FlexDirection`, `JustifyContent`, `AlignItems`, `FlexWrap`, `FlexboxContainerProps`, `FlexboxItemProps`
  - [x] 1.3 Export `DEFAULT_CONTAINER` and `DEFAULT_ITEM` constants
  - [x] 1.4 Return `{ containerCss, itemsCss }` with formatted CSS strings

- [x] Task 2: Write unit tests (AC: #6)
  - [x] 2.1 Create `src/utils/flexbox.spec.ts`
  - [x] 2.2 Test default container CSS output
  - [x] 2.3 Test item CSS with non-default values
  - [x] 2.4 Test multiple items output
  - [x] 2.5 Test column direction, space-between, zero gap
  - [x] 2.6 Test DEFAULT_CONTAINER and DEFAULT_ITEM values

- [x] Task 3: Create FlexboxPlayground component (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Create `src/components/feature/css/FlexboxPlayground.tsx` as named export
  - [x] 3.2 Container controls: native `<select>` for direction, justify, align, wrap
  - [x] 3.3 Gap range slider (0-64px) via `FieldForm`
  - [x] 3.4 Item count controls (+/- buttons, 3-10 range)
  - [x] 3.5 Visual preview: colored buttons as flex items, clickable to select
  - [x] 3.6 Per-item controls panel: flex-grow, flex-shrink, order range sliders
  - [x] 3.7 CSS output in `<pre>` block with CopyButton
  - [x] 3.8 Items styled with inline `flexGrow`, `flexShrink`, `order` from state

- [x] Task 4: Register tool and update exports (AC: #1)
  - [x] 4.1 Add `'css-flexbox-playground'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add export to `src/components/feature/css/index.ts`
  - [x] 4.4 Add barrel export to `src/utils/index.ts`

## Dev Notes

### Previous Story Intelligence

From Story 15.1 (CSS Gradient Generator):
- Inline live preview pattern established for CSS tools
- CSS category barrel already has gradient tool
- Synchronous rendering — no debounce needed

### Architecture Pattern

**Inline interactive playground** — most complex UI in the CSS category. Features clickable items that reveal per-item controls, and a live CSS preview area with combined container + item CSS.

### Key Implementation Details

- No external library — pure CSS/DOM manipulation
- `generateFlexboxCss(container, items)` returns `{ containerCss: string, itemsCss: Array<string> }`
- Container CSS includes: display, flex-direction, justify-content, align-items, flex-wrap, gap
- Item CSS includes: flex-grow, flex-shrink, order
- `ITEM_COLORS` array (10 colors) provides visual distinction for flex items
- `selectedItem` state tracks which item's controls to show — clicking same item deselects
- `makeSelect()` helper function reduces repetition for the 4 container property selects
- Full CSS output format: `.container { ... }` + `.item-N { ... }` for each item
- Item buttons use `ring-2 ring-white` to indicate selection

### File Locations

| File | Purpose |
|------|---------|
| `src/utils/flexbox.ts` | `generateFlexboxCss()`, types, defaults |
| `src/utils/flexbox.spec.ts` | 8 unit tests |
| `src/components/feature/css/FlexboxPlayground.tsx` | Component (230 lines) |

## Dev Agent Record

### Completion Notes List

- Created flexbox CSS generation utility with container and per-item CSS output
- FlexboxPlayground component with interactive item selection, property controls, live preview
- 8 unit tests covering CSS generation, property variations, and default values
- Largest component in Epic 15 at 230 lines

### File List

| File | Action |
|------|--------|
| `src/utils/flexbox.ts` | NEW |
| `src/utils/flexbox.spec.ts` | NEW |
| `src/components/feature/css/FlexboxPlayground.tsx` | NEW |
| `src/components/feature/css/index.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/constants/tool-registry.ts` | MODIFIED |
| `vite.config.ts` | MODIFIED |
