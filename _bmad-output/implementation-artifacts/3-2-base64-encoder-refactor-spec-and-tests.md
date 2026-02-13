# Story 3.2: Base64 Encoder — Refactor, Spec & Tests

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **the Base64 tool to use the standardized layout with documented behavior and regression tests**,
So that **I can reliably encode and decode Base64 strings with a consistent interface**.

**Epic:** Epic 3 — Existing Tool Baseline & Enhancement
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (useToolError, CopyButton — complete)
**Story Key:** 3-2-base64-encoder-refactor-spec-and-tests

## Acceptance Criteria

### AC1: Standardized Component Integration

**Given** the existing `EncodingBase64` component
**When** it is refactored
**Then** it uses `useToolError` for error handling and standardized `CopyButton` for copy actions
**And** it is registered in `TOOL_REGISTRY` (already done — entry exists at key `base64-encoder`)

### AC2: Button-Driven Dialog UI with Source/Result Split

**Given** the card shows two buttons: "Encode" and "Decode"
**When** the user clicks either button
**Then** a full-screen `Dialog` (size `"screen"`) opens with the corresponding title ("Base64 Encode" or "Base64 Decode")
**And** the dialog shows source textarea (left pane, editable) and result textarea (right pane, read-only with `CopyButton`) side-by-side
**And** on mobile the two panes stack vertically (source top, result bottom)

### AC3: Real-Time Processing in Dialog

**Given** the dialog is open
**When** the user types in the source pane
**Then** the result pane updates in real-time (debounced 150ms)
**And** the result pane has a `CopyButton` for one-click copy

### AC4: Error Handling

**Given** a user pastes an invalid Base64 string for decoding
**When** validation fails
**Then** an inline error appears: "Enter a valid Base64 string (e.g., SGVsbG8=)"

### AC5: Feature Spec Coverage

**Given** a feature spec (in Dev Notes below)
**When** a developer reads it
**Then** it covers: standard encoding, Unicode handling, empty input, whitespace handling, invalid decode input, and large string performance

### AC6: Regression Tests

**Given** regression tests in `src/utils/base64.spec.ts`
**When** `pnpm test` runs
**Then** all happy paths, edge cases, and error states pass

## Tasks / Subtasks

