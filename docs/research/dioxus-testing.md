# How are Dioxus apps tested?

Ticket: boengai/csr-dev-tools#13. Target: Dioxus 0.7.10 (tag SHA `57d6794a`), with 0.8.0-alpha.3 (SHA `cb278323`) differences flagged. Researched 2026-11-25.

## Answer

There is no Testing-Library equivalent. The 0.7 guide documents three methods:
- `dioxus_ssr` render-to-string comparisons.
- Hand-driven `VirtualDom` tests, under the statement "Dioxus does not currently have a full hook testing library".
- Playwright against `dx serve` / `dx run`.

The Dioxus and DioxusLabs/components repos follow that split. Native tests fire events by numeric `ElementId` and assert on mutations or SSR HTML. Real browser behaviour is covered by Playwright (components: 3 browsers). Neither repo has a `wasm-bindgen-test` component test.

Existing Playwright specs carry over only if the port reproduces their DOM contract. The config must change.

The layout-shell rule can be enforced at compile time. Use a registry enum, compiled and checked locally. Add `clippy.toml` `disallowed-methods`, which fires through `rsx!`, and a native registry test.

Gates:
- Clippy `restriction` lints chosen one by one, with `-D warnings`.
- `dx check`, `dx fmt --check`.
- `cargo-deny`, plus `[lints.cargo] unused_dependencies` (stable since Rust 1.100).

In CI, native tests take 1–3 min on standard GitHub runners. Playwright dominates: components runs about 4–5 min per shard of about 89 tests.

## Findings

### 1. Component testing: what each approach can assert

