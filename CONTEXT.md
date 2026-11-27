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
- Optional per-tool persistence (`storageKey` on `useToolInput` /
  `useToolFields` — see [[Persisted tool input]]; `useInputLocalStorage` for
  bespoke bags) or SEO (`useToolSeo`).

## Layout type

The shape of a Tool's interaction, chosen from a closed set and declared as
the required `layout` field on every `ToolRouteDefinition`
(`src/constants/tool-routes.ts`). Each layout type maps 1:1 to a layout
shell in `src/components/common/`; the shell is the UX spec, `docs/ux/`
holds the drawing and journey for each (ADR-0027).

| Layout type | Shell | Interaction |
|---|---|---|
| **Transformer** | [[Transformer shell]] | source input → output, one direction, deterministic; output kind `text` / `image` / `fields` / `markup` |
| **Codec** | [[Codec shell]] | input → output in one of several directions (mode toggle) |
| **Generator** | [[Generator shell]] | options → output; `random` mode waits for Generate, `live` mode reruns on every option change |
| **File Processor** | [[File processor shell]] (single file or batch) | upload → process → download |
| **Comparator** | [[Comparator shell]] | two inputs → their difference |
| `custom` | — | opts out; `layoutOptOutAdr` must cite the ADR that says why. Custom Tools still show input errors in a `<ToolStatus>` |

Rules the shells enforce (so a Tool cannot choose differently):

- **Order, top to bottom:** header → mode row (Codec) → controls →
  [[Tool status slot]] → work area (input left, output right; stacked on
  mobile) → actions.
- **Run timing:** deterministic and fast runs as you type (300 ms debounce);
  random output waits for a Generate button (⌘/Ctrl+Enter); slow-on-purpose
  work shows a busy state on that button — spinner + elapsed time, no
  progress channel, ADR-0001.
- **Buttons:** Copy sits in the output's label. Generate / Process sit under
  the input, Download at the bottom of the output pane. ⌘/Ctrl+Enter
  triggers Generate / Process while enabled (`ModEnterAction`, which also
  shows the key hint).
- **Empty state:** the output's placeholder (required), phrased as an
  instruction ("Paste JSON to format it"), not a sample output; for File
  Processors the upload area fills the work area and the tile is a plain
  button.
- **Errors:** see [[Tool status slot]]. Input errors never toast.
- **Persistence and Reset:** text input persists per Tool (per mode for a
  Codec); files never persist. Reset — run by the dialog frame when the
  dialog closes, or by the tool page's close dot ([[Tool presentation]]);
  there is no Reset button — clears the input and keeps controls.

A Tool tagged with a layout but not yet built from its shell is listed in
`LAYOUT_MIGRATION_PENDING` (`src/test/layout-migration.ts`). That list only
shrinks: `src/test/layout-guard.spec.ts` fails if a listed Tool already
renders its shell, and fails if a migrated Tool builds its own dialog. Each
shell has a contract suite (`<Shell>.contract.dom.spec.tsx`) that runs over
every migrated Tool of its layout.

Not to be confused with **category** (`Code`, `Data`, `Image`…), which is
how the dashboard groups Tools, not how they behave.

## Tool status slot

The one fixed spot — owned by the layout shell, between the controls and
the work area — that answers "why is there no output?" and "the output is
valid, but…". Implemented by `<ToolStatus>`
(`src/components/common/banner/ToolStatus.tsx`), marked
`data-slot="tool-status"`.

Two kinds of message:

- **Error** — the input could not be processed. The shell reads the
  pipeline's `error` state and renders it automatically
  (`role="alert"`); the output is cleared at render time so a stale
  result never sits next to an error. Text: the shell's `errorLabel` when
  set (fixed wording for libraries that throw implementation-leaking
  messages), else the `Error`'s own message (e.g. from the
  [[Parse-error narrator]]), else `errorFallback`.
- **Notice** — the output is valid and stays, with something worth
  knowing (`EnvFileConverter`'s skipped lines). The Tool supplies them via
  the shell's `notices: (result) => Array<string>`; rendered with
  `role="status"`. Hidden while there is an error.

An error may carry one **action** (`<ToolStatus errorAction={{ label,
onClick }}>`): a button beside it that fixes the input — Mermaid's
Auto-fix. The [[Transformer shell]] exposes it as `errorAction`.

A Tool can add notices but can never take over the error display: the
shells pass no `errorLabel` / `errorFallback` / `onError` to the pipeline,
so nothing toasts. Generalises ADR-0021 (which did this for the
Transformer only) to every shell.

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

Every compute is called as `compute(input, { signal })`. The pipeline
aborts that `AbortSignal` when a newer input is enqueued (at enqueue
time, not when the next debounce fires), on the empty bypass, and on
unmount — so cancellable work actually stops instead of only having its
result dropped by invariant 2. Computes may ignore the second argument
(`(input) => …` still type-checks). A rejection after abort, or any
`AbortError`-named rejection, is silent: no `error`, no toast. Adopters
that use it: `RegexTester` (signal → [[Worker bridge]] terminates a
runaway pattern) and `BackgroundRemover` via the [[File processor shell]]'s
`process(file, controls, { signal })` (skips the stale composite + PNG
encode during colour-picker drags). This is **cancellation, not
progress** — ADR-0001's "the pipeline does not carry progress" still
holds; the signal flows into compute, nothing flows back out.

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
state into the pipeline on every call — as `<FileProcessorShell>` does with
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
  ColorConvertor clearing its mirrored fields while the [[Tool status
  slot]] shows the error). When set, the pipeline does NOT toast on its
  behalf.

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

Pass `storageKey` to persist the bag across reloads — see
[[Persisted tool input]].

Pick this when a Tool has more than one input field. Pick [[Tool input]]
for single-value Tools where the input mirrors a single React-side value —
the same "owns the input, no parallel `useState`" property, sized for one
field. Keep the unwrapped `useToolComputation` only when the input is built
fresh per change from external React state (the [[N-mirror broadcast]]
shape) or when a wrapper bridges React-side props on every call (the
[[File processor shell]] shape).

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
React-side state. Pass `storageKey` when that input also persists
across reloads (see [[Persisted tool input]]). Keep the unwrapped
`useToolComputation` for
[[N-mirror broadcast]] adopters (the input is a discriminated bag
rebuilt per keystroke from React state, not a mirror of it — today:
`ColorConvertor`, `UnitPxToRem`, `AspectRatioCalculator`) and for
shells that bridge React-side props on every call ([[File processor shell]]
with `{ file, controls }`).

Today's adopters: `MarkdownPreview`, `Base64ToImage`,
`TimeUnixTimestamp` (UnixTimestampSection), `SvgViewer`. (`JwtDecoder`,
`UrlParser`, `SshKeyFingerprint`, `CertificateDecoder`,
`CronExpressionParser`, `UserAgentParser`, `TextCaseConverter` and
`WordCounter` moved onto the [[Transformer shell]], which wraps
`useToolFields`.)

## Persisted tool input

The opt-in localStorage round-trip on [[Tool input]] (`useToolInput`)
and [[Tool field bag]] (`useToolFields`), switched on by passing
`storageKey`. One option, two hooks — there is no separate persisted
hook (the former `useToolComputationPersisted` / `useToolFieldsPersisted`
were folded in; see ADR-0024).

With `storageKey` set, the hook:

1. **Seeds once on mount** — `readJsonStorage(storageKey, initial)` in a
   lazy `useState` initializer. The stored JSON is laid over `initial`
   (below); absent or unparseable JSON gives `initial`. Later changes to
   `storageKey` do not re-read.
2. **Writes back trailing-debounced** — `setInput` / `setFields` queue a
   write on the same delay as the pipeline (`debounceMs`, default 300ms),
   so a burst of keystrokes costs one `JSON.stringify` + `setItem`.
   `setInputImmediate` / `setFieldsImmediate` / `reset()` write
   immediately. Nothing is written on mount — the seed is not re-persisted.
