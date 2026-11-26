# ADR 0031 — Migrate to Dioxus 0.7.10

- **Status:** Accepted
- **Date:** 2026-11-27

## Context

The map ([issue 5](https://github.com/boengai/csr-dev-tools/issues/5))
plans a move of all 84 tools from React to Dioxus, gated on a measured
spike. The bar is no measured regression, as set by
[`docs/perf/budgets.md`](../perf/budgets.md). The spike
([issue 18](https://github.com/boengai/csr-dev-tools/issues/18)) ported
the app shell, three layout shells and three tools. Its write-up is
[`docs/research/dioxus-spike.md` at `a2b8be59`](https://github.com/boengai/csr-dev-tools/blob/a2b8be59/docs/research/dioxus-spike.md).
[Go or no-go?](https://github.com/boengai/csr-dev-tools/issues/19) decided
the rest in conversation on 2026-11-27.

- **Performance.** The adopted build (`7b865710`, with a WebAssembly
  preload) was measured in session 3, the third budget session, on
  2026-11-26. It passed every budget on all three pages. On the mobile
  profile:
  - FCP was 4.5 to 11.6% below React's.
  - LCP was 39.4 and 41.3% below on Hash Generator and Escaped JSON
    Stringifier. Image Converter is judged by the rule below: it was 1.2%
    above React's lowest run median, against a limit of 10%.
  - Ready was 11.4 to 45.1% below, and Ready on repeat load about 30%
    below.
  - TBT was within 13 ms and CLS was 0. The accessibility, best-practices
    and SEO scores were equal.

  Without the preload, FCP missed by about 8%.
- **Why session 3 counts.** Under
  [Noisy React runs](../perf/budgets.md#when-a-session-counts), session 3
  would have been discarded. Only one React number was noisy: Image
  Converter's LCP. That number is trimodal, and it spread about 6 to 13% in
  every session. Every other React spread in session 3 was at most 3.3%.
  `budgets.md` now has an exception for that one number: it is checked
  against React's lowest run median, and the session counts.
- **Search engines.** The main WebAssembly file is 530,968 bytes
  uncompressed, a quarter of the 2 MB per-file crawl figure noted in
  [issue 26](https://github.com/boengai/csr-dev-tools/issues/26). That
  figure is not verified, and no crawler limit on WebAssembly was checked.
  The head tags are stamped into the HTML, so a page's metadata does not
  wait for the module.
- **Slop, structure and UX can be kept under control.** Each gap the spike
  showed has an owner:
  - `expect` in UI paths, and a single 360-line file-processor component
    where React composes small parts, go to the anti-slop gates
    ([issue 25](https://github.com/boengai/csr-dev-tools/issues/25)).
  - A split between a tested `logic` crate and an `app` crate suggested
    itself. The code's layout belongs to
    [issue 20](https://github.com/boengai/csr-dev-tools/issues/20).
  - The DOM contract carried over: the React journeys for the three tools
    passed unchanged. The `dioxus-primitives` select drops focus after a
    pick, which fails WCAG 2.4.3; that goes to
    [issue 22](https://github.com/boengai/csr-dev-tools/issues/22).
- **Other gaps the spike found.** Split chunks change name and bytes on
  every build, and code shared between routes is copied into each route
  module.
- **Found at go/no-go: WebKit downloads every preloaded module twice**
  ([issue 35](https://github.com/boengai/csr-dev-tools/issues/35)). Issue
  26 had warned about this for Safari, but the spike did not test it. It
  was measured in Playwright's WebKit. Real Safari is still to be checked.
  Every budget run so far has been in Chromium.
- **Maintenance,** from GitHub on 2026-11-27:
  - 0.7.10 (2026-07-30) is the latest stable release.
  - 0.8 is at alpha.3 (2026-10-16).
  - The main repository had 81 commits since 2026-08-27.
  - The primitives repository had 8 commits in that time, in two bursts
    (8 September and 24–25 November), and it has no tags.

## Decision

1. **Go.** The migration proceeds on `develop`, under the map. `main`
   stays the production React site until cutover.
2. **Dioxus `=0.7.10`, with dx 0.7.10.** Both are pinned exactly. 0.8 is
   a separate decision, taken only after it has a stable release. Until
   then the alphas are not followed.
3. **The spike's code does not survive.** Nothing from `spike/dioxus`
   merges, and that branch stays as a read-only reference. The Dioxus code
   on `develop` starts from zero. The patterns worth rebuilding are:
   - stamping each page with the React build's `renderRouteHtml`;
   - the stylesheet in the static head;
   - the typed `wasm-bindgen` bridge to CodeMirror, with no
     `document::eval`;
   - the build's check for debug info, and its no-emoji flag for budget
     runs;
   - a prebuilt, checksum-checked dx in CI.
4. **Go holds on four conditions:**
   1. **The double download is fixed before the first port PR merges**
      ([issue 35](https://github.com/boengai/csr-dev-tools/issues/35)).
      The fix must pass the FCP budget and the remedy's adoption rule
      ([What a miss means](../perf/budgets.md#what-a-miss-means)), and it
      must be checked in WebKit.
   2. **We build our own UI primitives** (select, dialog, menu, tabs and
      toast) and do not depend on `dioxus-primitives`.
   3. **The toolchain is pinned.** dx, `wasm-opt` and `wasm-bindgen` are
      pinned and checksum-checked in CI. Today only dx is checked, and it
      downloads the other two itself at build time.
   4. **A fallback loading model stays available:** an app shell plus one
      separate module per tool. It is there in case `--wasm-split`'s
      unstable chunk names and copied shared code cannot be fixed.
5. **The page body is not prerendered.** The first remedy from
   [issue 26](https://github.com/boengai/csr-dev-tools/issues/26), the
   WebAssembly preload, fixed first paint. If the issue 35 fix, or later
   growth, misses FCP, issue 26's remedy order applies again.

## Considered options

- **No-go.** We would have stopped with the budgets met, on a fear about
  maintenance rather than a measured miss. The worst case, being stuck on
  0.7, is one a static, client-only site can live with.
- **Grow the spike into the real app.** It was built to answer questions,
  not to pass the anti-slop gates.
- **Re-run the budget session.** React's trimodal LCP would very likely
  discard it again, for a reason unrelated to the session's quality.

## Consequences

- **We own what Decision 4 lists,** instead of relying on the framework.
  If route splitting cannot be fixed, we also own the fallback.
- **Headroom is about 9% of growth on the tightest budgets.**
  - Image Converter's LCP can grow 8.7% before it misses.
  - Escaped JSON Stringifier's FCP can grow 9.9%.

  The sidebar, command palette, settings and home page were not ported,
  and their cost was not measured. React loads them after first paint. If
  they end up in the main module, they delay first paint, which waits for
  that module. The tracked re-measure at each port batch is what would
  show this.
- **The spike's cost was not measured in hours.** Simple tools look cheap
  once the shells exist: each spike tool is 66 to 105 lines. The cost of
  the 84 is in the hard tools the map lists (about six) and its seven
  engine trials. The map already plans separate decisions or
  trials for them.

## Revisit when

- Any condition in Decision 4 cannot be met.
- Dioxus 0.8 ships a stable release.
