# Story 3.5: Unix Timestamp Converter — Refactor, Spec & Tests

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **the Unix Timestamp tool to use the standardized layout with documented behavior and regression tests**,
So that **I can reliably convert between timestamps and human-readable dates with a consistent interface**.

**Epic:** Epic 3 — Existing Tool Baseline & Enhancement
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (useToolError, CopyButton — complete)
**Story Key:** 3-5-unix-timestamp-converter-refactor-spec-and-tests

## Acceptance Criteria

### AC1: Standardized Component Integration

**Given** the existing `TimeUnixTimestamp` component
**When** it is refactored
**Then** it uses `useToolError` for error handling and `CopyButton` for output copying
**And** it is registered in `TOOL_REGISTRY` (already done — entry exists at key `unix-timestamp`)

### AC2: Timestamp to Date Conversion

**Given** a user enters a Unix timestamp (e.g., `1700000000`)
**When** the value is entered
**Then** the human-readable date/time appears in real-time (debounced 300ms)
**And** each output value (Format, GMT, Local) has an adjacent `CopyButton`

### AC3: Date to Timestamp Conversion

**Given** a user enters a human-readable date via the date picker
**When** the value is entered
**Then** the corresponding Unix timestamp appears in real-time
**And** the Unix timestamp result has an adjacent `CopyButton`

### AC4: Error Handling

**Given** an invalid timestamp input (non-numeric, empty after typing, or out of range)
**When** validation fails
**Then** an inline error appears: "Enter a valid Unix timestamp (e.g., 1700000000)"

### AC5: Feature Spec Coverage

**Given** a feature spec (in Dev Notes below)
**When** a developer reads it
**Then** it covers: seconds vs milliseconds auto-detection, negative timestamps (pre-1970), current time, date-to-timestamp, edge cases (epoch 0, far future)

### AC6: Regression Tests

**Given** regression tests in `src/utils/time.spec.ts`
**When** `pnpm test` runs
**Then** `getDaysInMonth` has test coverage for standard months, leap years, edge cases, and invalid inputs
**And** any new pure utility functions added for this story have test coverage
**And** all existing 242 tests continue to pass with no regressions

## Tasks / Subtasks

