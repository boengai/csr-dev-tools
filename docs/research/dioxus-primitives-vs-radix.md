# What do Dioxus primitives cover against our Radix usage?

Researched 2026-11-25 against DioxusLabs/components `main` at `09d6a913` (2026-11-24), which pins `dioxus = "0.7.8"` (semver-compatible with 0.7.10). Source line numbers below refer to that commit.

## Answer

All nine Radix packages have a same-named primitive in `dioxus-primitives` (checkbox, dialog, dropdown_menu, radio_group, select, slider, switch, tabs, toast). By name, nothing is missing. In behaviour, several fall short of what Radix gives us today, and some of those gaps are accessibility regressions:

- **Overlays.** Dialog has no portal, no scroll lock and no `inert` on the background (open issue #298). Its focus trap only intercepts Tab.
- **Positioning.** Popups are positioned with CSS only. There is no portal and no collision handling.
- **Menu semantics.** DropdownMenu uses `listbox`/`option` roles, not `menu`/`menuitem`.
- **Missing keys and attributes.** Slider has no Home/End/PageUp/PageDown. Tabs are manual-activation only, and their panels lack `aria-labelledby`. RadioGroup arrows do select, but Home and End move focus without selecting.
- **Toast** announces every message as `role="alert"`, with no pause on hover or focus.
- **Upstream fixes are pending.** Fixes for the dialog's background inertness and its open-then-close bug exist only as open, unreviewed community PRs (#299, #304, #309).

The crate is not usable from crates.io: the only published version is an empty `0.0.0` placeholder. You get it as a git dependency, either from `dx components add` or by hand. The `0.8` branch only ports the API to Dioxus 0.8 and changes no accessibility behaviour. Treat it as a good starting point that will need patching or forking, not a drop-in replacement for Radix.

## Coverage table

| Our component (`src/components/common/`) | Radix package (parts used) | Dioxus primitive | Gaps vs. Radix / our usage |
|---|---|---|---|
| `input/CheckboxInput` | `@radix-ui/react-checkbox` (Root, Indicator) | `checkbox` | Close match: `role="checkbox"`, `aria-checked` incl. `mixed`, hidden native input with `name`. Covered by one Playwright test. |
| `input/SwitchInput` | `@radix-ui/react-switch` (Root, Thumb) | `switch` | Close match: `role="switch"`, hidden native input. Covered by one Playwright test. |
| `input/RadioGroupInput` | `@radix-ui/react-radio-group` (Root, Item, Indicator) | `radio_group` | Arrow keys move focus and check the radio, as WAI-ARIA requires. Home/End move focus without checking. `name` prop is declared but never rendered (no hidden input). Covered by one Playwright test, which checks focus only. |
| `input/RangeInput` | `@radix-ui/react-slider` (Root, Track, Range, Thumb) | `slider` | Arrows and Shift+Arrows only: no Home/End/PageUp/PageDown. No `aria-valuetext`, no hidden input. Pointer behaviour is well tested. |
| `input/SelectInput` | `@radix-ui/react-select` (Root, Trigger, Value, Icon, Portal, Content `position="popper"`, Viewport, Item, ItemText, ItemIndicator, Arrow; `--radix-select-trigger-width`) | `select` (Select, SelectMulti) | No portal, no collision handling, no trigger-width variable, no Arrow part. Trigger is a `button` with `aria-haspopup="listbox"`, not `role="combobox"`. Typeahead only while open, and it is fuzzy (Levenshtein), not prefix. No form value (issue #164). No code found that returns focus to the trigger. |
| `tabs/Tabs` | `@radix-ui/react-tabs` (Root, List, Trigger, Content) | `tabs` | Manual activation only (Enter/click), where Radix defaults to automatic. `horizontal` defaults to `false`, so arrows are Up/Down unless set. Tablist never sets `aria-orientation`, which matters in the vertical default. Panels have no `aria-labelledby`. |
| `dialog/Dialog`, `dialog/ToolDialog*`, `settings/SettingsDialog` | `@radix-ui/react-dialog` (Root, Trigger, Portal forceMount, Overlay, Content, Title, Description, Close; `onOpenAutoFocus`/`onCloseAutoFocus`) | `dialog` (DialogRoot, DialogContent, DialogTitle, DialogDescription) | No Portal, Overlay, Trigger or Close parts. No scroll lock, no `inert` (#298). Trap autofocuses the first tabbable, with no hook to focus the container instead (our Dialog does that today). Escape and outside-dismiss are present. Focus restore exists in the trap code, but upstream does not test it. Known bug where a modal closes right after it opens (#303). |
| `sidebar/Sidebar` (dialog used as a side sheet) | `@radix-ui/react-dialog` | `dialog`; styled `sheet` in the preview crate | Same as Dialog. |
| `command-palette/CommandPalette` (+ `SearchInput`, hand-rolled combobox/listbox) | `@radix-ui/react-dialog` | `dialog`, plus the `combobox` primitive (`role="combobox"`, `aria-autocomplete="list"`, `aria-activedescendant`) | Dialog gaps as above. The combobox primitive could replace our hand-built one, but it has an open bug (#294) and I have not reviewed it in depth. |
| `dropdown-menu/DropdownMenu` | `@radix-ui/react-dropdown-menu` (Root, Trigger asChild, Portal, Content `sideOffset`, Item `onSelect`) | `dropdown_menu` | Wrong ARIA pattern (`listbox`/`option`). No typeahead, no portal, no `sideOffset` (CSS only), no submenus (#110). Escape, Tab-to-close, Home/End and arrows are present. |
| `toast/ToastProvider` | `@radix-ui/react-toast` (Provider, Viewport, Root `forceMount`/`duration`/`onOpenChange`, Title) | `toast` (ToastProvider + `use_toast` API) | Every toast is `role="alertdialog"` containing `role="alert"` (assertive). No pause on hover or focus, no swipe. Region hotkey is F6 (Radix uses F8). It has its own store and render callback, so our zustand-driven store/AnimatePresence model does not map directly. |
| `disclosure/DisclosurePanel` (hand-built) | none | `collapsible`, `accordion` | Available but not needed: ours is already hand-built. |
| `button/ToggleButton` (hand-built `data-state`) | none | `toggle`, `toggle_group` | Available as an option. |
| `progress-bar/ProgressBar` (no ARIA) | none | `progress` | Available. Not checked. |
| `list/SortableCard`, `list/BrowsableItemList` | none (uses `@dnd-kit/*`) | `drag_and_drop_list` | Exists. Open bug that it is not reactive (#319). Not checked against our keyboard sorting needs. |
| `input/CodeInput` (CodeMirror/Monaco) | none | none | Hand-build or JS interop. CodeMirror is `contenteditable`, which the Dioxus focus trap does not treat as focusable (see Findings). |
| `button/*`, `card`, `banner/*`, `state/EmptyState`, `table/DataCellTable`, `layout/*` (`SplitPanel`, `Pane`), `input/TextInput`/`TextAreaInput`/`ColorInput`/`UploadInput`, `output/*`, `icon/*`, `emoji`, `animate`, `css-output`, `form/FieldForm`, `pdf/*`, the five layout shells | none | Styled preview has `button`, `card`, `input`, `textarea`, `color_picker`, `scroll_area`; the rest have no counterpart | Hand-built, as today. None of these use Radix now. |

## Findings

### What the library is and how it ships

- The repo has two crates: unstyled `dioxus-primitives` and a `preview` app with shadcn-styled versions that `dx components add <name>` copies into your project, along with a theme CSS file ([README](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/README.md)). The gallery is at https://dioxuslabs.github.io/dioxus-components/. https://dioxuslabs.github.io/components/ returns 404.
- The primitives are `accordion, alert_dialog, aspect_ratio, avatar, calendar, checkbox, collapsible, color_picker, combobox, context_menu, date_picker, dialog, drag_and_drop_list, dropdown_menu, hover_card, label, listbox, menubar, navbar, popover, portal, progress, radio_group, scroll_area, select, separator, slider, switch, tabs, tag_group, toast, toggle, toggle_group, toolbar, tooltip, virtual_list` ([primitives/src](https://github.com/DioxusLabs/components/tree/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src)).
- Each styled component's `component.json` declares `dioxus-primitives` as a git dependency with no `rev` ([select/component.json](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/preview/src/components/select/component.json)). A user report shows `dx components add` writing `dioxus-primitives = { git = "https://github.com/DioxusLabs/components", version = "0.0.1" }` ([issue #317](https://github.com/DioxusLabs/components/issues/317)). The commit you build against is therefore whatever `Cargo.lock` captured.
- The contributing rules require new primitives to follow the WAI-ARIA Authoring Practices and to have Playwright tests ([README](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/README.md)). The behaviour notes below show where the code does not yet meet that bar.

### Maturity

- **crates.io.** The only published version is `0.0.0` (2025-04-13), 1,848 downloads in total ([crates.io API](https://crates.io/api/v1/crates/dioxus-primitives)). Issue #295 describes it as the empty `cargo new` template: 884 bytes, one `add` function. It says this blocks any crate that depends on the primitives from being published ([issue #295](https://github.com/DioxusLabs/components/issues/295)). docs.rs documents only `0.0.0` ([docs.rs](https://docs.rs/crate/dioxus-primitives/latest)). The in-repo version is `0.0.1` ([primitives/Cargo.toml](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/Cargo.toml)). The repo has no GitHub releases ([repo](https://github.com/DioxusLabs/components)).
- **Versioning against Dioxus.** There is no independent semver. `main` tracks Dioxus 0.7 (`dioxus = "0.7.8"` in the [workspace Cargo.toml](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/Cargo.toml)). A `0.8` branch is 9 commits ahead and 1 behind `main`. It pins `dioxus = "=0.8.0-alpha.3"`, raises `rust-version` from 1.80.0 to 1.92.0, and includes the fix "Fix primitive attribute generation with Dioxus 0.8 alpha.3 (#325)", dated 2026-11-16 ([compare main...0.8](https://github.com/DioxusLabs/components/compare/main...0.8)). Outside `Cargo.lock`, the diff is mostly small API-porting edits, 1-9 lines per primitive. The largest are `toast.rs` (+164/-23: a `RenderToast` wrapper component plus new unit tests) and `move_interaction.rs` (+28/-13). Nothing in it touches ARIA roles, keyboard handling, the focus trap or positioning ([compare file list](https://github.com/DioxusLabs/components/compare/main...0.8)). As of 2026-11-25, 0.8 has the same accessibility gaps as `main`. Expect to move branches when the app moves to 0.8.
- **Dioxus releases** for reference: 0.7.0 on 2025-10-31, 0.7.10 on 2026-07-30, 0.8.0-alpha.3 on 2026-10-16 ([crates.io API](https://crates.io/api/v1/crates/dioxus)).
- **Commit activity** (all 286 commits on `main` since 2024-04-03, by month): about 37 a month from April to June 2025, single digits to the teens through April 2026, then 34 in May 2026. After that: 1 in June, 0 in July and August, 3 in September, 0 in October, 1 in November 2026. The latest commit on `main` (2026-11-24) is titled "Fix main CI: Playwright runner, Stylelint toolchain, Web Build toolchain (#334)" ([commits](https://github.com/DioxusLabs/components/commits/main)). Activity since June 2026 has mostly been on the 0.8 and `devin/*` native-renderer branches ([branches](https://github.com/DioxusLabs/components/branches)). The repo has 357 stars.
- **Open PRs** ([pull requests](https://github.com/DioxusLabs/components/pulls)). Community fixes for our blocking gaps are open, with no review decision and no comments:
  - [#299](https://github.com/DioxusLabs/components/pull/299) marks the background inert (opened 2026-09-02).
  - [#304](https://github.com/DioxusLabs/components/pull/304) stops focusin light-dismiss of modals (2026-10-06).
  - [#309](https://github.com/DioxusLabs/components/pull/309) fixes two roving-focus races (2026-10-16).
  - [#312](https://github.com/DioxusLabs/components/pull/312) stops light-dismiss for events inside stacked overlays.
  - [#313](https://github.com/DioxusLabs/components/pull/313) fixes dropdown menu focus; it has merge conflicts.
  
  Other open PRs worth knowing about:
  - [#259](https://github.com/DioxusLabs/components/pull/259), a draft from 2026-05-13, would split the styled library out for crates.io publishing.
  - A series of PRs (#289, #300-302, #308, #322-324) ports the Playwright tests to `dioxus test`.
  - About eight PRs dated 2026-11-24 port primitives to Dioxus Native.
- **Test coverage.** There are 32 Playwright spec files, 31 for components and one for the preview app, run in CI ([playwright/](https://github.com/DioxusLabs/components/tree/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/playwright), [workflow](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/.github/workflows/playwright.yml)). Coverage is thin for most of the components we need:
  - checkbox, switch, dialog, dropdown-menu, tabs and toast each have one `test()` block.
  - select has 11 tests; slider has 9, mostly about pointer behaviour.
  - The dialog test checks the first-focus position, Tab staying inside, Escape, and outside-click. It does not check focus restoration, scroll or background inertness ([dialog.spec.ts](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/playwright/dialog.spec.ts)).
  - The toast test only clicks close buttons ([toast.spec.ts](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/playwright/toast.spec.ts)).
  - There are 48 Rust `#[test]` functions in `primitives/src`, many of them for select's text search.
- **Open issues relevant to us** ([open issues](https://github.com/DioxusLabs/components/issues)):
  - [#298](https://github.com/DioxusLabs/components/issues/298) Dialog/AlertDialog does not mark the background `inert`.
  - [#303](https://github.com/DioxusLabs/components/issues/303) Roving focus (Tabs/RadioGroup) re-focusing dismisses a just-opened modal through focusin light-dismiss. The reporter's scenario is a ⌘K command palette, which is our exact pattern. It was reported on the desktop renderer (WKWebView), but the reporter says it also happens wherever a click focuses buttons, such as Chromium.
  - [#164](https://github.com/DioxusLabs/components/issues/164) Select does not take part in forms.
  - [#277](https://github.com/DioxusLabs/components/issues/277) RefCell panic in Select.
  - [#294](https://github.com/DioxusLabs/components/issues/294) Combobox reopen blanks the field.
  - [#110](https://github.com/DioxusLabs/components/issues/110) Dropdown has no submenus.
  - [#172](https://github.com/DioxusLabs/components/issues/172) Context menu goes off-screen.
  - [#181](https://github.com/DioxusLabs/components/issues/181) A maintainer comment says Tailwind's global reset can interfere with component styling. Relevant because we use Tailwind v4.
  - [#272](https://github.com/DioxusLabs/components/issues/272) The library depends on `dioxus` with default features.

### Per-primitive behaviour (from source at `09d6a913`)

**Shared overlay infrastructure** ([lib.rs](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/lib.rs))
- Escape is handled by a global keydown listener with a stack, so only the topmost overlay closes (`use_global_escape_listener`, lines 160-185).
- Outside-dismiss listens for both `pointerdown` and `focusin` outside the root (`use_outside_dismiss`, lines 214-240). That `focusin` listener is the mechanism behind #303.
- Exit animations work by waiting on `element.getAnimations()` before unmounting (`use_animated_open`, line 244 on).

**Positioning**
- `side`/`align` only set `data-side` and `data-align` attributes ([lib.rs](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/lib.rs) lines 285-320, [popover.rs](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/popover.rs) lines 295-296).
- The styled select and dropdown use `position: relative` on the root and `position: absolute` on the content ([select/style.css](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/preview/src/components/select/style.css), [dropdown_menu/style.css](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/preview/src/components/dropdown_menu/style.css)). I found no code that measures layout or detects collisions.
- Of our primitives, only toast uses the in-house portal (`portal.rs` is used only by toast). Select and dropdown content therefore stays in the DOM where it was rendered, and an `overflow: auto` ancestor will clip it. Radix portals it to `body`.

**Focus trap** ([ts/focus-trap.ts](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/ts/focus-trap.ts))
- It counts as focusable only `a[href]`, non-hidden `input`, `button`, `select` and `textarea` that have `tabIndex >= 0`. Elements that are `contenteditable` (CodeMirror), `[tabindex="0"]` divs or `summary` are skipped.
- Tab movement follows a TreeWalker's own cursor, not `document.activeElement`. After a mouse click inside the dialog, Tab may therefore jump from a stale position. This is inferred from the code and not tested in a browser.
- On close, `remove()` calls `.focus()` on whatever was active when the trap was created. That covers the "return focus to opener" case our `useReturnFocus` hook handles today, but without an `isConnected` check.
- The trap always focuses the first focusable element on open.

**Dialog** ([dialog.rs](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/dialog.rs))
- Content gets `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`/`aria-describedby` wired to DialogTitle and DialogDescription (lines 256-263).
- The trap is installed only when `is_modal` is set (lines 231-253).
- The root renders in place, with `aria-hidden` while closed (line 142). The only parts are DialogRoot, DialogContent, DialogTitle and DialogDescription.
- There is no scroll lock and no `inert` handling. #298 confirms `grep inert` returns nothing.
- Radix Dialog, by contrast:
  - [Radix Dialog docs](https://www.radix-ui.com/primitives/docs/components/dialog) say it portals to `body`, traps focus and renders "the content underneath inert".
  - The installed `@radix-ui/react-dialog` 1.2.0 depends on `react-remove-scroll` and `aria-hidden` and calls `RemoveScroll`/`hideOthers` (`node_modules/@radix-ui/react-dialog/package.json` and `dist/index.mjs` in our repo).

**Select** ([select/components/trigger.rs](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/select/components/trigger.rs), [list.rs](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/select/components/list.rs), [option.rs](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/select/components/option.rs), [text_search.rs](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/select/text_search.rs))
- **Trigger.** A `button` with `aria-haspopup="listbox"`, `aria-expanded` and `aria-controls`. ArrowUp/ArrowDown open the list and focus the last/first option. There is no typeahead on the closed trigger.
- **List.** `role="listbox"` with `aria-multiselectable`. Options are focused directly with DOM focus; there is no `aria-activedescendant`.
- **Keys while open.** Arrows, Home, End, Enter and Space select; Escape closes; blur closes.
- **Options.** `role="option"` with `aria-selected` and `aria-disabled`.
- **Typeahead.** Buffered with a timeout and scored by weighted Levenshtein distance with a keyboard-layout model, not by prefix match.
- **Forms.** The `name` prop is declared (select.rs line 52) but never rendered.
- **Focus on close.** I found no `set_focus` on the trigger after select or close. The Playwright tests do not assert where focus lands after closing.
- **Radix for comparison.** Radix Select portals to `body`, has `avoidCollisions` on by default, exposes `--radix-select-trigger-width` in popper mode, lists typeahead as a feature, and returns focus to the trigger on Esc ([Radix Select](https://www.radix-ui.com/primitives/docs/components/select)).

**DropdownMenu** ([dropdown_menu.rs](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/dropdown_menu.rs))
- The trigger has `aria-haspopup="listbox"` (line 235), the content `role="listbox"` (line 345), and items `role="option"` (line 445). The [WAI-ARIA menu button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) says the popup "has role menu". Radix follows that pattern and has typeahead and collision avoidance ([Radix DropdownMenu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu)). The `menu` roles do exist in `context_menu.rs`, `menubar.rs` and `navbar.rs`.
- Keys: Enter, Escape, ArrowUp/ArrowDown, Home and End (lines 128-142). Items activate on Enter or Space. There is no character typeahead.

**RadioGroup** ([radio_group.rs](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/radio_group.rs))
- `role="radiogroup"`; items are `button role="radio"` with roving tabindex.
- The context's `focus_next`/`focus_prev` call `select_focused_value()`, so arrow keys check the newly focused radio (lines 45-62). That matches the [WAI-ARIA radio pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).
- `focus_start`/`focus_end`, bound to Home/End, only move focus (lines 64-70). The pattern does not define Home/End, so this is an inconsistency rather than a violation.
- `name` (line 97) is never rendered.
- The one Playwright test asserts focus movement only ([radio-group.spec.ts](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/playwright/radio-group.spec.ts)).

**Tabs** ([tabs.rs](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/tabs.rs))
- `role="tablist"` (line 196) carries no `aria-orientation`. Tabs get `aria-selected` and `aria-controls` (lines 297-304). Panels are `role="tabpanel"` with `tabindex="0"` and `hidden`, but no `aria-labelledby` (lines 431-438).
- Arrows only move focus; activation is by click or Enter (lines 309-329, and the [tabs.spec.ts](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/playwright/tabs.spec.ts) "Clicking enter should activate"). There is no automatic-activation option.
- `horizontal` defaults to `false` (lines 45-47).
- The [WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) requires `aria-labelledby` on each tabpanel and `aria-orientation="vertical"` on vertical tablists. It recommends automatic activation when panels render without delay. Radix defaults `activationMode` to `automatic` ([Radix Tabs](https://www.radix-ui.com/primitives/docs/components/tabs)).

**Slider** ([slider.rs](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/slider.rs), [move_interaction.rs](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/move_interaction.rs))
- The thumb is a `button role="slider"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-orientation` and `aria-label` from the `label` prop (lines 703-716). Other attributes spread, so `aria-labelledby` can be passed.
- Keyboard input is ArrowUp/Down/Left/Right by `step`, with Shift for ×10 (move_interaction.rs lines 39-51). Home, End, PageUp and PageDown are missing. The [WAI-ARIA slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) lists Home and End without marking them optional, and marks PageUp/PageDown optional. Radix supports all four ([Radix Slider](https://www.radix-ui.com/primitives/docs/components/slider)).
- Range mode (two thumbs) and pointer edge cases are well tested.

**Checkbox / Switch** ([checkbox.rs](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/checkbox.rs), [switch.rs](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/switch.rs))
- Each is a `button` with the right role, `aria-checked` (`mixed` for indeterminate) and `aria-required`.
- Enter is suppressed, matching WAI-ARIA and Radix.
- Each renders a hidden native `input type="checkbox"` (`aria-hidden`, `tabindex=-1`) carrying `name`, so they work with forms.

**Toast** ([toast.rs](https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src/toast.rs))
- A `ToastProvider` renders, through the portal, a `role="region"` labelled "{n} notifications" (lines 253-258). F6 focuses that region (line 238).
- Each toast is `role="alertdialog"` with `aria-modal="false"` and `tabindex="0"`, wrapping `ToastContent` with `role="alert"` and `aria-atomic` (lines 514-539).
- `max_toasts` is supported. Auto-dismiss uses a fixed timeout (lines 482-497). I found no handlers that pause on hover or focus, and none for swipe.
- Radix by contrast has `type` foreground (announced immediately) and background (announced at the next graceful opportunity). It "pauses closing on hover, focus and window blur", supports swipe, and defaults the hotkey to F8 ([Radix Toast](https://www.radix-ui.com/primitives/docs/components/toast)).

### Third-party alternatives

| Crate | Status | Verdict |
|---|---|---|
| `lumen-blocks` | Built on dioxus-primitives. Only `0.0.0` published (2025-06-26). README says experimental; last push 2026-02-22; 114 stars ([crates.io](https://crates.io/api/v1/crates/lumen-blocks), [repo](https://github.com/Leaf-Computer/lumen-blocks)) | Inherits the primitives' behaviour. Not independent. |
| `dioxus-tw-components` | 0.2.12 (2026-10-30), 35 versions, 46 stars. README says "Not production ready … experimental and educational purposes only" and has a limited-maintenance clause ([crates.io](https://crates.io/api/v1/crates/dioxus-tw-components), [repo](https://github.com/42Angouleme/dioxus-tw-components)) | Not credible for our needs. |
| `dioxus_components` | 0.1.2 (2025-11-18), 3 versions, 5 stars, no push since 2025-11-20. Claims to follow Radix patterns ([crates.io](https://crates.io/api/v1/crates/dioxus_components), [repo](https://github.com/LeTri234/dioxus_component)) | Looks abandoned. |
| `dioxus-shadcn` | 0.7.0 (2026-11-25), 17 versions since 2026-10-05, 1 star. Claims "headless accessible primitives" ([crates.io](https://crates.io/api/v1/crates/dioxus-shadcn), [repo](https://github.com/dioxuspress/dioxus-ui)) | Too new to judge. Its accessibility claims are unverified. |
| `dioxus-daisyui` | 0.8.0, last update 2024-12-19 ([crates.io](https://crates.io/api/v1/crates/dioxus-daisyui)) | Class helpers, not behaviour primitives. |

None of these is a credible independent replacement for Radix-grade behaviour.

## Not verified

- I ran no primitive in a browser. Every behaviour claim above comes from reading source and test files at `09d6a913`. Where I say "no code found" (focus returning to the trigger after Select/DropdownMenu closes, toast pause on hover), a browser check could still show different behaviour if a mechanism exists that I did not find.
- The focus trap's stale-cursor Tab problem after a mouse click is inferred from code, not reproduced.
- I did not check the `combobox`, `progress`, `collapsible`/`accordion`, `toggle_group` or `drag_and_drop_list` primitives in depth.
- I read the 0.8 branch only through the compare file list and the `toast.rs` patch, not file by file. The "no accessibility change" conclusion rests on the size and shape of those diffs.
- I did not read the open fix PRs (#299, #304, #309, #312, #313) to judge their quality.
- I did not check whether Radix Select's typeahead works on the closed trigger, because the Radix docs do not say.
- I did not install or run `dx components add` or `dx components list`. The workflow is described from the README, a gallery docs search result and issue #317.
- The accessibility of third-party crates is not checked beyond their READMEs.
- Whether any of our tools put a CodeMirror or Monaco editor inside a modal dialog (where the contenteditable trap gap would bite) is not checked.

## Implications for this migration

1. **Budget for an in-house primitives layer.** Start from `dioxus-primitives` source: vendor or fork it, since it is git-only and unversioned. Where the gaps are, write our own behaviour.
2. **Must fix before reaching parity.**
   - Dialog: portal, scroll lock, background `inert`, an initial-focus hook, a trap that recognises `contenteditable`, and the #303 race. The race affects our ⌘K command palette directly.
   - Select and DropdownMenu: portal plus collision-aware positioning, so popups are not clipped inside shells with `overflow: auto`.
   - DropdownMenu: the `menu`/`menuitem` roles.
   - RadioGroup: make Home/End check the radio, for consistency with the arrow keys (minor).
   - Slider: Home/End/PageUp/PageDown.
   - Tabs: automatic activation, `aria-labelledby` and `aria-orientation`.
   - Toast: live-region politeness by type, and pause on hover and focus.
3. **Pin by commit.** If we take the git dependency, set an explicit `rev`, because `dx components add` writes none. Expect to switch to the `0.8` branch when the app moves to Dioxus 0.8.
4. **Plan for a slow upstream.** `main` has had 5 commits since June 2026. Community PRs for the inert and light-dismiss bugs (#299, #304, #309) have sat unreviewed for 1-3 months. Carry those patches locally, in a fork or with `[patch]`, rather than waiting for merges.
5. **Port the accessibility tests too.** Our existing Playwright and DOM specs (dialog focus return, layout-shell contracts) should become the acceptance tests for each primitive. The upstream specs are too thin to rely on.
6. **Hand-built today, hand-built tomorrow.** These are already custom, so the work stays the same: the command-palette combobox (or adopt the upstream `combobox` after review), `DisclosurePanel`, `ToggleButton`, the code editors (JS interop), sortable lists, split panels, upload input and all the layout shells.

## Sources

- https://github.com/DioxusLabs/components (repo; `main` at `09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a`)
- https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/README.md
- https://github.com/DioxusLabs/components/tree/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/primitives/src (dialog.rs, select/, dropdown_menu.rs, radio_group.rs, tabs.rs, slider.rs, move_interaction.rs, checkbox.rs, switch.rs, toast.rs, popover.rs, portal.rs, lib.rs, collection.rs, listbox.rs, ts/focus-trap.ts)
- https://github.com/DioxusLabs/components/tree/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/playwright
- https://github.com/DioxusLabs/components/blob/09d6a913cd1fbcd258b6a5d97bd780b1808b5c0a/preview/src/components/select/component.json
- https://github.com/DioxusLabs/components/compare/main...0.8
- https://github.com/DioxusLabs/components/issues (#110, #164, #172, #181, #272, #277, #294, #295, #298, #303, #317, #319)
- https://github.com/DioxusLabs/components/pulls (#259, #299, #304, #309, #312, #313)
- https://www.radix-ui.com/primitives/docs/components/dialog, .../select, .../dropdown-menu, .../tabs, .../slider, .../toast
- https://www.w3.org/WAI/ARIA/apg/patterns/radio/, .../menu-button/, .../slider/, .../tabs/
- https://dioxuslabs.github.io/dioxus-components/ (gallery)
- https://crates.io/api/v1/crates/dioxus-primitives, https://docs.rs/crate/dioxus-primitives/latest
- https://crates.io/api/v1/crates/dioxus
- https://crates.io/api/v1/crates/lumen-blocks, https://github.com/Leaf-Computer/lumen-blocks
- https://crates.io/api/v1/crates/dioxus-tw-components, https://github.com/42Angouleme/dioxus-tw-components
- https://crates.io/api/v1/crates/dioxus_components, https://github.com/LeTri234/dioxus_component
- https://crates.io/api/v1/crates/dioxus-shadcn, https://github.com/dioxuspress/dioxus-ui
- https://crates.io/api/v1/crates/dioxus-daisyui
- Local repo: `src/components/common/**` and `package.json` in boengai/csr-dev-tools (Radix part usage read directly)
