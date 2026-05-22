# ADR 0006 — CSS Playground family stays unshelled

- **Status:** Accepted
- **Date:** 2026-05-16

## Context

`src/components/feature/css/` contains five inline-rendered Tools whose
interaction pattern is "configure a CSS property visually → see live
preview → copy generated CSS":

| Tool | Lines |
|---|---|
| `BorderRadiusGenerator` | 98 |
| `BoxShadowGenerator` | 112 |
| `GridPlayground` | 137 |
| `GradientGenerator` | 150 |
| `FlexboxPlayground` | 218 |

All five share the same outermost skeleton:

```tsx
<div className="flex w-full grow flex-col gap-4">
  {toolEntry?.description && <p>…</p>}
  {/* per-Tool controls */}
  {/* optional dashed divider */}
  {/* per-Tool preview */}
  <CssOutputCell ... />
</div>
```

A 2026-05-16 architecture pass considered extracting a
`<CssPlaygroundShell>` parallel to [[Diff checker shell]] /
[[Formatter shell]]. Five adopters clears the project's
"two adapters = real seam" bar. On closer reading, the framing did not
fit:

- **The shared shape is too thin.** The outer flex container, the
  description line, and the trailing `<CssOutputCell>` are the only
  literally-duplicated pieces — about five lines per file. Everything
  else (controls density, preview shape, optional divider, item
  rendering inside the preview) is per-Tool.
- **The variances dominate.** `BorderRadiusGenerator` and
  `BoxShadowGenerator` have a preview with a BG color picker overlay;
  `GradientGenerator`'s preview *is* the gradient (no overlay);
  `GridPlayground` and `FlexboxPlayground` render preview items inside
  the preview container. Some Tools include the dashed divider; some
  don't.
- **The controls section is fully per-Tool.** Each Tool's control row
  has its own density and structure: range sliders for radius corners,
  range+color+toggle for shadow, stop-list with add/remove for gradient,
  text-input+range+select+range for grid, multi-control container/item
  panels for flexbox.

A shell with this much variance would either:

1. Expose so many props / slot render-props that its interface depth
   evaporates (callers reassemble most of the JSX themselves), or
2. Force a prescriptive shape that doesn't match any Tool's natural
   layout — leading to per-Tool overrides that negate the win.

The genuinely-shared piece is already factored: `<CssOutputCell>`
(`src/components/common/css-output/`). That is the right granularity
for this family.

## Decision

The CSS Playground Tools (`BorderRadiusGenerator`, `BoxShadowGenerator`,
`GradientGenerator`, `GridPlayground`, `FlexboxPlayground`) stay as
individual implementations. No `<CssPlaygroundShell>` will be extracted.

`<CssOutputCell>` remains the shared piece — Tools use it directly. Any
new CSS Playground Tool added in the future follows the same shape: own
its own controls and preview, end with `<CssOutputCell>`.

## Consequences

**Positive**

- Each Tool's layout matches its specific UI needs without fighting a
  shell abstraction.
- Future architecture passes do not re-suggest the
  `<CssPlaygroundShell>` extraction; this ADR records the negative
  finding with five concrete adopters as evidence.
- `<CssOutputCell>` continues to carry the genuinely-shared piece of
  this family — the copyable code-output box — without overreaching.

**Negative**

- Roughly five lines per Tool (the outer flex container + description
  line) are duplicated across all five Tools. The cost is small and
  unlikely to drift, since the shape is documented in this ADR.
- A new contributor adding the sixth CSS Playground Tool has to know to
  copy the outer skeleton from a sibling rather than import a shell.

## Revisit when

- A sixth+ CSS Playground Tool emerges whose shape matches the existing
  five so closely that the controls section also lines up — at that
  point the controls' shared structure may finally warrant a shell.
- The shared outer skeleton grows beyond ~five lines (e.g., gains
  consistent error-banner handling, a uniform preview-toolbar, or
  an opinionated description-line shape). The cost of duplicating that
  across N Tools may cross the cost of a shell with a render-prop slot.
- `<CssOutputCell>`'s API needs a new prop that every CSS Playground
  Tool would pass identically. That could be a signal that a shell
  one level up is now justified.

## Re-examined 2026-05-22

A 2026-05-22 architecture pass (the third pass in this codebase, following
the [[Tool input]] and [[Inline labeled row]] extractions) revisited this
ADR. A new reframe was considered: rather than a shell, extract a
hook (`useCssGeneratorConfig` or a generic `usePartialState<T>`) that owns
the config-bag-with-memoized-CSS-output orchestration but leaves the
preview and controls fully to each Tool. The hypothesis was that the
"variances dominate" critique applied only to UI layout, not to a
state-only seam.

The hypothesis did not survive contact with the code. State-shape audit
across all six adopters (including `CssAnimationBuilder`, added since
this ADR was written):

| Tool | State buckets |
|---|---|
| `BorderRadiusGenerator` | `config` + `previewBg` (preview overlay is separate state) |
| `BoxShadowGenerator` | `config` + `previewBg` (same shape) |
| `CssAnimationBuilder` | `config` + `animKey` (replay-trigger key) |
| `FlexboxPlayground` | `container` + `items[]` + `selectedItem` (three distinct buckets) |
| `GradientGenerator` | single `config` (lazy initializer) |
| `GridPlayground` | `container` + `itemCount` (two distinct concerns) |

Three of six Tools have multiple distinct state buckets, not a single
config record. The proposed hook would need either to cover only the
single-bucket case (admitting fewer than half the adopters — failing
the "two adapters = real seam" bar in practice) or to grow opt-outs
for the multi-bucket cases (re-introducing the depth-loss the ADR
already rejected).

Memoization audit: only `CssAnimationBuilder` uses `useMemo` for its
CSS output. The other five inline-build the CSS string per render —
cheap enough that memoization is not worth the cognitive overhead. The
"memoized CSS output" half of the hypothesised hook does not exist in
five of six adopters.

A separately-scoped `usePartialState<T>` (just "useState with partial
updates") was also considered. The pattern `setConfig(prev => ({
...prev, [key]: val }))` is three lines and terse; it appears beyond
the CSS family too. Extracting it would be a near-zero-depth alias —
the same kind of CSS-class deduplication ADR-0007 rejected for visual
chrome. `useToolFields` already covers the case where partial-update +
debounce + computed-result invariants matter; CSS playground Tools
don't need those invariants (no async compute, no expensive operation),
so the heavier hook would be overkill.

**Decision (re-affirmed):** ADR-0006's original decline stands at the
hook level as well. The CSS Playground family stays unshelled and
un-hooked above the existing `<CssOutputCell>` seam.

**Revisit trigger amended:** the prior "sixth Tool emerges whose
controls match" trigger still applies. Additionally — if a third
Tool family outside CSS adopts the exact `useState<C> +
setConfig(prev => ({ ...prev, [key]: val })) + inline-rendered CSS`
shape (i.e., not just the partial-update half), the question becomes
"is the cross-family shape worth naming," at which point a different
ADR (not amending this one) would be the right vehicle.
