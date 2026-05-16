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

## Persistent tool field bag

The variant of the [[Tool field bag]] that owns its localStorage
round-trip. Implemented by `useToolFieldsPersisted`
(`src/hooks/persist/useToolFieldsPersisted.ts`).

Composes `useToolFields` with two small concerns the standard pattern
needs every time it persists: read the bag from localStorage on mount
(replacing `options.initial` if a stored value exists) and write back
on every `inputs` change. The hook also fires `setFieldsImmediate({})`
once on mount — the closure-safe empty-partial pattern — when
`options.isEmpty` is provided AND the restored bag is non-empty, so
the result populates without a per-Tool `useMountOnce`. Without
`options.isEmpty`, no autorun fires (the caller is explicitly
responsible for triggering the first compute).

The four pipeline invariants (debounced, stale-safe, empty-bypass,
unmount-safe) plus the same-tick partial-merge invariant carry over
unchanged — they're defined inside `useToolComputation` /
`useToolFields`, and `useToolFieldsPersisted` does not touch them.

Pick this when a multi-field Tool persists its inputs as a single bag
under one localStorage key. Pick [[Tool field bag]] (`useToolFields`)
when persistence is bespoke or absent (e.g. `<BidirectionalConverter>`'s
per-mode source-keying, or `AesEncryptDecrypt` which doesn't persist).

Today's consumers: `JsonSchemaValidator`, `JsonDiffChecker`,
`TimezoneConverter`. `TimezoneConverter` is the partial-persistence
shape: its persisted bag holds the converter inputs (sourceTz,
targetTzIds, dateInput, timeInput), but `dateInput`/`timeInput` are
overridden with "now" on mount via a follow-up
`setFieldsImmediate({ dateInput, timeInput })`. The hook does not
need a per-field opt-out — the override is the documented pattern for
"persist some fields, recompute others on each mount."

Today's remaining migration target is `ProtobufCodec`, which still
hand-rolls `useInputLocalStorage` + `useToolComputation` + `useMountOnce`
on top of a multi-pipeline shape (separate encode/decode/schema-parse
computes around one shared persisted bag). Other multi-field Tools that
once carried that triad (`MermaidRenderer`, `GraphqlSchemaViewer`,
`JsonpathEvaluator`, `ProtobufToJson`, and the formatter family) have
since migrated to this hook or to its single-Input sibling
[[Persistent tool computation]].

## Persistent tool computation

The single-Input variant of [[Persistent tool field bag]]. Implemented
by `useToolComputationPersisted`
(`src/hooks/persist/useToolComputationPersisted.ts`).

Composes `useToolComputation` with the same two concerns
[[Persistent tool field bag]] adds: read the input from localStorage on
mount (replacing `options.initial` if a stored value exists) and write
back on every input change. The hook also fires the pipeline's
`setInputImmediate(initialInput)` once on mount — when `options.isEmpty`
is provided AND the restored input is non-empty — so the result
populates without a per-Tool `useMountOnce`. Without `options.isEmpty`,
no autorun fires (the caller is explicitly responsible for triggering
the first compute).

Unlike [[Tool field bag]], the underlying `useToolComputation` is
stateless w.r.t. input — `useToolComputationPersisted` owns the input
state via its own `useState<I>` and exposes the current value as
`input` on the result.

Pick this when a Tool has a single Input value (one `string` in, one
result out) and persists that input across reloads. Pick
[[Persistent tool field bag]] for multi-field bag persistence. Pick
the unwrapped `useToolComputation` when a single-Input Tool does NOT
persist (still the right choice for the 30+ existing single-Input
Tools without persistence).

Today's consumers: `ProtobufToJson`, `MermaidRenderer`,
`GraphqlSchemaViewer`. MermaidRenderer additionally absorbs a
tool-handoff override (`consumeHandoff('mermaid-renderer')`) on mount via
its own `useMountOnce`, which overrides the hook's autorun by calling
`setInputImmediate(prefill)` — the documented pattern for combining a
[[Tool handoff]] consumer with persisted input.

## Tool dialog frame

The page-level frame for a Tool whose interior lives in a dialog. Implemented
by `<ToolDialogFrame>` (`src/components/common/dialog/ToolDialogFrame.tsx`).

Replaces the four-concern boilerplate every dialog Tool used to repeat:
`useState(dialogOpen)`, the centered tile layout (description + button column),
the trigger button(s), and the controlled `<ToolDialogShell>` wiring
(`open`/`onOpenChange`/`onAfterDialogClose`). The Tool's role narrows to
`triggers`, `title`, `onReset`, and the dialog body.

Each trigger is `{ label, onOpen? }`. `onOpen` fires synchronously in the same
React event that flips the dialog open, so any state seeded there (e.g.
`mode: 'encrypt'` from the Encrypt button) is committed before the body
renders. Two-trigger Tools (AES Encrypt/Decrypt, String Escape/Unescape)
collapse their bespoke `openDialog(mode)` helper into one trigger entry per
button.

`<ToolDialogShell>` remains the lower-level escape hatch — use it directly
when the tile shape doesn't fit (multi-dialog Tools, etc.). `<ImageToolShell>`
and `<BidirectionalConverter>` are unaffected; their tile shapes have their
own concerns.

## Upload dialog frame

Sibling of [[Tool dialog frame]] for Tools whose tile IS a file-upload
trigger rather than a button that opens an empty dialog. Implemented by
`<UploadDialogFrame>` (`src/components/common/dialog/UploadDialogFrame.tsx`).

The frame owns: tile (description + `<UploadInput>`), dialog open state,
forwarding to `<ToolDialogShell>`. The Tool's `onUpload(files, openDialog)`
runs when files are selected; the Tool decides when to invoke `openDialog()`
— before async processing (to show a loading state) or after (to open with
results ready). Skipping the call keeps the dialog closed (e.g. on a
validation rejection).

Today's consumers: `FaviconGenerator`, `ImageToBase64`, `SplashScreenGenerator`.

Pick this when the Tool's "first interaction" is a file upload. Pick
[[Tool dialog frame]] when the tile has button trigger(s). Pick
[[Image tool shell]] when the Tool is single-File-in / single-Blob-out (per
its own four invariants). When the Tool produces a batch of `Blob`s rather
than a single one (FaviconGenerator, SplashScreenGenerator), compose this
frame with the [[Batch asset pipeline]] hook — the frame owns the tile and
dialog wiring; the hook owns the upload → process → results → ZIP/download
behavior.

## Tool handoff

A typed cross-tool channel: one Tool publishes a payload that another Tool
consumes on its next mount. Implemented by `publishHandoff` / `consumeHandoff`
(`src/utils/tool-handoff.ts`).

Today's only channel: DB Diagram's "Open in Mermaid Renderer" button publishes
the generated Mermaid syntax under the `'mermaid-renderer'` channel; the
Mermaid Renderer Tool's mount calls `consumeHandoff('mermaid-renderer')` and
seeds its editor.

Carries two invariants:

1. **Channel keys are typed** (`HandoffChannel` union). A typo at the producer
   or consumer fails to compile rather than silently dropping the handoff.
2. **`consume` is read-once** — it returns the payload AND clears it. A second
   call returns null. Stops a stale prefill from leaking into a later mount of
   the same Tool.

Transport is `localStorage`. Producers typically `publishHandoff` then
`window.open` the consumer route — the consumer mounts and `consumeHandoff`
fires within the same tick.

To add a channel: extend `HandoffChannel` in `src/utils/tool-handoff.ts`. The
type-checker will flag any producer or consumer that uses a name not in the
union.

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

## Formatter shell

A Tool whose interaction is "paste source code → pick mode (or dialect)
→ pick indent → see formatted/minified result." Implemented by
`<FormatterShell>` (`src/components/common/formatter/FormatterShell.tsx`).

Today's consumers: `CssFormatter`, `HtmlFormatter`, `SqlFormatter`,
`JavaScriptMinifier`. All four route their compute through
`src/wasm/formatter` (`formatCss`/`minifyCss`, `formatHtml`/`minifyHtml`,
`formatSql`, `formatJs`/`minifyJs`).

The shell wraps the [[Persistent tool field bag]] internally, so all
five of its invariants apply to the `compute` function. Persistence is
required (every consumer gets its own `storageKey`) — a previous
inconsistency where HtmlFormatter persisted but CSS/SQL/JS did not has
been resolved by making persistence the default.

The shell owns: the [[Tool dialog frame]] wiring, the source `FieldForm`
panel, the result `CodeOutput` + `CopyButton` panel, the two-column
layout, the error toast, and the partial-reset semantic (`reset` clears
`source` only, preserves the control fields like `mode`/`dialect`/`indent`).

The Tool's role narrows to its `compute` function, its labels/placeholders,
its `storageKey`, and a `renderControls` render-prop that receives
`{ inputs, result, setFieldsImmediate }` — the Tool builds whatever
controls it needs (mode select, dialect select, indent select, size-savings
stat). The shell hardcodes the layout container around them.

The shell's input type is generic over `<I extends { source: string }>` —
each Tool has its own typed bag (`CssInput`, `HtmlInput`, `SqlInput`,
`JsInput`) with different mode/dialect/indent vocabularies. The constraint
on `source` lets the shell own the input panel + reset/`isEmpty` logic.

Does NOT fit `JsonToTypeScript`: that Tool drives compute from a button
click rather than debounced input change, plus its control row is
toggle buttons + a Generate action — a different interaction shape, not
this family.

## Diff checker shell

A Tool that compares two text-shaped inputs (`original`, `modified`) and
renders the result as a side-by-side row grid plus a copyable unified
diff. Implemented by `<DiffCheckerShell>`
(`src/components/common/diff/DiffCheckerShell.tsx`).

Today's consumers: `TextDiffChecker` (plain text), `JsonDiffChecker`
(validates + normalizes JSON before diffing).

The shell wraps the [[Persistent tool field bag]] internally, so all
five of its invariants (debounced, stale-safe, empty-bypass,
unmount-safe, same-tick partial merge) apply to the `compute` function.
The shell owns: the [[Tool dialog frame]] wiring, the two-column
input layout, the diff-row rendering (`DiffCell` + `renderSpans` for
inline-span highlighting), the unified-diff CopyButton, and the
sticky-header column labels.

The Tool's role narrows to its `compute` function, its labels (title,
placeholders, error toast), its `storageKey`, and an optional
`renderBanner` render-prop that receives the current `result` — Tools
whose compute can return a validation error (e.g. invalid JSON) surface
it through this slot; Tools without validation pass nothing.

