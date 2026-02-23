# Story 23.3: Placeholder Image Generator

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **to generate placeholder images with custom dimensions, colors, and text**,
so that **I can use them in mockups and development without external services**.

## Acceptance Criteria

1. **Given** the user enters width and height (e.g., 800x600)
   **When** values are entered
   **Then** a placeholder image is rendered in a canvas with the specified dimensions

2. **Given** the user customizes background color and text color
   **When** colors are changed
   **Then** the preview updates in real-time

3. **Given** the user enters custom text (or uses default "{W}x{H}")
   **When** text is entered
   **Then** it's centered on the placeholder image

4. **Given** common size presets (thumbnail 150x150, banner 1200x630, avatar 200x200, hero 1920x1080)
   **When** a preset is selected
   **Then** dimensions are populated

5. **Given** the generated placeholder
   **When** the user clicks "Download PNG" or "Download SVG"
   **Then** the image is downloaded in the selected format

## Tasks / Subtasks

- [x] Task 1: Create placeholder image utility functions (AC: #1, #2, #3)
  - [x] 1.1 Create `src/utils/placeholder-image.ts` with generation functions
  - [x] 1.2 Implement `generatePlaceholderCanvas(options)` — creates an offscreen canvas, fills background, auto-sizes and centers text
  - [x] 1.3 Implement `generatePlaceholderSvg(options)` — returns an SVG string with `<rect>` background + `<text>` centered overlay
  - [x] 1.4 Implement `autoSizeFont(ctx, text, maxWidth, maxHeight)` — decrements font size from initial estimate until text fits within bounds (min 10px)
  - [x] 1.5 Implement `canvasToBlob(canvas)` — Promise wrapper around `canvas.toBlob('image/png')`
  - [x] 1.6 Implement `downloadBlob(blob, filename)` — creates object URL, triggers anchor click, revokes URL
  - [x] 1.7 Implement `downloadSvg(svgString, filename)` — wraps SVG string in Blob with `image/svg+xml` type, triggers download
  - [x] 1.8 Define `PlaceholderOptions` type: `{ width: number; height: number; bgColor: string; textColor: string; text: string }`
  - [x] 1.9 Define `PLACEHOLDER_PRESETS` array: `{ label: string; width: number; height: number }` for common sizes
  - [x] 1.10 Add barrel export in `src/utils/index.ts`

- [x] Task 2: Create unit tests for placeholder utilities (AC: #1, #3)
  - [x] 2.1 Create `src/utils/placeholder-image.spec.ts`
  - [x] 2.2 Test `generatePlaceholderSvg()` — verify SVG string structure: contains `<svg>`, `<rect>`, `<text>`, correct dimensions/colors
  - [x] 2.3 Test `generatePlaceholderSvg()` — default text is `"{W}x{H}"` when text is empty
  - [x] 2.4 Test `generatePlaceholderSvg()` — custom text is used when provided
  - [x] 2.5 Test SVG attributes: `text-anchor="middle"`, `dominant-baseline="middle"`, correct viewBox
  - [x] 2.6 Test edge cases: very small dimensions (10x10), very large dimensions (4000x4000), 1x1
  - [x] 2.7 Test PLACEHOLDER_PRESETS has expected entries (thumbnail, banner, avatar, hero)
  - [x] 2.8 Test default colors are applied when not specified

- [x] Task 3: Create PlaceholderImageGenerator component (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Create `src/components/feature/image/PlaceholderImageGenerator.tsx`
  - [x] 3.2 Implement width/height text inputs with 300ms debounced preview generation
  - [x] 3.3 Implement preset size selector using SelectInput (Radix Select) with PLACEHOLDER_PRESETS
  - [x] 3.4 Implement background color input: native `<input type="color">` synced with hex text input
  - [x] 3.5 Implement text color input: native `<input type="color">` synced with hex text input
  - [x] 3.6 Implement custom text input (FieldForm) — placeholder shows "{W}x{H}" default behavior
  - [x] 3.7 Implement real-time canvas preview: render placeholder on an `<img>` element using SVG data URI for live preview
  - [x] 3.8 Implement "Download PNG" button: generate canvas → `toBlob()` → download via anchor pattern
  - [x] 3.9 Implement "Download SVG" button: generate SVG string → Blob → download via anchor pattern
  - [x] 3.10 Add barrel export in `src/components/feature/image/index.ts`

- [x] Task 4: Register tool and configure routing (AC: all)
  - [x] 4.1 Add `'placeholder-image-generator'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetical)
  - [x] 4.2 Add registry entry in `src/constants/tool-registry.ts` (alphabetical within Image category)
  - [x] 4.3 Add prerender route `/tools/placeholder-image-generator` in `vite.config.ts` `toolRoutes` array (alphabetical)

- [x] Task 5: Implement accessibility (AC: all)
  - [x] 5.1 Add `aria-live="polite"` on preview output region
  - [x] 5.2 Add `aria-label` on all icon buttons and download buttons
  - [x] 5.3 Add `role="alert"` on error messages (handled by toast system)
  - [x] 5.4 Ensure full keyboard navigation (Tab through controls, Enter to download)
  - [x] 5.5 Add alt text on preview image describing dimensions and colors

- [x] Task 6: Create E2E tests (AC: all)
  - [x] 6.1 Create `e2e/placeholder-image-generator.spec.ts`
  - [x] 6.2 Test: navigate to tool page, verify title and description
  - [x] 6.3 Test: enter width/height → preview image renders
  - [x] 6.4 Test: change background color → preview updates
  - [x] 6.5 Test: enter custom text → preview shows custom text
  - [x] 6.6 Test: select a preset → dimensions populate
  - [x] 6.7 Test: click "Download PNG" → download triggers with toast
  - [x] 6.8 Test: click "Download SVG" → download triggers with toast
  - [x] 6.9 Test: mobile viewport (375px) responsiveness

- [x] Task 7: Verify build and tests pass
  - [x] 7.1 Run `pnpm lint` — 0 errors
  - [x] 7.2 Run `pnpm format` — compliant
  - [x] 7.3 Run `pnpm test` — all tests pass (0 regressions)
  - [x] 7.4 Run `pnpm build` — clean build
  - [x] 7.5 Run E2E tests — all passing

## Dev Notes

### Architecture Compliance

- **Technical Stack**: React 19.2.4, TypeScript 5.9.3 (strict), Vite 7.3.1, Tailwind CSS 4.1.18, Radix UI, Motion 12.34.0
- **Component Pattern**: Named export `export const PlaceholderImageGenerator`, no default export
- **State**: `useState` for local UI state, `useDebounceCallback` for 300ms debounced preview generation
- **Error Handling**: `useToast` with `type: 'error'` — never custom error state
- **Styling**: Tailwind CSS v4 classes, `tv()` from `@/utils` for component variants, OKLCH color space
- **Animations**: Import from `motion/react` (NOT `framer-motion`)
- **Code Quality**: oxlint + oxfmt — no semicolons, single quotes, trailing commas, 120 char width
- **100% client-side**: Canvas and SVG generation happen entirely in the browser. Zero network requests.

### Category and Domain Placement

**IMPORTANT:** The epics file specifies `Category: Design` but "Design" is NOT a valid `ToolCategory`. The valid categories are: `'Code' | 'Color' | 'CSS' | 'Data' | 'Encoding' | 'Generator' | 'Image' | 'Text' | 'Time' | 'Unit'`.

This tool generates **placeholder images** — it belongs in the **`'Image'`** category, alongside existing image tools (ImageResizer, ImageConvertor, FaviconGenerator, etc.). Place the component in `src/components/feature/image/`.

### Existing Utilities to REUSE

**Canvas and Image Utilities** — The project has established patterns in `src/utils/image.ts` and `src/utils/favicon.ts`:

- `canvasToBlob(canvas)` pattern from `favicon.ts` — Promise wrapper for `canvas.toBlob()`
- Download anchor pattern from `ImageConvertor.tsx` / `QrCodeGenerator.tsx` — hidden `<a ref={downloadAnchorRef}>` with `URL.createObjectURL(blob)`
- `URL.revokeObjectURL()` cleanup from `favicon.ts`

**Color Utilities** — Reuse from `src/utils/color.ts` if needed for color validation:
- `hexToRgb(hex)` / `rgbToHex(rgb)` for color format conversion
- But for this tool, CSS color strings can be used directly with Canvas `fillStyle`

**Hooks to Use:**
- `useCopyToClipboard` from `@/hooks` — for clipboard operations
- `useDebounceCallback` from `@/hooks` — for 300ms debounced preview generation
- `useToast` from `@/hooks` — for success/error toasts

### Placeholder Image Generation Strategy

**Preview Rendering: SVG Data URI Approach (Recommended)**
- Generate an SVG string with `<rect>` (background) + `<text>` (centered label)
- Convert to data URI: `data:image/svg+xml,${encodeURIComponent(svgString)}`
- Display in `<img src={dataUri}>` — lightweight, instant, scales perfectly
- SVG preview is faster and lighter than re-rendering canvas on every input change

**PNG Download: Canvas Approach**
- Create offscreen `<canvas>` element, set dimensions
- Fill background with `ctx.fillStyle = bgColor` + `ctx.fillRect()`
- Auto-size font: start at `Math.min(width, height) / 8`, measure text, shrink until fits
- Center text: `ctx.textAlign = 'center'`, `ctx.textBaseline = 'middle'`, draw at `(width/2, height/2)`
- Use `canvas.toBlob('image/png')` for efficient binary output
- Download via hidden anchor: `URL.createObjectURL(blob)` → `anchor.click()` → `URL.revokeObjectURL()`

**SVG Download: String Approach**
- Generate the same SVG string used for preview
- Wrap in `new Blob([svgString], { type: 'image/svg+xml' })`
- Download via same hidden anchor pattern

### Auto-Sizing Font Algorithm

```
1. Set initial fontSize = Math.min(width, height) / 8
2. Set ctx.font = `bold ${fontSize}px sans-serif`
3. Measure: ctx.measureText(text).width
4. While measured width > (width * 0.8) AND fontSize > 10:
   a. fontSize -= 1
   b. Re-set ctx.font
   c. Re-measure
5. Return final fontSize
```

This ensures text never overflows while remaining readable. The 80% width threshold provides padding. Minimum 10px prevents illegible text.

### Placeholder Presets

| Preset | Width | Height | Use Case |
|--------|-------|--------|----------|
| Thumbnail | 150 | 150 | Profile pictures, grid items |
| Avatar | 200 | 200 | User avatars |
| Card | 300 | 200 | Content cards |
| Banner | 1200 | 630 | Social/OG images |
| Hero | 1920 | 1080 | Hero sections |

### Smart Defaults

- **Width**: 800, **Height**: 600 (common 4:3 placeholder)
- **Background**: `#cccccc` (neutral gray — standard placeholder convention)
- **Text Color**: `#666666` (subtle dark gray on light gray)
- **Text**: empty (defaults to `"{W}x{H}"` display, e.g., "800x600")

### Component Implementation Pattern

Follow the **ColorPaletteGenerator** and **QrCodeGenerator** patterns:

```
src/components/feature/image/PlaceholderImageGenerator.tsx
├── Tool description from TOOL_REGISTRY_MAP['placeholder-image-generator']
├── Input region
│   ├── Width input (FieldForm, type="text", numeric validation)
│   ├── Height input (FieldForm, type="text", numeric validation)
│   ├── Preset selector (SelectInput / Radix Select with presets)
│   ├── Background color: <input type="color"> + hex text input
│   ├── Text color: <input type="color"> + hex text input
│   └── Custom text input (FieldForm, placeholder="800x600")
├── Preview region (aria-live="polite")
│   └── <img> element showing SVG data URI (auto-scales to fit container)
└── Action bar
    ├── "Download PNG" button → canvas generation + toBlob + download
    └── "Download SVG" button → SVG string + Blob + download
```

### File Locations & Naming

| File | Path |
|---|---|
| Utility functions | `src/utils/placeholder-image.ts` |
| Utility tests | `src/utils/placeholder-image.spec.ts` |
| Component | `src/components/feature/image/PlaceholderImageGenerator.tsx` |
| E2E test | `e2e/placeholder-image-generator.spec.ts` |
| Registry key | `src/types/constants/tool-registry.ts` |
| Registry entry | `src/constants/tool-registry.ts` |
| Prerender route | `vite.config.ts` → `toolRoutes` array |
| Barrel exports | `src/utils/index.ts`, `src/components/feature/image/index.ts` |

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
  category: 'Image',
  component: lazy(() =>
    import('@/components/feature/image/PlaceholderImageGenerator').then(
      ({ PlaceholderImageGenerator }: { PlaceholderImageGenerator: ComponentType }) => ({
        default: PlaceholderImageGenerator,
      }),
    ),
  ),
  description: 'Generate placeholder images with custom dimensions, colors, and text.',
  emoji: '🖼️',
  key: 'placeholder-image-generator',
  name: 'Placeholder Image Generator',
  routePath: '/tools/placeholder-image-generator',
  seo: {
    description:
      'Generate customizable placeholder images with dimensions, colors, and text. Download as PNG or SVG. Free online placeholder image generator.',
    title: 'Placeholder Image Generator - CSR Dev Tools',
  },
}
```

### UX / Interaction Requirements

- **Live preview**: SVG preview updates in real-time as user changes dimensions, colors, or text (300ms debounce on text inputs)
- **No "Generate" button for preview**: Preview is always live — follows the "text conversion tool" pattern
- **Download buttons are explicit action**: PNG and SVG download require button clicks (file processing pattern)
- **Smart defaults**: Load with 800x600, gray bg (#cccccc), dark text (#666666), default text shows dimensions
- **Empty dimensions**: Clear preview, no error toast. Zero or negative dimensions: show toast `'Enter valid dimensions (e.g., 800 x 600)'`
- **Max dimensions**: Cap at 4096x4096 to prevent memory issues. Show toast if exceeded.
- **Mobile**: Inputs stack vertically at 375px, preview scales to container width, 44px+ touch targets
- **Download toasts**: `'Downloaded placeholder-800x600.png'` / `'Downloaded placeholder-800x600.svg'`

### Previous Story Intelligence (23.2 Color Palette Generator)

Key learnings from Story 23.2 to apply here:

1. **Use `type="text"` for dimension inputs** — not `type="number"`, matches existing pattern across all tools
2. **Color picker sync**: Use native `<input type="color">` synced with hex text FieldForm — same pattern as 23.2
3. **Handle 3-digit hex**: Color picker may produce short hex — use `toPickerHex` conversion helper if needed
4. **CopyButton/clipboard pattern**: Use `useCopyToClipboard` hook for clipboard operations, never raw `navigator.clipboard`
5. **Barrel export conflicts**: Check `src/utils/index.ts` and `src/components/feature/image/index.ts` for naming conflicts before adding new exports
6. **E2E test selectors**: Use `exact: true` for toast text matching, exact regex for Radix Select options
7. **Spec files need explicit imports**: `import { describe, expect, it } from 'vitest'`
8. **Registration checklist**: types union → registry entry → vite prerender → barrel exports

### Git Intelligence

Recent commit patterns from Epic 23:
- `e83722c` — `🎨 Color Palette Generator + 🔍 code review fixes (Story 23.2)`
- `5651942` — `📐 Aspect Ratio Calculator + 🔍 code review fixes (Story 23.1)`

Code review fixes commonly address:
- Keyboard accessibility (focus-visible, group-focus-within patterns)
- Raw clipboard calls → `useCopyToClipboard` hook
- Input edge cases (3-digit hex, empty values)
- Fragile regex parsing → using existing utility functions

Files recently modified in Epic 23:
- `src/constants/tool-registry.ts` — tool entries added alphabetically
- `src/types/constants/tool-registry.ts` — ToolRegistryKey union updated
- `vite.config.ts` — prerender routes added alphabetically
- `src/utils/index.ts` — barrel exports for new utils

### Project Structure Notes

- Component goes in existing `src/components/feature/image/` folder (alongside ImageConvertor, ImageResizer, FaviconGenerator, etc.)
- Utility goes in `src/utils/` as `placeholder-image.ts`
- Category is `'Image'` — NOT `'Design'` (which doesn't exist as a valid ToolCategory)
- This tool is in the **Design & Visual Tools** epic but registered under the **Image** category
- No new dependencies needed — uses native Canvas API and SVG string generation

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion-3.md#Epic 23 Story 23.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Patterns, Registry Entry, Testing Standards]
- [Source: _bmad-output/project-context.md#Implementation Rules, Adding a New Tool]
- [Source: _bmad-output/implementation-artifacts/23-2-color-palette-generator.md — previous story patterns and learnings]
- [Source: src/utils/favicon.ts — Canvas/Blob/download patterns]
- [Source: src/utils/image.ts — image processing utilities]
- [Source: src/components/feature/generator/QrCodeGenerator.tsx — download anchor pattern]
- [Source: src/components/feature/image/ImageConvertor.tsx — image download/export pattern]
- [Source: src/components/feature/image/FaviconGenerator.tsx — canvas generation + ZIP download pattern]
- [Source: src/components/feature/color/ColorPaletteGenerator.tsx — color picker + live preview pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No blocking issues encountered during implementation.

### Completion Notes List

- Implemented full placeholder image generation tool with SVG preview and PNG/SVG download
- Utility module (`placeholder-image.ts`) provides: `generatePlaceholderSvg`, `generatePlaceholderCanvas`, `autoSizeFont`, `canvasToBlob`, `downloadBlob`, `downloadSvg`, `PlaceholderOptions` type, `PLACEHOLDER_PRESETS` array
- Component follows ColorPaletteGenerator/QrCodeGenerator patterns with two-panel layout (inputs left, preview right)
- SVG data URI approach used for lightweight real-time preview; Canvas API used for PNG export
- Added XML escaping for SVG text/color values to prevent injection
- 5 presets: Thumbnail (150x150), Avatar (200x200), Card (300x200), Banner (1200x630), Hero (1920x1080)
- Color picker sync uses `toPickerHex` helper to handle 3-digit hex expansion (learned from Story 23.2)
- Dimension validation: empty clears preview, zero/negative shows toast, max 4096x4096
- 18 unit tests covering SVG generation, presets, edge cases, and XML escaping
- 9 E2E tests covering all acceptance criteria including download verification
- All 1045 unit tests pass (0 regressions), all 9 E2E tests pass
- Lint: 0 errors, Format: compliant, Build: clean (7.30 kB gzipped chunk)

### File List

- `src/utils/placeholder-image.ts` — NEW: Utility functions and types (+ review fix: SVG font auto-sizing)
- `src/utils/placeholder-image.spec.ts` — NEW: Unit tests (19 tests, +1 from review)
- `src/utils/index.ts` — MODIFIED: Added barrel export
- `src/components/feature/image/PlaceholderImageGenerator.tsx` — NEW: Main component (+ review fixes: dead code removal, hex regex, dimension rounding)
- `src/components/feature/image/index.ts` — MODIFIED: Added barrel export (+ review fix: alphabetical ordering)
- `src/components/feature/color/ColorPaletteGenerator.tsx` — MODIFIED: Tailwind class order fix (incidental, from Story 23.2 review)
- `src/types/constants/tool-registry.ts` — MODIFIED: Added ToolRegistryKey union member
- `src/constants/tool-registry.ts` — MODIFIED: Added registry entry
- `vite.config.ts` — MODIFIED: Added prerender route
- `e2e/placeholder-image-generator.spec.ts` — NEW: E2E tests (9 tests)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED: Status updated
- `_bmad-output/implementation-artifacts/23-3-placeholder-image-generator.md` — MODIFIED: Story file updated

## Change Log

- 2026-02-23: Implemented Placeholder Image Generator tool (Story 23.3) — full utility module, component, registration, unit tests (18), E2E tests (9), all passing
- 2026-02-23: Code review fixes (4 MEDIUM, 3 LOW) — removed dead downloadAnchorRef + hidden anchor, added SVG font auto-sizing to match Canvas behavior, fixed hex validation regex (reject 4-5 char hex), rounded float dimensions to integers, fixed barrel export ordering, documented incidental ColorPaletteGenerator change. Tests: 1046 pass (19 placeholder-image), lint: 0 errors, build: clean.
