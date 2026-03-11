# Story 25.2: Protobuf to JSON

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **to paste .proto definitions and see corresponding JSON structures with default values for each field type**,
so that **I can understand the JSON shape of Protobuf messages without running protoc or setting up a protobuf toolchain**.

## Acceptance Criteria

1. **Given** the user pastes a valid .proto file with message definitions
   **When** parsed (debounced 300ms)
   **Then** all message types are listed in a browsable list/sidebar

2. **Given** the user selects a message type
   **When** selected
   **Then** a sample JSON structure is generated with default values for each field type

3. **Given** nested messages or repeated fields
   **When** JSON is generated
   **Then** nested objects and arrays are correctly represented

4. **Given** invalid .proto syntax
   **When** pasted
   **Then** parsing errors are shown inline with line context (e.g., "Syntax error at line X: {message}")

5. **Given** enum fields in the proto
   **When** JSON is generated
   **Then** the first enum value name is used as default, with all enum values listed in a comment/tooltip

## Tasks / Subtasks

- [x] Task 1: Install protobufjs package (AC: all)
  - [x] 1.1 Run `pnpm add protobufjs` — the official Protocol Buffers library for JavaScript. `.npmrc` enforces `save-exact=true` automatically.
  - [x] 1.2 Verify `package.json` has the exact version pinned (no `^` or `~`)
  - [x] 1.3 Verify the package works in browser without Node.js polyfills (it does — uses standard browser APIs)

