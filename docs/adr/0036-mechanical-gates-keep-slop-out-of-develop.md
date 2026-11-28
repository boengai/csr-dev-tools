# ADR 0036 — Mechanical gates keep slop out of `develop`

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

The map ([issue 5](https://github.com/boengai/csr-dev-tools/issues/5))
puts "prevent slop code" first among its four priorities. Slop is code
that passes the compiler but nobody chose deliberately: duplicated Tool
logic, `unwrap()` in UI paths, copied components instead of a shared shell,
dead code, and comments that restate the code. The map says it is kept out
by mechanical gates in CI, not by review alone, and that each port lands as
a small PR. Most ports will be written by agents.
[What are the anti-slop gates?](https://github.com/boengai/csr-dev-tools/issues/25)
owns that priority. It was decided in conversation on 2026-11-27.

- **What earlier decisions handed to it:**
  - ADR-0031: `expect` in UI paths, and the spike's single 360-line
    file-processor component.
  - ADR-0033: the lint that keeps Tool code off `wasm_bindgen`, `js_sys`
    and `web_sys`; the CSP-violation check (Decision 6); and a byte ceiling
    for each bridge and worker file.
  - ADR-0034: four rules. No `class`, `style` or `extends =
    GlobalAttributes` on a common component. No style written from a timer
    or an animation-frame loop. No `style: "…"` string and no `<style>` in
    our own code. No `dioxus-primitives` or `dioxus-motion`.
  - ADR-0035: lint levels, per-module byte ceilings, the wording of the
    layout guard that the sealed `ToolView` makes possible, rustfmt
    settings, and cargo-deny as a second layer under the allowlist test.
  - `docs/ux/parity.md`: what a port PR contains, its template, and the
    merge gates.
- **How the repository is set up:**
  - The `develop` ruleset requires one check, `ci`, and 0 approvals. There
    is no CODEOWNERS file.
  - Agents open PRs from the maintainer's own account, so a required
    approval cannot be met: an author cannot approve their own PR.
  - `ci.yml` exists on both `main` and `develop`, and syncs from `main`
    arrive by merge commit.
  - GitHub reads PR templates only from the default branch, which is
    `main`.
- **What was measured** on 2026-11-27, with rustc and Clippy 1.100.0,
  rustfmt 1.11.0, dx 0.7.10 and scratch crates on Dioxus `=0.7.10`:
  - `unwrap_used`, `expect_used` and `disallowed-methods` fire inside
    `rsx!`: in attributes, in brace expressions and in event-handler
    closures, on both wasm32 and the host target.
  - A `disallowed-methods` entry for `dioxus_document::eval` catches it
    through `dioxus::document` and through the prelude. It misses the
    trait method `dioxus_document::Document::eval`, which needs its own
    entry.
  - `too_many_lines` never checks a `#[component]` function.
  - `unsafe_code`, `allow_attributes` and
    `allow_attributes_without_reason` ignore what macros emit. The
    expansion of `#[component]`, `rsx!` and `#[wasm_bindgen]` holds 89
    `#[allow]`s and 46 unsafe items, and none of them fired.
  - A member without `[lints] workspace = true` gets none of the workspace
    lints. Cargo warns about a missing `[lints]` table, but `cargo metadata`
    does not say whether a member inherits. The warning is raised for every
    member, even one a command does not select, so `build.warnings =
    "deny"` fails while any `wasm/` crate lacks the table.
  - Stable rustfmt cannot group imports (`group_imports` and
    `imports_granularity` are nightly only), and it does not format inside
    `rsx!`. `dx fmt --check` rewrites the files while it fails, and a
    per-file error does not fail it.
  - `dead_code` never reports a `pub` item of a library crate, and no
    mature tool finds `pub` items that no other crate uses.
  - jscpd 5.4.3 detects copied Rust. It finds a renamed copy only with
    `--ignore-identifiers`.
  - cargo-deny 0.22.1 on today's `wasm/` tree finds 24 duplicate versions,
    all under `pdf`, and 8 crates under BSD, Zlib, 0BSD or CC0 licences.
  - cargo-shear 1.14.1 finds `pdf`'s unused `typst-library`, which cargo's
    own `unused_dependencies` lint misses.
  - cargo-mutants 27.1.0 runs on stable, and `--in-diff` mutates only the
    lines a diff touches.
  - `Instant::now`, `SystemTime::now`, `thread::spawn` and `thread::sleep`
    trap when called in a `wasm32-unknown-unknown` module.
  - The existing `wasm/crates` hold 29 non-test `unwrap` and `expect`
    calls, and 1,862 pedantic warnings, 1,336 of them
    `unreadable_literal`. A text search would count 28 more in `parsers`,
    which has its own `expect` method.

## Decision

### 1. Scope

- **Everything under `crates/`** is held to the gates from its first
  line. Its members, and the thin wrappers of split crates, are the gated
  packages. Each cargo-based gate (Clippy, rustfmt, cargo-shear, the
  manifest checks) runs over them by name, never over the whole
  workspace.
- **The TypeScript under `crates/bridges/js` and `scripts/dioxus`** gets
  the repository's oxlint and oxfmt checks.
- **`wasm/crates/*`** is not held to them while it stays as it is on
  `main`, so merges from `main` stay clean. When a crate is split
  (ADR-0035 §5), the logic that moves into `logic-<name>` and the thin
  wrapper left behind must pass every gate in that PR. The wrapper is a
  gated package from then on.

### 2. Where the gates run

- **A new workflow, `.github/workflows/dioxus.yml`,** exists on `develop`
  only. Its job is named `dioxus`, and it is a required check on
  `develop`. A second workflow, `pr-body.yml`, checks the PR title and
  body (section 9). Its check, `pr-body`, is required too.
- **`ci.yml` is not extended.** It exists on both branches, so every sync
  from `main` would risk a conflict in it.
- **Neither workflow has path filters.** A required check that is skipped
  leaves the PR stuck. `pull_request` runs read the workflow from the
  merge commit, so the `main` → `develop` sync PRs run it too.

### 3. Gate files and exemptions

- **A gate file is a file that decides what CI accepts.** They are:
  - the root `Cargo.toml` (it holds `[workspace.lints]` and
    `[workspace.dependencies]`), `clippy.toml`, `rustfmt.toml`,
    `deny.toml` and the jscpd config;
  - the `gates` crate (section 6);
  - the byte-ceiling file, the a11y baseline and the post-migration CSP;
  - the workflows, and the PR templates the body check reads.
- **A `port` or `shell` PR may change a gate file only by adding rows for
  its own Tool,** such as its byte ceilings. Any other change to a gate file is a
  PR of its own, of kind `gates`. A CI check fails a PR that mixes gate
  files with other code.
- **An exemption is an `#[expect(lint, reason = "…")]`** on the smallest
  item. `#[allow]` is denied, and so is a crate-level `#![expect]` in a
  Tool crate.

### 4. PR kinds, bounded by paths

- **Every PR has a kind, told by its title prefix,** and a CI check
  matches the files it changes against that kind. The kinds are `port`,
  `split`, `shell`, `foundation`, `gates`, `docs` and `sync`.
  `docs/quality/gates.md` lists each kind's prefixes and paths.
- **A `port(<key>)` PR ports exactly one Tool.** It touches ADR-0035's
  set of files, the logic it adds for that Tool, and new rows for that
  Tool only. Any change to `ui`, `platform`, `bridges` or `persist`, or to
  logic another ported Tool already uses, lands first, in its own PR.
- **A `split(<crate>)` PR moves a `wasm/` crate's logic into
  `logic-<name>`** and leaves the thin wrapper. It holds no Dioxus Tool,
  and React's tests prove it. This changes ADR-0035's consequence that
  "the PR also moves that crate's logic" in the port: the move is now its
  own PR, merged before the port.
- **A `shell(<layout>)` PR adds one shell and its first Tool,** as proof.
  A shell with no user is untested design.
- **There is no hard cap on lines.** The path rule is the bound, and a
  large diff only raises a warning.
- **The workspace skeleton PR,** which adds the gates themselves, is
  one PR the path check and the mixing rule cannot judge. It is reviewed
  by hand. So is each PR that brings in a deferred gate together with
  the code it judges (amended below).

### 5. Lints

- **Lint levels live in the root `[workspace.lints]`,** and every gated
  member sets `lints.workspace = true`. Cargo's metadata does not show
  inheritance, so the `gates` crate reads each member's manifest.
- **CI denies every warning** in the gated packages, with Clippy's
  `-D warnings`. `build.warnings = "deny"` is not used: the untouched
  `wasm/` crates have no `[lints]` table, and cargo's warning about that
  would fail every run. The `gates` crate's inheritance check covers a
  gated member without the table.
- **Clippy:** `all` and `pedantic` are denied, with a short list of named
  pedantic exemptions. `nursery` and `cargo` stay off. Restriction lints
  are picked one by one, aimed at the slop the map names:
  - panics (`unwrap_used`, `expect_used`, `panic`, `todo`,
    `unimplemented`, `string_slice`), because `wasm-release` aborts on a
    panic and one panic kills the page;
  - leftovers and swallowed results (`dbg_macro`, `print_stdout`,
    `print_stderr`, `let_underscore_must_use`);
  - exemptions (`allow_attributes`, `allow_attributes_without_reason`).
- **rustc:** `unsafe_code` is forbidden everywhere, and `unreachable_pub`
  is denied. `forbid` cannot be lifted by an `#[expect]`, so if `platform`
  ever needs unsafe code, a `gates` PR changes the level. No tool reliably finds unused `pub` items, so the public
  surface is kept minimal instead.
- **`clippy.toml` bans methods.** It bans the browser escapes ADR-0035
  names: both `eval` paths, `as_web_event`, `try_as_web_event`,
  `get_web_file` and the event-data `downcast` methods. ADR-0033's rule
  that Tool code never imports `wasm_bindgen`, `js_sys` or `web_sys` needs
  no lint of its own: ADR-0035's allowlist keeps those crates out of a
  Tool's dependencies. It also bans the
  `std` calls that panic on `wasm32-unknown-unknown`. `platform`'s own
  conversions use an `#[expect]` at each call site. `platform` has no
  `clippy.toml` of its own, because a nested one replaces the root one
  and the two would drift.

The full lists are in `docs/quality/gates.md`.

### 6. A `gates` crate holds the custom checks

- **`crates/gates` (package `gates`, `publish = false`) is a test-only
  crate** outside ADR-0035's nine layers. Nothing depends on it. It reads
  code with `syn` and `dioxus-rsx =0.7.10`, and manifests with
  `cargo_metadata` and `toml`.
- **It holds ADR-0035's layer allowlist** and four-set check, the lint
  inheritance check, and the source rules Clippy cannot reach:
  - ADR-0034's rules on props, `style` strings and `<style>` elements;
  - one Tool entry per Tool crate, and no `#[component(lazy)]`;
  - no path from a Tool into `ui`'s app-only items, which is the React
    guard's "builds no dialog of its own";
  - size: a `#[component]` body is at most 80 lines, standing in for
    `too_many_lines`, and a source file is at most 300 lines, not
    counting its tests;
  - comments: no commented-out code, and every `TODO` names an issue.
- **The allowlist denies `dioxus-primitives` and `dioxus-motion` by name**
  for every member, in every kind of dependency. cargo-deny does not repeat
  the ban, so the rule has one home.

### 7. The layout guard is a type

- **`ToolView<L>` carries a layout marker.** Each shell returns its own
  marker, and `ToolFrame` returns `Custom`.
- **The `ui` entry macro asserts, at compile time,** that the marker
  matches the Tool's layout in the registry. For example:
  "`hash-generator` is a `transformer` Tool in tool-routes.ts, so its
  entry must return `TransformerShell`'s view".
- **The registry generator copies `layoutOptOutAdr`,** and the `gates`
  crate checks that the named ADR file exists.
- **The guard's wording:** *A Tool entry returns the view of the shell its
  registry layout names. Only a `custom` Tool returns `ToolFrame`'s view,
  and its registry entry names the ADR that says why.*

### 8. Each gate proves that it fires

- **Each custom check has a committed fixture that must fail,** and CI
  checks that it does fail. The custom checks are the path check, the
  allowlist, the source rules and the ceiling check.
- **The denied Clippy lints share one fixture crate,** with one violation
  per lint. CI checks that each lint's name appears in the output.

A gate that silently matches nothing looks the same as one that passes.

### 9. Tests, mutation testing and the PR body

- **Every case in a Tool's React spec gets a Rust test** with the same
  input and expected output. The PR body maps each case to its test.
- **Mutation testing replaces a coverage percentage.** cargo-mutants runs
  `--in-diff` on every changed logic crate and on `persist`. No mutant may
  survive on a changed line. A `split` PR moves files with `git mv` and
  feeds a rename-aware diff, so only lines that really changed are judged.
  The whole-crate run is a report, and its gaps become follow-up issues.
- **`pr-body` checks the title and body** against the templates in
  `docs/quality/pr/`. The templates live on `develop`, because GitHub
  would read them only from `main`. Agents pass them with `gh pr create
  --body-file`. The check requires:
  - the kind prefix;
  - the kind's headings;
  - for a `port` or `shell` PR, the case-mapping table;
  - for every kind but `sync`, the automated-review section;
  - the hand-check boxes, which the maintainer ticks.

### 10. Review and merge

- **The automated reviewer runs first.** The agent that wrote the PR runs
  the `code-review` skill against `develop` before opening it. The
  findings and their outcomes go in the PR body. It looks for what no gate
  can see, for example (the full checklist is in `docs/quality/gates.md`):
  - comments that restate the code;
  - names that say nothing;
  - options and parameters added "in case";
  - empty `#[expect]` reasons;
  - style written from a timer.
- **Only the maintainer merges into `develop`.** Agents never merge. The
  merge is the human check: the parity hand check from `parity.md`, every
  new `#[expect]`, every gate-file change and new dependency, and one
  read of the diff.

### 11. Other gates

- **Formatting:** stable rustfmt only. CI runs `dx fmt` in each crate that
  has `rsx!`, then `cargo fmt` over the gated packages, then
  `git diff --exit-code`. An
  `error` line from `dx fmt` fails the job too.
- **Dependencies:** adding a crate, or running `cargo update`, is a
  `gates` PR. cargo-deny checks `app`'s tree for duplicate versions, and
  every tree for sources, licences and advisories. It does not check the
  layers: ADR-0035's allowlist is the only layer gate. cargo-shear and
  cargo's `unused_dependencies` lint find unused dependencies.
- **Copied code:** jscpd runs over `crates/` and starts at zero clones,
  with no baseline. A clone is fixed by moving the code down into
  `ui/kits` or a logic crate.
- **CSP:** the Dioxus Playwright project serves the build under the
  post-migration CSP, and a shared fixture fails any test that sees a
  `securitypolicyviolation` event. This is ADR-0033 Decision 6.
- **Bytes:** every wasm module, bridge file and worker file gets a row in
  the ceiling file described in `docs/perf/budgets.md`, under its rules.
  Because the ceiling file is a gate file, raising a ceiling is now a
  `gates` PR, not an edit inside the PR that needs it.

### 12. When the gates are built

- **One build issue, "Build the anti-slop gates",** builds them. It is a
  sub-issue of the map and blocks the first `port` and `shell` PRs.
- **It lands with the workspace skeleton,** the first Dioxus code on
  `develop`, so every later line is held to the gates from the start. It
  may take several `gates` PRs.

## Considered options

- **Extending `ci.yml`.** It is shared with `main`, so the Dioxus steps
  would conflict on every sync.
- **A separate workflow that is not required.** It would not block a
  merge.
- **Holding `wasm/crates` to the gates now.** Every fix would diverge from
  `main` and conflict on sync. The code is held to the gates when it moves
  instead.
- **`build.warnings = "deny"`.** It fails on the `wasm/` crates' missing
  `[lints]` table even when they are not selected, so it would force
  edits to crates that must stay as on `main`.
- **`#[allow]` with a reason.** An `#[allow]` that no longer applies stays
  silent. An `#[expect]` fails once its lint stops firing.
- **Nightly rustfmt for import grouping.** It would add a second pinned
  toolchain for cosmetics.
- **A text-search source checker.** It miscounts `parsers`' own `expect`,
  and it cannot tell `rsx!` attributes from strings.
- **A coverage percentage.** Agents meet a number with tests that assert
  little. Mutation testing checks that the tests catch changes.
- **A template on `main`.** `main` takes bug fixes only, and the template
  would be unenforced text.
- **An AI reviewer in CI.** It would need secrets and cost on every push.
  This is revisited after the first ten ports.
- **A jscpd baseline.** There is no Dioxus code yet, so a baseline would
  only record clones that one of our own PRs added.
- **One PR for both the logic move and the port** (ADR-0035 as written).
  React's tests can prove the move alone. Put together, the move hides
  inside a large diff.

## Consequences

- **Every PR into `develop` waits on three required checks:** `ci`,
  `dioxus` and `pr-body`.
- **A port PR's reach is mechanical:** one Tool crate, the logic it uses,
  and its own rows. A missing `ui` part means a `foundation` or `shell` PR
  first.
- **Gate changes are visible.** They never arrive inside a port. This
  changes one rule in `docs/perf/budgets.md`: a ceiling is no longer
  raised in the same PR.
- **Agents cannot merge,** so the maintainer's hand check is on the path
  of every Tool.
- **Some slop is caught only by review:** comments that restate the code,
  style from a timer, `pub` items no other crate uses, and empty
  `#[expect]` reasons.
- **The first split of each crate** fixes its non-test `unwrap`s, runs
  `clippy --fix` for `unreadable_literal`, and files one mutation-gap
  issue.
- **Tool glue that looks alike may trip jscpd.** That is read as a missing
  shell API, not as noise.
- **Handed on:**
  - the build → the "Build the anti-slop gates" issue;
  - agent and contributor docs that teach the gates → the map's docs item;
  - an AI reviewer in CI → after the first ten ports.

## Not verified

- The `const` layout assertion inside the `ui` entry macro was not built.
  Neither was its error text through `lazy_loader!`. Both wait for `ui`.
- cargo-mutants' run time on a real logic crate was not measured.
- jscpd's false-positive rate on real Tool glue is unknown.
- That a `main` → `develop` sync PR runs `dioxus.yml`. GitHub's docs say
  a `pull_request` run uses the PR's merge ref, which holds `develop`'s
  workflows, but no sync PR has been tried.

## Amended when the gates were built

[Build the anti-slop gates](https://github.com/boengai/csr-dev-tools/issues/57)
checked three of the items above on 2026-11-27, with rustc 1.100.0:

- **`dioxus-rsx =0.7.10` works as a library.** Its `CallBody` parses an
  `rsx!` body taken from `syn`, and it tells a literal `style: "…"`
  attribute and a `style {}` element apart from an expression. The
  source rules use it as decided.
- **The event-data `downcast` paths are filled into `clippy.toml`:** one
  `dioxus_html::<Type>Data::downcast` for each of the 21 event-data types,
  plus `PlatformEventData::downcast`, `PlatformEventData::downcast_mut` and
  `TouchPoint::downcast`. The browser escapes are
  `dioxus_web::WebEventExt::as_web_event`,
  `dioxus_web::WebEventExt::try_as_web_event` and
  `dioxus_web::WebFileExt::get_web_file`. Each entry fires through
  `dioxus`'s re-exports, proven by the Clippy fixture
  (`crates/gates/fixtures/clippy`).
- **`taiki-e/install-action` has no manifest for jscpd or dx** (v2.90.11).
  Both come through the action's pinned `cargo-binstall` fallback, at
  `jscpd@5.4.3` and `dioxus-cli@0.7.10`. That pins their version but not
  a checksum, so ADR-0031's condition 3 holds only partly for these two.
  cargo-deny, cargo-shear and cargo-mutants have prebuilt, checksummed
  manifests.

Two findings changed the build:

- **Cargo rejects a member glob that matches nothing.** `crates/logic/*`,
  `crates/tools/*` and `crates/workers/*` each match a `README.md` until
  the first crate lands, and cargo skips it because it is not a
  directory. The READMEs are gate files: deleting one breaks the
  workspace.
- **`allow-unwrap-in-tests` covers only `#[test]` functions,** not the
  helpers of an integration test. Helpers return a `Result`, and the
  test unwraps it.

Some gates judge code that does not exist yet, so the first slice
(#63) could not build them. A gate with nothing to judge would pass over
nothing, so each one is a `dioxus.yml` step that fails once its code
appears:

| Deferred gate | Fails once this exists |
|---|---|
| The Dioxus build, the byte ceilings and their row check, and the CSP run with its Playwright fixture | `crates/app` |
| oxlint, oxfmt and the npm licence check | `crates/bridges/js` or `scripts/dioxus` |

**A deferred gate lands in the PR that brings in its code.** Neither half
can land alone: the code fails the deferred step, and the gate has
nothing to run against. That PR mixes gate files with code, so, like the
skeleton PR, it is titled `gates: …`, the path check fails on its code
files, and the maintainer reviews it by hand. Its body names the
deferred gate it builds and shows the gate's must-fail fixture failing.
It holds only the smallest code the gate needs, such as an `app` crate
that renders an empty shell. Everything after it lands under the normal
kinds. The `const` layout assertion waits in the same way, for `ui`'s
entry macro, but it is a compile-time check inside `ui` rather than a
CI step, so its `ui(…)` PR stays an ordinary `foundation` PR.

## Amended when the app gates were built

[Build the deferred anti-slop gates](https://github.com/boengai/csr-dev-tools/issues/70)
built the first row of the deferred table above on 2026-11-28, with the
first `crates/app`: an app that renders an empty shell, and an empty
ported-Tool list. That row now runs in `dioxus`: the Dioxus build, the
byte check with its row check, the CSP run with its fixture, and the
ported-Tool list reader. The second row, the TypeScript and npm licence
gates, still waits for `crates/bridges/js` or `scripts/dioxus`. The
`const` layout assertion still waits for `ui`'s entry macro, so the first
item of "Not verified" stands.

What building it found:

- **The specs import `test` from `@playwright/test`,** and a port never
  edits them, so no import can bring a fixture to them. The Dioxus
  Playwright config has its own tsconfig, which maps `@playwright/test` to
  the fixture (`e2e/parity/csp.ts`). The fixture imports the real module
  by its path. With its must-fail check unmarked, a run showed the fixture
  failing that check on its inline script.
- **The fixture listens on pages only.** A `securitypolicyviolation`
  inside a worker fires on the worker, and the fixture does not see it.
- **Page bytes are measured from the build, not by the perf harness.** A
  page's row is its HTML, the files the HTML loads and the main module
  (`docs/perf/budgets.md` → "CI on `develop`").
- **A module's file names the function it loads, not the loader's module
  name.** In dx 0.7.10 and `wasm-split-macro` 0.7.10, a `lazy_loader!`
  module is written as `module_<n>_<function>`, so a Tool's module is
  `module_<n>_HashGeneratorEntry`. Its row is keyed by that entry
  (`wasm:HashGeneratorEntry`, ADR-0035 §7's name), not by
  `hash_generator`. The spike's names carried a 32-hex suffix only because
  it split routes. This was read from the source; the first port sees it
  in a build.
- **Every shared chunk is named `chunk_<n>_split`,** and `<n>` can move
  between builds, so all chunks share one row, `wasm:chunks`. An empty app
  built with `--wasm-split` already emits one.
- **dx keeps old files in its output,** so the build empties it first.
- **The ported-Tool list is a `ported_tools![…]` invocation of string
  keys.** Its macro emits nothing yet. The routes and the Tool entry match
  come with the first `shell` PR, which brings in `ui` and the registry.
- **The first ceilings are a local macOS build's sizes, rounded up to the
  next KiB.** `dioxus` is a required check, so if the Linux build in CI
  does not fit them, this PR corrects them from the rows the CI log prints.
- **The 2% rule now covers `wasm:main` and `page:/`, measured from an
  empty shell.** The PR that first adds the router or `ui` to main will
  grow both by far more than 2%, and no PR kind lifts that limit. The
  maintainer decides what lets that PR through.

## Revisit when

- A gate fires falsely on most port PRs. Its rule is wrong, not the
  ports.
- The first ten ports have merged. Weigh an AI reviewer in CI then.
- rustfmt's import grouping becomes stable.
- A maintained tool finds unused `pub` items across crates.
- Dioxus 0.8 ships a stable release (ADR-0031). Recheck the `rsx!` lint
  behaviour, `dx fmt` and the disallowed paths.