3. **Flushes on unmount and `pagehide`** — a write still pending inside
   the debounce window is committed when the Tool unmounts (in-app
   navigation, dialog close) or the page is hidden (reload, tab close),
   so nothing typed is lost. The debounced writer is
   `useDebouncedJsonWrite` (`src/hooks/persist/useDebouncedJsonWrite.ts`).
4. **Autoruns on a non-empty restore** — mount autorun fires when EITHER
   `autorunOnMount === true` (explicit, `isEmpty`-independent) OR
   `isEmpty` is provided AND the restored value passes `!isEmpty(value)`.
   The second arm only exists with `storageKey`: a non-persisted hook
   with a non-empty `initial` does not autorun unless asked. Without
   either condition, the caller owns the first compute.

`reset()` restores `options.initial` (the declared default), not the
value restored from storage, and persists it.

The pipeline's four invariants (plus the field bag's same-tick partial
merge) are untouched — persistence lives beside the pipeline, not in it.
A clear to empty still persists even though compute short-circuits on
`isEmpty`.

**The restore rule** (`restoreJson`, `src/utils/restore-json.ts`;
ADR-0030). A stored value is laid over its default: a value of the
default's JSON type is kept, and anything missing or of another type
becomes the default. This goes field by field through objects and item by
item through lists:

- A field the default does not name is kept as stored and written back
  with the bag.
- A list item that is not of the type of the default's first item is
  dropped. A stored empty list stays empty.
- Where the default is a number, text is kept too (`indent: 'tab'`, or a
  count the Tool itself reports).

Only the type is checked: an unknown mode or an out-of-range number still
reaches the Tool. Reading never writes, so a damaged part stays in storage
until the next write of that key. Three limits:

