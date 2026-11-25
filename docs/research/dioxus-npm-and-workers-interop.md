# How does a Dioxus app call npm packages and Web Workers?

Research ticket: boengai/csr-dev-tools#10. Target: Dioxus 0.7.10 (latest stable, released 2026-07-30), with differences in 0.8.0-alpha.0 to alpha.3 flagged. Read on 2026-11-25. All source links are pinned to the `v0.7.10` tag unless noted. Nothing was built or run; every claim comes from docs, source or issue text.

## Answer

- **Long-lived JS libraries:** use a typed `#[wasm_bindgen(module = "/js/<lib>-bridge.js")]` binding. Pass it the host `web_sys::Element` (from `onmounted` via `as_web_event()`) and `Closure` callbacks, and destroy the instance in `use_drop`. Keep `document::eval`, which is JSON-only and `new Function`-based, for one-off calls.
- **npm:** `dx` has no npm support. Since 0.7.4 it runs esbuild 0.27.3 on `.js` assets: it minifies them, `--bundle`s *relative* ESM imports, and hashes only the entry file. It does not code-split. It does not rewrite URLs inside JS. Bare npm specifiers are untested and undocumented. So run a sidecar bundler (Vite or esbuild), ship its output as assets, and lazy-load it with `import()`.
- **Workers:** first-party guidance is one sentence pointing at `gloo-worker`, and `dx` has no worker build step. Spawn workers by hand, either from a separately built wasm package or by re-running the app bundle (a community pattern).
- **Threading:** the web executor is single-threaded. Wasm threads need nightly Rust, `+atomics` and COOP/COEP, and they break `dx` assets (open issue #5551).
- **Browser APIs:** files and drag-and-drop are first-party (`evt.files() -> Vec<FileData>`). Clipboard, downloads and WebCrypto go through `web-sys`. `dioxus-sdk-storage` stores CBOR, then zlib, then hex, which is not compatible with the site's JSON `localStorage` values.

## Findings

### 1. Interop mechanisms, and which suits a long-lived editor instance

**The docs list four official ways to reach the DOM.** The 0.7 "Escaping RSX" page lists "Running JavaScript through `eval`", "Using `web-sys` to get element by ID", "Using the `onmounted` event handler", and "Using the `onresize` and `onvisible` events" ([docs](https://dioxuslabs.com/learn/0.7/essentials/ui/escape), [source](https://github.com/DioxusLabs/docsite/blob/main/docs-src/0.7/src/essentials/ui/escape.md)).

**`document::eval`: cross-renderer, but stringly typed and JSON-only.**
- "Dioxus transforms the input source code into a `Function` declaration and then allows you to capture its result. To send custom data into JavaScript, we simply format the source code. To return data from JavaScript, we use `dioxus.send()` and the eval's `.recv()` method" ([escape.md](https://github.com/DioxusLabs/docsite/blob/main/docs-src/0.7/src/essentials/ui/escape.md)).
- The `Eval` API is `join<T: DeserializeOwned>`, `send(impl Serialize)` and `recv<T: DeserializeOwned>` ([eval.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/document/src/eval.rs)).
- On web, the code is compiled with `Function::new_with_args("dioxus", &code)` ([web/document.rs#L220](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/document.rs#L220)). Values cross the boundary through `serde_wasm_bindgen::Serializer::json_compatible()` ([web/document.rs#L269](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/document.rs#L269)).
- So DOM nodes, functions and class instances cannot cross, and the page's CSP needs `'unsafe-eval'`.
- The docs warn: "**This applies especially to web targets, where the JavaScript context has access to most, if not all of your application data.** Running untrusted code can lead to a cross-site scripting (XSS) vulnerability" ([document/docs/eval.md](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/document/docs/eval.md)).
- They also say: "❌ You shouldn't run eval in the body of a component. This will run before the component has been mounted" and "✅ You should run eval inside an effect or event" ([same file](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/document/docs/eval.md)).

**`web-sys` / `js-sys`: typed, web-only.**
- "We don't necessarily suggest using web-sys in *all* cases since web-sys is currently not portable to the Dioxus Desktop and Mobile renderers" ([escape.md](https://github.com/DioxusLabs/docsite/blob/main/docs-src/0.7/src/essentials/ui/escape.md)).
- "If you are only targeting web, you can also use the `web-sys` crate for typed access to the web APIs" ([breaking_out.md](https://github.com/DioxusLabs/docsite/blob/main/docs-src/0.7/src/essentials/advanced/breaking_out.md)).
- That caveat does not matter here, because this project targets web only.

**`wasm-bindgen` JS snippets: typed imports from a local ES module.**
- `#[wasm_bindgen(module = "/js/foo.js")] extern "C" { fn add(a: u32, b: u32) -> u32; }`. The path "is relative to the crate root", and the file "must be written with ES module syntax" ([js-snippets](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/reference/js-snippets.md)).
- `inline_js = "..."` exists, but "It's not recommended for hand-written code" ([same](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/reference/js-snippets.md)).
- The guide's caveat: "Currently `import` statements are not supported in the JS file … js snippets must be standalone modules" ([same](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/reference/js-snippets.md)). Section 2 shows that `dx` changes this for *relative* imports.
- `raw_module = "./x.js"` does not treat the path as a snippet. Its meaning is "likely up to the final bundler" ([raw_module](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/reference/attributes/on-js-imports/raw_module.md)).
- Dioxus uses snippets itself:
  - `dioxus-web` uses `inline_js` for hydration data ([web/lib.rs#L102](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/lib.rs#L102)).
  - Its wasm-split test harness imports `#[wasm_bindgen(module = "/src/stars.js")]` ([harness main.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/playwright-tests/wasm-split-harness/src/main.rs)).
- Rust closures passed to JS: "Once a `ScopedClosure` is dropped, it will deallocate its internal memory and invalidate the corresponding JavaScript function". If JS calls it afterwards, it throws "closure invoked recursively or after being dropped" ([passing closures](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/reference/passing-rust-closures-to-js.md)). This page is wasm-bindgen `main`, newer than Dioxus's floor of `wasm-bindgen = "0.2.100"` ([workspace Cargo.toml](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/Cargo.toml)).

**Custom elements (web components).**
- "Any element with a dash in the name is a web component … rendered directly in dioxus without type checking". Attributes must be quoted, so the docs recommend a typed wrapper component ([escape.md](https://github.com/DioxusLabs/docsite/blob/main/docs-src/0.7/src/essentials/ui/escape.md), [example](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/examples/09-reference/web_component.rs)).
- No documented way to register custom DOM events in `rsx!` was found. Issue [#1348 "Registering custom events"](https://github.com/DioxusLabs/dioxus/issues/1348) (opened 2023) is still open. A maintainer there explains that Dioxus uses "a synthetic event system in javascript that attaches bubbling listeners to the root element".
- So assume a web component's events must be wired by hand with `add_event_listener_with_callback` on the raw element. This was not tested against 0.7.10.

**Script includes.**
- **`document::Script`** renders a `<script>` into the head. Its props are `src`, `defer`, `crossorigin`, `fetchpriority`, `integrity`, `nomodule`, `nonce`, `referrerpolicy` and `type`. Scripts "will be deduplicated by their `src` attribute", and "Any updates to the props after the first render will not be reflected in the head" ([script.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/document/src/elements/script.rs)).
- **`Dioxus.toml` `[web.resource] script = [...]`** takes local paths or CDN URLs ([configure docs](https://dioxuslabs.com/learn/0.7/guides/tools/configure)). The key is still parsed in 0.7.10 (`WebResourceConfig { style, script }`, [config/web.rs#L161](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/config/web.rs#L161)).

**Which mechanism suits a long-lived editor (CodeMirror, Monaco) with two-way events.** This is a synthesis of the sources above, not a pattern Dioxus documents:
- **`eval` alone is a poor fit.** It cannot hold a JS object reference across calls, except through globals or `dioxus.recv()` loops. It also cannot receive the host element.
- **A `wasm-bindgen` snippet fits.** Write a bridge module that exports `mount(el, initialDoc, onChange) -> handle` plus methods such as `setValue` and `destroy`, and bind it with `#[wasm_bindgen(module = …)]`.
  - Get the element from `onmounted`.
  - Keep the handle and the `Closure` in `use_hook` or a signal.
  - Call `destroy` and drop the `Closure` in `use_drop`.
- This gives one small, typed boundary per library.

### 2. Bundling npm packages with a Dioxus build

**There is no npm or `node_modules` integration in Dioxus docs or `dx`.**
- No doc page or CLI option covers npm packages. The 0.7 config reference lists only local or CDN script paths ([configure docs](https://dioxuslabs.com/learn/0.7/guides/tools/configure)).
- The only npm use found in the CLI is downloading the esbuild binary itself from `registry.npmjs.org/@esbuild/<platform>` ([esbuild.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/esbuild.rs)). This is based on file-path searches of the v0.7.10 tree, not a full read.
- If esbuild fails on a file (for example an unresolvable import), `process_js` logs "Failed to process JS with esbuild. Falling back to copy" and copies the file unchanged ([opt/js.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/opt/js.rs)).

**`dx` does run a JS tool on assets (esbuild), and has since 0.7.4.**
- `esbuild.rs` pins `ESBUILD_VERSION: &str = "0.27.3"`. The file says "esbuild is used for JavaScript bundling and minification, replacing the previous SWC Rust library dependencies" ([esbuild.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/esbuild.rs)).
- The file is absent at v0.7.3 and present from v0.7.4. The switch came in PR [#5328](https://github.com/DioxusLabs/dioxus/pull/5328) ("swc -> esbuild", merged 2026-03-20).
- Through 0.7.3, `dx` bundled with `swc_bundler` and its `NodeModulesResolver` ([v0.7.3 cli-opt/src/js.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.3/packages/cli-opt/src/js.rs)).
- Moving to esbuild caused regression [#5512](https://github.com/DioxusLabs/dioxus/issues/5512): every file was forced to ESM. PR [#5515](https://github.com/DioxusLabs/dioxus/pull/5515) ("autodetect js module type - only bundle esm", merged 2026-05-01) fixed it. The module lexer is absent from `opt/js.rs` at v0.7.6 and present from **v0.7.7** onward ([v0.7.6 js.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.6/packages/cli/src/opt/js.rs) vs [v0.7.7 js.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.7/packages/cli/src/opt/js.rs)). So 0.7.4 to 0.7.6 force ESM bundling.

**What `asset!()` does to a `.js` file in 0.7.10** ([opt/js.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/opt/js.rs), [manganis js.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/manganis/manganis-core/src/js.rs)):
- **Options.** `AssetOptions::js()` has `with_minify` (default `true`), `with_preload`, `with_static_head` and `with_module`.
- **Classic scripts.** Minify passes `--minify`. A classic script stays classic; "a classic IIFE/UMD script stays a classic script with no wrapper added".
- **When a file counts as a module.** It is an ES module if `with_module(true)` is set, or the extension is `.mjs`, or a scan finds a top-level `import`/`export` or `import.meta`. `.cjs` is always classic.
- **What happens to modules.** esbuild gets `--bundle --format=esm --external:https://* --external:http://*`. That "inlines local relative imports (notably the `snippets/` folder that wasm-bindgen emits …) into a single ESM file".
- **Contradiction in the source.** The `with_module` doc comment says "this does not perform build-time bundling. If you need imports resolved into a single file, pre-bundle with your tool of choice". That conflicts with the `--bundle` flag above. The test in the next bullet confirms that relative imports *are* inlined.
- **First-party test.** `cli-optimization.spec.js` asserts "js asset with relative ESM import is bundled as an ES module". Its fixture is `import { importedValue } from "./esm_import_dep.js"` ([spec](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/playwright-tests/cli-optimization.spec.js), [fixture](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/playwright-tests/cli-optimization/assets/esm_import_entry.js)). Another test checks that `import.meta.url` still parses in a module asset.
- **No code-splitting.** esbuild is invoked with a single `--outfile` and no `--splitting`, so `dx` never emits lazy JS chunks.
- **Bare npm specifiers.** Whether `import "@codemirror/view"` resolves is neither tested nor documented (see Not verified).
- **The wasm-bindgen glue goes through the same pipeline.** `main.js` is registered as `AssetOptions::js().with_minify(true).with_preload(true)` "so it bundles in the snippets and optimizes" ([build/web.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/web.rs)).

**Hashing.**
- "The asset macro automatically attaches a hash to the name of the asset after it's bundled", e.g. `/assets/ferrous_wave-dxhx13xj2j.png`. Turn it off with `AssetOptions::builder().with_hash_suffix(false)` ([assets docs](https://dioxuslabs.com/learn/0.7/essentials/ui/assets)).
- **Hash gap.** `hash.rs` says "Scss and JS can import files during the bundling process. We need to hash both the files themselves and any imports they have". But `hash_js` ignores the options and calls only `hash_file_contents(source, …)` ([opt/hash.rs#L60-L108](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/opt/hash.rs#L60-L108), [opt/js.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/opt/js.rs)).
- So if a file that the entry imports relatively changes and the entry does not, the hashed name stays the same. That matters for this site's `/assets/* immutable` cache rule.
- **Folders.** A folder asset hashes its contents recursively into the folder name, and nested files keep their own names ([hash.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/opt/hash.rs)). "You join the name of the files in the folder against the folder's path", e.g. `format!("{}/logging.js", asset!("/assets/posthog-js"))` ([assets docs](https://dioxuslabs.com/learn/0.7/essentials/ui/assets)).
- **Assets must be referenced.** Unused `asset!()` calls get pruned unless marked `#[used]` ([assets docs](https://dioxuslabs.com/learn/0.7/essentials/ui/assets)).

**Folder and `/public` JS still goes through the optimizer, which matters for sidecar output.**
- `process_folder` sends each child through `process_file_to` with default options ([opt/folder.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/opt/folder.rs)).
- `resolve_unknown_asset_options` maps `Some("js") => ResolvedAssetType::Js(JsAssetOptions::default())`, so default minify is on, and the ESM check triggers `--bundle`. Extensions it does not list (including `.mjs`) fall to `ResolvedAssetType::File`, which is copied unchanged ([opt/file.rs#L131-L143](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/opt/file.rs#L131-L143)).
- Open PR [#5651](https://github.com/DioxusLabs/dioxus/pull/5651) ("Copy public directory files verbatim instead of running the asset optimizer") reports that `/public` files "are documented as served as-is, but `dx serve` and `dx bundle` both ran them through the asset optimizer". It says "A `.js` entry gets inlined and minified, which shifts `import.meta.url` and can drop the entry's re-exports".
- So a multi-chunk Vite output dropped into a folder or `/public` would be re-bundled one chunk at a time, each with its relative imports inlined. That is a hazard for shared module instances. This consequence is inferred from the code, not observed.
- **Asset URLs inside JS are not rewritten.** Open issue [#3325](https://github.com/DioxusLabs/dioxus/issues/3325) ("Adjust asset references in CSS/JS/JSON in Manganis") says hashed names break references "in CSS/JS/JSON". For example, pdf.js `workerSrc` or ONNX `.wasm` paths must be passed in from Rust as `asset!()` strings.

**Lazy loading.**
- **JS:** `dx` has no first-party lazy-JS feature. Inside a JS snippet, plain browser dynamic `import(url)` with the URL from `asset!(...).to_string()` should work, but nothing documents or tests it.
- **Wasm:** `dx --wasm-split` exists: "Experimental: Bundle split the wasm binary into multiple chunks based on `#[wasm_split]` annotations [default: false]" ([cli/target.rs#L96-L98](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/cli/target.rs#L96-L98)). It forces `lto=true` and `debug=true` ([build/request.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/request.rs)). The harness uses `#[wasm_split::wasm_split(one)]`, `#[component(lazy)]` and `lazy_loader!` ([harness](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/playwright-tests/wasm-split-harness/src/main.rs)). The docs roadmap still marks "Bundle Splitting" and "Lazy Components" as in progress ([roadmap.md](https://github.com/DioxusLabs/docsite/blob/main/docs-src/0.7/src/introduction/roadmap.md)).

**0.8 alphas.**
- The `JsAssetOptions` builders are unchanged in 0.8.0-alpha.3 ([0.8 js.rs](https://github.com/DioxusLabs/dioxus/blob/v0.8.0-alpha.3/packages/manganis/manganis-core/src/js.rs)).
- alpha.1 adds generated assets: `asset!(concat!(env!("OUT_DIR"), "/generated.txt"))` (#5490). It also removes "The 0.7 asset format fallback" (#5576) ([alpha.1 release](https://github.com/DioxusLabs/dioxus/releases/tag/v0.8.0-alpha.1)).
- Generated assets would let a `build.rs` that runs the sidecar bundler emit assets straight into `OUT_DIR`.

### 3. Owning a DOM node, cleanup, and hydration

**`onmounted` gives the element.**
- "This event will fire after the element is first mounted to the DOM. It returns a live reference to the element with some methods to interact with it" ([breaking_out docs](https://dioxuslabs.com/learn/0.7/essentials/advanced/breaking_out)).
- The example stores `element.data()` in a signal and later calls `set_focus(true).await` on it ([breaking_out.rs](https://github.com/DioxusLabs/docsite/blob/main/packages/docs-router/src/doc_examples/breaking_out.rs)).

**Getting the raw `web_sys::Element`.**
- `dioxus-web` implements `impl WebEventExt for MountedData { type WebEvent = web_sys::Element; fn try_as_web_event(&self) -> Option<web_sys::Element> { self.downcast::<web_sys::Element>().cloned() } }` ([web/events/mounted.rs#L147-L154](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/events/mounted.rs#L147-L154)).
- The trait also provides `as_web_event()` ([web/events/mod.rs#L186-L199](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/events/mod.rs#L186-L199)). Import it as `dioxus::web::WebEventExt`, as the docs example does ([breaking_out.rs](https://github.com/DioxusLabs/docsite/blob/main/packages/docs-router/src/doc_examples/breaking_out.rs)).
- It needs the `mounted` feature of `dioxus-web`, which is on by default: `default = ["mounted", "devtools", "document"]` ([web/Cargo.toml](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/Cargo.toml)).
- `MountedData::downcast::<T>()` is public too ([html/events/mounted.rs#L203-L207](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/html/src/events/mounted.rs#L203-L207)).
- The older `get_raw_element()` named in issue #1486 is not present in 0.7.10's `mounted.rs`.

**Cleanup.**
- "Before a component is dropped, it will drop all of its hooks … If you just need the drop effect, you can use the `use_drop` hook" ([lifecycle docs](https://dioxuslabs.com/learn/0.7/essentials/advanced/lifecycle)).
- The signature is `pub fn use_drop<D: FnOnce() + 'static>(destroy: D)`, aliased `use_on_unmount` ([core/global_context.rs#L407-L408](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/core/src/global_context.rs#L407-L408)).
- Tasks started with `spawn` are cancelled "when the component is unmounted" ([async docs](https://dioxuslabs.com/learn/0.7/essentials/basics/async)).

**Effects.**
- "If you do need to interact with the DOM directly, you should do so in a `use_effect` hook. This hook will run after the component is rendered" ([breaking_out docs](https://dioxuslabs.com/learn/0.7/essentials/advanced/breaking_out)).

**Hydration.**
- On the client, `dioxus-web` calls `websys_dom.rehydrate(...)` and then "Flush any mounted events that were queued up while hydrating" ([web/lib.rs#L150-L156](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/lib.rs#L150-L156)). The hydrator collects `onmounted` listeners while it walks the tree ([hydration/hydrate.rs#L311](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/hydration/hydrate.rs#L311)). So `onmounted` fires on hydrated nodes too.
- The SSR docs: "the component must render exactly the same thing on the client and the server". "If you need to grab some data that is only available on the client, make sure you get it inside of a `use_effect` hook which runs after the component has been hydrated" ([SSR docs](https://dioxuslabs.com/learn/0.7/essentials/fullstack/ssr)).
- Hydration needs the `hydrate` feature, which pulls in `dioxus-fullstack-core` ([web/Cargo.toml](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/Cargo.toml)).
- **Inference, not documented:** the host node should be an empty Dioxus element with no Dioxus children. The JS library then owns its subtree, and Dioxus never diffs inside it.

### 4. Web Workers

**First-party guidance is one sentence.** "If you have an expensive task you need to run, you should spawn it on a separate thread using `std::thread::spawn` on desktop/mobile or use a [web worker](https://docs.rs/gloo-worker/latest/gloo_worker/) on the web" ([async docs](https://dioxuslabs.com/learn/0.7/essentials/basics/async), [async.md#L193](https://github.com/DioxusLabs/docsite/blob/main/docs-src/0.7/src/essentials/basics/async.md)).

**`dx` has no worker build step.**
- No file with "worker" in its path exists in the v0.7.10 or v0.8.0-alpha.3 trees. This is a path search, not a read of every file. Feature request [#1486 "Creating and spawning WebWorkers"](https://github.com/DioxusLabs/dioxus/issues/1486) is still open.
- In that thread a maintainer recommends `gloo_worker`. Another commenter asks for a Trunk-style `data-type="worker"` compile stage. A third explains that a worker either needs "a separate wasm module" or must "load the webassembly module twice".

**Option A: the app's own bundle in a worker (community pattern, not first-party).**
- PR [#4697](https://github.com/DioxusLabs/dioxus/pull/4697) ("This allows using `dx` for web workers") swapped `window.` for `globalThis.` in the glue shim in `cli/src/build/request.rs`. PR [#4757](https://github.com/DioxusLabs/dioxus/pull/4757) ("Now I can use one wasm bundle for the worker and frontend") did the same in `web/src/js/eval.js` and `ts/eval.ts`. Both merged in Sept/Oct 2025, before 0.7.0 (2025-10-31).
- That shim auto-runs `__wbg_init({module_or_path: …})` and then `wasm.main()` ([build/web.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/web.rs)).
- The PR author's app (tucan-plus) branches with `if web_sys::window().is_some() { frontend_main() } else { worker_main() }`. It spawns `web_sys::Worker::new_with_options(&shim_url(), &options)` with `WorkerType::Module`, where `shim_url()` reads `import.meta.url` through a `wasm_bindgen` getter ([tucan-plus main.rs](https://github.com/tucan-plus/tucan-plus/blob/7d301ebae08d0e3940710077ef59db6aa7d5b45b/crates/tucan-plus-dioxus/src/main.rs), [worker lib.rs](https://github.com/tucan-plus/tucan-plus/blob/7d301ebae08d0e3940710077ef59db6aa7d5b45b/crates/tucan-plus-worker/src/lib.rs)).
- Release builds were blocked by [#4758](https://github.com/DioxusLabs/dioxus/issues/4758): `import.meta.url` resolved to absolute file paths under swc. It was closed with "Likely fixed as swc seems to not be used any more". The `import.meta.url` playwright test (section 2) covers a module *asset*, not this exact glue path.
- Cost: each worker loads the whole app wasm.

**Option B: `gloo-worker` against a separately built package.**
- `gloo-worker` 0.7.0 provides the `Worker` trait, `WorkerSpawner`, `WorkerBridge`, `#[oneshot]` and `#[reactor]` (behind the `futures` feature), and postcard encoding by default ([lib.rs](https://github.com/ranile/gloo/blob/master/crates/worker/src/lib.rs), [docs.rs](https://docs.rs/gloo-worker/latest/gloo_worker/)). The repo moved from `rustwasm/gloo` to `ranile/gloo`.
- `WorkerSpawner::spawn(path)` defaults to module workers. Without `with_loader(true)` it builds a `Blob` shim (`import init from '{js_shim_url}';await init();`) and spawns it from a `blob:` URL. For classic workers it derives the wasm URL with `js_shim_url.replace(".js", "_bg.wasm")` ([spawner.rs](https://github.com/ranile/gloo/blob/master/crates/worker/src/actor/spawner.rs)).
- So you need `worker-src blob:`, a `wasm-bindgen --target web` package with predictable sibling file names, and a way for `dx` to ship that package. The site's existing `wasm/scripts/build.sh` already runs `wasm-pack build --target web`.

**Option C: plain `web_sys::Worker`** with the wasm-bindgen pattern. The [wasm-in-web-worker guide](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/examples/wasm-in-web-worker.md) uses `--target no-modules`. Its note that "only Chrome supports modules in web workers" is dated; module workers now ship in all major engines, though that comes from general knowledge, not a source checked here.

**Workers that belong to a JS library** (pdf.js, transformers.js / ONNX) stay JS. Their worker and wasm URLs must be handed in as `asset!()` strings, because `dx` does not rewrite URLs inside JS (#3325).

### 5. Async and threading model on web

- "In Dioxus, all futures run on the main thread". "The Dioxus runtime is single threaded which means futures can use `!Send` types, but they need to be careful to never block the thread" ([async docs](https://dioxuslabs.com/learn/0.7/essentials/basics/async)).
- On web, the root is driven by `wasm_bindgen_futures::spawn_local` ([web/launch.rs#L30](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/launch.rs#L30)).
- `spawn` attaches to the component, and `spawn_forever` attaches to the root ([async docs](https://dioxuslabs.com/learn/0.7/essentials/basics/async)). wasm-bindgen's `spawn_local` drives a future "on the JS microtask queue" ([promises and futures](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/reference/js-promises-and-rust-futures.md)).
- **Threads.** They need a rebuilt std with `-C target-feature=+atomics` on nightly and `-Z build-std=panic_abort,std`, plus `--target web` or `no-modules` ([raytrace-parallel guide](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/examples/raytrace.md)). `SharedArrayBuffer` needs cross-origin isolation, i.e. COOP/COEP ([wasm-bindgen-rayon README](https://github.com/RReverser/wasm-bindgen-rayon/blob/main/README.md)).
- **With `dx`, those threading rustflags break assets.**
  - [#5079](https://github.com/DioxusLabs/dioxus/issues/5079) was closed by PR [#5163](https://github.com/DioxusLabs/dioxus/pull/5163).
  - Follow-up [#5551](https://github.com/DioxusLabs/dioxus/issues/5551) is **open**: "dx asset bundling silently fails under wasm-threads rustflags … still reproduces on dx 0.7.9". Its bisect says "the actual asset extraction has never worked". 0.7.10 was not tested in that issue.
  - One user's workaround is a separate coordinator worker that owns shared memory and talks to the Dioxus main thread by `postMessage` ([#5079 comments](https://github.com/DioxusLabs/dioxus/issues/5079)).
- **What this means.** A long synchronous Rust computation (bcrypt with high cost, catastrophic regexes, PDF work) freezes the UI. It cannot be pre-empted or cancelled from the main thread. Move it to a worker. The site's current `Worker.terminate()`-based cancel (`src/wasm/worker-bridge.ts`) has no in-thread equivalent.

### 6. Browser APIs the tools use

- **Files (input and drop): first-party.**
  - 0.7 replaced 0.6's `files() -> Option<Arc<dyn FileEngine>>` with `files() -> Vec<FileData>` ([v0.6.3 form.rs#L108](https://github.com/DioxusLabs/dioxus/blob/v0.6.3/packages/html/src/events/form.rs#L108) vs [v0.7.10 form.rs#L66](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/html/src/events/form.rs#L66)).
  - `FileData` has `name`, `size`, `last_modified`, `content_type`, `async read_bytes() -> Result<Bytes, _>`, `async read_string()`, `byte_stream()`, `path()` and `inner() -> &dyn Any` ([html/file_data.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/html/src/file_data.rs)).
  - On web, `inner()` returns the `web_sys::File` ([web/files.rs#L133-L135](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/files.rs#L133-L135)). So a `File` can go to pdf.js or `URL.createObjectURL` without copying it into wasm memory.
  - `read_bytes` uses `FileReader.readAsArrayBuffer` and then copies into a `Vec`. On `byte_stream`, which reads the whole file and returns it as one chunk, the source admits "This is not super great, especially given the wasm <-> js boundary duplication cost" ([web/files.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/files.rs)).
  - `files() -> Vec<FileData>` is unchanged in 0.8.0-alpha.3 ([alpha.3 form.rs#L66](https://github.com/DioxusLabs/dioxus/blob/v0.8.0-alpha.3/packages/html/src/events/form.rs#L66)).
  - The example uses `onchange: move |evt| async move { upload_files(evt.files()).await }`, `ondragover` with `evt.prevent_default()`, `ondrop` with `evt.files()`, and `input { r#type: "file", multiple: true, directory: … }` ([file_upload.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/examples/08-apis/file_upload.rs)). Drag payloads use `e.data_transfer().get_data("text/plain")` ([drag_and_drop.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/examples/08-apis/drag_and_drop.rs)).
- **Clipboard: through `web-sys`.**
  - `Navigator::clipboard(&self) -> Clipboard` needs crate features `Clipboard` and `Navigator`. `Clipboard::write_text(&self, data: &str) -> js_sys::Promise` and `read_text` are stable. Only `read_with_formats` sits behind `web_sys_unstable_apis` ([gen_Navigator.rs](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/crates/web-sys/src/features/gen_Navigator.rs), [gen_Clipboard.rs](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/crates/web-sys/src/features/gen_Clipboard.rs); wasm-bindgen `main`).
  - In 0.7.10, Dioxus `ClipboardData` (from `oncopy`/`onpaste`) carries no payload; you have to downcast to `web_sys::Event` ([web/events/clipboard.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/events/clipboard.rs)).
  - 0.8.0-alpha.1: "Clipboard events now expose the pasted text and files through `data_transfer()` and `files()` (#5611)" ([release](https://github.com/DioxusLabs/dioxus/releases/tag/v0.8.0-alpha.1)).
  - `dioxus-sdk` 0.7.0 ships no clipboard crate. Its packages are geolocation, notification, storage, sync, time, util and window ([sdk v0.7.0](https://github.com/DioxusLabs/sdk/tree/v0.7.0/packages)).
- **Downloads: no first-party API was found** (none in `packages/web/src`, none in sdk 0.7.0).
  - Use `web-sys`: `Blob`, then `Url::create_object_url_with_blob(blob: &Blob) -> Result<String, JsValue>` (features `Blob`, `Url`), then an `<a download>` click, then `Url::revoke_object_url(url: &str)` ([gen_Url.rs#L196](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/crates/web-sys/src/features/gen_Url.rs#L196), [#L223](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/crates/web-sys/src/features/gen_Url.rs#L223)).
  - Or keep the current JS helper behind the bridge.
- **`localStorage`: first-party, through `dioxus-sdk-storage` 0.7.0.**
  - It provides `use_persistent`, `use_storage`, `use_synced_storage`, `use_storage_entry`, `LocalStorage` and `SessionStorage` ([storage lib.rs](https://github.com/DioxusLabs/sdk/blob/v0.7.0/packages/storage/src/lib.rs), [persistence.rs](https://github.com/DioxusLabs/sdk/blob/v0.7.0/packages/storage/src/persistence.rs)).
  - **Format:** `serde_to_string` runs `ciborium::into_writer`, then `yazi::compress(… Zlib, BestSize)`, then hex encodes ([lib.rs](https://github.com/DioxusLabs/sdk/blob/v0.7.0/packages/storage/src/lib.rs)).
  - The site writes plain JSON today. For example, `src/diagram/codecs/storage.ts` uses `localStorage.setItem(STORAGE_KEY, JSON.stringify(store))`, which `try_serde_from_string` will not decode. Only that file was checked, not every persisted key. Reading existing data needs raw `web_sys::Storage` (`window.local_storage()`).
  - The README warns "These crates are still under development. Expect breaking changes!" ([sdk README](https://github.com/DioxusLabs/sdk/blob/v0.7.0/README.md)).
- **WebCrypto: through `web-sys` `SubtleCrypto`.**
  - Methods include `digest_with_str_and_u8_array`, `encrypt_with_object_and_u8_array`, `decrypt_*`, `import_key_with_object`, `derive_bits_with_object`, `sign_*` and `generate_key_with_object`.
  - Features needed: `SubtleCrypto`, plus `CryptoKey` for key-using methods. None of them is marked unstable ([gen_SubtleCrypto.rs](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/crates/web-sys/src/features/gen_SubtleCrypto.rs), [docs.rs](https://docs.rs/web-sys/latest/web_sys/struct.SubtleCrypto.html)).
  - Each returns a `js_sys::Promise`; await it with `JsFuture::from(promise)` ([promises and futures](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/reference/js-promises-and-rust-futures.md)).

## Not verified

- **No build or run.** Nothing was compiled, built with `dx`, or run in a browser. Every behaviour described is read from source, docs or issues.
- **Bare npm specifiers through `dx`'s esbuild.** Whether `import "@codemirror/view"` in an `asset!()` JS file or a wasm-bindgen snippet resolves from the project's `node_modules`. esbuild's `--bundle` would normally walk up from the importer's directory. But snippets are copied into the wasm-bindgen output directory under `target/` before bundling, and no Dioxus test or doc covers this. Treat it as unsupported.
- **The `.mjs` workaround.** `.mjs` files inside folder assets or `/public` are copied verbatim. This is inferred from `resolve_unknown_asset_options`, which matches only `"js"`, and was not observed.
- **Re-bundling of multi-chunk output.** Whether multi-chunk ESM in a folder asset is actually re-bundled per chunk, breaking shared module state. This is inferred from `process_folder` plus `process_js`.
- **Dynamic `import()` of a hashed asset URL** from inside a wasm-bindgen snippet. It is plain browser behaviour, but no Dioxus doc or test covers it.
- **The release-mode single-bundle worker pattern** (option A) on 0.7.10, i.e. whether `import.meta.url` in the processed glue gives the right URL. #4758 was closed on "likely fixed".
- **Whether #5551 (threads breaking assets) persists on 0.7.10.** It was reported on 0.7.9.
- **0.8 alpha coverage was partial.** The release notes were keyword-scanned, alpha.2's breaking-changes list was not read in full, and sdk `v0.8.0-alpha.3` storage was not read.
- **`#[component(lazy)]`.** Seen only in the wasm-split test harness. Its macro definition was not read.
- **web-sys version.** The signatures and stability come from wasm-bindgen `main` and docs.rs web-sys 0.3.107. Dioxus 0.7.10 accepts `web-sys = "0.3.77"` and newer. Whether `Clipboard` was already stable at 0.3.77 was not checked.
- **Stale docs.** `guides/platforms/web.md` (0.7) still says "Dioxus web exposes the use_eval hook". That is stale against `document::eval`. The same 0.7 `configure.md` still describes `tauri-bundler`, which PR #5328 removed. So the 0.7 docsite lags the code in places.

## Implications for this migration

1. **One interop pattern per JS island.** For each JS library (CodeMirror/Monaco, Mermaid, pdf.js/pdf-lib, transformers.js), write a `js/<lib>-bridge.js` ES module with a few exported functions (`mount`, `update`, `destroy`, or pure functions). Bind it with `#[wasm_bindgen(module = "/js/<lib>-bridge.js")]` and an opaque `type Handle`. This is the "one small, typed interop boundary". Keep `document::eval` for trivia; it relies on the `'unsafe-eval'` that the CSP in `public/_headers` already allows.
2. **Run a sidecar bundler.** Vite library mode or esbuild should build each bridge's npm dependencies ahead of time, from a `pnpm` step or a `build.rs`. Ship the output so `dx` does not reprocess it, for example as single-file ESM bundles named `.mjs`, or prebuilt files with `asset!(…, AssetOptions::js().with_minify(false))`. Prototype this first; see Not verified.
3. **Lazy-load heavy libraries yourself.** The bridge does `await import(url)`, with `url` passed from Rust as `asset!("/js/dist/mermaid.mjs").to_string()`. Pass library-internal URLs (pdf.js `workerSrc`, ONNX wasm paths) the same way, since `dx` does not rewrite them.
4. **Close the hash gap.** Bundle each island into one self-contained file, so the entry's content hash covers everything. Otherwise `/assets/* immutable` can serve stale imports.
5. **Workers: keep the current architecture.** The existing Rust crates in `wasm/crates`, built by `wasm-pack --target web`, are already worker-friendly. Ship each pkg folder as a folder asset and spawn module workers with `web_sys::Worker` or `gloo-worker`. The Rust worker side can use `DedicatedWorkerGlobalScope`. Avoid wasm threads; #5551 is open and COOP/COEP would break the current jsdelivr CDN loads.
6. **The single-bundle worker trick (option A)** is attractive for code reuse, but every worker loads the full app wasm. Prototype it before adopting.
7. **Do not start with `dioxus-sdk-storage`.** Its CBOR, zlib and hex format will not read existing users' `localStorage`. Write a thin typed wrapper over `web_sys::Storage` with `serde_json`, keeping current keys and formats, or write a one-time migration.
8. **Use first-party file APIs and `web-sys` for the rest.** Use `evt.files()` / `FileData` and pass `inner()`'s `web_sys::File` to JS libraries to avoid copies. Clipboard, downloads and WebCrypto need only a handful of `web-sys` features, so no JS is required for them.
9. **Plan the mount/cleanup recipe.** Use an empty host `div` with no Dioxus children, `onmounted` → `as_web_event()`, keep the handle and closures in `use_hook`, and call `destroy` and drop the closures in `use_drop`. Because `onmounted` also fires after hydration, the same recipe works if routes are prerendered.
10. **Pin `dx` to an exact patch, at least 0.7.7, and add a CI check.** The JS pipeline changed behaviour within 0.7.x: swc became esbuild in 0.7.4, and ESM autodetection arrived in 0.7.7. The check should build the bridges and smoke-test one island.

## Sources

- Dioxus 0.7 docs: [Escaping RSX](https://dioxuslabs.com/learn/0.7/essentials/ui/escape) · [Breaking out](https://dioxuslabs.com/learn/0.7/essentials/advanced/breaking_out) · [Assets](https://dioxuslabs.com/learn/0.7/essentials/ui/assets) · [Async](https://dioxuslabs.com/learn/0.7/essentials/basics/async) · [Lifecycle](https://dioxuslabs.com/learn/0.7/essentials/advanced/lifecycle) · [SSR / hydration](https://dioxuslabs.com/learn/0.7/essentials/fullstack/ssr) · [Web platform](https://dioxuslabs.com/learn/0.7/guides/platforms/web) · [Configure](https://dioxuslabs.com/learn/0.7/guides/tools/configure) · [Docsite sources](https://github.com/DioxusLabs/docsite/tree/main/docs-src/0.7/src) · [breaking_out.rs example](https://github.com/DioxusLabs/docsite/blob/main/packages/docs-router/src/doc_examples/breaking_out.rs)
- `dioxus-document` eval docs: https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/document/docs/eval.md
- Dioxus v0.7.10 source:
  - [document/eval.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/document/src/eval.rs) · [document/elements/script.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/document/src/elements/script.rs)
  - [web/document.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/document.rs) · [web/events/mounted.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/events/mounted.rs) · [web/events/mod.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/events/mod.rs) · [web/events/clipboard.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/events/clipboard.rs)
  - [web/files.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/files.rs) · [web/lib.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/lib.rs) · [web/launch.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/launch.rs) · [web/hydration/hydrate.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/hydration/hydrate.rs) · [web/Cargo.toml](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/Cargo.toml)
  - [html/file_data.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/html/src/file_data.rs) · [html/events/form.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/html/src/events/form.rs) · [html/events/mounted.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/html/src/events/mounted.rs) · [core/global_context.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/core/src/global_context.rs)
  - [manganis-core/js.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/manganis/manganis-core/src/js.rs)
  - [cli/esbuild.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/esbuild.rs) · [cli/opt/js.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/opt/js.rs) · [cli/opt/hash.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/opt/hash.rs) · [cli/opt/file.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/opt/file.rs) · [cli/opt/folder.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/opt/folder.rs)
  - [cli/build/web.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/web.rs) · [cli/build/request.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/request.rs) · [cli/cli/target.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/cli/target.rs) · [cli/config/web.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/config/web.rs)
  - [cli-optimization.spec.js](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/playwright-tests/cli-optimization.spec.js) · [wasm-split harness](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/playwright-tests/wasm-split-harness/src/main.rs)
  - [examples/08-apis/file_upload.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/examples/08-apis/file_upload.rs) · [drag_and_drop.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/examples/08-apis/drag_and_drop.rs) · [web_component.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/examples/09-reference/web_component.rs) · [workspace Cargo.toml](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/Cargo.toml)
- Older and newer Dioxus source: [v0.7.3 cli-opt/js.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.3/packages/cli-opt/src/js.rs) · [v0.6.3 form.rs](https://github.com/DioxusLabs/dioxus/blob/v0.6.3/packages/html/src/events/form.rs) · [v0.8.0-alpha.3 tree](https://github.com/DioxusLabs/dioxus/tree/v0.8.0-alpha.3)
- Dioxus issues, PRs and releases:
  - Issues: [#1348](https://github.com/DioxusLabs/dioxus/issues/1348) · [#1486](https://github.com/DioxusLabs/dioxus/issues/1486) · [#3325](https://github.com/DioxusLabs/dioxus/issues/3325) · [#4758](https://github.com/DioxusLabs/dioxus/issues/4758) · [#5079](https://github.com/DioxusLabs/dioxus/issues/5079) · [#5512](https://github.com/DioxusLabs/dioxus/issues/5512) · [#5551](https://github.com/DioxusLabs/dioxus/issues/5551)
  - PRs: [#4697](https://github.com/DioxusLabs/dioxus/pull/4697) · [#4757](https://github.com/DioxusLabs/dioxus/pull/4757) · [#5163](https://github.com/DioxusLabs/dioxus/pull/5163) · [#5328](https://github.com/DioxusLabs/dioxus/pull/5328) · [#5515](https://github.com/DioxusLabs/dioxus/pull/5515) · [#5651](https://github.com/DioxusLabs/dioxus/pull/5651)
  - Releases: [v0.8.0-alpha.0](https://github.com/DioxusLabs/dioxus/releases/tag/v0.8.0-alpha.0) · [v0.8.0-alpha.1](https://github.com/DioxusLabs/dioxus/releases/tag/v0.8.0-alpha.1) · [v0.8.0-alpha.3](https://github.com/DioxusLabs/dioxus/releases/tag/v0.8.0-alpha.3)
- DioxusLabs/sdk v0.7.0: [README](https://github.com/DioxusLabs/sdk/blob/v0.7.0/README.md) · [packages](https://github.com/DioxusLabs/sdk/tree/v0.7.0/packages) · [storage lib.rs](https://github.com/DioxusLabs/sdk/blob/v0.7.0/packages/storage/src/lib.rs) · [storage Cargo.toml](https://github.com/DioxusLabs/sdk/blob/v0.7.0/packages/storage/Cargo.toml)
- wasm-bindgen guide: [JS snippets](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/reference/js-snippets.md) · [module](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/reference/attributes/on-js-imports/module.md) · [raw_module](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/reference/attributes/on-js-imports/raw_module.md) · [Passing closures](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/reference/passing-rust-closures-to-js.md) · [Promises and futures](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/reference/js-promises-and-rust-futures.md) · [Wasm in Web Worker](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/examples/wasm-in-web-worker.md) · [Parallel raytracing](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/guide/src/examples/raytrace.md)
- web-sys: [gen_Clipboard.rs](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/crates/web-sys/src/features/gen_Clipboard.rs) · [gen_Navigator.rs](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/crates/web-sys/src/features/gen_Navigator.rs) · [gen_Url.rs](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/crates/web-sys/src/features/gen_Url.rs) · [gen_SubtleCrypto.rs](https://github.com/wasm-bindgen/wasm-bindgen/blob/main/crates/web-sys/src/features/gen_SubtleCrypto.rs) · [docs.rs Clipboard](https://docs.rs/web-sys/latest/web_sys/struct.Clipboard.html) · [docs.rs SubtleCrypto](https://docs.rs/web-sys/latest/web_sys/struct.SubtleCrypto.html) · [docs.rs Url](https://docs.rs/web-sys/latest/web_sys/struct.Url.html)
- gloo-worker 0.7.0: [docs.rs](https://docs.rs/gloo-worker/latest/gloo_worker/) · [lib.rs](https://github.com/ranile/gloo/blob/master/crates/worker/src/lib.rs) · [spawner.rs](https://github.com/ranile/gloo/blob/master/crates/worker/src/actor/spawner.rs)
- wasm-bindgen-rayon README: https://github.com/RReverser/wasm-bindgen-rayon/blob/main/README.md
- Community worker pattern (tucan-plus): [main.rs](https://github.com/tucan-plus/tucan-plus/blob/7d301ebae08d0e3940710077ef59db6aa7d5b45b/crates/tucan-plus-dioxus/src/main.rs) · [worker lib.rs](https://github.com/tucan-plus/tucan-plus/blob/7d301ebae08d0e3940710077ef59db6aa7d5b45b/crates/tucan-plus-worker/src/lib.rs)
- This repo (read-only): `public/_headers` (CSP, no COOP/COEP), `src/workers/*`, `src/wasm/worker-bridge.ts`, `wasm/scripts/build.sh`, `package.json`
