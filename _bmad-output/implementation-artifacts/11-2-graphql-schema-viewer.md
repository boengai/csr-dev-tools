# Story 25.1: GraphQL Schema Viewer

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **to paste a GraphQL schema (SDL) and browse its types, fields, and relationships**,
so that **I can explore API schemas without running a GraphQL server**.

## Acceptance Criteria

1. **Given** the user pastes valid GraphQL SDL
   **When** parsed
   **Then** all types (Object, Input, Enum, Interface, Union, Scalar) are listed in a browsable sidebar/list

2. **Given** the user selects a type
   **When** clicked
   **Then** all fields, arguments, directives, and descriptions for that type are displayed

3. **Given** a field references another type
   **When** the type name is displayed
   **Then** it's clickable/linkable to navigate to that type's definition

4. **Given** invalid GraphQL SDL
   **When** parsed
   **Then** syntax errors are shown with line numbers

5. **Given** a loaded schema
   **When** the user types in a search/filter box
   **Then** types and fields are filtered by name

## Tasks / Subtasks

- [x] Task 1: Install graphql package (AC: all)
  - [x] 1.1 Run `pnpm add graphql@16.13.0` — the official GraphQL.js library for SDL parsing
  - [x] 1.2 Verify `package.json` has exact version `"graphql": "16.13.0"` (save-exact enforced by .npmrc)

