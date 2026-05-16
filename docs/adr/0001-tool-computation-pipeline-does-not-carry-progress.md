# ADR 0001 — Tool computation pipeline does not carry progress

- **Status:** Accepted
- **Date:** 2026-05-15

## Context

The [[Tool computation pipeline]] (`useToolComputation`, `useToolFields`)
owns four invariants for any async Tool input→result: debounced, stale-safe,
empty-bypass, unmount-safe. It does not surface a `progress` channel
alongside `result` / `error` / `isPending`.

A 2026-05-15 architecture pass considered adding `progress: { current, total }`
to the pipeline. The motivating callers at that time were:

1. `SplashScreenGenerator` — per-asset `{ current, total }` during batch
   generation.
2. `ImageConvertor` — numeric `processing` counter during multi-file
   conversion.
3. `BcryptHasher` — wall-clock `elapsedDisplay` during hash/verify.

After the same pass introduced the [[Batch asset pipeline]]
(`useBatchAssetPipeline`), SplashScreenGenerator's progress moved into that
hook. The remaining picture:

- **`{ current, total }` progress** has one non-batch caller
  (`ImageConvertor`). One adapter is a hypothetical seam, not a real one —
  the project's guideline is "two adapters = real seam." ImageConvertor's
  real friction is also its multi-step workflow state machine, not its
  progress counter — adding progress to the pipeline would not shrink that
  file meaningfully.
- **Elapsed-time-during-compute** is a different concept (no `total`, no
  notion of items completed) used only by `BcryptHasher`, twice within the
  same file. That is intra-Tool duplication, not a cross-Tool seam.

## Decision

`useToolComputation` and `useToolFields` will **not** carry a `progress`
field. Progress for Tools that need it lives at the call site — or inside
a higher-level seam that already owns the relevant compute lifecycle
(today: the [[Batch asset pipeline]] for single-source-File → batch-of-Blob
Tools).

A `progress` channel may be added to the pipeline when **two or more
non-batch Tools** need `{ current, total }` (or a similar shape) at the same
time. Until then, the pipeline stays narrow.

## Consequences

**Positive**

- The pipeline's interface stays small. Adding a field that one caller uses
  and the rest have to ignore is a depth loss — it makes every consumer
  reason about a channel that does nothing for them.
- Future architecture passes will not re-suggest this same refactor; this
  ADR records why one caller (currently `ImageConvertor`) is not enough.
- The "elapsed time" concept is preserved as separate from "progress."
  They are not the same shape and should not share a channel.

**Negative**

- `ImageConvertor` continues to hand-roll its progress counter inside its
  reducer. Acceptable: its real complexity sits in the workflow tabs and
  multi-source handling, neither of which a pipeline-progress field would
  address.
- A future Tool author may briefly look for `progress` on
  `useToolComputation` and have to wire their own. The pipeline's docstring
  is the place to point such authors at [[Batch asset pipeline]] (if their
  Tool fits) or at the local pattern in `ImageConvertor`/`BcryptHasher`.

## Revisit when

- A second non-batch Tool needs `{ current, total }`-shaped progress.
- A second Tool needs an elapsed-timer display during async work (today
  only `BcryptHasher`, at two sites in one file — intra-Tool duplication).
  In that case the seam is a separate `useElapsedTimer`-style hook, not a
  field on the pipeline.
