---
story: 19.2
title: URL Parser
status: ready-for-dev
epic: 19
---

# Story 19.2: URL Parser

Status: ready-for-dev

## Story

As a **user**,
I want **to paste a URL and see it broken down into protocol, host, port, path, query parameters, and fragment**,
So that **I can inspect and debug URLs quickly**.

**Epic:** Epic 19 — Developer Reference & Utility Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (CopyButton, FieldForm — complete)
**Story Key:** 19-2-url-parser

## Acceptance Criteria

### AC1: Tool Registered and Renders Inline

**Given** the URL Parser tool registered in `TOOL_REGISTRY` under the Encoding category
**When** the user navigates to it (via sidebar, command palette, or `/tools/url-parser` route)
**Then** it renders inline with a text input and parsed output region
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: URL Parsing via Native URL API

**Given** the user enters a valid URL
**When** the value changes (debounced 300ms)
**Then** the URL is parsed using the native `URL` constructor
**And** all components are displayed in a structured breakdown

### AC3: Display All URL Components

**Given** a parsed URL
**When** the result renders
**Then** the following parts are displayed: protocol, hostname, port (or "default" if empty), pathname, hash (fragment)
**And** each part has its own `CopyButton`

### AC4: Query Parameters as Key-Value Table

**Given** a URL with query parameters (e.g., `?foo=bar&baz=qux`)
**When** parsed
**Then** search params are displayed as a key-value table with columns: Parameter, Value
**And** each row has a `CopyButton` for the value
**And** the full query string also has a `CopyButton`

### AC5: Error Handling for Invalid URLs

**Given** an invalid URL (not parseable by `new URL()`)
**When** the user enters it
**Then** an inline error message appears: "Invalid URL — enter a fully qualified URL (e.g., https://example.com)"
**And** the parsed output clears

### AC6: Empty State

**Given** no input
**When** the tool loads or input is cleared
**Then** no parsed output is shown (empty state)
**And** placeholder text guides the user (e.g., "https://example.com:8080/path?key=value#section")

### AC7: Unit Tests Cover URL Parsing

**Given** unit tests in `src/utils/url-parse.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: full URL with all parts, URL without port, URL without query, URL without hash, multiple query params, encoded query params, invalid URL returns error, protocol-only URLs

## Tasks / Subtasks

- [ ] Task 1: Create URL parse utility (AC: #2, #3, #4, #5, #7)
  - [ ] 1.1 Create `src/utils/url-parse.ts` with `parseUrl(input: string): UrlParseResult`
  - [ ] 1.2 Define `UrlParseResult` type: `{ protocol, hostname, port, pathname, search, searchParams: Array<{key, value}>, hash, error? }`
  - [ ] 1.3 Use native `URL` constructor, catch errors and return `{ error: string }`
  - [ ] 1.4 Parse `searchParams` into key-value array from `URL.searchParams`
  - [ ] 1.5 Export `parseUrl`, `UrlParseResult`

- [ ] Task 2: Write unit tests (AC: #7)
  - [ ] 2.1 Create `src/utils/url-parse.spec.ts`
  - [ ] 2.2 Test full URL: `https://example.com:8080/path?key=value#section`
  - [ ] 2.3 Test URL without port: `https://example.com/path`
  - [ ] 2.4 Test URL without query params
  - [ ] 2.5 Test URL without hash
  - [ ] 2.6 Test multiple query params
  - [ ] 2.7 Test encoded query params (e.g., `%20`, `+`)
  - [ ] 2.8 Test invalid URL returns error
  - [ ] 2.9 Test empty string returns error
  - [ ] 2.10 Test URL with only protocol and host

