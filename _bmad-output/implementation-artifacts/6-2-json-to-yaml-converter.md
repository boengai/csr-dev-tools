# Story 6.2: JSON to YAML Converter

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to convert JSON to YAML and YAML to JSON**,
So that **I can quickly switch between configuration formats for different tools and platforms**.

**Epic:** Epic 6 — Data & Format Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (useToolError, CopyButton — complete), Story 6-1 (Data category + domain directory — complete)
**Story Key:** 6-2-json-to-yaml-converter

## Acceptance Criteria

### AC1: Tool Registered and Renders via Dialog Pattern with Mode Toggle

**Given** the JSON↔YAML Converter tool registered in `TOOL_REGISTRY` under the Data category
**When** the user navigates to it (via sidebar, command palette, or `/tools/json-to-yaml-converter` route)
**Then** it renders with two buttons: "JSON → YAML" and "YAML → JSON" that each open a full-screen dialog
**And** a one-line description is shown from the registry entry
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Valid JSON Converts to YAML in Real-Time

**Given** a user opens the "JSON → YAML" dialog and pastes valid JSON (e.g., `{"name":"John","age":30}`)
**When** the value is entered
**Then** the YAML equivalent appears in real-time (debounced 300ms) in the output textarea:
```yaml
name: John
age: 30
```
**And** a `CopyButton` copies the YAML output

### AC3: Valid YAML Converts to JSON in Real-Time

**Given** a user opens the "YAML → JSON" dialog and pastes valid YAML (e.g., `name: John\nage: 30`)
**When** the value is entered
**Then** the JSON equivalent appears in real-time (debounced 300ms), formatted with 2-space indentation:
```json
{
  "name": "John",
  "age": 30
}
```
**And** a `CopyButton` copies the JSON output

### AC4: Invalid Input Shows Inline Error

**Given** a user pastes invalid JSON in JSON→YAML mode (e.g., `{invalid}`)
**When** parsing fails
**Then** an inline error appears: "Invalid JSON: {error message}"
**And** the error clears automatically when the input changes to a valid value

**Given** a user pastes invalid YAML in YAML→JSON mode (e.g., `key: [unclosed`)
**When** parsing fails
**Then** an inline error appears: "Invalid YAML: {error message}"
**And** the error clears automatically when the input changes to a valid value

### AC5: Empty Input Clears Output

**Given** the user clears the input textarea in either mode
**When** the input becomes empty
**Then** the output textarea is cleared
**And** any active error is cleared

### AC6: YAML Library is Code-Split and Lazy-Loaded

**Given** the tool implementation
**When** the `yaml` library is used for conversion
**Then** it is dynamically imported (`await import('yaml')`) so it does not increase the initial bundle size
**And** the library is only loaded when the user opens the tool's dialog
**And** all processing is 100% client-side — zero network requests for conversion

### AC7: Unit Tests Cover All Conversion Scenarios

