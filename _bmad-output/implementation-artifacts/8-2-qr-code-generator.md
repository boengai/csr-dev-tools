---
story: 17.1
title: QR Code Generator
status: done
epic: 17
---

# Story 17.1: QR Code Generator

## Story

As a **user**,
I want **to generate QR codes from text or URLs and download them as images**,
So that **I can create QR codes for links, contact info, or any text without using external services**.

**Epic:** Epic 17 — Image & Media Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (CopyButton, FieldForm, Button)
**Story Key:** 17-1-qr-code-generator

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the QR Code Generator tool registered in `TOOL_REGISTRY` under the Generator category
**When** the user navigates to it
**Then** it renders with a card button to open the full-screen dialog

### AC2: QR Code Generation

**Given** the user enters text or a URL
**When** content is provided
**Then** a QR code is generated and displayed as a live preview in real-time (debounced 300ms)

### AC3: Configuration Options

**Given** configuration options
**When** the user adjusts them
**Then** they can configure: size (128-512px), error correction level (L/M/Q/H), foreground color, background color

### AC4: Download PNG

**Given** the generated QR code
**When** the user clicks "Download"
**Then** the QR code downloads as PNG

### AC5: Copy SVG

**Given** the generated QR code
**When** a "Copy as SVG" option is used
**Then** SVG markup is copied via CopyButton

### AC6: Empty State

**Given** empty input
**When** nothing is entered
**Then** no QR code is displayed (empty state message)

### AC7: Unit Tests

**Given** unit tests in `src/utils/qr-code.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: data URL generation, size options, empty input, SVG generation

## Tasks / Subtasks

- [x] Task 1: Create QR code utility functions (AC: #2, #3, #4, #5, #7)
  - [x] 1.1 Create `src/utils/qr-code.ts` with `generateQrCodeDataUrl()` and `generateQrCodeSvgString()`
  - [x] 1.2 Import `qrcode` library (top-level import)
  - [x] 1.3 Define `QrCodeOptions` type (size, errorCorrectionLevel, foreground, background)
  - [x] 1.4 Use `QRCode.toDataURL()` for PNG data URL
  - [x] 1.5 Use `QRCode.toString()` with `type: 'svg'` for SVG string

- [x] Task 2: Write unit tests (AC: #7)
  - [x] 2.1 Create `src/utils/qr-code.spec.ts`
  - [x] 2.2 Test data URL generation returns `data:image/png;base64,...`
  - [x] 2.3 Test size option acceptance
  - [x] 2.4 Test empty text throws
  - [x] 2.5 Test SVG string contains `<svg>` tags

- [x] Task 3: Create QrCodeGenerator component (AC: #1, #2, #3, #4, #5, #6)
  - [x] 3.1 Create `src/components/feature/generator/QrCodeGenerator.tsx` as named export
  - [x] 3.2 Dialog-based layout: controls on left, QR preview on right
  - [x] 3.3 Text/URL textarea input with `useDebounceCallback` 300ms
  - [x] 3.4 Size range slider (128-512px)
  - [x] 3.5 Error correction select (L/M/Q/H)
  - [x] 3.6 Foreground/background native color inputs
  - [x] 3.7 QR code preview as `<img>` with data URL
  - [x] 3.8 Download PNG button using hidden `<a>` ref
  - [x] 3.9 SVG CopyButton below preview
  - [x] 3.10 Empty state: "Enter text to generate a QR code"
  - [x] 3.11 Generate both PNG data URL and SVG string in parallel via `Promise.all`

- [x] Task 4: Register tool and update exports (AC: #1)
  - [x] 4.1 Add `'qr-code-generator'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add export to `src/components/feature/generator/index.ts`
  - [x] 4.4 Add barrel export to `src/utils/index.ts`

## Dev Notes

### Architecture Pattern

**Dialog-based async generator with download** — generates both PNG (data URL) and SVG simultaneously. Download uses hidden anchor element pattern. Most complex component in Epic 17 at 221 lines.

### Key Implementation Details

- `qrcode` npm library — top-level import (not lazy-loaded in util, but tool is code-split)
- `generateQrCodeDataUrl()` returns `data:image/png;base64,...` via `QRCode.toDataURL()`
- `generateQrCodeSvgString()` returns SVG markup via `QRCode.toString({ type: 'svg' })`
- Both functions called in parallel via `Promise.all` on every debounced input change
- All configuration changes (size, EC, colors) also trigger debounced regeneration
- Download: hidden `<a ref={downloadAnchorRef}>` with `href=dataUrl`, `download="qr-code.png"`, programmatic click
- Toast notifications: "Downloaded qr-code.png" (success), "Failed to generate QR code" (error)
- Color inputs use `<label htmlFor>` for accessibility

### File Locations

| File | Purpose |
|------|---------|
| `src/utils/qr-code.ts` | `generateQrCodeDataUrl()`, `generateQrCodeSvgString()`, `QrCodeOptions` |
| `src/utils/qr-code.spec.ts` | 5 unit tests |
| `src/components/feature/generator/QrCodeGenerator.tsx` | Component (221 lines) |

## Dev Agent Record

### Completion Notes List

- Created QR code generation utilities using `qrcode` library for both PNG and SVG output
- QrCodeGenerator component with full configuration, download, SVG copy
- 5 unit tests covering data URL format, size, empty input, SVG output, error correction levels

### Change Log

- 2026-02-20: Code review (backfill) — Fixed 7 issues: added missing prerender route in vite.config.ts, fixed barrel import violation, extracted `QrErrorCorrectionLevel` type to eliminate duplication, cleaned up hidden anchor attrs, added EC level roundtrip test

### File List

| File | Action |
|------|--------|
| `src/utils/qr-code.ts` | NEW |
| `src/utils/qr-code.spec.ts` | NEW |
| `src/components/feature/generator/QrCodeGenerator.tsx` | NEW |
| `src/components/feature/generator/index.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/constants/tool-registry.ts` | MODIFIED |
| `vite.config.ts` | MODIFIED |
