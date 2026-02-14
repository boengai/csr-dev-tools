# Story 10.1: Image Compression

Status: done

## Story

As a **user**,
I want **to compress JPEG and WebP images using a quality slider and see the resulting file size before downloading**,
so that **I can optimize images for web use while controlling the quality-size tradeoff**.

## Acceptance Criteria

1. **Tool Registration:** The Image Compression tool is registered in `TOOL_REGISTRY` under the Image category with key `image-compressor`, emoji, name, description, SEO metadata, routePath `/tools/image-compressor`, and lazy-loaded component.

2. **File Upload:** A user can upload a JPEG or WebP image via `UploadInput` (single file, `accept="image/jpeg,image/webp"`). On upload, the original file name, file size (formatted as KB/MB), and dimensions (width x height) are displayed.

3. **Quality Slider:** A quality slider (range input 1-100, default 80) is displayed after image upload. The slider value maps to Canvas API quality 0.01-1.0 (divide by 100).

4. **Live Compression Preview:** When the user adjusts the quality slider, a compressed version is generated (debounced 300ms) and the estimated output file size is displayed next to the original size (e.g., "2.4 MB -> 890 KB"). The compression ratio percentage is shown (e.g., "63% smaller").

5. **Download:** The user clicks "Download" to save the compressed image with filename format `compressed-{original-name}.{ext}`. A `ProgressBar` appears only if compression exceeds 300ms. Toast confirms: "Downloaded compressed-{filename}".

6. **Format Rejection:** If a user uploads a non-JPEG/WebP image (PNG, GIF, BMP, AVIF), an inline error appears: "Image compression supports JPEG and WebP formats"

7. **Performance:** Compression completes within 3 seconds for files up to 10MB (NFR2).

8. **Client-Side Only:** All processing uses the Canvas API — zero network requests (NFR9).

9. **Unit Tests:** Tests in `src/utils/image.spec.ts` (or co-located) cover: JPEG compression, WebP compression, quality range validation (0.01-1.0 maps to 1-100 slider), unsupported format rejection, and file size calculation accuracy.

## Tasks / Subtasks

- [x] Task 1: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 1.1 Add `image-compressor` entry to `src/constants/tool-registry.ts` (category: 'Image', lazy import)
  - [x] 1.2 Add `'image-compressor'` to `ToolRegistryKey` type in `src/types/constants/tool-registry.ts` (alphabetical order: between `'image-converter'` and `'image-resizer'`)
  - [x] 1.3 Add pre-render route in `vite.config.ts` toolRoutes array
