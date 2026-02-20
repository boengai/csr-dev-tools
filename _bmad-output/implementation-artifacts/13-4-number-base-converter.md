---
story: 13.4
title: Number Base Converter
status: done
epic: 13
---

# Story 13.4: Number Base Converter

## Story

As a **user**,
I want **to convert numbers between binary, octal, decimal, and hexadecimal**,
So that **I can quickly work with different number representations for low-level programming**.

**Epic:** Epic 13 — Data & Number Converters
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (CopyButton, FieldForm)
**Story Key:** 13-4-number-base-converter

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the Number Base Converter tool registered in `TOOL_REGISTRY` under the Encoding category
**When** the user navigates to it
**Then** it renders inline with four input fields

### AC2: Cross-Base Conversion

**Given** four input fields (Binary, Octal, Decimal, Hex)
**When** the user types in any field
**Then** all other fields update in real-time with the converted values

### AC3: Input Validation

**Given** the user enters an invalid value for the selected base
**When** validation fails
**Then** an inline error appears (e.g., "Invalid character '2' for base 2")

### AC4: Large Number Support

**Given** large numbers
**When** entered
**Then** BigInt is used for precision beyond Number.MAX_SAFE_INTEGER

### AC5: Unit Tests

**Given** unit tests in `src/utils/number-base.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: all base conversions, zero, large numbers, invalid characters, empty input, validation

## Tasks / Subtasks

- [x] Task 1: Create number base conversion utilities (AC: #2, #3, #4, #5)
  - [x] 1.1 Create `src/utils/number-base.ts` with `convertBase()` and `isValidForBase()`
  - [x] 1.2 Implement BigInt-based conversion for arbitrary precision
  - [x] 1.3 Validate input characters against base-specific valid character set
  - [x] 1.4 Support bases 2, 8, 10, 16

- [x] Task 2: Write unit tests (AC: #5)
  - [x] 2.1 Create `src/utils/number-base.spec.ts`
  - [x] 2.2 Test decimal↔binary, decimal↔hex, decimal↔octal conversions
  - [x] 2.3 Test zero handling
  - [x] 2.4 Test large numbers via BigInt round-trip
  - [x] 2.5 Test empty input throws
  - [x] 2.6 Test invalid characters throw with descriptive message
  - [x] 2.7 Test `isValidForBase` for binary and hex inputs

- [x] Task 3: Create NumberBaseConverter component (AC: #1, #2, #3)
  - [x] 3.1 Create `src/components/feature/encoding/NumberBaseConverter.tsx` as named export
  - [x] 3.2 Render four text fields (Binary, Octal, Decimal, Hex) with CopyButton each
  - [x] 3.3 Typing in any field updates all others via `convertBase()`
  - [x] 3.4 Inline error display with `role="alert"`
  - [x] 3.5 Use `useDebounceCallback` with 300ms delay

- [x] Task 4: Register tool and update exports (AC: #1)
  - [x] 4.1 Add `'number-base-converter'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add export to `src/components/feature/encoding/index.ts`
  - [x] 4.4 Add barrel export to `src/utils/index.ts`

## Dev Notes

### Previous Story Intelligence

From Story 13.3 (HTML to Markdown Converter):
- Data category converters complete; this story uses Encoding category
- Inline rendering pattern (no dialog) — different from converter tools

### Architecture Pattern

**Inline multi-field converter** — all four fields visible simultaneously, typing in any one updates the rest. No dialog needed. Uses `aria-live="polite"` on the field container for accessibility.

### Key Implementation Details

- No external library — pure JavaScript with `BigInt` for large number support
- `convertBase(value, fromBase, toBase)` converts via intermediate BigInt decimal
- Character validation: builds valid character set from `'0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, base)`
- Input is lowercased before processing
- `isValidForBase(value, base)` used for immediate validation before conversion
- Error state managed via `useState` with inline `role="alert"` display
- `BASE_FIELDS` array defines the four fields with labels, bases, and placeholders

### File Locations

| File | Purpose |
|------|---------|
| `src/utils/number-base.ts` | `convertBase()`, `isValidForBase()` |
| `src/utils/number-base.spec.ts` | 13 unit tests |
| `src/components/feature/encoding/NumberBaseConverter.tsx` | Component (105 lines) |

## Dev Agent Record

### Completion Notes List

- Created BigInt-based number conversion utilities with input validation
- NumberBaseConverter component with four linked input fields
- 11 unit tests covering all base conversions, edge cases, and validation

### File List

| File | Action |
|------|--------|
| `src/utils/number-base.ts` | NEW |
| `src/utils/number-base.spec.ts` | NEW |
| `src/components/feature/encoding/NumberBaseConverter.tsx` | NEW |
| `src/components/feature/encoding/index.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/constants/tool-registry.ts` | MODIFIED |
| `vite.config.ts` | MODIFIED |

### Senior Developer Review (AI)

**Reviewer:** boengai | **Date:** 2026-02-20

**Findings Fixed:**
- **M3:** Story test count corrected from 11 to 13

No code changes required for this story.
