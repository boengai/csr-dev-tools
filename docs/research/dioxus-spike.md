# Spike: one shell and three tools in Dioxus

The answer to [Spike: one shell and two tools in Dioxus](https://github.com/boengai/csr-dev-tools/issues/18), measured 2026-11-26. The code is [`dioxus/` on the `spike/dioxus` branch](https://github.com/boengai/csr-dev-tools/tree/spike/dioxus/dioxus). That branch never merges; [Go or no-go?](https://github.com/boengai/csr-dev-tools/issues/19) decides what is kept.

## Answer

**Yes, it works, and the adopted build meets every budget on all three pages,** with one caveat on Image Converter: the session that measured it there broke the rule against noisy React runs. React's LCP on that page is trimodal, and the margin is wide, but a valid confirmation run on AC power is still owed. Dioxus 0.7.10 runs a real slice of the site: an app shell, one route per tool split into its own WebAssembly module, the three layout shells and three tools (Hash Generator, Escaped JSON Stringifier, Image Converter), and head-stamped, client-rendered tool pages. The React site's Playwright journeys for those tools pass **unchanged**, 6 of 6.

- **As built, it missed one budget.** FCP was 7.7 to 8.4% above React on every page, against a 5% limit. Nothing contentful paints until the main WebAssembly module has downloaded and run, and the loader requests that module only after its JavaScript has run.
- **The first remedy fixed it.** That remedy is a WebAssembly preload, the first step of the remedy order in [issue 26](https://github.com/boengai/csr-dev-tools/issues/26). The build preloads the main module, and the page's route module too when that is small (`auto`).
- **With the preload, FCP is 4.5 to 11.6% below React,** LCP is 6.7 to 41.3% below, Ready is 11.4 to 45.1% below, and Ready on repeat load is about 30% below. TBT stays within 13 ms of React, CLS is 0, and the accessibility, best-practices and SEO scores are equal.
- **The main WebAssembly file is 530,968 bytes uncompressed** in the budget build (532,038 with the emoji images), and 215 kB with brotli.

What did not work, or works only with caveats:

- The `dioxus-primitives` select loses focus to `<body>` after a pick or Escape, so it would need patching before it could replace Radix.
- Split chunks are not reproducible between builds: names and bytes change every time, so every deploy invalidates the cache for every chunk.
- Code shared between routes is copied into each route module.
- Preloading a large route module beside the main one makes FCP worse: Image Converter went from −11% to +14% against React.

Details and numbers follow.

## What was built

Dioxus **0.7.10** (the only stable line, [issue 6](https://github.com/boengai/csr-dev-tools/issues/6)), in its own Cargo workspace (`dioxus/Cargo.toml`), so it does not inherit `wasm/Cargo.toml`'s `codegen-units = 1`.

| Piece | Where | Notes |
|---|---|---|
| App shell, routing | `dioxus/app/src/main.rs` | One route variant per tool (`/tools/hash-generator`, …), not `/tools/:key`, so `--wasm-split` gives each tool its own module. `#root` via `Config::rootname`. A `SuspenseBoundary` above the `Outlet` shows the loading saucer, as React's `Suspense` does. Toasts as in React (`components/toast.rs`). |
| Head-stamped pages | `dioxus/scripts/stamp.ts` | Copies the built home page to `tools/<key>/index.html` with the React build's own `renderRouteHtml` (`vite-plugins/prerender.ts`), so both builds stamp the same tags the same way. Empty `#root`, no hydration, stylesheet in the static head. Fails unless dx produced an empty `#root`, one `<title>` (the React home title) and a static-head stylesheet. Adds the WebAssembly preloads. |
| Head helper | `dioxus/app/src/head.rs` | In the shell, above the lazily loaded tool: on client-side navigation it edits the stamped tags in place through `web-sys`; leaving the tools puts back the home page's tags (generated from `index.html`). Throwaway check: `dioxus/e2e/head.spec.ts` (one tag of each kind, equal to the stamped file, also after a deep link). |
| Layout shells | `dioxus/app/src/shells/` | Transformer (textarea source, text output), Codec (modes, CodeMirror source), File Processor in batch mode (upload area, queue with live preview, processing, results, per-file and ZIP downloads). Same DOM contract as React: `data-slot` attributes, labels, `pre[data-has-value]`, `.cm-content`, `data-testid="code-input-dialog-source"`. |
| Hash Generator | `dioxus/app/src/tools/hash_generator.rs` | MD5 calls `hash::md5` from `wasm/crates/hash` directly, so the existing crate is reused as Rust, not as a separate wasm-bindgen package. SHA-1/256/512 use WebCrypto, as React does. The input is never persisted. |
| Escaped JSON Stringifier | `dioxus/app/src/tools/escaped_json.rs` | Logic in `dioxus/logic` (`cargo test`, 13 tests across the pure seams). Mode and per-mode source persist under the React site's localStorage keys, so saved inputs still load. `?mode=` deep link. |
| Editor bridge | `dioxus/js/codemirror-bridge.ts`, `dioxus/app/src/components/code_input.rs` | CodeMirror 6 with the React theme, bundled by Vite into one ES module, hashed by dx as an asset, and loaded with `import()` from a `wasm-bindgen` snippet. A typed binding (`mount` returns a handle with `setValue` / `destroy`), destroyed in `use_drop`. No `document::eval`. The shell starts the fetch as soon as the route needs an editor, beside the tool's own chunk. |
| Image Converter | `dioxus/app/src/tools/image_converter.rs` | Batch convert through a canvas (`toBlob`), formats probed as React does, and a STORE-only ZIP (`dioxus/logic/src/zip.rs`, which is what `JSZip.generateAsync` does by default). |
| Overlay primitive | `dioxus/app/src/components/select.rs` | `dioxus-primitives` select (git dependency at `09d6a913`) for the format and quality selects. A `native-select` feature swaps in a native `<select>` to measure the primitive's cost. |
| Styling | `dioxus/scripts/template.ts` | Tailwind **4.3.3** (`@tailwindcss/cli`, not dx's 4.1.5) over `src/index.css`, with `source(none)` and `@source` on the Rust files. Variants are enums returning whole literals. No component takes a `class` prop. |
| Build | `dioxus/scripts/build.sh` | Tool metadata is generated from `src/constants/tool-routes.ts`, then `dx build --release --platform web --debug-symbols false --wasm-split`. Fails if any module still has DWARF. Copies `public/` (favicon, manifest, `_headers` with the `/assets/*` cache rule) and stamps with `--preload auto`. `--no-emoji` drops the Noto emoji images for budget runs. |
| Tests | `dioxus/playwright.config.ts` | Runs `e2e/crypto-tools.spec.ts`, `e2e/escaped-json-stringifier.spec.ts`, `e2e/image-tools.spec.ts` and `e2e/image-batch.spec.ts`, **unchanged**, grepped to the three tools, against the built site. Also runs `dioxus/e2e/` (head tags; the debounce, empty-input and mode-switch fixes). 11 of 11 pass. |
| CI and preview | `.github/workflows/dioxus.yml`, `deploy-preview.yml`, `ci.yml` | A prebuilt dx 0.7.10 with its checksum checked, then the logic tests, the build and the journeys. On this branch the preview deploy builds Dioxus, so `spike-dioxus.csr-dev-tools.pages.dev` serves the spike. `ci.yml` also runs on this branch, so the React app stays checked. **Not run yet: the branch has not been pushed.** |

Not ported, because no budget or journey needs them: the sidebar, command palette, settings dialog, background animation and the dashboard home page. The spike's home page is a list of the three tools and is not measured. React's tool pages load the sidebar, palette, settings and toast code lazily, after first paint, so leaving them out mainly lowers Dioxus's bytes; their effect on the timings was not measured.

## Results

### How it was measured

Every number below follows [`docs/perf/budgets.md`](../perf/budgets.md) and [`docs/perf/README.md`](../perf/README.md):

- **Setup:** `e2e/perf/measure.ts` on the three spike pages, mobile profile, with the throttle applied in the browser.
- **Samples:** three runs of five rounds per build, the builds alternating in one session, so each number is the median of 15 with its range.
- **Emoji:** removed from both builds for the budget runs: React by the `data:` prefix swap, Dioxus by `build.sh --no-emoji`. Neither build's `requests` list has a `notoemoji` URL. Each build was also measured once as shipped, tracked only.
- **Machine:** MacBook with an M3 Pro, AC power throughout, `caffeinate -dims`, Chromium 156.0.8078.4 (Playwright 1.64), Lighthouse 13.6.0.
- **React build:** `main` at `4f82adf8` (the tip, one fix after the `c3983f81` baseline), built from a clean worktree with `wasm-opt` 129, with `ort-wasm-*.wasm` removed.

The raw results, reports, power, CPU and sleep logs are in [`docs/perf/runs/dioxus-spike/`](../perf/runs/dioxus-spike).

| Session | Builds, alternating | Pages | Valid? |
|---|---|---|---|
| 1, 12:23–14:46 | React; Dioxus `8f0f61eb` with no preload; Dioxus `8f0f61eb` preloading main + route module; then both as shipped | all three | Yes. Largest React spread: Image Converter LCP 5.96% (limit 10%). Pooled CPU index within 1.2%. No sleep, AC throughout. |
| 2, 14:47–16:00 | React; four preload modes; native select (`58812d93`) | Image Converter | **No**: React LCP spread 13.2%. Used only to choose the remedy. |
| 3, 16:03–18:26 | React; Dioxus `7b865710` with no preload; Dioxus `7b865710` with the `auto` preload; then both as shipped | all three | Hash Generator and Escaped JSON: yes (largest React spread 3.3%). Image Converter: **no**, React LCP spread 13.1%. Pooled CPU index within 0.4%. No sleep. |
| 4, 18:26–18:52 | React; Dioxus `7b865710` with no preload; Dioxus `7b865710` with `auto` | Image Converter | **No, and discarded**: the Mac slept at 18:43 and 18:52 and ran on battery from 18:47; the run stopped part-way. Kept in `discarded-image-converter-session-4/`. **A valid Image Converter session is still owed.** |

**React's Image Converter LCP is trimodal.** Its LCP element is always the upload button's label. Single loads land near 4,210, 4,520 or 4,780 ms, so a five-sample run median can fall on any of the three, and the spread between run medians swings between 6 and 13%. The rule against noisy React runs therefore fails on this page for reasons unrelated to the session's quality. Dioxus's Image Converter LCP is 4,263 ms, within 1.3% of React's fastest mode, so the verdict on that page does not depend on which mode React lands on.

### Budgets: the adopted build against React

Session 3, Dioxus `7b865710` with the `auto` preload. **The Image Converter row is from session 3, which breaks the noisy-React rule on that page (above)**, so it stands until a valid re-run on AC power confirms it. Each cell compares Dioxus's median with React's.

| Page | FCP (≤ +5%) | LCP (≤ +10%) | Ready (≤ +5%) | Ready, repeat (≤ +10%) | TBT (≤ +50 ms) | CLS (≤ 0.01) | A11y / BP / SEO |
|---|---|---|---|---|---|---|---|
| Hash Generator | 2,717 vs 2,919: **−6.9%** | 3,049 vs 5,029: **−39.4%** | 2,697 vs 4,914: **−45.1%** | 711 vs 1,036: **−31.4%** | 0 vs 6 | 0 | 96/100/100, equal |
| Escaped JSON Stringifier | 2,785 vs 2,916: **−4.5%** | 3,123 vs 5,319: **−41.3%** | 4,194 vs 4,894: **−14.3%** | 754 vs 1,061: **−28.9%** | 21 vs 8 (+13) | 0 | 96/100/100, equal |
| Image Converter (session 3, see above) | 2,574 vs 2,912: **−11.6%** | 4,263 vs 4,570: **−6.7%** | 3,909 vs 4,414: **−11.4%** | 713 vs 1,032: **−30.9%** | 0 vs 0 | 0 | 100/100/100, equal |

Every budget passes on every page. Lighthouse performance scores (tracked only) are 90, 89 and 81 for Dioxus, against 75, 74 and 77 for React.

**The remedy passes its adoption rule** (budgets.md: Ready no more than 1% above, and First result no more than 3.6% above, the same build without the remedy, in the same session):

| Page | Ready with preload vs without | First result with preload vs without |
|---|---|---|
| Hash Generator | 2,697 vs 3,876 (−30.4%) | 3,087 vs 4,270 (−27.7%) |
| Escaped JSON Stringifier | 4,194 vs 4,712 (−11.0%) | 4,596 vs 5,127 (−10.4%) |
| Image Converter (session 3) | 3,909 vs 4,483 (−12.8%) | 4,085 vs 4,677 (−12.7%) |

### How the remedy was found

Without a preload, FCP misses on all three pages, and nothing else misses (session 1, Dioxus `8f0f61eb`):

| Page | FCP | LCP | Ready | Ready, repeat |
|---|---|---|---|---|
| Hash Generator | 3,142 vs 2,908: **+8.0% ✗** | −15.8% | −21.0% | −30.7% |
| Escaped JSON Stringifier | 3,145 vs 2,911: **+8.0% ✗** | −15.2% | −3.6% | −28.9% |
| Image Converter | 3,147 vs 2,904: **+8.4% ✗** | +1.1% | +1.4% | −30.6% |

React paints its header from a 74 kB (brotli) entry chunk. Dioxus paints nothing contentful until its 215 kB main module has downloaded and run, and dx's loader starts that download only after its JavaScript has run. The stylesheet is in the static head, so the background is styled from the first frame. FCP still waits, though, because a background is not contentful.

Preloading the main module **and** the route module fixed FCP on two pages and broke it on the third (session 1):

| Page | FCP, no preload | FCP, main + route preloaded | Ready, no preload → preloaded |
|---|---|---|---|
| Hash Generator | +8.0% | **−6.2%** | 3,874 → 2,697 |
| Escaped JSON Stringifier | +8.0% | **−4.2%** | 4,708 → 4,191 |
| Image Converter | +8.4% | **+14.0% ✗** | 4,473 → 3,297 |

Image Converter's route module is 356 kB raw (141 kB brotli), most of it the `dioxus-primitives` select. Preloaded beside the main module, it shares the slow-4G link with it before first paint. Session 2 compared the options on that page only. That session is invalid by the noisy-React rule, so it was used only to choose:

| Image Converter build | FCP vs React | LCP vs React | Ready vs React |
|---|---|---|---|
| Main + route preloaded | +14.2% | −23.1% | −25.2% |
| Main + route, route at `fetchpriority="low"` | +13.9% | −23.4% | −25.4% |
| **Main only** | **−11.1%** | −10.8% | −11.5% |
| Native select, main only | −11.9% | −18.4% | −19.8% |
| Native select, main + route (low) | +2.0% | −30.8% | −33.4% |

`fetchpriority="low"` changed nothing. The adopted rule, `auto` in `stamp.ts`, preloads the route module only when it is at most 128 KiB. Hash Generator (65 kB) and Escaped JSON (92 kB) get both preloads; Image Converter gets the main module only. Session 3 measured exactly that build.

### As shipped, with the emoji (tracked only)

Session 3, one run of five rounds each, Dioxus `7b865710` against React `4f82adf8`:

| Page | FCP | LCP | Ready | Ready, repeat |
|---|---|---|---|---|
| Hash Generator | 2,708 vs 2,911 | 3,048 vs 5,999 | 2,692 vs 5,596 | 710 vs 1,039 |
| Escaped JSON Stringifier | 2,791 vs 2,918 | 3,112 vs 6,015 | 4,865 vs 5,577 | 748 vs 1,062 |
| Image Converter | 2,565 vs 2,929 | 4,953 vs 4,601 (+7.6%) | 4,553 vs 4,510 (+1.0%) | 711 vs 1,033 |

With the emoji, Image Converter's LCP and Ready come out slightly above React. The 621.9 kB saucer image from `fonts.gstatic.com` competes with the main module for bandwidth. Hash Generator and Escaped JSON, whose route modules are preloaded, barely notice it.

### Sizes

The budget build, `7b865710`. Main WebAssembly file: **530,968 bytes uncompressed**, 214,526 brotli; as shipped, 532,038 bytes. Brotli is at Pages' settings (quality 4, window 18).

| File | Raw | Brotli | Loaded on |
|---|--:|--:|---|
| Main module `csr-dev-tools-dioxus_bg-*.wasm` | 530,968 | 214,526 | every page |
| Loader JS `csr-dev-tools-dioxus-*.js` | 66,914 | 15,845 | every page |
| Stylesheet | 29,677 | 6,465 | every page |
| Hash Generator route module (includes MD5) | 65,411 | 27,822 | Hash Generator |
| Escaped JSON route module | 92,261 | 40,419 | Escaped JSON |
| Image Converter route module | 358,912 | 141,517 | Image Converter |
| CodeMirror bridge (one ES module) | 494,103 | 141,391 | Escaped JSON |

- **Shared code is copied, not shared.** `CopyButton`'s strings sit in both the Hash Generator and the Escaped JSON route modules. The split build totals 1,057,751 bytes of wasm against 905,311 for the same code unsplit (`build.sh --no-split`), 17% more. A page still loads less with splitting: 596 kB on Hash Generator against 905 kB. *The splitter's shared-chunk pass is a no-op* (issue 8), and 84 tools would multiply this.
- **The modules hold real code.** Each tool's own strings ("Hash computation failed", "Invalid escaped JSON string", "Image conversion failed") appear only in its route module, never in the main module, so the split modules are not empty trampolines (PR 6113).
- **The primitive select costs 192 kB raw** (67 kB brotli) on Image Converter's route module: 356 kB with it, 164 kB with a native `<select>`.
- **Chunks are not reproducible.** Two builds from the same tree gave the same main module, but the route modules differed in both name hash and bytes, so the loader JS differed too (issue 6090).
- **First-load bytes against React** (own total, brotli, no emoji):
  - Hash Generator: 271 against 395 kB, 6 requests against 68.
  - Escaped JSON: 425 against 386 kB, 7 requests against 70. The editor bundle alone is 141 kB, against React's 130 kB CodeMirror chunk.
  - Image Converter: 385 against 255 kB, 6 requests against 63.
- **Hello world**, for scale: 431 kB unsplit with `--debug-symbols false`, and 772 kB without that flag.

Build time (tracked only) was not measured: by the time the sessions ended the machine was on battery, which would distort it. A warm `build.sh` takes about a minute on this Mac.

## What worked

- **The DOM contract carried over.** The React journeys ran unchanged and passed the first time they ran against the Dioxus build. The perf harness's hooks also worked without changes.
- **`--wasm-split` works on stable Rust** with an LTO release profile and the default `codegen-units`. It needs one route variant per tool and a `SuspenseBoundary` above the `Outlet`.
- **Head-stamped pages with no hydration.** The React build's stamping function stamps the dx output as is. The stylesheet in the static head (`AssetOptions::css().with_static_head(true)`) gives a styled first frame, and CLS is 0.
- **The repeat load is about 30% faster than React on every page:** one cached main module and one route module, against 60 to 70 cached JavaScript requests.
- **A typed `wasm-bindgen` bridge to an npm library** (CodeMirror), bundled apart and loaded on demand, with cleanup on unmount. No `document::eval` is needed anywhere.
- **The existing Rust crate (`hash`) links straight into the app** as a path dependency.
- **Tailwind 4.3.3 over the React theme file**, with whole-literal classes and enum variants, needed no changes to `src/index.css`.

## What did not work, or needs work before go

- **`dioxus-primitives` select, against Radix** (`select.rs`, same key sequence on both builds):

  | Step | Radix (React) | dioxus-primitives |
  |---|---|---|
  | Trigger role | `combobox` | `button` with `aria-haspopup="listbox"` |
  | Open with Enter or Space | focus on the selected option, highlighted | focus on the listbox, nothing highlighted |
  | Pick with Enter | closes, focus back on the trigger | closes, **focus falls to `<body>`** |
  | Escape | closes, focus back on the trigger | closes, **focus falls to `<body>`** |
  | Tab while open | stays in the list | closes and moves to the next control |
  | Type "b" (no option starts with b) | stays | jumps to "JPEG" (fuzzy match) |

  Losing focus after every pick fails WCAG 2.4.3 for keyboard users, and the primitive costs 192 kB raw on the page. Patch or fork it before relying on it; a native `<select>` is the cheap fallback.
- **Split chunks change name and bytes on every build** (issue 6090), so a deploy invalidates every chunk in every visitor's cache, and a tab left open across a deploy requests chunk names that no longer exist. Not solved here.
- **Duplicated shared code across route modules** (+17% at three tools). It needs `#[wasm_split]` boundaries or a shared-component chunk before 84 tools.
- **A large route module cannot be preloaded** without hurting FCP. The `auto` rule is a threshold, not a design.
- **dx downloads its own `wasm-opt` and `wasm-bindgen` at build time.** Only dx itself is pinned and checksum-checked in CI.
- **CI and the preview deploy have not run**, because the branch is not pushed.

## Surprises

- **`dioxus-web` 0.7.10 does not compile on its own.** It calls `window.location()` without enabling web-sys's `Location` feature, so the app must turn that feature on itself.
- **dx is hard to install on this Mac.** `cargo install dioxus-cli` fails to find Homebrew's OpenSSL 3, and the prebuilt macOS binary links `openssl@3`, which is not installed here. Building against `OPENSSL_DIR=/opt/homebrew/opt/openssl@4` works. CI uses the Linux release binary.
- **Debug symbols are on by default** (hazards doc): hello world is 772 kB without `--debug-symbols false` and 431 kB with it. Old hashed files also stay in dx's output directory, so `build.sh` deletes it first.
- **dx's own `wasm-opt` ran correctly.** Running `wasm-opt -Oz` again saves only 0.15%. The DWARF guard in `build.sh` exists for the case where it does not.
- **FCP is a WebAssembly waterfall, not a rendering cost.** Rendering is fast once the main module is in: Ready beat React even without a preload.
- **`fetchpriority="low"` on a preload did nothing.**
- **Lighthouse accessibility depended on which shell parts exist.** Without the toast region, the Dioxus page applied fewer passing audits, so its one shared failure (gray-on-black contrast in the algorithm toggles, present in React too) weighed more, and it scored 95 against 96. Porting the toast region made the scores equal.
- **React's Image Converter LCP is trimodal**, which makes the noisy-React rule fail on that page in two of three sessions.

## How to reproduce

```bash
pnpm install --frozen-lockfile
dioxus/scripts/build.sh                                   # as shipped, into dioxus/dist
dioxus/scripts/build.sh --no-emoji --out dioxus/dist-noemoji
pnpm exec playwright test -c dioxus/playwright.config.ts  # DIOXUS_DIST=<dir> for another build
node e2e/perf/measure.ts dioxus/dist-noemoji <out.json> --site "<label>" \
  --pages hash-generator,escaped-json-stringifier,image-converter
```

dx 0.7.10 must be on `PATH` (or set `DX=`). The React side is built as in `docs/perf/react-baseline.md`.
