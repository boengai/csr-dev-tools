# Story 3.4: Image Resizer — Refactor, Spec & Tests

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **the Image Resizer tool to use the standardized layout with documented behavior and regression tests**,
So that **I can reliably resize images with custom dimensions and a consistent interface**.

**Epic:** Epic 3 — Existing Tool Baseline & Enhancement
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (useToolError, CopyButton — complete)
**Story Key:** 3-4-image-resizer-refactor-spec-and-tests

## Acceptance Criteria

### AC1: Standardized Component Integration

**Given** the existing `ImageResizer` component
**When** it is refactored
**Then** it uses `useToolError` for error handling and standardized file upload zone
**And** it is registered in `TOOL_REGISTRY` (already done — entry exists at key `image-resizer`)

### AC2: File Upload & Dimension Display

**Given** a user uploads an image
**When** the file is loaded
**Then** current dimensions (width x height) are displayed
**And** width and height input fields are pre-filled with current dimensions

### AC3: Resize & Download

**Given** a user enters target dimensions and clicks "Resize"
**When** processing completes
**Then** the resized image is available for download with filename format `csr-dev-tools_{originalname}_{timestamp}.{ext}`
**And** a `ProgressBar` appears only if processing exceeds 300ms

### AC4: Error Handling

**Given** a user uploads an unsupported file type
**When** validation fails
**Then** an inline error appears with accepted formats listed

**Given** a user enters invalid dimensions (zero, negative, or non-numeric)
**When** validation fails
**Then** an inline error appears: "Enter valid dimensions (e.g., 800 x 600)"

### AC5: Feature Spec Coverage

**Given** a feature spec (in Dev Notes below)
**When** a developer reads it
**Then** it covers: supported input formats, resize strategies, aspect ratio behavior, large file handling (up to 10MB), minimum dimensions, and mobile upload behavior

### AC6: Regression Tests

**Given** regression tests in `src/utils/image.spec.ts`
**When** `pnpm test` runs
**Then** existing coverage for `calculateDimensions`, `validateCoordinates`, `isValidImageFormat`, `getSafeImageFormat`, and `parseFileName` continues to pass with no regressions
**And** any new pure utility functions added for this story have test coverage

## Tasks / Subtasks

