# Story 26.2: Mermaid Diagram Renderer

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer/technical writer**,
I want **to write Mermaid diagram syntax and see a live SVG preview with export capabilities**,
so that **I can create and iterate on diagrams without embedding them in markdown renderers or leaving the browser**.

## Acceptance Criteria

1. **Given** the tool loads
   **When** Mermaid library initializes
   **Then** a loading skeleton is shown until ready (NFR-E3-02)

2. **Given** the user types valid Mermaid syntax (flowchart, sequence, class, etc.)
   **When** typing (debounced 500ms)
   **Then** a live SVG preview is rendered

3. **Given** invalid Mermaid syntax
   **When** entered
   **Then** an error message from the parser is shown

4. **Given** a rendered diagram
   **When** the user clicks "Export SVG"
   **Then** the SVG is downloaded

5. **Given** a rendered diagram
   **When** the user clicks "Export PNG"
   **Then** the SVG is rasterized and downloaded as PNG

6. **Given** a syntax reference panel
   **When** toggled
   **Then** quick-reference examples are shown for flowchart, sequence, class, state, gantt, and pie diagram types

## Tasks / Subtasks

- [x] Task 1: Install mermaid dependency (AC: all)
  - [x]1.1 Run `pnpm add mermaid` — installs mermaid (latest stable ~11.x). No `@types/mermaid` needed — types ship with the package.
  - [x]1.2 **CRITICAL Vite production build fix**: Add alias in `vite.config.ts` to resolve mermaid to its pre-built ESM distribution, preventing `"Cannot set properties of undefined (setting 'prototype')"` in production builds:
    ```typescript
    // Inside defineConfig > resolve > alias
    // Add alongside existing aliases:
    import path from 'node:path'
    // In resolve.alias:
    mermaid: path.join(__dirname, 'node_modules/mermaid/dist/mermaid.esm.min.mjs'),
    ```
    **Note**: Check current `vite.config.ts` to determine exact alias format — the project may use array format `[{ find, replacement }]` or object format `{ key: value }`. The `vite-tsconfig-paths` plugin handles `@/` alias via a plugin, but mermaid alias should go in `resolve.alias`.

