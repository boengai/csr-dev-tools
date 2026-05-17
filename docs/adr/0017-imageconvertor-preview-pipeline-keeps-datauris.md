# ADR 0017 — `ImageConvertor`'s preview pipeline keeps dataURLs

- **Status:** Accepted
- **Date:** 2026-05-17

## Context

`ImageConvertor` (`src/components/feature/image/ImageConvertor.tsx`,
~320 lines) renders a preview tile per uploaded `File` while the user
picks a target format. Its preview effect (`:74-105`) reads each `File`
via `FileReader.readAsDataURL`, then sets `img.src = dataUrl` to harvest
dimensions, and stores `Array<{ url, width, height }>` in reducer state.
The preview tiles render `<img src={previews[idx].url}>` (`:248`).

A 2026-05-17 architecture pass migrated `loadImageFromFile`
(`src/utils/image.ts`) from `FileReader.readAsDataURL` to
`URL.createObjectURL`: drops the base64 round-trip, drops the FileReader
plumbing, single error shape. The natural follow-up was to apply the
same swap to `ImageConvertor`'s preview pipeline — same primitive, two
fewer FileReader sites in the codebase.

For `loadImageFromFile` the swap is contained: one URL is created, one
revoke fires in `img.onload`/`onerror`, the `HTMLImageElement` returned
to the caller has its bytes decoded into the element and no longer
needs the URL.

For `ImageConvertor`'s preview pipeline the swap is **not** contained.
The URL must live as long as the preview tile is rendered, which means
the lifecycle spans React state across N images. Four revoke sites
would become load-bearing:

1. **Effect cleanup** (`:102-104`) — must revoke whatever URLs are in
   `previews` at cleanup time.
2. **The "if cancelled" branch in `Promise.all`** (`:99`) — currently
   silently drops the resolved `data`; with objectURLs, the per-file
   URLs created inside the Promise chain orphan unless explicitly
   revoked before bailing.
3. **Per-image removal** (`handleRemoveImage`, `:123-128`) — the URL
   for the removed index is orphaned.
4. **Component unmount** — implicitly covered by #1.

[[useBlobUrl]] does not apply — it manages exactly one blob; this site
has N. A `useBlobUrlList` extraction would be a new module for one
adopter, which fails the deletion test on its own merits.

`dataURL` strings are immutable and GC-managed; the current code carries
zero URL lifecycle discipline.

## Decision

`ImageConvertor`'s preview pipeline keeps `FileReader.readAsDataURL` +
dataURL-string storage in `previews`. `loadImageFromFile` (its sibling
in `src/utils/image.ts`, used by [[Batch asset pipeline]]) has migrated
to `URL.createObjectURL`; `ImageConvertor` does not follow.

## Consequences

**Positive**

- The preview pipeline carries zero URL lifecycle discipline; the bug
  surface stays small. No revoke-on-cleanup, no revoke-on-cancel, no
  revoke-on-remove.
- The reducer's `previews: Array<{ url, width, height }>` shape is
  preserved — the per-tile URL is just data, not a managed handle.
- The dataURL bloat (~33% larger than original bytes) is bounded by the
  upload list size; a user converting 20 5MB images sees ~33MB of base64
  strings in memory transiently — acceptable for a desktop dev tool.

**Negative**

- A reader skimming the codebase sees a `FileReader.readAsDataURL` site
  sitting alongside the recently-migrated `loadImageFromFile`. The
  discrepancy looks like a missed migration.
- A future architecture pass scanning for FileReader usage may
  re-suggest the swap. This ADR is the answer.
- Users uploading very large batches (~50 large images at once) carry
  more transient memory than they would with objectURLs.

## Revisit when

- `ImageConvertor`'s preview pipeline is decomposed into a per-tile
  component (e.g., `<PreviewTile file={file}>` that wraps [[useBlobUrl]]
  internally). At that point each tile owns one URL with a lifecycle
  bounded by its own mount — the existing seam applies cleanly and the
  reducer no longer needs to hold URL strings.
- A second adopter lands that needs "N decoded image references rendered
  to N `<img>` tags with N independent lifecycles." Two adopters of a
  `useBlobUrlList`-shaped pattern would justify extracting one.
- Browser memory pressure becomes a real complaint for batch-upload
  users — at which point the cost of revoke-discipline pays for itself.
