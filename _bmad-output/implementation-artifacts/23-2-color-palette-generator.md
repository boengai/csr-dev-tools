# Story 23.2: Color Palette Generator

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **designer/developer**,
I want **to generate harmonious color palettes from a base color**,
so that **I can quickly create consistent color schemes for my projects**.

## Acceptance Criteria

1. **Given** the user inputs a base color (HEX, RGB, or HSL)
   **When** a harmony type is selected (complementary, analogous, triadic, split-complementary, monochromatic)
   **Then** a palette of 5 harmonious colors is generated and displayed as swatches

2. **Given** a generated palette
   **When** the user hovers over a color swatch
   **Then** HEX, RGB, and HSL values are shown

3. **Given** a generated palette
   **When** the user clicks a swatch
   **Then** the HEX value is copied to clipboard

4. **Given** a generated palette
   **When** the user clicks "Export CSS"
   **Then** CSS custom properties are generated (`--color-1: #xxx;` etc.)

5. **Given** the user uses a color picker input
   **When** the color changes
   **Then** the palette updates in real-time

## Tasks / Subtasks

- [x] Task 1: Create color palette utility functions (AC: #1, #5)
  - [x] 1.1 Create `src/utils/color-palette.ts` with harmony algorithm functions
  - [x] 1.2 Implement `generateComplementaryPalette(baseHsl)` — opposite hue (180° rotation)
  - [x] 1.3 Implement `generateAnalogousPalette(baseHsl)` — adjacent hues (±30°, ±60°)
  - [x] 1.4 Implement `generateTriadicPalette(baseHsl)` — 3 colors 120° apart
  - [x] 1.5 Implement `generateSplitComplementaryPalette(baseHsl)` — base + 150° + 210°
  - [x] 1.6 Implement `generateMonochromaticPalette(baseHsl)` — same hue, varying lightness
  - [x] 1.7 Implement `generatePalette(baseColor, harmonyType)` orchestrator function
  - [x] 1.8 Implement `formatPaletteAsCss(palette)` for CSS custom properties export
  - [x] 1.9 Add barrel export in `src/utils/index.ts`

- [x] Task 2: Create unit tests for palette utilities (AC: #1)
  - [x] 2.1 Create `src/utils/color-palette.spec.ts`
  - [x] 2.2 Test complementary palette (hue rotation accuracy)
  - [x] 2.3 Test analogous palette (hue spacing)
  - [x] 2.4 Test triadic palette (120° intervals)
  - [x] 2.5 Test split-complementary palette (150°/210° offsets)
  - [x] 2.6 Test monochromatic palette (lightness variation, hue preserved)
  - [x] 2.7 Test edge cases: black, white, pure red/green/blue, hue wrapping at 360°
  - [x] 2.8 Test CSS export format validation
  - [x] 2.9 Test invalid input handling

- [x] Task 3: Create ColorPaletteGenerator component (AC: #1, #2, #3, #5)
  - [x] 3.1 Create `src/components/feature/color/ColorPaletteGenerator.tsx`
  - [x] 3.2 Implement base color input with native HTML5 color picker + hex text input
  - [x] 3.3 Implement harmony type selector (SelectInput with 5 options)
  - [x] 3.4 Implement real-time palette generation with 300ms debounce
  - [x] 3.5 Render 5 color swatches as visual preview blocks
  - [x] 3.6 Show HEX, RGB, HSL values on hover (tooltip or expanded detail)
  - [x] 3.7 Implement click-to-copy on swatches using CopyButton/clipboard pattern
  - [x] 3.8 Add barrel export in `src/components/feature/color/index.ts`

- [x] Task 4: Implement CSS export functionality (AC: #4)
  - [x] 4.1 Add "Export CSS" button to action bar
  - [x] 4.2 Generate CSS custom properties string (`--palette-1: #xxx; --palette-2: #yyy;` etc.)
  - [x] 4.3 Use CopyButton to copy CSS output to clipboard

- [x] Task 5: Register tool and configure routing (AC: all)
  - [x] 5.1 Add `'color-palette-generator'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetical)
  - [x] 5.2 Add registry entry in `src/constants/tool-registry.ts` (alphabetical within Color category)
  - [x] 5.3 Add prerender route `/tools/color-palette-generator` in `vite.config.ts` `toolRoutes` array (alphabetical)

- [x] Task 6: Implement accessibility (AC: all)
  - [x] 6.1 Add `aria-live="polite"` on palette output region
  - [x] 6.2 Add `aria-label` on all icon buttons and swatch click targets
  - [x] 6.3 Add `role="alert"` on error messages (handled by toast system)
  - [x] 6.4 Ensure full keyboard navigation (Tab through swatches, Enter to copy)
  - [x] 6.5 Ensure color picker input is keyboard-accessible

- [x] Task 7: Create E2E tests (AC: all)
  - [x] 7.1 Create `e2e/color-palette-generator.spec.ts`
  - [x] 7.2 Test: navigate to tool page, verify title and description
  - [x] 7.3 Test: enter hex color → palette generates with 5 swatches
  - [x] 7.4 Test: change harmony type → palette updates
  - [x] 7.5 Test: click swatch → clipboard copy confirmation
  - [x] 7.6 Test: click Export CSS → CSS properties copied
  - [x] 7.7 Test: color picker interaction → palette updates in real-time
  - [x] 7.8 Test: mobile viewport (375px) responsiveness

- [x] Task 8: Verify build and tests pass
  - [x] 8.1 Run `pnpm lint` — 0 errors
  - [x] 8.2 Run `pnpm format` — compliant
  - [x] 8.3 Run `pnpm test` — all tests pass (0 regressions)
  - [x] 8.4 Run `pnpm build` — clean build
  - [x] 8.5 Run E2E tests — all passing

## Dev Notes

### Architecture Compliance

- **Technical Stack**: React 19.2.4, TypeScript 5.9.3 (strict), Vite 7.3.1, Tailwind CSS 4.1.18, Radix UI, Motion 12.34.0
- **Component Pattern**: Named export `export const ColorPaletteGenerator`, no default export
- **State**: `useState` for local UI state, `useDebounceCallback` for 300ms debounced palette generation
- **Error Handling**: `useToast` with `type: 'error'` — never custom error state
- **Styling**: Tailwind CSS v4 classes, `tv()` from `@/utils` for component variants, OKLCH color space
- **Animations**: Import from `motion/react` (NOT `framer-motion`)
- **Code Quality**: oxlint + oxfmt — no semicolons, single quotes, trailing commas, 120 char width

### Existing Color Utilities to REUSE

**CRITICAL: Do NOT reinvent color conversion functions!** The project already has comprehensive color utilities in `src/utils/color.ts`:

- `hexToRgb(hex)` → `{ r, g, b }` — Parse hex string to RGB
- `rgbToHex(rgb)` → `string` — Convert RGB to hex
- `rgbToHsl(rgb)` → `{ h, s, l }` — Convert RGB to HSL
- `hslToRgb(hsl)` → `{ r, g, b }` — Convert HSL to RGB
- `convertColor(source, sourceFormat)` — Universal converter returning all formats
- `clamp(value, min, max)` — Clamp numeric value
- `normalizeHue(hue)` — Normalize hue to 0–360 range

**Types already available** in `src/types/utils/color.ts`:
- `ColorFormat = 'hex' | 'hsl' | 'lab' | 'lch' | 'oklch' | 'rgb'`
- `RGBColor = { r: number; g: number; b: number }`
- `HSLColor = { h: number; s: number; l: number }`

**New utility file** (`src/utils/color-palette.ts`) should IMPORT from `@/utils/color` for all format conversions. Only implement the harmony generation algorithms (hue rotation, lightness variation).

### Color Harmony Algorithms (Pure Math)

All algorithms work on HSL color space (hue manipulation is straightforward):

| Harmony Type | Algorithm | Colors |
|---|---|---|
| **Complementary** | Base + hue+180° | 2 colors → pad with lightness variants to reach 5 |
| **Analogous** | Base + hue±30° + hue±60° | 5 colors (base + 4 neighbors) |
| **Triadic** | Base + hue+120° + hue+240° | 3 colors → pad with lightness variants to reach 5 |
| **Split-Complementary** | Base + hue+150° + hue+210° | 3 colors → pad with lightness variants to reach 5 |
| **Monochromatic** | Same hue, lightness at 15%, 30%, 50%, 70%, 85% | 5 colors (hue/saturation preserved) |

**Hue wrapping**: Always use `normalizeHue()` from existing color utils to handle 360° wrap-around.

### Component Implementation Pattern

Follow the **AspectRatioCalculator** pattern (Story 23.1) and **ColorConverter** pattern:

```
src/components/feature/color/ColorPaletteGenerator.tsx
├── Tool description from TOOL_REGISTRY_MAP['color-palette-generator']
├── Input region
│   ├── Native HTML5 <input type="color"> (color picker)
│   ├── Hex text input (FieldForm) with CopyButton — synced with picker
│   └── Harmony type SelectInput (5 options)
├── Output region (aria-live="polite")
│   └── 5 color swatches
│       ├── Visual color block (background-color set dynamically)
│       ├── Hover: show HEX, RGB, HSL values
│       └── Click: copy HEX to clipboard
└── Action bar
    └── "Export CSS" button → copies CSS custom properties
```

### File Locations & Naming

| File | Path |
|---|---|
| Utility functions | `src/utils/color-palette.ts` |
| Utility tests | `src/utils/color-palette.spec.ts` |
| Component | `src/components/feature/color/ColorPaletteGenerator.tsx` |
| Types | `src/types/utils/color-palette.ts` (if needed) |
| E2E test | `e2e/color-palette-generator.spec.ts` |
| Registry key | `src/types/constants/tool-registry.ts` |
| Registry entry | `src/constants/tool-registry.ts` |
| Prerender route | `vite.config.ts` → `toolRoutes` array |
| Barrel exports | `src/utils/index.ts`, `src/components/feature/color/index.ts` |

### Code Conventions (Enforced)

- `type` over `interface`
- `Array<T>` over `T[]`
- `import type` for type-only imports
- Named exports only (no default export for components)
- `@/` path alias for all imports
- Let TypeScript infer where possible
- No `console.log` statements
- Explicit `import { describe, expect, it } from 'vitest'` in spec files (for tsc build)

### Registry Entry Format

```typescript
{
  category: 'Color',
  component: lazy(() =>
    import('@/components/feature/color/ColorPaletteGenerator').then(
      ({ ColorPaletteGenerator }: { ColorPaletteGenerator: ComponentType }) => ({
        default: ColorPaletteGenerator,
      }),
    ),
  ),
  description: 'Generate harmonious color palettes from a base color using color theory.',
  emoji: '🎨',
  key: 'color-palette-generator',
  name: 'Color Palette Generator',
  routePath: '/tools/color-palette-generator',
  seo: {
    description:
      'Generate complementary, analogous, triadic, and monochromatic color palettes. Free online color palette generator.',
    title: 'Color Palette Generator - CSR Dev Tools',
  },
}
```

### UX / Interaction Requirements

- **Instant output**: Palette updates in real-time as user changes base color or harmony type (300ms debounce)
- **No "Generate" button**: Output is live — follows the "text conversion tool" pattern
- **Smart defaults**: Load with base color `#3b82f6` (Tailwind blue-500) and "Analogous" harmony
- **Color output format**: Lowercase hex (`#3b82f6` not `#3B82F6`), standard RGB/HSL strings
- **Empty input**: Clear palette display, no error toast
- **Invalid input**: Show toast with format guidance: `'Enter a valid hex color (e.g., #3B82F6)'`
- **Mobile**: Swatches stack into single column at 375px, 44px+ touch targets

### Previous Story Intelligence (23.1 Aspect Ratio Calculator)

Key learnings from Story 23.1 to apply here:

1. **Use `type="text"` for inputs** — not `type="number"`, matches existing pattern
2. **Separate preset selection from typed input** — harmony type selector should not overwrite user's hex input
3. **Move validation into debounced callbacks** — not in onChange directly
4. **Empty input = clear output** — no error. Invalid input = error toast with example
5. **CopyButton pattern**: `<CopyButton value={hexValue} />` — toast says "Copied to clipboard"
6. **E2E tests**: Verify clipboard copy actually works, not just button click
7. **Spec files need explicit imports**: `import { describe, expect, it } from 'vitest'`
8. **Registration checklist**: types union → registry entry → vite prerender → barrel exports

### Git Intelligence

Recent commit patterns show:
- Story commits follow format: `📐 Aspect Ratio Calculator + 🔍 code review fixes (Story 23.1)`
- Code review fix commits address: crash bugs, mutating sort, CSS injection, duplicate utils, test fixes
- Pattern: implement story → code review → fix round → done

### Project Structure Notes

- Component goes in existing `src/components/feature/color/` folder (alongside ColorConverter)
- Utility goes in `src/utils/` (alongside existing `color.ts`)
- Category is `'Color'` (same as ColorConverter) — NOT `'Unit'` like AspectRatioCalculator
- This tool is in the **Design & Visual Tools** epic but registered under the **Color** category

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion-3.md#Epic 23 Story 23.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Technical Stack, Component Patterns, Testing Standards]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Tool Layout, Copy Pattern, Color System]
- [Source: _bmad-output/project-context.md#Implementation Rules]
- [Source: src/utils/color.ts — existing color conversion functions]
- [Source: src/components/feature/color/ColorConvertor.tsx — existing color tool pattern]
- [Source: src/components/feature/unit/AspectRatioCalculator.tsx — latest tool pattern (Story 23.1)]
- [Source: _bmad-output/implementation-artifacts/23-1-aspect-ratio-calculator.md — previous story learnings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Barrel export conflict: `rgbToHex` and `rgbToHsl` already exported from `color-picker.ts` — resolved by using `convertColor` (universal converter) and `normalizeHue` (no conflict) instead of exporting conflicting function names from `color.ts`.
- E2E test fix: Radix Select option matching needed exact regex `/^Complementary$/` to avoid matching "Split-Complementary". Toast locator needed `exact: true` to avoid matching toast + screen reader announcement.

### Completion Notes List

- Implemented all 5 color harmony algorithms (complementary, analogous, triadic, split-complementary, monochromatic) as pure functions in `src/utils/color-palette.ts`
- Each harmony generates exactly 5 palette colors with hex, RGB, and HSL values
- Component uses native HTML5 color picker synced with hex text input, Radix SelectInput for harmony type, and animated color swatches with hover-to-reveal color values
- Click-to-copy on swatches and Export CSS button both use clipboard API with toast confirmation
- Real-time palette generation with 300ms debounce on text input; immediate on picker/select changes
- Smart defaults: `#3b82f6` (Tailwind blue-500) with Analogous harmony on load
- 27 unit tests covering all harmony types, edge cases (black/white/pure colors/hue wrapping), CSS export, and invalid input
- 8 E2E tests covering rendering, palette generation, harmony switching, clipboard copy, CSS export, color picker, and mobile responsiveness
- All accessibility requirements met: aria-live, aria-labels, keyboard navigation, focus-visible styles
- 0 lint errors, format compliant, 1027/1027 unit tests pass, clean build (49 prerender pages), 97/97 E2E tests pass

### File List

- `src/utils/color-palette.ts` — NEW: Color harmony algorithm functions
- `src/utils/color-palette.spec.ts` — NEW: 27 unit tests for palette utilities
- `src/components/feature/color/ColorPaletteGenerator.tsx` — NEW: Main component
- `src/components/feature/color/index.ts` — MODIFIED: Added barrel export for ColorPaletteGenerator
- `src/utils/index.ts` — MODIFIED: Added barrel export for color-palette
- `src/utils/color.ts` — MODIFIED: Exported `normalizeHue` and `hexToHsl` for reuse by color-palette
- `src/types/constants/tool-registry.ts` — MODIFIED: Added 'color-palette-generator' to ToolRegistryKey union
- `src/constants/tool-registry.ts` — MODIFIED: Added registry entry for Color Palette Generator
- `vite.config.ts` — MODIFIED: Added prerender route for /tools/color-palette-generator
- `e2e/color-palette-generator.spec.ts` — NEW: 8 E2E tests

### Change Log

- 2026-02-23: Implemented Story 23.2 — Color Palette Generator tool with 5 harmony types, real-time generation, click-to-copy, CSS export, full accessibility, 27 unit tests, and 8 E2E tests
- 2026-02-23: Code review fixes — (H1) Added `group-focus-within:flex` for keyboard-visible color values on swatches, (H2) replaced raw clipboard calls with `useCopyToClipboard` hook for swatch clicks and added try/catch on Export CSS, (H3) swatch clicks now use project clipboard pattern, (M1) color picker now handles 3-digit hex via `toPickerHex` helper, (M2) replaced fragile regex HSL parsing with new `hexToHsl` export from color.ts
