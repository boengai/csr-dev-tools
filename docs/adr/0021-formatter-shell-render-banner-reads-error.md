# ADR 0021 — `FormatterShell`'s `renderBanner` reads `error`, not `result`

- **Status:** Accepted
- **Date:** 2026-05-22

## Context

Three sibling shells share the same compute-with-result-display shape:
[[Formatter shell]], [[Diff checker shell]], [[Bidirectional converter]].
The latter two expose a `renderBanner` slot for inline metadata above
the result; the Formatter family did not, and JSON / YAML parse failures
were toast-only via `errorFallback`. A 2026-05-22 architecture pass
added `renderBanner` to `FormatterShell` so the [[Parse-error narrator]]
message can stay on screen while the user reads the source.

Both existing siblings pass `result: R` to their `renderBanner`:

- `DiffCheckerShell.renderBanner(result: R)` — `JsonDiffChecker` reads
  `result.validationError`.
- `BidirectionalConverter.renderBanner(result: R)` — `EnvFileConverter`
  reads `result.warnings`.

The shape works for both because their compute returns a *partial*
result on validation failure: the diff still computes against the valid
input, the converter still emits valid output with non-fatal warnings.
The banner reads a metadata field on a present result.

Formatter parse failure is a different semantic situation. When the
JSON narrator returns `"Invalid JSON: …"`, the formatter has no valid
result to render — the compute *throws*. To reach sibling parity, the
formatter would have to either:

1. Stop throwing and return `{ output: '', error: narrated }` instead,
   plus make `FormatterShell` generic over `<R extends { output: string }>`,
   so the banner can read `result.error`.
2. Read from the pipeline's `error` state instead, exposing
   `renderBanner?: (error: unknown) => ReactNode`.

A 2026-05-22 design pass considered option 1 and rejected it.

## Decision

`FormatterShell.renderBanner` takes the signature `(error: unknown) =>
ReactNode` — diverging from the sibling pattern — and reads from the
pipeline's `error` state rather than from `result`.

The reasoning:

- **Parse failure is semantically an exception, not a result.** When
  the JSON narrator returns non-null, there is nothing to format. The
  WASM facade signals this by throwing; the [[Tool computation
  pipeline]] catches into its `error` state and keeps the prior
  successful result for display continuity. Forcing the formatter to
  return a degenerate "valid result with an error attached" inverts the
  semantic — every downstream check (`result.output.length`,
  `<CodeOutput value={result}>`) would have to special-case the error
  shape.

- **The pipeline already owns this state.** `useToolComputation`
  exposes `error: unknown | null` with the right lifecycle: cleared on
  successful compute and on `isEmpty` short-circuit, set on rejection.
  Routing the banner through this existing seam adds one destructured
  field; routing through option 1 changes the public result type of
  every formatter Tool and the shell's generic constraint.

- **Sibling-pattern parity is shape-warping here.** [[Diff checker
  shell]] and [[Bidirectional converter]] read `result` because their
  computes have meaningful partial results. The pattern that holds for
  them is "banner shows non-fatal metadata about a successful
  computation." That is not the formatter case. Forcing a shared
  signature on shells that handle different semantic situations
  flattens away the distinction.

Setting `renderBanner` also suppresses the `errorFallback`/`errorLabel`
toast routing — the banner replaces the toast (same content, two
channels duplicate).

## Consequences

- `FormatterShell.renderBanner: (error: unknown) => ReactNode` is the
  one slot in the family that takes `error` rather than `result`. The
  asymmetry is intentional and recorded here.
- `JsonFormatter` and `YamlFormatter` are the only adopters today —
  CSS/HTML/SQL/JS-minifier throw opaque format errors that would render
  a banner saying the same thing as their existing toast, so they keep
  `errorFallback`/`errorLabel`.
- A future shell with a partial-result semantic should follow [[Diff
  checker shell]] / [[Bidirectional converter]] and pass `result`. A
  future shell whose compute throws-on-validation should follow this
  ADR and pass `error`.
- If a third "throws-on-validation" shell appears (the second adopter
  of this shape), the `renderBanner: (error) => ReactNode` signature
  earns a name and a shared `<ParseErrorBanner>` component becomes
  worth extracting. Until then, the two adopters inline the same
  three-line `<p role="alert">` markup — same pattern
  `JsonDiffChecker` follows.
