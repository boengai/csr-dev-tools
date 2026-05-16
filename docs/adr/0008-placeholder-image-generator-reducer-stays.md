# ADR 0008 — PlaceholderImageGenerator's reducer stays

- **Status:** Accepted
- **Date:** 2026-05-16

## Context

`PlaceholderImageGenerator` (`src/components/feature/image/PlaceholderImageGenerator.tsx`,
~263 lines) is the last remaining Tool that manages state via `useReducer`
after the 2026-05-16 architecture-review arc migrated three siblings
(`DataUriGenerator`, `QrCodeGenerator`, `ImageCompressor`) off the same
hook. A scan considered whether this Tool should follow.

On closer reading the framing did not fit. The three Tools that
migrated each carried at least one of:

1. **Pipeline already present with per-handler bag-rebuild
   anti-pattern** (`QrCodeGenerator` — five handlers each calling
   `setInputImmediate({ ...other-fields, X: val })`, the
   forget-a-field bug surface [[Tool field bag]] was built to absorb).
2. **Pipeline state duplicated in the reducer**
   (`ImageCompressor` — `compressed`, `processing`, `showProgress`
   were all shadows of `result` and `isPending` that
   [[Tool computation pipeline]] already owned; plus
   `dispatch()` calls fired from *inside* the compute closure,
   inverting the React-side / pipeline-side responsibility).
3. **A reducer multiplexing independent flows that each fit an
   existing seam** (`DataUriGenerator` — encode + decode dialogs
   sharing one reducer; encode is single-shot async fit for plain
   `await`, decode is debounced text→result fit for
   `useToolComputation`).

`PlaceholderImageGenerator` has **none of these**:

- **No pipeline today.** The preview compute is a sync `useMemo`
  deriving a `data:image/svg+xml,…` URI from five rendering-relevant
  fields. SVG/canvas generation is fast and synchronous; there is
  no debounce concern, no stale async to drop, no unmount-safety
  to inherit.
- **No duplication.** Every reducer field is React state the Tool
  itself owns. Nothing is a shadow of something a pipeline manages.
- **The reducer carries legitimate structural ops, not pure
  multiplexing.** Out of 9 cases:
  - 6 are pure setters (SET_WIDTH, SET_HEIGHT, SET_TEXT, plus the
    two picker-driven setters and SET_BG_PICKER /
    SET_TEXT_COLOR_PICKER which write *two* fields at once because
    the picker gives a known-valid hex).
  - 1 is a multi-field setter (SET_PRESET — width + height in one
    op).
  - **2 carry conditional parse logic** (SET_BG_HEX,
    SET_TEXT_COLOR_HEX): always write the raw typed text into
    `*HexInput`, but only write the canonical hex into `*Color` if
    the input matches `/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/`.

The two color pairs (`bgColor`/`bgHexInput`,
`textColor`/`textHexInput`) are a small 2-mirror version of the
[[N-mirror broadcast]] pattern named in CONTEXT.md — but at one
sync-compute adapter, the pattern's load-bearing benefits
(debounce, stale-safety, unmount-safety, partial-merge invariant)
do not apply.

A migration would either:

1. **Adopt `useToolFields`.** Adds a pipeline tick of microtask
   delay on every preview update for compute that is currently
   synchronous via `useMemo`. The pipeline's `error` and
   `isPending` go unused (compute never throws, always resolves
   immediately). The hex-mirror logic moves into per-handler
   `parseHexIfValid()` helpers (only marginally cleaner than the
   reducer cases).
2. **Drop the reducer for plain `useState` × 7.** Removes ~10
   lines net. Loses the reducer-as-state-machine framing for
   SET_PRESET / SET_BG_PICKER / SET_BG_HEX, which then become 2-3
   sequential `setState` calls per handler (React 18 batches them,
   so functionally identical — but the "single conceptual op"
   framing is lost).

Both are **codebase-cosmetic, not depth-positive**. The reducer is
not broken, not duplicating pipeline state, and not carrying a
named anti-pattern. The deletion test concentrates nothing —
removing the reducer would scatter ~20 lines of state-handling
chrome with no consolidation gain.

## Decision

`PlaceholderImageGenerator`'s `useReducer` **stays as-is**. No
migration to `useToolFields` and no flattening to plain `useState`.

The `ImageCompressorState` / `ImageCompressorAction` precedent
(deleted in commit `9755dee`) does **not** transfer here: that
Tool's reducer duplicated pipeline-owned state, which this one
does not.

## Consequences

**Positive**

- Future architecture passes do not re-suggest this migration; the
  ADR records the four distinguishing properties above (no
  pipeline, no duplication, sync compute, structural ops).
- The reducer's bundling semantics (preset, picker, hex-with-parse)
  stay co-located in one place where readers can find them.
- The "we migrated 3 of 4 useReducer-using Tools in one session"
  pattern doesn't become a forcing function that drags the
  remaining one along on consistency grounds alone.

**Negative**

- Reviewers scanning for "Tools still using the old reducer
  pattern" will land here and need this ADR to understand it's
  intentional rather than missed migration debt.
- `ImageCompressorState` / `ImageCompressorAction` are gone but
  `PlaceholderImageGenerator`'s equivalent reducer types remain.
  The asymmetry is documented above, not silent.

## Revisit when

- A **second Tool** emerges with the same shape — sync compute,
  multiple representations of a value that constraint-validate
  on write (hex-typed → canonical-hex), no pipeline present.
  At two adopters the constraint-and-broadcast shape may earn a
  named seam.
- `PlaceholderImageGenerator`'s **compute becomes async** (e.g.,
  switching from sync SVG generation to a WASM-backed renderer
  that returns a Promise). At that point the pipeline's
  stale-safety and unmount-safety would matter, and
  `useToolFields` becomes the right home.
- A field is added that **must debounce** (e.g., a slow expensive
  per-keystroke render layer). At that point part of the state
  lives in a pipeline and the reducer's role narrows or
  evaporates.
- The reducer **grows a third parse-and-conditional-write case**
  beyond the current two (BG hex, text hex). The shared
  `parseHexIfValid → conditional commit` shape may then warrant
  a small helper that the reducer composes — or, equivalently,
  the Tool migrates onto whatever shell that helper lives behind.
