---
story: 19.5
title: User Agent Parser
status: ready-for-dev
epic: 19
---

# Story 19.5: User Agent Parser

Status: ready-for-dev

## Story

As a **user**,
I want **to paste a user agent string and see it parsed into browser, OS, device, and engine details**,
So that **I can debug UA-related issues and understand client environments**.

**Epic:** Epic 19 — Developer Reference & Utility Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (CopyButton, FieldForm — complete)
**Story Key:** 19-5-user-agent-parser

## Acceptance Criteria

### AC1: Tool Registered and Renders Inline

**Given** the User Agent Parser tool registered in `TOOL_REGISTRY` under the Text category
**When** the user navigates to it (via sidebar, command palette, or `/tools/user-agent-parser` route)
**Then** it renders inline with a text input and parsed output region
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Text Input with "Use My UA" Button

**Given** the input area
**When** the tool renders
**Then** a text input accepts a user agent string
**And** a "Use my UA" button populates the input with `navigator.userAgent`
**And** parsing triggers on input change (debounced 300ms)

### AC3: Parse Browser Information

**Given** a valid user agent string
**When** parsed
**Then** the browser name and version are extracted (e.g., Chrome 120.0.6099.130)
**And** the result is displayed with a `CopyButton`

### AC4: Parse OS Information

**Given** a valid user agent string
**When** parsed
**Then** the OS name and version are extracted (e.g., Windows 10, macOS 14.2, Linux, Android 14, iOS 17.2)
**And** the result is displayed with a `CopyButton`

### AC5: Parse Device Type

**Given** a valid user agent string
**When** parsed
**Then** the device type is detected: Desktop, Mobile, or Tablet
**And** the result is displayed with a `CopyButton`

### AC6: Parse Engine Information

**Given** a valid user agent string
**When** parsed
**Then** the rendering engine name and version are extracted (e.g., Blink, Gecko, WebKit)
**And** the result is displayed with a `CopyButton`

### AC7: Handle Unknown/Unrecognized UA

**Given** a user agent string that cannot be fully parsed
**When** a field cannot be determined
**Then** "Unknown" is displayed for that field
**And** no error is thrown — partial results are shown

### AC8: Empty State

**Given** no input
**When** the tool loads or input is cleared
**Then** no parsed output is shown
**And** placeholder text guides the user

### AC9: Unit Tests Cover UA Parsing

