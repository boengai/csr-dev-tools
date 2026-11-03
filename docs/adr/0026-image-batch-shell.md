# ADR 0026 — Image batch shell for many-files-in / many-Blobs-out Tools

- **Status:** Accepted
- **Date:** 2026-11-03
- **Supersedes:** ADR-0002, ADR-0017
- **Also affects:** ADR-0001, ADR-0004, ADR-0016 (their notes on the inlined converter describe the old code)

## Context

Image Resizer was single-file, built on [[Image tool shell]]. Image Converter
already took many files, but its workflow was inlined (ADR-0002, "one adapter
is a hypothetical seam") with dataURL previews (ADR-0017, because N object
URLs held in one component's state would need four revoke sites).

Users asked for batch resizing, and for the converter to show per-file
results, skip files that fail instead of aborting, and accept more files
after the first pick. Both Tools now need the same flow: import → queue
(add / remove) → processing → per-file results with single and ZIP download.
That is the second adapter ADR-0002 asked to wait for.

## Decision

Add `<ImageBatchShell>` (`src/components/common/image-batch/`). It owns the
queue, size reads, the run loop and progress, per-file results, ZIP, and
output-name dedupe. Tools own their settings state and pass `settings`,
`process(file, { width, height })`, `getOutputName(file)`, and `canProcess`.

- `process` returns a `Blob`, not a dataURL, so N results don't sit in
  memory as base64 strings.
- Thumbnails are one small component per row, each calling [[useBlobUrl]]
  on its own `Blob`. Each URL's lifecycle belongs to the component that
  renders it, so the four revoke sites ADR-0017 feared don't exist and no
  `useBlobUrlList` is needed.
- A failure in `process` marks that file failed and the run goes on. If
  every file fails, the shell toasts and returns to the queue.
- Nothing downloads automatically: once results show, the user downloads
  one file or the ZIP. (The converter used to auto-download at the end of
  a run.)
- Resizer semantics: a **Resize mode** picks how Width/Height apply.
  - *Fit within* (default): a box (`processImage`'s `maxWidth`/`maxHeight`).
    Each image keeps its own aspect ratio, a blank side is unconstrained,
    and images already inside the box are not enlarged.
  - *Exact — crop to fill*: every output is exactly W×H (`strategy:
    'cover'`), scaled to cover the box and centre-cropped. Nothing is distorted.
  - *Exact — stretch*: every output is exactly W×H (`strategy: 'stretch'`),
    distorting images whose shape differs.
  Both exact modes need both sides and may enlarge. The output format defaults to "Keep original";
  if the browser can't encode the original format (GIF, BMP), the output
  is PNG.

[[Image tool shell]] remains for single-file Tools with a live preview
(`ImageCropper`, `BackgroundRemover`).

## Consequences

- The converter and resizer share one tested flow
  (`ImageBatchShell.dom.spec.tsx`); each Tool file is mostly settings.
- The workspace keeps the old resizer's full-screen dialog
  ([[Upload dialog frame]]): the page tile is the upload button, and picking
  images opens the dialog. It shows settings on top, then a large side-by-side
  Original ┊ Result comparison filling the dialog (stacked on mobile), with
  the image list in a left-hand column, and actions at the bottom. The
  converter, previously inline on the page, now opens the same dialog. The
  queue step's comparison is a **live preview**: the previewed image is the
  clicked row, else the first. It re-runs `process` on
  that image when the selection changes (immediately) or the settings change
  (debounced 250 ms), via [[Tool computation pipeline]]. Settings live in the
  Tool, so the Tool passes `previewKey` (e.g. `JSON.stringify(settings)`) to
  tell the shell they changed. Only the previewed image is processed until
  the user runs the batch. Preview errors show inline in the panel, without
  a toast. The results step uses the same layout: click a result to compare
  it, or download it from its row.
- The old resizer's W×H with a locked aspect ratio maps to *Fit within*. Its
  free W×H maps to *Exact — stretch*.
