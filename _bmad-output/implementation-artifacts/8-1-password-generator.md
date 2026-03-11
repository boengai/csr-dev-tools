# Story 8.2: Password Generator

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to generate random passwords with configurable length and character types**,
So that **I can quickly create secure passwords for development and testing**.

**Epic:** Epic 8 — Generator Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (useToolError, CopyButton — complete), Story 8-1 (Generator category — complete)
**Story Key:** 8-2-password-generator

## Acceptance Criteria

### AC1: Tool Registered and Renders Inline

**Given** the Password Generator tool registered in `TOOL_REGISTRY` under the Generator category
**When** the user navigates to it (via sidebar, command palette, or `/tools/password-generator` route)
**Then** it renders inline with configuration options, a generate button, and password output
**And** a one-line description is shown from the registry entry
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Configuration Options Available

**Given** the configuration options
**When** the user views them
**Then** they can set: length (8-128 characters via slider and number input in sync), and toggle inclusion of: uppercase letters, lowercase letters, digits, and symbols
**And** all toggles default to enabled
**And** length defaults to 16

### AC3: Password Generation on Button Click

**Given** the user clicks "Generate"
**When** a password is generated
**Then** it is displayed in the output region with a `CopyButton`
**And** it respects all selected configuration options (length and enabled character types)

### AC4: Pre-Generated Password on Mount

**Given** the tool loads
**When** the page renders
**Then** a password is pre-generated with smart defaults (16 chars, all types enabled) so the output is immediately useful

### AC5: Minimum One Character Type Enforced

**Given** the user disables all character type toggles
**When** no character types are selected
**Then** at least one toggle remains enabled (prevent impossible state — last active toggle cannot be disabled)

### AC6: Guaranteed Character Representation

**Given** the user generates a password with multiple character types enabled
**When** the password is generated
**Then** it contains at least one character from each enabled type
**And** the remaining characters are randomly drawn from the combined enabled character pool

### AC7: Cryptographically Secure Randomness

**Given** the tool implementation
**When** passwords are generated
**Then** it uses `crypto.getRandomValues()` for cryptographically secure randomness — no `Math.random()`
**And** zero network requests are made — generation is entirely client-side

### AC8: Unit Tests Cover All Password Scenarios

