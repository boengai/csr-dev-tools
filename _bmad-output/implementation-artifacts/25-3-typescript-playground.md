# Story 25.3: TypeScript Playground

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **to write TypeScript in a browser-based editor with real-time type checking and transpiled JavaScript output**,
so that **I can quickly experiment with TypeScript syntax and features without setting up a local project**.

## Acceptance Criteria

1. **Given** the tool loads
   **When** Monaco Editor initializes
   **Then** a loading skeleton is shown until the editor is ready (NFR-E3-01)

2. **Given** the user types TypeScript code
   **When** typing
   **Then** real-time type checking runs with error squiggles and hover type info

3. **Given** valid TypeScript code
   **When** entered
   **Then** transpiled JavaScript output is shown in a secondary read-only editor pane

4. **Given** TypeScript with type errors
   **When** errors exist
   **Then** errors are listed below the editor with line numbers and messages

5. **Given** the user clicks "Copy JS"
   **When** clicked
   **Then** the transpiled JavaScript is copied to clipboard

## Tasks / Subtasks

- [x] Task 1: Install @monaco-editor/react package (AC: all)
  - [x] 1.1 Run `pnpm add @monaco-editor/react` — the React wrapper for Monaco Editor. `.npmrc` enforces `save-exact=true` automatically.
  - [x] 1.2 Verify `package.json` has the exact version pinned (no `^` or `~`). Expected: `@monaco-editor/react` 4.7.0 (latest stable, published Feb 2025, adds React 19 support).
  - [x] 1.3 Note: `@monaco-editor/react` loads `monaco-editor` **from CDN** (jsdelivr) by default via `@monaco-editor/loader`. The default CDN version is **monaco-editor v0.52.2**. No separate `monaco-editor` package install is needed. This means Monaco is NOT in the project bundle — it loads asynchronously at runtime, which is ideal for NFR8.
  - [x] 1.4 Note: Monaco Editor includes a built-in TypeScript language service via Web Workers (vendored ~TS 5.4.5). No separate `typescript` package is needed.
  - [x] 1.5 Verify the package works in browser — Monaco is browser-native, no Node.js polyfills required.
  - [x] 1.6 **CRITICAL**: Use `monaco.languages.typescript` namespace (NOT `monaco.typescript`). Monaco v0.55+ restructured namespaces, but the default CDN loads v0.52.2 which uses the legacy namespace.