- [x] Task 2: Create ImageCompressor component (AC: #2, #3, #4, #5, #6)
  - [x] 2.1 Create `src/components/feature/image/ImageCompressor.tsx` (named export `ImageCompressor`)
  - [x] 2.2 Export from `src/components/feature/image/index.ts`
  - [x] 2.3 Implement file upload with format validation (JPEG/WebP only)
  - [x] 2.4 Implement quality slider (1-100 range input, default 80)
  - [x] 2.5 Implement debounced compression preview with before/after file size display
  - [x] 2.6 Implement download with filename format `compressed-{original-name}.{ext}`
  - [x] 2.7 Add ProgressBar for operations exceeding 300ms
- [x] Task 3: Write unit tests (AC: #9)
  - [x] 3.1 Test compression utility functions (quality mapping, format validation, size calculation)
- [x] Task 4: Verify build and lint (AC: #1, #8)
  - [x] 4.1 Run `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`

## Dev Notes

### Architecture & Processing Pattern

**Use existing utilities — do NOT reinvent:**
- `processImage(file, options)` from `@/utils` already handles quality-based compression via `ImageProcessingOptions.quality` (0-1 range). It loads the image onto a Canvas and re-encodes at the specified quality. The `strategy` field is required (use `'stretch'` to preserve original dimensions).
- `isValidImageFormat(format)` from `@/utils` validates all image MIME types — but do NOT use it for this tool's upload validation since it accepts PNG/GIF/BMP/AVIF which are not compressible via quality.
- `ImageProcessingResult` from `@/types` already has `size: number` (bytes) and `quality?: number`.
- **WARNING:** `loadImageFromFile()` in `src/utils/image.ts` is NOT exported (private function). Do NOT try to import it. Use `processImage()` for everything — it calls `loadImageFromFile` internally.
- **WARNING:** `LOSSY_FORMATS` from `@/constants` includes `image/avif` in addition to JPEG/WebP. Do NOT use it for upload validation — AVIF compression via Canvas API is unreliable across browsers. Create a local `COMPRESSIBLE_FORMATS` set instead.

**Compression approach:**
1. User uploads image -> call `processImage(file, { quality: 1, strategy: 'stretch' })` to get original dimensions and baseline result. Use `file.size` for the original file size display (not `result.size` which is the re-encoded size).
2. User adjusts quality slider -> call `processImage(file, { quality: sliderValue / 100, strategy: 'stretch' })` debounced at 300ms.
3. Display `result.size` formatted as KB/MB alongside original `file.size`. Show compression ratio: `Math.round((1 - result.size / file.size) * 100)` + "% smaller".
4. On download, use the anchor ref pattern with the compressed `result.dataUrl`.

**Compression-only format filter:** Only JPEG and WebP support quality-based compression via Canvas API. Create a local constant:
```typescript
const COMPRESSIBLE_FORMATS = new Set(['image/jpeg', 'image/webp'])
```
Use this for upload validation. Do NOT use `isValidImageFormat` (accepts all image formats) or `LOSSY_FORMATS` (includes AVIF which is unreliable).

**Compression ratio calculation:**
```typescript
const compressionRatio = Math.round((1 - compressed.size / originalFileSize) * 100)
// Display: "63% smaller" or "No reduction" if ratio <= 0
```

**File size display helper** (note: ImageResizer has a similar `formatBytes` — consider reusing or extracting to `@/utils/file.ts`):
```typescript
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
```

### Component Structure Pattern

Follow the ImageResizer pattern (most similar tool):

```
State:
- source: File | null (uploaded file)
- originalInfo: { size: number, width: number, height: number, name: string } | null
- quality: number (1-100, default 80)
- compressed: ImageProcessingResult | null
- processing: boolean

Hooks:
- useToolError() for error handling
- useToast() for download confirmation
- useDebounceCallback() for debounced compression (300ms)
- useRef<HTMLAnchorElement> for download anchor

Layout:
- Tool description from TOOL_REGISTRY_MAP['image-compressor'].description
- UploadInput (accept="image/jpeg,image/webp", single file)
- Original info display (filename, dimensions, file size)
- Quality slider (range 1-100)
- Compressed result display (new file size, compression ratio, size comparison)
- Download button (primary action)
- Hidden download anchor element
- Error display (inline, role="alert")
```

### Quality Slider Implementation

Use a native `<input type="range">` styled with Tailwind. The project does NOT have a `RangeInput` common component yet — story 8-2 (Password Generator) used `<input type="range">` directly with Tailwind classes.

```typescript
<input
  className="w-full accent-primary"
  max={100}
  min={1}
  onChange={(e) => setQuality(Number(e.target.value))}
  type="range"
  value={quality}
/>
```

Display the quality value next to the slider: `{quality}%`

### Download Pattern

Follow the exact pattern from ImageConvertor/ImageResizer:

```typescript
const downloadAnchorRef = useRef<HTMLAnchorElement>(null)

const handleDownload = () => {
  if (!compressed?.dataUrl || !source) return
  const anchor = downloadAnchorRef.current
  if (!anchor) return
  const ext = source.type === 'image/webp' ? 'webp' : 'jpg'
  const baseName = source.name.replace(/\.[^.]+$/, '')
  anchor.href = compressed.dataUrl
  anchor.download = `compressed-${baseName}.${ext}`
  anchor.click()
  toast({ action: 'add', item: { label: `Downloaded compressed-${baseName}.${ext}`, type: 'success' } })
}

// At end of JSX:
<a className="hidden" download="" href="" ref={downloadAnchorRef} />
```

### Error Display Pattern

```typescript
{error != null && (
  <p className="text-error text-body-sm shrink-0" role="alert">
    {error}
  </p>
)}
```

### Format Validation on Upload

```typescript
const handleInputChange = (values: Array<File>) => {
  const file = values[0]
  if (!file) return

  if (!COMPRESSIBLE_FORMATS.has(file.type)) {
    setError('Image compression supports JPEG and WebP formats')
    return
  }

  clearError()
  setSource(file)
  setOriginalInfo({ size: file.size, name: file.name, width: 0, height: 0 })

  // Use processImage to get dimensions (loadImageFromFile is NOT exported)
  processImage(file, { quality: 1, strategy: 'stretch' }).then((result) => {
    setOriginalInfo({ size: file.size, name: file.name, width: result.width, height: result.height })
  })
}
```

### ProgressBar for Long Operations

Import `ProgressBar` from `@/components`. Show it only when compression takes longer than 300ms:

```typescript
const [showProgress, setShowProgress] = useState(false)
const progressTimerRef = useRef<ReturnType<typeof setTimeout>>()

// Before starting compression:
progressTimerRef.current = setTimeout(() => setShowProgress(true), 300)

// After compression completes:
clearTimeout(progressTimerRef.current)
setShowProgress(false)

// In JSX (show indeterminate progress):
{showProgress && <ProgressBar value={50} />}
```

For text tools, never show loading. For file/image tools like this, ProgressBar appears only if processing exceeds 300ms.

### Canvas API Compression Notes

- `canvas.toDataURL('image/jpeg', quality)` where quality is 0-1. Default is 0.92 for JPEG, 0.80 for WebP.
- Quality 0.7-0.8 offers the best balance of visual fidelity and file size.
- Above 0.92 for JPEG, filesize grows disproportionately with diminishing visual returns.
- Safari does NOT support WebP export via Canvas. The existing `processImage` utility handles this by using `toDataURL` which silently falls back. If WebP export fails on Safari, the output will be PNG. Consider detecting this and warning the user.
- For files up to 10MB, processing on the main thread is acceptable (completes within 3 seconds). No Web Worker needed for this story.
- File size from `ImageProcessingResult.size` is calculated from the base64 data URL length. For exact size, could use `Blob.size` via `parseDataUrlToBlob()` from `@/utils`, but the data URL estimation is sufficient for display purposes.

### Project Structure Notes

- **Component location:** `src/components/feature/image/ImageCompressor.tsx` — same directory as `ImageConvertor.tsx` and `ImageResizer.tsx`
- **No new types file needed** — existing `ImageProcessingOptions` and `ImageProcessingResult` in `src/types/utils/image.ts` already have `quality` and `size` fields
- **No new utility file needed** — `processImage()` in `src/utils/image.ts` already handles quality compression
- **No new constants file needed** — create a local `COMPRESSIBLE_FORMATS` set in the component (do NOT use `LOSSY_FORMATS` from `@/constants` which includes AVIF)
- **Barrel exports:** Update `src/components/feature/image/index.ts` to export `ImageCompressor`

### Testing Standards

- Test file: `src/utils/image.spec.ts` (add compression-specific tests alongside existing tests)
- Test environment: `node` (Vitest, no jsdom) — test pure utility functions only
- Tests should cover:
  - Quality range mapping (slider 1-100 -> Canvas API 0.01-1.0)
  - Format validation (JPEG/WebP accepted, PNG/GIF/BMP/AVIF rejected for compression)
  - File size calculation accuracy from data URL
- Do NOT test component rendering — no DOM/component tests per project convention

### Key Anti-Patterns to Avoid

- **Do NOT** create a new image processing utility — use existing `processImage()` from `@/utils`
- **Do NOT** create a `ToolLayout` wrapper — each tool owns its own layout (deprecated pattern)
- **Do NOT** use `export default` — named export only: `export const ImageCompressor`
- **Do NOT** import from `framer-motion` — use `motion/react`
- **Do NOT** use `interface` — use `type` only
- **Do NOT** use `string[]` — use `Array<string>`
- **Do NOT** use `npm` or `npx` — use `pnpm` only
- **Do NOT** create a separate compression utility file — the existing `processImage` handles everything
- **Do NOT** add a "Convert" button for showing the preview — update live on slider change (debounced 300ms)
- **Do NOT** show a spinner — use `ProgressBar` only when processing exceeds 300ms, otherwise no loading indicator

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 10, Story 10.1]
- [Source: _bmad-output/planning-artifacts/prd.md#FR13, NFR2, NFR9]
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Processing Patterns, Error Handling]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#File Upload Conventions, Processing State]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: src/utils/image.ts — processImage(), isValidImageFormat() (note: loadImageFromFile is private)]
- [Source: src/constants/image.ts — IMAGE_LABEL, LOSSY_FORMATS]
- [Source: src/types/utils/image.ts — ImageProcessingOptions, ImageProcessingResult]
- [Source: src/components/feature/image/ImageConvertor.tsx — download anchor pattern, upload handling]
- [Source: src/components/feature/image/ImageResizer.tsx — debounced processing, preview pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Build initially failed due to `ProgressBar` not being exported from `@/components/common` barrel. Fixed by importing directly from `@/components/common/progress-bar/ProgressBar` (matching existing pattern in `ImageConvertor.tsx`).
- Formatting required auto-fix via `pnpm format` (oxfmt reordered Tailwind classes in range input).

### Completion Notes List

- Registered `image-compressor` in TOOL_REGISTRY with Image category, lazy-loaded component, SEO metadata, and route `/tools/image-compressor`
- Added `'image-compressor'` to `ToolRegistryKey` union type in alphabetical order
- Added pre-render route in `vite.config.ts` toolRoutes array
- Created `ImageCompressor` component following ImageResizer pattern: `UploadInput` for JPEG/WebP, quality slider (1-100, default 80), debounced compression (300ms) via `useDebounceCallback`, before/after file size display with compression ratio, download with `compressed-{name}.{ext}` filename, ProgressBar for long operations, inline error display
- Used existing `processImage()` from `@/utils` with `strategy: 'stretch'` for compression — no new utilities created
- `COMPRESSIBLE_FORMATS` exported from `@/constants/image.ts` for shared use and testability
- `formatFileSize` extracted to `@/utils/file.ts` — shared between ImageCompressor and ImageResizer
- Unit tests import actual application code (`COMPRESSIBLE_FORMATS`, `formatFileSize`) — not local duplicates
- All 538 tests pass, 0 lint errors, formatting clean, build successful with 18 pre-rendered routes

### File List

- `src/constants/tool-registry.ts` (modified) — added image-compressor registry entry
- `src/constants/image.ts` (modified) — added COMPRESSIBLE_FORMATS constant
- `src/types/constants/tool-registry.ts` (modified) — added 'image-compressor' to ToolRegistryKey
- `src/utils/file.ts` (modified) — added formatFileSize utility
- `vite.config.ts` (modified) — added image-compressor pre-render route
- `src/components/feature/image/ImageCompressor.tsx` (new) — ImageCompressor component
- `src/components/feature/image/ImageResizer.tsx` (modified) — uses shared formatFileSize
- `src/components/feature/image/index.ts` (modified) — added ImageCompressor barrel export
- `src/utils/image.spec.ts` (modified) — compression tests import actual application code

## Senior Developer Review (AI)

**Review Date:** 2026-02-15
**Reviewer:** Claude Opus 4.6 (code-review workflow)
**Outcome:** Changes Requested → All Fixed

**Issues Found:** 2 High, 3 Medium, 2 Low
**Issues Fixed:** 5 (all HIGH + MEDIUM)
**Issues Deferred:** 2 (LOW — L1 partially addressed, L2 is pre-existing barrel gap)

### Action Items

- [x] [AI-Review][HIGH] Fix stale compressed result displayed after format rejection — clear source/compressed/originalInfo on rejection
- [x] [AI-Review][HIGH] Tests were tautological — extracted COMPRESSIBLE_FORMATS to @/constants and formatFileSize to @/utils, tests now import actual code
- [x] [AI-Review][MED] Double processImage call on upload — consolidated to single call
- [x] [AI-Review][MED] No input dimming during processing — added opacity-70 + pointer-events-none + disabled on slider
- [x] [AI-Review][MED] No progressTimerRef cleanup on unmount — added useEffect cleanup

## Change Log

- 2026-02-15: Story 10.1 Image Compression implemented — new Image Compressor tool with JPEG/WebP quality-based compression via Canvas API, quality slider with live debounced preview, download with compressed filename, and unit tests
- 2026-02-15: Code review fixes — 5 issues resolved: stale state bug on format rejection, tautological tests rewritten to import actual code, double processImage call eliminated, slider dimmed during processing, timer cleanup on unmount added
