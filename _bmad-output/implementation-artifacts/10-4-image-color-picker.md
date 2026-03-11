---
story: 18.4
title: Image Color Picker
status: done
epic: 18
---

# Story 18.4: Image Color Picker

Status: done

## Story

As a **user**,
I want **to upload an image and click on it to extract colors in HEX, RGB, and HSL formats**,
So that **I can sample colors from designs, screenshots, or photos**.

**Epic:** Epic 18 — Developer Productivity Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (Button, CopyButton, Dialog — complete)
**Story Key:** 18-4-image-color-picker

## Acceptance Criteria

### AC1: Tool Registered and Renders with Dialog

**Given** the Image Color Picker tool registered in `TOOL_REGISTRY` under the Image category
**When** the user navigates to it (via sidebar, command palette, or `/tools/image-color-picker` route)
**Then** it renders inline with a description and a button to open the full-screen dialog
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Image Upload via File Input

**Given** the dialog is open
**When** the user selects an image file via `<input type="file" accept="image/*">`
**Then** the image is drawn onto a hidden `<canvas>` element at its natural dimensions
**And** the canvas is displayed with crosshair cursor for color picking
**And** image data is loaded entirely client-side via `URL.createObjectURL`

### AC3: Click to Pick Color

**Given** an image is loaded on the canvas
**When** the user clicks on the canvas
**Then** the pixel color at the click position is extracted via `getImageData`
**And** the color is added to the palette (prepended, max 10 colors)
**And** the color is displayed in HEX, RGB, and HSL formats

### AC4: Hover Color Preview

**Given** an image is loaded on the canvas
**When** the user moves the mouse over the canvas
**Then** a live preview shows the color under the cursor with its HEX value
**And** the preview updates in real-time as the cursor moves

### AC5: Color Palette with Copy

**Given** colors have been picked
**When** the palette is displayed
**Then** each color shows a swatch, HEX value with `CopyButton`, RGB value with `CopyButton`, and HSL value with `CopyButton`
**And** the palette shows a count indicator (e.g., "Palette (3/10)")
**And** a "Clear Palette" button removes all picked colors

### AC6: Canvas Coordinate Scaling

**Given** the canvas is displayed at a CSS size different from its natural pixel dimensions
**When** the user clicks or hovers
**Then** coordinates are correctly scaled using `canvas.width / rect.width` and `canvas.height / rect.height` ratios
**And** the correct pixel is sampled regardless of display scaling

### AC7: Unit Tests Cover Color Conversion

**Given** unit tests in `src/utils/color-picker.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: RGB to HEX conversion (red, blue-mix, black, white), RGB to HSL conversion (red, black, white), and `pixelToColor` returning all three formats

### AC8: Dialog Reset on Close

**Given** the dialog is open with an image loaded and colors picked
**When** the dialog is closed
**Then** the image URL is revoked via `URL.revokeObjectURL` to free memory
**And** all state (imageUrl, palette, hoverColor) is reset

## Tasks / Subtasks

- [x] Task 1: Create color picker utility functions (AC: #3, #7)
  - [x] 1.1 Create `src/utils/color-picker.ts` with `pixelToColor(r: number, g: number, b: number): PickedColor`
  - [x] 1.2 Define `PickedColor` type with `hex`, `rgb`, `hsl` string fields
  - [x] 1.3 Implement `rgbToHex(r, g, b)` — convert RGB values to `#rrggbb` hex string
  - [x] 1.4 Implement `rgbToHsl(r, g, b)` — convert RGB to `hsl(H S% L%)` format (modern CSS syntax, no commas)
  - [x] 1.5 Export `pixelToColor`, `PickedColor`, `rgbToHex`, `rgbToHsl`

