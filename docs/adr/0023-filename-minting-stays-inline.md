# ADR 0023 — Filename minting stays inline at download call sites

- **Status:** Accepted
- **Date:** 2026-05-25

## Context

The `replace(/[^a-zA-Z0-9-_]/g, '_')` filename-sanitization regex
appears verbatim in 4 call sites across 3 files:

- `src/components/feature/code/ProtobufCodec.tsx:100, 163` — sanitizes
  the user-selected `msgType` (no `.toLowerCase()`).
- `src/components/feature/data/db-diagram/index.tsx:113` — sanitizes
  the user-entered `diagramName`, then `.toLowerCase()`.
- `src/components/feature/data/db-diagram/ExportSqlPanel.tsx:17` —
  same sanitize-and-lowercase, plus a `-${dialect}` suffix join.

Each call site builds the final filename inline with a template
literal: `${safeName}.${ext}`, `${safeName}-${suffix}.${ext}`, etc.

An architecture pass on 2026-05-25 explored absorbing this into one
of:

- A `mintDownloadName(baseName, { suffix?, extension, lowercase? }):
  string` helper alongside `parseFileName` in `src/utils/file.ts`.
- A richer `useDownload.downloadBlob({ bytes, mimeType, baseName,
  suffix?, extension, lowercase? })` overload that owns sanitize +
  blob construction + extension join + toast emission in one call.

Both candidates failed the deletion test. The absorbed knowledge is a
single-line regex plus a template-literal concat — about as shallow
as a module can be. The toast-emission and blob-construction
invariants are already concentrated in [[useDownload]]; pulling
filename minting in alongside them would name a new concept
("download filename minting") but not concentrate behavior. The
interface (one call) would be the same complexity as the
implementation (one regex + one join).

The four call sites also diverge on case-folding (db-diagram lowers,
ProtobufCodec preserves) and on suffix shape (ExportSqlPanel
interpolates `dialect`, the others don't). A shared helper would
need a `lowercase` knob immediately, and a future fifth call site
would likely add a second knob (max-length truncation, Unicode
normalization, reserved-name avoidance on Windows, etc.). Per the
common-component rule, knobs are a code smell — they're how shallow
abstractions grow without earning depth.

`parseFileName` in `src/utils/file.ts` stays as the image-tool-
specific minter. Its `csr-dev-tools_<safe>_<timestamp>.<ext>` shape
encodes a different concern: audit-trail filenames for image
exports, with `MimeType → extension` dispatch from
`FILE_EXTENSIONS`. The new candidate would not have replaced it; the
two would coexist as parallel minters, which is a further sign that
"filename minting" is not one concept.

The separate question of `useDownload` adoption — `db-diagram` and
`ProtobufCodec` bypassing the hook by importing `downloadBlob`
directly from `@/utils/download` — was a real invariant violation
(CONTEXT.md Toast channel section: "All Tool-side download paths
route through it"). That fix landed alongside this decision: four
call sites migrated from raw `downloadBlob` to `useDownload`,
restoring the `Downloaded ${filename}` success toast.

## Decision

Filename minting stays inline at each download call site.
`useDownload` accepts a finished `filename: string` and remains the
only abstraction across the download family. No `mintDownloadName`
helper, no `useDownload` overload that takes `baseName` + parts.

The four hand-rolled sanitize regexes stay duplicated. The case-fold
divergence between ProtobufCodec (preserves) and db-diagram (lowers)
stays at the call site, where it's locally inspectable.

## Consequences

**Positive**

- The four sanitize sites are one-line, locally readable. A reader
  looking at any download call sees the full filename construction
  without stepping into a helper.
- Future variations (Windows reserved-name avoidance, length caps,
  Unicode normalization) can be added at the one call site that
  needs them without growing knobs on a shared helper.
- `useDownload`'s interface stays minimal — four parallel methods
  (`downloadBlob`, `downloadDataUrl`, `downloadSvg`, `downloadPemFile`),
  each taking `(payload, filename)`. New download types follow the
  same template.

**Negative**

- The `[^a-zA-Z0-9-_]` regex is repeated 4×. A reader skimming the
  family sees the same regex spelled out at each site.
- A future architecture pass scanning for repeated patterns may
  re-suggest the helper or the hook overload. This ADR is the
  answer.

## Revisit when

- A fifth+ call site lands that needs the same sanitize-and-concat
  shape AND introduces a knob the existing inline copies don't have
  (max-length truncation, Unicode normalization, reserved-name
  avoidance on Windows, deterministic hashing for de-duplication).
  A genuine new variant changes the "1-line regex" premise.
- `useDownload` itself grows a non-trivial invariant that has to
  apply across every download call — e.g., format-allowlist
  enforcement, telemetry on which Tools produced downloads, async
  queueing for large blobs, a download-progress signal. At that
  point absorbing filename minting may become a natural part of the
  deeper hook.
- A second image-tool-style minter joins `parseFileName` (e.g., a
  "video-tool filename minter" with similar prefix+timestamp shape).
  Two parallel minters would justify factoring a shared primitive
  underneath both; today there is only one.
