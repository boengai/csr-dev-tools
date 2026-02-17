---
story: 17.2
title: Image to Base64
status: done
epic: 17
---

# Story 17.2: Image to Base64

Status: done

## Story

As a **user**,
I want **to upload an image and get the Base64 data URI**,
So that **I can embed images directly in HTML, CSS, or JSON without external files**.

**Epic:** Epic 17 — Image & Media Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (CopyButton, Dialog, FieldForm, UploadInput)
**Story Key:** 17-2-image-to-base64

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the Image to Base64 tool registered in `TOOL_REGISTRY` under the Image category
**When** the user navigates to it (sidebar, command palette, or `/tools/image-to-base64`)
**Then** it renders with a card button to open the full-screen dialog
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Image Upload and Conversion

**Given** the user uploads an image via file picker
**When** the file is loaded
**Then** the Base64 data URI is generated using FileReader API
**And** image dimensions are detected via Image element
**And** file info is shown: filename, dimensions (WxH), original size, Base64 string length

### AC3: Multiple Copy Formats

**Given** the conversion result is displayed
**When** the user views the output
**Then** three copyable outputs are available via CopyButton:
- Full data URI (`data:image/png;base64,...`)
- Base64 string only (no data URI prefix)
- HTML `<img>` tag with embedded data URI, alt, width, height

### AC4: Image Preview

**Given** a successfully converted image
**When** displayed
**Then** a thumbnail preview of the image is shown in the dialog

### AC5: Error Handling

**Given** a non-image file or corrupted file
**When** uploaded
**Then** an error toast is shown via `useToast`

### AC6: Dialog Lifecycle

**Given** the dialog
**When** opened from tool page via `autoOpen` prop
**Then** the dialog opens automatically
**When** closed
**Then** state is reset and `onAfterDialogClose` navigates home

### AC7: Unit Tests

**Given** unit tests in `src/utils/image-base64.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: `formatBase64Size` for chars, KB, and MB ranges

## Tasks / Subtasks

- [x] Task 1: Create image-base64 utility functions (AC: #2, #3, #7)
  - [x] 1.1 Create `src/utils/image-base64.ts` with `ImageBase64Result` type
  - [x] 1.2 Implement `imageFileToBase64(file: File): Promise<ImageBase64Result>` using FileReader API
  - [x] 1.3 Implement `getImageDimensions(dataUri)` helper via Image element
  - [x] 1.4 Implement `formatBase64Size(length)` for human-readable size display
  - [x] 1.5 Generate HTML `<img>` tag with dimensions and alt text
  - [x] 1.6 Export `ImageBase64Result`, `imageFileToBase64`, `formatBase64Size`

- [x] Task 2: Write unit tests (AC: #7)
  - [x] 2.1 Create `src/utils/image-base64.spec.ts`
  - [x] 2.2 Test `formatBase64Size` for small sizes (chars)
  - [x] 2.3 Test `formatBase64Size` for kilobyte sizes
  - [x] 2.4 Test `formatBase64Size` for megabyte sizes

- [x] Task 3: Create ImageToBase64 component (AC: #1, #2, #3, #4, #5, #6)
  - [x] 3.1 Create `src/components/feature/image/ImageToBase64.tsx` as named export
  - [x] 3.2 Dialog-based layout with `autoOpen` and `onAfterDialogClose` props
  - [x] 3.3 Left panel: UploadInput for file selection + image preview thumbnail
  - [x] 3.4 Right panel: Three output sections (Data URI, Base64 only, HTML tag) each with CopyButton
  - [x] 3.5 Display file info: filename, WxH dimensions, original size, base64 length
  - [x] 3.6 Error handling via `useToast` for invalid files
  - [x] 3.7 State reset on dialog close

- [x] Task 4: Register tool (AC: #1)
  - [x] 4.1 Add `'image-to-base64'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts`
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts`
  - [x] 4.3 Add export to `src/utils/index.ts`

## Dev Notes

- Uses FileReader API for conversion — async by nature (file I/O)
- Image dimensions detected via Image element `naturalWidth`/`naturalHeight` — requires DOM
- `formatBase64Size` is the only pure function testable without DOM; `imageFileToBase64` requires browser environment
- Dialog pattern with `autoOpen`/`onAfterDialogClose` for tool page integration

### Previous Story Intelligence (from 17.1)
- Dialog tools need `autoOpen` and `onAfterDialogClose` props for tool page auto-open
- Toast for error feedback rather than inline errors for file processing tools
- Hidden anchor element pattern for downloads (used in 17.1 for PNG download)

## Dev Agent Record

### Agent Model Used
anthropic/claude-opus-4-6

### Completion Notes
- 3 unit tests covering formatBase64Size ranges
- Component handles both file picker upload and UploadInput integration
- Three distinct copy targets (data URI, base64 only, HTML tag) per requirements

### File List

| File | Action |
|------|--------|
| `src/utils/image-base64.ts` | NEW |
| `src/utils/image-base64.spec.ts` | NEW |
| `src/components/feature/image/ImageToBase64.tsx` | NEW |
| `src/constants/tool-registry.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
