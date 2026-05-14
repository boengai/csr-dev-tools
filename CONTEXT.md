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

## Tool field bag

The variant of the [[Tool computation pipeline]] that owns its inputs.
Implemented by `useToolFields` (`src/hooks/useToolFields.ts`).

`useToolComputation` takes a single `Input` value; multi-field Tools that use
it are forced to keep one `useState` per field plus a per-handler bag rebuild
(`setInput({ ...all-other-fields, X: val })`). That double bookkeeping was the
bug surface: forget a field in one handler and the pipeline silently computes
on stale data.

`useToolFields` collapses both. The hook owns a record of fields, exposes
`inputs` for reads, and accepts `setFields(partial)` for writes. The pipeline's
four invariants (debounced, stale-safe, empty-bypass, unmount-safe) carry over
unchanged — `useToolFields` is implemented as a thin layer over
`useToolComputation` so the invariants stay defined in one place.

Pick this when a Tool has more than one input field. Keep `useToolComputation`
for single-value Tools (one `string` in, one result out) — forcing them
through `setFields({ value: x })` is worse than what they have.

Carries one extra invariant beyond the pipeline:

1. **Same-tick partial updates compose** — back-to-back `setFields(partial)`
   calls in one event handler chain through an internal ref so each call sees
   the previous call's update. The final bag is the union of all partials,
   not just the last one. Compute fires once with the merged bag.

`reset()` restores `inputs` to `options.initial` and routes through
`setFieldsImmediate` so any pending compute is cancelled and `isEmpty`-driven
short-circuits fire synchronously.

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

## Image tool shell

A Tool that takes a single uploaded `File` as source, runs a transformation,
and produces a single `Blob` result for preview and download. Implemented by
`<ImageToolShell>` (`src/components/common/image-tool/ImageToolShell.tsx`).

Examples: `BackgroundRemover`, `ImageCropper`, `ImageResizer`. Does NOT fit:
`ImageCompressor`/`ImageConvertor` (inline, no dialog), `PlaceholderImageGenerator`
(no source File — pure generation), `FaviconGenerator`/`SplashScreenGenerator`
(produce a batch of results, not a single Blob).

The shell wraps the [[Tool computation pipeline]] internally, so all four of
its invariants (debounced, stale-safe, empty-bypass, unmount-safe) apply to
the `process` function. The shell owns: the dialog, the file UploadInput +
MIME validation, source and result `Blob` URL lifecycles (via [[useBlobUrl]]),
the Download button + filename. The Tool's role narrows to its
`process(file, controls)` function, an externally-owned `controls` value, two
render-props (`renderControls`, `renderPreview`), and a `getDownloadFilename`
callback. The shell exposes an optional `onRejectInvalidFile` callback for
the Tool to wire a reject toast.

The Tool fires the pipeline via `recompute()` from `renderControls` — the
same shape `<BidirectionalConverter>` uses for `sourceToolbarSlot`. The
`renderPreview` ctx carries `{ pending, error, source, sourceUrl, result,
resultUrl }`; the Tool decides per-phase rendering instead of a separate
processing slot.

## DiagramEditor

The single seam the DB Diagram Tool owns: a pure-TS module (`src/diagram/`)
that holds the document state, runs structural ops, manages the DBML
round-trip, and absorbs autosave + named-diagram persistence behind a
`DiagramStorage` adapter. Implemented by `DiagramEditor`
(`src/diagram/editor.ts`).

Callers see a single object — no `loadDiagramIndex`/`saveDiagram`/`generateId`
calls in React, no debounce wiring, no `setDbmlText(toDbml())` chains. The
React side observes via `subscribe` (document) and `subscribeToIndex` (saved
diagrams list).

Carries these invariants:

1. **Autosave is debounced and coalesced** — every user mutation reschedules
   one pending save (`autosaveMs`, default 3s). Rapid edits collapse into one
   write. `flush()` forces the pending save; `dispose()` cancels it.
2. **First save mints an id** — empty unsaved diagrams (no id, no tables) do
   not save. The first user mutation past that threshold writes an index
   entry with `createdAt = updatedAt = clock()`; subsequent saves preserve
   `createdAt` and bump `updatedAt`.
3. **Lifecycle ops bypass autosave** — `bootstrap`, `loadDiagram`,
   `newDiagram`, `deleteDiagram`, `renameDiagram` mutate state and storage
   without scheduling a save (they don't represent user edits).
4. **DBML source-latch is internal** — `setDbmlText` flips
   `dbmlSource: 'editor'` so structural ops stop overwriting a typed draft;
   `syncDbmlFromDiagram()` re-renders the generated DBML in a single call.
5. **JSON imports are always new** — `loadFromExportedJson(parsed, name)`
   validates the schema, clears `diagramId`, and lets autosave mint a fresh
   id. Imported files never overwrite a matching stored diagram.

The `DiagramStorage` adapter (`{ loadIndex, saveIndex, loadDiagram,
saveDiagram, deleteDiagram, generateId }`) decouples the editor from
localStorage. `localStorageDiagramStorage` is the production adapter;
`createInMemoryDiagramStorage()` is the test double — counters on `saves`
and `deletes` make autosave behavior unit-testable without DOM.
