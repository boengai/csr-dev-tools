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

The pipeline owns its result, error, and pending state, plus a `recompute()`
primitive that re-fires compute with the last input. The two lower-level
primitives it composes — `useDebounceCallback` and `useStaleSafeAsync` — remain
public for cases that need only one half of the pipeline (non-async debounce;
one-shot async without debounce).

`recompute()` is the named, canonical alternative to the `setInputImmediate(currentInput)` /
empty-partial `setFieldsImmediate({})` idiom — same path, same four
invariants, just vocabulary. Callers that need "fire compute now" (mount
autorun, user-gesture revalidate, post-action refresh) should reach for
`recompute()`; the empty-partial form keeps working but is not the
documented spelling.

Use `recompute()` when the pipeline holds the input (the [[Tool field bag]]
shape, or single-Input Tools that don't read external React state inside
their compute closure). When a wrapper bridges React-side props or local
state into the pipeline on every call — as `<ImageToolShell>` does with
`{ file, controls }` — keep the inline `setInputImmediate({...})` wrapper:
the pipeline's `inputRef` only sees what was last passed in, so a bare
`recompute()` there would re-fire with stale React-side values.

Pipeline failures route through one of three declarative options (mutually
exclusive; precedence `onError` > `errorFallback` > `errorLabel`):

- `errorLabel: 'X'` — always toast `'X'` on rejection, ignoring the error.
  Pick this when the underlying error is implementation-leaking (parser
  stack traces, transpile noise) and the user-facing message should be
  generic. Dominant shape today.
- `errorFallback: 'X'` — toast `err.message` when the rejection is an
  `Error`, otherwise toast `'X'`. Pick this when the compute throws
  user-facing messages (validation, [[Parse-error narrator]]) that should
  reach the user verbatim.
- `onError: (err, input) => …` — full callback. Pick this only when the
  handler needs the input bag (context-specific messages, e.g. HashGenerator
  branching on `algo`) or has side effects beyond toasting (e.g.
  ColorConvertor clearing its display field). When set, the pipeline does
  NOT toast on its behalf.

The hook reads `useToast.getState().showError` lazily inside the catch, so
adopting the toast-emitting options does not subscribe the Tool component
to toast state. The `useToast` hook can therefore disappear entirely from
the Tool when no other code needs `showError`. The previous "manual
`onError: (err) => showError(err instanceof Error ? err.message : 'X')`"
shape that 25+ Tools repeated is replaced by `errorFallback: 'X'` or
`errorLabel: 'X'` — see [[Toast channel]] for the cross-Tool picture.

## Tool field bag

The variant of the [[Tool computation pipeline]] that owns its inputs.
Implemented by `useToolFields` (`src/hooks/useToolFields.ts`).

`useToolComputation` takes a single `Input` value; multi-field Tools that use
it are forced to keep one `useState` per field plus a per-handler bag rebuild
(`setInput({ ...all-other-fields, X: val })`). That double bookkeeping was the
bug surface: forget a field in one handler and the pipeline silently computes
on stale data.

`useToolFields` collapses both. The hook owns a record of fields, exposes
`inputs` for reads, and accepts `setFields(partial)` for writes. Also exposes
`recompute()` — fire compute with the current bag, the named alternative to
the `setFieldsImmediate({})` empty-partial idiom. The pipeline's
four invariants (debounced, stale-safe, empty-bypass, unmount-safe) carry over
unchanged — `useToolFields` is implemented as a thin layer over
`useToolComputation` so the invariants stay defined in one place.

Pick this when a Tool has more than one input field. Pick [[Tool input]]
for single-value Tools where the input mirrors a single React-side value —
the same "owns the input, no parallel `useState`" property, sized for one
field. Keep the unwrapped `useToolComputation` only when the input is built
fresh per change from external React state (the [[N-mirror broadcast]]
shape) or when a wrapper bridges React-side props on every call (the
[[Image tool shell]] shape).

Carries one extra invariant beyond the pipeline:

1. **Same-tick partial updates compose** — back-to-back `setFields(partial)`
   calls in one event handler chain through an internal ref so each call sees
   the previous call's update. The final bag is the union of all partials,
   not just the last one. Compute fires once with the merged bag.

`reset()` restores `inputs` to `options.initial` and routes through
`setFieldsImmediate` so any pending compute is cancelled and `isEmpty`-driven
short-circuits fire synchronously.

`autorunOnMount: true` (option, default `false`) fires `recompute()` once
after mount with `options.initial`. The pipeline's `isEmpty` short-circuit
still applies — if the initial bag passes `isEmpty`, the compute call is
skipped but `recompute()` still routes through the pipeline. Picks up
the seam previously occupied by per-Tool `useMountOnce(() => recompute())`
rituals — non-persisted adopters that want a "fire on mount with the
default bag" hook no longer need to import `useMountOnce`. Today's
adopters: `ColorPaletteGenerator`.

## Tool input

The single-Input variant of [[Tool field bag]]. Implemented by
`useToolInput` (`src/hooks/useToolInput.ts`).

`useToolComputation` is stateless w.r.t. input — Tools using it must keep
one `useState` mirroring the pipeline input and write to both in every
handler (`setSource(val); setInput(val)` in change; `setSource('');
setInputImmediate('')` in reset). Same bug surface as the multi-field
case that motivated [[Tool field bag]]: forget a write in one handler
and the UI desyncs from the pipeline silently. The duplicate-write tax
also leaks into renames at the import site (`setInput` collides with the
local `useState` setter, so callers alias one of them — `setComputeInput`,
`setInputValue` — adding vocabulary the hook should have absorbed).

`useToolInput` collapses both. The hook owns the input value, exposes
`input` for reads, `setInput(val)` for debounced writes, plus
`setInputImmediate(val)`, `recompute()`, and `reset()` (restores `input`
to `options.initial` and routes through `setInputImmediate` so any
pending compute is cancelled and `isEmpty`-driven short-circuits fire
synchronously). The pipeline's four invariants (debounced, stale-safe,
empty-bypass, unmount-safe) carry over unchanged — `useToolInput` is
implemented as a thin layer over `useToolComputation` so the invariants
stay defined in one place.

`autorunOnMount: true` (option, default `false`) fires `recompute()`
once after mount with `options.initial`, mirroring the [[Tool field
bag]] variant.

Pick this when a Tool has a single input value that mirrors a single
React-side state — the bulk of single-Input Tools without persistence.
Pick [[Persistent tool computation]] when that input also persists
across reloads. Keep the unwrapped `useToolComputation` for
[[N-mirror broadcast]] adopters (the input is a discriminated bag
rebuilt per keystroke from React state, not a mirror of it — today:
`ColorConvertor`, `UnitPxToRem`, `AspectRatioCalculator`) and for
shells that bridge React-side props on every call ([[Image tool shell]]
with `{ file, controls }`).

Today's adopters: `MarkdownPreview`, `JwtDecoder`, `UrlParser`,
`Base64ToImage`, `SshKeyFingerprint`, `CertificateDecoder`,
`TextCaseConverter`, `WordCounter`, `CronExpressionParser`,
`UserAgentParser`, `TimeUnixTimestamp` (UnixTimestampSection),
`SvgViewer`.

## Persistent tool field bag

The variant of the [[Tool field bag]] that owns its localStorage
round-trip. Implemented by `useToolFieldsPersisted`
(`src/hooks/persist/useToolFieldsPersisted.ts`).

Composes `useToolFields` with two small concerns the standard pattern
needs every time it persists: read the bag from localStorage on mount
(replacing `options.initial` if a stored value exists) and write back
on every `inputs` change.

Mount autorun fires when EITHER:

- `options.autorunOnMount === true` (explicit, `isEmpty`-independent), OR
- `options.isEmpty` is provided AND the restored bag passes `!isEmpty(bag)`.

The autorun decision lives entirely inside `useToolFields` via its own
`autorunOnMount` option — this hook just computes the effective flag
(`autorunOnMount || isEmpty-gated condition`) and forwards. Without
either condition met, no autorun fires (the caller is explicitly
responsible for triggering the first compute). Picks up the seam
previously occupied by per-Tool `useMountOnce(() => recompute())` rituals
in adopters that have no `isEmpty` rule but still want a mount-time
populate (e.g. `JsonpathEvaluator`).

