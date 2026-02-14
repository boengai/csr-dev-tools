# Story 5.1: URL Encoder/Decoder

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to encode and decode URL strings in the browser**,
So that **I can quickly prepare or inspect URL-encoded values for web development**.

**Epic:** Epic 5 — Encoding & Decoding Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (useToolError, CopyButton — complete)
**Story Key:** 5-1-url-encoder-decoder

## Acceptance Criteria

### AC1: Tool Registered and Renders via ToolLayout Pattern

**Given** the URL Encoder/Decoder tool registered in `TOOL_REGISTRY` under the Encoding category
**When** the user navigates to it (via sidebar, command palette, or `/tools/url-encoder-decoder` route)
**Then** it renders with encode and decode modes (tabs or toggle)
**And** a one-line description is shown from the registry entry
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: URL Encoding Works in Real-Time

**Given** a user pastes a plain string into the encode input (e.g., `hello world&foo=bar`)
**When** the value is entered
**Then** the URL-encoded output appears in real-time (debounced 150ms): `hello%20world%26foo%3Dbar`
**And** a `CopyButton` is adjacent to the output

### AC3: URL Decoding Works in Real-Time

**Given** a user pastes a URL-encoded string into the decode input (e.g., `hello%20world%26foo%3Dbar`)
**When** the value is entered
**Then** the decoded plaintext appears in real-time: `hello world&foo=bar`
**And** a `CopyButton` is adjacent to the output

### AC4: Invalid Decode Input Shows Inline Error

**Given** an invalid encoded string (e.g., `%ZZ`)
**When** decoding fails
**Then** an inline error appears: `"Enter a valid URL-encoded string (e.g., hello%20world)"`
**And** the error clears automatically when the input changes to a valid value

### AC5: Uses Standard Error Handling and Client-Side Processing

**Given** the tool component
**When** it is implemented
**Then** it uses `useToolError` for error handling
**And** all processing is 100% client-side using `encodeURIComponent()` / `decodeURIComponent()`
**And** zero network requests are made

### AC6: Unit Tests Cover All Edge Cases

**Given** unit tests in `src/utils/url.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: standard encoding, special characters (`&`, `=`, `?`, `#`, `@`, `!`), Unicode, empty input, already-encoded input, double-encoding edge cases, invalid decode input (`%ZZ`), spaces (both `%20` and `+` handling)

## Tasks / Subtasks