**Given** unit tests in `src/utils/yaml.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: simple objects, nested structures, arrays, primitive values, multiline YAML strings, special characters, Unicode content, empty input, whitespace-only input, invalid JSON, invalid YAML, large objects, and round-trip consistency (JSON→YAML→JSON preserves data)

## Tasks / Subtasks

- [x] Task 1: Install `yaml` library (AC: #6)
  - [x] 1.1 Run `pnpm add yaml` to install the `yaml` package (eemeli/yaml — full YAML 1.2 support, TypeScript-first)
  - [x] 1.2 Verify exact version pinned in `package.json` (no `^` prefix — enforced by `.npmrc`)

- [x] Task 2: Create YAML conversion utility functions (AC: #2, #3, #4, #5, #6)
  - [x] 2.1 Create `src/utils/yaml.ts` with async functions that dynamically import `yaml`
  - [x] 2.2 `jsonToYaml(input: string): Promise<string>` — parses JSON with `JSON.parse()`, converts to YAML with `stringify()` from `yaml` lib (2-space indent)
  - [x] 2.3 `yamlToJson(input: string, indent?: number): Promise<string>` — parses YAML with `parse()` from `yaml` lib, re-stringifies with `JSON.stringify(parsed, null, indent)` where indent defaults to 2
  - [x] 2.4 `getYamlParseError(input: string): Promise<string | null>` — returns `null` for valid YAML, or the error message for invalid YAML
  - [x] 2.5 All three functions throw/return on empty or whitespace-only input: `jsonToYaml` throws `'Empty input'`, `yamlToJson` throws `'Empty input'`, `getYamlParseError` returns `'Empty input'`
  - [x] 2.6 Export from `src/utils/index.ts` barrel

- [x] Task 3: Write unit tests for YAML utilities (AC: #7)
  - [x] 3.1 Create `src/utils/yaml.spec.ts` following existing `json.spec.ts` pattern (explicit vitest imports, async tests)
  - [x] 3.2 Test `jsonToYaml` with simple object → valid YAML output
  - [x] 3.3 Test `jsonToYaml` with nested objects → properly indented YAML
  - [x] 3.4 Test `jsonToYaml` with arrays → YAML list syntax
  - [x] 3.5 Test `jsonToYaml` with primitive values (string, number, boolean, null)
  - [x] 3.6 Test `jsonToYaml` with special characters (quotes, backslashes)
  - [x] 3.7 Test `jsonToYaml` with Unicode content (emoji, CJK characters)
  - [x] 3.8 Test `jsonToYaml` throws on empty string
  - [x] 3.9 Test `jsonToYaml` throws on whitespace-only string
  - [x] 3.10 Test `jsonToYaml` throws on invalid JSON
  - [x] 3.11 Test `yamlToJson` with simple YAML object → formatted JSON
  - [x] 3.12 Test `yamlToJson` with nested YAML → deeply indented JSON
  - [x] 3.13 Test `yamlToJson` with YAML arrays → JSON array
  - [x] 3.14 Test `yamlToJson` with multiline YAML strings (block scalar `|`)
  - [x] 3.15 Test `yamlToJson` throws on empty string
  - [x] 3.16 Test `yamlToJson` throws on invalid YAML
  - [x] 3.17 Test `getYamlParseError` returns null for valid YAML
  - [x] 3.18 Test `getYamlParseError` returns error message for invalid YAML
  - [x] 3.19 Test `getYamlParseError` returns error for empty input
  - [x] 3.20 Test `getYamlParseError` returns error for whitespace-only input
  - [x] 3.21 Test round-trip consistency: JSON→YAML→JSON preserves data structure
  - [x] 3.22 Test `jsonToYaml` with large JSON object (100+ keys)

- [x] Task 4: Create JsonToYamlConverter component (AC: #1, #2, #3, #4, #5, #6)
  - [x] 4.1 Create `src/components/feature/data/JsonToYamlConverter.tsx` as named export
  - [x] 4.2 Follow `UrlEncoder.tsx` two-mode dialog pattern: two buttons on card ("JSON → YAML" and "YAML → JSON"), each opens a full-screen dialog with the corresponding mode
  - [x] 4.3 Use `type ConvertMode = 'json-to-yaml' | 'yaml-to-json'` for mode state (not string union on action)
  - [x] 4.4 Left side of dialog: source textarea with `FieldForm` — label and placeholder change based on mode:
    - JSON→YAML: label "JSON Input", placeholder `{"name":"John","age":30}`
    - YAML→JSON: label "YAML Input", placeholder `name: John\nage: 30`
  - [x] 4.5 Right side of dialog: result textarea with `CopyButton` in the label — label changes based on mode:
    - JSON→YAML: label "YAML Output", placeholder `name: John\nage: 30`
    - YAML→JSON: label "JSON Output", placeholder `{\n  "name": "John",\n  "age": 30\n}`
  - [x] 4.6 Use `useToolError` for error state, `useDebounceCallback` (300ms) for processing, `CopyButton` on result section
  - [x] 4.7 Process function is async — calls `jsonToYaml()` or `yamlToJson()` based on mode
  - [x] 4.8 On valid input: display converted result, clear error
  - [x] 4.9 On invalid input: use `getJsonParseError()` (JSON mode) or `getYamlParseError()` (YAML mode) for specific error messages, format as `'Invalid JSON: {msg}'` or `'Invalid YAML: {msg}'`
  - [x] 4.10 On empty input: clear result and error
  - [x] 4.11 Show tool description from `TOOL_REGISTRY_MAP['json-to-yaml-converter']`
  - [x] 4.12 Reset source, result, and error on dialog close via `onAfterClose`
  - [x] 4.13 Dialog title changes with mode: "JSON → YAML" or "YAML → JSON"

- [x] Task 5: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 5.1 Add `'json-to-yaml-converter'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetically between `'json-formatter'` and `'jwt-decoder'`)
  - [x] 5.2 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts` with all required fields (maintain alphabetical ordering by key — between `json-formatter` and `jwt-decoder`)
  - [x] 5.3 Add pre-render route in `vite.config.ts` toolRoutes array (alphabetically between `json-formatter` and `jwt-decoder`)

- [x] Task 6: Update barrel exports (AC: #1)
  - [x] 6.1 Add `export * from './JsonToYamlConverter'` to `src/components/feature/data/index.ts` (alphabetically after `JsonFormatter`)
  - [x] 6.2 Add `export * from './yaml'` to `src/utils/index.ts` (alphabetically after `'./validation'`)

- [x] Task 7: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 7.1 Run `pnpm lint` — no errors (3 pre-existing warnings)
  - [x] 7.2 Run `pnpm format:check` — no formatting issues
  - [x] 7.3 Run `pnpm test` — all 382 tests pass (360 existing + 22 new)
  - [x] 7.4 Run `pnpm build` — build succeeds, tool chunk is separate (JsonToYamlConverter-CLOa23tK.js, 3.02 kB), `yaml` library is NOT in the main chunk

## Dev Notes

### CRITICAL: Follow Existing UrlEncoder Two-Mode Dialog Pattern

This tool uses the **two-mode pattern** from `UrlEncoder.tsx` — two buttons on the card that each open a dialog in a specific mode. Key differences from the single-button `JsonFormatter.tsx`:

1. **Two buttons on card:** "JSON → YAML" and "YAML → JSON" (not a single "Convert" button)
2. **Mode state:** `useState<ConvertMode>('json-to-yaml')` controls which conversion runs
3. **Dynamic labels/placeholders:** Source and result labels change based on mode
4. **Dialog title changes:** "JSON → YAML" or "YAML → JSON" based on mode
5. **Async processing:** Unlike sync tools, `process()` is async due to dynamic `import('yaml')`
6. **Separate error messages:** JSON mode uses `getJsonParseError()`, YAML mode uses `getYamlParseError()`

### UI Layout

Identical to UrlEncoder pattern:
- **Card view:** Tool description + two action buttons ("JSON → YAML", "YAML → JSON")
- **Dialog view:**
  - **Left side:** `FieldForm` textarea for pasting source (label: "JSON Input" or "YAML Input")
  - **Divider:** `border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2`
  - **Right side:** `FieldForm` textarea for converted output with `CopyButton` in label (label: "YAML Output" or "JSON Output"), disabled when no result
  - **Bottom:** Error message (if any)

### YAML Library: `yaml` (eemeli/yaml)

**Selected library:** [`yaml`](https://github.com/eemeli/yaml) — the modern TypeScript-first YAML library

**Rationale:**
- Full YAML 1.2 support (the latest YAML spec)
- TypeScript-first with excellent type definitions
- Tree-shakeable ESM build
- Simple API: `parse(yamlString)` and `stringify(jsObject)`
- Actively maintained

**CRITICAL: Dynamic Import for Code Splitting**

The `yaml` library MUST be dynamically imported to prevent it from entering the initial bundle:

```typescript
// ✅ CORRECT — dynamic import, lazy loaded
export const jsonToYaml = async (input: string): Promise<string> => {
  const { stringify } = await import('yaml')
  return stringify(JSON.parse(input), { indent: 2 })
}