- [x] Task 2: Create TypescriptPlayground component (AC: #1, #2, #3, #4, #5)
  - [x] 2.1 Create `src/components/feature/code/TypescriptPlayground.tsx`
  - [x] 2.2 Update `src/components/feature/code/index.ts` — add barrel export `export { TypescriptPlayground } from './TypescriptPlayground'` (alphabetical — between `SqlFormatter` and end of file, i.e. after `SqlFormatter`)
  - [x] 2.3 Implement main layout: tool description from `TOOL_REGISTRY_MAP['typescript-playground']`, TypeScript editor (left/top), JavaScript output editor (right/bottom), error list panel
  - [x] 2.4 **Loading Skeleton (AC #1)**: Use Monaco's `loading` prop to show a pulse-animated skeleton placeholder while the editor loads. The skeleton should match the editor dimensions. Use Tailwind `animate-pulse bg-gray-800 rounded` pattern. This satisfies NFR-E3-01.
  - [x] 2.5 **TypeScript Editor (AC #2)**: Use `<Editor>` component from `@monaco-editor/react` with:
    - `defaultLanguage="typescript"`
    - `theme="vs-dark"` (matches project's dark-only theme)
    - `defaultValue` with a sample TypeScript snippet
    - `options`: `{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, automaticLayout: true, tabSize: 2 }`
    - `onChange` handler to trigger transpilation
  - [x] 2.6 **Configure TypeScript Compiler Options**: In `beforeMount` callback, set compiler options via `monaco.languages.typescript.typescriptDefaults.setCompilerOptions()`:
    ```typescript
    {
      target: monaco.languages.typescript.ScriptTarget.ES2022,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      noEmit: false,
      allowNonTsExtensions: true,
    }
    ```
  - [x] 2.7 **Transpilation (AC #3)**: After editor content changes (debounced ~500ms using `useDebounceCallback`), get transpiled JS via Monaco's TypeScript worker:
    ```typescript
    const getTranspiledOutput = async (editor, monaco) => {
      const model = editor.getModel()
      if (!model) return ''
      const worker = await monaco.languages.typescript.getTypeScriptWorker()
      const client = await worker(model.uri)
      const result = await client.getEmitOutput(model.uri.toString())
      return result.outputFiles[0]?.text ?? ''
    }
    ```
  - [x] 2.8 **JavaScript Output Editor (AC #3)**: Second `<Editor>` component configured as read-only:
    - `defaultLanguage="javascript"`
    - `theme="vs-dark"`
    - `options`: `{ readOnly: true, minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, automaticLayout: true, tabSize: 2, domReadOnly: true }`
    - `value` bound to transpiled JS state
  - [x] 2.9 **Error List (AC #4)**: Use Monaco's `onValidate` prop on the TypeScript editor. This fires with an array of `markers` (type `editor.IMarkerData`) whenever diagnostics change. Display errors below the editors in a scrollable list:
    - Each error: line number, column, severity icon, message
    - Format: `"Line {startLineNumber}:{startColumn} — {message}"`
    - Use `role="alert"` on the error container
    - Filter to only show `MarkerSeverity.Error` (value 8) and `MarkerSeverity.Warning` (value 4). Other severities: Hint=1, Info=2.
  - [x] 2.10 **Copy JS Button (AC #5)**: Place a `CopyButton` adjacent to the JS output editor header. The CopyButton copies the full transpiled JavaScript string.
  - [x] 2.11 **Layout**: Desktop (md+): side-by-side editors (TypeScript left, JavaScript right) using `flex flex-col md:flex-row`. Error list spans full width below both editors. Mobile (< 768px): stack vertically — TS editor, JS output editor, error list.
  - [x] 2.12 **Default Sample Code**: Pre-populate with a TypeScript sample that showcases types, generics, and interfaces:
    ```typescript
    type User = {
      name: string
      age: number
      email: string
    }

    const greet = (user: User): string => {
      return `Hello, ${user.name}! You are ${user.age} years old.`
    }

    const users: Array<User> = [
      { name: 'Alice', age: 30, email: 'alice@example.com' },
      { name: 'Bob', age: 25, email: 'bob@example.com' },
    ]

    const messages = users.map(greet)
    console.log(messages)
    ```
  - [x] 2.13 Implement error handling: use `useToast` with `type: 'error'` for unexpected failures (e.g., worker not available). Type checking errors are shown in the error list (AC #4), not as toasts.
  - [x] 2.14 **Dynamic import**: The `@monaco-editor/react` `Editor` component itself handles lazy-loading of `monaco-editor` internally (it uses `@monaco-editor/loader`). However, the component import in the tool registry is already lazy via `lazy(() => import(...))`. No additional dynamic import pattern is needed — Monaco handles its own loading lifecycle via the `loading` prop and workers.
  - [x] 2.15 Add `aria-live="polite"` on the error list for screen reader announcements when errors change
  - [x] 2.16 Add section headers: "TypeScript" and "JavaScript" labels above each editor pane, with the CopyButton in the JS header
  - [x] 2.17 **Editor Height**: Set both editors to `height="400px"` on desktop, `height="300px"` on mobile. Use a responsive wrapper.

- [x] Task 3: Register tool and configure routing (AC: all)
  - [x] 3.1 Add `'typescript-playground'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetical — between `'toml-to-json-converter'` and `'unix-timestamp'`)
  - [x] 3.2 Add registry entry in `src/constants/tool-registry.ts` (alphabetical within array)
  - [x] 3.3 Add prerender route `/tools/typescript-playground` in `vite.config.ts` `toolRoutes` array

- [x] Task 4: Implement accessibility (AC: all)
  - [x] 4.1 Add `aria-live="polite"` on the error list container (updates when diagnostics change)
  - [x] 4.2 Add `aria-label="TypeScript code editor"` on the TS editor wrapper and `aria-label="JavaScript output (read-only)"` on the JS editor wrapper
  - [x] 4.3 Add `role="alert"` on the error list for screen reader updates
  - [x] 4.4 Monaco Editor has built-in keyboard accessibility (Tab for indentation, Escape to leave editor focus). No additional keyboard navigation is needed within the editor itself.
  - [x] 4.5 Ensure the CopyButton is keyboard accessible (it already is — built-in focus styles)
  - [x] 4.6 Section headers ("TypeScript", "JavaScript") should be `<h3>` or appropriate heading level
  - [x] 4.7 Error messages should include severity for screen readers (e.g., `aria-label="Error on line 5: Type 'string' is not assignable..."`)

- [x] Task 5: Create E2E tests (AC: all)
  - [x] 5.1 Create `e2e/typescript-playground.spec.ts`
  - [x] 5.2 Test: navigate to tool page, verify title and description are rendered
  - [x] 5.3 Test: wait for Monaco Editor to load (loading skeleton disappears, editor is visible) (AC #1)
  - [x] 5.4 Test: type valid TypeScript code -> JS output pane shows transpiled JavaScript (AC #3)
  - [x] 5.5 Test: type TypeScript with a type error (e.g., `const x: number = "hello"`) -> error list shows the type error with line number (AC #4)
  - [x] 5.6 Test: default sample code is present on load, JS output is generated from it (AC #2, #3)
  - [x] 5.7 Test: click CopyButton -> transpiled JS is copied to clipboard (AC #5)
  - [x] 5.8 Test: type valid code after error code -> error list clears (AC #4)
  - [x] 5.9 Test: mobile viewport (375px) responsiveness — editors stack vertically
  - [x] 5.10 **Important**: Monaco Editor takes time to initialize in E2E tests. Use generous timeouts (`{ timeout: 15000 }`) when waiting for the editor to appear. Use `page.locator('.monaco-editor')` to detect when the editor is ready.

- [x] Task 6: Verify build and tests pass
  - [x] 6.1 Run `pnpm lint` — 0 errors (6 pre-existing warnings)
  - [x] 6.2 Run `pnpm format` — compliant
  - [x] 6.3 Run `pnpm test` — all 1199 tests pass (0 regressions)
  - [x] 6.4 Run `pnpm build` — clean build, 59 static HTML files generated
  - [x] 6.5 Run E2E tests — all 8 TypeScript Playground tests pass, 181/186 total (5 pre-existing failures in unrelated tools)
  - [x] 6.6 Verify Monaco Editor loads correctly in production build (`pnpm preview`)

## Dev Notes

### Architecture Compliance

- **Technical Stack**: React 19.2.4, TypeScript 5.9.3 (strict), Vite 7.3.1, Tailwind CSS 4.1.18, Motion 12.34.0
- **Component Pattern**: Named export `export const TypescriptPlayground`, no default export
- **State**: `useState` for local UI state (transpiled JS output, error markers, loading state)
- **Error Handling**: Error diagnostics displayed in a list below editors (AC #4), `useToast` with `type: 'error'` for unexpected failures only
- **Styling**: Tailwind CSS v4 classes, `tv()` from `@/utils` for component variants if needed, OKLCH color space
- **Animations**: Import from `motion/react` (NOT `framer-motion`) — minimal animation needed (editors have their own animations)
- **Code Quality**: oxlint + oxfmt — no semicolons, single quotes, trailing commas, 120 char width

### @monaco-editor/react Package

**This tool requires the `@monaco-editor/react` npm package.** Key characteristics:

- **Latest version**: 4.7.0 (published Feb 2025, adds React 19 support)
- **CDN-loaded dependency**: Loads `monaco-editor` **v0.52.2** from jsdelivr CDN by default (NOT bundled locally). No separate `monaco-editor` install needed.
- **Bundle impact**: ZERO — Monaco loads from CDN asynchronously, NOT included in the Vite bundle. Ideal for NFR8 (no initial bundle increase).
- **Built-in TypeScript**: Monaco ships with a vendored TypeScript language service (~TS 5.4.5) running in a Web Worker. No separate `typescript` package needed.
- **ESM support**: Both `@monaco-editor/react` and `monaco-editor` support ESM
- **Browser-native**: No Node.js polyfills required
- **Built-in lazy loading**: The `@monaco-editor/loader` package handles async loading of monaco-editor from CDN. The `loading` prop shows content while this happens.
- **Worker management**: Monaco manages its own Web Workers for TypeScript, editor, etc.
- **NAMESPACE WARNING**: Default CDN loads v0.52.2 — use `monaco.languages.typescript` namespace (NOT `monaco.typescript` which is v0.55+ only)

**No utility file needed** — unlike other tools (graphql-schema-viewer, protobuf-to-json), this tool doesn't need a utility file in `src/utils/`. Monaco Editor handles all TypeScript operations internally via its worker-based language service.

### Core API Patterns

**Editor Component:**

```typescript
import Editor from '@monaco-editor/react'

<Editor
  defaultLanguage="typescript"
  defaultValue={SAMPLE_CODE}
  height="400px"
  loading={<EditorSkeleton />}
  onChange={handleEditorChange}
  onMount={handleEditorMount}
  onValidate={handleValidation}
  options={{
    automaticLayout: true,
    fontSize: 14,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    tabSize: 2,
  }}
  theme="vs-dark"
/>
```

**beforeMount — Configure TypeScript Compiler:**

```typescript
const handleBeforeMount = (monaco: Monaco) => {
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    allowNonTsExtensions: true,
    esModuleInterop: true,
    forceConsistentCasingInFileNames: true,
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    noEmit: false,
    skipLibCheck: true,
    strict: true,
    target: monaco.languages.typescript.ScriptTarget.ES2022,
  })
}
```

**onMount — Store References for Transpilation:**

```typescript
const handleEditorMount = (
  editor: editor.IStandaloneCodeEditor,
  monaco: Monaco,
) => {
  editorRef.current = editor
  monacoRef.current = monaco
  // Trigger initial transpilation
  transpileCode(editor, monaco)
}
```

**Transpilation via TypeScript Worker:**

```typescript
const transpileCode = async (
  editor: editor.IStandaloneCodeEditor,
  monaco: Monaco,
) => {
  const model = editor.getModel()
  if (!model) return
  const worker = await monaco.languages.typescript.getTypeScriptWorker()
  const client = await worker(model.uri)
  const result = await client.getEmitOutput(model.uri.toString())
  const jsOutput = result.outputFiles[0]?.text ?? ''
  setTranspiledJs(jsOutput)
}
```

**onValidate — Error Diagnostics:**

```typescript
const handleValidation = (markers: editor.IMarkerData[]) => {
  setErrors(
    markers
      .filter(
        (m) =>
          m.severity === MarkerSeverity.Error ||
          m.severity === MarkerSeverity.Warning,
      )
      .map((m) => ({
        column: m.startColumn,
        line: m.startLineNumber,
        message: m.message,
        severity: m.severity === MarkerSeverity.Error ? 'error' : 'warning',
      })),
  )
}
```

### Tool Type: Live Editor (Special Pattern)

This tool does NOT follow the standard "text conversion" pattern used by most tools. It uses Monaco Editor's own lifecycle:

- **Processing trigger**: Monaco handles type checking internally via Web Workers
- **Transpilation trigger**: On content change (debounced ~500ms via `useDebounceCallback`)
- **No TextAreaInput**: Uses Monaco `<Editor>` component instead
- **No utility file**: Monaco's TypeScript worker handles everything
- **No dynamic import of utils**: The component's lazy-load in the registry is sufficient. Monaco handles its own async loading.

### Category and Domain Placement

**Category**: `'Code'` (already exists — used by HtmlFormatter, SqlFormatter, GraphqlSchemaViewer, ProtobufToJson, etc.)
**Component Directory**: `src/components/feature/code/TypescriptPlayground.tsx`
**Emoji**: 🏗️
**Key**: `typescript-playground`
**Route**: `/tools/typescript-playground`

### Component Implementation Pattern

```
src/components/feature/code/TypescriptPlayground.tsx
├── Tool description from TOOL_REGISTRY_MAP['typescript-playground']
│
├── Editor Section (flex row on desktop, flex col on mobile)
│   ├── TypeScript Editor Panel
│   │   ├── Header: "TypeScript" label
│   │   ├── Loading skeleton (shown until Monaco ready)
│   │   └── <Editor> component (editable, typescript language)
│   │
│   └── JavaScript Output Panel
│       ├── Header: "JavaScript" label + CopyButton
│       ├── Loading skeleton (shown until Monaco ready)
│       └── <Editor> component (read-only, javascript language)
│
└── Error List Panel (full width below editors)
    ├── Error count header (e.g., "2 errors, 1 warning")
    ├── Scrollable error list
    │   └── For each error:
    │       ├── Severity icon (error=red, warning=yellow)
    │       ├── Line:Column number
    │       └── Error message
    └── Empty state: "No errors" (green indicator)
```

### Monaco Editor Dark Theme

Monaco's built-in `"vs-dark"` theme provides a dark editor that aligns well with the project's dark-only OKLCH theme. The surrounding UI uses Tailwind classes matching the project's dark palette (`bg-gray-900`, `border-gray-800`, `text-gray-300`, etc.).

### Existing Utilities to REUSE

**Hooks to Use:**
- `useDebounceCallback` from `@/hooks` — debounce transpilation on content change (~500ms for this tool since Monaco already debounces type checking)
- `useToast` from `@/hooks` — for unexpected error handling only
- Do NOT use `useCopyToClipboard` directly — use CopyButton component

**Components to Use:**
- `CopyButton` from `@/components/common` — for copying transpiled JS output
- Do NOT use `TextAreaInput` — Monaco Editor replaces it
- Do NOT use `Tabs` — side-by-side layout, no tabs needed

### Monaco Type Imports

```typescript
import type { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

// MarkerSeverity can be accessed via the monaco instance:
// monaco.MarkerSeverity.Error, monaco.MarkerSeverity.Warning
// OR imported from monaco-editor if needed for type annotations
```

### Previous Story Intelligence (25.2 Protobuf to JSON)

Key learnings from Story 25.2 to apply here:

1. **Dynamic import only for heavy libraries**: Story 25.2 lazy-loaded protobufjs via dynamic import. For this story, Monaco's own `@monaco-editor/loader` handles lazy loading — no additional dynamic import needed.
2. **Barrel export ordering**: Maintain alphabetical order in `src/components/feature/code/index.ts`
3. **E2E test selectors**: Use generous timeouts for heavy components. Monaco needs more time than simple text tools.
4. **Registration checklist**: types union -> registry entry -> vite prerender -> barrel exports
5. **Code category already exists**: `'Code'` is in ToolCategory and CATEGORY_ORDER — no changes needed
6. **Tool description display**: Read from `TOOL_REGISTRY_MAP[key]?.description` and render as `<p>` tag
7. **Build warnings**: Ensure no mixed static/dynamic imports
8. **TextInput props**: Do NOT pass `id` or `maxLength` directly — these aren't in `TextInputProps`. (Not relevant here since we use Monaco, not TextInput)
9. **Code domain barrel**: Uses `export { Name } from './Name'` format (not `export * from`)

### Git Intelligence

Recent commit patterns from Epic 25:
- `7c3bf48` — `📦 Protobuf to JSON + 🔍 code review fixes (Story 25.2)`
- `3588560` — `📊 GraphQL Schema Viewer + 🔍 code review fixes (Story 25.1)`

**Commit message pattern**: `{emoji} {Tool Name} + 🔍 code review fixes (Story {epic}.{story})`
Suggested for this story: `🏗️ TypeScript Playground + 🔍 code review fixes (Story 25.3)`

**Files pattern (with new dependency):**
- `package.json` + `pnpm-lock.yaml` — add @monaco-editor/react (monaco-editor loads from CDN, not installed locally)
- `src/components/feature/code/TypescriptPlayground.tsx` — new component
- `src/components/feature/code/index.ts` — barrel export update
- `src/types/constants/tool-registry.ts` — ToolRegistryKey union
- `src/constants/tool-registry.ts` — registry entry
- `vite.config.ts` — prerender route
- `e2e/typescript-playground.spec.ts` — E2E tests

### Project Structure Notes

- **Existing directory**: `src/components/feature/code/` — already exists with 10 tools (CssFormatter, GraphqlSchemaViewer, HtmlFormatter, JavaScriptMinifier, JsonSchemaValidator, JsonToTypeScript, MarkdownPreview, MarkdownTableGenerator, ProtobufToJson, SqlFormatter)
- **Code category already exists**: `'Code'` in ToolCategory and CATEGORY_ORDER — no changes needed
- **Code barrel already exists**: `src/components/feature/code/index.ts` — add new export in alphabetical order (after `SqlFormatter`)
- **New dependency**: `@monaco-editor/react` — Monaco loads from CDN (no local `monaco-editor` install needed)
- **No utility file**: Unlike other code tools, no `src/utils/typescript-playground.ts` is needed
- **No unit tests for utilities**: Since there's no utility file, no `src/utils/typescript-playground.spec.ts` is needed. All logic is handled by Monaco Editor. Unit tests are not applicable for this tool — E2E tests cover all acceptance criteria.

### File Locations & Naming

| File | Path |
|---|---|
| Component | `src/components/feature/code/TypescriptPlayground.tsx` |
| Code barrel update | `src/components/feature/code/index.ts` |
| E2E test | `e2e/typescript-playground.spec.ts` |
| Registry key type | `src/types/constants/tool-registry.ts` |
| Registry entry | `src/constants/tool-registry.ts` |
| Prerender route | `vite.config.ts` -> `toolRoutes` array |
| Package dependency | `package.json` + `pnpm-lock.yaml` |

### Code Conventions (Enforced)

- `type` over `interface`
- `Array<T>` over `T[]`
- `import type` for type-only imports
- Named exports only (no default export for components)
- `@/` path alias for all imports
- Let TypeScript infer where possible
- No `console.log` statements
- Alphabetical ordering in object keys, barrel exports, union types

### E2E Testing Notes

**Monaco Editor in Playwright:**
- Monaco Editor loads asynchronously — wait for `.monaco-editor` selector before interacting
- Use generous timeouts: `{ timeout: 15000 }` for editor initialization
- To type into Monaco: `page.locator('.monaco-editor textarea').fill(code)` or use Monaco's API via `page.evaluate`
- To read Monaco content: Use `page.evaluate` to call `editor.getValue()` or read from the output editor
- The `onValidate` callback fires asynchronously — wait for error list to appear/update
- Monaco may take 2-5 seconds to initialize in CI environments — plan E2E accordingly

**Testing Transpilation Output:**
- After typing TypeScript, wait for the JS output editor to update (debounced ~500ms + transpilation time)
- Verify JS output contains expected transpiled code (e.g., type annotations removed, arrow functions preserved for ES2022 target)
- For simple code like `const x: number = 42`, expected JS output is `const x = 42;\n` (type annotation stripped)

### Vite Configuration Note

Monaco Editor requires Web Workers. `@monaco-editor/react` handles this automatically:
- By default, `@monaco-editor/loader` loads monaco-editor v0.52.2 and its workers from jsdelivr CDN
- This means **zero Vite configuration** is needed for workers — no `vite-plugin-monaco-editor` or worker config required
- Monaco's assets are NOT part of the Vite build output — they're fetched at runtime from CDN
- This is the best approach for this project: zero bundle impact, no worker bundling complexity
- If offline support is needed in the future, `monaco-editor` can be installed locally and the loader configured to use local paths

### UX / Interaction Requirements

- **TypeScript Editor**: Full Monaco Editor with TypeScript IntelliSense, auto-complete, error squiggles, hover type info. Dark theme (`vs-dark`).
- **JavaScript Output**: Read-only Monaco Editor showing transpiled JS. Dark theme.
- **Error List**: Below both editors. Shows error/warning count, then scrollable list of diagnostics with line:column and message.
- **Responsive**: Desktop: side-by-side editors. Mobile (< 768px): stacked vertically.
- **Initial state**: Pre-populated with sample TypeScript code. JS output generated immediately.
- **Mobile**: Full-width, 375px min viewport. Editors stack vertically with reduced height (300px).
- **Loading**: Skeleton placeholder matching editor dimensions while Monaco initializes.

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion-3.md#Epic 25 Story 25.3]
- [Source: _bmad-output/project-context.md#Implementation Rules, Adding a New Tool]
- [Source: _bmad-output/implementation-artifacts/25-2-protobuf-to-json.md — previous story patterns and learnings]
- [Source: _bmad-output/planning-artifacts/architecture.md — Tool Processing, Error Handling, Code Splitting]
- [Source: src/constants/tool-registry.ts — registry entry pattern and CATEGORY_ORDER]
- [Source: src/types/constants/tool-registry.ts — ToolRegistryKey and ToolCategory types]
- [Source: src/components/feature/code/index.ts — code domain barrel exports pattern]
- [Source: vite.config.ts — prerender route registration]
- [Source: npm @monaco-editor/react 4.7.0 — React wrapper for Monaco Editor]
- [Source: npm monaco-editor 0.52.2 — VS Code editor for the browser (CDN-loaded default)]
- [Source: github.com/suren-atoyan/monaco-react — Monaco React wrapper documentation]
- [Source: github.com/microsoft/monaco-editor/issues/289 — getTypeScriptWorker/getEmitOutput API]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Build failed initially due to `import type { editor } from 'monaco-editor'` — `monaco-editor` is CDN-loaded and not installed locally. Fixed by deriving types from `@monaco-editor/react` exports: `EditorInstance = Parameters<OnMount>[0]`, `MarkerData = Parameters<OnValidate>[0][0]`, `EditorProps['options']`.
- E2E tests: Monaco keyboard input via Playwright is unreliable. Fixed by using `page.evaluate` with `window.monaco.editor.getModels()[0].setValue()` to set editor content directly through Monaco's API.
- E2E tests: Monaco Editor adds its own `role="alert"` elements, causing strict mode violations with our error list selector. Fixed by using `[aria-live="polite"].flex.flex-col` selector to target our custom error list only.
- Import ordering: `import/first` lint rule requires all imports before type aliases. Moved derived type aliases after all import statements.

### Completion Notes List

- Implemented TypeScript Playground tool with Monaco Editor (loaded from CDN, zero bundle impact)
- Two side-by-side Monaco editors: editable TypeScript (left) and read-only JavaScript output (right)
- Real-time TypeScript type checking with error squiggles and hover type info
- Transpilation via Monaco's built-in TypeScript worker (debounced 500ms)
- Error diagnostics panel showing error/warning count with line:column and messages
- Loading skeleton animation while Monaco initializes
- CopyButton for transpiled JS output
- Responsive layout: side-by-side on desktop, stacked on mobile
- Full accessibility: aria-live, aria-label, role="status", h3 section headers
- 8 E2E tests covering all 5 acceptance criteria + mobile responsiveness
- TypescriptPlayground chunk: 18.73 kB (6.64 kB gzip) — Monaco loads from CDN at runtime

### File List

- `package.json` — added `@monaco-editor/react` 4.7.0 dependency
- `pnpm-lock.yaml` — lockfile updated
- `src/components/feature/code/TypescriptPlayground.tsx` — new component (main implementation)
- `src/components/feature/code/index.ts` — added barrel export for TypescriptPlayground
- `src/types/constants/tool-registry.ts` — added `'typescript-playground'` to ToolRegistryKey union
- `src/constants/tool-registry.ts` — added registry entry with lazy-loaded component
- `vite.config.ts` — added prerender route `/tools/typescript-playground`
- `e2e/typescript-playground.spec.ts` — new E2E test file (8 tests)

### Change Log

- 2026-02-25: Implemented Story 25.3 TypeScript Playground — Monaco Editor-powered TypeScript editor with real-time type checking and JS transpilation output
- 2026-02-25: Code review fixes — (1) Fixed ARIA semantic conflict: changed `role="alert"` to `role="status"` to align with `aria-live="polite"` and project pattern; (2) Removed dead eslint disable comment in E2E test (project uses oxlint); (3) Replaced inline `import('@playwright/test').Page` type with proper `import type { Page }` and added type-safe window.monaco cast
