---
story: 18.1
title: JSON to TypeScript
status: done
epic: 18
---

# Story 18.1: JSON to TypeScript

## Tool Metadata
- **Key:** `json-to-typescript`
- **Name:** JSON to TypeScript
- **Category:** Code
- **Emoji:** 🏗️
- **Route:** `/tools/json-to-typescript`
- **SEO Title:** JSON to TypeScript - CSR Dev Tools
- **SEO Description:** Generate TypeScript interfaces or types from JSON. Paste JSON, get type-safe code instantly in your browser.

## Acceptance Criteria

**Given** the user pastes valid JSON
**When** the value is entered
**Then** TypeScript interfaces are generated in real-time (debounced 300ms) with proper nesting

**Given** the JSON contains nested objects
**When** processed
**Then** separate named interfaces are created (key in PascalCase)

**Given** the JSON contains arrays of objects
**When** processed
**Then** element type is inferred; mixed arrays produce union types

**Given** the JSON contains null values
**When** processed
**Then** the type is `null`

**Given** an empty object `{}`
**When** processed
**Then** the type is `Record<string, unknown>`

**Given** the user toggles "interface" vs "type"
**When** toggled
**Then** output switches between `interface Foo {}` and `type Foo = {}`

**Given** the user enables "optional properties"
**When** enabled
**Then** all properties use `?:` syntax

**Given** the user sets a custom root name
**When** changed
**Then** the root type uses the custom name

## Implementation Checklist
1. [x] Create `src/utils/json-to-typescript.ts` with `jsonToTypeScript()` and `JsonToTsOptions` type
2. [x] Create `src/utils/json-to-typescript.spec.ts` — 10 tests
3. [x] Create `src/components/feature/code/JsonToTypeScript.tsx` — Dialog-based, split pane
4. [x] Register in `TOOL_REGISTRY` with complete metadata
5. [x] Add `'json-to-typescript'` to `ToolRegistryKey` union
6. [x] Export from `src/utils/index.ts`
7. [x] Accepts `autoOpen` / `onAfterDialogClose` props

## File List
| File | Action |
|------|--------|
| `src/utils/json-to-typescript.ts` | NEW |
| `src/utils/json-to-typescript.spec.ts` | NEW |
| `src/components/feature/code/JsonToTypeScript.tsx` | NEW |
| `src/constants/tool-registry.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |

## Unit Tests
- 10 tests, all passing
- Covers: basic primitives, nested objects, arrays, mixed unions, null, empty objects/arrays, interface vs type, optional props, custom root name
