# Story 6.3: JSON to CSV Converter

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to convert JSON arrays to CSV and CSV to JSON**,
So that **I can quickly transform data between formats for spreadsheets and APIs**.

**Epic:** Epic 6 — Data & Format Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (useToolError, CopyButton — complete), Story 6-1 (Data category + domain directory — complete), Story 6-2 (two-mode dialog pattern precedent — complete)
**Story Key:** 6-3-json-to-csv-converter

## Acceptance Criteria

### AC1: Tool Registered and Renders via Dialog Pattern with Mode Toggle

**Given** the JSON↔CSV Converter tool registered in `TOOL_REGISTRY` under the Data category
**When** the user navigates to it (via sidebar, command palette, or `/tools/json-to-csv-converter` route)
**Then** it renders with two buttons: "JSON → CSV" and "CSV → JSON" that each open a full-screen dialog
**And** a one-line description is shown from the registry entry
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Valid JSON Array Converts to CSV in Real-Time

**Given** a user opens the "JSON → CSV" dialog and pastes a valid JSON array of objects (e.g., `[{"name":"Alice","age":30},{"name":"Bob","age":25}]`)
**When** the value is entered
**Then** a CSV output appears in real-time (debounced 150ms) with headers derived from object keys:
```csv
name,age
Alice,30
Bob,25
```
**And** a `CopyButton` copies the CSV output

### AC3: Valid CSV Converts to JSON in Real-Time

**Given** a user opens the "CSV → JSON" dialog and pastes valid CSV text (e.g., `name,age\nAlice,30\nBob,25`)
**When** the value is entered
**Then** a JSON array of objects appears in real-time (debounced 150ms), formatted with 2-space indentation:
```json
[
  {
    "name": "Alice",
    "age": "30"
  },
  {
    "name": "Bob",
    "age": "25"
  }
]
```
**And** a `CopyButton` copies the JSON output

### AC4: Invalid Input Shows Inline Error

**Given** a user pastes JSON that is NOT an array of objects (e.g., `{"name":"Alice"}` or `"hello"` or `[1,2,3]`)
**When** parsing/conversion fails
**Then** an inline error appears: "JSON must be an array of objects (e.g., [{"name": "Alice"}])"
**And** the error clears automatically when the input changes to a valid value

**Given** a user pastes invalid JSON in JSON→CSV mode
**When** parsing fails
**Then** an inline error appears: "Invalid JSON: {error message}"

**Given** a user pastes CSV with no content (only whitespace or empty)
**When** the input is empty
**Then** the output is cleared and any active error is cleared

### AC5: Empty Input Clears Output

**Given** the user clears the input textarea in either mode
**When** the input becomes empty
**Then** the output textarea is cleared
**And** any active error is cleared

### AC6: CSV Handling Covers Edge Cases

**Given** the CSV conversion engine
**When** processing CSV data
**Then** it correctly handles:
- Quoted fields containing commas (e.g., `"Smith, Jr."`)
- Quoted fields containing newlines
- Fields containing double quotes (escaped as `""` per RFC 4180)
- Header row detection (first row is always headers)
- Trailing newlines (ignored)
- Empty field values
- Mixed quoted and unquoted fields

### AC7: All Processing is Client-Side with No External Dependencies

**Given** the tool implementation
**When** it converts between JSON and CSV
**Then** zero network requests are made — all parsing and conversion is 100% client-side
**And** no external CSV library is needed — use native JavaScript string processing (CSV is simple enough to implement without a library)
**And** unit tests cover all conversion scenarios

### AC8: Unit Tests Cover All Conversion Scenarios