- A default of `null` never restores. No adopter has one.
- An empty default list restores text items only.
- Nested fields the default omits are unchecked, so the Tool must guard
  them (Crontab's `isFieldConfig`). At the top level the types prevent
  this: `initial` is `Required<F>` on `useToolFields` and on the
  Transformer and Generator shells.

The rule runs inside `readJsonStorage`, so it also covers
`useInputLocalStorage`, the [[Codec shell]]'s sources and Timezone
Converter's favorites. The two Zustand stores call it as they rehydrate.
`settings` is laid over its defaults whole. `feature_layout` is restored
slot by slot, because a closed widget is saved as `null`: `null` and text
are kept, and any other slot takes its default, if it has one. A layout
saved at version 1 or older is migrated first (`migrateLayoutValue`): a
key that still exists is kept, a renamed key becomes its current name, and
any other key becomes `null`.

Today's adopters with `storageKey`:

- `useToolInput`: `ProtobufToJson`, `GraphqlSchemaViewer`, and the
  [[Markup to PDF shell]].
- `useToolFields`: the [[Transformer shell]], the [[Comparator shell]]
  and the [[Generator shell]].

A [[Tool handoff]] prefill (the Transformer shell's `prefill`) is applied
in the shell's own `useMountOnce` and overrides the hook's autorun. This
relies on the hook's `useMountOnce` being registered (and so firing)
before the shell's.

`ProtobufCodec` deliberately does NOT adopt `storageKey` (per ADR-0005).
Its shape — one persisted 5-field bag in which only `schema` drives
compute, plus two child pipelines reading slices of that bag — is the
"shared persisted bag + multiple pipelines reading slices" pattern; a
persisted `useToolFields` would re-fire `parseProtobufSchema` on every
`encodeSource` keystroke, since the hook does not gate compute on which
field changed. Its triad (`useInputLocalStorage` + a single
`useToolComputation` over `schema` + `useMountOnce`) stays.
`<CodecShell>` also stays bespoke: its source is keyed per
mode, so the key is derived rather than static.

The Dioxus build reads and writes every key the site stores, in the shapes
it has today, so a rollback to React loses nothing. It is stricter by type than the restore
rule, and replaces half an emoji with U+FFFD (ADR-0032). Both builds are
tested against the [[Stored-value contract]].

## Stored-value contract

The committed data that says what the site may store, and how a stored
value reads back (ADR-0032). Both the React and the Dioxus build are tested
against it for as long as a rollback to React is possible. It has two
parts:

- **The key list:** every `localStorage` key and key pattern the site may
  write. A key that is not on it must not be written, which stops a Tool
  that saves nothing today from starting to save.
- **Golden values:** raw stored text captured from the React build on
  `main`, covering each key's current shape, its older shapes and damaged
  values, each with the value it should restore to.

A fix that changes a stored shape updates the contract in the same change.
Distinct from [[Persisted tool input]], one of the React mechanisms that
write these values (the Zustand stores and the DB Diagram store are the
others).

## Tool presentation

How a Tool is shown (ADR-0029). It is read from a React context
(`useToolPresentation`, `src/components/common/dialog/ToolPresentation.tsx`):
- `dialog` (the default): the dashboard tile opens the Tool in a dialog.
- `page`: the Tool's own route (`/tools/<key>`) renders it inline in a
  full-width page card, with the Tool's name as the page heading.

Only the [[Tool dialog frame]] reads it, so every shell and frame-based Tool
gets both presentations for free. On a page the frame registers its
`onReset` with the page. The page card's close dot runs it and then goes
home; leaving any other way keeps the saved input. A Tool's own children see
`dialog` again, so a dialog a Tool opens itself stays a real one. Protobuf
Codec and Data URI draw their own tiles around `<ToolDialogShell>` and keep
real dialogs on every route.

## Head-stamped page

A page whose static HTML carries that page's own title, description, Open
Graph text and URL, Twitter text, and canonical link, with an empty root
element. The client renders the whole body. The home page is one, and so is
every Tool's `/tools/<key>` page; a Tool page's images, keywords and structured
data are the home page's. Tool pages are stamped by `renderRouteHtml`
(`vite-plugins/prerender.ts`). Distinct from a [[Body-prerendered page]];
"prerendered page" on its own does not say which of the two is meant.

## Body-prerendered page

A page whose static HTML also contains the rendered body markup. The site has
none. Whether the client hydrates that markup or replaces it is a separate
choice. Distinct from a [[Head-stamped page]].

## UX parity

A ported Tool behaves as the same Tool on `main` does. Until cutover, the
React site on `main` is the reference, not the drawings in `docs/ux/`. The
rules are in `docs/ux/parity.md`.

- **Parity harness:** the automated checks that prove it, added to the React
  suite and run against `main` before Dioxus is held to them.
- **A11y baseline:** the committed list of accessibility failures React
  already has. A Dioxus build may not add one.
- **`ux-improvement`:** any intended change away from `main`, filed as its
  own issue and never part of a port PR.
- **Foundation difference:** one of the five changes from `main` listed in
  ADR-0034 that come with the [[UI primitive]]s. It is allowed in port PRs
  and is not a `ux-improvement`. The list is closed.

## UI primitive

An interactive common component in the Dioxus build whose keyboard, focus
and announcement behaviour we own (ADR-0034). There are ten: dialog,
select, dropdown menu, tabs, toast, checkbox, switch, radio group, slider,
and the command palette's combobox. Each is written from scratch and built
on the browser's own element where one has the right role and keys.

- **Behaviour list:** a primitive's written keys, focus moves and
  announcements, made before it is built. The bar is Radix as it behaves on
  `main`, never below the WAI-ARIA pattern. Deliberate differences are
  written in it.
- A primitive is done when its keyboard and focus journey (`parity.md`)
  passes.

_Avoid_: "primitive" for a `dioxus-primitives` or Radix part, which the
Dioxus build does not use.

## Modal frame

The one piece under Dialog, the Sidebar and the CommandPalette in the Dioxus
build (ADR-0034). It mounts a `<dialog role="dialog">`, calls
`showModal()`, locks scroll and remembers focus. On close it plays the exit
through a [[Delayed unmount]], then calls `close()`, unmounts the children,
returns focus and fires `onAfterClose`. A closed modal frame is not in the
DOM. Distinct from the [[Tool dialog frame]], which decides whether a Tool
opens in a dialog at all; in the Dioxus build its dialog is a modal frame.

- **Toast host:** the slot inside the topmost open modal frame where the
  [[Toast channel]]'s toasts draw. Outside a modal they draw on the page.
  Without the host, a toast would be inert under the modal.

## Delayed unmount

How the Dioxus build plays an exit (ADR-0034): Rust sets an "exiting"
attribute, waits for `transitionend` or a timeout, then removes the node.
It is the only motion work Rust does; everything else that animates is CSS.
A style that follows the pointer while dragging is input, not motion.

## Tool dialog frame

The page-level frame for a Tool: on the dashboard, a tile whose triggers open
the Tool in a dialog. On the Tool's own route ([[Tool presentation]] `page`),
it renders the Tool inline (`data-slot="tool-surface"`) with no tile.
Implemented by `<ToolDialogFrame>` (`src/components/common/dialog/ToolDialogFrame.tsx`).

Replaces the four-concern boilerplate every dialog Tool used to repeat:
`useState(dialogOpen)`, the centered tile layout (description + button column),
the trigger button(s), and the controlled `<ToolDialogShell>` wiring
(`open`/`onOpenChange`/`onAfterClose`). The Tool's role narrows to
`triggers`, `title`, `onReset`, and the dialog body.

Each trigger is `{ label, onOpen? }`. `onOpen` fires synchronously in the same
React event that flips the dialog open, so any state seeded there (e.g.
`mode: 'encrypt'` from the Encrypt button) is committed before the body
renders. Multi-trigger tiles (one button per mode) are being retired by
ADR-0027: AES Encrypt/Decrypt and String Escape/Unescape already moved onto
the [[Codec shell]] (one trigger plus an in-dialog toggle).

`<ToolDialogShell>` remains the lower-level escape hatch — use it directly
when the tile shape doesn't fit (multi-dialog Tools, etc.). The layout
shells (`<CodecShell>`, `<TransformerShell>`, `<ComparatorShell>`,
`<FileProcessorShell>`) render this frame themselves.

## Upload dialog frame

_Removed (2026-11-10). `<UploadDialogFrame>` made the page tile itself the
file picker, so the dialog opened only once a valid file was picked.
ADR-0028 replaced that with one way in: a plain tile button and an upload
area inside the dialog. Its last consumers (`FaviconGenerator`,
`SplashScreenGenerator`, `ImageToBase64`) moved to the
[[File processor shell]]'s `assets` and `text` outputs. Older ADRs (0016,
0026, 0028) still use the name._

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

To add a channel: extend `HandoffChannel` in `src/types/utils/tool-handoff.ts`. The
type-checker will flag any producer or consumer that uses a name not in the
union.

## Codec shell

_Formerly "Bidirectional converter" / `<BidirectionalConverter>`; older ADRs
use that name._

The shell for the **Codec** [[Layout type]]: a Tool that converts between
formats with mode-swap support — JSON ↔ CSV, HTML ↔ Markdown, encode/decode,
etc. Implemented by `<CodecShell>` (`src/components/common/codec/CodecShell.tsx`).

A mode toggle is offered only when every direction takes the same kind of
input (text ↔ text). Image ↔ Base64 stays two Tools because one direction
takes a file. The tile has one trigger (the active mode); switching happens
in the dialog. On the tool route, `?mode=<key>` opens straight into that
mode — read once on mount when `autoOpen` is set, validated against `modes`,
never written back.

The shell owns: the in-dialog mode toggle, the dialog, per-mode source
persistence (localStorage), mount-time hydration, mode switching, and the
two-column source-input / result-output layout. A stored mode the Tool
doesn't have opens the first mode, and stays stored until the user
switches. The Tool's role narrows to its per-direction `compute` function
plus per-direction labels/placeholders.

Tools with extras (entity-mode select, double-escape checkbox) plug into the
`sourceToolbarSlot` render-prop, which receives `{ mode, recompute }` — the
caller renders its extras and calls `recompute()` after their value changes.

The result type is generic (`<R extends CodecOutput>`) so Tools may
extend the minimum `{ output: string }` shape with extra fields
(`EnvResult` adds `warnings: Array<string>`). Non-fatal metadata about a
valid result is surfaced as [[Tool status slot]] notices via
`notices: (result) => Array<string>`; compute rejections are shown by the
shell as the slot's error.

Each `CodecMode<M>` may declare `sourceFormat: 'json' | 'yaml' | 'xml'
| 'toml' | 'csv'`. When set, compute failures route through the
[[Parse-error narrator]] before reaching the status slot. Omit for modes
whose source isn't a parseable format (Base64, URL encoding, HTML entities) —
their `err.message` is shown as-is (else `errorFallback`).

`modes` is `ReadonlyArray<CodecMode<M>>` (not a 2-tuple) to admit
Tools that swap between more than two directions; `EnvFileConverter` is
the four-mode adopter (`.env ↔ JSON`, `.env ↔ YAML`).

`initialResult: R` is required (mirrors [[Comparator shell]]) so
extended `R` types can't render with missing fields before the first
compute resolves.

Today's adopters: `EncodingBase64`, `UrlEncoder`, `JsonToYamlConverter`,
`JsonToXmlConverter`, `JsonToTomlConverter`, `JsonToCsvConverter`,
`HtmlEntityConverter`, `HtmlToMarkdownConverter`, `EscapedJsonStringifier`,
`EnvFileConverter` (the only `notices` user today), `StringEscapeUnescape`
(format select in `sourceToolbarSlot`) and `AesEncryptDecrypt`.

`persistSource={false}` opts a Codec out of source persistence for sensitive
input — `AesEncryptDecrypt` never writes plaintext or ciphertext to
localStorage. Its password lives in Tool state, is rendered through
`sourceToolbarSlot`, triggers a debounced `recompute()` (key derivation is
deliberately slow), and is cleared through `onClearInput` whenever the shell
resets (on close); a blank password yields empty output, not an error.

## Parse-error narrator

The single seam that owns the "translate a WASM compute failure into a
human-readable `Invalid <FORMAT>: <reason>` message" concern across the
[[Codec shell]] family. Implemented by `narrateParseError`
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
`JsonFormatter` (via the [[Transformer shell]]),
`YamlFormatter` (multi-field via `useToolFields`). Each wraps the
narrator inline: `const narrated = await narrateParseError(fmt, val);
if (narrated != null) throw new Error(narrated)`. The trailing
`try { format... } catch { throw new Error('Unable to format X') }`
stays inline — it handles format failures on parse-valid input, which
the narrator does not cover.

Pick this when a Tool whose source is one of the five known formats
runs a validate-first compute — whether via [[Codec shell]]
or standalone. The module is shaped for both call shapes (the shell
gates on the narrator returning non-null; standalone callers do the
same check inline).

## Transformer shell

_Formerly "Formatter shell" / `<FormatterShell>`; older ADRs use that name._

The shell for the **Transformer** [[Layout type]]: "paste source → pick
controls → see the deterministic result as you type." Implemented by
`<TransformerShell>` (`src/components/common/transformer/TransformerShell.tsx`),
with the result side in `TransformerOutputPane.tsx`.

**Output kind** (`outputKind`, default `'text'`) picks how the result
renders. It is a closed set — there is no free-form output slot — and
`compute` returns the matching shape (`TransformerOutputByKind`):

| Kind | `compute` returns | Renders | Takes it away |
|---|---|---|---|
| `text` | `string` | `CodeOutput` block | Copy in the label |
| `fields` | `Array<{ label, value, copy?, copyValue? }>` | [[Field list]] (values keep their line breaks) | Copy on each row; `copy: false` drops it (counts, stats); `copyValue` copies something other than what is shown; optional `copyAll` in the label |
| `markup` | `string` (HTML/SVG) | rendered after the shell runs DOMPurify | Copy (the sanitised markup — what is shown) in the label |
| `image` | `{ src, alt, filename, copy? } \| null` | preview | Download at the bottom of the pane; with `imageCopyLabel`, Copy and an icon Download both in the label |

Each kind's empty value (`''`, `[]`, `null`) is its empty state: the
shell shows the required `resultPlaceholder` (phrased as an instruction)
and starts the pipeline from it. The output is cleared to that value
while the pipeline has an error, for every kind. The output region is
marked `data-slot="tool-output"`, `data-output-kind` and `data-has-value`
so the layout contract can find it whatever the kind. Sanitising in the
shell means no Tool can render unsanitised markup by forgetting to.

Today's consumers:
- `text`: `CssFormatter`, `HtmlFormatter`, `SqlFormatter`,
  `JavaScriptMinifier`, `JsonFormatter`, `YamlFormatter`,
  `HashGenerator`, `HmacGenerator`, `JsonToTypeScript`, `TextSortDedupe`,
  `JsonSchemaValidator` (the validated JSON, formatted).
- `fields`: `TextCaseConverter` (Copy per case), `WordCounter`
  (`copy: false` on every row), `TimezoneConverter` (one row per target
  zone), `TimeUnixTimestamp` (the timestamp as dates), `CertificateDecoder`,
  `SshKeyFingerprint`, `UrlParser`, `UserAgentParser`,
  `CronExpressionParser` (next runs as one multi-line row),
  `JwtDecoder` (header / payload / signature as multi-line rows; the
  payload row shows annotated timestamps and copies the raw JSON via
  `copyValue`), `JsonpathEvaluator` (one row per match, `copyAll`
  copies them as one JSON array).

- `markup`: `MarkdownPreview`, `SvgViewer` (`markupBackground="light"`),
  `MermaidRenderer`.
- `image`: `QrCodeGenerator` (`imageCopyLabel="SVG"`), `Base64ToImage`.

`copyAll: (result) => string` (`fields` only) puts a Copy button in the
result label for a value built from all the rows; it is absent while the
output is empty and disabled when it returns `''`. A row's status that
deserves a [[Tool status slot]] notice (an expired certificate or JWT) is
read back from its row in `notices`, since `notices` sees only the result.
Utils that return their error as data (`parseUrl`, `parseCron`, JSONPath
parse/eval) are turned into thrown errors inside the Tool's `compute`.

**Additive props** (each optional; a Tool that doesn't pass one gets the
plain shell):
- `downloads: (result) => Array<{ label, filename, file }>` — files the
  output can be saved as, as icon buttons in the output label beside Copy
  (`SvgViewer`'s SVG, `MermaidRenderer`'s SVG and PNG). Disabled while
  the output is empty; `file()` may be async (SVG → PNG), and a failure
  toasts (the outcome of an action, not an input error).
- `imageCopyLabel` (`image` only) — the image also has a text form
  (`TransformerImage.copy`, QR code's SVG). Copy and an icon Download then
  both sit in the label, and there is no Download under the preview.
- `markupBackground: 'dark' | 'light'` (`markup` only, default dark) —
  light for SVG drawn in dark ink (`SvgViewer`).
- `secondSource: { field, label, placeholder, kind? }` — a second
  required source input stacked under the first (`JsonSchemaValidator`'s
  schema). Blank leaves the placeholder showing, like a blank source;
  Reset clears it with the source.
- `errorAction: (error, inputs) => { label, patch } | null` — a one-click
  fix beside the error in the [[Tool status slot]] (`<ToolStatus
  errorAction>`); clicking applies `patch` at once (`MermaidRenderer`'s
  Auto-fix).
- `prefill: () => Partial<I> | null` — called once after mount; its patch
  wins over the restored input. For a handoff from another Tool (DB
  Diagram → `MermaidRenderer`); a function so the consuming read runs
  once even under StrictMode.

The formatters route their compute through `src/wasm/formatter`
(CSS/HTML/SQL/JS) or `src/utils` (`formatJson` / `formatYaml`); JSON, YAML
and `JsonToTypeScript` also wrap the compute through
[[Parse-error narrator]] so its message reaches the [[Tool status slot]]
verbatim.

The shell wraps `useToolFields` with `storageKey` ([[Persisted tool input]])
internally, so all five field-bag invariants apply to the `compute`
function. Persistence is the default: a Tool passes its own `storageKey`,
or `persistInput={false}` instead when the input is sensitive (the props
type is a union, so it must pick one). Opt-outs: `HashGenerator`,
`JwtDecoder`, `CertificateDecoder`, `SshKeyFingerprint`, `UrlParser`
(URLs can carry tokens) and `HmacGenerator` —
its secret key is in the bag, and nothing in the bag may reach
localStorage. `JwtDecoder`, `CertificateDecoder` and `SshKeyFingerprint`
also opt out: they never saved their input, and tokens and keys are not
newly persisted. `JsonpathEvaluator` moved to
`csr-dev-tools-jsonpath-evaluator-v2` because its old bag
(`{ jsonInput, expression }`) has no `source`; on mount it moves that bag
from its old key once, unless the new key is already set.
`JsonToTypeScript` kept its pre-shell key
(`csr-dev-tools-json-to-typescript`, same bag shape); the other moved
Tools had no key before and now save under `csr-dev-tools-<tool key>`.
The pre-migration JSON Formatter key
(`csr-dev-tools-json-formatter-source`, raw-string shape) was retired in
favor of `csr-dev-tools-json-formatter` (JSON-bag shape) — reusing the old
key would have corrupted on first read because the shape is different.
Mermaid's raw-string key (`csr-dev-tools-mermaid-renderer-code`) was
retired the same way for `csr-dev-tools-mermaid-renderer`. JSON Schema
Validator and Timezone Converter kept their keys. JSON Schema Validator
moves a pre-shell `jsonData` / `jsonSchema` into `source` / `schema` once,
before the shell reads them. A pre-shell Timezone bag (`{ dateInput,
timeInput, sourceTz, targetTzIds }`) needs no migration: it reads as an
empty `source` with its zones. Markdown, SVG Viewer, QR Code, Base64 →
Image and Unix Timestamp saved nothing before the shell and pass
`persistInput={false}` to keep it that way.

The shell owns: the [[Tool dialog frame]] wiring, the source `FieldForm`
panel (`sourceKind`: `'code'` (default, CodeMirror), `'textarea'` or
`'text'`), the output pane for each kind, the two-column layout, the
[[Tool status slot]] (pipeline errors inline above the split, output
cleared while erroring; `notices: (result) => Array<string>` for
non-fatal messages about a valid result, hidden while erroring), and the
partial-reset semantic: `reset` — run by the dialog frame on close —
clears `source` and keeps the control fields (`mode`/`dialect`/`indent`).
`clearOnReset: Partial<I>` names controls that must not outlive the
dialog; `HmacGenerator` passes `{ secretKey: '' }`.

`errorLabel` / `errorFallback` pick the status-slot wording, not a
toast: CSS/HTML/SQL/JS-minifier and HMAC pass `errorLabel` because their
facades throw opaque messages; JSON / YAML / JSON → TypeScript / Hash pass
neither and throw their own user-facing `Error`. (ADR-0021's
`renderBanner(error)` slot is superseded by the shell-owned slot —
ADR-0027.)

The Tool's role narrows to its `compute` function, its labels/placeholders,
its persistence choice, and a `renderControls` render-prop that receives
`{ inputs, result, setFields, setFieldsImmediate }` — the Tool builds
whatever controls it needs (mode select, algorithm toggles, size-savings
or line-count stat). `setFieldsImmediate` is for selects and toggles;
`setFields` is debounced like the source, for text boxes in the controls
row (HMAC secret key, JSON → TypeScript root name). `result` is the
displayed output (already cleared on error). `renderControls` is omitted
entirely by JsonFormatter, TextCaseConverter and WordCounter. The shell
hardcodes the layout container around the slot.

A Tool with more than one required input keeps the extra ones in its
controls and returns the kind's empty value from `compute` while they are
blank — HMAC with no key shows the placeholder, not an error. Emptiness
of the source is the shell's rule (`source.trim()` is empty), so a
whitespace-only source never computes.

`resultLabel` (optional, default `'Result'`) names the result pane
header and the Copy / Download button's accessible label. It may be a
function of the inputs when the label follows a control (`HashGenerator`:
`` `${algo} Hash` ``; `HmacGenerator`: `` `HMAC-${algorithm} (${encoding})` ``).

The shell is generic over `<I extends { source: string }, K extends
TransformerOutputKind = 'text'>` — each Tool has its own typed bag
(`CssInput`, `HashInput`, `HmacInput`, `JsonTsInput`, `TextSortInput`,
plus the trivial `{ source: string }`) with different control
vocabularies. The constraint on `source` lets the shell own the input
panel + reset/`isEmpty` logic. `JsonToTypeScript` lost its Generate
button and success toast when it moved: its output is deterministic, so
under the [[Layout type]] run-timing rule it runs as you type.

Shapes chosen for the less obvious Tools (ADR-0027 step 3):
- **JSON Schema Validator:** data is the source, the schema the
  `secondSource`. Invalid data rejects with the error list (one per
  line) — the status slot shows it and the output clears. Valid data
  comes back formatted as the `text` output, with a "Valid" notice.
- **Timezone Converter:** the source is the date and time as text
  (`YYYY-MM-DD HH:mm`); a Now button, the source zone and the target-zone
  chips (with ★ favourite and ✕ remove) are controls; the output is a
  `fields` row per target zone.
- **Unix Timestamp:** one source — the timestamp. The date and time
  pickers in the controls show the source's local date and write a
  timestamp back into it (keeping its unit), so "date → timestamp" is a
  second way to set the source, not a second output. A Now button fills
  it. The output is `fields` (format, seconds, GMT, local).
- **QR Code:** deterministic, so a Transformer: the text is the source,
  size / error correction / colours are controls.
- **Mermaid:** opens empty (Reset clears the source, no default diagram);
  examples are control buttons.

## Generator shell

The shell for the **Generator** [[Layout type]]: options in, output out,
no source text. Implemented by `<GeneratorShell>`
(`src/components/common/generator/GeneratorShell.tsx`); the drawing and
journey are in `docs/ux/generator.md`.

Two run modes, picked with the named `run` prop:

- **`random`** — `{ mode: 'random', generateLabel, slow? }`. The output is
  random, so it runs on open, on every option change, and on the
  shell-drawn Generate button (under the options) or ⌘/Ctrl+Enter.
  `slow: true` adds the busy state — spinner + elapsed time from
  `useElapsedTimer`, button disabled, shortcut ignored, previous output
  hidden — with no progress channel (ADR-0001).
- **`live`** — `{ mode: 'live' }`. Same options ⇒ same output, so it runs
  on open and on every option change; no button, no shortcut.

The shell owns: the [[Tool dialog frame]] wiring, the [[Tool status slot]]
(compute rejections, output cleared while erroring; `notices` for a valid
result), the two-pane layout (options left, output right), the Generate
button and shortcut, and the output pane. The Tool's role narrows to its
`compute(options, { signal })`, its `initial` options bag, a
`renderOptions` render-prop, and an `output` spec.

The options bag is a [[Tool field bag]] (`useToolFields`, optionally
persisted with `storageKey`; the output is never persisted).
`renderOptions` receives `{ options, setOptions, setOptionsDebounced }`:
`setOptions` reruns at once (toggles, selects, sliders);
`setOptionsDebounced` waits for a 300 ms pause, so typing in a text option
doesn't reroll per keystroke.

The first run and the ⌘/Ctrl+Enter listener (`ModEnterAction`, wrapping
the Generate button) live inside the dialog body, which exists only while the dialog is open — so a
tile on the dashboard never generates (no RSA keygen for an unopened tile)
and the shortcut only reaches the open Tool. Each compute is stamped with
its run number; closing the dialog (the frame's reset) hides every result
stamped before the close, including a slow run still in flight. Options
stay; reopening generates again.

`output` is one of six named kinds — no free-form output slot:

- `text` → `compute` returns `string`; Copy in the label.
- `list` → `Array<string>`; `label` + count and Copy all in the label,
  Copy per row named by `itemLabel`.
- `files` → `Array<{ filename, label, mimeType?, value }>`; one block per
  file with Copy in its label, Download per file at the bottom of the
  pane, plus Download all when there is more than one.
- `fields` → `Array<{ label, value, copy?, copyValue? }>`; a
  [[Field list]] with Copy per row (`copy: false` drops it, `copyValue`
  copies something other than what is shown) — the same row type and
  component as the Transformer's `fields`. For a Tool with one copyable
  result and read-only facts about it (Crontab: expression, description,
  next runs).
- `image` → `{ alt, src, downloads }`; a preview with one Download button
  per entry at the bottom of the pane, no Copy. Each download carries
  `blob: () => Blob | Promise<Blob>`, built only on click (a PNG needs a
  canvas; the preview never waits for it); a failed build toasts as a
  failed download (Placeholder Image: PNG + SVG).
- `swatches` → `{ swatches: Array<{ color, details, value }>, copyAll }`;
  colour swatches that copy their `value` on click (named by `itemLabel`,
  `details` shown on hover/focus), plus Copy all in the label named by
  `copyAllLabel` (Color Palette: hex per swatch, CSS custom properties
  for all — the old "Export CSS" button).

The output region also carries `data-output-kind`, so the contract skips
the label-Copy check for `image`.

The output region is marked `data-slot="tool-output"` and carries
`data-has-value` while it shows a value; the layout contract uses that
(`opensWith: 'output'`, since generators open with a value rather than an
empty state).

"Generated N …" success toasts were dropped: the new output is on screen,
so the toast only repeats it. Toasts stay for action outcomes (copied,
downloaded). Tools clamp out-of-range numbers (a cleared number box
emits `0`). Compute rejections shown in the status slot are saved options
that pass the restore rule ([[Persisted tool input]]) but can't be used (an
unknown unit or key size, text for a count, a damaged grid) and typed
options the Tool can't use (a bad hex in Color Palette, a missing or
over-4096 dimension in Placeholder Image).

Today's adopters — `random`: `UuidGenerator`, `PasswordGenerator`
(list), `RsaKeyGenerator` (files, `slow`). `live`: `LoremIpsumGenerator`
and `MarkdownTableGenerator` (text; the cell grid is the options bag),
`CrontabGenerator` (fields), `PlaceholderImageGenerator` (image),
`ColorPaletteGenerator` (swatches). All persist their options.

The reducers of ADR-0008 (Placeholder Image) and ADR-0013 (Markdown
Table) survive as the options bag's transition function: the Tool
dispatches with `setOptions(reducer(options, action))` (typed text via
`setOptionsDebounced`), so the shell's bag stays the single state and the
reducer keeps its bundled ops (hex-mirror parse; grid resize with
alignments in lockstep). A restored bag the reducer can't read is a
compute rejection; `renderOptions` draws a fresh grid / default field in
its place so the editor never crashes, and the next edit replaces it.

## Markup to PDF shell

A Tool whose interaction is "paste source markup → see compiled PDF
preview + download" via the Typst WASM pipeline. Implemented by
`<MarkupToPdfShell>` (`src/components/common/pdf/MarkupToPdfShell.tsx`).

Today's consumers: `HtmlToPdf`, `MarkdownToPdf`. Both route their
compute through `src/wasm/pdf.ts` (`compileHtmlToPdf` /
`compileMarkdownToPdf`); both produce `CompileResultDto`
(`{ svgs: string[]; pdf: Uint8Array }`).

The shell wraps `useToolInput` with `storageKey` ([[Persisted tool input]])
internally — restore-on-mount + autorun-on-non-empty come for free. Persistence is required
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
   `<PdfSvgPreview>` and shows `err.message` (or `'Failed to render PDF'`
   when the rejection is not an `Error`) in the [[Tool status slot]]
   above the split. Prevents downloading
   bytes that don't match the displayed source. Distinct from the
   pipeline default — `useToolComputation` leaves `result` untouched on
   rejection, so without the shell the prior-success preview and download
   silently linger.

Input is concretely `string` — both today's adopters need only the
source markup. If a third adopter requires extras (`pageFormat`,
`includeToc`, Typst preamble), swap the internal primitive from
`useToolInput` to `useToolFields` (both with `storageKey`) and
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
   `<PdfBytesPreview>` and shows `err.message` (or `'Failed to generate
   PDF'` when the rejection is not an `Error`) in the [[Tool status slot]]
   above the split; skipped files are that slot's notice. Prevents downloading bytes that don't match the
   displayed source. Distinct from the pipeline default —
   `useToolComputation` leaves `result` untouched on rejection, so without
   the shell the prior-success preview and download silently linger.

The shell does NOT pass `errorLabel` / `errorFallback` / `onError` to the
underlying pipeline — the status slot replaces the toast (same content,
two channels would duplicate). Mirrors [[Transformer shell]]'s discipline (see
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
asymmetry with [[Comparator shell]] (generic `R extends DiffOutput`) is
load-bearing: there, two adopters genuinely diverged (`JsonDiffChecker`
adds `validationError`). Here they do not.

Does NOT fit: Tools whose source is markup rather than files (use
[[Markup to PDF shell]]); Tools whose result is multiple PDFs or
non-PDF artifacts (no current shell — would warrant a new one); inline
(non-dialog) PDF Tools (none today).

## Comparator shell

_Formerly "Diff checker shell" / `<DiffCheckerShell>`; older ADRs use that name._

The shell for the **Comparator** [[Layout type]]: a Tool that compares two
text-shaped inputs (`original`, `modified`) and renders the result as a
side-by-side row grid plus a copyable unified diff. Implemented by
`<ComparatorShell>` (`src/components/common/comparator/ComparatorShell.tsx`).

Today's consumers: `TextDiffChecker` (plain text), `JsonDiffChecker`
(validates + normalizes JSON before diffing).

The shell wraps `useToolFields` with `storageKey` ([[Persisted tool input]])
internally, so all five of its invariants (debounced, stale-safe, empty-bypass,
unmount-safe, same-tick partial merge) apply to the `compute` function.
The shell owns: the [[Tool dialog frame]] wiring, the two-column
input layout, the diff-row rendering (`DiffCell` + `renderSpans` for
inline-span highlighting), the unified-diff CopyButton, and the
sticky-header column labels.

The Tool's role narrows to its `compute` function, its labels (title,
placeholders, status-slot wording via `errorLabel` / `errorFallback`), its
`storageKey`, and optional `notices`. Invalid input is a compute
rejection, not a result field: `JsonDiffChecker` throws the
`getJsonDiffError` message and the shell shows it in the
[[Tool status slot]] while clearing the diff.

