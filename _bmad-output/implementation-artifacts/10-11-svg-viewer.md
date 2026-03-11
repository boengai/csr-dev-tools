---
story: 15.3
title: SVG Viewer/Optimizer
status: done
epic: 15
---

# Story 15.3: SVG Viewer/Optimizer

## Story

As a **user**,
I want **to paste SVG code, see a live preview, and optimize the SVG**,
So that **I can inspect, debug, and reduce SVG file size**.

**Epic:** Epic 15 — CSS & Design Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (CopyButton, FieldForm, Button)
**Story Key:** 15-3-svg-viewer

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the SVG Viewer tool registered in `TOOL_REGISTRY` under the Image category
**When** the user navigates to it
**Then** it renders with a card button to open the full-screen dialog

### AC2: Live SVG Preview

**Given** the user pastes SVG code
**When** valid SVG is entered
**Then** a live preview renders the SVG
**And** file size is displayed

### AC3: SVG Optimization

**Given** an "Optimize" button
**When** clicked
**Then** the SVG is optimized (remove metadata, comments, unnecessary attributes)
**And** original vs optimized size is shown with savings percentage

### AC4: Download

**Given** the SVG (original or optimized)
**When** the user clicks "Download"
**Then** the SVG downloads as a `.svg` file

### AC5: Copy Output

**Given** the optimized SVG
**When** CopyButton is clicked
**Then** the SVG code is copied

### AC6: Security — SVG Sanitization

**Given** SVG with malicious content (scripts, event handlers, foreignObject)
**When** rendered
**Then** dangerous elements are stripped before preview

### AC7: Unit Tests

**Given** unit tests in `src/utils/svg-optimize.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: sanitization, optimization, size reporting, edge cases

## Tasks / Subtasks

- [x] Task 1: Create SVG optimization utilities (AC: #3, #6, #7)
  - [x] 1.1 Create `src/utils/svg-optimize.ts` with `optimizeSvg()` and `sanitizeSvg()`
  - [x] 1.2 Define `SvgOptimizeResult` type
  - [x] 1.3 `sanitizeSvg()`: strip scripts, event handlers, foreignObject
  - [x] 1.4 `optimizeSvg()`: remove XML declaration, comments, metadata, empty attributes, collapse whitespace
  - [x] 1.5 Calculate original/optimized sizes and savings percentage

- [x] Task 2: Write unit tests (AC: #7)
  - [x] 2.1 Create `src/utils/svg-optimize.spec.ts`
  - [x] 2.2 Test sanitization: script tags, self-closing scripts, event handlers, foreignObject, safe content preservation
  - [x] 2.3 Test optimization: XML declaration, comments, metadata, empty attributes, whitespace
  - [x] 2.4 Test size reporting with savings percentage
  - [x] 2.5 Test empty string handling

- [x] Task 3: Create SvgViewer component (AC: #1, #2, #3, #4, #5, #6)
  - [x] 3.1 Create `src/components/feature/image/SvgViewer.tsx` as named export
  - [x] 3.2 Dialog-based layout with SVG code input on left, preview on right
  - [x] 3.3 Optimize button triggers `optimizeSvg()` and updates source
  - [x] 3.4 Download button creates Blob URL and triggers download
  - [x] 3.5 Preview uses `dangerouslySetInnerHTML` with sanitized SVG on white background
  - [x] 3.6 Size display below preview
  - [x] 3.7 Optimization stats panel (original/optimized/saved) shown after optimize

- [x] Task 4: Register tool and update exports (AC: #1)
  - [x] 4.1 Add `'svg-viewer'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add export to `src/components/feature/image/index.ts`
  - [x] 4.4 Add barrel export to `src/utils/index.ts`

## Dev Notes

### Previous Story Intelligence

From Story 15.2 (CSS Flexbox Playground):
- CSS category complete after this story; this one goes in Image category
- Dialog-based layout used here (vs inline for other CSS tools)

### Architecture Pattern

**Dialog-based viewer/optimizer** — combines preview, optimization, and download. SVG is sanitized before preview rendering, optimized on button click (not live). Uses custom regex-based optimization (not SVGO library).

### Key Implementation Details

- No external library — custom regex-based SVG optimization
- `sanitizeSvg()` strips: `<script>`, self-closing `<script/>`, `on*` event handlers, `<foreignObject>`
- `optimizeSvg()` strips: XML declarations, comments, `<metadata>`, empty `class=""`/`id=""` attributes, excess whitespace
- Size calculated via `new Blob([svg]).size`
- Savings format: `"{bytes} bytes ({percentage}% reduction)"`
- Preview container uses white background for SVG visibility
- Download creates temporary Blob URL via `URL.createObjectURL`
- Debounced preview update (300ms) but optimize is button-triggered
- Optimize replaces source with optimized version (destructive)

### File Locations

| File | Purpose |
|------|---------|
| `src/utils/svg-optimize.ts` | `optimizeSvg()`, `sanitizeSvg()`, `SvgOptimizeResult` type |
| `src/utils/svg-optimize.spec.ts` | 12 unit tests |
| `src/components/feature/image/SvgViewer.tsx` | Component (136 lines) |

## Senior Developer Review (AI)

**Reviewer:** BMAD Adversarial Code Review
**Date:** 2026-02-20
**Verdict:** Approved (after fixes)

### Findings (5 total: 1 High, 3 Medium, 1 Low)

#### Fixed

- **[HIGH]** SVG sanitizer bypass via `<set attributeName="href" to="javascript:...">` — Added regex to strip `<set>/<animate>` elements targeting `href`/`xlink:href` attributeName
- **[MEDIUM]** Zero test coverage for regression-fix sanitization rules — Added 7 tests covering `javascript:` URI stripping, `<set>/<animate>` sanitization, `<use>` external ref stripping, and local fragment preservation
- **[MEDIUM]** Story File List claimed `vite.config.ts | MODIFIED` but no prerender route existed — Added prerender route for `/tools/svg-viewer`
- **[MEDIUM]** `URL.revokeObjectURL` called synchronously after `a.click()` — Wrapped in `setTimeout` (100ms) to ensure download completes

#### Noted (not fixed)

- **[LOW]** No max input size guard — large SVGs could freeze browser during regex processing

## Dev Agent Record

### Completion Notes List

- Created SVG sanitization and optimization utilities with size reporting
- SvgViewer component with live preview, optimize button, download, and size stats
- 12 unit tests covering sanitization (5 tests), optimization (6 tests), and edge cases

### File List

| File | Action |
|------|--------|
| `src/utils/svg-optimize.ts` | NEW |
| `src/utils/svg-optimize.spec.ts` | NEW |
| `src/components/feature/image/SvgViewer.tsx` | NEW |
| `src/components/feature/image/index.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/constants/tool-registry.ts` | MODIFIED |
| `vite.config.ts` | MODIFIED |