**Given** unit tests in `src/utils/csv.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: simple arrays of objects, nested objects (dot-notation flattened keys), empty arrays, single-row arrays, values containing commas, values containing quotes, values containing newlines, Unicode content, CSV to JSON round-trip, JSON to CSV round-trip, non-array JSON error, non-object array items error, empty input error, whitespace-only input error, headers with different key sets (union of all keys), and large datasets

## Tasks / Subtasks

- [x] Task 1: Create CSV conversion utility functions (AC: #2, #3, #4, #5, #6, #7)
  - [x] 1.1 Create `src/utils/csv.ts` with synchronous functions (no async needed — pure string processing)
  - [x] 1.2 `jsonToCsv(input: string): string` — parses JSON with `JSON.parse()`, validates it's an array of objects, extracts headers as union of all object keys (sorted alphabetically for consistency), generates RFC 4180-compliant CSV
  - [x] 1.3 `csvToJson(input: string, indent?: number): string` — parses CSV string (RFC 4180 compliant), extracts headers from first row, converts each subsequent row to an object, returns `JSON.stringify(result, null, indent)` where indent defaults to 2
  - [x] 1.4 `getCsvParseError(input: string): string | null` — returns `null` for valid CSV (has at least a header row), or the error message for invalid/empty CSV
  - [x] 1.5 All functions handle empty/whitespace-only input: `jsonToCsv` throws `'Empty input'`, `csvToJson` throws `'Empty input'`, `getCsvParseError` returns `'Empty input'`
  - [x] 1.6 JSON validation in `jsonToCsv`: must be an array (`Array.isArray`), each item must be a plain object (`typeof item === 'object' && item !== null && !Array.isArray(item)`). Throws specific messages: `'JSON must be an array of objects'` for non-array, `'All array items must be objects'` for arrays of non-objects
  - [x] 1.7 Nested object flattening: `jsonToCsv` flattens nested objects using dot-notation keys (e.g., `{"address":{"city":"NYC"}}` becomes header `address.city` with value `NYC`). Arrays within objects are JSON-stringified.
  - [x] 1.8 CSV field escaping (RFC 4180): values containing commas, double quotes, or newlines are wrapped in double quotes. Double quotes within values are escaped as `""`.
  - [x] 1.9 CSV parsing: handle both `\n` and `\r\n` line endings. Respect quoted fields spanning multiple lines. Trim trailing empty rows.
  - [x] 1.10 Export from `src/utils/index.ts` barrel

- [x] Task 2: Write unit tests for CSV utilities (AC: #8)
  - [x] 2.1 Create `src/utils/csv.spec.ts` following existing `json.spec.ts` and `yaml.spec.ts` patterns (explicit vitest imports)
  - [x] 2.2 Test `jsonToCsv` with simple array of flat objects
  - [x] 2.3 Test `jsonToCsv` with nested objects → dot-notation flattened headers
  - [x] 2.4 Test `jsonToCsv` with values containing commas → properly quoted
  - [x] 2.5 Test `jsonToCsv` with values containing double quotes → escaped as `""`
  - [x] 2.6 Test `jsonToCsv` with values containing newlines → properly quoted
  - [x] 2.7 Test `jsonToCsv` with Unicode content (emoji, CJK)
  - [x] 2.8 Test `jsonToCsv` with empty array → throws or returns empty (headers only)
  - [x] 2.9 Test `jsonToCsv` with single-item array
  - [x] 2.10 Test `jsonToCsv` with objects having different key sets → union of all keys, missing values as empty
  - [x] 2.11 Test `jsonToCsv` throws `'Empty input'` on empty string
  - [x] 2.12 Test `jsonToCsv` throws `'Empty input'` on whitespace-only string
  - [x] 2.13 Test `jsonToCsv` throws on non-array JSON (object, string, number)
  - [x] 2.14 Test `jsonToCsv` throws on array of non-objects (e.g., `[1,2,3]`)
  - [x] 2.15 Test `jsonToCsv` throws on invalid JSON
  - [x] 2.16 Test `jsonToCsv` with array values → JSON-stringified in cell
  - [x] 2.17 Test `jsonToCsv` with null and boolean values
  - [x] 2.18 Test `jsonToCsv` with large dataset (100+ rows)
  - [x] 2.19 Test `csvToJson` with simple CSV → array of objects
  - [x] 2.20 Test `csvToJson` with quoted fields containing commas
  - [x] 2.21 Test `csvToJson` with quoted fields containing newlines
  - [x] 2.22 Test `csvToJson` with escaped double quotes inside quoted fields
  - [x] 2.23 Test `csvToJson` with `\r\n` line endings
  - [x] 2.24 Test `csvToJson` with trailing newline (should not create extra empty row)
  - [x] 2.25 Test `csvToJson` with empty field values
  - [x] 2.26 Test `csvToJson` with single-row CSV (header only)
  - [x] 2.27 Test `csvToJson` throws `'Empty input'` on empty/whitespace string
  - [x] 2.28 Test `csvToJson` with custom indent parameter
  - [x] 2.29 Test `getCsvParseError` returns null for valid CSV
  - [x] 2.30 Test `getCsvParseError` returns error for empty input
  - [x] 2.31 Test `getCsvParseError` returns error for whitespace-only input
  - [x] 2.32 Test round-trip: JSON→CSV→JSON preserves data
  - [x] 2.33 Test round-trip: CSV→JSON→CSV preserves data

- [x] Task 3: Create JsonToCsvConverter component (AC: #1, #2, #3, #4, #5, #7)
  - [x] 3.1 Create `src/components/feature/data/JsonToCsvConverter.tsx` as named export
  - [x] 3.2 Follow `JsonToYamlConverter.tsx` two-mode dialog pattern exactly: two buttons on card ("JSON → CSV" and "CSV → JSON"), each opens a full-screen dialog with the corresponding mode
  - [x] 3.3 Use `type ConvertMode = 'json-to-csv' | 'csv-to-json'` for mode state
  - [x] 3.4 Left side of dialog: source textarea with `FieldForm` — label and placeholder change based on mode:
    - JSON→CSV: label "JSON Input", placeholder `[{"name":"Alice","age":30}]`
    - CSV→JSON: label "CSV Input", placeholder `name,age\nAlice,30\nBob,25`
  - [x] 3.5 Right side of dialog: result textarea with `CopyButton` in the label — label changes based on mode:
    - JSON→CSV: label "CSV Output", placeholder `name,age\nAlice,30`
    - CSV→JSON: label "JSON Output", placeholder `[\n  {\n    "name": "Alice"\n  }\n]`
  - [x] 3.6 Use `useToolError` for error state, `useDebounceCallback` (150ms) for processing, `CopyButton` on result section
  - [x] 3.7 Process function is synchronous (unlike YAML which was async) — calls `jsonToCsv()` or `csvToJson()` based on mode
  - [x] 3.8 On valid input: display converted result, clear error
  - [x] 3.9 On invalid input: use `getJsonParseError()` (JSON mode) or `getCsvParseError()` (CSV mode) for specific error messages, format as `'Invalid JSON: {msg}'` or `'{msg}'` (CSV errors are already descriptive)
  - [x] 3.10 Special JSON error: when `jsonToCsv` throws with "JSON must be an array of objects" or "All array items must be objects", display that message directly (not wrapped in "Invalid JSON:")
  - [x] 3.11 On empty input: clear result and error
  - [x] 3.12 Show tool description from `TOOL_REGISTRY_MAP['json-to-csv-converter']`
  - [x] 3.13 Reset source, result, and error on dialog close via `onAfterClose`
  - [x] 3.14 Dialog title changes with mode: "JSON → CSV" or "CSV → JSON"
  - [x] 3.15 No `sessionRef` needed (unlike YAML converter) because all processing is synchronous — no stale async results possible

- [x] Task 4: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 4.1 Add `'json-to-csv-converter'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetically between `'json-formatter'` and `'json-to-yaml-converter'`)
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts` with all required fields (maintain alphabetical ordering by key — between `json-formatter` and `json-to-yaml-converter`)
  - [x] 4.3 Add pre-render route in `vite.config.ts` toolRoutes array (alphabetically between `json-formatter` and `json-to-yaml-converter`)

- [x] Task 5: Update barrel exports (AC: #1)
  - [x] 5.1 Add `export * from './JsonToCsvConverter'` to `src/components/feature/data/index.ts` (alphabetically between `JsonFormatter` and `JsonToYamlConverter`)
  - [x] 5.2 Add `export * from './csv'` to `src/utils/index.ts` (alphabetically between `'./color'` and `'./dashboard'`)

- [x] Task 6: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [x] 6.1 Run `pnpm lint` — no errors
  - [x] 6.2 Run `pnpm format:check` — no formatting issues
  - [x] 6.3 Run `pnpm test` — all tests pass (383 existing + ~33 new = ~416)
  - [x] 6.4 Run `pnpm build` — build succeeds, tool chunk is separate, no impact on initial bundle

## Dev Notes

### CRITICAL: Follow JsonToYamlConverter Two-Mode Dialog Pattern (Simplified — No Async)

This tool uses the **two-mode pattern** from `JsonToYamlConverter.tsx` — two buttons on the card that each open a dialog in a specific mode. **Key difference from YAML**: CSV conversion is **synchronous** (pure string processing, no dynamic imports), so:

1. **No `sessionRef` needed** — no async race conditions to guard against
2. **No `async/await` in process function** — `jsonToCsv()` and `csvToJson()` are sync
3. **No dynamic imports** — no external library, all native JavaScript
4. **Same UI pattern** — two buttons on card, mode-switching dialog, source/result textareas with divider

### UI Layout

Identical to JsonToYamlConverter pattern:
- **Card view:** Tool description + two action buttons ("JSON → CSV", "CSV → JSON")
- **Dialog view:**
  - **Left side:** `FieldForm` textarea for pasting source (label: "JSON Input" or "CSV Input")
  - **Divider:** `border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2`
  - **Right side:** `FieldForm` textarea for converted output with `CopyButton` in label (label: "CSV Output" or "JSON Output"), disabled when no result
  - **Bottom:** Error message (if any)

### CSV Library Decision: No External Library Needed

**Decision:** Implement CSV parsing/serialization natively — no npm package needed.

**Rationale:**
- CSV is a simple, well-defined format (RFC 4180)
- The parsing logic is ~50-80 lines of code
- Avoids adding a dependency for something trivially implementable
- No code-splitting or dynamic import complexity needed
- Zero bundle impact beyond the tool's own chunk
- The only tricky part is quoted field parsing, which is well-documented

**RFC 4180 rules to implement:**
1. Fields separated by commas
2. Records separated by CRLF (accept both `\n` and `\r\n`)
3. First record is header
4. Fields containing commas, newlines, or double quotes MUST be enclosed in double quotes
5. Double quotes within quoted fields escaped as `""`

### Conversion Logic

```typescript
// JSON → CSV
const parsed = JSON.parse(jsonString)        // validate JSON
// validate: Array.isArray(parsed), each item is object
const headers = extractHeaders(parsed)       // union of all keys, alphabetical
const rows = parsed.map(obj => headers.map(h => formatCsvField(getNestedValue(obj, h))))
return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