The four pipeline invariants (debounced, stale-safe, empty-bypass,
unmount-safe) plus the same-tick partial-merge invariant carry over
unchanged — they're defined inside `useToolComputation` /
`useToolFields`, and `useToolFieldsPersisted` does not touch them.

Pick this when a multi-field Tool persists its inputs as a single bag
under one localStorage key. Pick [[Tool field bag]] (`useToolFields`)
when persistence is bespoke or absent (e.g. `<BidirectionalConverter>`'s
per-mode source-keying, or `AesEncryptDecrypt` which doesn't persist).

Today's consumers: `JsonSchemaValidator`, `JsonDiffChecker`,
`JsonpathEvaluator`, `TimezoneConverter`. `JsonpathEvaluator` is the
`autorunOnMount: true` adopter — it has no `isEmpty` rule but still wants
the result populated on mount from the persisted bag.
`TimezoneConverter` is the partial-persistence
shape: its persisted bag holds the converter inputs (sourceTz,
targetTzIds, dateInput, timeInput), but `dateInput`/`timeInput` are
overridden with "now" on mount via a follow-up
`setFieldsImmediate({ dateInput, timeInput })`. The hook does not
need a per-field opt-out — the override is the documented pattern for
"persist some fields, recompute others on each mount."

`ProtobufCodec` deliberately does NOT adopt this hook (per ADR-0005). Its
shape — one persisted 5-field bag in which only `schema` drives compute,
plus two child pipelines (encode, decode) reading slices of that bag — is
the "shared persisted bag + multiple pipelines reading slices" pattern.
`useToolFieldsPersisted` would re-fire `parseProtobufSchema` on every
`encodeSource` keystroke, since the hook does not gate compute on which
field changed. The triad (`useInputLocalStorage` + a single
`useToolComputation` over `schema` + `useMountOnce` priming that parse)
is load-bearing and stays. A second adopter with this shape would justify
a new seam (`usePersistedBagWithSlicePipelines`); one adopter does not.
Other multi-field Tools that once carried a similar-looking triad
(`MermaidRenderer`, `GraphqlSchemaViewer`, `JsonpathEvaluator`,
`ProtobufToJson`, and the formatter family) had a different shape — one
pipeline driven by the bag — and have since migrated to this hook or to
its single-Input sibling [[Persistent tool computation]].

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

The result type is generic (`<R extends ConvertOutput>`) so Tools may
extend the minimum `{ output: string }` shape with extra fields
(`EnvResult` adds `warnings: Array<string>`). Tools whose compute can
surface inline metadata about the source — warnings, validation notes
— render it via the `renderBanner` slot (mirrors [[Diff checker shell]]).
This keeps source-line references on screen while the user reads the
result; [[Toast channel]] is the wrong category for that case because
toasts dismiss before the user can act on the reference.

Each `ConverterMode<M>` may declare `sourceFormat: 'json' | 'yaml' | 'xml'
| 'toml' | 'csv'`. When set, compute failures route through the
[[Parse-error narrator]] before reaching `onError`. Omit for modes whose
source isn't a parseable format (Base64, URL encoding, HTML entities) —
those keep today's "toast `err.message`" behavior.

`modes` is `ReadonlyArray<ConverterMode<M>>` (not a 2-tuple) to admit
Tools that swap between more than two directions; `EnvFileConverter` is
the four-mode adopter (`.env ↔ JSON`, `.env ↔ YAML`).

`initialResult: R` is required (mirrors [[Diff checker shell]]) so
extended `R` types can't render with missing fields before the first
compute resolves.

Today's adopters: `EncodingBase64`, `UrlEncoder`, `JsonToYamlConverter`,
`JsonToXmlConverter`, `JsonToTomlConverter`, `JsonToCsvConverter`,
`HtmlEntityConverter`, `HtmlToMarkdownConverter`, `EscapedJsonStringifier`,
`EnvFileConverter` (the only `renderBanner` user today).

## Parse-error narrator

The single seam that owns the "translate a WASM compute failure into a
human-readable `Invalid <FORMAT>: <reason>` message" concern across the
[[Bidirectional converter]] family. Implemented by `narrateParseError`
(`src/utils/parse-error-narrators.ts`).

Owns a static `Record<SourceFormat, { label, get }>` mapping each known
source format to its parse-error helper from `src/wasm/`:

```ts
type SourceFormat = 'csv' | 'json' | 'toml' | 'xml' | 'yaml'
narrateParseError(format, source): Promise<string | null>
```

Returns the narrated message when `get(source)` returns a non-null
reason, `null` when the source is parse-valid for that format.

The shell consumes it via the gate-on-result invariant: if the active
mode declares `sourceFormat`, the shell wraps the user's `compute` so
that on failure it calls `narrateParseError(fmt, source)` and — only if
the narrator returns non-null — throws `new Error(narrated)`. When the
narrator returns null (source is parse-valid), the original error from
compute flows through unchanged.

The null-gate is load-bearing: it lets Tools throw bespoke shape /
semantic errors (e.g. `JsonToCsvConverter`'s `'JSON must be an array
of objects'` for valid-but-wrong-shape JSON) and have those surface
verbatim, without a sentinel API. The narrator only fires when the
input is actually malformed for the declared format.

Today's adopters (via the shell): `JsonToYamlConverter`,
`JsonToXmlConverter`, `JsonToTomlConverter`, `JsonToCsvConverter`.
Standalone adopters (validate-first compute outside the shell):
`JsonFormatter` (single-Input via `useToolComputationPersisted`),
`YamlFormatter` (multi-field via `useToolFields`). Each wraps the
narrator inline: `const narrated = await narrateParseError(fmt, val);
if (narrated != null) throw new Error(narrated)`. The trailing
`try { format... } catch { throw new Error('Unable to format X') }`
stays inline — it handles format failures on parse-valid input, which
the narrator does not cover.

Pick this when a Tool whose source is one of the five known formats
runs a validate-first compute — whether via [[Bidirectional converter]]
or standalone. The module is shaped for both call shapes (the shell
gates on the narrator returning non-null; standalone callers do the
same check inline).

## Formatter shell

A Tool whose interaction is "paste source code → pick mode (or dialect)
→ pick indent → see formatted/minified result." Implemented by
`<FormatterShell>` (`src/components/common/formatter/FormatterShell.tsx`).

Today's consumers: `CssFormatter`, `HtmlFormatter`, `SqlFormatter`,
`JavaScriptMinifier`, `JsonFormatter`, `YamlFormatter`. All six route
their compute through `src/wasm/formatter` (CSS/HTML/SQL/JS) or
`src/utils` (`formatJson` / `formatYaml`); the JSON / YAML pair also
wraps the compute through [[Parse-error narrator]] before reaching the
shell's `errorFallback`.

The shell wraps the [[Persistent tool field bag]] internally, so all
five of its invariants apply to the `compute` function. Persistence is
required (every consumer gets its own `storageKey`) — a previous
inconsistency where HtmlFormatter persisted but CSS/SQL/JS did not has
been resolved by making persistence the default. JSON and YAML joined
the family in a later pass; the pre-migration JSON key
(`csr-dev-tools-json-formatter-source`, raw-string shape from
`useToolComputationPersisted`) was retired in favor of
`csr-dev-tools-json-formatter` (JSON-bag shape) — reusing the old key
would have corrupted on first read because the shape is different.

The shell owns: the [[Tool dialog frame]] wiring, the source `FieldForm`
panel, the result `CodeOutput` + `CopyButton` panel, the two-column
layout, the error toast, the optional `renderBanner` slot that surfaces
pipeline errors inline above the split (used by `JsonFormatter` and
`YamlFormatter` to keep their [[Parse-error narrator]] message on
screen instead of toast-truncated), and the partial-reset semantic
(`reset` clears `source` only, preserves the control fields like
`mode`/`dialect`/`indent`).

`renderBanner?: (error: unknown) => ReactNode` mirrors the same-named
slot on [[Diff checker shell]] / [[Bidirectional converter]], but reads
from the pipeline's `error` state rather than from `result` — formatter
parse failures throw (no valid result), so the banner source is the
rejected error. Setting the slot suppresses `errorFallback`/`errorLabel`
toast routing — the banner replaces the toast (same content, two
channels would duplicate). CSS/HTML/SQL/JS-minifier opt out and keep
their `errorFallback`/`errorLabel` toast — their compute throws opaque
errors that don't reward an inline display.

The Tool's role narrows to its `compute` function, its labels/placeholders,
its `storageKey`, and a `renderControls` render-prop that receives
`{ inputs, result, setFieldsImmediate }` — the Tool builds whatever
controls it needs (mode select, dialect select, indent select, size-savings
stat). `renderControls` is omitted entirely by JsonFormatter (no extra
controls — its bag is `{ source: string }`). The shell hardcodes the
layout container around the slot.

`resultLabel` (optional, default `'Result'`) names the result pane
header and the CopyButton's accessible label. CSS/HTML/SQL/JS take the
default; JSON and YAML pass `'Formatted JSON'` / `'Formatted YAML'`
because the bare "Result" reads too generically next to a syntax-aware
output panel.

The shell's input type is generic over `<I extends { source: string }>` —
each Tool has its own typed bag (`CssInput`, `HtmlInput`, `SqlInput`,
`JsInput`, `YamlInput`, plus the trivial `{ source: string }` for
JsonFormatter) with different mode/dialect/indent vocabularies. The
constraint on `source` lets the shell own the input panel +
reset/`isEmpty` logic.

Does NOT fit `JsonToTypeScript`: that Tool drives compute from a button
click rather than debounced input change, plus its control row is
toggle buttons + a Generate action — a different interaction shape, not
this family.

## Markup to PDF shell

A Tool whose interaction is "paste source markup → see compiled PDF
preview + download" via the Typst WASM pipeline. Implemented by
`<MarkupToPdfShell>` (`src/components/common/pdf/MarkupToPdfShell.tsx`).

Today's consumers: `HtmlToPdf`, `MarkdownToPdf`. Both route their
compute through `src/wasm/pdf.ts` (`compileHtmlToPdf` /
`compileMarkdownToPdf`); both produce `CompileResultDto`
(`{ svgs: string[]; pdf: Uint8Array }`).

The shell wraps the [[Persistent tool computation]] internally — restore-
on-mount + autorun-on-non-empty come for free. Persistence is required
(every consumer gets its own `storageKey`), matching the [[Formatter
shell]] doctrine that retired the prior persist-some-tools-not-others
divergence.

Carries three invariants beyond the pipeline's four:

1. **The `CompileResultDto` empty shape** — `{ svgs: [], pdf: new
   Uint8Array(0) }` paired with `isEmpty: trim().length === 0`. Both
   move together; either side alone would flash stale output during the
   empty-bypass window.
2. **Download/preview share one dto** — `<DownloadPdfButton bytes={result.pdf}>`
   and `<PdfSvgPreview pages={result.svgs}>` are two views of one compile.
   A future adopter cannot wire them to different sources.
3. **Stale output is suppressed on error** — when the pipeline's `error`
   is non-null, the shell hides both `<DownloadPdfButton>` and
   `<PdfSvgPreview>` and renders an inline `<ErrorBanner
   variant="warning">` carrying `err.message` (or `'Failed to render
   PDF'` when the rejection is not an `Error`). Prevents downloading
   bytes that don't match the displayed source. Distinct from the
   pipeline default — `useToolComputation` leaves `result` untouched on
   rejection, so without the shell the prior-success preview and download
   silently linger.

Input is concretely `string` — both today's adopters need only the
source markup. If a third adopter requires extras (`pageFormat`,
`includeToc`, Typst preamble), swap the internal primitive from
[[Persistent tool computation]] to [[Persistent tool field bag]] and
migrate adopters — ~5 lines per adopter, no behavior change. The
breadcrumb lives in the shell's module-level comment alongside the
`EMPTY_RESULT` constant.

Does NOT fit: the bytes-PDF Tools (`ImageToPdf`, `CombinePdf`). They
consume `<PdfBytesPreview>` (pdfjs-decoded async-rendering of arbitrary
PDF bytes), not `<PdfSvgPreview>` (statically-rendered Typst-emitted
SVG strings) — that family is owned by [[Sortable PDF shell]], with
[[Sortable item bag]] as its underlying items primitive. Also does
NOT fit Tools whose source isn't markup (e.g. an image-to-PDF or a
data-table-to-PDF Tool would shape a different shell).

## Sortable PDF shell

The bytes-PDF sibling of [[Markup to PDF shell]] — a Tool whose interaction
is "upload N files → re-order them → see compiled PDF preview + download."
Implemented by `<SortablePdfShell>` (`src/components/common/pdf/SortablePdfShell.tsx`).

Today's consumers: `ImageToPdf`, `CombinePdf`. Both route compute through
`src/utils/...` (`imagesToPdf` / `combinePdfPages`); both produce
`BytesPdfResult` (`{ pdf: Uint8Array; pageCount: number; skipped: Array<string> }`).

The shell wraps [[Tool computation pipeline]] (unwrapped — the input bag
`{ items, extras }` is rebuilt per change from internal `useSortableItems`
items + Tool-owned extras), [[Sortable item bag]] (items + skipped + dnd-kit
envelope), and [[Tool dialog frame]] (dialog + title + triggers + onReset).
All four pipeline invariants (debounced, stale-safe, empty-bypass,
unmount-safe) apply to the `compute` function unchanged.

Carries three invariants beyond the pipeline's four:

1. **The `BytesPdfResult` empty shape** — `{ pdf: new Uint8Array(0),
   pageCount: 0, skipped: [] }` paired with `isEmpty: items.length === 0`.
   Both move together; either side alone would flash stale output during
   the empty-bypass window. Mirrors [[Markup to PDF shell]] invariant 1.
2. **Download/preview share one result** — `<DownloadPdfButton bytes={result.pdf}>`
   and `<PdfBytesPreview bytes={result.pdf}>` are two views of one compile.
   A future adopter cannot wire them to different sources.
3. **Stale output is suppressed on error** — when the pipeline's `error`
   is non-null, the shell hides both `<DownloadPdfButton>` and
   `<PdfBytesPreview>` and renders an inline `<ErrorBanner variant="warning">`
   carrying `err.message` (or `'Failed to generate PDF'` when the rejection
   is not an `Error`). Prevents downloading bytes that don't match the
   displayed source. Distinct from the pipeline default —
   `useToolComputation` leaves `result` untouched on rejection, so without
   the shell the prior-success preview and download silently linger.

The shell does NOT pass `errorLabel` / `errorFallback` / `onError` to the
underlying pipeline — the banner replaces the toast (same content, two
channels would duplicate). Mirrors [[Formatter shell]]'s discipline (see
[[Toast channel]] section).

