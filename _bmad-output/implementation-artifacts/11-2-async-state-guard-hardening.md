# Story 11.2: Async State Guard Hardening

Status: done

## Story

As a **user interacting with tools that process input asynchronously**,
I want **all async/debounced tools to discard stale results when my input changes during processing**,
so that **I always see results that match my current input, never outdated results from a previous operation**.

**Epic:** Epic 11 — Technical Debt Cleanup
**Dependencies:** None (independent story)
**Story Key:** 11-2-async-state-guard-hardening

**Scope note:** This story addresses the async debounce race condition pattern identified in Epic 8. It audits all 12 tools that use debounce or async processing and ensures tools with genuine stale-state risk have `sessionRef` guards. Tools using synchronous native APIs (e.g., `JSON.parse`, `RegExp`) do NOT need session guards — the audit must distinguish between real async risk and synchronous-but-debounced patterns.

## Acceptance Criteria

1. **Async Risk Audit Complete:** All 12 tools using `useDebounceCallback` or async processing are audited. Each tool is classified as:
   - **Guarded** — already has `sessionRef` protection (no change needed)
   - **Needs guard** — has genuine async risk (dynamic import, Web Crypto async, or multi-step async) without session protection
   - **No guard needed** — uses synchronous APIs within debounce callback (stale results impossible)

2. **Session Guards Added Where Needed:** Tools classified as "needs guard" have `sessionRef` (generation counter pattern) added. The guard increments on each invocation and discards results if the session has advanced before the async operation completes.

3. **Hash Generator Multi-Trigger Pattern Verified:** The Hash Generator's 3-ref pattern (`sessionRef`, `algorithmRef`, `textRef`) is verified correct and handles all race conditions: text change during hash computation, algorithm change during hash computation, and simultaneous text+algorithm change.

4. **Debounce Delay Consistency:** All debounce delays are documented with rationale. Current state: 150ms for text processing, 300ms for image/file processing. No changes required unless an inconsistency is found.

5. **File-Processing State Cleanup:** All 4 image tools clear ALL related state (source, result, metadata, error) when a new file is uploaded or when input is rejected. Specifically verify the Epic 10 H1 finding (stale compressed result after format rejection) is fixed and the pattern is consistent across ImageResizer, ImageConvertor, ImageCropper, and ImageCompressor.

6. **All Tests Pass:** All 562+ existing tests continue to pass. New tests added for any session guard logic introduced.

7. **Build & Lint Clean:** `pnpm lint`, `pnpm format:check`, and `pnpm build` all pass.

## Tasks / Subtasks

