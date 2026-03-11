# Story 8.3: Hash Generator

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to generate hash values from text input using common algorithms**,
So that **I can quickly compute checksums and hashes for verification and development**.

**Epic:** Epic 8 — Generator Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (useToolError, CopyButton — complete), Stories 8-1 and 8-2 (Generator category — complete)
**Story Key:** 8-3-hash-generator

## Acceptance Criteria

### AC1: Tool Registered and Renders Inline

**Given** the Hash Generator tool registered in `TOOL_REGISTRY` under the Generator category
**When** the user navigates to it (via sidebar, command palette, or `/tools/hash-generator` route)
**Then** it renders inline with a text area input, algorithm selection, and hash output
**And** a one-line description is shown from the registry entry
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Real-Time Hash Computation on Text Input

**Given** a user enters text and selects an algorithm
**When** the input changes
**Then** the hash value is computed and displayed in real-time (debounced 300ms) in the output region
**And** a `CopyButton` copies the hex-encoded hash

### AC3: Algorithm Selection with Immediate Update

**Given** multiple algorithms are available (MD5, SHA-1, SHA-256, SHA-512)
**When** the user selects a different algorithm
**Then** the output updates immediately for the current input text (no debounce on algorithm change)

### AC4: Empty Input State

**Given** the tool loads with empty input
**When** no text is entered
**Then** the output shows "—" (em dash) as empty state placeholder

### AC5: SHA Algorithms via Web Crypto API

**Given** the tool implementation
**When** hashes are computed for SHA-1, SHA-256, or SHA-512
**Then** it uses the Web Crypto API (`crypto.subtle.digest`) — no server calls
**And** output is lowercase hexadecimal

### AC6: MD5 via Lightweight Client-Side Library

**Given** the tool implementation
**When** MD5 hash is computed
**Then** it uses `js-md5` library, dynamically imported (code-split, lazy-loaded)
**And** the library does NOT increase initial bundle size

### AC7: Unit Tests Cover All Hash Scenarios

**Given** unit tests in `src/utils/hash.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: known hash values for test vectors, empty input, Unicode text, large input, and all 4 algorithms

## Tasks / Subtasks

- [x] Task 1: Install MD5 library (AC: #6)
  - [x] 1.1 Run `pnpm add js-md5@0.8.3`
  - [x] 1.2 Add type declaration for `js-md5` if needed (check if bundled types are sufficient)

- [x] Task 2: Create hash utility functions (AC: #2, #3, #5, #6)
  - [x] 2.1 Create `src/utils/hash.ts` with `computeHash(text: string, algorithm: HashAlgorithm): Promise<string>`
  - [x] 2.2 Define `HashAlgorithm` type: `'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512'`
  - [x] 2.3 Define `HASH_ALGORITHMS` constant array and `DEFAULT_HASH_ALGORITHM` = `'SHA-256'`
  - [x] 2.4 Implement SHA algorithms via `crypto.subtle.digest()` with `TextEncoder` for UTF-8
  - [x] 2.5 Implement MD5 via dynamic `import('js-md5')` — lazy-loaded, not in initial bundle
  - [x] 2.6 Convert ArrayBuffer to lowercase hex string for output
  - [x] 2.7 Export `computeHash`, `HashAlgorithm`, `HASH_ALGORITHMS`, `DEFAULT_HASH_ALGORITHM`

- [x] Task 3: Write unit tests for hash utilities (AC: #7)
  - [x] 3.1 Create `src/utils/hash.spec.ts`
  - [x] 3.2 Test MD5("") = `d41d8cd98f00b204e9800998ecf8427e`
  - [x] 3.3 Test SHA-1("") = `da39a3ee5e6b4b0d3255bfef95601890afd80709`
  - [x] 3.4 Test SHA-256("") = `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
  - [x] 3.5 Test SHA-512("") = `cf83e1357eefb8bd...` (full 128-char hex)
  - [x] 3.6 Test MD5("hello") = `5d41402abc4b2a76b9719d911017c592`
  - [x] 3.7 Test SHA-256("hello") = `2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824`
  - [x] 3.8 Test Unicode input: SHA-256 of emoji/CJK characters produces valid hex
  - [x] 3.9 Test large input: SHA-256 of 10KB string completes without error
  - [x] 3.10 Test all 4 algorithms produce different outputs for same input

