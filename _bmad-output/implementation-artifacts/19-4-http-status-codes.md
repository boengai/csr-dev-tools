---
story: 19.4
title: HTTP Status Code Reference
status: ready-for-dev
epic: 19
---

# Story 19.4: HTTP Status Code Reference

Status: ready-for-dev

## Story

As a **user**,
I want **to search and browse HTTP status codes with descriptions and common use cases**,
So that **I can quickly look up what a status code means**.

**Epic:** Epic 19 — Developer Reference & Utility Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (CopyButton, FieldForm — complete)
**Story Key:** 19-4-http-status-codes

## Acceptance Criteria

### AC1: Tool Registered and Renders Inline

**Given** the HTTP Status Codes tool registered in `TOOL_REGISTRY` under the Data category
**When** the user navigates to it (via sidebar, command palette, or `/tools/http-status-codes` route)
**Then** it renders inline with a search input and categorized status code list
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Complete HTTP Status Code Database

**Given** the tool renders
**When** the status code list is displayed
**Then** it includes all standard HTTP status codes across 5 categories:
- 1xx Informational (100, 101, 102, 103)
- 2xx Success (200, 201, 202, 203, 204, 205, 206, 207, 208, 226)
- 3xx Redirection (300, 301, 302, 303, 304, 305, 307, 308)
- 4xx Client Error (400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451)
- 5xx Server Error (500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511)

### AC3: Status Code Details

**Given** each status code entry
**When** displayed
**Then** it shows: numeric code, official name, brief description, and a common use case example
**And** the code number is visually prominent

### AC4: Search Filter

**Given** the search input
**When** the user types a search query
**Then** the list filters by matching against: code number, name, description, or use case
**And** filtering is case-insensitive and happens in real-time (no debounce needed — in-memory filter)

### AC5: Category Filter

**Given** category filter buttons/tabs
**When** the user selects a category (e.g., "4xx Client Error")
**Then** only status codes in that category are shown
**And** an "All" option shows all categories
**And** search and category filters combine (both must match)

### AC6: Empty Search State

**Given** a search query that matches no codes
**When** the filter returns no results
**Then** a "No matching status codes" message is displayed

### AC7: Unit Tests Cover Status Code Data

