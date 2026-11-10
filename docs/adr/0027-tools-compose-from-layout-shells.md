# ADR 0027 — Tools compose from layout shells; no monorepo

- **Status:** Accepted
- **Date:** 2026-11-10
- **Amends:** ADR-0021 (its `renderBanner(error)` slot becomes the shell-owned [[Tool status slot]] in every shell)
- **Keeps:** ADR-0001 (no progress channel), ADR-0006 (CSS playgrounds stay unshelled), ADR-0016 (upload prelude stays per site)
- **Revisit when the Tool migrates:**
  - ADR-0020, step 5: `DataUriGenerator` stays bespoke. It is tagged `file-processor`, so it can only move once that ADR is superseded or the Tool is retagged `custom`.
  - ADR-0005 (`ProtobufCodec` state) and ADR-0008 / ADR-0013 (`PlaceholderImageGenerator` / `MarkdownTableGenerator` reducers): these concern state, not layout. Their state can stay as Tool-owned controls inside a shell; confirm during steps 2–4.

## Context

The same behaviour looked and worked differently from Tool to Tool. An
inventory of the 84 Tools on 2026-11-10 found:

- **Mode switching** done four ways: a toggle, buttons that swap variant,
  tabs, or one tile trigger per mode.
- **Input errors** shown four ways: `ErrorBanner`, hand-styled `<p>`s
  (each different), `showError` toasts, and the pipeline's automatic
  `errorLabel` toast.
- **Run timing** differed between Tools of the same kind. Some generators
  ran as you typed; others needed a button.
- **Generate buttons** varied in variant and width.
- **Uploads** started four ways.
- **Empty states:** only 5 Tools used `EmptyState`.

Seven shells already existed and covered 26 Tools; 58 were built by hand.
The question was raised whether a reusable wireframe layer warranted a
monorepo (a separate UI package).

## Decision

1. **No monorepo.** There is one consumer (this app). Shells stay in
   `src/components/common/<shell>/`. Revisit only when a second app
   needs the same components.
2. **Layout types.** Every Tool declares `layout` in `tool-routes.ts`. The
   value is one of `transformer`, `codec`, `generator`, `file-processor`,
   `comparator` or `custom` (see CONTEXT.md → [[Layout type]]). Each
   non-`custom` value maps 1:1 to a shell. The shell is the UX spec;
   `docs/ux/` holds a rough drawing and journey for each.
3. **Shells are renamed to their layout type.**
   - `BidirectionalConverter` becomes `CodecShell`.
   - `FormatterShell` becomes `TransformerShell`.
   - `DiffCheckerShell` becomes `ComparatorShell`.
   - New in later steps: `GeneratorShell`, and `FileProcessorShell`, which
     merges `ImageToolShell` and `ImageBatchShell`.
   - Older ADRs keep the old names.
4. **Shells enforce the shared UX rules** (CONTEXT.md → [[Layout type]]):
   - **Layout order:** header → mode row → controls → status slot → work
     area → actions.
   - **Run timing:**
     - Deterministic and fast: runs as you type.
     - Random output: a Generate button.
     - Slow on purpose: a button with a busy state. This is a spinner plus
       elapsed time with no progress channel, so ADR-0001 stands.
   - **Button placement:**
     - Generate and Process go under the input.
     - Copy goes in the output label.
     - Download goes at the bottom of the output.
     - ⌘/Ctrl+Enter triggers the primary button.
   - **Empty state:** a required placeholder, phrased as an instruction.
   - **Saving and Reset:**
     - Text input is saved per Tool, and per mode for a Codec.
     - Files are never saved.
     - Reset (run by the dialog frame on close; there is no Reset button)
       clears the input and keeps the controls.
5. **Input errors never toast.** The shell renders them in the
   [[Tool status slot]] and clears the output while the input is invalid.
   - Tools may add **notices** (non-fatal messages about a valid result).
     They cannot reroute errors, so `CodecShell` loses `onError` and every
     shell loses `renderBanner`.
   - Toasts are only for the outcome of an action: copied, downloaded,
     file read failed.