The result type is generic (`<R extends DiffOutput>`) so Tools may
extend the minimum `{ rows, unifiedDiff }` shape with extra fields.

## File processor shell

_Formerly "Image tool shell" / `<ImageToolShell>` and "Image batch shell" /
`<ImageBatchShell>`; older ADRs use those names. ADR-0028 merged them. It
also replaced the [[Upload dialog frame]]._

The shell for the **File Processor** [[Layout type]]: upload a file, process
it, download the result. Implemented by `<FileProcessorShell>`
(`src/components/common/file-processor/FileProcessorShell.tsx`). The named
prop `multiple` picks batch mode; otherwise one file goes in and `output`
names what comes out — `file` (default: one `Blob`), `assets` or `text` (see
"Derived outputs" below). All share the entry, the layout and the reset.

Today's adopters: `BackgroundRemover`, `ImageCompressor`, `ImageCropper`
(single, `file` output); `FaviconGenerator`, `SplashScreenGenerator`
(single, `assets` output); `ImageToBase64` (single, `text` output);
`ImageConvertor`, `ImageResizer` (batch).

**One way in.** The tile is a plain button ([[Tool dialog frame]]); the
dialog opens on an **upload area** that fills the work area until a file is
added. The area takes a pick or a drop. A drop bypasses the picker's
`accept`, so every pick and drop goes through the Tool's `validate` (default:
match `accept` — MIME types, `type/*`, `.ext`). Validation stays per Tool
(ADR-0016). A rejected file toasts `rejectToastLabel` (an action outcome);
valid files in the same pick are still taken. On the tool route `autoOpen`
opens straight onto the upload area.