// CSV → JSON
const rows = parseCsvRows(csvString)         // RFC 4180 parser
const headers = rows[0]
const objects = rows.slice(1).map(row =>
  Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']))
)
return JSON.stringify(objects, null, 2)
```

### Nested Object Flattening Strategy

For JSON→CSV, nested objects are flattened using dot-notation:
```json
{"user": {"name": "Alice", "address": {"city": "NYC"}}}
```
Produces headers: `user.name`, `user.address.city` with corresponding values.

Arrays within objects are JSON-stringified:
```json
{"tags": ["dev", "tools"]}
```
Produces: `tags` column with value `"[""dev"",""tools""]"` (quoted because it contains commas)

### Error Messages

| Scenario | Error Message |
|----------|--------------|
| Empty input | (clear output, no error — matches YAML pattern) |
| Invalid JSON (parse error) | `Invalid JSON: {SyntaxError message}` |
| JSON is not an array | `JSON must be an array of objects (e.g., [{"name": "Alice"}])` |
| Array contains non-objects | `All array items must be objects` |
| Empty CSV (after trim) | (clear output, no error) |

### Architecture Compliance

- **TOOL_REGISTRY entry required** — tool must be discoverable via sidebar, command palette, dashboard selection dialog, and direct URL. The dashboard is a fixed 6-slot favorites grid — new tools do NOT auto-appear there [Source: architecture.md#Tool Registry]
- **Data category already exists** — `'Data'` was added to `ToolCategory` in story 6-1. No type update needed for category. [Source: src/types/constants/tool-registry.ts]
- **Named export only** — `export const JsonToCsvConverter` (never `export default`) [Source: project-context.md#Named exports]
- **Lazy-loaded component** — registry uses `lazy(() => import(...).then(({ JsonToCsvConverter }) => ({ default: JsonToCsvConverter })))` [Source: architecture.md#Code Splitting]
- **100% client-side** — native JS string processing only, zero network requests [Source: architecture.md#Hard Constraints]
- **No external CSV library** — pure JavaScript implementation, zero bundle impact beyond the tool's own chunk [Source: NFR8]

### Library & Framework Requirements

- **No new dependencies** — this tool uses only native JavaScript for CSV processing
- **Existing imports used:** `useState` from React, `Button`, `CopyButton`, `Dialog`, `FieldForm` from `@/components/common`, `TOOL_REGISTRY_MAP` from `@/constants`, `useDebounceCallback`, `useToolError` from `@/hooks`, `getJsonParseError` from `@/utils/json`

### File Structure Requirements

**Files to CREATE:**

```
src/utils/csv.ts                                     — jsonToCsv(), csvToJson(), getCsvParseError() sync functions
src/utils/csv.spec.ts                                — Unit tests for CSV conversion utilities
src/components/feature/data/JsonToCsvConverter.tsx    — JSON↔CSV Converter component
```

**Files to MODIFY:**

```
src/utils/index.ts                            — Add barrel export for csv utils
src/components/feature/data/index.ts          — Add barrel export for JsonToCsvConverter
src/constants/tool-registry.ts                — Add JSON↔CSV Converter registry entry
src/types/constants/tool-registry.ts          — Add 'json-to-csv-converter' to ToolRegistryKey
vite.config.ts                                — Add JSON↔CSV Converter pre-render route
```

**Files NOT to modify:**
- `package.json` — no new dependencies needed
- `pnpm-lock.yaml` — no dependency changes
- `src/components/feature/index.ts` — already exports from `'./data'` (done in story 6-1)
- `src/types/constants/tool-registry.ts` ToolCategory — `'Data'` already exists (done in story 6-1)
- `src/utils/json.ts` — `getJsonParseError` reused as-is for JSON validation
- `src/components/common/sidebar/Sidebar.tsx` — `'Data'` already in `CATEGORY_ORDER` (done in story 6-1)
- Any existing tool components

### Testing Requirements

**Unit tests (`src/utils/csv.spec.ts`):**

```typescript
import { describe, expect, it } from 'vitest'

