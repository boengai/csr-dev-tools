# ADR 0013 — `MarkdownTableGenerator`'s reducer stays

- **Status:** Accepted
- **Date:** 2026-05-17

## Context

`MarkdownTableGenerator`
(`src/components/feature/code/MarkdownTableGenerator.tsx`,
~201 lines) manages its state via `useReducer`. It is one of two
remaining Tools using that hook after the 2026-05-16
architecture-review arc migrated three siblings
(`DataUriGenerator`, `QrCodeGenerator`, `ImageCompressor`) off the
same pattern. The sibling is `PlaceholderImageGenerator`, whose
reducer was preserved by ADR-0008.

A 2026-05-17 architecture pass — the one that shipped
[[Entity ID minters]] — considered whether `MarkdownTableGenerator`
should follow the same migration the three siblings underwent.
ADR-0008 enumerated the four properties that distinguished the
migrators from `PlaceholderImageGenerator`: pipeline already
present with bag-rebuild anti-pattern, pipeline state duplicated
in the reducer, reducer multiplexing independent flows, or
async-compute under stale-safety pressure. The question for this
ADR: do any of those properties apply here?

On closer reading the framing did not fit. `MarkdownTableGenerator`
has **none** of them — for the same reasons recorded in ADR-0008,
plus structural-op evidence specific to this Tool.

- **No pipeline today.** Output compute is
  `output = generateMarkdownTable(data, alignments)` on
  `MarkdownTableGenerator.tsx:86`, called inline during render. The
  compute is synchronous, ~milliseconds for the
  2-to-20-rows × 2-to-20-cols clamp, no debounce concern, no stale
  async to drop, no unmount-safety to inherit. `generateMarkdownTable`
  lives in `src/utils/markdown-table.ts` per ADR-0004 and carries
  its own spec.
- **No duplication.** Every reducer field
  (`{ rows, cols, data, alignments }`) is React state the Tool itself
  owns. None of it shadows pipeline-managed state because there is
  no pipeline.
- **The reducer carries legitimate structural ops, not pure
  multiplexing.** Out of 9 cases:
  - 4 are pure setters (`SET_ROWS`, `SET_COLS`, `SET_DATA`,
    `SET_ALIGNMENTS`).
  - 1 is a single-cell immutable 2D update (`UPDATE_CELL` —
    `data.map((row, ri) => ri === r ? row.map((cell, ci) => ci === c ? val : cell) : row)`).
  - **3 carry resize logic with grid-preservation invariants**
    (`CHANGE_ROWS`, `CHANGE_COLS`, `RESET`). `CHANGE_ROWS` and
    `CHANGE_COLS` clamp the new dimension to `[2, 20]`, preserve
    existing cells under shrink/grow, and `CHANGE_COLS` resizes
    `alignments` in lockstep with `cols`. The "two arrays must
    stay length-aligned" invariant is the kind of bundled
    transition a reducer expresses naturally.
  - 1 is a state-machine cycle (`TOGGLE_ALIGN` — rotates one
    column's alignment through `left → center → right` via the
    `NEXT_ALIGN` table on `MarkdownTableGenerator.tsx:11-15`).

The grid-preservation cases (`CHANGE_ROWS`, `CHANGE_COLS`) are the
load-bearing reason. Splitting them into `useState × 4` would
either:

1. **Replicate the dual-array maintenance at every resize
   call site.** Today `CHANGE_COLS` does `setData(...)` and
   `setAlignments(...)` as one atomic conceptual op; with
   independent `useState`s the call site would need to compute
   and dispatch both updates in the right order without
   accidentally racing the next render. React 18 batching saves
   the functional correctness, but the "single op" framing is
   lost.
2. **Extract a `resizeGrid(state, dim, n)` helper.** Roughly the
   same code that lives in the reducer cases today, just called
   from a `useCallback` instead of dispatched. Net change: ~0 LOC,
   slightly worse locality (the resize logic is now reached by a
   handler that the reader has to trace through to the helper).

Migrating to `useToolFields` would add a pipeline tick of
microtask delay on every keystroke for compute that is synchronous,
and the pipeline's `error` / `isPending` / debounce / stale-safety
machinery all go unused. The deletion test concentrates nothing —
removing the reducer would scatter the resize-and-align logic with
no consolidation gain.

The fact that ADR-0008 already documented the same reasoning for
`PlaceholderImageGenerator` is **not** a forcing function on its
own. Each `useReducer` Tool has to clear the four-property bar.
`MarkdownTableGenerator` clears it on the same axes as
`PlaceholderImageGenerator` but for a different structural reason
(grid-preservation invariants on resize, versus hex-mirror
conditional parse). The two ADRs are independent decisions about
two genuinely different reducer shapes.

## Decision

`MarkdownTableGenerator`'s `useReducer` **stays as-is**. No
migration to `useToolFields` and no flattening to plain `useState`.

The migration that swept `DataUriGenerator` / `QrCodeGenerator` /
`ImageCompressor` does not transfer here, for the same four-property
reasons ADR-0008 records.

## Consequences

**Positive**

- Future architecture passes do not re-suggest this migration;
  the ADR records the specific structural ops
  (`UPDATE_CELL`'s 2D immutability, `CHANGE_ROWS`/`CHANGE_COLS`'s
  grid-preservation + dual-array invariant, `TOGGLE_ALIGN`'s
  cycle) that justify keeping the reducer.
- The two remaining `useReducer` Tools (`PlaceholderImageGenerator`
  via ADR-0008, `MarkdownTableGenerator` via this one) are both
  intentional. Reviewers scanning for "Tools still on the old
  reducer pattern" will land on whichever ADR matches.
- The "we migrated 3 of 5 useReducer-using Tools in one sweep"
  pattern does not become a forcing function that drags the
  remaining two along on consistency grounds alone.

**Negative**

- The asymmetry between the migrated three and the preserved two
  is real. A reader has to consult ADR-0008 or this ADR to know
  which side a given Tool sits on and why.
- `generateMarkdownTable` runs unmemoized on every render
  (`MarkdownTableGenerator.tsx:86`). For the current clamped
  ≤400-cell grid the cost is negligible, but the lack of `useMemo`
  is a Tool-internal observation, not an architectural one — out
  of scope for this ADR.

## Revisit when

- A **third Tool** emerges with the same structural-ops-on-grid
  shape — clamped 2D resize, alignment-and-data lockstep, cell
  updates with immutable 2D map. At three adopters the
  resize-and-align discipline may earn a `useGrid` /
  `createGridReducer` factory the consumers compose, rather than
  each declaring its own reducer.
- `MarkdownTableGenerator`'s **compute becomes async** (e.g.,
  switching from sync string generation to a WASM-backed
  formatter, or fetching templates from a server). At that point
  the pipeline's stale-safety and unmount-safety carry weight,
  and `useToolFields` becomes the right home — the resize logic
  would still live somewhere, but the Tool's overall shape would
  shift.
- The Tool grows a **second derived output** (e.g., live HTML
  preview alongside Markdown source). If the second output needs
  the same debounced / stale-safe contract as the Markdown text,
  the pipeline becomes worthwhile.
- The grid dimensions become **unclamped** (e.g., user
  configurable max). At unbounded sizes the inline render compute
  on every keystroke becomes a perf concern, which is the trigger
  for either `useMemo` over `generateMarkdownTable(...)` or
  moving compute behind a debounced pipeline.