- [x] Task 1: Integrate useToolError for error handling (AC: #1, #4)
  - [x] 1.1 Import and use `useToolError` hook — replace toast-based error handling with `setError()`/`clearError()` for inline errors
  - [x] 1.2 Add inline error display via `<p className="text-error text-body-sm shrink-0" role="alert">{error}</p>` in the IMPORT tab and inside the Dialog
  - [x] 1.3 Format-specific error messages with examples: `"Upload a valid image file (PNG, JPEG, or WebP)"` for unsupported files, `"Enter valid dimensions (e.g., 800 x 600)"` for invalid dimensions, `"Image resize failed — try smaller dimensions or a different format"` for processing errors
  - [x] 1.4 Clear error when user uploads a valid file or enters valid dimensions
  - [x] 1.5 Keep toast for download success ("Downloaded {filename}") — toast is appropriate for success confirmations

- [x] Task 2: Add tool description from registry (AC: #1)
  - [x] 2.1 Import `TOOL_REGISTRY_MAP` from `@/constants`
  - [x] 2.2 Display tool description at top of component: `{toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}`
  - [x] 2.3 Follow established pattern from ColorConvertor, EncodingBase64, and ImageConvertor

- [x] Task 3: Ensure dimension display and pre-fill (AC: #2)
  - [x] 3.1 Verify that current dimensions (width x height) are displayed when file loads — existing `processImage()` returns `width`/`height` in the `ImageProcessingResult`
  - [x] 3.2 Verify width and height input fields are pre-filled with current dimensions
  - [x] 3.3 Ensure dimensions are clearly visible in the Dialog UI (before and after comparison)

- [x] Task 4: Preserve existing workflow and UX (AC: #2, #3)
  - [x] 4.1 Keep the 3-tab workflow: IMPORT → PROCESSING → DOWNLOAD
  - [x] 4.2 Keep the Dialog-based adjustment UI with side-by-side original/preview comparison
  - [x] 4.3 Keep debounced preview updates via `useDebounceCallback` (800ms)
  - [x] 4.4 Keep format and quality selection in the Dialog
  - [x] 4.5 Keep the download anchor pattern for cross-browser download
  - [x] 4.6 Keep the `EMPTY_IMAGE` sentinel check for memory limit errors
  - [x] 4.7 Ensure ProgressBar is shown during processing (existing or add if missing)

- [x] Task 5: Verify regression tests pass (AC: #6)
  - [x] 5.1 Run `pnpm test` — confirm all 242+ existing tests pass (from story 3-3: 51 image tests + 57 color + 19 base64 + 8 CopyButton + 6 useToolError + 101 validation)
  - [x] 5.2 Existing `image.spec.ts` already covers `calculateDimensions` (15+ tests including contain/cover/stretch strategies, edge cases), `validateCoordinates` (8+ tests), `isValidImageFormat`, `getSafeImageFormat`, and `parseFileName` — confirm these all cover ImageResizer utility needs
  - [x] 5.3 If any new pure utility functions are added during refactoring, write tests for them in `image.spec.ts`

- [ ] Task 7: Review Follow-ups (AI)
  - [ ] 7.1 [AI-Review][MEDIUM] Dialog `onAfterClose={handleReset}` destroys user work on accidental close (Escape/outside click) — consider preventing outside-close via Radix `onInteractOutside` or preserving state on dialog dismiss [`src/components/feature/image/ImageResizer.tsx:300`]
  - [ ] 7.2 [AI-Review][LOW] Dev Notes component hierarchy says "TextInput" but code uses "FieldForm" — update documentation to match

- [x] Task 6: Linting, formatting & build verification
  - [x] 6.1 Run `pnpm lint` — no errors
  - [x] 6.2 Run `pnpm format:check` — no formatting issues
  - [x] 6.3 Run `pnpm build` — build succeeds with no TypeScript errors
  - [x] 6.4 Run `pnpm test` — all tests pass, no regressions

## Dev Notes

### CRITICAL: Current ImageResizer Architecture Analysis

The current `ImageResizer` at `src/components/feature/image/ImageResizer.tsx` has a **3-tab + Dialog workflow**:

#### Current Component Hierarchy

```
ImageResizer (export)
  ├── Description (from TOOL_REGISTRY_MAP — ADD)
  ├── Error display (useToolError — ADD)
  └── Tabs (Radix tabs with motion indicator)
        ├── IMPORT tab
        │   └── UploadInput (accepts image/*)
        ├── PROCESSING tab
        │   └── NotoEmoji (rocket emoji)
        └── DOWNLOAD tab
            ├── NotoEmoji (party emoji)
            └── Button group (Download, Start Over)
  └── Dialog (size="screen", for image adjustment)
      ├── ImagePreview (original, side-by-side left)
      ├── ImagePreview (resized preview, side-by-side right)
      ├── Width input (TextInput)
      ├── Height input (TextInput)
      ├── ImageFormatSelectInput
      ├── ImageQualitySelectInput
      └── Button "Convert" (primary action)
```

#### Current Data Flow

```
User uploads image via UploadInput
  → handleUploadChange(files: Array<File>)
    → processImage(file, { width, height })
    → setSource([file, result])
    → setPreview(result)
    → setDialogOpen(true)

User adjusts Width/Height/Format/Quality in Dialog
  → handleInputChange(field, value)
    → setPreview({ ...preview, [field]: value })
    → useEffect triggers dbSetPreview() (debounced 800ms)
      → resizeImage(file, { width, height }, { format, quality })
      → setPreview(result)

User clicks "Convert" in Dialog
  → handleConvert()
    → setDialogOpen(false)
    → setTabValue('PROCESSING')
    → fakeWait()
    → Set download anchor href/download attributes
    → setTabValue('DOWNLOAD')

User clicks "Download"
  → downloadAnchorRef.current.click()
  → toast("Downloaded {filename}")

User clicks "Start Over"
  → handleReset()
    → Clear source, preview, reset tab to IMPORT
```

#### What MUST Change

1. **Error handling uses toast only** — Current: errors caught and shown via `useToast` toast notifications. Refactor: use `useToolError` for inline error display (file validation errors, dimension validation errors, processing errors). Keep toast for download success.
2. **No tool description displayed** — Add `TOOL_REGISTRY_MAP['image-resizer']` description at top.
3. **No dimension validation** — Currently no validation on width/height inputs. Need to validate: positive integers, non-zero, within reasonable bounds.

#### What to PRESERVE

1. **3-tab + Dialog workflow** — IMPORT → (Dialog opens) → PROCESSING → DOWNLOAD. This is the tool's core UX pattern and differs from ImageConvertor's 4-tab approach.
2. **Dialog with side-by-side preview** — Side-by-side original vs resized comparison is an excellent UX pattern unique to this tool.
3. **Debounced preview updates** — `useDebounceCallback` with 800ms delay prevents excessive Canvas operations during dimension input.
4. **Format and quality selection** — Reuses `ImageFormatSelectInput` and `ImageQualitySelectInput` shared with ImageConvertor.
5. **Download anchor pattern** — `useRef<HTMLAnchorElement>` for triggering browser download.
6. **`EMPTY_IMAGE` sentinel check** — `'data:,'` detection for Canvas memory limit failures.
7. **`processImage` / `resizeImage` utility calls** — Existing image processing pipeline.
8. **Named export** — `export const ImageResizer` is correct.
9. **File location** — `src/components/feature/image/ImageResizer.tsx` stays.
10. **TOOL_REGISTRY entry** — Already exists at key `image-resizer`, category `Image`.

### CRITICAL: Error Handling Refactor

**Current pattern (toast only):**
```typescript
try {
  const result = await resizeImage(...)
  if (result.dataUrl === EMPTY_IMAGE) {
    throw new Error('Could not process image. Because of memory limit.')
  }
  setPreview(result)
} catch (e: unknown) {
  toast({ action: 'add', item: { label: 'Something went wrong', type: 'error' } })
}
```

**Required pattern (useToolError for validation, toast for success):**
```typescript
const { clearError, error, setError } = useToolError()

// File validation errors → inline
const handleUploadChange = async (files: Array<File>) => {
  const file = files[0]
  if (!file || !isValidImageFormat(file.type)) {
    setError('Upload a valid image file (PNG, JPEG, or WebP)')
    return
  }
  clearError()
  // ... process image
}

// Dimension validation → inline
const handleInputChange = (field: string, value: string) => {
  const num = Number(value)
  if (Number.isNaN(num) || num <= 0) {
    setError('Enter valid dimensions (e.g., 800 x 600)')
    return
  }
  clearError()
  // ... update preview
}

// Processing errors → inline
try {
  const result = await resizeImage(...)
  if (result.dataUrl === EMPTY_IMAGE) {
    setError('Image resize failed — file may be too large for browser memory')
    return
  }
} catch {
  setError('Image resize failed — try smaller dimensions or a different format')
}

// Download success → toast (appropriate for transient success)
toast({ action: 'add', item: { label: `Downloaded ${fileName}`, type: 'success' } })
```

### CRITICAL: Error Display in UI

Error display should appear in TWO locations following ImageConvertor pattern:

**1. IMPORT tab (file upload errors):**
```tsx
<Tabs.Content value={TABS_VALUES.IMPORT}>
  <UploadInput accept="image/*" ... />
  {error != null && (
    <p className="text-error text-body-sm shrink-0" role="alert">
      {error}
    </p>
  )}
</Tabs.Content>
```

**2. Inside Dialog (dimension/processing errors):**
```tsx
<Dialog>
  {/* ... preview, inputs ... */}
  {error != null && (
    <p className="text-error text-body-sm shrink-0" role="alert">
      {error}
    </p>
  )}
  <Button onClick={handleConvert}>Convert</Button>
</Dialog>
```

### CRITICAL: Test Strategy

Image processing tests in Node.js (Vitest, no jsdom) — special considerations:

- **Canvas API is NOT available** in Node.js — `processImage`, `resizeImage` cannot be tested directly
- **FileReader is NOT available** in Node.js
- **Focus tests on pure functions** that don't depend on browser APIs

**Already tested in `image.spec.ts` (from story 3-3, 51 tests):**
- `isValidImageFormat` — 8 tests (all 6 formats + invalid inputs)
- `getSafeImageFormat` — 6 tests (valid, invalid, fallback)
- `calculateDimensions` — 15+ tests (contain/cover/stretch strategies, edge cases: zero, overflow, very large, square, portrait/landscape)
- `validateCoordinates` — 8+ tests (clamping, bounds, minimums)
- `parseFileName` — 7 tests (prefix, extension, format-specific, special chars, timestamp)
- `parseDataUrlToBlob` — 2 tests

**The `calculateDimensions` tests directly cover ImageResizer's core logic** — the resize dimension calculation with aspect ratio preservation ('contain' strategy). These tests already validate:
- Landscape source → landscape target (maintaining ratio)
- Portrait source → portrait target (maintaining ratio)
- Square sources
- Target larger than source (upscale behavior)
- Zero width/height edge cases
- Very large dimension handling

**DO NOT attempt to mock Canvas, Image, or FileReader.** The project testing philosophy is "pure function testing — no DOM/browser mocks" [Source: project-context.md#Testing Rules].

### Existing Codebase Patterns to Follow

#### Import Ordering
```tsx
// 1. External libraries (alphabetical)
import { useEffect, useRef, useState } from 'react'

// 2. Type-only imports
import type { ImageFormat, ImageProcessingResult } from '@/types'

// 3. Internal @/ imports (alphabetical)
import { Button, Dialog, NotoEmoji, ProgressBar, Tabs, TextInput, UploadInput } from '@/components/common'
import { ImageFormatSelectInput, ImageQualitySelectInput } from '@/components/feature/image/input'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolError } from '@/hooks'
import { useToast } from '@/hooks/state'
import { parseFileName, processImage, resizeImage } from '@/utils'
```

#### Component Export Pattern
```tsx
// Named export, NOT default
export const ImageResizer = () => {
```

### Architecture Compliance

- **No ToolLayout** — ToolLayout was deprecated in story 3-1; each tool owns its own flat layout [Source: story 3-1 PO Override]
- **No OutputDisplay** — Removed from codebase; not needed for file-based tools
- **useToolError required** — Never implement custom error state in tools [Source: architecture.md#Error Handling]
- **Error messages with examples** — Concise, actionable, include valid input example [Source: architecture.md#Error Message Format]
- **Named exports** — `export const ImageResizer` not `export default` [Source: project-context.md#Anti-Patterns]
- **`import type` for types** — Required by `verbatimModuleSyntax` [Source: project-context.md#Language-Specific Rules]
- **`type` not `interface`** — oxlint enforced [Source: project-context.md#Language-Specific Rules]
- **`Array<T>` not `T[]`** — oxlint enforced [Source: project-context.md#Language-Specific Rules]
- **100% client-side** — Zero network requests. All image processing via Canvas API [Source: architecture.md#NFR9]
- **No `console.log`** — oxlint enforced [Source: project-context.md#Code Quality Rules]

### Previous Story Intelligence (Story 3.3)

From story 3-3 (Image Converter refactor):

- **ToolLayout was deprecated and deleted** — PO decision. Each tool uses a flat `<div>` layout. Do NOT attempt to use ToolLayout.
- **Error display pattern established**: `<p className="text-error text-body-sm shrink-0" role="alert">{error}</p>` placed after inputs
- **Description pattern established**: `{toolEntry?.description && <p className="text-body-xs ...">}` at top of component
- **Format expansion completed**: `ImageFormat` type now includes 6 formats (PNG, JPEG, WebP, GIF, BMP, AVIF) with browser detection
- **LOSSY_FORMATS** set added for quality control toggling
- **ImageFormatSelectInput** now dynamically filters format options based on browser capabilities
- **All 242 tests passing** (51 image + 57 color + 19 base64 + 8 CopyButton + 6 useToolError + 101 validation)
- **Build/lint/format all clean** at story 3.3 completion
- **Commit pattern**: `♻️: story 3.3` for refactor stories

### Git Intelligence

Recent commits:
```
dcbafc9 ♻️: story 3-3
a2a4c19 🐛: search and navigate
162e9c0 ♻️: story 3.2
b0fd290 ♻️: story 3.1
```

**Pattern**: `♻️:` prefix for refactor stories. This story should use `♻️: story 3-4`.

**Key files from story 3-3 that inform patterns:**
- `src/components/feature/image/ImageConvertor.tsx` — Reference pattern (useToolError, tool description, inline error display, LOSSY_FORMATS quality toggle)
- `src/components/feature/image/input/ImageFormatSelectInput.tsx` — Dynamic browser format detection via `canvas.toDataURL()` — now shows only supported formats
- `src/constants/image.ts` — `IMAGE_LABEL`, `IMAGE_VALUE`, `LOSSY_FORMATS` — all expanded for 6 formats
- `src/utils/image.ts` — `isValidImageFormat` now validates all 6 formats, pure functions exported for testing

### Project Structure Notes

**Files to MODIFY:**
- `src/components/feature/image/ImageResizer.tsx` — Refactor: useToolError, tool description, dimension validation, inline error display

**Files NOT to modify:**
- `src/constants/tool-registry.ts` — Image Resizer entry already exists with correct metadata
- `src/components/feature/image/input/ImageFormatSelectInput.tsx` — Already refactored in story 3-3 with browser detection
- `src/components/feature/image/input/ImageQualitySelectInput.tsx` — Already works correctly
- `src/utils/image.ts` — Already has all needed utility functions exported and tested
- `src/utils/image.spec.ts` — Already has 51 tests covering all pure utility functions used by ImageResizer
- `src/utils/file.ts` — File utilities are stable and correct
- `src/constants/image.ts` — Already expanded for 6 formats in story 3-3
- `src/types/constants/image.ts` — Already expanded for 6 formats in story 3-3
- `src/pages/home/index.tsx` — No changes needed
- `src/pages/tool/index.tsx` — No changes needed
- `src/components/common/` — All common components are stable

### Feature Spec (AC5)

#### Image Resizer Feature Specification

**Purpose:** Resize images with custom width and height dimensions entirely in the browser using the Canvas API.

**Supported Input Formats:**
| Format | MIME Type | Upload | Notes |
|--------|----------|--------|-------|
| PNG | `image/png` | Yes | Lossless raster format |
| JPEG | `image/jpeg` | Yes | Lossy compressed format |
| WebP | `image/webp` | Yes | Modern format with lossy/lossless |
| GIF | `image/gif` | Yes | Palette-based (animation not preserved) |
| BMP | `image/bmp` | Yes | Uncompressed bitmap |
| AVIF | `image/avif` | Yes | Modern AV1-based format |

**Supported Output Formats:**
Same as ImageConvertor (story 3-3) — dynamically filtered by browser capability using `canvas.toDataURL()` detection. Quality parameter only enabled for lossy formats (JPEG, WebP, AVIF).

**Workflow:**
1. **IMPORT tab** — User uploads a single image file via drag-and-drop or file picker
2. **Dialog opens** — User sees side-by-side original vs. preview comparison, with width/height inputs pre-filled with current dimensions, format and quality selectors
3. **User adjusts dimensions** — Preview updates in real-time (debounced 800ms) using Canvas `drawImage()` with `imageSmoothingQuality: 'high'`
4. **User clicks "Convert"** — Dialog closes, PROCESSING tab shows briefly
5. **DOWNLOAD tab** — Success state with download button

**Resize Behavior:**
- **Default strategy**: `contain` — preserves aspect ratio, fits within target dimensions
- Width and height inputs accept positive integers
- Changing width recalculates height to maintain aspect ratio (and vice versa)
- Both upscale and downscale are supported
- Canvas API `drawImage()` with `imageSmoothingEnabled: true` and `imageSmoothingQuality: 'high'` for best quality
- For large downscales (>2x), the browser's native interpolation handles quality adequately for this tool's use case

**Single File Only:**
Unlike ImageConvertor (which supports multi-file + ZIP), ImageResizer handles **one file at a time** because the resize workflow is interactive (dimension adjustment per image).

**Error Cases:**
| Trigger | Error Message | Display |
|---------|---------------|---------|
| Unsupported file type | "Upload a valid image file (PNG, JPEG, or WebP)" | Inline via useToolError |
| Invalid dimensions (zero, negative, NaN) | "Enter valid dimensions (e.g., 800 x 600)" | Inline via useToolError |
| Canvas memory limit exceeded | "Image resize failed — file may be too large for browser memory" | Inline via useToolError |
| Processing failure | "Image resize failed — try smaller dimensions or a different format" | Inline via useToolError |
| Download success | "Downloaded {filename}" | Toast notification |

**Edge Cases:**
- Empty file upload → ignored (UploadInput handles this)
- Very large file (>10MB) → Canvas memory may fail; detect via `EMPTY_IMAGE` sentinel and show error
- Safari has a 16MP canvas limit — very large images may fail silently; the `EMPTY_IMAGE` check catches this
- Animated GIF input → animation NOT preserved (Canvas flattens to first frame)
- Upscaling → no quality enhancement (simple interpolation), but the operation is valid
- Minimum dimensions → Canvas supports 1x1 but impractical; no artificial minimum enforced
- Tab switching → only allowed through workflow (no random tab clicking)

**Performance:**
- NFR2: Image processing under 3 seconds for files up to 10MB
- Preview debounced at 800ms to prevent excessive Canvas operations during dimension input
- Download filename format: `csr-dev-tools_{originalname}_{timestamp}.{ext}` via `parseFileName()`

### Latest Technical Information

**Canvas API `drawImage()` for resizing:**
- Universally supported across all modern browsers, no breaking changes
- `imageSmoothingQuality: 'high'` enables bicubic-level interpolation in Chrome and Safari
- Firefox support for `imageSmoothingQuality` may lag — check MDN compatibility table
- Round coordinates with `Math.floor()` before passing to `drawImage()` to avoid extra anti-aliasing overhead

**Canvas Memory Limits:**
| Browser | Max Area (pixels) | Notes |
|---------|-------------------|-------|
| Chrome | ~268 MP | Generally no issues for typical photos |
| Firefox | ~473 MP | Most generous |
| Safari (macOS/iOS) | ~16 MP | Most restrictive — 60MP panorama will fail |

The existing `EMPTY_IMAGE` sentinel check (`'data:,'`) properly detects when Canvas fails due to memory limits.

**`createImageBitmap()` with resize options:**
Available in Chrome 59+, Firefox 144+, Safari 18.5+. Could be used as an alternative to Canvas for resizing, but NOT needed for this story — existing Canvas approach works well. Consider for a future optimization story if performance issues arise.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#FR12] — Image resize with custom width/height dimensions
- [Source: _bmad-output/planning-artifacts/epics.md#NFR2] — Image processing under 3s for files up to 10MB
- [Source: _bmad-output/planning-artifacts/epics.md#NFR9] — Zero network requests for tool processing
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling] — useToolError pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Message Format] — Concise, actionable, with example
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Input Processing] — File tools: explicit action button click, no debounce
- [Source: _bmad-output/planning-artifacts/architecture.md#Loading State Pattern] — ProgressBar only when >300ms
- [Source: _bmad-output/project-context.md] — 53 project rules (types, imports, naming, etc.)
- [Source: _bmad-output/implementation-artifacts/3-3-image-converter-refactor-spec-and-tests.md] — ImageConvertor refactor pattern, error handling, format expansion
- [Source: src/components/feature/image/ImageResizer.tsx] — Current implementation
- [Source: src/components/feature/image/ImageConvertor.tsx] — Reference refactored implementation
- [Source: src/components/feature/image/input/ImageFormatSelectInput.tsx] — Format select with browser detection
- [Source: src/components/feature/image/input/ImageQualitySelectInput.tsx] — Quality select wrapper
- [Source: src/utils/image.ts] — Image processing utilities (processImage, resizeImage, calculateDimensions, etc.)
- [Source: src/utils/image.spec.ts] — 51 tests covering all pure image utility functions
- [Source: src/utils/file.ts] — File utilities (parseFileName, parseDataUrlToBlob)
- [Source: src/hooks/useToolError.ts] — Error state hook
- [Source: src/constants/tool-registry.ts] — TOOL_REGISTRY entry for image-resizer
- [Source: src/constants/image.ts] — IMAGE_LABEL, IMAGE_VALUE, LOSSY_FORMATS

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no blocking issues.

### Completion Notes List

- **[Code Review Fix]** Error messages now list all 6 accepted formats (PNG, JPEG, WebP, GIF, BMP, AVIF) instead of only 3
- **[Code Review Fix]** Toast "Downloaded" now fires on actual download button click, not prematurely in handleConvert
- **[Code Review Fix]** Removed static ProgressBar (value=0) from PROCESSING tab — processing is instant, AC3 says show only if >300ms
- **[Code Review Fix]** Replaced `isNaN()` with `Number.isNaN()` in handleInputChange
- **[Code Review Fix]** Removed 8 non-null assertions (`!`) — added guard clauses and optional chaining instead
- Replaced all toast-based error handling with `useToolError` inline errors (file validation, dimension validation, processing errors)
- Added `EMPTY_IMAGE` sentinel detection with dedicated memory limit error message
- Added dimension validation in debounced preview callback — invalid/zero/negative/NaN values show inline error and skip processing
- Kept toast notification for download success only (`"Downloaded {filename}"`)
- Added `clearError()` in `handleReset`, `handleUploadChange` (on valid file), and `dbSetPreview` (on successful resize)
- Added tool description from `TOOL_REGISTRY_MAP['image-resizer']` at top of component following ImageConvertor pattern
- Added inline error display in both IMPORT tab (after UploadInput) and inside Dialog (after inputs area)
- Changed UploadInput accept from `"image/png, image/jpeg, image/webp"` to `"image/*"` with `isValidImageFormat()` validation
- Added `ProgressBar` to PROCESSING tab matching ImageConvertor pattern
- Replaced `IMAGE_VALUE['image/png']` quality check with `LOSSY_FORMATS.has()` for correct multi-format quality toggling
- Wrapped component in `<div>` with `flex size-full grow flex-col gap-4` matching ImageConvertor layout pattern
- No new pure utility functions were added — no new tests needed (existing 51 image tests cover all utility functions used)
- All 242 tests pass, lint clean (0 errors), format clean, build succeeds

### File List

- `src/components/feature/image/ImageResizer.tsx` — Modified: useToolError integration, tool description, inline error display, dimension validation, LOSSY_FORMATS quality toggle, ProgressBar, accept="image/*"

## Change Log

- 2026-02-14: Story 3-4 implementation — Refactored ImageResizer to standardized patterns (useToolError, tool description, inline errors, LOSSY_FORMATS quality toggle, ProgressBar)
- 2026-02-14: Code review — Fixed 5 issues (3 HIGH, 2 MEDIUM): error message format list, premature toast, static ProgressBar, global isNaN, non-null assertions. 2 action items created (M3 dialog close, L1 doc accuracy).
