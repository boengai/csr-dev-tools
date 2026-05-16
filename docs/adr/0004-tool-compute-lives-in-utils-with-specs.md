# ADR 0004 — Tool compute lives in `src/utils/<name>.ts` next to a `.spec.ts`

- **Status:** Accepted
- **Date:** 2026-05-16

## Context

A standing architecture heuristic — applied to many codebases — flags any
large React component file without an adjacent `*.spec.tsx` as a
"test-shape gap": the assumption is that pure compute is inlined in JSX
and therefore only testable via rendering. The proposed deepening is
"extract compute into a sibling module to expose a unit-testable seam."

The 2026-05-16 architecture pass swept every `src/components/feature/**`
`.tsx` file over 250 lines that lacked an adjacent `.spec.tsx`. In all
cases — except the one already documented in ADR-0002 — the Tool's
compute already lived in `src/utils/<name>.ts` (or
`src/wasm/parsers/...`) with a matching `.spec.ts`:

| Tool | Compute module |
|---|---|
| `GraphqlSchemaViewer` | `utils/graphql-schema-viewer.ts` |
| `DataUriGenerator` | `utils/data-uri.ts` |
| `CssAnimationBuilder` | `utils/css-animation.ts` |
| `ProtobufToJson` | `wasm/parsers` + `utils/protobuf-codec.spec.ts` |
| `ProtobufCodec` | `utils/protobuf-codec.ts` + `wasm/parsers` |
| `TimezoneConverter` | `utils/timezone-converter.ts` |
| `SplashScreenGenerator` | `utils/splash-screen.ts` |
| `PlaceholderImageGenerator` | `utils/placeholder-image.ts` |
| `MermaidRenderer` | `utils/mermaid-renderer.ts` + `mermaid-auto-fix.ts` |
| `JsonpathEvaluator` | `utils/json-path.ts` (via `parseJsonInput` + `evaluateJsonPath`) |
| `BcryptHasher` | `utils/bcrypt-hasher.ts` |
| `IpSubnetCalculator` | `utils/ip-subnet.ts` |
| `TimeUnixTimestamp` | `utils/time.ts` + thin glue inline |
| `AspectRatioCalculator` | `utils/aspect-ratio.ts` |
| `ImageConvertor` | inlined — per ADR-0002 |

The `.tsx` files are large because their UIs are large (browseable type
panels, multi-tab outputs, live previews, controls panels) — not because
compute is inlined. A few Tools keep a thin lambda inside
`useToolComputation*` that delegates to the extracted primitive (e.g.,
`computeMermaid` in `MermaidRenderer.tsx`); the primitive carries the
testable behavior, and the lambda is glue.

## Decision

The repository's convention is: **Tool compute lives in
`src/utils/<name>.ts` (or `src/wasm/...` for WASM-backed compute) with a
matching `.spec.ts`.** The `.tsx` file is the composition + JSX layer.

Architecture passes will **not** re-suggest "extract compute from this
Tool's `.tsx` to make it testable" as a deepening opportunity unless they
have first verified the `.tsx` really inlines pure logic without a
sibling util module. The presence of a large `.tsx` without an adjacent
`.spec.tsx` is **not** a test-shape gap signal in this codebase.

When adding a new Tool, the compute layer goes into `src/utils/<tool>.ts`
first; the `.tsx` follows as composition + JSX over the
[[Tool computation pipeline]] (or its [[Tool field bag]] /
[[Persistent tool field bag]] variants).

## Consequences

**Positive**

- Architecture passes do not re-litigate the "test-shape gap" heuristic;
  this ADR records the sweep that closed it on 2026-05-16.
- The compute layer's test surface stays independent of React rendering.
  Tests run in node, no jsdom.
- Tool authors have an unambiguous home for new logic: `src/utils/`.

**Negative**

- A future Tool author who skips the convention (puts compute logic
  inside the `.tsx`) creates a real test-shape gap this ADR's heuristic
  will not catch on its own; code review must enforce. Acceptable: the
  convention is the established norm.
- The audit-by-filename heuristic ("no adjacent `.spec.tsx`") is
  permanently invalid for this codebase. Reviewers should look in
  `src/utils/` for the corresponding spec rather than next to the `.tsx`.

## Revisit when

- A Tool emerges whose entire interesting behavior is React effect
  orchestration rather than pure compute (e.g., a workflow state machine
  whose transitions only make sense inside the component lifecycle).
  `ImageConvertor` is the existing example, already covered by ADR-0002.
  A new such Tool needs a different test seam (testing-library render)
  and should be recorded as a per-Tool exception.
- The compute-extraction convention is broken in 2+ recently added Tools
  — at which point the ADR no longer reflects practice and either the
  practice or the ADR needs to change.