**Given** unit tests in `src/utils/password.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: length constraints (8, 16, 128), character type filtering (each type solo), guaranteed representation of each enabled type, edge cases (length 8, length 128), all-types-disabled prevention, and randomness verification (consecutive calls produce different passwords)

## Tasks / Subtasks

- [x] Task 1: Create password utility functions (AC: #3, #5, #6, #7)
  - [x] 1.1 Create `src/utils/password.ts` with `generatePassword(options: PasswordOptions): string`
  - [x] 1.2 Define character sets: `UPPERCASE` (A-Z), `LOWERCASE` (a-z), `DIGITS` (0-9), `SYMBOLS` (standard set)
  - [x] 1.3 Implement `crypto.getRandomValues()` for secure random character selection
  - [x] 1.4 Guarantee at least 1 character from each enabled type, then fill remaining length from combined pool
  - [x] 1.5 Shuffle final password to prevent predictable positioning of guaranteed characters
  - [x] 1.6 Clamp length to 8-128 range
  - [x] 1.7 Export `generatePassword`, character set constants, and `PasswordOptions` type

- [x] Task 2: Write unit tests for password utilities (AC: #8)
  - [x] 2.1 Create `src/utils/password.spec.ts`
  - [x] 2.2 Test default generation produces valid 16-char password with all character types
  - [x] 2.3 Test length 8 (minimum boundary)
  - [x] 2.4 Test length 128 (maximum boundary)
  - [x] 2.5 Test uppercase-only password contains only A-Z
  - [x] 2.6 Test lowercase-only password contains only a-z
  - [x] 2.7 Test digits-only password contains only 0-9
  - [x] 2.8 Test symbols-only password contains only symbol characters
  - [x] 2.9 Test all-types-enabled guarantees at least 1 of each type
  - [x] 2.10 Test length clamping: below 8 → 8, above 128 → 128
  - [x] 2.11 Test consecutive calls produce different passwords (randomness)
  - [x] 2.12 Test fractional length floors to integer
  - [x] 2.13 Test NaN/invalid length defaults to 16

- [x] Task 3: Create PasswordGenerator component (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Create `src/components/feature/generator/PasswordGenerator.tsx` as named export
  - [x] 3.2 Render inline (no dialog) — config section, generate button, and output all visible immediately
  - [x] 3.3 Inline layout:
    - **Top:** Tool description from registry
    - **Config:** Length slider (`<input type="range">`) + number `FieldForm` (synced), character type toggles using `FlagToggle`-style buttons
    - **Generate button:** `Button` with `variant="default"`
    - **Divider:** `border-t-2 border-dashed border-gray-900`
    - **Bottom:** Output region with generated password in monospace + `CopyButton`
  - [x] 3.4 Pre-generate one password on mount via `useState(() => generatePassword(defaultOptions))`
  - [x] 3.5 "Generate" button click → call `generatePassword(currentOptions)` → display result
  - [x] 3.6 Length slider and number input synced: changing one updates the other
  - [x] 3.7 Character type toggles: prevent disabling last active toggle (AC #5)
  - [x] 3.8 Show tool description from `TOOL_REGISTRY_MAP['password-generator']`
  - [x] 3.9 Initialize `useToolError()` for architectural consistency
  - [x] 3.10 No debounce needed — generator uses explicit button click

- [x] Task 4: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 4.1 Add `'password-generator'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetically between `'jwt-decoder'` and `'px-to-rem'`)
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts` (alphabetically between `jwt-decoder` and `px-to-rem` entries)
  - [x] 4.3 Add pre-render route in `vite.config.ts` toolRoutes array (alphabetically between `jwt-decoder` and `px-to-rem`)

- [x] Task 5: Update barrel exports (AC: #1)
  - [x] 5.1 Add `export { PasswordGenerator } from './PasswordGenerator'` to `src/components/feature/generator/index.ts`
  - [x] 5.2 Add `export * from './password'` to `src/utils/index.ts` (alphabetically between `'./jwt'` and `'./regex'`)

- [x] Task 6: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [x] 6.1 Run `pnpm lint` — no errors
  - [x] 6.2 Run `pnpm format:check` — no formatting issues
  - [x] 6.3 Run `pnpm test` — all tests pass (478 existing + 14 new = 492)
  - [x] 6.4 Run `pnpm build` — build succeeds, tool chunk is separate (3.08 kB), no impact on initial bundle

## Dev Notes

### Second Generator Tool — Category Already Established

This is the **second tool in the 'Generator' category**. Unlike story 8-1 (UUID Generator), the Generator category infrastructure is already in place:
- `'Generator'` exists in `ToolCategory` union type
- `'Generator'` exists in `CATEGORY_ORDER` in Sidebar.tsx
- `src/components/feature/generator/` directory exists with `index.ts` barrel
- Feature barrel in `src/components/feature/index.ts` already exports `'./generator'`

**No new category setup required.** Only add the new tool component and registry entry.

### Inline Layout with Synchronous Processing — No Debounce

This tool renders **inline** (like `UuidGenerator`) with **synchronous processing** (native `crypto.getRandomValues()` — NO dynamic import, NO debounce). Follows the same pattern as story 8-1.

1. **Synchronous processing** — `crypto.getRandomValues()` is native Web Crypto API, synchronous, zero latency. No `useDebounceCallback`, no `sessionRef`.
2. **Button-click trigger** — "Generate" button calls `generatePassword(options)` directly. Matches architecture's input processing pattern: "generators on explicit button click."
3. **Pre-generated output** — on mount, auto-generate 1 password via `useState(() => generatePassword(defaultOptions))` so the output is immediately useful.
4. **Config options rendered inline** — length slider + number input synced, character type toggles below.

### UI Layout (Inline — Side-by-Side)

```
┌──────────────────────────────────────────────────────────┐
│  Generate random passwords with...                        │
│                                                           │
│  ┌─── 3/5 width ──────────────┐ ┌─── 2/5 width ────────┐│
│  │ Length                      │ │ [ABC] [abc]           ││
│  │ [========16========] [ 16] │ │ [123] [!@#]           ││
│  │ Count                       │ │                       ││
│  │ [=1===================] [1] │ │ [    Generate    ]    ││
│  └─────────────────────────────┘ └───────────────────────┘│
│  ──────────── dashed divider ─────────────                │
│  Generated Passwords (1)                 [Copy All]       │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ xK9$mP2#nL5@bQ8!                           [Copy]   │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Character Type Toggle Pattern

Reuse the `FlagToggle` pattern from `RegexTester.tsx` (lines 22-34):

```typescript
const CharToggle = ({ active, label, onToggle }: { active: boolean; label: string; onToggle: () => void }) => (
  <button
    aria-label={`Toggle ${label}`}
    aria-pressed={active}
    className={`rounded border px-3 font-mono text-xs leading-7 ${
      active ? 'border-primary bg-primary/20 text-primary font-bold' : 'border-gray-700 bg-transparent text-gray-500'
    }`}
    onClick={onToggle}
    type="button"
  >
    {label}
  </button>
)
```

Toggle labels: `ABC` (uppercase), `abc` (lowercase), `123` (digits), `!@#` (symbols)

### Processing Flow

```
Component mounts
  → Auto-generate 1 password via useState(() => [generatePassword(defaultOptions)])
  → Default: length=16, count=1, uppercase=true, lowercase=true, digits=true, symbols=true
  → Display immediately

User adjusts length slider/number input (RangeInput)
  → Sync both controls: slider ↔ number input (handled by RangeInput component)
  → Clamping on blur (8-128), free typing in number input
  → No auto-generation (wait for button click)

User adjusts count slider/number input (RangeInput)
  → Same sync behavior, clamped 1-20
  → No auto-generation (wait for button click)

User toggles character type
  → Toggle state updates
  → If this would disable the LAST active type → prevent toggle (no-op)
  → No auto-generation (wait for button click)

User clicks "Generate"
  → Array.from({ length: count }, () => generatePassword(options))
  → setPasswords(results)
  → Display passwords in scrollable box with per-item CopyButton + bulk copy
```

### Password Generation Algorithm

```
1. Build character pool from enabled sets:
   - uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
   - lowercase: "abcdefghijklmnopqrstuvwxyz"
   - digits: "0123456789"
   - symbols: "!@#$%^&*()-_=+[]{}|;:',.<>?/~`"

2. Guarantee at least 1 character from each enabled type:
   - For each enabled set, pick 1 random character using crypto.getRandomValues()
   - This ensures the password meets complexity requirements

3. Fill remaining length from combined pool:
   - Combine all enabled character sets into one pool
   - For remaining (length - guaranteedCount) chars, pick from combined pool

4. Shuffle the final character array:
   - Fisher-Yates shuffle using crypto.getRandomValues()
   - Prevents guaranteed characters from always being at the start

5. Return joined string
```

### No External Library Decision

**Decision:** Use native `crypto.getRandomValues()` — no npm dependency needed.

**Rationale:**
- `crypto.getRandomValues()` fills TypedArrays with cryptographically secure random values
- Available in all modern browsers (very wide support — older than `crypto.randomUUID()`)
- Zero bundle cost, zero dynamic import overhead
- Provides better randomness than `Math.random()` for password generation
- FR23 explicitly requires cryptographic quality randomness

**Random character selection approach:**
```typescript
const randomIndex = (max: number): number => {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0] % max
}
```

The modulo bias is negligible for our pool sizes (26-94 characters against 2^32 range).

### Character Set Constants

```typescript
export const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz'
export const DIGIT_CHARS = '0123456789'
export const SYMBOL_CHARS = '!@#$%^&*()-_=+[]{}|;:\',./<>?~`'
```

### PasswordOptions Type

```typescript
export type PasswordOptions = {
  digits: boolean
  length: number
  lowercase: boolean
  symbols: boolean
  uppercase: boolean
}

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  digits: true,
  length: 16,
  lowercase: true,
  symbols: true,
  uppercase: true,
}
```

### Project Structure Notes

- **Existing directory:** `src/components/feature/generator/` — already has `UuidGenerator.tsx` and `index.ts`
- **No new category** — `'Generator'` already in `ToolCategory` and `CATEGORY_ORDER`
- **No type file needed** — PasswordOptions type lives in `src/utils/password.ts` alongside the utility (follows uuid.ts pattern — simple types don't need separate type file)
- **Alphabetical insertion** — `password-generator` goes between `jwt-decoder` and `px-to-rem` in all registries

### Architecture Compliance

- **TOOL_REGISTRY entry required** — tool must be discoverable via sidebar, command palette, dashboard selection dialog, and direct URL. Dashboard is a fixed 6-slot favorites grid — new tools do NOT auto-appear there [Source: architecture.md#Tool Registry]
- **Named export only** — `export const PasswordGenerator` (never `export default`) [Source: project-context.md#Named exports]
- **Lazy-loaded component** — registry uses `lazy(() => import(...).then(({ PasswordGenerator }) => ({ default: PasswordGenerator })))` [Source: architecture.md#Code Splitting]
- **100% client-side** — zero network requests for password generation [Source: architecture.md#Hard Constraints]
- **useToolError for errors** — initialized for consistency, unlikely to trigger [Source: architecture.md#Error Handling]
- **Generator process pattern** — on explicit button click (NOT on-change debounce) [Source: architecture.md#Process Patterns]
- **aria-pressed toggles** — character type toggles use `aria-pressed` for accessibility [Source: RegexTester.tsx FlagToggle pattern]

### Library & Framework Requirements

- **No new dependency** — uses native Web Crypto API `crypto.getRandomValues()`
- **Existing imports used:** `useState` from React, `Button`, `CopyButton`, `FieldForm` from `@/components/common`, `TOOL_REGISTRY_MAP` from `@/constants`, `useToolError` from `@/hooks`
- **NOT importing:** `useDebounceCallback` (not needed for generators), `Dialog` (inline layout)

### File Structure Requirements

**Files to CREATE:**

```
src/utils/password.ts                                  — generatePassword(), PasswordOptions, character constants
src/utils/password.spec.ts                             — Unit tests for password utilities (~12 tests)
src/components/feature/generator/PasswordGenerator.tsx  — Password Generator component
```

**Files to MODIFY:**

```
src/types/constants/tool-registry.ts          — Add 'password-generator' to ToolRegistryKey
src/constants/tool-registry.ts                — Add password-generator registry entry
src/components/feature/generator/index.ts     — Add PasswordGenerator export
src/utils/index.ts                            — Add password barrel export
vite.config.ts                                — Add password-generator pre-render route
```

**Files NOT to modify:**
- Any existing tool components (no changes to UuidGenerator)
- `src/hooks/useToolError.ts` — reused as-is
- `src/utils/validation.ts` — no password validation needed (password generator doesn't validate input)
- `src/hooks/useDebounceCallback.ts` — not used (generator pattern)
- `src/types/constants/tool-registry.ts` `ToolCategory` — Generator already exists
- `src/components/common/sidebar/Sidebar.tsx` `CATEGORY_ORDER` — Generator already listed

### Testing Requirements

**Unit tests (`src/utils/password.spec.ts`):**

```typescript
import { describe, expect, it } from 'vitest'

