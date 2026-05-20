# ADR 0020 — DataUriGenerator stays bespoke (two `<ToolDialogShell>`s, hand-rolled tile)

- **Status:** Accepted
- **Date:** 2026-05-20

## Context

`DataUriGenerator` is the only Tool whose tile carries **both** a file
upload and a button, opening **two different dialogs**:

- **Encode** — the user selects a file via `<UploadInput>`. The Tool
  runs `await fileToDataUri(file)` and then opens the encode dialog
  with `setEncodeOpen(true)`; the dialog body is "metadata header →
  divider → stacked output panes" (data URI, HTML `<img>`, CSS `url()`).
- **Decode** — the user clicks a "Decode Data URI" button. The Tool
  calls `setDecodeOpen(true)` immediately; the dialog body is the
  side-by-side `<SplitPanel>` source→result shape, debounced via
  [[Tool computation pipeline]].

Today the wiring is bespoke: two `useState(false)` flags, two
`<ToolDialogShell>` instances, and a hand-built tile that renders an
`<UploadInput>` and a `<Button>` side-by-side.

A 2026-05-20 architecture pass asked whether this should adopt
[[Tool dialog frame]] or [[Upload dialog frame]]:

- `<ToolDialogFrame>` owns "tile (description + button column) → one
  controlled `<ToolDialogShell>`." Triggers are
  `{ label, onOpen? }` — button-only. Today's adopters all have
  button-only tiles.
- `<UploadDialogFrame>` owns "tile (description + `<UploadInput>`) → one
  controlled `<ToolDialogShell>`." The tile IS the upload trigger; the
  Tool's `onUpload(files, openDialog)` decides when to open. Today's
  adopters all have upload-only tiles.

Neither fits `DataUriGenerator` directly. The two viable
generalizations:

- **(A) Generalize `<ToolDialogFrame>` triggers to a discriminated
  `{ kind: 'button' | 'upload', … }` union, and admit multiple dialogs
  per frame.** Real surface growth (two new knobs — trigger kind, dialog
  count) and zero benefit to existing adopters; AES/StringEscape stay
  on `{ label, onOpen? }`; FaviconGenerator/ImageToBase64/SplashScreenGenerator
  stay on `<UploadDialogFrame>`.
- **(B) A third sibling frame for mixed tiles** (`<MixedDialogFrame>`?).
  Adds a third entry in the frame family for one adopter.

Both options grow the frame family API for a single Tool. The "two
adopters = real seam" rule (and the broader knobs-vs-depth principle
upheld by [[Tool dialog frame]] / [[Upload dialog frame]] and recorded
across ADR-0007 / ADR-0010 / ADR-0014 / ADR-0019) says no — one adopter
is not enough to justify the surface.

## Decision

`DataUriGenerator` **stays bespoke**: two `useState(false)` flags, two
`<ToolDialogShell>` instances, and a hand-built tile mixing
`<UploadInput>` and `<Button>`. It does NOT migrate to
`<ToolDialogFrame>` or `<UploadDialogFrame>`; the frame family does NOT
grow a mixed-tile variant or a multi-dialog knob.

## Consequences

**Positive**

- The frame family stays narrow. `<ToolDialogFrame>` triggers remain
  `{ label, onOpen? }`. `<UploadDialogFrame>` remains "tile IS the
  upload trigger." A reader scanning either frame sees exactly one
  shape per frame.
- The "knobs vs depth" rule is upheld — no `kind: 'button' | 'upload'`
  discriminated trigger union, no multi-dialog list, no third sibling
  frame, for the sake of one adopter.
- The two dialogs `DataUriGenerator` owns can evolve independently
  (different layouts: stacked-output for encode vs side-by-side
  source→result for decode) without the frame having to model both
  shapes.

**Negative**

- `DataUriGenerator` carries ~15 lines of dialog plumbing
  (`encodeOpen`/`decodeOpen` state, two `<ToolDialogShell>` declarations
  with controlled `open`/`onOpenChange`) that the frame family would
  otherwise absorb. The Tool is visibly heavier than its single-dialog
  siblings.
- The hand-built tile (`UploadInput` + `Button` in a centered column)
  duplicates layout decisions the frames otherwise own. If `<Button>`
  grows a new layout prop or the tile spacing changes, this Tool needs
  its own follow-up.

## Revisit when

- A **second Tool with a hybrid upload+button tile** ships. Two
  adopters with the same shape make `(A)` or `(B)` a real seam rather
  than a knob for one. At that point the discriminated-trigger
  generalization on `<ToolDialogFrame>` (preferred over a third sibling
  frame) becomes the right call.
- A **second Tool with two button-fired dialogs on one tile** ships
  (without the upload half). Two adopters justify lifting the
  multi-dialog half into `<ToolDialogFrame>` independently of the
  trigger-kind change. Today the only candidates near this shape
  (`AesEncryptDecrypt`, `StringEscape`) collapse to a single dialog
  with `mode` state and two triggers per ADR — the frame's existing
  two-trigger-one-dialog shape — and that's the right model for them.
- The **dialog state itself grows non-trivial invariants** the frame
  could own — e.g. "closing the encode dialog must clear
  `encodeResult`" turns into a shared "reset on close" contract.
  Today's `onReset` handler is enough; if a contributor mis-wires it,
  the frame's `onReset` slot is the place to centralize.