The Tool's role narrows to:

- `compute(items, extras): Promise<BytesPdfResult>`
- `renderCard(item, { position, onRemove, update })` — per-card chrome
- `onAcceptedFiles(files, { addItems, rejectFiles })` — sync push or async
  expansion. The shell handles the up-front extension filter; the callback
  receives only the accepted set. Cumulative async-failure rejects use the
  functional updater on `rejectFiles`.
- Optional: `renderExtraCards()` for non-sortable cards interleaved with
  the grid (`CombinePdf`'s `LoadingCard` placeholders during async
  `readPdfPages`), `initialExtras` + `renderControls()` for a controls slot
  in the right-pane top row (`ImageToPdf`'s `onePerPage` checkbox),
  `onReset()` for Tool-owned cleanup after the shell resets items+extras.
- Metadata: `title`, `triggers`, `description`, `filenameSlug`, `accept`,
  `extensionRe`, `uploadButtonLabel`, `uploadInputName`.

`filenameSlug` (required) is interpolated as
`csr-dev-tools_${filenameSlug}_${Date.now()}.pdf`. The shell-internal
exception to ADR-0023 (filename minting stays inline) follows the same
precedent set by [[Markup to PDF shell]]: when the shell owns the download
button, the minting moves with it.

`BytesPdfResult` is fixed at the shell's interface (not generic over `R`).
Both adopters' result shapes are already byte-for-byte identical; a future
adopter with a different result shape would not fit this shell. The
asymmetry with [[Diff checker shell]] (generic `R extends DiffOutput`) is
load-bearing: there, two adopters genuinely diverged (`JsonDiffChecker`
adds `validationError`). Here they do not.

Does NOT fit: Tools whose source is markup rather than files (use
[[Markup to PDF shell]]); Tools whose result is multiple PDFs or
non-PDF artifacts (no current shell — would warrant a new one); inline
(non-dialog) PDF Tools (none today).

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
the `process` function. The shell **owns the controls bag** — mirroring
[[Tool field bag]] semantics — alongside the dialog, the file UploadInput +
MIME validation, source and result `Blob` URL lifecycles (via [[useBlobUrl]]),
and the Download button + filename. The Tool declares `initialControls` and a
`process(file, controls)` function; the bag's live value lives in the shell.

`process` receives the raw `File`, not a pre-decoded `HTMLImageElement` —
distinct from the sibling [[Batch asset pipeline]] which decodes once at
upload and passes the decoded image to its process callback. The asymmetry
is load-bearing: batch consumers (`FaviconGenerator`,
`SplashScreenGenerator`) draw the same source to many canvas sizes per
run, so up-front decode is essential. Single-Blob consumers each own
decode at the layer that has the right context — `ImageCropper` reads the
preview `<img>` via `imgRef` (which ReactCrop needs DOM-attached anyway),
`BackgroundRemover` delegates to `RawImage.fromBlob` inside
`@huggingface/transformers`, and `ImageResizer` delegates to `resizeImage`
/ `processImage` in `@/utils/image.ts`. The shell deliberately does not
pre-decode.

`renderControls` and `renderPreview` ctx both carry `{ controls,
setControls(partial) }`. `setControls` IS the recompute trigger — every
partial merges into the live bag (ref-based, same-tick partials compose) and
routes through the pipeline. A contributor cannot forget to recompute. ADR-0014
records the migration from the prior React-side-owned shape (see ADR-0009 for
the original design and why it was superseded).

The `renderPreview` ctx additionally carries `{ pending, error, source,
sourceUrl, result, resultUrl }`; the Tool decides per-phase rendering instead
of a separate processing slot. Both ctxs also expose `recompute()` for the
escape-hatch case: a Tool whose result depends on non-controls React state
(`ImageCropper`'s `imgRef`, `BackgroundRemover`'s `strippedCacheRef`) and
needs to re-fire compute without changing the bag — e.g. after `<img onLoad>`
populates `imgRef`.

The shell auto-resets controls to `initialControls` on dialog close. The
Tool's `onAfterDialogClose` callback handles per-Tool non-controls cleanup
(refs, UI-only state like the live drag `crop` in `ImageCropper`).

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
- Source decoding via `loadImageFromBlob` → `sourceImage: HTMLImageElement`.
  The canonical decode primitive: takes any `Blob` (File, SVG-as-Blob,
  segmenter-output-Blob), owns its objectURL revoke lifecycle, returns the
  fully-loaded element. Adopters today: this pipeline, `processImage`,
  `imageFileToBase64`, `base64ToImageInfo` (decodes the dataUri via
  `fetch(dataUri).then(r => r.blob())` first), `applyBackground`
  (in `background-removal.ts`), `svgToPng` (in `mermaid-renderer.ts`),
  and `ImageColorPicker`. ImageConvertor's preview loop deliberately
  bypasses it — see ADR-0017.
- The source `Blob` URL (`sourcePreview`) — derived via [[useBlobUrl]] so
  the revoke-previous-then-create-next + revoke-on-unmount lifecycle lives
  in one module shared with the [[Image tool shell]].
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

- Multi-source N-File Tools producing a single result — use
  [[Sortable item bag]] (today: `ImageToPdf`, `CombinePdf`).
  `ImageConvertor` (N-in / N-out with a workflow state machine) is its
  own shape, kept inlined per ADR-0002.
- Inline (no-dialog) image Tools (`ImageCompressor`).
- Single-Blob-out Tools — use [[Image tool shell]].

The `regenerate` lifecycle echoes the [[Tool computation pipeline]] but
sheds debounce + `isEmpty`-bypass: these Tools fire on a button click
(or on upload), never on a debounced input. The stale-safety + unmount-safety
invariants are the same — just composed from `useStaleSafeAsync` directly
rather than from the full pipeline.

## Sortable item bag

The hook seam that owns a re-orderable array of items for "N files in,
single result out" Tools — the inverse-shape sibling of [[Batch asset
pipeline]] (which is "1 file in, N results out"). Implemented by
`useSortableItems` (`src/hooks/useSortableItems.ts`).

