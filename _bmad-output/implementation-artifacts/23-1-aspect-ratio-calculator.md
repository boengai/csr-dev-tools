# Story 23.1: Aspect Ratio Calculator

Status: done

## Story

As a **designer/developer**,
I want **to calculate dimensions while preserving aspect ratios and convert between common ratios**,
So that **I can quickly determine correct dimensions for responsive layouts, images, and video embeds**.

## Acceptance Criteria

1. Given the user enters a width and selects an aspect ratio preset (e.g., 16:9), when either value changes, then the corresponding height is calculated and displayed in real-time (debounced 300ms).
2. Given the user enters width and height values, when values are entered, then the simplified aspect ratio is calculated and displayed (e.g., 1920x1080 -> 16:9).
3. Given common preset ratios (16:9, 4:3, 1:1, 21:9, 9:16), when the user selects a preset, then the ratio is applied and dimensions recalculated based on whichever dimension was last edited.
4. Given the user locks one dimension, when changing the ratio, then only the unlocked dimension updates.
5. Given each calculated output, when displayed, then a CopyButton is adjacent to copy the value.
6. Given invalid input (non-numeric, negative, zero), when entered, then an inline error toast appears with actionable guidance (e.g., "Enter a valid width (e.g., 1920)").
7. Given empty input, when a field is cleared, then dependent output fields clear without error.

## Tasks / Subtasks

- [x] Task 1: Add `aspect-ratio-calculator` to `ToolRegistryKey` union type (AC: all)
  - [x] Edit `src/types/constants/tool-registry.ts` — add `'aspect-ratio-calculator'` to the `ToolRegistryKey` union in alphabetical position
- [x] Task 2: Add registry entry to TOOL_REGISTRY (AC: all)
  - [x] Edit `src/constants/tool-registry.ts` — add entry in alphabetical position within the array with category `'Unit'`, emoji `'📐'`, key `'aspect-ratio-calculator'`
  - [x] Add prerender route to `vite.config.ts` `toolRoutes` array (alphabetical, must match SEO fields exactly)
- [x] Task 3: Create utility functions `src/utils/aspect-ratio.ts` (AC: 1, 2, 3, 4)
  - [x] `simplifyRatio(width, height)` — returns simplified ratio string (e.g., "16:9") using GCD
  - [x] `calculateDimension(known, ratioW, ratioH, solveFor)` — calculates the missing dimension
  - [x] `parseRatio(input)` — parses "16:9" or "1.778" format into { w, h } numeric pair
  - [x] Export from `src/utils/index.ts` barrel
- [x] Task 4: Create unit tests `src/utils/aspect-ratio.spec.ts` (AC: 1, 2, 6, 7)
  - [x] simplifyRatio: 1920x1080->16:9, 800x600->4:3, 1000x1000->1:1, prime dimensions, zero, negative
  - [x] calculateDimension: known width + ratio -> height, known height + ratio -> width, edge cases
  - [x] parseRatio: colon format "16:9", decimal format "1.778", invalid formats, zero ratio
- [x] Task 5: Create component `src/components/feature/unit/AspectRatioCalculator.tsx` (AC: 1-7)
  - [x] Follow `UnitPxToRem.tsx` pattern exactly — useState, useDebounceCallback (300ms), useToast, FieldForm, CopyButton
  - [x] Width and Height inputs as text type (not number — match existing pattern)
  - [x] Ratio input field with preset select (Radix Select or simple presets row)
  - [x] `aria-live="polite"` on output container
  - [x] Tool description from `TOOL_REGISTRY_MAP['aspect-ratio-calculator']`
- [x] Task 6: Update barrel exports (AC: all)
  - [x] Add `export * from './AspectRatioCalculator'` to `src/components/feature/unit/index.ts`
- [x] Task 7: Create E2E test `e2e/aspect-ratio-calculator.spec.ts` (AC: 1-7)
  - [x] Navigate to `/tools/aspect-ratio-calculator`
  - [x] Test width+ratio -> height calculation
  - [x] Test width+height -> ratio calculation
  - [x] Test preset selection
  - [x] Test CopyButton toast

## Dev Notes

### Architecture Compliance