- [x] Task 1: Extract Base64 encode/decode logic to `src/utils/base64.ts` (AC: #2, #3, #5)
  - [x] 1.1 Create `encodeBase64(input: string): string` — uses `TextEncoder` + `btoa` for full Unicode support
  - [x] 1.2 Create `decodeBase64(input: string): string` — uses `atob` + `TextDecoder` for full Unicode support
  - [x] 1.3 `decodeBase64` wraps `atob` errors in descriptive `Error('Invalid Base64 input')`; `encodeBase64` never throws (TextEncoder handles any string)
  - [x] 1.4 Add barrel export from `src/utils/index.ts`

- [x] Task 2: Refactor EncodingBase64 with Dialog UI + useToolError + CopyButton (AC: #1, #2, #3, #4)
  - [x] 2.1 Import and use `useToolError` hook — replace `result instanceof Error` pattern with `setError()`/`clearError()`
  - [x] 2.2 Replace manual `Button` + `CopyIcon` with standardized `CopyButton` from `@/components/common`
  - [x] 2.3 Import and call `encodeBase64`/`decodeBase64` from `@/utils/base64` instead of raw `btoa`/`atob`
  - [x] 2.4 Add inline error display via `<p role="alert">` inside dialog (same pattern as ColorConvertor)
  - [x] 2.5 Add tool description from `TOOL_REGISTRY_MAP['base64-encoder']`
  - [x] 2.6 Update debounce from 800ms default to explicit 150ms
  - [x] 2.7 Clear error when input changes to valid value or when input is empty
  - [x] 2.8 Use `isValidBase64` from `@/utils/validation` for decode input validation before attempting decode
  - [x] 2.9 Add `Dialog` (size `"screen"`) — opens when user clicks Encode or Decode button
  - [x] 2.10 Dialog content: left pane = source `FieldForm` (textarea, editable), right pane = result `FieldForm` (textarea, read-only + `CopyButton` in label)
  - [x] 2.11 Side-by-side layout: `flex-row` on tablet+ with dashed divider, stacked `flex-col` on mobile (same as ImageResizer)
  - [x] 2.12 Use `injected={{ open: dialogOpen, setOpen: setDialogOpen }}` for controlled Dialog state
  - [x] 2.13 `onAfterClose` callback clears source, result, and error (full reset on close)
  - [x] 2.14 Card shows two stacked `Button` components (Encode / Decode), vertically centered, each opens the dialog with the corresponding action
  - [x] 2.15 Remove card-level Tabs and card-level source textarea — card shows only description + two action buttons

- [x] Task 3: Write regression tests in `src/utils/base64.spec.ts` (AC: #6)
  - [x] 3.1 Encode: ASCII text (`Hello, World!` → `SGVsbG8sIFdvcmxkIQ==`)
  - [x] 3.2 Encode: Unicode text (`こんにちは` → correct Base64)
  - [x] 3.3 Encode: emoji (`🚀` → correct Base64)
  - [x] 3.4 Encode: empty string → empty string (no error)
  - [x] 3.5 Encode: whitespace-only string → Base64 of whitespace
  - [x] 3.6 Encode: special characters (`<>&"'` etc.)
  - [x] 3.7 Encode: large string (10KB+) → completes without error
  - [x] 3.8 Decode: valid Base64 with single padding (`SGVsbG8=` → `Hello`)
  - [x] 3.9 Decode: valid Base64 with double padding (`dGVzdA==` → `test`)
  - [x] 3.10 Decode: valid Base64 without padding (`Zm9v` → `foo`)
  - [x] 3.11 Decode: Unicode round-trip (encode `こんにちは` then decode back — exact match)
  - [x] 3.12 Decode: emoji round-trip (encode `🚀` then decode back — exact match)
  - [x] 3.13 Decode: invalid Base64 characters → throws
  - [x] 3.14 Decode: malformed padding → throws
  - [x] 3.15 Decode: whitespace in Base64 string → throws or handles gracefully
  - [x] 3.16 Round-trip: encode then decode === original for ASCII, Unicode, emoji, special chars

- [x] Task 4: Linting, formatting & build verification
  - [x] 4.1 Run `pnpm lint` — no errors
  - [x] 4.2 Run `pnpm format:check` — no formatting issues
  - [x] 4.3 Run `pnpm build` — build succeeds with no TypeScript errors
  - [x] 4.4 Run `pnpm test` — all tests pass, no regressions

## Dev Notes

### CRITICAL: Current EncodingBase64 Architecture Analysis

The current `EncodingBase64` at `src/components/feature/encoding/EncodingBase64.tsx` (92 lines) has the following structure:

#### Current Component Hierarchy (BEFORE refactor)

```
EncodingBase64 (export)
  └── Tabs (Radix tabs with animated indicator)
        ├── Encoder tab → Form(action="encode", onSubmit=btoa)
        └── Decoder tab → Form(action="decode", onSubmit=atob)

Form (internal, shared by both tabs)
  ├── FieldForm "Source" (textarea, user input)
  └── FieldForm "Result" (textarea, read-only output + CopyButton in label)
```

#### Target Component Hierarchy (AFTER refactor)

```
EncodingBase64 (export)
  ├── Description (from TOOL_REGISTRY_MAP)
  ├── Button "Encode" → opens dialog with action='encode'
  ├── Button "Decode" → opens dialog with action='decode'
  └── Dialog (size="screen", controlled via injected, title reflects action)
        └── Content: flex-row on tablet+, flex-col on mobile
              ├── Left pane: FieldForm "Source" (textarea, editable)
              ├── Dashed divider (border-l-2 / border-t-2)
              ├── Right pane: FieldForm "Result" (textarea, read-only + CopyButton)
              └── Error display (if any)
```

#### Current Data Flow

```
User types in "Source" textarea
  → handleSourceChange(val)
    → setSource(val)
    → dbSetResult(val) [debounced at 800ms DEFAULT]
      → onSubmit(val) [btoa or atob]
        → Success: setResult(string)
        → Failure: setResult(new Error('Unable to process input'))
```

#### Target Data Flow

```
User clicks "Encode" or "Decode" button on card
  → openDialog(act)
  → setAction(act), setResult(''), clearError()
  → setDialogOpen(true)

User types in dialog Source textarea (left pane)
  → setSource(val)
  → processInput(val)    [debounced 150ms]
    → encodeBase64(val) or decodeBase64(val) based on action state
      → Success: setResult(string), clearError()
      → Failure: setResult(''), setError(message)

User closes dialog (X, Escape, overlay click)
  → onAfterClose: setSource(''), setResult(''), clearError()
  → full reset — fresh state on next open
```

#### What MUST Change

1. **`btoa`/`atob` break for Unicode** — `btoa('こんにちは')` throws `InvalidCharacterError`. The AC requires Unicode handling. Extract to utility with `TextEncoder`/`TextDecoder`.
2. **Error handling uses Error object in state** — Current: `result instanceof Error` disables the result field and shows error in placeholder. Refactor: use `useToolError` for inline error display via `<p role="alert">`.
3. **Manual copy button** — Current: `<Button variant="text"><CopyIcon /></Button>` in the result label. Replace with standardized `CopyButton` component.
4. **Debounce is 800ms** — Must change to 150ms.
5. **No input validation** — Decoder doesn't validate before calling `atob`. Use `isValidBase64` from `@/utils/validation`.
6. **No description shown** — Add tool description from `TOOL_REGISTRY_MAP`.

#### What to PRESERVE

1. **Encode/Decode separation** — Two distinct `Button` components on card replace the old Tabs UI. Each button opens the dialog with the correct mode. No tabs used.
2. **Placeholders** — Encode: `Hello, World!` / `SGVsbG8sIFdvcmxkIQ==`. Decode: reversed. These are good.
3. **Named export** — `export const EncodingBase64` is correct.
4. **File location** — `src/components/feature/encoding/EncodingBase64.tsx` stays.
5. **Barrel export** — `src/components/feature/encoding/index.ts` already exports `EncodingBase64`.
6. **TOOL_REGISTRY entry** — Already complete with key `base64-encoder`, category `Encoding`, lazy import.

#### What CHANGES (UI redesign)

1. **Card view** — Description + two vertically-stacked, centered buttons (Encode / Decode). No textarea, no tabs on card.
2. **Dialog** — Full-screen (`size="screen"`) with left/right split (source | result). Title reflects selected mode ("Base64 Encode" or "Base64 Decode").
3. **Button-driven entry** — User picks encode or decode upfront by clicking the corresponding button. No mode switching inside the dialog.
4. **Full reset on close** — Source, result, and error all cleared when dialog closes.

### CRITICAL: Unicode Support via TextEncoder/TextDecoder

Native `btoa()` only handles Latin1 (code points 0-255). For Unicode support, use this pattern:

```typescript
// src/utils/base64.ts

export const encodeBase64 = (input: string): string => {
  const bytes = new TextEncoder().encode(input)
  const binary = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('')
  return btoa(binary)
}

export const decodeBase64 = (input: string): string => {
  const binary = atob(input)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}
```

**Why this matters:** Without this, encoding `こんにちは` or `🚀` throws `DOMException: Failed to execute 'btoa'`. This is one of the most common Base64 bugs in web development.

**Edge case:** `atob()` itself throws `DOMException: Failed to execute 'atob'` for invalid Base64 strings. Wrap in try/catch and use `setError()`.

### CRITICAL: Error Handling Refactor

**Current pattern (REMOVE):**
```tsx
const [result, setResult] = useState<Error | string>('')
// ...
setResult(new Error('Unable to process input'))
// ...
disabled={result instanceof Error}
placeholder={result instanceof Error ? result.message : ...}
```

**Required pattern (from ColorConvertor):**
```tsx
const { clearError, error, setError } = useToolError()
// ...
try {
  setResult(encodeBase64(source))
  clearError()
} catch {
  setResult('')
  setError('Enter a valid Base64 string (e.g., SGVsbG8=)')
}
// ...
{error != null && (
  <p className="text-error text-body-sm shrink-0" role="alert">{error}</p>
)}
```

**Error messages:**
- Encode failure: `'Unable to encode text — input contains invalid characters'` (unlikely with TextEncoder, but defensive)
- Decode failure: `'Enter a valid Base64 string (e.g., SGVsbG8=)'`

### CRITICAL: Dialog Pattern (from ImageResizer)

The dialog uses `Dialog` from `@/components/common/dialog/` with these key props:

```tsx
import { Dialog } from '@/components/common'

<Dialog
  injected={{ open: dialogOpen, setOpen: setDialogOpen }}
  onAfterClose={handleReset}
  size="screen"
  title={action === 'encode' ? 'Base64 Encode' : 'Base64 Decode'}
>
  {/* Source (left) | Result (right) */}
</Dialog>
```

**Dialog props reference** (`DialogProps`):
- `size="screen"` — full viewport (95dvh/95dvw tablet, 100dvh/100dvw mobile)
- `injected` — controlled open/close state
- `onAfterClose` — fires after exit animation; use to clear result + error
- `title` — shown in dialog header with close button

**Side-by-side layout inside dialog** (same as ImageResizer lines 284-304):

```tsx
<div className="flex size-full grow flex-col gap-4">
  <div className="flex size-full grow flex-col gap-6 md:flex-row">
    {/* Left pane: Source (editable) */}
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <FieldForm label="Source" name="source" type="textarea" rows={12} ... />
    </div>

    {/* Divider */}
    <div className="border-t-2 border-dashed border-gray-700 md:border-t-0 md:border-l-2" />

    {/* Right pane: Result (read-only + CopyButton) */}
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <FieldForm
        label={
          <span className="flex items-center gap-1">
            <span>Result</span>
            <CopyButton label="result" value={result} />
          </span>
        }
        disabled={!result}
        name="result"
        type="textarea"
        rows={12}
        ...
      />
    </div>
  </div>

  {/* Error below panes */}
  {error != null && (
    <p className="text-error text-body-sm shrink-0" role="alert">{error}</p>
  )}
</div>
```

### CRITICAL: Dialog Open Trigger

Dialog opens when the user clicks the Encode or Decode button on the card:

```tsx
const openDialog = (act: 'decode' | 'encode') => {
  setAction(act)
  setResult('')
  clearError()
  setDialogOpen(true)
}
```

Each button sets the action mode and opens the dialog fresh. Source input happens entirely inside the dialog.

### CRITICAL: CopyButton in Dialog Result Pane

The standardized `CopyButton` from `@/components/common/button/`:
- Auto-disables when `value` is empty/falsy
- Has icon morph animation (clipboard → check → clipboard)
- Shows toast "Copied to clipboard" via `useCopyToClipboard` hook
- Has `aria-label="Copy result to clipboard"`

Place in the result `FieldForm` label inside the dialog right pane.

### CRITICAL: Debounce Change

```tsx
// CURRENT (too slow):
const dbSetResult = useDebounceCallback((s: string) => { ... })
// 800ms default

// REQUIRED:
const processInput = useDebounceCallback((val: string) => { ... }, 150)
// Explicit 150ms
```

### CRITICAL: Description Display

Add tool description from registry, same pattern as ColorConvertor:

```tsx
import { TOOL_REGISTRY_MAP } from '@/constants'

const toolEntry = TOOL_REGISTRY_MAP['base64-encoder']

// In render (card level, above tabs):
{toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}
```

### Recommended Refactored Architecture

```tsx
// EncodingBase64.tsx — after refactor
// Card shows description + two buttons (Encode / Decode).
// Clicking a button opens a full-screen dialog with source (left) | result (right).

import { useState } from 'react'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToolError } from '@/hooks'
import { decodeBase64, encodeBase64 } from '@/utils/base64'
import { isValidBase64 } from '@/utils/validation'

const toolEntry = TOOL_REGISTRY_MAP['base64-encoder']

export const EncodingBase64 = () => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [action, setAction] = useState<'decode' | 'encode'>('encode')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { clearError, error, setError } = useToolError()

  const process = (val: string, act: 'decode' | 'encode') => {
    if (!val.trim()) {
      setResult('')
      clearError()
      return
    }
    try {
      if (act === 'decode' && !isValidBase64(val)) {
        throw new Error('invalid')
      }
      setResult(act === 'encode' ? encodeBase64(val) : decodeBase64(val))
      clearError()
    } catch {
      setResult('')
      setError(
        act === 'encode'
          ? 'Unable to encode text — input contains invalid characters'
          : 'Enter a valid Base64 string (e.g., SGVsbG8=)',
      )
    }
  }

  const processInput = useDebounceCallback((val: string) => {
    process(val, action)
  }, 150)

  const handleSourceChange = (val: string) => {
    setSource(val)
    processInput(val)
  }

  const openDialog = (act: 'decode' | 'encode') => {
    setAction(act)
    setResult('')
    clearError()
    setDialogOpen(true)
  }

  const handleReset = () => {
    setSource('')
    setResult('')
    clearError()
  }

  const placeholder = action === 'encode' ? 'Hello, World!' : 'SGVsbG8sIFdvcmxkIQ=='
  const resultPlaceholder = action === 'encode' ? 'SGVsbG8sIFdvcmxkIQ==' : 'Hello, World!'

  return (
    <div className="flex size-full grow flex-col gap-4">
      {toolEntry?.description && (
        <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>
      )}

      {/* Card-level: two action buttons, vertically centered */}
      <div className="flex grow flex-col items-center justify-center gap-2">
        <Button block onClick={() => openDialog('encode')} variant="default">
          Encode
        </Button>
        <Button block onClick={() => openDialog('decode')} variant="default">
          Decode
        </Button>
      </div>

      {/* Full-screen dialog: source (left) | result (right) */}
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleReset}
        size="screen"
        title={action === 'encode' ? 'Base64 Encode' : 'Base64 Decode'}
      >
        <div className="flex size-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 md:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label="Source"
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder={placeholder}
                rows={12}
                type="textarea"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-700 md:border-t-0 md:border-l-2" />

            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                disabled={!result}
                label={
                  <span className="flex items-center gap-1">
                    <span>Result</span>
                    <CopyButton label="result" value={result} />
                  </span>
                }
                name="result"
                placeholder={resultPlaceholder}
                rows={12}
                type="textarea"
                value={result}
              />
            </div>
          </div>

          {error != null && (
            <p className="text-error text-body-sm shrink-0" role="alert">
              {error}
            </p>
          )}
        </div>
      </Dialog>
    </div>
  )
}
```

### Existing Codebase Patterns to Follow

#### Import Ordering
```tsx
// 1. External libraries (alphabetical)
import { useState } from 'react'

// 2. Type-only imports (if any)

// 3. Internal @/ imports (alphabetical)
import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToolError } from '@/hooks'
import { decodeBase64, encodeBase64 } from '@/utils/base64'
import { isValidBase64 } from '@/utils/validation'
```

#### Component Export Pattern
```tsx
// Named export, NOT default
export const EncodingBase64 = () => {
```

### Architecture Compliance

- **No ToolLayout** — ToolLayout was deprecated in story 3-1; each tool owns its own flat layout [Source: story 3-1 PO Override]
- **No OutputDisplay** — Removed from codebase; not needed for this tool's textarea pattern
- **useToolError required** — Never implement custom error state in tools [Source: architecture.md#Error Handling]
- **Standardized CopyButton** — Use from `@/components/common/button/`, not manual Button + CopyIcon [Source: architecture.md#Pattern Examples]
- **150ms debounce** — Text conversion tools use 150ms debounce on input change [Source: architecture.md#Tool Input Processing]
- **Error messages with examples** — Concise, actionable, include valid input example [Source: architecture.md#Error Message Format]
- **Named exports** — `export const EncodingBase64` not `export default` [Source: project-context.md#Anti-Patterns]
- **`import type` for types** — Required by `verbatimModuleSyntax` [Source: project-context.md#Language-Specific Rules]
- **`type` not `interface`** — oxlint enforced [Source: project-context.md#Language-Specific Rules]
- **`Array<T>` not `T[]`** — oxlint enforced [Source: project-context.md#Language-Specific Rules]
- **100% client-side** — Zero network requests. All Base64 encoding/decoding in browser [Source: architecture.md#NFR9]
- **No `console.log`** — oxlint enforced [Source: project-context.md#Code Quality Rules]

### Previous Story Intelligence (Story 3.1)

From story 3-1 (Color Converter refactor):

- **ToolLayout was deprecated and deleted** — PO decision. Each tool uses a flat `<div>` layout. Do NOT attempt to use ToolLayout.
- **OutputDisplay was removed** — Not needed. Tools use their own output patterns.
- **Error display pattern established**: `<p className="text-error text-body-sm shrink-0" role="alert">{error}</p>` placed after inputs
- **Description pattern established**: `{toolEntry?.description && <p className="text-body-xs ...">}` at top of component
- **CopyButton integration**: Use as `suffix` prop for TextInput, or in label for TextAreaInput
- **All 57 color tests + 101 validation tests + 8 CopyButton + 6 useToolError = 172 tests passing**
- **Build/lint/format all clean** at story 3-1 completion
- **Commit pattern**: `♻️: story 3.1` for refactor stories

### Git Intelligence

Recent commits:
```
b0fd290 ♻️: story 3.1
89ba26b 📝: retro epic 2
a32fd58 ♻️: story 2-5
33075fd ♻️: story 2.4
24020b6 ♻️: story 2-3
```

**Pattern**: `♻️:` prefix for refactor stories. This story should use `♻️: story 3.2`.

**Key files from story 3-1 that inform patterns:**
- `src/components/feature/color/ColorConvertor.tsx` — Reference pattern (134 lines, flat layout, useToolError, CopyButton, 150ms debounce, TOOL_REGISTRY_MAP description)
- `src/components/common/card/Card.tsx` — overflow-y-auto (scroll in Card, not tool)
- ToolLayout deleted, OutputDisplay deleted

### Project Structure Notes

**Files to CREATE:**
- `src/utils/base64.ts` — `encodeBase64` and `decodeBase64` functions with Unicode support
- `src/utils/base64.spec.ts` — Regression tests for encode/decode logic (~16+ test cases)

**Files to MODIFY:**
- `src/components/feature/encoding/EncodingBase64.tsx` — Refactor: useToolError, CopyButton, 150ms debounce, description, utility functions
- `src/utils/index.ts` — Add base64 barrel export (if barrel exists)

**Files NOT to modify:**
- `src/utils/validation.ts` — `isValidBase64` already exists and is correct
- `src/constants/tool-registry.ts` — Base64 entry already exists with correct metadata
- `src/components/common/tabs/Tabs.tsx` — Tabs component is stable
- `src/pages/home/index.tsx` — No changes needed
- `src/pages/tool/index.tsx` — No changes needed
- Any Epic 2 common components — CopyButton, useToolError are stable

### Feature Spec (AC5)

#### Base64 Encoder Feature Specification

**Purpose:** Encode plaintext to Base64 and decode Base64 to plaintext in real-time.

**Tabs:**
| Tab | Input | Output | Processing |
|-----|-------|--------|------------|
| Encoder | Plaintext string | Base64-encoded string | `encodeBase64(input)` |
| Decoder | Base64-encoded string | Plaintext string | `decodeBase64(input)` |

**Encoding Algorithm:**
1. Convert string to UTF-8 bytes via `TextEncoder`
2. Convert bytes to Latin1 string via `String.fromCodePoint`
3. Apply `btoa()` to Latin1 string
4. Return Base64 string

**Decoding Algorithm:**
1. Apply `atob()` to Base64 string → Latin1 binary string
2. Convert each character to byte value via `charCodeAt`
3. Create `Uint8Array` from bytes
4. Decode via `TextDecoder` → original UTF-8 string

**Supported Inputs (Encode):**
| Input Type | Example | Notes |
|-----------|---------|-------|
| ASCII text | `Hello, World!` | Standard case |
| Unicode | `こんにちは` | Requires TextEncoder path |
| Emoji | `🚀🎉` | Multi-byte code points |
| Special chars | `<>&"'\n\t` | HTML/whitespace chars |
| Empty string | `` | Returns empty string, no error |
| Whitespace only | `   ` | Encodes whitespace bytes |
| Large text | 10KB+ | Must complete without error |

**Supported Inputs (Decode):**
| Input Type | Example | Notes |
|-----------|---------|-------|
| Valid Base64 (padded) | `SGVsbG8=` | Standard case |
| Valid Base64 (double pad) | `dGVzdA==` | Standard case |
| Valid Base64 (no padding) | `Zm9v` | Length divisible by 4 |
| Unicode-encoded Base64 | (result of encoding Unicode) | Round-trip support |
| Empty string | `` | Returns empty string, no error |

**Error Cases (Decode):**
| Input | Error | Message |
|-------|-------|---------|
| Invalid characters (`!@#$`) | Yes | "Enter a valid Base64 string (e.g., SGVsbG8=)" |
| Length not % 4 (`abc`) | Yes | "Enter a valid Base64 string (e.g., SGVsbG8=)" |
| Malformed padding (`===`) | Yes | "Enter a valid Base64 string (e.g., SGVsbG8=)" |

**Behavior:**
- Click "Encode" or "Decode" button on card → dialog opens with corresponding mode
- Type in dialog source (left pane) → result (right pane) updates in real-time (150ms debounce)
- Empty source → clear result, clear error
- Invalid decode input → clear result, show inline error in dialog
- Close dialog → full reset (source, result, error all cleared)
- Copy → CopyButton in dialog result pane with animated feedback + toast

**Edge Cases:**
- Card shows only description + two vertically-stacked, centered buttons (no textarea, no tabs)
- Each dialog open is a fresh session — no state carried between opens
- Very large input (100KB+): may be slow but should not crash
- Newlines in input: encoded as part of the string (not stripped)
- Mobile: dialog panes stack vertically (source top, result bottom)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#FR8] — Base64 encode/decode
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Message Format] — Concise, actionable, with example
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Input Processing] — 150ms debounce for text conversion
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions] — useToolError pattern
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Defining Experience] — Paste → result → copy loop
- [Source: _bmad-output/project-context.md] — 53 project rules (types, imports, naming, etc.)
- [Source: _bmad-output/implementation-artifacts/3-1-color-converter-refactor-spec-and-tests.md] — Reference pattern: flat layout, useToolError, CopyButton, TOOL_REGISTRY_MAP
- [Source: src/components/feature/encoding/EncodingBase64.tsx] — Current implementation (92 lines)
- [Source: src/utils/validation.ts#isValidBase64] — Existing Base64 validator (lines 22-25)
- [Source: src/hooks/useToolError.ts] — Error state hook (13 lines)
- [Source: src/components/common/button/CopyButton.tsx] — Standardized CopyButton (83 lines)
- [Source: src/hooks/useDebounceCallback.ts] — Debounce hook (800ms default, override to 150ms)
- [Source: src/components/common/tabs/Tabs.tsx] — Radix Tabs component (135 lines)
- [Source: src/components/common/dialog/Dialog.tsx] — Dialog component (83 lines, Radix + Motion, size variants: default/screen/small)
- [Source: src/types/components/common/dialog.ts] — DialogProps type (injected, onAfterClose, size, title, trigger)
- [Source: src/components/feature/image/ImageResizer.tsx] — Reference pattern for dialog with side-by-side layout (lines 278-347)
- [Source: src/constants/tool-registry.ts] — TOOL_REGISTRY entry for base64-encoder (lines 7-26)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Test 3.15 (whitespace in Base64): Node `atob()` is lenient with spaces — handles gracefully rather than throwing. Component-level `isValidBase64` rejects whitespace strings before they reach `decodeBase64`, so the UI still catches invalid input.
- Build initially failed because spec file didn't import `describe/expect/it` from vitest — existing project pattern requires explicit imports for TypeScript compatibility despite `globals: true` in vitest config.

### Completion Notes List

- Created `src/utils/base64.ts` with `encodeBase64` and `decodeBase64` functions using `TextEncoder`/`TextDecoder` for full Unicode support (ASCII, CJK, emoji, special chars)
- Refactored `EncodingBase64.tsx` from 92 lines to 137 lines: replaced raw `btoa`/`atob` with utility functions, `Error` state with `useToolError`, manual copy button with `CopyButton`, added Dialog UI (size="screen" with side-by-side layout), 150ms debounce, tool description, `isValidBase64` validation for decode
- Wrote 19 regression tests covering encode (7 cases), decode (8 cases), and round-trip (4 parameterized cases)
- All 191 tests pass (19 new + 172 existing), no regressions
- Build, lint, and format all clean

### Change Log

- 2026-02-14: Story 3.2 implementation complete — Base64 utility extraction, component refactor with Dialog UI, 19 regression tests
- 2026-02-14: Code review fixes (4 issues) — whitespace encoding bug, tautological tests, stale source on reopen, descriptive error wrapping

### File List

- `src/utils/base64.ts` — NEW: `encodeBase64` and `decodeBase64` with Unicode support via TextEncoder/TextDecoder
- `src/utils/base64.spec.ts` — NEW: 19 regression tests (encode, decode, round-trip, error cases)
- `src/utils/index.ts` — MODIFIED: Added base64 barrel export
- `src/components/feature/encoding/EncodingBase64.tsx` — MODIFIED: Full refactor — useToolError, CopyButton, Dialog UI, 150ms debounce, isValidBase64 validation, tool description

## Senior Developer Review (AI)

**Reviewer:** csrteam on 2026-02-14
**Outcome:** Approved (after fixes)

### Issues Found & Fixed

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| H1 | HIGH | `!val.trim()` in `process()` treated whitespace-only input as empty, skipping encoding (AC5 violation) | Changed to `val.length === 0` |
| M1 | MEDIUM | Tests 3.2/3.3 used tautological assertions (same algorithm to compute expected value) | Replaced with hardcoded known Base64 values |
| M2 | MEDIUM | `openDialog()` didn't reset `source` — stale text could persist across rapid close/reopen | Added `setSource('')` to `openDialog()` |
| M3 | MEDIUM | `decodeBase64` threw native DOMException, not descriptive error per task 1.3 | Wrapped `atob` in try/catch with `Error('Invalid Base64 input')` |

### Issues Noted (not fixed)

| # | Severity | Issue | Rationale |
|---|----------|-------|-----------|
| L1 | LOW | Result textarea uses `disabled={!result}` not `readOnly` | Follows prescribed pattern from dev notes; systemic if wrong |
| L2 | LOW | Encode error message is unreachable dead code | Defensive — no harm, low priority |

### Verification After Fixes

- 191 tests pass (0 regressions)
- Lint: 0 errors (3 pre-existing warnings)
- Format: clean
- Build: passes (tsc + vite)
