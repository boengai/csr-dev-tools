# Can Dioxus load each tool lazily, and what does it weigh?

Research for boengai/csr-dev-tools#8. Checked against Dioxus 0.7.10 (tag `v0.7.10`, released 2026-07-30) and 0.8.0-alpha.3 (released 2026-10-16). Researched 2026-11-25.

## Answer

Yes, in principle. Dioxus 0.7 ships `wasm-split`. When the `wasm-split` feature is on, the router splits every leaf route into its own lazily fetched `.wasm` module. The CLI still labels it "Experimental", and it needs `dx --wasm-split`, LTO, debug symbols and `--emit-relocs`. No nightly toolchain is needed. Four open bugs block this project's exact setup:

- `codegen-units = 1` can panic the splitter (#4769). This repo uses that setting today.
- Splitting combined with fullstack hydration breaks or double-renders (#4631, discussion #5287). Dioxus SSG is built on fullstack hydration, so prerendering 84 tool pages and splitting them do not work together yet.
- Split file names are non-deterministic between builds (#6090), so every deploy invalidates the cache for every chunk.
- A failed chunk request never resolves (#5993).

The splitter's shared-chunk pass is a no-op in source. Code shared by several routes but not by the shell is therefore copied into each route module.

There is no current official size figure for 0.7. The only numbers are old: a hello world of about 47 KB gzip (0.5, nightly settings) and a TodoMVC of 310 KB raw on stable settings, with the version unstated. The Dioxus docs site itself ships one unsplit 10.56 MB wasm: 2.62 MB gzip, 2.35 MB brotli.

The existing `pdf` crate alone is 21.85 MB raw (6.81 MB brotli). It must stay a separately loaded module. The other 14 crates total 1.26 MB raw (479 KB brotli).

0.8.0-alpha.3 has the same splitter and router codegen, so none of the above changes there.

## Findings

### 1. State of wasm code splitting in Dioxus

**Pieces and names**
- The `packages/wasm-split` sub-workspace holds four crates ([README](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/wasm-split/README.md)):
  - `wasm-split`, the runtime, published on crates.io as `wasm-splitter` ([docs.rs](https://docs.rs/crate/wasm-splitter/latest), latest 0.7.10).
  - `wasm-split-macro`, which provides `#[wasm_split(name)]` and `lazy_loader!`.
  - `wasm-split-cli`, the splitter that `dx` embeds ([docs.rs](https://docs.rs/crate/wasm-split-cli/latest), 0.7.10).
  - `wasm-used`, a debug helper.
- The 0.7 release post lists "WASM-Split: Code splitting and lazy loading for WebAssembly" as a headline feature. It says `dx` "splits your app into smaller chunks based on your router" ([release-070](https://dioxuslabs.com/blog/release-070/), [source md](https://github.com/DioxusLabs/docsite/blob/main/docs-src/blog/src/release-070.md)).
- The 0.7 "learn" docs have no guide page for splitting. They only link the `wasm-splitter` crate ([0.7 index.md](https://github.com/DioxusLabs/docsite/blob/main/docs-src/0.7/src/index.md)). One user reported finding "no documentation or example" ([#5062](https://github.com/DioxusLabs/dioxus/issues/5062)).

**Status: experimental**
- The CLI flag's help text reads "Experimental: Bundle split the wasm binary into multiple chunks based on `#[wasm_split]` annotations [default: false]" ([target.rs L96-98](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/cli/target.rs#L96-L98)).

**Flag name**
- The flag is `--wasm-split`. The router README still says `--experimental-wasm-split` ([router README](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/router/README.md)). That flag is rejected, and the maintainer confirmed "the correct flag is `--wasm-split`" ([#4763](https://github.com/DioxusLabs/dioxus/issues/4763)).

**Enabling it**
- Turn on the `wasm-split` feature on both `dioxus` and `dioxus-router` ([router README](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/router/README.md); [dioxus Cargo.toml L76-79](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/dioxus/Cargo.toml#L76-L79)).
- With the feature on, plain `dx serve` breaks ("disconnects the call graph").
- The README recommends enabling the feature only when bundling: `dx bundle --features "dioxus-router?/wasm-split" --wasm-split`.
- Hot-patching does not work together with splitting, per community reports ([#5062](https://github.com/DioxusLabs/dioxus/issues/5062) comments).

**Per-route splitting: automatic, all-or-nothing**
- The `Routable` derive only accepts the attributes `route, nest, end_nest, layout, end_layout, redirect, child` ([router-macro lib.rs L243-246](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/router-macro/src/lib.rs#L243-L246)). The release post's `#[wasm_split("/dashboard")]` route attribute therefore does not exist in 0.7.10.
- When the feature is on, every leaf route is wrapped. The wrapper is a `LoaderInner` component holding a `LazyLoader` keyed by a per-route hash. It runs `use_resource(|| MODULE.load()).suspend()?` and then calls `MODULE.call(args).unwrap()` ([route.rs L279-326](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/router-macro/src/route.rs#L279-L326)).
- The `maybe_wasm_split!` gate is active only on `wasm32` with the feature on ([config-macros lib.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/config-macros/src/lib.rs)).
- You need a `SuspenseBoundary` above the `Outlet`, or the whole page suspends ([router README](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/router/README.md)).
- A source comment notes the router derive's codegen "makes up nearly 30-40% of the binary size in the dioxus docsite" ([route.rs L279-288](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/router-macro/src/route.rs#L279-L288)). That codegen stays in the main module.

**Finer-grained split points**
- `#[wasm_split(name)] async fn` works on any async function. The CLI's own test harness splits gzip, brotli and reqwest code this way ([harness main.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/playwright-tests/wasm-split-harness/src/main.rs)).
- `#[component(lazy)]` wraps a component body in `lazy_loader!(extern "lazy" ...)` with `.suspend()` ([core-macro component.rs L186-210](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/core-macro/src/component.rs#L186-L210)).
- A maintainer says non-route lazy code goes behind `Box<dyn Trait>` inside a split function, and that this works only for wasm ([discussion #5820](https://github.com/DioxusLabs/dioxus/discussions/5820), jkelleyrtp).

**Toolchain and linker requirements**
- No nightly toolchain is needed. The CI harness builds on stable with a `wasm-split-release` profile of `opt-level='z'`, `lto=true`, `debug=true` ([workspace Cargo.toml L378-382](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/Cargo.toml#L378-L382); [playwright.config.js L40](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/playwright-tests/playwright.config.js#L40)).
- With `--wasm-split`, `dx` makes these changes:
  - Adds `-Clink-args=--emit-relocs` ([request.rs L1736-1740](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/request.rs#L1736-L1740)).
  - Skips stripping ([L1937-1940](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/request.rs#L1937-L1940)).
  - Forces `lto=true` and `debug=true` on its ad-hoc profile ([L3042-3072](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/request.rs#L3042-L3072)).
  - Only warns if a user-defined profile lacks LTO or debug ([L841-853](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/request.rs#L841-L853)).
- The splitter reads both the pre-bindgen wasm (with relocations) and the post-bindgen wasm. Its source warns: "This might panic if the source module isn't built properly. Make sure to enable LTO and `--emit-relocs`" ([wasm-split-cli lib.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/wasm-split/wasm-split-cli/src/lib.rs)).
- It always adds `--memory-packing` to wasm-opt, "needed for our current approach to bundle splitting" ([wasm_opt.rs L66-71](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/wasm_opt.rs#L66-L71)).

**Output and runtime**
- Output is `main.wasm`, one `module_<i>_<name>.wasm` per split point, `chunk_<i>_*.wasm` shared chunks, and a `__wasm_split.js` loader. All files share one memory and one indirect function table ([web.rs L150-245](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/web.rs#L150-L245); [architecture note](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/notes/architecture/10-WASM-SPLIT.md)).
- Chunk URLs are written as `"/{base_path}/assets/{url}"` ([web.rs L176](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/web.rs#L176)).

**Shared-chunk extraction is not implemented**
- `build_split_chunks` iterates the split points, but its loop body is only `continue`. It never inserts into `funcs_used_by_chunks`, so the single pushed chunk is always empty ([wasm-split-cli lib.rs L884-902](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/wasm-split/wasm-split-cli/src/lib.rs#L884-L902)).
- Each split module receives `reachable_graph − main_graph` ([L195-205](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/wasm-split/wasm-split-cli/src/lib.rs#L195-L205)).
- *Inference, not measured:* a function reachable from two routes but not from the shell is emitted into both route modules.
- Other TODOs in the same file: the main module is not chunked, and there is no size-based chunk breakdown.

**Open bugs in the issue tracker (as of 2026-11-25)**
- [#4769](https://github.com/DioxusLabs/dioxus/issues/4769): `--wasm-split` panics when `codegen-units = 1`.
  - The maintainer's workaround is to drop `codegen-units`.
  - A community fix, [PR #5668](https://github.com/DioxusLabs/dioxus/pull/5668), is still open and unmerged.
- [#4631](https://github.com/DioxusLabs/dioxus/issues/4631): fullstack plus wasm-split hydration fails with `RawInterpreter.hydrate_node` TypeError. A comment reports it still happens on 0.7.10 and 0.8.0-alpha.1.
- [#6090](https://github.com/DioxusLabs/dioxus/issues/6090): split modules and the JS entry get different bytes and hashes for identical input, which defeats long-lived caching.
- [#5993](https://github.com/DioxusLabs/dioxus/issues/5993): a failed chunk fetch never settles the `LazyLoader`. The route codegen also `unwrap()`s instead of reaching an error boundary. This comes from source inspection by the reporter.
- [#5764](https://github.com/DioxusLabs/dioxus/issues/5764), [#5768](https://github.com/DioxusLabs/dioxus/issues/5768), [#5769](https://github.com/DioxusLabs/dioxus/issues/5769) (on 0.7.10): panic on a growable table, dropped call-graph edges, and a live data symbol truncated, which corrupts at runtime.
- [#5062](https://github.com/DioxusLabs/dioxus/issues/5062): splitter assertion panic (`reloc_range.end <= range.end`) on the tutorial app with `--hotpatch`.
- [#5265](https://github.com/DioxusLabs/dioxus/issues/5265): a maintainer (ealmloff) says `web.pre_compress` "might conflict with bundle splitting".

**0.8 alphas**
- In 0.8.0-alpha.3, `wasm-split-cli/src/lib.rs` differs from 0.7.10 only in walrus API spelling (`RefType::FUNCREF`) and formatting.
- `router-macro/src/route.rs` and `cli/src/build/web.rs` differ only in import order and formatting. The flag is unchanged and the router README still says `--experimental-wasm-split`.
- Sources: [v0.8.0-alpha.3 wasm-split-cli](https://github.com/DioxusLabs/dioxus/blob/v0.8.0-alpha.3/packages/wasm-split/wasm-split-cli/src/lib.rs), [route.rs](https://github.com/DioxusLabs/dioxus/blob/v0.8.0-alpha.3/packages/router-macro/src/route.rs), [target.rs](https://github.com/DioxusLabs/dioxus/blob/v0.8.0-alpha.3/packages/cli/src/cli/target.rs).
- The [0.8 roadmap](https://github.com/DioxusLabs/dioxus/discussions/5024) does not mention splitting.

### 2. Splitting with static generation and hydration

- Dioxus SSG builds on fullstack incremental rendering. The CLI calls a `static_routes` server function, renders each route to HTML, and outputs `dx bundle --web --ssg`. The client then hydrates ([0.7 SSG guide](https://github.com/DioxusLabs/docsite/blob/main/docs-src/0.7/src/essentials/fullstack/static_site_generation.md)).
- Splitting with hydration is broken today:
  - [#4631](https://github.com/DioxusLabs/dioxus/issues/4631) is open.
  - [Discussion #5287](https://github.com/DioxusLabs/dioxus/discussions/5287) (0.7.3) shows a split route rendered twice: once from SSR, once appended after the chunk loads.
- The community explanation in that discussion: on the server, `maybe_wasm_split!` takes the non-split branch and renders synchronously. On the client, the route suspends on the lazy loader during hydration. It also says the wasm-split harness is client-only and never tests fullstack. The harness config confirms the client-only part: `--web`, no fullstack features ([playwright.config.js L40](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/playwright-tests/playwright.config.js#L40); [harness Cargo.toml](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/playwright-tests/wasm-split-harness/Cargo.toml)).
- Dioxus's own docs site does not split:
  - It is built with `dx build --web --fullstack true --features fullstack,production --release --ssg`, without `--wasm-split` ([docsite gh-pages.yml](https://github.com/DioxusLabs/docsite/blob/main/.github/workflows/gh-pages.yml)).
  - The deployed loader JS references exactly one wasm, `dioxus_docs_site_bg-dxh4e56b9a3a234532.wasm` (fetched from https://dioxuslabs.com/assets/dioxus_docs_site-dxh5556b41a5e83ae.js on 2026-11-25).

### 3. Published and reproducible sizes

| Subject | Raw | gzip | brotli | Source / caveat |
|---|---|---|---|---|
| Dioxus docs site (SSG, unsplit, fullstack/hydrate, 5 doc versions embedded; lockfile pins dioxus 0.7.1) | 10,560,574 B | 2,619,059 B | 2,349,299 B | Measured with `curl -H 'Accept-Encoding: …'` against https://dioxuslabs.com/assets/dioxus_docs_site_bg-dxh4e56b9a3a234532.wasm on 2026-11-25 (Cloudflare, `last-modified: 2026-09-10`). Content-heavy, not a typical app. Lockfile: [docsite Cargo.lock](https://github.com/DioxusLabs/docsite/blob/main/Cargo.lock) |
| TodoMVC, release, no profile tuning | 2.36 MB | — | — | [0.7 "Optimizing" guide](https://github.com/DioxusLabs/docsite/blob/main/docs-src/0.7/src/guides/tips/optimizing.md). Carried over from older docs (it still says wasm-opt will be supported "in the future" and uses `dist/` paths). Dioxus version and compression unstated |
| TodoMVC, stable size profile | 310 KB | — | — | same page, same caveats |
| TodoMVC, nightly build-std profile | 234 KB | — | — | same page, same caveats |
| Hello world, nightly flags | "less than 100kb" | — | — | same page |
| Hello world | "about 50kb" / "less than 50kb" | — | — | [dioxus README v0.7.10](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/README.md), which links [ealmloff/tiny-dioxus](https://github.com/ealmloff/tiny-dioxus) |
| tiny-dioxus (git dioxus, nightly build-std, `-Zlocation-detail=none`, last push 2024-03-21) | 101,768 B (`dist/*.wasm`) | 46,919 B (`history/dioxus-0.5.wasm.gz`); 63,243 B (0.4) | — | Repo file sizes from the GitHub contents API. Pre-0.6, not 0.7 |
| Dioxus 0.5 event-code splitting | — | ~25% smaller hello world | — | [release-050](https://github.com/DioxusLabs/docsite/blob/main/docs-src/blog/src/release-050.md) |
| `f64::to_string` in dioxus-web 0.7.10 | ~13 KB | ~8 KB | — | [#6089](https://github.com/DioxusLabs/dioxus/issues/6089), community measurement with `--wasm-split`, `opt-level="z"`, LTO |

- No primary source gives a 0.7.x base-runtime, mid-size-app or many-route size, compressed or not. Nor does any give the main/route split ratio of a split build. The release post shows only a video of the network tab ([release-070](https://github.com/DioxusLabs/docsite/blob/main/docs-src/blog/src/release-070.md)).

### 4. Release profile, wasm-opt, build-time cost, nightly

**What `dx` does by default**
- `dx build --release` for web uses an ad-hoc profile `web-release` that inherits `release`. It then forces `opt-level="s"` and `strip=false`, unless you define `[profile.web-release]` yourself ([request.rs L3020-3072](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/request.rs#L3020-L3072); profile selection at [L719-722](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/request.rs#L719-L722)).
- *Inference:* a `[profile.release] opt-level = "z"` is overridden to `"s"` unless the profile is named `web-release`.
- `dx` runs wasm-opt on release or split builds ([web.rs L250](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/web.rs#L250)).
  - The default level is `Z` (`-Oz`) in code. The field's doc comment wrongly says `s` ([config/web.rs L47-57, L86-92](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/config/web.rs#L47-L92)).
  - It always passes `--enable-reference-types --enable-bulk-memory --enable-mutable-globals --enable-nontrapping-float-to-int --enable-threads`, plus `--strip-debug` unless debug is kept ([wasm_opt.rs L55-90](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/wasm_opt.rs#L55-L90)).
  - It downloads binaryen itself. `BINARYEN_VERSION` is "129", but the hard-coded URLs fetch `version_127` ([wasm_opt.rs L10, L141-151](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/wasm_opt.rs#L10)).
  - If wasm-opt fails, `dx` logs an error and silently copies the unoptimised file ([wasm_opt.rs `optimize`](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/wasm_opt.rs)).
- `web.pre_compress` defaults to `false` ([config/web.rs L22-24](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/config/web.rs#L22-L24)). When true, it writes `.br` files; the syntax is `[web]` / `pre_compress = true` ([#5265](https://github.com/DioxusLabs/dioxus/issues/5265)).

**Documented profiles**
- Stable: `opt-level="z"`, `debug=false`, `lto=true`, `codegen-units=1`, `panic="abort"`, `incremental=false`.
- Nightly additionally: `build-std=["std","panic_abort","core","alloc"]`, `panic_immediate_abort`, `-Clto -Zvirtual-function-elimination -Zlocation-detail=none` ([optimizing.md](https://github.com/DioxusLabs/docsite/blob/main/docs-src/0.7/src/guides/tips/optimizing.md)).
- These conflict with splitting in two ways:
  - The CLI's own harness says of `-Zlocation-detail=none` that it "breaks our signals" ([run.sh](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/playwright-tests/wasm-split-harness/run.sh)).
  - Splitting needs `debug=true`, and `codegen-units=1` triggers #4769.
- Dioxus's docs site uses `lto=true`, `codegen-units=1`, `opt-level='z'` ([docsite Cargo.toml L116-119](https://github.com/DioxusLabs/docsite/blob/main/Cargo.toml#L116-L119)).

**Is nightly needed?**
- Not for splitting.
- Nightly `build-std` is the documented route to the smallest builds (310 KB → 234 KB in the old TodoMVC figures). Under splitting, `-Zlocation-detail=none` is ruled out by the comment above.

**Build-time cost**
- No primary source publishes a build-time figure for these profiles, for wasm-opt, or for the splitter.
- The only number is a telemetry sample showing `wasm-bindgen: 4s` on an unspecified app ([release-070](https://github.com/DioxusLabs/docsite/blob/main/docs-src/blog/src/release-070.md)).
- Source comments call the splitter "pretty expensive" and the walrus GC pass "quite slow" ([web.rs L150-152](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/web.rs#L150-L152); [wasm-split-cli lib.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/wasm-split/wasm-split-cli/src/lib.rs)).
- Splitting also runs wasm-opt once per emitted module ([web.rs L168-200](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/web.rs#L168-L200)).

### 5. Alternatives if splitting is not usable

**(a) One Dioxus app, one large module**
- Simplest, and works with SSG and hydration today: the docs site is the reference.
- The cost is that every tool page downloads all tool code. For scale, the docs site is 2.35 MB brotli.

**(b) Dioxus shell plus the existing per-tool wasm-bindgen modules, loaded on demand through JS**
- This is what the current React site does with `wasm/pkg/*`.
- It keeps heavy or rarely used Rust code out of the shell without the splitter.
- Trade-offs:
  - Each module carries its own copy of std, alloc and fmt.
  - Each has its own memory, so data crosses a JS boundary.
  - It gets no type sharing with the Dioxus app.
- *Inference:* the per-module runtime overhead is not measured here. Today's smallest module, `hash`, is 18,556 B raw / 7,637 B brotli and includes that overhead.

**(c) Several small Dioxus apps (one per tool or per group)**
- Dioxus can mount into a chosen root element ([discussion #5652](https://github.com/DioxusLabs/dioxus/discussions/5652), community summary).
- Each app re-ships the Dioxus runtime. The #5652 author (a community member, not a maintainer) observes that wasm-split "doesn't seem to support loading completely separate, independently compiled plugin crates". No maintainer answer was found.
- Per-app runtime weight is unmeasured for 0.7.

**(d) Splitting, but only for client-rendered pages**
- Use `--wasm-split` without fullstack hydration: prerender static HTML for SEO, then let the client re-render instead of hydrating.
- It is not documented or tested by Dioxus. The CI harness covers only client-only rendering, so prerendering without hydration remains unverified.

### 6. The existing `wasm/` crates: one binary versus separate modules

- Current build:
  - Rust stable, `wasm32-unknown-unknown` ([wasm/rust-toolchain.toml](../../wasm/rust-toolchain.toml)).
  - Profile `lto="fat"`, `opt-level="z"`, `strip="debuginfo"`, `codegen-units=1` ([wasm/Cargo.toml](../../wasm/Cargo.toml)).
  - `wasm-pack --target web --release`, then `wasm-opt -Oz --strip-debug` ([wasm/scripts/build.sh](../../wasm/scripts/build.sh)).
  - wasm-bindgen 0.2.117 (Cargo.lock).
- Measured local sizes. Files are `wasm/pkg/*/*_bg.wasm`, built 2026-11-18. Gzip uses `gzip -9`; brotli uses Node `zlib.brotliCompressSync` at quality 11:

| crate | raw | gzip -9 | brotli 11 | notable deps |
|---|---|---|---|---|
| pdf | 21,853,268 | 9,384,285 | 6,813,306 | typst 0.14.2 + 6 embedded fonts (~2.9 MB of OTF/TTF via `include_bytes!`) |
| parsers | 260,521 | 113,997 | 96,657 | serde, serde_json |
| certificate | 275,623 | 100,379 | 79,906 | x509-parser, chrono, serde_json |
| json-tools | 104,231 | 53,750 | 47,119 | serde, serde_json |
| color | 105,105 | 52,382 | 46,394 | js-sys |
| csv | 98,166 | 50,725 | 44,923 | serde, serde_json |
| qrcode | 84,094 | 37,724 | 32,413 | flate2 |
| markdown | 76,596 | 33,698 | 29,123 | — |
| formatter | 75,878 | 33,989 | 28,782 | — |
| diff | 41,828 | 19,269 | 16,672 | serde-wasm-bindgen |
| bcrypt | 35,472 | 19,642 | 17,031 | getrandom |
| uuid | 29,931 | 14,175 | 12,265 | getrandom |
| hmac | 25,884 | 11,939 | 10,182 | shared |
| number-base | 24,282 | 11,391 | 9,918 | — |
| hash | 18,556 | 8,855 | 7,637 | shared |
| **14 non-pdf total** | **1,256,167** | **561,915** | **479,022** | |

- `pdf` cannot be linked into one Dioxus binary without hurting first load:
  - It is 6.8 MB brotli.
  - `build.sh` notes it already has to stay under Cloudflare Pages' 25 MiB per-file limit. Adding the Dioxus app and the other crates to the same file would push a single unsplit module toward that limit.
  - It must be either a split route module or a separately loaded module.
- Linked into one binary, the crates would share a single std, alloc, fmt and serde_json instance, so the 1.26 MB sum would shrink by some unmeasured amount.
- Under wasm-split, a crate used by only one tool route would land in that route's module.
  - *Inference:* serde_json is used by parsers, json-tools, csv and certificate. Unless the Dioxus shell already pulls it in, it would be duplicated into each of those route modules, because the shared-chunk pass is empty (Finding 1).
- The repo also ships `ort-wasm-simd-threaded.asyncify` (26,861,777 B in `dist/assets`). This is a JS-library asset, not one of the Rust crates, so it would stay a separately loaded file in any design.

## Not verified

- Any 0.7.x size for a hello world, mid-size app or many-route app, raw or compressed, and the main/route split ratio. No primary source publishes these. They need the spike.
- Build time of `dx build --release` with and without `--wasm-split`, and of wasm-opt `-Oz` on these binaries.
- Whether `#[component(lazy)]` components that share the module name `"lazy"` end up in one split module or several.
- Whether PR #5668 fixes #4769. It is unmerged, and the PR author was "not certain".
- Whether a prerendered (non-hydrating) page plus `--wasm-split` client render works without flicker or duplication.
- How much size merging the 14 crates into one binary saves through shared std/serde, and how much the per-route duplication caused by the empty shared chunk costs.
- Whether binaryen `--strip-debug` removes the name section that `dx` keeps through wasm-bindgen when splitting. This affects how much `debug=true` costs in shipped size.
- How the deployed docs site's wasm was compressed. Cloudflare served gzip and br on request; whether these are pre-compressed or on-the-fly is unknown.

## Implications for this migration

- Treat per-tool lazy loading through `wasm-split` as experimental and currently incompatible with prerendering-plus-hydration. The current site prerenders every `dist/tools/<route>/index.html`, so this is the go/no-go blocker. Run the spike on 0.7.10 with:
  1. `--wasm-split` and the feature flags, no fullstack, `debug=true`, LTO, no `codegen-units=1`. Check that it builds, then measure main vs route sizes and duplication across 84 routes.
  2. The same setup with SSG and hydration, to reproduce or rule out #4631.
  3. Two consecutive builds, to confirm #6090 hash churn.
- The repo's `wasm/` profile (`codegen-units=1`, strip) cannot be reused as-is for a split Dioxus build. Define `[profile.web-release]` explicitly, or `dx` overrides `opt-level` to `"s"`.
- Keep `pdf` (6.8 MB brotli) out of the shell whatever happens: split route module or separately fetched wasm-bindgen module.
- The lowest-risk fallback today is alternative (b): a Dioxus shell (single module, or split if the spike passes) plus the existing per-tool wasm-bindgen modules fetched on demand. It keeps today's per-tool download model and avoids the open splitter bugs for the heaviest code.
- 0.8 alphas offer no improvement here, so waiting for 0.8 is not a fix by itself.

## Sources

- Dioxus source at v0.7.10:
  - https://github.com/DioxusLabs/dioxus/tree/v0.7.10/packages/wasm-split
  - https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/wasm-split/wasm-split-cli/src/lib.rs
  - https://github.com/DioxusLabs/dioxus/blob/v0.7.10/notes/architecture/10-WASM-SPLIT.md
  - https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/router-macro/src/route.rs
  - https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/router-macro/src/lib.rs
  - https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/core-macro/src/component.rs
  - https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/config-macros/src/lib.rs
  - https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/router/README.md
  - https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/dioxus/Cargo.toml
  - https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/cli/target.rs
  - https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/request.rs
  - https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/web.rs
  - https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/wasm_opt.rs
  - https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/config/web.rs
  - https://github.com/DioxusLabs/dioxus/blob/v0.7.10/Cargo.toml
  - https://github.com/DioxusLabs/dioxus/tree/v0.7.10/packages/playwright-tests/wasm-split-harness
  - https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/playwright-tests/playwright.config.js
  - https://github.com/DioxusLabs/dioxus/blob/v0.7.10/README.md
- Dioxus source at v0.8.0-alpha.3: https://github.com/DioxusLabs/dioxus/tree/v0.8.0-alpha.3
- Crates: https://docs.rs/crate/wasm-splitter/latest, https://docs.rs/crate/wasm-split-cli/latest, https://docs.rs/crate/dioxus-cli/latest
- Docs and blog:
  - https://dioxuslabs.com/blog/release-070/
  - https://github.com/DioxusLabs/docsite/blob/main/docs-src/blog/src/release-070.md
  - https://github.com/DioxusLabs/docsite/blob/main/docs-src/blog/src/release-050.md
  - https://github.com/DioxusLabs/docsite/blob/main/docs-src/0.7/src/guides/tips/optimizing.md
  - https://github.com/DioxusLabs/docsite/blob/main/docs-src/0.7/src/essentials/fullstack/static_site_generation.md
  - https://github.com/DioxusLabs/docsite/blob/main/.github/workflows/gh-pages.yml
  - https://github.com/DioxusLabs/docsite/blob/main/Cargo.toml
- Issues and PRs:
  - https://github.com/DioxusLabs/dioxus/issues/4769
  - https://github.com/DioxusLabs/dioxus/pull/5668
  - https://github.com/DioxusLabs/dioxus/issues/4631
  - https://github.com/DioxusLabs/dioxus/issues/6090
  - https://github.com/DioxusLabs/dioxus/issues/5993
  - https://github.com/DioxusLabs/dioxus/issues/5764
  - https://github.com/DioxusLabs/dioxus/issues/5768
  - https://github.com/DioxusLabs/dioxus/issues/5769
  - https://github.com/DioxusLabs/dioxus/issues/5062
  - https://github.com/DioxusLabs/dioxus/issues/4763
  - https://github.com/DioxusLabs/dioxus/issues/6089
  - https://github.com/DioxusLabs/dioxus/issues/5265
- Discussions:
  - https://github.com/DioxusLabs/dioxus/discussions/5287
  - https://github.com/DioxusLabs/dioxus/discussions/5820
  - https://github.com/DioxusLabs/dioxus/discussions/5652
  - https://github.com/DioxusLabs/dioxus/discussions/5024
- Deployed docs site assets (measured 2026-11-25):
  - https://dioxuslabs.com/assets/dioxus_docs_site-dxh5556b41a5e83ae.js
  - https://dioxuslabs.com/assets/dioxus_docs_site_bg-dxh4e56b9a3a234532.wasm
- tiny-dioxus: https://github.com/ealmloff/tiny-dioxus
- Local repo: `wasm/Cargo.toml`, `wasm/rust-toolchain.toml`, `wasm/scripts/build.sh`, `wasm/crates/*/Cargo.toml`, `wasm/crates/pdf/src/fonts.rs`, `wasm/pkg/*/*_bg.wasm`, `dist/assets/*.wasm`; issue https://github.com/boengai/csr-dev-tools/issues/8
