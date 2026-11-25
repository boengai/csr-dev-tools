# Which JavaScript engines have a viable Rust replacement?

Research for GitHub issue #9 (boengai/csr-dev-tools). Date: 2026-11-25. Repo state: `main` at `f48dd80b` plus uncommitted edits. The `package.json` edit only changes the `build` script; dependencies match the commit.

## Answer

Of the 18 rows below: 7 are **replace** (`ajv`, `graphql`, `jszip`, `@dnd-kit/*`, `react-image-crop`, the pixel-math half of the Canvas work, and the image-to-PDF half of `pdf-lib`). 4 are **keep behind interop**: Monaco, CodeMirror 6, `mermaid`, and the browser image codecs (AVIF decoding and lossy WebP/AVIF encoding). The other 7 are **unclear, needs a trial**: the TypeScript checker, `@xyflow/react`, `pdf-lib` page merging, `pdfjs-dist`, `@huggingface/transformers`, `jsonpath-plus`, and `dompurify`.

There is no credible Rust code editor for a Dioxus web app. The Dioxus crates either wrap CodeMirror through JS (`dioxus_codemirror`) or are pre-release highlighters that state no editing features (`dioxus-code-editor`).

The most important new fact is `tsrs` (oxc-project). It is a Rust port of the TypeScript 7 checker with a browser wasm build. That build targets `wasm32-wasip1` and is a prerelease (repo created 2026-10-01, latest release 2026-11-23), so it needs a trial and will not link into the Dioxus binary.

The PDF picture is better than expected. The repo's own `wasm/crates/pdf` lockfile already resolves `hayro` (a PDF renderer), `hayro-write`, `krilla`, `pdf-writer`, `resvg` and `image` through Typst (`typst-pdf` → `krilla` → `hayro-write`/`pdf-writer`; `typst-svg` → `hayro`). That crate builds for `wasm32-unknown-unknown`, so a PDF trial starts from code already in the build graph. The in-tree versions are older than the latest releases.

The three React-bound libraries (`@xyflow/react`, `@dnd-kit/*`, `react-image-crop`) cannot be "kept behind interop" without shipping React. For them the choice is a Dioxus-native rewrite, or, for xyflow only, its framework-agnostic core `@xyflow/system`.

## Verdict table

Tool keys are the `key` values in `src/constants/tool-routes.ts`.