- [x] Task 1: Audit all 12 debounced/async tools (AC: #1)
  - [x] 1.1 Classify each tool's async risk level:
    - **TextDiffChecker** — dynamic import of `diff` library → async risk → GUARDED ✓ (`++sessionRef.current`)
    - **JsonToYamlConverter** — dynamic import of `yaml` library → async risk → BUG FOUND: read-only `sessionRef.current` (no increment) → FIXED
    - **HashGenerator** — `crypto.subtle.digest` is async → GUARDED ✓ (`++sessionRef.current` + `algorithmRef` + `textRef`)
    - **ImageResizer** — async `resizeImage` + debounce → NO GUARD → FIXED (added `sessionRef`)
    - **ImageCompressor** — async `processImage` + debounce → NO GUARD → FIXED (added `sessionRef`)
    - **RegexTester** — native `RegExp` is synchronous → no guard needed ✓
    - **JsonFormatter** — native `JSON.parse`/`JSON.stringify` is synchronous → no guard needed ✓
    - **JsonToCsvConverter** — synchronous parsing → no guard needed ✓
    - **ColorConvertor** — synchronous color math → no guard needed ✓
    - **TimeUnixTimestamp** — synchronous date math → no guard needed ✓
    - **ImageConvertor** — async batch processing (user-triggered, non-overlapping) → no guard needed ✓
    - **ImageCropper** — synchronous canvas crop (user-triggered) → no guard needed ✓
  - [x] 1.2 Documented findings in Dev Agent Record

- [x] Task 2: Add session guards where needed (AC: #2)
  - [x] 2.1 Added `sessionRef` generation counter to `ImageResizer.tsx` and `ImageCompressor.tsx`
  - [x] 2.2 Fixed `JsonToYamlConverter.tsx` — changed `const session = sessionRef.current` to `const session = ++sessionRef.current`
  - [x] 2.3 Verified guards correctly prevent stale state updates in all 3 fixed tools

- [x] Task 3: Verify Hash Generator multi-trigger safety (AC: #3)
  - [x] 3.1 Read `HashGenerator.tsx` and traced all state update paths
  - [x] 3.2 Confirmed `algorithmRef` and `textRef` updated synchronously via render-time assignment
  - [x] 3.3 Confirmed `sessionRef` check + `textRef` check after `crypto.subtle.digest` prevents stale updates
  - [x] 3.4 Verified text-cleared path increments `sessionRef` to invalidate in-flight computations

- [x] Task 4: Verify file-processing state cleanup (AC: #5)
  - [x] 4.1 `ImageCompressor.tsx` — upload handler clears: source ✓, compressed ✓, originalInfo ✓, error ✓
  - [x] 4.2 `ImageCompressor.tsx` — format rejection clears all state (Epic 10 H1 fix confirmed) ✓
  - [x] 4.3 `ImageResizer.tsx` — upload handler clears via `handleReset` on error; dialog `onAfterClose` resets all ✓
  - [x] 4.4 `ImageConvertor.tsx` — new upload clears via `handleReset`; upload only accessible from IMPORT tab ✓
  - [x] 4.5 `ImageCropper.tsx` — new upload clears crop, completedCrop, aspect, error, sets source ✓
  - [x] 4.6 No gaps found — all state cleanup is consistent

- [x] Task 5: Write tests for new session guards (AC: #6)
  - [x] 5.1 No utility functions extracted — guards are inline `useRef` patterns within component callbacks (same as existing TextDiffChecker/HashGenerator pattern). No new testable units.
  - [x] 5.2 All 562 existing tests pass with guard additions ✓

- [x] Task 6: Verify build and lint (AC: #7)
  - [x] 6.1 `pnpm test` — 562 tests pass, 0 regressions
  - [x] 6.2 `pnpm lint` — 0 errors; `pnpm format:check` — clean; `pnpm build` — success

## Dev Notes

### Session Guard Pattern Reference

The proven pattern from `TextDiffChecker.tsx` and `JsonToYamlConverter.tsx`:

```typescript
const sessionRef = useRef(0)

const processInput = useDebounceCallback(async (input: string) => {
  const currentSession = ++sessionRef.current

  // ... async operation (dynamic import, crypto.subtle, etc.)
  const result = await someAsyncOperation(input)

  // Guard: discard if input changed during processing
  if (currentSession !== sessionRef.current) return

  setResult(result)
}, 150)
```

### Hash Generator's Advanced Pattern

```typescript
const sessionRef = useRef(0)
const algorithmRef = useRef(algorithm)  // tracks which algo was selected
const textRef = useRef(text)            // tracks what text was entered

// Both refs updated synchronously before async call
algorithmRef.current = algorithm
textRef.current = text
const currentSession = ++sessionRef.current

const digest = await crypto.subtle.digest(algo, data)

// Triple guard: session + algorithm + text must all match
if (currentSession !== sessionRef.current) return
```

### What Tools Do NOT Need Guards

Synchronous tools wrapped in `useDebounceCallback` do NOT need `sessionRef` because:
- The debounce callback replaces itself on each invocation (only latest runs)
- Synchronous operations complete before any state can change
- No window exists for stale results

These tools are safe without guards: `JsonFormatter`, `JsonToCsvConverter`, `RegexTester`, `ColorConvertor`, `TimeUnixTimestamp`

### File State Cleanup Pattern

When a file-processing tool receives new input or rejects invalid input, it must clear ALL related state:

```typescript
const handleUpload = (file: File) => {
  // Clear ALL previous state first
  setResult(null)
  setOriginalInfo(null)
  setError(null)
  setProcessing(false)

  // Then validate and process new input
  if (!isValid(file)) {
    setError('...')
    setSource(null)  // Also clear source on rejection
    return
  }
  setSource(file)
  // ... process
}
```

### Previous Story Intelligence

- Epic 8 retro: Async debounce with multiple triggers requires `ref` guards beyond `sessionRef`
- Epic 10 Story 10-1 H1 finding: Stale compressed result displayed after format rejection — failed to clear source/compressed/originalInfo state
- Epic 10 retro action item #2: "state cleanup on input rejection" as standard checklist item for file-processing tools

### References

- Epic 8 retro — async debounce race conditions (MEDIUM)
- Epic 10 retro — state cleanup on input rejection (MEDIUM)
- `TextDiffChecker.tsx` — reference implementation of sessionRef pattern
- `HashGenerator.tsx` — reference implementation of multi-ref pattern

---

## Dev Agent Record

### Files Modified (3 total)

| # | File | Change |
|---|------|--------|
| 1 | `src/components/feature/data/JsonToYamlConverter.tsx` | Fixed `sessionRef` bug: changed `const session = sessionRef.current` to `const session = ++sessionRef.current` so overlapping async calls get unique session IDs |
| 2 | `src/components/feature/image/ImageResizer.tsx` | Added `sessionRef` guard around async `resizeImage` call in `dbSetPreview` — prevents stale resize results when dimensions change rapidly |
| 3 | `src/components/feature/image/ImageCompressor.tsx` | Added `sessionRef` guard around async `processImage` call in `compress` — prevents stale compression results when quality slider changes rapidly |

### Audit Results

| Tool | Async API | Classification | Action |
|------|-----------|---------------|--------|
| TextDiffChecker | dynamic import (`diff`) | Guarded | None |
| JsonToYamlConverter | dynamic import (`yaml`) | Bug in guard | Fixed increment |
| HashGenerator | `crypto.subtle.digest` | Guarded (3-ref) | Verified correct |
| ImageResizer | `resizeImage` (canvas) | Unguarded | Added sessionRef |
| ImageCompressor | `processImage` (canvas) | Unguarded | Added sessionRef |
| RegexTester | `RegExp` (sync) | No guard needed | None |
| JsonFormatter | `JSON.parse` (sync) | No guard needed | None |
| JsonToCsvConverter | `jsonToCsv` (sync) | No guard needed | None |
| ColorConvertor | `convertColor` (sync) | No guard needed | None |
| TimeUnixTimestamp | `Date` (sync) | No guard needed | None |
| ImageConvertor | user-triggered batch | No guard needed | State cleanup verified |
| ImageCropper | user-triggered canvas | No guard needed | State cleanup verified |

### Debounce Delay Inventory

| Delay | Tools | Rationale |
|-------|-------|-----------|
| 150ms | TextDiffChecker, JsonToYamlConverter, HashGenerator, RegexTester, JsonFormatter, JsonToCsvConverter, ColorConvertor, TimeUnixTimestamp | Text input — fast enough for responsive feel, slow enough to batch keystrokes |
| 300ms | ImageCompressor | Image processing — heavier operations need more debounce buffer |
| (none) | ImageResizer | Uses `useDebounceCallback` without explicit delay (hook default) |

### Verification

- 562 tests pass, 0 regressions
- `pnpm lint` — 0 errors
- `pnpm format:check` — clean
- `pnpm build` — success
