# How do Tailwind v4, variants and motion work in Dioxus?

## Answer

Tailwind v4 is built into `dx` 0.7: if a `tailwind.css` sits at the crate root, or `tailwind_input` is set in `Dioxus.toml`, `dx serve` runs a Tailwind watcher and `dx build`/`bundle` runs it once. It downloads the **standalone CLI pinned to v4.1.5**, two minors behind the repo's 4.3.3. That pin is unchanged in 0.8.0-alpha.3 and on `main`. The standalone binary bundles `@tailwindcss/typography`, and Tailwind scans `.rs` files as plain text, so any complete class string is detected: in `rsx!`, in a `const`, in a `match` arm or in a derive attribute. Classes built with `format!` are not. `src/index.css` can carry over almost verbatim; only the `#root` selector and the CSS entry path change. Typed variants in Rust are a `match` over enums returning `&'static str`, or a crate (`tw_merge`, `tailwind_fuse`). The repo uses `tv()` only for variants and defaults (no slots, no compoundVariants), so plain enums cover it. One catch: the repo depends on tailwind-merge with a custom `text-body-*` font-size group, and both Rust crates would misclassify those classes as text colours unless you add a collision override. `motion/react` has a working analogue in `dioxus-motion` 0.4.0 (presence, springs, layout), which is young and has one maintainer. Most of the site's animations can be plain CSS instead. `dx` hashes and minifies CSS, but a stylesheet added with `document::Stylesheet` is put in the head only after the wasm runs. Use `AssetOptions::css().with_static_head(true)` (or a hand-written `index.html`) to avoid a flash of unstyled content.

## Findings

### 1. Tailwind v4 in a Dioxus build

- **Built into `dx` since 0.7.** The 0.7.0 release notes say: "`dx` detects if your project has a `tailwind.css` file at the root, and if it does, automatically starts a TailwindCSS watcher for you", and that the CLI "can handle and autodetect both V3 and V4" ([release v0.7.0](https://github.com/DioxusLabs/dioxus/releases/tag/v0.7.0); PR "Inline the TailwindCLI into dx and run it during serve", #4086). The styling chapter says the same ([0.7 styling](https://dioxuslabs.com/learn/0.7/essentials/ui/styling)). The older utilities guide still tells you to run `npx @tailwindcss/cli -i ./input.css -o ./assets/tailwind.css --watch` by hand ([0.7 Tailwind guide](https://dioxuslabs.com/learn/0.7/guides/utilities/tailwind)), so the two docs pages disagree. The source settles it.
- **Source, `packages/cli/src/tailwind.rs` at v0.7.10** ([link](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/tailwind.rs)):
  - `const V4_TAG = "v4.1.5"` and `V3_TAG = "v3.4.15"`. The binary is downloaded from `https://github.com/tailwindlabs/tailwindcss/releases/download/v4.1.5/tailwindcss-<os>-<arch>` (the standalone CLI) into the dx tools directory.
  - Version detection: a `tailwind.config.js` or `.ts` means v3. Otherwise, if the input file exists (`tailwind_input`, defaulting to `<crate>/tailwind.css`), it uses v4. If neither is found, Tailwind does not run.
  - It is invoked as `tailwindcss --input <in> --output <out> [--watch]` with the working directory set to the crate directory. The default output is `assets/tailwind.css`. No `--minify` is passed.
  - stdout and stderr are both sent to `Stdio::null()`. The `run_once` call in the build path is discarded (`_ = TailwindCli::run_once(...)`, [build/request.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/request.rs)), so a broken Tailwind run fails silently.
  - `dx serve` starts the watcher (`TailwindCli::serve`, [serve/runner.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/serve/runner.rs)). Every build runs it once before bundling.
