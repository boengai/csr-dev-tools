# ADR 0034 — Build the UI foundation on the platform

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

The map ([issue 5](https://github.com/boengai/csr-dev-tools/issues/5))
puts "nice UX" among its four priorities.
[What is the UI foundation?](https://github.com/boengai/csr-dev-tools/issues/22)
asks which common components, styling approach and motion approach every
Tool in the Dioxus build is made from. It was decided in conversation on
2026-11-27. The inputs:

- **Our own primitives are a condition of go.** ADR-0031 (condition 2)
  rules out `dioxus-primitives`. Research found gaps in it against Radix
  ([issue 11](https://github.com/boengai/csr-dev-tools/issues/11)):
  - dialog has no inert background and no scroll lock, and its focus trap
    skips `contenteditable`;
  - popups are placed with CSS only and are clipped by `overflow`;
  - the menu uses `listbox` roles, and the slider lacks Home and End;
  - tabs activate only on Enter;
  - every toast is announced as an alert;
  - the crate is git-only with no tags.

  In the spike, its select dropped focus to `<body>` after a pick, which
  fails WCAG 2.4.3. It also added 192 kB raw to Image Converter's route
  module ([issue 18](https://github.com/boengai/csr-dev-tools/issues/18)).
- **Styling and motion research**
  ([issue 12](https://github.com/boengai/csr-dev-tools/issues/12)):
  - Tailwind v4 works in Dioxus when class names are written whole.
  - The `tv()` calls (26 by that research's count) use only variants and
    defaults, so enums cover them.
  - Most `motion/react` use can be plain CSS.
  - `dioxus-motion` has one maintainer and writes inline styles every
    frame, which slips past the reduced-motion reset.
- **Parity is proven against `main`** (`docs/ux/parity.md`,
  [issue 24](https://github.com/boengai/csr-dev-tools/issues/24)). The
  39 e2e specs run unchanged on both builds. Each primitive has a keyboard
  and focus journey, and this ADR makes that journey part of the
  primitive's definition of done.
- **An inventory of `src/components/common` and `motion/react`** (80
  component files, 19 files using motion) was checked against the code.
  Findings that shape the decision:
  - Only 10 of the 14 `exit` props run. Card, the home page's empty slot,
    the Tabs content and DataCellTable have no `AnimatePresence` above
    them.
  - Radix restores focus, lifts the inert background and unmounts a
    dialog's contents only after its exit animation.
  - The e2e `toolSurface` helper (105 uses) and the performance harness
    find dialogs with the CSS selector `[role="dialog"]`. CSS selectors
    also match hidden nodes, so a closed dialog has to be gone from the
    DOM. The same goes for the 15 `[role="combobox"]` and 8
    `[role="option"]` selectors.
  - Toasts fire inside tool dialogs. Copy is the common case.
  - Nothing ties `motion/react` to `prefers-reduced-motion`, so every
    animation on the site ignores the reduced-motion reset in
    `src/index.css`.
- **A browser probe.** With a `showModal()` dialog open, an element
  outside it can't be focused or hit-tested. That includes a `popover`
  shown after the dialog. A `popover` inside the dialog works normally.
  This was checked in Playwright's Chromium and WebKit; Firefox did not
  launch and was not checked.
- **Inline styles and the CSP.** ADR-0033 hands this ticket two things:
  the Dioxus `style:` rule, and the CSS playgrounds' `'unsafe-inline'`.
  - **How Dioxus sets styles** (`dioxus-interpreter-js` 0.7.10,
    `set_attribute.ts`): a `style: "…"` string goes through
    `setAttribute('style')`; a style property such as `width: "…"` goes
    through `style.setProperty`.
  - **A second probe,** with `style-src 'self'` and no `'unsafe-inline'`,
    in Chromium and WebKit:
    - blocked: `setAttribute('style')`, a `<style>` element, and a `style`
      attribute or `<style>` inside markup written with `innerHTML`;
    - allowed: `style.setProperty`, `cssText` and a constructed
      stylesheet.
  - **What needs `'unsafe-inline'` on `main`:**
    - CssAnimationBuilder's `<style>` element;
    - the markup pane, where mermaid's SVG carries its own `<style>`
      and SVG Viewer shows user SVG, written with `innerHTML` after
      DOMPurify;
    - possibly the Typst SVG preview, which was not checked.

    The other CSS playgrounds set style properties, so they don't need
    it. The grep covered `src/` only, not the engine libraries.

## Decision

### 1. Primitives are ours

- **Every interactive primitive is written from scratch.** There are
  eleven:
  - the nine Radix replacements: dialog, select, dropdown menu, tabs,
    toast, checkbox, switch, radio group and slider;
  - the command palette's combobox;
  - the sortable grid that replaces dnd-kit (ADR-0033).

  No code is copied from `dioxus-primitives`, and it is not a dependency.
  Radix and `dioxus-primitives` may be read for reference.
- **Whoever owns a primitive's code owns its accessibility.** No library
  does.
- **The bar** is Radix's behaviour as it is today, and never below the
  WAI-ARIA Authoring Practices pattern. Where Radix does more than the
  pattern asks, we keep it. Examples: tabs that activate on the arrow
  keys, focus returning to the opener.
- **Each primitive has a behaviour list,** written before the primitive
  is built. It lists the keys, the focus moves and what is announced.
  Any deliberate difference from Radix goes in that list.
- **A primitive is done** when its keyboard and focus journey from
  `parity.md` passes.

### 2. Built on the browser's own elements

A primitive uses the browser's element wherever that element already has
the right role and keys. We write ARIA ourselves only where no element
fits.

| Component | Built on |
|---|---|
| Dialog, Sidebar sheet, CommandPalette frame | `<dialog>` with `showModal()`, through the [modal frame](#3-one-modal-frame) |
| Checkbox | `<input type=checkbox>`, styled with `appearance-none` |
| Switch | `<input type=checkbox role=switch>` |
| Radio group | native radios. The group name is made unique per instance, because native radios group by name across the whole page |
| Slider | `<input type=range>`, beside today's number input. The number input stays the one the label names; the range is named with `aria-labelledby` |
| Select | our own select-only combobox and listbox ([section 4](#4-select-menu-tabs-and-toast)) |
| Dropdown menu | our own menu button and `menu` |
| Tabs | our own `tablist`, `tab` and `tabpanel` |
| Toast region | our own region and live announcement |
| Command palette search | our own combobox, as today's `SearchInput` already is |
| Sortable grid (CombinePdf, ImageToPdf) | our own. Its behaviour list starts from what dnd-kit's defaults give today: Space to pick up, arrows to move, Space to drop, Escape to cancel, and spoken instructions and announcements. Pointer drag follows section 6 |

### 3. One modal frame

Dialog, the Sidebar and the CommandPalette share one **modal frame**. It
owns the whole lifecycle:

1. Remember the element that has focus.
2. Mount the `<dialog>` and call `showModal()`.
3. Lock page scroll with CSS while the dialog is open.
4. Send initial focus where today's dialog sends it. Tool dialogs focus
   the container.
5. On close (Escape, the close dot, a backdrop click, or a programmatic
   close), set an "exiting" attribute and let the exit transition run.
6. On `transitionend`, or after a timeout, call `close()`. Then unmount
   the children, return focus to the remembered element if it is still
   connected, and fire `onAfterClose` when the user closed it.

The rules that follow from it:

- **A closed modal is unmounted, not hidden.** The `<dialog>` element
  itself mounts on open and unmounts after the exit.
- **The `<dialog>` keeps an explicit `role="dialog"`,** so the
  `[role="dialog"]` selectors in the specs and the performance harness
  keep matching.
- **`useReturnFocus` and the CommandPalette's own focus restore** fold
  into the modal frame.
- **Tailwind's preflight removes the browser's `margin: auto` from modal
  dialogs.** The frame therefore places itself, and full-screen
  dialogs and the sheet set `max-w-none` and `max-h-none`.

### 4. Select, menu, tabs and toast

- **Select.** It follows the WAI-ARIA select-only combobox pattern, at
  Radix's behaviour:
  - the trigger has `role=combobox` and stays an element `<label for>`
    can name;
  - the selected option is highlighted when the list opens;
  - typing jumps to the first option that starts with what was typed;
  - focus returns to the trigger after a pick or Escape;
  - Tab while the list is open stays in the list.

  How it is placed:
  - The listbox sits in the top layer with `popover="manual"`
    ([section 7](#7-what-behaviour-may-depend-on)). Our own code closes
    it on an outside click. It stays a DOM descendant of the select, so
    it also works inside a modal.
  - A few lines of our own `web-sys` code place it under the trigger and
    flip or shift it to stay on screen, and set a `--trigger-width`
    variable.
  - The listbox is unmounted while closed.

  Its first PR sets a byte ceiling for it. If it pushes a page over
  budget, that page uses a native `<select>` instead, and that page's
  journey changes.
- **Dropdown menu.** It follows the WAI-ARIA menu button pattern, with
  `menu` and `menuitem` roles.
  - Items that show a state are `menuitemradio` with `aria-checked`.
  - The menu sits in the top layer with `popover="manual"`, placed by the
    same code as the select.
  - Our own code closes it on an outside click, and the click still
    reaches what was clicked.
  - It is unmounted while closed.
- **Tabs.** It follows the WAI-ARIA tabs pattern, with automatic
  activation as in Radix.
  - Every panel has `aria-labelledby`.
  - An inactive panel's element stays, but its children are not
    rendered, as today: a Tool's tab content resets when you switch away.
  - The trigger is a label, not a slot the caller fills.
- **Toast.** Its region is labelled "Notifications (F8)", and F8 moves
  focus to it. Behaviour:
  - Each message is announced once, by a live node. Its text appears in
    exactly one DOM node, because 17 spec checks look for the text
    exactly.
  - Timers pause on focus and on window blur.
  - Escape closes a toast that has focus.
  - Hover pause and swipe are not built: neither works today, because
    the viewport is `pointer-events-none`.
- **A toast host.** While a modal is open, the toast list draws inside the
  topmost modal frame, its **toast host**. Otherwise it draws on the page.
  Without the host, a toast would be inert and unannounced under the
  modal.

### 5. Styling

- **Tailwind 4.3.3, our own pinned binary,** not the 4.1.5 that dx
  downloads. `src/index.css` is the input, with its `#root` selector
  pointed at the Dioxus mount element. dx discards Tailwind's errors, so
  CI runs `tailwindcss` itself.
- **The stylesheet loads in the static head,** so the first frame is
  styled.
- **Class names are written whole.** Nothing is assembled with
  `format!` from fragments.
- **Variants are enums.** A `match` returns a `&'static str`. An element
  may carry several `class:` attributes, and a conditional one adds a
  class.
- **Common components take no class or style.**
  - None declares a `class` or `style` prop, or
    `extends = GlobalAttributes`.
  - Freeform channels close. Spreads like `{...props}` become explicit
    fields. The `asChild` triggers in Tabs and DropdownMenu become named
    props (label, icon, disabled). Class builders such as `inputVariants`
    and `paneStyles` stay private to their module.
- **No class merging and no merge crate.**
  - The two `cnMerge` sites in common components (SelectInput's trigger
    and TextAreaInput's wrapper) become named variants. The four in tools
    (KindBadge, HttpStatusCodes twice, TableNode) become conditional
    classes on the Tool's own elements.
  - Where two classes would set the same property, the component is
    designed so they don't; `!` is the last resort, as `Button` already
    uses `p-0!`.
  - This avoids the Rust merge crates, which read `text-body-*` as a
    colour.
- **Dark only.** `color-scheme: dark` and the `@theme` colours carry over
  unchanged. A light theme would be a separate decision after cutover.

### 6. Motion is plain CSS

- **No `dioxus-motion`, and no other motion crate.**
- **CSS does the animating:**
  - hover and press use `transition-*` with `hover:` and `active:`;
  - loops and one-off effects use `@keyframes`;
  - elements animate in with Tailwind `starting:` (`@starting-style`).
- **Exits are a delayed unmount, done in Rust.** Rust sets an "exiting"
  attribute, waits for `transitionend` or a timeout, then removes the
  node (or, for a modal, calls `close()` first). It is the only motion
  work Rust does.
  - The modal frame, the toast list and DisclosurePanel use it, so their
    exits play in every browser.
  - CopyButton unmounts nothing: both icons are stacked and cross-fade by
    a data attribute.
- **Rust never drives an animation over time.** It never writes a style
  from a timer or a `requestAnimationFrame` loop. Position variables, such
  as the tab indicator's offset and width, are written only when the
  selection changes or the element resizes.
- **A style that follows the pointer is input, not motion,** and is
  allowed. That covers the drag, pan and crop of the sortable grid, the
  image cropper and db-diagram's canvas, which ADR-0033 makes hand-built
  components.
- **Springs become `linear()` curves.** Only two springs visibly bounce
  today: the tab indicator (8.7%) and the select's opening (3.7%). Their
  curves are generated from today's stiffness and damping and stored as
  `@theme` easing tokens. The progress bar's spring never overshoots, so
  a plain ease-out matches it. The tab indicator appears in place on
  first paint.
- **DisclosurePanel animates `grid-template-rows` from `0fr` to `1fr`.**
  It removes its contents after closing, and it stays a `button` with
  `aria-expanded`, because a journey clicks it by role.

### 7. What behaviour may depend on

- **Behaviour depends only on Baseline "widely available" features.**
  `<dialog>` (since March 2022) and `inert` (since April 2023) qualify
  (MDN, read 2026-11-27).
- **`popover` is the one named exception.**
  - It is Baseline "newly available" only since January 2025, and should
    become widely available around July 2027. What holds it back is an
    iOS Safari bug in dismissing popovers by touch.
  - We use only `popover="manual"` and close popups with our own code, so
    that bug doesn't reach us.
  - In a browser without `popover`, a popup renders in place and still
    works, though an `overflow` ancestor may clip it.
- **Newer features are decoration only.** `@starting-style`,
  `transition-behavior: allow-discrete`, `interpolate-size` and anchor
  positioning are among them. Where a browser lacks one, the effect
  doesn't play and nothing breaks. That is why exits are a delayed
  unmount rather than `allow-discrete`.

### 8. Reduced motion

- **The global `prefers-reduced-motion` reset in `src/index.css` stays
  the only reduced-motion mechanism.** It now also zeroes
  `transition-delay` and `animation-delay`; without that, CopyButton's
  delayed swap would leave the button empty for 150 ms.
- **The Generator spinner stops** under reduced motion. Its
  elapsed-seconds text still updates.
- **The settings switch for the background animation carries over**
  unchanged.
- **Any code that waits for an animation to end has a timeout,** so a
  skipped animation never leaves a node behind.

### 9. Foundation differences

These five changes from `main` come out of this foundation. They are
allowed in port PRs and are not `ux-improvement`s (`parity.md`). The list
is closed: any other change still follows `parity.md`.

1. **Escape with a toast showing inside a dialog closes the dialog.**
   Today the first Escape closes the toast.
2. **Dropdown menu items that show a state are `menuitemradio` with
   `aria-checked`.** Today the state is visual only.
3. **A click outside an open menu closes it and still reaches its
   target.** Today Radix swallows it.
4. **Every animation obeys reduced motion, and the Generator spinner
   stops.** Today `motion/react` ignores it.
5. **The press effect plays on Space and pointer, not on Enter.** CSS
   `:active` doesn't fire on Enter.

The primitive journeys check only what both builds share. Where React
fails a check, as with item 2, the failure goes into the a11y baseline,
under the React-first rule.

### 10. What carries over

**Animations.** The 19 files that use `motion/react` today:

| Today | After |
|---|---|
| Button hover lift and shadow, press | CSS `transition` with `hover:` and `active:` |
| Card tile and the home page's empty slot: animate in, hover lift | `starting:` for the entry, CSS hover. The exit never runs today, so it is dropped |
| Close dots (Card, Dialog) | CSS scale transition, one shared close dot |
| CopyButton icon swap | both icons stacked, cross-faded by a data attribute |
| Dialog, CommandPalette, Sidebar: backdrop, panel, drawer slide | `starting:` for the entry, the modal frame's delayed close for the exit |
| Toast slide in and out | `starting:` for the entry, delayed unmount for the exit |
| Toast icon wiggle, Generator spinner, ColorConvertor swatch pop | `@keyframes`. All six swatches still pop on every conversion |
| DisclosurePanel height | `grid-template-rows` transition and delayed unmount |
| Tab indicator, select opening | `linear()` easing tokens |
| Progress bar width | CSS ease-out |
| Tab panel fade-in | `starting:`. The dead exit and the `layout` prop, which has no effect today, are dropped |
| Select closing, dropdown menu | none, as today. The menu's `animate-in` classes do nothing, because the plugin isn't installed |
| DataCellTable, `LazyMotion` and the three test wrappers | removed |

The twinkle stars, `animate-pulse` and the existing Tailwind transitions
are already CSS and carry over unchanged.

**Common components.** The 80 files under `src/components/common`:

- **Redesigned (DOM or ARIA changes):** Dialog, Sidebar and CommandPalette
  (on the modal frame), SelectInput, DropdownMenu, Tabs, ToastProvider,
  CheckboxInput, SwitchInput, RadioGroupInput, RangeInput. As part of the
  redesign, SelectInput's `cnMerge` becomes a named variant, and the
  triggers of Tabs and DropdownMenu become named props.
- **Unchanged, with stricter props:** TextAreaInput (a named variant
  instead of `cnMerge`, and explicit fields instead of a spread); Button,
  TextInput and UploadInput (explicit fields instead of spreads).
- **Unchanged:** the five layout shells and their parts, plus:
  - the tool dialog frame and shell, and ToolPresentation;
  - ErrorBanner and ToolStatus;
  - CopyButton, ToggleButton and ModEnterAction;
  - Card, SearchInput and CssOutputCell;
  - the outputs, Pane and SplitPanel;
  - BrowsableItemList, EmptyState, ProgressBar and SettingsDialog;
  - the sidebar items, NotoEmoji, TwinkleStarsAnimate and 14 icons;
  - DisclosurePanel, MarkupToPdfShell, PdfSvgPreview and
    DownloadPdfButton.

  The sidebar items set `aria-current` themselves, because the Dioxus
  router does not. ProgressBar stays `aria-hidden`, because its caller's
  live "N of M" text already announces progress.
- **Not ported, because nothing uses them:** DataCellTable, RefreshIcon,
  TrashIcon, FieldForm's `switch` kind and Dialog's `trigger` prop.
- **Decided by
  [issue 21](https://github.com/boengai/csr-dev-tools/issues/21):**
  - CodeInput (CodeMirror and Monaco);
  - dnd-kit in SortableCard and in SortablePdfShell's grid, which becomes
    the sortable grid primitive (section 1);
  - pdf.js in PdfBytesPreview;
  - DOMPurify in TransformerOutputPane;
  - jszip in the ZIP builders.

### 11. Inline styles and the CSP

- **`style-src` keeps `'unsafe-inline'`** in the Dioxus build, as on
  `main`.
- **Our own Rust code never needs it.** Styles are set only through the
  CSSOM, never through a `style: "…"` string:
  - standard properties use style properties in `rsx!` (`width: "…"`,
    which calls `style.setProperty`);
  - custom properties such as `--trigger-width` use `web-sys`
    `set_property`, unless `rsx!` turns out to accept them as style
    properties.
- **CssAnimationBuilder's generated keyframes move to a constructed
  stylesheet** (`CSSStyleSheet` with `replaceSync`, added through
  `adoptedStyleSheets`), not a `<style>` element.
- **What still needs `'unsafe-inline'`:**
  - the panes that show user content: the markup pane, and the Typst
    preview if its SVG carries a `<style>`;
  - possibly the engine bridges ADR-0033 keeps. Monaco injects `<style>`
    elements; CodeMirror and mermaid's own injection were not checked.

  Dropping `'unsafe-inline'` later is a decision about those, not about
  our own code.

## Considered options

- **Fork `dioxus-primitives` and patch it.** We would own the code
  anyway, built around mechanisms we would have to work around: the
  `focusin` dismiss behind its issue #303, and a focus trap that follows
  its own cursor rather than the focused element.
- **Web-component libraries (Shoelace, Web Awesome) behind interop.** Not
  researched. They would bring a JavaScript UI dependency into a build
  that is Rust-first.
- **Radix through JavaScript interop.** It would bring React back into
  the bundle.
- **ARIA from scratch for every primitive.** That rebuilds by hand what
  `<dialog>` and native inputs already do. That includes focus handling
  for CodeMirror's `contenteditable`, which the `dioxus-primitives`
  focus trap missed.
- **A native `<select>` everywhere.** It saved 192 kB on Image Converter
  in the spike. But seven journeys click the combobox and then an option,
  which a native picker can't do in Playwright, and the native picker
  can't take today's styling. It stays as the fallback for a page over
  budget.
- **Floating UI through interop, or CSS anchor positioning,** to place
  popups. The first is a JavaScript dependency for a few lines of maths.
  The second isn't Baseline yet.
- **`position: fixed` instead of `popover`.** It breaks inside our
  animated dialogs: a `transform` on the dialog makes the dialog the
  containing block, so its `overflow` clips the popup.
- **`dioxus-motion`.** One maintainer, and it writes inline styles every
  frame, which bypasses the reduced-motion reset.
- **Exits with `allow-discrete`.** Those exits play only where it is
  supported. Radix's order also has to be kept: restore focus and lift
  the inert background after the exit. A delayed unmount does both, in
  every browser.
- **`tw_merge` or `tailwind_fuse`.** Both read `text-body-*` as a colour
  unless given a custom collision table, and an override method in a
  public API would reopen the no-class rule.
- **Drop `'unsafe-inline'` from `style-src` now.** Mermaid diagrams and
  SVG Viewer content would lose their styles, unless those panes moved
  into a sandboxed iframe. That would break parity and the DOM contract.
- **Strict parity for the foundation differences.** That would mean
  rebuilding Radix's Escape order and leaving the menu state visual only,
  then filing both for after cutover. Items 4 and 5 can't sensibly be
  reproduced in CSS.

## Consequences

- **We own the accessibility of eleven primitives.** The browser carries
  most of the dialog, checkbox, switch, radio and slider behaviour. Five
  need hand-written ARIA and keyboard code: select, tabs, menu, toast and
  the sortable grid. The palette's combobox already is hand-written in
  React.
- **The parity harness
  ([issue 41](https://github.com/boengai/csr-dev-tools/issues/41)) gets
  each primitive's keyboard and focus journey from its behaviour list.**
  It also inherits these traps:
  - chmod's loop over `input[type="checkbox"]` passes vacuously today and
    starts really checking once checkboxes are native;
  - a native range adds a second `<input>` to its fieldset, so the number
    input must stay the one the label names;
  - native radios group by name across the page, so each group's name
    must be unique;
  - bcrypt's tab labels must keep the text "Hash" and "Verify";
  - toast text must sit in one node only.
- **The lint for these rules belongs to
  [issue 25](https://github.com/boengai/csr-dev-tools/issues/25):**
  - no `class`, `style` or `extends = GlobalAttributes` on a common
    component;
  - no style written from a timer or an animation-frame loop (pointer
    handlers are exempt);
  - no `style: "…"` string attribute, and no `<style>` element, in our
    own code (section 11);
  - no `dioxus-primitives` or `dioxus-motion` dependency.
- **Where the primitives, the easing tokens and the delayed-unmount helper
  live belongs to
  [issue 20](https://github.com/boengai/csr-dev-tools/issues/20).**
- **To verify in the first primitives PR:**
  - that passing an undeclared `class:` to a component is a compile
    error;
  - that the `grid-template-rows` transition works in every target engine;
  - the inert probe in Firefox;
  - the browser's `:modal` size limits against the full-screen dialog and
    the sheet;
  - that moving the toast list into the toast host loses no
    announcement;
  - whether the Typst SVG preview's markup carries a `<style>`;
  - that the modal frame can cancel the dialog's `cancel` event to run its
    exit on Escape, and copes with a native `close` that arrives before
    the timeout.

## Revisit when

- `@starting-style` becomes Baseline "widely available" (expected in early
  2027). Enter animations could then count as behaviour.
- CSS anchor positioning becomes Baseline. It would replace the flip and
  shift code.
- Dioxus 0.8 ships a stable release (ADR-0031).
