---
story: 20.1
title: JSON Schema Validator
status: ready-for-dev
epic: 20
---

# Story 20.1: JSON Schema Validator

Status: review

## Story

As a **user**,
I want **to paste JSON data and a JSON Schema, then see validation results with specific error paths**,
So that **I can verify my JSON conforms to a schema without running external tools**.

**Epic:** Epic 20 — Advanced Developer Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (CopyButton, FieldForm — complete)
**Story Key:** 20-1-json-schema-validator

## Acceptance Criteria

### AC1: Tool Registered and Renders with Dialog

**Given** the JSON Schema Validator tool registered in `TOOL_REGISTRY` under the Code category
**When** the user navigates to it (via sidebar, command palette, or `/tools/json-schema-validator` route)
**Then** it renders inline with a button to open the dialog
**And** a one-line description is shown from the registry entry
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Two Textarea Inputs in Dialog

**Given** the dialog is open
**When** the user sees the layout
**Then** two large textareas are shown side-by-side (stacked on mobile): "JSON Data" (left) and "JSON Schema" (right)
**And** each has placeholder text showing an example
**And** a "Validate" button triggers validation

### AC3: Valid JSON Shows Success

**Given** valid JSON data and a valid JSON Schema
**When** the user clicks "Validate" or input changes (debounced 300ms)
**Then** a green success banner shows "✅ Valid — JSON conforms to the schema"
**And** the result area uses `aria-live="polite"`

### AC4: Invalid JSON Shows Error List

**Given** JSON data that fails schema validation
**When** validated
**Then** a red error section shows each validation error with:
  - JSON path (e.g., `/properties/age`)
  - Error message (e.g., `must be number`)
  - Schema keyword that failed (e.g., `type`)
**And** errors are listed in order

### AC5: Malformed JSON/Schema Shows Parse Error

**Given** syntactically invalid JSON in either textarea
**When** the user triggers validation
**Then** a clear error message identifies which textarea has the syntax error
**And** validation does not proceed

### AC6: Sensible Defaults

**Given** the dialog opens
**When** the tool loads
**Then** the textareas are empty with guiding placeholder text
**And** no validation result is shown until input is provided

### AC7: Unit Tests Cover Validation Logic

