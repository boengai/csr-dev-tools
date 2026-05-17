# ADR 0016 — Image-upload prelude stays per-site

- **Status:** Accepted
- **Date:** 2026-05-17

## Context

Five sites in the codebase consume an uploaded image `File` and run some
shape of "validate MIME → hold source state → expose a preview URL"
prelude before doing their actual work. A natural architectural
suggestion is to extract that prelude into a shared `useImageSourceUpload`
seam.

The five sites differ more than they look:

| Site | File state | MIME validation | Source preview URL | Multiplicity |
|---|---|---|---|---|
| [[Image tool shell]] | `useState<File\|null>` | hardcoded `file.type.startsWith('image/')` | `useBlobUrl(source)` | single |
| [[Batch asset pipeline]] | `useState<File\|null>` | configurable `mimePrefix` string | `useBlobUrl(sourceFile)` | single |
| `ImageColorPicker` | `useState<File\|null>` | hardcoded `image/` prefix (added by fix; previously missing) | `useBlobUrl(imageFile)` | single |
| `ImageCompressor` | inside a [[Tool field bag]] | closed allow-set `COMPRESSIBLE_FORMATS.has(type)` | **none** (no source preview) | single |
| `ImageConvertor` | `useReducer` state, `Array<File>` | predicate over the array | derived via `FileReader → new Image()` per file | **multiple** |

The shared shape that actually exists across these sites is "single `File`
+ `useBlobUrl` source preview" — three of the five (`ImageToolShell`,
`useBatchAssetPipeline`, `ImageColorPicker`). Even there, validation
varies (hardcoded prefix vs configurable prefix vs hardcoded prefix). The
other two sites are structurally different: `ImageCompressor` lives inside
the [[Tool field bag]] pipeline and has no preview URL at all;
`ImageConvertor` is multi-file with a bespoke decode chain and a reducer
state machine.

A proposed `useImageSourceUpload({ validate, onReject })` seam would have
to:

1. Carry a `validate: (file) => boolean` callback (the three styles of
   validation don't unify under a single string-prefix knob).
2. Carry an `onReject: (file) => void` callback (the two shells use
   different reject behaviors — callback prop vs toast).
3. Apply only to the three single-File-with-preview sites — the other
   two cannot adopt without a separate shape variant.

Apply the deletion test: extracting and adopting would shave roughly 10
lines across the three sites (a one-line guard + one-line setter
each) and cost roughly 30+ lines for the hook itself (option handling,
ref plumbing, `useBlobUrl` wiring). The shared API ends up being mostly
two callbacks — barely depth, mostly relocation.

The one real leverage gain — *forcing* per-site MIME validation by
convention — has already been collapsed: the missing validation in
`ImageColorPicker` was fixed inline, mirroring the pattern in the two
shells.

## Decision

Each image-upload site **keeps its own upload prelude** — the validation
guard, the source-File state, and (where present) the `useBlobUrl`
source preview. No shared `useImageSourceUpload` hook is extracted.

`useBlobUrl` remains the named seam for the object-URL lifecycle (per
its own CONTEXT.md section); the surrounding upload + validation logic
stays at the call site.

## Consequences

**Positive**

- Each site's validation matches its actual contract: `ImageToolShell`
  hardcodes the `image/` prefix because it's a generic image shell;
  `useBatchAssetPipeline` takes `mimePrefix` because it's a generic
  batch hook; `ImageCompressor` checks a closed allow-set because it
  only handles formats its compressor supports; `ImageConvertor`
  predicates over an array because it's multi-file. No site loses
  semantic precision to a generic validate callback.
- The two shells stay free to evolve their reject behaviors independently
  (`ImageToolShell`'s `onRejectInvalidFile` callback vs
  `useBatchAssetPipeline`'s toast-based reject). Each is the right
  shape for its consumers.
- `useBlobUrl` remains the load-bearing seam; sites compose it directly
  rather than through an intermediate hook.

**Negative**

- A reader skimming the codebase sees four sites (the three single-File
  sites plus `ImageCompressor`) each implementing their own MIME guard.
  The guards drift independently — if a new image MIME type becomes
  relevant, each site must be updated separately.
- Future architecture passes scanning these sites will see the recurring
  shape and may re-suggest extraction. This ADR is the answer.
- Adding a sixth image-upload Tool requires copying the three-line
  validate + state + URL pattern; there is no hook to graduate to.

## Revisit when

- A fourth single-File-with-preview image Tool lands that wants
  preview behavior identical to the existing three. At that point the
  shared shape is wide enough (4 of 6 sites) that a hook may earn its
  keep — and the validation styles may also have converged.
- The validation semantics across sites converge to a single form
  (e.g. every image Tool standardizes on `mimePrefix: string`). At
  that point the proposed seam's API stops needing to be a callback
  and the depth case strengthens.
- An incident around inconsistent reject UX (e.g. one site silently
  drops invalid files while another toasts) makes "force validation by
  convention" load-bearing rather than nice-to-have. At that point the
  leverage case for extraction strengthens regardless of code volume.
- `ImageConvertor`'s state machine is decomposed and one of its pieces
  ends up needing the same single-File prelude as the three shell sites
  — at that point a fourth adopter exists, repeating the trigger above.