**Given** unit tests in `src/utils/user-agent.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: Chrome on Windows, Firefox on macOS, Safari on iOS (mobile), Edge on Windows, Chrome on Android (mobile), bot/crawler UA, empty string, unknown UA returns "Unknown" fields

## Tasks / Subtasks

- [ ] Task 1: Create user-agent parsing utility (AC: #3, #4, #5, #6, #7, #9)
  - [ ] 1.1 Create `src/utils/user-agent.ts` with `parseUserAgent(ua: string): UserAgentResult`
  - [ ] 1.2 Define `UserAgentResult` type: `{ browser: { name: string, version: string }, os: { name: string, version: string }, device: string, engine: { name: string, version: string } }`
  - [ ] 1.3 Implement browser detection via regex: Chrome, Firefox, Safari, Edge, Opera, IE
  - [ ] 1.4 Implement OS detection via regex: Windows, macOS, Linux, Android, iOS, Chrome OS
  - [ ] 1.5 Implement device type detection: Mobile (iPhone|Android.*Mobile), Tablet (iPad|Android(?!.*Mobile)), Desktop (fallback)
  - [ ] 1.6 Implement engine detection: Blink (Chrome/Edge), Gecko (Firefox), WebKit (Safari), Trident (IE)
  - [ ] 1.7 Return "Unknown" for unrecognized fields — never throw
  - [ ] 1.8 Export `parseUserAgent`, `UserAgentResult`

- [ ] Task 2: Write unit tests (AC: #9)
  - [ ] 2.1 Create `src/utils/user-agent.spec.ts`
  - [ ] 2.2 Test Chrome on Windows 10 UA
  - [ ] 2.3 Test Firefox on macOS UA
  - [ ] 2.4 Test Safari on iOS (iPhone) — device type "Mobile"
  - [ ] 2.5 Test Edge on Windows UA
  - [ ] 2.6 Test Chrome on Android — device type "Mobile"
  - [ ] 2.7 Test Chrome on Android tablet — device type "Tablet"
  - [ ] 2.8 Test Googlebot/crawler UA
  - [ ] 2.9 Test empty string returns all "Unknown"
  - [ ] 2.10 Test random/garbage string returns all "Unknown"

- [ ] Task 3: Create UserAgentParser component (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [ ] 3.1 Create `src/components/feature/text/UserAgentParser.tsx` as named export
  - [ ] 3.2 Text input via `FieldForm` type="text" with placeholder UA string
  - [ ] 3.3 "Use my UA" button that calls `navigator.userAgent` and populates input
  - [ ] 3.4 Parse UA on input change with 300ms debounce via `useDebounceCallback`
  - [ ] 3.5 Display parsed results in labeled rows: Browser, OS, Device, Engine — each with `CopyButton`
  - [ ] 3.6 Show "Unknown" for unrecognized fields (no error state)
  - [ ] 3.7 Empty state when no input
  - [ ] 3.8 Show tool description from `TOOL_REGISTRY_MAP['user-agent-parser']`

- [ ] Task 4: Register tool in TOOL_REGISTRY (AC: #1)
  - [ ] 4.1 Add `'user-agent-parser'` to `ToolRegistryKey` union
  - [ ] 4.2 Add registry entry to `TOOL_REGISTRY` (Text category, 🕵️ emoji)
  - [ ] 4.3 Add pre-render route in `vite.config.ts`

- [ ] Task 5: Create barrel exports (AC: #1)
  - [ ] 5.1 Add `export { UserAgentParser } from './UserAgentParser'` to `src/components/feature/text/index.ts`
  - [ ] 5.2 Add `export * from './user-agent'` to `src/utils/index.ts`

- [ ] Task 6: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7, #8, #9)
  - [ ] 6.1 Run `pnpm lint` — no errors
  - [ ] 6.2 Run `pnpm format:check` — no formatting issues
  - [ ] 6.3 Run `pnpm test` — all tests pass
  - [ ] 6.4 Run `pnpm build` — build succeeds

## Dev Notes

### Processing Pattern — Synchronous with Debounce

Regex-based parsing is synchronous but input should be debounced (300ms) to avoid re-rendering on every keystroke. No external dependencies — all parsing is regex-based.

### UI Layout (Inline)

```
┌──────────────────────────────────────────────────────────────────┐
│  Parse user agent strings into browser, OS, device, and engine.. │
│                                                                  │
│  User Agent String                              [Use my UA]      │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit... │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ──────────── dashed divider ─────────────                       │
│                                                                  │
│  Browser   Chrome 120.0.6099.130                      [Copy]     │
│  OS        Windows 10                                 [Copy]     │
│  Device    Desktop                                    [Copy]     │
│  Engine    Blink                                      [Copy]     │
└──────────────────────────────────────────────────────────────────┘
```

### Regex Strategy

Order matters for browser detection (check Edge before Chrome, Chrome before Safari):

```
Edge → /Edg\/([\d.]+)/
Firefox → /Firefox\/([\d.]+)/
Chrome → /Chrome\/([\d.]+)/ (after Edge check)
Safari → /Version\/([\d.]+).*Safari/ (after Chrome check)
Opera → /OPR\/([\d.]+)/
```

### Architecture Compliance

- **Named export only** — `export const UserAgentParser`
- **Lazy-loaded** — code split via registry
- **100% client-side** — regex parsing, no network requests
- **No new dependencies** — regex-only parsing
- **useDebounceCallback** — 300ms on input
- **CopyButton** per parsed field
- **No useToolError** — invalid UAs return "Unknown" rather than errors

### Previous Story Intelligence

From Story 19.1 (CSS Border Radius Generator):
- Inline layout pattern with tool description

From Story 19.2 (URL Parser):
- Text input → parsed structured output pattern with CopyButton per field
- Debounced input processing
- Very similar UI pattern — labeled rows with copy buttons

From Story 19.3 (Markdown Table Generator):
- Dialog vs inline decision — this tool is inline (simple output)

From Story 19.4 (HTTP Status Codes):
- Static data pattern — but this tool parses dynamic input instead

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion.md#Story 19.5] — Epic definition
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey union
- [Source: src/components/feature/text/] — Text category component directory

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/utils/user-agent.ts` | NEW | parseUserAgent(), UserAgentResult type |
| `src/utils/user-agent.spec.ts` | NEW | Unit tests (~10 tests) |
| `src/components/feature/text/UserAgentParser.tsx` | NEW | User Agent Parser component |
| `src/types/constants/tool-registry.ts` | MODIFY | Add 'user-agent-parser' to ToolRegistryKey |
| `src/constants/tool-registry.ts` | MODIFY | Add registry entry |
| `src/components/feature/text/index.ts` | MODIFY | Add barrel export |
| `src/utils/index.ts` | MODIFY | Add user-agent barrel export |
| `vite.config.ts` | MODIFY | Add pre-render route |

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log