**SSR string comparison (the documented approach).** The 0.7 guide says to "use a combination of pretty-assertions and dioxus-ssr to check that two snippets of rsx are equal". Its example renders two `Element`s with `dioxus_ssr::render_element` and calls `pretty_assertions::assert_str_eq!` ([docsite web.md](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/docs-src/0.7/src/guides/testing/web.md); rendered at [dioxuslabs.com/learn/0.7/guides/testing/web](https://dioxuslabs.com/learn/0.7/guides/testing/web)).
- `dioxus-ssr` exposes `render_element(Element) -> String` and `render(&VirtualDom) -> String` ([ssr/src/lib.rs L17–L31](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/ssr/src/lib.rs#L17-L31)).
- On its own this asserts markup only.

**Driving a `VirtualDom` natively, then rendering or inspecting it.** Public API in 0.7.10 ([core/src/virtual_dom.rs](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/core/src/virtual_dom.rs)):
- `new_with_props` (L286), `mark_dirty(ScopeId)` (L395), `async wait_for_work` (L445), `process_events` (L494).
- `rebuild_in_place` (L544), `rebuild_to_vec` (L549), `render_immediate` (L599), `render_immediate_to_vec` (L628), `async wait_for_suspense` (L641).
- Events are injected with `dom.runtime().handle_event("click", event, ElementId(n))` ([runtime.rs L369](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/core/src/runtime.rs#L369)).

What this can assert:
- **Clicks and propagation.** [core/tests/event_propagation.rs](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/core/tests/event_propagation.rs) sets `set_event_converter(Box::new(dioxus::html::SerializedHtmlEventConverter))`, builds a `SerializedMouseData` event, dispatches it to `ElementId(1)` and `ElementId(2)`, and asserts on a counter and on `stop_propagation`.
- **Async work.** [core-macro/tests/values_memoize_in_place.rs](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/core-macro/tests/values_memoize_in_place.rs) interleaves `handle_event`, `wait_for_work` and `render_immediate` in `async` tests.
- **Effects, then markup.** [router/tests/via_ssr/navigation.rs](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/router/tests/via_ssr/navigation.rs) calls `rebuild_in_place`, lets a `use_effect` navigate, calls `render_immediate`, then asserts `dioxus_ssr::render(&vdom) == "Other"`.
- **Mutation streams.** [signals/tests/create.rs](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/signals/tests/create.rs) asserts the exact `Mutation::CreateTextNode { id: ElementId(i+1) }` edits "without introducing a dependency on a renderer".
- **Event then rendered markup: verified locally.** I wrote a scratch crate on dioxus 0.7.10 with a `use_signal` counter button. The test called `rebuild_in_place`, then `handle_event("click", …, ElementId(1))`, then `render_immediate(&mut NoOpMutations)`, then `dioxus_ssr::render(&dom)`, and got `<button aria-label="Increment">Count 1</button><p data-slot="tool-status">1</p>`. It needed `dioxus-html` with `features = ["serialize"]` for `SerializedHtmlEventConverter` and `SerializedMouseData`.

Limits:
- **No element queries.** There is no role, label or text query. Events target a raw numeric `ElementId`, which the test has to know or derive from mutations. No first-party helper maps a selector to an `ElementId`.
- **No DOM.** There is no layout, focus or browser API. `localStorage`, clipboard and CodeMirror do not exist natively.
- Repo-wide: no first-party test combines `handle_event` with an assertion on the `dioxus_ssr::render` output. That pattern was verified only by my probe.

**Browser runner (`wasm-bindgen-test`).**
- `dioxus-web` lists `wasm-bindgen-test = "0.3.50"` in `[dev-dependencies]` ([web/Cargo.toml L120](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/web/Cargo.toml#L120)). A grep of every `.rs` file under `packages/` and `examples/` at v0.7.10 finds no `wasm_bindgen_test` use.
- At 0.8.0-alpha.3 the only use is `packages/logger/src/wasm/tests.rs`, which tests console capture, not components.
- How the runner works: `wasm_bindgen_test_configure!(run_in_browser)` forces browser execution ("Note that this will ignore any environment variable set"). You run it with `wasm-pack test --headless --chrome --firefox --safari`, or with `cargo test --target wasm32-unknown-unknown` plus browser env vars. WebDriver is found through `CHROMEDRIVER` / `GECKODRIVER` / `SAFARIDRIVER` or `$PATH` ([wasm-bindgen guide: headless browsers](https://wasm-bindgen.github.io/wasm-bindgen/wasm-bindgen-test/browsers.html)). The runner is set with `[target.wasm32-unknown-unknown] runner = 'wasm-bindgen-test-runner'`, and `wasm-bindgen-cli` must match the `wasm-bindgen` version in `Cargo.toml` ([usage](https://wasm-bindgen.github.io/wasm-bindgen/wasm-bindgen-test/usage.html)).
- Mounting a Dioxus app into a test-owned element: the API exists, but there is no first-party example. `dioxus_web::Config::rootelement(web_sys::Element)` ([web/src/cfg.rs L64](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/web/src/cfg.rs#L64)) and `dioxus_web::run(VirtualDom, Config) -> !` ([web/src/lib.rs L53](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/web/src/lib.rs#L53)) suggest it is possible.

**Testing-Library-like crates.** None first-party: the 0.7.10 `packages/` list has no such crate. A crates.io search for "dioxus test" and "dioxus testing" (2026-11-25) returned only low-download third-party crates (the `falsegreen-ui-*` family, ≤168 downloads, v0.1.0). I did not evaluate them.

**What DioxusLabs/components does** (SHA `09d6a913`):
- 32 Playwright specs in [`playwright/`](https://github.com/DioxusLabs/components/tree/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/playwright). They run against `dx run --web --release` of the `preview` app on chromium, firefox and webkit ([playwright.config.ts](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/playwright/playwright.config.ts)).
- Specs select by role and accessible name, plus `data-state` attributes, e.g. `getByRole('checkbox', { name: 'Demo Checkbox' })` then `toHaveAttribute('data-state', 'checked')` ([checkbox.spec.ts](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/playwright/checkbox.spec.ts)).
- Rust `#[test]`s exist in 13 files. Most are pure logic: attribute merging, text search, pointer and selection maths (e.g. [primitives/src/lib.rs](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/lib.rs)).
- A few render components natively and assert on markup. For example, [primitives/src/date_picker.rs L1417–L1440](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/date_picker.rs#L1417-L1440) does `VirtualDom::new(ControlledDatePicker); dom.rebuild_in_place(); let html = dioxus_ssr::render(&dom);` and then `assert!(html.contains("2026"))`. `calendar.rs` has similar tests.
- No components test dispatches events natively. Interaction is tested only in Playwright.
- CI runs `cargo test --workspace` natively ([main.yml](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/.github/workflows/main.yml)). It also installs Firefox in that job; I could not find a test that needs it.

### 2. Hooks and signals

The current statement, verbatim from the 0.7 docs source ([docsite web.md](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/docs-src/0.7/src/guides/testing/web.md)):

> Dioxus does not currently have a full hook testing library, but you can build a bespoke testing framework by manually driving the virtual dom.

How the documented harness works:
- `test_hook(initialize, check, final_check)` wraps the hook in a mock component built with `VirtualDom::new_with_props`.
- It calls `rebuild_in_place()`, then loops `while vdom.wait_for_work().now_or_never().is_some() { vdom.render_immediate(&mut NoOpMutations); }`.
- A `MockProxy` exposes `dioxus::core::generation()` and `dioxus::core::schedule_update()` so the check closure can assert per render pass.
- Source: [dioxuslabs.com/learn/0.7/guides/testing/web](https://dioxuslabs.com/learn/0.7/guides/testing/web).

The Dioxus repo tests its own hooks the same way:
- [hooks/tests/memo.rs](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/hooks/tests/memo.rs) is a `#[tokio::test]` that mounts an app using `use_signal_sync` and `use_memo`, asserts inside render, and branches on `generation()`.
- Signals are tested inside a `VirtualDom` ([signals/tests/](https://github.com/DioxusLabs/dioxus/tree/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/signals/tests)).

The docs' testing index only adds "Rust has built in support for testing using `cargo test`" for unit tests ([index.md](https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/docs-src/0.7/src/guides/testing/index.md)). The `ci.md`, `desktop.md` and `docker.md` testing pages in docsite are 0 bytes and commented out of `SUMMARY.md`.

### 3. Can the existing Playwright suite run against a Dioxus build?

**Config: must change.**
- [playwright.config.ts](../../playwright.config.ts) starts `pnpm dev` on `http://localhost:5173` and sets no `webServer.timeout`. Playwright's default is "60000" ms ([Playwright webServer](https://playwright.dev/docs/test-webserver)).
- The Dioxus guide shows `command: 'dx serve'`, `port: 8080`, `timeout: 10 * 60 * 1000`.
- The Dioxus repo uses `dx run --force-sequential --web --addr 127.0.0.1 --port <n>` per project ([playwright-tests/playwright.config.js](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/playwright-tests/playwright.config.js)).
- components uses `dx run --web --release` with `timeout: 50 * 60 * 1000`.
- Inference from those 10–50 min timeouts: a cold Rust-to-wasm build under `webServer` will not fit Playwright's 60 s default. Alternatively, serve a pre-built `dx build` output statically.

**Specs: portable only if the DOM contract is reproduced.** Selector use across `e2e/` (grep counts): `locator(` 371, `getByRole` 212, `getByText` 152, `getByLabel` 94, `getByTestId` 84, `getByPlaceholder` 30. The specs depend on these ([e2e/helpers/selectors.ts](../../e2e/helpers/selectors.ts), [e2e/layout-journeys.spec.ts](../../e2e/layout-journeys.spec.ts), [e2e/encoding-tools.spec.ts](../../e2e/encoding-tools.spec.ts)):
- **Tool surface and status:**
  - `[role="dialog"], [data-slot="tool-surface"]` (last match).
  - `[data-slot="tool-status"]` containing `role=alert`.
  - `[data-slot="tool-output"]`, `[data-slot="empty-state"]`.
  - `pre[data-has-value]` for output present.
- **CodeMirror DOM:** `.cm-content`, filled with click, then `Meta+A`, then `keyboard.insertText`. The contract helper also imports `EditorView` from `@codemirror/view`. If the port replaces CodeMirror, every `codeInputIn.fill` and `.cm-content` locator breaks.
- **Form structure:** `fieldset` filtered by `label:text-is("<Label>")` then `input` / `textarea` / `button`.
- **Accessible names and text:**
  - `getByLabel('Copy <x> to clipboard')`, `getByLabel('Toggle navigation')`, `getByLabel('Search tools')`.
  - `nav[aria-label="Tool navigation"]`, `getByPlaceholder('Search tools...')`, `getByRole('listbox' | 'option')`.
  - Mode buttons by name with `aria-pressed`.
  - `getByRole('heading', { level: 1 })`.
  - Toast text `Copied to clipboard`.
- **Test ids:** `code-input-<name>` and others.
- **Routes and state:**
  - Routes `/tools/<key>` and `?mode=` query handling.
  - localStorage key `csr-dev-tools-timezone-favorites` (e2e/timezone-converter.spec.ts).
  - `navigator.clipboard.readText()`.
- **Timeouts:** 2–15 s (`timeout: 5000` ×210, `3000` ×117).

Dioxus can emit all of this:
- rsx writes typed `aria_*` attributes ([html/src/attribute_groups.rs](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/html/src/attribute_groups.rs)) and quoted custom attributes such as `"data-custom-attribute": "value"` ([examples/09-reference/spread.rs](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/examples/09-reference/spread.rs)).
- My probe rendered `aria-label` and `data-slot` as written.
- The web renderer adds `data-dioxus-id` to the root (`core.ts` L48) and to every element that gets an event listener (`new_event_listener` in [interpreter/src/unified_bindings.rs L78–L84](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/interpreter/src/unified_bindings.rs#L78-L84)). It removes the attribute when the listener goes. That is harmless for role and label selectors but would break exact-HTML snapshots.

**Waits.**
- **Client-rendered pages:** Dioxus's own `web.spec.js` uses no explicit wait. Playwright's auto-waiting `expect(...).toContainText` covers the wasm load ([web.spec.js](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/playwright-tests/web.spec.js)).
- **components:** 9 of 32 specs use `waitUntil: 'networkidle'` (some with a 20-minute `goto` timeout); the rest rely on auto-waiting assertions ([checkbox.spec.ts](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/playwright/checkbox.spec.ts)).
- **Prerendered + hydrated pages:** Dioxus's own tests use `waitUntil: "networkidle"` ([fullstack.spec.js](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/playwright-tests/fullstack.spec.js)) or a fixed `await page.waitForTimeout(2000); // give time for the page to load and hydrate` ([fullstack-hydration-order.spec.js](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/playwright-tests/fullstack-hydration-order.spec.js)).
- **No hydration-complete signal found:** `packages/web/src` and `packages/interpreter/src` dispatch only `resize` and `visible` CustomEvents. That matters because prerendered HTML looks interactive before hydration, so a click can land before listeners attach.
- One candidate readiness marker (an inference, not a documented contract): `BaseInterpreter.initialize` sets `data-dioxus-id="0"` on the root element.

### 4. Enforcing "every tool is built from a layout shell" in Rust

What the current guard checks, all by regex over source ([src/test/layout-guard.spec.ts](../../src/test/layout-guard.spec.ts)):
- (a) every route has a source module;
- (b) `custom` tools cite an existing `docs/adr/NNNN-*` file;
- (c) `layoutOptOutAdr` appears only on `custom` tools;
- (d) a pending-migration ratchet;
- (e) migrated tools render `<XShell` and no `ToolDialogFrame|UploadDialogFrame|ToolDialogShell`;
- (f) `custom` tools have no `<ErrorBanner` and no `text-(red|yellow)-NNN`;
- (g) `docs/ux/<layout>.md` exists per layout.

The contract specs then render every registry tool under jsdom and drive it ([layout-contract.tsx](../../src/test/layout-contract.tsx)).

Rust options:

1. **Make it unrepresentable (type system).** Verified in a local probe crate (dioxus 0.7.10).
   - The registry is a `static TOOLS: &[ToolDef]` where `layout` is an enum. Each non-custom variant carries only data and pure functions, e.g. `Transformer { transform: fn(&str) -> Result<String, String>, … }`. Only `Custom { adr: &'static str, component: Component }` carries a component.
   - The route renders the shell from the variant, so a non-custom tool never writes its own layout. That makes (c) and (e) impossible to violate.
   - A Dioxus `Component<P = ()>` is `fn(P) -> Element` ([core/src/lib.rs L92](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/core/src/lib.rs#L92)). That means `fn(()) -> Element`, which does **not** accept a zero-prop `fn Counter() -> Element`; the probe failed with E0308.
   - What worked: a field typed `fn() -> Element` in a `static TOOLS: &[ToolDef]`. The custom tool is mounted with `DynamicNode::Component(VComponent::new(component, (), "CustomTool"))`, where `VComponent::new` takes `impl ComponentFunction<P, M>` ([core/src/nodes.rs L554](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/core/src/nodes.rs#L554)).
   - Calling `component()` directly inside `dioxus_ssr::render_element` panicked at `dioxus-core/src/runtime.rs:100`.
   - A test looping over `TOOLS` with `dioxus_ssr::render_element(render_tool(def))` rendered both the shell-built tool and the custom tool.
   - Check (a), "a module exists for every tool", becomes a compile-time property: each entry references a function, so a missing module does not compile.
   - An exhaustive `match` on the enum forces every new layout to be handled ([Rust reference: match expressions](https://doc.rust-lang.org/reference/expressions/match-expr.html)).
   - If shells live in their own crate, a sealed trait ("Some traits are only meant to be implemented within the crate that defines them"; [API guidelines C-SEALED](https://rust-lang.github.io/api-guidelines/future-proofing.html)) or module privacy can stop tool crates from defining new shells or frames. Sealing works only across crate boundaries.
2. **Clippy `disallowed-methods` / `disallowed-types`** ([lint configuration](https://doc.rust-lang.org/clippy/lint_configuration.html); `disallowed_methods` is a `style` lint, "warn" by default, and "will only trigger if methods are defined in the clippy.toml file" ([lint list](https://clippy.rust-lang.org/master/index.html))).
   - Verified locally (clippy 0.1.100, dioxus 0.7.10): with `disallowed-methods = [{ path = "probe::HandBuiltFrame", reason = "use a layout shell" }]`, using `HandBuiltFrame { "x" }` inside `rsx!` raised `warning: use of a disallowed method probe::HandBuiltFrame` at the call site.
   - `disallowed-types` on the generated `HandBuiltFrameProps` also fired, but at the component's own definition and inside the `#[component]` expansion. That is noisy, so prefer `disallowed-methods`.
   - This covers (e) and (f) for component names. Gate it with `cargo clippy -- -D warnings`, and `#[allow]` it only inside the shell modules.
3. **Native `#[test]` over the registry.** Covers (b), (c), (d) and (g):
   - Iterate `TOOLS` and check ADR and docs files with `std::fs` relative to `env!("CARGO_MANIFEST_DIR")` ([Cargo env vars](https://doc.rust-lang.org/cargo/reference/environment-variables.html)).
   - Keep the ratchet as a `const PENDING: &[&str]` compared against the registry.
   - The regex source-scan checks (`text-red-400`) can also stay as a test that reads `src/tools/**/*.rs`.
4. **`build.rs`.** A build script can scan sources and fail the build. "Scripts should exit with a non-zero exit code to halt the build", and `cargo::error=MESSAGE` "tell[s] Cargo to display an error … and then fail the build" (MSRV 1.84). `cargo::rerun-if-changed` limits reruns ([build scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html)). It can also generate the registry from a directory listing. This is heavier than a test, and it runs on every build.
5. **Custom lint (dylint).** Dylint runs "Rust lints from dynamic libraries". Lints implement `LateLintPass`, are scaffolded with `cargo dylint new`, and run with `cargo dylint --all` ([dylint README](https://github.com/trailofbits/dylint)). The example lint libraries pin a nightly with `rustc-dev` (`channel = "nightly-2026-08-20"`, [examples/general/rust-toolchain.toml](https://github.com/trailofbits/dylint/blob/master/examples/general/rust-toolchain.toml)). It is the most powerful option and the most expensive to maintain; option 2 covers the same ground for name-based rules.
6. **Replacing the contract specs.** Natively, `VirtualDom` + `dioxus_ssr::render` can assert static structure per registry tool: the `data-slot`s and the empty state. Behaviour that needs localStorage seeding, typing into CodeMirror, or role queries needs a browser. That means Playwright looping over a route list exported from the registry, or an unproven `wasm-bindgen-test` harness.

### 5. Strictness lints and tools

- **Lint configuration in Cargo.toml.** `[lints.rust]` / `[lints.clippy]` / `[lints.cargo]` set levels (`forbid | deny | warn | allow`) with an optional `priority`. Respected as of 1.74 ([manifest: lints](https://doc.rust-lang.org/cargo/reference/manifest.html#the-lints-section)). `[workspace.lints]` plus `[lints] workspace = true` inherits them across crates ([workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html)).
- **Clippy groups** ([lints](https://doc.rust-lang.org/clippy/lints.html)):
  - `pedantic`: "expect to also use `#[allow]` attributes generously". The docs suggest cherry-picking.
  - `restriction`: "It is **not** recommended to enable the whole group", and Clippy warns on `#![warn(clippy::restriction)]`.
  - `nursery`: "buggy or need more work".
- **Restriction lints worth cherry-picking** ([lint list](https://clippy.rust-lang.org/master/index.html)), all allow-by-default:
  - `unwrap_used`, `expect_used`, `panic`, `todo`, `unimplemented`, `dbg_macro`, `print_stdout`, `indexing_slicing`.
  - `missing_panics_doc` is `pedantic`.
  - `clippy.toml` can exempt tests: `allow-unwrap-in-tests`, `allow-expect-in-tests`, `allow-panic-in-tests`, `allow-dbg-in-tests`, `allow-print-in-tests` (all default `false`) ([lint configuration](https://doc.rust-lang.org/clippy/lint_configuration.html)).
- **What Dioxus itself gates on.**
  - CI runs `cargo clippy --workspace --examples --tests --all-features --all-targets -- -D warnings` and `cargo fmt --all -- --check` ([main.yml L110–L113](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/.github/workflows/main.yml#L110-L113)). The repo has no `clippy.toml` and no `[workspace.lints]` at v0.7.10.
  - components runs the same clippy command.
- **Dioxus-specific gates.**
  - `dx check` reports `HookInsideConditional`, `HookInsideLoop`, `HookInsideClosure`, `HookInsideAsync` and `HookOutsideComponent`, and exits non-zero when it finds issues ([cli/src/check/issues.rs L164](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/cli/src/check/issues.rs#L164); [cli/src/cli/check.rs](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/cli/src/cli/check.rs)).
  - `dx fmt --check` "Exits with 0 if input is formatted correctly. Exits with 1 and prints a diff" ([cli/src/cli/autoformat.rs](https://github.com/DioxusLabs/dioxus/blob/57d6794ad60b949e5bd8aa282f6f8c3dc97a365e/packages/cli/src/cli/autoformat.rs)); its doc comment is "Format some rsx". Whether plain `rustfmt` leaves `rsx!` bodies untouched was not verified.
- **`cargo-deny`** covers advisories, bans, licenses and sources. Run it with `cargo deny init && cargo deny check`; the GitHub Action is `EmbarkStudios/cargo-deny-action` ([cargo-deny book](https://embarkstudios.github.io/cargo-deny/)).
- **Unused dependencies.**
  - Cargo's own lint `unused_dependencies` ("Checks for dependencies that are not used by any of the cargo targets", style, warn) can be set to `deny` under `[lints.cargo]` ([Cargo lints](https://doc.rust-lang.org/cargo/reference/lints.html)). "Cargo's linting system and the `[lints.cargo]` table have been stabilized in Rust 1.100" ([unstable features page](https://doc.rust-lang.org/cargo/reference/unstable.html)). Local rustc is 1.100.0 (2026-11-09).
  - `cargo-machete` is "fast (yet imprecise)", runs on stable, and has an Action `bnjbvr/cargo-machete` ([README](https://github.com/bnjbvr/cargo-machete)).
  - `cargo-udeps` must run on nightly (`cargo +nightly udeps`) ([README](https://github.com/est31/cargo-udeps)).
- **`cargo-semver-checks`** ("Scan your Rust crate for semver violations", [README](https://github.com/obi1kenobi/cargo-semver-checks)) checks a published library's public API against a baseline. It is irrelevant to an unpublished binary site.

### 6. Run times and CI practicality

All figures are wall-clock from GitHub Actions job timestamps.
- **DioxusLabs/components, 0.7.9 CLI, standard `ubuntu-latest`** ([run 45493622400](https://github.com/DioxusLabs/components/actions/runs/45493622400), [run 45493622434](https://github.com/DioxusLabs/components/actions/runs/45493622434), 2026-11-24, Rust cache "full match: true"):
  - Playwright, 4 shards × ~89 tests (3 browsers, 1 worker): about 6 min per job. The "Run Playwright tests" step took 4–5 min, which includes the `dx run --web --release` build. Logs show "88 passed (5.0m)" and "88 passed (4.0m)".
  - `cargo test --workspace`: 94 s step, about 3 min job.
  - Clippy: about 2 min 15 s.
  - `cargo check` and `cargo doc`: about 11 min each.
- **Dioxus main CI** ([run 45418010664](https://github.com/DioxusLabs/dioxus/actions/runs/45418010664), 2026-11-24). Caveat: this is `main` (the 0.8 line) on larger `warp-ubuntu-latest-x64-8x` / `4x` runners, not standard GitHub runners, so the times do not transfer directly.
  - Playwright Linux: about 11.5 min.
  - "Test \| Linux" (`cargo test --workspace`): about 6 min.
  - Clippy/fmt/msrv: about 8 min.
- **Local probe** (Apple Silicon, dioxus 0.7.10 with minimal features `macro, html, hooks, signals`):
  - A first `cargo test` compiled all dependencies in 13.6 s wall-clock, then failed on a missing feature.
  - After adding `dioxus-html/serialize`, the rebuild and test run took 4.2 s.
  - A no-change rerun took 0.12 s.
  - Each test reports `finished in 0.00s`. These are tiny-crate numbers, not a forecast for 84 tools.
- **This repo today:** a single 15-minute-timeout job runs the wasm build, `cargo test`, lint, vitest, `vite build` and Playwright on Chromium only, with `workers: 1` and `retries: 2` in CI ([.github/workflows/ci.yml](../../.github/workflows/ci.yml), playwright.config.ts).

### 7. 0.8 alpha differences (v0.8.0-alpha.3)

- **`VirtualDom` writer type.** `rebuild` and `render_immediate` now take `&mut impl crate::MultiWriter` instead of `impl WriteMutations`. Any `WriteMutations`, including `NoOpMutations`, implements `MultiWriter` through a blanket impl (`packages/core/src/mutations.rs` L266 at `cb278323`), so the documented harness should still compile.
- **`dioxus-ssr` API.** `pre_render` and `Renderer::reset_hydration` are removed. `render` and `render_element` remain.
- **New internal crate.** `dioxus-renderer-oracle` ("A fast oracle renderer for validating Dioxus VirtualDom mutations") is `publish = false`, so it is not usable downstream.
- **Native renderer.** alpha.1 adds "a way to create synthetic click events for testing" for Dioxus Native/Blitz (#5658, [release notes](https://github.com/DioxusLabs/dioxus/releases/tag/v0.8.0-alpha.1)). It is not for the web target.
- **Playwright and docs.** The Playwright config adds a `markerless-hydration-edges` project and `respectGitIgnore: true`. There is no 0.8 docs directory in docsite, and `dioxuslabs.com/learn/0.8/guides/testing/web` returns 404.

## Not verified

- Whether a `wasm-bindgen-test` harness can mount a Dioxus app with `Config::rootelement` and query or drive the real DOM. There is no first-party example, and I did not run one: no chromedriver or wasm-bindgen-test-runner locally.
- Run times for wasm browser tests. There are no first-party numbers and I give no estimate.
- Whether plain `rustfmt` formats `rsx!` macro bodies.
- Why components' native test job installs Firefox.
- The quality and maintenance of the third-party `falsegreen-ui-*` crates.
- Whether `data-dioxus-id="0"` on the root is a stable, intended readiness signal. Inferred from interpreter source only.
- Whether this repo's Playwright specs pass unchanged against a Dioxus build. Not attempted; it depends on the DOM contract listed in §3.
- CI timings for this repo's current suite. The last green run found (2026-02-17) had no step data.

## Implications for this migration

- **Native tests** (`VirtualDom` + `dioxus_ssr::render`) replace much of the ~204 vitest specs, but only for pure logic, markup structure and simple event-to-state checks. Keep tool logic in plain Rust functions so most tests need no `VirtualDom`. Events by numeric `ElementId` are brittle, so wrap them in a small project helper if used at all.
- **Behaviour tests in a real DOM** (typing into CodeMirror, localStorage seeding, role queries, clipboard) have no Rust-side equivalent of Testing Library. Move the layout contract suites into Playwright: generate one test per tool from a route list exported by the Rust registry, keeping the "fixture or todo" rule.
- **To keep Playwright specs**, make the DOM contract an explicit port requirement: the `data-slot`s, `pre[data-has-value]`, `fieldset`/`label` structure, aria-labels, `code-input-*` test ids and `.cm-content`. Port `e2e/helpers/selectors.ts` first, so a DOM change breaks in one place.
- **Playwright config changes:**
  - `webServer.command` becomes `dx serve` / `dx run --web --release`, or serves a pre-built `dx build` output.
  - Port 8080.
  - `timeout` raised from the 60 s default to minutes.
  - If tool pages are prerendered and hydrated, add a deliberate readiness wait. Dioxus offers no hydration-done event.
- **Layout rule:** encode it in the registry type (option 1, with `fn() -> Element` rather than the `Component` alias for zero-prop tools), back it with `clippy.toml` `disallowed-methods` for the hand-built frames and `ErrorBanner` (option 2, verified through `rsx!`), and keep a native registry test for the ADR, ratchet and docs checks (option 3). Skip dylint unless name-based rules prove insufficient.
- **Agent quality gates:**
  - Workspace `[lints]` with `clippy::unwrap_used`, `expect_used`, `panic`, `todo`, `unimplemented`, `dbg_macro`, `print_stdout` set to `deny`, plus test exemptions in `clippy.toml`.
  - `cargo clippy --all-targets -- -D warnings`.
  - `dx check` and `dx fmt --check`.
  - `cargo fmt --check`.
  - `cargo deny check`.
  - `[lints.cargo] unused_dependencies = "deny"`, or cargo-machete if the MSRV is below 1.100.
  - Skip cargo-semver-checks.
- **CI budget:** native tests and clippy take minutes on standard runners. Playwright over 84 tools will dominate, roughly 5 min for about 89 tests per shard on one worker with a warm cache. Plan sharding and a cached `dx` / `target` early.

## Sources

- Dioxus 0.7 testing docs: https://dioxuslabs.com/learn/0.7/guides/testing/web ; https://dioxuslabs.com/learn/0.7/guides/testing/
- Docs source: https://github.com/DioxusLabs/docsite/blob/675ad77b6213640fee8ff8120ffe10a6b9aa26cc/docs-src/0.7/src/guides/testing/web.md ; …/index.md
- Dioxus v0.7.10 source (SHA 57d6794ad60b949e5bd8aa282f6f8c3dc97a365e):
  - packages/core/src/virtual_dom.rs, runtime.rs, lib.rs, nodes.rs
  - packages/interpreter/src/unified_bindings.rs
  - packages/core/tests/event_propagation.rs
  - packages/core-macro/tests/values_memoize_in_place.rs
  - packages/hooks/tests/memo.rs
  - packages/signals/tests/create.rs
  - packages/router/tests/via_ssr/navigation.rs
  - packages/ssr/src/lib.rs, packages/ssr/tests/simple.rs
  - packages/web/Cargo.toml, packages/web/src/cfg.rs, packages/web/src/lib.rs
  - packages/interpreter/src/js/core.js
  - packages/cli/src/check/issues.rs, packages/cli/src/cli/check.rs, packages/cli/src/cli/autoformat.rs
  - packages/playwright-tests/{playwright.config.js, web.spec.js, fullstack.spec.js, fullstack-hydration-order.spec.js}
  - .github/workflows/main.yml
- Dioxus v0.8.0-alpha.3 (SHA cb27832398e8a3fa30a0fc8d6917c6d8a86fa71a), and release notes: https://github.com/DioxusLabs/dioxus/releases
- DioxusLabs/components (SHA 09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a): playwright/playwright.config.ts, playwright/checkbox.spec.ts, .github/workflows/{main,playwright}.yml, primitives/src/lib.rs, primitives/src/date_picker.rs
- CI runs: https://github.com/DioxusLabs/components/actions/runs/45493622400 ; https://github.com/DioxusLabs/components/actions/runs/45493622434 ; https://github.com/DioxusLabs/dioxus/actions/runs/45418010664
- wasm-bindgen-test: https://wasm-bindgen.github.io/wasm-bindgen/wasm-bindgen-test/browsers.html ; https://wasm-bindgen.github.io/wasm-bindgen/wasm-bindgen-test/usage.html
- Clippy: https://doc.rust-lang.org/clippy/lints.html ; https://doc.rust-lang.org/clippy/lint_configuration.html ; https://clippy.rust-lang.org/master/index.html
- Cargo: https://doc.rust-lang.org/cargo/reference/manifest.html#the-lints-section ; https://doc.rust-lang.org/cargo/reference/workspaces.html ; https://doc.rust-lang.org/cargo/reference/lints.html ; https://doc.rust-lang.org/cargo/reference/unstable.html ; https://doc.rust-lang.org/cargo/reference/build-scripts.html ; https://doc.rust-lang.org/cargo/reference/environment-variables.html
- Rust: https://doc.rust-lang.org/reference/expressions/match-expr.html ; https://rust-lang.github.io/api-guidelines/future-proofing.html
- Tools: https://embarkstudios.github.io/cargo-deny/ ; https://github.com/bnjbvr/cargo-machete ; https://github.com/est31/cargo-udeps ; https://github.com/obi1kenobi/cargo-semver-checks ; https://github.com/trailofbits/dylint (and examples/general/rust-toolchain.toml)
- Playwright: https://playwright.dev/docs/test-webserver
- This repo: playwright.config.ts, e2e/helpers/selectors.ts, e2e/layout-journeys.spec.ts, e2e/encoding-tools.spec.ts, src/test/layout-guard.spec.ts, src/test/layout-contract.tsx, src/components/common/codec/CodecShell.contract.dom.spec.tsx, .github/workflows/ci.yml
- Local probe (scratch crate, dioxus 0.7.10, rustc/clippy 1.100.0): native click → SSR assertion; `disallowed-methods` firing through `rsx!`; registry enum + exhaustive `match` + registry render test.