**Layout, after a file is added:** controls → [[Tool status slot]] → work
area. The work area's input pane (source, or the queue) comes first — left
on tablet+, above on mobile — with the button that brings or creates output
under it ("Choose another image", Process). The output pane ends with
Download. `noun` (e.g. `{ one: 'image', other: 'images' }`) names files in
the shell's copy and in the input names (`image`, `images`, `images-add`).

**Reset runs on close** (there is no Reset or "Start over" button): the
shell drops the file or queue and the controls bag returns to its initial
value, so reopening shows the upload area. Removing the last queued file
also returns there.

### Single mode (`multiple` omitted)

One `File` in, one `Blob` out, recomputed live. The shell wraps the
[[Tool computation pipeline]], so its four invariants (debounced,
stale-safe, empty-bypass, unmount-safe) apply to `process(file, controls,
{ signal })`. The shell **owns the controls bag** — mirroring [[Tool field
bag]] semantics — alongside the source and result `Blob` URL lifecycles
(via [[useBlobUrl]]) and Download + filename. A `process` rejection shows in
the status slot (`errorLabel` / `errorFallback` word it), clears the result
and hides Download; it never toasts. `process` may return null when the Tool
has too little state yet (no crop region).

`process` receives the raw `File`, not a pre-decoded `HTMLImageElement` —
distinct from the [[Batch asset pipeline]], which decodes once at upload
because its consumers draw one source to many canvas sizes. Single-Blob
consumers own decode where they have the context: `ImageCropper` reads the
preview `<img>` via `imgRef` (ReactCrop needs it DOM-attached anyway),
`BackgroundRemover` delegates to `@huggingface/transformers`.

