---
story: 18.4
title: Image Color Picker
status: done
epic: 18
---

# Story 18.4: Image Color Picker

## Tool Metadata
- **Key:** `image-color-picker`
- **Name:** Image Color Picker
- **Category:** Image
- **Emoji:** 🎯
- **Route:** `/tools/image-color-picker`
- **SEO Title:** Image Color Picker - CSR Dev Tools
- **SEO Description:** Upload an image and click anywhere to extract colors. Get HEX, RGB, and HSL values instantly.

## Acceptance Criteria

**Given** the user uploads an image (via file input)
**When** the image loads
**Then** the image is drawn to a hidden canvas for pixel sampling

**Given** the user clicks on the canvas
**When** clicked
**Then** the color at that pixel is added to the palette (max 10) showing HEX, RGB, HSL

**Given** the user hovers over the canvas
**When** hovering
**Then** a live preview of the color under the cursor is shown

**Given** the palette has colors
**When** viewing
**Then** each color shows a swatch and HEX/RGB/HSL values with individual copy buttons

**Given** the user clicks "Clear Palette"
**When** clicked
**Then** all picked colors are removed

**Given** the dialog is closed
**When** closed
**Then** image URL is revoked, palette and state are reset

## Previous Story Intelligence (from 18.1–18.3)
- Dialog-based tools need `autoOpen` / `onAfterDialogClose` props
- File-processing tools require state cleanup on close (revoke object URLs)
- Canvas-based tools need scale factor for accurate pixel coordinates

## Implementation Checklist
1. [x] Create `src/utils/color-picker.ts` with `pixelToColor()`, `rgbToHex()`, `rgbToHsl()`
2. [x] Create `src/utils/color-picker.spec.ts` — 3 tests
3. [x] Create `src/components/feature/image/ImageColorPicker.tsx` — Dialog with canvas + palette
4. [x] Register in `TOOL_REGISTRY`
5. [x] Add `'image-color-picker'` to `ToolRegistryKey` union
6. [x] Export from `src/utils/index.ts`
7. [x] Accepts `autoOpen` / `onAfterDialogClose` props
8. [x] Object URL revoked on reset

## File List
| File | Action |
|------|--------|
| `src/utils/color-picker.ts` | NEW |
| `src/utils/color-picker.spec.ts` | NEW |
| `src/components/feature/image/ImageColorPicker.tsx` | NEW |
| `src/constants/tool-registry.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |

## Unit Tests
- 3 tests, all passing
- Covers: RGB to HEX conversion, RGB to HSL conversion, pixelToColor returns all formats
- Note: Canvas interaction is not unit-testable (requires DOM/browser); covered by manual/E2E testing