import { csvToJson, getCsvParseError, jsonToCsv } from '@/utils/csv'

describe('csv conversion utilities', () => {
  describe('jsonToCsv', () => {
    it('should convert simple array of flat objects', () => {
      const result = jsonToCsv('[{"name":"Alice","age":30},{"name":"Bob","age":25}]')
      expect(result).toBe('age,name\n30,Alice\n25,Bob')
    })

    it('should flatten nested objects with dot-notation headers', () => {
      const result = jsonToCsv('[{"user":{"name":"Alice","city":"NYC"}}]')
      expect(result).toContain('user.city,user.name')
      expect(result).toContain('NYC,Alice')
    })

    it('should quote values containing commas', () => {
      const result = jsonToCsv('[{"name":"Smith, Jr.","age":40}]')
      expect(result).toContain('"Smith, Jr."')
    })

    it('should escape double quotes within values', () => {
      const result = jsonToCsv('[{"quote":"He said \\"hello\\""}]')
      expect(result).toContain('"He said ""hello"""')
    })

    it('should quote values containing newlines', () => {
      const result = jsonToCsv('[{"text":"line1\\nline2"}]')
      expect(result).toContain('"line1\nline2"')
    })

    it('should handle Unicode content', () => {
      const result = jsonToCsv('[{"emoji":"🎉","cjk":"日本語"}]')
      expect(result).toContain('🎉')
      expect(result).toContain('日本語')
    })

    it('should handle empty array', () => {
      expect(() => jsonToCsv('[]')).toThrow('JSON must be an array of objects')
    })

    it('should handle single-item array', () => {
      const result = jsonToCsv('[{"a":1}]')
      expect(result).toBe('a\n1')
    })

    it('should handle objects with different key sets (union of all keys)', () => {
      const result = jsonToCsv('[{"a":1,"b":2},{"b":3,"c":4}]')
      expect(result).toContain('a,b,c')
      expect(result).toContain('1,2,')
      expect(result).toContain(',3,4')
    })

    it('should throw on empty string', () => {
      expect(() => jsonToCsv('')).toThrow('Empty input')
    })

    it('should throw on whitespace-only string', () => {
      expect(() => jsonToCsv('   ')).toThrow('Empty input')
    })

    it('should throw on non-array JSON (object)', () => {
      expect(() => jsonToCsv('{"a":1}')).toThrow('JSON must be an array of objects')
    })

    it('should throw on non-array JSON (string)', () => {
      expect(() => jsonToCsv('"hello"')).toThrow('JSON must be an array of objects')
    })

    it('should throw on array of non-objects', () => {
      expect(() => jsonToCsv('[1,2,3]')).toThrow('All array items must be objects')
    })

    it('should throw on invalid JSON', () => {
      expect(() => jsonToCsv('{invalid}')).toThrow()
    })

    it('should JSON-stringify array values in cells', () => {
      const result = jsonToCsv('[{"tags":["dev","tools"]}]')
      expect(result).toContain('tags')
      // Array is stringified and quoted (contains commas)
      expect(result).toMatch(/"\[.*dev.*tools.*\]"/)
    })

    it('should handle null and boolean values', () => {
      const result = jsonToCsv('[{"active":true,"deleted":false,"note":null}]')
      expect(result).toContain('true')
      expect(result).toContain('false')
      expect(result).toContain('null') // or empty string for null
    })

    it('should handle large dataset', () => {
      const arr = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `user${i}` }))
      const result = jsonToCsv(JSON.stringify(arr))
      const lines = result.split('\n')
      expect(lines.length).toBe(101) // 1 header + 100 rows
    })
  })

  describe('csvToJson', () => {
    it('should convert simple CSV to array of objects', () => {
      const result = csvToJson('name,age\nAlice,30\nBob,25')
      const parsed = JSON.parse(result)
      expect(parsed).toHaveLength(2)
      expect(parsed[0]).toEqual({ name: 'Alice', age: '30' })
    })

    it('should handle quoted fields containing commas', () => {
      const result = csvToJson('name,title\nAlice,"CTO, Inc"')
      const parsed = JSON.parse(result)
      expect(parsed[0].title).toBe('CTO, Inc')
    })

    it('should handle quoted fields containing newlines', () => {
      const result = csvToJson('name,bio\nAlice,"line1\nline2"')
      const parsed = JSON.parse(result)
      expect(parsed[0].bio).toBe('line1\nline2')
    })

    it('should handle escaped double quotes inside quoted fields', () => {
      const result = csvToJson('name,quote\nAlice,"He said ""hello"""')
      const parsed = JSON.parse(result)
      expect(parsed[0].quote).toBe('He said "hello"')
    })

    it('should handle CRLF line endings', () => {
      const result = csvToJson('name,age\r\nAlice,30\r\nBob,25')
      const parsed = JSON.parse(result)
      expect(parsed).toHaveLength(2)
    })

    it('should handle trailing newline without creating empty row', () => {
      const result = csvToJson('name\nAlice\n')
      const parsed = JSON.parse(result)
      expect(parsed).toHaveLength(1)
    })

    it('should handle empty field values', () => {
      const result = csvToJson('a,b,c\n1,,3')
      const parsed = JSON.parse(result)
      expect(parsed[0]).toEqual({ a: '1', b: '', c: '3' })
    })

    it('should handle header-only CSV (no data rows)', () => {
      const result = csvToJson('name,age')
      const parsed = JSON.parse(result)
      expect(parsed).toHaveLength(0)
    })

    it('should throw on empty string', () => {
      expect(() => csvToJson('')).toThrow('Empty input')
    })

    it('should throw on whitespace-only string', () => {
      expect(() => csvToJson('   ')).toThrow('Empty input')
    })

    it('should support custom indent', () => {
      const result = csvToJson('a\n1', 4)
      expect(result).toContain('    "a"')
    })
  })

  describe('getCsvParseError', () => {
    it('should return null for valid CSV', () => {
      expect(getCsvParseError('name,age\nAlice,30')).toBeNull()
    })

    it('should return error for empty input', () => {
      expect(getCsvParseError('')).toBe('Empty input')
    })

    it('should return error for whitespace-only input', () => {
      expect(getCsvParseError('   ')).toBe('Empty input')
    })
  })

  describe('round-trip consistency', () => {
    it('should preserve data through JSON→CSV→JSON round-trip', () => {
      const original = '[{"name":"Alice","age":"30"},{"name":"Bob","age":"25"}]'
      const csv = jsonToCsv(original)
      const roundTripped = csvToJson(csv)
      expect(JSON.parse(roundTripped)).toEqual(JSON.parse(original))
    })

    it('should preserve data through CSV→JSON→CSV round-trip', () => {
      const original = 'age,name\n30,Alice\n25,Bob'
      const json = csvToJson(original)
      const roundTripped = jsonToCsv(json)
      expect(roundTripped).toBe(original)
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
    import('@/components/feature/data/JsonToCsvConverter').then(
      ({ JsonToCsvConverter }: { JsonToCsvConverter: ComponentType }) => ({
        default: JsonToCsvConverter,
      }),
    ),
  ),
  description: 'Convert between JSON arrays and CSV spreadsheet format',
  emoji: '📊',
  key: 'json-to-csv-converter',
  name: 'JSON ↔ CSV',
  routePath: '/tools/json-to-csv-converter',
  seo: {
    description:
      'Convert JSON to CSV and CSV to JSON online. Transform data between formats for spreadsheets and APIs instantly in your browser.',
    title: 'JSON to CSV Converter - CSR Dev Tools',
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
  | 'json-to-csv-converter'
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
    'Convert JSON to CSV and CSV to JSON online. Transform data between formats for spreadsheets and APIs instantly in your browser.',
  path: '/tools/json-to-csv-converter',
  title: 'JSON to CSV Converter - CSR Dev Tools',
  url: '/tools/json-to-csv-converter',
},
```

### Previous Story Intelligence

From Story 6-2 (JSON to YAML Converter — same epic, completed):
- **Same domain directory** — `src/components/feature/data/` already has `JsonFormatter.tsx`, `JsonToYamlConverter.tsx` and `index.ts` barrel
- **Data category already registered** — `'Data'` in `ToolCategory` and `CATEGORY_ORDER` already done
- **Feature barrel already updated** — `export * from './data'` in `src/components/feature/index.ts` already done
- **Two-mode dialog pattern proven** — `JsonToYamlConverter.tsx` works cleanly; this story uses same pattern but simplified (sync, not async)
- **Build verified** — test file uses explicit vitest imports (`import { describe, expect, it } from 'vitest'`) — DO THIS from the start
- **Code review found stale async results in 6-2** — NOT a concern here since CSV processing is sync (no `sessionRef` needed)
- **Code review found null guard needed for error messages in 6-2** — Apply same pattern: check if error message exists before wrapping
- **Code review found trim check for empty input in 6-2** — Use `val.trim().length` not `val.length` for empty check
- **383 tests exist** — expect ~416+ after adding CSV tests (~33 new)
- **`getJsonParseError` reusable** — already in `src/utils/json.ts`, import and reuse for JSON mode validation
- **Commit prefix:** Use `✨: story 6-3 JSON to CSV Converter`

### Git Intelligence

Recent commits analyzed:
```
016f81a ✨: story 6-2 JSON to YAML Converter
dbbf974 ✨: story 6-1 JSON Formatter/Validator
e07fe59 🐛: replace dead default breakpoints with custom tablet/laptop/desktop
4e65239 💄: min height
f8e8266 ✨: story 5-2 JWT Decoder
57dab9e ✨: story 5-1 URL Encoder/Decoder
```

**Pattern:** New tool feature uses `✨: story X-Y Tool Name` commit prefix.
**Files in story 6-2:** utility function, utility tests, tool component, registry entry, types, barrel exports, vite.config.ts. This story follows the same pattern with no new dependencies.

### Project Structure Notes

- **Domain directory exists:** `src/components/feature/data/` created in story 6-1 — just add the new component file
- **No type file needed** — component has no custom props (follows JsonToYamlConverter, JsonFormatter patterns)
- **New utility file:** `src/utils/csv.ts` — parallel to `src/utils/json.ts`, `src/utils/yaml.ts`
- **Tests co-located:** `src/utils/csv.spec.ts` — parallel to `src/utils/json.spec.ts`, `src/utils/yaml.spec.ts`
- **No new dependency** — first Data tool that requires zero additional packages

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.3] — Full AC definitions and story requirements
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6] — Epic objectives and FR coverage (FR19)
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Registry] — Registry entry pattern with all required fields
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — `json-to-csv-converter` key, `Data` category
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Text conversion: on input change, 150ms debounce
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Message Format] — Concise, actionable, with example of valid input
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Tool component file structure, data/ directory
- [Source: _bmad-output/planning-artifacts/architecture.md#Hard Constraints] — Zero server-side processing
- [Source: _bmad-output/project-context.md] — 53 project rules (named exports, type not interface, etc.)
- [Source: src/components/feature/data/JsonToYamlConverter.tsx] — Primary reference implementation pattern (two-mode dialog, sync simplification)
- [Source: src/components/feature/data/JsonFormatter.tsx] — Sibling tool reference (same domain, single-mode dialog)
- [Source: src/utils/json.ts] — getJsonParseError reused for JSON mode validation
- [Source: src/utils/json.spec.ts] — Test pattern reference for utility tests
- [Source: src/utils/yaml.ts] — YAML conversion pattern reference (async — CSV will be sync instead)
- [Source: src/constants/tool-registry.ts] — Current registry with 10 tools, alphabetical ordering
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey and ToolCategory unions to update
- [Source: src/hooks/useToolError.ts] — Error handling hook
- [Source: src/hooks/useDebounceCallback.ts] — Debounce utility (150ms)
- [Source: vite.config.ts] — Pre-render routes pattern (MUST add route)
- [Source: _bmad-output/implementation-artifacts/6-2-json-to-yaml-converter.md] — Previous story learnings (same epic)
- [Source: https://www.rfc-editor.org/rfc/rfc4180] — RFC 4180: Common Format and MIME Type for CSV Files

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with all tests passing on first run.

### Completion Notes List

- Implemented `src/utils/csv.ts` with `jsonToCsv()`, `csvToJson()`, and `getCsvParseError()` — all synchronous, RFC 4180-compliant, with nested object flattening via dot-notation
- Created 34 unit tests in `src/utils/csv.spec.ts` covering all conversion scenarios, edge cases, error handling, and round-trip consistency
- Built `JsonToCsvConverter.tsx` following the two-mode dialog pattern from `JsonToYamlConverter.tsx` — simplified (no `sessionRef` since all processing is synchronous)
- Registered tool in `TOOL_REGISTRY` with lazy-loaded component, SEO metadata, and pre-render route
- All 417 tests pass (383 existing + 34 new), lint clean, format clean, build succeeds with separate chunk (4.28 kB)

### Change Log

- 2026-02-14: Story 6-3 JSON to CSV Converter implemented — all 6 tasks completed, all ACs satisfied
- 2026-02-14: Code review fixes — error messages now include examples (architecture compliance), empty array gets distinct error, CSV parser preserves mid-field quotes, getCsvParseError detects unterminated quoted fields, 5 new tests added (422 total)

### File List

**Created:**
- `src/utils/csv.ts` — CSV conversion utility functions (jsonToCsv, csvToJson, getCsvParseError)
- `src/utils/csv.spec.ts` — 34 unit tests for CSV conversion utilities
- `src/components/feature/data/JsonToCsvConverter.tsx` — JSON↔CSV Converter component with two-mode dialog

**Modified:**
- `src/utils/index.ts` — Added barrel export for csv utils
- `src/components/feature/data/index.ts` — Added barrel export for JsonToCsvConverter
- `src/constants/tool-registry.ts` — Added JSON↔CSV Converter registry entry
- `src/types/constants/tool-registry.ts` — Added 'json-to-csv-converter' to ToolRegistryKey
- `vite.config.ts` — Added JSON↔CSV Converter pre-render route
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Updated story status