- **Category:** `'Unit'` — same category as PX-to-REM converter. No "Design" category exists in `ToolCategory` union.
- **Component location:** `src/components/feature/unit/AspectRatioCalculator.tsx`
- **Utility location:** `src/utils/aspect-ratio.ts` with co-located `aspect-ratio.spec.ts`
- **No external libraries needed** — pure JavaScript math (GCD algorithm, division)
- **100% client-side** — zero network requests (NFR9)
- **Named export only** — `export const AspectRatioCalculator` (never default export)

### Reference Implementation: UnitPxToRem.tsx

The closest existing tool is `src/components/feature/unit/UnitPxToRem.tsx` (128 lines). Copy its exact patterns:

```typescript
// 1. Imports — external first, then type imports, then @/ imports
import { useState } from 'react'
import { CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { simplifyRatio, calculateDimension, parseRatio } from '@/utils'

// 2. Tool entry lookup
const toolEntry = TOOL_REGISTRY_MAP['aspect-ratio-calculator']

// 3. Named export component
export const AspectRatioCalculator = () => {
  // useState for inputs, useToast for errors, useDebounceCallback(fn, 300) for real-time calc
  const showError = (label: string) => toast({ action: 'add', item: { label, type: 'error' } })
  // ...
}
```

### Existing Aspect Ratio Code — DO NOT DUPLICATE

`src/utils/crop.ts` already has `ASPECT_RATIO_OPTIONS` and `getAspectRatio()` for the Image Cropper. **Do NOT import or reuse these** — they are tightly coupled to the crop feature with `CropRegion` types. Create fresh, standalone utility functions in `aspect-ratio.ts` that serve this calculator's specific needs (ratio simplification, dimension calculation, ratio parsing).

### Registry Entry Pattern

```typescript
{
  category: 'Unit',
  component: lazy(() =>
    import('@/components/feature/unit/AspectRatioCalculator').then(
      ({ AspectRatioCalculator }: { AspectRatioCalculator: ComponentType }) => ({
        default: AspectRatioCalculator,
      }),
    ),
  ),
  description: 'Calculate dimensions while preserving aspect ratios. Convert between common ratios.',
  emoji: '📐',
  key: 'aspect-ratio-calculator',
  name: 'Aspect Ratio Calculator',
  routePath: '/tools/aspect-ratio-calculator',
  seo: {
    description: 'Calculate image and video dimensions based on aspect ratio. Free online aspect ratio calculator.',
    title: 'Aspect Ratio Calculator - CSR Dev Tools',
  },
}
```

### Prerender Route (vite.config.ts)

Add to `toolRoutes` array in alphabetical position by path. Must match SEO fields exactly:

```typescript
{
  description: 'Calculate image and video dimensions based on aspect ratio. Free online aspect ratio calculator.',
  path: '/tools/aspect-ratio-calculator',
  title: 'Aspect Ratio Calculator - CSR Dev Tools',
  url: '/tools/aspect-ratio-calculator',
},
```

### Input Processing Pattern

- **Trigger:** On input change (text conversion tool pattern)
- **Debounce:** 300ms via `useDebounceCallback`
- **Empty input:** Clear dependent fields, no error
- **Invalid input:** `toast({ action: 'add', item: { label: msg, type: 'error' } })`
- **Inputs use `type="text"`** not `type="number"` — consistent with UnitPxToRem pattern

### Preset Ratios

Common presets to offer (expanding on crop.ts presets):
- 16:9 (widescreen video)
- 4:3 (classic TV/photo)
- 1:1 (square/social)
- 21:9 (ultrawide)
- 9:16 (vertical/mobile video)

Implement as clickable buttons or a Radix Select dropdown. When selected, parse ratio and recalculate the unlocked dimension.

### GCD Algorithm for Ratio Simplification

```typescript
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
// Usage: gcd(1920, 1080) => 120, so 1920/120 : 1080/120 = 16:9
```

Handle edge cases:
- Non-integer dimensions: round before GCD, or display decimal ratio
- Very large GCD results (e.g., 1921x1081 -> 1921:1081) — consider displaying as decimal ratio instead
- Zero dimensions: return empty, no error

### Testing Standards

