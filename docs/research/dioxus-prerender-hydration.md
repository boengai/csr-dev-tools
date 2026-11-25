# How does Dioxus prerender and hydrate one page per tool?

Researched 2026-11-25 against Dioxus **v0.7.10** (tag commit `57d6794`, 2026-07-30), spot-checked against **v0.8.0-alpha.3** (2026-10-16), and the docsite at commit `675ad77` (2026-09-10). Source citations are GitHub permalinks to those refs. No Dioxus build was run for this report.

## Answer

Yes, with caveats. Dioxus SSG is fullstack incremental rendering driven by the CLI. At build time `dx` compiles a native server binary, starts it on localhost, POSTs to `/api/static_routes` for a `Vec<String>` of paths, then GETs each path. The server writes `public/<path>/index.html` next to the wasm and assets. The resulting `public/` folder is purely static, so Cloudflare Pages can serve it, and the official docsite builds it this way in GitHub Actions. `Route::static_routes()` drops dynamic segments, so the 84 `/tools/<key>` paths must be pushed onto that list by hand. The CLI accepts any strings, and the docsite does exactly this.

`document::Title` and `document::Meta` are rendered into the prerendered `<head>`. The caveats:

- **Use `dx build --web --fullstack true --release --ssg`, not `dx bundle --ssg`.** `dx bundle` silently skips prerendering in 0.7.10 and 0.8.0-alpha.3, although the docs say to use it. Without the fullstack feature or flag there is no server target, and `--ssg` does nothing.
- **A `<title>` that lands before `<!DOCTYPE html>` is an open 0.7.10 bug report** with no known cause.
- **Failed routes don't fail the build.** They are only logged.
- **The current CSP blocks hydration.** Every prerendered page carries two inline `<script>` blocks, and today's `script-src` has neither `'unsafe-inline'` nor hashes.
- **The client-side `Title` needs `'unsafe-eval'`.** It runs through the `Function` constructor. Today's CSP already allows this.
- **Parity is possible without SSG.** Today the site prerenders only head tags, and `#root` is empty. A plain client-side (CSR) Dioxus build plus a head-stamping step after the build reproduces exactly what ships now, without hydration, inline scripts or a server binary.

## Findings

### Today's behaviour (baseline)

- `vite-plugins/prerender.ts` copies the built `dist/index.html` once per route into `dist/tools/<key>/index.html`. In each copy it regex-replaces `<title>`, `meta[name=description]`, `og:title`, `og:description`, `og:url`, `twitter:title`, `twitter:description` and `link[rel=canonical]`. A missing tag fails the build. The routes come from `TOOL_ROUTES` in `vite.config.ts`.
- `index.html`'s body is `<div id="root"></div>` plus one module script. **The prerendered pages contain no rendered body markup**, and the client renders from scratch.
- `src/hooks/useToolSeo.ts` sets `document.title` during render and updates the existing meta tags in place in an effect, creating them if missing. On cleanup it restores the previous values, so client-side navigation leaves exactly one tag of each kind.

### Static generation for `/tools/:key`; how the 84 keys are supplied

