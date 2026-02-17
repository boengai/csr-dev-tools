---
story: 19.1
title: CSS Border Radius Generator
status: ready-for-dev
epic: 19
---

# Story 19.1: CSS Border Radius Generator

Status: ready-for-dev

## Story

As a **user**,
I want **to visually configure CSS border-radius with per-corner control and see a live preview**,
So that **I can design rounded corners without guessing pixel values**.

**Epic:** Epic 19 — Developer Reference & Utility Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (CopyButton, FieldForm — complete)
**Story Key:** 19-1-css-border-radius-generator

## Acceptance Criteria

### AC1: Tool Registered and Renders Inline

**Given** the Border Radius Generator tool registered in `TOOL_REGISTRY` under the CSS category
**When** the user navigates to it (via sidebar, command palette, or `/tools/css-border-radius-generator` route)
**Then** it renders inline with input controls and a live preview region
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Per-Corner Radius Controls

**Given** the input controls
**When** the user adjusts them
**Then** four range sliders control each corner: top-left, top-right, bottom-right, bottom-left (0–100px each)
**And** each uses `FieldForm` type="range" with accompanying number input

### AC3: Symmetric Mode (Default)

**Given** symmetric mode is active (default)
**When** the user adjusts any corner slider
**Then** the CSS output uses the standard shorthand (e.g., `border-radius: 10px 20px 30px 40px`)
**And** each value represents the uniform radius per corner

### AC4: Asymmetric Mode (Horizontal/Vertical Per Corner)

**Given** the user enables asymmetric mode via toggle
**When** asymmetric mode is active
**Then** each corner exposes two sliders: horizontal and vertical radius (8 total sliders)
**And** the CSS output uses the 8-value slash syntax (e.g., `border-radius: 10px 20px 30px 40px / 5px 15px 25px 35px`)

### AC5: Live Preview Updates in Real-Time

**Given** any input value changes
**When** the user adjusts a control
**Then** the preview box updates immediately showing the configured border-radius
**And** the CSS output string updates simultaneously
**And** no debounce is needed — computation is synchronous string generation

### AC6: Copy CSS Output

**Given** the CSS output
**When** the user clicks `CopyButton`
**Then** the complete `border-radius` CSS property value is copied to clipboard

### AC7: Sensible Defaults

**Given** the tool loads
**When** the page renders
**Then** all four corners default to 8px so the preview is immediately visible
**And** the preview background defaults to the primary color for visibility
**And** a background color picker allows the user to adjust the preview color

### AC8: Unit Tests Cover CSS String Generation

**Given** unit tests in `src/utils/border-radius.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: symmetric shorthand for all corners equal, all corners different, asymmetric 8-value syntax, zero values, max values, and default config

## Tasks / Subtasks

- [ ] Task 1: Create border-radius utility functions (AC: #3, #4, #5, #7, #8)
  - [ ] 1.1 Create `src/utils/border-radius.ts` with `generateBorderRadiusCss(config: BorderRadiusConfig): string`
  - [ ] 1.2 Define `BorderRadiusConfig` type with per-corner horizontal/vertical values and asymmetric flag
  - [ ] 1.3 Define `DEFAULT_BORDER_RADIUS` constant with all corners at 8px
  - [ ] 1.4 Implement symmetric shorthand: `border-radius: TL TR BR BL`
  - [ ] 1.5 Implement asymmetric 8-value syntax: `border-radius: TLh TRh BRh BLh / TLv TRv BRv BLv`
  - [ ] 1.6 Optimize output: collapse to single value when all corners are equal
  - [ ] 1.7 Export `generateBorderRadiusCss`, `BorderRadiusConfig`, `DEFAULT_BORDER_RADIUS`

- [ ] Task 2: Write unit tests for border-radius utilities (AC: #8)
  - [ ] 2.1 Create `src/utils/border-radius.spec.ts`
  - [ ] 2.2 Test default config produces `8px`
  - [ ] 2.3 Test all corners same value collapses to single value: `10px`
  - [ ] 2.4 Test all corners different: `10px 20px 30px 40px`
  - [ ] 2.5 Test two-value shorthand when TL=BR and TR=BL: `10px 20px`
  - [ ] 2.6 Test asymmetric mode: `10px 20px 30px 40px / 5px 15px 25px 35px`
  - [ ] 2.7 Test zero values: `0px`
  - [ ] 2.8 Test max values: `100px`
  - [ ] 2.9 Test mixed asymmetric where horizontal equals vertical collapses slash syntax
  - [ ] 2.10 Test asymmetric with all same horizontal and vertical: `10px / 5px`

- [ ] Task 3: Create BorderRadiusGenerator component (AC: #1, #2, #3, #4, #5, #6, #7)
  - [ ] 3.1 Create `src/components/feature/css/BorderRadiusGenerator.tsx` as named export
  - [ ] 3.2 Render inline layout following BoxShadowGenerator pattern:
    - **Top:** Tool description from registry
    - **Controls:** 4 range sliders (symmetric) or 8 range sliders (asymmetric) via `FieldForm` type="range"
    - **Divider:** `border-t-2 border-dashed border-gray-900`
    - **Preview:** Box element with applied border-radius + CSS output + `CopyButton`
  - [ ] 3.3 Use `useState` for all radius properties, initialized from `DEFAULT_BORDER_RADIUS`
  - [ ] 3.4 Add asymmetric mode toggle using `aria-pressed` button (FlagToggle pattern)
  - [ ] 3.5 Compute CSS string on every render via `generateBorderRadiusCss()` — no debounce
  - [ ] 3.6 Apply border-radius to preview box via inline `style={{ borderRadius: cssValue }}`
  - [ ] 3.7 Add preview background color picker (default primary/branded color)
  - [ ] 3.8 CSS output in monospace code block with `CopyButton`
  - [ ] 3.9 Show tool description from `TOOL_REGISTRY_MAP['css-border-radius-generator']`

- [ ] Task 4: Register tool in TOOL_REGISTRY (AC: #1)
  - [ ] 4.1 Add `'css-border-radius-generator'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts`
  - [ ] 4.2 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts` (alphabetically)
  - [ ] 4.3 Add pre-render route in `vite.config.ts` toolRoutes array

