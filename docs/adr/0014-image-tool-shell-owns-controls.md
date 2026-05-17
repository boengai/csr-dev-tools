# ADR 0014 — `<ImageToolShell>` owns its controls bag

- **Status:** Accepted
- **Date:** 2026-05-17

## Context

`<ImageToolShell>` today receives `controls` as a prop and bridges it into
its internal [[Tool computation pipeline]] at two sites: inside
`handleUpload` (`setInputImmediate({ file, controls })`) and inside its
inline `recompute` (`setInputImmediate({ file: source, controls })`).
Compute fires only when the consumer Tool calls the `recompute` it
receives via the `renderControls` ctx — never on `controls` change alone.

ADR-0009 froze that design when promoting `recompute()` to a pipeline
primitive: bridging `controls` eagerly with a `useEffect` would have
broken `ImageCropper`'s drag interaction, and the inline `recompute`
shape paid for itself in the shell.

Since then, the consumer surface has matured into three Tools:
`ImageCropper`, `ImageResizer`, `BackgroundRemover`. Reading them
together surfaces a Tool-side cost ADR-0009 did not address: every
control change handler is `setX(...); recompute()`. ImageResizer
defines `setAndRecompute` and `setNumber` helpers to manage it;
ImageCropper inlines the pair across four sites; BackgroundRemover
adds gating logic (color change only recomputes when bgOption is
`'custom'`). The bridging asymmetry — *controls is push-down (Tool →
shell), recompute is pull-up (shell → render-prop ctx)* — forces every
consumer to thread `recompute` into every handler.

The repeated pattern is small (~7–30 lines per consumer) but the seam
is wrong: a contributor who forgets `recompute()` after a `setX(...)`
ships a Tool whose result silently never updates. The shell's tests
don't catch this — they exercise static `controls={{ k: 1 }}` — so the
gap shows up only at the consumer level.

Two alternatives were considered:

1. **Narrow hook (`useImageToolControls`)** — owns just the bag plus a
   `setControls(partial)` that internally calls `recompute()`. Cannot
   live at the Tool's top level (rules of hooks) and cannot live
   inside the render callback (also rules of hooks). The only
   implementations require a callback-ref bridge from the shell into
   the hook, which is uglier than the pattern it would replace. Papers
   over the asymmetry without removing it.

2. **Do nothing, record the constraint** — at three consumers and
   modest per-consumer LOC, "leave inline; revisit at the fourth
   consumer" is a defensible call. Rejected because the boilerplate is
   not a counting problem — it's a *correctness* problem: the missing
   `recompute()` failure mode is invisible until a user interacts.

## Decision

`<ImageToolShell>` absorbs its controls bag. The shell's interior
wraps a pipeline shape that owns `{ file, controls }` as a single
input — equivalent to [[Tool field bag]] semantics, scoped to the
file-in/blob-out shape.

API change:

- The `controls` prop is replaced by an `initialControls` prop. The
  Tool declares the bag's default shape; the shell owns the live
  value.
- The `renderControls` and `renderPreview` ctx gain `controls` and
  `setControls(partial: Partial<TControls>)`. `setControls` IS the
  recompute trigger — every call merges the partial into the live
  bag and routes through the pipeline. The four [[Tool computation
  pipeline]] invariants (debounced, stale-safe, empty-bypass,
  unmount-safe) plus the same-tick partial-merge invariant from
  [[Tool field bag]] carry over unchanged.
- The inline `recompute` exposure on ctx remains for the residual
  case: a Tool whose result depends on non-controls React state
  (`ImageCropper`'s `imgRef`, `BackgroundRemover`'s
  `strippedCacheRef`) and needs to fire compute without changing the
  bag (e.g. after `imgRef.current` is populated on `<img onLoad>`).
  Calling `recompute()` with no bag change still re-fires compute
  with the current bag, matching pipeline `recompute()` semantics.

Implementation note: the shell's `process(file, controls)` signature
is unchanged. The shell threads the live bag into the pipeline
internally — `process` sees the same `(file, controls)` it sees today.

CONTEXT.md's `[[Image tool shell]]` section is amended at the same
time to: (a) document that controls is shell-owned, (b) document the
`setControls(partial)` writer, (c) cross-reference [[Tool field bag]]
as the conceptual sibling.

## Consequences

**Positive**

- Eliminates the `setX(...); recompute()` boilerplate across all three
  current consumers and any future ones. A contributor cannot forget
  to recompute: `setControls(...)` does it automatically.
- Brings `<ImageToolShell>`'s shape into alignment with [[Tool field
  bag]]. One mental model for "Tool with multi-field bag" instead of
  two.
- Test surface improves: shell-level tests can prove "controls change
  → debounced compute fires" once, instead of per-Tool tests
  exercising the bridging.
- Removes the silent-bug failure mode (forgot to recompute) at the
  consumer level — its blast radius was bounded only by reviewer
  attention.

**Negative**

- Breaking change to the shell's published interface. All three
  consumers migrate in the same change.
- The "shell owns more" narrative is partial — non-controls UI state
  stays in the Tool: `ImageCropper`'s `crop` (live drag),
  `imgRef.current`, and `naturalCrop` derivation logic;
  `BackgroundRemover`'s `strippedCacheRef`; per-Tool `onLoad`
  derivations. The boilerplate savings per consumer are modest
  (~10–15 lines); the architectural win is the eliminated correctness
  hazard, not LOC.
- Constraint logic (ImageResizer's width/height ↔ ratio lock) does
  not move. It lives wherever `setControls` is called and remains
  per-Tool.
- Partially supersedes ADR-0009. The inline `recompute` in the
  shell's interior is replaced by pipeline-owned recompute: when
  `setControls(partial)` fires, the pipeline's `recompute` runs with
  the merged bag. The ctx-exposed `recompute` for non-controls
  changes is preserved (see Decision above) and still routes through
  the same pipeline primitive. ADR-0009's "revisit when" explicitly
  lists this scenario as a valid trigger.

## Revisit when

- A consumer needs `controls` changes to NOT trigger recompute (e.g.,
  staging multiple field changes behind a "Generate" button). The
  shell-owned design auto-fires on every `setControls`; supporting a
  staging mode would require an opt-out (`setControls(partial,
  { immediate: false })`) or a revert to consumer-driven recompute.
- The shell needs to support multi-stage compute (e.g., expensive
  one-time setup that some controls invalidate and others don't).
  Today's pipeline is single-stage debounced; multi-stage would
  require a richer compute shape and might justify returning to
  externally-driven recompute.
- A second shell with the same "file-in, controls-bag, blob-out"
  shape appears. At that point the file + controls + blob trio is
  itself a candidate for promotion to a shared hook beneath both
  shells — but that is a different conversation than this ADR.
