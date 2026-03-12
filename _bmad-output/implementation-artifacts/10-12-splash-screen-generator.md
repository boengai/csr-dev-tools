---
story: 10.12
title: Splash Screen Generator
status: review
epic: 10
---

# Story 10.12: Splash Screen Generator

Status: review

## Story

As a **PWA developer**,
I want **to upload a single image and generate all required iOS splash screens, Android/PWA icons (standard + maskable), and configuration files**,
so that **I don't have to manually create dozens of image assets for every device resolution and can ship PWA-ready assets in seconds**.

## Acceptance Criteria

1. **Tool Registration:** The Splash Screen Generator tool is registered in `TOOL_REGISTRY` under the Image category with key `splash-screen-generator`, emoji, name, description, SEO metadata, routePath `/tools/splash-screen-generator`, and lazy-loaded component.

2. **File Upload:** User can upload an image (PNG, JPG, SVG, WebP) via `UploadInput` with drag & drop support. Minimum recommended input: 512x512 or higher with 1:1 aspect ratio. Display a warning (not a block) if the source image is smaller than 512x512.

3. **Background Color Picker:** User can select a background color (default `#ffffff`) that is applied behind the source image on all generated splash screens and as padding for maskable icons.

4. **iOS Splash Screens — Portrait & Landscape:** Generates `apple-touch-startup-image` assets for all current iPhone and iPad devices in both portrait and landscape orientations. Device manifest must include at minimum:
   - **iPhones:** iPhone 17 Pro Max (1320x2868), iPhone 17 Pro (1206x2622), iPhone 17/17 Air (1290x2796), iPhone 16 Pro Max (1320x2868), iPhone 16 Pro (1206x2622), iPhone 16/16 Plus (1290x2796/1284x2778), iPhone 15 Pro Max (1290x2796), iPhone 15 Pro (1179x2556), iPhone 15/14 (1170x2532), iPhone 14 Pro Max (1290x2796), iPhone 14 Pro (1179x2556), iPhone SE 4th gen (1290x2796), iPhone 13 mini/12 mini (1080x2340), iPhone 8/SE (750x1334), iPhone 8 Plus (1242x2208)
   - **iPads:** iPad Pro 12.9" (2048x2732), iPad Pro 11" (1668x2388), iPad Air 10.9" (1640x2360), iPad 10.2" (1620x2160), iPad mini 8.3" (1488x2266)
   - Landscape versions swap width/height for each device

5. **Android/PWA Standard Icons:** Generates standard (non-maskable) icons at sizes: 48x48, 72x72, 96x96, 128x128, 144x144, 192x192, 384x384, 512x512 — source image centered/scaled to fill.

6. **Android/PWA Maskable Icons:** Generates maskable icons at 192x192 and 512x512. The source image is scaled to fit within the inner 80% safe zone circle, with the selected background color filling the outer area. The `purpose` field in manifest output is set to `"maskable"`.

7. **Safe Zone Preview:** A live preview panel shows three frames — maskable icon (square with safe zone circle), portrait splash (iPhone ratio), and landscape splash — all reflecting the current image scale and background color in real time. The safe zone circle border auto-contrasts with the background color (dark on light, light on dark).

8. **iOS Meta Tags Generation:** Generates copyable `<link rel="apple-touch-startup-image" href="..." media="...">` tags with correct `device-width`, `device-height`, `device-pixel-ratio`, and `orientation` media queries for each generated splash screen.

9. **Manifest JSON Generation:** Generates a copyable `icons` array for `manifest.json` containing all standard and maskable icon entries with correct `src`, `sizes`, `type`, and `purpose` fields.

10. **Preview Grid:** Generated assets are displayed in a tabbed/sectioned preview organized by category:
    - **iOS Splash** — grouped by device family (iPhone / iPad), showing dimensions
    - **Android/PWA Icons** — grid showing all icon sizes with maskable indicator
    - **PWA Config** — meta tags + manifest JSON with copy buttons

11. **Individual Download:** Each generated asset can be downloaded individually by clicking on it.

12. **Download All ZIP:** A "Download All" button bundles all assets into a ZIP with organized folder structure:
    - `/ios-splash/` — all splash screen PNGs named by device (e.g., `iphone-17-pro-max-portrait.png`)
    - `/icons/` — standard icons (e.g., `icon-192x192.png`)
    - `/icons/maskable/` — maskable icons (e.g., `maskable-icon-512x512.png`)
    - `apple-splash-meta.html` — iOS meta tags file
    - `manifest-icons.json` — manifest icons array

