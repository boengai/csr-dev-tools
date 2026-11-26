# Performance budgets

What a Dioxus build must meet to count as "no measured regression" against the React site, decided in [What are the performance budgets?](https://github.com/boengai/csr-dev-tools/issues/17). They were set before the spike was measured, and one rule was amended at [Go or no-go?](https://github.com/boengai/csr-dev-tools/issues/19) (see "Noisy React runs"). The method is in [README.md](README.md) and the React numbers in [react-baseline.md](react-baseline.md).

## How a build is compared

- **Against React, in the same session.** Every timing budget is a tolerance over a React build measured on the same machine in the same session, never over a table from another day. The React build is `c3983f81`, or the tip of `main` if fixes have landed since; the result names the commit.
- **Alternating, 15 samples, on AC power.** Measure the builds in turn (React, Dioxus, React, Dioxus): three runs of five rounds each, so each number is the median of 15. Follow the machine rules in [README.md](README.md): the machine stays awake and on AC power.
- **Per page.** Every page passes or fails on its own. Pages are never averaged.
- **Mobile profile.** Budgets apply to the mobile profile (slow 4G, 4x CPU slowdown, throttle applied in the browser). Desktop numbers are tracked only, because they vary by 14 to 27% between runs on the baseline machine.
- **Without the emoji images.** Budget runs remove every Noto emoji image from **both** builds. These are the loading saucer on tool pages (621.9 kB from `fonts.gstatic.com`) and the robot on home and in Image Converter's processing step (340.6 kB).
  - React uses the `data:` swap described in [react-baseline.md](react-baseline.md). It changes the one prefix all of them are built from.
  - The Dioxus build drops the same images, for example with a build flag. Do not shorten a string inside a `.wasm` file, because that corrupts it.
  - Either way, check the result: the `requests` list in each build's bytes results has no request under `fonts.gstatic.com/s/e/notoemoji/`.
  - Each build is also measured as shipped, in the same session, tracked only.
  - Whether the Dioxus site keeps the emoji is a UX parity question for [How is UX parity proven?](https://github.com/boengai/csr-dev-tools/issues/24).

## Pages

- **The spike** is judged on its three pages: Hash Generator, Escaped JSON Stringifier and Image Converter.
- **After go**, the budgets apply to all seven baseline pages: home, those three, UUID Generator, JSON Diff and Number Base Converter.

## Budgets

Each limit is on the Dioxus median, against the React median for the same page.

| Metric | Limit |
|--------|-------|
| FCP | at most 5% above React |
| LCP | at most 10% above React |
| Ready | at most 5% above React |
| Ready, repeat load | at most 10% above React |
| TBT | at most 50 ms above React |
| CLS | at most 0.01 |
| Lighthouse accessibility, best practices, SEO | no lower than React |

For context, the noise the baseline recorded between runs is: FCP 1.9%, LCP 5.0%, Ready 0.9% and Ready on repeat load 4.8%. Every limit sits above it. TBT (0 to 27 ms) and CLS (0.000) are near zero today, so their limits are absolute. They catch WebAssembly compiling on the main thread and an empty root that fills in late.

Both the first load and the repeat load are budgeted. WebAssembly makes the first download larger and the repeat load cached, so leaving out either one hides a problem: a large module or a broken cache. A build that puts hashed files outside `/assets/` must ship a `_headers` cache rule for that path (see [README.md](README.md)).

For scale, on the baseline numbers for all seven pages, which include the emoji: 5% of FCP is about 150 ms, 10% of LCP is 490 to 700 ms, 5% of Ready is 230 to 290 ms, and 10% of the repeat load is about 105 ms.

### Tracked only

These are recorded beside React with no pass or fail:

- First result. It includes 50 to 400 ms of Playwright driving the page.
- Own bytes and requests, and third-party bytes. On slow 4G their cost already shows up in the budgeted timings.
- The Lighthouse performance score and Speed Index.
- Every desktop number.
- Each build measured as shipped, with its emoji images.
- Build time and output size.
- The uncompressed size of the main WebAssembly file, which is an input to [Go or no-go?](https://github.com/boengai/csr-dev-tools/issues/19), as decided in [Do tool pages prerender their body or only their head?](https://github.com/boengai/csr-dev-tools/issues/26). No report table shows it. Read the file's size in `dist`, or its `decoded` entry in the `requests` list of the bytes results.

## When a session counts

Discard a session and measure again if any of these happens:

- **CPU index.** On any page, the two builds' pooled mobile CPU index medians, as printed by `report.ts`, differ by more than 5%. This is Lighthouse's `benchmarkIndex`.
- **Power or sleep.** The machine was not on AC power throughout, or it slept. The harness does not record this. On macOS, keep `pmset -g batt` output from before and after each run, and check `pmset -g log` for sleep and wake events during the run.
- **Noisy React runs.** React's three run medians spread by more than twice the baseline noise on any budgeted page: FCP over 3.8%, LCP over 10%, Ready over 1.8%, or Ready on repeat load over 9.6%.
  - Spread is the highest of the three run medians minus the lowest, divided by the lowest. This is how the baseline's Noise table was computed.
  - The pooled report does not show per-run medians. Run `node e2e/perf/report.ts <run>.json` once per React file, or read `lighthouse[page].mobile.metrics.{fcp,lcp}.median` and `usable[page].{ready,repeatReady}.median` from each file.
  - **One exception: React's Image Converter LCP.** Its single loads land near 4,210, 4,520 or 4,780 ms, so its run medians spread about 6 to 13% in every spike session, whatever the session's quality.
    - If it is the only React number over its limit, the session still counts.
    - Image Converter's LCP budget is then checked against React's **lowest** run median, the strictest of the three, instead of its pooled median.
    - The CPU index and power rules still apply.
    - Decided in [Go or no-go?](https://github.com/boengai/csr-dev-tools/issues/19), which ADR-0031 records.

## What a miss means

**In the spike, every budget is a stop condition.**

- **FCP or LCP** over its limit first goes through the remedy order in [Do tool pages prerender their body or only their head?](https://github.com/boengai/csr-dev-tools/issues/26): a WebAssembly preload, a smaller or split module, then a placeholder.
  - A remedy is adopted only if Ready after it is no more than 1% above Ready before it, and First result after it is no more than 3.6% above (twice its baseline noise of 1.8%). A placeholder can make Ready come too early, so First result is the check against that.
  - Before and after are measured like the budgets: in one session, alternating, three runs of five rounds, medians of 15.
  - If the remedies fail, [Go or no-go?](https://github.com/boengai/csr-dev-tools/issues/19) decides.
- **Ready, Ready on repeat load, TBT, CLS or one of the three Lighthouse scores** still over its limit after the spike's own fixes goes straight to [Go or no-go?](https://github.com/boengai/csr-dev-tools/issues/19) as a failed stop condition.
- **A tracked number** never stops the migration.

**After go:**

- **Before cutover**, the full budget check runs on all seven pages, alternating with React. A miss blocks cutover until it is fixed on `develop`.
- **At the end of each port batch**, and on any pull request that changes the app shell or how tools load, a tracked re-measure runs. A miss opens an issue but does not stop porting.

## CI on `develop`

Timings on a CI runner are noisy and cannot be compared with the baseline. `lighthouserc.cjs` uses simulated throttling, which cannot see WebAssembly in FCP. So the only new check is on bytes, which do not vary between runs.

- **Byte check.** For every page, home and all 84 tool pages, it measures the site's own compressed first-load bytes (the "Own total" of the first-load table) and fails a pull request if either:
  - the page grew by more than 2% over the base branch, or
  - the page is over its ceiling in a committed per-page ceiling file.

  The 2% rule catches a sudden jump, and the ceiling file stops slow creep. To raise a ceiling, edit the file in the same pull request so review sees the change.

  Every page gets its ceiling from the pull request that first ports it to `develop`. That includes the three spike pages, because no spike code is kept (ADR-0031). Both rules apply from the next pull request on. Pages not yet ported are not checked.
- **When.** It is built with the first Dioxus code on `develop` after go, not before. The harness cannot run it today. It needs three things:
  - a bytes-only entry point, because `measure.ts` runs Lighthouse and the usable step every round;
  - a page list covering every tool, because `PERF_PAGES` has seven;
  - a comparison against the base branch and the ceiling file, because `report.ts` only prints tables.
- **Lighthouse CI** stays a pull request check that is not required.
- **Timing budgets** are checked by hand with the harness, at the milestones above.

These rules have no ADR of their own. The numbers are cheap to change, so this file and the issues are the record. ADR-0031 cites the Image Converter LCP exception because the go decision depends on it.
