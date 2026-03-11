# Story 10.2: Image Cropping

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to crop images using freeform selection or common aspect ratio presets**,
so that **I can quickly trim images to exact dimensions for different use cases**.

## Acceptance Criteria

1. **Tool Registration:** The Image Cropping tool is registered in `TOOL_REGISTRY` under the Image category with key `image-cropper`, emoji `✂️`, name `Image Cropper`, description, SEO metadata, routePath `/tools/image-cropper`, and lazy-loaded component.

2. **File Upload:** A user can upload any image via `UploadInput` (single file, `accept="image/*"`). On upload, the image is displayed in an interactive cropping canvas with a draggable/resizable selection region overlaid.

3. **Aspect Ratio Presets:** An aspect ratio selector offers presets: Freeform, 16:9, 4:3, 1:1, 3:2. Selecting a preset constrains the selection region to that ratio. Freeform (default) allows unconstrained selection.

4. **Interactive Crop Selection:** The user can drag the selection region to reposition it and drag the corner/edge handles to resize it. The crop overlay darkens the area outside the selection to visually preview the result. Selection is clamped to image bounds.

5. **Crop Dimensions Display:** The current crop dimensions (width x height in pixels) are displayed and update in real-time as the user adjusts the selection.

6. **Crop & Download:** The user clicks "Crop & Download" to apply the crop and download the result with filename format `cropped-{original-name}.{ext}`. A `ProgressBar` appears only if processing exceeds 300ms. Toast confirms: "Downloaded cropped-{filename}".

7. **Mobile Touch Support:** On mobile, the cropping canvas is touch-friendly with minimum 44x44px drag handles. Pinch-to-zoom on the page is not intercepted by the cropping interaction (the crop selection uses drag/resize gestures, not pinch).

8. **Performance:** Cropping completes within 3 seconds for files up to 10MB (NFR2).

9. **Client-Side Only:** All processing uses the Canvas API — zero network requests (NFR9).

10. **Unit Tests:** Tests in `src/utils/crop.spec.ts` cover: crop region validation and clamping, aspect ratio constraint calculation, pixel coordinate scaling from display to natural dimensions, edge cases (crop to full image, crop to minimum size, zero/negative values).

## Tasks / Subtasks