- [x] Task 1: Integrate useToolError for error handling (AC: #1, #4)
  - [x] 1.1 Import and use `useToolError` hook in `TimeUnixTimestamp` — add `const { clearError, error, setError } = useToolError()` and pass down to both sections
  - [x] 1.2 In `UnixTimestampSection`: validate input using `isValidTimestamp` from `@/utils/validation` before processing. On invalid input, call `setError('Enter a valid Unix timestamp (e.g., 1700000000)')`. On valid input or empty, call `clearError()`.
  - [x] 1.3 Replace `isNaN(d.getTime())` with `Number.isNaN(d.getTime())` (oxlint compliance)
  - [x] 1.4 Add inline error display after UnixTimestampSection: `{error != null && <p className="text-error text-body-sm shrink-0" role="alert">{error}</p>}`
  - [x] 1.5 Clear error in `DateSection` when date inputs change to valid values (DateSection produces only valid dates from select inputs, so no error setting needed there — only clear)

- [x] Task 2: Add tool description from registry (AC: #1)
  - [x] 2.1 Import `TOOL_REGISTRY_MAP` from `@/constants`
  - [x] 2.2 Add `const toolEntry = TOOL_REGISTRY_MAP['unix-timestamp']` outside the component
  - [x] 2.3 Display tool description at top of component: `{toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}`
  - [x] 2.4 Follow established pattern from ColorConvertor and EncodingBase64

- [x] Task 3: Add CopyButton to output values (AC: #2, #3)
  - [x] 3.1 Import `CopyButton` from `@/components/common`
  - [x] 3.2 In `UnixTimestampSection`: add `CopyButton` to each DataCellTable row using the existing `render` prop — render each value with `<span className="flex items-center gap-1"><span>{val}</span><CopyButton label={label} value={val} /></span>`
  - [x] 3.3 In `DateSection`: replace the custom `Button` + `CopyIcon` pattern on the Unix Timestamp row with `CopyButton` component for consistency
  - [x] 3.4 Add `CopyButton` to GMT and Local rows in DateSection (currently missing)

- [x] Task 4: Fix debounce delay (AC: #2)
  - [x] 4.1 In `UnixTimestampSection`: change `useDebounceCallback((source: string) => {...})` to explicitly specify 300ms delay: `useDebounceCallback((source: string) => {...}, 300)` — the default is 800ms, but architecture specifies 300ms for text conversion tools

- [x] Task 5: Write regression tests for getDaysInMonth (AC: #6)
  - [x] 5.1 Create `src/utils/time.spec.ts` with tests for `getDaysInMonth`
  - [x] 5.2 Test standard months: January (31), February non-leap (28), February leap (29), April (30), etc.
  - [x] 5.3 Test leap year rules: divisible by 4 (2024→29), century not leap (1900→28), century divisible by 400 (2000→29)
  - [x] 5.4 Test edge cases: month boundaries (month 0, month 13), year 0, negative year
  - [x] 5.5 If any new pure utility functions are extracted during refactoring, add tests for them

- [x] Task 6: Linting, formatting & build verification (AC: #6)
  - [x] 6.1 Run `pnpm lint` — no errors
  - [x] 6.2 Run `pnpm format:check` — no formatting issues
  - [x] 6.3 Run `pnpm build` — build succeeds with no TypeScript errors
  - [x] 6.4 Run `pnpm test` — all tests pass (242 existing + 20 new time tests = 262 total), no regressions

## Dev Notes

### CRITICAL: Current TimeUnixTimestamp Architecture Analysis

The current `TimeUnixTimestamp` at `src/components/feature/time/TimeUnixTimestamp.tsx` has a **two-section layout**:

#### Current Component Hierarchy

```
TimeUnixTimestamp (export)
  ├── UnixTimestampSection (internal)
  │   ├── FieldForm (number input for timestamp)
  │   ├── Helper text (seconds/milliseconds note)
  │   └── DataCellTable (Format, GMT, Local — NO copy buttons)
  ├── <hr /> separator
  └── DateSection (export)
      ├── FieldForm × 6 (Year input, Month/Day/Hour/Minute/Second selects)
      └── DataCellTable (Unix Timestamp with Button+CopyIcon, GMT, Local)
```

#### Current Data Flow

```
UnixTimestampSection:
  User enters timestamp in FieldForm
    → handleInputChange(val)
      → setInput(val)
      → dbSetResult(val) [debounced, NO explicit delay → defaults to 800ms]
        → Number(source)
        → Auto-detect seconds vs milliseconds (threshold: 100_000_000_000)
        → new Date(...)
        → isNaN check (global isNaN, NOT Number.isNaN)
        → setResult([format, utc, local])

DateSection:
  User changes any date field via selects
    → handleChange(key, value)
      → Update input state
      → If month changes, clamp day to valid range
      → new Date(year, month, day, hour, minute, second)
      → setResult([timestamp, utc, local])
```

#### What MUST Change

1. **No error handling** — Invalid input silently produces no output. Refactor: use `useToolError` for inline error messages when timestamp is invalid.
2. **No tool description displayed** — Add `TOOL_REGISTRY_MAP['unix-timestamp']` description at top.
3. **No CopyButton in UnixTimestampSection** — Format/GMT/Local values have no copy buttons. Add CopyButton to each row.
4. **DateSection uses custom Button+CopyIcon** — Replace with standardized `CopyButton` component. Also add CopyButton to GMT and Local rows.
5. **Global `isNaN` used** — Line 44: `isNaN(d.getTime())`. Replace with `Number.isNaN(d.getTime())`.
6. **No explicit debounce delay** — `useDebounceCallback` defaults to 800ms. Architecture pattern requires 300ms for text conversion tools.
7. **No isValidTimestamp usage** — `isValidTimestamp` exists in `validation.ts` but is not used. Should validate input before processing.
8. **No tests** — `getDaysInMonth` in `time.ts` is untested. Need `time.spec.ts`.

#### What to PRESERVE

1. **Two-section layout** — `UnixTimestampSection` (timestamp→date) + `DateSection` (date→timestamp). This is the tool's core UX pattern.
2. **Auto-detection** — Seconds vs milliseconds threshold at 100 billion. Smart default behavior.
3. **Date picker with selects** — Year text input + Month/Day/Hour/Minute/Second select dropdowns. Constrains input to valid dates.
4. **DataCellTable for output** — Animated table with Format/GMT/Local rows.
5. **AnimatePresence animations** — Smooth transitions when results appear.
6. **getDaysInMonth utility** — Correctly handles leap years, month changes.
7. **Day clamping on month change** — When month changes, day is clamped to valid range.
8. **MONTH_LABELS constant** — Clean month name array.
9. **Current date initialization** — DateSection initializes with current date/time as smart default.
10. **Named export** — `export const TimeUnixTimestamp` is correct.
11. **File location** — `src/components/feature/time/TimeUnixTimestamp.tsx` stays.
12. **TOOL_REGISTRY entry** — Already exists at key `unix-timestamp`, category `Time`.
13. **`<hr />` separator** — Visual separator between the two sections.

### CRITICAL: Error Handling Refactor

**Current pattern (silent failure):**
```typescript
const dbSetResult = useDebounceCallback((source: string) => {
  const inputNumber = Number(source)
  // ...
  const d = new Date(isMilliseconds ? inputNumber : inputNumber * 1_000)
  if (isNaN(d.getTime())) {
    return // ← Silent failure! User gets no feedback
  }
  setResult([...])
})
```

**Required pattern (useToolError for validation):**
```typescript
// useToolError lifted to TimeUnixTimestamp parent, passed via props or context
const { clearError, error, setError } = useToolError()

const dbSetResult = useDebounceCallback((source: string) => {
  if (source.length === 0) {
    setResult([])
    clearError()
    return
  }
  if (!isValidTimestamp(source)) {
    setResult([])
    setError('Enter a valid Unix timestamp (e.g., 1700000000)')
    return
  }
  clearError()
  const inputNumber = Number(source)
  // ... rest of logic
}, 300)
```

**Note:** `isValidTimestamp` from `validation.ts` checks: digits-only regex + value ≤ 4398046511103 (year ~141,000 in ms). This is the right validation — it rejects non-numeric input and far-future timestamps.

### CRITICAL: useToolError Lifting Pattern

`useToolError` must be called ONCE in the parent `TimeUnixTimestamp` and shared with both sections. Two approaches:

**Option A — Props (recommended, simplest):**
```typescript
export const TimeUnixTimestamp = () => {
  const { clearError, error, setError } = useToolError()
  return (
    <div className="flex grow flex-col gap-4">
      {toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}
      <UnixTimestampSection clearError={clearError} setError={setError} />
      {error != null && (
        <p className="text-error text-body-sm shrink-0" role="alert">{error}</p>
      )}
      <hr />
      <DateSection clearError={clearError} />
    </div>
  )
}
```

**Error ownership:** Only `UnixTimestampSection` can SET errors (it's the only section with free-text input that can be invalid). `DateSection` uses constrained selects — its inputs are always valid by construction. `DateSection` should CLEAR errors when the user interacts with it (to dismiss stale errors from the timestamp section).

### CRITICAL: CopyButton in DataCellTable

**Pattern for adding CopyButton to DataCellTable rows:**

DataCellTable accepts a `render` prop per row: `render?: (val: string) => ReactNode`

The DateSection already has an example of this pattern (line 247-254) — but uses a custom `Button` + `CopyIcon`. Replace with `CopyButton`:

```typescript
// Before (custom pattern):
render: (val) => (
  <span className="flex items-center gap-1">
    <span>{val}</span>
    <Button onClick={() => copyToClipboard(val)} variant="text">
      <CopyIcon size={14} />
    </Button>
  </span>
),

// After (standardized CopyButton):
render: (val) => (
  <span className="flex items-center gap-1">
    <span>{val}</span>
    <CopyButton label="Unix Timestamp" value={val} />
  </span>
),
```

Apply this `render` pattern to ALL rows in BOTH sections:
- UnixTimestampSection: Format (copy the format label), GMT (copy UTC date string), Local (copy local date string)
- DateSection: Unix Timestamp (copy timestamp value), GMT (copy UTC date string), Local (copy local date string)

**Import changes:** Remove `Button`, `CopyIcon` from imports. Add `CopyButton`. Remove `useCopyToClipboard` import from `DateSection` (no longer needed — `CopyButton` handles its own clipboard logic).

### CRITICAL: Test Strategy

**Create `src/utils/time.spec.ts`** for `getDaysInMonth`:

```typescript
import { describe, expect, it } from 'vitest'
import { getDaysInMonth } from '@/utils/time'

describe('time utilities', () => {
  describe('getDaysInMonth', () => {
    // Standard months
    it('should return 31 for January (month 1)', () => { ... })
    it('should return 28 for February non-leap year (month 2)', () => { ... })
    it('should return 29 for February leap year', () => { ... })
    it('should return 30 for April (month 4)', () => { ... })
    it('should return 31 for December (month 12)', () => { ... })

    // Leap year rules
    it('should return 29 for February 2024 (divisible by 4)', () => { ... })
    it('should return 28 for February 1900 (century, not divisible by 400)', () => { ... })
    it('should return 29 for February 2000 (century, divisible by 400)', () => { ... })

    // Edge cases
    it('should handle month 0 (returns days in December of previous year)', () => { ... })
    it('should handle month 13 (returns days in January of next year)', () => { ... })
  })
})
```

**DO NOT test Date construction or timestamp conversion** — those are browser API behaviors, not pure functions.

**Note:** `isValidTimestamp` already has comprehensive test coverage in `validation.spec.ts` (part of the 101 tests). No need to duplicate.

### Existing Codebase Patterns to Follow

#### Import Ordering
```tsx
// 1. External libraries (alphabetical)
import { AnimatePresence } from 'motion/react'
import { useMemo, useState } from 'react'

// 2. Type-only imports
import type { DateTime } from '@/types'

// 3. Internal @/ imports (alphabetical)
import { CopyButton, DataCellTable, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToolError } from '@/hooks'
import { getDaysInMonth } from '@/utils'
import { isValidTimestamp } from '@/utils/validation'
```

#### Component Export Pattern
```tsx
// Named export, NOT default
export const TimeUnixTimestamp = () => {
```

### Architecture Compliance

- **No ToolLayout** — ToolLayout was deprecated in story 3-1; each tool owns its own flat layout [Source: story 3-1 PO Override]
- **No OutputDisplay** — Removed from codebase; DataCellTable serves the output role for this tool
- **useToolError required** — Never implement custom error state in tools [Source: architecture.md#Error Handling]
- **Error messages with examples** — Concise, actionable, include valid input example [Source: architecture.md#Error Message Format]
- **CopyButton for all copyable values** — Use standardized `CopyButton`, not custom Button+CopyIcon combos [Source: story 3-1, 3-2, 3-3, 3-4 patterns]
- **Named exports** — `export const TimeUnixTimestamp` not `export default` [Source: project-context.md#Anti-Patterns]
- **`import type` for types** — Required by `verbatimModuleSyntax` [Source: project-context.md#Language-Specific Rules]
- **`type` not `interface`** — oxlint enforced [Source: project-context.md#Language-Specific Rules]
- **`Array<T>` not `T[]`** — oxlint enforced [Source: project-context.md#Language-Specific Rules]
- **100% client-side** — Zero network requests. All date conversion via native `Date` API [Source: architecture.md#NFR9]
- **No `console.log`** — oxlint enforced [Source: project-context.md#Code Quality Rules]
- **300ms debounce for text tools** — Architecture pattern for text conversion tools [Source: architecture.md#Tool Input Processing]

### Previous Story Intelligence (Story 3.4)

From story 3-4 (Image Resizer refactor):

- **ToolLayout was deprecated and deleted** — PO decision. Each tool uses a flat `<div>` layout. Do NOT attempt to use ToolLayout.
- **Error display pattern established**: `<p className="text-error text-body-sm shrink-0" role="alert">{error}</p>` placed after relevant inputs
- **Description pattern established**: `{toolEntry?.description && <p className="text-body-xs ...">}` at top of component
- **All 242 tests passing** (51 image + 57 color + 19 base64 + 8 CopyButton + 6 useToolError + 101 validation)
- **Build/lint/format all clean** at story 3-4 completion
- **Commit pattern**: `♻️: story 3-4` for refactor stories
- **Code review fixes from 3-4**: `Number.isNaN` over global `isNaN`, no non-null assertions, error messages should list all valid formats

### Git Intelligence

Recent commits:
```
247ff83 ♻️:  story 3-4
dcbafc9 ♻️: story 3-3
a2a4c19 🐛: search and navigate
162e9c0 ♻️: story 3.2
b0fd290 ♻️: story 3.1
```

**Pattern**: `♻️:` prefix for refactor stories. This story should use `♻️: story 3-5`.

**Key files from story 3-4 that inform patterns:**
- `src/components/feature/image/ImageResizer.tsx` — Latest refactored tool (useToolError, tool description, inline error, CopyButton patterns)
- `src/components/feature/color/ColorConvertor.tsx` — Text-tool refactor reference (CopyButton in FieldForm suffix, 300ms debounce, error handling)
- `src/components/feature/encoding/EncodingBase64.tsx` — Text-tool refactor reference (CopyButton, Dialog pattern, useToolError, 300ms debounce)

### Project Structure Notes

**Files to MODIFY:**
- `src/components/feature/time/TimeUnixTimestamp.tsx` — Refactor: useToolError, tool description, CopyButton on all outputs, isValidTimestamp, Number.isNaN, 300ms debounce

**Files to CREATE:**
- `src/utils/time.spec.ts` — Tests for `getDaysInMonth`

**Files NOT to modify:**
- `src/constants/tool-registry.ts` — Unix Timestamp entry already exists with correct metadata
- `src/utils/time.ts` — `getDaysInMonth` is correct as-is
- `src/utils/validation.ts` — `isValidTimestamp` already exists and is tested
- `src/types/constants/time.ts` — `DateTime` type is correct
- `src/components/feature/time/index.ts` — Already exports `TimeUnixTimestamp`
- `src/pages/home/index.tsx` — No changes needed
- `src/pages/tool/index.tsx` — No changes needed
- `src/components/common/` — All common components are stable

### Feature Spec (AC5)

#### Unix Timestamp Converter Feature Specification

**Purpose:** Convert between Unix timestamps and human-readable dates entirely in the browser using the native JavaScript `Date` API.

**Two Conversion Modes:**

| Mode | Input | Output | Trigger |
|------|-------|--------|---------|
| Timestamp → Date | Unix timestamp (number) | Format type, GMT date, Local date | On input change (debounced 300ms) |
| Date → Timestamp | Year/Month/Day/Hour/Minute/Second | Unix timestamp (seconds), GMT date, Local date | On any date field change (immediate) |

**Timestamp → Date (UnixTimestampSection):**
- Accepts numeric input only
- **Auto-detection**: If value > 100,000,000,000, interprets as milliseconds; otherwise, seconds
  - Rationale: Current time in seconds is ~1.7 billion (2024); in milliseconds ~1.7 trillion. 100 billion seconds = year ~5138 (unrealistic)
- Outputs three values: Format (Seconds/Milliseconds), GMT time string, Local time string
- Each output has a CopyButton for clipboard copy

**Date → Timestamp (DateSection):**
- Six input fields: Year (text input), Month (select), Day (select), Hour (select), Minute (select), Second (select)
- Initialized with current local date/time as smart default
- Day options dynamically adjust based on selected month/year (handles leap years via `getDaysInMonth`)
- Day is clamped when month changes (e.g., switching from March 31 to February → clamps to 28/29)
- Month/Day/Hour/Minute/Second are disabled cascade: month disabled until year is entered
- Outputs three values: Unix Timestamp (seconds), GMT time string, Local time string
- Each output has a CopyButton

**Supported Timestamp Ranges:**

| Range | Value | Behavior |
|-------|-------|----------|
| Epoch zero | `0` | Valid — `Thu, 01 Jan 1970 00:00:00 GMT` |
| Typical seconds | `1700000000` | Valid — `Tue, 14 Nov 2023 22:13:20 GMT` |
| Typical milliseconds | `1700000000000` | Valid — auto-detected as milliseconds |
| Max supported | `4398046511103` | Valid — `isValidTimestamp` upper bound (year ~141,000 in ms) |
| Negative values | `-1` | Invalid — `isValidTimestamp` rejects (digits-only regex) |
| Non-numeric | `abc` | Invalid — `isValidTimestamp` rejects |
| Empty | `` | Clears results, clears error (not an error state) |

**Error Cases:**

| Trigger | Error Message | Display |
|---------|---------------|---------|
| Non-numeric input | "Enter a valid Unix timestamp (e.g., 1700000000)" | Inline via useToolError |
| Out-of-range value | "Enter a valid Unix timestamp (e.g., 1700000000)" | Inline via useToolError |
| Empty input (cleared) | No error | Error cleared, results cleared |

**Note:** DateSection never produces errors because all inputs are constrained by select dropdowns (valid months, valid days for month/year, valid hours/minutes/seconds). Only the free-text timestamp input can produce errors.

**Performance:**
- NFR1: Text tool processing under 100ms — native `Date` construction is sub-microsecond
- Debounce at 300ms per architecture pattern for text conversion tools
- Date field changes in DateSection are immediate (no debounce needed — select changes are discrete, not continuous typing)

### Latest Technical Information

**JavaScript Date API:**
- Fully stable across all browsers. No breaking changes.
- `Date` constructor with numeric arguments uses local timezone — this is correct for the DateSection's local date display
- `Date.prototype.toUTCString()` and `Date.prototype.toString()` are the standard formatters used

**Temporal API (not applicable):**
- TC39 Stage 3 proposal for replacing `Date`. Not yet universally available in browsers (as of 2026).
- NOT relevant for this story — `Date` is sufficient and universally supported.

**`Number.isNaN` vs global `isNaN`:**
- `Number.isNaN` only returns `true` for `NaN` specifically
- Global `isNaN` coerces the argument first, which can produce unexpected `true` results
- The code review from story 3-4 flagged this as HIGH severity — must use `Number.isNaN`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.5] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#FR15] — Unix timestamp conversion
- [Source: _bmad-output/planning-artifacts/epics.md#NFR1] — Text tool processing under 100ms
- [Source: _bmad-output/planning-artifacts/epics.md#NFR9] — Zero network requests for tool processing
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling] — useToolError pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Message Format] — Concise, actionable, with example
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Input Processing] — Text tools: 300ms debounce
- [Source: _bmad-output/project-context.md] — 53 project rules (types, imports, naming, etc.)
- [Source: _bmad-output/implementation-artifacts/3-4-image-resizer-refactor-spec-and-tests.md] — Previous story patterns (useToolError, description, error display, Number.isNaN)
- [Source: src/components/feature/time/TimeUnixTimestamp.tsx] — Current implementation
- [Source: src/components/feature/color/ColorConvertor.tsx] — Reference refactored text tool (CopyButton, 300ms debounce)
- [Source: src/components/feature/encoding/EncodingBase64.tsx] — Reference refactored text tool (CopyButton, useToolError)
- [Source: src/utils/time.ts] — getDaysInMonth utility (needs tests)
- [Source: src/utils/validation.ts] — isValidTimestamp (already tested, needs to be used in component)
- [Source: src/hooks/useToolError.ts] — Error state hook
- [Source: src/hooks/useDebounceCallback.ts] — Debounce hook (default 800ms, override to 300ms)
- [Source: src/constants/tool-registry.ts] — TOOL_REGISTRY entry for unix-timestamp
- [Source: src/types/constants/time.ts] — DateTime type
- [Source: src/components/common/button/CopyButton.tsx] — Standardized copy button component
- [Source: src/components/common/table/DataCellTable.tsx] — Table with render prop for CopyButton integration

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

None — clean implementation with no blocking issues.

### Completion Notes List

- Integrated `useToolError` hook in `TimeUnixTimestamp` parent, passed `clearError`/`setError` as props to `UnixTimestampSection` and `clearError` to `DateSection`
- Added `isValidTimestamp` validation before processing timestamp input — rejects non-numeric and out-of-range values with actionable error message
- Replaced global `isNaN` with `Number.isNaN` for correct NaN checking (oxlint compliance, code review finding from 3-4)
- Added inline error display with `role="alert"` between UnixTimestampSection and the `<hr />` separator
- `DateSection` clears errors on any input change (constrained selects always produce valid dates)
- Added `TOOL_REGISTRY_MAP['unix-timestamp']` description at top of component (follows ColorConvertor/EncodingBase64 pattern)
- Added `CopyButton` to all 6 DataCellTable rows across both sections (Format, GMT, Local in UnixTimestampSection; Unix Timestamp, GMT, Local in DateSection)
- Extracted shared `renderWithCopy` helper to DRY the render prop pattern across both sections
- Replaced custom `Button` + `CopyIcon` + `useCopyToClipboard` pattern in DateSection with standardized `CopyButton`
- Removed unused imports: `Button`, `CopyIcon`, `useCopyToClipboard`
- Changed debounce from default 800ms to explicit 300ms per architecture pattern for text conversion tools
- Changed `DateSection` from `export` to internal (only `TimeUnixTimestamp` is the public API)
- Created `src/utils/time.spec.ts` with 20 tests covering `getDaysInMonth`: all 12 months, 3 leap year rules, 4 edge cases (month 0, month 13, year 0, negative year)
- All 262 tests pass (242 existing + 20 new), zero regressions
- Lint: 0 errors, Format: clean, Build: success

### Senior Developer Review (AI)

**Reviewer:** Code Review Workflow | **Date:** 2026-02-14

**Findings:** 0 High, 2 Medium, 3 Low — all fixed automatically.

**Fixes Applied:**
- **M1 (bug fix):** Day clamping now triggers on year change in addition to month change — prevents Feb 29 → non-leap-year rollover mismatch
- **M2 (AC4 compliance):** Changed timestamp input from `type="number"` to `type="text"` so non-numeric input reaches `isValidTimestamp` validation and shows the error message per AC4
- **L1 (performance):** Moved `monthOptions`, `hourOptions`, `minSecOptions` to module-scope constants (`MONTH_OPTIONS`, `HOUR_OPTIONS`, `MIN_SEC_OPTIONS`) — eliminates per-render array allocation
- **L2 (test quality):** Changed duplicate `getDaysInMonth(2024, 2)` assertion to `getDaysInMonth(2028, 2)` — all 20 tests now have unique assertions
- **L3 (dead code):** Removed unreachable `Number.isNaN(d.getTime())` check after `isValidTimestamp` validation

**Verification:** 262 tests pass, lint 0 errors, format clean, build success.

### Change Log

- 2026-02-14: Story 3-5 implementation complete — Unix Timestamp tool refactored to standardized patterns with 20 new regression tests
- 2026-02-14: Code review — 5 issues found (2M, 3L), all fixed: day clamping bug, AC4 input type, static arrays hoisted, duplicate test, dead code removed

### File List

- `src/components/feature/time/TimeUnixTimestamp.tsx` — Modified: useToolError, tool description, CopyButton on all outputs, isValidTimestamp, Number.isNaN, 300ms debounce, day clamping on year change, input type fix, static option arrays hoisted
- `src/utils/time.spec.ts` — Created: 20 regression tests for getDaysInMonth (deduplicated assertions)