- The docs describe SSG as "running your app locally, querying the app for a sitemap, and then indexing your site". It builds on fullstack incremental rendering: `ServeConfig::builder().incremental(IncrementalRendererConfig::new().static_dir(<exe dir>/public).clear_cache(false))`, inside `server_only!`. You also need a server function with an explicit `endpoint = "static_routes"` ([static_site_generation.md](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/docs-src/0.7/src/essentials/fullstack/static_site_generation.md), [example source](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/packages/docs-router/src/doc_examples/static_site_generation.rs)).
- The CLI flag is documented as "Pre-render all routes returned from the app's `/static_routes` endpoint" ([build.rs L24-26](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/cli/build.rs#L24-L26)).
- **`Routable::static_routes()` excludes any route with a dynamic segment.** The `_ => return None` arm drops everything that isn't `Static` or `Child` ([routable.rs L845-865](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/router/src/routable.rs#L845-L865)). A `#[route("/tools/:key")]` variant therefore contributes nothing automatically.
- **The CLI does not care where the strings come from.** It POSTs `{}` to `http://{ip}:{port}/api/static_routes`, parses `Vec<String>`, and GETs each entry with `Accept: text/html` ([builder.rs L2126-2176](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/builder.rs#L2126-L2176)). The server function can return `Route::static_routes()` plus `TOOLS.iter().map(|t| format!("/tools/{}", t.key))`.
- First-party precedent: the docsite's own `static_routes` appends hand-written paths (`/components/`, `/components/component/`) to `Route::static_routes()` ([docsite main.rs L275-287](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/packages/docsite/src/main.rs#L275-L287)).
- The alternative is one enum variant per tool with a static path, which `static_routes()` picks up automatically. This is the approach the maintainers recommended for blogs in [issue #1640](https://github.com/DioxusLabs/dioxus/issues/1640). It costs 84 variants; the manual list costs one `format!`.
- Trailing slashes: the router macro strips them, so "We parse /route/ and /route in the same way" ([router-macro lib.rs L532](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/router-macro/src/lib.rs#L532)).

### Output directory; static hosting; server binary at build time

- Route-to-file mapping: the route path is split on `/` under `static_dir`, then `index.html` is appended. Query strings are dropped. With no `invalidate_after` the path carries no timestamp ([fs_cache.rs L24-33, L141-151](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-server/src/isrg/fs_cache.rs#L24-L33)). `/tools/json-formatter` therefore becomes `public/tools/json-formatter/index.html`, the same shape as today's `dist/`.
- Web layout: `web/server`, plus `web/public/{index.html, wasm/, assets/}` ([web.rs L1-21](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/web.rs#L1-L21)). The web root dir is `platform_dir/public` ([request.rs L2500-2502](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/request.rs#L2500-L2502)). The docs say to copy `public` to any static host ([static_site_generation.md](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/docs-src/0.7/src/essentials/fullstack/static_site_generation.md)).
- **A server binary must run at build time.** `pre_render_static_routes` spawns `main_exe()` of the server build. It binds to `IP`/`PORT` from the environment or defaults to `127.0.0.1:9999`, retries the routes call 5 times one second apart, and kills the server afterwards ([builder.rs L2090-2120, L2129-2159, L2208](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/builder.rs#L2090-L2120)). Nothing from it is needed at runtime.
- **GitHub Actions works; this is first-party.** The docsite workflow runs `dx build --verbose --trace --web --fullstack true --features fullstack,production --release --ssg`, then `cp -r target/dx/dioxus_docs_site/release/web/public docs`, then `cp docs/index.html docs/404.html`, and deploys to GitHub Pages ([gh-pages.yml L35-50](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/.github/workflows/gh-pages.yml#L35-L50)). Its toolchain targets are `x86_64-unknown-linux-gnu` and `wasm32-unknown-unknown`. The job runs on `warp-ubuntu-latest-x64-8x`, a third-party runner, not a GitHub-hosted one, so how long a standard runner takes is not shown.
- **The server target only exists when fullstack is on.** `into_targets` creates the server build only if `--fullstack` is true, the client's `fullstack` feature is enabled, or `@server` is given ([build.rs L98-146](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/cli/build.rs#L98-L146)). Otherwise `build_server_inner` returns `Ok(None)` and `--ssg` is a no-op (L188-195). Use the docsite's form: `dx build --web --fullstack true --features fullstack --release --ssg`.
- **`dx bundle --ssg` never prerenders in 0.7.10.** `Bundle::bundle` builds client and server but never calls `pre_render_static_routes`, and carries the comment `// todo: make sure to run pre-render static routes! we removed this from the other bundling step` ([bundle.rs L36-58](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/cli/bundle.rs#L36-L58)). Only `dx build` calls it ([build.rs L199-202](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/cli/build.rs#L199-L202)). The same todo is present at v0.8.0-alpha.3.
  - Tracked as open [#5050 "Bundling SSG is broken"](https://github.com/DioxusLabs/dioxus/issues/5050). A maintainer comment there says ``dx build --web --ssg --release`` "does the exact same thing bundle should do".
  - A user in that thread also reports that `dx build --ssg` gives "indeterminate output unless the `--force-sequential` flag is also passed", because client and SSG both write `index.html`. This is a user report and was not verified.
- **Per-route failures don't fail the build.** Each route's error is only `tracing::error!`-logged, and the function still returns `Ok(())` ([builder.rs L2199-2210](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/builder.rs#L2199-L2210)). The server's stdout and stderr go to `Stdio::null()` (L2117-2118). The HTTP status is never checked; only transport errors are logged. A route that returns 500, panics or renders wrong produces no file, or a wrong one, and no non-zero exit. A 0.6-era race in the same area once "caused the docsite build to silently fail and deploy the broken site" ([#3518](https://github.com/DioxusLabs/dioxus/issues/3518), closed).
- **Rebuilds can duplicate content.** In [#5608](https://github.com/DioxusLabs/dioxus/issues/5608) (closed 2026-07-26), a maintainer explained that SSG "takes the current index.html from the web build and injects the ssg output into it". Running it again without the CLI replacing `index.html` "will create duplicate contents". Clean `target/dx` in CI.
- Cloudflare Pages: the output is plain files in the same `tools/<key>/index.html` shape the site deploys today, so serving needs nothing new. The docsite adds a `404.html` copy of `index.html` for GitHub Pages.

### Per-route `<title>`, description, Open Graph

- `document::Title`: on the server, `ServerDocument::set_title` stores the title ([fullstack-server document.rs L88-91](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-server/src/document.rs#L88-L91)). `render_head` then writes `head_before_title` + `<title>…</title>` + `head_after_title`, replacing the template's title ([ssr.rs L672-690](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-server/src/ssr.rs#L672-L690)). The title can change after first render, and "Only the latest update to the title will be reflected". Its children must be a single text node ([title.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/document/src/elements/title.rs)).
- `document::Meta` and `Link` use a different path. The server collects them and renders them after `head_after_title`, before `</head>` ([fullstack-server document.rs L47-58, L93-105](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-server/src/document.rs#L47-L58); [ssr.rs L692-702](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-server/src/ssr.rs#L692-L702)). `MetaProps` covers `name`, `property`, `content`, `charset` and `http_equiv`, so `og:*` (property) and `description`/`twitter:*` (name) are expressible.
- **They are present in the prerendered file.** The incremental cache stores `render_head` + body + `render_after_main` + post-body: "add the new render to the cache without the streaming bits" ([ssr.rs L397-415](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-server/src/ssr.rs#L397-L415)). Head elements must be emitted before the first streaming chunk. Later ones "will be rendered by the client after hydration instead, which will not be visible to any search engines" ([streaming.md L67-71](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/docs-src/0.7/src/essentials/fullstack/streaming.md)). The server warns if this happens ([document.rs L64-68](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-server/src/document.rs#L64-L68)).
- **Known 0.7.10 bug:** [#5760](https://github.com/DioxusLabs/dioxus/issues/5760) (open, filed 2026-08-18) reports that `document::Title` is emitted before `<!DOCTYPE html>` with `dx build --web --ssg --release`. **The cause is unknown.**
  - One code path would produce it: `IndexHtml::new` fills `head_before_title` only when the template contains `<title>` ([index_html.rs L70-90](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-server/src/index_html.rs#L70-L90)).
  - That path doesn't explain the report. The server parses the CLI-written `public/index.html` ([config.rs L55-74](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-server/src/config.rs#L55-L74)), and the CLI's default prod template already contains `<title>{app_title}</title>` ([prod.index.html](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/assets/web/prod.index.html)). The reporter shows no custom template.
  - Treat it as an open risk and check the output in CI. A related open issue is [#5500](https://github.com/DioxusLabs/dioxus/issues/5500), missing DOCTYPE for server builds.
- **`Meta` behaves differently from `useToolSeo`.**
  - Meta tags are *appended* next to whatever the template already has. The template's own `<meta name="description">` and `og:*` stay, which gives duplicates, so the template must not carry them.
  - `Meta` runs once in `use_hook`, and "Any updates to the props after the first render will not be reflected in the head" ([meta.rs L67-85](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/document/src/elements/meta.rs#L67-L85)).
  - On the web client, `create_meta` only appends an element, and nothing removes it when the component unmounts ([web document.rs L131-135, L167-186](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/document.rs#L131-L135)).
  - After hydration, `FullstackWebDocument::create_head_component` skips elements the server already wrote ([fullstack-core document.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-core/src/document.rs)). Client-side navigation between tools still accumulates stale `meta` tags. That matters only for in-app share and preview, not crawlers, which receive the prerendered file.

### What hydration requires of component code; failure modes

- Rule: "the component must render exactly the same thing on the client and the server" ([ssr.md L158-173](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/docs-src/0.7/src/essentials/fullstack/ssr.md)).
- Non-deterministic data must go in `use_server_future`, `use_server_cached` or `use_effect` ([ssr.md L175-187](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/docs-src/0.7/src/essentials/fullstack/ssr.md)). The doc example marks `use_hook(|| rand::random())` ❌ and `use_server_cached(|| rand::random())` ✅ ([hydration.rs L27-32](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/packages/docs-router/src/doc_examples/hydration.rs#L27-L32)).
- Browser-only data such as `localStorage` must be read in `use_effect`, "which runs after the component has been hydrated". Reading it in a `use_signal` initialiser is the documented ❌ ([ssr.md L228-234](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/docs-src/0.7/src/essentials/fullstack/ssr.md); [hydration.rs L89-108](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/packages/docs-router/src/doc_examples/hydration.rs#L89-L108)).
- `use_server_cached` and `use_server_future` closures "cannot have side effects", because the client may not re-run them ([ssr.md L236-242](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/docs-src/0.7/src/essentials/fullstack/ssr.md)).
- **SSG-specific consequence (inference):** under SSG the "server" is the build. A `use_server_cached` value, such as a random UUID or a timestamp, is baked once at build time and served to every visitor. Generators must create values in `use_effect` or in event handlers.
- `use_resource` without suspense runs only on the client in fullstack/SSG. With `.suspend()` it runs on both sides but fails to hydrate because its data isn't serialized (maintainer comment in [#2919](https://github.com/DioxusLabs/dioxus/issues/2919), dated 2024-09-04, so 0.6-era and not re-checked for 0.7).
- Documented failure symptoms ([ssr.md L160-173](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/docs-src/0.7/src/essentials/fullstack/ssr.md)):
  - an interpreter crash: `Uncaught TypeError: Cannot set properties of undefined (setting 'textContent') at RawInterpreter.run`
  - a deserialization error that names the server type and location. Debug builds embed the type names and locations as `window.initial_dioxus_hydration_debug_types` and `window.initial_dioxus_hydration_debug_locations` ([ssr.rs L738-751](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-server/src/ssr.rs#L738-L751)).
  - Streaming rehydration errors are logged as `tracing::error!("Rehydration failed. {:?}")` with `VNodeNotInitialized`, `SuspenseHydrationIdNotFound` or `ElementNotFound` ([hydrate.rs L18-27, L101-105](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/hydration/hydrate.rs#L18-L27)).
- Unknown URLs: in [#3644](https://github.com/DioxusLabs/dioxus/issues/3644), a fallback route served from the root `index.html` hydrated the wrong HTML. A maintainer: "the server renders the `/index.html` route … When the client hydrates the `/dne` url it tries to hydrate the fallback route but fails". It was closed and cross-referenced by PR #4209 "Fix router hydration"; that the PR fixed it is not verified. A Cloudflare Pages SPA fallback to the hydrating root `index.html` would hit this pattern.

### SSG without runtime server machinery; CSR + prerender script

- SSG needs the `fullstack` feature. It enables `dioxus-web?/hydrate`, among others ([dioxus Cargo.toml L85-95](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/dioxus/Cargo.toml#L85-L95)). A `server` feature and a `#[server]` function also exist, but only the build uses them. At runtime the static client never calls a server unless app code calls server functions. **Not verified:** whether the hydrated client's router makes any request on navigation. Nothing in the files read here suggests it does.
- The web client hydrates when `Config::hydrate(true)` is set or the `hydrate` feature is on. It reads `window.initial_dioxus_hydration_data` and rebuilds the VirtualDOM against the existing DOM ([web lib.rs L68, L96-161](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/lib.rs#L68)). `dioxus-web`'s `hydrate` feature depends on `dioxus-fullstack-core`, not the server crate ([web Cargo.toml L97](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/Cargo.toml#L97)). The 0.7 `publishing.md` page describes an older recipe: `dx build --release --features web` followed by `cargo run --features ssr`. That page is stale: its include, `fullstack_static.rs`, no longer exists in the docsite's `doc_examples`. No documented, current hand-rolled "prerender then hydrate" path exists beyond `dx build --ssg`. Whether one is feasible is listed under Not verified.
- Root route: by the `fs_cache` mapping, prerendering `/` writes `public/index.html` and replaces the CLI's SPA shell. No blank shell remains to use as a fallback page.
- **A pure CSR path is available and matches today's site.**
  - The CLI uses a crate-root `index.html` when present, otherwise its default template ([web.rs L386-397](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/web.rs#L386-L397)).
  - It injects an external `<script type="module" async src=…>` loader before `</body>` ([web.rs L517-534](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/web.rs#L517-L534)).
  - The web router reads `location.pathname` on load ([history.rs L97](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/history.rs#L97)).
  - A post-build script can therefore copy `public/index.html` into `public/tools/<key>/index.html` with per-tool head tags, exactly as `vite-plugins/prerender.ts` does now. Each page then boots the CSR app with an empty root.
  - This needs no hydration discipline, no inline scripts and no build-time server. It gives up nothing compared with today, where crawlers also get head-only pages.

### Content-Security-Policy

Current `script-src`, from `public/_headers`: `'self' 'wasm-unsafe-eval' 'unsafe-eval' blob: https://cdn.jsdelivr.net https://static.cloudflareinsights.com`. It has no `'unsafe-inline'` and no hashes.

- **SSG pages carry inline scripts the current CSP blocks.**
  1. Every rendered page contains `<script>{INITIALIZE_STREAMING_JS}</script>` before the body. This constant defines `window.hydrate_queue` and `window.dx_hydrate` ([ssr.rs L712-721](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-server/src/ssr.rs#L712-L721); [initialize_streaming.js](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/interpreter/src/js/initialize_streaming.js)).
  2. Every page also contains `<script>window.initial_dioxus_hydration_data="…";</script>`, whose contents differ per page ([ssr.rs L729-752](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-server/src/ssr.rs#L729-L752)).
  3. The client's hydration entry reads `window.initial_dioxus_hydration_data` ([web lib.rs L102-119](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/lib.rs#L102-L119)). If CSP blocks the inline script, hydration has no data.
  - Allowing these takes `'unsafe-inline'`, or one constant hash plus a per-page hash for the data script. Per-page hashes would need a per-path `Content-Security-Policy` in `_headers` or a `<meta http-equiv>` written per page.
  - Both scripts are unchanged at v0.8.0-alpha.3.
- **`document::Title` on the client uses the `Function` constructor.** `WebDocument::set_title` calls `self.eval(format!("document.title = {title:?};"))` ([web document.rs L122-128](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/document.rs#L122-L128)). `WebEvaluator::create` runs it via `js_sys::Function::new_with_args` (L220), which needs `'unsafe-eval'`. Meta, Link and Script use DOM APIs instead. PR [#4310 "Don't use inline scripts and function constructor"](https://github.com/DioxusLabs/dioxus/pull/4310) (merged 2025-06-26) changed those and the wasm loader but left `set_title`. The eval is still present at v0.8.0-alpha.3. Today's CSP already has `'unsafe-eval'`, for ajv and monaco, so this is not a new requirement. It would block removing `'unsafe-eval'` later, unless the title is set with `web_sys` directly instead of `document::Title`.
- The wasm loader is an external module script (`'self'` is enough). `WebAssembly` instantiation is covered by the existing `'wasm-unsafe-eval'`. wasm-bindgen `inline_js` snippets ship as files under `wasm/snippets/` ([web.rs L1-21](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/web.rs#L1-L21)), not inline `<script>`.
- The CSR path needs nothing beyond today's CSP, as far as these sources show.

## Not verified

- No Dioxus build was run. Every behaviour above comes from reading source, docs and issues.
- Whether #5760 (Title before DOCTYPE) reproduces when the custom `index.html` contains `<title>`. The mechanism above is an inference. Whether #5760 persists in 0.8.0-alpha.3 is also unchecked; the relevant files carry the same code, but nothing was tested.
- Which release fixed #5608 (duplicate content on rebuild). The issue is closed with no linked fix found.
- The `--force-sequential` requirement for deterministic `dx build --ssg` output. It is a user report in #5050.
- A hand-rolled prerender-then-hydrate path outside `dx build --ssg`, for example rendering with `dioxus-ssr` in a build script and enabling `Config::hydrate(true)` on the web client. Not attempted; the hydration data format would also have to be produced.
- The cause of #5760.
- Whether PR #4209 fixed #3644 (fallback-route hydration).
- Whether the hydrated client makes any server request on client-side navigation.
- Cloudflare Pages specifics: whether it redirects `/tools/<key>` to `/tools/<key>/`, and its SPA fallback when no `404.html` exists. Not read; the router treats both forms the same.
- Non-hydrating CSR mount over pre-existing root children (whether `rebuild` appends or replaces). Irrelevant if head-only stamping leaves the root empty.
- `main` after alpha.3: the CLI files moved, so this report was not checked against it.

## Implications for this migration

- **Default recommendation: CSR + a head-stamping step after the build.** It reproduces today's output exactly: 84 `tools/<key>/index.html` files with per-tool title, description, OG, Twitter and canonical tags, and an empty root. It needs no hydration discipline, no build-time server and no CSP change. Port `renderRouteHtml` to a small Rust or xtask step, or keep it as a Node script over `target/dx/<app>/release/web/public`.
- **Pick SSG + hydration only if prerendered body content is wanted** (better SEO and first paint). Budget for:
  - `dx build --web --fullstack true --features fullstack --release --ssg --force-sequential`, never `dx bundle`
  - a clean `target/dx` per CI run
  - a CI assertion that all 84 `tools/*/index.html` files exist, and grep checks that each has the right `<title>`, a single `meta[name=description]`, and DOCTYPE first
  - no default description or OG tags in the custom `index.html`
  - a CSP change: `'unsafe-inline'` in `script-src`, or per-page hashes
  - moving every `localStorage`, time and randomness read into `use_effect` or event handlers, never `use_server_cached`
  - a deliberate 404 strategy: a dedicated `404.html`, not a hydrating SPA fallback.
- **Either path:** to keep `useToolSeo`'s single-tag invariant during client-side navigation, set head tags with `web_sys` (update in place, restore on drop) rather than `document::Meta`, which only appends. `document::Title` is fine under the current CSP, but it ties the app to `'unsafe-eval'`.
- **Route definition:** `#[route("/tools/:key")]` plus a manual list in `static_routes` (SSG) or in the stamping script (CSR). In both cases the list comes from the same tool registry that replaces `TOOL_ROUTE_DEFINITIONS`.

## Sources

- Dioxus 0.7 docs (docsite source, commit 675ad77):
  - [static_site_generation.md](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/docs-src/0.7/src/essentials/fullstack/static_site_generation.md), rendered at https://dioxuslabs.com/learn/0.7/essentials/fullstack/static_site_generation
  - [static_site_generation.rs example](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/packages/docs-router/src/doc_examples/static_site_generation.rs)
  - [ssr.md (hydration)](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/docs-src/0.7/src/essentials/fullstack/ssr.md)
  - [hydration.rs example](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/packages/docs-router/src/doc_examples/hydration.rs)
  - [streaming.md](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/docs-src/0.7/src/essentials/fullstack/streaming.md)
  - [docsite gh-pages.yml](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/.github/workflows/gh-pages.yml)
  - [docsite main.rs](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/packages/docsite/src/main.rs)
- Dioxus source at v0.7.10:
  - [cli/src/cli/build.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/cli/build.rs)
  - [cli/src/cli/bundle.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/cli/bundle.rs)
  - [cli/src/build/builder.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/builder.rs)
  - [cli/src/build/web.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/web.rs)
  - [cli/src/build/request.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/request.rs)
  - [fullstack-server/src/ssr.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-server/src/ssr.rs)
  - [fullstack-server/src/document.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-server/src/document.rs)
  - [fullstack-server/src/index_html.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-server/src/index_html.rs)
  - [fullstack-server/src/isrg/fs_cache.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-server/src/isrg/fs_cache.rs)
  - [fullstack-core/src/document.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/fullstack-core/src/document.rs)
  - [web/src/lib.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/lib.rs)
  - [web/src/document.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/document.rs)
  - [web/src/hydration/hydrate.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/hydration/hydrate.rs)
  - [web/src/history.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/history.rs)
  - [document/src/elements/meta.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/document/src/elements/meta.rs)
  - [document/src/elements/title.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/document/src/elements/title.rs)
  - [router/src/routable.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/router/src/routable.rs)
  - [router-macro/src/lib.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/router-macro/src/lib.rs)
  - [dioxus/Cargo.toml](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/dioxus/Cargo.toml)
  - [interpreter/src/js/initialize_streaming.js](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/interpreter/src/js/initialize_streaming.js)
  - [playwright-tests/nested-suspense/src/ssg.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/playwright-tests/nested-suspense/src/ssg.rs)
- Dioxus v0.8.0-alpha.3 (spot check of the same files): https://github.com/DioxusLabs/dioxus/tree/v0.8.0-alpha.3
- Issues and PRs:
  - [#5050](https://github.com/DioxusLabs/dioxus/issues/5050), bundling SSG is broken
  - [#5760](https://github.com/DioxusLabs/dioxus/issues/5760), Title before DOCTYPE
  - [#5500](https://github.com/DioxusLabs/dioxus/issues/5500), missing DOCTYPE for server builds
  - [#5608](https://github.com/DioxusLabs/dioxus/issues/5608), duplicate content on rebuild
  - [#5503](https://github.com/DioxusLabs/dioxus/issues/5503), `--ssg` fails with `--fullstack true`
  - [#3644](https://github.com/DioxusLabs/dioxus/issues/3644), fallback route under SSG
  - [#3518](https://github.com/DioxusLabs/dioxus/issues/3518), SSG race condition
  - [#2919](https://github.com/DioxusLabs/dioxus/issues/2919), SSG with pending resources
  - [#1640](https://github.com/DioxusLabs/dioxus/issues/1640), dynamic routes in static generation
  - [#3866](https://github.com/DioxusLabs/dioxus/issues/3866), Content Security Policy
  - [PR #4310](https://github.com/DioxusLabs/dioxus/pull/4310), no inline scripts or function constructor
- This repo: `vite.config.ts`, `vite-plugins/prerender.ts`, `src/hooks/useToolSeo.ts`, `index.html`, `public/_headers`; issue boengai/csr-dev-tools#7.