- [x] Task 2: Create GraphQL schema parsing utility functions (AC: #1, #3, #4)
  - [x] 2.1 Create `src/utils/graphql-schema-viewer.ts`
  - [x] 2.2 Define types:
    - `GraphqlTypeKind = 'Object' | 'Input' | 'Enum' | 'Interface' | 'Union' | 'Scalar'`
    - `GraphqlFieldInfo = { name: string, typeName: string, typeKind: string, isNonNull: boolean, isList: boolean, description: string | null, deprecationReason: string | null, args: Array<GraphqlArgInfo> }`
    - `GraphqlArgInfo = { name: string, typeName: string, isNonNull: boolean, isList: boolean, defaultValue: string | null, description: string | null }`
    - `GraphqlEnumValue = { name: string, description: string | null, deprecationReason: string | null }`
    - `GraphqlTypeInfo = { name: string, kind: GraphqlTypeKind, description: string | null, fields: Array<GraphqlFieldInfo> | null, enumValues: Array<GraphqlEnumValue> | null, interfaces: Array<string> | null, possibleTypes: Array<string> | null, inputFields: Array<GraphqlFieldInfo> | null }`
    - `GraphqlSchemaInfo = { types: Array<GraphqlTypeInfo>, queryTypeName: string | null, mutationTypeName: string | null, subscriptionTypeName: string | null }`
    - `GraphqlParseResult = { success: true, schema: GraphqlSchemaInfo } | { success: false, error: string }`
  - [x] 2.3 Implement `parseGraphqlSchema(sdl: string): GraphqlParseResult` — uses `buildSchema()` from `graphql` package, catches `GraphQLError` for syntax errors with line numbers. Filters out built-in types (names starting with `__`) and built-in scalars (`String`, `Int`, `Float`, `Boolean`, `ID`). Uses type guard predicates (`isObjectType`, `isInterfaceType`, `isUnionType`, `isEnumType`, `isInputObjectType`, `isScalarType`) to categorize each type. Extracts fields, args, enum values, interfaces, and possible types. Sorts types alphabetically by name.
  - [x] 2.4 Implement `getTypeKindLabel(kind: GraphqlTypeKind): string` — returns human-readable label
  - [x] 2.5 Implement `formatGraphqlType(typeName: string, isNonNull: boolean, isList: boolean): string` — formats like `[User!]!`, `String`, `Post!` etc.
  - [x] 2.6 Add barrel export in `src/utils/index.ts`

- [x] Task 3: Create unit tests for GraphQL utility functions (AC: #1, #4)
  - [x] 3.1 Create `src/utils/graphql-schema-viewer.spec.ts`
  - [x] 3.2 Test `parseGraphqlSchema` with valid SDL containing Object, Enum, Interface, Union, Input, and custom Scalar types — returns `success: true` with correct type count and kinds
  - [x] 3.3 Test `parseGraphqlSchema` with invalid SDL — returns `success: false` with error message including line number
  - [x] 3.4 Test `parseGraphqlSchema` filters out built-in types (`__Schema`, `__Type`, `String`, `Int`, etc.)
  - [x] 3.5 Test `parseGraphqlSchema` extracts fields with arguments, non-null markers, list markers, descriptions, and deprecation reasons
  - [x] 3.6 Test `parseGraphqlSchema` extracts enum values with descriptions and deprecation reasons
  - [x] 3.7 Test `parseGraphqlSchema` extracts interface implementations and union possible types
  - [x] 3.8 Test `parseGraphqlSchema` extracts query/mutation/subscription root type names
  - [x] 3.9 Test `parseGraphqlSchema` with empty string input — returns error
  - [x] 3.10 Test `formatGraphqlType` — formats `("User", false, false)` → `"User"`, `("User", true, false)` → `"User!"`, `("User", true, true)` → `"[User!]!"`, `("User", false, true)` → `"[User]"`
  - [x] 3.11 Test `parseGraphqlSchema` extracts input object fields correctly

- [x] Task 4: Create GraphqlSchemaViewer component (AC: #1, #2, #3, #4, #5)
  - [x] 4.1 Create `src/components/feature/code/GraphqlSchemaViewer.tsx`
  - [x] 4.2 Update `src/components/feature/code/index.ts` — add barrel export `export { GraphqlSchemaViewer } from './GraphqlSchemaViewer'` (alphabetical)
  - [x] 4.3 Implement main layout: tool description from `TOOL_REGISTRY_MAP['graphql-schema-viewer']`, SDL input area, type browser, detail panel
  - [x] 4.4 **SDL Input Area**: TextAreaInput for pasting GraphQL SDL. Use `useDebounceCallback` with 300ms debounce for parsing (text conversion tool pattern per architecture). Placeholder: `"Paste your GraphQL schema (SDL) here..."`. Monospace font via `[&_textarea]:font-mono`
  - [x] 4.5 **Error Display**: When parsing fails (AC #4), show error message with line number below the input. Use `role="alert"` and red styling (e.g., `text-red-400`). Format: "Syntax error at line X: {message}"
  - [x] 4.6 **Type Browser Sidebar/List** (AC #1): Show all parsed types grouped or sorted alphabetically. Each type entry shows: emoji/badge for kind (Object, Enum, Interface, Union, Input, Scalar), type name. Use color-coded badges for each kind.
  - [x] 4.7 **Search/Filter** (AC #5): TextInput above the type list. Filters types by name as user types. Also filter fields within types if they match. Placeholder: `"Filter types..."`. Clear button to reset.
  - [x] 4.8 **Type Detail Panel** (AC #2): When a type is selected, show full details:
    - Type name, kind badge, description
    - For Object/Interface types: fields table with field name, type (formatted), arguments, description, deprecation
    - For Enum types: enum values list with description, deprecation
    - For Union types: possible member types list (clickable)
    - For Input types: input fields table
    - Interfaces implemented (for Object types)
  - [x] 4.9 **Clickable Type References** (AC #3): Wherever a type name appears in fields, arguments, union members, or interface lists — make it a clickable button/link that selects that type in the browser. Style as a `text-primary hover:underline cursor-pointer` text button.
  - [x] 4.10 **Layout**: On desktop, use a two-column layout — left column for SDL input + type list, right column for type detail. On mobile (< 768px), stack vertically. Consider using a split layout or responsive grid.
  - [x] 4.11 **Empty States**: Before any SDL is entered, show a helpful prompt with a sample schema button. After parsing with no results, show "No types found in schema."
  - [x] 4.12 Implement error handling: use `useToast` with `type: 'error'` for unexpected failures. Parsing errors are inline (AC #4), not toasts.
  - [x] 4.13 **Dynamic import** of graphql utility: Use `const { parseGraphqlSchema } = await import('@/utils/graphql-schema-viewer')` inside the debounced callback to lazy-load the graphql package only when the user starts typing. This prevents the ~32KB (gzipped) graphql library from loading on page load.

- [x] Task 5: Register tool and configure routing (AC: all)
  - [x] 5.1 Add `'graphql-schema-viewer'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetical — between `'hash-generator'` and `'hmac-generator'`)
  - [x] 5.2 Add registry entry in `src/constants/tool-registry.ts` (alphabetical within array)
  - [x] 5.3 Add prerender route `/tools/graphql-schema-viewer` in `vite.config.ts` `toolRoutes` array (alphabetical)

- [x] Task 6: Implement accessibility (AC: all)
  - [x] 6.1 Add `aria-live="polite"` on type detail panel (updates when type is selected)
  - [x] 6.2 Add `aria-label` on search input, type list buttons, and clickable type references
  - [x] 6.3 Add `role="alert"` on error display for syntax errors
  - [x] 6.4 Ensure full keyboard navigation: Tab through SDL input → search → type list → detail panel. Type list items focusable via keyboard.
  - [x] 6.5 Add `aria-current="true"` on currently selected type in the list
  - [x] 6.6 Ensure WCAG 2.1 AA contrast ratios on all text including kind badges and type references
  - [x] 6.7 Type kind badges should have `aria-label` describing the kind (e.g., `aria-label="Object type"`)

- [x] Task 7: Create E2E tests (AC: all)
  - [x] 7.1 Create `e2e/graphql-schema-viewer.spec.ts`
  - [x] 7.2 Test: navigate to tool page, verify title and description are rendered
  - [x] 7.3 Test: paste valid SDL with multiple types → type list shows all types with correct kind badges (AC #1)
  - [x] 7.4 Test: click a type in the list → detail panel shows fields, arguments, and descriptions (AC #2)
  - [x] 7.5 Test: click a type reference in the detail panel → navigates to that type's definition (AC #3)
  - [x] 7.6 Test: paste invalid SDL → error message with line number is displayed (AC #4)
  - [x] 7.7 Test: type in search box → type list filters by name (AC #5)
  - [x] 7.8 Test: clear search box → all types shown again
  - [x] 7.9 Test: paste new SDL → previous selection is cleared, new types shown
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
- **Component Pattern**: Named export `export const GraphqlSchemaViewer`, no default export
- **State**: `useState` for local UI state (parsed schema, selected type, search query, error state)
- **Error Handling**: Inline error display for parsing errors (AC #4), `useToast` with `type: 'error'` for unexpected failures
- **Styling**: Tailwind CSS v4 classes, `tv()` from `@/utils` for component variants, OKLCH color space
- **Animations**: Import from `motion/react` (NOT `framer-motion`) — use for type selection transitions if desired
- **Code Quality**: oxlint + oxfmt — no semicolons, single quotes, trailing commas, 120 char width

### graphql Package (v16.13.0)

**This tool requires the `graphql` npm package (v16.13.0).** Key characteristics:
- **Bundle size**: ~32 KB gzipped with all needed APIs (buildSchema, type guards, validation)
- **Zero dependencies**: No transitive bloat
- **ESM support**: Ships dual CJS/ESM, `sideEffects: false` for tree-shaking
- **Pure JavaScript**: No Node.js-specific APIs, works directly in browser without polyfills
- **Must be lazy-loaded**: Dynamic import in the component to maintain NFR8 (no initial bundle increase)

**Core APIs to use:**
```typescript
import {
  buildSchema,
  validateSchema,
  isObjectType,
  isInterfaceType,
  isUnionType,
  isEnumType,
  isInputObjectType,
  isScalarType,
  getNamedType,
} from 'graphql'
```

**Schema traversal pattern:**
```typescript
const schema = buildSchema(sdlString)
const typeMap = schema.getTypeMap()
// Filter out introspection types (names starting with '__') and built-in scalars
const userTypes = Object.values(typeMap).filter(
  (type) => !type.name.startsWith('__') && !['String', 'Int', 'Float', 'Boolean', 'ID'].includes(type.name),
)
// Use type guard predicates to categorize
for (const type of userTypes) {
  if (isObjectType(type)) {
    const fields = type.getFields() // Record<string, GraphQLField>
    const interfaces = type.getInterfaces() // Array<GraphQLInterfaceType>
  }
  if (isEnumType(type)) {
    const values = type.getValues() // Array<GraphQLEnumValue>
  }
  if (isUnionType(type)) {
    const members = type.getTypes() // Array<GraphQLObjectType>
  }
  // ... etc.
}
```

**Error handling for invalid SDL:**
```typescript
try {
  const schema = buildSchema(sdl)
} catch (error) {
  if (error instanceof GraphQLError) {
    // error.message contains the syntax error description
    // error.locations?.[0]?.line gives the line number
    // error.locations?.[0]?.column gives the column number
  }
}
```

### Tool Type: Text Conversion (Debounced Input)

Per architecture, text conversion tools:
- Processing trigger: On input change
- Debounce: 300ms via `useDebounceCallback`
- No explicit "Parse" button — processing is automatic
- Error display: Inline below input (not toast for expected parsing errors)

### Category and Domain Placement

**Category**: `'Code'` (already exists — used by HTML Formatter, SQL Formatter, etc.)
**Component Directory**: `src/components/feature/code/GraphqlSchemaViewer.tsx`
**Emoji**: 📊
**Key**: `graphql-schema-viewer`
**Route**: `/tools/graphql-schema-viewer`

### Component Implementation Pattern

```
src/components/feature/code/GraphqlSchemaViewer.tsx
├── Tool description from TOOL_REGISTRY_MAP['graphql-schema-viewer']
│
├── SDL Input Area
│   ├── TextAreaInput (monospace, ~12 rows, debounced 300ms)
│   └── Error display (inline, red text, line number) (AC #4)
│
├── Schema Browser Section (hidden until schema parsed)
│   ├── Search/Filter Input (AC #5)
│   │   └── TextInput with placeholder "Filter types..."
│   │
│   ├── Type List (AC #1)
│   │   └── For each type:
│   │       ├── Kind badge (color-coded: Object=blue, Enum=green, Interface=purple, Union=orange, Input=teal, Scalar=gray)
│   │       ├── Type name (clickable to select)
│   │       └── aria-current on selected type
│   │
│   └── Type Detail Panel (AC #2)
│       ├── Type name + kind + description
│       ├── Fields table (for Object/Interface/Input types)
│       │   ├── Field name
│       │   ├── Type reference (clickable → navigates to type) (AC #3)
│       │   ├── Arguments (expandable or inline)
│       │   ├── Description
│       │   └── Deprecated badge (if applicable)
│       ├── Enum values list (for Enum types)
│       │   ├── Value name
│       │   ├── Description
│       │   └── Deprecated badge
│       ├── Possible types list (for Union types) — each clickable (AC #3)
│       └── Implemented interfaces list (for Object types) — each clickable (AC #3)
│
└── Empty state: "Paste a GraphQL schema to explore its types and fields"
```

### Existing Utilities to REUSE

**Hooks to Use:**
- `useDebounceCallback` from `@/hooks` — 300ms debounce for parsing on input change
- `useToast` from `@/hooks` — for unexpected error handling
- Do NOT use `useCopyToClipboard` — no copy output needed for this tool

**Components to Use:**
- `TextAreaInput` from `@/components/common` — for SDL input (monospace)
- `TextInput` from `@/components/common` — for search/filter input
- Do NOT use Tabs — single view with type list + detail panel
- Do NOT use Dialog — all content visible on the page
- Do NOT use CopyButton — this is a viewer/browser tool, not a converter

### Dynamic Import Pattern for graphql Package

The `graphql` package (~32KB gzipped) MUST be lazy-loaded to maintain NFR8. Use dynamic import inside the debounced callback:

```typescript
const handleParse = useDebounceCallback(async (value: string) => {
  if (!value.trim()) {
    setSchemaInfo(null)
    setError(null)
    return
  }
  try {
    const { parseGraphqlSchema } = await import('@/utils/graphql-schema-viewer')
    const result = parseGraphqlSchema(value)
    if (result.success) {
      setSchemaInfo(result.schema)
      setError(null)
    } else {
      setSchemaInfo(null)
      setError(result.error)
    }
  } catch {
    toast({ action: 'add', item: { label: 'Failed to parse schema', type: 'error' } })
  }
}, 300)
```

### Registry Entry Format

```typescript
{
  category: 'Code',
  component: lazy(() =>
    import('@/components/feature/code/GraphqlSchemaViewer').then(
      ({ GraphqlSchemaViewer }: { GraphqlSchemaViewer: ComponentType }) => ({
        default: GraphqlSchemaViewer,
      }),
    ),
  ),
  description:
    'Paste a GraphQL schema (SDL) and browse its types, fields, arguments, and relationships. Explore Object, Input, Enum, Interface, Union, and Scalar types with clickable cross-references.',
  emoji: '\u{1F4CA}',
  key: 'graphql-schema-viewer',
  name: 'GraphQL Schema Viewer',
  routePath: '/tools/graphql-schema-viewer',
  seo: {
    description:
      'Explore GraphQL schemas online. Paste SDL to browse types, fields, arguments, and relationships. Filter and navigate type definitions. 100% client-side GraphQL schema browser.',
    title: 'GraphQL Schema Viewer - CSR Dev Tools',
  },
}
```

### UX / Interaction Requirements

- **SDL input**: Large monospace textarea (12+ rows). Placeholder: "Paste your GraphQL schema (SDL) here...". Auto-parse on change (300ms debounce).
- **Error display**: Inline below input, red text. Shows line number and error message. Uses `role="alert"`.
- **Type list**: Scrollable list/sidebar. Color-coded kind badges. Click to select. Keyboard navigable. Selected type highlighted with `aria-current`.
- **Type detail panel**: Shows full type information. Type references are clickable links (styled as `text-primary`).
- **Search filter**: Filters type list by name in real-time. No debounce needed (filtering is synchronous on already-parsed data).
- **Responsive**: Desktop: two-column layout (type list left, detail right). Mobile (< 768px): stacked vertically.
- **Initial state**: Empty state message with helpful text. Consider a "Load Example" button that fills in a sample schema.
- **Mobile**: Full-width, 375px min viewport, 44px+ touch targets for type list items and clickable references.

### Kind Badge Color Scheme

Use consistent color coding for type kinds (accessible on dark background):

| Kind | Badge Color | Emoji |
|------|-------------|-------|
| Object | `bg-blue-900/50 text-blue-300 border-blue-700` | T |
| Interface | `bg-purple-900/50 text-purple-300 border-purple-700` | I |
| Union | `bg-orange-900/50 text-orange-300 border-orange-700` | U |
| Enum | `bg-green-900/50 text-green-300 border-green-700` | E |
| Input | `bg-teal-900/50 text-teal-300 border-teal-700` | In |
| Scalar | `bg-gray-800/50 text-gray-400 border-gray-600` | S |

### Previous Story Intelligence (24.5 RSA Key Generator)

Key learnings from Story 24.5 to apply here:

1. **CopyButton/clipboard pattern**: Use CopyButton component with `label` and `value` props — never raw `navigator.clipboard`
2. **Barrel export ordering**: Maintain alphabetical order in barrel exports
3. **E2E test selectors**: Use `exact: true` for toast text matching; import from `./helpers/selectors`
4. **Spec files need explicit imports**: `import { describe, expect, it } from 'vitest'` (for tsc build)
5. **Registration checklist**: types union → registry entry → vite prerender → barrel exports
6. **Code category already exists**: `'Code'` is in ToolCategory and CATEGORY_ORDER — no changes needed
7. **Tool description display**: Read from `TOOL_REGISTRY_MAP[key]?.description` and render as `<p>` tag
8. **Build warnings**: Avoid mixed static/dynamic imports of the same module
9. **Code review common fixes**: Keyboard accessibility (focus-visible), dead code removal, barrel export ordering, ToolRegistryKey alphabetical ordering
10. **TextInput props**: Do NOT pass `id` or `maxLength` directly — these aren't in `TextInputProps`. Use wrapping `<label>` elements
11. **Pure setState updater**: Use `(prev) => ({ ...prev, field: newValue })` pattern for state updates derived from previous state
12. **Code domain barrel**: Uses `export { Name } from './Name'` format (not `export * from`)
13. **Dynamic utility import**: Import utils inside async callbacks to lazy-load heavy libraries (pattern used in CertificateDecoder)

### Git Intelligence

Recent commit patterns from Epic 24:
- `c9ef315` — `🔄 Epic 24 Retrospective — Security & Crypto Tools`
- `66b3af0` — `🔐 RSA Key Generator + 🔍 code review fixes (Story 24.5)`
- `3151d1e` — `🛡️ Chmod Calculator + 🔍 code review fixes (Story 24.4)`
- `cdf72f2` — `🔒 Bcrypt Hasher + 🔍 code review fixes (Story 24.3)`
- `bf9e5d8` — `📜 Certificate Decoder + 🔍 code review fixes (Story 24.2)`

**Commit message pattern**: `{emoji} {Tool Name} + 🔍 code review fixes (Story {epic}.{story})`
Suggested for this story: `📊 GraphQL Schema Viewer + 🔍 code review fixes (Story 25.1)`

**Files pattern (with new dependency):**
- `package.json` + `pnpm-lock.yaml` — add graphql@16.13.0
- `src/utils/graphql-schema-viewer.ts` + `src/utils/graphql-schema-viewer.spec.ts` — utility + tests
- `src/utils/index.ts` — barrel export
- `src/components/feature/code/GraphqlSchemaViewer.tsx` — component
- `src/components/feature/code/index.ts` — barrel export
- `src/types/constants/tool-registry.ts` — ToolRegistryKey union
- `src/constants/tool-registry.ts` — registry entry
- `vite.config.ts` — prerender route
- `e2e/graphql-schema-viewer.spec.ts` — E2E tests

### Project Structure Notes

- **Existing directory**: `src/components/feature/code/` — already exists with 8 tools (HtmlFormatter, SqlFormatter, JsonToTypeScript, etc.)
- **Code category already exists**: `'Code'` in ToolCategory and CATEGORY_ORDER — no changes needed
- **Code barrel already exists**: `src/components/feature/code/index.ts` — add new export in alphabetical order
- **New dependency**: `graphql@16.13.0` — must be lazy-loaded via dynamic import to maintain NFR8
- **Utility location**: `src/utils/graphql-schema-viewer.ts` — schema parsing, type extraction, and formatting as pure/async functions

### File Locations & Naming

| File | Path |
|---|---|
| Utility functions | `src/utils/graphql-schema-viewer.ts` |
| Utility tests | `src/utils/graphql-schema-viewer.spec.ts` |
| Component | `src/components/feature/code/GraphqlSchemaViewer.tsx` |
| Code barrel update | `src/components/feature/code/index.ts` |
| E2E test | `e2e/graphql-schema-viewer.spec.ts` |
| Registry key type | `src/types/constants/tool-registry.ts` |
| Registry entry | `src/constants/tool-registry.ts` |
| Prerender route | `vite.config.ts` → `toolRoutes` array |
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
- The `graphql` package works natively in Node.js — no special setup or mocking needed
- `buildSchema()` and all type guard functions are synchronous and pure
- Focus unit tests on: `parseGraphqlSchema()` (comprehensive), `formatGraphqlType()` (simple)
- Test edge cases: empty input, malformed SDL, schemas with only scalars, schemas with all type kinds

**E2E tests (Playwright):**
- Debounced parsing means tests should wait for type list to appear after typing
- Use `page.waitForSelector` or `expect(locator).toBeVisible()` after filling SDL input
- Type navigation tests: click type reference → verify detail panel updates
- Search filter: type in search → verify type list filters
- Test with a comprehensive sample schema that includes all type kinds

### Sample GraphQL Schema for Testing

```graphql
type Query {
  user(id: ID!): User
  users(limit: Int = 10): [User!]!
  search(query: String!): [SearchResult!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}

type User implements Node {
  id: ID!
  name: String!
  email: String!
  role: Role!
  posts: [Post!]!
  createdAt: String!
}

type Post implements Node {
  id: ID!
  title: String!
  content: String!
  author: User!
  status: PostStatus!
  tags: [String!]
}

interface Node {
  id: ID!
}

union SearchResult = User | Post

enum Role {
  ADMIN
  USER
  MODERATOR
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED @deprecated(reason: "Use DRAFT instead")
}

input CreateUserInput {
  name: String!
  email: String!
  role: Role = USER
}

scalar DateTime
```

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion-3.md#Epic 25 Story 25.1]
- [Source: _bmad-output/project-context.md#Implementation Rules, Adding a New Tool]
- [Source: _bmad-output/implementation-artifacts/24-5-rsa-key-generator.md — previous story patterns and learnings]
- [Source: _bmad-output/planning-artifacts/architecture.md — Tool Processing, Text Conversion pattern, Error Handling]
- [Source: src/constants/tool-registry.ts — registry entry pattern and CATEGORY_ORDER]
- [Source: src/types/constants/tool-registry.ts — ToolRegistryKey and ToolCategory types]
- [Source: src/components/feature/code/index.ts — code domain barrel exports pattern]
- [Source: vite.config.ts — prerender route registration]
- [Source: npm graphql@16.13.0 — GraphQL.js library documentation]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- TextInput requires `type` prop — fixed build error by adding `type="text"` to filter input
- E2E test ambiguity: `/User/` regex matched both "User" and "CreateUserInput" — fixed by using exact aria-label strings
- E2E test ambiguity: `getByText('A user in the system')` matched both textarea content and detail panel — fixed by scoping to `[aria-live="polite"]` container
- Filter "Post" matches User type because User has field named "posts" — correct behavior (field name filtering per AC #5)

### Completion Notes List

- Installed `graphql@16.13.0` with zero dependencies
- Created utility with `parseGraphqlSchema`, `getTypeKindLabel`, and `formatGraphqlType` functions
- Built comprehensive component with SDL input (debounced 300ms), type browser sidebar, detail panel, search/filter, clickable type references, and sample schema loader
- Dynamic import of graphql utility inside debounced callback for lazy-loading
- Component is properly code-split (126KB chunk, 32KB gzipped) — does not affect initial bundle
- 17 unit tests covering all parsing scenarios, type extraction, error handling, and formatting
- 9 E2E tests covering all acceptance criteria including mobile responsiveness
- All 1175 unit tests pass (0 regressions), all E2E tests pass
- Full accessibility: aria-live, aria-current, aria-label, role="alert", keyboard navigation, focus-visible
- Responsive layout: two-column on desktop (md:), stacked on mobile

### File List

- `package.json` — added graphql@16.13.0 dependency
- `pnpm-lock.yaml` — lockfile updated
- `src/utils/graphql-schema-viewer.ts` — new: schema parsing utility functions and types
- `src/utils/graphql-schema-viewer.spec.ts` — new: 17 unit tests
- `src/utils/index.ts` — modified: added barrel export
- `src/components/feature/code/GraphqlSchemaViewer.tsx` — new: main component
- `src/components/feature/code/index.ts` — modified: added barrel export
- `src/types/constants/tool-registry.ts` — modified: added ToolRegistryKey
- `src/constants/tool-registry.ts` — modified: added registry entry
- `vite.config.ts` — modified: added prerender route
- `e2e/graphql-schema-viewer.spec.ts` — new: 9 E2E tests

### Change Log

- 2026-02-25: Implemented GraphQL Schema Viewer (Story 25.1) — SDL parsing with graphql@16.13.0, interactive type browser with clickable cross-references, search/filter, responsive layout, full accessibility, 17 unit tests + 9 E2E tests
- 2026-02-25: Code review fixes (4 issues fixed):
  - [H1] Removed mixed static/dynamic import — inlined `getTypeKindLabel` in component, use `formattedType` field instead of `formatGraphqlType`. graphql utility now only loaded via dynamic import (component chunk 9KB vs utility chunk 117KB — properly split)
  - [M1] Fixed `typeKind` field to resolve actual type kind via typeMap lookup instead of incorrectly using typeName
  - [M2] Added `formattedType` field to `GraphqlFieldInfo`/`GraphqlArgInfo` preserving exact GraphQL type toString (fixes `[String!]` displaying as `[String]`)
  - [M3] Removed incorrect `role="listbox"`/`role="option"` ARIA pattern, updated E2E selectors to `getByLabel`
  - 2 new unit tests (typeKind correctness, formattedType preservation) — 1177 total tests pass, build clean
