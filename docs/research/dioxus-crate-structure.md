# How should the Dioxus code be split into crates?

These are the measurements behind
[Where does the Dioxus code live and how is it split into crates?](https://github.com/boengai/csr-dev-tools/issues/20),
taken on 2026-11-27 and decided in ADR-0035
(`docs/adr/0035-dioxus-workspace-and-crate-layers.md` on `develop`). This
branch never merges.

## Answer

- **Crate layout does not change what loads where.** The splitter works on
  the linked module, so a Tool's code lands in its own module whether the
  Tool is a crate or a module.
- **Three things do change it:**
  - fat LTO, which splitting needs;
  - `#[wasm_bindgen]` exports in the app's dependency tree, which pin
    their code into main;
  - any table of components the shell can reach, which pulls every Tool
    into main.
- **Route splitting costs a round trip.** Combined with lazy components it
  makes a Tool page wait on three wasm requests in series. Hand-written
  `lazy_loader!` entries with `dioxus/wasm-split` off take two, and main
  stays the same size.
- **One crate per Tool is free in release and costs 2 to 3 times more per
  dev rebuild.** It is chosen for its boundaries.
- **The layer rule can be enforced for crate edges,** by an allowlist test
  over `cargo metadata`, but not for browser access. Feature unification
  and `document::eval` let any crate reach the browser once `dioxus/web`
  is on anywhere.

## How it was measured

- **Setup:** throwaway Cargo workspaces under the session scratchpad,
  outside the repo, which was never modified.
  - Dioxus `=0.7.10` and dx 0.7.10 on rustc 1.100.0, on an M3 Pro (11
    cores) on mains power.
  - Release builds ran `dx build --release --platform web --wasm-split
    --debug-symbols false -p <app>`, with a `[profile.wasm-release]` of
    fat LTO and `debug = true`.
- **Tools were stubs:** components holding a marker string, a class name
  and, where needed, a call into a logic crate. They were 2 or 84 Tools,
  never ported ones.
- **Where code landed** was read from the emitted modules, by the marker
  strings, export lists and twiggy function names.
- **Sizes** are raw bytes unless marked gzip `-9` or brotli 11.
- **Labels:** "verified by build" means it was built and inspected. "Read
  from source" cites the Dioxus 0.7.10 or cargo-deny 0.22.1 source.
  "Inferred" is neither.

## Findings

### Splitting across crates

| Build | Main module | Notes |
|---|--:|---|
| Tool components in other crates | 416,399 | each Tool in its own route module |
| The same code as modules of one crate | 414,443 | same layout |
| Thin LTO instead of fat | 479,367 (from 417,318) | exits 0, logs `Could not find function symbol`, Tool code moves to main |

- **Read from source:** the split point is generated in the crate that
  derives `Routable` (`dioxus-router-macro-0.7.10/src/route.rs:302-323`).
  The splitter assigns code by reachability on the linked module
  (`wasm-split-cli-0.7.10/src/lib.rs:926-1102`).
- **Shared code is copied** into every module that uses it. The
  shared-chunk pass adds nothing (`lib.rs:884-902`), and the shared chunk
  was 295 bytes. Code the app shell also uses stays in main.
- **The Routable enum can be emitted by `macro_rules!`** for static paths:
  `$path:literal` plus a component path from another crate. A dynamic
  segment taken from the caller fails with `E0425`, because of
  `Span::call_site()` hygiene in `segment.rs:200,214`. All 84 Tool routes
  are static.
- **A path-length limit:** dx panicked (`index out of bounds: the len is
  256`) when an output module's absolute path was 257 characters, and
  passed at 252. The likely cause, read from source, is
  `const-serialize`'s `MAX_STR_SIZE = 256`.

### Loading: route splitting against hand-written loaders

`dioxus-router/wasm-split` is an empty feature. Route splitting and
`#[component(lazy)]` are both switched by `dioxus/wasm-split`, through
`maybe_wasm_split!`.

| Module (raw / gzip / brotli) | Route split on, `#[component(lazy)]` | Route split off, hand-written `lazy_loader!` |
|---|---|---|
| main | 476,543 / 199,994 / 162,387 | 475,869 / 200,055 / 162,324 |
| route modules (Alpha, Beta, Home, NotFound) | 7,429; 7,232; 17,111; 2,210 | none |
| Alpha Tool module | 7,828 / 4,361 / 3,942 | 7,596 / 4,204 / 3,798 |
| Beta Tool module | 2,687 / 1,677 / 1,499 | 2,665 / 1,651 / 1,471 |

- **Headless Chromium, `/tools/alpha`:**
  - Route splitting on: main, then `routeAlpha`, then `LazyAlphaTool`,
    each request starting after the previous one ended.
  - Hand-written loaders: main, then `AlphaInner`.
  - `/` loads only main, and both Tool modules load in parallel when the
    dialog opens.
- **One shared, non-generic wrapper** (`lazy_entry(&'static
  LazyLoader<(), Element>)`) adds about 100 bytes of main per Tool. A
  wrapper per Tool adds about 11.5 KB each. These figures come from
  earlier builds with function names kept, so they are indicative.
- **The splitting machinery** costs about 6 KB brotli in main: 156,186
  bytes with no splitting at all.
- **A leftover `#[component(lazy)]` with the feature off** builds silently
  and emits no module, and the Tool lands in main.
- **Lazy entries with props:**
  - Props work: a `String`, a `Signal<i32>` and an `EventHandler` were
    checked in the browser.
  - Each props type costs one generic helper in main.
  - Generic components fail with `E0401`.
- **Read from source:** a loader's symbol is the function name plus a
  hash of its position, so entry names must be distinct. The module name
  becomes an identifier, so it cannot contain hyphens.
- **The home dashboard:** with route splitting alone, every Tool the
  dashboard renders inline is copied into the home module. Lazy entries
  remove it.
- **A warning unrelated to the loader:** opening a Tool dialog logged
  `dioxus-core arena.rs:65 cannot reclaim ElementId` in both variants.

### The existing `wasm/` crates

- **Native tests:** `cargo test` on a copy of `wasm/` passes 436 tests
  across the 16 crates.
- **Exports pin code into main:**
  - An app linking `formatter`, `uuid` and `color` as they are exported
    their functions from main. 49 crate functions sat in main and none in
    a route module, including code no route calls.
  - Main was 525,681 bytes, against 475,950 with the exports behind a
    feature.
- **`pdf` (Typst):**
  - **Exports left in:** main was 21,435,316 bytes raw (6,902,033 brotli),
    and every route module shrank to about 539 bytes.
  - **Exports behind a feature:** Typst lands in the PDF route module at
    21,391,137 bytes (7,183,886 brotli).
  - **Either way:** `qcms` 0.3.0 has unconditional `#[no_mangle]`
    functions, which pin about 46 KB into main (inferred from the size
    change).
- **A feature flag fails silently:** `wasm-pack build` without `--
  --features bindgen` succeeds and writes a 402-byte module with no
  exports.
- **The APIs are JS-shaped:**
  - Error paths that build a `JsError` panic natively (`number_base`,
    `diff`).
  - 10 of the 16 crates return `JsError`, `JsValue`, `js_sys` objects or
    JSON envelopes, so a split needs a typed Rust API, not just a
    `cfg_attr`.
- **Randomness comes from `getrandom`:** `bcrypt` and `uuid` draw random
  bytes through `getrandom` `wasm_js`, which pulls in `wasm-bindgen`
  transitively on wasm32.
- **Every crate is `cdylib` plus `rlib`,** so a dx build links one extra
  cdylib per dependency: 41 MB for `pdf` with its exports left in.
- **Name clash:** a new member named `hash` beside `wasm/crates/hash`
  fails (`two packages named hash`). `cargo pkgid uuid` is ambiguous,
  because Dioxus brings in crates.io `uuid` 1.29.3.
- **TypeScript logic to port:** `src/utils` has 76 non-spec files (about
  6,780 lines):
  - about 40 are pure (about 3,420 lines);
  - about 25 are browser- or npm-bound;
  - about 11 wrap `@/wasm`.

### One root workspace

- **Both builds work** with `wasm/Cargo.toml` deleted:
  - wasm-pack 0.14.0 and 0.15.1 use the root profiles and `target/`, and
    `wasm/scripts/build.sh` runs unchanged;
  - dx splits from the same workspace.
- **Keeping the nested `wasm/Cargo.toml` raises no error.** Cargo then
  runs two workspaces for the same crates, and wasm-pack keeps
  `wasm/Cargo.lock` and `wasm/target`.
- **React's bytes change slightly:**
  - `hash_bg.wasm` grows from 18,556 to 18,564 bytes. The only difference
    is the panic path, now prefixed `wasm/`.
  - wasm-pack 0.14 and 0.15.1 give different bytes from each other.
- **`inherits = "release"` brings in `codegen-units = 1`.** dx adds only
  `strip = false` to a profile you define, and warns unless that profile
  itself sets `lto` and `debug` (`dioxus-cli-0.7.10/src/build/request.rs:843-852,
  3040-3073`).
- **`default-members = ["wasm/crates/*"]` makes dx panic**
  (`workspace.rs:325`, `canonicalize(...).unwrap()` on the glob) unless
  it is given `-p`.
- **Seeding the root lock** from `wasm/Cargo.lock` keeps `wasm-bindgen`
  at 0.2.117. A fresh lock moves it to 0.2.130. Adding the Dioxus
  dependencies took the lock from 339 to 588 packages with no existing
  version changed.
- **Merges from `main`:** a `main` commit editing `wasm/Cargo.toml` gives
  a modify/delete conflict on `develop`. Edits to the lock follow the
  rename.

### Enforcing the layers

- **cargo-deny 0.22.1's `wrappers`** limits the direct dependents of a
  banned crate. It does not accept globs, it matches by name only, and in
  builds it missed five cases:
  - a Tool depending on `wasm-bindgen-futures`, `dioxus-web` or
    `serde-wasm-bindgen`;
  - a logic crate depending on `dioxus-signals`;
  - an optional `web-sys`, unless `--all-features` is set.

  `[bans.features]` judges only the merged feature set, so it cannot say
  "only `app` turns on `dioxus/web`".
- **An allowlist check over `cargo metadata --no-deps`** caught all of
  those, and also a Tool depending on another Tool or on `app`, and `ui`
  turning on `dioxus/web`.
- **A Tool that never names `web-sys` still reaches the browser** once
  `app` turns on `dioxus/web`:
  - `dioxus::web::WebEventExt::as_web_event()` hands it raw drag events,
    elements and, through them, `localStorage`;
  - `document::eval` runs any JavaScript.

  Compiling a crate on its own does not catch this once `ui` has the
  feature.
- **What does catch it:**
  - A `clippy.toml` with `disallowed-methods` catches `eval`,
    `as_web_event` and a `platform::window()` escape hatch.
  - `disallowed-types` misses inferred types.
  - Raw `web-sys` types in `platform`'s public API are caught only by
    `RUSTC_BOOTSTRAP=1 -Zpublic-dependency`.
- **Read from source:** Dioxus 0.7.10 re-exports no `web_sys`, `js_sys`
  or `wasm_bindgen`. The leak is its typed accessors
  (`dioxus-web-0.7.10/src/events/mod.rs:187-207`).

### The registry

- **`tool-routes.ts` loads standalone** under plain Node 24: it has one
  import, and that is type-only.
- **A data-only `registry` crate works:** `macro_rules!` emits a `ToolKey`
  enum and a const table, and a native binary printed it as JSON. That
  JSON matched the Node dump with `isDeepStrictEqual` on all 84 entries,
  in order.
- **A mutation test** dropping the U+FE0F variation selector from one
  emoji was caught.
- **React's `renderRouteHtml`** stamped a page correctly from that JSON.
  "Text Sort & Dedupe" exercises its HTML escaping.
- **A `static TOOLS: &[ToolDef { component: fn() -> Element }]` reachable
  from the shell** moved every Tool into main: 417,318 grew to 443,315
  bytes, and the route modules shrank to about 1.2 KB.
- **A route wrapper generated in `app`,** rendering a shell with a Tool's
  function, kept the Tool in its own module.
- **Nothing generates a sitemap today:** `public/sitemap.xml` is static
  and lists only the home page.

### One crate per Tool, at 84 stub Tools

| | One crate per Tool | One `tools` crate |
|---|--:|--:|
| Release main | 658,447 | 657,032 |
| Release, main plus all Tool modules (gzip) | 874,180 | 894,402 |
| Dev wasm | 98.0 MB | 50.3 MB |
| Clean dev build | 36 s | 29.5 s |
| No-op rebuild | 9.6 s | 2.8 s |
| One-Tool edit | 7.1 to 7.9 s | 3.7 s |
| `ui` edit | 9.4 s | 3.7 s |

- **Cargo's own share of the dev cost was small:** 3.3 s for a Tool edit
  and 5.4 s for a `ui` edit. The rest was `wasm-bindgen` over the larger
  dev wasm, about 0.57 MB more per crate.
- **`cargo metadata` stays fast:** 0.4 to 0.6 s with 87 members, and
  0.07 s with `--no-deps`.
- **`asset!()` cannot leave its crate:**
  - A path outside it fails with "Make sure the asset exists within this
    crate".
  - Assets declared in library crates are bundled, and a Tool's asset
    reference lands in that Tool's module.
- **Tailwind:**
  - Tailwind 4.3.3 with `@source '../crates/**/*.rs'` found every Tool
    crate's classes.
  - It skips files under a gitignored path, even when an `@source` glob
    matches them.
  - dx runs its own Tailwind 4.1.5 if a `tailwind.css` sits at the app
    crate root (`dioxus-cli-0.7.10/src/tailwind.rs:15-16`).
- **dx finds `crates/app/Dioxus.toml`** when run from the root with
  `--package`.
- **`dx serve` watches only the app crate's direct dependencies:** an
  edit to a logic crate reached only through a Tool triggered no rebuild
  (`serve/runner.rs:1059-1140`).
- **Hot-reloading rsx** worked across crates.
- **A minimal Tool manifest** is 9 lines with workspace inheritance.

## Not verified

- **Ported Tools:** every number here comes from stubs, at 2 or 84 Tools.
- **Hot-patching:** `dx serve --hot-patch` failed at the first build in
  every layout (`exceptions proposal not enabled`, rustc 1.100.0), so its
  cost across 84 crates is unknown.
- **Not built:**
  - `lazy_loader!` re-exported through `ui`;
  - a Routable-emitting macro shared between crates;
  - `platform` built for the host target.
- **The spike's `codegen-units` panic**
  ([DioxusLabs/dioxus#4769](https://github.com/DioxusLabs/dioxus/issues/4769))
  did not reproduce with `codegen-units = 16` on stub apps.
- **Partly built:** 14 of the 16 `wasm/` crates were resolved under the
  root workspace but not compiled there. With `color` behind a feature,
  its code landed in main in two builds and in its own module in a third,
  for a reason not found.

## How to reproduce

The scratch workspaces were not kept. Each finding above names its build
flags and what was compared, so it can be rebuilt from a stub app crate,
one or two Tool crates and the Dioxus 0.7.10 source.