- [x] Task 2: Create Protobuf parsing utility functions (AC: #1, #2, #3, #4, #5)
  - [x] 2.1 Create `src/utils/protobuf-to-json.ts`
  - [x] 2.2 Define types (in the utility file — following graphql-schema-viewer pattern):
    - `ProtobufFieldInfo = { name: string, type: string, id: number, rule: 'repeated' | 'required' | 'optional' | undefined, isMap: boolean, resolvedKind: 'message' | 'enum' | 'scalar', resolvedTypeName: string | null, description: string | null }`
    - `ProtobufEnumInfo = { name: string, fullName: string, values: Record<string, number> }`
    - `ProtobufMessageInfo = { name: string, fullName: string, fields: Array<ProtobufFieldInfo>, nestedMessages: Array<ProtobufMessageInfo>, nestedEnums: Array<ProtobufEnumInfo>, oneofs: Array<{ name: string, fieldNames: Array<string> }> }`
    - `ProtobufSchemaInfo = { package: string | null, syntax: string | null, messages: Array<ProtobufMessageInfo>, enums: Array<ProtobufEnumInfo> }`
    - `ProtobufParseResult = { success: true, schema: ProtobufSchemaInfo } | { success: false, error: string, line: number | null }`
  - [x] 2.3 Implement `parseProtobufSchema(protoSource: string): ProtobufParseResult`
    - Uses `protobuf.parse(source)` from `protobufjs` (synchronous, string-based — NO file I/O)
    - Calls `root.resolveAll()` to resolve all type references
    - Recursively extracts messages, enums, fields from the parsed `Root` object
    - Catches parsing errors and extracts line numbers from error messages (pattern: `/line (\d+)/`)
    - Returns `{ success: true, schema }` or `{ success: false, error, line }`
  - [x] 2.4 Implement `generateSampleJson(message: ProtobufMessageInfo, allMessages: Array<ProtobufMessageInfo>, allEnums: Array<ProtobufEnumInfo>, visited?: Set<string>): Record<string, unknown>`
    - Generates sample JSON with proto3 default values for each scalar type
    - Handles nested messages by recursion (with cycle detection via `visited` Set)
    - Handles repeated fields by wrapping value in `[value]`
    - Handles enum fields by using the first enum value name (string)
    - Handles map fields by showing `{}` (empty object)
    - Handles oneof by including all fields (developer sees all possible shapes)
    - Returns the generated sample JSON object
  - [x] 2.5 Define the scalar default values map:
    - `string` → `""`, `bool` → `false`
    - `int32`, `sint32`, `uint32`, `fixed32`, `sfixed32`, `float`, `double` → `0`
    - `int64`, `sint64`, `uint64`, `fixed64`, `sfixed64` → `"0"` (string for 64-bit safety)
    - `bytes` → `""` (base64 empty)
  - [x] 2.6 Add barrel export in `src/utils/index.ts`: `export * from './protobuf-to-json'` (alphabetical placement)

- [x] Task 3: Create unit tests for Protobuf utility functions (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Create `src/utils/protobuf-to-json.spec.ts`
  - [x] 3.2 Test `parseProtobufSchema` with valid proto3 schema containing messages, enums, nested types — returns `success: true` with correct counts
  - [x] 3.3 Test `parseProtobufSchema` with invalid proto syntax — returns `success: false` with error message and line number
  - [x] 3.4 Test `parseProtobufSchema` with empty string — returns error
  - [x] 3.5 Test `parseProtobufSchema` extracts fields with correct types, rules (repeated, optional), and ids
  - [x] 3.6 Test `parseProtobufSchema` extracts enum values correctly
  - [x] 3.7 Test `parseProtobufSchema` handles nested messages within messages
  - [x] 3.8 Test `parseProtobufSchema` handles oneof groups
  - [x] 3.9 Test `parseProtobufSchema` handles map fields
  - [x] 3.10 Test `generateSampleJson` with all scalar types — produces correct defaults
  - [x] 3.11 Test `generateSampleJson` with nested message field — produces nested object
  - [x] 3.12 Test `generateSampleJson` with repeated field — produces array
  - [x] 3.13 Test `generateSampleJson` with enum field — uses first enum value name
  - [x] 3.14 Test `generateSampleJson` with self-referencing message — handles cycle (returns `{}` for circular ref)
  - [x] 3.15 Test `parseProtobufSchema` with proto2 syntax — parses correctly
  - [x] 3.16 Test `parseProtobufSchema` extracts package name

- [x] Task 4: Create ProtobufToJson component (AC: #1, #2, #3, #4, #5)
  - [x] 4.1 Create `src/components/feature/code/ProtobufToJson.tsx`
  - [x] 4.2 Update `src/components/feature/code/index.ts` — add barrel export `export { ProtobufToJson } from './ProtobufToJson'` (alphabetical — between `MarkdownTableGenerator` and `SqlFormatter`)
  - [x] 4.3 Implement main layout: tool description from `TOOL_REGISTRY_MAP['protobuf-to-json']`, proto input area, message browser, JSON output panel
  - [x] 4.4 **Proto Input Area**: TextAreaInput for pasting .proto definitions. Use `useDebounceCallback` with 300ms debounce for parsing (text conversion tool pattern). Placeholder: `"Paste your .proto definition here..."`. Monospace font via `[&_textarea]:font-mono`
  - [x] 4.5 **Error Display**: When parsing fails (AC #4), show error message with line number below the input. Use `role="alert"` and red styling. Format: "Syntax error at line X: {message}"
  - [x] 4.6 **Message Browser** (AC #1): Show all parsed message types in a clickable list. Each entry shows message name with a badge. Sort alphabetically. Include top-level enums with a separate badge color.
  - [x] 4.7 **JSON Output Panel** (AC #2, #3, #5): When a message is selected, generate sample JSON via `generateSampleJson` and display as syntax-highlighted, formatted JSON. Include CopyButton to copy the JSON.
  - [x] 4.8 **Enum Annotation**: For enum fields in the JSON output, show a comment or tooltip listing all possible enum values (AC #5)
  - [x] 4.9 **Layout**: Desktop: three sections — proto input (top/left), message list (bottom-left/sidebar), JSON output (right). Mobile (< 768px): stack vertically. Follow GraphqlSchemaViewer responsive pattern.
  - [x] 4.10 **Empty States**: Before any proto is entered, show a helpful prompt with a "Load Example" button. After parsing with no messages, show "No message types found."
  - [x] 4.11 Implement error handling: use `useToast` with `type: 'error'` for unexpected failures. Parsing errors are inline (AC #4), not toasts.
  - [x] 4.12 **Dynamic import** of protobuf utility: Use `const { parseProtobufSchema, generateSampleJson } = await import('@/utils/protobuf-to-json')` inside the debounced callback to lazy-load protobufjs only when user starts typing. This prevents the ~19KB (gzipped) protobufjs library from loading on page load.
  - [x] 4.13 Add `aria-live="polite"` on JSON output panel for screen reader announcements when output changes

- [x] Task 5: Register tool and configure routing (AC: all)
  - [x] 5.1 Add `'protobuf-to-json'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetical — between `'placeholder-image-generator'` and `'px-to-rem'`)
  - [x] 5.2 Add registry entry in `src/constants/tool-registry.ts` (alphabetical within array):
    ```typescript
    {
      category: 'Code',
      component: lazy(() =>
        import('@/components/feature/code/ProtobufToJson').then(
          ({ ProtobufToJson }: { ProtobufToJson: ComponentType }) => ({
            default: ProtobufToJson,
          }),
        ),
      ),
      description:
        'Paste .proto definitions and see corresponding JSON structures with default values. Browse message types, nested messages, enums, and repeated fields.',
      emoji: '\u{1F4E6}',
      key: 'protobuf-to-json',
      name: 'Protobuf to JSON',
      routePath: '/tools/protobuf-to-json',
      seo: {
        description:
          'Convert Protocol Buffer definitions to JSON online. Paste .proto files to browse message types and generate sample JSON structures. 100% client-side Protobuf to JSON converter.',
        title: 'Protobuf to JSON - CSR Dev Tools',
      },
    }
    ```
  - [x] 5.3 Add prerender route `/tools/protobuf-to-json` in `vite.config.ts` `toolRoutes` array (alphabetical)

- [x] Task 6: Implement accessibility (AC: all)
  - [x] 6.1 Add `aria-live="polite"` on JSON output panel (updates when message is selected)
  - [x] 6.2 Add `aria-label` on search/filter input (if added), message list buttons, and interactive elements
  - [x] 6.3 Add `role="alert"` on error display for syntax errors
  - [x] 6.4 Ensure full keyboard navigation: Tab through proto input -> message list -> JSON output panel. Message list items focusable via keyboard.
  - [x] 6.5 Add `aria-current="true"` on currently selected message in the list
  - [x] 6.6 Ensure WCAG 2.1 AA contrast ratios on all text including kind badges
  - [x] 6.7 Message type badges should have `aria-label` describing the kind (e.g., `aria-label="Message type"`)

- [x] Task 7: Create E2E tests (AC: all)
  - [x] 7.1 Create `e2e/protobuf-to-json.spec.ts`
  - [x] 7.2 Test: navigate to tool page, verify title and description are rendered
  - [x] 7.3 Test: paste valid .proto with multiple message types -> message list shows all types (AC #1)
  - [x] 7.4 Test: click a message in the list -> JSON output panel shows sample JSON with correct field defaults (AC #2)
  - [x] 7.5 Test: proto with nested messages -> JSON output shows nested objects (AC #3)
  - [x] 7.6 Test: paste invalid .proto syntax -> error message with line number is displayed (AC #4)
  - [x] 7.7 Test: proto with enum fields -> JSON output uses first enum value name (AC #5)
  - [x] 7.8 Test: proto with repeated fields -> JSON output shows arrays
  - [x] 7.9 Test: paste new proto -> previous selection is cleared, new messages shown
  - [x] 7.10 Test: mobile viewport (375px) responsiveness — layout stacks vertically

- [x] Task 8: Verify build and tests pass
  - [x] 8.1 Run `pnpm lint` — 0 errors
  - [x] 8.2 Run `pnpm format` — compliant
  - [x] 8.3 Run `pnpm test` — all tests pass (0 regressions)
  - [x] 8.4 Run `pnpm build` — clean build
  - [x] 8.5 Run E2E tests — all pass

## Dev Notes

### Architecture Compliance

- **Technical Stack**: React 19.2.4, TypeScript 5.9.3 (strict), Vite 7.3.1, Tailwind CSS 4.1.18, Motion 12.34.0
- **Component Pattern**: Named export `export const ProtobufToJson`, no default export
- **State**: `useState` for local UI state (parsed schema, selected message, error state)
- **Error Handling**: Inline error display for parsing errors (AC #4), `useToast` with `type: 'error'` for unexpected failures
- **Styling**: Tailwind CSS v4 classes, `tv()` from `@/utils` for component variants, OKLCH color space
- **Animations**: Import from `motion/react` (NOT `framer-motion`) — use for message selection transitions if desired
- **Code Quality**: oxlint + oxfmt — no semicolons, single quotes, trailing commas, 120 char width

### protobufjs Package

**This tool requires the `protobufjs` npm package.** Key characteristics:

- **Bundle size**: ~19 KB gzipped (full variant with parser)
- **Dependencies**: 12 micro-modules all under `@protobufjs/*` (self-contained), plus `long` for int64 support
- **ESM support**: CJS primary, but Vite handles CJS-to-ESM interop automatically via `@rollup/plugin-commonjs`
- **Browser-native**: No Node.js polyfills required. Uses standard browser APIs (Typed Arrays, TextEncoder)
- **Must be lazy-loaded**: Dynamic import in the component to maintain NFR8 (no initial bundle increase)
- **Synchronous parsing**: `protobuf.parse(source)` is synchronous — no async handling needed for the parse step itself

**Core API to use:**

```typescript
import protobuf from 'protobufjs'

// Parse a .proto string (synchronous, no file I/O)
const parsed = protobuf.parse(protoSource)
const root = parsed.root

// Resolve all type references (must call before traversal)
root.resolveAll()

// Traverse the type tree
for (const nested of root.nestedArray) {
  if (nested instanceof protobuf.Type) {
    // Message type
    const fields = nested.fieldsArray  // Array<protobuf.Field>
    const oneofs = nested.oneofsArray  // Array<protobuf.OneOf>
    const nestedTypes = nested.nestedArray  // Nested messages/enums
  }
  if (nested instanceof protobuf.Enum) {
    // Enum type
    const values = nested.values      // Record<string, number>
    const byId = nested.valuesById    // Record<number, string>
  }
}

// Field inspection
for (const field of messageType.fieldsArray) {
  field.resolve()
  field.name        // "userName"
  field.type        // "string", "int32", "Address", "Status"
  field.id          // field number
  field.rule        // "repeated" | "required" | undefined
  field.repeated    // boolean
  field.map         // boolean (true for map<K,V>)
  field.resolvedType // protobuf.Type | protobuf.Enum | null (after resolve())
}
```

**Error handling for invalid .proto syntax:**

```typescript
try {
  const parsed = protobuf.parse(protoSource)
  parsed.root.resolveAll()
} catch (error) {
  // Error messages include line info:
  // - 'illegal token "xyz" (line 5)'
  // - 'token expected (line 3)'
  const message = error instanceof Error ? error.message : String(error)
  const lineMatch = message.match(/line (\d+)/)
  const lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : null
}
```

**Default values map for sample JSON generation (proto3 semantics):**

| Proto Type | JSON Default |
|---|---|
| `string` | `""` |
| `bool` | `false` |
| `int32`, `sint32`, `uint32`, `fixed32`, `sfixed32`, `float`, `double` | `0` |
| `int64`, `sint64`, `uint64`, `fixed64`, `sfixed64` | `"0"` (string for 64-bit safety) |
| `bytes` | `""` |
| Enum | First enum value name (string) |
| Nested message | Recurse (with cycle detection) |
| Repeated field | `[defaultValue]` (array with one sample element) |
| Map field | `{}` |

### Tool Type: Text Conversion (Debounced Input)

Per architecture, text conversion tools:
- Processing trigger: On input change
- Debounce: 300ms via `useDebounceCallback`
- No explicit "Parse" button — processing is automatic
- Error display: Inline below input (not toast for expected parsing errors)

### Category and Domain Placement

**Category**: `'Code'` (already exists — used by HtmlFormatter, SqlFormatter, GraphqlSchemaViewer, etc.)
**Component Directory**: `src/components/feature/code/ProtobufToJson.tsx`
**Emoji**: 📦
**Key**: `protobuf-to-json`
**Route**: `/tools/protobuf-to-json`

### Component Implementation Pattern

```
src/components/feature/code/ProtobufToJson.tsx
├── Tool description from TOOL_REGISTRY_MAP['protobuf-to-json']
│
├── Proto Input Area
│   ├── TextAreaInput (monospace, ~12 rows, debounced 300ms)
│   └── Error display (inline, red text, line number) (AC #4)
│
├── Schema Browser Section (hidden until schema parsed)
│   ├── Message List (AC #1)
│   │   └── For each message/enum:
│   │       ├── Kind badge (Message=blue, Enum=green)
│   │       ├── Type name (clickable to select)
│   │       └── aria-current on selected message
│   │
│   └── JSON Output Panel (AC #2, #3, #5)
│       ├── Formatted JSON with syntax highlighting
│       ├── CopyButton to copy generated JSON
│       ├── Enum field annotations (tooltip/comment listing all values)
│       └── aria-live="polite" for screen reader updates
│
└── Empty state: "Paste a .proto definition to explore its message types and generate sample JSON"
```

### Badge Color Scheme

| Kind | Badge Color | Label |
|------|-------------|-------|
| Message | `bg-blue-900/50 text-blue-300 border-blue-700` | M |
| Enum | `bg-green-900/50 text-green-300 border-green-700` | E |

### Existing Utilities to REUSE

**Hooks to Use:**
- `useDebounceCallback` from `@/hooks` — 300ms debounce for parsing on input change
- `useToast` from `@/hooks` — for unexpected error handling
- `useCopyToClipboard` from `@/hooks` — NOT needed directly (use CopyButton component instead)

**Components to Use:**
- `TextAreaInput` from `@/components/common` — for .proto input (monospace)
- `CopyButton` from `@/components/common` — for copying generated JSON output
- Do NOT use Tabs — single view with message list + JSON output panel
- Do NOT use Dialog — all content visible on the page

### Dynamic Import Pattern for protobufjs

The `protobufjs` package (~19KB gzipped) MUST be lazy-loaded to maintain NFR8. Use dynamic import inside the debounced callback:

```typescript
const handleParse = useDebounceCallback(async (value: string) => {
  if (!value.trim()) {
    setSchemaInfo(null)
    setSelectedMessage(null)
    setError(null)
    return
  }
  try {
    const { parseProtobufSchema } = await import('@/utils/protobuf-to-json')
    const result = parseProtobufSchema(value)
    if (result.success) {
      setSchemaInfo(result.schema)
      setError(null)
      // Auto-select first message if available
      if (result.schema.messages.length > 0) {
        setSelectedMessage(result.schema.messages[0].fullName)
      }
    } else {
      setSchemaInfo(null)
      setSelectedMessage(null)
      setError(result.error)
    }
  } catch {
    toast({ action: 'add', item: { label: 'Failed to parse proto definition', type: 'error' } })
  }
}, 300)
```

**JSON generation also uses dynamic import** (same chunk):

```typescript
const handleSelectMessage = async (messageFullName: string) => {
  setSelectedMessage(messageFullName)
  if (!schemaInfo) return
  const { generateSampleJson } = await import('@/utils/protobuf-to-json')
  const message = schemaInfo.messages.find((m) => m.fullName === messageFullName)
  if (message) {
    const json = generateSampleJson(message, schemaInfo.messages, schemaInfo.enums)
    setGeneratedJson(JSON.stringify(json, null, 2))
  }
}
```

**CRITICAL**: Do NOT mix static and dynamic imports of the same module. Import `protobuf-to-json` ONLY via dynamic import inside callbacks. This was a lesson from Story 25.1 GraphQL Schema Viewer code review (issue H1).

### Previous Story Intelligence (25.1 GraphQL Schema Viewer)

Key learnings from Story 25.1 to apply here:

1. **Dynamic import only**: Do NOT mix static/dynamic imports of the utility module. The graphql-schema-viewer had to fix this (H1). Use dynamic import ONLY inside async callbacks.
2. **Barrel export ordering**: Maintain alphabetical order in barrel exports (code/index.ts, utils/index.ts)
3. **E2E test selectors**: Use `exact: true` for toast text matching; import from `./helpers/selectors`
4. **Spec files need explicit imports**: `import { describe, expect, it } from 'vitest'` (for tsc build)
5. **Registration checklist**: types union -> registry entry -> vite prerender -> barrel exports
6. **Code category already exists**: `'Code'` is in ToolCategory and CATEGORY_ORDER — no changes needed
7. **Tool description display**: Read from `TOOL_REGISTRY_MAP[key]?.description` and render as `<p>` tag
8. **Build warnings**: Avoid mixed static/dynamic imports of the same module
9. **TextInput props**: Do NOT pass `id` or `maxLength` directly — these aren't in `TextInputProps`. Use wrapping `<label>` elements
10. **Pure setState updater**: Use `(prev) => ({ ...prev, field: newValue })` pattern for state updates derived from previous state
11. **Code domain barrel**: Uses `export { Name } from './Name'` format (not `export * from`)
12. **Dynamic utility import**: Import utils inside async callbacks to lazy-load heavy libraries (proven pattern)
13. **`formattedType` field**: Pre-compute formatted type strings in the utility (not in the component) for cleaner rendering
14. **Removed incorrect ARIA**: Don't use `role="listbox"`/`role="option"` for simple clickable lists — use buttons with aria-labels instead
15. **Filter ambiguity**: When filtering by name, text matches can be ambiguous in E2E tests — use specific aria-label selectors

### Git Intelligence

Recent commit patterns from Epic 25:
- `4a87331` — `🔒 Disable inputs and tab navigation during Bcrypt hashing/verifying`
- `70757d5` — `🎨 Fix Placeholder Image Generator button alignment and preview styling`
- `3588560` — `📊 GraphQL Schema Viewer + 🔍 code review fixes (Story 25.1)`

**Commit message pattern**: `{emoji} {Tool Name} + 🔍 code review fixes (Story {epic}.{story})`
Suggested for this story: `📦 Protobuf to JSON + 🔍 code review fixes (Story 25.2)`

**Files pattern (with new dependency):**
- `package.json` + `pnpm-lock.yaml` — add protobufjs
- `src/utils/protobuf-to-json.ts` + `src/utils/protobuf-to-json.spec.ts` — utility + tests
- `src/utils/index.ts` — barrel export
- `src/components/feature/code/ProtobufToJson.tsx` — component
- `src/components/feature/code/index.ts` — barrel export
- `src/types/constants/tool-registry.ts` — ToolRegistryKey union
- `src/constants/tool-registry.ts` — registry entry
- `vite.config.ts` — prerender route
- `e2e/protobuf-to-json.spec.ts` — E2E tests

### Project Structure Notes

- **Existing directory**: `src/components/feature/code/` — already exists with 9 tools (HtmlFormatter, SqlFormatter, GraphqlSchemaViewer, etc.)
- **Code category already exists**: `'Code'` in ToolCategory and CATEGORY_ORDER — no changes needed
- **Code barrel already exists**: `src/components/feature/code/index.ts` — add new export in alphabetical order (between `MarkdownTableGenerator` and `SqlFormatter`)
- **New dependency**: `protobufjs` — must be lazy-loaded via dynamic import to maintain NFR8
- **Utility location**: `src/utils/protobuf-to-json.ts` — schema parsing, message extraction, and JSON generation as pure functions
- **Current code barrel exports (9 tools)**: CssFormatter, GraphqlSchemaViewer, HtmlFormatter, JavaScriptMinifier, JsonSchemaValidator, JsonToTypeScript, MarkdownPreview, MarkdownTableGenerator, SqlFormatter

### File Locations & Naming

| File | Path |
|---|---|
| Utility functions | `src/utils/protobuf-to-json.ts` |
| Utility tests | `src/utils/protobuf-to-json.spec.ts` |
| Component | `src/components/feature/code/ProtobufToJson.tsx` |
| Code barrel update | `src/components/feature/code/index.ts` |
| E2E test | `e2e/protobuf-to-json.spec.ts` |
| Registry key type | `src/types/constants/tool-registry.ts` |
| Registry entry | `src/constants/tool-registry.ts` |
| Prerender route | `vite.config.ts` -> `toolRoutes` array |
| Utils barrel update | `src/utils/index.ts` |
| Package dependency | `package.json` + `pnpm-lock.yaml` |

### Code Conventions (Enforced)

- `type` over `interface`
- `Array<T>` over `T[]`
- `import type` for type-only imports
- Named exports only (no default export for components)
- `@/` path alias for all imports
- Let TypeScript infer where possible
- No `console.log` statements
- Explicit `import { describe, expect, it } from 'vitest'` in spec files (for tsc build)
- Alphabetical ordering in object keys, barrel exports, union types

### Testing Notes

**Unit tests (Vitest, node environment):**
- protobufjs `parse()` is synchronous — no async test patterns needed for parsing
- `protobuf.parse()` and `root.resolveAll()` work natively in Node.js
- Focus unit tests on: `parseProtobufSchema()` (comprehensive), `generateSampleJson()` (all field type scenarios)
- Test edge cases: empty input, malformed proto, proto with only enums (no messages), self-referencing messages, proto2 vs proto3

**E2E tests (Playwright):**
- Debounced parsing means tests should wait for message list to appear after typing
- Use `page.waitForSelector` or `expect(locator).toBeVisible()` after filling proto input
- Message selection tests: click message -> verify JSON output panel updates
- Test with a comprehensive sample proto that includes messages, enums, nested types, repeated fields, map fields

### Sample .proto for Testing

```protobuf
syntax = "proto3";

package example;

message Person {
  string name = 1;
  int32 age = 2;
  bool active = 3;
  repeated string tags = 4;
  Address address = 5;
  Status status = 6;
  map<string, string> metadata = 7;

  enum Status {
    UNKNOWN = 0;
    ACTIVE = 1;
    INACTIVE = 2;
  }
}

message Address {
  string street = 1;
  string city = 2;
  string zip_code = 3;
  string country = 4;
}

message Order {
  string order_id = 1;
  Person customer = 2;
  repeated OrderItem items = 3;
  double total = 4;
  int64 created_at = 5;
}

message OrderItem {
  string product_name = 1;
  int32 quantity = 2;
  float price = 3;
}

enum PaymentMethod {
  CREDIT_CARD = 0;
  DEBIT_CARD = 1;
  PAYPAL = 2;
  CRYPTO = 3;
}
```

**Expected JSON for `Person`:**
```json
{
  "name": "",
  "age": 0,
  "active": false,
  "tags": [""],
  "address": {
    "street": "",
    "city": "",
    "zipCode": "",
    "country": ""
  },
  "status": "UNKNOWN",
  "metadata": {}
}
```

**Expected JSON for `Order`:**
```json
{
  "orderId": "",
  "customer": {
    "name": "",
    "age": 0,
    "active": false,
    "tags": [""],
    "address": {
      "street": "",
      "city": "",
      "zipCode": "",
      "country": ""
    },
    "status": "UNKNOWN",
    "metadata": {}
  },
  "items": [
    {
      "productName": "",
      "quantity": 0,
      "price": 0
    }
  ],
  "total": 0,
  "createdAt": "0"
}
```

**Note on field naming**: protobufjs converts snake_case proto field names to camelCase by default (`zip_code` -> `zipCode`, `order_id` -> `orderId`). The generated JSON should use these camelCase names as that matches the default protobufjs behavior and standard JSON conventions.

### UX / Interaction Requirements

- **Proto input**: Large monospace textarea (12+ rows). Placeholder: "Paste your .proto definition here...". Auto-parse on change (300ms debounce).
- **Error display**: Inline below input, red text. Shows line number and error message. Uses `role="alert"`.
- **Message list**: Scrollable list. Color-coded kind badges (Message=blue, Enum=green). Click to select. Keyboard navigable. Selected message highlighted with `aria-current`.
- **JSON output**: Formatted with 2-space indentation, syntax-highlighted if feasible. CopyButton adjacent.
- **Responsive**: Desktop: side-by-side layout (message list + JSON output). Mobile (< 768px): stacked vertically.
- **Initial state**: Empty state message with "Load Example" button that fills in the sample proto.
- **Mobile**: Full-width, 375px min viewport, 44px+ touch targets for message list items.

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion-3.md#Epic 25 Story 25.2]
- [Source: _bmad-output/project-context.md#Implementation Rules, Adding a New Tool]
- [Source: _bmad-output/implementation-artifacts/25-1-graphql-schema-viewer.md — previous story patterns and learnings]
- [Source: _bmad-output/planning-artifacts/architecture.md — Tool Processing, Text Conversion pattern, Error Handling]
- [Source: src/constants/tool-registry.ts — registry entry pattern and CATEGORY_ORDER]
- [Source: src/types/constants/tool-registry.ts — ToolRegistryKey and ToolCategory types]
- [Source: src/components/feature/code/index.ts — code domain barrel exports pattern]
- [Source: vite.config.ts — prerender route registration]
- [Source: npm protobufjs — Protocol Buffers library documentation]
- [Source: https://protobufjs.github.io/protobuf.js/ — protobufjs API documentation]

## Change Log

- 2026-02-25: Story 25.2 implemented — Protobuf to JSON tool with parsing utility, component, unit tests (22 tests), E2E tests (9 tests), tool registration, and accessibility
- 2026-02-25: Code review fixes — Rewrote `annotateJsonWithEnums` to support nested enum annotations (M1), removed dead code `void indent` (L1), documented BcryptHasher formatting change (M2)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- protobufjs v8.0.0: `Field.rule` property removed — derived from `field.repeated`/`field.required`/`field.optional` booleans instead
- protobufjs v8.0.0: `IParserResult.syntax` removed — extracted syntax from source string via regex instead
- protobufjs v8.0.0: no default export — used `import * as protobuf from 'protobufjs'` namespace import

### Completion Notes List

- Installed protobufjs 8.0.0 with exact version pinning
- Created `parseProtobufSchema()` and `generateSampleJson()` utility functions with full type safety
- Handles all proto field types: scalars (15 types), messages (recursive), enums (first value default), repeated (array), map (empty object), oneof (all fields included)
- Cycle detection for self-referencing messages via visited Set
- 22 unit tests covering parsing and JSON generation (all pass)
- Component follows GraphqlSchemaViewer pattern: debounced input, dynamic import, message browser + JSON output
- Enum annotations as inline comments in generated JSON (e.g., `// UNKNOWN | ACTIVE | INACTIVE`)
- Full accessibility: aria-live, aria-label, aria-current, role="alert", keyboard navigation, 44px touch targets
- 9 E2E tests covering all acceptance criteria (all pass)
- Lint: 0 errors, Format: compliant, Build: clean, Tests: 1199 unit + 173 E2E (0 regressions)

### File List

- `package.json` — added protobufjs 8.0.0 dependency
- `pnpm-lock.yaml` — lockfile updated
- `src/utils/protobuf-to-json.ts` — new: parsing utility with types and functions
- `src/utils/protobuf-to-json.spec.ts` — new: 22 unit tests
- `src/utils/index.ts` — modified: added barrel export for protobuf-to-json
- `src/components/feature/code/ProtobufToJson.tsx` — new: React component (review: rewrote annotateJsonWithEnums for nested enum support)
- `src/components/feature/code/index.ts` — modified: added barrel export for ProtobufToJson
- `src/components/feature/security/BcryptHasher.tsx` — modified: formatting only (oxfmt reformatted trigger JSX to multi-line)
- `src/types/constants/tool-registry.ts` — modified: added 'protobuf-to-json' to ToolRegistryKey union
- `src/constants/tool-registry.ts` — modified: added registry entry
- `vite.config.ts` — modified: added prerender route /tools/protobuf-to-json
- `e2e/protobuf-to-json.spec.ts` — new: 9 E2E tests
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — modified: status updated
- `_bmad-output/implementation-artifacts/25-2-protobuf-to-json.md` — modified: story updated
