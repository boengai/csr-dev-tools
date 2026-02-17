---
story: 21.1
title: Background Remover
status: ready-for-dev
epic: 21
---

# Story 21.1: Background Remover

Status: review

## Story

As a **user**,
I want **to upload an image and have its background automatically removed using an AI model running in my browser**,
So that **I can get transparent-background images without uploading to external services or paying for API calls**.

**Epic:** Epic 21 — AI-Powered Image Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (CopyButton — complete), `@huggingface/transformers` (new — Apache 2.0)
**Story Key:** 21-1-background-remover

## Acceptance Criteria

### AC1: Tool Registered and Renders with Dialog

**Given** the Background Remover tool registered in `TOOL_REGISTRY` under the Image category
**When** the user navigates to it (via sidebar, command palette, or `/tools/background-remover` route)
**Then** it renders inline with an upload area and a button to open the dialog
**And** a one-line description is shown from the registry entry
**And** the tool loads as a lazy-loaded chunk (code split)
**And** `@huggingface/transformers` is NOT loaded until the tool is opened

### AC2: Image Upload via File Input or Drag-and-Drop

**Given** the tool is open
**When** the user uploads an image via file input or drag-and-drop
**Then** the image is accepted and displayed as a preview
**And** unsupported file types show an error toast

### AC3: Model Downloads on First Use with Progress

**Given** the user uploads an image for the first time (model not cached)
**When** the background removal pipeline initializes
**Then** a visible progress indicator shows the model download progress (~25MB)
**And** the UI state is "downloading-model" with a progress bar or percentage
**And** subsequent uses skip the download (browser cache)

### AC4: Background Removed Automatically

**Given** the model is loaded and an image is uploaded
**When** processing begins
**Then** the background is removed automatically, producing a transparent PNG
**And** a loading/processing state is shown during inference (~2-5s)

### AC5: Before/After Comparison View

**Given** the background has been removed
**When** the result is displayed
**Then** a before/after comparison view is shown (side-by-side or slider)
**And** the user can visually compare the original and processed images

### AC6: Custom Background Color Selection

**Given** the background has been removed
**When** the user selects a background option
**Then** they can choose: transparent (default), white, or a custom color via color picker
**And** the preview updates immediately to show the selected background

### AC7: Download Result as PNG

**Given** a processed result exists
**When** the user clicks the download button
**Then** the result downloads as a PNG file
**And** a `CopyButton` is available for the data URL

### AC8: Fully Client-Side Processing

**Given** any interaction with the tool
**When** processing occurs
**Then** zero network requests are made for image processing (model download is the only network request, cached after first use)

### AC9: Error Handling

**Given** an unsupported image type or processing failure
**When** the error occurs
**Then** an actionable error message is displayed via toast
**And** the user can retry with a different image

### AC10: Unit Tests Cover Apply-Background Logic

**Given** unit tests in `src/utils/background-removal.spec.ts`
**When** `pnpm test` runs
**Then** tests cover the `applyBackground` canvas compositing logic (pipeline is mocked)

## Tasks / Subtasks

