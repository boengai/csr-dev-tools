# Story 25.4: JSONPath Evaluator

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **to paste JSON and evaluate JSONPath expressions against it with real-time results showing matched paths and values**,
so that **I can test and debug JSONPath queries for API data extraction without running code or installing tools**.

## Acceptance Criteria

1. **Given** the user pastes valid JSON in the input area
   **When** JSON is entered
   **Then** it's parsed and formatted with syntax validation feedback

2. **Given** the user enters a JSONPath expression (e.g., `$.store.book[*].author`)
   **When** the expression is entered
   **Then** matching results are displayed in real-time (debounced 300ms)

3. **Given** the JSONPath expression matches multiple values
   **When** results are shown
   **Then** each result shows its JSONPath path and its value (formatted)

4. **Given** an invalid JSONPath expression
   **When** entered
   **Then** a clear error message is shown (e.g., "Invalid JSONPath expression")

5. **Given** no matches found
   **When** evaluated
   **Then** "No matches" is displayed

6. **Given** common JSONPath examples
   **When** the user clicks a cheatsheet toggle
   **Then** common patterns are shown (`$.*`, `$..name`, `$[0]`, `$[?(@.price<10)]`)

## Tasks / Subtasks

- [x] Task 1: Install jsonpath-plus package (AC: all)
  - [x] 1.1 Run `pnpm add jsonpath-plus` — the JSONPath evaluation library. `.npmrc` enforces `save-exact=true` automatically.
  - [x] 1.2 Verify `package.json` has the exact version pinned (no `^` or `~`). Expected: `jsonpath-plus` 10.4.0 (latest stable).
  - [x] 1.3 Verify jsonpath-plus supports ESM (it does — v10.x uses ESM exports). The project requires ESM only (`"type": "module"`).
  - [x] 1.4 Verify jsonpath-plus includes TypeScript types built-in (it does — `@types/jsonpath-plus` is NOT needed).
  - [x] 1.5 **SECURITY NOTE**: jsonpath-plus v10.4.0 defaults to `eval: 'safe'` for filter expressions. Do NOT change this to `'native'` — safe eval prevents code injection in user-provided JSONPath expressions. This is critical for a client-side tool where users paste arbitrary JSONPath.

