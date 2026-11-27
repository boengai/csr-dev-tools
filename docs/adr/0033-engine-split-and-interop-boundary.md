# ADR 0033 — Which engines move to Rust, and the interop boundary for the rest

- **Status:** Accepted
- **Date:** 2026-11-27
- **Amended:** 2026-11-27. Trial 1 (hayro) failed, and the pdf.js facade
  takes a document handle. See [the amendment](#amendment-2026-11-27-the-hayro-trial).

## Context

The map ([issue 5](https://github.com/boengai/csr-dev-tools/issues/5))
is Rust-first: a JavaScript engine is replaced by Rust wherever a viable
replacement exists, and stays behind a thin interop boundary only where
none does. Parity is the bar: all 84 tools, the same URLs, head-stamped
pages, saved inputs still loading, and behaviour as frozen on `main`.

Two research tickets set the options:

- [Issue 9](https://github.com/boengai/csr-dev-tools/issues/9) sorted 18
  engines into 7 replace, 4 keep and 7 trial
  ([findings](https://github.com/boengai/csr-dev-tools/blob/research/rust-replacements-for-js-engines/docs/research/rust-replacements-for-js-engines.md)).
- [Issue 10](https://github.com/boengai/csr-dev-tools/issues/10) found
  that `dx` has no npm support and no worker build step. Its esbuild pass
  inlines relative imports but hashes only the entry file, and it does not
  rewrite URLs inside JS
  ([findings](https://github.com/boengai/csr-dev-tools/blob/research/dioxus-npm-and-workers-interop/docs/research/dioxus-npm-and-workers-interop.md)).

ADR-0031 already fixed one pattern from the spike: a typed `wasm-bindgen`
bridge to CodeMirror, with no `document::eval`.
[Issue 21](https://github.com/boengai/csr-dev-tools/issues/21) decided the
rest in conversation on 2026-11-27. The facts below were gathered in that
session on `develop` at `6d31de79`, by reading the code and package
tarballs and by running scratch pages and the built app in Chrome. The
notes themselves are not kept in the repo.

- **Monaco is loaded from a CDN with no pin of our own.** The repo never
  calls `loader.config`, so `@monaco-editor/loader` 1.7.0 falls back to
  its built-in `cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs`. It
  injects `<script>` tags with no integrity hash. From 0.56, Monaco's ESM
  build exposes the TypeScript API only as the top-level `typescript`
  namespace. 0.55.1 and 0.57 both bundle TypeScript 5.9.3.
- **Two bugs on `main`.**
  - `ScriptTarget.ES2022` does not exist in Monaco, so the playground's
    target is undefined and its output is ES5-style. This was checked at
    runtime, and the e2e test does not catch it.
  - DOMPurify strips the `foreignObject` labels from flowchart, class, ER
    and state diagrams in the mermaid renderer. This was checked in the
    built app.
- **Mermaid as one file is large.** With elk, katex, cytoscape and every
  diagram type inlined, it measured 5.17 MB raw and 1.43 MB gzip. Today's
  lazy flowchart path is about 187 kB gzip.
- **Two DOMPurify copies ship today**: 3.4.12 inside mermaid and 3.4.16 in
  the app. Mermaid's global hooks change the output of a shared instance.
- **CodeMirror cannot take add-on language modules.** A second copy of
  `@codemirror/state` breaks its `instanceof` checks. Only db-diagram
  passes a language (JSON, SQL).
- **ONNX Runtime's `.wasm` cannot be self-hosted.** At 26,861,777 bytes it
  is over Cloudflare Pages' 25 MiB per-file limit, and the deploy deletes
  it.
- **`'unsafe-eval'` has one certain user, `ajv`.** `ajv` is replaced.
  Mermaid, DOMPurify, jsonpath-plus and a self-hosted Monaco were checked
  and need none. ONNX Runtime contains an embind `new Function`, and
  whether CPU inference calls it was not checked.
- **All image encoding runs through `canvas.toBlob` today,** for PNG,
  JPEG, WebP and AVIF alike (`src/utils/canvas.ts`).
- **The issue 9 research left out several built-ins.** These are `RegExp`
  (Regex Tester), WebCrypto, `Intl`, `JSON`, `URL`, `atob`/`btoa`,
  `encodeURIComponent`, `TextDecoder`, `localeCompare`, local-time `Date`,
  and UTF-16 string length.

## Decision

### 1. The engine split

**Replaced by Rust:**

| Engine | Replacement |
|---|---|
| `ajv` | `jsonschema` |
| `graphql` | `apollo-compiler` |
| `jszip` | `zip`, store mode only |
| Canvas pixel maths | a straight port of [`src/utils/resample.ts`](../../src/utils/resample.ts) and its reduction plan in [`src/utils/canvas.ts`](../../src/utils/canvas.ts), Pillow-faithful (ADR-0025). This is the only pixel arithmetic our own code does today |
| `pdf-lib`, image to PDF | `krilla`, already in the `pdf` crate's tree |
| `react-image-crop` | a hand-built Dioxus component |
| `@dnd-kit/*` | a hand-built sortable grid, not `dioxus-dnd` (ADR-0031's "own primitives" condition) |
| `@xyflow/react` | a hand-built graph canvas for db-diagram, with no trial, as its own build issue. `@xyflow/system` is the fallback only if a written bar for pan and zoom feel fails |

**Kept as JavaScript, behind the boundary below:**

| Engine | Why it stays |
|---|---|
| CodeMirror 6 | No Rust code editor exists. |
| Monaco | It keeps the playground's diagnostics, emit, completion and hover. No Rust option keeps IntelliSense, so the `tsrs` trial is cancelled. |
| `mermaid` | `mmdr` covers 23 of 32 diagram types and has no wasm build. It gets no trial until that changes. |
| DOMPurify | It sanitises with the same parser that renders the result. On a security boundary, Rust-first gives way, so the `ammonia` trial is cancelled. |
| `pdfjs-dist` | The hayro trial (#42) failed on bytes: hayro 0.9.0 is 3.26× the size of pdf.js in brotli bytes (see [the amendment](#amendment-2026-11-27-the-hayro-trial)). |
| `jsonpath-plus` | Parity means today's syntax: `^`, `~`, `@string()` and the shorthands. RFC 9535 crates drop them, and saved expressions would change meaning. The trial is cancelled. |

**Platform APIs, reached through `web-sys` / `js-sys` with no JS file:**

- The image codecs: decoding, and lossy WebP and AVIF encoding.
- Every other canvas operation, as today, called from Rust through the
  platform layer: `drawImage` (crop, rotate, favicon and splash drawing),
  `fillRect` plus `drawImage` (the background-removal composite),
  `getImageData` (the colour picker), `putImageData` (the mask), and
  `toBlob` for every output format, PNG and JPEG included. This keeps
  output files byte-identical and the JPEG quality scale the same, which
  matters because image-compressor shows the output size.
- Canvas `fillText` for placeholder and splash text, which avoids
  bundling a font.
- WebCrypto, including `randomUUID` and `getRandomValues`.
- `Intl`.

JS `RegExp` stays for user-supplied patterns only, because Regex Tester
tests JavaScript regex. It is not a Platform API: it runs in the small JS
regex worker (see 4 and 5), so a runaway pattern is killed by terminating
the worker. A Rust worker calling `js_sys::RegExp` would load wasm only to
call JS.

**Three trials**, each its own research ticket on the map, with a corpus
and a pass bar written before it starts. They run in this order:

1. `hayro` rendering in place of `pdfjs-dist`. **Failed on 2026-11-27,**
   so pdf.js stays (see [the amendment](#amendment-2026-11-27-the-hayro-trial)).
2. `hayro-write` merge in place of `pdf-lib`'s `copyPages`.
3. `tract-onnx` with MODNet in place of transformers.js.

If a trial fails, the JS engine stays behind the boundary. A trial must
finish before its tools are ported, not before porting starts.

### 2. The boundary

- **Bridges.** All kept JS lives in one directory, as one TypeScript
  **engine bridge** per library. Each bridge exports a tiny API: either an
  opaque handle with its own lifecycle, or pure functions. The lifecycle is
  `mount` / `update` / `destroy` for an engine that mounts into the page,
  and `open` / `close` for one opened document (pdf.js).
- **Facades.** Each bridge is bound once, by a typed
  `#[wasm_bindgen(module = …)]` **bridge facade** in Rust.
- **Tool code.** Tool and shell code calls only facades and the platform
  layer. It never imports `wasm_bindgen`, `js_sys` or `web_sys`, and
  `document::eval` is banned. The lint that enforces this belongs to
  [#25](https://github.com/boengai/csr-dev-tools/issues/25). Where the
  layer and the bridge directory live (a module or a crate, and which
  path) belongs to [#20](https://github.com/boengai/csr-dev-tools/issues/20).
- **Platform layer.** Wrappers for WebCrypto, `Intl`, canvas and codecs,
  the clipboard, files, `URL`, downloads, `localeCompare` and local-time
  `Date` sit beside the facades.
- **Logic stays browser-free,** so `cargo test` runs natively. Anything
  that depends on locale or timezone is passed in (a collator closure, an
  offset) rather than called.
- **The bridges' npm packages are declared in their own package** in a new
  `pnpm-workspace.yaml`, not in the root `package.json`. When React is
  deleted, that manifest is the list of what JavaScript remains.
- **Facades are shaped around outputs, not library objects.** This lets a
  trial win replace a facade's implementation without touching tool code.
- **Errors.** Every facade returns `Result<_, BridgeError>`:
  - `Load` shows in the shell's status slot, and the next action retries.
  - `Engine` carries the library's message unchanged, because the mermaid
    auto-fix and the Monaco markers parse it.
- **Load failures are retried, not cached.** One loader shim, the only
  non-library JS in the directory besides the regex worker, caches each
  URL's `import()` but drops a rejection. This is what today's code does:
  `PdfBytesPreview` for pdf.js, and `retryableOnce`
  ([`src/workers/retryable-once.ts`](../../src/workers/retryable-once.ts))
  for wasm init. The spike's `loading ??= import(url)` kept a failure until
  reload.

The facades decided now:

- **CodeMirror:** `mount(parent, opts, on_change) -> Handle`, with
  `update(opts)`, `set_value(doc)` and `destroy()`.
  - `opts` carries `doc`, `placeholder`, `id`, `aria_label`,
    `aria_labelledby`, `language` (`None | Json | Sql`), `size`
    (`Default | Compact`), `disabled` (mapped to `editable`), `height` and
    `min_height`.
  - Each content attribute is set only when given.
  - `update` reconfigures `disabled` and `language`.
  - Rust owns the disabled styling and `data-testid="code-input-<name>"`.
  - The `CodeInput` props and values no caller passes are dropped:
    `readOnly`, `onBlur`, `maxHeight` and `block={false}`. Editors stay
    full width.
- **Monaco:** a playground bridge that owns both editors, the compiler
  options, the markers and the emit call.
- **Mermaid:**
  - `render(code) -> {svg, diagram_type}`. The SVG is already sanitised,
    and a failure rejects with today's message string.
  - The bridge owns the fixed `initialize` config, the `%%{…}%%`
    stripping and id generation. Frontmatter config is still honoured.
  - It runs on the main thread, because mermaid measures text in the
    document.
  - SVG to PNG stays outside the bridge, in the platform layer.
- **DOMPurify:** a standalone bridge for the markup pane, separate from
  mermaid's own copy.
  - A Rust `SanitizedMarkup` type can be created only by the two
    sanitising facades, and the pane accepts only that type.
  - Markup is sanitised once, with no second pass in the pane, and empty
    input is not sent.
- **jsonpath-plus:** `evaluate(json_text, path) -> [{path, value_json}]`,
  with `JSON.parse` and `JSON.stringify(v, null, 2)` inside the bridge and
  `eval: 'safe'` pinned.
- **pdf.js** takes a document handle: `open(bytes) -> Result<Doc, BridgeError>`,
  then `doc.page_count()`, `doc.render_page(index, scale)` with a 0-based
  `index`, and `doc.close()`.
  - `Doc` is an opaque handle for one opened file, not a pdf.js object.
    The file is parsed once, and all its pages share one set of font and
    glyph caches. pdf.js and hayro both work this way, so either can sit
    behind it.
  - `render_page` returns `Result<_, BridgeError>` with the page as a PNG
    image, which is what `PdfBytesPreview` and combine-pdf's thumbnails
    show today. Whether it crosses as a data URL or a platform object URL
    is left to the first port.
  - `close` frees the document inside pdf.js's worker, and dropping the
    handle does the same. `PdfBytesPreview` does this today with
    `loadingTask.destroy()`. combine-pdf's thumbnails never free theirs,
    and the port closes them too.
  - This replaces the stateless `page_count(bytes)` and
    `render_page(bytes, index, scale)` (amended 2026-11-27).
- **pdf-lib,** specified now whatever the hayro-write trial decides:
  `merge([{bytes, pages}]) -> bytes`.

### 3. Build, bundle and load

- **One file per bridge.** A Vite library build, run by `pnpm` before
  `dx`, turns each bridge into one self-contained ES module with no
  imports and no shared chunks. This closes `dx`'s hash gap under
  `/assets/* immutable`.
  - The output is a build artifact and is not committed.
  - `dx` hashes each module as an asset.
- **URLs come from Rust.** A bridge loads with `import()` on first need.
  Its URL, and the URLs of each library's own workers and wasm, are passed
  in from Rust's `asset!()`.
- **The CI check parses every bridge output.** A text grep is not enough,
  because mermaid's grammar data and Monaco's worker strings contain
  `from` and `import(`. CI fails on:
  - any static `import` or `export … from`;
  - any `import()` whose target is written as a fixed string;
  - any `new URL('…', import.meta.url)`.

  A computed `import()` is allowed only from a per-bridge allow-list, with
  a comment naming the URL it reaches. There are three: Monaco's diff
  module, pdf.js's fallback worker and ONNX Runtime's module. Each bridge
  also declares the exact files its build emits, and any other file fails
  CI.
- **CodeMirror** ships as two full bundles: a plain one, and one with JSON
  and SQL that only db-diagram uses, for all of its editors. The facade
  picks between them from `language`.
- **Mermaid** ships as one file. This is a known cost (see Consequences).
  Leaving elk out would break `layout: elk`. If the page is ever
  measured and misses, the named fallback is a chunk folder owned by
  mermaid. Whether `dx` can ship one is not verified.
- **Monaco is self-hosted and pinned exactly.**
  - The preferred version is 0.55.1's ESM build, which has no behaviour
    drift, if it passes the CSP check in 6. Otherwise 0.57.x, through its
    `typescript` namespace.
  - `editor.worker` and `ts.worker` are module workers with `asset!()`
    URLs, and no `blob:`.
  - Vite's dead fallbacks are stripped, including a duplicate 6.9 MB
    `ts.worker`.
  - The codicon font is inlined as `data:`, and the CSS gets its own
    `asset!()` URL.
  - `globalAPI` stays on for the e2e hook.
  - The read-only output pane does not start a second `ts.worker`.
- **When a bridge starts downloading:**
  - **Prefetch when the route resolves,** for every route that mounts an
    editor or renderer on first load: the codec, comparator and
    markup-to-PDF shells, regex, bcrypt, protobuf, graphql, db-diagram,
    and mermaid with a restored draft.
  - **On first use,** for interaction-only bridges: DOMPurify on
    markdown-preview and svg-viewer, and the db-diagram import panels.
  - **On idle after Ready,** for the home page's CodeMirror (the Format
    dialog).
  - **Not in the inline early-fetch script**
    ([`docs/perf/wasm-early-fetch.md`](../perf/wasm-early-fetch.md)).
    Its `fetch()` hand-off never sees `import()`, and editing the script
    changes its CSP hash.
  - **`<link rel="modulepreload">`** is a remedy to try under
    [`budgets.md`](../perf/budgets.md)'s adoption rule, not a default.

### 4. Workers

- **One typed Rust worker bridge and one protocol for every worker,**
  whatever language the worker is written in. It ports the invariants of
  the Worker bridge in [`CONTEXT.md`](../../CONTEXT.md)
  ([`src/wasm/worker-bridge.ts`](../../src/wasm/worker-bridge.ts)) as they
  are:
  - message ids, with one listener per worker;
  - `{id, result}`, `{id, error}` and a non-terminal `{id, progress}`
    envelope;
  - transfer lists;
  - a worker error rejects every pending call and drops the worker;
  - any abort terminates the worker and rejects every pending call with
    a typed `Cancel` or `Timeout`;
  - workers are created lazily.
- **Four kinds of worker:**
  1. **Rust workers** (bcrypt, the Typst PDF compile). Each is a separate
     small `wasm-bindgen --target web` package, spawned as a module
     worker. The single-bundle trick is not used, because it loads the
     whole app into every worker.
  2. **The regex worker**, a tiny JS worker in the bridge directory,
     because it must run JS `RegExp`.
  3. **Library-owned workers** (Monaco, pdf.js), which live inside their
     bridges.
  4. **A JS library run in our worker** (transformers.js, while the tract
     trial has not won). It is a self-contained entry module from the
     same build, spawned by the worker bridge. ONNX Runtime still comes
     from jsdelivr, as a written
     exception, because its `.wasm` is over the Pages file limit.
- **The same work runs in workers as today:** regex, bcrypt, the PDF
  compile and model inference. Pixel work, including the Rust resample
  and the background-removal compositing, runs on the main thread. A tool
  gets a new worker only if its port misses the TBT budget.
- **Regex parity, kept exactly:**
  - a 2000 ms timeout, armed after spawn;
  - the latest call wins;
  - the same timeout message;
  - `MAX_MATCHES` 5000;
  - a `SyntaxError` returned inside the result.

  The unused `cancelRegex` is dropped.
- **No wasm threads.** Dioxus issue
  [#5551](https://github.com/DioxusLabs/dioxus/issues/5551) (threading
  rustflags break `dx` assets) is open, and threads would need COOP/COEP.

### 5. Built-ins and behaviour parity

- **One rule.** If a tool shows a built-in's output, the port reproduces
  it exactly, in one of two ways:
  - **Through the platform layer,** where the output depends on the
    browser's locale, timezone or ICU data: `localeCompare`, local-time
    `Date`, `toLocaleString` / `toString`, and `Intl`.
  - **In Rust, with a differential test** against the JS behaviour, where
    the output is pure: WHATWG `URL` (the `url` crate), forgiving
    `atob`/`btoa`, `encodeURIComponent`, `TextDecoder` BOM and fatal
    mode, and UTF-16 `length`.
- **`RegExp` runs JS only for user-supplied patterns** (Regex Tester).
  The roughly 152 regexes the app writes itself move to `regex`, or to
  `fancy-regex` where a lookahead needs it. Classes whose output matters
  are written out explicitly: JS `\s` includes U+FEFF and Rust's does
  not. Each port gets a parity test.
- **JSON follows each tool's `main` engine.**
  - Tools already on a Rust crate (JSON Formatter) keep `serde_json`.
  - Tools that show JS-reserialised JSON (escaped JSON, env, the JWT
    display, restore-json) use a shared `js_json` module. It parses with
    `serde_json` and serialises the JS way: integer-like keys first, and
    ECMAScript number formatting. A differential test runs it against
    Node over a corpus.
- **Outside parity:** the wording of error messages from `jsonschema` and
  `apollo-compiler`, and JSON parse error text. Valid/invalid verdicts,
  error paths and locations, and result data are inside parity. The tests
  that pin message text are rewritten to test behaviour. This difference
  follows from replacing the engine, so it is not a `ux-improvement` under
  [#24](https://github.com/boengai/csr-dev-tools/issues/24). The Playwright
  specs still pass unchanged: the GraphQL spec checks only that the error
  names a line (`/line/i`), so the Rust port keeps the line number in its
  message.
- **The two bugs on `main` are fixed on `main` first,** each as its own
  `main` bug ticket, following the branching rule from
  [#16](https://github.com/boengai/csr-dev-tools/issues/16). The bridges
  then copy `main`'s fixed config:
  - the playground's target becomes ESNext or Latest, with an e2e
    assertion on the output's shape;
  - mermaid gets `htmlLabels: false`, which keeps the PNG canvas
    untainted, with an e2e check on the label text.

### 6. CSP acceptance

Each bridge's tool journey must run with zero `securitypolicyviolation`
events under the post-migration CSP:

- no `'unsafe-eval'`;
- jsdelivr and `blob:` only for the ONNX Runtime exception.

The background-remover journey decides whether `'unsafe-eval'` can go.
When the headers change belongs to cutover. The mechanical gate that runs
this check belongs to [#25](https://github.com/boengai/csr-dev-tools/issues/25).

## Considered options

- **CodeMirror for the playground, with `tsrs` in a worker.** It would
  lose completion and hover, and `tsrs` is a prerelease WASI build.
- **RFC 9535 for JSONPath.** It drops syntax users have saved.
- **`ammonia` for sanitising.** It uses a different parser from the
  browser that renders the result, has no SVG profile, and had a
  mutation-XSS fix this year.
- **`@xyflow/system` for db-diagram.** It provides only pan, zoom and drag
  maths. Every node, edge, handle, minimap and control would still be
  ours.
- **`dioxus-dnd`.** It is four months old with about 1.3k downloads, and
  ADR-0031 already chose our own primitives.
- **`resvg` with a bundled font for placeholder text.** It is a visible
  font change and more bytes.
- **Grepping bridge output for imports.** It gives false positives on
  mermaid and Monaco.
- **One CodeMirror bundle with every language.** It puts db-diagram's SQL
  bytes on every editor page.
- **One shared DOMPurify instance.** Mermaid's hooks leak into
  markdown-preview's output.
- **Monaco from the CDN.** The loader's injected, unhashed `<script>` tags
  cannot meet the build rule.
- **Every regex through `js_sys::RegExp`.** It would make all logic
  browser-bound and stop native tests.

## Consequences

- **No feature is lost.** What changes visibly is the error wording in
  `json-schema-validator` and `graphql-schema-viewer`, and JSON parse
  error text.
- **Harder to build:** db-diagram (about 2,000 lines of React today),
  image-cropper and the sortable grids. These are new Dioxus components,
  not bridges.
- **Heavier:**
  - Mermaid's first render, at about 1.43 MB gzip against about 187 kB.
  - TypeScript Playground's own bytes, at about 1.1 MB gzip of Monaco
    that the CDN used to serve.

  Neither page is budgeted, so each byte ceiling is set by its first port
  PR.
- **Waiting on a trial:** the combine-pdf merge and background-remover.
  Each has a facade now, so its port is not blocked. The combine-pdf and
  image-to-pdf previews no longer wait: the hayro trial failed, so they
  port with the pdf.js bridge.
- **Handed to their owners, with no decision here:**
  - **The map's Cutover item:** removing CSP sources and fixing the stale
    [`public/_headers`](../../public/_headers) comments.
    - **Once Monaco is self-hosted:** its jsdelivr entries in
      `script-src`, `style-src` and `font-src`, and `worker-src blob:`.
      Monaco is the only user of `worker-src blob:`.
    - **Only if the ONNX Runtime exception ends:** `script-src blob:` and
      jsdelivr in `script-src` and `connect-src`.
    - **Once `ajv` is gone and the background-remover journey passes
      without it (Decision 6):** `'unsafe-eval'`.
    - **Depending on how the port reads data URIs:** `connect-src data:`.
      `connect-src blob:` has no user that was found.
  - **[#22](https://github.com/boengai/csr-dev-tools/issues/22):** the
    Dioxus `style:` rule, and the CSS playgrounds' `'unsafe-inline'`.
  - **[#24](https://github.com/boengai/csr-dev-tools/issues/24):** the
    playground's e2e rework, including its silent `if (m)` guard, and
    adding the playground to the perf pages.
  - **The tract trial and the background-remover hard-tool decision:**
    self-hosting the MODNet model, or changing its dtype.
  - **The byte check in [#25](https://github.com/boengai/csr-dev-tools/issues/25):**
    a ceiling for each bridge and worker file. The
    planned check skips requests made inside workers.
  - **The map's item on the existing `wasm/` crates:** the Typst and
    bcrypt crates as Rust workers.

## Amendment, 2026-11-27: the hayro trial

[Issue 42](https://github.com/boengai/csr-dev-tools/issues/42) ran trial 1
against a corpus and a pass bar written into the ticket before any run.
Every check had to pass. **The bytes check failed,** so pdf.js stays
behind its engine bridge
([write-up](https://github.com/boengai/csr-dev-tools/blob/research/hayro-render-trial/docs/research/hayro-render-trial.md)).

- **The judged build** is hayro 0.9.0 with its standard fonts and CMaps
  compiled in: 1,358,095 bytes brotli. pdfjs-dist 6.4.299's
  `pdf.min.mjs` plus `pdf.worker.min.mjs` are 417,068 bytes brotli, so
  hayro is 3.3× the size.
- **Even without the fonts and CMaps** it is 833,817 bytes, 2× pdf.js.
  - That build has no fonts to fall back on for non-embedded standard
    fonts, and no predefined CMaps. pdf.js falls back to system fonts. So
    it is not the build the bar judges.
  - It is still 1.6× pdf.js plus its optional `jbig2.wasm` and
    `openjpeg.wasm` (517,422 bytes, which `main` does not ship). That is
    the reading most favourable to hayro.
- **The two largest parts** are the compiled-in fonts and CMaps (524,278
  bytes brotli, more than all of pdf.js) and `fearless_simd`. Its scalar
  fallback is monomorphised per caller (830,757 bytes before compression),
  and the crate is linked in two versions, 1.3.0 and 0.7.0. No single part
  explains the gap.
- **The hayro the app already ships doesn't offset this.**
  `wasm/crates/pdf` pulls in hayro 0.4.0 through Typst, but that is a
  different version in the separate Typst worker. It shares no code with a
  renderer on the Tool's page.
- **The no timeout, OOM or trap check passed** on all 19 corpus files,
  run in Node at scale 0.6.
  - Nothing trapped, ran out of memory or took over 10 s on a page. Peak
    linear memory was 90 MiB.
  - The margin on time is thin: the arXiv paper's figure pages took up to
    9.2 s on a loaded machine.
  - Files with an empty user password decrypt with RC4-128 (R3), AES-128
    (R4) and AES-256 (R6).
  - Locked, truncated and non-PDF input returns an error.
- **Not run:** visual parity, render time and main-thread blocking. Once
  bytes had failed, none of them could change the verdict.

The trial's harness rendered from a document handle, which is also how
pdf.js works. With the stateless facade, every page would re-parse the
file and lose the font and glyph caches. That is why the pdf.js facade in
Decision 2 now takes a handle, whichever engine is behind it. A later hayro
release can still replace the implementation without touching Tool code.

## Revisit when

- A trial passes or fails.
- A hayro release, with its standard fonts and CMaps compiled in or
  fetched on demand, is no larger than pdf.js in brotli bytes (417,068
  for pdfjs-dist 6.4.299). That reopens trial 1 on that release. The
  timeout, OOM and trap check is re-run, and the three unrun checks would
  then have to pass.
- `mmdr` gains a wasm build and full diagram coverage.
- A Rust code editor or a TypeScript language service reaches the
  browser.
- `dx` gains npm bundling, a worker build step, or chunk-aware hashing.
- ONNX Runtime's `.wasm` fits under the Pages per-file limit.
