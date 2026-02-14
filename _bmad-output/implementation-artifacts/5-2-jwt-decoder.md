# Story 5.2: JWT Decoder

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to paste a JWT token and see the decoded header and payload**,
So that **I can quickly inspect token contents for debugging without using an external service**.

**Epic:** Epic 5 — Encoding & Decoding Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (useToolError, CopyButton — complete)
**Story Key:** 5-2-jwt-decoder

## Acceptance Criteria

### AC1: Tool Registered and Renders via Dialog Pattern

**Given** the JWT Decoder tool registered in `TOOL_REGISTRY` under the Encoding category
**When** the user navigates to it (via sidebar, command palette, or `/tools/jwt-decoder` route)
**Then** it renders with a "Decode" button that opens a full-screen dialog
**And** a one-line description is shown from the registry entry
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Valid JWT Decoded to Header and Payload

**Given** a user pastes a valid JWT token (3 Base64URL-encoded segments separated by dots)
**When** the value is entered
**Then** the decoded header and payload are displayed as formatted JSON (2-space indentation) in separate labeled result sections
**And** each section (Header, Payload) has a `CopyButton`
**And** processing is debounced at 150ms

### AC3: Signature Shown but Not Verified

**Given** a valid JWT is decoded
**When** the output renders
**Then** the signature segment is displayed as-is (raw Base64URL string)
**And** it is noted as "Signature (not verified — client-side only, no secret)" or similar

### AC4: Timestamp Claims Show Human-Readable Dates

**Given** the decoded payload contains standard time claims (`exp`, `iat`, `nbf`)
**When** the output renders
**Then** each timestamp is shown with a human-readable date equivalent alongside the raw Unix value (e.g., `1516239022 → Jan 18, 2018, 1:30:22 AM`)

### AC5: Invalid JWT Shows Inline Error

**Given** a user pastes an invalid JWT (wrong format, not 3 segments, invalid Base64URL)
**When** validation fails
**Then** an inline error appears: `"Enter a valid JWT token (e.g., eyJhbGciOiJIUzI1NiJ9...)"`
**And** the error clears automatically when the input changes to a valid value

### AC6: Malformed Segment Content Shows Inline Error

**Given** a user pastes a string with 3 dot-separated segments but invalid JSON in header or payload
**When** Base64URL decode or JSON parse fails
**Then** an inline error appears: `"JWT contains invalid header or payload — could not decode segments"`
**And** the error clears automatically when the input changes to a valid token

### AC7: Uses Standard Error Handling and Client-Side Processing

**Given** the tool component
**When** it is implemented
**Then** it uses `useToolError` for error handling and `isValidJwt` from `@/utils/validation`
**And** all processing is 100% client-side (Base64URL decode, JSON parse)
**And** zero network requests are made

### AC8: Unit Tests Cover All Edge Cases