- [ ] Task 5: Create barrel exports (AC: #1)
  - [ ] 5.1 Add `export { BorderRadiusGenerator } from './BorderRadiusGenerator'` to `src/components/feature/css/index.ts`
  - [ ] 5.2 Add `export * from './border-radius'` to `src/utils/index.ts`

- [ ] Task 6: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [ ] 6.1 Run `pnpm lint` — no errors
  - [ ] 6.2 Run `pnpm format:check` — no formatting issues
  - [ ] 6.3 Run `pnpm test` — all tests pass
  - [ ] 6.4 Run `pnpm build` — build succeeds, tool chunk is separate

## Dev Notes

### Processing Pattern — Synchronous, No Debounce

Identical to BoxShadowGenerator: pure synchronous string generation from config state. No async, no debounce, no external libraries.

### UI Layout (Inline)

```
┌──────────────────────────────────────────────────────────────────┐
│  Visually configure CSS border-radius with per-corner control... │
│                                                                  │
│  ┌─── Controls ─────────────────────────────────────────────┐    │
│  │ Top Left      [────────●──────] [0 ← 8 → 100]           │    │
│  │ Top Right     [────────●──────] [0 ← 8 → 100]           │    │
│  │ Bottom Right  [────────●──────] [0 ← 8 → 100]           │    │
│  │ Bottom Left   [────────●──────] [0 ← 8 → 100]           │    │
│  │                                                           │    │
│  │ Asymmetric: [ OFF ]                                       │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ──────────── dashed divider ─────────────                       │
│                                                                  │
│  ┌─── Preview ──────────────────────── [BG 🎨] ─────────────┐   │
│  │    ┌─────────────────────────┐                            │    │
│  │    │      Preview Box        │ ← border-radius visible    │    │
│  │    └─────────────────────────┘                            │    │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  CSS Output                                        [Copy]        │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ border-radius: 8px;                                       │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Config State Shape

```typescript
type BorderRadiusConfig = {
  asymmetric: boolean
  topLeft: number
  topRight: number
  bottomRight: number
  bottomLeft: number
  topLeftV: number     // vertical (only used in asymmetric mode)
  topRightV: number
  bottomRightV: number
  bottomLeftV: number
}
```

### Slider Configuration

| Property | Label | Min | Max | Step | Default | Unit |
|----------|-------|-----|-----|------|---------|------|
| topLeft | Top Left | 0 | 100 | 1 | 8 | px |
| topRight | Top Right | 0 | 100 | 1 | 8 | px |
| bottomRight | Bottom Right | 0 | 100 | 1 | 8 | px |
| bottomLeft | Bottom Left | 0 | 100 | 1 | 8 | px |
| *V variants | (same labels + " V") | 0 | 100 | 1 | 8 | px |

### Architecture Compliance

- **Named export only** — `export const BorderRadiusGenerator`
- **Lazy-loaded** — registry uses `lazy(() => import(...).then(...))`
- **100% client-side** — zero network requests, pure CSS string generation
- **No new dependencies** — all computation is string manipulation
- **aria-pressed toggle** — asymmetric toggle uses `aria-pressed`
- **Follow BoxShadowGenerator pattern** exactly for layout, FieldForm usage, preview region

### Project Structure Notes

- CSS category and directory already exist from Story 9.1
- No new category setup needed — just add the tool to existing CSS category
- Barrel export in `src/components/feature/css/index.ts` already exists — append new export

### References

- [Source: src/utils/box-shadow.ts] — Similar utility pattern (pure function, config → CSS string)
- [Source: src/components/feature/css/BoxShadowGenerator.tsx] — UI pattern to follow (inline, FieldForm range, preview)
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey union to update
- [Source: src/constants/tool-registry.ts] — TOOL_REGISTRY array and CATEGORY_ORDER
- [Source: _bmad-output/planning-artifacts/epics-expansion.md#Story 19.1] — Epic definition

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/utils/border-radius.ts` | NEW | BorderRadiusConfig type, DEFAULT_BORDER_RADIUS, generateBorderRadiusCss() |
| `src/utils/border-radius.spec.ts` | NEW | Unit tests for border-radius utilities (~10 tests) |
| `src/components/feature/css/BorderRadiusGenerator.tsx` | NEW | Border Radius Generator component |
| `src/types/constants/tool-registry.ts` | MODIFY | Add 'css-border-radius-generator' to ToolRegistryKey |
| `src/constants/tool-registry.ts` | MODIFY | Add registry entry to TOOL_REGISTRY |
| `src/components/feature/css/index.ts` | MODIFY | Add BorderRadiusGenerator barrel export |
| `src/utils/index.ts` | MODIFY | Add border-radius barrel export |
| `vite.config.ts` | MODIFY | Add pre-render route |

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log