import { DEFAULT_PASSWORD_OPTIONS, DIGIT_CHARS, generatePassword, LOWERCASE_CHARS, SYMBOL_CHARS, UPPERCASE_CHARS } from '@/utils/password'

describe('password utilities', () => {
  describe('generatePassword', () => {
    it('should generate a password with default length of 16', () => {
      const password = generatePassword(DEFAULT_PASSWORD_OPTIONS)
      expect(password).toHaveLength(16)
    })

    it('should respect custom length', () => {
      const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 32 })
      expect(password).toHaveLength(32)
    })

    it('should generate minimum length password (8)', () => {
      const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 8 })
      expect(password).toHaveLength(8)
    })

    it('should generate maximum length password (128)', () => {
      const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 128 })
      expect(password).toHaveLength(128)
    })

    it('should clamp length below minimum to 8', () => {
      const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 3 })
      expect(password).toHaveLength(8)
    })

    it('should clamp length above maximum to 128', () => {
      const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 200 })
      expect(password).toHaveLength(128)
    })

    it('should floor fractional length', () => {
      const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 20.7 })
      expect(password).toHaveLength(20)
    })

    it('should default NaN length to 16', () => {
      const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: NaN })
      expect(password).toHaveLength(16)
    })

    it('should generate uppercase-only when only uppercase enabled', () => {
      const password = generatePassword({ digits: false, length: 32, lowercase: false, symbols: false, uppercase: true })
      expect(password).toMatch(/^[A-Z]+$/)
    })

    it('should generate lowercase-only when only lowercase enabled', () => {
      const password = generatePassword({ digits: false, length: 32, lowercase: true, symbols: false, uppercase: false })
      expect(password).toMatch(/^[a-z]+$/)
    })

    it('should generate digits-only when only digits enabled', () => {
      const password = generatePassword({ digits: true, length: 32, lowercase: false, symbols: false, uppercase: false })
      expect(password).toMatch(/^[0-9]+$/)
    })

    it('should generate symbols-only when only symbols enabled', () => {
      const password = generatePassword({ digits: false, length: 32, lowercase: false, symbols: true, uppercase: false })
      for (const char of password) {
        expect(SYMBOL_CHARS).toContain(char)
      }
    })

    it('should contain at least 1 character of each enabled type with all types on', () => {
      // Run multiple times to account for randomness
      for (let i = 0; i < 10; i++) {
        const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 16 })
        expect(password).toMatch(/[A-Z]/)
        expect(password).toMatch(/[a-z]/)
        expect(password).toMatch(/[0-9]/)
        const hasSymbol = [...password].some((c) => SYMBOL_CHARS.includes(c))
        expect(hasSymbol).toBe(true)
      }
    })

    it('should produce different passwords on consecutive calls', () => {
      const p1 = generatePassword(DEFAULT_PASSWORD_OPTIONS)
      const p2 = generatePassword(DEFAULT_PASSWORD_OPTIONS)
      expect(p1).not.toBe(p2)
    })
  })
})
```

### TOOL_REGISTRY Entry (Copy-Paste Ready)

```typescript
{
  category: 'Generator',
  component: lazy(() =>
    import('@/components/feature/generator/PasswordGenerator').then(
      ({ PasswordGenerator }: { PasswordGenerator: ComponentType }) => ({
        default: PasswordGenerator,
      }),
    ),
  ),
  description: 'Generate random passwords with configurable length and character types',
  emoji: '🔑',
  key: 'password-generator',
  name: 'Password Generator',
  routePath: '/tools/password-generator',
  seo: {
    description:
      'Generate secure random passwords online. Configure length, uppercase, lowercase, digits, and symbols. Cryptographically secure — runs entirely in your browser.',
    title: 'Password Generator - CSR Dev Tools',
  },
}
```

### ToolRegistryKey Type Update (Copy-Paste Ready)

```typescript
export type ToolRegistryKey =
  | 'base64-encoder'
  | 'color-converter'
  | 'image-converter'
  | 'image-resizer'
  | 'json-formatter'
  | 'json-to-csv-converter'
  | 'json-to-yaml-converter'
  | 'jwt-decoder'
  | 'password-generator'
  | 'px-to-rem'
  | 'regex-tester'
  | 'text-diff-checker'
  | 'unix-timestamp'
  | 'url-encoder-decoder'
  | 'uuid-generator'
