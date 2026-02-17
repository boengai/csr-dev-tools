---
story: 17.3
title: Base64 to Image
status: done
epic: 17
---

# Story 17.3: Base64 to Image

Status: done

## Story

As a **user**,
I want **to paste a Base64 string or data URI and see/download the decoded image**,
So that **I can quickly preview and extract images from Base64-encoded data**.

**Epic:** Epic 17 — Image & Media Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (Button, Dialog, FieldForm, DownloadIcon)
**Story Key:** 17-3-base64-to-image

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the Base64 to Image tool registered in `TOOL_REGISTRY` under the Image category
**When** the user navigates to it (sidebar, command palette, or `/tools/base64-to-image`)
**Then** it renders with a card button to open the full-screen dialog
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Data URI Input

**Given** the user pastes a Base64 data URI (e.g., `data:image/png;base64,...`)
**When** the value is entered (debounced 500ms)
**Then** the decoded image is displayed as a preview
**And** image info is shown: dimensions (WxH), format (uppercase), estimated file size

### AC3: Raw Base64 Input

**Given** the user pastes raw Base64 without data URI prefix
**When** entered
**Then** the tool detects the image format from magic bytes (PNG, JPEG, GIF, WebP, BMP, SVG)
**And** constructs a data URI and renders the preview

### AC4: Download Decoded Image

**Given** the preview is displayed
**When** the user clicks "Download"
**Then** the image downloads as `image.{detected_format}` via hidden anchor element
**And** a success toast confirms the download

### AC5: Invalid Input Handling

**Given** an invalid Base64 string
**When** decoding fails
**Then** an error toast is shown: "Invalid Base64 image data"
**And** the previous preview is cleared

### AC6: Dialog Lifecycle

**Given** the dialog
**When** opened from tool page via `autoOpen` prop
**Then** the dialog opens automatically
**When** closed
**Then** state is reset and `onAfterDialogClose` navigates home

### AC7: Unit Tests

**Given** unit tests in `src/utils/base64-image.spec.ts`
**When** `pnpm test` runs
**Then** tests verify the module exports `base64ToImageInfo` function

## Tasks / Subtasks

- [x] Task 1: Create base64-image utility functions (AC: #2, #3, #7)
  - [x] 1.1 Create `src/utils/base64-image.ts` with `Base64ImageInfo` type
  - [x] 1.2 Implement `MAGIC_BYTES` array for format detection (PNG `iVBOR`, JPEG `/9j/`, GIF `R0lGO`, WebP `UklGR`, BMP `Qk`, SVG `PHN2Z`)
  - [x] 1.3 Implement `detectFormatFromBase64(base64)` — matches magic byte prefixes, defaults to PNG
  - [x] 1.4 Implement `getImageDimensions(dataUri)` via Image element
  - [x] 1.5 Implement `base64ToImageInfo(input)` — handles both data URI and raw Base64, estimates file size via `ceil(length * 3 / 4)`
  - [x] 1.6 Export `Base64ImageInfo`, `base64ToImageInfo`

- [x] Task 2: Write unit tests (AC: #7)
  - [x] 2.1 Create `src/utils/base64-image.spec.ts`
  - [x] 2.2 Test module exports `base64ToImageInfo` as a function (DOM-dependent logic not unit-testable)

- [x] Task 3: Create Base64ToImage component (AC: #1, #2, #3, #4, #5, #6)
  - [x] 3.1 Create `src/components/feature/image/Base64ToImage.tsx` as named export
  - [x] 3.2 Dialog-based layout with `autoOpen` and `onAfterDialogClose` props
  - [x] 3.3 Left panel: FieldForm textarea for Base64/data URI input (debounced 500ms)
  - [x] 3.4 Right panel: Image preview (`max-h-80 object-contain`), format/dimensions info, estimated size, Download button
  - [x] 3.5 Download via hidden anchor element with `image.{format}` filename
  - [x] 3.6 Success toast on download, error toast on invalid input
  - [x] 3.7 State reset on dialog close (`handleReset` + `onAfterDialogClose`)

- [x] Task 4: Register tool (AC: #1)
  - [x] 4.1 Add `'base64-to-image'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts`
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts`
  - [x] 4.3 Add export to `src/utils/index.ts`

## Dev Notes

- Magic byte detection is a best-effort approach — covers 6 common formats, falls back to PNG
- File size estimation uses `ceil(base64Length * 3 / 4)` which is approximate (doesn't account for padding)
- Debounce is 500ms (longer than typical 300ms) because Base64 strings are large and parsing is heavier
- Image dimension detection requires DOM (Image element) — not unit-testable, only export check in spec
- Uses `formatFileSize` from `@/utils/file.ts` (shared utility from Epic 10) for estimated size display

### Previous Story Intelligence (from 17.2)
- Dialog pattern with `autoOpen`/`onAfterDialogClose` established and working
- Hidden anchor pattern for downloads (established in 17.1, reused in 17.2)
- Toast feedback for errors rather than inline — consistent across Image tools
- Longer debounce (500ms vs 300ms) appropriate for heavy input parsing

## Dev Agent Record

### Agent Model Used
anthropic/claude-opus-4-6

### Completion Notes
- 1 unit test (module export check) — DOM-dependent logic tested via E2E
- Magic bytes cover PNG, JPEG, GIF, WebP, BMP, SVG formats
- Component handles both `data:image/...` URIs and raw Base64 strings seamlessly

### File List

| File | Action |
|------|--------|
| `src/utils/base64-image.ts` | NEW |
| `src/utils/base64-image.spec.ts` | NEW |
| `src/components/feature/image/Base64ToImage.tsx` | NEW |
| `src/constants/tool-registry.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