**Given** unit tests in `src/utils/json-schema.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: valid data passes, invalid data returns errors with paths, malformed JSON returns parse error, empty inputs, complex nested schema, array validation, required fields check

## Tasks / Subtasks

- [x] Task 1: Install ajv dependency (AC: #3, #4)
  - [x] 1.1 Run `pnpm add ajv` — adds JSON Schema validator (draft-07)
  - [x] 1.2 Verify `ajv` appears in `package.json` dependencies

- [x] Task 2: Create json-schema utility (AC: #3, #4, #5, #7)
  - [x] 2.1 Create `src/utils/json-schema.ts`
  - [x] 2.2 Define `ValidationResult` type: `{ valid: boolean, errors: Array<{ path: string, message: string, keyword: string }> | null }`
  - [x] 2.3 Implement `validateJsonSchema(data: string, schema: string): ValidationResult`
  - [x] 2.4 Parse both inputs with `JSON.parse` — return descriptive parse error if either fails (identify which input)
  - [x] 2.5 Use `Ajv` with `allErrors: true` for comprehensive error reporting
  - [x] 2.6 Map ajv errors to `{ path: error.instancePath || '/', message: error.message, keyword: error.keyword }`
  - [x] 2.7 Export `validateJsonSchema`, `ValidationResult`

- [x] Task 3: Write unit tests (AC: #7)
  - [x] 3.1 Create `src/utils/json-schema.spec.ts`
  - [x] 3.2 Test valid data against matching schema returns `{ valid: true, errors: null }`
  - [x] 3.3 Test invalid type returns error with correct path and "type" keyword
  - [x] 3.4 Test missing required field returns error with "required" keyword
  - [x] 3.5 Test array items validation (wrong item type)
  - [x] 3.6 Test nested object validation with deep path
  - [x] 3.7 Test malformed JSON data string returns parse error
  - [x] 3.8 Test malformed schema string returns parse error
  - [x] 3.9 Test empty string inputs
  - [x] 3.10 Test multiple errors returned with `allErrors: true`

- [x] Task 4: Create JsonSchemaValidator component (AC: #1, #2, #3, #4, #5, #6)
  - [x] 4.1 Create `src/components/feature/code/JsonSchemaValidator.tsx` as named export
  - [x] 4.2 Inline view: tool description + "Validate" button to open dialog
  - [x] 4.3 Dialog (size="screen"): two textareas side-by-side via `FieldForm` type="textarea" rows={16}
  - [x] 4.4 Left textarea: "JSON Data" — placeholder: `{"name": "John", "age": 30}`
  - [x] 4.5 Right textarea: "JSON Schema" — placeholder: `{"type": "object", "properties": {"name": {"type": "string"}}}`
  - [x] 4.6 Validate on input change with 300ms debounce via `useDebounceCallback`
  - [x] 4.7 Success state: green banner with ✅ icon
  - [x] 4.8 Error state: red-bordered list of errors showing path, message, keyword
  - [x] 4.9 Parse error state: single error message identifying which input failed
  - [x] 4.10 Reset state on dialog close via `onAfterClose`
  - [x] 4.11 Accept `ToolComponentProps` (`autoOpen`, `onAfterDialogClose`)

- [x] Task 5: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 5.1 Add `'json-schema-validator'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts`
  - [x] 5.2 Add registry entry to `TOOL_REGISTRY` in `src/constants/tool-registry.ts` (Code category, ✅ emoji)
  - [x] 5.3 Add pre-render route in `vite.config.ts`

- [x] Task 6: Create barrel exports (AC: #1)
  - [x] 6.1 Add `export { JsonSchemaValidator } from './JsonSchemaValidator'` to `src/components/feature/code/index.ts`
  - [x] 6.2 Add `export * from './json-schema'` to `src/utils/index.ts`

- [x] Task 7: Verify integration (AC: #1–#7)
  - [x] 7.1 Run `pnpm lint` — no errors
  - [x] 7.2 Run `pnpm format:check` — no formatting issues
  - [x] 7.3 Run `pnpm test` — all tests pass (825/825)
  - [x] 7.4 Run `pnpm build` — build succeeds

## Dev Notes

### New Dependency: ajv

This story requires adding `ajv` as a new dependency. Use `pnpm add ajv`.

**Critical:** Import `Ajv` lazily inside the utility function or use dynamic import in the component to keep the main bundle small. The ajv library is ~120KB minified — it should only load when the tool is used.

```typescript
// Lazy import pattern in utility:
import Ajv from 'ajv'
// This is fine because the entire tool is code-split via registry lazy loading
```

### Dialog Pattern — Follow JsonFormatter

This tool follows the exact same pattern as `JsonFormatter.tsx` (dialog-based, two textareas). Key similarities:

| Aspect | JsonFormatter | JsonSchemaValidator |
|--------|--------------|-------------------|
| Layout | Dialog, size="screen" | Dialog, size="screen" |
| Inputs | 1 textarea | 2 textareas side-by-side |
| Processing | Debounced 300ms | Debounced 300ms |
| Props | `ToolComponentProps` | `ToolComponentProps` |
| Reset | `onAfterClose` clears state | `onAfterClose` clears state |

### UI Layout (Dialog)

```
┌─── Dialog: JSON Schema Validator ────────────────────────────────┐
│                                                                   │
│  ┌─── JSON Data ──────────────┐ │ ┌─── JSON Schema ────────────┐ │
│  │                            │ │ │                             │ │
│  │ {"name": "John",           │ │ │ {"type": "object",          │ │
│  │  "age": 30}                │ │ │  "required": ["name"],      │ │
│  │                            │ │ │  "properties": {            │ │
│  │                            │ │ │    "name": {"type":"string"}│ │
│  │                            │ │ │  }}                         │ │
│  └────────────────────────────┘ │ └─────────────────────────────┘ │
│                                                                   │
│  ┌─── Result ────────────────────────────────────────────────────┐│
│  │ ✅ Valid — JSON conforms to the schema                        ││
│  └───────────────────────────────────────────────────────────────┘│
│                                                                   │
│  OR                                                               │
│                                                                   │
│  ┌─── Errors ────────────────────────────────────────────────────┐│
│  │ ❌ /age — must be number (keyword: type)                      ││
│  │ ❌ /  — must have required property 'email' (keyword: required)│
│  └───────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────┘
```

### Utility Implementation

```typescript
// src/utils/json-schema.ts
import Ajv from 'ajv'

export type ValidationError = {
  keyword: string
  message: string
  path: string
}

export type ValidationResult = {
  errors: Array<ValidationError> | null
  valid: boolean
}

