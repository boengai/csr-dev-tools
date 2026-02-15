# Story 3.6: PX to REM Converter — Refactor, Spec & Tests

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **the PX to REM tool to use the standardized layout with documented behavior and regression tests**,
So that **I can reliably convert between PX and REM units with a consistent interface**.

**Epic:** Epic 3 — Existing Tool Baseline & Enhancement
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (useToolError, CopyButton — complete)
**Story Key:** 3-6-px-to-rem-converter-refactor-spec-and-tests

## Acceptance Criteria

### AC1: Standardized Component Integration

**Given** the existing `UnitPxToRem` component
**When** it is refactored
**Then** it uses `useToolError` for error handling and `CopyButton` for output copying
**And** it is registered in `TOOL_REGISTRY` (already done — entry exists at key `px-to-rem`)

### AC2: PX to REM Conversion

**Given** a user enters a PX value (e.g., `16`)
**When** the value is entered
**Then** the REM equivalent appears in real-time (debounced 300ms)
**And** each output value (PX, REM) has an adjacent `CopyButton`

### AC3: Configurable Base Font Size

**Given** a configurable base font size (default 16px) is available
**When** the user changes the base font size (e.g., to `18`)
**Then** all conversions update immediately to reflect the new base

### AC4: Error Handling

**Given** an invalid input (non-numeric text like `abc`, or base font size of `0` or negative)
**When** validation fails
**Then** an inline error appears with an actionable message (e.g., "Enter a valid number (e.g., 16)")

### AC5: Feature Spec Coverage

**Given** a feature spec (in Dev Notes below)
**When** a developer reads it
**Then** it covers: standard conversion (16px = 1rem), custom base sizes, decimal values, zero, negative values, large values, and bidirectional conversion

### AC6: Regression Tests

**Given** regression tests in `src/utils/unit.spec.ts`
**When** `pnpm test` runs
**Then** `pxToRem` and `remToPx` have test coverage for standard conversions, custom bases, decimals, zero, negative values, and large values
**And** all existing 262 tests continue to pass with no regressions

## Tasks / Subtasks