**Given** unit tests in `src/utils/http-status.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: data completeness (all standard codes present), filtering by text, filtering by category, combined filtering, no-match returns empty, each code has required fields (code, name, description, useCase)

## Tasks / Subtasks

- [ ] Task 1: Create HTTP status code data (AC: #2, #3, #7)
  - [ ] 1.1 Create `src/utils/http-status.ts` with `HTTP_STATUS_CODES` constant array
  - [ ] 1.2 Define `HttpStatusCode` type: `{ code: number, name: string, category: HttpStatusCategory, description: string, useCase: string }`
  - [ ] 1.3 Define `HttpStatusCategory` type: `'1xx Informational' | '2xx Success' | '3xx Redirection' | '4xx Client Error' | '5xx Server Error'`
  - [ ] 1.4 Populate all standard HTTP status codes with descriptions and use cases
  - [ ] 1.5 Create `filterHttpStatusCodes(codes, query, category): Array<HttpStatusCode>` filter function
  - [ ] 1.6 Export `HTTP_STATUS_CODES`, `HttpStatusCode`, `HttpStatusCategory`, `filterHttpStatusCodes`

- [ ] Task 2: Write unit tests (AC: #7)
  - [ ] 2.1 Create `src/utils/http-status.spec.ts`
  - [ ] 2.2 Test all 1xx codes present
  - [ ] 2.3 Test all 2xx codes present
  - [ ] 2.4 Test all 4xx codes present (most numerous)
  - [ ] 2.5 Test filter by text "not found" matches 404
  - [ ] 2.6 Test filter by code "200" matches 200 OK
  - [ ] 2.7 Test filter by category "5xx Server Error"
  - [ ] 2.8 Test combined filter: category + text
  - [ ] 2.9 Test no match returns empty array
  - [ ] 2.10 Test every entry has all required fields

- [ ] Task 3: Create HttpStatusCodes component (AC: #1, #2, #3, #4, #5, #6)
  - [ ] 3.1 Create `src/components/feature/data/HttpStatusCodes.tsx` as named export
  - [ ] 3.2 Search input via `FieldForm` type="text" with placeholder "Search by code, name, or description..."
  - [ ] 3.3 Category filter buttons/tabs: All, 1xx, 2xx, 3xx, 4xx, 5xx
  - [ ] 3.4 Render filtered list with each entry showing code (prominent), name, description, use case
  - [ ] 3.5 Category headers/grouping when showing "All"
  - [ ] 3.6 Color-code categories: green (2xx), blue (3xx), yellow (4xx), red (5xx), gray (1xx)
  - [ ] 3.7 Empty state message when no results match
  - [ ] 3.8 Show tool description from `TOOL_REGISTRY_MAP['http-status-codes']`

- [ ] Task 4: Register tool in TOOL_REGISTRY (AC: #1)
  - [ ] 4.1 Add `'http-status-codes'` to `ToolRegistryKey` union
  - [ ] 4.2 Add registry entry to `TOOL_REGISTRY` (Data category, 📡 emoji)
  - [ ] 4.3 Add pre-render route in `vite.config.ts`

- [ ] Task 5: Create barrel exports (AC: #1)
  - [ ] 5.1 Add `export { HttpStatusCodes } from './HttpStatusCodes'` to `src/components/feature/data/index.ts`
  - [ ] 5.2 Add `export * from './http-status'` to `src/utils/index.ts`

- [ ] Task 6: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7)
  - [ ] 6.1 Run `pnpm lint` — no errors
  - [ ] 6.2 Run `pnpm format:check` — no formatting issues
  - [ ] 6.3 Run `pnpm test` — all tests pass
  - [ ] 6.4 Run `pnpm build` — build succeeds

## Dev Notes

### Processing Pattern — Synchronous, In-Memory Filter

No debounce needed. The status code data is a static in-memory array (~60 entries). Filtering is a simple `Array.filter()` on every render — negligible cost.

### UI Layout (Inline)

```
┌──────────────────────────────────────────────────────────────────┐
│  Search and browse HTTP status codes...                          │
│                                                                  │
│  Search: [____________________________________]                  │
│                                                                  │
│  [All] [1xx] [2xx] [3xx] [4xx] [5xx]                             │
│                                                                  │
│  ──────────── 2xx Success ────────────                           │
│                                                                  │
│  200  OK                                                         │
│       Standard response for successful requests                  │
│       Use: API returns data successfully                         │
│                                                                  │
│  201  Created                                                    │
│       Request fulfilled, new resource created                    │
│       Use: POST request creates a new record                    │
│                                                                  │
│  ──────────── 4xx Client Error ────────────                      │
│  ...                                                             │
└──────────────────────────────────────────────────────────────────┘
```

### Architecture Compliance

- **Named export only** — `export const HttpStatusCodes`
- **Lazy-loaded** — code split via registry
- **100% client-side** — static data, no network requests
- **No new dependencies** — pure JS filtering
- **No useToolError needed** — no user input that can error (search just filters)
- **Scrollable list** — the code list may be long; ensure the container scrolls within the card

### Previous Story Intelligence

From Story 19.1 (CSS Border Radius Generator):
- Inline layout with tool description at top

From Story 19.2 (URL Parser):
- Structured output display pattern with labeled rows

From Story 19.3 (Markdown Table Generator):
- Grid/table display for structured data

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion.md#Story 19.4] — Epic definition
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey union
- [Source: src/components/feature/data/] — Data category component directory

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/utils/http-status.ts` | NEW | HTTP_STATUS_CODES data, HttpStatusCode type, filterHttpStatusCodes() |
| `src/utils/http-status.spec.ts` | NEW | Unit tests (~10 tests) |
| `src/components/feature/data/HttpStatusCodes.tsx` | NEW | HTTP Status Codes component |
| `src/types/constants/tool-registry.ts` | MODIFY | Add 'http-status-codes' to ToolRegistryKey |
| `src/constants/tool-registry.ts` | MODIFY | Add registry entry |
| `src/components/feature/data/index.ts` | MODIFY | Add barrel export |
| `src/utils/index.ts` | MODIFY | Add http-status barrel export |
| `vite.config.ts` | MODIFY | Add pre-render route |

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log