**Given** unit tests in `src/utils/jwt.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: valid tokens with various claims, tokens with `exp`/`iat`/`nbf` timestamps, invalid formats (1/2/4+ segments), invalid Base64URL characters, malformed JSON in segments, empty input, tokens with standard headers (HS256, RS256, etc.)

## Tasks / Subtasks

- [x] Task 1: Create JWT decoding utility functions (AC: #2, #3, #4, #6, #7)
  - [x] 1.1 Create `src/utils/jwt.ts` with `decodeJwt(token: string)` pure function
  - [x] 1.2 `decodeJwt` splits token into 3 segments, Base64URL-decodes header and payload, JSON.parse both, returns `{ header, payload, signature }` object
  - [x] 1.3 Base64URL decode helper: replace `-` with `+`, `_` with `/`, pad with `=`, then `atob()`
  - [x] 1.4 Add `formatTimestampClaim(value: number): string` helper that converts Unix timestamp (seconds) to human-readable date string
  - [x] 1.5 Throws descriptive error on invalid Base64URL or invalid JSON for caller to catch
  - [x] 1.6 Export from `src/utils/index.ts` barrel

- [x] Task 2: Write unit tests for JWT utilities (AC: #8)
  - [x] 2.1 Create `src/utils/jwt.spec.ts` following existing `url.spec.ts` pattern (explicit vitest imports)
  - [x] 2.2 Test `decodeJwt` with valid standard JWT (HS256 header, payload with `sub`/`name`/`iat`)
  - [x] 2.3 Test `decodeJwt` with valid JWT containing `exp`, `iat`, `nbf` claims — verify all are present in result
  - [x] 2.4 Test `decodeJwt` with RS256 algorithm header
  - [x] 2.5 Test `decodeJwt` returns signature as raw Base64URL string (not decoded)
  - [x] 2.6 Test `decodeJwt` throws on empty string
  - [x] 2.7 Test `decodeJwt` throws on 2-segment input (missing signature)
  - [x] 2.8 Test `decodeJwt` throws on 4+ segment input
  - [x] 2.9 Test `decodeJwt` throws on invalid Base64URL characters in header
  - [x] 2.10 Test `decodeJwt` throws on malformed JSON in header (valid Base64URL but not JSON)
  - [x] 2.11 Test `decodeJwt` throws on malformed JSON in payload
  - [x] 2.12 Test `formatTimestampClaim` converts Unix seconds to human-readable string
  - [x] 2.13 Test `formatTimestampClaim` handles epoch 0

- [x] Task 3: Create JwtDecoder component (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 3.1 Create `src/components/feature/encoding/JwtDecoder.tsx` as named export
  - [x] 3.2 Follow `EncodingBase64.tsx` dialog pattern: single "Decode" button on card, full-screen dialog with source/result areas
  - [x] 3.3 Left side of dialog: JWT token textarea input with `FieldForm` and placeholder showing a truncated example JWT
  - [x] 3.4 Right side of dialog: Three result sections — Header (formatted JSON), Payload (formatted JSON with timestamp annotations), Signature (raw string with "not verified" note)
  - [x] 3.5 Use `useToolError` for error state, `useDebounceCallback` (150ms) for processing, `CopyButton` on each result section
  - [x] 3.6 Validate with `isValidJwt()` before decoding; catch decode errors for malformed segments
  - [x] 3.7 On validation failure: `setError('Enter a valid JWT token (e.g., eyJhbGciOiJIUzI1NiJ9...)')` — clears on valid input
  - [x] 3.8 On decode failure: `setError('JWT contains invalid header or payload — could not decode segments')` — clears on valid input
  - [x] 3.9 Show tool description from `TOOL_REGISTRY_MAP['jwt-decoder']`
  - [x] 3.10 For payload timestamps (`exp`, `iat`, `nbf`), append human-readable date after the raw value in the formatted output
  - [x] 3.11 Reset source, results, and error on dialog close via `onAfterClose`

- [x] Task 4: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 4.1 Add `'jwt-decoder'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetically after `'image-resizer'`)
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts` with all required fields (maintain alphabetical ordering by key — between `image-resizer` and `px-to-rem`)
  - [x] 4.3 Add pre-render route in `vite.config.ts` toolRoutes array (alphabetically)

- [x] Task 5: Update barrel exports (AC: #1)
  - [x] 5.1 Add `export * from './JwtDecoder'` to `src/components/feature/encoding/index.ts`
  - [x] 5.2 Add `export * from './jwt'` to `src/utils/index.ts`

- [x] Task 6: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [x] 6.1 Run `pnpm lint` — no errors
  - [x] 6.2 Run `pnpm format:check` — no formatting issues
  - [x] 6.3 Run `pnpm test` — all tests pass (existing + new)
  - [x] 6.4 Run `pnpm build` — build succeeds, tool chunk is separate

## Dev Notes

### CRITICAL: Follow Existing EncodingBase64 Dialog Pattern

This tool is in the **same domain** (`encoding/`) as EncodingBase64 and UrlEncoder. The implementation pattern MUST match `EncodingBase64.tsx` exactly, with adaptations for decode-only behavior:

1. **Dialog-based UI:** Single "Decode" button on the card (no encode/decode toggle — JWT is decode-only), clicking opens a full-screen `Dialog` with source textarea on left, result sections on right (stacked on mobile)
2. **State management:** `useState` for source (raw JWT string), header result, payload result, signature result, dialogOpen
3. **Debounced processing:** `useDebounceCallback` with 150ms delay
4. **Error display:** `{error != null && <p className="text-error text-body-sm" role="alert">{error}</p>}` at bottom of dialog content
5. **Tool description:** `TOOL_REGISTRY_MAP['jwt-decoder']?.description` shown above button
6. **Reset on close:** `handleReset` clears source, all results, error via `onAfterClose`

### UI Difference from Base64/URL Tools

Unlike encode/decode tools, the JWT Decoder is **decode-only**. The dialog layout:
- **Left side:** Single `FieldForm` textarea for pasting the JWT token
- **Right side:** Three stacked result sections instead of a single result textarea:
  1. **Header** — Formatted JSON with `CopyButton` (label: "Header")
  2. **Payload** — Formatted JSON with `CopyButton` (label: "Payload"). Timestamp claims (`exp`, `iat`, `nbf`) should have human-readable date annotations inline
  3. **Signature** — Raw Base64URL string with note: "Not verified (client-side only)" — with `CopyButton`

### Base64URL Decoding (Not Standard Base64)

JWT uses **Base64URL** encoding which differs from standard Base64:
- `-` replaces `+`
- `_` replaces `/`
- No `=` padding

The utility function MUST convert Base64URL to standard Base64 before calling `atob()`:

```typescript
const base64UrlDecode = (str: string): string => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) {
    base64 += '='
  }
  return atob(base64)
}
```

### Timestamp Claim Formatting

JWT timestamps are Unix timestamps in **seconds** (not milliseconds). When displaying `exp`, `iat`, or `nbf` claims in the payload:
- Show the raw numeric value from the JSON
- Append human-readable equivalent: multiply by 1000 for JS `Date` constructor
- Format: `new Date(timestamp * 1000).toLocaleString()` for locale-aware display
- Example display in formatted payload: alongside the numeric value, show the date string

### Architecture Compliance

- **TOOL_REGISTRY entry required** — tool must be discoverable via sidebar, command palette, dashboard selection dialog, and direct URL. The dashboard is a fixed 6-slot favorites grid — new tools do NOT auto-appear there [Source: architecture.md#Tool Registry]
- **Named export only** — `export const JwtDecoder` (never `export default`) [Source: project-context.md#Named exports]
- **Lazy-loaded component** — registry uses `lazy(() => import(...).then(({ JwtDecoder }) => ({ default: JwtDecoder })))` [Source: architecture.md#Code Splitting]
- **100% client-side** — `atob()` for Base64URL decode, `JSON.parse()` for JSON parsing, zero network requests [Source: architecture.md#Hard Constraints]
- **Encoding category** — existing category, no `ToolCategory` type update needed [Source: tool-registry.ts types]
- **New ToolRegistryKey** — must add `'jwt-decoder'` to the union type [Source: src/types/constants/tool-registry.ts]
- **Validation already exists** — `isValidJwt` is already in `src/utils/validation.ts` with tests in `validation.spec.ts`. Do NOT re-implement or duplicate it.

### Library & Framework Requirements

- **No new dependencies** — JWT decoding uses native browser APIs (`atob` for Base64 decode, `JSON.parse` for JSON parsing, `String.prototype.replace` for Base64URL conversion)
- **Existing imports used:** `useState` from React, `Button`, `CopyButton`, `Dialog`, `FieldForm` from `@/components/common`, `TOOL_REGISTRY_MAP` from `@/constants`, `useDebounceCallback`, `useToolError` from `@/hooks`, `isValidJwt` from `@/utils/validation`

### File Structure Requirements

**Files to CREATE:**

```
src/utils/jwt.ts                              — decodeJwt() and formatTimestampClaim() pure functions
src/utils/jwt.spec.ts                         — Unit tests for JWT decode utilities
src/components/feature/encoding/JwtDecoder.tsx — JWT Decoder component
```

**Files to MODIFY:**

```
src/utils/index.ts                           — Add barrel export for jwt utils
src/components/feature/encoding/index.ts     — Add barrel export for JwtDecoder
src/constants/tool-registry.ts               — Add JWT Decoder registry entry
src/types/constants/tool-registry.ts         — Add 'jwt-decoder' to ToolRegistryKey
vite.config.ts                               — Add JWT Decoder pre-render route
```

**Files NOT to modify:**
- `src/utils/validation.ts` — `isValidJwt` already exists. It validates format (3 dot-separated Base64URL segments). Use it as-is.
- `src/utils/validation.spec.ts` — tests for `isValidJwt` already exist (8 test cases). Do not modify.
- Any existing tool components
- Route configuration (auto-generated from registry)
- Sidebar/Command Palette (auto-populated from registry)

### Testing Requirements

**Unit tests (`src/utils/jwt.spec.ts`):**

```typescript
import { describe, expect, it } from 'vitest'