- [x] Task 1: Install `react-image-crop` library (AC: #4, #7)
  - [x] 1.1 Run `pnpm add react-image-crop` (exact version pinned by .npmrc)
  - [x] 1.2 Import `react-image-crop/dist/ReactCrop.css` in the component
- [x] Task 2: Create crop utility functions (AC: #4, #5, #10)
  - [x] 2.1 Create `src/utils/crop.ts` with `CropRegion` type, aspect ratio helpers, `cropImageToBlob()`, `scaleCropToNatural()`
  - [x] 2.2 Create `src/types/utils/crop.ts` with exported types
  - [x] 2.3 Update `src/utils/index.ts` barrel export
  - [x] 2.4 Update `src/types/utils/index.ts` barrel export
- [x] Task 3: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 3.1 Add `image-cropper` entry to `src/constants/tool-registry.ts` (category: 'Image', lazy import)
  - [x] 3.2 Add `'image-cropper'` to `ToolRegistryKey` type in `src/types/constants/tool-registry.ts` (alphabetical: between `'image-converter'` and `'image-resizer'`)
  - [x] 3.3 Add pre-render route in `vite.config.ts` toolRoutes array
- [x] Task 4: Create ImageCropper component (AC: #2, #3, #4, #5, #6, #7)
  - [x] 4.1 Create `src/components/feature/image/ImageCropper.tsx` (named export `ImageCropper`)
  - [x] 4.2 Export from `src/components/feature/image/index.ts`
  - [x] 4.3 Implement file upload with `UploadInput` (accept all image formats)
  - [x] 4.4 Implement `ReactCrop` component with aspect ratio preset buttons
  - [x] 4.5 Implement crop dimensions display (width x height in pixels)
  - [x] 4.6 Implement "Crop & Download" with Canvas API cropping and download
  - [x] 4.7 Add ProgressBar for operations exceeding 300ms
- [x] Task 5: Write unit tests (AC: #10)
  - [x] 5.1 Create `src/utils/crop.spec.ts` with tests for all crop utility functions
- [x] Task 6: Verify build and lint (AC: #1, #9)
  - [x] 6.1 Run `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`

## Dev Notes

### Library Choice: `react-image-crop`

**Install:** `pnpm add react-image-crop`

**Why this library:**
- Zero dependencies — lightweight (~4KB gzipped)
- Provides the interactive crop overlay UI (drag/resize handles, aspect ratio locking, visual darkening)
- Touch support built-in for mobile
- Pixel and percentage-based crop coordinates
- Active maintenance, React 19 compatible
- Deliberately minimal — we build features on top (download, Canvas cropping)

**What it does NOT do:**
- Does NOT perform the actual pixel-level crop (that's our Canvas API code)
- Does NOT handle download or file output

**Import pattern:**
```typescript
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

import type { Crop, PixelCrop } from 'react-image-crop'
```

**Note:** `react-image-crop` uses a default export (`ReactCrop`). This is an exception — it's an external library pattern, not our component. Our `ImageCropper` component is still a named export.

### Crop Utility Functions — `src/utils/crop.ts`

Create a dedicated utility file for crop-related pure functions. These are testable without DOM.

**Types (`src/types/utils/crop.ts`):**
```typescript
export type CropRegion = {
  height: number
  width: number
  x: number
  y: number
}

export type AspectRatioPreset = '1:1' | '16:9' | '3:2' | '4:3' | 'free'

export type AspectRatioOption = {
  label: string
  ratio: number | undefined
  value: AspectRatioPreset
}
```

**Constants and helpers (`src/utils/crop.ts`):**
```typescript
export const ASPECT_RATIO_OPTIONS: Array<AspectRatioOption> = [
  { label: 'Free', ratio: undefined, value: 'free' },
  { label: '16:9', ratio: 16 / 9, value: '16:9' },
  { label: '4:3', ratio: 4 / 3, value: '4:3' },
  { label: '1:1', ratio: 1, value: '1:1' },
  { label: '3:2', ratio: 3 / 2, value: '3:2' },
]

export const getAspectRatio = (preset: AspectRatioPreset): number | undefined => {
  return ASPECT_RATIO_OPTIONS.find((o) => o.value === preset)?.ratio
}
```

**Coordinate scaling function:**
```typescript
export const scaleCropToNatural = (
  crop: CropRegion,
  displayWidth: number,
  displayHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): CropRegion => {
  const scaleX = naturalWidth / displayWidth
  const scaleY = naturalHeight / displayHeight
  return {
    height: Math.round(crop.height * scaleY),
    width: Math.round(crop.width * scaleX),
    x: Math.round(crop.x * scaleX),
    y: Math.round(crop.y * scaleY),
  }
}
```

**Crop region validation (clamp within bounds):**
```typescript
export const clampCropRegion = (
  crop: CropRegion,
  maxWidth: number,
  maxHeight: number,
): CropRegion => {
  const x = Math.max(0, Math.min(crop.x, maxWidth - 1))
  const y = Math.max(0, Math.min(crop.y, maxHeight - 1))
  const width = Math.max(1, Math.min(crop.width, maxWidth - x))
  const height = Math.max(1, Math.min(crop.height, maxHeight - y))
  return { height, width, x, y }
}
```

**Default crop region (centered 80% of image):**
```typescript
export const getDefaultCrop = (
  imageWidth: number,
  imageHeight: number,
  aspectRatio?: number,
): CropRegion => {
  const cropWidth = Math.round(imageWidth * 0.8)
  const cropHeight = aspectRatio
    ? Math.round(cropWidth / aspectRatio)
    : Math.round(imageHeight * 0.8)
  const clampedHeight = Math.min(cropHeight, imageHeight)
  const clampedWidth = aspectRatio
    ? Math.round(clampedHeight * aspectRatio)
    : cropWidth
  return {
    height: clampedHeight,
    width: Math.min(clampedWidth, imageWidth),
    x: Math.round((imageWidth - Math.min(clampedWidth, imageWidth)) / 2),
    y: Math.round((imageHeight - clampedHeight) / 2),
  }
}
```

### Canvas API Crop Function

This runs in the component (requires DOM). NOT in the utility file (which must be testable in node env).

```typescript
const cropImageCanvas = (
  image: HTMLImageElement,
  crop: CropRegion,
  mimeType: string,
  quality?: number,
): string => {
  const canvas = document.createElement('canvas')
  canvas.width = crop.width
  canvas.height = crop.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')

  ctx.drawImage(
    image,
    crop.x, crop.y, crop.width, crop.height,
    0, 0, crop.width, crop.height,
  )

  return canvas.toDataURL(mimeType, quality)
}
```

**Important:** The `crop` coordinates passed to `drawImage` must be in the image's NATURAL pixel coordinates (not the displayed/CSS dimensions). Use `scaleCropToNatural()` to convert from react-image-crop's pixel values (relative to displayed size) to natural image pixel coordinates.

### Component Structure Pattern

Follow the ImageCompressor pattern (most similar tool, story 10-1):

```
State:
- source: File | null (uploaded file)
- imageUrl: string | null (Object URL for preview — revoke on cleanup!)
- crop: Crop (react-image-crop state: { x, y, width, height, unit })
- completedCrop: PixelCrop | null (finalized pixel crop from onComplete)
- aspectPreset: AspectRatioPreset ('free' default)
- processing: boolean
- showProgress: boolean

Refs:
- imgRef: useRef<HTMLImageElement>(null) — image element for Canvas drawing
- downloadAnchorRef: useRef<HTMLAnchorElement>(null) — download trigger
- progressTimerRef: useRef<ReturnType<typeof setTimeout>>() — progress delay

Hooks:
- useToolError() for error handling
- useToast() for download confirmation

Layout:
- Tool description from TOOL_REGISTRY_MAP['image-cropper'].description
- UploadInput (accept="image/*", single file)
- Aspect ratio preset buttons (horizontal row)
- ReactCrop wrapper with <img> inside
- Crop dimensions display (W x H in pixels)
- "Crop & Download" button (primary)
- ProgressBar (only when processing > 300ms)
- Hidden download anchor element
- Error display (inline, role="alert")
```

### `react-image-crop` Integration

**Component usage:**
```typescript
<ReactCrop
  aspect={getAspectRatio(aspectPreset)}
  crop={crop}
  onChange={(c) => setCrop(c)}
  onComplete={(c) => setCompletedCrop(c)}
>
  <img
    alt="Crop preview"
    onLoad={handleImageLoad}
    ref={imgRef}
    src={imageUrl}
    style={{ maxHeight: '60vh', maxWidth: '100%' }}
  />
</ReactCrop>
```

**Key props:**
- `crop` — controlled crop state (Crop type: `{x, y, width, height, unit}`)
- `onChange` — fires continuously as user drags (update visual state)
- `onComplete` — fires when drag ends (PixelCrop with final pixel values)
- `aspect` — locks aspect ratio when set, `undefined` for freeform
- `minWidth` / `minHeight` — minimum crop size in pixels (use 10 for usability)

**`onImageLoad` handler — set default crop:**
```typescript
const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const { naturalWidth, naturalHeight, width, height } = e.currentTarget
  // Store natural dimensions for coordinate scaling
  // Set initial crop to 80% centered
  const defaultCrop = getDefaultCrop(width, height, getAspectRatio(aspectPreset))
  setCrop({ ...defaultCrop, unit: 'px' })
}
```

### Aspect Ratio Preset Buttons

Render as a horizontal row of toggle buttons:
```typescript
<div className="flex flex-wrap gap-2">
  {ASPECT_RATIO_OPTIONS.map((option) => (
    <button
      className={tv-class-for-selected-state}
      key={option.value}
      onClick={() => handleAspectChange(option.value)}
      type="button"
    >
      {option.label}
    </button>
  ))}
</div>
```

**When aspect ratio changes:**
1. Update `aspectPreset` state
2. Reset `crop` to a new default crop with the selected ratio
3. The `ReactCrop` component automatically constrains future adjustments

### Crop Dimensions Display

Show the crop size in the image's natural pixel dimensions:
```typescript
const naturalCrop = completedCrop && imgRef.current
  ? scaleCropToNatural(
      completedCrop,
      imgRef.current.width,
      imgRef.current.height,
      imgRef.current.naturalWidth,
      imgRef.current.naturalHeight,
    )
  : null

// Display:
{naturalCrop && (
  <p className="text-body-xs text-gray-500">
    Crop: {naturalCrop.width} x {naturalCrop.height} px
  </p>
)}
```

### Download Pattern

Follow the exact pattern from ImageCompressor (story 10-1):

```typescript
const handleCropAndDownload = async () => {
  if (!completedCrop || !imgRef.current || !source) return

  setProcessing(true)
  progressTimerRef.current = setTimeout(() => setShowProgress(true), 300)

  try {
    const naturalCrop = scaleCropToNatural(
      completedCrop,
      imgRef.current.width,
      imgRef.current.height,
      imgRef.current.naturalWidth,
      imgRef.current.naturalHeight,
    )
    const clamped = clampCropRegion(naturalCrop, imgRef.current.naturalWidth, imgRef.current.naturalHeight)
    const mimeType = source.type || 'image/png'
    const dataUrl = cropImageCanvas(imgRef.current, clamped, mimeType)

    const anchor = downloadAnchorRef.current
    if (!anchor) return
    const baseName = source.name.replace(/\.[^.]+$/, '')
    const ext = source.name.split('.').pop() || 'png'
    anchor.href = dataUrl
    anchor.download = `cropped-${baseName}.${ext}`
    anchor.click()
    toast({ action: 'add', item: { label: `Downloaded cropped-${baseName}.${ext}`, type: 'success' } })
  } catch {
    setError('Failed to crop image. Please try again.')
  } finally {
    clearTimeout(progressTimerRef.current)
    setShowProgress(false)
    setProcessing(false)
  }
}

// At end of JSX:
<a className="hidden" download="" href="" ref={downloadAnchorRef} />
```

### Object URL Memory Management

**CRITICAL:** When displaying the uploaded image, use `URL.createObjectURL(file)` and revoke it on cleanup to prevent memory leaks:

```typescript
useEffect(() => {
  if (!source) {
    setImageUrl(null)
    return
  }
  const url = URL.createObjectURL(source)
  setImageUrl(url)
  return () => URL.revokeObjectURL(url)
}, [source])
```

### Error Display Pattern

Same as ImageCompressor:
```typescript
{error != null && (
  <p className="text-error text-body-sm shrink-0" role="alert">
    {error}
  </p>
)}
```

### ProgressBar for Long Operations

Same pattern as ImageCompressor. Import directly (not from barrel — known issue from 10-1):
```typescript
import { ProgressBar } from '@/components/common/progress-bar/ProgressBar'
```

Show only when processing exceeds 300ms:
```typescript
{showProgress && <ProgressBar value={50} />}
```

Clean up timer on unmount:
```typescript
useEffect(() => {
  return () => {
    clearTimeout(progressTimerRef.current)
  }
}, [])
```

### Input Locking During Processing

Dim inputs and disable interaction during crop processing (lesson from 10-1 code review):
```typescript
<div className={processing ? 'pointer-events-none opacity-70' : ''}>
  {/* ReactCrop and controls */}
</div>
```

### File Upload Handling

```typescript
const handleInputChange = (values: Array<File>) => {
  const file = values[0]
  if (!file) return

  clearError()
  setSource(file)
  setCompletedCrop(null)
}
```

**No format validation needed** — accept all image formats (`accept="image/*"`). Unlike compression (JPEG/WebP only), cropping works on any image format the browser can render.

### react-image-crop CSS Customization

The library ships default CSS. Import it in the component:
```typescript
import 'react-image-crop/dist/ReactCrop.css'
```

The default styling provides dark overlay on non-cropped areas and light border on the crop selection. This integrates well with the dark theme. If needed, override styles via Tailwind utilities on the wrapper div.

### Project Structure Notes

- **Component location:** `src/components/feature/image/ImageCropper.tsx` — same directory as `ImageCompressor.tsx`, `ImageConvertor.tsx`, `ImageResizer.tsx`
- **New utility file:** `src/utils/crop.ts` — pure functions for crop math (testable in node env)
- **New types file:** `src/types/utils/crop.ts` — `CropRegion`, `AspectRatioPreset`, `AspectRatioOption`
- **New test file:** `src/utils/crop.spec.ts` — unit tests for crop utilities
- **New dependency:** `react-image-crop` — interactive crop overlay UI
- **Barrel exports to update:**
  - `src/components/feature/image/index.ts` — add `ImageCropper`
  - `src/utils/index.ts` — add crop exports
  - `src/types/utils/index.ts` — add crop type exports

### Testing Standards

- **Test file:** `src/utils/crop.spec.ts` — dedicated test file for crop utilities
- **Test environment:** `node` (Vitest, no jsdom) — test pure utility functions only
- **Do NOT test Canvas-based cropping** — that's DOM code, tested via E2E
- **Do NOT test `react-image-crop` behavior** — that's the library's responsibility

**Tests should cover:**
- `scaleCropToNatural()`: scale factors, rounding, identity (display = natural)
- `clampCropRegion()`: within bounds (no-op), negative x/y, overflow width/height, zero dimensions, minimum 1px
- `getDefaultCrop()`: freeform (80% centered), with aspect ratio, portrait vs landscape images
- `getAspectRatio()`: all presets return correct values, 'free' returns undefined
- `ASPECT_RATIO_OPTIONS`: correct length, all presets present

### Previous Story Intelligence (10-1 Image Compression)

**Key learnings to apply:**
1. **Import ProgressBar directly** — `@/components/common/progress-bar/ProgressBar` (barrel export may not include it)
2. **Clear stale state on new upload** — reset `completedCrop`, `crop`, clear errors when a new file is uploaded
3. **Timer cleanup on unmount** — `useEffect` returning `clearTimeout(progressTimerRef.current)`
4. **Input dimming during processing** — add `opacity-70` + `pointer-events-none` when processing
5. **Test real application code** — don't create local duplicates of constants/utils in tests; import from `@/utils` and `@/constants`
6. **Format check** — `pnpm format` may reorder Tailwind classes; run it and commit any changes

### Git Intelligence

Recent commits follow pattern: `✨: story X-Y Description with code review fixes`. The branch is `bmad`. Commits are atomic per story.

### Key Anti-Patterns to Avoid

- **Do NOT** create a `ToolLayout` wrapper — each tool owns its own layout (deprecated pattern)
- **Do NOT** build a custom crop interaction from scratch — use `react-image-crop` (complex touch/drag interaction, proven library)
- **Do NOT** use `processImage()` for cropping — its 'cover' strategy is for aspect-ratio-fitting, not user-defined freeform crop regions
- **Do NOT** use `export default` — named export only: `export const ImageCropper`
- **Do NOT** import from `framer-motion` — use `motion/react` if animations are needed
- **Do NOT** use `interface` — use `type` only
- **Do NOT** use `string[]` — use `Array<string>`
- **Do NOT** use `npm` or `npx` — use `pnpm` only
- **Do NOT** add component rendering tests — project uses node env only (no jsdom)
- **Do NOT** place Canvas-based crop logic in `src/utils/crop.ts` — it requires DOM; keep it in the component. Utilities must be pure functions testable in node.
- **Do NOT** forget to `URL.revokeObjectURL()` — memory leak risk with image object URLs
- **Do NOT** show a spinner — use `ProgressBar` only when processing exceeds 300ms

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 10, Story 10.2]
- [Source: _bmad-output/planning-artifacts/prd.md#FR14, NFR2, NFR9]
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Processing Patterns, Error Handling, File Upload Pattern]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#File Upload Conventions, Processing State, Touch Interaction, Button Hierarchy]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: _bmad-output/implementation-artifacts/10-1-image-compression.md#Dev Notes, Code Review Fixes]
- [Source: src/utils/image.ts — processImage(), calculateDimensions(), validateCoordinates()]
- [Source: src/types/utils/image.ts — ImageProcessingOptions (cover strategy with x/y)]
- [Source: src/components/feature/image/ImageCompressor.tsx — download anchor pattern, upload handling, ProgressBar, error display]
- [Source: src/components/feature/image/ImageResizer.tsx — image preview pattern]
- [Source: src/constants/tool-registry.ts — registry entry pattern]
- [Source: src/types/constants/tool-registry.ts — ToolRegistryKey union type]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Build initially failed because spec file didn't explicitly import vitest globals (`describe`, `it`, `expect`). All other spec files in the project import them explicitly for `tsc -b` compatibility. Fixed by adding `import { describe, expect, it } from 'vitest'`.
- oxfmt reformatted Tailwind class ordering in ImageCropper.tsx (expected behavior).

### Completion Notes List

- Installed `react-image-crop@11.0.10` — interactive crop overlay with touch support
- Created `src/utils/crop.ts` with pure utility functions: `scaleCropToNatural`, `clampCropRegion`, `getDefaultCrop`, `getAspectRatio`, `ASPECT_RATIO_OPTIONS`
- Created `src/types/utils/crop.ts` with `CropRegion`, `AspectRatioPreset`, `AspectRatioOption` types
- Registered `image-cropper` in TOOL_REGISTRY with lazy-loaded component, SEO metadata, and pre-render route
- Created `ImageCropper` component with Dialog + Tabs flow matching ImageResizer/ImageConvertor UX pattern:
  - Import tab: centered upload button
  - Full-screen Dialog: ReactCrop canvas with grid background, aspect ratio presets (Free/16:9/4:3/1:1/3:2) and crop size display in same row with divider, "Crop" button at bottom
  - Download tab: check emoji, Download button, Start Over button
- Default crop set on image load and aspect ratio change so size info is always visible
- Canvas API crop processing, ProgressBar for long operations, input locking during processing, Object URL memory management
- Created 24 unit tests covering all crop utility functions: `getAspectRatio`, `scaleCropToNatural`, `clampCropRegion`, `getDefaultCrop`, `ASPECT_RATIO_OPTIONS`
- All 562 tests pass (24 new, 538 existing — 0 regressions)
- Lint: 0 errors, build: clean
- Post-review: 897 tests pass (26 crop tests, 871 existing — 0 regressions)

### Change Log

- 2026-02-15: Implemented story 10-2 Image Cropping — new tool with Dialog-based crop workflow (upload → crop in dialog → download tab), grid background, aspect ratio presets with inline size display
- 2026-02-20: Code review fixes (4 issues fixed):
  - H1: Merged separate "Crop" + "Download" into single "Crop & Download" button per AC #6
  - M1: Converted `cropImageCanvas` from sync `toDataURL` to async `toBlob` so ProgressBar can actually display during long operations
  - M2: Overrode `--rc-drag-handle-mobile-size` CSS variable to 44px for AC #7 mobile touch target compliance
  - M3: Added zero-division guard in `scaleCropToNatural` for edge case when display dimensions are 0
  - L2: Added 2 tests for zero display dimension edge cases (26 total, up from 24)

### File List

New files:
- src/components/feature/image/ImageCropper.tsx
- src/types/utils/crop.ts
- src/utils/crop.ts
- src/utils/crop.spec.ts

Modified files:
- src/components/feature/image/index.ts (added ImageCropper export)
- src/constants/tool-registry.ts (added image-cropper entry)
- src/types/constants/tool-registry.ts (added 'image-cropper' to ToolRegistryKey)
- src/types/utils/index.ts (added crop barrel export)
- src/utils/index.ts (added crop barrel export)
- vite.config.ts (added image-cropper pre-render route)
- package.json (added react-image-crop dependency)
- pnpm-lock.yaml (updated lockfile)