Adapter shape:

```ts
useSortableItems<T extends { id: string }>(initial?: Array<T>) => {
  items, skipped,
  addItems, rejectFiles, removeItem, updateItem, reset,
  dndContextProps, sortableContextProps,
}
```

Owns three concerns that the two consumer Tools (`ImageToPdf`,
`CombinePdf`) previously hand-rolled in parallel:

1. **Items state** — `Array<T & { id }>` with `addItems(next)`,
   `removeItem(id)`, `updateItem(id, partial)`, `reset()`. `updateItem`
   is the [[Tool field bag]] `setFields`-equivalent for arrays: the
   duplicate-write tax of `setItems(prev => prev.map(i => i.id === id ?
   { ...i, ...partial } : i))` is absorbed at the seam so a contributor
   cannot forget the map. `addItems` accepts a pre-built array (caller
   mints ids via `crypto.randomUUID()` or its expansion step's output).
2. **Skipped-files tracking** — `skipped: Array<string>` updated via
   `rejectFiles(names)`. The seam owns the state; the consumer Tool
   decides whether to render `<ErrorBanner variant="warning">Skipped N
   unsupported files: ...</ErrorBanner>` or another shape. Naming the
   state concentrates "files came in, some accepted, some rejected" at
   one address.
3. **dnd-kit envelope** — `dndContextProps` (`PointerSensor` +
   `KeyboardSensor`-with-`sortableKeyboardCoordinates`,
   `collisionDetection: closestCenter`, `onDragEnd` that calls
   `arrayMove` on the items by stable id) and `sortableContextProps`
   (items id list + `rectSortingStrategy`). Spread onto `<DndContext>`
   and `<SortableContext>` at the call site. The companion
   [[SortableCard]] component owns the per-card chrome.

Does NOT own the result pipeline. Each consumer adopts [[Tool
computation pipeline]] (or its `useToolInput<Array<T>>` /
`useToolFields` variant) over `items` separately. Bundling pipeline +
items would wrap two named seams; keeping them distinct preserves the
four pipeline invariants in one place. The pipeline migration is the
natural follow-up commit after this seam lands.

Does NOT own per-file expansion. `CombinePdf`'s `readPdfPages` →
1-PDF-becomes-N-cards flow (with bespoke `LoadingCard` placeholders
during read) stays inline — only one of two adopters needs it. Adopters
await the expansion, then call `addItems(pageItems)` once resolved.

Pick this when a Tool's input shape is "N files in, re-orderable, single
result out." Pick [[Batch asset pipeline]] when it's the inverse (one
file in, N results out). Pick [[Tool field bag]] when the inputs are a
fixed keyed bag (no re-ordering, no add/remove).

## SortableCard

The compound component the [[Sortable item bag]] consumer Tools render
to wrap each item in the re-orderable grid. Implemented by
`<SortableCard>` (`src/components/common/list/SortableCard.tsx`).

Composition:

```tsx
<SortableCard id={item.id} onRemove={() => removeItem(item.id)}>
  <SortableCard.Handle>
    {/* drag-area interior — typically an <img> thumbnail */}
  </SortableCard.Handle>
  {/* Tool-owned metadata + per-Tool extras
      (page number, filesize, rotate badge, etc.) */}
</SortableCard>
```

Owns:

- The outer chrome (`group relative flex w-32 flex-col gap-2 rounded-lg
  border border-gray-800 bg-gray-950 p-2`). The `relative` is the
  positioning context for any absolute-positioned badge siblings the
  Tool adds.
- The `useSortable({ id })` wiring: `setNodeRef`, plus the style derived
  from `CSS.Transform.toString(transform)` + `transition` + `opacity:
  isDragging ? 0.4 : 1`.
