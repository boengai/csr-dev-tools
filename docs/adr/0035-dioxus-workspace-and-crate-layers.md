# ADR 0035 — One Cargo workspace of layered crates, one crate per Tool

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

[Issue 20](https://github.com/boengai/csr-dev-tools/issues/20) owns the
map's "best structure" priority: where the Dioxus code lives, how it is
split into crates, which dependencies each layer may take, what the single
source of truth for the Tool list is, and which conventions carry over. The
aim is that 84 Tools can be ported without the layout drifting. It was
decided in conversation on 2026-11-27.

- **The Tools.** 84 Tools: 27 transformer, 27 custom, 12 codec,
  8 generator, 8 file-processor and 2 comparator
  (`src/constants/tool-routes.ts`).
- **The spike** ([issue 18](https://github.com/boengai/csr-dev-tools/issues/18))
  had its own `dioxus/` workspace with two crates. `app` held everything,
  and `logic` held the pure code. It had its own workspace only to avoid
  `wasm/Cargo.toml`'s `codegen-units = 1`. ADR-0031 noted that the
  `logic`/`app` split "suggested itself". No spike code survives.
- **Decisions this one must fit:**
  - ADR-0031: Dioxus `=0.7.10`, a pinned toolchain, and a fallback loading
    model that stays available (condition 4).
  - ADR-0032: the restore path runs natively and only a thin adapter
    touches `localStorage`. Where the key table lives was left to #20.
  - ADR-0033: one directory of Engine bridges, one Bridge facade each, and
    a Platform layer beside them. Tool code never imports `wasm_bindgen`,
    `js_sys` or `web_sys`. Where those live was left to #20.
  - `docs/ux/parity.md` ([issue 24](https://github.com/boengai/csr-dev-tools/issues/24)):
    the layout guard becomes a compile-time rule, owned by #20 and #25.
- **What was measured.** Scratch workspaces were built with dx 0.7.10
  `--release --wasm-split` and fat LTO on 2026-11-27. They used stub Tools,
  not ported ones, and were not kept.
  - **Crate boundaries do not affect splitting.** The splitter runs on the
    linked module. A component from another crate lands in its own module
    like a same-crate one: main was 416,399 bytes against 414,443.
  - **Fat LTO is required.** With thin LTO the build exits 0, but tool
    code moves back into main (417,318 to 479,367 bytes).
  - **Shared code is copied.** Code used by two Tools is copied into each
    Tool's module whatever the crate layout. The shared-chunk pass adds
    nothing.
  - **Exports pin code into main.** Linking a crate that has
    `#[wasm_bindgen]` exports keeps all of its code in the main module.
    With `pdf` linked that way, main was 21.4 MB raw and 6.9 MB brotli, and
    the PDF route's module was 539 bytes.
  - **A component table defeats splitting.** A static table of component
    pointers moved every Tool's code into main.
  - **The dashboard needs per-Tool entries.** Splitting by route puts
    every Tool the home dashboard can open into the home module.
  - **Route splitting costs a hop.** With route splitting on, a Tool page
    waits on three wasm requests in series: main, route, Tool.
    `dioxus-router/wasm-split` is an empty feature, so route splitting
    cannot be turned off on its own. Hand-written loaders
    (`wasm_split::lazy_loader!`) with `dioxus/wasm-split` off give two
    requests: main, then the Tool. Main is the same size, 162,387 against
    162,324 bytes brotli at two Tools. A shared, non-generic wrapper adds
    about 100 bytes of main per Tool, against about 11.5 KB for a wrapper
    per Tool. A leftover `#[component(lazy)]` silently emits nothing once
    the feature is off.
  - **One crate per Tool, at 84 stub Tools.**
    - Release output is no larger than one crate holding every Tool.
    - The dev wasm doubles, from 50 to 98 MB.
    - A no-op rebuild takes 9.6 s against 2.8 s, a one-Tool edit 7 to 8 s
      against 3.7 s, and a `ui` edit 9.4 s.
    - `dx serve` only watches the app crate's direct dependencies.
  - **One root workspace.**
    - It builds both ways, wasm-pack for React and dx for Dioxus.
    - If `wasm/Cargo.toml` is kept, cargo silently runs two workspaces.
    - `inherits = "release"` brings in `codegen-units = 1`.
    - With `default-members`, dx panics unless it is given `-p`.
    - wasm-pack 0.14 and 0.15.1 (CI installs the latest) give different
      bytes.
    - React's wasm changes only by a `wasm/` prefix in panic-path strings:
      `hash_bg.wasm` goes from 18,556 to 18,564 bytes.
  - **cargo-deny is too weak as the layer gate.** Its `wrappers` missed
    five cases that an allowlist test over `cargo metadata` caught.
  - **Dependencies alone cannot fence the browser off.** Once any crate
    turns on `dioxus/web`, any crate can reach raw browser types through
    `WebEventExt::as_web_event()`, and `document::eval` reaches any
    JavaScript.
  - **A path-length limit.** dx panicked when an output path reached 257
    characters.
  - **Hot-patching is unverified.** `dx serve --hot-patch` failed in every
    layout on rustc 1.100.

## Decision

### 1. One workspace at the repository root

- **The root holds the workspace:** a `Cargo.toml` and a pinned
  `rust-toolchain.toml`. `wasm/Cargo.lock` moves to the root with
  `git mv`, so `wasm-bindgen` stays at 0.2.117. `wasm/Cargo.toml` is
  deleted.
- **A CI guard fails if either file reappears under `wasm/`.** A badly
  resolved modify/delete conflict from `main` would otherwise bring the
  nested workspace back, and cargo would quietly split the workspace in
  two.
- **The members are listed by layer:** `crates/app`, `crates/bridges`,
  `crates/persist`, `crates/platform`, `crates/registry`, `crates/ui`,
  `crates/logic/*`, `crates/tools/*`, `crates/workers/*` and
  `wasm/crates/*`. A bare `crates/*` glob would also match the `logic`,
  `tools` and `workers` directories, which have no manifest. The existing
  crates stay where they are until cutover. `edition = "2024"`
  moves to the root `[workspace.package]`.
- **Profiles:**
  - `[profile.release]` stays exactly as today for wasm-pack: `lto =
    "fat"`, `opt-level = "z"`, `strip = "debuginfo"`, `codegen-units = 1`.
  - `[profile.wasm-release]` is for dx and is written out in full:
    `inherits = "release"`, `lto = "fat"`, `codegen-units = 16`,
    `debug = true`, `panic = "abort"`, `opt-level = "z"`.
- **There are no `default-members`.** Tests run from explicit
  `cargo test -p` lists instead of `cd wasm && cargo test`.
- **CI:**
  - wasm-pack is pinned.
  - `/target/` is ignored.
  - The four workflows cache `target` on the root `Cargo.lock`.
- **React's wasm output changes only by the `wasm/` prefix** in its
  panic-path strings. That is accepted.

### 2. Nine crate layers, with dependencies in one direction

| Crate | Path | Package | May depend on |
|---|---|---|---|
| App | `crates/app` | `app` | every crate under `crates/`, directly, except workers and the logic crates only a worker uses; never `wasm/crates` |
| Tool | `crates/tools/<key>` | `tool-<key>` | `ui`, `platform`, `bridges`, `registry`, `logic-*`; never another Tool, never `app` |
| UI | `crates/ui` | `ui` | `platform`, `bridges`, `registry`, `persist` |
| Platform layer | `crates/platform` | `platform` | `web-sys`, `js-sys`, `wasm-bindgen` |
| Bridge facades | `crates/bridges` | `bridges` | `wasm-bindgen`, `js-sys` |
| Persistence | `crates/persist` | `persist` | serde and `serde_json` only |
| Registry | `crates/registry` | `registry` | nothing |
| Logic | `crates/logic/<name>` | `logic-<name>` | pure third-party crates only |
| Worker | `crates/workers/<name>` | `worker-<name>` | `logic-*`, `wasm-bindgen`; never a dependency of `app` |

- **`app` depends directly on every crate under `crates/`,** even the ones
  only a Tool uses, except the workers and the logic crates only a worker
  uses (`logic-pdf`, `logic-bcrypt`). The allowlist test holds that
  exception list. `dx serve` ignores edits to crates the app reaches only
  through another crate.
- **"No browser crates" means direct dependencies.** A transitive
  `getrandom` → `js-sys` on wasm32 is allowed. Randomness that a logic
  crate needs is passed in as a parameter instead, for example the bcrypt
  salt and the uuid bytes.
- **Rust workers** are the bcrypt worker and the Typst PDF compile worker
  (ADR-0033). Each is a separate `wasm-bindgen --target web` package. How
  they are built stays with the map's Workers item.

### 3. How the layers are enforced

- **Crate edges are checked by a native test over `cargo metadata`.** Each
  layer has an allowlist of direct dependencies, covering both workspace
  layers and named third-party crates. The test checks:
  - normal, dev, build and target-specific dependencies;
  - optional and renamed dependencies;
  - each crate's own `[features]`, for anything that turns on
    `dioxus/web`;
  - that no Tool depends on another Tool.

  It is not cargo-deny.
- **Browser access outside `platform` and `bridges` is approximated, not
  guaranteed.** Feature unification and `document::eval` make a guarantee
  impossible on stable Rust. The approximation has two parts:
  - `platform`'s public API hands out no raw `web-sys` or `js-sys` type;
  - a Clippy `disallowed_methods` list covers `document::eval`,
    `as_web_event`, `try_as_web_event`, `get_web_file` and the event-data
    `downcast` methods.

  Lint levels are [#25](https://github.com/boengai/csr-dev-tools/issues/25)'s.
- **The Tool set agrees everywhere.** CI checks that four sets are equal:
  the `crates/tools/*` directories, `app`'s Tool dependencies, `app`'s
  ported-Tool list (section 7), and the registry keys of those Tools.

### 4. One crate per Tool

- Each Tool is a library crate in a directory named by its key
  (`crates/tools/hash-generator`, package `tool-hash-generator`).
- **This is chosen for its boundaries, not for speed.**
  - The Tool's `Cargo.toml` lists exactly what it may use, so a CI check
    can reject `web-sys` or another Tool.
  - A Tool cannot reach into another Tool's code.
  - A port PR's reach is visible in one directory.
- **It costs dev time.** Dev rebuilds were 2 to 3 times slower with stub
  Tools, and the dev wasm doubled. The ratio will shrink as Tools hold
  real code. Release builds gain nothing either way, because fat LTO links
  the whole program at the end.

### 5. Logic crates, and the existing `wasm/` crates

- **Logic lives in domain crates,** not in Tools. Logic that is TypeScript
  today becomes Rust in `crates/logic/<domain>`, tested natively with
  `cargo test`. A Tool keeps only glue: it hands logic functions and its
  settings to its shell.
- **Browser-bound work belongs to `platform`,** not logic: canvas
  conversion, `toBlob`, WebCrypto. Locale and time zone are passed in
  (ADR-0033).
- **Each existing crate a Dioxus Tool or worker needs is split before its
  first port:**
  - Its logic moves to `crates/logic/<name>` as `logic-<name>`, a plain
    library with a typed Rust API and native tests.
  - `wasm/crates/<name>` shrinks to a thin `#[wasm_bindgen]` wrapper over
    it. The wrapper keeps its package name, so `wasm/scripts/build.sh`,
    `wasm/pkg/<name>` and React's imports do not change.
  - A `bindgen` feature flag was rejected. wasm-pack silently produces an
    empty module when the flag is missing.
- **Nothing in the app's tree exports to JavaScript,** except `platform`
  and `bridges`. CI checks that the main module exports nothing beyond
  `main` and the `wasm-bindgen` and splitter internals.
- **`pdf` (Typst) and `bcrypt` are reached only through their worker
  packages.** CI checks that neither crate, nor `typst-library`, is in the
  app's dependency tree.
- **At cutover** the thin wrappers in `wasm/crates` are deleted with
  React.

### 6. The registry is the single source of the Tool list

- **Generated from `tool-routes.ts` until cutover.** A Node script in
  `scripts/dioxus/` writes `crates/registry/src/generated.rs`. The file is
  checked in, and CI fails if regenerating it leaves a diff. A
  hand-written copy with a parity check was rejected, because every SEO
  fix merged from `main` would also need a second, Rust edit. At cutover
  the generator is deleted, and the Rust file becomes the source.
- **Data only.** The registry holds:
  - a `ToolKey` enum, and each Tool's key, name, category, emoji,
    description, SEO text and layout type, in today's order;
  - what lives outside `tool-routes.ts` today: `CATEGORY_ORDER`,
    `RENAMED_KEYS`, `SITE_ORIGIN` and the home page's head tags.

  It has no components and no function pointers, so a native build step
  can read it.
- **The storage-key table** is a hand-written `crates/registry/src/storage.rs`
  beside the generated file, because `tool-routes.ts` has no keys.
  - Every key and key pattern is a `StorageKey` that can only be built
    there. Keys stay literal: `json-diff-checker` keeps `json-diff`.
  - It also covers the keys no single Tool owns: the dashboard layout,
    scroll positions, the model cache and the Mermaid handoff.
  - A shell's `storage_key` takes a `StorageKey`, so a key missing from
    the table does not compile. ADR-0032's test, that the build cannot
    write a key off the list, compares this table with the key list.
- **What derives from it:**
  - the sidebar, palette and home order;
  - the head-stamped pages;
  - the Tool list that `docs/ux/parity.md`'s layout contract suite walks;
  - the routes and the lazy-entry match, through `app`'s ported-Tool list
    (section 7).
- **Stamping stays in TypeScript** (`renderRouteHtml`) until cutover, as
  ADR-0031 says. It stamps only ported Tools: those with a
  `crates/tools/<key>` directory.
- **Nothing generates a sitemap today.** `public/sitemap.xml` lists only
  the home page. Generating one is new scope for Cutover, and it would
  replace that file rather than sit beside it.

### 7. Loading: one lazy Tool entry per Tool, no route splitting

- **Each Tool crate declares exactly one Tool entry,** a hand-written
  `wasm_split::lazy_loader!` loader.
  - Its module name is the snake_case key (`hash_generator`), and its
    entry is the PascalCase of the key plus `Entry` (`HashGeneratorEntry`).
  - It takes no props. A Tool reads its Tool presentation and the other shared
    state from `ui` contexts.
  - A `ui` macro declares the loader, so that the entry returns a
    `ToolView` (section 9). Whether `lazy_loader!` works when re-exported
    through `ui` is checked in the first port PR. If it does not, Tool
    crates may also depend on `wasm-splitter = "=0.7.10"`.
- **`app` keeps one ported-Tool list in a macro.** The macro emits the
  routes and an exhaustive `ToolKey` → Tool entry match. The Tool routes,
  the dashboard dialog and the command palette all render through one
  shared, non-generic `ui::LazyTool` wrapper.
- **`dioxus/wasm-split` and `#[component(lazy)]` are banned.** With the
  feature on, route splitting comes back. With it off, a leftover
  attribute emits nothing and the Tool's code lands in main. CI checks
  that every ported Tool emits its own module. Per-module byte ceilings
  are #25's.
- **The shell's extras load lazily too.** The sidebar, command palette,
  settings and toast region get their own loaders in `app`. Main holds
  only the shell, the router, the registry data, `platform`'s core and the
  primitives drawn at first paint.
- **On a stamped Tool page,** the inline early-fetch script ([issue 35](https://github.com/boengai/csr-dev-tools/issues/35))
  starts the Tool's module alongside main, under the `auto` size rule in
  `docs/perf/budgets.md`. The stamper finds the module by the loader's
  module name.
- **Code shared between Tools is copied** into each Tool's module. That
  is accepted.
- **ADR-0031's fallback loading model** (condition 4) means an app shell
  plus separately built `wasm-bindgen` logic modules. It stays available,
  because every logic crate is a plain library that a thin wrapper can
  expose, as in section 5. No async facade is built now. Falling back
  would make each Tool's logic calls async; the cost is accepted.

### 8. `platform` and `bridges`

- **`platform` is the Platform layer.**
  - It has one module per capability, never per Tool: storage adapter,
    clipboard, downloads, files, URLs and object URLs, canvas and codecs,
    WebCrypto, `Intl`, collation, local time, timers, head tags, and
    ADR-0033's typed worker bridge.
  - Its public API hands out only opaque types (`FileRef`, `BlobRef`,
    `ObjectUrl`, `ElementRef`). Conversions to `web-sys` types are
    `pub(crate)`.
  - It turns Dioxus events into those types: files from a change or drop
    event, an element from `onmounted`. So `ui` and Tools never call
    `as_web_event` or `get_web_file`.
  - It compiles for the host target, where each call returns
    `Unsupported`. That lets `ui` and Tools build and run native tests.
    Browser behaviour is checked by the Playwright suites of
    [#24](https://github.com/boengai/csr-dev-tools/issues/24).
- **`bridges` holds the Bridge facades,** one Rust module per Engine
  bridge.
  - Its `js/` directory is ADR-0033's one directory. It holds every
    TypeScript Engine bridge, the loader shim and the regex worker, and it
    is the pnpm workspace package that lists the bridges' npm
    dependencies.
  - It lives inside the crate because `#[wasm_bindgen(module = …)]` paths
    resolve within the crate that declares them.
  - Components that mount an Engine, such as the code input, live in `ui`
    and hand their facade an `ElementRef`.

### 9. `ui`: one crate, and every Tool renders inside a frame

- **Modules:**
  - `primitives`: select, dialog, menu, tabs, toast. Their design is
    [#22](https://github.com/boengai/csr-dev-tools/issues/22)'s.
  - `components`: Button, CopyButton and the rest.
  - `shells`: the five layout shells.
  - `frame`: `ToolFrame`, which holds the Tool presentation (page or dialog), the
    title, the description and reset registration.
  - `kits`: the family parts in `CONTEXT.md`, such as the Markup to PDF
    and Sortable PDF shells, CSS output, SortableCard, the Batch asset
    pipeline and the Field list.
  - `hooks`: the Tool computation pipeline, the Tool field bag, Persisted tool
    input and Tool handoff.
- **Shared state is defined in `ui`.** The Toast channel, Tool presentation,
  settings and navigation are context types defined in `ui` and provided
  by `app`. Tools never name an `app` type.
- **Every Tool renders inside a frame.** A Tool entry returns a sealed
  `ToolView`, which only a shell or `ToolFrame` can build. That makes
  "custom Tools still use the frame" a compile error to break, which
  covers the 27 custom Tools. #25 sets the guard's exact wording.
- **Family code lives in `ui/kits`,** so the rule that no Tool imports
  another never pushes copies into Tools.
- **`ui` stays one crate** until an edit to it is measured as too slow on
  real Tools. With 84 stub Tools a `ui` edit rebuilt in 9.4 s.

### 10. `persist`

- **It holds ADR-0032's restore path:**
  - laying stored values over their defaults;
  - the four migrations;
  - envelope versions;
  - the lone-surrogate pass.

  Its golden-value tests run natively against the stored-value contract
  ([#38](https://github.com/boengai/csr-dev-tools/issues/38)).
- **It defines a `Store` trait.** `platform` implements it over
  `localStorage` and `sessionStorage`, and `ui` wires the two together
  behind a shell's `storage_key` and the hook for a bespoke Tool field bag.

### 11. The files that are not Rust

| What | Where |
|---|---|
| dx configuration | `crates/app/Dioxus.toml`. No `tailwind.css` at the app crate root: dx would run its own Tailwind 4.1.5 and ignore its errors. |
| Stylesheet | The Tailwind input lives in `crates/ui/style/`, because `asset!()` cannot reach outside its crate, and the generated CSS is exported as a `pub static` `Asset`. Which theme file the input imports until cutover is #22's. The scan is `@source "../../**/*.rs"`. Generated files that hold class names never sit under a gitignored path, because Tailwind skips them. |
| Build, stamping and registry generator | TypeScript in `scripts/dioxus/` |
| Engine bridges | `crates/bridges/js/` (section 8) |
| End-to-end specs | The shared `e2e/` (`docs/ux/parity.md`). There is no `dioxus/e2e`. |
| Build output | `dist-dioxus/` until cutover, so both builds can coexist |
| Commands | `pnpm dioxus:build`, `pnpm dioxus:serve`, `pnpm dioxus:test` |

### 12. Conventions

- **Carried over:**
  - `pnpm` only.
  - Common components take no `class` or `style` prop, only named
    variants.
  - One `storage_key` option.
  - The `CONTEXT.md` vocabulary becomes the Rust names (`ToolFrame`,
    `TransformerShell`).
- **Changed form:**
  - `tv()` becomes enums whose methods return whole class literals
    (#22).
  - Named exports become explicit `pub` items, with no glob re-exports.
  - Alphabetical imports are left to rustfmt, whose settings are #25's.
- **Dropped:**
  - "All types in `@/types`." A types hub crate would rebuild everything
    on any change, so each type lives in the lowest crate that owns it.
  - `Array<T>`, `type` over `interface`, and the `@/` alias, which mean
    nothing in Rust.
- **Naming:**
  - Tool directories are named by key, with packages `tool-<key>`.
  - Logic packages are `logic-<name>`, and worker packages
    `worker-<name>`.
  - Files and modules are snake_case.
  - Route variants are the PascalCase of the key.
  - In `ui`, one component per file.
  - A Tool's module and entry follow section 7.
- **The CLAUDE.md "Adding a new tool" recipe** is rewritten with the first
  port PR. That is the map's contributor-docs item.

### The layout, in one picture

```text
Cargo.toml, Cargo.lock, rust-toolchain.toml   workspace root
crates/
  app/                Dioxus.toml; router, app shell, ported-Tool list
  bridges/            Bridge facades; js/ = the Engine bridges (pnpm package)
  logic/<name>/       logic-<name>: pure Rust, native tests
  persist/            restore path, Store trait
  platform/           Platform layer: browser APIs, opaque types out
  registry/           generated.rs (from tool-routes.ts), storage.rs
  tools/<key>/        tool-<key>: one Tool entry, glue only
  ui/                 primitives, components, shells, frame, kits, hooks, stylesheet
  workers/<name>/     worker-<name>: wasm-bindgen worker packages
scripts/dioxus/       build, stamp, registry generator (TypeScript)
e2e/                  specs shared by both builds
wasm/crates/<name>/   React's wasm-pack packages; thin wrappers once split
src/                  React, until cutover
```

## Considered options

- **A separate `dioxus/` workspace, as in the spike.** The reused
  `wasm/crates` would sit outside the Dioxus lint and dependency gates,
  and there would be two lockfiles for the same crates.
- **New crates inside the `wasm/` workspace.** It inherits a release
  profile that wasm-pack needs and dx does not, and it puts the app under
  a directory named for one build tool.
- **One `tools` crate with a module per Tool.** It is simpler and faster
  to rebuild in dev. But `cargo metadata` sees one edge, so "no Tool
  imports another" and per-Tool browser bans would need source scans.
- **Reusing the `wasm/` crates as they are.** Their exports pin all their
  code into main.
- **A `bindgen` feature flag** instead of splitting the crates. A missing
  flag gives a silently empty module.
- **A hand-written registry with a parity check.** It worked, and caught a
  one-character emoji change. But every metadata fix from `main` would
  need two edits.
- **Components in the registry** (`Custom { adr, component }`). It moved
  every Tool into main.
- **Route splitting with `#[component(lazy)]`.** It costs three serial
  requests per Tool page, and wrappers are copied per route.
- **cargo-deny as the layer gate.** It missed five cases. It may still run
  as a second layer under #25.
- **Several `ui` crates** (components, shells, primitives). This is
  deferred until a `ui` edit is measured as slow on real Tools.

## Consequences

- **A port PR touches a known set of files:**
  - `crates/tools/<key>/Cargo.toml` and `src/lib.rs`;
  - one line in `app`'s `Cargo.toml`;
  - one line in the ported-Tool list.

  If the Tool reuses an existing `wasm/` crate, the PR also moves that
  crate's logic into `crates/logic/<name>` first.
- **The dev loop is slower** than with one crate, by 2 to 3 times with
  stub Tools. It is re-measured once real Tools exist. Hot-patching is
  unverified in any layout.
- **React and Dioxus share one lockfile.** Updating a Dioxus dependency
  can move React's `wasm-bindgen`, and it invalidates React's Rust cache.
  `cargo update` is therefore deliberate.
- **The loaders lean on `wasm-splitter` 0.7.10 internals.** They are
  pinned with Dioxus. A Dioxus 0.8 upgrade rechecks them.
- **Opening a Tool dialog logged `cannot reclaim ElementId`** in both
  loading variants, so neither variant causes it. The dialog primitive
  (#22) should check it.
- **Merges from `main` that touch `wasm/Cargo.toml` conflict.** These are
  rare: it was last touched in `aea1cec3`. The CI guard in section 1 stops
  a bad resolution.
- **Handed on:**
  - lint levels and byte ceilings → #25;
  - the stylesheet input and theme → #22;
  - the sitemap, moving the theme file out of `src/`, and deleting the registry
    generator and the wasm wrappers → Cutover;
  - how worker packages are built → the map's Workers item;
  - contributor and agent docs → the map's docs item.

  The map's "existing `wasm/` crates" item is answered by section 5.

## Not verified

- Every number above comes from stub Tools in scratch builds of two to
  84 Tools, not from ported Tools.
- Not yet built:
  - `lazy_loader!` re-exported through `ui`;
  - a macro shared between crates that emits the Routable enum;
  - `platform`'s host-target build.
- The spike's `codegen-units` panic ([DioxusLabs/dioxus#4769](https://github.com/DioxusLabs/dioxus/issues/4769)) did not
  reproduce at `codegen-units = 16`. That does not show it is safe on the
  real app.
- The 14 `wasm/` crates other than `shared` and `hash` were resolved under
  the root workspace but not compiled.

## Revisit when

- A `ui` edit or a one-Tool edit is too slow on real Tools.
- Hot-patching works with dx 0.7.10, and its cost across 84 crates is
  known.
- Dioxus 0.8 ships a stable release, or the splitter gains a working
  shared chunk.
- The fallback loading model is needed.
