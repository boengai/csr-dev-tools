# Story 2.4: Input Validation Utilities

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **shared validation functions for common input formats**,
So that **I can validate user input consistently across all tools without duplicating logic**.

**Epic:** Epic 2 — Standardized Tool Experience
**Dependencies:** Story 2.1 (ToolLayout component) complete. Story 2.2 (CopyButton/OutputDisplay) complete. Story 2.3 (Error Handling System) complete. Epic 1 complete.
**Scope note:** This story creates shared pure-function validators in `src/utils/validation.ts` with comprehensive unit tests. It does NOT refactor existing tools to use these validators — that happens in Epic 3 stories. It does NOT modify any component files.

## Acceptance Criteria

### AC1: Shared Validation Functions Available

**Given** `src/utils/validation.ts`
**When** a developer imports validation functions
**Then** the following validators are available: `isValidHex`, `isValidRgb`, `isValidHsl`, `isValidBase64`, `isValidUrl`, `isValidJson`, `isValidJwt`, `isValidUuid`, `isValidTimestamp`
**And** each returns a `boolean`

### AC2: Valid Input Returns True

**Given** a validation function
**When** called with valid input
**Then** it returns `true`

### AC3: Invalid Input Returns False Without Throwing

**Given** a validation function
**When** called with invalid input
**Then** it returns `false`
**And** it never throws an exception

### AC4: Comprehensive Test Coverage

**Given** `src/utils/validation.spec.ts`
**When** tests are run via `pnpm test`
**Then** all validation functions have test coverage for valid inputs, invalid inputs, and edge cases (empty string, null-like values, boundary values)

### AC5: TypeScript Types Properly Defined

**Given** corresponding types in `src/types/utils/validation.ts`
**When** TypeScript compiles
**Then** all validator function signatures are properly typed
**And** types are exported via the barrel chain

## Tasks / Subtasks

