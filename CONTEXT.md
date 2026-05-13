# CSR Dev Tools — Domain Language

The shared vocabulary the codebase is organized around. Add new terms here when
a refactor or design conversation surfaces a concept that needs a name; remove
or rename terms when the code stops carrying them.

## Tool

A discrete client-side dev utility — the unit the project ships. Each Tool
takes user input, runs a (usually async) transformation, and renders a result.
Tools are registered in `src/constants/tool-routes.ts` and routed at
`/tools/<route>`. Examples: `HashGenerator`, `JsonDiffChecker`,
`BackgroundRemover`.

A Tool typically composes:

- A **Tool computation pipeline** for its input→result transformation.
- A `ToolDialogShell` for the modal interaction surface (most tools).
- Optional per-tool persistence (`useInputLocalStorage`) or SEO (`useToolSeo`).

## Tool computation pipeline

The debounced, stale-safe async transformation from a Tool's input to its
result. Implemented by `useToolComputation`
(`src/hooks/useToolComputation.ts`).

Carries four invariants the call site must not have to reassemble:

1. **Debounced** — rapid input changes coalesce; only the last value computes.
2. **Stale-safe** — if a slower earlier compute resolves after a newer one, its
   result is dropped (no overwrite of fresh result by stale).
3. **Empty bypass** — when the input matches `isEmpty`, the pending debounce is
   cancelled and the result resets to `initial` synchronously (no flash of
   stale result while debouncing).
4. **Unmount-safe** — pending computes do not write state after unmount.

The pipeline owns its result, error, and pending state. The two lower-level
primitives it composes — `useDebounceCallback` and `useStaleSafeAsync` — remain
public for cases that need only one half of the pipeline (non-async debounce;
one-shot async without debounce).

## Bidirectional converter

A Tool that converts between two formats with mode-swap support — JSON ↔ CSV,
HTML ↔ Markdown, encode/decode, etc. Implemented by `<BidirectionalConverter>`
(`src/components/common/converter/BidirectionalConverter.tsx`).

The shell owns: the per-direction mode button pair, the dialog, per-mode source
persistence (localStorage), mount-time hydration, mode switching, and the
two-column source-input / result-output layout. The Tool's role narrows to
its per-direction `compute` function plus per-direction labels/placeholders.

Tools with extras (entity-mode select, double-escape checkbox) plug into the
`sourceToolbarSlot` render-prop, which receives `{ mode, recompute }` — the
caller renders its extras and calls `recompute()` after their value changes.