- The `<SortableCard.Handle>` child slot — owns the `cursor-grab
  aspect-square overflow-hidden rounded bg-gray-900` chrome AND the
  `useSortable` `attributes` + `listeners` spread, so the handle is the
  grab target (not the whole card).
- The remove badge — absolute-positioned 24×24 hover-only circle in the
  top-right, rendered only when `onRemove` is provided. Consolidates
  the "raw button: absolute-positioned 24×24 hover-only circle" shape
  that previously lived twice.

Per the common-component rule, future variances must be a named prop —
not a `className` override. ImageToPdf's rotate badge is an
absolute-positioned sibling of `<SortableCard.Handle>` inside the card
body, not a `<SortableCard>` knob; if a second adopter needs a similar
secondary badge, raise a named `secondaryBadge` slot then.

Today's adopters: `ImageToPdf`'s `ImageCard`, `CombinePdf`'s `PageCard`.

## useBlobUrl

The single seam that owns a `Blob`'s object-URL lifecycle. Implemented by
`useBlobUrl` (`src/hooks/useBlobUrl.ts`).

Given a `Blob | null`, returns a `string | null` that is the current
object URL. The previous URL is revoked when the blob changes or on
unmount. The single invariant — "for every `createObjectURL`, exactly
one `revokeObjectURL` runs by the time the blob changes or the consumer
unmounts" — is the load-bearing one: forgetting to revoke leaks memory
across long sessions, and a single Blob is the natural unit at which the
lifecycle is decidable.

Today's adopters:

- [[Image tool shell]] — source `File` URL and result `Blob` URL.
- [[Batch asset pipeline]] — source `File` URL (`sourcePreview`).

`ImageColorPicker` previously adopted this hook for its preview URL but
now decodes directly via `loadImageFromBlob` (which owns its own URL
lifecycle internally), so it no longer needs a separate preview URL.

## useMediaQuery

The single seam that subscribes a React component to a CSS media query.
Implemented by `useMediaQuery` (`src/hooks/useMediaQuery.ts`).

```ts
useMediaQuery(query: string, ssrDefault?: boolean): boolean
```

Owns three concerns:

1. **SSR-safe initial** — the lazy `useState` initializer reads
   `window.matchMedia(query).matches` synchronously when `window` exists,
   so the first render already has the right boolean. Without this, an
   adopter that gates layout by viewport flashes the desktop layout for
   one frame on mobile.
2. **Subscription with cleanup** — listens for `change`, removes the
   listener on unmount or when `query` changes.
