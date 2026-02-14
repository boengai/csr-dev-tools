# Story 9.1: CSS Box Shadow Generator

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to visually configure CSS box-shadow properties and see a live preview**,
So that **I can design box shadows interactively and copy the CSS code directly into my stylesheet**.

**Epic:** Epic 9 — CSS Visual Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (useToolError, CopyButton — complete)
**Story Key:** 9-1-css-box-shadow-generator

## Acceptance Criteria

### AC1: Tool Registered and Renders Inline

**Given** the Box Shadow Generator tool registered in `TOOL_REGISTRY` under the CSS category
**When** the user navigates to it (via sidebar, command palette, or `/tools/box-shadow-generator` route)
**Then** it renders inline with input controls and a live preview region
**And** a one-line description is shown from the registry entry
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Configurable Shadow Properties

**Given** the input controls
**When** the user adjusts them
**Then** the following properties are configurable: horizontal offset (-100 to 100px), vertical offset (-100 to 100px), blur radius (0 to 200px), spread radius (-100 to 100px), color (with alpha 0-100%), and inset toggle
**And** each numeric property uses a range slider with accompanying number input (`FieldForm` type="range")

### AC3: Live Preview Updates in Real-Time

**Given** any input value changes
**When** the user adjusts a control
**Then** the live preview updates immediately showing a box with the configured shadow
**And** the CSS output string updates simultaneously (e.g., `box-shadow: 4px 4px 8px 0px rgba(0, 0, 0, 0.25)`)
**And** no debounce is needed — computation is synchronous string generation

### AC4: Copy CSS Output

**Given** the CSS output
**When** the user clicks `CopyButton`
**Then** the complete `box-shadow` CSS property value is copied to clipboard

### AC5: Sensible Default Shadow

**Given** the tool loads
**When** the page renders
**Then** a sensible default shadow is applied (`4px 4px 8px 0px rgba(0, 0, 0, 0.25)`) so the preview is immediately visible

### AC6: Color with Alpha Support

**Given** the color input
**When** the user selects a color
**Then** a native color picker (`<input type="color">`) is available for the base color
**And** a separate alpha slider (0-100%) controls the shadow opacity
**And** the output uses `rgba()` format

### AC7: Unit Tests Cover CSS String Generation