Render props: `renderControls`, `renderSource` (the input pane, e.g. the
crop box) and `renderResult` (the output pane, above Download; also the
pending phase). All carry `{ controls, setControls(partial), pending,
recompute() }`; the source and result ctx add `{ error, source, sourceUrl,
result, resultUrl }`. `setControls` IS the recompute trigger — every
partial merges into the live bag (ref-based, same-tick partials compose)
and routes through the pipeline (ADR-0014; ADR-0009 for the original
design). `recompute()` is the escape hatch for a result that depends on
state outside the bag (`ImageCropper`'s `imgRef`, `BackgroundRemover`'s
cut-out cache), e.g. after `<img onLoad>`. `controlsDebounceMs` debounces
`setControls` for heavy `process` functions. A new file — picked again in
the dialog or after a reset — always starts from `initialControls`; Tools
clear their own non-controls state in `onAfterClose`.

### Batch mode (`multiple`)

Many `File`s in, one `Blob` out per file, with the same Tool-owned settings.
Steps: queue → processing → results. The input pane is the file list (a
horizontal strip on mobile) with "Add more images" and Process under it;
the output pane is a large Original ┊ Result comparison with Download (one
result) or Download ZIP (two or more) at its bottom. Results list per-file
downloads; "Change settings" returns to the queue with the same files.

The shell owns the queue (per-upload ids, so the same file picked twice is
two rows), size reads for the row labels, the run loop with progress,
per-file results, ZIP, and output-name dedupe within a run.

Invariants:

1. **One failure is not fatal** — `process` throwing marks only that file
   failed (listed with its message, left out of the ZIP); the rest of the
   batch still runs, and a status-slot notice counts the failures. Only
   when every file fails does the shell toast `failureToastLabel` and
   return to the queue.
2. **Nothing auto-downloads** — the user picks a file or the ZIP.
3. **Stale-safe** — a reset or unmount mid-run stops the run after its next
   `await` (via [[useStaleSafeAsync]]).