- **Config keys:** `tailwind_input` and `tailwind_output` under `[application]` in `Dioxus.toml` ([config/app.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/config/app.rs)).
- **Using a newer Tailwind:** when `NO_DOWNLOADS` is set in the environment, or `no_downloads` in the dx CLI settings, `dx` resolves `tailwindcss` from `PATH` instead of downloading ([settings.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/settings.rs), `get_binary_path` in tailwind.rs). That lets you supply a 4.3.x binary. The other option is to run the Tailwind CLI yourself, with no `tailwind.css` at the crate root so autodetection stays off.
- **0.8 alphas:** `tailwind.rs` at `v0.8.0-alpha.3` differs from v0.7.10 only in which HTTP client it uses. It still pins `v4.1.5`, and so does `main` ([v0.8.0-alpha.3 tailwind.rs](https://github.com/DioxusLabs/dioxus/blob/v0.8.0-alpha.3/packages/cli/src/tailwind.rs)).
- **Version gap:** the repo runs `tailwindcss` 4.3.3 (`package.json`). Utilities added in 4.2 (logical `pbs-*`/`mbs-*`/`inline-*`/`block-*`/`inset-s-*`, `font-features-*`, the mauve/olive/mist/taupe palettes) and in 4.3 (`scrollbar-*`, `zoom-*`, `tab-*`, `@container-size`, stacked/compound `@variant`) are missing from 4.1.5 ([v4.2.0 notes](https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.2.0), [v4.3.0 notes](https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.3.0)). A grep of `src/**/*.tsx` found none of them in use. The only hit is `zoom-in-95` in `DropdownMenu.tsx`, which belongs to a `tailwindcss-animate` class set that the repo does not install.
- **Class detection in Rust:** Tailwind "treats all of your source files as plain text, and doesn't attempt to actually parse your files as code". It "has no way of understanding string concatenation or interpolation", so "make sure any class names you're using exist in full" ([detecting classes](https://tailwindcss.com/docs/detecting-classes-in-source-files)). The scanner's template-extension list includes `rs` ([oxide fixtures, v4.1.5](https://github.com/tailwindlabs/tailwindcss/blob/v4.1.5/crates/oxide/src/scanner/fixtures/template-extensions.txt)). There is no Rust-specific pre-processor, only Clojure, HAML, JSON, Pug, Razor, Ruby, Slim, Svelte and Vue ([pre_processors dir](https://github.com/tailwindlabs/tailwindcss/tree/v4.1.5/crates/oxide/src/extractor/pre_processors)), so Rust gets the default extractor.
  - Consequence: complete literals are detected wherever they appear: `class: "..."` in `rsx!`, `const BASE: &str = "..."`, `match` arms returning `"..."`, and `#[tw(class = "...")]` derive attributes. Fragments assembled with `format!("text-{c}-500")` are not detected. Safelist them with `@source inline(...)` (brace expansion is supported) if they are unavoidable. The repo has no interpolated class fragments today; a grep for `-${` inside class strings found only `name=` and storage keys.
  - Scanning starts from the CLI's working directory (the crate directory, as dx sets it) and skips `.gitignore`d paths, so a gitignored `target/` is not scanned. `@import "tailwindcss" source("./src")` or `@source` lines narrow it further. The Dioxus docs add `@source "./src/**/*.{rs,html,css}";` ([0.7 styling](https://dioxuslabs.com/learn/0.7/essentials/ui/styling)).

### 2. Carrying over `src/index.css`

Read: `@import 'tailwindcss'`, `@plugin '@tailwindcss/typography'`, one `@theme` block that resets with `--color-*: initial`, `--text-*: initial` and `--breakpoint-*: initial`, then defines custom colours, `--text-heading-N` / `--text-body-*` with `--line-height`, `--letter-spacing` and `--font-weight` sub-properties, shadows, radii, a font, breakpoints and safe-area values. After that come a nested `:root { body, ::selection, button, hr, #root }` block using `@apply`, a `@keyframes twinkle`, `@layer utilities` (`.bg-pixel-texture`, `.bg-grid-texture`), `@layer components` (`.popover`), and a global `prefers-reduced-motion` reset. There are no `@utility`, `@custom-variant` or `@source` rules.

- **Typography plugin:** the v4.1.5 standalone CLI resolves `@tailwindcss/forms`, `@tailwindcss/typography` and `@tailwindcss/aspect-ratio` from inside the binary ([standalone index.ts, v4.1.5](https://github.com/tailwindlabs/tailwindcss/blob/v4.1.5/packages/%40tailwindcss-standalone/src/index.ts)). `@plugin '@tailwindcss/typography'` works without `node_modules`. The repo pins typography 0.5.20, and the version bundled in the 4.1.5 binary was not checked.
- **`@theme` features used** (namespace reset with `initial`, the `--text-*--line-height` and similar sub-properties, oklch values) are v4.0 features. None of them post-date 4.1.5, as far as the 4.2 and 4.3 release notes show.
- **What must change:**
  - `#root`: Dioxus web mounts into `<div id="main">` in the generated `index.html` by default. Not verified; see below. Rename the selector or set the mount id.
  - The file must become `dx`'s input. Either move it to `<crate>/tailwind.css` or point `tailwind_input` at it.
  - `@layer utilities` blocks remain plain CSS. That is how they behave in the current build too, so nothing changes.

### 3. Typed variants in Rust

**Current repo usage** (grep over `src/**/*.ts(x)`):
- 26 `tv()` calls in 22 files: 21 components and 1 spec. They cover `Button`, `CopyButton`, `ToggleButton`, the input components, `Dialog`, `Sidebar`, `Pane`, `ToastProvider`, `CommandPalette`, `DisclosurePanel` and a few feature tools.
- 10 files use `defaultVariants`.
- **None use `slots`, `compoundVariants`, `compoundSlots` or `extend`.**
- `@/utils` wraps `createTV` with `twMerge: true` and a custom tailwind-merge class group that puts `text-body-{xs,sm,lg,xl}` and `text-heading-{1..6}` in the `font-size` group (`src/utils/tailwind-variants.ts`).
- `cnMerge` appears in 6 files. Some of them merge a `wrapperClassName` from an internal caller (`TextAreaInput`, `SelectInput`).
- Typical shape: `Button` has `variants.size` (3), `variants.variant` (8) and boolean `block`, with defaults. Its `text` variant uses `p-0!` to win over the size padding.

**Options in Dioxus:**
- **Props are typed structs.** `#[derive(Props)]` / `#[component]` generate "a strongly typed builder" ([0.7 components](https://dioxuslabs.com/learn/0.7/essentials/ui/components)). A component that declares no `class` field has no builder method for one, so `Button { class: "..." }` should fail to compile. That is my inference from the generated typed builder; the docs do not say it outright. The only way to accept arbitrary attributes is the opt-in `#[props(extends = GlobalAttributes)] attributes: Vec<Attribute>` (same page). The repo rule therefore maps to "common components never declare a `class` field or `extends = GlobalAttributes`", and the compiler enforces it.
- **Plain enums plus `match` returning `&'static str`:** no dependency. Classes stay complete literals, so Tailwind detects them. Dioxus allows several `class:` attributes on one element, each "added to the element's class list", and they can be conditional (`class: if cond { "..." }`) ([0.7 attributes](https://dioxuslabs.com/learn/0.7/essentials/ui/attributes)). Base, size and variant strings can therefore sit on separate `class:` lines with no runtime concatenation. Without compoundVariants or slots in the repo, this covers every current `tv()` call. What you lose is conflict resolution: with no merge, `p-0!` and the `!` important modifier carry the override cases, as `Button` already does.
- **`tw_merge` 0.1.22** ([docs.rs](https://docs.rs/tw_merge/0.1.22/tw_merge/), [crates.io](https://crates.io/crates/tw_merge)). Described as "Macros for merging Tailwind CSS v4 classes or creating variants". It is published from `rust-ui/ui`, was updated 2026-09-24 and is still pre-1.0. It provides `tw_merge!` and `#[derive(TwClass)]` / `#[derive(TwVariant)]` (CVA style, `#[tw(default, class = "...")]`) behind the `variant` feature.
- **`tailwind_fuse` 0.3.2** ([docs.rs](https://docs.rs/tailwind_fuse/0.3.2/tailwind_fuse/)). Same API (it is the predecessor whose API `tw_merge` mirrors). Last release 2025-01-19. Its collision table lacks the v4 rules that `tw_merge` has, such as `text-shadow` and `wrap-*` (compared `src/core/merge/get_collision_id.rs` in both crates).
- **Static detection:** both crates keep classes as string literals in attributes, so detection works.
- **The `text-body-*` problem:** both crates fall through `["text", ..] => "text-color"` for any `text-*` that is not a built-in size. `text-body-lg` would therefore collide with `text-white`, and the last one would win. The repo's tailwind-merge config exists to prevent exactly this. Both crates expose `tw_merge_override(classes, options, collision_id_fn, collisions_fn)` with a user `CollisionIdFn`, so a custom font-size group is possible, but you have to write it.
- **Overrides:** both crates' `IntoTailwindClass::with_class` adds an override string. Any public component API must not expose it, or the no-`className` rule is lost.
- **Dioxus:** neither crate's docs mention Dioxus or Leptos. Both produce `String`s, which work as a `class:` value.

### 4. Replacing `motion/react`

**Current repo usage** (19 files import `motion/react`: 15 render `m.*`, `App.tsx` provides `LazyMotion features={domAnimation} strict`, and 3 specs wrap tests in `LazyMotion`):

| Category | Where | Count |
|---|---|---|
| Enter/exit with `AnimatePresence` | `Dialog` (backdrop fade, panel scale/fade, `onExitComplete`), `CommandPalette` (same pattern), `Sidebar` (overlay fade, drawer `x: -100%`), `ToastProvider` (list items slide/fade), `CopyButton` (icon swap, `mode="wait"`, `initial={false}`), `DisclosurePanel` (`height: 0 ↔ auto` + opacity), `Tabs` (content fade/slide) | 7 files |
| Enter-only mount animation (fade/scale/translate) | `ColorConvertor`, `DataCellTable`, `SelectInput` (Radix unmounts itself, so there is no exit), `Card`, home tool button | 5 files. `Card`, `DataCellTable` and the home button also declare `exit` without an `AnimatePresence` in the same file; whether an ancestor supplies one was not traced |
| Gestures `whileHover` / `whileTap` (lift `y:-2`, scale 0.98/0.9/1.15, box-shadow) | `Button`, `Card` (tile + close button), `Dialog` close button, home tool button | 5 `whileHover`, 3 `whileTap` |
| Springs (`type: 'spring'`) | `Tabs` active indicator (3 elements, stiffness 300 / damping 30 / mass 2, animating `width`/`x`), `SelectInput` enter, `ProgressBar` width | 5 |
| Layout animation | `layout` on `Tabs` content; no `layoutId` | 1 |
| Keyframes / loops | `GeneratorShell` spinner (`rotate: 360`, `repeat: Infinity`), toast icon wiggle (`rotate: [0,5,-5,0]`, `scale: [1,1.2,1]`) | 2 |
| Not used | `drag`, `Reorder`, `layoutId`, `useMotionValue`/`useSpring`/`useTransform`/`useAnimate`, `whileInView`, `MotionConfig`, `useReducedMotion` | 0 |

Reduced motion today is only the global `@media (prefers-reduced-motion: reduce)` reset in `index.css`. Nothing in the JS sets `MotionConfig reducedMotion`.

**`dioxus-motion` 0.4.0** ([crates.io](https://crates.io/crates/dioxus-motion), [repo](https://github.com/wheregmis/dioxus-motion)). Released 2026-10-03; it depends on `dioxus` 0.7.10 and has a `web` feature (default). Read from the published crate source:
- `use_motion` values with `AnimationConfig::spring(Spring { stiffness, damping, mass })` or `tween(Duration)`, plus keyframes and sequences.
- Typed `MotionStyle`.
- `AnimatePresence` with `PresenceMode::{Sync, Wait, PopLayout}`, the equivalent of Framer's `mode`. Children must be keyed.
- `use_presence_style` with optional layout animation and a layout-specific transition ("matching Framer's transition.layout model").
- Router `AnimatedOutlet` transitions behind the `transitions` feature.
- It works by writing inline styles from Rust on `requestAnimationFrame` (`src/animations/platform.rs`). The crate source contains no `prefers-reduced-motion` handling.
- The 0.7.0 Dioxus release notes show it running on Blitz ([release v0.7.0](https://github.com/DioxusLabs/dioxus/releases/tag/v0.7.0)).
- Maturity: one maintainer, about 20k total downloads. The README says the main branch "contains breaking changes for the next release", and `ROADMAP.md` is titled "...Roadmap If i dont get bored?".
- I found no other Dioxus animation crate with presence or layout support. `dioxus-class` 0.8.0, last released 2024-12, is a class helper, not motion.

**Plain CSS equivalents (no wasm per-frame work):**
- **Gestures:** `hover:`, `active:` and `transition-*` utilities cover the lift, scale and shadow effects. Wrap them in `motion-safe:` (`@media (prefers-reduced-motion: no-preference)`), or undo them with `motion-reduce:` ([Tailwind states](https://tailwindcss.com/docs/hover-focus-and-other-states)).
- **Enter on mount** (5 enter-only files, plus the enter half of every presence case): `@starting-style` "define[s] starting values ... when an element is first displayed". It is Baseline 2024, newly available since August 2024 ([MDN @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)). Tailwind exposes it as the `starting:` variant ([Tailwind states](https://tailwindcss.com/docs/hover-focus-and-other-states)).
- **Exit:** CSS can only animate an exit while the element stays in the DOM and toggles `display`, with `transition-behavior: allow-discrete` on `display` and `overlay` (top-layer `<dialog>` and popover) ([MDN @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)). Dialog, CommandPalette (as a `<dialog>`) and Sidebar (a dialog or popover drawer) can be built that way. Tailwind's `open:` variant matches `[open], :popover-open, :open`. Lists that remove nodes, like toasts, need either a short JS-delayed unmount (keep the node, add an "exiting" class, remove it on `transitionend`) or `dioxus-motion`'s `AnimatePresence`.
- **`height: auto` (DisclosurePanel):** `interpolate-size: allow-keywords` does this but has "Limited availability" and is "Experimental" ([MDN interpolate-size](https://developer.mozilla.org/en-US/docs/Web/CSS/interpolate-size)). Without it, keep a JS measurement or accept no height animation.
- **Springs:** `linear()` easing is widely available since December 2023 and "allows the approximation of complex animations ... by interpolating linearly between the specified points" ([MDN linear()](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/linear)). A precomputed spring curve can be written as `linear()`. It is not interruptible with momentum the way motion springs are.
- **Tabs indicator / `layout`:** a CSS transition on `transform`/`width` handles the indicator. Shared-element and layout morphs can use `document.startViewTransition()` (same-document, Baseline 2025, newly available since October 2025, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition)), called through `web-sys` or `js_sys`.
- **Loops** (spinner, wiggle): `@keyframes` and Tailwind `animate-*`. The repo already uses `animate-pulse` and `@keyframes twinkle`.
- **Reduced motion:** the existing global CSS reset in `index.css` applies to all CSS transitions and animations. Inline styles written each frame by `dioxus-motion` would bypass it.

### 5. Shipping styles

- **Asset pipeline:** `asset!()` hashes filenames ("automatically attaches a hash to the name"), and "Stylesheets will automatically be minified as they are bundled" ([0.7 assets](https://dioxuslabs.com/learn/0.7/essentials/ui/assets)). In source, `CssAssetOptions` has `with_minify` (default true), `with_preload` and `with_static_head` (default false) ([manganis-core css.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/manganis/manganis-core/src/css.rs)). Minification uses lightningcss with browserslist targets, falling back to `defaults`, and keeps the unminified CSS if minification fails ([cli opt/css.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/opt/css.rs)). Because lightningcss gets real targets, it may down-level syntax such as oklch; not tested.
- **One stylesheet:** Tailwind emits a single `assets/tailwind.css`. Dioxus also supports CSS modules (`#[css_module]`, PR #3578 in the [0.7.0 notes](https://github.com/DioxusLabs/dioxus/releases/tag/v0.7.0)). There is no per-route Tailwind splitting.
- **FOUC with plain `document::Stylesheet`:** `Link` (and therefore `Stylesheet`) runs `document.create_link` in `use_hook`. The web implementation does `queue_effect(|| append_element_to_head("link", ...))` ([document/elements/link.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/document/src/elements/link.rs), [web/src/document.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/document.rs)). The CSS request therefore starts only after the wasm has loaded and rendered once, which leaves a window of unstyled content.
- **Fix:** with `AssetOptions::css().with_static_head(true)`, dx writes `<link rel="stylesheet" href="/{base_path}/assets/<hashed>">` into the generated HTML head. `with_preload(true)` writes a `<link rel="preload" as="style">` ([cli build/web.rs](https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/web.rs), lines ~466-475). Either removes the dependency on wasm boot.
- **Critical CSS:** dx inserts links only; there is no inlining or critical-CSS step. Whether SSG/prerendered pages (a fullstack feature) put head elements into each HTML file belongs to the prerender ticket and was not checked here.

## Not verified

- That passing an undeclared prop (`class: ...`) to a Dioxus component is a compile error. Inferred from the typed builder; not tested.
- The default mount element id (`main`) of dx's generated `index.html` in 0.7.10.
- Which `@tailwindcss/typography` version is inside the v4.1.5 standalone binary, and whether it renders the same as the repo's 0.5.20.
- How the default extractor handles Rust raw strings (`r#"..."#`) and classes containing `#`. Plain `"..."` literals are covered by the docs; raw strings were not tested.
- Whether lightningcss with browserslist `defaults` rewrites oklch colours or `@layer`/`@property` in Tailwind's output.
- Whether Card/DataCellTable/home-button `exit` props currently run (that depends on an ancestor `AnimatePresence`).
- Whether motion's JS animations honour the global CSS reduced-motion reset today. Motion's own reduced-motion docs were not read.
- The `dioxus-motion` API on docs.rs versus the README. The README describes the main branch; I read the published 0.4.0 source for presence and layout, but did not compile anything.
- Whether a `grid-template-rows: 0fr → 1fr` transition is a reliable height-auto fallback. MDN's animation-type wording mentions only length, percentage and calc.
- Any change in 0.8 alphas beyond `tailwind.rs`; manganis CSS options and `document::Link` were not diffed.

## Implications for this migration

1. Keep Tailwind v4. Run it either through dx's autodetect, accepting the 4.1.5 pin (nothing the repo uses today needs 4.2 or later), or through `NO_DOWNLOADS=1` with a pinned 4.3.x `tailwindcss` on `PATH` so it matches today's output. dx sends Tailwind's stdout and stderr to null and ignores the exit status, so CI should run `tailwindcss --input ... --output ...` itself to catch errors.
2. Move `src/index.css` to the crate's `tailwind.css` (or set `tailwind_input`), add `@source "./src/**/*.rs"`, and change the `#root` selector to the Dioxus mount element. Everything else, including the typography plugin, carries over.
3. Express variants as Rust enums plus `match` returning `&'static str`, applied with several `class:` attributes. That covers every `tv()` call (no slots, no compoundVariants), keeps detection static, and lets the compiler enforce the no-`className` rule if common components never declare `class` or `extends = GlobalAttributes`. Skip a merge crate unless overrides become necessary. If one is adopted, prefer `tw_merge` and register a `CollisionIdFn` for `text-body-*` / `text-heading-*`.
4. Animations:
   - Move gestures, enter-only mounts, loops and the tab indicator to CSS (`transition-*`, `starting:`, `@keyframes`) behind `motion-safe:` or the existing reset.
   - Rebuild Dialog, CommandPalette and Sidebar on `<dialog>` or popover with `allow-discrete` exit transitions.
   - Toast exits, the CopyButton swap and DisclosurePanel height are the only cases that still need JS or `dioxus-motion`. Adopting `dioxus-motion` for those few is a dependency on a single maintainer, and it needs its own reduced-motion guard.
5. Load the stylesheet with `asset!("/assets/tailwind.css", AssetOptions::css().with_static_head(true))`, not just `document::Stylesheet`, so the generated or prerendered HTML has the `<link>` before wasm boots.

## Sources

- https://github.com/DioxusLabs/dioxus/releases/tag/v0.7.0
- https://github.com/DioxusLabs/dioxus/releases (v0.7.10 2026-07-30; v0.8.0-alpha.3 2026-10-16)
- https://dioxuslabs.com/learn/0.7/essentials/ui/styling
- https://dioxuslabs.com/learn/0.7/guides/utilities/tailwind
- https://dioxuslabs.com/learn/0.7/essentials/ui/assets
- https://dioxuslabs.com/learn/0.7/essentials/ui/attributes
- https://dioxuslabs.com/learn/0.7/essentials/ui/components
- https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/tailwind.rs
- https://github.com/DioxusLabs/dioxus/blob/v0.8.0-alpha.3/packages/cli/src/tailwind.rs
- https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/config/app.rs
- https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/request.rs
- https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/serve/runner.rs
- https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/settings.rs
- https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/build/web.rs
- https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/cli/src/opt/css.rs
- https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/manganis/manganis-core/src/css.rs
- https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/document/src/elements/link.rs
- https://github.com/DioxusLabs/dioxus/blob/v0.7.10/packages/web/src/document.rs
- https://docs.rs/dioxus/0.7.1/dioxus/prelude/document/fn.Stylesheet.html
- https://tailwindcss.com/docs/detecting-classes-in-source-files
- https://tailwindcss.com/docs/hover-focus-and-other-states
- https://github.com/tailwindlabs/tailwindcss/blob/v4.1.5/crates/oxide/src/scanner/fixtures/template-extensions.txt
- https://github.com/tailwindlabs/tailwindcss/tree/v4.1.5/crates/oxide/src/extractor/pre_processors
- https://github.com/tailwindlabs/tailwindcss/blob/v4.1.5/packages/%40tailwindcss-standalone/src/index.ts
- https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.2.0
- https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.3.0
- https://crates.io/crates/tw_merge and https://docs.rs/tw_merge/0.1.22/tw_merge/ (source read from the 0.1.22 crate tarball)
- https://crates.io/crates/tailwind_fuse and https://docs.rs/tailwind_fuse/0.3.2/tailwind_fuse/ (source read from the 0.3.2 crate tarball)
- https://crates.io/crates/dioxus-motion and https://github.com/wheregmis/dioxus-motion (source, README, CHANGELOG, ROADMAP read from the 0.4.0 crate tarball)
- https://crates.io/crates/dioxus-class
- https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style
- https://developer.mozilla.org/en-US/docs/Web/CSS/interpolate-size
- https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/linear
- https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition
- https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-rows
- Repo files: `src/index.css`, `src/utils/tailwind-variants.ts`, `package.json`, `src/components/common/button/Button.tsx`, `src/components/common/tabs/Tabs.tsx`, `src/components/common/toast/ToastProvider.tsx` and the other 19 `motion/react` importers (grep counts as of 2026-11-25)