6. **Codec mode rules.**
   - A Codec gets a mode toggle only when every direction takes the same
     kind of input. Image ↔ Base64 stays two Tools.
   - The tile has one trigger.
   - `?mode=<key>` opens the tool route in that mode. It is read once, only
     when `autoOpen` is set, and is never written back.
7. **Upload entry.** A File Processor's upload area fills the dialog's
   work area, and the tile is a plain button. Only the UX is unified. The
   per-site checking and preview code stays as ADR-0016 decided.
8. **Opt-outs.** `layout: 'custom'` requires `layoutOptOutAdr`.
   - The CSS playgrounds cite ADR-0006.
   - These cite this ADR:
     - **Calculators and reference lookups** (aspect-ratio, ip-subnet,
       chmod, http-status-codes, og-preview): no two share an interaction
       shape, so a shell would be one adapter per Tool.
     - **PDF Tools** (combine-pdf, image-to-pdf, html-to-pdf,
       markdown-to-pdf): already on their own two shared shells.
     - **db-diagram:** a full application, not a Tool interaction.
9. **Enforcement.**
   - `src/test/layout-guard.spec.ts` checks two things:
     - A migrated Tool renders its shell and builds no dialog of its own.
     - Opt-outs cite an ADR that exists.
   - `LAYOUT_MIGRATION_PENDING` (`src/test/layout-migration.ts`) can only
     shrink. The guard fails once a listed Tool renders its shell.
   - Each shell has a contract suite (`<Shell>.contract.dom.spec.tsx`,
     built on `src/test/layout-contract.tsx`). It runs over every migrated
     Tool of its layout and checks:
     - the status slot sits above the work area
     - the placeholder is the empty state
     - Copy sits with the output
     - (Codec) exactly one mode is pressed
   - The contract's error path needs one bad-input fixture per Tool. Tools
     without one show as `todo`.
10. **Out of scope:** the tile-opens-a-dialog model itself. Every shell
    sits inside `ToolDialogFrame`, so making the tool route render inline
    later is a change in one place. *(Done by ADR-0029: the tool route
    renders the Tool inline; the dashboard keeps the dialog.)*

## Fit check (2026-11-10, after step 1)

A read-through of every pending Tool showed that several tags were guesses
that don't fit their shell. Findings, then the decisions taken on them:

- **Codec: only AES and String Escape fit; both have moved.**
  - Bcrypt takes different inputs per mode, and runs on a button because
    it is slow.
  - Protobuf Codec has a schema, a message type and a payload (see also
    ADR-0005).
  - Number Base, Color and px ↔ rem are "edit any field" converters
    (CONTEXT.md → N-mirror broadcast). The pattern's third adopter,
    Aspect Ratio, is already `custom`.
  - Unix Timestamp is two one-way converters with different inputs
    (timestamp → dates, date fields → timestamp).
  - Timezone is one date-time to a list of zones.
- **Transformer: 4 of 24 fit today:** Hash, HMAC, JSON → TypeScript,
  Sort/Dedupe.
  - A **label/value list** output kind would unlock 8–9 more: Certificate,
    SSH, URL Parser, User Agent, Text Case, Word Counter, Cron Parser,
    JSONPath, and JWT with code-block rows.
  - A **rendered markup** kind would unlock 3: Markdown, SVG, Mermaid.
  - Both go beyond the agreed `text` / `image` pair.
  - No kind fits GraphQL Viewer, Protobuf → JSON, TypeScript Playground
    or Regex Tester.
- **Generator: only UUID, Password and RSA produce random output.**
  - Lorem Ipsum, Color Palette, Crontab and Markdown Table, plus
    Placeholder Image (tagged Transformer), are deterministic but have no
    source input.
  - Under the run-timing rule they are Transformers, but
    `TransformerShell` requires a source.
- **File Processor:** 8 fit a merged shell. Two don't:
  - Image Color Picker inspects an image and produces no file.
  - Data URI also has a paste-to-decode half, and ADR-0020 keeps it
    bespoke.

### Decided (2026-11-10)