// ❌ WRONG — static import, bloats initial bundle
import { parse, stringify } from 'yaml'
```

This follows the same pattern as `jszip` in `ImageConvertor.tsx` where heavy libraries are dynamically imported inline.

### Conversion Logic — API Usage

```typescript
// JSON → YAML
const { stringify } = await import('yaml')
const jsObject = JSON.parse(jsonString)  // validate + parse JSON
const yamlString = stringify(jsObject, { indent: 2 })

// YAML → JSON
const { parse } = await import('yaml')
const jsObject = parse(yamlString)  // validate + parse YAML
const jsonString = JSON.stringify(jsObject, null, 2)
```

**Edge cases handled by the library:**
- Multiline strings (block scalar `|` and folded `>`)
- Special YAML types (dates, null, booleans like `yes`/`no`)
- Unicode content
- Nested structures with mixed types

### Architecture Compliance

- **TOOL_REGISTRY entry required** — tool must be discoverable via sidebar, command palette, dashboard selection dialog, and direct URL. The dashboard is a fixed 6-slot favorites grid — new tools do NOT auto-appear there [Source: architecture.md#Tool Registry]
- **Data category already exists** — `'Data'` was added to `ToolCategory` in story 6-1. No type update needed for category. [Source: src/types/constants/tool-registry.ts]
- **Named export only** — `export const JsonToYamlConverter` (never `export default`) [Source: project-context.md#Named exports]
- **Lazy-loaded component** — registry uses `lazy(() => import(...).then(({ JsonToYamlConverter }) => ({ default: JsonToYamlConverter })))` [Source: architecture.md#Code Splitting]
- **100% client-side** — `yaml` library parse/stringify only, zero network requests [Source: architecture.md#Hard Constraints]
- **Dynamic import for yaml library** — follows JSZip pattern to avoid bundle bloat [Source: architecture.md#Code Splitting, NFR8]

### Library & Framework Requirements

- **One new dependency: `yaml`** — installed via `pnpm add yaml`. Provides YAML 1.2 parse/stringify. Must be dynamically imported in utility functions.
- **Existing imports used:** `useState` from React, `Button`, `CopyButton`, `Dialog`, `FieldForm` from `@/components/common`, `TOOL_REGISTRY_MAP` from `@/constants`, `useDebounceCallback`, `useToolError` from `@/hooks`, `getJsonParseError` from `@/utils/json`

### File Structure Requirements

**Files to CREATE:**

```
src/utils/yaml.ts                                     — jsonToYaml(), yamlToJson(), getYamlParseError() async functions
src/utils/yaml.spec.ts                                — Unit tests for YAML conversion utilities
src/components/feature/data/JsonToYamlConverter.tsx    — JSON↔YAML Converter component
```

**Files to MODIFY:**

```
package.json                                  — Add `yaml` dependency (via pnpm add)
pnpm-lock.yaml                               — Updated automatically by pnpm
src/utils/index.ts                            — Add barrel export for yaml utils
src/components/feature/data/index.ts          — Add barrel export for JsonToYamlConverter
src/constants/tool-registry.ts                — Add JSON↔YAML Converter registry entry
src/types/constants/tool-registry.ts          — Add 'json-to-yaml-converter' to ToolRegistryKey
vite.config.ts                                — Add JSON↔YAML Converter pre-render route
```

**Files NOT to modify:**
- `src/components/feature/index.ts` — already exports from `'./data'` (done in story 6-1)
- `src/types/constants/tool-registry.ts` ToolCategory — `'Data'` already exists (done in story 6-1)
- `src/utils/json.ts` — `getJsonParseError` reused as-is for JSON validation
- `src/components/common/sidebar/Sidebar.tsx` — `'Data'` already in `CATEGORY_ORDER` (done in story 6-1)
- Any existing tool components

### Testing Requirements

**Unit tests (`src/utils/yaml.spec.ts`):**

```typescript
import { describe, expect, it } from 'vitest'

