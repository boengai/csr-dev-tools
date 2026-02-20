---
story: 14.1
title: HMAC Generator
status: done
epic: 14
---

# Story 14.1: HMAC Generator

## Story

As a **user**,
I want **to generate HMAC signatures from a message and secret key**,
So that **I can verify API signatures and test webhook authentication locally**.

**Epic:** Epic 14 — Crypto & Security Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (CopyButton, TextAreaInput)
**Story Key:** 14-1-hmac-generator

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the HMAC Generator tool registered in `TOOL_REGISTRY` under the Generator category
**When** the user navigates to it
**Then** it renders inline with message input, key input, and algorithm/encoding toggles

### AC2: HMAC Generation

**Given** inputs for message text, secret key, and algorithm selection (SHA-256, SHA-384, SHA-512)
**When** both message and key are provided
**Then** the HMAC signature appears in real-time (debounced 300ms) in hex encoding
**And** a toggle for hex/base64 output encoding is available

### AC3: Copy Output

**Given** the output
**When** displayed
**Then** a CopyButton copies the HMAC value

### AC4: Empty State

**Given** empty key or message
**When** either is missing
**Then** output shows "—" (empty state)

### AC5: Unit Tests

**Given** unit tests in `src/utils/hmac.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: known HMAC test vectors, all algorithms, base64 encoding, different keys/algorithms

## Tasks / Subtasks

- [x] Task 1: Create HMAC utility functions (AC: #2, #4, #5)
  - [x] 1.1 Create `src/utils/hmac.ts` with `generateHmac()` async function
  - [x] 1.2 Define types: `HmacAlgorithm`, `HmacEncoding`
  - [x] 1.3 Export constants: `HMAC_ALGORITHMS`, `DEFAULT_HMAC_ALGORITHM`, `DEFAULT_HMAC_ENCODING`
  - [x] 1.4 Use Web Crypto API (`crypto.subtle.importKey` + `crypto.subtle.sign`)
  - [x] 1.5 Implement `bufferToHex()` and `bufferToBase64()` helpers

- [x] Task 2: Write unit tests (AC: #5)
  - [x] 2.1 Create `src/utils/hmac.spec.ts`
  - [x] 2.2 Test HMAC-SHA-256 for known input/output
  - [x] 2.3 Test HMAC-SHA-384 produces 96-char hex output
  - [x] 2.4 Test HMAC-SHA-512 produces 128-char hex output
  - [x] 2.5 Test base64 encoding output
  - [x] 2.6 Test different keys produce different results
  - [x] 2.7 Test different algorithms produce different results

- [x] Task 3: Create HmacGenerator component (AC: #1, #2, #3, #4)
  - [x] 3.1 Create `src/components/feature/generator/HmacGenerator.tsx` as named export
  - [x] 3.2 Render inline: TextAreaInput for message, text input for secret key
  - [x] 3.3 Algorithm toggle buttons (SHA-256/384/512) with `aria-pressed`
  - [x] 3.4 Encoding toggle buttons (hex/base64) with `aria-pressed`
  - [x] 3.5 Output in monospace code block with CopyButton
  - [x] 3.6 Use `useDebounceCallback` with 300ms, `sessionRef` + multiple refs for stale prevention
  - [x] 3.7 Algorithm/encoding changes trigger immediate recomputation (no debounce)

- [x] Task 4: Register tool and update exports (AC: #1)
  - [x] 4.1 Add `'hmac-generator'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add export to `src/components/feature/generator/index.ts`
  - [x] 4.4 Add barrel export to `src/utils/index.ts`

## Dev Notes

### Architecture Pattern

**Inline async generator** — renders directly in card without dialog. Uses Web Crypto API (no external dependencies). Complex stale prevention with multiple refs (`sessionRef`, `algorithmRef`, `encodingRef`, `messageRef`, `secretKeyRef`).

### Key Implementation Details

- Web Crypto API: `crypto.subtle.importKey('raw', ...)` → `crypto.subtle.sign('HMAC', ...)`
- Algorithm mapped to Web Crypto hash names (SHA-256, SHA-384, SHA-512)
- `bufferToHex`: converts ArrayBuffer to hex string via `Uint8Array.map(b => b.toString(16).padStart(2, '0'))`
- `bufferToBase64`: converts via `String.fromCharCode` + `btoa()`
- Debounced for message/key input changes; immediate for algorithm/encoding toggle changes
- Multiple refs ensure stale results from previous async operations don't overwrite current state
- Empty message or key immediately clears output and increments sessionRef

### File Locations

| File | Purpose |
|------|---------|
| `src/utils/hmac.ts` | `generateHmac()`, types, constants |
| `src/utils/hmac.spec.ts` | 6 unit tests |
| `src/components/feature/generator/HmacGenerator.tsx` | Component (170 lines) |

## Dev Agent Record

### Completion Notes List

- Created async HMAC generation using Web Crypto API with hex/base64 encoding
- HmacGenerator component with algorithm/encoding toggles, inline layout, complex stale prevention
- 6 unit tests including known test vectors and output format verification

### File List

| File | Action |
|------|--------|
| `src/utils/hmac.ts` | NEW |
| `src/utils/hmac.spec.ts` | NEW |
| `src/components/feature/generator/HmacGenerator.tsx` | NEW |
| `src/components/feature/generator/index.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/constants/tool-registry.ts` | MODIFIED |
| `vite.config.ts` | MODIFIED |

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-20 | Code review (backfill): Fixed misleading RFC 4231 comment in hmac.spec.ts. Added missing prerender route for /tools/hmac-generator to vite.config.ts. Noted: raw `<input>` for secret key (design choice, not fixed), duplicate bufferToBase64 utility across hmac.ts/aes.ts (acceptable duplication). | boengai |

## Senior Developer Review (AI)

**Reviewer:** boengai | **Date:** 2026-02-20 | **Outcome:** Approved with fixes applied

### AC Verification

| AC | Status | Evidence |
|----|--------|----------|
| AC1: Tool Registered | IMPLEMENTED | `hmac-generator` in TOOL_REGISTRY, Generator category |
| AC2: HMAC Generation | IMPLEMENTED | SHA-256/384/512, 300ms debounce, hex/base64 toggle |
| AC3: Copy Output | IMPLEMENTED | CopyButton when hmac non-empty |
| AC4: Empty State | IMPLEMENTED | Shows "\u2014" when key or message empty |
| AC5: Unit Tests | IMPLEMENTED | 6 tests covering vectors, algorithms, encoding |

### Issues Found & Resolved

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| H1 | HIGH | Missing prerender route in vite.config.ts | Fixed: added /tools/hmac-generator route |
| M2 | MEDIUM | Misleading RFC 4231 comment | Fixed: updated to "Known HMAC test vectors" |
| M4 | MEDIUM | Raw `<input>` instead of FieldForm | Noted: intentional label-free inline design |
| M1 | MEDIUM | Duplicate bufferToBase64 across hmac.ts/aes.ts | Noted: acceptable for small private functions |
| L1 | LOW | Secret key type="text" | Noted: acceptable for dev tool |
