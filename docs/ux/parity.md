# UX parity

How a ported Tool is shown to behave as it does today, decided in [How is UX parity proven?](https://github.com/boengai/csr-dev-tools/issues/24). The bar is the one the migration map sets: no regression against the React site. Improvements are welcome, but they follow their own path (see "Improvements") and never block a port.

## The reference

- **Until cutover, the React site on `main` is the reference.** "No regression" is measured against what users have today, not against a drawing.
- The pages in this folder describe `main`. Where one disagrees with what `main` does, fix the page.
- [README.md](README.md) says "the shell is the spec". Until cutover, that means the React shells on `main`. At cutover, the rule moves to the Dioxus shells.
- **Every Noto emoji image stays** (each `NotoEmoji` in `src/`): the flying-saucer loading indicator, the robot on the home page and in the processing steps, and the thinking face and bomb in the image and colour Tools. They keep the same images, the same source (`fonts.gstatic.com`) and the same places as on `main`. Performance budget runs still remove them from both builds ([budgets.md](../perf/budgets.md)). Dropping them, self-hosting them or replacing the loading indicator is an improvement.

## The Playwright specs

The 39 spec files in `e2e/` (journeys per Tool or per category, `layout-journeys.spec.ts`, and `platform/`) are the main proof.

- **They run against both builds.** A port PR does not edit a React spec. Until a Tool is ported, its specs are filtered out of the Dioxus run with `testMatch` and `grep`, as the spike did, not edited.
- **Saved inputs are part of it.** The persistence journeys from [Capture the stored-value contract from React](https://github.com/boengai/csr-dev-tools/issues/38) (ADR-0032) follow these rules too, and keep to the same DOM contract.
- **The parity runs have no retries, on either build.** A flaky journey is a finding, not noise. A spec that flakes against React is fixed on `main` before Dioxus is held to it. The React site's own CI run keeps its retries.
- **The port keeps the DOM contract the specs read.** That includes:
  - roles and accessible names, the labels and the `name` attributes (`dialog-source`, `cidr-input` and others), and the test ids,
  - the `data-slot` values (`tool-surface`, `tool-status`, `tool-output`, `output-placeholder`, `empty-state`),
  - `data-has-value` on the output `<pre>` and on `[data-slot="tool-output"]`,
  - `aria-live="polite"` regions, and toast texts such as "Copied to clipboard".
- **Changing a spec for the port.** The port changes a spec for one reason only: a selector names a library or a class rather than the contract. These are:
  - `.cm-editor` and `.cm-content` (CodeMirror),
  - `.monaco-editor` and `.view-lines` (Monaco),
  - `.react-flow` (React Flow, in the DB diagram; its `table-node-<id>` test ids are ours and stay),
  - `.font-mono` (a Tailwind class).

  When the port can't keep one of these, for example because [Which engines move to Rust and which stay behind the interop boundary?](https://github.com/boengai/csr-dev-tools/issues/21) replaces the library, the selector moves to a contract hook (a role, a label, a `data-slot` or a test id).
  - That change lands on `main` first, and passes against React there.
  - It then reaches `develop` by merge commit, following the branch rules in `CONTRIBUTING.md`.
  - No spec changes before it has passed against React.

The spike's evidence covers only part of this. Four spec files, grepped to three Tools, ran unchanged against Dioxus and passed. That every spec carries over is a rule the port is held to, not a measured result.

## The parity harness

These checks are added to the React suite. Each one passes against `main` before Dioxus is held to it (see "The React-first rule").

### Layout contract suite

A Playwright suite that replaces the jsdom suites (`src/components/common/<shell>/<Shell>.contract.dom.spec.tsx`). Those use Testing Library and cannot run against Dioxus.

- **What it covers:**
  - It reads the Tool list and each Tool's layout from the registry, so a ported Tool joins it with no per-Tool test work.
  - The bad-input fixtures (`LayoutErrorFixture`: `storage`, `steps` or `never`) move unchanged in shape to a shared file that both runs read.
  - It runs on the Tool route for every Tool, and in the dashboard dialog for one Tool per layout.
- **What it checks** (the same checks as today):
  - The status slot sits above the work area.
  - The output's placeholder is the empty state, or, for a Generator, a value shows on open.
  - The action that takes the output away sits with the output.
  - No alert shows on open.
  - Bad input appears in the status slot and clears the output.
- It runs against React first, then against Dioxus over the Tools ported so far.

The layout guard's rules (a Tool renders its shell, builds no dialog of its own, and an opt-out names an ADR) become compile-time rules in Rust. That is [Where does the Dioxus code live and how is it split into crates?](https://github.com/boengai/csr-dev-tools/issues/20) and [What are the anti-slop gates?](https://github.com/boengai/csr-dev-tools/issues/25).

### Browsers and devices

| Project | Runs |
|---------|------|
| Desktop Chromium | The whole suite |
| Emulated phone (Pixel 7: touch, mobile viewport, `isMobile`) | The contract suite, and the journeys' mobile tests |
| Desktop WebKit | The contract suite |

WebKit is included because [Safari downloads preloaded WebAssembly twice](https://github.com/boengai/csr-dev-tools/issues/35) found a WebKit-only difference.

### Waiting and loading

- **There is no app-level "ready" signal.** Tests wait on the DOM, as a visitor does, so a spec is the same for both builds. This is how the spike's journeys passed.
- **There is one loading check per page type** (home and Tool route), under the performance harness's slow-4G throttle. It checks that:
  - the loading indicator shows before the app,
  - the root fills in without a layout shift (the CLS budget caps this too),
  - keys pressed and clicks made while it loads cause no console error, and the first field takes focus normally once it appears. Both builds serve an empty root, so there is nothing to type into before the app is ready.

### Accessibility

- **axe** (`@axe-core/playwright`, tags `wcag2a`, `wcag2aa`, `wcag21a` and `wcag21aa`) runs on every Tool route twice: on open, and in the bad-input state from the contract suite's fixture. It also runs on the home page and in the dashboard dialog.
- **A keyboard and focus journey for each primitive**: dialog, select, dropdown menu, tabs, slider, switch, checkbox, radio group, toast, and the command palette.
  - Each journey opens, moves, picks and presses Escape, and checks that focus returns to the trigger. The spike's primitive select lost focus to `<body>`.
  - Each journey is part of that primitive's definition of done in [What is the UI foundation?](https://github.com/boengai/csr-dev-tools/issues/22). This page only requires that each one exists and passes against React first.
- **Accessible names have no separate check.** The specs find elements by role and label, so a missing name fails them.

### Screenshots

CI uploads a desktop and a phone screenshot of each Tool a PR touches, from both builds. They are evidence for the reviewer, not a gate: a pixel diff between two renderers would fail on noise.

## The React-first rule

- Every new check is written and run against `main` first.
- What React already fails goes into a committed baseline list: the a11y baseline.
- Dioxus may not add a failure that isn't on the list.

Without this rule, a new check would raise the bar above parity. Fixing a baseline entry counts as an improvement.

## When the harness is built

- One build ticket builds the harness: the contract suite, the phone and WebKit projects, the loading check, axe with its baseline, and the screenshots. The primitive journeys come from [What is the UI foundation?](https://github.com/boengai/csr-dev-tools/issues/22).
- It lands on `main` first, because it has to pass against React, and then reaches `develop` by merge commit.
- It must be done before the first port PR merges, as [Safari downloads preloaded WebAssembly twice](https://github.com/boengai/csr-dev-tools/issues/35) had to be fixed first.
- The jsdom contract suites stay on `main` untouched until cutover. On `develop` they are deleted with the React `src/`.

## The reviewer's hand check

This is the UX part of a port PR. It covers only what automation can't judge.

- **Side by side with React.** Open the PR's preview and `main` on the same Tool, in GPU Chrome: Playwright's bundled Chromium hides canvas and image aliasing. Check desktop width and phone width.
- **Golden path and one error case,** driven by hand on the preview.
- **Feel:** motion, focus rings, hover and pressed states, and the debounce.

What else a port PR must contain, the PR templates and the merge gates are decided in [What are the anti-slop gates?](https://github.com/boengai/csr-dev-tools/issues/25) and listed in [gates.md](../quality/gates.md) (ADR-0036). The `port` and `shell` templates in `docs/quality/pr/` copy this checklist.

## Improvements

A `ux-improvement` is any intended change away from `main`.

- It is filed as an issue labelled `ux-improvement`, and it is never part of a port PR.
- It waits until after cutover.
- **One exception, for fixing an a11y baseline entry.** The fix may land on `develop` before cutover, as its own PR after that Tool's port. That PR:
  - updates the page in this folder,
  - removes the baseline entry,
  - tags the check it adds as Dioxus-only, with a tag the harness defines.

The five foundation differences in [ADR-0034](../adr/0034-ui-foundation-on-the-platform.md#9-foundation-differences) come with the UI primitives. They are not `ux-improvement`s, and port PRs may include them. The primitive journeys check only what both builds share.
