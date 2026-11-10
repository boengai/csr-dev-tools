# ADR 0028 — One File Processor shell, entered through an upload area

- **Status:** Accepted
- **Date:** 2026-11-10
- **Supersedes:** ADR-0026's split into two image shells (its batch flow and Resizer semantics still stand)
- **Also affects:** ADR-0009, ADR-0014 (they describe `ImageToolShell`, now the single mode), ADR-0016, ADR-0027 (step 5)

## Context

ADR-0027 makes every Tool compose from a layout shell, and step 5 asks for
one `FileProcessorShell`. The four File Processor Tools already on a shell
used two of them:

- [[Image tool shell]] (`BackgroundRemover`, `ImageCropper`): one file and
  a live preview.
- [[Image batch shell]] (ADR-0026; `ImageConvertor`, `ImageResizer`): a
  queue, a Process button, and per-file results.

Both made the page tile itself the file picker ([[Upload dialog frame]]),
so the dialog only opened once a valid file had been picked. That broke
the shared layout rules in three ways:

- A tool route with `autoOpen` had nothing to show. The image Tools
  ignored `autoOpen`.
- Drag-and-drop had nowhere to go.
- Each shell placed its buttons differently, with "Start over" as a manual
  reset, and showed processing errors inline in its own markup.

## Decision

Merge both into `<FileProcessorShell>`
(`src/components/common/file-processor/`). The named prop `multiple`
picks the mode, and the two modes share one entry, one layout and one
reset.

- **One way in.**
  - The tile is a plain button ([[Tool dialog frame]]). `autoOpen` opens
    the dialog on the tool route.
  - The dialog opens on an **upload area** that fills the work area until
    a file is added. It takes a pick or a drop.
- **Validation stays per Tool** (ADR-0016). The Tool passes `accept` and,
  if needed, `validate`, which defaults to matching `accept`. The shell no
  longer hard-codes `image/`.
  - Drops go through `validate` too, because a drop skips the picker's
    filter.
  - A rejected file still toasts the Tool's `rejectToastLabel`.
- **Layout:** controls → [[Tool status slot]] → work area.
  - The input pane comes first. It holds the source (single) or the queue
    (batch), with "Choose another …" / "Add more …" and Process under it.
  - The output pane ends with Download / Download ZIP.
  - Single mode's `renderPreview` is split into `renderSource` and
    `renderResult`, so the shell can place Download under the output.
- **Errors:**
  - Single: a `process` rejection goes to the status slot, clears the
    result and hides Download.
  - Batch: a preview failure goes to the status slot. Failed rows keep
    their reason, and a notice counts them. A run where every file fails
    still toasts, because it is the outcome of pressing Process.
- **Reset on close.** Closing the dialog drops the file or queue and
  restores the initial controls, so reopening shows the upload area.
  "Start over" is gone.
- `noun` (default file / files) names files in the shell's copy and its
  input names. The image Tools pass `IMAGE_FILE_NOUN`.

The batch internals (queue, size reads, run loop, ZIP, dedupe, live
preview) and the single-mode controls bag (ADR-0014) move across
unchanged.

## Consequences

- User-visible:
  - Each tile is a button, not a picker.
  - The tool route opens on the upload area.
  - Files can be dropped.
  - The Cropper now shows the cropped result beside the crop box.
  - Background Remover's inline "Processing failed" panel and its
    no-op "Try Again" button are replaced by the status slot.
- `ImageToolShell`, `ImageBatchShell` and their types are deleted.
  CONTEXT.md keeps the old names as aliases of "File processor shell".
- Favicon, Splash Screen and Image → Base64 moved in a later batch the same
  day: the shell gained `output="assets"` (one file → many files + ZIP, with
  copyable `textOutputs`) and `output="text"`, plus an optional Process
  button (`actionLabel`). Image Compressor moved onto single mode.
  `UploadDialogFrame` then had no users and was deleted.
- The File Processor contract suite has no bad-input fixture, because
  files are never persisted. The shell's own spec covers the error path
  with a failing `process`.