- **Vitest 4** with globals (`describe`, `it`, `expect` — no imports needed)
- **Test environment:** `node` (not jsdom)
- **No mocking** — pure function tests
- **Co-located:** `src/utils/aspect-ratio.spec.ts`
- **Nested describe blocks:** outer for module, inner for function

### WCAG Accessibility

- `aria-live="polite"` on the output/calculation container
- All inputs have visible labels via `FieldForm` `label` prop
- `role="alert"` on errors (handled by toast system)
- Keyboard accessible — all inputs and buttons reachable via Tab

### Code Style Reminders

- No semicolons, single quotes, trailing commas
- `type` not `interface`, `Array<T>` not `T[]`
- `import type` for type-only imports
- `@/` path alias for all src imports
- 120 char line width
- Let TypeScript infer where possible

### Project Structure Notes

- Component goes in existing `src/components/feature/unit/` alongside `UnitPxToRem.tsx`
- Types for utility functions go in `src/types/utils/aspect-ratio.ts` if needed (only if complex types emerge)
- Barrel export in `src/components/feature/unit/index.ts` — add alphabetically
- Utility barrel export in `src/utils/index.ts` — add alphabetically

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion-3.md#Story 23.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns]
- [Source: _bmad-output/project-context.md#Technology Stack]
- [Source: src/components/feature/unit/UnitPxToRem.tsx] — primary component reference
- [Source: src/utils/crop.ts] — existing aspect ratio code (DO NOT reuse, create standalone)
- [Source: src/constants/tool-registry.ts] — registry entry pattern
- [Source: vite.config.ts] — prerender route configuration

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed test file: spec files need explicit `import { describe, expect, it } from 'vitest'` for tsc build compatibility (globals only work at runtime)
- Formatting auto-fixed via `pnpm format` for tool-registry.ts seo description line wrapping

### Completion Notes List

- Implemented 3 standalone utility functions (simplifyRatio, calculateDimension, parseRatio) using GCD algorithm — no external dependencies
- Created 32 unit tests covering all functions, edge cases (zero, negative, non-integer, prime dimensions, sub-pixel rounding to zero), and invalid input handling
- Built AspectRatioCalculator component following UnitPxToRem.tsx pattern with: width/height inputs, ratio field, 5 preset buttons (16:9, 4:3, 1:1, 21:9, 9:16), dimension locking, debounced recalculation
- All 992 tests pass (32 new + 960 existing), 0 regressions
- Build compiles cleanly, lint passes with 0 errors, formatting passes
- Component properly code-split at 4.39 kB gzipped

### File List

- src/types/constants/tool-registry.ts (modified — added 'aspect-ratio-calculator' to ToolRegistryKey union)
- src/constants/tool-registry.ts (modified — added registry entry in alphabetical position)
- vite.config.ts (modified — added prerender route in alphabetical position)
- src/utils/aspect-ratio.ts (new — simplifyRatio, calculateDimension, parseRatio utility functions)
- src/utils/aspect-ratio.spec.ts (new — 30 unit tests for all utility functions)
- src/utils/index.ts (modified — added barrel export for aspect-ratio)
- src/components/feature/unit/AspectRatioCalculator.tsx (new — main component)
- src/components/feature/unit/index.ts (modified — added barrel export for AspectRatioCalculator)
- e2e/aspect-ratio-calculator.spec.ts (new — 7 E2E tests)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified — status updated)
- _bmad-output/implementation-artifacts/23-1-aspect-ratio-calculator.md (modified — tasks checked, status, dev record)

## Change Log

- 2026-02-23: Implemented Aspect Ratio Calculator tool (Story 23.1) — new Unit category tool with dimension calculation, ratio simplification, 5 preset ratios, dimension locking, and full test coverage
- 2026-02-23: Code review fixes — (H1) fixed ratio field input overwriting user text by separating preset vs typed ratio handlers, (H2) moved validation into debounced callbacks matching UnitPxToRem pattern, (H3) debounced ratio input processing, (M1) fixed placeholder E2E copy-button test with proper assertions, (M2) added E2E test for dimension locking AC4, (M3) added E2E tests for invalid input AC6 and empty-clear AC7, (L1) added post-round zero check in simplifyRatio, (L2) added return type annotations to exported utility functions
