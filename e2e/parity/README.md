# UX parity harness

The checks that show a Dioxus port behaves as the React site on `main` does ([issue 41](https://github.com/boengai/csr-dev-tools/issues/41)). The rules are in `docs/ux/parity.md` (on `develop`); the terms are in `CONTEXT.md` → UX parity. Every check here passes against React first.

## Running it

```bash
pnpm build          # the harness runs against a built site, served by `vite preview`
pnpm test:parity    # playwright.parity.config.ts: every project, no retries
```

- `PARITY_BASE_URL=<url> pnpm test:parity` runs against a site that is already up, and starts no server.
- `PARITY_TOOLS=json-formatter,base64-codec` limits the harness to those Tools. A key that names no Tool fails the run.
- `pnpm test:parity --project=harness parity/layout-contract.spec.ts` runs one project and one file.

CI runs `pnpm test:parity` in the `ci` job, after the React site's own e2e run (`playwright.config.ts`), which keeps its retries and leaves this folder out.

## What runs where

| Project | Device | Runs |
|---|---|---|
| `journeys` | Desktop Chrome | the journeys: `e2e/*.spec.ts` and `e2e/platform/` |
| `harness` | Desktop Chrome | `layout-contract.spec.ts`, `a11y.spec.ts`, `loading.spec.ts` |
| `phone-contract` | Pixel 7 (touch, `isMobile`) | `layout-contract.spec.ts` |
| `phone-journeys` | Pixel 7 | the journeys' mobile tests (titles with "mobile viewport"; the DB Diagram's 375px test starts from its desktop canvas, so it runs in `journeys`) |
| `webkit` | Desktop Safari | `layout-contract.spec.ts` |
| `screenshots` | Desktop Chrome and Pixel 7 | `screenshots.spec.ts`, for the Tools in `SCREENSHOT_TOOLS` |

No project retries: a flaky check is a finding, not noise.

## The parts

- **Layout contract** (`layout-contract.spec.ts`, `layout-contract.ts`). Reads every Tool and its layout from `src/constants/tool-routes.ts`. For each Tool with a layout, on its route: the status slot sits above the work area (before the output, and before the source field where there is one), the output shows its placeholder (a Generator shows a value, marked `data-has-value`), the action that takes the output away sits with the output (Copy, or Download for a Generator's image), no alert shows, and the bad input shows in the status slot and clears the output. One Tool per layout runs again in the dashboard dialog, and each File Processor's dashboard tile is checked to be one plain button that opens the dialog. The error path starts from bad input, as the jsdom suites do; that it clears an output that held a value is covered by `layout-journeys.spec.ts`, one Tool per layout. These are the checks of the jsdom suites (`src/test/layout-contract.tsx`), which stay on `main` until cutover.
- **Bad-input fixtures** (`layout-fixtures.ts`). The `LayoutErrorFixture` data (`storage`, `steps`, `never`), read by both the jsdom suites and this harness. A Tool whose input cannot be invalid has `never` and a reason, and its error-path test is skipped with that reason in the title.
- **Loading check** (`loading.spec.ts`). The home page and a Tool route (the first of Hash Generator, Escaped JSON Stringifier, JSON Diff and Number Base Converter the run has: the performance budget's Tool pages that open on a field; a run with none of them shows a skipped test saying so), on a Pixel 7 under the perf harness's slow-4G throttle (`e2e/perf/throttle.ts`, the same file as on `develop`), applied through CDP, so Chromium only. The Noto emoji loading indicator is visible, and its image drawn, before the content it stands in for: in each dashboard widget its own robot before that widget's Tool, and on a Tool route the flying saucer before the Tool. The check answers the Noto emoji URLs on `fonts.gstatic.com` with a local stub, so the gate never depends on Google's CDN. An indicator that points anywhere else is still never drawn. The page fills in with a layout shift of at most 0.01, the CLS budget. Keys and taps while it loads cause no console error, and afterwards the first field takes focus.
- **axe** (`a11y.spec.ts`). Runs with tags `wcag2a`, `wcag2aa`, `wcag21a` and `wcag21aa` on every Tool route when it opens, and again in the bad-input state from the contract's fixture. It also runs on the home page and in the dashboard dialog, once per layout, on the Tool the contract suite opens there (`DIALOG_TOOL`, or on a build without it the first Tool of that layout). The recording covers the dialog of every Tool with a layout, so that fallback has its own baseline entry. It waits for the loading indicator and the cards' fade-in to finish first, because axe reads colour through opacity.
- **Screenshots** (`screenshots.spec.ts`, `touched-tools.ts`). On a pull request, CI saves a desktop and a phone screenshot of each Tool whose own module the PR changes, and uploads them as the `parity-screenshots` artifact. They are evidence for the reviewer, not a gate. A change to a shared shell names no Tool. To take screenshots by hand, run `SCREENSHOT_TOOLS=<keys> pnpm test:parity --project=screenshots`.

## The a11y baseline

`a11y-baseline.json` lists the axe failures React has today. Each entry is a page (`home`, `dashboard-dialog`, `<tool>:open`, `<tool>:bad-input`) with the rule ids it fails and on how many elements. A page that is not listed fails nothing. A run fails when a page fails a rule that is not on its list, or fails it on more elements than listed. A rule that fails on fewer elements than listed is noted on the test as an annotation, not a failure.

Entries count elements rather than naming them by selector, so the list holds across two builds whose markup differs, while a new failing element still fails the run.

To regenerate it, against React only:

```bash
pnpm build && pnpm test:parity:a11y-baseline
```

This runs `a11y.spec.ts` with `PARITY_A11Y_RECORD=1`, which records each page's failing rules instead of checking them. `write-a11y-baseline.ts` then writes the file from that recording. Regenerate it only when React itself changes. A Dioxus build may not add an entry, and removing one is an improvement (`docs/ux/parity.md` → Improvements).

## The Dioxus-only tag

`@dioxus-only` (`DIOXUS_ONLY` in `tags.ts`) marks a check that a `ux-improvement` adds when it fixes an a11y baseline entry. React fails such a check by design, so both React runs (`playwright.config.ts` and the parity run) leave it out with `grepInvert`.

```ts
test('the copy button has a name', { tag: DIOXUS_ONLY }, async ({ page }) => { ... })
```

## Pointing it at another build

`defineParityConfig` (`config.ts`) builds the whole run for one build. The Dioxus config calls it with its own server and its ported Tools, as the spike's `dioxus/playwright.config.ts` did:

```ts
import { defineParityConfig } from '../e2e/parity/config'

export default defineParityConfig({
  baseURL: 'http://localhost:5174',
  build: 'dioxus',
  // The journeys for the ported Tools: React's spec files, filtered, never edited.
  journeys: { grep: /Hash Generator/, testMatch: ['crypto-tools.spec.ts'] },
  // The harness (contract, axe, screenshots) runs over these Tools only.
  tools: ['hash-generator'],
  // Paths in the command are relative to `cwd`, which defaults to this config's folder.
  webServer: { command: 'node dioxus/scripts/serve.ts dioxus/dist 5174', cwd: '..', reuseExistingServer: false, url: 'http://localhost:5174' },
})
```