- [x] Task 2: Create jsonpath-evaluator utility (AC: #1, #2, #3, #4, #5)
  - [x] 2.1 Create `src/utils/jsonpath-evaluator.ts`
  - [x] 2.2 Define types:
    ```typescript
    export type JsonPathResult = {
      path: string
      value: unknown
    }

    export type JsonPathEvaluation =
      | { error: string; success: false }
      | { results: Array<JsonPathResult>; success: true }

    export type JsonParseResult =
      | { error: string; success: false }
      | { data: unknown; formatted: string; success: true }
    ```
  - [x] 2.3 Implement `parseJsonInput(input: string): JsonParseResult`:
    - Trim input, return error if empty
    - `JSON.parse()` the input
    - Return `{ success: true, data: parsed, formatted: JSON.stringify(parsed, null, 2) }`
    - On catch, extract meaningful error message with position info
  - [x] 2.4 Implement `evaluateJsonPath(data: unknown, expression: string): JsonPathEvaluation`:
    - Trim expression, return error if empty
    - Use `JSONPath` from `jsonpath-plus` with `{ path: expression, json: data, resultType: 'all' }`
    - `resultType: 'all'` returns objects with `{ path, value, pointer, parent, parentProperty }` — extract `path` and `value`
    - Map results to `Array<JsonPathResult>` where `path` is the JSONPath string and `value` is the matched value
    - If results array is empty, return `{ success: true, results: [] }` (component shows "No matches")
    - On catch, return `{ success: false, error: message }`
  - [x] 2.5 Implement `formatResultValue(value: unknown): string`:
    - If value is object/array: `JSON.stringify(value, null, 2)`
    - If value is string: wrap in quotes
    - If value is number/boolean/null: `String(value)`
  - [x] 2.6 **CRITICAL**: Import `JSONPath` as: `import { JSONPath } from 'jsonpath-plus'` — this is the ESM named export.
  - [x] 2.7 **CRITICAL**: Always use `eval: 'safe'` option (the default) to prevent script injection in filter expressions.

- [x] Task 3: Create jsonpath-evaluator unit tests (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Create `src/utils/jsonpath-evaluator.spec.ts`
  - [x] 3.2 Test `parseJsonInput`:
    - Valid JSON object → success with parsed data and formatted string
    - Valid JSON array → success
    - Empty string → error
    - Invalid JSON (missing quotes, trailing comma) → error with descriptive message
    - Deeply nested JSON → success
  - [x] 3.3 Test `evaluateJsonPath`:
    - Simple path `$.name` → single result with path and value
    - Wildcard `$.store.book[*].author` → multiple results with correct paths
    - Recursive descent `$..name` → all nested name values
    - Array index `$[0]` → single result
    - Filter expression `$..book[?(@.price<10)]` → filtered results
    - Root `$` → single result (entire document)
    - No matches (`$.nonExistent`) → empty results array
    - Invalid expression (e.g., `$[[[`) → error
    - Empty expression → error
  - [x] 3.4 Test `formatResultValue`:
    - Object → JSON formatted string
    - Array → JSON formatted string
    - String → quoted string
    - Number → number string
    - Boolean → "true"/"false"
    - Null → "null"

- [x] Task 4: Create JsonpathEvaluator component (AC: all)
  - [x] 4.1 Create `src/components/feature/code/JsonpathEvaluator.tsx`
  - [x] 4.2 Update `src/components/feature/code/index.ts` — add barrel export `export { JsonpathEvaluator } from './JsonpathEvaluator'` (alphabetical — between `JavaScriptMinifier` and `JsonSchemaValidator`)
  - [x] 4.3 Implement main layout: tool description from `TOOL_REGISTRY_MAP['jsonpath-evaluator']`, JSON input area, JSONPath expression input, results panel, cheatsheet toggle
  - [x] 4.4 **JSON Input (AC #1)**: Use `TextAreaInput` from `@/components/common` with:
    - `placeholder="Paste JSON here..."`
    - Monospace font via `font-mono` class on the textarea wrapper
    - Parse JSON on change (debounced 300ms via `useDebounceCallback`)
    - Show parse error below input if JSON is invalid
  - [x] 4.5 **JSONPath Expression Input (AC #2, #4)**: Use `TextInput` from `@/components/common` with:
    - `placeholder="Enter JSONPath expression (e.g., $.store.book[*].author)"`
    - Evaluate on change (debounced 300ms via `useDebounceCallback`)
    - Show expression error below input if invalid
  - [x] 4.6 **Results Panel (AC #2, #3, #5)**: Display evaluation results:
    - Show match count header (e.g., "3 matches found" or "No matches")
    - For each result, display:
      - **Path**: The JSONPath string to the matched value (e.g., `$.store.book[0].author`) in a monospace span
      - **Value**: Formatted value using `formatResultValue()` in a preformatted block
    - Use `CopyButton` next to each result value for individual copying
    - Use a master `CopyButton` to copy all results as JSON array
    - Results panel should be scrollable with `max-h-96 overflow-y-auto`
  - [x] 4.7 **Cheatsheet Toggle (AC #6)**: Implement a collapsible section:
    - Toggle button: "JSONPath Cheatsheet" with expand/collapse indicator
    - Content when expanded — table of common patterns:
      | Expression | Description |
      |---|---|
      | `$` | Root object |
      | `$.property` | Direct child property |
      | `$.*` | All direct children |
      | `$..property` | Recursive descent (all nested) |
      | `$[0]` | Array element by index |
      | `$[0,1]` | Multiple array elements |
      | `$[0:3]` | Array slice (elements 0-2) |
      | `$[?(@.price<10)]` | Filter expression |
      | `$[?(@.name)]` | Existence check |
      | `$.store.book[*].author` | All authors in store |
    - Clicking an example should populate the JSONPath expression input
  - [x] 4.8 **Default Sample JSON**: Pre-populate with a sample that showcases JSONPath features:
    ```json
    {
      "store": {
        "book": [
          {
            "category": "reference",
            "author": "Nigel Rees",
            "title": "Sayings of the Century",
            "price": 8.95
          },
          {
            "category": "fiction",
            "author": "Evelyn Waugh",
            "title": "Sword of Honour",
            "price": 12.99
          },
          {
            "category": "fiction",
            "author": "Herman Melville",
            "title": "Moby Dick",
            "isbn": "0-553-21311-3",
            "price": 8.99
          },
          {
            "category": "fiction",
            "author": "J. R. R. Tolkien",
            "title": "The Lord of the Rings",
            "isbn": "0-395-19395-8",
            "price": 22.99
          }
        ],
        "bicycle": {
          "color": "red",
          "price": 19.95
        }
      }
    }
    ```
  - [x] 4.9 **Default JSONPath Expression**: Pre-populate with `$.store.book[*].author` — demonstrates array wildcard extraction
  - [x] 4.10 Implement error handling: use `useToast` with `type: 'error'` for unexpected failures only. JSON parse errors and JSONPath evaluation errors are shown inline below their respective inputs, NOT as toasts.
  - [x] 4.11 **Layout**: Desktop (md+): JSON input on the left (~50%), JSONPath expression + results on the right (~50%) using `flex flex-col md:flex-row`. Cheatsheet below the expression input. Mobile (< 768px): stack vertically — JSON input, expression input, results, cheatsheet.
  - [x] 4.12 **Dynamic import**: The `jsonpath-plus` library should be dynamically imported inside the utility functions to enable code splitting. Since jsonpath-plus is ~50KB, lazy loading prevents bundle bloat:
    ```typescript
    // In src/utils/jsonpath-evaluator.ts
    export async function evaluateJsonPath(data: unknown, expression: string): Promise<JsonPathEvaluation> {
      const { JSONPath } = await import('jsonpath-plus')
      // ... evaluation logic
    }
    ```
    This matches the project pattern used by protobufjs in `protobuf-to-json.ts`. NOTE: Check if jsonpath-plus is small enough to import statically — if under ~15KB gzipped, static import is acceptable. The protobufjs dynamic import pattern was used because protobufjs is ~200KB. If jsonpath-plus is small enough, prefer static import for simpler code.
  - [x] 4.13 Add `aria-live="polite"` on the results panel for screen reader announcements when results change
  - [x] 4.14 Add `role="status"` on the match count header
  - [x] 4.15 Section headers: "JSON Input", "JSONPath Expression", "Results" labels above each section

- [x] Task 5: Register tool and configure routing (AC: all)
  - [x] 5.1 Add `'jsonpath-evaluator'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetical — between `'json-to-yaml-converter'` and `'jwt-decoder'`)
  - [x] 5.2 Add registry entry in `src/constants/tool-registry.ts` (alphabetical within array):
    ```typescript
    {
      category: 'Code',
      component: lazy(() =>
        import('@/components/feature/code/JsonpathEvaluator').then(
          ({ JsonpathEvaluator }: { JsonpathEvaluator: ComponentType }) => ({
            default: JsonpathEvaluator,
          }),
        ),
      ),
      description:
        'Evaluate JSONPath expressions against JSON data. See matched paths and values in real-time with a cheatsheet of common patterns.',
      emoji: '🎯',
      key: 'jsonpath-evaluator',
      name: 'JSONPath Evaluator',
      routePath: '/tools/jsonpath-evaluator',
      seo: {
        description:
          'Evaluate JSONPath expressions against JSON data online. Test queries like $.store.book[*].author with real-time results showing matched paths and values. 100% client-side JSONPath tester.',
        title: 'JSONPath Evaluator - CSR Dev Tools',
      },
    }
    ```
  - [x] 5.3 Add prerender route `/tools/jsonpath-evaluator` in `vite.config.ts` `toolRoutes` array (alphabetical — between `json-to-yaml-converter` and `jwt-decoder`):
    ```typescript
    {
      description:
        'Evaluate JSONPath expressions against JSON data online. Test queries like $.store.book[*].author with real-time results showing matched paths and values. 100% client-side JSONPath tester.',
      path: '/tools/jsonpath-evaluator',
      title: 'JSONPath Evaluator - CSR Dev Tools',
      url: '/tools/jsonpath-evaluator',
    },
    ```

- [x] Task 6: Implement accessibility (AC: all)
  - [x] 6.1 Add `aria-live="polite"` on the results container (updates when evaluation results change)
  - [x] 6.2 Add `aria-label="JSON input"` on the JSON textarea wrapper
  - [x] 6.3 Add `aria-label="JSONPath expression"` on the expression input wrapper
  - [x] 6.4 Add `role="status"` on the match count header (e.g., "3 matches found")
  - [x] 6.5 Add `role="alert"` on JSON parse error and JSONPath expression error messages
  - [x] 6.6 Ensure the cheatsheet toggle is keyboard accessible with `aria-expanded` attribute
  - [x] 6.7 Ensure CopyButton components are keyboard accessible (they already are — built-in focus styles)
  - [x] 6.8 Cheatsheet example buttons should be `<button>` elements with `aria-label` (e.g., "Use expression: $.store.book[*].author")

- [x] Task 7: Create E2E tests (AC: all)
  - [x] 7.1 Create `e2e/jsonpath-evaluator.spec.ts`
  - [x] 7.2 Test: navigate to tool page, verify title and description are rendered
  - [x] 7.3 Test: default sample JSON is present on load, default JSONPath expression is populated, results are shown (AC #1, #2, #3)
  - [x] 7.4 Test: type valid JSON + valid JSONPath → results display with paths and values (AC #2, #3)
  - [x] 7.5 Test: type JSONPath that matches multiple values → all results shown with individual paths (AC #3)
  - [x] 7.6 Test: type invalid JSONPath expression (e.g., `$[[[`) → error message shown (AC #4)
  - [x] 7.7 Test: type JSONPath that matches nothing (e.g., `$.nonExistent`) → "No matches" displayed (AC #5)
  - [x] 7.8 Test: toggle cheatsheet → common patterns are shown; click an example → expression input is populated and results update (AC #6)
  - [x] 7.9 Test: type invalid JSON → parse error shown; results panel cleared or shows error state (AC #1)
  - [x] 7.10 Test: click CopyButton on a result → value copied to clipboard (AC #3)
  - [x] 7.11 Test: mobile viewport (375px) responsiveness — inputs and results stack vertically
  - [x] 7.12 Test: filter expression `$..book[?(@.price<10)]` → returns filtered books (validates safe eval works)

- [x] Task 8: Verify build and tests pass
  - [x] 8.1 Run `pnpm lint` — 0 errors
  - [x] 8.2 Run `pnpm format` — compliant
  - [x] 8.3 Run `pnpm test` — all tests pass (0 regressions)
  - [x] 8.4 Run `pnpm build` — clean build, static HTML files generated (new count = previous + 1)
  - [x] 8.5 Run E2E tests — all JSONPath Evaluator tests pass
  - [x] 8.6 Verify tool works in production build (`pnpm preview`)

## Dev Notes

### Architecture Compliance

- **Technical Stack**: React 19.2.4, TypeScript 5.9.3 (strict), Vite 7.3.1, Tailwind CSS 4.1.18, Motion 12.34.0
- **Component Pattern**: Named export `export const JsonpathEvaluator`, no default export
- **State**: `useState` for local UI state (parsed JSON data, JSONPath expression, results, errors, cheatsheet toggle)
- **Error Handling**: JSON parse errors and JSONPath evaluation errors displayed inline below inputs; `useToast` with `type: 'error'` for unexpected failures only
- **Styling**: Tailwind CSS v4 classes, `tv()` from `@/utils` for component variants if needed, OKLCH color space
- **Animations**: Import from `motion/react` (NOT `framer-motion`) — minimal animation for cheatsheet toggle expand/collapse
- **Code Quality**: oxlint + oxfmt — no semicolons, single quotes, trailing commas, 120 char width

### jsonpath-plus Package

**This tool requires the `jsonpath-plus` npm package.** Key characteristics:

- **Latest version**: 10.4.0 (latest stable, actively maintained)
- **ESM support**: Yes — uses ESM exports, compatible with project's ESM-only config
- **TypeScript types**: Built-in — `@types/jsonpath-plus` is NOT needed
- **Bundle size**: ~50KB unminified, ~15KB gzipped — reasonably lightweight for static import. Dynamic import is acceptable but not strictly necessary (unlike protobufjs at ~200KB).
- **Browser-native**: No Node.js polyfills required
- **Security**: Defaults to `eval: 'safe'` for filter expressions — NEVER change to `'native'` eval
- **Key API**: `JSONPath({ path, json, resultType })` — returns matched values or detailed result objects
- **`resultType: 'all'`**: Returns objects with `{ path, value, pointer, parent, parentProperty }` — use this to get both paths and values for AC #3

### Core API Pattern

```typescript
import { JSONPath } from 'jsonpath-plus'

// Basic evaluation
const results = JSONPath({
  path: '$.store.book[*].author',
  json: data,
  resultType: 'all',  // Returns full result objects with path + value
})

// Results shape when resultType: 'all':
// Array<{
//   path: string,        // JSONPath string like "$['store']['book'][0]['author']"
//   value: unknown,      // The matched value
//   pointer: string,     // JSON pointer like "/store/book/0/author"
//   parent: unknown,     // Parent object
//   parentProperty: string // Property name in parent
// }>
```

### Tool Type: Text Conversion (Standard Pattern)

This tool follows the standard "text conversion" pattern:

- **Processing trigger**: On input change (both JSON input and JSONPath expression)
- **Debounce**: 300ms via `useDebounceCallback` from `@/hooks`
- **Input**: `TextAreaInput` for JSON, `TextInput` for JSONPath expression
- **Output**: Results panel with matched paths and values
- **Utility file**: `src/utils/jsonpath-evaluator.ts` with pure functions

### Category and Domain Placement

**Category**: `'Code'` (already exists — used by GraphqlSchemaViewer, ProtobufToJson, TypescriptPlayground, etc.)
**Component Directory**: `src/components/feature/code/JsonpathEvaluator.tsx`
**Emoji**: 🎯
**Key**: `jsonpath-evaluator`
**Route**: `/tools/jsonpath-evaluator`

### Component Implementation Pattern

```
src/components/feature/code/JsonpathEvaluator.tsx
├── Tool description from TOOL_REGISTRY_MAP['jsonpath-evaluator']
│
├── Main Layout (flex row on desktop, flex col on mobile)
│   ├── Left Panel: JSON Input
│   │   ├── Header: "JSON Input" label
│   │   ├── TextAreaInput (monospace, placeholder, tall ~400px)
│   │   └── Parse error (inline, role="alert")
│   │
│   └── Right Panel: Expression + Results
│       ├── Header: "JSONPath Expression" label
│       ├── TextInput (placeholder with example)
│       ├── Expression error (inline, role="alert")
│       │
│       ├── Results Panel (aria-live="polite")
│       │   ├── Match count header (role="status") + master CopyButton
│       │   ├── Scrollable result list (max-h-96)
│       │   │   └── For each result:
│       │   │       ├── Path (monospace, muted color)
│       │   │       ├── Value (preformatted, monospace)
│       │   │       └── CopyButton (individual)
│       │   └── Empty state: "No matches" (when results.length === 0)
│       │
│       └── Cheatsheet Section (collapsible)
│           ├── Toggle button: "JSONPath Cheatsheet" + expand/collapse
│           └── Table of common patterns (clickable to populate input)
```

### Existing Utilities to REUSE

**Hooks to Use:**
- `useDebounceCallback` from `@/hooks` — debounce JSON parsing and JSONPath evaluation (300ms)
- `useToast` from `@/hooks` — for unexpected error handling only
- Do NOT use `useCopyToClipboard` directly — use CopyButton component

**Components to Use:**
- `CopyButton` from `@/components/common` — for copying individual results and all results
- `TextAreaInput` from `@/components/common` — for JSON input
- `TextInput` from `@/components/common` — for JSONPath expression input
- Do NOT use `Tabs` — single view layout, no tabs needed

### Previous Story Intelligence (25.3 TypeScript Playground)

Key learnings from Story 25.3 to apply here:

1. **Barrel export ordering**: Maintain alphabetical order in `src/components/feature/code/index.ts` — new entry goes between `JavaScriptMinifier` and `JsonSchemaValidator`
2. **Registration checklist**: types union -> registry entry -> vite prerender -> barrel exports
3. **Code category already exists**: `'Code'` is in ToolCategory and CATEGORY_ORDER — no changes needed
4. **Tool description display**: Read from `TOOL_REGISTRY_MAP[key]?.description` and render as `<p>` tag
5. **Build warnings**: Ensure no mixed static/dynamic imports
6. **Code domain barrel**: Uses `export { Name } from './Name'` format (not `export * from`)
7. **E2E test selectors**: Use data-testid or specific selectors to avoid conflicts with library-generated elements
8. **Monaco Editor was story 25.3 specific**: This story uses standard TextAreaInput/TextInput — much simpler pattern

### Git Intelligence

Recent commit patterns from Epic 25:
- `0120eb8` — `🏗️ TypeScript Playground + 🔍 code review fixes (Story 25.3)`
- `7c3bf48` — `📦 Protobuf to JSON + 🔍 code review fixes (Story 25.2)`
- `3588560` — `📊 GraphQL Schema Viewer + 🔍 code review fixes (Story 25.1)`

**Commit message pattern**: `{emoji} {Tool Name} + 🔍 code review fixes (Story {epic}.{story})`
Suggested for this story: `🎯 JSONPath Evaluator + 🔍 code review fixes (Story 25.4)`

**Files pattern (with new dependency):**
- `package.json` + `pnpm-lock.yaml` — add jsonpath-plus
- `src/utils/jsonpath-evaluator.ts` — new utility
- `src/utils/jsonpath-evaluator.spec.ts` — new unit tests
- `src/components/feature/code/JsonpathEvaluator.tsx` — new component
- `src/components/feature/code/index.ts` — barrel export update
- `src/types/constants/tool-registry.ts` — ToolRegistryKey union
- `src/constants/tool-registry.ts` — registry entry
- `vite.config.ts` — prerender route
- `e2e/jsonpath-evaluator.spec.ts` — E2E tests

### Project Structure Notes

- **Existing directory**: `src/components/feature/code/` — already exists with 11 tools (CssFormatter, GraphqlSchemaViewer, HtmlFormatter, JavaScriptMinifier, JsonSchemaValidator, JsonToTypeScript, MarkdownPreview, MarkdownTableGenerator, ProtobufToJson, SqlFormatter, TypescriptPlayground)
- **Code category already exists**: `'Code'` in ToolCategory and CATEGORY_ORDER — no changes needed
- **Code barrel already exists**: `src/components/feature/code/index.ts` — add new export in alphabetical order (between `JavaScriptMinifier` and `JsonSchemaValidator`)
- **New dependency**: `jsonpath-plus` 10.4.0 — ESM-compatible, TypeScript types built-in
- **Utility file**: `src/utils/jsonpath-evaluator.ts` — pure functions for JSON parsing and JSONPath evaluation
- **Unit tests**: `src/utils/jsonpath-evaluator.spec.ts` — test all utility functions

### File Locations & Naming

| File | Path |
|---|---|
| Utility | `src/utils/jsonpath-evaluator.ts` |
| Unit tests | `src/utils/jsonpath-evaluator.spec.ts` |
| Component | `src/components/feature/code/JsonpathEvaluator.tsx` |
| Code barrel update | `src/components/feature/code/index.ts` |
| E2E test | `e2e/jsonpath-evaluator.spec.ts` |
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

**JSONPath Evaluator Testing:**
- This tool uses standard TextAreaInput/TextInput — simpler than Monaco Editor tools
- JSON parsing and JSONPath evaluation are debounced 300ms — wait for results to appear after typing
- Use `page.getByRole('status')` to check match count
- Use `page.getByText('No matches')` for empty result check
- For cheatsheet toggle, click the toggle button and verify examples appear
- For cheatsheet click-to-populate, click an example and verify expression input updates and results change
- Filter expressions (`$[?(@.price<10)]`) should work with safe eval — test this explicitly

### UX / Interaction Requirements

- **JSON Input**: Large textarea with monospace font, pre-populated with sample JSON, parse error shown inline
- **JSONPath Expression**: Text input with placeholder example, evaluation error shown inline
- **Results Panel**: Match count header, scrollable list of path+value pairs, CopyButton per result
- **Cheatsheet**: Collapsible section with common JSONPath patterns, clickable examples
- **Responsive**: Desktop: side-by-side panels. Mobile (< 768px): stacked vertically.
- **Initial state**: Pre-populated with sample JSON and `$.store.book[*].author` expression. Results shown immediately.
- **Mobile**: Full-width, 375px min viewport. All sections stack vertically.
- **Loading**: No loading state needed — JSONPath evaluation is instant (<100ms for typical data)

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion-3.md#Epic 25 Story 25.4]
- [Source: _bmad-output/project-context.md#Implementation Rules, Adding a New Tool]
- [Source: _bmad-output/implementation-artifacts/25-3-typescript-playground.md — previous story patterns and learnings]
- [Source: _bmad-output/planning-artifacts/architecture.md — Tool Processing, Error Handling, Code Splitting]
- [Source: src/constants/tool-registry.ts — registry entry pattern and CATEGORY_ORDER]
- [Source: src/types/constants/tool-registry.ts — ToolRegistryKey and ToolCategory types]
- [Source: src/components/feature/code/index.ts — code domain barrel exports pattern]
- [Source: vite.config.ts — prerender route registration]
- [Source: npm jsonpath-plus 10.4.0 — JSONPath evaluation library]
- [Source: github.com/JSONPath-Plus/JSONPath — JSONPath-Plus documentation and API reference]

## Change Log

- 2026-02-25: Implemented JSONPath Evaluator tool — new dependency (jsonpath-plus 10.4.0), utility module, React component, tool registration, accessibility, unit tests (25 tests), E2E tests (11 tests). All acceptance criteria satisfied.
- 2026-02-25: Code review fixes — Fixed HIGH: falsy JSON primitives (0, false, "") silently broke evaluation (`!data` → `data == null`); Fixed HIGH: dual empty-state messages for falsy parsedData; Fixed MEDIUM: Tailwind class ordering (responsive variant before base); Added useMemo for allResultsJson; Added 3 unit tests for falsy primitive edge cases (28 tests total).

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed TypeScript build: spec files needed explicit `import { describe, expect, it } from 'vitest'` (project convention)
- Fixed TypeScript build: `JSONPath()` return type needed `as unknown as Array<...>` cast and `json` param needed `as object` cast
- Fixed TypeScript build: `TextInput` requires `type` prop; `unknown` state in JSX conditional needed `!== null` check
- Fixed E2E tests: scoped result text assertions to `[aria-live="polite"]` panel to avoid strict-mode violations (text exists in both textarea and results)
- Fixed stale closure bug: debounced callbacks captured stale `parsedData`/`expression` state; resolved with `useRef` mirrors (`parsedDataRef`, `expressionRef`)
- Used static import for jsonpath-plus (~15KB gzipped) per story note — simpler than dynamic import, acceptable size

### Completion Notes List

- Installed jsonpath-plus 10.4.0 with exact version pinning, ESM-compatible, built-in TypeScript types
- Created utility module with 3 pure functions: `parseJsonInput`, `evaluateJsonPath`, `formatResultValue`
- Created 25 unit tests covering all utility functions (parse, evaluate, format) — all passing
- Created JsonpathEvaluator component with: dual-panel layout (desktop side-by-side, mobile stacked), debounced input handling (300ms), sample JSON pre-populated, cheatsheet with clickable examples, CopyButton for individual and all results
- Registered tool: ToolRegistryKey union, tool registry entry, vite prerender route, barrel export
- Implemented full accessibility: aria-live, role="status", role="alert", aria-expanded, aria-label on all interactive elements
- Created 11 E2E tests covering all acceptance criteria — all passing
- All quality gates pass: lint (0 errors), format (compliant), unit tests (1224 passing), build (60 HTML files), E2E (11 passing)

### File List

- `package.json` — added jsonpath-plus 10.4.0 dependency
- `pnpm-lock.yaml` — lockfile updated
- `src/utils/jsonpath-evaluator.ts` — new utility (parseJsonInput, evaluateJsonPath, formatResultValue)
- `src/utils/jsonpath-evaluator.spec.ts` — new unit tests (25 tests)
- `src/components/feature/code/JsonpathEvaluator.tsx` — new component
- `src/components/feature/code/index.ts` — added barrel export for JsonpathEvaluator
- `src/types/constants/tool-registry.ts` — added 'jsonpath-evaluator' to ToolRegistryKey union
- `src/constants/tool-registry.ts` — added registry entry for jsonpath-evaluator
- `vite.config.ts` — added prerender route /tools/jsonpath-evaluator
- `e2e/jsonpath-evaluator.spec.ts` — new E2E tests (11 tests)