**Given** unit tests in `src/utils/box-shadow.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: CSS string generation for all property combinations, inset toggle, zero values, negative offsets, color format output, and default config

## Tasks / Subtasks

- [x] Task 1: Create box-shadow utility functions (AC: #3, #5, #6, #7)
  - [x] 1.1 Create `src/utils/box-shadow.ts` with `generateBoxShadowCSS(config: BoxShadowConfig): string`
  - [x] 1.2 Define `BoxShadowConfig` type with all shadow properties
  - [x] 1.3 Define `DEFAULT_BOX_SHADOW` constant with sensible defaults (4px 4px 8px 0px rgba(0,0,0,0.25))
  - [x] 1.4 Implement `hexToRgba(hex: string, alpha: number): string` helper for color conversion
  - [x] 1.5 Handle inset toggle — prepend `inset` keyword when enabled
  - [x] 1.6 Export `generateBoxShadowCSS`, `BoxShadowConfig`, `DEFAULT_BOX_SHADOW`, `hexToRgba`

- [x] Task 2: Write unit tests for box-shadow utilities (AC: #7)
  - [x] 2.1 Create `src/utils/box-shadow.spec.ts`
  - [x] 2.2 Test default config produces `4px 4px 8px 0px rgba(0, 0, 0, 0.25)`
  - [x] 2.3 Test inset toggle produces `inset 4px 4px 8px 0px rgba(0, 0, 0, 0.25)`
  - [x] 2.4 Test zero values: `0px 0px 0px 0px rgba(0, 0, 0, 0.25)`
  - [x] 2.5 Test negative offsets: `-10px -5px 8px 0px rgba(0, 0, 0, 0.25)`
  - [x] 2.6 Test max values: `100px 100px 200px 100px rgba(255, 0, 0, 1)`
  - [x] 2.7 Test alpha=0 produces `rgba(0, 0, 0, 0)` and alpha=100 produces `rgba(0, 0, 0, 1)`
  - [x] 2.8 Test custom color: hex `#ff5733` with alpha 50 → `rgba(255, 87, 51, 0.5)`
  - [x] 2.9 Test hexToRgba with various hex values (3-char, 6-char, with/without #)
  - [x] 2.10 Test spread radius negative values: `4px 4px 8px -2px rgba(0, 0, 0, 0.25)`

- [x] Task 3: Create BoxShadowGenerator component (AC: #1, #2, #3, #4, #5, #6)
  - [x] 3.1 Create `src/components/feature/css/BoxShadowGenerator.tsx` as named export
  - [x] 3.2 Render inline layout:
    - **Top:** Tool description from registry
    - **Controls (left/top on mobile):** 4 range sliders via `FieldForm` type="range" (h-offset, v-offset, blur, spread) + color input + alpha slider + inset toggle
    - **Divider:** `border-t-2 border-dashed border-gray-900`
    - **Preview (right/bottom on mobile):** Box element with applied shadow + CSS output string + `CopyButton`
  - [x] 3.3 Use `useState` for all shadow properties, initialized from `DEFAULT_BOX_SHADOW`
  - [x] 3.4 Compute CSS string on every render via `generateBoxShadowCSS()` — no debounce (synchronous)
  - [x] 3.5 Apply shadow to preview box via inline `style={{ boxShadow: cssString }}`
  - [x] 3.6 Color input: native `<input type="color">` for base color + `FieldForm` type="range" for alpha (0-100)
  - [x] 3.7 Inset toggle: `aria-pressed` button using FlagToggle pattern
  - [x] 3.8 Show tool description from `TOOL_REGISTRY_MAP['box-shadow-generator']`
  - [x] 3.9 Initialize `useToolError()` for architectural consistency
  - [x] 3.10 CSS output in monospace code block with `CopyButton`

- [x] Task 4: Add CSS category to type system (AC: #1)
  - [x] 4.1 Add `'CSS'` to `ToolCategory` union in `src/types/constants/tool-registry.ts` (alphabetically between `'Color'` and `'Data'`)
  - [x] 4.2 Add `'box-shadow-generator'` to `ToolRegistryKey` union (alphabetically between `'base64-encoder'` and `'color-converter'`)

- [x] Task 5: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 5.1 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts` (alphabetically between `base64-encoder` and `color-converter` entries)
  - [x] 5.2 Add `'CSS'` to `CATEGORY_ORDER` array in `src/components/common/sidebar/Sidebar.tsx` (alphabetically between `'Color'` and `'Data'`)
  - [x] 5.3 Add pre-render route in `vite.config.ts` toolRoutes array (alphabetically between `base64-encoder` and `color-converter`)

- [x] Task 6: Create barrel exports (AC: #1)
  - [x] 6.1 Create `src/components/feature/css/index.ts` with `export { BoxShadowGenerator } from './BoxShadowGenerator'`
  - [x] 6.2 Add `export * from './css'` to `src/components/feature/index.ts` (alphabetically between `'./color'` and `'./data'`)
  - [x] 6.3 Add `export * from './box-shadow'` to `src/utils/index.ts` (alphabetically between `'./base64'` and `'./color'`)

- [x] Task 7: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 7.1 Run `pnpm lint` — no errors
  - [x] 7.2 Run `pnpm format:check` — no formatting issues
  - [x] 7.3 Run `pnpm test` — all tests pass (505 existing + 14 new = 519 total)
  - [x] 7.4 Run `pnpm build` — build succeeds, tool chunk is separate (BoxShadowGenerator-CKSchUTk.js)

## Dev Notes

### First CSS Category Tool — New Category Setup Required

This is the **first and only tool in the 'CSS' category** (Epic 9). Unlike stories 8-2 and 8-3 where the Generator category was already established, this story requires **full category bootstrap**:

| Setup Item | Action | File |
|-----------|--------|------|
| `ToolCategory` type | Add `'CSS'` | `src/types/constants/tool-registry.ts` |
| `CATEGORY_ORDER` | Add `'CSS'` | `src/components/common/sidebar/Sidebar.tsx` |
| Feature directory | Create `src/components/feature/css/` | New directory |
| Feature barrel | Create `index.ts` | `src/components/feature/css/index.ts` |
| Feature re-export | Add `export * from './css'` | `src/components/feature/index.ts` |

**After category setup:** The CSS category will appear in the sidebar with a badge count of 1, and in the command palette search results.

### Processing Pattern — Synchronous, No Debounce

Unlike the Hash Generator (async, debounced) or Password Generator (button-click), the Box Shadow Generator uses **synchronous live preview** — the simplest processing pattern:

| Aspect | Box Shadow Generator | Hash Generator (8-3) | Password Generator (8-2) |
|--------|---------------------|---------------------|------------------------|
| Trigger | On every state change | On-change (debounced 150ms) | Button click |
| Processing | **Synchronous** | Asynchronous | Synchronous |
| Debounce | **None needed** | 150ms | None |
| External library | **None** | js-md5 (lazy) | None |
| Pre-generated output | **Yes** (default shadow) | No (empty "—") | Yes (1 password) |

The CSS string is a pure function of the shadow config: `generateBoxShadowCSS(config) → string`. This is a trivial string concatenation that executes in microseconds. No debounce, no async, no refs for stale prevention.

**Important:** Do NOT add `useDebounceCallback` to this tool. Slider interactions must feel instant. The computation cost is zero.

### UI Layout (Inline)

```
┌──────────────────────────────────────────────────────────────────┐
│  Visually create CSS box-shadow values with a live preview...    │
│                                                                  │
│  ┌─── Controls ─────────────────────────────────────────────┐    │
│  │ Horizontal Offset  [────────●──────] [-100 ← 4 → 100]   │    │
│  │ Vertical Offset    [────────●──────] [-100 ← 4 → 100]   │    │
│  │ Blur Radius        [──●────────────] [0 ← 8 → 200]      │    │
│  │ Spread Radius      [────●──────────] [-100 ← 0 → 100]   │    │
│  │ Alpha              [─────────●─────] [0 ← 25 → 100]     │    │
│  │                                                           │    │
│  │ Color: [■ #000000]          Inset: [ OFF ]                │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ──────────── dashed divider ─────────────                       │
│                                                                  │
│  ┌─── Preview ──────────────────────────────────────────────┐    │
│  │                                                           │    │
│  │    ┌─────────────────────────┐                            │    │
│  │    │                         │ ← shadow visible           │    │
│  │    │      Preview Box        │                            │    │
│  │    │                         │                            │    │
│  │    └─────────────────────────┘                            │    │
│  │                                                           │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                  │
│  CSS Output                                        [Copy]        │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ box-shadow: 4px 4px 8px 0px rgba(0, 0, 0, 0.25)          │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Shadow Config State Shape

```typescript
type BoxShadowConfig = {
  alpha: number      // 0-100 (percentage, mapped to 0.0-1.0 in output)
  blur: number       // 0-200 (px)
  color: string      // hex6 format (#000000)
  hOffset: number    // -100 to 100 (px)
  inset: boolean     // false = outset (default), true = inset
  spread: number     // -100 to 100 (px)
  vOffset: number    // -100 to 100 (px)
}
```

Default values:
```typescript
const DEFAULT_BOX_SHADOW: BoxShadowConfig = {
  alpha: 25,
  blur: 8,
  color: '#000000',
  hOffset: 4,
  inset: false,
  spread: 0,
  vOffset: 4,
}
```

### CSS Output Format

The `generateBoxShadowCSS` function produces a standard CSS `box-shadow` value:

```
[inset] <h-offset>px <v-offset>px <blur>px <spread>px rgba(R, G, B, A)
```

Examples:
- Default: `4px 4px 8px 0px rgba(0, 0, 0, 0.25)`
- Inset: `inset 4px 4px 8px 0px rgba(0, 0, 0, 0.25)`
- Negative offset: `-10px -5px 8px 0px rgba(0, 0, 0, 0.25)`
- Full opacity red: `4px 4px 8px 0px rgba(255, 0, 0, 1)`
- No shadow: `0px 0px 0px 0px rgba(0, 0, 0, 0)`

### Color Input Pattern

The tool needs color selection with alpha/opacity support. Since native `<input type="color">` only supports hex6 (no alpha), use a two-part approach:

1. **Base color:** `<input type="color">` — gives `#RRGGBB` string
2. **Alpha/opacity:** `FieldForm` type="range" (min=0, max=100, step=1) — gives percentage

The `hexToRgba` utility converts the combination:
```typescript
hexToRgba('#ff5733', 50) → 'rgba(255, 87, 51, 0.5)'
```

**Color input styling:** The native color input should be styled to match the dark theme:
```typescript
<input
  aria-label="Shadow color"
  className="h-8 w-12 cursor-pointer rounded border border-gray-700 bg-transparent"
  onChange={(e) => setConfig((prev) => ({ ...prev, color: e.target.value }))}
  type="color"
  value={config.color}
/>
```

### Inset Toggle Pattern

Reuse the `FlagToggle` pattern from `RegexTester.tsx` and `PasswordGenerator.tsx`:

```typescript
<button
  aria-label="Toggle inset shadow"
  aria-pressed={config.inset}
  className={`rounded border px-3 font-mono text-xs leading-7 ${
    config.inset
      ? 'border-primary bg-primary/20 text-primary font-bold'
      : 'border-gray-700 bg-transparent text-gray-500'
  }`}
  onClick={() => setConfig((prev) => ({ ...prev, inset: !prev.inset }))}
  type="button"
>
  Inset
</button>
```

### Preview Box Styling

The preview region should have:
- A container with sufficient padding for the shadow to be visible (especially for large blur/spread values)
- A centered box element with a neutral background that contrasts with the dark theme
- The shadow applied via inline `style` prop

```typescript
<div className="flex items-center justify-center rounded-lg border border-gray-800 bg-gray-950 p-16">
  <div
    className="h-32 w-48 rounded-lg bg-gray-700"
    style={{ boxShadow: cssString }}
  />
</div>
```

**Critical:** The preview container needs generous padding (`p-16` or more) so shadows with large blur/spread/offset values don't get clipped. Use `overflow: visible` (default) — do NOT add `overflow: hidden`.

### Box Shadow Utility

```typescript
// src/utils/box-shadow.ts

export type BoxShadowConfig = {
  alpha: number
  blur: number
  color: string
  hOffset: number
  inset: boolean
  spread: number
  vOffset: number
}

export const DEFAULT_BOX_SHADOW: BoxShadowConfig = {
  alpha: 25,
  blur: 8,
  color: '#000000',
  hOffset: 4,
  inset: false,
  spread: 0,
  vOffset: 4,
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const fullHex = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean
  const r = Number.parseInt(fullHex.slice(0, 2), 16)
  const g = Number.parseInt(fullHex.slice(2, 4), 16)
  const b = Number.parseInt(fullHex.slice(4, 6), 16)
  const a = Math.round((alpha / 100) * 100) / 100
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

export function generateBoxShadowCSS(config: BoxShadowConfig): string {
  const { alpha, blur, color, hOffset, inset, spread, vOffset } = config
  const rgba = hexToRgba(color, alpha)
  const prefix = inset ? 'inset ' : ''
  return `${prefix}${hOffset}px ${vOffset}px ${blur}px ${spread}px ${rgba}`
}
```

### Slider Configuration

| Property | Label | Min | Max | Step | Default | Unit |
|----------|-------|-----|-----|------|---------|------|
| hOffset | Horizontal Offset | -100 | 100 | 1 | 4 | px |
| vOffset | Vertical Offset | -100 | 100 | 1 | 4 | px |
| blur | Blur Radius | 0 | 200 | 1 | 8 | px |
| spread | Spread Radius | -100 | 100 | 1 | 0 | px |
| alpha | Opacity | 0 | 100 | 1 | 25 | % |

**Note:** The `RangeInput` component already supports negative values via the number input (it handles `-` prefix). The `min` prop on the range slider handles negative ranges natively.

### Project Structure Notes

- **New directory:** `src/components/feature/css/` — created for this story, will hold future CSS tools
- **New category:** `'CSS'` added to `ToolCategory` and `CATEGORY_ORDER`
- **No new dependencies** — zero external libraries needed
- **Alphabetical insertion:** `box-shadow-generator` goes between `base64-encoder` and `color-converter` in all registries
- **Feature barrel chain:** `css/index.ts` → `feature/index.ts` → available via `@/components/feature`

### Architecture Compliance

- **TOOL_REGISTRY entry required** — tool must be discoverable via sidebar, command palette, dashboard selection dialog, and direct URL. Dashboard is a fixed 6-slot favorites grid — new tools do NOT auto-appear there [Source: architecture.md#Tool Registry]
- **Named export only** — `export const BoxShadowGenerator` (never `export default`) [Source: project-context.md#Named exports]
- **Lazy-loaded component** — registry uses `lazy(() => import(...).then(({ BoxShadowGenerator }) => ({ default: BoxShadowGenerator })))` [Source: architecture.md#Code Splitting]
- **100% client-side** — zero network requests, pure CSS string generation [Source: architecture.md#Hard Constraints]
- **useToolError for errors** — initialized for consistency; unlikely to trigger (no async, no parsing) [Source: architecture.md#Error Handling]
- **Live preview pattern** — immediate updates, no debounce (synchronous computation) [Source: architecture.md#Process Patterns]
- **aria-pressed toggle** — inset toggle uses `aria-pressed` for accessibility [Source: PasswordGenerator.tsx FlagToggle pattern]

### Library & Framework Requirements

- **No new dependencies** — all computation is pure string manipulation
- **Existing imports used:** `useState` from React, `CopyButton`, `FieldForm` from `@/components/common`, `TOOL_REGISTRY_MAP` from `@/constants`, `useToolError` from `@/hooks`
- **NOT importing:** `useDebounceCallback` (not needed — synchronous), `useRef` (no stale results), `TextAreaInput` (no text input), `Button` (no generate button — live preview)

### File Structure Requirements

**Files to CREATE:**

```
src/utils/box-shadow.ts                                — generateBoxShadowCSS(), BoxShadowConfig, DEFAULT_BOX_SHADOW, hexToRgba()
src/utils/box-shadow.spec.ts                           — Unit tests for box-shadow utilities (~10 tests)
src/components/feature/css/BoxShadowGenerator.tsx       — Box Shadow Generator component
src/components/feature/css/index.ts                     — Barrel export for css feature
```

**Files to MODIFY:**

```
src/types/constants/tool-registry.ts          — Add 'CSS' to ToolCategory, 'box-shadow-generator' to ToolRegistryKey
src/constants/tool-registry.ts                — Add box-shadow-generator registry entry
src/components/common/sidebar/Sidebar.tsx     — Add 'CSS' to CATEGORY_ORDER
src/components/feature/index.ts               — Add css barrel export
src/utils/index.ts                            — Add box-shadow barrel export
vite.config.ts                                — Add box-shadow-generator pre-render route
```

**Files NOT to modify:**
- Any existing tool components — this is a standalone new tool
- `src/hooks/useToolError.ts` — reused as-is
- `src/utils/validation.ts` — no validation needed (sliders are constrained by min/max)
- `src/hooks/useDebounceCallback.ts` — not used in this story
- `package.json` / `pnpm-lock.yaml` — no new dependencies

### Testing Requirements

**Unit tests (`src/utils/box-shadow.spec.ts`):**

```typescript
import { describe, expect, it } from 'vitest'

import { DEFAULT_BOX_SHADOW, generateBoxShadowCSS, hexToRgba } from '@/utils/box-shadow'

describe('box-shadow utilities', () => {
  describe('hexToRgba', () => {
    it('should convert black hex to rgba', () => {
      expect(hexToRgba('#000000', 25)).toBe('rgba(0, 0, 0, 0.25)')
    })

    it('should convert color hex to rgba', () => {
      expect(hexToRgba('#ff5733', 50)).toBe('rgba(255, 87, 51, 0.5)')
    })

    it('should handle 3-char hex', () => {
      expect(hexToRgba('#fff', 100)).toBe('rgba(255, 255, 255, 1)')
    })

    it('should handle hex without hash', () => {
      expect(hexToRgba('ff0000', 75)).toBe('rgba(255, 0, 0, 0.75)')
    })

    it('should handle zero alpha', () => {
      expect(hexToRgba('#000000', 0)).toBe('rgba(0, 0, 0, 0)')
    })

    it('should handle full alpha', () => {
      expect(hexToRgba('#000000', 100)).toBe('rgba(0, 0, 0, 1)')
    })
  })

  describe('generateBoxShadowCSS', () => {
    it('should generate default shadow CSS', () => {
      expect(generateBoxShadowCSS(DEFAULT_BOX_SHADOW)).toBe('4px 4px 8px 0px rgba(0, 0, 0, 0.25)')
    })

    it('should generate inset shadow CSS', () => {
      expect(generateBoxShadowCSS({ ...DEFAULT_BOX_SHADOW, inset: true })).toBe(
        'inset 4px 4px 8px 0px rgba(0, 0, 0, 0.25)',
      )
    })

    it('should handle zero values', () => {
      expect(
        generateBoxShadowCSS({ alpha: 25, blur: 0, color: '#000000', hOffset: 0, inset: false, spread: 0, vOffset: 0 }),
      ).toBe('0px 0px 0px 0px rgba(0, 0, 0, 0.25)')
    })

    it('should handle negative offsets', () => {
      expect(
        generateBoxShadowCSS({ ...DEFAULT_BOX_SHADOW, hOffset: -10, vOffset: -5 }),
      ).toBe('-10px -5px 8px 0px rgba(0, 0, 0, 0.25)')
    })

    it('should handle negative spread', () => {
      expect(
        generateBoxShadowCSS({ ...DEFAULT_BOX_SHADOW, spread: -2 }),
      ).toBe('4px 4px 8px -2px rgba(0, 0, 0, 0.25)')
    })

    it('should handle custom color with alpha', () => {
      expect(
        generateBoxShadowCSS({ ...DEFAULT_BOX_SHADOW, alpha: 80, color: '#ff0000' }),
      ).toBe('4px 4px 8px 0px rgba(255, 0, 0, 0.8)')
    })

    it('should handle max values', () => {
      expect(
        generateBoxShadowCSS({ alpha: 100, blur: 200, color: '#ffffff', hOffset: 100, inset: false, spread: 100, vOffset: 100 }),
      ).toBe('100px 100px 200px 100px rgba(255, 255, 255, 1)')
    })
  })

  describe('DEFAULT_BOX_SHADOW', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_BOX_SHADOW).toEqual({
        alpha: 25,
        blur: 8,
        color: '#000000',
        hOffset: 4,
        inset: false,
        spread: 0,
        vOffset: 4,
      })
    })
  })
})
```

### TOOL_REGISTRY Entry (Copy-Paste Ready)

```typescript
{
  category: 'CSS',
  component: lazy(() =>
    import('@/components/feature/css/BoxShadowGenerator').then(
      ({ BoxShadowGenerator }: { BoxShadowGenerator: ComponentType }) => ({
        default: BoxShadowGenerator,
      }),
    ),
  ),
  description: 'Visually create CSS box-shadow values with a live preview',
  emoji: '🔲',
  key: 'box-shadow-generator',
  name: 'Box Shadow Generator',
  routePath: '/tools/box-shadow-generator',
  seo: {
    description:
      'Generate CSS box-shadow values visually with a live preview. Adjust offset, blur, spread, color, and opacity — copy the CSS directly into your stylesheet.',
    title: 'Box Shadow Generator - CSR Dev Tools',
  },
}
```

### ToolCategory Type Update (Copy-Paste Ready)

```typescript
export type ToolCategory = 'Color' | 'CSS' | 'Data' | 'Encoding' | 'Generator' | 'Image' | 'Text' | 'Time' | 'Unit'
```

### ToolRegistryKey Type Update (Copy-Paste Ready)

```typescript
export type ToolRegistryKey =
  | 'base64-encoder'
  | 'box-shadow-generator'
  | 'color-converter'
  | 'hash-generator'
  | 'image-converter'
  | 'image-resizer'
  | 'json-formatter'
  | 'json-to-csv-converter'
  | 'json-to-yaml-converter'
  | 'jwt-decoder'
  | 'password-generator'
  | 'px-to-rem'
  | 'regex-tester'
  | 'text-diff-checker'
  | 'unix-timestamp'
  | 'url-encoder-decoder'
  | 'uuid-generator'
```

### CATEGORY_ORDER Update (Copy-Paste Ready)

```typescript
const CATEGORY_ORDER: Array<ToolCategory> = ['Color', 'CSS', 'Data', 'Encoding', 'Generator', 'Image', 'Text', 'Time', 'Unit']
```

### Vite Config Pre-Render Route (Copy-Paste Ready)

```typescript
{
  description:
    'Generate CSS box-shadow values visually with a live preview. Adjust offset, blur, spread, color, and opacity — copy the CSS directly into your stylesheet.',
  path: '/tools/box-shadow-generator',
  title: 'Box Shadow Generator - CSR Dev Tools',
  url: '/tools/box-shadow-generator',
},
```

### CSS Feature Barrel (Copy-Paste Ready)

```typescript
// src/components/feature/css/index.ts
export { BoxShadowGenerator } from './BoxShadowGenerator'
```

### Feature Barrel Update (Copy-Paste Ready)

Add between `'./color'` and `'./data'`:
```typescript
export * from './css'
```

### Utils Barrel Update (Copy-Paste Ready)

Add between `'./base64'` and `'./color'`:
```typescript
export * from './box-shadow'
```

### Error Messages

| Scenario | Behavior |
|----------|----------|
| Component mounts | Show default shadow preview, no error |
| User adjusts sliders | Immediate CSS update, no error possible |
| User changes color | Immediate CSS update, no error possible |
| User toggles inset | Immediate CSS update, no error possible |

**Note:** This tool has no error scenarios under normal use. Sliders are constrained by min/max, color picker only produces valid hex, and the toggle is boolean. `useToolError` is initialized for architectural consistency but will not trigger.

### Previous Story Intelligence

From Story 8-3 (Hash Generator — most recent completed story):
- **Code review found race conditions** with debounced callbacks — NOT relevant here (no debounce, no async)
- **`clearError` must be destructured** — always destructure even if unused for consistency
- **FlagToggle pattern confirmed** — `aria-pressed` toggle buttons work well (reuse for inset toggle)
- **505 tests exist** — expect ~515 after adding box-shadow tests (~10 new)
- **Commit prefix:** Use `✨: story 9-1 CSS Box Shadow Generator`

From Story 8-2 (Password Generator):
- **RangeInput component created** — PERFECT for this tool's 5 sliders (h-offset, v-offset, blur, spread, alpha)
- **`FieldForm` type="range"** — renders `RangeInput` with label, min/max clamping, and number input
- **Handler pattern:** `handleXChange = (value: string) => { const parsed = Number(value); if (Number.isNaN(parsed)) return; setConfig(...) }`

From Story 8-1 (UUID Generator):
- **Inline layout pattern** — tool renders directly in card, no dialog
- **Output box pattern** — monospace text in `rounded-lg border border-gray-800 bg-gray-950 p-3` container

### Git Intelligence

Recent commits analyzed:
```
9006246 🔄: epic 8 retrospective
8824f83 ✨: story 8-3 Hash Generator with code review fixes
132330e 🔧: vscode setting
bc5b207 ✨: story 8-2 Password Generator with RangeInput component
2f9e4e3 ✨: story 8-1 UUID Generator with inline layout
```

**Pattern:** New tool feature uses `✨: story X-Y Tool Name` commit prefix.
**This is the first story in a new epic (9)** — Epic 9 status will transition from "backlog" to "in-progress".
**No new dependencies** — simplest story in recent history (no library additions, no async).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 9.1] — Full AC definitions and story requirements
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 9] — Epic objectives and FR coverage (FR25)
- [Source: _bmad-output/planning-artifacts/prd.md] — FR25: Users can visually generate CSS box-shadow values with live preview
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Registry] — Registry entry pattern with all required fields
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — `box-shadow-generator` key, new `CSS` category
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Live preview: on input change with 150ms debounce (overridden: no debounce needed for synchronous)
- [Source: _bmad-output/planning-artifacts/architecture.md#Hard Constraints] — Zero server-side processing
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Tool component file structure, `src/components/feature/css/`
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Message Format] — Concise, actionable, with example
- [Source: _bmad-output/project-context.md] — 53 project rules (named exports, type not interface, Array<T>, etc.)
- [Source: src/components/feature/generator/PasswordGenerator.tsx] — RangeInput/FieldForm usage, FlagToggle pattern
- [Source: src/components/feature/generator/HashGenerator.tsx] — Recent inline tool layout pattern
- [Source: src/components/feature/generator/UuidGenerator.tsx] — Output box styling pattern
- [Source: src/components/common/input/RangeInput.tsx] — Range slider component (supports negative values)
- [Source: src/components/common/form/FieldForm.tsx] — Form field wrapper routing to RangeInput
- [Source: src/constants/tool-registry.ts] — Current registry with 16 tools, alphabetical ordering
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey union and ToolCategory type to update
- [Source: src/components/common/sidebar/Sidebar.tsx:13] — CATEGORY_ORDER array to update
- [Source: vite.config.ts] — Pre-render routes pattern (16 current routes, adding 17th)
- [Source: _bmad-output/implementation-artifacts/8-3-hash-generator.md] — Previous story: code review race condition fixes, clearError pattern
- [Source: _bmad-output/implementation-artifacts/8-2-password-generator.md] — Previous story: RangeInput creation, FlagToggle, generator pattern
- [Source: MDN — box-shadow] — CSS box-shadow property specification

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no issues encountered during implementation.

### Completion Notes List

- Created `BoxShadowConfig` type, `DEFAULT_BOX_SHADOW` constant, `hexToRgba()` and `generateBoxShadowCSS()` utility functions
- 14 unit tests covering: default CSS output, inset toggle, zero values, negative offsets, negative spread, custom colors with alpha, max values, hex-to-rgba conversion (3-char, 6-char, with/without hash, zero/full alpha)
- BoxShadowGenerator component with 5 range sliders (h-offset, v-offset, blur, spread, alpha), native color picker, inset toggle, live preview box, and CSS output with CopyButton
- New `CSS` category added to type system, CATEGORY_ORDER, and sidebar
- Tool registered in TOOL_REGISTRY with lazy-loaded code-split chunk
- Pre-render route added to vite.config.ts (17 total routes)
- All barrel exports wired: css/index.ts → feature/index.ts, box-shadow.ts → utils/index.ts
- 519 tests pass (505 existing + 14 new), 0 regressions, lint clean, build succeeds

### File List

**Created:**
- `src/utils/box-shadow.ts` — BoxShadowConfig type, DEFAULT_BOX_SHADOW, hexToRgba(), generateBoxShadowCSS()
- `src/utils/box-shadow.spec.ts` — 14 unit tests for box-shadow utilities
- `src/components/feature/css/BoxShadowGenerator.tsx` — Box Shadow Generator component
- `src/components/feature/css/index.ts` — CSS feature barrel export

**Modified:**
- `src/types/constants/tool-registry.ts` — Added 'CSS' to ToolCategory, 'box-shadow-generator' to ToolRegistryKey
- `src/constants/tool-registry.ts` — Added box-shadow-generator registry entry
- `src/components/common/sidebar/Sidebar.tsx` — Added 'CSS' to CATEGORY_ORDER
- `src/components/feature/index.ts` — Added css barrel re-export
- `src/utils/index.ts` — Added box-shadow barrel re-export
- `vite.config.ts` — Added box-shadow-generator pre-render route

## Senior Developer Review (AI)

**Reviewer:** csrteam | **Date:** 2026-02-15 | **Outcome:** Approved with fixes applied

**Issues Found:** 0 High, 4 Medium, 4 Low
**Issues Fixed:** 4 (all MEDIUM)

### Fixed Issues

1. **[M1] DRY violation — duplicate DEFAULT_CONFIG** — Removed redundant `DEFAULT_CONFIG` constant; now imports `DEFAULT_BOX_SHADOW` from `@/utils` (matches PasswordGenerator pattern)
2. **[M2] Code smell — `void clearError`** — Changed to `const { error } = useToolError()` matching UuidGenerator/PasswordGenerator pattern
3. **[M3] A11y — redundant `aria-label` on color input** — Removed `aria-label="Shadow color"` since `<label htmlFor>` already provides the accessible name
4. **[M4] Type safety — `handleNumberChange` key too permissive** — Restricted key type to `keyof Pick<BoxShadowConfig, 'alpha' | 'blur' | 'hOffset' | 'spread' | 'vOffset'>`

### Remaining Low Issues (not fixed)

- [L1] Missing `aria-live="polite"` on CSS output region
- [L2] `hexToRgba` has no input validation for invalid hex strings
- [L3] Missing test for uppercase hex input
- [L4] Default values test is a constant snapshot (low behavioral value)

### Verification

- `pnpm format:check` — clean
- `pnpm lint` — 0 errors (3 pre-existing warnings)
- `pnpm test` — 519 passed, 0 failed
- `pnpm build` — success, 17 pre-rendered routes, BoxShadowGenerator chunk: 3.28 kB (1.32 kB gzip)

## Change Log

- 2026-02-15: Story implemented — CSS Box Shadow Generator with full category bootstrap, 14 unit tests, live preview component, and all registry integrations
- 2026-02-15: Code review — 4 MEDIUM issues fixed (DRY violation, code smell, a11y mismatch, type safety); story approved
