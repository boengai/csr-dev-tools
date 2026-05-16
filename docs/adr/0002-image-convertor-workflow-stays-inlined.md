# ADR 0002 — ImageConvertor workflow stays inlined

- **Status:** Accepted
- **Date:** 2026-05-15

## Context

`ImageConvertor` (`src/components/feature/image/ImageConvertor.tsx`,
~330 lines) owns a four-state workflow — `IMPORT → SELECT_FORMAT →
PROCESSING → DOWNLOAD` — implemented as a `useReducer` plus React-side
handlers. ADR-0001 named this as the file's real friction: "its
multi-step workflow state machine, not its progress counter."

A 2026-05-15 architecture pass considered extracting the workflow as a
pure-TS `imageConvertorMachine.ts` module. On closer reading the
framing did not fit:

- The current reducer is generic setters (`SET_TAB_VALUE`,
  `SET_SOURCES`, `SET_TARGET`, `INCREMENT_PROCESSING`, `SET_PREVIEWS`,
  `REMOVE_SOURCE`, `RESET`). It does not encode workflow transitions —
  it's a `useState` multiplexer. Extracting it would save file-boundary
  lines but yield no meaningful test surface (the only testable
  behaviour is "the dispatcher applies the action correctly").
- The actual workflow logic — which tab follows which — lives in the
  handlers (`handleInputChange`, `handleRemoveImage`, `handleConvert`,
  `handleReset`), tangled with async work, side effects (toasts,
  downloads), and `downloadTargetRef` caching. To get a real test
  surface, the handlers would need to be refactored into command-
  emitting state-machine events — an XState-shaped change much bigger
  than "extract the reducer."
- No other Tool in the catalog today has a tabbed multi-step workflow.
  `FaviconGenerator` / `SplashScreenGenerator` use the [[Batch asset
  pipeline]]; `BackgroundRemover` / `ImageCropper` / `ImageResizer` use
  [[Image tool shell]]. `ImageConvertor` is the only adapter for the
  multi-step pattern.

One adapter is a hypothetical seam, not a real one — the project's
guideline is "two adapters = real seam."

## Decision

`ImageConvertor`'s workflow stays inlined in its `.tsx` file. We will
not extract `imageConvertorMachine.ts` — neither as a pure-TS reducer
(no test-surface gain) nor as a command-emitting state machine
(premature at one adapter).

The smaller surgical alternative — extracting
`convertAndDownload(sources, target, onProgress)` from `handleConvert`
to make the conversion + download orchestration unit-testable — is
also declined for the same reason: one adapter, and the conversion
primitive `convertImageFormat` is already extracted.

## Consequences

**Positive**

- The file stays busy but coherent; reducer + handlers + JSX sit
  together where they are easy to follow.
- Future architecture passes will not re-suggest the workflow-machine
  extraction; this ADR records why one adapter is not enough.
- When (if) a second multi-step image Tool emerges, the seam can be
  designed against two real callers instead of speculation.

**Negative**

- `handleConvert` remains a ~50-line async handler doing state
  transitions, the conversion loop, ZIP-or-single branching, download
  triggering, and target caching all in one place. Tests for this Tool
  continue to require rendering.
- The reducer's existence is mostly stylistic over `useState`. The
  depth case for keeping it as a reducer is weak, but the cost of
  changing it is also low — left alone.

## Revisit when

- A second Tool needs a tabbed multi-step workflow shape. At that
  point the seam can be named against two real callers, and the shape
  (XState-style commands vs a simpler shared reducer) chosen with real
  data.
- `handleConvert` grows substantially or sprouts a third async branch
  — at which point extracting `convertAndDownload` may become
  worthwhile on locality grounds even at one adapter.