- **`custom`, citing ADR-0019 (N-mirror):** Color, px ↔ rem, Number Base.
- **`custom`, citing this ADR:**
  - Bcrypt (different inputs per mode, slow)
  - Protobuf Codec (three inputs)
  - GraphQL Viewer, Protobuf → JSON, TypeScript Playground, Regex Tester
    (interactive browsers, inspectors and editors)
  - Image Color Picker (an inspector with no output file)
- **`custom`, citing ADR-0020:** Data URI.
- **Custom Tools still use `<ToolStatus>`** for input errors. Opting out of
  a shell does not opt out of the error rule.
- **Retagged `transformer`:** Timezone, and Unix Timestamp (one source per
  direction).
- **Generator gets a live mode.** `GeneratorShell` covers options-only
  Tools in two run modes:
  - `random`: a Generate button and ⌘/Ctrl+Enter. For UUID, Password and
    RSA (RSA also shows a busy state).
  - `live`: same options give the same output, so it reruns on every
    option change and has no button. For Lorem Ipsum, Color Palette,
    Crontab, Markdown Table and Placeholder Image (retagged `generator`).
- **Transformer output kinds:** `text`, `image`, `fields` (a label/value
  list with Copy per row) and `markup` (sanitised HTML/SVG). There is
  still no free-form output slot.

## Migration order

**Status (2026-11-10): complete.** Every Tool with a non-`custom` layout is
built from its shell, `LAYOUT_MIGRATION_PENDING` is empty, and the 27
`custom` Tools show input errors in `<ToolStatus>`. Contract error
fixtures can type input as well as seed storage, so every Tool whose input
can be invalid has one. The 22 remaining `todo`s are Tools whose input
cannot be invalid (each says why) and File Processors, whose files are
never saved.

1. Bring the existing shells into line with these rules, rename them, and
   add the `layout` field, the guard, the contract harness, `docs/ux/`
   and this ADR. This step updates the 18 Tools already on the three text
   shells (10 Codec, 6 Transformer, 2 Comparator) with no per-Tool work.
   The 8 Tools on the image and PDF shells are untouched. The rules that
   need new shells arrived with steps 3–5 (first batches done 2026-11-10;
   see the per-layout pages in docs/ux/ for which Tools are on each shell).
2. **Codec:** AES and String Escape (done). The other 7 were retagged
   (see "Decided" above).
3. **Transformer:** add the `image`, `fields` and `markup` output kinds,
   then move 21 Tools (done).
4. **Generator:** build `GeneratorShell` with `random` and `live` modes,
   then move 8 Tools (done).
5. **File Processor:** merge the image shells into `FileProcessorShell`
   (ADR-0028), then move 8 Tools (done).

Each shell change is one PR; Tools then move in PRs of 3–5. A Tool is
**done** when:
- it renders through its shell
- its `layout` matches
- the contract suite passes for it, with an error fixture
- it has no hand-written error markup and no input-error toasts
- its placeholder is an instruction
- it has been checked in a browser on the happy path and one error case

A layout type is done when all its Tools are, and its `docs/ux/` page is
current.

## Consequences

- "Make X a Codec" is a complete instruction for a person or an agent.
- New Tools get the shared UX by choosing a `layout`. Building a Tool by
  hand needs an ADR.
- Two things now show up where they used to toast:
  - `JsonFormatter` / `YamlFormatter`, and every Codec, show parse errors
    in the status slot.
  - The CSS/HTML/SQL/JS formatters show their fixed `errorLabel` there too.
- `HtmlToMarkdownConverter` used to swallow its errors (`onError={() =>
  undefined}`). It now shows them.
- `JsonDiffChecker` no longer carries `validationError` on its result.
  Invalid JSON rejects, and the shell shows it.
- The existing Codec placeholders are sample outputs rather than
  instructions. Rewording them is part of each layout's migration PR, not
  of step 1.
- Open classification questions, settled when step 4 starts:
  `crontab-generator`, `markdown-table-generator` and
  `color-palette-generator` are tagged `generator`. If their output is
  deterministic, then under the run-timing rule they are Transformers.