In the queue step the comparison is a **live preview** of one file (the
clicked row, else the first): `process` re-runs on it through the
[[Tool computation pipeline]] when the selection changes (immediately) or
`previewKey` changes (debounced 250 ms). A preview failure shows in the
status slot, without a toast. The batch itself only runs on Process (or
⌘/Ctrl+Enter, which lives in the queue step only, so it cannot start a
second run mid-run; it does nothing while `canProcess` is false).

The Tool owns its settings state and passes the rendered `settings` node,
`previewKey` (e.g. `JSON.stringify(settings)`), `process(file, { width,
height })`, `getOutputName(file)`, `zipPrefix`, and `canProcess` (false
disables Process and pauses the preview, e.g. the resizer before a size is
entered).

### Derived outputs (`output: 'assets' | 'text'`)

One image in, a set of outputs derived from it. Same entry, layout, status
slot and reset as single mode; the named prop `output` picks the form of
the output pane:

- **`assets`** — many files from the one image (`FaviconGenerator`,
  `SplashScreenGenerator`). `process` returns `{ assetGroups, textOutputs? }`.
  Each asset is a card that downloads it (`name`); one group is a plain grid,
  several are tabs. Download ZIP sits at the bottom of the output pane; an
  asset's `zipPath` (default `name`) places it in the ZIP, so folders like
  `ios-splash/` survive. `textOutputs` is the one named slot for copyable
  text next to the assets (link tags, meta tags, manifest JSON); a text block
  with a `zipPath` is also written into the ZIP.
- **`text`** — labelled, read-only text blocks with Copy in each label and no
  download (`ImageToBase64`). `process` returns `{ textOutputs }`.