- [x] Task 1: Create validation types (AC: #5)
  - [x] 1.1 Create `src/types/utils/validation.ts` — define `Validator` type alias as `(value: string) => boolean`
  - [x] 1.2 Export from `src/types/utils/index.ts`

- [x] Task 2: Create validation utility functions (AC: #1, #2, #3)
  - [x] 2.1 Create `src/utils/validation.ts`
  - [x] 2.2 Implement `isValidHex` — validates hex color strings (#RGB, #RRGGBB, #RRGGBBAA formats, with or without #)
  - [x] 2.3 Implement `isValidRgb` — validates `rgb(R, G, B)` format strings (0-255 integer values)
  - [x] 2.4 Implement `isValidHsl` — validates `hsl(H, S%, L%)` format strings (0-360 hue, 0-100% saturation/lightness)
  - [x] 2.5 Implement `isValidBase64` — validates Base64-encoded strings (standard alphabet, optional padding)
  - [x] 2.6 Implement `isValidUrl` — validates URL strings using `URL` constructor
  - [x] 2.7 Implement `isValidJson` — validates JSON strings using `JSON.parse`
  - [x] 2.8 Implement `isValidJwt` — validates JWT format (3 dot-separated base64url segments)
  - [x] 2.9 Implement `isValidUuid` — validates UUID v4 format (8-4-4-4-12 hex with version 4 digit)
  - [x] 2.10 Implement `isValidTimestamp` — validates Unix timestamp (integer, reasonable range: 0 to 2^42)
  - [x] 2.11 Export from `src/utils/index.ts`

- [x] Task 3: Write comprehensive unit tests (AC: #2, #3, #4)
  - [x] 3.1 Create `src/utils/validation.spec.ts`
  - [x] 3.2 Test `isValidHex`: valid (#FFF, #3B82F6, #3b82f6aa, 3B82F6), invalid (empty, #GGG, #12, random text), edge cases (shorthand, with/without #, 8-digit alpha)
  - [x] 3.3 Test `isValidRgb`: valid (rgb(0, 0, 0), rgb(255, 255, 255)), invalid (empty, rgb(256, 0, 0), rgb(-1, 0, 0), rgb(0, 0)), edge cases (boundary 0 and 255, spaces, decimal values)
  - [x] 3.4 Test `isValidHsl`: valid (hsl(0, 0%, 0%), hsl(360, 100%, 100%)), invalid (empty, hsl(361, 0%, 0%), missing %, non-numeric), edge cases (boundary values)
  - [x] 3.5 Test `isValidBase64`: valid (SGVsbG8=, dGVzdA==, Zm9v, empty base64), invalid (empty, contains spaces not at end, invalid characters like !@#), edge cases (padding variations, single char)
  - [x] 3.6 Test `isValidUrl`: valid (https://example.com, http://localhost:3000, ftp://files.example.com), invalid (empty, random text, just "example.com" without protocol), edge cases (query strings, fragments, unicode)
  - [x] 3.7 Test `isValidJson`: valid ({"key":"value"}, [1,2,3], "string", null, 123), invalid (empty, {key: value}, trailing comma, single quotes), edge cases (nested objects, empty object, empty array)
  - [x] 3.8 Test `isValidJwt`: valid (3-segment tokens with valid base64url chars), invalid (empty, 2 segments, 4 segments, invalid base64url chars), edge cases (minimal valid JWT, segments with padding)
  - [x] 3.9 Test `isValidUuid`: valid (550e8400-e29b-41d4-a716-446655440000), invalid (empty, wrong length, missing dashes, wrong version digit), edge cases (uppercase, lowercase, v4 specific)
  - [x] 3.10 Test `isValidTimestamp`: valid (0, 1700000000, Date.now()/1000 range), invalid (empty, NaN, negative, non-numeric string), edge cases (millisecond timestamps, boundary values, very large numbers)

- [x] Task 4: Linting & formatting verification
  - [x] 4.1 Run `pnpm lint` — no errors
  - [x] 4.2 Run `pnpm format:check` — no formatting issues
  - [x] 4.3 Run `pnpm build` — build succeeds with no TypeScript errors
  - [x] 4.4 Run `pnpm test` — all tests pass (existing 39 + new validation tests)

## Dev Notes

### CRITICAL: Architecture Decisions

#### Pure Functions — No Side Effects, No Exceptions

Every validator MUST be a pure function that:
1. Takes a `string` parameter
2. Returns a `boolean`
3. **NEVER throws** — wrap any potentially throwing code (like `JSON.parse`, `new URL()`) in try-catch
4. Has no side effects

```typescript
// CORRECT — catches potential throw, returns boolean
export const isValidJson = (value: string): boolean => {
  if (value.trim().length === 0) return false
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

// WRONG — can throw, not a proper validator
export const isValidJson = (value: string): boolean => {
  JSON.parse(value) // throws on invalid input!
  return true
}
```

#### Validator Naming Convention: `isValid{Format}`

Architecture mandates `isValid{Format}` naming returning `boolean`. This is used directly in the error handling flow:

```typescript
// In a tool component (Epic 3+):
const handleInput = (value: string) => {
  if (isValidHex(value)) {
    clearError()
    processColor(value)
  } else {
    setError('Enter a valid hex color (e.g., #3B82F6)')
  }
}
```

The validators themselves do NOT set error messages — they only return true/false. Error message responsibility belongs to the consuming tool component via `useToolError.setError()`.

#### These Validators Are Standalone — Not Tied to Existing Color Utils

The `parseHex`, `parseRgb`, `parseHsl` functions in `src/utils/color.ts` already do inline validation + parsing + conversion. The new `isValidHex`, `isValidRgb`, `isValidHsl` validators in `validation.ts` are **intentionally separate** — they serve a different purpose:

- **`color.ts` parse functions**: Parse AND convert (complex, may throw, return objects)
- **`validation.ts` validators**: Boolean check only (simple, never throw, return boolean)

Do NOT refactor `color.ts` to use these validators. Do NOT import from `color.ts` into `validation.ts`. They are independent utilities that happen to validate similar formats. Epic 3 stories will decide how to integrate them when refactoring existing tools.

#### Implementation Specifications for Each Validator

**`isValidHex(value: string): boolean`**
- Accepts: `#RGB`, `#RRGGBB`, `#RRGGBBAA` (3, 6, or 8 hex digits after optional `#`)
- Also accepts without `#` prefix: `RGB`, `RRGGBB`, `RRGGBBAA`
- Case-insensitive (both `#3B82F6` and `#3b82f6` valid)
- Regex approach: `/^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i`

**`isValidRgb(value: string): boolean`**
- Accepts: `rgb(R, G, B)` where R, G, B are integers 0-255
- Whitespace between values is flexible
- Does NOT accept decimal values (e.g., `rgb(59.5, 130, 246)` is invalid)
- Does NOT accept values outside 0-255 range
- Regex + parseInt approach

**`isValidHsl(value: string): boolean`**
- Accepts: `hsl(H, S%, L%)` where H is 0-360, S and L are 0-100
- The `%` sign is required for S and L
- Whitespace between values is flexible
- Does NOT accept decimal values for simplicity
- Does NOT accept values outside their respective ranges

**`isValidBase64(value: string): boolean`**
- Accepts: Standard Base64 alphabet (`A-Za-z0-9+/`) with optional `=` padding
- Empty string returns false (no data to decode)
- Must be valid Base64 length (length % 4 === 0 when padded)
- Regex approach: `/^[A-Za-z0-9+/]*={0,2}$/` plus length check

**`isValidUrl(value: string): boolean`**
- Uses `new URL(value)` constructor — if it doesn't throw, it's valid
- Accepts: `http://`, `https://`, `ftp://`, and other standard URL schemes
- Does NOT accept bare domains without protocol (e.g., `example.com` is invalid)
- Wrapped in try-catch to prevent throwing

**`isValidJson(value: string): boolean`**
- Uses `JSON.parse(value)` — if it doesn't throw, it's valid
- Accepts: objects, arrays, strings, numbers, booleans, null
- Empty string returns false
- Wrapped in try-catch to prevent throwing

**`isValidJwt(value: string): boolean`**
- Validates structure: exactly 3 dot-separated segments
- Each segment must be valid Base64URL characters (`A-Za-z0-9_-`)
- Does NOT validate payload content or signature — structure only
- Regex approach: `/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/`

**`isValidUuid(value: string): boolean`**
- Validates UUID v4 format: `xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx`
- Case-insensitive
- The version digit (position 15) must be `4`
- The variant digit (position 20) must be `8`, `9`, `a`, or `b`
- Regex approach: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`

**`isValidTimestamp(value: string): boolean`**
- Validates string represents a reasonable Unix timestamp (seconds since epoch)
- Must parse as a finite integer
- Range: 0 to 4398046511103 (2^42 - 1, ~year 141,246 — covers both seconds and milliseconds)
- Negative timestamps are invalid (pre-1970 edge case deferred — not common use case for dev tools)
- Does NOT accept floats, NaN, Infinity
- parseInt approach with strict number check

### Existing Codebase Patterns to Follow

#### Utility File Pattern (from `src/utils/color.ts`)

```typescript
// src/utils/color.ts pattern — pure functions, named exports
import type { ColorFormat, RGBColor } from '@/types'

export const convertColor = (input: string, from: ColorFormat, to: ColorFormat): string => {
  // ... implementation
}
```

For `validation.ts`, the pattern is simpler — no type imports needed (validators take string, return boolean):

```typescript
// No external imports needed — all validators are self-contained pure functions

export const isValidHex = (value: string): boolean => {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)
}
```

#### Test File Pattern (from `src/utils/color.spec.ts`)

```typescript
describe('color utilities', () => {
  describe('convertColor', () => {
    it('should convert valid HEX to RGB', () => {
      // ...
    })
  })
})
```

For `validation.spec.ts`:

```typescript
describe('validation utilities', () => {
  describe('isValidHex', () => {
    it('should return true for valid 6-digit hex with #', () => {
      expect(isValidHex('#3B82F6')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isValidHex('')).toBe(false)
    })
  })
})
```

#### File Structure Convention

```
src/utils/
  validation.ts              # NEW — Named exports: isValidHex, isValidRgb, etc.
  validation.spec.ts         # NEW — Comprehensive unit tests
  index.ts                   # MODIFY — add validation export

src/types/utils/
  validation.ts              # NEW — Validator type alias
  index.ts                   # MODIFY — add validation export
```

#### Import Ordering Convention

```typescript
// For validation.ts — No imports needed (pure functions, no dependencies)

// For validation.spec.ts:
// 1. Internal @/ imports
import { isValidBase64, isValidHex, isValidHsl, isValidJson, isValidJwt, isValidRgb, isValidTimestamp, isValidUrl, isValidUuid } from '@/utils'
```

### Architecture Compliance

- **Validators in `src/utils/validation.ts`** — architecture specifies this exact location [Source: architecture.md#Complete Project Directory Structure]
- **`isValid{Format}` naming** returning `boolean` — architecture naming pattern table [Source: architecture.md#Naming Patterns]
- **Used in error handling flow step 2** — `isValid{Format}()` check on input change (debounced) [Source: architecture.md#Process Patterns]
- **Architecture anti-pattern:** inline validation like `if (input.length < 3) setError('too short')` — validators must be shared utils [Source: architecture.md#Pattern Examples]
- **Architecture enforcement rule #5:** "Use shared validators from `src/utils/validation.ts` — never duplicate validation logic" [Source: architecture.md#Enforcement Guidelines]
- **Types in `src/types/utils/validation.ts`** — types mirror source structure [Source: project-context.md#Types Organization]

### Previous Story Intelligence (Story 2.3)

From Story 2.3 (Error Handling System) implementation:

- **Barrel exports** must be wired through full chain. For utils: `validation.ts` → `utils/index.ts`. For types: `types/utils/validation.ts` → `types/utils/index.ts` → `types/index.ts`
- **All 39 existing tests pass** — no regressions from Story 2.3 (15 color + 8 CopyButton + 10 OutputDisplay + 6 useToolError)
- **Error message format convention established:** "Enter a valid {format} (e.g., {example})" — validators return boolean, tools compose the messages
- **useToolError + validators integration pattern:** `isValidHex(value)` → `clearError()` or `setError('Enter a valid hex color (e.g., #3B82F6)')` — but this integration is NOT part of this story
- **oxfmt auto-sorts** — expect Tailwind class reordering during formatting (not relevant for pure utils, but good to know)

### Git Intelligence

Recent commit patterns:
- `♻️: story 2-3` — Error handling system (types, hook, component, tests, barrel exports)
- `♻️: story 2-2` — CopyButton/OutputDisplay (10 files: types, components, tests, barrel exports)
- `♻️: story 2-1` — ToolLayout component (7 files: types, component, barrel exports)

**Key patterns from commits:**
- Stories create types first, then implementation, then barrel exports, then tests — follow same order
- Single clean commit per story with all files
- Emoji prefix pattern: `♻️:` for refactor/new component stories

### Web Intelligence

No external library dependencies needed for this story. All validators use:
- Built-in `RegExp` for pattern matching
- Built-in `JSON.parse` for JSON validation
- Built-in `URL` constructor for URL validation
- Built-in `parseInt` / `Number` for numeric validation
- No additional `pnpm add` needed

Key consideration: All validators are standard pattern matching — well-established approaches with no version sensitivity.

### Project Structure Notes

- **validation.ts** aligns with architecture: `src/utils/validation.ts` [Source: architecture.md#Complete Project Directory Structure]
- **validation.spec.ts** aligns with testing pattern: co-located as `*.spec.ts` [Source: project-context.md#Testing Rules]
- **Types** at: `src/types/utils/validation.ts` [Source: architecture.md#Complete Project Directory Structure]
- **No conflicts** with existing files — barrel exports need one new line each in `src/utils/index.ts` and `src/types/utils/index.ts`
- **Existing inline validators** in `color.ts` (`parseHex`, `parseRgb`, `parseHsl`) and `image.ts` (`isValidImageFormat`) are intentionally NOT refactored in this story — Epic 3 handles that

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — `isValid{Format}` naming convention returning boolean
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Error handling flow step 2: `isValid{Format}()` check on input change
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] — File locations for validation.ts and types
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern Examples] — Anti-pattern: inline validation
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — Rule #5: Use shared validators
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — Acceptance criteria source
- [Source: _bmad-output/project-context.md#Testing Rules] — Vitest node env, co-located *.spec.ts, globals enabled
- [Source: _bmad-output/project-context.md#Language-Specific Rules] — type over interface, Array<T>, import type
- [Source: _bmad-output/project-context.md#Code Quality & Style Rules] — Barrel exports, kebab-case folders, camelCase utils
- [Source: _bmad-output/implementation-artifacts/2-3-error-handling-system.md] — Previous story learnings, barrel export chain, test count (39 passing)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Build initially failed due to missing `import { describe, expect, it } from 'vitest'` in test file — existing spec files use explicit vitest imports rather than globals. Fixed by adding the import.

### Completion Notes List

- Created `Validator` type alias in `src/types/utils/validation.ts` and wired barrel exports
- Implemented 9 pure-function validators in `src/utils/validation.ts`: `isValidHex`, `isValidRgb`, `isValidHsl`, `isValidBase64`, `isValidUrl`, `isValidJson`, `isValidJwt`, `isValidUuid`, `isValidTimestamp`
- All validators follow spec exactly: take `string`, return `boolean`, never throw
- Wrote 96 unit tests covering valid inputs, invalid inputs, and edge cases for all 9 validators
- All 135 tests pass (39 existing + 96 new), no regressions
- [Review Fix] `isValidTimestamp` hardened: strict decimal-only regex guard (`/^\d+$/`) rejects hex, octal, binary, scientific notation, and whitespace-padded inputs. 5 new tests added (101 total, 140 all pass).
- Build, lint, and format checks all pass

### File List

- `src/types/utils/validation.ts` — NEW: `Validator` type alias
- `src/types/utils/index.ts` — MODIFIED: added validation barrel export
- `src/utils/validation.ts` — NEW: 9 validator functions
- `src/utils/validation.spec.ts` — NEW: 101 unit tests (96 original + 5 review fixes)
- `src/utils/index.ts` — MODIFIED: added validation barrel export

## Change Log

- 2026-02-13: Implemented Story 2.4 — Input Validation Utilities. Created 9 shared pure-function validators (`isValidHex`, `isValidRgb`, `isValidHsl`, `isValidBase64`, `isValidUrl`, `isValidJson`, `isValidJwt`, `isValidUuid`, `isValidTimestamp`) with 96 comprehensive unit tests. All validators follow `isValid{Format}` naming, take string input, return boolean, and never throw.
- 2026-02-13: Code Review (AI) — 2 MEDIUM issues fixed: `isValidTimestamp` hardened with strict `/^\d+$/` regex guard to reject non-decimal notations (hex, octal, binary, scientific) and whitespace-padded strings. 5 new tests added. 5 LOW issues noted (4-digit hex alpha gap, duplicate boundary tests, unused Validator type, sprint-status not in File List). All 140 tests pass, build/lint clean.