The result type is generic (`<R extends DiffOutput>`) so Tools may
extend the minimum `{ rows, unifiedDiff }` shape with extra fields
(`JsonDiffResult` adds `validationError`).

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

## Batch asset pipeline

The behavior sibling of [[Image tool shell]] for Tools that take a single
uploaded `File` and produce a **batch** of derived `Blob` results — preview
grid + per-asset download + ZIP. Implemented by `useBatchAssetPipeline`
(`src/hooks/useBatchAssetPipeline.ts`).

Today's consumers: `FaviconGenerator`, `SplashScreenGenerator`.

A hook, not a UI shell, because the result-panel UI varies too much across
consumers to live behind a render-prop (FaviconGenerator's flat grid vs
SplashScreenGenerator's category tabs + meta-tag/manifest text blocks).
The hook owns wiring; the Tool owns layout.

The hook owns:

- File upload + `mimePrefix` validation + reject toast (rejected uploads
  leave state untouched).
- Source decoding via `loadImageFromFile` → `sourceImage: HTMLImageElement`.
- The source `Blob` URL (`sourcePreview`), revoked when source changes or
  on unmount.
- The `regenerate(process)` lifecycle: stale-safety via `useStaleSafeAsync`
  (newer call wins; older session's result and progress reports are dropped),
  unmount-safety, success/failure toasts.
- A `progress` channel — the `process` callback receives a
  `report(current, total)` argument; stale-session reports are dropped.
- `downloadOne(blob, name)` + `downloadAll(zipName, files)` (the caller
  flattens its generic `results` shape into a `Record<string, Blob | string>`
  map; strings are written verbatim into the ZIP for cases like meta-tag
  HTML or manifest JSON).
- `openFilePicker()` — programmatically opens the OS file picker and routes
  the selection through `upload()`, replacing the per-Tool hidden
  `<input>` + `fileInputRef` pattern.
- `reset()` — bumps the stale-safety session so any in-flight regenerate
  cannot write back over the cleared state.

The Tool owns: rendering (preview cards, tabs, controls), how to flatten
generic `results` for ZIP, and any per-Tool extras (Splash's bg color +
image scale controls + dimension warning + safe-zone overlay).

Does NOT fit:

- Multi-source N-File Tools (e.g. `ImageConvertor`, which has its own
  workflow state machine).
- Inline (no-dialog) image Tools (`ImageCompressor`).
- Single-Blob-out Tools — use [[Image tool shell]].

The `regenerate` lifecycle echoes the [[Tool computation pipeline]] but
sheds debounce + `isEmpty`-bypass: these Tools fire on a button click
(or on upload), never on a debounced input. The stale-safety + unmount-safety
invariants are the same — just composed from `useStaleSafeAsync` directly
rather than from the full pipeline.

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

## Keyboard list navigation

The shared keyboard navigation behavior for any "searchable list of items
the user navigates before picking one." Implemented by `useKeyboardListNav`
(`src/hooks/useKeyboardListNav.ts`).

Owns three concerns:

1. **`activeIndex` tracking** — the highlighted-item state, exposed via
   `activeIndex` and `setActiveIndex` (the React setter — callers reset on
   query change or dropdown close).
2. **ArrowDown/ArrowUp/Enter handling** — a single `handleKeyDown` to wire
   onto the wrapper element. Supports `wraparound: true` (Cmd-K palette
   style) or clamp (default — stays at end / 0).
3. **Auto-scroll** — when `activeIndex` changes, the active child of
   `listRef` is scrolled into view via `scrollIntoView({ block: 'nearest' })`.

Today's consumers: `CommandPalette` (Cmd-K modal, wraparound + initialIndex 0)
and the `TimezoneSearchPicker` sub-component inside `TimezoneConverter`
(inline dropdown, clamp + initialIndex -1).

Per-call-site concerns stay at the call site: the query state and filtering,
Escape key behavior, click-outside dismissal, modal vs inline shell, and item
rendering. Adopters typically chain Escape locally before forwarding the rest
of the keydown event to the hook's `handleKeyDown`.
