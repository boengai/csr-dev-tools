# ADR 0007 — Horizontal labeled value cell stays unshelled

- **Status:** Accepted
- **Date:** 2026-05-16

## Context

Three Tools render a `rounded border border-gray-800 bg-gray-950 px-N py-N`
cell containing a label, a value, and a `<CopyButton>`. The chrome
(border, background, rounding, padding, flex-justify-between) is roughly
identical; the internal shapes are not. A 2026-05-16 architecture pass
considered extracting a common `<ValueRow>` (or similar) in
`src/components/common/output/` as a sibling to `<MonoOutputCell>`.

The four sites in the codebase today:

| Site | Shape | Specifics |
|---|---|---|
| `CertificateDecoder.tsx:22-40` (local `<ResultRow>`) | inline: `[label-shrink-0][value+copy]` | `mono` toggle; `copyValue ?? value` so the clipboard string can differ from display ("2026-05-16 (in 5 days)" displays, "2026-05-16" copies) |
| `IpSubnetCalculator.tsx:219-243` | stacked: `[(label / value + inline-pill)][copy]` | label sits ABOVE value; value is always mono; conditional inline pill slot for "Single Host" (`/32`) / "Point-to-Point Link (RFC 3021)" (`/31`) |
| `ChmodCalculator.tsx:208-215` (command preview) | `[<code>][copy]` | no label; value is a `<code>` element; one use only |
| `MonoOutputCell` (`src/components/common/output/`) | vertical: `[label + copy][value-box-on-own-row]` | already factored; 2 adopters (`HashGenerator`, `HmacGenerator`) |

The first three are the candidates for "shell." The fourth is the
sibling that already lives in `common/output/` for a different shape.

On closer reading the framing did not fit:

- **Label position varies non-trivially**: left-shrink-0
  (`CertificateDecoder`), above-value (`IpSubnetCalculator`), absent
  (`ChmodCalculator`). These are not visual sub-variants of one
  arrangement — they're three different arrangements.
- **Value styling varies**: sans/mono toggle, mono-truncate-only,
  `<code>` element. The "value" slot's typography is per-site.
- **The suffix slot is real complexity** only for `IpSubnetCalculator`
  (the conditional RFC pills are tied to `prefixLength`); the other
  two adopters have no suffix concept.
- **Only `<CopyButton>` on the right is genuinely shared.** That's
  already a common component.

A unified `<ValueRow>` covering all three sites would need props for
`label?`, `position: 'inline' | 'stacked'`, `mono?`, `code?`,
`copyValue?`, `suffix?` — six props for ~6 lines of Tailwind chrome
per adopter (border, bg, rounding, padding, flex-justify-between).
The project's common-component rule
("Common components do not accept `className` or `style` overrides")
means every visual variance must be a named prop, so a future quirk
adds another prop rather than a one-off override.

By the **deletion test**: removing this hypothetical component
scatters CSS chrome across three sites, not behavior. The chrome is
roughly five Tailwind classes per adopter. That is CSS-class
deduplication, not depth.

A narrower cut — a `<ChromeBox>` owning *only* the
`rounded border bg-gray-950 flex-justify-between` shell and letting
each adopter compose its label/value internally — was also
considered. It would be a near-zero-depth abstraction (an alias for
five Tailwind classes) and was rejected for the same reason ADR-0006
gives for the CSS Playgrounds family: the shared shape is too thin
and the variances dominate.

## Decision

No `<ValueRow>` (and no `<ChromeBox>`) is extracted. The three
sites — `CertificateDecoder`'s local `<ResultRow>`,
`IpSubnetCalculator`'s inline grid cell, `ChmodCalculator`'s command
box — keep their local implementations.

`<MonoOutputCell>` continues to carry the **vertical**
"label / value-box / copy" shape for its 2 adopters; no horizontal
sibling is added.

`<CopyButton>` continues to carry the genuinely-shared piece —
the clipboard interaction — across all four sites.

## Consequences

**Positive**

- Each Tool's cell layout matches its specific shape without fighting
  a 6-prop variant abstraction.
- Future architecture passes do not re-suggest the horizontal value-
  cell extraction; this ADR records the four-shape evidence so the
  candidate is closed with reasoning, not silence.
- The "no `className` override" rule on common components stays
  enforceable — no temptation to ship a wide-knob shell that
  effectively re-introduces freeform styling.

**Negative**

- Roughly five Tailwind classes per cell (border, bg, rounding, padding,
  flex-justify-between) are repeated across the three sites and within
  each site (each Tool renders multiple cells of its local shape).
  The cost is small and stable; the chrome is unlikely to drift since
  the shape is documented here.
- A new contributor adding a fourth horizontal-cell shape has to copy
  the chrome from a sibling rather than import a shell.
- `MonoOutputCell` has a similar-but-different shape; future readers
  may wonder why the horizontal sibling doesn't exist. The JSDoc on
  `MonoOutputCell` could point at this ADR if the question recurs.

## Revisit when

- A **fifth+** site emerges that uses one of the three existing
  horizontal shapes exactly (same label position, same value
  typography, same suffix needs). At that point one of the three
  shapes earns 2+ adapters in its own right, and a narrow shell for
  *that specific shape* (not a unified one) may be worth extracting.
- The **chrome itself** grows beyond ~five Tailwind classes (e.g.,
  the project adopts a consistent error-banner badge inside cells,
  or a uniform animation). At that point the cost of repeating the
  chrome may cross the cost of a `<ChromeBox>` even at low depth.
- **`MonoOutputCell` gains 2+ horizontal-shaped adopters** of its
  own (e.g., a horizontal mode is added with `direction: 'horizontal'
  | 'vertical'`). At that point the seam already exists in
  `common/output/` and the question becomes "extend the existing
  component" rather than "build a sibling."
- One of the three current sites is **removed or substantially
  reshaped**. At zero or one adapter remaining, the question
  vanishes.
