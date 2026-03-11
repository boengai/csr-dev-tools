# Story 23.4: Data URI Generator

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **to convert files to data URIs and decode data URIs back to files**,
so that **I can embed small assets directly in HTML/CSS without extra HTTP requests**.

## Acceptance Criteria

1. **Given** the user uploads a file (image, font, SVG, etc.)
   **When** the file is loaded
   **Then** a data URI is generated with correct MIME type and Base64 encoding, and file size is displayed

2. **Given** the user pastes a data URI
   **When** "Decode" mode is active
   **Then** the MIME type, encoding, and decoded size are shown, with a preview for images

3. **Given** an image file is uploaded
   **When** the data URI is generated
   **Then** both the data URI and an HTML `<img>` tag example are shown

4. **Given** a CSS-compatible file (image, font)
   **When** the data URI is generated
   **Then** a CSS `url()` example is also shown

5. **Given** a file larger than 30KB
   **When** uploaded
   **Then** a warning suggests using a regular file reference instead of data URI for performance

## Tasks / Subtasks

- [x] Task 1: Create data URI utility functions (AC: #1, #2, #3, #4, #5)
  - [x] 1.1 Create `src/utils/data-uri.ts`
  - [x] 1.2 Define `DataUriEncodeResult` type: `{ base64Only, cssUrl, dataUri, encodedSize, fileName, htmlImgTag, isCssCompatible, isImage, isLargeFile, mimeType, originalSize }`
  - [x] 1.3 Define `DataUriDecodeResult` type: `{ data, decodedSize, encoding, isImage, mimeType, previewUri }`
  - [x] 1.4 Implement `SIZE_WARNING_THRESHOLD = 30 * 1024`
  - [x] 1.5 Implement `isImageMimeType(mimeType: string): boolean` — checks `mimeType.startsWith('image/')`
  - [x] 1.6 Implement `isCssCompatibleMimeType(mimeType: string): boolean` — checks image/* or font/* MIME types
  - [x] 1.7 Implement `fileToDataUri(file: File): Promise<DataUriEncodeResult>` — uses `FileReader.readAsDataURL()`, detects MIME type from `file.type`, generates HTML `<img>` tag for images, CSS `url()` for CSS-compatible files, sets `isLargeFile` flag
  - [x] 1.8 Implement `parseDataUri(uri: string): DataUriDecodeResult` — regex parse of `data:{mime};{encoding},{data}`, computes decoded size, sets preview URI for images
  - [x] 1.9 Implement `isValidDataUri(value: string): boolean` — validates `data:` prefix and format
  - [x] 1.10 Add barrel export in `src/utils/index.ts`

- [x] Task 2: Create unit tests for data URI utilities (AC: #1, #2, #3, #4, #5)
  - [x] 2.1 Create `src/utils/data-uri.spec.ts`
  - [x] 2.2 Test `parseDataUri()` — valid image data URI returns correct mimeType, encoding, decodedSize, isImage=true, previewUri set
  - [x] 2.3 Test `parseDataUri()` — valid font data URI returns correct mimeType, isImage=false, previewUri null
  - [x] 2.4 Test `parseDataUri()` — valid text/plain data URI returns correct fields
  - [x] 2.5 Test `parseDataUri()` — invalid input (no `data:` prefix) throws Error
  - [x] 2.6 Test `parseDataUri()` — malformed URI (missing semicolon or comma) throws Error
  - [x] 2.7 Test `isImageMimeType()` — true for `image/png`, `image/jpeg`, `image/svg+xml`; false for `font/woff2`, `text/plain`
  - [x] 2.8 Test `isCssCompatibleMimeType()` — true for `image/png`, `font/woff2`; false for `text/plain`, `application/json`
  - [x] 2.9 Test `isValidDataUri()` — true for valid data URIs, false for plain strings and partial matches
  - [x] 2.10 Test `SIZE_WARNING_THRESHOLD` equals `30720`

- [x] Task 3: Create DataUriGenerator component (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Create `src/components/feature/data/DataUriGenerator.tsx`
  - [x] 3.2 Implement main card view: description from `TOOL_REGISTRY_MAP['data-uri-generator']`, UploadInput with `accept="*/*"` for encode, Button for decode
  - [x] 3.3 Implement Encode Dialog: opens on file upload, shows file info (name, MIME type, original size, encoded size), data URI textarea with CopyButton, large file warning toast
  - [x] 3.4 Implement conditional HTML `<img>` tag output — only for image MIME types, disabled FieldForm textarea with CopyButton
  - [x] 3.5 Implement conditional CSS `url()` output — only for CSS-compatible MIME types (images, fonts), disabled FieldForm textarea with CopyButton
  - [x] 3.6 Implement image preview in encode dialog — `<img>` element showing uploaded image when MIME type is image/*
  - [x] 3.7 Implement Decode Dialog: opens on button click, FieldForm textarea for pasting data URI, `useDebounceCallback` 300ms processing
  - [x] 3.8 Implement decode results: MIME type, encoding, decoded size display, image preview when MIME type is image/*, download Button with DownloadIcon
  - [x] 3.9 Implement download in decode mode: hidden `<a>` ref, `fetch(dataUri)` → blob → `URL.createObjectURL()` → anchor click → revoke, toast confirmation
  - [x] 3.10 Add barrel export in `src/components/feature/data/index.ts`

- [x] Task 4: Register tool and configure routing (AC: all)
  - [x] 4.1 Add `'data-uri-generator'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetical)
  - [x] 4.2 Add registry entry in `src/constants/tool-registry.ts` (alphabetical within Data category)
  - [x] 4.3 Add prerender route `/tools/data-uri-generator` in `vite.config.ts` `toolRoutes` array (alphabetical)

- [x] Task 5: Implement accessibility (AC: all)
  - [x] 5.1 Add `aria-live="polite"` on encode and decode output regions
  - [x] 5.2 Add `aria-label` on all icon buttons, upload button, download button
  - [x] 5.3 Add `role="alert"` on error messages (handled by toast system)
  - [x] 5.4 Ensure full keyboard navigation (Tab through controls, Enter to trigger actions)
  - [x] 5.5 Add alt text on image preview showing MIME type and dimensions

- [x] Task 6: Create E2E tests (AC: all)
  - [x] 6.1 Create `e2e/data-uri-generator.spec.ts`
  - [x] 6.2 Test: navigate to tool page, verify title and description
  - [x] 6.3 Test: upload a small PNG image → dialog opens, data URI displayed, file size shown
  - [x] 6.4 Test: upload an image → HTML `<img>` tag section visible
  - [x] 6.5 Test: upload an image → CSS `url()` section visible
  - [x] 6.6 Test: click Decode button → dialog opens, paste data URI → MIME type and size displayed
  - [x] 6.7 Test: paste image data URI in decode → image preview shown
  - [x] 6.8 Test: decode mode → click Download → download triggers with toast
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
- **Component Pattern**: Named export `export const DataUriGenerator`, no default export
- **State**: `useState` for local UI state (encode/decode results, dialog open), `useDebounceCallback` for 300ms debounced decode processing
- **Error Handling**: `useToast` with `type: 'error'` — never custom error state
- **Styling**: Tailwind CSS v4 classes, `tv()` from `@/utils` for component variants, OKLCH color space
- **Animations**: Import from `motion/react` (NOT `framer-motion`)
- **Code Quality**: oxlint + oxfmt — no semicolons, single quotes, trailing commas, 120 char width
- **100% client-side**: FileReader API and Blob API — zero network requests

### Category and Domain Placement

**IMPORTANT:** The epics file specifies `Category: Data` and `'Data'` IS a valid `ToolCategory`. Place the component in `src/components/feature/data/` alongside EnvFileConverter, EscapedJsonStringifier, HtmlEntityConverter, etc.

### Differentiation from Existing Tools

**CRITICAL — Do NOT duplicate ImageToBase64 or Base64ToImage:**

| Feature | ImageToBase64 | Base64ToImage | Data URI Generator |
|---|---|---|---|
| Input types | Images only | Images only | **ANY file type** |
| Output | Data URI + base64 + HTML tag | Decoded image | Data URI + HTML tag (images) + CSS url() (CSS-compat) |
| Direction | File → Base64 | Base64 → File | **Both: File → URI and URI → File** |
| Size warning | No | No | **Yes: >30KB warning** |
| CSS url() | No | No | **Yes: for images + fonts** |

The Data URI Generator handles ALL file types (images, fonts, SVGs, CSS, JavaScript, JSON, etc.) and provides contextual code snippets based on MIME type.

### Existing Utilities to REUSE

**File Utilities** — `src/utils/file.ts`:
- `formatFileSize(bytes: number): string` — formats bytes as "123 B", "1.2 KB", "2.5 MB"
- `parseDataUrlToBlob(source: string): Promise<Blob>` — converts data URL to Blob via fetch

**Base64 Utilities** — `src/utils/image-base64.ts`:
- `formatBase64Size(length: number): string` — formats base64 string length as "123 chars", "1.2 KB"
- Pattern reference: `imageFileToBase64()` uses `FileReader.readAsDataURL()` — same approach for `fileToDataUri()`

**Validation** — `src/utils/validation.ts`:
- `isValidBase64(value: string): boolean` — validates base64 format

**Hooks to Use:**
- `useCopyToClipboard` from `@/hooks` — for clipboard operations (used by CopyButton internally)
- `useDebounceCallback` from `@/hooks` — for 300ms debounced decode input processing
- `useToast` from `@/hooks` — for success/error toasts

**Components to Use:**
- `UploadInput` from `@/components/common` — accepts `accept`, `button`, `multiple`, `name`, `onChange` props
- `Dialog` from `@/components/common` — `injected={{ open, setOpen }}`, `onAfterClose`, `size="screen"`, `title`
- `FieldForm` from `@/components/common` — `disabled`, `label`, `name`, `type="textarea"`, `rows`, `value`, `onChange`
- `CopyButton` from `@/components/common` — `label`, `value` props
- `Button` from `@/components/common` — `block`, `icon`, `variant`, `onClick`
- `DownloadIcon` from `@/components/common` — icon for download button

### Data URI Encode Strategy

**File → Data URI (FileReader approach):**
1. Accept ANY file via `UploadInput` with `accept="*/*"` — not restricted to images
2. Use `FileReader.readAsDataURL(file)` — browser generates data URI with correct MIME type automatically
3. Extract base64 portion: `dataUri.split(',')[1]`
4. Get MIME type from `file.type` (browser-detected) — fallback to `'application/octet-stream'`
5. Generate contextual code snippets based on MIME type:
   - **Images** → HTML `<img>` tag: `<img src="data:image/png;base64,..." alt="filename" />`
   - **CSS-compatible (images + fonts)** → CSS url: `url('data:font/woff2;base64,...')`
6. Check `file.size > 30 * 1024` → set `isLargeFile` flag → show warning toast

**HTML escape file names** in `<img>` tags (prevent XSS) — same pattern as `imageFileToBase64()`:
```
const safeName = file.name.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c] ?? c)
```

### Data URI Decode Strategy

**Data URI → File (parse + preview + download):**
1. User pastes data URI into textarea (debounced 300ms processing)
2. Parse with regex: `/^data:([^;]+);([^,]+),(.*)$/`
   - Group 1: MIME type (e.g., `image/png`, `font/woff2`)
   - Group 2: Encoding (e.g., `base64`)
   - Group 3: Encoded data
3. Calculate decoded size: `Math.ceil((data.length * 3) / 4)` for base64
4. If image MIME type → show `<img>` preview using the pasted data URI directly
5. Download: use `parseDataUrlToBlob()` from `file.ts` (fetch-based) → `URL.createObjectURL(blob)` → hidden anchor click → `URL.revokeObjectURL()`
6. Filename for download: `decoded.{extension}` where extension is derived from MIME type

### CSS-Compatible MIME Types

Files whose data URIs are useful in CSS `url()`:
- `image/*` — all image types (png, jpeg, gif, svg+xml, webp, avif)
- `font/woff`, `font/woff2`, `font/ttf`, `font/otf`
- `application/font-woff`, `application/font-woff2` (legacy MIME types)

### Component Implementation Pattern

Follow the **ImageToBase64** + **Base64ToImage** dual-dialog pattern:

```
src/components/feature/data/DataUriGenerator.tsx
├── Tool description from TOOL_REGISTRY_MAP['data-uri-generator']
├── Main card
│   ├── UploadInput (accept="*/*", triggers encode flow)
│   └── "Decode Data URI" Button (opens decode dialog)
├── Encode Dialog (size="screen", title="File to Data URI")
│   ├── File info: name, MIME type, original size, encoded size
│   ├── Large file warning (if > 30KB): amber-colored info line
│   ├── Image preview (if isImage): <img> with max-h-24 max-w-24
│   ├── Data URI output: disabled FieldForm textarea + CopyButton
│   ├── HTML <img> tag (if isImage): disabled FieldForm textarea + CopyButton
│   └── CSS url() (if isCssCompatible): disabled FieldForm textarea + CopyButton
├── Decode Dialog (size="screen", title="Decode Data URI")
│   ├── Left pane: FieldForm textarea for pasting data URI
│   ├── Divider: dashed border
│   └── Right pane (aria-live="polite")
│       ├── Metadata: MIME type, encoding, decoded size
│       ├── Image preview (if isImage): <img> with max-h-80
│       └── Download Button with DownloadIcon
└── Hidden <a> ref for downloads
```

### File Locations & Naming

| File | Path |
|---|---|
| Utility functions | `src/utils/data-uri.ts` |
| Utility tests | `src/utils/data-uri.spec.ts` |
| Component | `src/components/feature/data/DataUriGenerator.tsx` |
| E2E test | `e2e/data-uri-generator.spec.ts` |
| Registry key | `src/types/constants/tool-registry.ts` |
| Registry entry | `src/constants/tool-registry.ts` |
| Prerender route | `vite.config.ts` → `toolRoutes` array |
| Barrel exports | `src/utils/index.ts`, `src/components/feature/data/index.ts` |

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
  category: 'Data',
  component: lazy(() =>
    import('@/components/feature/data/DataUriGenerator').then(
      ({ DataUriGenerator }: { DataUriGenerator: ComponentType }) => ({
        default: DataUriGenerator,
      }),
    ),
  ),
  description: 'Convert files to data URIs and decode data URIs back to files.',
  emoji: '🔗',
  key: 'data-uri-generator',
  name: 'Data URI Generator',
  routePath: '/tools/data-uri-generator',
  seo: {
    description:
      'Convert any file to a data URI for embedding in HTML/CSS. Decode data URIs back to files. Supports images, fonts, SVGs, and more. Free online data URI tool.',
    title: 'Data URI Generator - CSR Dev Tools',
  },
}
```

### UX / Interaction Requirements

- **Encode mode**: File upload triggers dialog with results — follows ImageToBase64 pattern
- **Decode mode**: Button opens dialog, paste data URI → live results with 300ms debounce
- **No "Generate" button for decode**: Results appear live as user pastes — text conversion tool pattern
- **File upload is explicit action**: UploadInput click triggers file picker (file processing pattern)
- **Large file warning**: Toast with `type: 'error'` when file > 30KB: `'File exceeds 30 KB — consider using a regular file reference for better performance'`
- **Empty decode input**: Clear results, no error toast
- **Invalid decode input**: Show toast `'Invalid data URI format (e.g., data:image/png;base64,...)'`
- **Download toast**: `'Downloaded decoded.{ext}'`
- **Mobile**: Inputs stack vertically at 375px, preview scales to container width, 44px+ touch targets

### Previous Story Intelligence (23.3 Placeholder Image Generator)

Key learnings from Story 23.3 to apply here:

1. **UploadInput accept prop**: Use `accept="*/*"` to accept all file types — unlike ImageToBase64 which uses `accept="image/*"`
2. **Download anchor pattern**: Use `useRef<HTMLAnchorElement>` with hidden `<a>` — do NOT use `downloadAnchorRef` as dead code; use the `parseDataUrlToBlob()` + `URL.createObjectURL()` pattern from `file.ts`
3. **CopyButton/clipboard pattern**: Use CopyButton component with `label` and `value` props for all copyable outputs — never raw `navigator.clipboard`
4. **Barrel export ordering**: Maintain alphabetical order in `src/components/feature/data/index.ts`
5. **E2E test selectors**: Use `exact: true` for toast text matching
6. **Spec files need explicit imports**: `import { describe, expect, it } from 'vitest'`
7. **Registration checklist**: types union → registry entry → vite prerender → barrel exports
8. **HTML escaping in generated tags**: Escape file names in `<img alt="...">` to prevent XSS — same `replace(/[&<>"']/g, ...)` pattern as `imageFileToBase64()`
9. **Dialog onAfterClose cleanup**: Always reset state in `onAfterClose` callback AND call `onAfterDialogClose?.()`
10. **Code review common fixes**: keyboard accessibility, raw clipboard calls → CopyButton, input edge cases, alphabetical ordering

### Git Intelligence

Recent commit patterns from Epic 23:
- `445e343` — `✨: story 23-3`
- `e83722c` — `🎨 Color Palette Generator + 🔍 code review fixes (Story 23.2)`
- `5651942` — `📐 Aspect Ratio Calculator + 🔍 code review fixes (Story 23.1)`

Code review fixes commonly address:
- Keyboard accessibility (focus-visible, group-focus-within patterns)
- Raw clipboard calls → `useCopyToClipboard` hook / CopyButton
- Input edge cases (empty values, invalid formats)
- Dead code removal (unused refs, unreachable conditions)
- Barrel export alphabetical ordering

Files recently modified in Epic 23:
- `src/constants/tool-registry.ts` — tool entries added alphabetically
- `src/types/constants/tool-registry.ts` — ToolRegistryKey union updated
- `vite.config.ts` — prerender routes added alphabetically
- `src/utils/index.ts` — barrel exports for new utils

### Project Structure Notes

- Component goes in existing `src/components/feature/data/` folder (alongside EnvFileConverter, HtmlEntityConverter, JsonFormatter, etc.)
- Utility goes in `src/utils/` as `data-uri.ts`
- Category is `'Data'` — matches the epics file and is a valid ToolCategory
- No new dependencies needed — uses native FileReader API, Blob API, and fetch API
- Do NOT put this in `src/components/feature/image/` — it handles ALL file types, not just images
- Do NOT put this in `src/components/feature/encoding/` — it's a data format tool, not a text encoding tool

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion-3.md#Epic 23 Story 23.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Patterns, Registry Entry, Testing Standards]
- [Source: _bmad-output/project-context.md#Implementation Rules, Adding a New Tool]
- [Source: _bmad-output/implementation-artifacts/23-3-placeholder-image-generator.md — previous story patterns and learnings]
- [Source: src/components/feature/image/ImageToBase64.tsx — file upload + data URI encode pattern]
- [Source: src/components/feature/image/Base64ToImage.tsx — data URI decode + download pattern]
- [Source: src/utils/image-base64.ts — FileReader.readAsDataURL() + HTML tag generation pattern]
- [Source: src/utils/base64-image.ts — data URI parsing + format detection pattern]
- [Source: src/utils/file.ts — formatFileSize, parseDataUrlToBlob utilities]
- [Source: src/utils/validation.ts — isValidBase64 pattern]
- [Source: src/components/common/input/UploadInput.tsx — file upload component API]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed autoOpen behavior: encode dialog should NOT auto-open (empty dialog is pointless); kept main card with upload + decode buttons visible
- E2E test fixes: strict mode violation for `test.png` text matching (appeared in filename display AND HTML tag textarea) — used more specific selector; `text/plain` MIME → extension is `txt` not `plain`

### Completion Notes List

- Created `src/utils/data-uri.ts` with `fileToDataUri()`, `parseDataUri()`, `isValidDataUri()`, `isImageMimeType()`, `isCssCompatibleMimeType()`, and `SIZE_WARNING_THRESHOLD` — all pure functions, 100% client-side
- Created `src/utils/data-uri.spec.ts` with 13 unit tests covering all utility functions
- Created `src/components/feature/data/DataUriGenerator.tsx` with dual-dialog pattern: encode (file upload → data URI + HTML tag + CSS url) and decode (paste URI → metadata + preview + download)
- Reuses existing utilities: `formatFileSize`, `parseDataUrlToBlob` from `file.ts`; `useDebounceCallback`, `useToast` from hooks; `CopyButton`, `Dialog`, `FieldForm`, `UploadInput`, `Button`, `DownloadIcon` from common components
- Registered tool: `ToolRegistryKey` union, registry entry (Data category), prerender route, barrel exports
- Accessibility: `aria-live="polite"` on output regions, `aria-label` on buttons, alt text on previews, keyboard navigation via native HTML + Radix
- Created 9 E2E tests covering: render, file upload encode, HTML tag output, CSS url output, decode paste, image preview, download, large file warning (AC #5), and mobile responsiveness
- All quality gates pass: 0 lint errors, 1059 unit tests pass, clean build with 51 prerendered pages

### Change Log

- 2026-02-23: Story 23.4 implemented — Data URI Generator tool with encode/decode, contextual code snippets, file type detection, and 30KB size warning
- 2026-02-23: Code review fixes — Fixed decoded size calculation (base64 padding), fixed encodedSize to use full data URI length, anchored isValidDataUri regex, fixed ToolRegistryKey alphabetical ordering, added decoded size accuracy unit test, added large file warning E2E test

### File List

- `src/utils/data-uri.ts` (new)
- `src/utils/data-uri.spec.ts` (new)
- `src/components/feature/data/DataUriGenerator.tsx` (new)
- `src/components/feature/data/index.ts` (modified — added barrel export)
- `src/utils/index.ts` (modified — added barrel export)
- `src/types/constants/tool-registry.ts` (modified — added ToolRegistryKey)
- `src/constants/tool-registry.ts` (modified — added registry entry)
- `vite.config.ts` (modified — added prerender route)
- `e2e/data-uri-generator.spec.ts` (new)