export function validateJsonSchema(data: string, schema: string): ValidationResult {
  // Parse JSON data
  let parsedData: unknown
  try {
    parsedData = JSON.parse(data)
  } catch {
    return { errors: [{ keyword: 'parse', message: 'Invalid JSON in data input', path: '/' }], valid: false }
  }

  // Parse JSON Schema
  let parsedSchema: Record<string, unknown>
  try {
    parsedSchema = JSON.parse(schema)
  } catch {
    return { errors: [{ keyword: 'parse', message: 'Invalid JSON in schema input', path: '/' }], valid: false }
  }

  const ajv = new Ajv({ allErrors: true })
  const validate = ajv.compile(parsedSchema)
  const valid = validate(parsedData)

  if (valid) {
    return { errors: null, valid: true }
  }

  const errors: Array<ValidationError> = (validate.errors ?? []).map((err) => ({
    keyword: err.keyword,
    message: err.message ?? 'Unknown error',
    path: err.instancePath || '/',
  }))

  return { errors, valid: false }
}
```

### Architecture Compliance

- **Named export only** — `export const JsonSchemaValidator`
- **Lazy-loaded** — code split via registry (ajv only loads when tool is used)
- **100% client-side** — ajv runs entirely in the browser
- **Dialog pattern** — follows `JsonFormatter.tsx` exactly
- **ToolComponentProps** — accepts `autoOpen`, `onAfterDialogClose`
- **useDebounceCallback** — 300ms debounce on textarea changes
- **useToast** — for parse errors (matches JsonFormatter pattern)
- **aria-live="polite"** — on result area

### TOOL_REGISTRY Entry

```typescript
{
  category: 'Code',
  component: lazy(() =>
    import('@/components/feature/code/JsonSchemaValidator').then(
      ({ JsonSchemaValidator }: { JsonSchemaValidator: ComponentType }) => ({
        default: JsonSchemaValidator,
      }),
    ),
  ),
  description: 'Validate JSON data against a JSON Schema (draft-07) and see detailed error paths',
  emoji: '✅',
  key: 'json-schema-validator',
  name: 'JSON Schema Validator',
  routePath: '/tools/json-schema-validator',
  seo: {
    description:
      'Validate JSON data against a JSON Schema (draft-07). See validation errors with JSON paths and keywords — all in the browser.',
    title: 'JSON Schema Validator - CSR Dev Tools',
  },
}
```

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/utils/json-schema.ts` | NEW | validateJsonSchema(), ValidationResult type |
| `src/utils/json-schema.spec.ts` | NEW | Unit tests (~10 tests) |
| `src/components/feature/code/JsonSchemaValidator.tsx` | NEW | JSON Schema Validator component |
| `src/types/constants/tool-registry.ts` | MODIFY | Add 'json-schema-validator' to ToolRegistryKey |
| `src/constants/tool-registry.ts` | MODIFY | Add registry entry |
| `src/components/feature/code/index.ts` | MODIFY | Add barrel export |
| `src/utils/index.ts` | MODIFY | Add json-schema barrel export |
| `vite.config.ts` | MODIFY | Add pre-render route |
| `package.json` | MODIFY | Add ajv dependency |

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion.md#Story 20.1]
- [Source: src/components/feature/data/JsonFormatter.tsx] — Dialog pattern with two textareas
- [Source: src/constants/tool-registry.ts] — Registry entry format
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey union
- [Source: src/components/feature/code/index.ts] — Code category barrel
- [Source: ajv documentation] — JSON Schema validation library (draft-07)

## Dev Agent Record

### Agent Model Used
Claude Opus 4 (via OpenClaw subagent)

### Debug Log References
No issues encountered.

### Completion Notes List
- Installed ajv@8.18.0 dependency
- Created `src/utils/json-schema.ts` with `validateJsonSchema()`, `ValidationResult`, `ValidationError` types
- Created `src/utils/json-schema.spec.ts` with 10 comprehensive tests (valid, invalid type, required, arrays, nested, parse errors, empty inputs, allErrors)
- Created `src/components/feature/code/JsonSchemaValidator.tsx` — dialog-based, two side-by-side textareas, 300ms debounce, success/error/parse-error states, aria-live, ToolComponentProps
- Registered in TOOL_REGISTRY (Code category, ✅ emoji, key: json-schema-validator)
- Added to ToolRegistryKey union type
- Added barrel exports in code/index.ts and utils/index.ts
- Added pre-render route in vite.config.ts
- All 825 tests pass, typecheck clean

### Change Log
- 2026-02-17: Implemented JSON Schema Validator tool (Story 20.1) — utility, tests, component, registry, exports

### File List
- `package.json` — MODIFIED (added ajv dependency)
- `src/utils/json-schema.ts` — NEW
- `src/utils/json-schema.spec.ts` — NEW
- `src/components/feature/code/JsonSchemaValidator.tsx` — NEW
- `src/types/constants/tool-registry.ts` — MODIFIED (added json-schema-validator key)
- `src/constants/tool-registry.ts` — MODIFIED (added registry entry)
- `src/components/feature/code/index.ts` — MODIFIED (barrel export)
- `src/utils/index.ts` — MODIFIED (barrel export)
- `vite.config.ts` — MODIFIED (pre-render route)