import { getYamlParseError, jsonToYaml, yamlToJson } from '@/utils/yaml'

describe('yaml conversion utilities', () => {
  describe('jsonToYaml', () => {
    it('should convert simple object to YAML', async () => {
      const result = await jsonToYaml('{"name":"John","age":30}')
      expect(result).toContain('name: John')
      expect(result).toContain('age: 30')
    })

    it('should convert nested objects to indented YAML', async () => {
      const result = await jsonToYaml('{"a":{"b":{"c":1}}}')
      expect(result).toContain('a:')
      expect(result).toContain('  b:')
      expect(result).toContain('    c: 1')
    })

    it('should convert arrays to YAML list syntax', async () => {
      const result = await jsonToYaml('{"items":[1,2,3]}')
      expect(result).toContain('items:')
      expect(result).toContain('  - 1')
    })

    it('should handle primitive JSON values', async () => {
      expect(await jsonToYaml('"hello"')).toContain('hello')
      expect(await jsonToYaml('42')).toContain('42')
      expect(await jsonToYaml('true')).toContain('true')
      expect(await jsonToYaml('null')).toContain('null')
    })

    it('should handle special characters in strings', async () => {
      const result = await jsonToYaml('{"msg":"hello\\nworld"}')
      expect(result).toBeTruthy()
    })

    it('should handle Unicode content', async () => {
      const result = await jsonToYaml('{"emoji":"🎉","cjk":"日本語"}')
      expect(result).toContain('🎉')
      expect(result).toContain('日本語')
    })

    it('should throw on empty string', async () => {
      await expect(jsonToYaml('')).rejects.toThrow('Empty input')
    })

    it('should throw on whitespace-only string', async () => {
      await expect(jsonToYaml('   ')).rejects.toThrow('Empty input')
    })

    it('should throw on invalid JSON', async () => {
      await expect(jsonToYaml('{invalid}')).rejects.toThrow()
    })

    it('should handle large JSON objects', async () => {
      const obj: Record<string, number> = {}
      for (let i = 0; i < 100; i++) obj[`key${i}`] = i
      const result = await jsonToYaml(JSON.stringify(obj))
      expect(result).toContain('key0: 0')
      expect(result).toContain('key99: 99')
    })
  })

  describe('yamlToJson', () => {
    it('should convert simple YAML to formatted JSON', async () => {
      const result = await yamlToJson('name: John\nage: 30')
      expect(result).toBe('{\n  "name": "John",\n  "age": 30\n}')
    })

    it('should convert nested YAML to JSON', async () => {
      const result = await yamlToJson('a:\n  b:\n    c: 1')
      const parsed = JSON.parse(result)
      expect(parsed.a.b.c).toBe(1)
    })

    it('should convert YAML arrays to JSON', async () => {
      const result = await yamlToJson('items:\n  - 1\n  - 2\n  - 3')
      const parsed = JSON.parse(result)
      expect(parsed.items).toEqual([1, 2, 3])
    })

    it('should handle multiline YAML strings (block scalar)', async () => {
      const result = await yamlToJson('text: |\n  line one\n  line two')
      const parsed = JSON.parse(result)
      expect(parsed.text).toContain('line one')
      expect(parsed.text).toContain('line two')
    })

    it('should throw on empty string', async () => {
      await expect(yamlToJson('')).rejects.toThrow('Empty input')
    })

    it('should throw on invalid YAML', async () => {
      await expect(yamlToJson('key: [unclosed')).rejects.toThrow()
    })

    it('should support custom indent', async () => {
      const result = await yamlToJson('a: 1', 4)
      expect(result).toBe('{\n    "a": 1\n}')
    })
  })

  describe('getYamlParseError', () => {
    it('should return null for valid YAML', async () => {
      expect(await getYamlParseError('name: John')).toBeNull()
    })

    it('should return error message for invalid YAML', async () => {
      const error = await getYamlParseError('key: [unclosed')
      expect(error).toBeTruthy()
      expect(typeof error).toBe('string')
    })

    it('should return error for empty input', async () => {
      expect(await getYamlParseError('')).toBe('Empty input')
    })

    it('should return error for whitespace-only input', async () => {
      expect(await getYamlParseError('   ')).toBe('Empty input')
    })
  })

  describe('round-trip consistency', () => {
    it('should preserve data through JSON→YAML→JSON round-trip', async () => {
      const original = '{"name":"John","age":30,"tags":["dev","tools"],"nested":{"key":"value"}}'
      const yaml = await jsonToYaml(original)
      const roundTripped = await yamlToJson(yaml)
      expect(JSON.parse(roundTripped)).toEqual(JSON.parse(original))
    })
  })
})
```

**No E2E test in this story** — E2E tests are written separately per the testing strategy. Unit tests cover the core logic.

### TOOL_REGISTRY Entry (Copy-Paste Ready)

```typescript
{
  category: 'Data',
  component: lazy(() =>
    import('@/components/feature/data/JsonToYamlConverter').then(
      ({ JsonToYamlConverter }: { JsonToYamlConverter: ComponentType }) => ({
        default: JsonToYamlConverter,
      }),
    ),
  ),
  description: 'Convert between JSON and YAML configuration formats',
  emoji: '🔄',
  key: 'json-to-yaml-converter',
  name: 'JSON ↔ YAML',
  routePath: '/tools/json-to-yaml-converter',
  seo: {
    description:
      'Convert JSON to YAML and YAML to JSON online. Switch between configuration formats instantly in your browser.',
    title: 'JSON to YAML Converter - CSR Dev Tools',
  },
}
```

### ToolRegistryKey Type Update (Copy-Paste Ready)

```typescript
export type ToolRegistryKey =
  | 'base64-encoder'
  | 'color-converter'
  | 'image-converter'
  | 'image-resizer'
  | 'json-formatter'
  | 'json-to-yaml-converter'
  | 'jwt-decoder'
  | 'px-to-rem'
  | 'unix-timestamp'
  | 'url-encoder-decoder'