There is no free-form output slot. The source is decoded once when added,
by the [[Batch asset pipeline]], and `process({ controls, file, image,
report })` gets it. A file the browser cannot decode toasts
`rejectToastLabel` (reading it failed); a `process` rejection shows in the
status slot and hides the outputs, never a toast. The input pane is
`renderSource` (the source, or a live preview of the controls, e.g.
Splash's safe-zone mock-ups); controls are a shell-owned bag as in single
mode, optional for Tools with none.

Run timing: by default `process` runs when a file is added and on every
control change. Slow work sets `actionLabel`: a Process button under the
input runs it (so does ⌘/Ctrl+Enter, except while it runs), a control
change waits for the next press, and while it runs the button shows `pendingLabel` with the progress `report(current, total)`
gives (Splash: "Generating 12/40"). "Choose another image" keeps the
controls and drops the old outputs; closing the dialog restores the initial
controls.

## Batch asset pipeline

The behavior under the [[File processor shell]]'s derived outputs
(`assets` / `text`): one uploaded image in, a set of derived results out.
Implemented by `useBatchAssetPipeline`
(`src/hooks/useBatchAssetPipeline.ts`).

Today's consumer: the shell's `DerivedFileProcessor`, and through it
`FaviconGenerator`, `SplashScreenGenerator` and `ImageToBase64`. The hook
owns the source and run wiring; the shell owns the layout (asset cards,
tabs, text blocks, Download ZIP).

The hook owns:

- File upload + optional `mimePrefix` validation + reject toast (rejected
  uploads leave state untouched). The shell runs the Tool's `validate`
  first and passes no `mimePrefix`; a failed decode still toasts.
- Source decoding via `loadImageFromBlob` → `sourceImage: HTMLImageElement`.
  The canonical decode primitive: takes any `Blob` (File, SVG-as-Blob,
  segmenter-output-Blob), owns its objectURL revoke lifecycle, returns the
  fully-loaded element. Adopters today: this pipeline, `processImage`,
  `imageFileToBase64`, `base64ToImageInfo` (decodes the dataUri via
  `fetch(dataUri).then(r => r.blob())` first), `applyBackground`
  (in `background-removal.ts`), `svgToPng` (in `mermaid-renderer.ts`),
  `ImageColorPicker`, and the [[File processor shell]]'s batch size reads.
- The source `Blob` URL (`sourcePreview`) — derived via [[useBlobUrl]] so
  the revoke-previous-then-create-next + revoke-on-unmount lifecycle lives
  in one module shared with the [[File processor shell]].
- The `regenerate(process)` lifecycle: stale-safety via `useStaleSafeAsync`
  (newer call wins; older session's result and progress reports are dropped),
  unmount-safety, and success / failure toasts when their labels are set.
  The shell sets neither: a failure goes to its status slot via `error`.
- A `progress` channel — the `process` callback receives a
  `report(current, total)` argument; stale-session reports are dropped.
- `downloadOne(blob, name)` + `downloadAll(zipName, files)` (the caller
  flattens its generic `results` shape into a `Record<string, Blob | string>`
  map; strings are written verbatim into the ZIP for cases like meta-tag
  HTML or manifest JSON).
- `reset()` — bumps the stale-safety session so any in-flight regenerate
  cannot write back over the cleared state.

The Tool owns `process` (what to derive) and its controls; the shell owns
rendering and how a result is flattened for the ZIP (each asset's
`zipPath`, plus text blocks that name one).

Does NOT fit:

- Multi-source N-File Tools producing a single result — use
  [[Sortable item bag]] (today: `ImageToPdf`, `CombinePdf`).
  N-in / N-out Tools (`ImageConvertor`, `ImageResizer`) use the
  [[File processor shell]] in batch mode (ADR-0026, ADR-0028).
- Single-Blob-out Tools — use the [[File processor shell]]'s `file` output.

The `regenerate` lifecycle echoes the [[Tool computation pipeline]] but
sheds debounce + `isEmpty`-bypass: these Tools fire on upload, on a control
change or on a Process button, never on a debounced input. The stale-safety + unmount-safety
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
   decides how to surface it (`SortablePdfShell` makes it a [[Tool status
   slot]] notice: "Skipped N unsupported files: ..."). Naming the
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
result out." Pick the [[File processor shell]]'s `assets` output when it's
the inverse (one file in, N results out; it runs on the [[Batch asset
pipeline]]). Pick [[Tool field bag]] when the inputs are a
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

- [[File processor shell]] — source `File` URL and result `Blob` URL
  (single mode), and one per thumbnail (batch mode).
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

1. **SSR-safe initial** — built on `useSyncExternalStore`; its client
   snapshot reads `window.matchMedia(query).matches` synchronously when
   `window` exists,
   so the first render already has the right boolean. Without this, an
   adopter that gates layout by viewport flashes the desktop layout for
   one frame on mobile.
2. **Subscription with cleanup** — listens for `change`, removes the
   listener on unmount or when `query` changes.
3. **Fallback via `ssrDefault`** — when `window.matchMedia` is absent
   (Node tests, jsdom without a `matchMedia` stub), the initial value
   falls back to `ssrDefault` (default `false`). It never decides what
   ships: every page is a [[Head-stamped page]], so no component is
   rendered at build time and nothing hydrates. Adopters whose layout
   differs by viewport still pick the *desktop* default explicitly — see
   [[DiagramEditor]]'s tablet gate for the canonical adopter.

Today's adopters:

- `<DbDiagram>` — `useMediaQuery('(min-width: 48rem)', true)`. The
  `MobileBlocker` renders only when the viewport is sub-tablet;
  `ssrDefault: true` renders the workspace where `matchMedia` is absent.
- `<Sidebar>` — `useMediaQuery('(max-width: 767px)')`. The mobile width
  class is purely additive (`w-full` vs `w-[260px]`), so `ssrDefault: false`
  (desktop layout assumed) is correct; in a browser the first render already
  reads the real viewport, so mobile users see no layout flash.

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
): {
  call: <TRes = unknown>(
    payload: TReq,
    options?: {
      onProgress?: (n: number) => void
      signal?: AbortSignal
      timeoutMs?: number
      transfer?: Array<Transferable>
    },
  ) => Promise<TRes>
  cancel: () => void
  hasPending: () => boolean
}
```

Today's adopters: `src/wasm/bcrypt.ts`, `src/wasm/pdf.ts`,
`src/utils/background-removal.ts`, `src/utils/regex-runner.ts`. The
invariants the bridge concentrates:

1. **`msgId` correlation** — each `.call(...)` gets a unique id; responses
   are matched by id through a `pending` map, so concurrent calls cannot
   swap results. One `message` listener per worker instance.
2. **Envelopes** — `{ id, error }` → `reject(new Error(error))`;
   `{ id, result }` → `resolve(result)`; `{ id, progress }` is
   non-terminal and goes to that call's `onProgress`. A worker-thrown
   error can't be mistaken for a successful empty result.
3. **Worker failure** — an `error` / `messageerror` event (failed script
   load, uncaught throw) rejects every pending call and drops the worker;
   the next call lazily constructs a fresh one. No call hangs forever on
   a dead worker.
4. **Abort** — `cancel()`, per-call `timeoutMs`, and an aborted
   per-call `signal` terminate the worker (the only way to stop a
   runaway synchronous job) and reject pending calls with
   `WorkerAbortError` (`reason: 'cancel' | 'timeout'`; detect with
   `isWorkerAbortError`). An already-aborted `signal` rejects without
   posting. Pass `signal` only for workers that are cheap to respawn —
   today `regex-runner`, fed the pipeline's signal by `RegexTester`.
   The PDF, bcrypt and background-removal workers hold loaded WASM /
   models, so they are not handed a signal (termination would force a
   reload on every superseded keystroke).
5. **Lazy construction** — `workerFactory` runs on the first `.call(...)`
   (and again after a failure/abort), not at module import. Facades
   imported into Tools the user never visits pay zero worker-construction
   cost.

The wire shapes (`WorkerRequest<T>`, `WorkerResponse<T>`) live in
`src/types/wasm/worker-bridge.ts` so worker files
(`src/workers/*.worker.ts`) can type `e.data` and `self.postMessage`.
The worker side of the protocol stays inlined per worker; worker-side
initialisers use `retryableOnce` (`src/workers/retryable-once.ts`) so a
failed `init()` is retried rather than cached forever.

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

## Engine

A library or browser built-in that does a Tool's real work: an editor, a
renderer, a parser, a model runtime, a codec. UI-framework glue (React,
Radix, the router, stores, motion) is not an Engine. In the Dioxus build
each Engine is replaced by Rust, kept behind an [[Engine bridge]], or
reached as a [[Platform API]] (ADR-0033).
_Avoid_: library, dependency (when the split matters)

## Engine bridge

The only form a kept JavaScript [[Engine]] may take in the Dioxus build: one
module per library, which no Tool code calls except through its
[[Bridge facade]]. Which Engines have one is recorded in ADR-0033.
_Avoid_: JS island, interop module, wrapper

## Bridge facade

The typed Rust API over one [[Engine bridge]], shaped around the Tool's
outputs rather than the library's objects, so that replacing the Engine
leaves Tool code unchanged.

## Platform API

A browser built-in that a Tool's Rust code reaches without a JavaScript
file of ours: image codecs, canvas, WebCrypto, `Intl`, locale-aware
comparison and local time.
_Avoid_: web API wrapper, shim

## Platform layer

The Rust code that wraps [[Platform API]]s and sits beside the
[[Bridge facade]]s. It is the only code that touches the browser; Tool logic
stays browser-free.
_Avoid_: boundary layer, web layer

## Engine trial

A time-boxed comparison of a Rust candidate against the JavaScript
[[Engine]] it would replace, judged on a corpus and a pass bar written
before it starts. A failed trial keeps the Engine behind its
[[Engine bridge]].
_Avoid_: spike (the spike was issue 18), experiment

## Sanitised markup

HTML or SVG that has passed through a sanitising [[Bridge facade]] once, and
the only markup a Tool may render as raw HTML.
_Avoid_: safe HTML, clean HTML

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
  **Being retired for input errors (ADR-0027):** a Tool built from a
  layout shell never toasts an input error — the shell shows it in the
  [[Tool status slot]]. Hand-built Tools still on this path are listed in
  `LAYOUT_MIGRATION_PENDING` and move off it as they migrate. Toasts stay
  for the *outcome of an action*: copied, downloaded, file read failed.
  `custom`-layout Tools follow the same rule without a shell: each renders
  its own `<ToolStatus>` from the pipeline's `error` (plus any error
  returned as data), and `src/test/layout-guard.spec.ts` keeps
  `<ErrorBanner>` and off-theme `text-red-*` / `text-yellow-*` classes out
  of them. Hand-built sites that need the input bag (HashGenerator) still
  pass the full `onError: (err, input) => …` callback and continue to
  `useToast()` at the call site until they migrate.
- **Inline validation rejections** — synchronous rejections in event
  handlers (`'Maximum dimension is ...'`, `'Please enter JSON input'`,
  `'Upload a valid image file'`). A rejected *file* (wrong type, unreadable)
  stays a toast — it is the outcome of the upload action. A rejected
  *typed value* is an input error and belongs in the [[Tool status slot]]
  even outside a pipeline (`BcryptHasher`'s invalid-hash check keeps it in
  local state and renders `<ToolStatus>`); the remaining toasting sites
  move as their Tools migrate.
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
a toast that disappears. Every layout shell's [[Tool status slot]]
exists exactly for this case (`JsonDiffChecker`'s "Invalid JSON" is one).
A toast would lose the context (which input was malformed) and dismiss
before the user could act on it.

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
  beyond viewport height (no adopter today; `JwtDecoder` and
  `JsonpathEvaluator` used it before moving to the [[Transformer shell]]).

`SplitPanel` accepts any number of `Pane` children and interleaves the
divider between consecutive panes. In practice every adopter is
two-pane; the N-child handling is defensive, not a feature.

[[Comparator shell]] does NOT fit `SplitPanel`: its layout is "two
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
`UuidGenerator`, `RegexTester`,
`PlaceholderImageGenerator`, the encode dialog inside
`DataUriGenerator`, and the three pane wrappers inside
[[Comparator shell]]).

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

- `JsonpathEvaluator` (`<DisclosurePanel label="JSONPath Cheatsheet" padding="none">`,
  in the [[Transformer shell]]'s controls row)
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

_Removed (2026-11-10). `<InlineLabeledRow>` was the horizontal
label/value/copy cell for hand-built result rows; its last adopters moved
onto the [[Transformer shell]]'s `fields` output kind (ADR-0027)._

## Field list

`<FieldList>` (`src/components/common/output/FieldList.tsx`): the
label/value rows behind the `fields` output kind of both the
[[Transformer shell]] and the [[Generator shell]]. Each row is an
`OutputField` (`{ label, value, copy?, copyValue? }`; `TransformerField`
and `GeneratorField` are aliases): a `<dt>` with the label and a Copy
button named by it (`Copy <label> to clipboard`), and a `<dd>` with the
value, line breaks kept. `copy: false` drops the button; `copyValue` is
copied instead of the shown value. Labels may repeat (several SANs,
several JSONPath matches).

It renders only the rows. The pane label (Transformer's `copyAll`), the
empty-state placeholder and the output region stay with each shell.
Both shells render rows identically (small muted row labels, `p-2`
values): the two pre-extraction styles were unified after a visual
review, so a label/value row looks the same in every Tool.

The image preview box both shells' `image` kinds show is shared the same
way as `<OutputImage>` (`{ alt, src }`); their Download buttons are not
(Transformer: one primary Download or an icon button in the label;
Generator: one button per encoded file, built on click).

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

Reads from localStorage salvage item by item and never write
(`src/diagram/codecs/restore.ts`, built on the restore rule of [[Persisted
tool input]]); saving one diagram leaves the others as found.

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
`VerifyTab.handleVerify` — two button-fired async paths in one Tool) and
`TypescriptPlayground`'s debounced transpile. These, and
`RsaKeyGenerator` before it moved to the [[Generator shell]], previously
hand-rolled the `setPending(true)/await/setResult/finally
setPending(false)` dance and none had stale-safety; the `transpile` and
RSA-generate paths also lacked unmount-safety guards.

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
use the [[File processor shell]]'s `assets` output (on the [[Batch asset
pipeline]]). The action closure is captured fresh on
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