- [x] Task 1: Install `@huggingface/transformers` dependency (AC: #1, #8)
  - [x] 1.1 Run `pnpm add @huggingface/transformers`
  - [x] 1.2 Verify it's added to `package.json` dependencies (not devDependencies)

- [x] Task 2: Create background-removal utility (AC: #3, #4, #6, #8)
  - [x] 2.1 Create `src/utils/background-removal.ts`
  - [x] 2.2 Implement `removeBackground(image: Blob, onProgress?: (p: number) => void): Promise<Blob>` — lazy-loads the pipeline, runs inference, returns transparent PNG blob
  - [x] 2.3 Implement `applyBackground(foreground: Blob, color: string): Promise<Blob>` — composites foreground onto a canvas filled with the given color, returns PNG blob
  - [x] 2.4 Lazy-load pipeline: `const segmenter = await pipeline('background-removal', 'Xenova/modnet', { dtype: 'fp32' })`
  - [x] 2.5 Cache the pipeline instance as a module-level singleton (no re-download on subsequent calls)
  - [x] 2.6 Export `removeBackground`, `applyBackground`

- [x] Task 3: Write unit tests for background-removal utilities (AC: #10)
  - [x] 3.1 Create `src/utils/background-removal.spec.ts`
  - [x] 3.2 Mock `@huggingface/transformers` pipeline (vi.mock)
  - [x] 3.3 Test `applyBackground` compositing: transparent foreground on white background produces non-transparent result
  - [x] 3.4 Test `applyBackground` with custom color
  - [x] 3.5 Test `removeBackground` calls the pipeline and returns a Blob
  - [x] 3.6 Test pipeline singleton caching (second call doesn't re-create pipeline)

- [x] Task 4: Create BackgroundRemover component (AC: #1, #2, #3, #4, #5, #6, #7, #9)
  - [x] 4.1 Create `src/components/feature/image/BackgroundRemover.tsx` as named export
  - [x] 4.2 Dialog-based layout following `FaviconGenerator.tsx` pattern: inline upload area + dialog for results
  - [x] 4.3 Use `UploadInput` for file input with drag-and-drop support
  - [x] 4.4 State machine: idle → downloading-model → processing → done → error
  - [x] 4.5 Progress bar during model download (pass `onProgress` callback to `removeBackground`)
  - [x] 4.6 Before/after comparison: side-by-side view with original and processed images
  - [x] 4.7 Background selector: transparent (checkerboard CSS), white, custom color via `<input type="color">`
  - [x] 4.8 Download button for result PNG + `CopyButton` for data URL
  - [x] 4.9 Error handling: toast for unsupported types, processing failures; allow retry
  - [x] 4.10 Accept `ToolComponentProps` (`autoOpen`, `onAfterDialogClose`)

- [x] Task 5: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 5.1 Add `'background-remover'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetically before `'base64-to-image'`)
  - [x] 5.2 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts` (alphabetically before `base64-to-image`)
  - [x] 5.3 Add pre-render route in `vite.config.ts` toolRoutes array (alphabetically before `base64-to-image`)

- [x] Task 6: Create barrel exports (AC: #1)
  - [x] 6.1 Add `export * from './BackgroundRemover'` to `src/components/feature/image/index.ts` (alphabetically — first entry)
  - [x] 6.2 Add `export * from './background-removal'` to `src/utils/index.ts` (alphabetically before `'./base64'`)

- [x] Task 7: Verify integration (AC: #1-#10)
  - [x] 7.1 Run `pnpm lint` — no errors
  - [x] 7.2 Run `pnpm format:check` — no formatting issues
  - [x] 7.3 Run `pnpm test` — all tests pass (847 tests)
  - [x] 7.4 Run `pnpm build` — build succeeds, tool chunk is separate

## Dev Notes

### First AI/ML Tool — New Dependency Pattern

This is the **first tool using `@huggingface/transformers`** and the first to download a model at runtime. Key differences from all previous tools:

| Aspect | Background Remover | FaviconGenerator (dialog) | ImageResizer (dialog) |
|--------|-------------------|--------------------------|----------------------|
| External dep | `@huggingface/transformers` (~new) | `jszip` (existing) | None |
| Network request | Model download (~25MB, first use) | None | None |
| Processing time | ~2-5s inference | <100ms canvas | <100ms canvas |
| Lazy-loading | Pipeline + library lazy | Just component | Just component |
| State complexity | 5 states (idle/downloading/processing/done/error) | 3 states | 2 states |

**CRITICAL:** The `@huggingface/transformers` library must be lazy-loaded via dynamic `import()` inside the utility function, NOT at module top-level. This ensures the ~500KB+ library is only loaded when BackgroundRemover is opened.

### Processing Pattern — Async with Progress

```typescript
// src/utils/background-removal.ts

let cachedPipeline: ReturnType<typeof pipeline> | null = null

export async function removeBackground(
  image: Blob,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  // Lazy-load the library
  const { pipeline, RawImage } = await import('@huggingface/transformers')

  // Singleton pipeline — downloads model on first call, cached after
  if (!cachedPipeline) {
    cachedPipeline = pipeline('background-removal', 'Xenova/modnet', {
      dtype: 'fp32',
      progress_callback: onProgress
        ? (info: { progress?: number }) => {
            if (info.progress != null) onProgress(info.progress)
          }
        : undefined,
    })
  }
  const segmenter = await cachedPipeline

  // Run inference
  const rawImage = await RawImage.fromBlob(image)
  const result = await segmenter(rawImage)

  // result is a RawImage with alpha channel — convert to PNG Blob
  const canvas = document.createElement('canvas')
  canvas.width = result.width
  canvas.height = result.height
  const ctx = canvas.getContext('2d')!
  const imageData = new ImageData(
    new Uint8ClampedArray(result.data),
    result.width,
    result.height,
  )
  ctx.putImageData(imageData, 0, 0)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create PNG blob'))
    }, 'image/png')
  })
}

export async function applyBackground(
  foreground: Blob,
  color: string,
): Promise<Blob> {
  const img = new Image()
  const url = URL.createObjectURL(foreground)

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load foreground image'))
      img.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!

    // Fill with background color
    ctx.fillStyle = color
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw foreground (with transparency) on top
    ctx.drawImage(img, 0, 0)

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create PNG blob'))
      }, 'image/png')
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}
```

**Important:** The `pipeline` return value is a Promise — cache the Promise itself (not the resolved value) to prevent duplicate initialization if `removeBackground` is called twice quickly.

### Component State Machine

```
idle ──upload──→ downloading-model ──model ready──→ processing ──done──→ done
  ↑                    │                                │                  │
  └────────────────────┴──────── error ←────────────────┘                  │
  └──────────────────── new upload ←──────────────────────────────────────┘
```

States:
- **idle:** Upload area shown, no image loaded
- **downloading-model:** Progress bar with percentage, first use only
- **processing:** Spinner/skeleton, image uploaded, model running inference
- **done:** Before/after view, background selector, download button
- **error:** Error toast, retry available

### UI Layout (Dialog-Based)

```
┌────────────────────────── Card (inline) ──────────────────────────┐
│  ✂️ Background Remover                                            │
│  Remove image backgrounds using AI — fully in your browser        │
│                                                                   │
│  ┌─── Upload Area (UploadInput) ──────────────────────────────┐   │
│  │  Drop an image here or click to upload                     │   │
│  │  Supports: PNG, JPG, WEBP                                  │   │
│  └────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘

┌──────────────── Dialog (opens on upload) ─────────────────────────┐
│  Background Remover                                         [X]   │
│                                                                   │
│  ┌─── Progress (downloading-model state) ─────────────────────┐   │
│  │  Downloading AI model... 45%  [████████░░░░░░░░░░]         │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─── Before/After (done state) ──────────────────────────────┐   │
│  │  ┌─── Original ────┐  ┌─── Result ─────┐                  │   │
│  │  │                  │  │  (checkerboard  │                  │   │
│  │  │   source image   │  │   or bg color)  │                  │   │
│  │  │                  │  │                 │                  │   │
│  │  └──────────────────┘  └─────────────────┘                  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Background:  (●) Transparent  ( ) White  ( ) Custom [■ #ff0000] │
│                                                                   │
│  [Download PNG]                              [Copy Data URL]      │
└───────────────────────────────────────────────────────────────────┘
```

### Background Selector Pattern

Three options using radio-style buttons:
1. **Transparent** (default) — show checkerboard CSS pattern behind result
2. **White** — `applyBackground(result, '#ffffff')`
3. **Custom** — `applyBackground(result, userColor)` with `<input type="color">`

When "Transparent" is selected, the download produces a PNG with alpha. When White/Custom is selected, call `applyBackground` to composite and download the opaque result.

Checkerboard CSS for transparent preview:
```css
background-image: repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%);
background-size: 16px 16px;
```

### Lazy-Loading Strategy

```typescript
// In TOOL_REGISTRY (src/constants/tool-registry.ts):
component: lazy(() =>
  import('@/components/feature/image/BackgroundRemover').then(
    ({ BackgroundRemover }: { BackgroundRemover: ComponentType }) => ({
      default: BackgroundRemover,
    }),
  ),
),
```

The component itself lazy-loads `@huggingface/transformers` via dynamic import inside `removeBackground()`. This creates a two-level lazy chain:
1. Component code loads when route/tool is visited (~few KB)
2. Transformers library loads when first image is processed (~500KB + 25MB model)

### Project Structure Notes

- **Existing directory:** `src/components/feature/image/` — already has 9 image tools
- **Existing category:** `'Image'` already in `ToolCategory` and `CATEGORY_ORDER`
- **New dependency:** `@huggingface/transformers` — first ML library in the project
- **Alphabetical insertion:** `background-remover` goes before `base64-to-image` in all registries

### Architecture Compliance

- **TOOL_REGISTRY entry required** — tool must be discoverable via sidebar, command palette, dashboard selection dialog, and direct URL [Source: architecture.md#Tool Registry]
- **Named export only** — `export const BackgroundRemover` (never `export default`) [Source: project-context.md#Named exports]
- **Lazy-loaded component** — registry uses `lazy(() => import(...).then(...))` [Source: architecture.md#Code Splitting]
- **Dialog-based layout** — follows `FaviconGenerator.tsx` pattern with `Dialog` component [Source: FaviconGenerator.tsx]
- **100% client-side processing** — model runs in browser via WASM/WebGPU [Source: architecture.md#Hard Constraints]
- **useToast for user feedback** — success/error toasts for processing results [Source: FaviconGenerator.tsx pattern]
- **UploadInput for file handling** — drag-and-drop + file input [Source: FaviconGenerator.tsx, ImageResizer.tsx]
- **ToolComponentProps** — accepts `autoOpen` and `onAfterDialogClose` [Source: types/constants/tool-registry.ts]

### Library & Framework Requirements

- **New dependency:** `@huggingface/transformers` (Apache 2.0) — ML inference in browser
- **Model:** `Xenova/modnet` (Apache 2.0) — ~25MB, background removal, downloaded at runtime and cached by browser
- **Existing imports used:** `useState`, `useCallback` from React; `Dialog`, `Button`, `CopyButton`, `UploadInput` from `@/components/common`; `TOOL_REGISTRY_MAP` from `@/constants`; `useToast` from `@/hooks`

### File Structure Requirements

**Files to CREATE:**

```
src/utils/background-removal.ts                           — removeBackground(), applyBackground(), lazy pipeline singleton
src/utils/background-removal.spec.ts                      — Unit tests for applyBackground (mock pipeline)
src/components/feature/image/BackgroundRemover.tsx         — Background Remover dialog component
```

**Files to MODIFY:**

```
package.json                                    — Add @huggingface/transformers dependency
pnpm-lock.yaml                                 — Updated by pnpm install
src/types/constants/tool-registry.ts            — Add 'background-remover' to ToolRegistryKey
src/constants/tool-registry.ts                  — Add background-remover registry entry
src/components/feature/image/index.ts           — Add BackgroundRemover export
src/utils/index.ts                              — Add background-removal barrel export
vite.config.ts                                  — Add background-remover pre-render route
```

**Files NOT to modify:**
- `src/components/common/sidebar/Sidebar.tsx` — Image category already exists
- Any existing image tool components — standalone new tool
- `src/types/constants/tool-registry.ts` ToolCategory — `'Image'` already exists

### Testing Requirements

**Unit tests (`src/utils/background-removal.spec.ts`):**

Test `applyBackground` canvas logic with mocked DOM APIs. Mock the `@huggingface/transformers` pipeline for `removeBackground` tests.

```typescript
import { describe, expect, it, vi } from 'vitest'

// Mock @huggingface/transformers
vi.mock('@huggingface/transformers', () => ({
  pipeline: vi.fn(),
  RawImage: { fromBlob: vi.fn() },
}))

describe('background-removal utilities', () => {
  describe('applyBackground', () => {
    // Test canvas compositing with mocked Image + Canvas
  })

  describe('removeBackground', () => {
    // Test pipeline is called, singleton is cached
  })
})
```

### TOOL_REGISTRY Entry (Copy-Paste Ready)

```typescript
{
  category: 'Image',
  component: lazy(() =>
    import('@/components/feature/image/BackgroundRemover').then(
      ({ BackgroundRemover }: { BackgroundRemover: ComponentType }) => ({
        default: BackgroundRemover,
      }),
    ),
  ),
  description: 'Remove image backgrounds using AI — fully in your browser',
  emoji: '✂️',
  key: 'background-remover',
  name: 'Background Remover',
  routePath: '/tools/background-remover',
  seo: {
    description:
      'Remove image backgrounds instantly using AI running in your browser. No uploads, no API calls — fully private and free. Download as transparent PNG or choose a custom background color.',
    title: 'Background Remover - CSR Dev Tools',
  },
},
```

### ToolRegistryKey Type Update (Copy-Paste Ready)

Add `'background-remover'` before `'base64-to-image'`:
```typescript
| 'aes-encrypt-decrypt'
| 'background-remover'
| 'base64-to-image'
```

### Vite Config Pre-Render Route (Copy-Paste Ready)

```typescript
{
  description:
    'Remove image backgrounds instantly using AI running in your browser. No uploads, no API calls — fully private and free.',
  path: '/tools/background-remover',
  title: 'Background Remover - CSR Dev Tools',
  url: '/tools/background-remover',
},
```

### Image Feature Barrel Update (Copy-Paste Ready)

Add as first line in `src/components/feature/image/index.ts`:
```typescript
export * from './BackgroundRemover'
```

### Utils Barrel Update (Copy-Paste Ready)

Add before `'./base64'` in `src/utils/index.ts`:
```typescript
export * from './background-removal'
```

### Error Messages

| Scenario | Behavior |
|----------|----------|
| Unsupported file type | Toast: "Please select an image file (PNG, JPG, or WEBP)" |
| Model download fails | Toast: "Failed to download AI model. Check your connection and try again." |
| Processing fails | Toast: "Failed to remove background. Try a different image." |
| Pipeline init fails | Toast: "Failed to initialize AI model. Your browser may not support this feature." |

### Previous Story Intelligence

From Epic 20 stories (most recent):
- **Dialog pattern confirmed** — `FaviconGenerator.tsx` is the canonical dialog-based image tool
- **`UploadInput` component** — handles drag-and-drop + click-to-upload, used by FaviconGenerator and ImageResizer
- **`useToast` for feedback** — success/error toasts, not `useToolError` (which is for inline tools)
- **Canvas API for image manipulation** — `favicon.ts` shows the pattern: create canvas, draw, toBlob
- **825 tests currently** — expect ~830+ after adding background-removal tests
- **55 tools currently** — this will be tool #56

### Git Intelligence

Recent commits:
```
bf724fd test(e2e): add comprehensive e2e tests for all 55 tools
f94d2dd test(e2e): add e2e tests for new tools
d333cdf docs: add Epic 20 retrospective
b2bc66c fix(epic-20): address code review findings
```

**Pattern:** New tool feature uses `✨: story X-Y Tool Name` commit prefix.
**This is the first story in Epic 21** — Epic status already `in-progress`.

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion.md#Epic 21] — Epic objectives, story requirements, technical approach
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Registry] — Registry entry pattern with all required fields
- [Source: _bmad-output/planning-artifacts/architecture.md#Code Splitting] — Lazy-loaded component pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Hard Constraints] — Zero server-side processing
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Tool component file structure
- [Source: src/components/feature/image/FaviconGenerator.tsx] — Dialog-based image tool pattern (upload → dialog → results)
- [Source: src/components/feature/image/ImageResizer.tsx] — UploadInput + dialog pattern
- [Source: src/components/feature/image/ImageColorPicker.tsx] — Image upload + canvas processing pattern
- [Source: src/utils/favicon.ts] — Canvas API image manipulation pattern (resize, toBlob, createObjectURL)
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey union and ToolComponentProps type
- [Source: src/constants/tool-registry.ts] — Current registry with 55 tools
- [Source: vite.config.ts] — Pre-render routes pattern
- [Source: @huggingface/transformers docs] — Pipeline API, background-removal task, progress callbacks

## Dev Agent Record

### Agent Model Used

Claude claude-opus-4-6 via OpenClaw

### Debug Log References

None

### Completion Notes List

- Installed `@huggingface/transformers@3.8.1` as production dependency
- Added `jsdom@28.1.0` as devDependency for test environment (needed for canvas/Image mocking)
- Pipeline is cached as a Promise singleton to prevent duplicate initialization on concurrent calls
- `@huggingface/transformers` is lazy-loaded via dynamic `import()` inside `removeBackground()` — not loaded at module top-level
- Test file uses `// @vitest-environment jsdom` directive since project default is `node`
- All 847 tests pass, TypeScript clean

### Change Log

- **Added** `src/utils/background-removal.ts` — `removeBackground()`, `applyBackground()`, `resetPipelineCache()` utilities
- **Added** `src/utils/background-removal.spec.ts` — 6 unit tests covering applyBackground compositing, error handling, removeBackground pipeline calls, and singleton caching
- **Added** `src/components/feature/image/BackgroundRemover.tsx` — Dialog-based component with 5-state machine (idle/downloading-model/processing/done/error), before/after view, background color picker, download/copy actions
- **Modified** `src/types/constants/tool-registry.ts` — Added `'background-remover'` to `ToolRegistryKey` union
- **Modified** `src/constants/tool-registry.ts` — Added Background Remover registry entry (Image category, ✂️ emoji)
- **Modified** `src/components/feature/image/index.ts` — Added `BackgroundRemover` barrel export
- **Modified** `src/utils/index.ts` — Added `background-removal` barrel export
- **Modified** `vite.config.ts` — Added `/tools/background-remover` prerender route
- **Modified** `package.json` — Added `@huggingface/transformers` dependency, `jsdom` devDependency
- **Modified** `pnpm-lock.yaml` — Updated lockfile

### File List

- `src/utils/background-removal.ts` (new)
- `src/utils/background-removal.spec.ts` (new)
- `src/components/feature/image/BackgroundRemover.tsx` (new)
- `src/types/constants/tool-registry.ts` (modified)
- `src/constants/tool-registry.ts` (modified)
- `src/components/feature/image/index.ts` (modified)
- `src/utils/index.ts` (modified)
- `vite.config.ts` (modified)
- `package.json` (modified)
- `pnpm-lock.yaml` (modified)
