# ADR 0019 — N-mirror broadcast stays as a pattern

- **Status:** Accepted
- **Date:** 2026-05-17

## Context

[[N-mirror broadcast]] is the name for Tools that display multiple
representations of one underlying value and rebroadcast on edit of any
representation. Today's adopters:

| Adopter | Input shape | uiMemory |
|---|---|---|
| `ColorConvertor` | `{ format, value }` — touched-only | — |
| `UnitPxToRem` | `{ source, px, rem, base, lastEdited }` — full bag | `lastEdited` |
| `AspectRatioCalculator` | `{ source, width, height, ratio, locked, lastEdited }` — full bag | `locked`, `lastEdited` |

Each follows the same outer shape — discriminated input feeds
[[Tool computation pipeline]], the pipeline's output is mirrored back
into a `useState` field bag via a small adoption `useEffect`. The
repeated glue is ~10–20 lines per adopter (`useState<O>` + the adoption
effect + the pipeline call).

A 2026-05-17 architecture pass asked whether the pattern should collapse
into a `useNMirrorBroadcast<I, O>` hook owning the adoption effect and
forwarding the pipeline's four invariants.

On closer reading the extraction did not fit as a deepening:

- **Input shapes diverge structurally.** ColorConvertor sends the
  touched `(format, value)` pair only; the solver reconstructs the full
  record from that pair. UnitPxToRem and AspectRatioCalculator send the
  entire bag plus uiMemory because their solvers read sibling fields to
  disambiguate. A unifying hook needs a
  `mergeStrategy: 'merge' | 'replace'` knob from day one — the canonical
  "knobs vs depth" trade per ADR-0010 / ADR-0012.
- **The change handlers are the bulk.** Each adopter has 30–50 lines of
  change handlers (`handlePxChange`, `handleWidthChange`,
  `handleHexChange`) encoding Tool-specific clearing rules. A
  unit-locked aspect ratio clears differently from a hex-typed color —
  those clearing rules cannot be parametrized into a shared hook
  without either growing the hook or growing a declarative
  `clearOnEmpty: Record<Field, Field[]>` rule schema. The savings
  ceiling is the ~15 lines of plumbing per adopter, not the full ~50
  lines of code.
- **Net savings ~20 lines across the codebase**, in exchange for one
  new hook, one new invariant to document, one new spec file, and a
  `mergeStrategy` knob that exists to accommodate exactly one of three
  adopters.
- **The pipeline already owns the load-bearing invariants.** The four
  (debounced, stale-safe, empty-bypass, unmount-safe) come from
  [[Tool computation pipeline]] regardless of whether the N-mirror glue
  is hand-rolled or extracted.

`ColorPaletteGenerator` was briefly suspected as a fourth adopter
during the pass; it is not. It uses `useToolFields` and renders the
palette list directly from `result` without mirroring back into a
field bag — different shape, different concern.

## Decision

N-mirror broadcast **stays as a named pattern in CONTEXT.md, not a hook
in `src/hooks/`**. The three adopters continue to hand-roll the
~10-line glue (`useState<O>` + adoption `useEffect`) per Tool.

## Consequences

**Positive**

- The "knobs vs depth" rule is upheld. The project does not grow a hook
  with a `mergeStrategy` knob to absorb 20 lines across three files.
- The change handlers — where the per-Tool clearing rules live — stay
  visible at the call site rather than threading config through a hook.
- Future architecture passes do not re-suggest the extraction; the ADR
  records the input-shape divergence and the savings ceiling.

**Negative**

- The repeated `useState<O>` + `useEffect(() => { if (result)
  setFields(prev => ({ ...prev, ...result })) }, [result])` block is
  visible across three files. A reader scanning the three adopters sees
  structural similarity the codebase deliberately does not abstract.
- Adding a fourth full-bag adopter raises savings to ~30 lines and
  shifts the merge-strategy knob from "needed for 1 of 3" to "needed
  for 1 of 4" — the decision weakens, not strengthens, with more
  adopters of that shape.

## Revisit when

- A **fourth adopter with the full-bag shape** (matching UnitPxToRem /
  AspectRatioCalculator) appears. At that point the touched-only
  minority is 1/4 and the merge-strategy knob carries less weight; the
  extraction becomes plausible.
- The **change-handler clearing rules turn out to share structure** —
  e.g. expressible as a declarative `clearOnEmpty: Record<Field,
  Field[]>` rule. If the bulk of per-Tool code collapses too, the
  plumbing extraction stops being the smaller half of the pie.
- `ColorConvertor` migrates to a **full-bag Input shape** (e.g. because
  its solver gains uiMemory or a sibling-aware rule). With three
  adopters all on the full-bag shape, no merge-strategy knob is needed
  and the extraction becomes a straightforward `useState` +
  adoption-effect absorption — the same shape
  [[Persistent tool field bag]] already has, minus the localStorage
  half.
