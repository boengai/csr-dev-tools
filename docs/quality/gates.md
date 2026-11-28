# Anti-slop gates

The mechanical checks that keep slop out of `develop`, decided in [What are the anti-slop gates?](https://github.com/boengai/csr-dev-tools/issues/25). Slop is code that passes the compiler but nobody chose deliberately. [ADR-0036](../adr/0036-mechanical-gates-keep-slop-out-of-develop.md) records why the gates have this shape. This page holds the lists, which are cheap to change. A change to them is a `gates` PR.

[Build the anti-slop gates](https://github.com/boengai/csr-dev-tools/issues/57) builds this page, with the workspace skeleton, before the first `port` or `shell` PR merges. Built so far: the root workspace, the lint files, the `gates` crate with its must-fail fixtures, `deny.toml`, `.jscpd.json`, both workflows, and, with the first `crates/app` ([Build the deferred anti-slop gates](https://github.com/boengai/csr-dev-tools/issues/70)), the Dioxus build, the byte check with its row check, the CSP run and the ported-Tool list reader. Still to build, with the code it judges: the TypeScript gates and the npm licence check (with `crates/bridges/js` or `scripts/dioxus`). Until then, their step in `dioxus.yml` fails once that code exists, rather than passing over nothing. The `const` layout assertion waits for `ui`'s entry macro.

## Scope

- **`crates/**`:** every gate below, from the first line. Its members, and the thin wrappers of split crates, are the *gated packages*. Every cargo-based gate runs over them by name (`-p`), never with `--workspace` or `--all`, so the untouched `wasm/` crates are left alone.
- **`crates/bridges/js/**` and `scripts/dioxus/**`:** oxlint and oxfmt, as for `src/`.
- **`wasm/crates/*`:** no gate while the crate is as it is on `main`. Its split PR holds the moved logic and the thin wrapper to every gate, and the wrapper is a gated package from then on.

## Required checks

Pull requests into `develop` need three checks: `ci` (React, shared with `main`), `dioxus` and `pr-body`. Neither new workflow has path filters.

### `dioxus` (`.github/workflows/dioxus.yml`, on `develop` only)

1. Formatting.
2. Clippy over the gated packages with `--all-targets`, for both `wasm32-unknown-unknown` and the host, with `-- -D warnings`. `build.warnings = "deny"` is not used: cargo warns about every `wasm/` crate's missing `[lints]` table, selected or not, and that setting would fail every run.
3. `cargo test` over the explicit package list, the `gates` crate included.
4. The must-fail fixtures.
5. cargo-deny, cargo-shear and jscpd.
6. cargo-mutants `--in-diff`.
7. oxlint and oxfmt over `crates/bridges/js` and `scripts/dioxus`, and the npm licence check.
8. The Dioxus build (`crates/gates/scripts/build-dioxus.sh`, dx with `--wasm-split`, into `dist-dioxus`), and the merge base's when it has an app; the byte check with the check that every ported Tool emits its own module; and the Playwright run under the post-migration CSP (`playwright.dioxus.config.ts`).

### `pr-body` (`.github/workflows/pr-body.yml`, on `develop` only)

It runs on `opened`, `edited`, `synchronize` and `reopened`, so editing the title or body never reruns `dioxus`. It holds two checks:

1. The path check: the PR's kind against the files it changes ("PR kinds"). It lives here, not in `dioxus`, because the kind comes from the title, and a retitled PR must be judged again.
2. The title and body. See "The PR body".

### Pinned tools

Each tool comes from `taiki-e/install-action`, pinned to a commit SHA, so it is installed against a checksum (ADR-0031, condition 3). The action has no manifest for jscpd or dx, so those two come from crates.io through its pinned `cargo-binstall` fallback, at an exact version but without the action's checksum. A manifest for either in the action is the fix.

| Tool | Version |
|---|---|
| cargo-deny | 0.22.1 |
| cargo-shear | 1.14.1 |
| cargo-mutants | 27.1.0 |
| jscpd | 5.4.3 |
| dx | 0.7.10 (ADR-0031) |

## Gate files

A gate file decides what CI accepts:

- the root `Cargo.toml` (`[workspace.lints]`, `[workspace.dependencies]`, members, profiles), `rust-toolchain.toml`, `clippy.toml`, `rustfmt.toml`, `deny.toml`, `.jscpd.json`;
- the `README.md` in `crates/logic`, `crates/tools` and `crates/workers`: cargo rejects a member glob that matches nothing, so each one keeps its glob matching until the first crate lands;
- `crates/gates/**`, with its fixtures;
- the byte-ceiling file that `docs/perf/budgets.md` describes (`docs/perf/byte-ceilings.json`), the a11y baseline (`e2e/parity/a11y-baseline.json`, [#41](https://github.com/boengai/csr-dev-tools/issues/41)), the post-migration CSP (`docs/quality/post-migration-csp.txt`), the CSP fixture (`e2e/parity/csp.ts`) with its must-fail check (`e2e/parity/csp.spec.ts`), and the tsconfig that hands it to every Dioxus spec (`e2e/tsconfig.dioxus.json`);
- `.github/workflows/**`, and the PR templates in `docs/quality/pr/`.

A `port` or `shell` PR may add rows for its own Tool to the ceiling file. Any other change to a gate file, raising a ceiling included, is a `gates` PR. A `gates` PR changes only gate files, `docs/quality/**` and the ADR that records it (see "PR kinds").

## Exemptions

- The only form is `#[expect(<lint>, reason = "<a sentence saying why>")]`, on the smallest item it covers.
- `#[allow]` is denied (`clippy::allow_attributes`).
- A crate-level `#![expect]` in a Tool crate fails the source rules.
- An `#[expect]` whose lint stops firing fails the build, so stale exemptions do not pile up.

## Lints

### `[workspace.lints]`

```toml
[workspace.lints.rust]
unsafe_code = "forbid"          # `#[expect]` cannot lift `forbid`; a `gates` PR changes it if `platform` needs unsafe
unreachable_pub = "deny"

[workspace.lints.clippy]
all = { level = "deny", priority = -1 }
pedantic = { level = "deny", priority = -1 }
# Pedantic exemptions. Add one only in a `gates` PR, with its reason.
must_use_candidate = "allow"     # noise: flags almost every pure function
missing_errors_doc = "allow"     # forces docs that restate the signature
missing_panics_doc = "allow"     # the same; panics are denied anyway
similar_names = "allow"          # noise in parsers and colour maths
# Panics: `wasm-release` aborts on a panic, and one panic kills the page.
unwrap_used = "deny"
expect_used = "deny"
panic = "deny"
todo = "deny"
unimplemented = "deny"
unwrap_in_result = "deny"
panic_in_result_fn = "deny"
string_slice = "deny"            # slicing a `str` panics inside an emoji
# Leftovers and swallowed results
dbg_macro = "deny"
print_stdout = "deny"
print_stderr = "deny"
let_underscore_must_use = "deny"
# Exemptions are `#[expect]` with a reason
allow_attributes = "deny"
allow_attributes_without_reason = "deny"
# One file per module, no `mod.rs`
mod_module_files = "deny"

[workspace.lints.cargo]
unused_dependencies = "deny"
```

Every gated member's manifest has `[lints] workspace = true`, and the `gates` crate checks it. A member cannot override a workspace level in its manifest. Cargo rejects that.

### Not denied, on purpose

- `indexing_slicing` and `arithmetic_side_effects`: too noisy in parsers, and the logic tests and mutation testing cover them.
- `missing_docs`: forcing comments produces comments that restate the code.
- `unreachable!`: allowed.
- `nursery` and `cargo`: off.
- `wildcard_imports` keeps its default exemption for `prelude::*` and for `use super::*` in tests.

### `clippy.toml`

```toml
too-many-lines-threshold = 80
allow-unwrap-in-tests = true
allow-expect-in-tests = true
allow-panic-in-tests = true
# `dbg!` stays denied in tests too (the default).

disallowed-methods = [
  { path = "dioxus_document::eval", reason = "no JavaScript outside an Engine bridge (ADR-0033)" },
  { path = "dioxus_document::Document::eval", reason = "the trait method misses the entry above" },
  # Raw browser types stay in `platform` (ADR-0035 §8):
  { path = "dioxus_web::WebEventExt::as_web_event", reason = "…" },
  { path = "dioxus_web::WebEventExt::try_as_web_event", reason = "…" },
  { path = "dioxus_web::WebFileExt::get_web_file", reason = "…" },
  { path = "dioxus_html::PlatformEventData::downcast_mut", reason = "…" },
  # and `dioxus_html::<T>::downcast` for PlatformEventData, TouchPoint and
  # each of the 21 event-data types: the full list is in clippy.toml.
  { path = "std::time::Instant::now", reason = "panics on wasm32-unknown-unknown; use platform's timers" },
  { path = "std::time::SystemTime::now", reason = "panics on wasm32-unknown-unknown; use platform's local time" },
  { path = "std::thread::spawn", reason = "panics on wasm32-unknown-unknown; use a worker (ADR-0033)" },
  { path = "std::thread::sleep", reason = "panics on wasm32-unknown-unknown; use platform's timers" },
]
```

Each entry is proven by the Clippy fixture (`crates/gates/fixtures/clippy`), through `dioxus`'s re-exports.

`platform` converts events with an `#[expect(clippy::disallowed_methods, reason = "…")]` at each call site. It has no `clippy.toml` of its own, because a nested one replaces the root one.

## Formatting

- **Stable rustfmt only.** `rustfmt.toml`:

  ```toml
  style_edition = "2024"
  use_field_init_shorthand = true
  newline_style = "Unix"
  ```

  `max_width` keeps its default. Imports are sorted within each block, which is the stable default, and are not grouped.
- **`rsx!` is formatted by `dx fmt`,** because rustfmt skips it.
- **CI runs, in order:**
  1. `dx fmt` in each crate that has `rsx!`;
  2. `cargo fmt` over the gated packages (`-p …`);
  3. `git diff --exit-code`.

  An `error` line in `dx fmt`'s output fails the job too. `dx fmt --check` is not used: it rewrites the files while it fails, and it ignores per-file errors.

## The `gates` crate

`crates/gates`, package `gates`, `publish = false`, is a test-only crate outside the nine layers. Nothing depends on it. It reads code with `syn` and `dioxus-rsx =0.7.10`, and manifests with `cargo_metadata` and `toml`.

### Manifests

- ADR-0035's layer allowlist, over normal, dev, build, target-specific, optional and renamed dependencies, and every crate's own `[features]` for anything that turns on `dioxus/web` (only `app` may). Internal edges follow ADR-0035's table, with logic → logic allowed, as `hash` shares `shared`'s digests today. Third-party crates: `persist` takes only `serde` and `serde_json`, `registry` nothing, `bridges` `wasm-bindgen` and `js-sys`, workers `wasm-bindgen`; `platform` takes `web-sys`, `js-sys`, `wasm-bindgen` and the Dioxus family, because it turns Dioxus events into its opaque types (ADR-0035 §8); `app`, `ui` and Tools take no browser crate directly; logic takes neither browser crates nor Dioxus. Package names follow the layer (`tool-<key>`, `logic-<name>`, `worker-<name>`).
- `dioxus-primitives` and `dioxus-motion` are denied by name for every gated member (ADR-0034). cargo-deny does not repeat the ban.
- ADR-0035's four-set check: the `crates/tools/*` directories, `app`'s Tool dependencies, the Ported Tool list, and the registry keys of those Tools.
- Every gated member sets `lints.workspace = true` and `license.workspace = true`, and takes each third-party dependency with `workspace = true`.
- Every `layoutOptOutAdr` in the registry names an ADR file that exists.

### Source rules

| Rule | From |
|---|---|
| No `class` or `style` prop, and no `extends = GlobalAttributes`, on a component or primitive in `ui` | ADR-0034 |
| No `style: "…"` string attribute, and no `style {}` element, in our own `rsx!` | ADR-0034 |
| No `#[component(lazy)]` | ADR-0035 |
| Exactly one Tool entry per Tool crate | ADR-0035 |
| No path from a Tool crate to `ui`'s app-only items (the dialog primitive, the modal frame): a Tool builds no dialog of its own | the React layout guard |
| A custom Tool uses no off-theme red or yellow text class (`text-(red\|yellow)-NNN`) | the React layout guard |
| A `#[component]` body is at most 80 lines | stands in for `too_many_lines`, which skips components |
| A source file is at most 300 lines, not counting its `#[cfg(test)]` module | ADR-0031's 360-line component |
| No commented-out code: a run of `//` lines that parses as Rust items or statements. Doc-comment examples are exempt | the map |
| `TODO`, `FIXME`, `XXX` and `HACK` name an issue, as in `TODO(#123)` | the map |
| No crate-level `#![expect]` in a Tool crate | "Exemptions" |
| No jscpd ignore comments | "Copied code" |
| `#[mutants::skip]` has a reason comment on the line above | "Tests" |

ADR-0034's "no style written from a timer or an animation-frame loop" has no mechanical check. The automated reviewer looks for it.

A Tool entry is an invocation of `wasm_split::lazy_loader!` or of `ui`'s entry macro, `tool_entry!`. The app-only items are found by name: `Dialog`, `dialog`, `ModalFrame` and `modal_frame` anywhere in a Tool crate, `rsx!` included.

### The layout guard

> A Tool entry returns the view of the shell its registry layout names. Only a `custom` Tool returns `ToolFrame`'s view, and its registry entry names the ADR that says why.

- `ToolView<L>` carries a layout marker. Each shell returns its own marker, and `ToolFrame` returns `Custom`.
- The `ui` entry macro emits a `const` assertion against the registry's layout for the key. The build then fails with, for example:

  > `hash-generator` is a `transformer` Tool in tool-routes.ts, so its entry must return `TransformerShell`'s view

### Must-fail fixtures

- Each custom check (the path check, the allowlist, each source rule, the ceiling check) has a committed fixture that must fail, under `crates/gates/fixtures/`. The `gates` crate's tests run each one and assert the failure, so `cargo test` in CI is the proof. The fixtures are kept out of the gated packages, `cargo fmt`, `dx fmt`, jscpd and the source-rule walk.
- The denied Clippy lints and the disallowed methods share one fixture crate (`crates/gates/fixtures/clippy`), with one violation each. `crates/gates/scripts/clippy-fixture.sh` checks that Clippy fails on it and that every line of its `expected.txt` appears in the output.

## Dependencies

- **Adding a crate is a `gates` PR.** It adds the allowlist row and the `[workspace.dependencies]` entry, and its body gives:
  - what the crate is for;
  - its licence and last release;
  - its brotli byte cost, from a scratch build.
- **Versions.**
  - The Dioxus family is pinned exactly (`=0.7.10`); everything else uses caret versions, with `Cargo.lock` as the pin.
  - Gated members use `workspace = true`.
  - `cargo update` is a PR of its own.
- **cargo-deny** (`deny.toml`):
  - **Duplicates:** `bans.multiple-versions = "deny"` over `app`'s tree, run with `--manifest-path crates/app/Cargo.toml`, because there they cost bytes. In each worker's tree they only warn.
  - **Which trees:** `app`'s and each worker's, never the untouched `wasm/` crates.
  - **Sources:** crates.io only. `unknown-git` and `unknown-registry` are denied.
  - **Licences:** allowed are MIT, Apache-2.0, Apache-2.0 WITH LLVM-exception, BSD-2-Clause, BSD-3-Clause, ISC, Zlib, 0BSD, CC0-1.0 and Unicode-3.0. Anything else, MPL-2.0 included, needs a per-crate exception with a reason.
  - **Advisories:** a vulnerability or an unsound crate fails. An unmaintained crate warns. An ignore entry is a `gates` PR with a reason.
- **Unused dependencies:** cargo's `unused_dependencies` lint, plus `cargo shear --deny-warnings` over the gated packages, which also catches what the lint misses.
- **npm:** `crates/bridges/js` is held to the same licence list, checked over `pnpm licenses list --json --prod`.

## Copied code

- **Settings:** jscpd 5.4.3 over `crates/**/*.rs`, not counting tests or `crates/registry/src/generated.rs`. It runs with `-f rust`, `min-tokens 70`, mild mode, `--exit-code`, and without `--ignore-identifiers`.
- **No baseline.** The count starts at zero clones and stays there.
- **The fix is to move the code down,** into `ui/kits` or a logic crate. A clone between Tools usually means a shell's API is missing something.
- **jscpd's ignore comments are banned** by the source rules.

## Tests

### A port PR includes

- **Logic tests:** every case in the Tool's React spec (`src/utils/*.spec.ts`) has a native Rust test in its logic crate, with the same input and the same expected output. The PR body maps each case to its test.
- **Its journeys on Dioxus:** the Tool is removed from the Dioxus spec filter (the `testMatch` and `grep` list in the Dioxus Playwright config that keeps unported Tools out of the Dioxus run, `docs/ux/parity.md`), so its React journeys run there unchanged. The contract suite and axe pick it up from the registry.
- **Saved inputs:** if the Tool saves input, its #38 golden values and its rows in `crates/registry/src/storage.rs`.
- **No new Playwright spec.** Specs come from `main` (`docs/ux/parity.md`).

### Mutation testing

- **The gate:** cargo-mutants 27.1.0 `--in-diff` against the merge base, on each changed logic crate and on `persist`. No mutant may survive on a changed line.
- **Not covered:** `ui` and the Tool crates, which need a browser.
- **`#[mutants::skip]`** needs a reason comment on the line above it.
- **A `split` PR** moves files with `git mv`, and the diff given to `--in-diff` is rename-aware (`git diff -M`). Only lines that really changed are judged. A whole-crate run is made once, as a report in the PR body. Its gaps become one follow-up issue per crate.
- **There is no coverage percentage.**

## CSP

- **The post-migration CSP** is a gate file (ADR-0033 Decision 6 and "Handed on"). The Dioxus Playwright project serves `dist-dioxus` with it, through `crates/gates/scripts/serve-dioxus.mjs`.
- **A shared fixture**, for the Dioxus project only, fails any test that sees a `securitypolicyviolation` event (`e2e/parity/csp.ts`). The specs import `test` from `@playwright/test` and are never edited, so the Dioxus config maps that import to the fixture through its own tsconfig (`e2e/tsconfig.dioxus.json`). It listens on every page of the test's context; a violation inside a worker fires on the worker, and it does not see that.
- **Its must-fail check** is `e2e/parity/csp.spec.ts`: a test that runs an inline script and is marked `test.fail()`, so the run fails if the fixture stops failing it. The other test checks that the server sends the CSP, so the must-fail test cannot pass on a page served without one.
- **It covers every journey,** not only those of Tools with an Engine bridge.

## Byte ceilings

These extend the byte check in `docs/perf/budgets.md` → "CI on `develop`". The same ceiling file and the same two limits apply: 2% over the base branch, and the committed ceiling. The ceiling file is a gate file, so raising a ceiling is a `gates` PR. Its rows are:

- each page (already in `budgets.md`);
- the main wasm module, and each Tool module, keyed by the loader's module name (`hash_generator`), not the file hash;
- each Engine bridge's JS file;
- each worker's wasm and JS files, measured from the build output, because the perf harness skips requests made inside workers.

The PR that first ships a file sets its row.

- **Measuring.** `crates/gates/scripts/measure-bytes.mjs` reads the build: each file's brotli size (quality 11), and the same-origin files each page's HTML loads. The `gates` crate (`bytes.rs`) makes the rows from it.
- **Row keys.** `page:<route>` (the HTML, the files it loads, and the main module), `wasm:main`, `wasm:<module>` for each loader's module, and `wasm:chunk:<name>` for code wasm-split shares between modules. A wasm or JS file that fits none of these and that no page loads fails the check: its kind of row, a bridge or worker file, is added in a `gates` PR with the first such file.
- **The checks.** A measured row with no ceiling fails, and so does a ceiling with no file. Every ported Tool must have its own `wasm:<module>` row, or its code landed in main. They run in `dioxus` (`tests/bytes.rs`, `byte_check`), and the fixtures in `crates/gates/fixtures/bytes/` must fail them.
- **The row check.** It runs in `pr-body`, next to the path check, which sees only that the ceiling file changed. A `port` or `shell` PR may only add rows for its own Tool (`page:/tools/<key>`, `wasm:<module>`). Changing or removing a row is a `gates` PR.

## PR kinds

The title starts with the kind. The path check fails a PR that changes a file outside its kind's set. `Cargo.lock` may change in any kind except `docs`.

| Kind | Title | May change |
|---|---|---|
| `port` | `port(<key>): …` | `crates/tools/<key>/**`; logic it adds for that Tool in `crates/logic/<name>/**` (never a change to logic another ported Tool already uses); one line each in `crates/app/Cargo.toml` and the Ported Tool list; that Tool's new rows in the ceiling file, `storage.rs` and the #38 goldens; its line in the Dioxus spec filter |
| `split` | `split(<crate>): …` | `crates/logic/<name>/**` and `wasm/crates/<name>/**` |
| `shell` | `shell(<layout>): …` | one shell and the `ui` parts only it needs, under `crates/ui/**`, plus one Tool's `port` set |
| `foundation` | `ui(…)`, `platform(…)`, `bridge(…)`, `persist(…)`, `registry(…)`, `worker(…)`, `app(…)`, `logic(…)` | one primitive, kit, capability, bridge or part, in that crate; `crates/app/Cargo.toml`; the root `Cargo.toml` only to add that crate as a workspace member, when that is its only change (the PR that brings in `crates/ui`, `crates/app` and the other single crates); for a bridge, `crates/bridges/js/**`; for the registry generator, `scripts/dioxus/**`. Never a Tool crate |
| `gates` | `gates: …` | gate files, `docs/quality/**`, and an ADR that records the change; or `Cargo.lock` alone, for `cargo update` |
| `docs` | `docs: …` | `docs/**` except `docs/quality/**`, plus `CONTEXT.md`, `CONTRIBUTING.md`, `CLAUDE.md` and `.claude/**` |
| `sync` | `chore: sync main into develop …` | anything, as a merge commit from `main` |

- **No hard cap on lines.** A CI warning, not a failure, shows above 1,000 changed lines, not counting generated files and lockfiles.
- **Hand-reviewed `gates` PRs.** The path check and the mixing rule cannot judge two kinds of PR, so the maintainer reviews them by hand. Both are titled `gates: …`, and the path check is expected to fail on their code files.
  - **The workspace skeleton PR,** which added the gates themselves along with the first crates ([#63](https://github.com/boengai/csr-dev-tools/pull/63)).
  - **A PR that brings in a deferred gate with the code it judges** (ADR-0036 → "Amended when the gates were built"). The Dioxus build, byte and CSP gates come with the first `crates/app`, and the TypeScript and npm licence gates come with the first `crates/bridges/js` or `scripts/dioxus`. It holds only the smallest code the gate needs, and its body shows the gate's must-fail fixture failing.

## The PR body

There is one template per kind in `docs/quality/pr/`, except `sync`, which needs only its title. Agents open PRs with `gh pr create --base develop --body-file docs/quality/pr/<kind>.md`, after filling the template in.

`pr-body` checks:

- **the title's kind prefix,** and for `sync`, that the PR comes from `main`, or from a branch that brings `main` commits the base lacks (a sync with conflicts to resolve);
- **nothing inside an HTML comment counts,** since GitHub hides it;
- **the kind's required headings** (each template's `##` headings);
- **for `port` and `shell`:** a filled case-mapping table;
- **for every kind but `sync`:** a non-empty `## Automated review`;
- **that every box in the template's `## Hand check` is in the body, ticked.** The maintainer ticks them as the last step before merging, and agents never tick them. This is a reminder, not a guarantee.

## Review

### The automated reviewer

- **When:** the agent that wrote the PR runs the `code-review` skill (Standards and Spec) against `develop` before opening it, and fixes what it can.
- **Recorded:** each finding and its outcome (fixed, or why not) goes under `## Automated review`.
- **What it looks for**, beyond the gates:
  - comments that restate the code;
  - names that say nothing;
  - options, parameters and branches added "in case";
  - `#[expect]` reasons that say nothing;
  - style written from a timer or an animation-frame loop (ADR-0034);
  - error paths that reach a toast or a panic instead of the status slot;
  - a case-mapping table that does not match the React spec;
  - code that does not do what the issue or ADR asked.

No AI reviewer runs in CI. That is revisited after the first ten ports.

### The maintainer

- **Only the maintainer merges into `develop`.** Agents never merge, not even `sync` PRs.
- **Before merging, the maintainer checks:**
  - the hand check in `docs/ux/parity.md` → "The reviewer's hand check": side by side with `main` in GPU Chrome, at desktop and phone width; the golden path and one error case; and how it feels;
  - every new `#[expect]` reason;
  - every gate-file change and every new dependency;
  - the `## Automated review` section;
  - one read of the diff, asking of each new item: "would I have chosen this?"

## Definition of done for a ported Tool

A Tool is ported when all of these hold on `develop`:

1. **The crate.** `crates/tools/<key>` exists, with one Tool entry. The entry returns the view of the shell its registry layout names. A `custom` Tool returns `ToolFrame`'s view, and its registry entry names an ADR that exists.
2. **The logic.** It lives in logic crates. Every React spec case has a Rust test with the same input and expected output, and no mutant survives on a line the port changed.
3. **The gates.** `dioxus` and `pr-body` pass. The only exemptions are `#[expect]`s whose reasons the maintainer accepted.
4. **The browser checks.**
   - Its React journeys run unchanged on Dioxus, with no retries.
   - The contract suite and axe add no failure beyond the a11y baseline.
   - The CSP fixture sees no violation.
5. **Saved inputs.** If the Tool saves input, its #38 golden values pass and its keys are in `storage.rs`.
6. **Bytes.** Its page and module rows are in the ceiling file.
7. **The page.** Its head-stamped page is built at `dist-dioxus/tools/<key>/index.html`.
8. **Review.** The automated review is recorded in the PR. The maintainer did the hand check and ticked its boxes.
9. **The merge.** It landed as one squash-merged `port(<key>)` PR (or as a `shell` PR's proof Tool), merged by the maintainer.
