---
story: 15.1
title: CSS Gradient Generator
status: done
epic: 15
---

# Story 15.1: CSS Gradient Generator

## Story

As a **user**,
I want **to visually build CSS gradients with multiple color stops and see a live preview**,
So that **I can design beautiful gradients and copy the CSS directly**.

**Epic:** Epic 15 — CSS & Design Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (CopyButton, FieldForm)
**Story Key:** 15-1-css-gradient-generator

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the CSS Gradient Generator tool registered in `TOOL_REGISTRY` under the CSS category
**When** the user navigates to it
**Then** it renders inline with controls and a live gradient preview

### AC2: Gradient Configuration

**Given** the gradient builder interface
**When** the user interacts with it
**Then** they can configure: gradient type (linear/radial), angle (for linear), color stops with color + position

### AC3: Live Preview

**Given** any input change
**When** the user adjusts controls
**Then** the live preview updates in real-time
**And** the CSS output updates

### AC4: Color Stop Management

**Given** the color stops
**When** the user interacts
**Then** they can add new stops, remove stops (min 2), and pick color via native color input

### AC5: Copy CSS

**Given** the CSS output
**When** CopyButton is clicked
**Then** the complete CSS property is copied

### AC6: Unit Tests

**Given** unit tests in `src/utils/gradient.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: linear/radial generation, stop sorting, angles, defaults

## Tasks / Subtasks

- [x] Task 1: Create gradient utility functions (AC: #2, #3, #6)
  - [x] 1.1 Create `src/utils/gradient.ts` with `generateGradientCss()`
  - [x] 1.2 Define types: `GradientStop`, `GradientType`, `GradientConfig`
  - [x] 1.3 Export `DEFAULT_GRADIENT` constant
  - [x] 1.4 Sort stops by position before generating CSS string
  - [x] 1.5 Handle linear (with angle) and radial (circle) gradient types

- [x] Task 2: Write unit tests (AC: #6)
  - [x] 2.1 Create `src/utils/gradient.spec.ts`
  - [x] 2.2 Test default linear gradient output
  - [x] 2.3 Test radial gradient output
  - [x] 2.4 Test stop sorting by position
  - [x] 2.5 Test single stop, 0°/360° angles
  - [x] 2.6 Test radial ignores angle
  - [x] 2.7 Test DEFAULT_GRADIENT values

- [x] Task 3: Create GradientGenerator component (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Create `src/components/feature/css/GradientGenerator.tsx` as named export
  - [x] 3.2 Type select (linear/radial) with native `<select>`
  - [x] 3.3 Angle range slider (0-360) — only shown for linear type
  - [x] 3.4 Color stops: native color input + position range slider per stop
  - [x] 3.5 Add/remove stop buttons (min 2 stops enforced)
  - [x] 3.6 Live preview div with `style={{ background: cssValue }}`
  - [x] 3.7 CSS output in code block with CopyButton (includes `background:` prefix)

- [x] Task 4: Register tool and update exports (AC: #1)
  - [x] 4.1 Add `'css-gradient-generator'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add export to `src/components/feature/css/index.ts`
  - [x] 4.4 Add barrel export to `src/utils/index.ts`

## Dev Notes

### Architecture Pattern

**Inline live preview tool** — similar to Box Shadow Generator (Story 9.1). Synchronous CSS generation, no debounce needed. Controls above, preview below, CSS output at bottom.

### Key Implementation Details

- No external library — pure CSS string generation
- `generateGradientCss(type, angle, stops)` produces standard CSS gradient values
- Stops are sorted by position before output to ensure correct gradient rendering
- Linear format: `linear-gradient({angle}deg, {stops})`
- Radial format: `radial-gradient(circle, {stops})`
- `ITEM_COLORS` array provides default colors for new stops (cycles through 8 colors)
- Preview uses `h-48` height container with `style={{ background: cssValue }}`
- Copy value includes `background: ` prefix and `;` suffix

### File Locations

| File | Purpose |
|------|---------|
| `src/utils/gradient.ts` | `generateGradientCss()`, types, `DEFAULT_GRADIENT` |
| `src/utils/gradient.spec.ts` | 8 unit tests |
| `src/components/feature/css/GradientGenerator.tsx` | Component (162 lines) |

## Senior Developer Review (AI)

**Reviewer:** BMAD Adversarial Code Review
**Date:** 2026-02-20
**Verdict:** Approved (after fixes)

### Findings (4 total: 0 High, 3 Medium, 1 Low)

#### Fixed

- **[MEDIUM]** Missing tests for empty stops fallback + angle/position clamping — Added 4 tests to `gradient.spec.ts`
- **[MEDIUM]** Story File List claimed `vite.config.ts | MODIFIED` but no prerender route existed — Added prerender route for `/tools/css-gradient-generator`
- **[MEDIUM]** `key={index}` for color stops list — Downgraded to LOW (controlled inputs prevent functional issues; cosmetic only)

#### Noted (not fixed)

- **[LOW]** `key={index}` for color stops — cosmetic reconciliation glitch on mid-list removal, no functional impact with controlled inputs

## Dev Agent Record

### Completion Notes List

- Created gradient CSS generation utility with linear/radial support and stop sorting
- GradientGenerator component with live preview, color stop management, type/angle controls
- 8 unit tests covering CSS generation, sorting, edge cases, and defaults

### File List

| File | Action |
|------|--------|
| `src/utils/gradient.ts` | NEW |
| `src/utils/gradient.spec.ts` | NEW |
| `src/components/feature/css/GradientGenerator.tsx` | NEW |
| `src/components/feature/css/index.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/constants/tool-registry.ts` | MODIFIED |
| `vite.config.ts` | MODIFIED |