- [x] Task 1: Create URL encoding/decoding utility functions (AC: #2, #3, #5, #6)
  - [x] 1.1 Create `src/utils/url.ts` with `encodeUrl(input: string): string` and `decodeUrl(input: string): string` pure functions
  - [x] 1.2 `encodeUrl` wraps `encodeURIComponent()` — encodes all special characters including `&`, `=`, `?`, `#`, `@`, `+`, spaces
  - [x] 1.3 `decodeUrl` wraps `decodeURIComponent()` — throws on invalid sequences (e.g., `%ZZ`) so the caller can catch and show error
  - [x] 1.4 Export from `src/utils/index.ts` barrel

- [x] Task 2: Write unit tests for URL utilities (AC: #6)
  - [x] 2.1 Create `src/utils/url.spec.ts` following existing `validation.spec.ts` pattern
  - [x] 2.2 Test `encodeUrl`: plain text, special characters (`& = ? # @ ! + /`), Unicode characters, empty string, already-encoded input (double-encoding behavior), spaces → `%20`
  - [x] 2.3 Test `decodeUrl`: standard encoded strings, Unicode, empty string, invalid sequences (`%ZZ`, `%`, `%G1`) throw errors, multi-byte characters, full URL path decoding

- [x] Task 3: Create UrlEncoder component (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Create `src/components/feature/encoding/UrlEncoder.tsx` as named export
  - [x] 3.2 Follow `EncodingBase64.tsx` pattern exactly: dialog-based with encode/decode buttons, full-screen dialog with source/result textareas
  - [x] 3.3 Use `useToolError` for error state, `useDebounceCallback` (150ms) for processing, `CopyButton` on result
  - [x] 3.4 Use `FieldForm` with appropriate placeholders: encode placeholder `hello world&foo=bar`, decode placeholder `hello%20world%26foo%3Dbar`
  - [x] 3.5 On decode error, call `setError('Enter a valid URL-encoded string (e.g., hello%20world)')` — clears on valid input via `clearError()`
  - [x] 3.6 Show tool description from `TOOL_REGISTRY_MAP['url-encoder-decoder']`

- [x] Task 4: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 4.1 Add `'url-encoder-decoder'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts`
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts` with all required fields (key, name, category, emoji, description, seo, routePath, component lazy import)
  - [x] 4.3 Maintain alphabetical ordering in the registry array (by key)

- [x] Task 5: Update barrel exports (AC: #1)
  - [x] 5.1 Add `export * from './UrlEncoder'` to `src/components/feature/encoding/index.ts`

- [x] Task 6: Verify integration (AC: #1, #2, #3, #4, #5)
  - [x] 6.1 Run `pnpm lint` — no errors
  - [x] 6.2 Run `pnpm format:check` — no formatting issues
  - [x] 6.3 Run `pnpm test` — all tests pass (existing + new)
  - [x] 6.4 Run `pnpm build` — build succeeds, tool chunk is separate

## Dev Notes

### CRITICAL: Follow Existing EncodingBase64 Pattern Exactly

This tool is in the **same domain** (`encoding/`) as the existing Base64 tool. The implementation pattern MUST match `EncodingBase64.tsx` exactly:

1. **Dialog-based UI:** Two buttons ("Encode" / "Decode") on the card, clicking opens a full-screen `Dialog` with source textarea on left, result textarea on right (stacked on mobile)
2. **State management:** `useState` for source, result, action (encode/decode), dialogOpen
3. **Debounced processing:** `useDebounceCallback` with 150ms delay
4. **Error display:** `{error != null && <p className="text-error text-body-sm" role="alert">{error}</p>}` at bottom of dialog content
5. **Tool description:** `TOOL_REGISTRY_MAP['url-encoder-decoder']?.description` shown above buttons
6. **Reset on close:** `handleReset` clears source, result, error via `onAfterClose`

### Architecture Compliance

- **TOOL_REGISTRY entry required** — tool must be discoverable via sidebar, command palette, dashboard selection dialog, and direct URL. The dashboard is a fixed 6-slot favorites grid — new tools do NOT auto-appear there [Source: architecture.md#Tool Registry]
- **Named export only** — `export const UrlEncoder` (never `export default`) [Source: project-context.md#Named exports]
- **Lazy-loaded component** — registry uses `lazy(() => import(...).then(({ UrlEncoder }) => ({ default: UrlEncoder })))` [Source: architecture.md#Code Splitting]
- **100% client-side** — `encodeURIComponent()` / `decodeURIComponent()` are native browser APIs, zero network requests [Source: architecture.md#Hard Constraints]
- **Encoding category** — existing category, no `ToolCategory` type update needed [Source: tool-registry.ts types]
- **New ToolRegistryKey** — must add `'url-encoder-decoder'` to the union type [Source: src/types/constants/tool-registry.ts]

### Library & Framework Requirements

- **No new dependencies** — URL encoding/decoding uses native browser APIs (`encodeURIComponent`, `decodeURIComponent`)
- **Existing imports used:** `useState` from React, `Button`, `CopyButton`, `Dialog`, `FieldForm` from `@/components/common`, `TOOL_REGISTRY_MAP` from `@/constants`, `useDebounceCallback`, `useToolError` from `@/hooks`

### File Structure Requirements

**Files to CREATE:**

```
src/utils/url.ts                             — encodeUrl() and decodeUrl() pure functions
src/utils/url.spec.ts                        — Unit tests for URL encode/decode
src/components/feature/encoding/UrlEncoder.tsx — URL Encoder/Decoder component
```

**Files to MODIFY:**

```
src/utils/index.ts                           — Add barrel export for url utils
src/components/feature/encoding/index.ts     — Add barrel export for UrlEncoder
src/constants/tool-registry.ts               — Add URL Encoder/Decoder registry entry
src/types/constants/tool-registry.ts         — Add 'url-encoder-decoder' to ToolRegistryKey
```

**Files NOT to modify:**
- `src/utils/validation.ts` — `isValidUrl` validates full URLs (with protocol), NOT URL-encoded strings. URL encoding accepts any string as input. Decode errors are caught from `decodeURIComponent()` directly.
- Any existing tool components
- Route configuration (auto-generated from registry)
- Sidebar/Command Palette (auto-populated from registry)

### Testing Requirements

**Unit tests (`src/utils/url.spec.ts`):**

```typescript
describe('url encoding utilities', () => {
  describe('encodeUrl', () => {
    // Standard encoding
    it('should encode spaces as %20')              // 'hello world' → 'hello%20world'
    it('should encode ampersand')                   // 'a&b' → 'a%26b'
    it('should encode equals sign')                 // 'a=b' → 'a%3Db'
    it('should encode question mark')               // 'a?b' → 'a%3Fb'
    it('should encode hash')                        // 'a#b' → 'a%23b'
    it('should encode at sign')                     // 'a@b' → 'a%40b'
    it('should encode plus sign')                   // 'a+b' → 'a%2Bb'
    it('should encode forward slash')               // 'a/b' → 'a%2Fb'

    // Edge cases
    it('should return empty string for empty input') // '' → ''
    it('should not double-encode already-encoded')  // 'hello%20world' → 'hello%2520world' (correct — percent itself gets encoded)
    it('should encode Unicode characters')          // '日本語' → '%E6%97%A5%E6%9C%AC%E8%AA%9E'
    it('should preserve unreserved characters')     // 'abc123-_.~' → 'abc123-_.~' (these are NOT encoded by encodeURIComponent)

    // Multiple special characters
    it('should encode complex query string')        // 'key=val&key2=val 2' → 'key%3Dval%26key2%3Dval%202'
  })

  describe('decodeUrl', () => {
    // Standard decoding
    it('should decode %20 to space')                // 'hello%20world' → 'hello world'
    it('should decode %26 to ampersand')            // 'a%26b' → 'a&b'
    it('should decode multiple encoded characters') // 'hello%20world%26foo%3Dbar' → 'hello world&foo=bar'

    // Edge cases
    it('should return empty string for empty input') // '' → ''
    it('should decode Unicode characters')          // '%E6%97%A5%E6%9C%AC%E8%AA%9E' → '日本語'
    it('should pass through unencoded text')        // 'hello' → 'hello'
    it('should decode plus sign literally')         // 'hello+world' → 'hello+world' (decodeURIComponent does NOT convert + to space)

    // Error cases (must throw)
    it('should throw for invalid sequence %ZZ')     // '%ZZ' → Error
    it('should throw for truncated percent')        // '%' → Error (incomplete sequence)
    it('should throw for single hex digit %A')      // 'test%A' → Error
  })
})
```

**No E2E test in this story** — E2E tests are written separately per the testing strategy. Unit tests cover the core logic.

### Previous Story Intelligence (Cross-Epic)

From Epic 4 (most recent completed epic):
- **All infrastructure is in place:** CI/CD pipeline, E2E test infrastructure, Lighthouse CI, CONTRIBUTING guide
- **The "add a tool" workflow is documented** in `CONTRIBUTING.md` — follow it precisely
- **Code review feedback pattern:** stories get `✨:` commit prefix for new features
- **ToolLayout was deprecated (story 3-1)** — each tool owns its own layout, which this tool does via the dialog pattern

### Git Intelligence

Recent commits analyzed:
```
f6e45be 🔄: epic 4 retrospective
71c559a 📝: story 4-4
e5f588e ✨: story 4-3
ef7ad63 ✨: story 4-2
fd4a033 ✨: story 4-1
```

**Pattern:** New tool feature → use `✨: story 5-1` commit prefix
**Files modified in similar stories (3-2 base64 refactor):** tool component, utility function, utility tests, registry entry, types, barrel exports

### TOOL_REGISTRY Entry (Copy-Paste Ready)

```typescript
{
  category: 'Encoding',
  component: lazy(() =>
    import('@/components/feature/encoding/UrlEncoder').then(
      ({ UrlEncoder }: { UrlEncoder: ComponentType }) => ({
        default: UrlEncoder,
      }),
    ),
  ),
  description: 'Encode and decode URL strings in the browser',
  emoji: '🔗',
  key: 'url-encoder-decoder',
  name: 'URL Encoder/Decoder',
  routePath: '/tools/url-encoder-decoder',
  seo: {
    description:
      'Encode and decode URL strings online. Convert special characters to percent-encoded format instantly in your browser.',
    title: 'URL Encoder/Decoder - CSR Dev Tools',
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
  | 'px-to-rem'
  | 'unix-timestamp'
  | 'url-encoder-decoder'
```

### Project Structure Notes

- Component placed in `src/components/feature/encoding/` — same domain as `EncodingBase64.tsx`
- Utility functions in `src/utils/url.ts` — parallel to `src/utils/base64.ts`
- Tests co-located as `src/utils/url.spec.ts` — parallel to `src/utils/base64.ts` (base64 doesn't have its own spec but color and validation do)
- No new directories needed — all target directories exist
- No type file created in `src/types/components/feature/encoding/` — component has no custom props (follows EncodingBase64 pattern which also has no types file)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1] — Full AC definitions and story requirements
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5] — Epic objectives and FR coverage (FR9)
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Registry] — Registry entry pattern with all required fields
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Text conversion: on input change, 150ms debounce
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Message Format] — Concise, actionable, with example of valid input
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Tool component file structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Hard Constraints] — Zero server-side processing
- [Source: _bmad-output/project-context.md] — 53 project rules (named exports, type not interface, etc.)
- [Source: src/components/feature/encoding/EncodingBase64.tsx] — Reference implementation pattern
- [Source: src/utils/base64.ts] — Reference utility function pattern
- [Source: src/constants/tool-registry.ts] — Current registry with 6 tools
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey union to update
- [Source: src/hooks/useToolError.ts] — Error handling hook
- [Source: src/hooks/useDebounceCallback.ts] — Debounce utility
- [Source: src/utils/validation.ts] — isValidUrl (not used for this tool — validates full URLs, not encoded strings)
- [Source: CONTRIBUTING.md] — Add-a-tool workflow documentation

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Build initially failed because test file used vitest globals without explicit import. Fixed by adding `import { describe, expect, it } from 'vitest'` to match existing spec file pattern.

### Completion Notes List

- Implemented `encodeUrl()` and `decodeUrl()` pure utility functions wrapping native `encodeURIComponent`/`decodeURIComponent`
- Created 23 unit tests covering standard encoding, special characters, Unicode, empty input, double-encoding, invalid decode sequences
- Built `UrlEncoder.tsx` component following `EncodingBase64.tsx` pattern exactly: dialog-based UI with encode/decode buttons, debounced processing (150ms), error handling via `useToolError`, CopyButton on result
- Registered tool in `TOOL_REGISTRY` with lazy-loaded component, SEO metadata, and correct alphabetical ordering
- All 322 tests pass (23 new + 299 existing), lint clean, format clean, build succeeds with separate `UrlEncoder` chunk (2.20 kB)

### File List

**Created:**
- `src/utils/url.ts` — encodeUrl() and decodeUrl() pure functions
- `src/utils/url.spec.ts` — 23 unit tests for URL encode/decode
- `src/components/feature/encoding/UrlEncoder.tsx` — URL Encoder/Decoder component

**Modified:**
- `src/utils/index.ts` — Added barrel export for url utils
- `src/components/feature/encoding/index.ts` — Added barrel export for UrlEncoder
- `src/constants/tool-registry.ts` — Added URL Encoder/Decoder registry entry
- `src/types/constants/tool-registry.ts` — Added 'url-encoder-decoder' to ToolRegistryKey union
- `vite.config.ts` — Added URL Encoder/Decoder pre-render route for SEO

## Change Log

- 2026-02-14: Implemented URL Encoder/Decoder tool (Story 5.1) — new encoding tool with encode/decode utility functions, 23 unit tests, dialog-based component matching EncodingBase64 pattern, registered in TOOL_REGISTRY
- 2026-02-14: Code review fixes — added missing pre-render route in vite.config.ts (SEO), differentiated encode/decode error messages in UrlEncoder.tsx, added 2 missing test cases (exclamation mark, full URL path decoding). Tests: 324 pass (25 URL tests).