import { decodeJwt, formatTimestampClaim } from '@/utils/jwt'

describe('jwt decoding utilities', () => {
  // Standard test JWT: {"alg":"HS256","typ":"JWT"}.{"sub":"1234567890","name":"John Doe","iat":1516239022}
  const VALID_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

  describe('decodeJwt', () => {
    it('should decode a valid JWT header', () => {
      const result = decodeJwt(VALID_JWT)
      expect(result.header).toEqual({ alg: 'HS256', typ: 'JWT' })
    })

    it('should decode a valid JWT payload', () => {
      const result = decodeJwt(VALID_JWT)
      expect(result.payload).toEqual({ sub: '1234567890', name: 'John Doe', iat: 1516239022 })
    })

    it('should return signature as raw Base64URL string', () => {
      const result = decodeJwt(VALID_JWT)
      expect(result.signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')
    })

    it('should decode JWT with RS256 algorithm', () => {
      // Header: {"alg":"RS256","typ":"JWT"}
      // Must construct or use known RS256 test vector
    })

    it('should decode JWT with exp, iat, and nbf claims', () => {
      // Verify all timestamp claims are present in result.payload
    })

    it('should throw for empty string', () => {
      expect(() => decodeJwt('')).toThrow()
    })

    it('should throw for 2-segment input', () => {
      expect(() => decodeJwt('header.payload')).toThrow()
    })

    it('should throw for 4-segment input', () => {
      expect(() => decodeJwt('a.b.c.d')).toThrow()
    })

    it('should throw for invalid Base64URL characters in header', () => {
      expect(() => decodeJwt('!!!.b.c')).toThrow()
    })

    it('should throw for malformed JSON in header', () => {
      // Base64URL of 'not json' → encode and use
    })

    it('should throw for malformed JSON in payload', () => {
      // Valid header but invalid payload JSON
    })
  })

  describe('formatTimestampClaim', () => {
    it('should convert Unix seconds to human-readable string', () => {
      const result = formatTimestampClaim(1516239022)
      expect(result).toContain('2018')
    })

    it('should handle epoch 0', () => {
      const result = formatTimestampClaim(0)
      expect(result).toContain('1970')
    })
  })
})
```

**No E2E test in this story** — E2E tests are written separately per the testing strategy. Unit tests cover the core logic.

### TOOL_REGISTRY Entry (Copy-Paste Ready)

```typescript
{
  category: 'Encoding',
  component: lazy(() =>
    import('@/components/feature/encoding/JwtDecoder').then(
      ({ JwtDecoder }: { JwtDecoder: ComponentType }) => ({
        default: JwtDecoder,
      }),
    ),
  ),
  description: 'Decode JWT tokens to inspect header and payload',
  emoji: '🔐',
  key: 'jwt-decoder',
  name: 'JWT Decoder',
  routePath: '/tools/jwt-decoder',
  seo: {
    description:
      'Decode JWT tokens online. Inspect header, payload, and signature instantly in your browser without external services.',
    title: 'JWT Decoder - CSR Dev Tools',
  },
},
```

### ToolRegistryKey Type Update (Copy-Paste Ready)

```typescript
export type ToolRegistryKey =
  | 'base64-encoder'
  | 'color-converter'
  | 'image-converter'
  | 'image-resizer'
  | 'jwt-decoder'
  | 'px-to-rem'
  | 'unix-timestamp'
  | 'url-encoder-decoder'
```

### Vite Config Pre-Render Route (Copy-Paste Ready)

```typescript
{
  description:
    'Decode JWT tokens online. Inspect header, payload, and signature instantly in your browser without external services.',
  path: '/tools/jwt-decoder',
  title: 'JWT Decoder - CSR Dev Tools',
  url: '/tools/jwt-decoder',
},
```

### Previous Story Intelligence

From Story 5-1 (URL Encoder/Decoder — same epic, completed):
- **Exact same dialog pattern** — followed `EncodingBase64.tsx` pattern successfully
- **Build initially failed** because test file used vitest globals without explicit import. Fixed by adding `import { describe, expect, it } from 'vitest'` — DO THIS from the start
- **Code review found missing pre-render route** in `vite.config.ts` — DO NOT forget this
- **Code review found missing differentiated error messages** — this story has distinct errors for format vs decode failures
- **25 URL tests + 299 existing = 324 total** — expect ~340+ after adding JWT tests
- `isValidJwt` is already in `validation.ts` with 8 tests — no duplication needed
- **Commit prefix:** `✨: story 5-2 JWT Decoder`

### Git Intelligence

Recent commits analyzed:
```
57dab9e ✨: story 5-1 URL Encoder/Decoder
f6e45be 🔄: epic 4 retrospective
71c559a 📝: story 4-4
e5f588e ✨: story 4-3
ef7ad63 ✨: story 4-2
```

**Pattern:** New tool feature uses `✨: story 5-2 JWT Decoder` commit prefix.
**Files modified in story 5-1:** utility function, utility tests, tool component, registry entry, types, barrel exports, vite.config.ts — expect identical file set for this story.

### Project Structure Notes

- Component placed in `src/components/feature/encoding/` — same domain as `EncodingBase64.tsx` and `UrlEncoder.tsx`
- Utility functions in `src/utils/jwt.ts` — parallel to `src/utils/url.ts` and `src/utils/base64.ts`
- Tests co-located as `src/utils/jwt.spec.ts` — parallel to `src/utils/url.spec.ts`
- No new directories needed — all target directories exist
- No type file created in `src/types/components/feature/encoding/` — component has no custom props (follows EncodingBase64 and UrlEncoder patterns which also have no types file)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2] — Full AC definitions and story requirements
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5] — Epic objectives and FR coverage (FR10)
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Registry] — Registry entry pattern with all required fields
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Text conversion: on input change, 150ms debounce
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Message Format] — Concise, actionable, with example of valid input
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Tool component file structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Hard Constraints] — Zero server-side processing
- [Source: _bmad-output/project-context.md] — 53 project rules (named exports, type not interface, etc.)
- [Source: src/components/feature/encoding/EncodingBase64.tsx] — Reference implementation pattern
- [Source: src/components/feature/encoding/UrlEncoder.tsx] — Sister tool implementation pattern
- [Source: src/utils/base64.ts] — Reference utility function pattern
- [Source: src/utils/url.ts] — Reference utility function pattern (most recent)
- [Source: src/utils/validation.ts] — isValidJwt already exists (format: 3 dot-separated Base64URL segments)
- [Source: src/utils/validation.spec.ts] — isValidJwt tests already exist (8 test cases)
- [Source: src/constants/tool-registry.ts] — Current registry with 7 tools
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey union to update
- [Source: src/hooks/useToolError.ts] — Error handling hook
- [Source: src/hooks/useDebounceCallback.ts] — Debounce utility (150ms)
- [Source: vite.config.ts] — Pre-render routes pattern (MUST add JWT Decoder route)
- [Source: CONTRIBUTING.md] — Add-a-tool workflow documentation
- [Source: _bmad-output/implementation-artifacts/5-1-url-encoder-decoder.md] — Previous story learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered. All tasks completed on first pass.

### Completion Notes List

- Created `decodeJwt()` pure function with Base64URL decoding, JSON parsing, and descriptive error messages for invalid inputs
- Created `formatTimestampClaim()` helper that converts Unix seconds to locale-aware human-readable date strings
- Wrote 13 unit tests covering: valid JWT decode (HS256, RS256), timestamp claims (exp/iat/nbf), signature passthrough, error cases (empty, 2-segment, 4-segment, invalid Base64URL, malformed JSON in header/payload), and formatTimestampClaim edge cases
- Built JwtDecoder component following EncodingBase64 dialog pattern — decode-only with 3 result sections (Header, Payload with timestamp annotations, Signature with "not verified" note)
- Differentiated error messages: format validation error vs decode failure error, both auto-clearing on valid input
- Registered tool in TOOL_REGISTRY (Encoding category, key: jwt-decoder), updated ToolRegistryKey type, added pre-render route in vite.config.ts
- All 337 tests pass (13 new + 324 existing), 0 lint errors, formatting clean, build succeeds with separate JwtDecoder chunk (3.48 kB)

#### Code Review Fixes (2026-02-14)

- [H1] Fixed payload CopyButton copying invalid JSON — separated display value (with `//` timestamp annotations) from copy value (clean JSON). CopyButton now copies valid JSON.
- [M1] Moved `formatPayloadWithTimestamps` from JwtDecoder.tsx to `jwt.ts` for testability. Added 5 unit tests: no timestamps, single timestamp, all three timestamps, non-numeric timestamp claims, nested properties with timestamp names.
- [M2] Replaced unsafe `as Record<string, unknown>` casts in `decodeJwt` with runtime `isPlainObject` validation. Non-object JSON values (arrays, strings, numbers) now throw. Added 2 tests for non-object header/payload.
- [M3] Strengthened `formatTimestampClaim` tests to verify time component (`\d{1,2}:\d{2}`) in addition to year.
- [L1] Refactored `formatPayloadWithTimestamps` to use `startsWith` on 2-space-indented lines instead of regex, preventing false matches on nested properties.
- [L2] Eliminated per-iteration RegExp construction by using `Map<string, number>` from payload object and `startsWith` matching.
- All 344 tests pass (20 JWT + 324 existing), 0 lint errors, formatting clean

### Change Log

- 2026-02-14: Story 5-2 JWT Decoder implemented — all 6 tasks complete, all ACs satisfied
- 2026-02-14: Code review — 7 issues found (1H, 3M, 3L), all fixed. 7 new tests added (20 total JWT tests, 344 total)

### File List

**Created:**
- `src/utils/jwt.ts` — decodeJwt(), formatTimestampClaim(), formatPayloadWithTimestamps() pure functions
- `src/utils/jwt.spec.ts` — 20 unit tests for JWT utilities
- `src/components/feature/encoding/JwtDecoder.tsx` — JWT Decoder component

**Modified:**
- `src/utils/index.ts` — Added barrel export for jwt
- `src/components/feature/encoding/index.ts` — Added barrel export for JwtDecoder
- `src/constants/tool-registry.ts` — Added JWT Decoder registry entry (8th tool)
- `src/types/constants/tool-registry.ts` — Added 'jwt-decoder' to ToolRegistryKey union
- `vite.config.ts` — Added JWT Decoder pre-render route