```

### Vite Config Pre-Render Route (Copy-Paste Ready)

```typescript
{
  description:
    'Generate secure random passwords online. Configure length, uppercase, lowercase, digits, and symbols. Cryptographically secure — runs entirely in your browser.',
  path: '/tools/password-generator',
  title: 'Password Generator - CSR Dev Tools',
  url: '/tools/password-generator',
},
```

### Generator Barrel Export Update (Copy-Paste Ready)

```typescript
// src/components/feature/generator/index.ts
export { PasswordGenerator } from './PasswordGenerator'
export { UuidGenerator } from './UuidGenerator'
```

### Utils Barrel Update (Copy-Paste Ready)

Add between `'./jwt'` and `'./regex'`:
```typescript
export * from './password'
```

### Error Messages

| Scenario | Behavior |
|----------|----------|
| Component mounts | Pre-generate 1 password, display immediately, no error |
| User clicks Generate | Generate password, display result, no error |
| Last toggle disabled attempt | Prevent toggle (no-op), no error message shown |
| Length out of range | Clamp silently to 8-128 (no error) |

Note: Like the UUID Generator, this tool has minimal error potential since `crypto.getRandomValues()` cannot fail under normal conditions. The `useToolError` hook is initialized for architectural consistency but is unlikely to be triggered.

### Previous Story Intelligence

From Story 8-1 (UUID Generator — most recent in this epic):
- **Inline layout proven** — tool renders directly in card, no dialog pattern
- **FlagForm with type="number" works** — min/max props supported after TextInput fix in 8-1
- **Generator barrel exists** — `src/components/feature/generator/index.ts` ready for additional exports
- **Synchronous processing pattern proven** — native crypto API, no async, no debounce
- **478 tests exist** — expect ~490 after adding password tests (~12 new)
- **Commit prefix:** Use `✨: story 8-2 Password Generator`

From Story 7-2 (Regex Tester):
- **FlagToggle pattern** — `aria-pressed` toggle buttons used for regex flags (g, i, m). Reuse this exact pattern for character type toggles (uppercase, lowercase, digits, symbols).

### Git Intelligence

Recent commits analyzed:
```
2f9e4e3 ✨: story 8-1 UUID Generator with inline layout
03a11da 🔄: epic 7 retrospective
3a16012 ✨: story 7-2 Regex Tester with live match highlighting
bd8da26 🐛: loading center
a0f73b0 ✨: story 7-1 Text Diff Checker with side-by-side view
```

**Pattern:** New tool feature uses `✨: story X-Y Tool Name` commit prefix.
**Files changed in story 8-1:** 15 files — utility, tests, component, barrel exports, registry, types, vite config.
**This story is simpler than 8-1:** No new category setup needed. Only component, utility, tests, and registry modifications.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 8.2] — Full AC definitions and story requirements
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 8] — Epic objectives and FR coverage (FR23)
- [Source: _bmad-output/planning-artifacts/prd.md] — FR23: Users can generate random passwords with configurable length (8-128) and toggle uppercase, lowercase, digits, symbols
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Registry] — Registry entry pattern with all required fields
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — `password-generator` key, `Generator` category
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Generators: on explicit button click
- [Source: _bmad-output/planning-artifacts/architecture.md#Hard Constraints] — Zero server-side processing
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Tool component file structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Message Format] — Concise, actionable, with example
- [Source: _bmad-output/project-context.md] — 53 project rules (named exports, type not interface, Array<T>, etc.)
- [Source: src/components/feature/generator/UuidGenerator.tsx] — Inline layout pattern, synchronous processing reference
- [Source: src/components/feature/text/RegexTester.tsx:22-34] — FlagToggle pattern for aria-pressed toggle buttons
- [Source: src/utils/uuid.ts] — Utility function pattern reference (same domain)
- [Source: src/constants/tool-registry.ts] — Current registry with 14 tools, alphabetical ordering
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey union to update (Generator category already exists)
- [Source: src/hooks/useToolError.ts] — Error handling hook (clearError, error, setError)
- [Source: vite.config.ts] — Pre-render routes pattern
- [Source: _bmad-output/implementation-artifacts/8-1-uuid-generator.md] — Previous story: inline layout, generator category setup, synchronous pattern
- [Source: MDN — crypto.getRandomValues()] — Web Crypto API for cryptographically secure random values

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation, no debug issues encountered.

### Completion Notes List

- Task 1: Created `src/utils/password.ts` with `generatePassword()` using `crypto.getRandomValues()` for cryptographic randomness, Fisher-Yates shuffle for guaranteed character distribution, and length clamping (8-128).
- Task 2: Created `src/utils/password.spec.ts` with 14 unit tests covering default length, custom lengths, boundary clamping, fractional/NaN handling, single-type-only filtering, guaranteed representation, and randomness.
- Task 3: Created `PasswordGenerator.tsx` inline component with synced range slider + number input, FlagToggle-style character type toggles (ABC/abc/123/!@#) with last-active prevention, pre-generated password on mount, Generate button, and CopyButton output.
- Task 4: Registered `password-generator` in ToolRegistryKey type, TOOL_REGISTRY array, and vite.config.ts pre-render routes — all alphabetically between `jwt-decoder` and `px-to-rem`.
- Task 5: Added barrel exports in generator/index.ts and utils/index.ts.
- Task 6: All validations pass — 0 lint errors, formatting clean, 492 tests passing (14 new), build succeeds with separate 3.08 kB chunk and 15 pre-rendered routes.

### Change Log

- 2026-02-14: Story 8-2 Password Generator implemented — all 6 tasks complete, all ACs satisfied.
- 2026-02-14: Code review fixes applied — eliminated DRY violation (duplicate default options), split length handlers for better number input UX (clamp on blur not keystroke), added aria-label for accessibility, added test for all-disabled fallback. 493 tests passing.
- 2026-02-14: Added reusable `RangeInput` component (range slider + number input combo) integrated into `FieldForm` via `InputController` discriminated union. Added `RangeInputProps` type, `RangeInputForm` union member. Refactored PasswordGenerator to use `FieldForm type="range"` for Length. Added Count slider (1–20) for bulk password generation with per-item copy buttons and bulk copy. Refactored UuidGenerator to use `FieldForm type="range"` for Count (replacing number input). Removed `grow` from `FieldForm` fieldset to prevent range inputs from expanding and squeezing result boxes. PasswordGenerator layout changed to side-by-side: 3/5 width for sliders, 2/5 width for toggles + Generate button. Result box unified to UUID-style single scrollable box.

### File List

**Created:**
- `src/utils/password.ts` — generatePassword(), PasswordOptions type, character set constants
- `src/utils/password.spec.ts` — 14 unit tests for password utilities
- `src/components/feature/generator/PasswordGenerator.tsx` — Password Generator component
- `src/components/common/input/RangeInput.tsx` — Reusable range slider + number input component

**Modified:**
- `src/types/components/common/input.ts` — Added `RangeInputProps` type
- `src/types/components/common/form.ts` — Added `RangeInputForm` to `InputControllerProps` union
- `src/components/common/input/index.ts` — Added RangeInput barrel export
- `src/components/common/form/FieldForm.tsx` — Added `case 'range'` to InputController, removed `grow` from fieldset
- `src/components/feature/generator/UuidGenerator.tsx` — Refactored Count to use `FieldForm type="range"`
- `src/types/constants/tool-registry.ts` — Added 'password-generator' to ToolRegistryKey
- `src/constants/tool-registry.ts` — Added password-generator registry entry
- `src/components/feature/generator/index.ts` — Added PasswordGenerator barrel export
- `src/utils/index.ts` — Added password barrel export
- `vite.config.ts` — Added password-generator pre-render route
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Updated 8-2 status
- `_bmad-output/implementation-artifacts/8-2-password-generator.md` — Updated story status and dev record