```

### Vite Config Pre-Render Route (Copy-Paste Ready)

```typescript
{
  description:
    'Convert JSON to YAML and YAML to JSON online. Switch between configuration formats instantly in your browser.',
  path: '/tools/json-to-yaml-converter',
  title: 'JSON to YAML Converter - CSR Dev Tools',
  url: '/tools/json-to-yaml-converter',
},
```

### Previous Story Intelligence

From Story 6-1 (JSON Formatter/Validator — same epic, completed):
- **Same domain directory** — `src/components/feature/data/` already exists with `JsonFormatter.tsx` and `index.ts` barrel
- **Data category already registered** — `'Data'` in `ToolCategory` and `CATEGORY_ORDER` already done
- **Feature barrel already updated** — `export * from './data'` in `src/components/feature/index.ts` already done
- **Same dialog pattern** — single-action dialog worked cleanly; this story uses two-action variant from UrlEncoder
- **Build verified** — build initially succeeded, test file used explicit vitest imports — DO THIS from the start
- **Code review found missing pre-render route** — DO NOT forget `vite.config.ts` update
- **360 tests exist** — expect ~382+ after adding YAML tests (~22 new)
- **`getJsonParseError` reusable** — already in `src/utils/json.ts`, import and reuse for JSON mode validation
- **Commit prefix:** Use `✨: story 6-2 JSON to YAML Converter`

### Git Intelligence

Recent commits analyzed:
```
dbbf974 ✨: story 6-1 JSON Formatter/Validator
e07fe59 🐛: replace dead default breakpoints with custom tablet/laptop/desktop
4e65239 💄: min height
f8e8266 ✨: story 5-2 JWT Decoder
57dab9e ✨: story 5-1 URL Encoder/Decoder
```

**Pattern:** New tool feature uses `✨: story X-Y Tool Name` commit prefix.
**Files in story 6-1:** utility function, utility tests, tool component, registry entry, types, barrel exports, vite.config.ts, sidebar category order. This story follows the same pattern minus sidebar/category changes (already done).

### Project Structure Notes

- **Domain directory exists:** `src/components/feature/data/` was created in story 6-1 — just add the new component file
- **No type file needed** — component has no custom props (follows UrlEncoder, JwtDecoder, JsonFormatter patterns which also have no types file)
- **New utility file:** `src/utils/yaml.ts` — parallel to `src/utils/json.ts`, `src/utils/url.ts`, `src/utils/jwt.ts`
- **Tests co-located:** `src/utils/yaml.spec.ts` — parallel to `src/utils/json.spec.ts`, `src/utils/url.spec.ts`
- **New dependency:** `yaml` package — first external library needed by a Data category tool

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.2] — Full AC definitions and story requirements
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6] — Epic objectives and FR coverage (FR18)
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Registry] — Registry entry pattern with all required fields
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — `json-to-yaml-converter` key, `Data` category
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Text conversion: on input change, 300ms debounce
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Message Format] — Concise, actionable, with example of valid input
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Tool component file structure, data/ directory
- [Source: _bmad-output/planning-artifacts/architecture.md#Hard Constraints] — Zero server-side processing
- [Source: _bmad-output/project-context.md] — 53 project rules (named exports, type not interface, etc.)
- [Source: src/components/feature/encoding/UrlEncoder.tsx] — Primary reference implementation pattern (two-mode dialog)
- [Source: src/components/feature/data/JsonFormatter.tsx] — Sibling tool reference (same domain, single-mode dialog)
- [Source: src/utils/json.ts] — getJsonParseError reused for JSON mode validation
- [Source: src/utils/json.spec.ts] — Test pattern reference for utility tests
- [Source: src/constants/tool-registry.ts] — Current registry with 9 tools, alphabetical ordering
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey and ToolCategory unions to update
- [Source: src/hooks/useToolError.ts] — Error handling hook
- [Source: src/hooks/useDebounceCallback.ts] — Debounce utility (300ms)
- [Source: vite.config.ts] — Pre-render routes pattern (MUST add route)
- [Source: _bmad-output/implementation-artifacts/6-1-json-formatter-validator.md] — Previous story learnings (same epic)
- [Source: https://github.com/eemeli/yaml] — yaml library (YAML 1.2, TypeScript-first)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered. Clean implementation.

### Completion Notes List

- Installed `yaml@2.8.2` with exact version pinning
- Created `src/utils/yaml.ts` with 3 async functions (`jsonToYaml`, `yamlToJson`, `getYamlParseError`) — all use dynamic `import('yaml')` for code splitting
- Created `src/utils/yaml.spec.ts` with 22 comprehensive unit tests covering all AC7 scenarios
- Created `src/components/feature/data/JsonToYamlConverter.tsx` following UrlEncoder two-mode dialog pattern with `ConvertMode` type
- Registered tool in `TOOL_REGISTRY` (key: `json-to-yaml-converter`, category: `Data`, emoji: `🔄`)
- Added `ToolRegistryKey` union member and pre-render route in `vite.config.ts`
- Updated barrel exports in `src/utils/index.ts` and `src/components/feature/data/index.ts`
- All 382 tests pass (22 new + 360 existing), 0 lint errors, formatting clean, build succeeds with separate chunk

### File List

**Created:**
- `src/utils/yaml.ts`
- `src/utils/yaml.spec.ts`
- `src/components/feature/data/JsonToYamlConverter.tsx`

**Modified:**
- `package.json` (added `yaml` dependency)
- `pnpm-lock.yaml` (updated by pnpm)
- `src/utils/index.ts` (added yaml barrel export)
- `src/components/feature/data/index.ts` (added JsonToYamlConverter barrel export)
- `src/constants/tool-registry.ts` (added registry entry)
- `src/types/constants/tool-registry.ts` (added `json-to-yaml-converter` to ToolRegistryKey)
- `vite.config.ts` (added pre-render route)

## Senior Developer Review (AI)

**Reviewer:** csrteam on 2026-02-14
**Outcome:** Approved (after fixes)

### Issues Found & Fixed

| # | Severity | Issue | File | Fix |
|---|----------|-------|------|-----|
| H1 | HIGH | `getJsonParseError()` returns null → "Invalid JSON: null" displayed | JsonToYamlConverter.tsx:35-37 | Added null guard with fallback message |
| M1 | MEDIUM | Missing `yamlToJson` whitespace-only test (AC7 gap) | yaml.spec.ts | Added missing test case |
| M2 | MEDIUM | Whitespace-only input UX asymmetry between modes | JsonToYamlConverter.tsx:22 | Changed `val.length` to `val.trim().length` |
| M3 | MEDIUM | Stale async results on dialog close/mode switch | JsonToYamlConverter.tsx:18,21,29,33,40,56,65 | Added `sessionRef` generation counter to guard async state updates |

### LOW Issues (not fixed — accepted)

| # | Severity | Issue | File |
|---|----------|-------|------|
| L1 | LOW | Weak test assertion (`toBeTruthy`) for special characters | yaml.spec.ts:34 |
| L2 | LOW | Inefficient double-parse in error recovery path | JsonToYamlConverter.tsx:36,39 |

### Verification Results

- `pnpm test` → **383 tests pass** (23 yaml + 360 existing)
- `pnpm lint` → **0 errors** (3 pre-existing warnings)
- `pnpm format:check` → **all clean**

## Change Log

- 2026-02-14: Implemented JSON↔YAML Converter tool — 3 async utility functions with dynamic import, 22 unit tests, two-mode dialog component following UrlEncoder pattern, tool registry integration with code-split chunk
- 2026-02-14: Code review — fixed 4 issues (1 HIGH, 3 MEDIUM): null guard on error messages, missing whitespace test, trim check for empty input, session guard for stale async results. Tests now 383 (23 yaml).