13. **Generation Progress:** A progress indicator shows generation status (e.g., "Generating 47/62 assets...") since the total asset count is large (~50-60 images).

14. **Client-Side Only:** All processing uses the Canvas API — zero network requests. No data sent to any server.

15. **Image Scale Control:** User can adjust the source image scale (10%–100%, default 50%) via a range slider. The preview updates in real time. 80% aligns with the maskable safe zone. The scale is applied to all generated splash screens and icons.

16. **Upload New (In-Dialog):** "Upload New" button opens the native file picker directly while staying in the Dialog. Selecting a new file resets and regenerates in place — no need to close the Dialog.

17. **Unit Tests:** Tests in `src/utils/splash-screen.spec.ts` cover: device manifest completeness (all devices have valid dimensions), splash screen canvas dimensions match device specs, maskable icon safe zone padding calculation (inner 80%), meta tag generation with correct media queries, manifest JSON schema validity.

## Tasks / Subtasks

- [x] Task 1: Create device manifest data (AC: #4, #5, #6)
  - [x] 1.1 Create `src/constants/splash-screen.ts` with `IOS_DEVICES` array (name, width, height, scaleFactor, category) for all iPhone and iPad models
  - [x] 1.2 Add `PWA_ICON_SIZES` array for standard icon sizes (48-512)
  - [x] 1.3 Add `MASKABLE_ICON_SIZES` array for maskable sizes (192, 512)
  - [x] 1.4 Add `MASKABLE_SAFE_ZONE_RATIO` constant (0.8)
  - [x] 1.5 Export all from `src/constants/index.ts` barrel

- [x] Task 2: Create splash screen utility functions (AC: #4, #5, #6, #8, #9)
  - [x] 2.1 Create `src/utils/splash-screen.ts` with types: `SplashScreenDevice`, `SplashScreenResult`, `PwaIconResult`, `SplashScreenGeneratorOutput`
  - [x] 2.2 Implement `generateSplashScreen(image, device, orientation, bgColor, imageScale)` — composites source image centered on background color at device resolution with configurable scale
  - [x] 2.3 Implement `generatePwaIcon(image, size, maskable, bgColor, imageScale)` — generates standard or maskable icon with safe zone padding and configurable scale
  - [x] 2.4 Implement `generateAllAssets(image, bgColor, imageScale, onProgress?)` — orchestrates generation of all splash screens + icons with progress callback
  - [x] 2.5 Implement `generateSplashMetaTags(devices)` — generates `<link rel="apple-touch-startup-image">` HTML with media queries
  - [x] 2.6 Implement `generateManifestIcons()` — generates manifest.json `icons` array
  - [x] 2.7 Implement `downloadSplashScreenZip(output)` — bundles all assets into organized ZIP using JSZip
  - [x] 2.8 Export types and functions from `src/utils/index.ts` barrel

- [x] Task 3: Create SplashScreenGenerator component (AC: #1, #2, #3, #7, #10, #11, #12, #13)
  - [x] 3.1 Create `src/components/feature/image/SplashScreenGenerator.tsx` (named export)
  - [x] 3.2 Implement image upload with format validation and dimension warning
  - [x] 3.3 Implement background color picker input
  - [x] 3.4 Implement three-frame live preview: maskable icon (with contrast-aware safe zone circle), portrait splash (iPhone ratio), landscape splash — all reflecting current scale and background color
  - [x] 3.5 Implement generation trigger with progress indicator ("Generating X/Y assets...")
  - [x] 3.6 Implement results Dialog with tabbed sections (iOS Splash | Android Icons | PWA Config)
  - [x] 3.7 Implement iOS splash preview grid grouped by device family with individual download
  - [x] 3.8 Implement Android icon preview grid with maskable indicator
  - [x] 3.9 Implement meta tags + manifest JSON display with CopyButton
  - [x] 3.10 Implement "Download All" ZIP button
  - [x] 3.11 Export from `src/components/feature/image/index.ts`
  - [x] 3.12 Implement image scale slider (10%–100%, default 50%) with RangeInput and live preview (AC: #15)
  - [x] 3.13 Implement in-dialog "Upload New" via hidden file input ref — opens file picker without closing Dialog (AC: #16)
  - [x] 3.14 Implement contrast-aware safe zone border color (dark on light bg, light on dark bg) (AC: #7)

- [x] Task 4: Register tool (AC: #1)
  - [x] 4.1 Add `splash-screen-generator` entry to `src/constants/tool-registry.ts` (category: 'Image', lazy import)
  - [x] 4.2 Add `'splash-screen-generator'` to `ToolRegistryKey` type in `src/types/constants/tool-registry.ts`
  - [x] 4.3 Add pre-render route in `vite.config.ts` toolRoutes array

- [x] Task 5: Write unit tests (AC: #15)
  - [x] 5.1 Create `src/utils/splash-screen.spec.ts`
  - [x] 5.2 Test device manifest: all devices have valid positive dimensions, unique names, category assignment
  - [x] 5.3 Test splash screen dimensions: portrait and landscape orientations swap correctly
  - [x] 5.4 Test maskable safe zone: padding calculation produces correct inner 80% dimensions
  - [x] 5.5 Test meta tag generation: valid HTML with correct media query attributes
  - [x] 5.6 Test manifest JSON: valid schema with correct sizes, type, and purpose fields
  - [x] 5.7 Test ZIP folder structure: correct paths for ios-splash/, icons/, icons/maskable/

- [x] Task 6: Verify build and lint (AC: #1, #14)
  - [x] 6.1 Run `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`

## Dev Notes

### Architecture & Processing Pattern

**Leverage existing patterns from FaviconGenerator:**
- `src/utils/favicon.ts` provides the proven Canvas resize + Blob + ZIP pattern. The splash screen utility follows the same approach but with added background color compositing and more output targets.
- `JSZip` is already a dependency — reuse for ZIP bundling.
- `UploadInput` from `@/components/common` handles file upload with drag & drop.
- `CopyButton` from `@/components/common` for copy-to-clipboard on meta tags and manifest JSON.
- `Dialog` from `@/components/common` for the results view (same pattern as FaviconGenerator).

**Canvas compositing for splash screens:**
```typescript
// Center source image on colored background
const canvas = document.createElement('canvas')
canvas.width = deviceWidth
canvas.height = deviceHeight
const ctx = canvas.getContext('2d')
ctx.fillStyle = backgroundColor
ctx.fillRect(0, 0, deviceWidth, deviceHeight)

// Scale source to fit (contain) within canvas
const scale = Math.min(deviceWidth / img.width, deviceHeight / img.height) * 0.5
const scaledW = img.width * scale
const scaledH = img.height * scale
const x = (deviceWidth - scaledW) / 2
const y = (deviceHeight - scaledH) / 2
ctx.drawImage(img, x, y, scaledW, scaledH)
```

**Maskable icon safe zone:**
```typescript
// Inner 80% is the safe zone — scale image to fit within it
const safeZoneSize = iconSize * MASKABLE_SAFE_ZONE_RATIO // 0.8
const scale = Math.min(safeZoneSize / img.width, safeZoneSize / img.height)
const scaledW = img.width * scale
const scaledH = img.height * scale
const x = (iconSize - scaledW) / 2
const y = (iconSize - scaledH) / 2
```

**iOS meta tag media query format:**
```html
<link rel="apple-touch-startup-image"
  href="/ios-splash/iphone-17-pro-max-portrait.png"
  media="(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)">
```

**Performance consideration:** With 50-60 images to generate, use `requestAnimationFrame` batching or chunked async generation with a progress callback to keep the UI responsive. A full Web Worker is optional but the progress callback pattern is required.

### Component Structure Pattern

Follow the FaviconGenerator pattern (most similar tool):

```
State:
- source: File | null
- sourcePreview: string (object URL)
- backgroundColor: string (hex, default '#ffffff')
- results: SplashScreenGeneratorOutput | null
- processing: boolean
- progress: { current: number, total: number } | null

Layout (in Dialog):
- Source image preview with safe zone overlay
- Background color picker
- Generate button
- Progress indicator during generation
- Tabbed results: iOS Splash | Android Icons | PWA Config
- Download All ZIP button
```

### Project Structure Notes

- **Component:** `src/components/feature/image/SplashScreenGenerator.tsx`
- **Constants:** `src/constants/splash-screen.ts` — device manifest, icon sizes, safe zone ratio
- **Utils:** `src/utils/splash-screen.ts` — generation functions, meta tag builders, ZIP bundler
- **Types:** Colocate types in the utils file (same pattern as `src/utils/favicon.ts`)
- **Tests:** `src/utils/splash-screen.spec.ts`
- **Barrel exports:** Update `src/components/feature/image/index.ts`, `src/constants/index.ts`, `src/utils/index.ts`

### Key Anti-Patterns to Avoid

- **Do NOT** use `export default` — named export only
- **Do NOT** import from `framer-motion` — use `motion/react`
- **Do NOT** use `interface` — use `type` only
- **Do NOT** use `string[]` — use `Array<string>`
- **Do NOT** use `npm` or `npx` — use `pnpm` only
- **Do NOT** use `eslint` — use `oxlint`
- **Do NOT** merge this with FaviconGenerator — keep as standalone tool with separate util file
- **Do NOT** pre-generate all assets on upload — wait for user to configure background color and click generate

### References

- [Source: src/utils/favicon.ts — Canvas resize + Blob + ZIP pattern]
- [Source: src/components/feature/image/FaviconGenerator.tsx — upload + Dialog + grid + download pattern]
- [Source: src/constants/tool-registry.ts — tool registration format]
- [Source: src/types/constants/tool-registry.ts — ToolRegistryKey union]
- [Source: _bmad-output/implementation-artifacts/10-3-favicon-generator.md — reference story for similar tool]
- [Reference: https://progressier.com/pwa-icons-and-ios-splash-screen-generator — feature reference]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed floating-point precision test: `toBe(153.6)` → `toBeCloseTo(153.6)` for `192 * 0.8`
- Added explicit `import { describe, expect, it } from 'vitest'` for tsc compatibility (project convention)
- Fixed Tabs not showing active state: switched from `defaultValue` (uncontrolled) to `injected` (controlled) — indicator animation requires controlled value changes
- Fixed safe zone border invisible on matching backgrounds — added luminance-based contrast detection

### Completion Notes List

- Implemented complete Splash Screen Generator tool following FaviconGenerator patterns
- Device manifest covers 19 iPhones + 5 iPads with portrait/landscape orientations (48 splash screens total)
- 8 standard PWA icons (48-512px) + 2 maskable icons (192, 512) = 10 icons
- Total ~58 assets generated per run with progress callback
- Canvas compositing: source centered on background color, maskable icons respect 80% safe zone
- iOS meta tags use correct logical dimensions (device pixels / scale factor)
- Manifest JSON includes both `any` and `maskable` purpose entries
- ZIP organized: ios-splash/, icons/, icons/maskable/, plus meta HTML and manifest JSON files
- Component uses Dialog, Tabs, UploadInput, CopyButton, RangeInput from common components
- Three-frame live preview: maskable icon (with safe zone circle), portrait splash (iPhone ratio), landscape splash
- Safe zone circle border auto-contrasts with background via luminance detection
- Image scale slider (10%–100%, default 50%) controls source image size in all generated assets; 80% aligns with maskable safe zone
- "Upload New" opens native file picker in-dialog via hidden input ref — no Dialog close needed
- Tabs use controlled mode (`injected`) for correct tab indicator animation
- 32 unit tests covering: device manifest, dimensions, safe zone math, meta tags, manifest JSON, ZIP paths
- All 1509 tests pass, build succeeds, format clean

### Change Log

- 2026-03-12: Initial implementation of Story 10.12 — Splash Screen Generator
- 2026-03-12: Fix Tabs controlled mode for tab indicator animation
- 2026-03-12: Add in-dialog "Upload New" via hidden file input (both SplashScreen and FaviconGenerator)
- 2026-03-12: Add image scale slider (10%–100%) with live three-frame preview (icon, portrait, landscape)
- 2026-03-12: Fix safe zone border contrast — auto-switches based on background luminance

### File List

- `src/constants/splash-screen.ts` (new) — Device manifest, icon sizes, safe zone ratio
- `src/constants/index.ts` (modified) — Added splash-screen barrel export
- `src/utils/splash-screen.ts` (new) — Generation functions, meta tag/manifest builders, ZIP bundler
- `src/utils/splash-screen.spec.ts` (new) — 32 unit tests
- `src/utils/index.ts` (modified) — Added splash-screen barrel export
- `src/components/feature/image/SplashScreenGenerator.tsx` (new) — Main component
- `src/components/feature/image/index.ts` (modified) — Added SplashScreenGenerator barrel export
- `src/constants/tool-registry.ts` (modified) — Added splash-screen-generator registry entry
- `src/types/constants/tool-registry.ts` (modified) — Added 'splash-screen-generator' to ToolRegistryKey
- `vite.config.ts` (modified) — Added pre-render route for splash-screen-generator