- [ ] Task 3: Create UrlParser component (AC: #1, #2, #3, #4, #5, #6)
  - [ ] 3.1 Create `src/components/feature/encoding/UrlParser.tsx` as named export
  - [ ] 3.2 Text input via `FieldForm` type="text" with placeholder URL
  - [ ] 3.3 Parse URL on input change with 300ms debounce via `useDebounceCallback`
  - [ ] 3.4 Display parsed parts in labeled rows, each with `CopyButton`
  - [ ] 3.5 Display search params as key-value table
  - [ ] 3.6 Show error via `useToolError` for invalid URLs
  - [ ] 3.7 Show tool description from `TOOL_REGISTRY_MAP['url-parser']`

- [ ] Task 4: Register tool in TOOL_REGISTRY (AC: #1)
  - [ ] 4.1 Add `'url-parser'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts`
  - [ ] 4.2 Add registry entry to `TOOL_REGISTRY` in `src/constants/tool-registry.ts`
  - [ ] 4.3 Add pre-render route in `vite.config.ts`

- [ ] Task 5: Create barrel exports (AC: #1)
  - [ ] 5.1 Add `export { UrlParser } from './UrlParser'` to `src/components/feature/encoding/index.ts`
  - [ ] 5.2 Add `export * from './url-parse'` to `src/utils/index.ts`

- [ ] Task 6: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7)
  - [ ] 6.1 Run `pnpm lint` — no errors
  - [ ] 6.2 Run `pnpm format:check` — no formatting issues
  - [ ] 6.3 Run `pnpm test` — all tests pass
  - [ ] 6.4 Run `pnpm build` — build succeeds

## Dev Notes

### Processing Pattern — Synchronous with Debounce

The `URL` constructor is synchronous but input should still be debounced (300ms) to avoid re-rendering on every keystroke. Error handling via try/catch around `new URL(input)`.

### UI Layout (Inline)

```
┌──────────────────────────────────────────────────────────────────┐
│  Parse URLs into their component parts...                        │
│                                                                  │
│  URL Input                                                       │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ https://example.com:8080/path?key=value#section           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ──────────── dashed divider ─────────────                       │
│                                                                  │
│  Protocol   https:                                    [Copy]     │
│  Hostname   example.com                               [Copy]     │
│  Port       8080                                      [Copy]     │
│  Pathname   /path                                     [Copy]     │
│  Hash       #section                                  [Copy]     │
│                                                                  │
│  Query Parameters                                     [Copy All] │
│  ┌──────────┬────────────────────────────────────────────────┐   │
│  │ key      │ value                                   [Copy] │   │
│  └──────────┴────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Architecture Compliance

- **Named export only** — `export const UrlParser`
- **Lazy-loaded** — code split via registry
- **100% client-side** — native `URL` API, zero network requests
- **No new dependencies** — native browser API only
- **useToolError** — for invalid URL error display
- **useDebounceCallback** — 300ms debounce on input
- **CopyButton** per parsed part

### Previous Story Intelligence

From Story 19.1 (CSS Border Radius Generator):
- Inline layout pattern with tool description at top
- Dashed divider between input and output sections
- Follow existing encoding tool patterns in `src/components/feature/encoding/`

### References

- [Source: src/components/feature/encoding/UrlEncoder.tsx] — Similar tool in Encoding category
- [Source: _bmad-output/planning-artifacts/epics-expansion.md#Story 19.2] — Epic definition
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey union to update

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/utils/url-parse.ts` | NEW | parseUrl(), UrlParseResult type |
| `src/utils/url-parse.spec.ts` | NEW | Unit tests (~10 tests) |
| `src/components/feature/encoding/UrlParser.tsx` | NEW | URL Parser component |
| `src/types/constants/tool-registry.ts` | MODIFY | Add 'url-parser' to ToolRegistryKey |
| `src/constants/tool-registry.ts` | MODIFY | Add registry entry |
| `src/components/feature/encoding/index.ts` | MODIFY | Add UrlParser barrel export |
| `src/utils/index.ts` | MODIFY | Add url-parse barrel export |
| `vite.config.ts` | MODIFY | Add pre-render route |

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log