| Engine | Used by which tools | Rust candidate | Verdict | Main risk |
|---|---|---|---|---|
| Monaco (`@monaco-editor/react`) | `typescript-playground` only | none credible | **keep behind interop** (or drop it for the CodeMirror bridge) | It loads monaco from cdn.jsdelivr.net today. Its TS IntelliSense (completion, hover) has no Rust equivalent in the browser. |
| CodeMirror 6 (`@codemirror/*`, `@uiw/react-codemirror`, `@uiw/codemirror-themes`, `@lezer/highlight`) | `CodeInput`, the default source editor of `TransformerShell`, `CodecShell`, `ComparatorShell` and `MarkupToPdfShell`, plus `regex-tester`, `bcrypt-hasher`, `protobuf-codec`, `protobuf-to-json`, `graphql-schema-viewer`, `db-diagram` (about 35 tools) | `dioxus_codemirror` (a CM6 wrapper), `dioxus-code-editor` (pre-release) | **keep behind interop** | The wrapper is young and lacks the JSON/SQL languages, so we probably need our own thin JS bundle. Highest blast radius of any row. |
| TypeScript compiler (runs inside Monaco's TS worker) | `typescript-playground` | `tsrs` (check and emit); `oxc_transformer` / swc fast-strip (type stripping only) | **unclear, needs a trial** | `tsrs` is `wasm32-wasip1` and a prerelease; strip-only tools lose the error list. |
| `mermaid` | `mermaid-renderer`; `db-diagram` (hands off Mermaid text) | `mermaid-rs-renderer` (mmdr) | **keep behind interop** | mmdr covers 23 diagram types to mermaid's 32, states no wasm support, and depends on system fonts. |
| `@xyflow/react` | `db-diagram` | none mature (`flow-rs` is beta and Leptos-focused) | **unclear, needs a trial** (Dioxus rewrite of the used subset vs `@xyflow/system`) | React-bound; the rewrite has to cover pan/zoom, drag, handles, minimap and smoothstep edges. |
| `pdf-lib`, image to PDF | `image-to-pdf` | `krilla` (`Image::from_png`/`from_jpeg`) / `pdf-writer` (both in the repo's lockfile) | **replace** | Small. JPEG pass-through (no re-encoding) is not documented; check output size and quality against `pdf-lib`. |
| `pdf-lib`, page merge | `combine-pdf` | `hayro-write` + `pdf-writer` (in tree); `lopdf` | **unclear, needs a trial** | How faithfully pages are copied (annotations, links, encrypted inputs). `lopdf` drops outlines. |
| `pdfjs-dist` | `combine-pdf` page thumbnails; `PdfBytesPreview` via `SortablePdfShell` (`image-to-pdf`, `combine-pdf`). `markdown-to-pdf`/`html-to-pdf` preview Typst's SVG pages instead. | `hayro` (wasm demo exists; 0.4.0 in the lockfile, latest 0.9.0) | **unclear, needs a trial** | Rendering coverage and speed on real-world PDFs; the author warns of timeouts and OOM. |
| `@huggingface/transformers` (ONNX Runtime Web) | `background-remover` | `tract-onnx` (pure Rust, wasm stated); `ort` + `ort-web` (Rust API over onnxruntime-web JS) | **unclear, needs a trial** | Whether tract runs MODNet's operators, its CPU speed against ORT's SIMD-threaded wasm, and porting the pre/post-processing. |
| `ajv` | `json-schema-validator` | `jsonschema` | **replace** | Error wording and paths differ from Ajv's; `format` handling may differ. |
| `graphql` | `graphql-schema-viewer` | `apollo-compiler` | **replace** | Error messages and locations differ; default-value printing has to be re-derived. Its docs cite the October 2021 spec, while `graphql` 17 may accept newer syntax (not checked). |
| `jsonpath-plus` | `jsonpath-evaluator` | `serde_json_path`, `jsonpath-rust` (RFC 9535) | **unclear, needs a trial** (and a parity decision) | RFC 9535 crates drop the jsonpath-plus extensions (`^`, `~`, `@string()`, JS filter scripts). |
| `jszip` | batch downloads in `BatchFileProcessor` / `useBatchAssetPipeline` (image batch tools) | `zip` (zip2), `rawzip` | **replace** | Negligible. The repo uses jszip's default STORE mode. |
| `dompurify` | `TransformerOutputPane` (`markdown-preview`, `mermaid-renderer`, `svg-viewer`), `mermaid-renderer` SVG, `svg-viewer` | `ammonia` (HTML); `svg-hush` (SVG files) | **unclear, needs a trial** | ammonia has no SVG profile, so we would write the allowlist ourselves; it has a recent SVG/MathML mXSS history. |
| `@dnd-kit/*` | `image-to-pdf`, `combine-pdf` (sortable grids) | `dioxus-dnd` 3.1.0 stable (keyboard, touch, `SortableGrid`); hand-built | **replace** | Young crate: created 2026-07-05, about 1.3k downloads. |
| `react-image-crop` | `image-cropper` | none known (not searched); hand-built Dioxus component | **replace** | Keyboard and touch parity, aspect lock, minimum size. |
| Canvas 2D: pixel work | `image-resizer`, `image-converter`, `image-compressor`, `image-cropper`, `favicon-generator`, `splash-screen-generator`, `image-color-picker`, `background-remover` (mask compositing) | port `src/utils/resample.ts` to Rust; `image`; `fast_image_resize` | **replace** | The Rust resampler must stay Pillow-faithful (ADR-0025). |
| Canvas 2D: codecs and text | decoding all inputs (AVIF, WebP, ...); lossy WebP and AVIF encoding; `placeholder-image-generator` text; `mermaid-renderer` SVG to PNG | `image` (WebP encode lossless only; AVIF decode needs C libdav1d); `ravif` (AVIF encode); `resvg` | **keep behind interop** (browser APIs via `web-sys`) | Among the crates read, none decodes AVIF in pure Rust or encodes lossy WebP. |

## Findings

### Inventory and scope

These runtime dependencies do real work: `@monaco-editor/react`, `@codemirror/lang-json`, `@codemirror/lang-sql`, `@codemirror/state`, `@codemirror/view`, `@uiw/react-codemirror`, `@uiw/codemirror-themes`, `@lezer/highlight`, `@xyflow/react`, `@huggingface/transformers`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `ajv`, `dompurify`, `graphql`, `jsonpath-plus`, `jszip`, `mermaid`, `pdf-lib`, `pdfjs-dist`, `react-image-crop` (all from `package.json`).

These are excluded as UI-framework glue: `react`, `react-dom`, `@radix-ui/*`, `@tanstack/react-router`, `zustand`, `tailwindcss`, `tailwind-variants` and `@tailwindcss/typography`. They are replaced by Dioxus itself and its styling, not by an engine.

`motion` is also excluded. It is imported in 16 files, only for `m`, `AnimatePresence` and `LazyMotion`/`domAnimation`, so it is presentational. It belongs to the UI-layer ticket, and its replacement (CSS transitions or a Dioxus animation crate) was not researched.

`typescript` is a devDependency and is not what the playground runs. The playground uses the TypeScript language service bundled in Monaco's worker, called as `monaco.languages.typescript.getTypeScriptWorker()` in `src/components/feature/code/TypescriptPlayground.tsx`.

Baseline bundle cost comes from the existing `dist/assets` (uncompressed, built 2026-11-19):

| Chunk | Size |
|---|---|
| `ort-wasm-simd-threaded.asyncify-*.wasm` | 26.9 MB |
| `pdf_bg-*.wasm` (the repo's Typst crate) | 21.9 MB |
| `elk-*.js` (mermaid's layout engine) | 1.59 MB |
| `pdf.worker.min-*.mjs` (pdf.js) | 1.26 MB |
| `CodeInput-*.js` | 399 KB |
| `db-diagram-*.js` | 289 KB |
| `graphql-schema-viewer-*.js` | 135 KB |
| `JsonSchemaValidator-*.js` | 120 KB |

Monaco is not in `dist`: `public/_headers` documents that it loads from cdn.jsdelivr.net.

### Existing crates under `wasm/crates/`

All crates are built with `wasm-pack build --target web` (`wasm/scripts/build.sh`, lines 68-72), i.e. `wasm32-unknown-unknown`, then run through `wasm-opt -Oz`.

The "replaced" column comes from `git log -p -- package.json` commit messages.

| Crate | Exports | Replaced JS dependency | `.wasm` size |
|---|---|---|---|
| `bcrypt` | `hash_password`, `verify_password` | `bcryptjs` (0fe61879) | 35 KB |
| `certificate` | `parse_pem_certificate` (`x509-parser`) | `@peculiar/x509` (2b721ae2) | 276 KB |
| `diff` | line/word/unified diff | `diff` (d21377e2) | 42 KB |
| `formatter` | CSS/HTML/JS format and minify, SQL format | `js-beautify`, `sql-formatter` (5b654cb3) | 76 KB |
| `hash` | MD5 | `js-md5` (50a8b60e) | 19 KB |
| `markdown` | `markdown_to_html`, `html_to_markdown` | `marked`, `turndown`, `turndown-plugin-gfm` (274802ab) | 77 KB |
| `parsers` | XML/TOML/YAML to and from JSON, protobuf | `fast-xml-parser`, `yaml`, `smol-toml`, `protobufjs` (7bd3bbc7) | 261 KB |
| `qrcode` | QR as PNG data URL and SVG | `qrcode` (274802ab) | 84 KB |
| `pdf` | `compile_markdown` (Typst 0.14: Markdown/HTML to SVG pages + PDF) | none; new capability behind `markdown-to-pdf` and `html-to-pdf` | 21.9 MB |
| `color`, `csv`, `hmac`, `json-tools`, `number-base`, `uuid` | conversions, HMAC, JSON format/sort/to-TS, UUID v4/v7 | none: `package.json` history shows no npm package removed for them | 18-105 KB |
| `shared` | `bytes_to_hex` (library, not built) | n/a | n/a |

`wasm/crates/pdf` covers **neither** `pdf-lib` (merge, image embedding) **nor** `pdfjs-dist` (rasterising).

Its `wasm/Cargo.lock` already resolves the PDF-capable crates listed below. The chains are `typst-pdf` → `krilla` → `hayro-write`/`pdf-writer`, `typst-pdf` → `krilla-svg` → `resvg`, and `typst-svg` → `hayro`. The crate builds for `wasm32-unknown-unknown`, so these are in a wasm build graph. Whether each one is actually linked into `pdf_bg.wasm` (rather than feature-gated out) was not checked.

- `hayro` 0.4.0 (latest is 0.9.0; the limits quoted below are from the 0.9 README)
- `hayro-write`
- `krilla` 0.6.0 (latest 0.8.2)
- `pdf-writer` 0.14.0
- `resvg`/`usvg` 0.45.1
- `tiny-skia` 0.11.4
- `image` 0.25.10 (with `gif`, `png`, `zune-jpeg`, `image-webp`)
- `fontdb` 0.23
- `rustybuzz` 0.20.1
- `flate2`/`miniz_oxide`

### Editors: Monaco and CodeMirror 6

**How the repo uses them**

Monaco appears only in the TypeScript playground. That tool uses two `Editor` instances, `onValidate` markers for the error list, and `getEmitOutput` for the JS pane.

CodeMirror 6 is wrapped once, as `src/components/common/input/CodeInput.tsx`. That wrapper provides a themed `createTheme`, `basicSetup` with bracket matching, close-brackets, line numbers and search keymap, `lineWrapping`, `contentAttributes` for a11y, and a read-only mode. Language extensions are passed only by `db-diagram` (`@codemirror/lang-sql`, `@codemirror/lang-json`). `FieldForm type="code"` renders `CodeInput`, and `TransformerShell` defaults `sourceKind = 'code'` (line 40; 12 tools override it to `text`/`textarea`). Through those shells and the six custom tools listed in the table, about 35 tools depend on it.

**Rust candidates**

- `dioxus_codemirror` 0.3.1 (created 2026-06-06, 813 downloads) "wraps the CodeMirror 6 editor" and "drives CodeMirror through a single long-lived `document::eval` channel". CodeMirror is vendored as an asset. Its bundled languages are YAML, Markdown, JavaScript, CSS and HTML, so JSON and SQL are missing. It "is new and not yet stable; its API may change between releases". [docs.rs/crate/dioxus_codemirror](https://docs.rs/crate/dioxus_codemirror/latest), [crates.io](https://crates.io/crates/dioxus_codemirror). This is interop, not a replacement.
- `dioxus-code-editor` 0.1.2 stable, 0.2.0-alpha.3 latest (created 2026-05-05, about 8.3k downloads) "pairs the highlighter with a textarea input layer". The repo page mentions no undo, search, bracket matching, line numbers or diagnostics. It has 7 stars. [github.com/ealmloff/dioxus-code](https://github.com/ealmloff/dioxus-code), [crates.io](https://crates.io/crates/dioxus-code-editor). Its parsing uses `arborium`, a tree-sitter grammar collection "with HTML rendering and WASM support". The arborium README does not say how its C runtime builds for `wasm32-unknown-unknown`. [github.com/bearcove/arborium](https://github.com/bearcove/arborium)
- Highlighting-only building blocks:
  - `syntect` 5.3.0 has a pure-Rust `fancy-regex` mode that is "about half the speed" of Oniguruma. [github.com/trishume/syntect](https://github.com/trishume/syntect)
  - `tree-sitter` 0.27.2 has a C core; its web binding uses Emscripten-style loading. [web binding README](https://github.com/tree-sitter/tree-sitter/blob/master/lib/binding_web/README.md)
  - Neither is an editor.
- No other Rust editor targeting the browser DOM turned up in a web search. Lapce's UI crate `floem` last released 0.2.0 on 2024-11-14 ([crates.io](https://crates.io/crates/floem)); its rendering target was not checked.

**Verdict: keep both behind interop.** CodeMirror 6 is framework-agnostic, so a thin owned JS module (`EditorView` plus the extensions we use) driven over `wasm-bindgen` or `document::eval` keeps today's features. Monaco can stay the same way.

Consolidating the playground onto the same CodeMirror bridge would remove the Monaco CDN dependency (80 MB npm package). It would drop Monaco's IntelliSense, completion and hover unless a language service is wired in; see the next section. That trade is a product decision.

**Size:** not measured for any Rust option. The CodeMirror chunk is 399 KB today.

### TypeScript compiler (TypeScript playground)

**What is needed for parity:** error and warning diagnostics with line and column (the error list under the editors), and ES2022/ESNext JS emit with `jsx: ReactJSX`, `strict`. Both come from Monaco's bundled TS worker today.

**Rust candidates**

- **`tsrs`** ([github.com/oxc-project/tsrs](https://github.com/oxc-project/tsrs)): "a drop-in replacement for the TypeScript 7 compiler and language server, written in Rust", Apache-2.0.
  - Repo created 2026-10-01. Latest release `v7.1.0-beta.tsrs5` on 2026-11-23. 82 open issues + PRs (GitHub API `open_issues_count`). Pull requests are closed to outsiders.
  - Crates are published (`tsrs_checker`, `tsrs_compiler`, `tsrs_cli` 7.1.0-beta.tsrs5: [crates.io/crates/tsrs_checker](https://crates.io/crates/tsrs_checker)).
  - `@tsrs/wasm` "uses the shared Rust compiler code, compiled for `wasm32-wasip1`, and runs single-threaded". It supports type checking with `--noEmit`, JS and `.d.ts` emit, in-memory files in browsers, and JSON diagnostics. In the browser you must "run `tsc` in a Web Worker that you create". It has an 80 MiB shadow stack, and "Safari's worker stack is smaller ... the deepest expressions overflow there first". [npm/tsrs-wasm/README.md](https://github.com/oxc-project/tsrs/blob/main/npm/tsrs-wasm/README.md)
  - The `@tsrs/wasm` npm package unpacks to 10.1 MB ([registry.npmjs.org/@tsrs/wasm](https://registry.npmjs.org/@tsrs/wasm/latest)); transfer size not measured.
  - The oxc docs confirm Oxlint's type-aware backends are "`tsgolint` ... the Go implementation of TypeScript 7.0" or "`tsrs` ... a Rust port based on TypeScript 7.1". [oxc.rs type-aware](https://oxc.rs/docs/guide/usage/linter/type-aware.html)
  - Fit: it is Rust and gives check plus emit, but it is a separate WASI module run by a JS host in a worker, not code linked into the Dioxus binary. Language-service features (completion, hover) are not in the wasm build ("`--lsp` ... not supported").
- **`oxc` / `oxc_transformer`** 0.160.0 (2026-11-23): "TypeScript — type stripping" ([oxc.rs transformer](https://oxc.rs/docs/guide/usage/transformer.html)). It has no type checker. oxc's CI tests `wasm32-wasip1-threads` (`.github/workflows/ci.yml`). `wasm32-unknown-unknown` is not stated (not verified).
- **swc**: `@swc/wasm-web` transforms "inside the browser using WebAssembly" ([swc.rs/docs/usage/wasm](https://swc.rs/docs/usage/wasm)). `bindings/binding_typescript_wasm` is a `wasm-bindgen` cdylib over `swc_ts_fast_strip` ([Cargo.toml](https://github.com/swc-project/swc/blob/main/bindings/binding_typescript_wasm/Cargo.toml)). It strips only and does not type-check.
- **Dead ends**:
  - `stc`: "archived by the owner on Mar 12, 2025" ([github.com/dudykr/stc](https://github.com/dudykr/stc)).
  - `ezno` 0.0.23: self-described experiments "in the prototype stage" ([docs.rs/crate/ezno](https://docs.rs/crate/ezno/0.0.23/source/README.md)).

**Verdict: unclear, needs a trial.** Load `@tsrs/wasm` in a worker on the playground's sample code. Measure download size, cold start and per-keystroke latency (debounced at 500 ms today), and run on Safari to check the stack-overflow risk.

Fallbacks:

- keep Monaco's TS worker behind interop;
- or `oxc_transformer` for emit only, which drops the error list (a visible loss, so not acceptable under the parity rule).

### Diagrams: `mermaid`

**How the repo uses it:** `src/utils/mermaid-renderer.ts` calls `mermaid.initialize({ securityLevel: 'strict', theme: 'dark', ... })` and `mermaid.render`. It sanitises the SVG with DOMPurify, and rasterises it to PNG through a canvas (`svgToPng`). Users can enter any diagram type; the tool's presets are flowchart, sequence, class and gantt. Mermaid documents 32 diagram types ([mermaid.js.org/intro](https://mermaid.js.org/intro/)). It is also the largest dependency: elk alone is 1.59 MB, plus dozens of per-diagram chunks.

**Rust candidate:** `mermaid-rs-renderer` (`mmdr`) 0.3.1, 2026-07-06, about 315k downloads, 62 open issues + PRs ([crates.io](https://crates.io/crates/mermaid-rs-renderer), [github.com/1jehuang/mermaid-rs-renderer](https://github.com/1jehuang/mermaid-rs-renderer)).

- It "supports 23 Mermaid diagram types".
- "Visual output quality ... may not yet match mermaid-cli in all cases".
- Text uses "cached installed system fonts", so a browser build would have to bundle fonts.
- WebAssembly is not mentioned, and a code search of the repo for `wasm32` found nothing.

`layout-rs` (Graphviz-style, 0.1.3, last pushed 2025-05) is a layout engine only, not a Mermaid parser.

**Verdict: keep behind interop.** `mermaid` is framework-agnostic and only needs a `render(code) -> svg` bridge. mmdr is worth a later trial, but 23 of 32 types plus a quality disclaimer fails the parity rule today. For SVG to PNG, `resvg` would replace the canvas step ("guaranteed to work everywhere where you can compile the Rust itself, including WASM", [github.com/linebender/resvg](https://github.com/linebender/resvg)). It renders only "the static SVG subset" and needs fonts loaded explicitly, so mermaid's text-heavy SVGs need a font check.

### Diagrams: `@xyflow/react` (`db-diagram`)

**How the repo uses it:** `ReactFlow`, `Background`, `Controls`, `MiniMap`, `Handle`, `Position`, `Panel`, `EdgeLabelRenderer`, `getSmoothStepPath`, `applyNodeChanges`, `useReactFlow`, `ReactFlowProvider` (`src/components/feature/data/db-diagram/*.tsx`, about 2,000 lines). The library is React-only, so interop would mean embedding a React root inside Dioxus.

**Candidates**

- `@xyflow/system` 1.0.1 is the "xyflow core system that powers React Flow and Svelte Flow". It is framework-agnostic and builds on `d3-zoom`/`d3-drag` ([registry.npmjs.org/@xyflow/system](https://registry.npmjs.org/@xyflow/system/latest)), so it is the only JS option that does not drag React along.
- `flow-rs-core`/`flow-rs-wasm` are 0.1.0-beta.2 from 2025-09-22, with about 1.6k downloads ([crates.io/crates/flow-rs-core](https://crates.io/crates/flow-rs-core)). Its README claims a Leptos integration; this was not verified from the README itself.
- Dioxus exposes pointer, wheel, drag and resize events ([docs.rs/dioxus events](https://docs.rs/dioxus/latest/dioxus/events/index.html)), which is enough to hand-build pan/zoom and node drag in SVG/DOM.

**Verdict: unclear, needs a trial.** Hand-build the used subset in Dioxus (viewport transform, node drag, handles, smoothstep edge path, minimap, controls), and compare effort and feel against a `@xyflow/system` bridge. There is no mature Rust crate to adopt.

### PDF: `pdf-lib` and `pdfjs-dist`

**How the repo uses them**

`pdf-lib`:

- `combinePdfPages`: `PDFDocument.load(..., { ignoreEncryption: true })` + `copyPages` + `save` (`src/utils/combine-pdf.ts`);
- `imagesToPdf`: A4 pages, `embedPng`/`embedJpg`, `drawImage`, `setRotation`, a 2x2 grid (`src/utils/image-to-pdf.ts`).

`pdfjs-dist`:

- page thumbnails at scale 0.3 (`readPdfPages`);
- full previews in `src/components/common/pdf/PdfBytesPreview.tsx`, used through `SortablePdfShell` by `image-to-pdf` and `combine-pdf`.
- `markdown-to-pdf` and `html-to-pdf` preview the SVG pages the Typst crate returns (`PdfSvgPreview`), not pdf.js.

**Rust candidates**

- **`hayro`** 0.9.0 (2026-11-02, about 6.2M downloads, 94 open issues + PRs): "A set of Rust crates for parsing, interpreting and rendering PDF files". `hayro-svg` produces SVG output. [github.com/LaurenzV/hayro](https://github.com/LaurenzV/hayro)
  - Its demo is built with `wasm-pack build --target web` and `--target wasm32-unknown-unknown`, in SIMD and non-SIMD variants ([hayro-demo/build.sh](https://github.com/LaurenzV/hayro/blob/main/hayro-demo/build.sh)), so wasm is proven.
  - Limits: "This excludes some more exotic features like knockout groups, CMYK blending or 3D content", "there are still many ways to trigger timeouts and OOM errors", and no glyph caching yet. Thumbnails and previews need none of the excluded features.
- **`hayro-write`** 0.9.0: "converting PDF pages into either XObjects or a new page via `pdf-writer`". It is labelled "an internal crate and not meant for external use" ([hayro-write/README.md](https://github.com/LaurenzV/hayro/blob/main/hayro-write/README.md)). It is the merge mechanism that krilla uses, and it is already in this repo's tree.
- **`krilla`** 0.8.2 (2026-06-04, about 4.4M downloads) supports "Embedding bitmap images, and SVG images via `krilla-svg`" ([github.com/LaurenzV/krilla](https://github.com/LaurenzV/krilla)). It has `Image::from_png`, `from_jpeg`, `from_gif`, `from_webp` and `from_rgba8` ([docs.rs krilla Image](https://docs.rs/krilla/latest/krilla/image/struct.Image.html)); the docs say nothing about JPEG pass-through. **`pdf-writer`** 0.15.0 (2026-05-27) is the low-level writer underneath. Both are in the repo's lockfile (krilla at 0.6.0).
- **`lopdf`** 0.47.0 (2026-11-04, about 32.8M downloads, 90 open issues + PRs): it has a "Merge PDF documents" example, but "Outlines not supported in merged PDFs". It "only supports PDFs encrypted with empty passwords". Its CI builds `wasm32-wasip1`/`wasip2` only, so `wasm32-unknown-unknown` is not verified. [github.com/J-F-Liu/lopdf](https://github.com/J-F-Liu/lopdf)
- **`pdfium-render`** 0.9.6: on wasm, "packaging an external build of Pdfium as a separate WASM module is essential" ([github.com/ajrcarey/pdfium-render](https://github.com/ajrcarey/pdfium-render)). That makes it interop with a C++ engine, not a replacement.

**Verdicts**

- **Image to PDF: replace** with `krilla` or `pdf-writer`, which are already in the wasm tree.
- **Merge: unclear, needs a trial.** Run `hayro-write` (or `lopdf`) against a corpus with annotations, links, forms and encrypted inputs, and diff against `pdf-lib`'s output. The repo loads with `pdf-lib`'s `ignoreEncryption: true`, and the pdf-lib API page does not describe what that option does, so we need test files to establish what users get today.
- **Rendering: unclear, needs a trial.** Run `hayro` on the same corpus and on `markdown-to-pdf` output for speed and visual parity against pdf.js.

**Size:** adding these to the existing `pdf` crate should cost little, because hayro, krilla and pdf-writer are already linked; not measured. pdf.js costs 1.26 MB today.

### Model runtime: `@huggingface/transformers` (`background-remover`)

**How the repo uses it:** `pipeline('background-removal', 'Xenova/modnet', { dtype: 'fp32' })` in a worker (`src/workers/background-removal.segment.ts`). The output is an RGBA mask that is composited on a canvas.

- No `device` is passed. The transformers.js guide presents WebGPU as opt-in via `device: 'webgpu'` ([WebGPU guide](https://huggingface.co/docs/transformers.js/guides/webgpu)), and the shipped asset is `ort-wasm-simd-threaded.asyncify.wasm`, so inference is CPU wasm today.
- The fp32 model is 25.9 MB, and `model_quantized.onnx` is 6.6 MB ([HF API tree](https://huggingface.co/api/models/Xenova/modnet/tree/main/onnx)). The model is Apache-2.0 ([huggingface.co/Xenova/modnet](https://huggingface.co/Xenova/modnet)).

**Rust candidates**

- **`tract-onnx`** 0.23.10 (2026-11-24, about 4.4M downloads, 127 open issues + PRs). Its README says it runs "in the browser via WebAssembly", lists the WebAssembly target as "via standard wasm32 targets", and "loads ONNX and NNEF models". It makes no operator-coverage claim. [github.com/sonos/tract](https://github.com/sonos/tract)
  - It is pure Rust and CPU-only. The whole pipeline (resize, normalise, infer, upsample the mask) would move to Rust.
- **`ort`** 2.0.0-rc.15 + **`ort-web`** 0.5.0+1.30 (2026-10-23, about 11.9k downloads). `ort_web::api` "Returns an error if ... The JavaScript/WASM modules fail to load". Its example self-hosts from `https://cdn.jsdelivr.net/npm/onnxruntime-web@1.27.0/dist/`. [ort-web lib.rs](https://docs.rs/crate/ort-web/latest/source/lib.rs)
  - So it is a Rust API over the same onnxruntime-web runtime. It is the "keep behind interop" variant, with WebGPU/WebNN options.
- **`candle`** 0.11.1: "WASM support, run your models in a browser". Its README file-format list is "safetensors, npz, ggml, or PyTorch files"; `candle-onnx` exists but its README makes no ONNX loading claim. [github.com/huggingface/candle](https://github.com/huggingface/candle)
- **`burn`** 0.22.1: runs on wasm (Flex CPU, WGPU/WebGPU). ONNX import "currently supports a limited set of ONNX operators" and generates Rust code at build time. [github.com/tracel-ai/burn](https://github.com/tracel-ai/burn)
- **`wonnx`**: last release 2023-09-30 ([crates.io](https://crates.io/crates/wonnx)), so it is abandoned.

**Verdict: unclear, needs a trial.** Load `Xenova/modnet` `model.onnx` (and `model_quantized.onnx`) in `tract-onnx` built for `wasm32-unknown-unknown` with `+simd128`. Check that the model loads, that its output matches transformers.js on 5 images (mask PSNR), and that latency is acceptable against ORT's threaded SIMD build.

If tract fails, fall back to `ort` + `ort-web`. That is Rust code but keeps the onnxruntime-web engine; check `ort-web`'s telemetry before shipping it (not verified).

### Data and parsing

**`ajv`: replace with `jsonschema`.**

- How we use it: `new Ajv({ allErrors: true })` (the default export covers draft-07/06, per [ajv.js.org](https://ajv.js.org/guide/schema-language.html)), then `compile`, and errors are mapped to `{ keyword, message, path }` (`src/utils/json-schema.ts`).
- `jsonschema` 0.63.1 (2026-11-23, about 131M downloads, 10 open issues + PRs) lists "WebAssembly support" and a browser "WebAssembly playground". It ships a `crates/jsonschema-wasm` crate and supports Drafts 4, 6, 7, 2019-09 and 2020-12. [github.com/Stranger6667/jsonschema](https://github.com/Stranger6667/jsonschema)
- Risk: error message wording differs from Ajv's, so fixture tests must be rewritten. `format` behaviour needs a fixture check.

**`graphql`: replace with `apollo-compiler`.**

- How we use it: `buildSchema`, `getTypeMap`, type predicates, `print` for default values, and `GraphQLError.locations` (`src/utils/graphql-schema-viewer.ts`).
- `apollo-compiler` 1.33.1 (2026-10-21) has `Schema::parse_and_validate`, the public fields `types`, `schema_definition` and `directive_definitions`, `root_operation`, and `impl Display` ("Serialize to GraphQL syntax"). [docs.rs Schema](https://docs.rs/apollo-compiler/latest/apollo_compiler/schema/struct.Schema.html)
- Wasm: the repo's `.cargo/config.toml` sets a `[target.wasm32-unknown-unknown]` getrandom backend and references an `examples/validation-wasm-demo` ([apollo-rs .cargo/config.toml](https://github.com/apollographql/apollo-rs/blob/main/.cargo/config.toml)).
- It links the October 2021 spec. Risk: different diagnostic text.

**`jsonpath-plus`: unclear, needs a trial and a parity decision.**

- How we use it: `JSONPath({ json, path, resultType: 'all' })`, showing `path` and `value`. User expressions are free-form.
- jsonpath-plus adds `^` (parent), `~` (property names), type selectors such as `@string()`, `@path`/`@parent`/`@property` shorthands, and JS filter scripts evaluated by a "safe" mini engine by default ([github.com/JSONPath-Plus/JSONPath](https://github.com/JSONPath-Plus/JSONPath)).
- Rust candidates implement RFC 9535:
  - `serde_json_path` 0.7.2 (2025-02-03; `query_located` returns locations such as `$['foo']['bar']`; it runs the compliance test suite) ([docs.rs](https://docs.rs/serde_json_path/latest/serde_json_path/struct.JsonPath.html), [github](https://github.com/hiltontj/serde_json_path));
  - `jsonpath-rust` 1.0.13 (2026-11-14; "fully compliant (except several cases)", `query_with_path`) ([github](https://github.com/besok/jsonpath-rust)).
- Neither states wasm support, but both are pure Rust over `serde_json` (not verified).
- Switching changes accepted syntax and drops the extensions, which is visible to users. Decide whether parity means "jsonpath-plus syntax" or "RFC 9535", then trial against a corpus of today's example expressions.

**`jszip`: replace.**

- How we use it: `zip.file(path, content)` + `generateAsync({ type: 'blob' })` (`src/utils/zip.ts`). jszip's default compression is "`STORE` (no compression)" ([jszip docs](https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html)).
- `zip` 9.8.2 (2026-11-23, about 362M downloads, 34 open issues + PRs) "can work in a Wasm environment" once you disable features that use "non-rust library" code ([github.com/zip-rs/zip2](https://github.com/zip-rs/zip2)). Stored-only writing needs no compression backend. `rawzip` 0.5.3 is an alternative.
- Size cost: small; not measured.

**`dompurify`: unclear, needs a trial.**

- How we use it: three call sites sanitise HTML plus SVG with the `svg` and `svgFilters` profiles (`TransformerOutputPane.tsx`, `SvgViewer.tsx`, `mermaid-renderer.ts`).
- `ammonia` 4.2.5 (2026-11-13, about 23M downloads, 23 open issues + PRs) is "a whitelist-based HTML sanitization library" on `html5ever` ([github.com/rust-ammonia/ammonia](https://github.com/rust-ammonia/ammonia)). It ships no SVG profile: issue #198 ("How can I sanitize SVGs using this library?") is open, with a maintainer pointing to `svg-hush` and a user building a tag allowlist by hand ([issue #198](https://github.com/rust-ammonia/ammonia/issues/198)). Releases 4.2.5, 4.1.9 and 3.3.5 fixed a "mutation XSS from combining MathML and SVG".
- No wasm statement was found (not verified).
- Trial: an ammonia allowlist equal to DOMPurify's svg+svgFilters profile, run against DOMPurify's own XSS test vectors and mermaid output. Fallback: keep DOMPurify, which is small and framework-agnostic, behind interop.

### Interaction: `@dnd-kit/*` and `react-image-crop`

Both are React-bound, so interop is not viable without React.

**`@dnd-kit/*`: replace.**

- How we use it: `PointerSensor` + `KeyboardSensor` with `sortableKeyboardCoordinates`, `closestCenter`, `rectSortingStrategy` and `arrayMove` (`src/hooks/useSortableItems.ts`), in `image-to-pdf` and `combine-pdf`.
- `dioxus-dnd` ([docs.rs/dioxus-dnd](https://docs.rs/dioxus-dnd)):
  - "Every `Draggable` is focusable ... and fully operable without a pointer";
  - screen-reader `LiveRegion`;
  - touch auto-sense;
  - `SortableList` and `SortableGrid`;
  - verified against Dioxus `0.7.10`;
  - an optional `web` feature for pointer capture.
- Maturity is the risk: stable 3.1.0 (4.0.0-alpha.1 is the latest prerelease), created 2026-07-05, about 1.3k downloads ([crates.io](https://crates.io/crates/dioxus-dnd)). Fallback: hand-build with the Dioxus pointer and keyboard events.

**`react-image-crop`: replace with a hand-built Dioxus component.**

- How we use it: `aspect` presets, `minWidth={10}`, and pixel-crop capture (`src/components/feature/image/ImageCropper.tsx`).
- No search was run for a Dioxus crop crate, and none is known. Dioxus pointer, keyboard and resize events cover the interaction ([docs.rs/dioxus events](https://docs.rs/dioxus/latest/dioxus/events/index.html)). The crop itself is pixel math (see Canvas below).

### Image work through Canvas 2D

**How the repo uses it**

`getContext('2d')` is called in nine files:

- `src/utils/canvas.ts`
- `src/utils/image.ts`
- `src/utils/background-removal.ts`
- `src/utils/color-picker.ts`
- `src/utils/favicon.ts`
- `src/utils/splash-screen.ts`
- `src/utils/placeholder-image.ts`
- `src/utils/mermaid-renderer.ts`
- `src/components/feature/image/ImageCropper.tsx`

The canvas is used for:

1. Decoding any browser-supported input through `<img>`: AVIF, BMP, GIF, JPEG, PNG, WebP.
2. Downscaling. This goes through an in-house Pillow-faithful Lanczos-3 resampler in TypeScript (`src/utils/resample.ts`, ADR-0025), because browser `drawImage` aliases.
3. `getImageData`/`putImageData` for the colour picker and the background-removal mask.
4. Encoding via `toDataURL`/`toBlob`. Supported output formats are probed at runtime (`src/utils/image.ts` lines 33-39), with a quality parameter for JPEG/WebP/AVIF.
5. `fillText` with `bold ... sans-serif` for placeholder images.

Canvas 2D is a browser API, reachable from Rust through `web-sys` without any JS library.

**Rust candidates**

- **`image`** 0.25.10 (about 266M downloads) is already in the repo's wasm tree. Per the codecs table ([docs.rs/image codecs](https://docs.rs/image/latest/image/codecs/index.html)):
  - AVIF "Decoding requires the `avif-native` feature, uses the libdav1d C library";
  - WebP "Only lossless encoding is currently supported";
  - GIF encoding was not confirmed either way (the fetched summary of the table was ambiguous; not verified). Browsers do not encode GIF from canvas either, which is why the repo probes for it.
  - `image-webp` confirms: "This crate only supports lossless encoding" ([github.com/image-rs/image-webp](https://github.com/image-rs/image-webp)).
  - The README warns that default `rayon` multithreading "may cause unexpected behavior" on `wasm` ([github.com/image-rs/image](https://github.com/image-rs/image)).
- **`ravif`** 0.13.0 (pure Rust AVIF encoder via `rav1e`) has a `cfg(target = "wasm32-unknown-unknown")` dependency on `rav1e` with `features = ["wasm"]` and a single-threaded wasm path ([ravif/Cargo.toml](https://github.com/kornelski/cavif-rs/blob/main/ravif/Cargo.toml)). It is slow by design: "Speeds 1 and 2 are unbelievably slow" ([cavif-rs README](https://github.com/kornelski/cavif-rs)).
- **`fast_image_resize`** 6.2.0 (2026-11-20) has Lanczos3 with "Wasm32 SIMD128" optimisations, but warns that "Rust 1.95-1.98 (actually LLVM) have regression in Wasm32 SIMD128" ([github.com/Cykooz/fast_image_resize](https://github.com/Cykooz/fast_image_resize)). It is not Pillow-faithful by contract, so ADR-0025 favours porting `resample.ts` to Rust as-is.
- **`resvg`**/`tiny-skia` cover SVG to PNG and simple drawing. They are wasm-proven here.

**Verdict: split.**

- **Replace** the pixel math: resampling, crop and rotate, mask compositing, colour sampling, and PNG/JPEG/BMP/ICO encoding.
- **Keep behind interop** the browser codecs:
  - decoding, via `createImageBitmap`/`<img>` through `web-sys`, because `image` decodes AVIF only through C libdav1d;
  - lossy WebP and AVIF encoding, via `canvas.toBlob`/`OffscreenCanvas.convertToBlob`. Among the crates read, the only WebP encoder is lossless (other crates were not surveyed), and `ravif` is much slower than the browser.
  - Placeholder and splash text can stay on canvas `fillText`, or move to `resvg` with a bundled font (a visible font change, so it is a product decision).

### Maturity of the main candidates

Data from the crates.io API and GitHub API, queried 2026-11-25. "Open" is GitHub's `open_issues_count`, which counts issues and PRs together. Unstable or prerelease versions are marked.

| Crate | Latest version | Last updated | Total downloads | Open issues + PRs (repo) |
|---|---|---|---|---|
| `tsrs_checker` | 7.1.0-beta.tsrs5 (prerelease) | 2026-11-23 | 3.6k | 82 (oxc-project/tsrs) |
| `oxc_transformer` | 0.160.0 | 2026-11-23 | 2.7M | 1,237 (oxc-project/oxc) |
| `swc_ecma_transforms_typescript` | 58.0.0 | 2026-11-20 | 11.8M | 381 (swc-project/swc) |
| `mermaid-rs-renderer` | 0.3.1 | 2026-07-06 | 315k | 62 |
| `hayro` | 0.9.0 | 2026-11-02 | 6.2M | 94 |
| `hayro-write` | 0.9.0 | 2026-11-02 | 3.5M | (same repo) |
| `krilla` | 0.8.2 | 2026-06-04 | 4.4M | not queried |
| `pdf-writer` | 0.15.0 | 2026-05-27 | 9.3M | 13 |
| `lopdf` | 0.47.0 | 2026-11-04 | 32.8M | 90 |
| `pdfium-render` | 0.9.6 | 2026-11-21 | 4.3M | 13 |
| `tract-onnx` | 0.23.10 | 2026-11-24 | 4.4M | 127 |
| `ort` | 2.0.0-rc.15 (prerelease) | 2026-10-19 | 27.7M | 6 |
| `ort-web` | 0.5.0+1.30 | 2026-10-23 | 11.9k | (same repo) |
| `candle-core` | 0.11.1 | 2026-10-31 | 12.6M | 1,017 |
| `burn` | 0.22.1 | 2026-11-09 | 2.5M | 229 |
| `jsonschema` | 0.63.1 | 2026-11-23 | 130.7M | 10 |
| `apollo-compiler` | 1.33.1 | 2026-10-21 | 1.3M | 71 (apollo-rs) |
| `serde_json_path` | 0.7.2 | 2025-02-03 | 3.4M | not queried |
| `jsonpath-rust` | 1.0.13 | 2026-11-14 | 114.4M | 9 |
| `zip` | 9.8.2 | 2026-11-23 | 362.3M | 34 |
| `ammonia` | 4.2.5 | 2026-11-13 | 23.1M | 23 |
| `dioxus-dnd` | 3.1.0 (4.0.0-alpha.1 prerelease) | 2026-10-19 | 1.3k | not queried |
| `dioxus_codemirror` | 0.3.1 | 2026-06-09 | 813 | not queried |
| `dioxus-code-editor` | 0.1.2 (0.2.0-alpha.3 prerelease) | 2026-10-16 | 8.3k | not queried |
| `image` | 0.25.10 | 2026-03-10 | 265.5M | 249 |
| `fast_image_resize` | 6.2.0 | 2026-11-20 | 25.7M | 3 |
| `resvg` | 0.50.0 | 2026-11-11 | 42.2M | 171 |
| `ravif` | 0.13.0 | 2026-01-19 | 64.8M | not queried |
| `dioxus` (for reference) | 0.7.10 | 2026-10-16 | 3.9M | 940 |

## Not verified

- The CodeMirror blast radius ("about 35 tools") is an estimate from shell defaults and `sourceKind` overrides, not a per-tool count.
- `wasm32-unknown-unknown` support is not stated for:
  - `oxc`/`oxc_transformer` (CI shows `wasm32-wasip1-threads` only);
  - `lopdf` (CI shows `wasip1`/`wasip2` only);
  - `ammonia`, `jsonpath-rust`, `serde_json_path` and `zip` (README says only "can work in a Wasm environment");
  - `mermaid-rs-renderer`, `arborium` (it claims "WASM support" without stating a target) and `dioxus-code-editor`.
- `tract` operator coverage for MODNet, and its wasm speed.
- What `ort-web`'s `_telemetry.js` does. A web search summary said telemetry is on by default and pyke-hosted builds are the default source; the primary docs page (ort.pyke.io) returned 403.
- `flow-rs` features. Its Leptos and Canvas/WebGL claims came from a search summary.
- `tsrs` press-coverage claims (Cloudflare/VoidZero announcement, performance figures). Only the repo README and wasm README were read.
- Rust-side wasm sizes for every candidate except the crates already linked into `pdf_bg.wasm`; none was built.
- Whether Monaco's bundled TypeScript version matches TS 7 semantics, which affects whether `tsrs` diagnostics would visibly differ.
- How much `hayro-write` preserves when merging (annotations, links, forms).
- The original JS dependencies, if any, behind the `color`, `csv`, `hmac`, `json-tools`, `number-base` and `uuid` crates.
- Replacements for `motion`.

## Implications for this migration

- **The interop boundary is small but permanent.** Expect at least the CodeMirror bridge (about 35 tools), the Monaco or TS bridge, mermaid, and browser image codecs via `web-sys`. Design one owned "JS engine bridge" module pattern early (asset-vendored JS plus a typed `wasm-bindgen` facade), because CodeMirror is on the critical path of most tools.
- **React-bound libraries force rewrites, not bridges.** `db-diagram` (xyflow), the sortable grids (dnd-kit) and the cropper need Dioxus components. Schedule `db-diagram` as its own work item; it is the largest at about 2,000 lines of React.
- **Grow the existing `pdf` crate.** Its lockfile already resolves hayro, hayro-write, krilla and pdf-writer (at older versions), so PDF trials should cost little extra wasm. That is unmeasured. Splitting rendering into its own lazily loaded module may still be worth it, because `pdf_bg.wasm` is already 21.9 MB.
- **Run the trials first**, because each one can flip a verdict: `tsrs` in a worker, `tract` + MODNet, hayro rendering, hayro-write merge, ammonia SVG allowlist, and the jsonpath parity decision. Each needs a corpus and a pass/fail bar written before it starts.
- **Rewrite tests that pin library error text** (Ajv, graphql-js, jsonpath-plus) as behaviour tests when the engine changes.
- **Watch the CSP.** `public/_headers` allows cdn.jsdelivr.net and huggingface.co. Moving Monaco or onnxruntime off the CDN (self-hosting or replacing them) would let `script-src` drop `cdn.jsdelivr.net`. `'unsafe-eval'` is also listed; which current engine needs it was not checked.

## Sources

Repository (read at `f48dd80b`, read-only): `package.json`, `git log -p -- package.json`, `wasm/Cargo.lock`, `wasm/scripts/build.sh`, `wasm/crates/*/Cargo.toml`, `wasm/crates/pdf/src/lib.rs`, `wasm/pkg/*/*.wasm` sizes, `dist/assets` sizes, `public/_headers`, `docs/adr/0025-image-reductions-resample-on-cpu.md`, `src/utils/{canvas,image,resample,combine-pdf,image-to-pdf,zip,json-schema,graphql-schema-viewer,jsonpath-evaluator,mermaid-renderer,background-removal,color-picker,favicon,splash-screen,placeholder-image}.ts`, `src/workers/background-removal.segment.ts`, `src/hooks/useSortableItems.ts`, `src/components/common/input/CodeInput.tsx`, `src/components/common/transformer/TransformerShell.tsx`, `src/components/feature/code/TypescriptPlayground.tsx`, `src/components/feature/data/db-diagram/*.tsx`, `src/components/feature/image/ImageCropper.tsx`.

crates.io API (versions, dates, downloads), queried 2026-11-25: https://crates.io/api/v1/crates/<name> for every crate named above.

GitHub API (`open_issues_count`, which counts issues + PRs; stars; last push): https://api.github.com/repos/<owner>/<repo> for every repo named above.

- https://github.com/oxc-project/tsrs
- https://github.com/oxc-project/tsrs/blob/main/npm/tsrs-wasm/README.md
- https://github.com/oxc-project/tsrs/blob/main/docs/RELEASING_CRATES.md
- https://oxc.rs/docs/guide/usage/linter/type-aware.html
- https://oxc.rs/docs/guide/usage/transformer.html
- https://github.com/oxc-project/oxc/blob/main/.github/workflows/ci.yml
- https://github.com/oxc-project/oxc/tree/main/napi/transform
- https://swc.rs/docs/usage/wasm
- https://github.com/swc-project/swc/blob/main/bindings/binding_typescript_wasm/Cargo.toml
- https://github.com/dudykr/stc
- https://docs.rs/crate/ezno/0.0.23/source/README.md
- https://docs.rs/crate/dioxus_codemirror/latest
- https://github.com/ealmloff/dioxus-code
- https://github.com/bearcove/arborium
- https://github.com/trishume/syntect
- https://github.com/tree-sitter/tree-sitter/blob/master/lib/binding_web/README.md
- https://mermaid.js.org/intro/
- https://github.com/1jehuang/mermaid-rs-renderer
- https://registry.npmjs.org/@xyflow/system/latest
- https://docs.rs/dioxus/latest/dioxus/events/index.html
- https://github.com/LaurenzV/hayro
- https://github.com/LaurenzV/hayro/blob/main/hayro-demo/build.sh
- https://github.com/LaurenzV/hayro/blob/main/hayro-write/README.md
- https://github.com/LaurenzV/krilla
- https://docs.rs/krilla/latest/krilla/image/struct.Image.html
- https://pdf-lib.js.org/docs/api/interfaces/loadoptions
- https://github.com/J-F-Liu/lopdf
- https://github.com/J-F-Liu/lopdf/blob/main/.github/workflows/ci.yml
- https://github.com/ajrcarey/pdfium-render
- https://github.com/sonos/tract
- https://docs.rs/crate/ort-web/latest/source/lib.rs
- https://docs.rs/ort-web
- https://docs.rs/crate/ort/latest
- https://github.com/huggingface/candle
- https://github.com/tracel-ai/burn
- https://huggingface.co/Xenova/modnet
- https://huggingface.co/api/models/Xenova/modnet/tree/main/onnx
- https://huggingface.co/docs/transformers.js/guides/webgpu
- https://github.com/Stranger6667/jsonschema
- https://ajv.js.org/guide/schema-language.html
- https://docs.rs/apollo-compiler/latest/apollo_compiler/
- https://docs.rs/apollo-compiler/latest/apollo_compiler/schema/struct.Schema.html
- https://github.com/apollographql/apollo-rs/blob/main/.cargo/config.toml
- https://github.com/JSONPath-Plus/JSONPath
- https://github.com/besok/jsonpath-rust
- https://github.com/hiltontj/serde_json_path
- https://docs.rs/serde_json_path/latest/serde_json_path/struct.JsonPath.html
- https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html
- https://github.com/zip-rs/zip2
- https://github.com/rust-ammonia/ammonia
- https://github.com/rust-ammonia/ammonia/issues/198
- https://docs.rs/dioxus-dnd
- https://github.com/image-rs/image
- https://docs.rs/image/latest/image/codecs/index.html
- https://github.com/image-rs/image-webp
- https://github.com/kornelski/cavif-rs
- https://github.com/kornelski/cavif-rs/blob/main/ravif/Cargo.toml
- https://github.com/Cykooz/fast_image_resize
- https://github.com/linebender/resvg
- npm registry metadata (`unpackedSize`, which is not bundle cost): https://registry.npmjs.org/{@tsrs/wasm,monaco-editor,mermaid,pdfjs-dist,onnxruntime-web}