- [x] Task 2: Create mermaid-renderer utility module (AC: #2, #3, #4, #5)
  - [x]2.1 Create `src/utils/mermaid-renderer.ts`
  - [x]2.2 Define types:
    ```typescript
    export type MermaidRenderResult = {
      diagramType: string
      svg: string
    }
    ```
  - [x]2.3 Implement `initializeMermaid(): void`:
    - Call `mermaid.initialize()` with:
      - `startOnLoad: false` — **CRITICAL** for React: prevent auto-scanning the DOM
      - `securityLevel: 'strict'` — encode HTML, disable click handlers, sanitize SVG
      - `theme: 'dark'` — matches CSR Dev Tools dark-only theme
      - `logLevel: 'error'` — suppress console noise
      - `flowchart: { useMaxWidth: true }` — responsive diagrams
    - Guard with a module-level `initialized` boolean so it runs only once
  - [x]2.4 Implement `sanitizeMermaidInput(code: string): string`:
    - Strip `%%{init}%%` directives from user input: `code.replace(/%%\{.*?\}%%/gs, '')`
    - These directives can override `securityLevel` at runtime — must be stripped for defense-in-depth
    - Trim the result
  - [x]2.5 Implement `renderMermaid(code: string, id: string): Promise<MermaidRenderResult>`:
    - Call `sanitizeMermaidInput()` on the input
    - If sanitized code is empty, throw an error "Empty diagram input"
    - Call `await mermaid.render(id, sanitizedCode)`
    - Sanitize SVG output with DOMPurify: `DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } })`
    - Return `{ svg: cleanSvg, diagramType }`
  - [x]2.6 Implement `parseMermaid(code: string): Promise<{ diagramType: string } | null>`:
    - Call `sanitizeMermaidInput()` on the input
    - Call `await mermaid.parse(sanitizedCode, { suppressErrors: true })`
    - Return the parse result (or null if invalid)
    - This is a lightweight validation that doesn't produce SVG — useful for pre-validation
  - [x]2.7 Implement `svgToPng(svgString: string, scale?: number): Promise<string>`:
    - Default `scale` to 2 (2x resolution for crisp export)
    - Create a temporary `<img>` element with `src` set to a data URI of the SVG: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
    - Wait for the image to load
    - Extract SVG dimensions from the SVG string (parse `width` and `height` attributes, or `viewBox`)
    - Create a `<canvas>` with dimensions `width * scale` x `height * scale`
    - Draw the image onto the canvas
    - Return `canvas.toDataURL('image/png')` as a data URL
    - Clean up temporary elements
  - [x]2.8 Implement `downloadSvg(svgString: string, filename?: string): void`:
    - Default filename: `'mermaid-diagram.svg'`
    - Create a Blob from the SVG string with type `'image/svg+xml'`
    - Create an object URL, trigger download via a temporary `<a>` element, revoke the URL
  - [x]2.9 Implement `downloadPng(pngDataUrl: string, filename?: string): void`:
    - Default filename: `'mermaid-diagram.png'`
    - Create a temporary `<a>` element with href set to the PNG data URL
    - Trigger click for download

- [x] Task 3: Create mermaid-renderer unit tests (AC: #2, #3, #4, #5)
  - [x]3.1 Create `src/utils/mermaid-renderer.spec.ts`
  - [x]3.2 Test `sanitizeMermaidInput`:
    - Strips `%%{init: {"securityLevel": "loose"}}%%` directives
    - Strips multiline init directives
    - Preserves valid mermaid syntax after stripping
    - Trims whitespace
    - Returns empty string for empty input
  - [x]3.3 Test `initializeMermaid`:
    - Calls `mermaid.initialize()` with expected config (mock mermaid)
    - Only initializes once (idempotent)
  - [x]3.4 Test `renderMermaid`:
    - **Note**: `mermaid.render()` requires a DOM environment. These tests should mock `mermaid.render()` and `DOMPurify.sanitize()` to test the orchestration logic. Test that:
      - Calls sanitizeMermaidInput before rendering
      - Calls DOMPurify.sanitize on the SVG output
      - Returns sanitized SVG and diagramType
      - Throws on empty input
  - [x]3.5 Test `parseMermaid`:
    - Returns parse result for valid syntax (mock mermaid.parse)
    - Returns null for invalid syntax
  - [x]3.6 Test `svgToPng`:
    - **Skip in node test environment** — Canvas and Image APIs are browser-only. Cover via E2E tests instead.
  - [x]3.7 Test `downloadSvg` / `downloadPng`:
    - **Skip in node test environment** — relies on DOM download pattern. Cover via E2E tests instead.

- [x] Task 4: Create MermaidRenderer component (AC: all)
  - [x]4.1 Create `src/components/feature/code/MermaidRenderer.tsx`
  - [x]4.2 Update `src/components/feature/code/index.ts` — add barrel export `export { MermaidRenderer } from './MermaidRenderer'` (alphabetical — after `MarkdownTableGenerator`, before `ProtobufToJson`)
  - [x]4.3 Implement main layout: tool description from `TOOL_REGISTRY_MAP['mermaid-renderer']`, editor input section, SVG preview section
  - [x]4.4 **Loading State (AC #1, NFR-E3-02)**:
    - The component is lazy-loaded via the registry's `lazy()` import — the mermaid library is bundled into this chunk
    - Show a loading skeleton while `initializeMermaid()` runs on mount: `<div className="flex h-full w-full animate-pulse items-center justify-center rounded bg-gray-800"><span className="text-body-xs text-gray-500">Loading Mermaid renderer...</span></div>`
    - Use a `useState<boolean>` for `isReady` — set to `true` after `initializeMermaid()` completes
    - `initializeMermaid()` is synchronous but import of mermaid may be async in the chunk — the lazy load handles this
  - [x]4.5 **Editor Input Section (AC #2, #3)**:
    - Use `FieldForm` with `type="textarea"` for the Mermaid syntax input
    - `rows={12}` for desktop height, placeholder with sample flowchart syntax
    - Default sample code to show on mount:
      ```
      flowchart TD
          A[Start] --> B{Decision}
          B -->|Yes| C[Do something]
          B -->|No| D[Do something else]
          C --> E[End]
          D --> E
      ```
    - On input change, debounce 500ms (per spec) and call `renderMermaid()`
    - **Error Display (AC #3)**: Show error message below the textarea when mermaid parsing fails. Use inline error with `role="alert"` — red text showing the parser error message
  - [x]4.6 **SVG Preview Section (AC #2)**:
    - Render the sanitized SVG using `dangerouslySetInnerHTML={{ __html: svg }}`
    - **Defense-in-depth**: SVG is already sanitized by DOMPurify in `renderMermaid()` utility
    - Container with overflow-auto for large diagrams, centered content
    - Background: slightly lighter bg to distinguish the preview area (e.g., `bg-gray-900` on the `bg-gray-950` page)
    - When no SVG is available and no error, show empty state: "Enter Mermaid syntax to see a preview"
    - `aria-live="polite"` on the preview container
  - [x]4.7 **Export SVG (AC #4)**:
    - "Export SVG" button using `Button` component — only enabled when SVG is available
    - Calls `downloadSvg(svg)` from the utility module
    - Show toast on success: `'Downloaded mermaid-diagram.svg'`
  - [x]4.8 **Export PNG (AC #5)**:
    - "Export PNG" button using `Button` component — only enabled when SVG is available
    - Calls `svgToPng(svg)` then `downloadPng(dataUrl)` from the utility module
    - Show progress/disabled state while PNG is being generated (canvas rasterization may take a moment for large diagrams)
    - Show toast on success: `'Downloaded mermaid-diagram.png'`
    - Use `useToast` with `type: 'error'` if PNG export fails
  - [x]4.9 **Syntax Reference Panel (AC #6)**:
    - Toggle button/link: "Syntax Reference" — shows/hides a reference panel
    - Panel contains quick-reference examples for each diagram type as copyable code blocks:
      - **Flowchart**: `flowchart TD\n    A --> B`
      - **Sequence**: `sequenceDiagram\n    Alice->>Bob: Hello`
      - **Class**: `classDiagram\n    Animal <|-- Duck`
      - **State**: `stateDiagram-v2\n    [*] --> Active`
      - **Gantt**: `gantt\n    title Project\n    section A\n    Task 1: a1, 2024-01-01, 30d`
      - **Pie**: `pie\n    title Distribution\n    "A": 40\n    "B": 30\n    "C": 30`
    - Each example has a CopyButton to copy to clipboard
    - Optional: clicking an example inserts it into the editor (replacing current content)
  - [x]4.10 **Render Orchestration**:
    - Use `useRef` for a render counter to handle stale renders (increment on each input change, compare before setting state)
    - Use `useDebounceCallback` from `@/hooks` with 500ms delay
    - Flow: input change → debounce 500ms → `renderMermaid(code, id)` → set SVG state or error state
    - Generate unique render IDs: `mermaid-render-${counter}` — mermaid requires unique IDs per render call
    - Handle race conditions: only apply result if render counter matches (prevents out-of-order updates)
  - [x]4.11 **Layout**: Desktop (md+): editor on the left (~45%), preview on the right (~55%) using `flex flex-col md:flex-row gap-4`. Mobile (< 768px): stack vertically — editor input, then preview, then export buttons.
  - [x]4.12 **Accessibility**:
    - `aria-live="polite"` on the SVG preview container
    - `role="alert"` on error messages
    - `aria-label` on export buttons ("Export diagram as SVG", "Export diagram as PNG")
    - `aria-label` on syntax reference toggle
    - `aria-expanded` on syntax reference toggle reflecting panel visibility
    - All interactive elements keyboard accessible

- [x] Task 5: Register tool and configure routing (AC: all)
  - [x]5.1 Add `'mermaid-renderer'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetical — between `'markdown-table-generator'` and `'number-base-converter'`)
  - [x]5.2 **No new `ToolCategory` needed** — `'Code'` already exists in the union
  - [x]5.3 Add registry entry in `src/constants/tool-registry.ts` (alphabetical within array — between markdown-table-generator and number-base-converter):
    ```typescript
    {
      category: 'Code',
      component: lazy(() =>
        import('@/components/feature/code/MermaidRenderer').then(
          ({ MermaidRenderer }: { MermaidRenderer: ComponentType }) => ({
            default: MermaidRenderer,
          }),
        ),
      ),
      description:
        'Write Mermaid diagram syntax and see a live SVG preview. Supports flowchart, sequence, class, state, gantt, pie, and more. Export as SVG or PNG.',
      emoji: '🧜',
      key: 'mermaid-renderer',
      name: 'Mermaid Renderer',
      routePath: '/tools/mermaid-renderer',
      seo: {
        description:
          'Render Mermaid diagrams to SVG online. Live preview for flowcharts, sequence diagrams, class diagrams, state diagrams, gantt charts, and more. Export SVG or PNG, 100% client-side.',
        title: 'Mermaid Renderer - CSR Dev Tools',
      },
    }
    ```
  - [x]5.4 Add prerender route `/tools/mermaid-renderer` in `vite.config.ts` `toolRoutes` array (alphabetical — between markdown-table-generator and number-base-converter):
    ```typescript
    {
      description:
        'Render Mermaid diagrams to SVG online. Live preview for flowcharts, sequence diagrams, class diagrams, state diagrams, gantt charts, and more. Export SVG or PNG, 100% client-side.',
      path: '/tools/mermaid-renderer',
      title: 'Mermaid Renderer - CSR Dev Tools',
      url: '/tools/mermaid-renderer',
    },
    ```

- [x] Task 6: Create E2E tests (AC: all)
  - [x]6.1 Create `e2e/mermaid-renderer.spec.ts`
  - [x]6.2 Test: navigate to `/tools/mermaid-renderer`, verify title and description are rendered (AC: basic)
  - [x]6.3 Test: loading state — initially shows loading skeleton, then editor becomes available (AC #1)
  - [x]6.4 Test: default sample code renders a flowchart SVG preview on load (AC #2)
  - [x]6.5 Test: type valid Mermaid syntax (e.g., `sequenceDiagram\n    Alice->>Bob: Hello`) → SVG preview updates after debounce (AC #2)
  - [x]6.6 Test: type invalid syntax → error message appears with `role="alert"` (AC #3)
  - [x]6.7 Test: fix invalid syntax → error clears and SVG preview appears (AC #3)
  - [x]6.8 Test: click "Export SVG" button → download triggered (verify via Playwright download event) (AC #4)
  - [x]6.9 Test: click "Export PNG" button → download triggered (verify via Playwright download event) (AC #5)
  - [x]6.10 Test: toggle syntax reference panel → reference examples are visible with CopyButton (AC #6)
  - [x]6.11 Test: click CopyButton on a syntax reference example → text is copied to clipboard
  - [x]6.12 Test: mobile viewport (375px) responsiveness — editor and preview stack vertically
  - [x]6.13 Test: export buttons are disabled when no SVG is available (empty/invalid input)

- [x] Task 7: Verify build and tests pass
  - [x]7.1 Run `pnpm lint` — 0 errors
  - [x]7.2 Run `pnpm format` — compliant
  - [x]7.3 Run `pnpm test` — all tests pass (0 regressions)
  - [x]7.4 Run `pnpm build` — clean build, static HTML files generated (new count = previous + 1 = 62)
  - [x]7.5 Run E2E tests — all Mermaid Renderer tests pass
  - [x]7.6 Verify tool works in production build (`pnpm preview`) — **CRITICAL**: test production build specifically due to mermaid Vite alias requirement
  - [x]7.7 Verify mermaid chunk is code-split (not in initial bundle) — check `dist/assets/` for a separate mermaid chunk

## Dev Notes

### Architecture Compliance

- **Technical Stack**: React 19.2.4, TypeScript 5.9.3 (strict), Vite 7.3.1, Tailwind CSS 4.1.18, Motion 12.34.0
- **Component Pattern**: Named export `export const MermaidRenderer`, no default export
- **State**: `useState` for local UI state (input code, SVG output, error, isReady, syntax reference visibility)
- **Error Handling**: Input validation/parse errors displayed inline below textarea; `useToast` with `type: 'error'` for unexpected failures (export errors)
- **Styling**: Tailwind CSS v4 classes, `tv()` from `@/utils` if component variants needed, OKLCH color space
- **Animations**: Import from `motion/react` (NOT `framer-motion`) — optional fade-in for SVG preview updates
- **Code Quality**: oxlint + oxfmt — no semicolons, single quotes, trailing commas, 120 char width

### Mermaid Library: `mermaid` (~11.x)

**Installation**: `pnpm add mermaid`

No `@types/mermaid` needed — types ship with the package since v10+.

**Core API Pattern**:

```typescript
import mermaid from 'mermaid'  // Default ESM import
import DOMPurify from 'dompurify'  // Already installed in project (3.3.1)

// Initialize once (synchronous, guard with boolean)
mermaid.initialize({
  startOnLoad: false,       // CRITICAL: disable auto-DOM-scan for React
  securityLevel: 'strict',  // Encode HTML, disable click handlers
  theme: 'dark',            // Match CSR Dev Tools dark theme
  logLevel: 'error',        // Suppress console noise
  flowchart: { useMaxWidth: true },
})

// Render (async, returns SVG string)
const { svg, diagramType } = await mermaid.render('unique-id', sanitizedCode)

// Validate without rendering (lightweight)
const result = await mermaid.parse(code, { suppressErrors: true })
// Returns { diagramType } or false
```

**Supported Diagram Types** (20+):
- **Stable**: flowchart/graph, sequenceDiagram, classDiagram, stateDiagram-v2, erDiagram, gantt, pie, gitGraph, journey, mindmap, timeline, quadrantChart, requirementDiagram, C4 diagrams
- **Beta**: xychart-beta, sankey-beta, block-beta, packet-beta, architecture-beta

Each diagram type is **lazy-loaded by mermaid internally**, keeping the chunk size manageable.

### CRITICAL: Vite Production Build Workaround

Mermaid has a known issue ([GitHub #5362](https://github.com/mermaid-js/mermaid/issues/5362)) where production builds fail with `"Cannot set properties of undefined (setting 'prototype')"`. The fix is a Vite alias that resolves mermaid to its pre-built ESM file:

```typescript
// vite.config.ts — resolve.alias section
import path from 'node:path'

resolve: {
  alias: {
    mermaid: path.join(__dirname, 'node_modules/mermaid/dist/mermaid.esm.min.mjs'),
  },
}
```

**MUST test production build** (`pnpm build && pnpm preview`) to verify this fix works before marking story as done.

### CRITICAL: Security — XSS Prevention

Mermaid renders SVG from user input, creating XSS risk. Defense-in-depth approach:

1. **`securityLevel: 'strict'`** — mermaid's built-in sanitization
2. **Strip `%%{init}%%` directives** — users can override securityLevel with inline `%%{init: {"securityLevel": "loose"}}%%` directives. **MUST strip these** before rendering:
   ```typescript
   const sanitized = code.replace(/%%\{.*?\}%%/gs, '')
   ```
3. **DOMPurify sanitization** — sanitize SVG output before DOM insertion:
   ```typescript
   import DOMPurify from 'dompurify'
   const clean = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } })
   ```
4. **DOMPurify is already installed**: `dompurify@3.3.1` + `@types/dompurify@3.2.0`

### SVG to PNG Export Pattern

Use Canvas API for client-side rasterization — no external dependency needed:

```typescript
async function svgToPng(svgString: string, scale = 2): Promise<string> {
  // 1. Parse SVG dimensions from the string (width/height attrs or viewBox)
  // 2. Create <img> with data URI: data:image/svg+xml;charset=utf-8,{encodedSvg}
  // 3. Wait for img.onload
  // 4. Create <canvas> at width*scale x height*scale
  // 5. ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  // 6. Return canvas.toDataURL('image/png')
}
```

Scale factor of 2 produces crisp exports at 2x resolution. The SVG viewBox should be used to determine intrinsic dimensions.

### Tool Type: Live Preview Editor

This tool uses the live preview pattern:

- **Processing trigger**: On input change → debounced 500ms
- **Debounce**: 500ms (heavier than typical 300ms due to mermaid render cost) via `useDebounceCallback` from `@/hooks`
- **Input**: `FieldForm` with `type="textarea"` for Mermaid syntax editor
- **Output**: SVG preview rendered via `dangerouslySetInnerHTML` + export buttons
- **Error**: Inline below textarea, `role="alert"`, cleared on successful render
- **Loading**: Skeleton on mount while mermaid initializes

### Category and Domain Placement

**Category**: `'Code'` (already exists — used by GraphQL Schema Viewer, TypeScript Playground, JSONPath Evaluator, etc.)
**Component Directory**: `src/components/feature/code/MermaidRenderer.tsx`
**Emoji**: 🧜
**Key**: `mermaid-renderer`
**Route**: `/tools/mermaid-renderer`

### Component Implementation Pattern

```
src/components/feature/code/MermaidRenderer.tsx
├── Tool description from TOOL_REGISTRY_MAP['mermaid-renderer']
│
├── Loading Skeleton (shown while mermaid initializes)
│   └── "Loading Mermaid renderer..." with pulse animation
│
├── Main Layout (flex row on desktop, flex col on mobile)
│   ├── Left Panel: Editor Section (~45%)
│   │   ├── Header: "Mermaid Syntax" label
│   │   ├── FieldForm textarea (rows=12, placeholder with sample syntax)
│   │   ├── Error message (inline, role="alert", red text)
│   │   └── Syntax Reference toggle + collapsible panel
│   │
│   └── Right Panel: Preview Section (~55%)
│       ├── Header: "Preview" + Export buttons (SVG, PNG)
│       ├── SVG preview container (aria-live="polite", overflow-auto)
│       │   └── dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
│       └── Empty state: "Enter Mermaid syntax to see a preview"
│
└── Syntax Reference Panel (collapsible)
    ├── Flowchart example + CopyButton
    ├── Sequence example + CopyButton
    ├── Class example + CopyButton
    ├── State example + CopyButton
    ├── Gantt example + CopyButton
    └── Pie example + CopyButton
```

### Render Counter Pattern (Race Condition Prevention)

```typescript
const renderCounterRef = useRef(0)

const handleRender = useCallback(async (code: string) => {
  const currentRender = ++renderCounterRef.current
  try {
    const result = await renderMermaid(code, `mermaid-${currentRender}`)
    if (currentRender === renderCounterRef.current) {
      setSvg(result.svg)
      setError(null)
    }
  } catch (err) {
    if (currentRender === renderCounterRef.current) {
      setError(err instanceof Error ? err.message : 'Invalid Mermaid syntax')
      setSvg('')
    }
  }
}, [])
```

This prevents stale renders from overwriting newer results when the user types rapidly.

### Previous Story Intelligence (26.1 Timezone Converter)

Key learnings from Story 26.1 to apply here:

1. **Barrel export ordering**: Maintain alphabetical order in `src/components/feature/code/index.ts` — new entry goes after `MarkdownTableGenerator`, before `ProtobufToJson`
2. **Registration checklist**: types union → registry entry → vite prerender → barrel exports
3. **Code category already exists**: `'Code'` is in ToolCategory and CATEGORY_ORDER — no changes needed
4. **Tool description display**: Read from `TOOL_REGISTRY_MAP[key]?.description` and render as `<p>` tag
5. **Stale closure bug**: Previous stories hit stale closure with debounced callbacks capturing stale state. Use `useRef` mirrors for state values referenced in debounced callbacks
6. **Code review common fixes**: Watch for falsy value handling (0, false, ""), Tailwind class ordering (responsive before base), missing useMemo for derived values
7. **E2E test selectors**: Use data-testid or specific selectors to avoid strict-mode violations
8. **Debug log from 26.1**: Vitest requires explicit `import { describe, expect, it } from 'vitest'` — project convention requires explicit vitest imports for TypeScript compilation
9. **Debug log from 26.1**: AnimatePresence `mode="popLayout"` keeps exiting elements in DOM during animation — use Playwright auto-retrying assertions
10. **ToolComponentProps**: Component receives `({ autoOpen, onAfterDialogClose }: ToolComponentProps)` — may use Dialog with `size="screen"` for fullscreen editor experience (check if mermaid editor benefits from this pattern)

### Git Intelligence

Recent commit patterns:
- `28134a9` — `🌍 Timezone Converter + 🔍 code review fixes (Story 26.1)`
- `46957e6` — `🔄 Epic 25 Retrospective — Code & Schema Tools`
- `8d24460` — `🎯 JSONPath Evaluator + 🔍 code review fixes (Story 25.4)`

**Commit message pattern**: `{emoji} {Tool Name} + 🔍 code review fixes (Story {epic}.{story})`
Suggested for this story: `🧜 Mermaid Renderer + 🔍 code review fixes (Story 26.2)`

**Files modified in Story 26.1** (pattern to follow):
- New utility: `src/utils/mermaid-renderer.ts`
- New unit tests: `src/utils/mermaid-renderer.spec.ts`
- New component: `src/components/feature/code/MermaidRenderer.tsx`
- Barrel export update: `src/components/feature/code/index.ts`
- Types update: `src/types/constants/tool-registry.ts`
- Registry update: `src/constants/tool-registry.ts`
- Vite config update: `vite.config.ts` (prerender route + mermaid alias)
- New E2E test: `e2e/mermaid-renderer.spec.ts`

### Existing Utilities to REUSE

**Hooks to Use:**
- `useDebounceCallback` from `@/hooks` — debounce rendering on input change (500ms)
- `useToast` from `@/hooks` — for export error/success notifications
- Do NOT use `useCopyToClipboard` directly — use CopyButton component

**Components to Use:**
- `CopyButton` from `@/components/common` — for copying syntax reference examples and SVG output
- `Button` from `@/components/common` — for Export SVG/PNG buttons
- `FieldForm` from `@/components/common` — for the Mermaid syntax textarea (`type="textarea"`)
- Consider `Dialog` from `@/components/common` with `size="screen"` if using the fullscreen editor pattern

**Existing Dependencies:**
- `dompurify@3.3.1` — already installed, import as `import DOMPurify from 'dompurify'`
- `@types/dompurify@3.2.0` — already installed

### Project Structure Notes

- **Existing directory**: `src/components/feature/code/` — already exists with 12 tools (CssFormatter, GraphqlSchemaViewer, HtmlFormatter, etc.)
- **Code category already exists**: `'Code'` in ToolCategory and CATEGORY_ORDER — no changes needed
- **Code barrel already exists**: `src/components/feature/code/index.ts` — add new export after MarkdownTableGenerator, before ProtobufToJson
- **New dependency**: `mermaid` npm package
- **Existing dependency**: `dompurify` (already installed)
- **Utility file**: `src/utils/mermaid-renderer.ts` — pure functions for mermaid init, render, sanitize, export
- **Unit tests**: `src/utils/mermaid-renderer.spec.ts` — test sanitization and orchestration logic (mock mermaid APIs for node env)

### File Locations & Naming

| File | Path |
|---|---|
| Utility | `src/utils/mermaid-renderer.ts` |
| Unit tests | `src/utils/mermaid-renderer.spec.ts` |
| Component | `src/components/feature/code/MermaidRenderer.tsx` |
| Code barrel update | `src/components/feature/code/index.ts` |
| E2E test | `e2e/mermaid-renderer.spec.ts` |
| Registry key type | `src/types/constants/tool-registry.ts` |
| Registry entry | `src/constants/tool-registry.ts` |
| Prerender route + Mermaid alias | `vite.config.ts` |

### Code Conventions (Enforced)

- `type` over `interface`
- `Array<T>` over `T[]`
- `import type` for type-only imports
- Named exports only (no default export for components)
- `@/` path alias for all imports
- Let TypeScript infer where possible
- No `console.log` statements
- Alphabetical ordering in object keys, barrel exports, union types
- Import `mermaid` as default import: `import mermaid from 'mermaid'`
- Import `DOMPurify` as default import: `import DOMPurify from 'dompurify'`

### E2E Testing Notes

**Mermaid Renderer Testing:**
- Loading state: Verify skeleton appears briefly, then editor becomes interactive. May need `waitForSelector` or Playwright auto-waiting.
- Debounce: SVG preview updates are debounced 500ms — wait for SVG to appear after input changes using Playwright's auto-retrying `toBeVisible()` assertions
- SVG rendering: Verify the preview container has SVG content (check for `<svg>` element inside the container)
- Export download: Use Playwright's download event listener (`page.waitForEvent('download')`) to verify SVG/PNG downloads
- Syntax reference: Toggle visibility and verify examples are rendered with CopyButton
- Error display: Type invalid syntax and verify error message appears with `role="alert"`
- Mobile: Verify stacked layout at 375px viewport

### UX / Interaction Requirements

- **Editor Section**: FieldForm textarea with sample Mermaid syntax pre-populated, 500ms debounced live rendering
- **Preview Section**: SVG rendered inline with overflow-auto for large diagrams, slightly distinct background
- **Export Buttons**: "Export SVG" and "Export PNG" — disabled when no SVG available
- **Syntax Reference**: Collapsible panel with 6 diagram type examples, each with CopyButton
- **Error Display**: Inline below textarea, red text, cleared on successful render
- **Loading**: Skeleton pulse animation on mount until mermaid initializes
- **Responsive**: Desktop: side-by-side editor + preview. Mobile (< 768px): stacked vertically.
- **Initial state**: Sample flowchart code pre-populated, SVG preview rendered on mount after initialization
- **Mobile**: Full-width, 375px min viewport. All sections stack vertically.
- **Theme**: Mermaid `theme: 'dark'` to match CSR Dev Tools dark-only design

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion-3.md#Epic 26 Story 26.2]
- [Source: _bmad-output/project-context.md#Implementation Rules, Adding a New Tool]
- [Source: _bmad-output/implementation-artifacts/26-1-timezone-converter.md — previous story patterns and learnings]
- [Source: _bmad-output/planning-artifacts/architecture.md — Tool Processing, Error Handling, Code Splitting]
- [Source: src/constants/tool-registry.ts — registry entry pattern and CATEGORY_ORDER]
- [Source: src/types/constants/tool-registry.ts — ToolRegistryKey and ToolCategory types]
- [Source: src/components/feature/code/index.ts — code domain barrel exports pattern]
- [Source: src/components/feature/code/TypescriptPlayground.tsx — existing code tool with heavy library lazy-loading pattern]
- [Source: vite.config.ts — prerender route registration and resolve.alias]
- [Source: npm mermaid — latest stable version, API, security]
- [Source: GitHub mermaid-js/mermaid#5362 — Vite production build workaround]
- [Source: DOMPurify — SVG sanitization for defense-in-depth]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Mermaid 11.12.3 installed (latest stable)
- Vite alias required for production build: `mermaid → node_modules/mermaid/dist/mermaid.esm.min.mjs`
- Used `import.meta.dirname` (ESM) instead of `__dirname` for alias path
- Button component only picks `disabled | onBlur | onClick | type` from HTMLButtonElement — removed invalid `aria-label` props
- E2E test strict mode violations: `getByText('Flowchart')` matched 5 elements; fixed by using `getByRole('button', { name: 'Use Flowchart example' })`
- ParseResult type from mermaid requires `config` property alongside `diagramType`; test mocks use `as never` cast for partial mock values
- Vitest requires explicit `import { describe, expect, it, vi } from 'vitest'` per project convention

### Completion Notes List

- ✅ Task 1: Installed mermaid@11.12.3, added Vite resolve.alias for production build fix
- ✅ Task 2: Created `src/utils/mermaid-renderer.ts` with initializeMermaid, sanitizeMermaidInput, renderMermaid, parseMermaid, svgToPng, downloadSvg, downloadPng
- ✅ Task 3: Created 15 unit tests in `src/utils/mermaid-renderer.spec.ts` — sanitization, init idempotency, render orchestration, parse validation
- ✅ Task 4: Created MermaidRenderer component with loading skeleton, live preview (500ms debounce), error display, export SVG/PNG, syntax reference panel with 6 examples
- ✅ Task 5: Registered tool in types union, tool registry, barrel export, and vite prerender routes
- ✅ Task 6: Created 12 E2E tests covering all 6 ACs — navigation, loading, live preview, error handling, SVG export, PNG export, syntax reference, clipboard, mobile responsive, disabled state
- ✅ Task 7: All checks pass — 0 lint errors, 1271 unit tests pass (0 regressions), 12 E2E tests pass, production build succeeds with 62 static HTML files, mermaid chunk code-split (577 kB)

### Change Log

- 2026-02-25: Story 26.2 implementation complete — Mermaid Diagram Renderer with live SVG preview and export
- 2026-02-25: Code review complete — 4 MEDIUM issues fixed (inline debounce callback, missing error propagation test, E2E waitForTimeout anti-pattern, fragile test ordering). 3 LOW issues noted (unused diagramType, TextAreaInput vs FieldForm deviation, Button aria-label limitation). All ACs verified implemented. Status → done.

### File List

- `src/utils/mermaid-renderer.ts` (new) — utility module: init, sanitize, render, parse, svgToPng, download helpers
- `src/utils/mermaid-renderer.spec.ts` (new) — 15 unit tests for utility module
- `src/components/feature/code/MermaidRenderer.tsx` (new) — main component with editor, preview, export, syntax reference
- `src/components/feature/code/index.ts` (modified) — added MermaidRenderer barrel export
- `src/types/constants/tool-registry.ts` (modified) — added 'mermaid-renderer' to ToolRegistryKey union
- `src/constants/tool-registry.ts` (modified) — added registry entry with lazy import, seo, emoji, category
- `vite.config.ts` (modified) — added mermaid resolve.alias + prerender route for /tools/mermaid-renderer
- `e2e/mermaid-renderer.spec.ts` (new) — 12 E2E tests covering all acceptance criteria
- `package.json` (modified) — mermaid dependency added
- `pnpm-lock.yaml` (modified) — lockfile updated