- [x] Task 2: Write unit tests for color picker utilities (AC: #7)
  - [x] 2.1 Create `src/utils/color-picker.spec.ts`
  - [x] 2.2 Test `rgbToHex` with red (#ff0000), blue-mix (#0080ff), black (#000000), white (#ffffff)
  - [x] 2.3 Test `rgbToHsl` with red (hsl(0 100% 50%)), black (hsl(0 0% 0%)), white (hsl(0 0% 100%))
  - [x] 2.4 Test `pixelToColor` returns all three formats for a sample color

- [x] Task 3: Create ImageColorPicker component (AC: #1, #2, #3, #4, #5, #6, #8)
  - [x] 3.1 Create `src/components/feature/image/ImageColorPicker.tsx` as named export
  - [x] 3.2 Render inline layout with tool description and "Open Color Picker" button
  - [x] 3.3 Implement full-screen `Dialog` with `size="screen"` for the picker workspace
  - [x] 3.4 Add `<input type="file" accept="image/*">` with styled file input
  - [x] 3.5 On file select: create object URL, load into `Image`, draw onto `<canvas>` at natural dimensions
  - [x] 3.6 Implement `getColorAt(e)` — scale mouse coordinates to canvas coordinates, read pixel via `getImageData`
  - [x] 3.7 Implement click handler — add picked color to palette (prepend, max 10 via `.slice(0, 10)`)
  - [x] 3.8 Implement mousemove handler — update `hoverColor` state for live preview
  - [x] 3.9 Display hover preview: color swatch + HEX value below canvas
  - [x] 3.10 Display palette: count indicator, color cards with swatch and HEX/RGB/HSL + CopyButton for each
  - [x] 3.11 Add "Clear Palette" button
  - [x] 3.12 Implement `handleReset()` — revoke object URL, clear all state on dialog close
  - [x] 3.13 Use `useRef` for canvas and img elements
  - [x] 3.14 Use `useCallback` for file change, getColorAt, canvas click, and canvas move handlers
  - [x] 3.15 Support `autoOpen` and `onAfterDialogClose` props from `ToolComponentProps`

- [x] Task 4: Add to type system (AC: #1)
  - [x] 4.1 Add `'image-color-picker'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts`

- [x] Task 5: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 5.1 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts` with category `'Image'`, emoji `'🎯'`, lazy-loaded component
  - [x] 5.2 Add pre-render route in `vite.config.ts` toolRoutes array

- [x] Task 6: Create barrel exports (AC: #1)
  - [x] 6.1 Create `src/components/feature/image/index.ts` with `export { ImageColorPicker } from './ImageColorPicker'`
  - [x] 6.2 Add `export * from './image'` to `src/components/feature/index.ts`
  - [x] 6.3 Add `export * from './color-picker'` to `src/utils/index.ts`

- [x] Task 7: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [x] 7.1 Run `pnpm lint` — no errors
  - [x] 7.2 Run `pnpm test` — all tests pass (4 new tests)
  - [x] 7.3 Run `pnpm build` — build succeeds, tool chunk is separate

## Dev Notes

### Processing Pattern — Canvas-Based, Event-Driven

Unlike text-processing tools that debounce input, the Image Color Picker uses **Canvas API direct pixel access**:

| Aspect | Image Color Picker | JSON to TS (18-1) |
|--------|-------------------|-------------------|
| Layout | Dialog (`size="screen"`) | Dialog (`size="screen"`) |
| Input | File upload → Canvas | Textarea |
| Trigger | Click / Mousemove events | On-change (debounced) |
| Processing | `getImageData` pixel read | `JSON.parse` + recursive walk |
| Output | Multi-format color values | TypeScript code |

### Canvas Coordinate Scaling

Critical for correct color picking — the canvas CSS display size differs from its pixel dimensions:

```typescript
const scaleX = canvas.width / rect.width
const scaleY = canvas.height / rect.height
const x = Math.floor((e.clientX - rect.left) * scaleX)
const y = Math.floor((e.clientY - rect.top) * scaleY)
```

Without scaling, picks would be offset, especially for large images displayed in a smaller container.

### HSL Format

Uses modern CSS HSL syntax without commas: `hsl(0 100% 50%)` — matches CSS Color Level 4 specification. The `rgbToHsl` function implements the standard RGB→HSL conversion algorithm.

### Memory Management

Object URLs created via `URL.createObjectURL` are explicitly revoked on dialog close to prevent memory leaks. This is especially important for large images.

### Previous Story Intelligence

From Story 18-3 (CSS Grid Playground):
- **Inline-to-dialog pattern** established — card shows description + button, dialog opens full workspace
- **`useCallback` for event handlers** — important for canvas events to avoid re-rendering overhead

From Story 18-1 (JSON to TypeScript):
- **Dialog `size="screen"`** pattern with `autoOpen` and `onAfterDialogClose` props confirmed
- **Reset on dialog close** pattern — clear all state in `onAfterClose` callback

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion.md#Story 18.4] — Story requirements
- [Source: src/utils/color-picker.ts] — Color conversion utility implementation
- [Source: src/components/feature/image/ImageColorPicker.tsx] — Component implementation

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no issues encountered during implementation.

### Completion Notes List

- Created `pixelToColor()`, `rgbToHex()`, and `rgbToHsl()` color conversion utilities
- `PickedColor` type provides HEX, RGB, and HSL string formats from raw pixel RGB values
- 4 unit tests covering RGB→HEX (4 colors), RGB→HSL (3 colors), and `pixelToColor` multi-format output
- ImageColorPicker component with dialog-based layout, file upload, Canvas API pixel reading, coordinate scaling, hover preview, 10-color palette with CopyButton for each format, and memory-safe cleanup
- Used `useRef` (canvas, img), `useCallback` (4 handlers), and `useState` (4 state values)
- Tool registered in TOOL_REGISTRY with lazy-loaded Image category entry

### File List

| Status | File | Description |
|--------|------|-------------|
| Created | `src/utils/color-picker.ts` | PickedColor type, rgbToHex, rgbToHsl, pixelToColor |
| Created | `src/utils/color-picker.spec.ts` | 4 unit tests for color picker utilities |
| Created | `src/components/feature/image/ImageColorPicker.tsx` | Image Color Picker component with dialog and Canvas API |
| Created | `src/components/feature/image/index.ts` | Image feature barrel export |
| Modified | `src/types/constants/tool-registry.ts` | Added 'image-color-picker' to ToolRegistryKey |
| Modified | `src/constants/tool-registry.ts` | Added image-color-picker registry entry |
| Modified | `src/components/feature/index.ts` | Added image barrel re-export |
| Modified | `src/utils/index.ts` | Added color-picker barrel re-export |
| Modified | `vite.config.ts` | Added image-color-picker pre-render route |

## Senior Developer Review (AI)

**Reviewer:** csrteam (backfill review)
**Date:** 2026-02-20
**Verdict:** Done (all issues fixed)

### Findings Fixed

| Severity | Finding | Fix Applied |
|----------|---------|-------------|
| HIGH | Memory leak — `URL.createObjectURL` blob URLs never revoked when selecting a new file (only on dialog close) | Added `if (imageUrl) URL.revokeObjectURL(imageUrl)` before creating new URL, added `imageUrl` to `useCallback` deps |
| HIGH | Missing barrel export for `ImageColorPicker` in `image/index.ts` | Added `export * from './ImageColorPicker'` in alphabetical order |
| HIGH | Missing prerender route in `vite.config.ts` | Added `/tools/image-color-picker` prerender route |

### Change Log

- 2026-02-20: Backfill code review — fixed object URL memory leak, stale closure in handleFileChange, added missing barrel export and prerender route
