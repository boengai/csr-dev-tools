# ADR 0009 — `<ImageToolShell>`'s `recompute` stays inline

- **Status:** Accepted
- **Date:** 2026-05-17

## Context

The 2026-05-16/17 architecture pass promoted `recompute()` from a derived
concept owned by `<ImageToolShell>` and `<BidirectionalConverter>` to a
first-class primitive on the [[Tool computation pipeline]]
(`useToolComputation`, `useToolFields`, and both persisted variants).

The original candidate framed both shells as exposing the same primitive:

| Shell | Inline `recompute` |
|---|---|
| `<BidirectionalConverter>` | `() => setFieldsImmediate({})` |
| `<ImageToolShell>` | `() => setInputImmediate({ file: source, controls })` |

On closer reading during execution (mid-implementation, Task 5 of the
plan at `docs/superpowers/plans/2026-05-16-recompute-pipeline-primitive.md`),
the two shells turned out to expose **different** primitives:

- `<BidirectionalConverter>` uses [[Tool field bag]]. The bag (`source`,
  `mode`, …) is **pipeline-owned** — it lives inside `useToolFields`'s
  `inputsRef`. `setFieldsImmediate({})` merges an empty partial into the
  current bag, which is identical to the pipeline's new
  `recompute()` (`setInputImmediate(inputsRef.current)`). Pipeline-promotable.

- `<ImageToolShell>` uses [[Tool computation pipeline]] (single-Input
  variant) with `{ file, controls }` as its Input. `file` is React-side
  `useState` on the shell; `controls` is a prop the consumer Tool passes
  in. The shell **bridges** these into the pipeline by calling
  `setInputImmediate({ file: source, controls })` at two sites: inside
  `handleUpload` (once per upload) and inside its inline `recompute`.
  There is **no `useEffect` watching `controls`**; the pipeline's
  `inputRef` only sees what was last passed in.

  After Task 5's would-be migration, `recompute()` from the pipeline
  would re-fire with upload-time `controls` — typically the defaults the
  consumer Tool seeded at mount. For `ImageCropper`, that means
  `naturalCrop: null`, which short-circuits `process` at
  `ImageCropper.tsx:62` (`if (!ctrls.naturalCrop || !imgRef.current) return null`).
  The crop result would never update after upload.

The shell tests don't catch this — they exercise a static `controls={{ k: 1 }}`
that never changes after upload — so both implementations pass. The bug
would only surface in real consumers (`ImageCropper`, `ImageResizer`,
`BackgroundRemover`) and would manifest as "the result never updates when
the user adjusts a control."

Two alternatives were considered:

1. **Bridge `controls` into the pipeline eagerly** —
   `useEffect(() => setInputImmediate({ file: source, controls }), [controls])`
   would keep the pipeline's `inputRef` current. Pipeline-owned
   `recompute()` would then work. But this changes shell behavior:
   compute would fire on every controls change, not only when the
   consumer Tool calls `recompute()`. `ImageCropper`'s drag interaction
   updates `controls.naturalCrop` on every drag-complete; the existing
   inline-`recompute` design intentionally gates compute on the
   consumer's explicit `recompute()` call. Moving to eager bridging is
   a real behavior change with consumer impact (latency, flicker,
   wasted work) that isn't motivated by the candidate's depth argument.

2. **Revert `recompute` from `UseToolComputationResult`** — narrow the
   primitive to `useToolFields` only. Loses the
   `useToolComputationPersisted` win (one of its three current consumers,
   `MermaidRenderer`, could productively use `recompute()` in the
   future), and inconsistently exposes the primitive on the multi-field
   side but not the single-Input side. The pipeline-level `recompute()`
   is still useful for any single-Input Tool whose entire input is
   pipeline-owned (no external React state); narrowing it just because
   ImageToolShell is a different shape is the wrong granularity.

## Decision

`<ImageToolShell>`'s inline `const recompute = () => setInputImmediate({ file: source, controls })`
**stays as-is**. The shell does not migrate to the pipeline's
`recompute()` primitive.

The pipeline's `recompute()` remains exposed on `useToolComputation`,
`useToolFields`, and both persisted variants for callers whose **entire
input is pipeline-owned**. [[Tool field bag]] consumers naturally
qualify because the bag lives inside the hook. Single-Input
`useToolComputation` consumers qualify when their compute closure reads
from the input parameter only — not from React-side props or state
accessed via closure capture.

The CONTEXT.md "Tool computation pipeline" section documents this
distinction explicitly so future readers know when to reach for
`recompute()` and when to keep an inline wrapper.

## Consequences

**Positive**

- Future architecture passes won't re-suggest the `<ImageToolShell>`
  migration; this ADR records why the two shells expose different
  primitives despite sharing a name.
- The pipeline-level `recompute()` ships with a precise contract
  ("re-fires with the last input the pipeline saw"), not a fuzzy one
  that breaks silently for React-state-injecting wrappers.
- The depth gain from the broader candidate is preserved at 6 sites
  (`<BidirectionalConverter>` + 5 tool call sites), even with
  `<ImageToolShell>` left alone.

**Negative**

- The `<ImageToolShell>` and `<BidirectionalConverter>` files now look
  inconsistent at a glance: one defines an inline `recompute`, the other
  destructures it from the pipeline. A reader sweeping the
  `src/components/common/` directory may wonder why. The CONTEXT.md
  paragraph + this ADR are the answer.
- `<ImageToolShell>`'s inline `recompute` continues to capture
  React-side `source` and `controls` via closure — meaning every render
  reallocates the function. Negligible cost in practice (the shell
  doesn't render often inside hot paths), but noted for completeness.

## Revisit when

- `<ImageToolShell>` grows a `useEffect` that already bridges all
  React-side input changes into the pipeline (for some unrelated reason
  — e.g., to support a debounced auto-recompute on controls change). At
  that point the inline `recompute` becomes redundant with the pipeline
  primitive, and migration is mechanical.
- A second shell emerges with the same "bridge React-side state into
  pipeline at each call" shape. At two adapters the project's standing
  guideline ("two adapters = real seam") would suggest a named
  abstraction for the bridging pattern itself — not a forced migration
  of the inline `recompute`.
- The pipeline's `recompute()` semantics change (e.g., it grows the
  ability to take an optional input override: `recompute(nextInput?)`).
  At that point `<ImageToolShell>` can call
  `recompute({ file: source, controls })` and the inline wrapper goes
  away.