- [x] Task 1: Create pure utility functions (AC: #2, #3, #5)
  - [x] 1.1 Create `src/utils/unit.ts` with two pure functions:
    - `pxToRem(px: number, base: number): number` — returns `Number((px / base).toFixed(6))`
    - `remToPx(rem: number, base: number): number` — returns `Number((rem * base).toFixed(6))`
  - [x] 1.2 Update `src/utils/index.ts` — add `export { pxToRem, remToPx } from './unit'` to barrel

- [x] Task 2: Write regression tests (AC: #6)
  - [x] 2.1 Create `src/utils/unit.spec.ts` with tests for both functions
  - [x] 2.2 Test `pxToRem`: standard (16→1, 32→2, 8→0.5), custom base (20px base→1rem, 10px base→1rem), decimals (12.5→0.78125, 1→0.0625), zero (0→0), negative (-16→-1), large (1000→62.5)
  - [x] 2.3 Test `remToPx`: standard (1→16, 2→32, 0.5→8), custom base (1rem@20→20, 1rem@10→10), decimals (0.75→12, 1.5→24), zero (0→0), negative (-1→-16), large (100→1600)

- [x] Task 3: Integrate useToolError for error handling (AC: #1, #4)
  - [x] 3.1 Import and use `useToolError` hook in `UnitPxToRem`
  - [x] 3.2 Add inline error display: `{error != null && <p className="text-error text-body-sm shrink-0" role="alert">{error}</p>}`
  - [x] 3.3 Validate PX/REM inputs: if non-numeric → `setError('Enter a valid number (e.g., 16)')`. On valid → `clearError()`. On empty → clear results and `clearError()`.
  - [x] 3.4 Validate base font size: if non-numeric or ≤ 0 → `setError('Base font size must be a positive number (e.g., 16)')`. On valid → `clearError()` and recalculate.

- [x] Task 4: Add tool description from registry (AC: #1)
  - [x] 4.1 Import `TOOL_REGISTRY_MAP` from `@/constants`
  - [x] 4.2 Add `const toolEntry = TOOL_REGISTRY_MAP['px-to-rem']` outside the component
  - [x] 4.3 Display tool description at top of component: `{toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}`

- [x] Task 5: Add CopyButton to output values (AC: #2)
  - [x] 5.1 Import `CopyButton` from `@/components/common`
  - [x] 5.2 Add `CopyButton` as `suffix` prop on both PX and REM `FieldForm` inputs:
    - PX: `suffix={<CopyButton label="PX" value={pxValue} />}`
    - REM: `suffix={<CopyButton label="REM" value={remValue} />}`

- [x] Task 6: Add configurable base font size (AC: #3)
  - [x] 6.1 Add `baseValue` state: `const [baseValue, setBaseValue] = useState('16')`
  - [x] 6.2 Add a third `FieldForm` input for base font size with label "Base (px)", placeholder "16", type="text"
  - [x] 6.3 Track last-edited field: `const [lastEdited, setLastEdited] = useState<'px' | 'rem'>('px')`
  - [x] 6.4 On base change: validate base is numeric and > 0, then recalculate based on `lastEdited` direction
  - [x] 6.5 Update helper text to be dynamic: `Calculation based on a root font-size of {baseValue} pixel.` (or hide if invalid base)

- [x] Task 7: Add debounce and fix conversion logic (AC: #2)
  - [x] 7.1 Import `useDebounceCallback` from `@/hooks`
  - [x] 7.2 Change PX and REM inputs from `type="number"` to `type="text"` — allows non-numeric input to reach validation (per story 3-5 code review M2 pattern)
  - [x] 7.3 Remove `Math.floor` on PX input — allow decimal PX values (12.5px is valid)
  - [x] 7.4 Create debounced conversion handlers at 300ms:
    - `dbConvertPxToRem`: validates PX input, calls `pxToRem()`, updates REM value
    - `dbConvertRemToPx`: validates REM input, calls `remToPx()`, updates PX value
  - [x] 7.5 Input handlers update the typed value immediately (controlled input) and call the debounced converter

- [x] Task 8: Linting, formatting & build verification (AC: #6)
  - [x] 8.1 Run `pnpm lint` — no errors
  - [x] 8.2 Run `pnpm format:check` — no formatting issues
  - [x] 8.3 Run `pnpm build` — build succeeds with no TypeScript errors
  - [x] 8.4 Run `pnpm test` — all tests pass (262 existing + 20 new unit tests), no regressions

## Dev Notes

### CRITICAL: Current UnitPxToRem Architecture Analysis

The current `UnitPxToRem` at `src/components/feature/unit/UnitPxToRem.tsx` is the **simplest tool in the codebase** — a 58-line component with zero utilities, zero error handling, zero copy functionality.

#### Current Component (Complete Source)

```tsx
import { useState } from 'react'

import { FieldForm } from '@/components/common'

export const UnitPxToRem = () => {
  const [value, setValue] = useState<[string, string]>(['', ''])

  const handleChange = (val: string, idx: number) => {
    if (val === '') {
      setValue(['', ''])
      return
    }
    const numVal = Number(val)
    let floorVal: number
    let anotherVal: number
    if (idx === 0) {
      floorVal = Math.floor(numVal)  // ← Floors PX to integer!
      anotherVal = floorVal / 16     // ← Hardcoded base 16
    } else {
      floorVal = numVal              // ← No floor for REM
      anotherVal = floorVal * 16     // ← Hardcoded base 16
    }
    setValue([
      idx === 0 ? floorVal.toString() : anotherVal.toString(),
      idx === 1 ? val.toString() : anotherVal.toString(),
    ])
  }

  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-4">
      <div className="flex w-full items-center [&>*]:w-1/2">
        <FieldForm label="PX" name="px" onChange={(val) => handleChange(val, 0)} placeholder="16" type="number" value={value[0]} />
        <FieldForm label="REM" name="rem" onChange={(val) => handleChange(val, 1)} placeholder="1" type="number" value={value[1]} />
      </div>
      <p className="text-body-sm text-center text-gray-400">Calculation based on a root font-size of 16 pixel.</p>
    </div>
  )
}
```

#### What MUST Change

1. **No error handling** — No `useToolError` at all. Invalid input is silently filtered by `type="number"` in TextInput. Refactor: use `useToolError` with inline error messages.
2. **No tool description displayed** — Add `TOOL_REGISTRY_MAP['px-to-rem']` description at top.
3. **No CopyButton** — Neither PX nor REM output has a copy button. Add `CopyButton` as `suffix` on both `FieldForm` inputs.
4. **Hardcoded base font size (16)** — Epic AC says "configurable base font size (default 16px)". Add a base font size input.
5. **`Math.floor` on PX** — Line 19: `floorVal = Math.floor(numVal)`. This truncates decimal PX values (12.5px → 12px → 0.75rem instead of 12.5px → 0.78125rem). Remove `Math.floor` — allow decimal PX.
6. **No debounce** — Direct `handleChange` with no debounce. Architecture pattern requires 300ms for text conversion tools.
7. **`type="number"`** — TextInput's `handleChange` silently drops non-numeric input when `type="number"` (line 17-21 of TextInput.tsx). Change to `type="text"` to allow validation error messages (per story 3-5 code review M2).
8. **No tests** — No utility functions extracted, no test file.
9. **No pure utility functions** — Conversion logic is inline in the component. Extract to `src/utils/unit.ts` for testability.
10. **Asymmetric floor behavior** — PX input gets `Math.floor` but REM input doesn't. Inconsistent. Both should allow decimals without flooring.

#### What to PRESERVE

1. **Bidirectional conversion** — PX → REM and REM → PX in the same component. Two input fields, each updates the other.
2. **Named export** — `export const UnitPxToRem` is correct.
3. **File location** — `src/components/feature/unit/UnitPxToRem.tsx` stays.
4. **FieldForm usage** — Use `FieldForm` for all inputs (PX, REM, base).
5. **Side-by-side layout** — PX and REM inputs on the same row (`flex items-center`).
6. **TOOL_REGISTRY entry** — Already exists at key `px-to-rem`, category `Unit`.
7. **Helper text concept** — Explanation of the base font size (update to be dynamic).

### CRITICAL: State Architecture

**Replace tuple state with three separate state variables:**

```typescript
// Before (tuple state, confusing indexing):
const [value, setValue] = useState<[string, string]>(['', ''])

// After (clear, named state):
const [pxValue, setPxValue] = useState('')
const [remValue, setRemValue] = useState('')
const [baseValue, setBaseValue] = useState('16')
const [lastEdited, setLastEdited] = useState<'px' | 'rem'>('px')
const { clearError, error, setError } = useToolError()
```

**`lastEdited` tracking** is needed so that when the user changes the base font size, we know which direction to recalculate:
- If last edited PX → recalculate REM from PX with new base
- If last edited REM → recalculate PX from REM with new base

### CRITICAL: Debounced Conversion Pattern

```typescript
const dbConvertPxToRem = useDebounceCallback((px: string, base: string) => {
  if (px.trim() === '') {
    setRemValue('')
    clearError()
    return
  }
  const pxNum = Number(px)
  const baseNum = Number(base)
  if (Number.isNaN(pxNum)) {
    setError('Enter a valid PX value (e.g., 16)')
    return
  }
  if (Number.isNaN(baseNum) || baseNum <= 0) {
    setError('Base font size must be a positive number (e.g., 16)')
    return
  }
  clearError()
  setRemValue(pxToRem(pxNum, baseNum).toString())
}, 300)

const dbConvertRemToPx = useDebounceCallback((rem: string, base: string) => {
  if (rem.trim() === '') {
    setPxValue('')
    clearError()
    return
  }
  const remNum = Number(rem)
  const baseNum = Number(base)
  if (Number.isNaN(remNum)) {
    setError('Enter a valid REM value (e.g., 1)')
    return
  }
  if (Number.isNaN(baseNum) || baseNum <= 0) {
    setError('Base font size must be a positive number (e.g., 16)')
    return
  }
  clearError()
  setPxValue(remToPx(remNum, baseNum).toString())
}, 300)
```

**Input handlers** update the displayed value immediately (controlled input), then trigger the debounced converter:

```typescript
const handlePxChange = (val: string) => {
  setPxValue(val)
  setLastEdited('px')
  dbConvertPxToRem(val, baseValue)
}

const handleRemChange = (val: string) => {
  setRemValue(val)
  setLastEdited('rem')
  dbConvertRemToPx(val, baseValue)
}

const handleBaseChange = (val: string) => {
  setBaseValue(val)
  // Recalculate immediately based on last-edited field
  if (lastEdited === 'px' && pxValue.trim() !== '') {
    dbConvertPxToRem(pxValue, val)
  } else if (lastEdited === 'rem' && remValue.trim() !== '') {
    dbConvertRemToPx(remValue, val)
  }
}
```

### CRITICAL: CopyButton in FieldForm Suffix

The `FieldForm` passes all extra props through `InputController` to `TextInput`, which renders a `suffix` after the `<input>`. This is the same pattern used by `ColorConvertor`:

```tsx
<FieldForm
  label="PX"
  name="px"
  onChange={handlePxChange}
  placeholder="16"
  suffix={<CopyButton label="PX" value={pxValue} />}
  type="text"
  value={pxValue}
/>
```

### CRITICAL: Utility Functions to Extract

**Create `src/utils/unit.ts`:**

```typescript
export const pxToRem = (px: number, base: number): number => {
  return Number((px / base).toFixed(6))
}

export const remToPx = (rem: number, base: number): number => {
  return Number((rem * base).toFixed(6))
}
```

**Why `toFixed(6)` + `Number()`:** Limits precision to 6 decimal places (covers all practical CSS use cases), and `Number()` strips trailing zeros (`"0.750000"` → `0.75`).

**Why extract:** Pure functions are testable with Vitest. Component-level testing is not part of the test strategy (node env, no jsdom).

### CRITICAL: Test Strategy

**Create `src/utils/unit.spec.ts`:**

```typescript
import { describe, expect, it } from 'vitest'

import { pxToRem, remToPx } from '@/utils/unit'

describe('unit utilities', () => {
  describe('pxToRem', () => {
    // Standard conversions (base 16)
    it('should convert 16px to 1rem with base 16', () => {
      expect(pxToRem(16, 16)).toBe(1)
    })
    it('should convert 32px to 2rem with base 16', () => {
      expect(pxToRem(32, 16)).toBe(2)
    })
    it('should convert 8px to 0.5rem with base 16', () => {
      expect(pxToRem(8, 16)).toBe(0.5)
    })

    // Custom base sizes
    it('should convert 20px to 1rem with base 20', () => {
      expect(pxToRem(20, 20)).toBe(1)
    })
    it('should convert 10px to 1rem with base 10', () => {
      expect(pxToRem(10, 10)).toBe(1)
    })

    // Decimal values
    it('should convert 12.5px to 0.78125rem with base 16', () => {
      expect(pxToRem(12.5, 16)).toBe(0.78125)
    })
    it('should convert 1px to 0.0625rem with base 16', () => {
      expect(pxToRem(1, 16)).toBe(0.0625)
    })

    // Zero
    it('should convert 0px to 0rem', () => {
      expect(pxToRem(0, 16)).toBe(0)
    })

    // Negative values
    it('should convert -16px to -1rem with base 16', () => {
      expect(pxToRem(-16, 16)).toBe(-1)
    })

    // Large values
    it('should convert 1000px to 62.5rem with base 16', () => {
      expect(pxToRem(1000, 16)).toBe(62.5)
    })
  })

  describe('remToPx', () => {
    // Standard conversions (base 16)
    it('should convert 1rem to 16px with base 16', () => {
      expect(remToPx(1, 16)).toBe(16)
    })
    it('should convert 2rem to 32px with base 16', () => {
      expect(remToPx(2, 16)).toBe(32)
    })
    it('should convert 0.5rem to 8px with base 16', () => {
      expect(remToPx(0.5, 16)).toBe(8)
    })

    // Custom base sizes
    it('should convert 1rem to 20px with base 20', () => {
      expect(remToPx(1, 20)).toBe(20)
    })
    it('should convert 1rem to 10px with base 10', () => {
      expect(remToPx(1, 10)).toBe(10)
    })

    // Decimal values
    it('should convert 0.75rem to 12px with base 16', () => {
      expect(remToPx(0.75, 16)).toBe(12)
    })
    it('should convert 1.5rem to 24px with base 16', () => {
      expect(remToPx(1.5, 16)).toBe(24)
    })

    // Zero
    it('should convert 0rem to 0px', () => {
      expect(remToPx(0, 16)).toBe(0)
    })

    // Negative values
    it('should convert -1rem to -16px with base 16', () => {
      expect(remToPx(-1, 16)).toBe(-16)
    })

    // Large values
    it('should convert 100rem to 1600px with base 16', () => {
      expect(remToPx(100, 16)).toBe(1600)
    })
  })
})
```

**22 tests total** covering: standard, custom bases, decimals, zero, negatives, and large values.

**DO NOT test validation or component behavior** — those are component concerns, not pure function concerns. No DOM/browser mocks per project rules.

### CRITICAL: Input Type Change

**Per story 3-5 code review M2 pattern:**

When `type="number"` is used on `FieldForm`, the underlying `TextInput` component (line 17-21) silently drops non-numeric input:

```typescript
// TextInput.tsx handleChange:
if (type === 'number') {
  const numericValue = Number(value)
  if (isNaN(numericValue)) {
    return  // ← Silently drops! Error message never shows.
  }
  onChange?.(value)
  return
}
```

Changing to `type="text"` lets non-numeric input reach our `useToolError` validation, which then shows a proper error message. This was flagged as M2 (Medium severity) in story 3-5's code review.

### CRITICAL: Component Layout Design

```
┌──────────────────────────────────────────────────────┐
│ Tool description from TOOL_REGISTRY_MAP              │
├──────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────────┐  │
│ │ PX         [Copy]   │ │ REM         [Copy]      │  │
│ └─────────────────────┘ └─────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│ ┌─────────────────────┐                              │
│ │ Base (px)           │                              │
│ └─────────────────────┘                              │
├──────────────────────────────────────────────────────┤
│ {error message if any, role="alert"}                 │
├──────────────────────────────────────────────────────┤
│ Calculation based on a root font-size of {base} px.  │
└──────────────────────────────────────────────────────┘
```

### Existing Codebase Patterns to Follow

#### Import Ordering
```tsx
// 1. External libraries (alphabetical)
import { useState } from 'react'

// 2. (No type-only imports needed for this component)

// 3. Internal @/ imports (alphabetical)
import { CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToolError } from '@/hooks'
import { pxToRem, remToPx } from '@/utils/unit'
```

#### Component Export Pattern
```tsx
// Named export, NOT default
export const UnitPxToRem = () => {
```

### Architecture Compliance

- **No ToolLayout** — ToolLayout was deprecated in story 3-1; each tool owns its own flat layout [Source: story 3-1 PO Override]
- **No OutputDisplay** — Removed from codebase; CopyButton in FieldForm suffix serves the copy role for this tool
- **useToolError required** — Never implement custom error state in tools [Source: architecture.md#Error Handling]
- **Error messages with examples** — Concise, actionable, include valid input example [Source: architecture.md#Error Message Format]
- **CopyButton for all copyable values** — Use standardized `CopyButton` as FieldForm suffix [Source: story 3-1, 3-2, 3-3, 3-4, 3-5 patterns]
- **Named exports** — `export const UnitPxToRem` not `export default` [Source: project-context.md#Anti-Patterns]
- **`import type` for types** — Required by `verbatimModuleSyntax` [Source: project-context.md#Language-Specific Rules]
- **`type` not `interface`** — oxlint enforced [Source: project-context.md#Language-Specific Rules]
- **`Array<T>` not `T[]`** — oxlint enforced [Source: project-context.md#Language-Specific Rules]
- **100% client-side** — Zero network requests. Pure arithmetic conversion [Source: architecture.md#NFR9]
- **No `console.log`** — oxlint enforced [Source: project-context.md#Code Quality Rules]
- **300ms debounce for text tools** — Architecture pattern for text conversion tools [Source: architecture.md#Tool Input Processing]
- **`type="text"` for validatable inputs** — Per story 3-5 code review M2, change from `type="number"` to allow error message display

### Previous Story Intelligence (Story 3.5)

From story 3-5 (Unix Timestamp Converter refactor):

- **ToolLayout was deprecated and deleted** — PO decision. Each tool uses a flat `<div>` layout. Do NOT attempt to use ToolLayout.
- **Error display pattern established**: `<p className="text-error text-body-sm shrink-0" role="alert">{error}</p>` placed after relevant inputs
- **Description pattern established**: `{toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}` at top of component
- **All 262 tests passing** (20 time + 51 image + 57 color + 19 base64 + 8 CopyButton + 6 useToolError + 101 validation)
- **Build/lint/format all clean** at story 3-5 completion
- **Commit pattern**: `♻️: story 3-5` for refactor stories
- **Code review fixes from 3-5**: `type="text"` over `type="number"` for validatable inputs (M2), `Number.isNaN` over global `isNaN`, static arrays hoisted to module scope, dead code removed
- **CopyButton in FieldForm suffix**: used in ColorConvertor (`suffix={<CopyButton label={label} value={color[format]} />}`) — this is the exact pattern to follow for PX/REM
- **useToolError lifting pattern**: hook called in parent, props passed to children if needed. For UnitPxToRem this is simpler — single component, no children.

### Git Intelligence

Recent commits:
```
eeca4d0 ♻️: story 3-5
247ff83 ♻️:  story 3-4
dcbafc9 ♻️: story 3-3
a2a4c19 🐛: search and navigate
162e9c0 ♻️: story 3.2
b0fd290 ♻️: story 3.1
```

**Pattern**: `♻️:` prefix for refactor stories. This story should use `♻️: story 3-6`.

**Key files from story 3-5 that inform patterns:**
- `src/components/feature/time/TimeUnixTimestamp.tsx` — Latest refactored tool (useToolError, tool description, inline error, CopyButton in DataCellTable)
- `src/components/feature/color/ColorConvertor.tsx` — Text-tool refactor reference (CopyButton in FieldForm suffix, 300ms debounce, error handling)
- `src/components/feature/encoding/EncodingBase64.tsx` — Text-tool refactor reference (useToolError, 300ms debounce)

**Story 3-5 changed files (from `git diff HEAD~1 --stat`):**
- `src/components/feature/time/TimeUnixTimestamp.tsx` — 131 lines changed
- `src/utils/time.spec.ts` — 90 lines (new test file)
- Sprint status + story file

### Project Structure Notes

**Files to CREATE:**
- `src/utils/unit.ts` — Pure conversion functions: `pxToRem`, `remToPx`
- `src/utils/unit.spec.ts` — ~22 regression tests for both functions

**Files to MODIFY:**
- `src/components/feature/unit/UnitPxToRem.tsx` — Refactor: useToolError, tool description, CopyButton, configurable base, type="text", validation, 300ms debounce, remove Math.floor
- `src/utils/index.ts` — Add barrel export for `unit.ts`

**Files NOT to modify:**
- `src/constants/tool-registry.ts` — PX to REM entry already exists with correct metadata
- `src/utils/validation.ts` — No new validator needed (numeric check is inline)
- `src/components/feature/unit/index.ts` — Already exports `UnitPxToRem`
- `src/components/common/` — All common components are stable
- `src/pages/home/index.tsx` — No changes needed
- `src/pages/tool/index.tsx` — No changes needed

### Feature Spec (AC5)

#### PX to REM Converter Feature Specification

**Purpose:** Bidirectional conversion between PX and REM CSS units with configurable base font size, entirely in the browser using pure arithmetic.

**Conversion Formulas:**
- PX → REM: `rem = px / base`
- REM → PX: `px = rem * base`

**Two-Way Conversion:**

| Direction | Input | Output | Trigger |
|-----------|-------|--------|---------|
| PX → REM | PX value (number) | REM equivalent | On PX input change (debounced 300ms) |
| REM → PX | REM value (number) | PX equivalent | On REM input change (debounced 300ms) |
| Base change | Base font size (number) | Recalculate last-edited direction | On base input change (debounced 300ms) |

**Configurable Base Font Size:**
- Default: 16 (the CSS standard)
- User can change to any positive number
- Common values: 10, 14, 16, 18, 20
- When base changes, the conversion recalculates using the last-edited field as source of truth

**Supported Value Ranges:**

| Input | Valid Values | Behavior |
|-------|-------------|----------|
| PX | Any number (positive, negative, zero, decimal) | Converts to REM |
| REM | Any number (positive, negative, zero, decimal) | Converts to PX |
| Base | Any positive number > 0 | Used as divisor/multiplier |
| Empty | `""` | Clears both values and error |
| Non-numeric | `abc`, `12px`, etc. | Shows error message |
| Base ≤ 0 | `0`, `-1`, etc. | Shows error message (division by zero prevention) |

**Precision:**
- Results rounded to 6 decimal places maximum
- Trailing zeros automatically stripped (e.g., `0.750000` → `0.75`)
- `toFixed(6)` + `Number()` pattern

**Example Conversions (base 16):**

| PX | REM | Notes |
|----|-----|-------|
| 16 | 1 | Standard reference |
| 32 | 2 | Double |
| 8 | 0.5 | Half |
| 12 | 0.75 | Common spacing |
| 14 | 0.875 | Common body text |
| 12.5 | 0.78125 | Decimal PX |
| 1 | 0.0625 | Small value |
| 0 | 0 | Zero |
| -16 | -1 | Negative |
| 1000 | 62.5 | Large value |

**Error Cases:**

| Trigger | Error Message | Display |
|---------|---------------|---------|
| Non-numeric PX input | "Enter a valid PX value (e.g., 16)" | Inline via useToolError |
| Non-numeric REM input | "Enter a valid REM value (e.g., 1)" | Inline via useToolError |
| Base ≤ 0 or non-numeric | "Base font size must be a positive number (e.g., 16)" | Inline via useToolError |
| Empty input (cleared) | No error | Error cleared, other field cleared |

**Performance:**
- NFR1: Text tool processing under 100ms — pure arithmetic is sub-microsecond
- Debounce at 300ms per architecture pattern for text conversion tools

### Latest Technical Information

**CSS Units:**
- `rem` is relative to the root element's font-size (`:root` or `html`)
- Default browser font-size is 16px (used as the standard base)
- No breaking changes or new standards affecting PX/REM conversion
- CSS `calc()` can mix units, but this tool produces static values

**JavaScript Number Precision:**
- `Number.toFixed(6)` is sufficient for all practical CSS values
- IEEE 754 double-precision handles all reasonable PX/REM conversions without floating-point issues at 6 decimal places
- `Number()` correctly strips trailing zeros from `toFixed()` output

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.6] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#FR16] — PX to REM conversion with configurable base
- [Source: _bmad-output/planning-artifacts/epics.md#NFR1] — Text tool processing under 100ms
- [Source: _bmad-output/planning-artifacts/epics.md#NFR9] — Zero network requests for tool processing
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling] — useToolError pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Message Format] — Concise, actionable, with example
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Input Processing] — Text tools: 300ms debounce
- [Source: _bmad-output/project-context.md] — 53 project rules (types, imports, naming, etc.)
- [Source: _bmad-output/implementation-artifacts/3-5-unix-timestamp-converter-refactor-spec-and-tests.md] — Previous story patterns (useToolError, description, error display, type="text", Number.isNaN, CopyButton)
- [Source: src/components/feature/unit/UnitPxToRem.tsx] — Current implementation (58 lines, needs full refactor)
- [Source: src/components/feature/color/ColorConvertor.tsx] — Reference: CopyButton in FieldForm suffix, 300ms debounce, useToolError
- [Source: src/components/common/button/CopyButton.tsx] — Standardized copy button component
- [Source: src/components/common/form/FieldForm.tsx] — Form wrapper with suffix prop pass-through
- [Source: src/components/common/input/TextInput.tsx] — TextInput with suffix rendering and type="number" filter (lines 17-21)
- [Source: src/hooks/useToolError.ts] — Error state hook
- [Source: src/hooks/useDebounceCallback.ts] — Debounce hook (default 800ms, override to 300ms)
- [Source: src/constants/tool-registry.ts:84-101] — TOOL_REGISTRY entry for px-to-rem (key, category Unit, emoji 📏)

## Senior Developer Review (AI)

**Review Date:** 2026-02-14
**Reviewer:** Claude Opus 4.6 (code-review workflow)
**Outcome:** Approve (with fixes applied)

### Action Items

- [x] [M1] Base field validation gap — handleBaseChange now validates immediately regardless of PX/REM state
- [x] [M2] Helper text displays unvalidated input — now conditionally rendered only when base is valid positive number
- [x] [M3] Debounced empty-field clearing — empty-clear now handled synchronously in input handlers

### Summary

All 6 ACs verified as implemented. All 8 tasks with 25 subtasks verified as genuinely complete. 3 MEDIUM issues found and fixed in-place: base validation gap, helper text displaying garbage input, and debounced empty-clear lag. 2 LOW issues noted (Infinity edge case, AC4 message text mismatch) — no action needed. 282 tests pass, build/lint/format clean after fixes.

## Change Log

- 2026-02-14: Code review — Fixed 3 MEDIUM issues: base field validation gap (M1), helper text conditional rendering (M2), synchronous empty-field clearing (M3). All quality gates pass.
- 2026-02-14: Implemented story 3-6 — Extracted pure utility functions (pxToRem, remToPx) to src/utils/unit.ts, added 20 regression tests, refactored UnitPxToRem component with useToolError, CopyButton, configurable base font size, 300ms debounce, type="text" inputs, and tool description from registry. All 282 tests pass, build/lint/format clean.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Task 1: Created `src/utils/unit.ts` with `pxToRem` and `remToPx` pure functions using `toFixed(6)` + `Number()` pattern. Added barrel export in `src/utils/index.ts`.
- Task 2: Created `src/utils/unit.spec.ts` with 20 tests (10 per function) covering standard, custom base, decimal, zero, negative, and large values.
- Task 3: Integrated `useToolError` hook with inline error display (`role="alert"`). Validation for non-numeric PX/REM inputs and invalid base font size (<=0 or non-numeric).
- Task 4: Added `TOOL_REGISTRY_MAP['px-to-rem']` description display at top of component.
- Task 5: Added `CopyButton` as `suffix` prop on both PX and REM `FieldForm` inputs.
- Task 6: Added configurable base font size with `baseValue` state (default '16'), `lastEdited` tracking for recalculation direction, and dynamic helper text.
- Task 7: Added 300ms debounced conversion handlers via `useDebounceCallback`, changed inputs to `type="text"` for validation, removed `Math.floor` on PX input.
- Task 8: All quality gates passed — lint clean, format clean, build succeeds, 282 tests pass (262 existing + 20 new, zero regressions).
- Code Review Fix M1: Added immediate base validation in handleBaseChange — now shows error for invalid base even when PX/REM are empty.
- Code Review Fix M2: Helper text now conditionally renders only when base value is a valid positive number.
- Code Review Fix M3: Empty-field clearing now happens synchronously in handlePxChange/handleRemChange, reserving debounce for actual conversions only.

### File List

- `src/utils/unit.ts` — NEW: Pure conversion functions (pxToRem, remToPx)
- `src/utils/unit.spec.ts` — NEW: 20 regression tests for unit conversion functions
- `src/utils/index.ts` — MODIFIED: Added barrel export for unit.ts
- `src/components/feature/unit/UnitPxToRem.tsx` — MODIFIED: Full refactor with useToolError, CopyButton, configurable base, debounce, type="text", tool description
