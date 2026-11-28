# ADR 0038 — Port order: one shell and its proof Tool at a time, everything else just in time

- **Status:** Accepted
- **Date:** 2026-11-28

## Context

[Issue 74](https://github.com/boengai/csr-dev-tools/issues/74) asks in what
order the 84 Tools are ported, how they are grouped into build issues, and
what may run at the same time. It was decided in conversation on
2026-11-28. It is the last planning decision on the map
([issue 5](https://github.com/boengai/csr-dev-tools/issues/5)) before the
build backlog exists.

- **The Tools on `develop`:** 27 transformer, 27 custom, 12 codec,
  8 generator, 8 file-processor and 2 comparator
  (`src/constants/tool-routes.ts`).
- **What is already settled:**
  - ADR-0035: one crate per Tool, one lazy Tool entry each, and an
    existing `wasm/` crate split into a logic crate before its first port.
  - ADR-0036: one Tool per `port` PR; a `shell(<layout>)` PR adds one
    shell and its first Tool as proof; any change to `ui`, `platform`,
    `bridges` or `persist`, or to logic another ported Tool already uses,
    lands first in its own PR; a split is its own PR, merged before the
    port; only the maintainer merges.
  - ADR-0033: which engines are replaced, which stay behind a bridge, and
    the four kinds of worker.
- **What `develop` holds today:** `crates/app` renders an empty shell,
  `ported_tools![]` is empty, and the `gates` crate is built. There is no
  `ui`, `registry`, `persist`, `platform` or `bridges` crate, no primitive
  and no shell. All 17 `wasm/` crates are unsplit.
- **What the Tools lean on** (an import scan of `develop`, 2026-11-28):
  - The code field brings CodeMirror to every codec and comparator, to 15
    of the 27 transformers, and to several custom Tools: about 45 Tools.
    The other 12 transformers take plain text.
  - The dialog and the toast are used by nearly every Tool.
  - `html-to-pdf`, `image-to-pdf` and `markdown-to-pdf` have no e2e spec,
    so their parity cannot be shown yet.
  - Every port PR edits the same few files: `crates/app/Cargo.toml`, the
    Ported Tool list, `docs/perf/byte-ceilings.json`,
    `e2e/parity/dioxus-filter.ts`, and, for a Tool that saves input,
    `crates/registry/src/storage.rs` and the #38 goldens. The spec filter
    holds one `grep` regex that every port would edit.

## Decision

### 1. A walking skeleton per layout

Each layout follows the same order: its shell, proven by its Proof Tool in
the same `shell` PR, then the rest of its Tools. The next layout's shell
starts only after the previous layout's first Tool has merged, which is
when its shell PR merges, since that PR carries the Proof Tool. The
previous layout's other Tools may still be in progress. No shell lands
without a Tool behind it.

The layouts go in this order, each with its opening:

| Layout | Before the shell | Proof Tool |
|---|---|---|
| transformer | section 2 | `url-parser` |
| codec | `bridge(codemirror)`, the code field, `split(json-tools)` and `json-formatter` | `url-encoder-decoder` |
| generator | `ui(slider)` | `password-generator` (random mode) |
| file-processor | `platform(image)`, `logic(resample)`, `logic(zip)` and `ui(tabs)` | `image-to-base64` |
| comparator | `split(diff)` | `text-diff-checker`, then `json-diff-checker` |

Transformer goes first because it is the largest layout and the simplest
shape, so its shell gets used most. File-processor comes late because it
leans on the image platform code. `custom` and the app are waves without a
shell (section 5).

### 2. The opening

1. **Six PRs before the first shell**, each its own PR:
   - `gates: …` keying the spec filter by Tool (section 6). It changes the
     `spec_filter` gate and `e2e/parity/dioxus-filter.ts`, which is not a
     gate file, so the path check flags the filter and the maintainer
     reviews the PR by hand.
   - `gates: …` generating the registry from `tool-routes.ts` into a new
     `crates/registry`. It is the first code under `scripts/dioxus`, so
     #70's oxlint, oxfmt and npm-licence gate lands with it, and it is a
     hand-reviewed `gates` PR (gates.md → PR kinds). #74 expected that
     gate with the first bridge; `gates.md` puts it with whichever of
     `crates/bridges/js` and `scripts/dioxus` comes first.
   - `app(router)`: routes, the Tool entry match and head edits on
     navigation.
   - `app(stamp)`: the head-stamped Tool pages and the early-fetch hash,
     which Definition of done item 7 needs.
   - `ui(dialog)`: the modal frame. #70's `const` layout assertion comes
     with `ui`'s entry macro.
   - `ui(toast)`.
2. **`shell(transformer)` with `url-parser`.** It takes text and shows
   fields. It saves nothing, uses no `wasm/` crate and no primitive, and is
   46 lines of React. So the first PR tests only the shell, the byte rows,
   the CSP gate and the parity harness.
3. **`persist(store)`, then `text-case-converter`:** the first Tool that
   saves input, so the stored-value contract (#38) is tested on the second
   port, not the thirtieth.
4. **`split(shared)` and `split(hash)`, then `hash-generator`:** the first
   Tool that reuses a `wasm/` crate.

### 3. Shells start narrow

A `shell` PR builds only the source and output kinds its Proof Tool needs.
Each later kind is its own `ui(…)` PR, merged right before the first Tool
that needs it. Examples: the transformer shell's textarea source, text,
image and markup outputs, the code field, generator live mode, and
file-processor batch mode and asset output. Every kind is then proven by a
real Tool, and every PR stays small.

### 4. Engines, primitives and splits arrive just in time

Nothing lands ahead of the first Tool waiting for it. Each bridge, worker,
primitive and split is its own PR (ADR-0036 §4), merged just before the
first Tool that needs it.

- **Bridges, in order:**
  1. CodeMirror, after the 12 plain-text transformers.
  2. DOMPurify, before the markup transformers.
  3. jsonpath-plus and then mermaid, late in the transformer wave.
  4. pdf.js, before `combine-pdf` and `image-to-pdf`.
  5. pdf-lib, before `combine-pdf` only. `image-to-pdf` builds its PDF
     with `krilla`.
  6. Monaco, last.
- **Workers.** The worker bridge comes before the first worker. The regex,
  bcrypt and Typst workers each come just before their Tools. The tract
  worker comes before `background-remover`, the last Tool of the
  file-processor wave.
- **Primitives** come one PR each, before their first Tool. Switch is
  built only when a Tool or the app needs it, and none of the 84 does
  today.
- **The image foundations** come before the file-processor shell (section
  1).

### 5. Custom Tools and the app

- **Custom Tools** don't wait for every shell. A custom Tool may start once
  `shell(transformer)` has merged. Each one runs as soon as what it needs
  exists, simplest first.
- **The app wave** (home page, dashboard, command palette and settings)
  starts after the transformer wave. It must be done before cutover.

### 6. What runs in parallel

- **At most 3 port PRs are open at once.**
- **Shared list files hold one entry per line, sorted:** the ceiling file,
  the spec filter (once keyed by Tool, section 2), the Ported Tool list and
  the Storage key table.
- **The maintainer merges one PR at a time.** The other open PRs rebase
  before their own merge.
- **Never run together:**
  - a `foundation`, `split`, `logic` or `gates` PR and a port that depends
    on it;
  - two ports that need the same unsplit crate;
  - two `shell` PRs.

The cap is raised only if rebases stay trivial.

### 7. Hard Tools

These Tools wait on a decision ticket, which blocks their build issue:

- **`db-diagram`:** how the hand-built graph canvas is built, and its bar
  for pan and zoom feel.
- **`html-to-pdf` and `markdown-to-pdf`:** whether Typst's SVG preview
  passes the post-migration CSP.
- **`typescript-playground`:** whether self-hosted Monaco passes the
  post-migration CSP.
- **`background-remover`:** whether the MODNet model is self-hosted.

A fifth decision ticket comes from the map rather than from a Tool: **how
a worker package is shipped** under the loading model. It blocks the
worker bridge.

**The missing journeys** are a build issue, not a decision. One `main`
issue writes journeys for `html-to-pdf`, `image-to-pdf` and
`markdown-to-pdf` against React (`docs/ux/parity.md`: checks pass on React
first). It blocks those three ports.

The CSS playgrounds and `og-preview` are ordinary custom ports. ADR-0034
§11 already settles how the playgrounds write styles, and `og-preview`
leans on nothing hard.

### 8. Slicing into issues

- **One build issue per PR.** A Tool's issue is its port PR. The five
  shell issues are also their Proof Tools' issues, so each of the 84 Tools
  has exactly one issue.
- **Seven wave issues** group them: one for each of the six layouts
  (`custom` included) and one for the app. Each is a
  sub-issue of the map: transformer [#226](https://github.com/boengai/csr-dev-tools/issues/226),
  codec [#227](https://github.com/boengai/csr-dev-tools/issues/227),
  generator [#228](https://github.com/boengai/csr-dev-tools/issues/228),
  file-processor [#229](https://github.com/boengai/csr-dev-tools/issues/229),
  comparator [#230](https://github.com/boengai/csr-dev-tools/issues/230),
  custom [#231](https://github.com/boengai/csr-dev-tools/issues/231) and
  app [#232](https://github.com/boengai/csr-dev-tools/issues/232).
  - **Blocked-by links are hard dependencies only.** A wave issue's
    checklist holds the soft order, so blocking does not serialise what
    could run in parallel.
- **The backlog is filed whole**, not wave by wave.
- **A port issue is done** when the Tool meets "Definition of done for a
  ported Tool" in `docs/quality/gates.md`.

### 9. Proving no Tool is dropped

A `gates` check compares `ported_tools![…]` with the registry's Tool set,
at compile time if the generated registry enum makes that cheap.

- It lands right after `shell(transformer)` as a report.
- It becomes a required check when the last port issue closes, and then
  gates the cutover PR.

## Considered options

- **All five shells first, then Tools.** That designs four shell APIs
  before any Tool has tested them, though the map says each shell's props
  "sharpen with the first port of each layout".
- **Custom Tools last.** It holds back Tools that need nothing a later
  shell brings, and it bunches the hardest work at the end.
- **One issue per batch or per layout.** Neither matches ADR-0036's one
  Tool per PR, and neither can be matched against the registry Tool by
  Tool.
- **Bridges and primitives up front.** Code nobody uses yet goes
  unproven, and the byte rows for it are guesses.
- **Blocked-by links for the whole order.** A chain of 158 links would
  allow one PR at a time.

## Consequences

- **The backlog is 158 issues:**
  - 79 port issues and 5 shell issues, covering the 84 Tools;
  - 17 splits;
  - 45 foundation, bridge, worker, `gates` and `main` issues;
  - 5 decision tickets;
  - 7 wave issues.
- **The first PR is small** but needs six PRs before it (two of them
  hand-reviewed `gates` PRs),
  because nothing under `crates/` exists yet.
- **CodeMirror is on the critical path.** About half of all Tools wait on
  the bridge and the code field.
- **Saved inputs and crate splits are proven by the second and third
  ports.**
- **Port PRs conflict by design** in a few list files. The 3-PR cap and
  one-line sorted entries keep each conflict to a rebase.
- **Each decision ticket may reslice its build issue.** db-diagram in
  particular may become several PRs.

## Not verified

- The dependency facts in Context come from an import scan of `develop`
  on 2026-11-28, not from ported Tools. A port may find a `ui`,
  `platform` or `persist` need the scan missed; it is filed as a blocker
  then (ADR-0036 §4).
- That a 3-PR cap keeps rebases trivial is a guess until the first ten
  ports.
- Whether the exhaustiveness check can be a compile-time check depends on
  the generated registry, which does not exist yet.

## Revisit when

- Rebases between open port PRs stop being trivial, or turn out never to
  conflict, which would lower or raise the cap.
- A shell's first Tool turns out to need a kind the shell PR could not
  hold.
- A decision ticket moves a Tool's engine across the interop boundary.