3. **Prerender control via `ssrDefault`** — when `window` is absent
   (Vite's prerender pass, Node tests, SSR), the initial value falls
   back to `ssrDefault` (default `false`). Adopters whose layout differs
   by viewport pick the *desktop* default explicitly so the prerendered
   HTML matches the hydration value for the desktop majority — see
   [[DiagramEditor]]'s tablet gate for the canonical adopter.

Today's adopters:

- `<DbDiagram>` — `useMediaQuery('(min-width: 48rem)', true)`. The
  `MobileBlocker` ships only on hydration when the viewport is sub-tablet;
  `ssrDefault: true` keeps the prerender rendering the workspace.
- `<Sidebar>` — `useMediaQuery('(max-width: 767px)')`. The mobile width
  class is purely additive (`w-full` vs `w-[260px]`), so `ssrDefault: false`
  (desktop layout assumed) is correct; the hydration step fixes the value
  for mobile users without a layout flash.

Both adopters query the Tailwind `tablet:` breakpoint (48rem ↔ 767px) —
same boundary, opposite directions. The query string is spelled out at
each call site today; if a third adopter lands, a `breakpoints.tablet`
constant exported from a Tailwind-config-driven module would consolidate
the boundary value.

Distinct from `useKeyboardShortcut`, `useTimeoutRef`, and other small
named hooks on the same shelf — each owns one cross-cutting concern.

## loadNamed

The single seam that adapts a dynamic-import loader of a module with a
named export to the `{ default: T }` shape `React.lazy` requires.
Implemented by `loadNamed` (`src/utils/load-named.ts`).

```ts
loadNamed(() => import('@/x/Y'), 'Y'): () => Promise<{ default: typeof Y }>
```

Absorbs the `import(...).then(({ Name }: { Name: ComponentType }) =>
({ default: Name }))` ceremony that was inlined at 85 sites — 80 entries
in `src/constants/tool-registry.ts` (every Tool's lazy loader) and 5 in
`src/App.tsx` (CommandPalette, Sidebar, SettingsDialog, ToastProvider,
TwinkleStarsAnimate). The type `K extends keyof M` makes the export-name
lookup type-checked: a typo fails at typecheck rather than at
`React.lazy`'s first render.

The name still appears twice per adopter (in the import path and as the
export key) — TypeScript can't introspect module exports at runtime, so
the export-key string is unavoidable. The win is removing the
`{ Name: ComponentType }` annotation and the `({ default: Name })`
reshaping, collapsing 3 lines per registry entry to 1.

## Worker bridge

The single seam that owns the message-correlated `Promise` bridge to a
Web Worker. Implemented by `createWorkerBridge`
(`src/wasm/worker-bridge.ts`).

```ts
createWorkerBridge<TReq extends object>(
  workerFactory: () => Worker,
): { call: <TRes = unknown>(payload: TReq) => Promise<TRes> }
```

Today's adopters: `src/wasm/bcrypt.ts`, `src/wasm/pdf.ts`. Both
previously hand-rolled the same `let worker; let msgId; getWorker();
callWorker(data)` plumbing — ~25 lines apiece — and neither concentrated
the four invariants the pattern carries:

1. **`msgId` correlation** — each `.call(...)` gets a unique id; responses
   are matched by id, so concurrent calls cannot swap results.
2. **Listener removal on receipt** — the per-call handler is removed
   before resolving/rejecting; the worker never accumulates stale
   handlers across the page lifetime.
3. **Error envelope** — `{ id, error }` → `reject(new Error(error))`;
   `{ id, result }` → `resolve(result)`. A worker-thrown error can't be
   mistaken for a successful empty result.
4. **Lazy singleton construction** — `workerFactory` runs once on the
   first `.call(...)`, not at module import. Facades imported into Tools
   the user never visits pay zero worker-construction cost.

The wire shape is codified as
`WorkerResponse<T> = { id: number; result: T } | { id: number; error: string }`
and re-exported so the worker file (`src/workers/*.worker.ts`) can type
its `self.postMessage` calls. The worker side of the protocol — the
`try { ensureInit(); doWork(); postMessage({ id, result }) } catch (err)
{ postMessage({ id, error: err.message }) }` shape — stays inlined per
worker (≤36 lines each); extracting it is the kind of tidying ADR-0018
declined for the `src/wasm/` facade family.

The bridge takes a factory (not a URL or instance) because Vite's worker
resolution requires the literal pattern `new Worker(new URL('./literal',
import.meta.url), { type: 'module' })` at the call site — Vite statically
parses that syntactic form to bundle the worker file. The facade owns
the URL literal; the bridge owns everything else.

`isNode` branches stay per-facade. Vitest/Node tests load the WASM
module directly via `loadWasm` (no worker) to keep tests
synchronous and portable; the worker bridge runs only in the browser
build. The bridge module itself is testable in plain Node via a
`MockWorker` stand-in — see `src/wasm/worker-bridge.spec.ts` for the
four-invariant coverage.

Distinct from `loadWasm` (`src/wasm/init.ts`), which owns the
`loadWasm<T>(name)` cache + Node-vs-browser WASM bootstrap and is shared
by every facade in `src/wasm/` (worker-isolated or not). The bridge
layers on top of (or beside) `loadWasm` for the subset of facades whose
compute is heavy enough to warrant worker isolation.

## Toast channel

The ephemeral notification channel for events that happen *to* a user
action — not events that are part of the result the user is reading.
Implemented by `useToast` (`src/hooks/state/useToast.ts`) as a Zustand
store with exactly two methods: `showError(label)` and
`showSuccess(label)`. 44 adopters across `feature/` and `common/`, ~122
call sites.

Carries two invariants:

1. **Ephemeral** — toasts dismiss on their own; consumers never read the
   toast state back. Fire-and-forget. No "click to acknowledge," no
   "blocking until dismissed," no "with action" semantics.
2. **Out-of-band** — a toast does not replace the result. A failed
   compute that toasts an error still resolves the pipeline's `result`
   (typically to `initial`); the user sees the empty result panel plus
   the toast, not a result panel replaced by an error message.

Three categories cover every `showError` adopter:

- **Async-pipeline failures** — wired declaratively via the
  `errorLabel` / `errorFallback` options on [[Tool computation pipeline]] /
  [[Tool field bag]] / [[Async action]]. The pipeline catches the
  rejection and calls `useToast.getState().showError` lazily inside the
  catch; the Tool component does not import `useToast` for this path.
  The bulk of adopters (25+ today). Sites that need the input bag or
  side effects beyond toasting (HashGenerator, ColorConvertor,
  StringEscapeUnescape) still pass the full `onError: (err, input) => …`
  callback and continue to `useToast()` at the call site.
- **Inline validation rejections** — synchronous "your input is
  unusable" rejections in event handlers (`'Maximum dimension is
  ...'`, `'Please enter JSON input'`, `'Upload a valid image file'`).
  These remain `useToast()` adopters because they fire outside any
  pipeline.
- **Read / parse rejections** — file-read failures (`'Failed to read
  file'`), schema-parse errors not tied to a pipeline.

`showSuccess` is narrower — exclusively *download confirmations*
(`'Downloaded mermaid-diagram.png'`), *generation summaries* (`'Generated
5 UUIDs'`), and *detection notifications* (`'Auto-detected format:
binary'` from `ProtobufCodec`). It is not used for "compute succeeded" —
successful pipelines render their result; that IS the success signal.

Download confirmations are factored into [[useDownload]]
(`src/hooks/useDownload.ts`) — sibling of `useCopyToClipboard`. The hook
exposes four methods (`downloadBlob`, `downloadDataUrl`, `downloadSvg`,
`downloadPemFile`) that each invoke the corresponding `src/utils/download.ts`
helper and fire the `Downloaded ${filename}` toast. All Tool-side download
paths route through it; the lower-level utils stay reachable for non-React
sites (none today) but no caller wires `showSuccess` inline after a download.

Does NOT fit: **validation errors that are part of the result the user
is reading**. When the compute can fail in a way the user must inspect
alongside their input (e.g., `JsonDiffChecker` showing "Invalid JSON at
line 3" next to the two text panes), the error belongs inline — not in
a toast that disappears. [[Diff checker shell]] exposes `renderBanner`
exactly for this case; today's only consumer is `JsonDiffChecker`'s
`validationError` field. A toast would lose the context (which input was
malformed) and dismiss before the user could act on it.

The surface is intentionally minimal — two methods, two colors. No
`showInfo`, no `showWarning`, no `dismissable` / `persistent` /
`withAction` options. Anything that needs richer semantics belongs in an
inline banner or a result-panel state, not stretched onto this channel.

Carries one timing note callers must understand: the URL is set inside a
`useEffect`, so the first render after a new non-null blob still sees
`null`; the second render sees the URL. Consumers that need an `<img
src>` should already be gating on the URL being non-null (a brief absent
tile is preferable to a flashed broken image). When a consumer needs the
URL synchronously in the same commit as the blob (e.g. to return it from
an event handler), it must call `URL.createObjectURL` itself and accept
the manual revoke responsibility.

## SplitPanel

The responsive two-pane layout primitive used wherever a Tool puts a
source and a result side-by-side. Implemented by `<SplitPanel>` and its
`<Pane>` child (`src/components/common/layout/`).

Owns: the outer responsive flex (column on mobile, row at `tablet:`),
the dashed divider that flips border direction at the same breakpoint,
and the per-pane envelope. The load-bearing invariant is
`min-h-0 min-w-0` on every `Pane` — without it, a nested `CodeOutput`
or `FieldForm` breaks overflow inside `min-h-0` ancestor flex
containers. That contract now lives in one module with a spec; the
copy-paste form has been retired from every Tool site.

`Pane` exposes five named knobs for the real variances seen across
adopters:

- `live` — adds `aria-live="polite"`. Pick this for the result pane.
- `gap` — `'sm' | 'md' | 'lg'` → `gap-2` / `gap-3` / `gap-4`. Default `sm`.
- `align` — `'start' | 'center'`. Cross-axis (horizontal) alignment.
  Pick `center` for image-output panes (e.g. `Base64ToImage`).
- `justify` — `'start' | 'center'`. Main-axis (vertical) alignment.
  Pick `center` when the result pane should vertically center its
  content (e.g. `PlaceholderImageGenerator`'s preview, which can be
  smaller than the available pane height).
- `scroll` — adds `overflow-y-auto` for panes whose content can grow
  beyond viewport height (e.g. `JwtDecoder`'s decoded JSON).

`SplitPanel` accepts any number of `Pane` children and interleaves the
divider between consecutive panes. In practice every adopter is
two-pane; the N-child handling is defensive, not a feature.

[[Diff checker shell]] does NOT fit `SplitPanel`: its layout is "two
inputs side-by-side (no divider) + horizontal divider + single
full-width diff output." The three inner pane envelopes (Original
input, Modified input, Diff output) ARE standalone `<Pane>` adopters
— `SplitPanel` would interleave dividers that this shape doesn't
want. The outer row container stays hand-rolled because `<Pane>`'s
`flex-col` invariant conflicts with the `tablet:flex-row` 2-column
layout the shell wants for its two inputs.

Standalone `<Pane>` use is the documented path for any single result
pane that needs the overflow envelope without a paired source pane
(today's adopters include `LoremIpsumGenerator`, `PasswordGenerator`,
`UuidGenerator`, `RegexTester`, `ImageToBase64`,
`PlaceholderImageGenerator`, the encode dialog inside
`DataUriGenerator`, and the three pane wrappers inside
[[Diff checker shell]]).

Per the common-component rule, future variances must be a new named
prop on `Pane`, not a `className` override.

## Disclosure panel

The single seam for the recurring "▶ Label → animated reveal of an
inline reference/help panel" shape. Implemented by `<DisclosurePanel>`
(`src/components/common/disclosure/DisclosurePanel.tsx`).

Owns: the open/close `useState`, the trigger button (with the
gray-400-to-200 hover, the focus-visible ring, and the
`before:inset-y-[-8px]` invisible-padding hover-target inset), the
rotating chevron, the `<AnimatePresence>` + `<m.div>` height/opacity
animation (`duration: 0.2`), the panel chrome
(`rounded border border-gray-800 bg-gray-950`), and the
`aria-expanded` / `aria-controls` wiring against a `useId()`-minted
panel id rendered on a stable wrapper so the relationship survives the
exit animation.

The caller's role narrows to a `label: string` and the panel
`children`. One named knob: `padding: 'none' | 'md'` (default `'md'`).
Pick `padding="none"` when the children render their own internal
padding (e.g., a `<table>` whose `<th>`/`<td>` already pad); pick
`padding="md"` for the typical text/list body.

Today's adopters:

- `JsonpathEvaluator` (`<DisclosurePanel label="JSONPath Cheatsheet" padding="none">`)
- `MermaidRenderer` (`<DisclosurePanel label="Syntax Reference">`)

Does NOT fit:

- Modal-style overlays — those are [[Tool dialog frame]] /
  `<ToolDialogShell>` territory; disclosures are inline.
- Animated banners that toggle on data (e.g.,
  `MermaidRenderer`'s `errorMessage` banner) — those animate in
  response to state outside the user's direct click and are not user-
  toggled; they stay as inline `<AnimatePresence>` blocks.
- Persistent "show/hide" preferences across sessions — no `defaultOpen`
  prop today; add one when a real adopter needs it.

Per the common-component rule, future variances (different padding
scales, an `aria-label` override for the button, etc.) must be named
props on `<DisclosurePanel>`, not className overrides.

## Inline labeled row

The single seam for the recurring horizontal `[label · mono-value + copy]`
cell shape. Implemented by `<InlineLabeledRow>`
(`src/components/common/output/InlineLabeledRow.tsx`).

Owns: the chrome (`rounded border border-gray-800 bg-gray-950 px-3 py-2
flex items-center justify-between gap-2`), the label slot
(`text-body-xs text-gray-400`), the mono value slot
(`font-mono text-body-xs text-gray-200`), the inline `<CopyButton>` on
the right, and two conditional render rules:

1. **Hide when display is empty** — if the computed display
   (`displayValue ?? value`) is empty, render nothing. Lets callers
   render a row per field without inline gating for "no value AND no
   fallback" cases.
2. **Hide copy button when value is empty** — if `value` is empty
   (even when `displayValue` is a synthetic fallback like `"default"`
   for a missing port), suppress the copy button. Nothing to copy.

The caller's role narrows to three props:

```ts
type InlineLabeledRowProps = {
  label: string
  value: string                  // canonical (clipboard + display by default)
  displayValue?: string          // override what's shown (defaults to value)
}
```

Today's adopters:

- `SshKeyFingerprint` (5 cells: Key Type, Bit Size, Comment, SHA256, MD5)
- `UrlParser` (5 cells: Protocol, Hostname, Port, Path, Hash)

Does NOT fit (kept bespoke per ADR-0007):

- `CertificateDecoder`'s local `<ResultRow>` — has a `mono` toggle (not
  all rows are mono) and a `copyValue` override (display text vs
  clipboard text differ, e.g., `"2026-05-16 (in 5 days)"` displays,
  `"2026-05-16"` copies). Extending to absorb it reintroduces the
  4-knob unified shell ADR-0007 rejected.
- `IpSubnetCalculator` — stacked label-above-value with conditional
  RFC pill inside the value slot. Different shape.
- `ChmodCalculator` — `<code>`-element value, no label. Different shape.
- [[Mono output cell]] — the vertical sibling already in `common/output/`
  for the "label + copy on top, value box below" shape (2 adopters:
  `HashGenerator`, `HmacGenerator`).

Per the common-component rule, future variances (a `mono` toggle, a
`suffix` slot, an icon prefix) must be named props — not a `className`
override. Adding a `mono?` toggle or `copyValue?` override re-opens
ADR-0007's "shape unification" concern; revisit the ADR before crossing
that line.

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
6. **All structural mutations route through `commitStructural`** — a private
   channel that threads `idMinters`, skips when the op returned the same
   document, runs `afterStructuralChange`, and commits. Ops keep their pure
   `(doc, …, minters) => doc | { document, result }` signature; the editor
   never threads `this.idMinters` at the call site. Mutations sort into
   exactly three named channels, each owning a distinct invariant set:

   - `commitStructural(op)` — structural mutations (`addTable`,
     `deleteColumn`, `addRelation`, `applyDbmlNow`, `importFromSql`,
     `importFromJsonSchema`, …). Autosave ON. `afterStructuralChange` ON.
     Minters threaded.
   - `commit(next)` — non-structural content mutations (`setDiagramName`,
     `setDbmlText`, `syncDbmlFromDiagram`, `loadFromExportedJson`).
     Autosave ON. `afterStructuralChange` OFF (would overwrite a typed
     DBML draft). `loadFromExportedJson` belongs here, not in lifecycle,
     because clearing `diagramId` plus running autosave is what mints
     a fresh id per invariant 5.
   - `applyLifecycle(next)` — navigation between diagrams (`loadDiagram`,
     `newDiagram`, `deleteDiagram`, `renameDiagram`, `replaceDocument`).
     Autosave OFF. `afterStructuralChange` OFF. These represent the user
     moving between documents, not editing one — they must not bump
     `updatedAt` or rewrite generated DBML. The third channel is what
     prevents a contributor from accidentally autosaving on a load.

The `DiagramStorage` adapter (`{ loadIndex, saveIndex, loadDiagram,
saveDiagram, deleteDiagram, generateId }`) decouples the editor from
localStorage. `localStorageDiagramStorage` is the production adapter;
`createInMemoryDiagramStorage()` is the test double — counters on `saves`
and `deletes` make autosave behavior unit-testable without DOM.

## Diagram export panel

The single internal shell for the DB Diagram Tool's "derive text from the
live diagram and display it with copy + optional action" shape. Implemented
by `<ExportSidePanel>`
(`src/components/feature/data/db-diagram/ExportSidePanel.tsx`).

Today's consumers: `ExportSqlPanel`, `ExportTypescriptPanel`,
`ExportMermaidPanel`. Sibling of [[Diagram import panel]].

The shell owns: the reactive derivation from the editor
(`derive: (editor) => string` + `extraDeps?`), the `<pre>` display block
(with `font-mono break-all whitespace-pre-wrap`), the placeholder-when-empty
rule, the `<CopyButton>` in the footer, and the `<DiagramSidePanel>` wiring.

The caller's role narrows to:

- `derive` — the selector function called against the `DiagramEditor`
- `copyLabel`, `emptyPlaceholder`, `title`, `testId`, `onClose` — metadata
- `controls?` — optional header slot (only `ExportSqlPanel` uses this for the
  dialect picker)
- `action?: (value: string) => ReactNode` — optional secondary footer action;
  receives the derived value so callers can wire download or handoff buttons
  without re-deriving

Carries one load-bearing invariant: the reactive coupling between `derive`
and the diagram's live state is sealed inside the shell. `DiagramEditor` is
an external mutable object — `editor.toSql()` reads state outside React. The
shell uses `useMemo([document, editor, ...extraDeps])` with `document` as an
intentional reactivity signal (the `DiagramContext` re-provides it whenever
the editor emits). Callers never spell out this `document`-as-dep pattern;
the shell is the one place where the corresponding `eslint-disable` comment
is justified and recorded.

One caller responsibility: `extraDeps` must list every local variable the
`derive` closure closes over (e.g., `[dialect]` for `ExportSqlPanel`). The
`react-hooks/exhaustive-deps` rule cannot statically verify `extraDeps` — a
missing dep silently gives `derive` a stale closure until the next `document`
change triggers a re-run. When in doubt, add the dep.

## Diagram import panel

The single internal shell for the DB Diagram Tool's "paste source text,
optionally merge, press Import, see errors" shape. Implemented by
`<ImportSidePanel>`
(`src/components/feature/data/db-diagram/ImportSidePanel.tsx`).

Today's consumers: `ImportSqlPanel`, `ImportJsonSchemaPanel`.

The shell owns: `{ text, merge, errors }` state, the non-empty-text
guard (callers' `onImport` is never called with empty text), the
`<CodeInput>` body, the error list (`err.message`, keyed by
`${err.line}-${err.message}`), the merge `<CheckboxInput>`, and the
`<Button block size="small" variant="primary">Import</Button>`.

The caller's role narrows to:

- `onImport(text, { merge }) => Array<DbmlError>` — calls
  `editor.importFromX(...)` and returns `result.errors`. Callers that
  require extra parameters (e.g. SQL `dialect`) close over local state.
- `extensions` — the CodeMirror language extension array (callers
  memoize or define at module scope since extensions are stable)
- `placeholder`, `title`, `testId`, `onClose` — metadata
- `controls?` — optional header slot (only `ImportSqlPanel` uses this
  for the dialect picker)

Sibling of [[Diagram export panel]]. Both panels follow the same
`DiagramSidePanel` framing: optional `controls` header, body, footer
with the primary action.

## Entity ID minters

The single injectable seam through which document-internal entity ids
(tables, columns, relations) are minted in the diagram domain.
Implemented by `createDefaultIdMinters` / `createSequentialIdMinters`
(`src/diagram/id-minters.ts`).

Adapter shape:

```ts
type EntityIdMinters = {
  table: () => TableId
  column: () => ColumnId
  relation: () => RelationId
}
```

The default adapter (`createDefaultIdMinters`) emits the
`<prefix>_<base36Time>_<base36Counter>` shape per entity type with
independent counters: `t_lz3k_1`, `c_lz3k_1`, `r_lz3k_1`. The
sequential adapter (`createSequentialIdMinters`) emits deterministic
`t_1, c_1, r_1, …` for spec assertions.

The seam absorbs five previously scattered mint sites — three
module-local IIFEs (`tableIdSeq` / `colIdSeq` / `relIdSeq` in
`operations/{tables,columns,relations}.ts`), `defaults.generateId`
(reached indirectly via `createDefaultColumn`), and the same
`generateId` reached directly by the import codecs (`codecs/dbml.ts`,
`codecs/import.ts`, `codecs/json-schema.ts`). After this consolidation,
every entity id in any document — whether minted interactively via
`addTable` / `addColumn` / `addRelation` or via DBML / SQL /
JSON-Schema import — takes the same prefixed base36 shape, end to end.

[[DiagramEditor]] owns the bag: `options.idMinters?: EntityIdMinters`
defaulting to `createDefaultIdMinters()`. Specs construct an editor
with `createSequentialIdMinters()` for exact-id assertions, the
parallel of the existing `clock` option and the existing
`createInMemoryDiagramStorage()` test adapter.

Distinct from `DiagramStorage.generateId`, which mints diagram-level
persistence keys (the localStorage key under which a saved diagram
lives). Document-internal entity ids and persistence keys are
different concerns; the seams are separate.

## Grid layout positions

The single seam that owns the initial-position grid used wherever a batch of
diagram tables is laid out without a user-chosen position. Implemented by
`gridLayoutPositions` (`src/diagram/layout.ts`).

Adapter shape:

```ts
gridLayoutPositions(count: number): Array<{ x: number; y: number }>
```

Three-column grid, 600px horizontal spacing, 550px vertical spacing. The
function is pure and deterministic: `gridLayoutPositions(N)` always returns
the same array, no minter / no clock / no adapter slot. Specs assert against
literal coordinates.

Carries three invariants:

1. **Length matches count** — `result.length === count`.
2. **Positions are distinct** within the returned array — no two tables
   land on the same coordinate.
3. **Index 0 is the origin** — `result[0] === { x: 0, y: 0 }`, so a
   "first table" lands at the canvas origin without special-casing.

The seam absorbs three previously scattered call sites: the `layoutTables`
helper inside `codecs/sql.ts`, the inline grid math inside
`codecs/json-schema.ts`, and the (already-consolidated) call from
`codecs/dbml.ts`. The React Rearrange button in `<DbDiagram>` calls the
same module — every batch positioning of tables goes through this one
function, regardless of how the tables were minted (DBML / SQL /
JSON-Schema import, or "Rearrange" on an existing diagram).

Distinct from `operations/tables.ts`'s interactive `defaultPosition`,
which positions *one* new table relative to existing ones with a small
gutter — a different concern (single insertion vs bulk layout), kept
separate. If a future "insert N tables at once" op emerges, it would
use this module; until then, the two stay distinct.

## Async action

Button-fired (or one-shot) async work with stale-safety + unmount-safety.
Implemented by `useAsyncAction` (`src/hooks/useAsyncAction.ts`).

Wraps an async function so the latest invocation always wins (older
resolutions are dropped) and `setState`-after-`await` on an unmounted
component cannot fire. Per-call-site concerns — input state, validation
early-returns, success messaging — stay at the call site.

Today's consumers: `BcryptHasher` (both `HashTab.handleHash` and
`VerifyTab.handleVerify` — two button-fired async paths in one Tool),
`RsaKeyGenerator.handleGenerate`, and `TypescriptPlayground`'s debounced
transpile. All four previously hand-rolled the
`setPending(true)/await/setResult/finally setPending(false)` dance and
none had stale-safety; the `transpile` and RSA-generate paths also
lacked unmount-safety guards.

Carries two invariants:

1. **Stale-safety** — every `run()` bumps an internal session via
   [[useStaleSafeAsync]]. If a newer `run()` starts before the previous
   one resolves, the older session is marked stale; its `setResult` and
   `onError` are both suppressed. `run()` returns `T | undefined` —
   `undefined` when the call was superseded so callers can short-circuit
   any follow-up logic (e.g., a success toast).
2. **Unmount-safety** — a `mountedRef` cleared in the unmount effect
   gates every post-`await` commit. `setResult` / `onError` / the
   `finally` reset of `pending` all check `mountedRef.current` first.

The hook is for button-fired (or one-shot mount-fired) work — not
debounced input-driven compute. For debounced input → result transforms,
use the [[Tool computation pipeline]]; for image upload → batch outputs,
use the [[Batch asset pipeline]]. The action closure is captured fresh on
every render via a ref, so callers don't need to memoize their input
state or wrap the action in `useCallback`.

## Keyboard list navigation

The shared keyboard navigation behavior for any "searchable list of items
the user navigates before picking one." Implemented by `useKeyboardListNav`
(`src/hooks/useKeyboardListNav.ts`).

Owns four concerns:

1. **`activeIndex` tracking** — the highlighted-item state, exposed via
   `activeIndex` and `setActiveIndex` (the React setter — callers reset on
   query change or dropdown close).
2. **ArrowDown/ArrowUp/Enter handling** — a single `handleKeyDown` to wire
   onto the wrapper element. Supports `wraparound: true` (Cmd-K palette
   style) or clamp (default — stays at end / 0).
3. **Auto-scroll** — when `activeIndex` changes, the active child of
   `listRef` is scrolled into view via `scrollIntoView({ block: 'nearest' })`.
4. **`aria-activedescendant` derivation** — when `getOptionId(item)` is
   provided, the hook returns `activeDescendantId` for the search input.
   Required for screen readers to announce the highlighted item during
   ArrowDown/Up navigation in a combobox. Each adopter is responsible for
   setting matching `id={getOptionId(item)}` on its `<li>` items plus
   `aria-activedescendant={activeDescendantId}` + `aria-autocomplete="list"`
   on the input.

Today's consumers: `CommandPalette` (Cmd-K modal, wraparound + initialIndex 0)
and the `TimezoneSearchPicker` sub-component inside `TimezoneConverter`
(inline dropdown, clamp + initialIndex -1).

Per-call-site concerns stay at the call site: the query state and filtering,
Escape key behavior, click-outside dismissal, modal vs inline shell, and item
rendering. Adopters typically chain Escape locally before forwarding the rest
of the keydown event to the hook's `handleKeyDown`.

## N-mirror broadcast

A recurring shape on top of [[Tool computation pipeline]] — not a separate
seam, just a usage pattern with a name so future architecture passes
recognize it. Tools that display multiple representations of one underlying
value, where editing any representation rebroadcasts the others, follow
this layout:

- **Pipeline input** is a discriminated `{ source: <which-field-changed>,
  ...currentFields, ...uiMemory }`. `uiMemory` carries non-display state
  the constraint solver needs.
- **Pipeline output** is the full record of displayed fields.
- **React side** owns the visible field bag via `useState`; an adoption
  effect (`if (result) setFields(prev => ({ ...prev, ...result }))`)
  mirrors the pipeline result back in.
- **Change handlers** apply an optimistic local update so typing feels
  instant, then call `setInput` (debounced) or `setInputImmediate`
  (preset buttons, empty-bypass cancellation).
- **The pure constraint solver** lives in `src/utils/<tool>.ts` per
  ADR-0004, with spec coverage of every `source × uiMemory × validity`
  branch. Errors throw with a typed message; the pipeline's `onError`
  toasts.

Today's adopters:

| Tool | Source key | UI-memory fields |
|---|---|---|
| `ColorConvertor` | `format` (6 options) | — |
| `UnitPxToRem` | `source: 'px' \| 'rem' \| 'base'` | `lastEdited` |
| `AspectRatioCalculator` | `source: 'width' \| 'height' \| 'ratio'` | `locked`, `lastEdited` |

No dedicated hook. The glue per adopter is ~10 lines (one `useState` +
one adoption `useEffect` + the pipeline call); the input shapes vary
across the three adopters, so a wrapper would either grow knobs or
lose depth. The pipeline already carries the load-bearing invariants
(debounced, stale-safe, empty-bypass, unmount-safe); the pattern adds
discipline about how to compose them for this specific shape, nothing
more. Recorded as a declined extraction in ADR-0019, which names the
two adopter-shape triggers that would revisit the decision.

Pick this when adding a Tool with ≥2 representations of one value that
must sync. Don't pick it when the Tool has independent fields that
don't constrain each other (use plain [[Tool field bag]] instead).