- [x] Task 4: Create HashGenerator component (AC: #1, #2, #3, #4)
  - [x] 4.1 Create `src/components/feature/generator/HashGenerator.tsx` as named export
  - [x] 4.2 Render inline — text area, algorithm toggles, output all visible immediately
  - [x] 4.3 Inline layout:
    - **Top:** Tool description from registry
    - **Input:** `TextAreaInput` with placeholder "Enter text to hash..."
    - **Algorithm selection:** Toggle buttons (MD5, SHA-1, SHA-256, SHA-512) using FlagToggle pattern, default SHA-256
    - **Divider:** `border-t-2 border-dashed border-gray-900`
    - **Bottom:** Output region with algorithm label + hash value in monospace + `CopyButton`
  - [x] 4.4 Use `useDebounceCallback` with 300ms delay for text input changes
  - [x] 4.5 On algorithm toggle change → compute immediately (no debounce)
  - [x] 4.6 Show "—" when text input is empty
  - [x] 4.7 Show tool description from `TOOL_REGISTRY_MAP['hash-generator']`
  - [x] 4.8 Initialize `useToolError()` for architectural consistency
  - [x] 4.9 Handle async nature: use `useRef` for session tracking to prevent stale results

- [x] Task 5: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 5.1 Add `'hash-generator'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetically between `'color-converter'` and `'image-converter'`)
  - [x] 5.2 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts` (alphabetically between `color-converter` and `image-converter` entries)
  - [x] 5.3 Add pre-render route in `vite.config.ts` toolRoutes array (alphabetically between `color-converter` and `image-converter`)

- [x] Task 6: Update barrel exports (AC: #1)
  - [x] 6.1 Add `export { HashGenerator } from './HashGenerator'` to `src/components/feature/generator/index.ts`
  - [x] 6.2 Add `export * from './hash'` to `src/utils/index.ts` (alphabetically between `'./file'` and `'./image'`)

- [x] Task 7: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 7.1 Run `pnpm lint` — no errors
  - [x] 7.2 Run `pnpm format:check` — no formatting issues
  - [x] 7.3 Run `pnpm test` — all tests pass (493 existing + 12 new = 505 total)
  - [x] 7.4 Run `pnpm build` — build succeeds, tool chunk is separate, js-md5 is code-split

## Dev Notes

### Third Generator Tool — Unique Processing Pattern

This is the **third and final tool in the 'Generator' category** (Epic 8). Unlike UUID (button-click, sync) and Password (button-click, sync), the Hash Generator uses a **different processing pattern**:

| Aspect | UUID Generator | Password Generator | Hash Generator |
|--------|---------------|-------------------|----------------|
| Trigger | Button click | Button click | On-change (debounced 300ms) |
| Processing | Synchronous | Synchronous | **Asynchronous** |
| Pre-generated output | Yes (1 UUID) | Yes (1 password) | No (empty "—") |
| Has text input | No | No | **Yes** (TextAreaInput) |
| External library | None | None | **js-md5** (lazy-loaded) |

The Hash Generator is architecturally more similar to **text conversion tools** (like URL Encoder or JSON Formatter) than to other generators, because it takes text input and produces deterministic output. However, it lives in the Generator category per the epics/PRD.

### Async Processing — Critical Difference

Both `crypto.subtle.digest()` and the dynamic `import('js-md5')` are **asynchronous**. This means:

1. The `computeHash` utility returns `Promise<string>` (not `string`)
2. The component must handle async state updates
3. **Stale result prevention**: Use a `sessionRef` (incrementing counter) to discard results from outdated computations. Pattern:

```typescript
const sessionRef = useRef(0)

const handleCompute = async (text: string, algo: HashAlgorithm) => {
  if (!text) { setHash(''); return }
  const session = ++sessionRef.current
  const result = await computeHash(text, algo)
  if (session === sessionRef.current) {
    setHash(result)
  }
}
```

This prevents a race condition where the user types "hello" (computation starts), then quickly types "world" — the "hello" result arriving late would overwrite the "world" result.

### Debounce Strategy — Dual Trigger

This tool has **two trigger paths** for hash computation:

1. **Text input changes** → debounced at 300ms via `useDebounceCallback`
2. **Algorithm toggle changes** → immediate computation (no debounce) because the user expects instant feedback when switching algorithms

The debounced callback and the immediate callback both call the same `handleCompute` async function. The `sessionRef` prevents stale results from either path.

### UI Layout (Inline)

```
┌──────────────────────────────────────────────────────────┐
│  Compute hash values from text input using...            │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │ Enter text to hash...                                ││
│  │                                                      ││
│  │                                                      ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  Algorithm: [MD5] [SHA-1] [SHA-256*] [SHA-512]           │
│                                                          │
│  ──────────── dashed divider ─────────────               │
│                                                          │
│  SHA-256 Hash                                [Copy]      │
│  ┌──────────────────────────────────────────────────────┐│
│  │ e3b0c44298fc1c149afbf4c8996fb924...                  ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

* = active toggle (highlighted)

### Algorithm Toggle Pattern

Reuse the `FlagToggle` pattern from `RegexTester.tsx` and `PasswordGenerator.tsx`:

```typescript
const AlgoToggle = ({ active, label, onToggle }: { active: boolean; label: string; onToggle: () => void }) => (
  <button
    aria-label={`Select ${label} algorithm`}
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

Toggle labels: `MD5`, `SHA-1`, `SHA-256`, `SHA-512`
Default selection: `SHA-256` (most common algorithm for general use)

### Processing Flow

```
Component mounts
  → No pre-generated output (unlike UUID/Password)
  → Show "—" placeholder in output region
  → Default algorithm: SHA-256

User types text in TextAreaInput
  → Debounced at 300ms via useDebounceCallback
  → After debounce fires:
    → Increment sessionRef
    → Call computeHash(text, selectedAlgorithm) — async
    → On resolve: check sessionRef matches, then setHash(result)
  → Display hash in output region with CopyButton

User changes algorithm toggle
  → Immediately (no debounce):
    → Increment sessionRef
    → Call computeHash(currentText, newAlgorithm) — async
    → On resolve: check sessionRef matches, then setHash(result)
  → If text is empty → keep showing "—"

User clears text input
  → setHash('') → show "—" placeholder
```

### Hash Computation Utility

```typescript
// src/utils/hash.ts

export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512'

export const HASH_ALGORITHMS: Array<HashAlgorithm> = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512']

export const DEFAULT_HASH_ALGORITHM: HashAlgorithm = 'SHA-256'

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function computeHash(text: string, algorithm: HashAlgorithm): Promise<string> {
  if (algorithm === 'MD5') {
    const { md5 } = await import('js-md5')
    return md5(text)
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest(algorithm, data)
  return bufferToHex(hashBuffer)
}
```

### MD5 Library Decision

**Decision:** Use `js-md5@0.8.3` — dynamically imported (lazy-loaded).

**Rationale:**
- **Bundled TypeScript types** — no separate `@types` package needed
- **Zero dependencies** — clean supply chain
- **3.7 KB gzipped** — reasonable for a lazy-loaded chunk
- **Well-tested** — 428K weekly downloads, established implementation
- **Dynamic import pattern** — follows existing JSZip pattern: `const { default: md5 } = await import('js-md5')`

**Why not alternatives:**
- `tiny-hashes/md5` (463 B) — no TypeScript types, author warns about correctness
- `md5` (passy) — 3 transitive dependencies, unmaintained
- `hash-wasm` — async-only WASM overkill, doesn't tree-shake
- `spark-md5` — no ESM, larger than needed

### SHA Algorithm Notes

The Web Crypto API `crypto.subtle.digest()` accepts these algorithm names directly:
- `'SHA-1'` — 160-bit (40 hex chars)
- `'SHA-256'` — 256-bit (64 hex chars)
- `'SHA-384'` — 384-bit (NOT included per FR24)
- `'SHA-512'` — 512-bit (128 hex chars)

The `HashAlgorithm` type matches the Web Crypto API names exactly for SHA variants, making the implementation straightforward.

### Project Structure Notes

- **Existing directory:** `src/components/feature/generator/` — already has `UuidGenerator.tsx`, `PasswordGenerator.tsx`, and `index.ts`
- **No new category** — `'Generator'` already in `ToolCategory` and `CATEGORY_ORDER`
- **No separate type file needed** — `HashAlgorithm` type lives in `src/utils/hash.ts` alongside the utility (follows uuid.ts and password.ts pattern)
- **Alphabetical insertion** — `hash-generator` goes between `color-converter` and `image-converter` in all registries
- **New dependency** — `js-md5@0.8.3` added to `package.json` (exact version pinned per `.npmrc`)

### Architecture Compliance

- **TOOL_REGISTRY entry required** — tool must be discoverable via sidebar, command palette, dashboard selection dialog, and direct URL. Dashboard is a fixed 6-slot favorites grid — new tools do NOT auto-appear there [Source: architecture.md#Tool Registry]
- **Named export only** — `export const HashGenerator` (never `export default`) [Source: project-context.md#Named exports]
- **Lazy-loaded component** — registry uses `lazy(() => import(...).then(({ HashGenerator }) => ({ default: HashGenerator })))` [Source: architecture.md#Code Splitting]
- **100% client-side** — zero network requests for hash computation [Source: architecture.md#Hard Constraints]
- **useToolError for errors** — initialized for consistency; could trigger if `crypto.subtle.digest` fails (unlikely but possible in very old browsers) [Source: architecture.md#Error Handling]
- **On-change debounce pattern** — 300ms debounce on text input (matches text conversion tools, NOT generator button-click pattern) [Source: epics.md#Story 8.3 AC]
- **aria-pressed toggles** — algorithm toggles use `aria-pressed` for accessibility [Source: RegexTester.tsx FlagToggle pattern]

### Library & Framework Requirements

- **New dependency:** `js-md5@0.8.3` — MD5 hash computation, dynamically imported (lazy-loaded)
- **Existing imports used:** `useState`, `useRef`, `useCallback` from React, `CopyButton`, `TextAreaInput` from `@/components/common`, `TOOL_REGISTRY_MAP` from `@/constants`, `useToolError`, `useDebounceCallback` from `@/hooks`
- **NOT importing:** `FieldForm` type="range" (no sliders needed), `Button` (no generate button — on-change processing), `Dialog` (inline layout)

### File Structure Requirements

**Files to CREATE:**

```
src/utils/hash.ts                                  — computeHash(), HashAlgorithm, HASH_ALGORITHMS, DEFAULT_HASH_ALGORITHM
src/utils/hash.spec.ts                             — Unit tests for hash utilities (~10 tests)
src/components/feature/generator/HashGenerator.tsx  — Hash Generator component
```

**Files to MODIFY:**

```
src/types/constants/tool-registry.ts          — Add 'hash-generator' to ToolRegistryKey
src/constants/tool-registry.ts                — Add hash-generator registry entry
src/components/feature/generator/index.ts     — Add HashGenerator export
src/utils/index.ts                            — Add hash barrel export
vite.config.ts                                — Add hash-generator pre-render route
package.json / pnpm-lock.yaml                 — New dependency: js-md5@0.8.3
```

**Files NOT to modify:**
- Any existing tool components (no changes to UuidGenerator or PasswordGenerator)
- `src/hooks/useToolError.ts` — reused as-is
- `src/hooks/useDebounceCallback.ts` — reused as-is
- `src/utils/validation.ts` — no hash validation needed (any text can be hashed)
- `src/types/constants/tool-registry.ts` `ToolCategory` — Generator already exists
- `src/components/common/sidebar/Sidebar.tsx` `CATEGORY_ORDER` — Generator already listed

### Testing Requirements

**Unit tests (`src/utils/hash.spec.ts`):**

```typescript
import { describe, expect, it } from 'vitest'

import { computeHash, DEFAULT_HASH_ALGORITHM, HASH_ALGORITHMS } from '@/utils/hash'

describe('hash utilities', () => {
  describe('computeHash', () => {
    it('should compute MD5 of empty string', async () => {
      const hash = await computeHash('', 'MD5')
      expect(hash).toBe('d41d8cd98f00b204e9800998ecf8427e')
    })

    it('should compute SHA-1 of empty string', async () => {
      const hash = await computeHash('', 'SHA-1')
      expect(hash).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709')
    })

    it('should compute SHA-256 of empty string', async () => {
      const hash = await computeHash('', 'SHA-256')
      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    })

    it('should compute SHA-512 of empty string', async () => {
      const hash = await computeHash('', 'SHA-512')
      expect(hash).toBe(
        'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
      )
    })

    it('should compute MD5 of "hello"', async () => {
      const hash = await computeHash('hello', 'MD5')
      expect(hash).toBe('5d41402abc4b2a76b9719d911017c592')
    })

    it('should compute SHA-256 of "hello"', async () => {
      const hash = await computeHash('hello', 'SHA-256')
      expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
    })

    it('should handle Unicode input', async () => {
      const hash = await computeHash('Hello, World! 🌍', 'SHA-256')
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should handle large input', async () => {
      const largeText = 'a'.repeat(10000)
      const hash = await computeHash(largeText, 'SHA-256')
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should produce different outputs for different algorithms', async () => {
      const text = 'test'
      const results = await Promise.all(HASH_ALGORITHMS.map((algo) => computeHash(text, algo)))
      const unique = new Set(results)
      expect(unique.size).toBe(HASH_ALGORITHMS.length)
    })

    it('should produce lowercase hex output', async () => {
      const hash = await computeHash('hello', 'SHA-256')
      expect(hash).toBe(hash.toLowerCase())
      expect(hash).toMatch(/^[0-9a-f]+$/)
    })
  })

  describe('constants', () => {
    it('should have SHA-256 as default algorithm', () => {
      expect(DEFAULT_HASH_ALGORITHM).toBe('SHA-256')
    })

    it('should have 4 algorithms', () => {
      expect(HASH_ALGORITHMS).toHaveLength(4)
      expect(HASH_ALGORITHMS).toContain('MD5')
      expect(HASH_ALGORITHMS).toContain('SHA-1')
      expect(HASH_ALGORITHMS).toContain('SHA-256')
      expect(HASH_ALGORITHMS).toContain('SHA-512')
    })
  })
})
```

### TOOL_REGISTRY Entry (Copy-Paste Ready)

```typescript
{
  category: 'Generator',
  component: lazy(() =>
    import('@/components/feature/generator/HashGenerator').then(
      ({ HashGenerator }: { HashGenerator: ComponentType }) => ({
        default: HashGenerator,
      }),
    ),
  ),
  description: 'Compute hash values from text using MD5, SHA-1, SHA-256, and SHA-512',
  emoji: '#️⃣',
  key: 'hash-generator',
  name: 'Hash Generator',
  routePath: '/tools/hash-generator',
  seo: {
    description:
      'Generate MD5, SHA-1, SHA-256, and SHA-512 hash values from text online. Compute checksums instantly in your browser — no server processing.',
    title: 'Hash Generator - CSR Dev Tools',
  },
}
```

### ToolRegistryKey Type Update (Copy-Paste Ready)

```typescript
export type ToolRegistryKey =
  | 'base64-encoder'
  | 'color-converter'
  | 'hash-generator'
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
    'Generate MD5, SHA-1, SHA-256, and SHA-512 hash values from text online. Compute checksums instantly in your browser — no server processing.',
  path: '/tools/hash-generator',
  title: 'Hash Generator - CSR Dev Tools',
  url: '/tools/hash-generator',
},
```

### Generator Barrel Export Update (Copy-Paste Ready)

```typescript
// src/components/feature/generator/index.ts
export { HashGenerator } from './HashGenerator'
export { PasswordGenerator } from './PasswordGenerator'
export { UuidGenerator } from './UuidGenerator'
```

### Utils Barrel Update (Copy-Paste Ready)

Add between `'./file'` and `'./image'`:
```typescript
export * from './hash'
```

### Error Messages

| Scenario | Behavior |
|----------|----------|
| Component mounts | Show "—" placeholder, no error |
| User types text | Debounced hash computation, display result |
| User clears text | Show "—" placeholder, no error |
| User changes algorithm | Immediate recomputation, display result |
| crypto.subtle unavailable | setError("Hash computation failed — your browser may not support this feature") |
| js-md5 import fails | setError("MD5 library failed to load — try refreshing the page") |

### Previous Story Intelligence

From Story 8-2 (Password Generator — most recent in this epic):
- **RangeInput component created** — available but NOT needed for Hash Generator (no sliders)
- **FlagToggle pattern confirmed** — `aria-pressed` toggle buttons work well for selection (reuse for algorithm toggles)
- **Generator barrel exists** — `src/components/feature/generator/index.ts` ready for additional exports
- **493 tests exist** — expect ~503 after adding hash tests (~10 new)
- **Commit prefix:** Use `✨: story 8-3 Hash Generator`

From Story 8-1 (UUID Generator):
- **Inline layout pattern** — tool renders directly in card, no dialog pattern
- **Output box pattern** — monospace text in `rounded-lg border border-gray-800 bg-gray-950 p-3` container

From Story 7-2 (Regex Tester):
- **FlagToggle pattern** — `aria-pressed` toggle buttons for mode selection
- **useDebounceCallback usage** — 300ms debounce for live processing on text input

### Git Intelligence

Recent commits analyzed:
```
132330e 🔧: vscode setting
bc5b207 ✨: story 8-2 Password Generator with RangeInput component
2f9e4e3 ✨: story 8-1 UUID Generator with inline layout
03a11da 🔄: epic 7 retrospective
3a16012 ✨: story 7-2 Regex Tester with live match highlighting
```

**Pattern:** New tool feature uses `✨: story X-Y Tool Name` commit prefix.
**Files changed in story 8-2:** 17 files — utility, tests, component, barrel exports, registry, types, vite config, new RangeInput component.
**This story is simpler than 8-2:** No new reusable components. One new external dependency (`js-md5`). One component, one utility, tests, and registry modifications.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 8.3] — Full AC definitions and story requirements
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 8] — Epic objectives and FR coverage (FR24)
- [Source: _bmad-output/planning-artifacts/prd.md] — FR24: Users can generate hash values (MD5, SHA-1, SHA-256, SHA-512) from text input
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Registry] — Registry entry pattern with all required fields
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — `hash-generator` key, `Generator` category
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Text conversion: on input change with 300ms debounce
- [Source: _bmad-output/planning-artifacts/architecture.md#Hard Constraints] — Zero server-side processing
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Tool component file structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Message Format] — Concise, actionable, with example
- [Source: _bmad-output/project-context.md] — 53 project rules (named exports, type not interface, Array<T>, etc.)
- [Source: src/components/feature/generator/UuidGenerator.tsx] — Inline layout pattern, output box styling
- [Source: src/components/feature/generator/PasswordGenerator.tsx] — FlagToggle pattern for toggle buttons
- [Source: src/components/feature/text/RegexTester.tsx] — FlagToggle + useDebounceCallback pattern reference
- [Source: src/utils/uuid.ts] — Utility function pattern reference (same domain)
- [Source: src/utils/password.ts] — Utility function pattern reference (same domain)
- [Source: src/hooks/useDebounceCallback.ts] — Debounce hook (800ms default, override to 300ms)
- [Source: src/constants/tool-registry.ts] — Current registry with 15 tools, alphabetical ordering
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey union to update (Generator category already exists)
- [Source: src/hooks/useToolError.ts] — Error handling hook (clearError, error, setError)
- [Source: vite.config.ts] — Pre-render routes pattern
- [Source: _bmad-output/implementation-artifacts/8-2-password-generator.md] — Previous story: FlagToggle pattern, RangeInput, generator category fully established
- [Source: _bmad-output/implementation-artifacts/8-1-uuid-generator.md] — Previous story: inline layout, generator category setup, synchronous pattern
- [Source: MDN — SubtleCrypto.digest()] — Web Crypto API for SHA hash computation
- [Source: npmjs.com/package/js-md5] — MD5 library (0.8.3, bundled TS types, zero deps)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Build initially failed with 2 TS errors: (1) `js-md5` exports `md5` as named export, not default — fixed import from `{ default: md5 }` to `{ md5 }`. (2) `TextAreaInput` requires `name` prop from `BaseInputProps` — added `name="hash-input"`.

### Completion Notes List

- Installed `js-md5@0.8.3` — bundled TypeScript types, no `@types` package needed
- Created `src/utils/hash.ts` with `computeHash()` async utility supporting MD5 (via js-md5 dynamic import) and SHA-1/SHA-256/SHA-512 (via Web Crypto API)
- Created `src/utils/hash.spec.ts` with 12 unit tests covering all 4 algorithms, empty strings, known test vectors, Unicode, large input, uniqueness, and lowercase hex output
- Created `src/components/feature/generator/HashGenerator.tsx` with inline layout: TextAreaInput, algorithm toggle buttons (FlagToggle pattern), dashed divider, output region with CopyButton
- Component uses `useDebounceCallback(300ms)` for text input, immediate computation on algorithm change, and `sessionRef` for stale result prevention
- Registered tool in TOOL_REGISTRY (alphabetically between color-converter and image-converter), updated ToolRegistryKey type, added pre-render route in vite.config.ts
- Updated barrel exports in generator/index.ts and utils/index.ts
- All 505 tests pass (493 existing + 12 new), zero regressions
- Build succeeds with HashGenerator as separate 2.59 kB chunk, js-md5 as separate 10.72 kB lazy-loaded chunk
- 16 pre-rendered static HTML files (was 15)

### Senior Developer Review (AI)

**Reviewer:** csrteam | **Date:** 2026-02-15 | **Model:** Claude Opus 4.6

**Findings:**

1. **[HIGH][FIXED] Race condition: stale algorithm in debounced callback** (`HashGenerator.tsx:44-46`) — Debounced callback closed over `algorithm` from render scope. When algorithm changed while debounce was pending, stale algorithm produced wrong hash output. `sessionRef` didn't prevent it because stale callback fired AFTER the immediate computation, getting a higher session number. **Fix:** Added `algorithmRef` to always read latest algorithm; added `textRef` guard in `handleCompute` to discard stale results.

2. **[HIGH][FIXED] Debounced callback fires after input cleared** (`HashGenerator.tsx:48-56`) — When user cleared input while debounce was pending, old callback fired with previous text, displaying a hash for empty input (violating AC4). **Fix:** Added `textRef.current === input` check in `handleCompute` to discard results when text has changed since computation was scheduled.

3. **[MEDIUM][FIXED] Error never cleared after successful computation** (`HashGenerator.tsx:17,28`) — `clearError` was not destructured from `useToolError()` and never called. Errors persisted indefinitely after subsequent successful computations. Inconsistent with RegexTester pattern. **Fix:** Destructured `clearError`, call it on success in `handleCompute` and when input is cleared in `handleTextChange`.

4. **[LOW][FIXED] Story Dev Notes contained incorrect import syntax** (`8-3-hash-generator.md:266`) — Code example showed `{ default: md5 }` but implementation correctly uses `{ md5 }`. Debug Log noted the fix but reference examples were not updated. **Fix:** Updated code example.

**Verification:** 505 tests pass, 0 lint errors, build succeeds (2.72 kB chunk), 16 pre-rendered files.

### Change Log

- 2026-02-15: Code review fixes — added `algorithmRef`/`textRef` refs to prevent debounce race conditions (stale algorithm and stale text), added `clearError` on success paths, fixed Dev Notes import syntax
- 2026-02-15: Implemented Hash Generator tool (Story 8-3) — full hash computation utility with MD5/SHA-1/SHA-256/SHA-512, HashGenerator component with debounced text input and algorithm toggles, 12 unit tests, tool registry integration

### File List

**Files Created:**
- src/utils/hash.ts
- src/utils/hash.spec.ts
- src/components/feature/generator/HashGenerator.tsx

**Files Modified:**
- src/types/constants/tool-registry.ts (added 'hash-generator' to ToolRegistryKey)
- src/constants/tool-registry.ts (added hash-generator registry entry)
- src/components/feature/generator/index.ts (added HashGenerator export)
- src/utils/index.ts (added hash barrel export)
- vite.config.ts (added hash-generator pre-render route)
- package.json (added js-md5@0.8.3 dependency)
- pnpm-lock.yaml (updated lockfile)
- _bmad-output/implementation-artifacts/sprint-status.yaml (status: in-progress → review)
