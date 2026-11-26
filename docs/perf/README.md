# Measuring a build

`e2e/perf/` measures a built site: Lighthouse, bytes and requests, and time until a tool is usable. It works on any `dist` directory that keeps the DOM hooks below, so the React site and a Dioxus build are measured the same way. Results are in [react-baseline.md](react-baseline.md). The budgets a Dioxus build must meet against React, measured in the same session, are in [budgets.md](budgets.md).

## Run it

```bash
pnpm install --frozen-lockfile
PLAYWRIGHT_SKIP_BROWSER_GC=1 pnpm exec playwright install chromium   # without the variable it can delete other projects' browsers
node e2e/perf/measure.ts <dist> <out.json> --site "<name and commit of the build>"
node e2e/perf/report.ts <out.json> [<other.json>...]   # Markdown tables, builds side by side
```

| Option | Default | Meaning |
|--------|---------|---------|
| `--site` | required | Names the build in the report. Runs with the same label are pooled, so give each build, and each session you do not want pooled, its own. |
| `--runs` | 5 | Rounds. Each round measures every page once, so drift on the machine spreads over all pages. |
| `--pages` | all | Comma-separated keys. The spike has three: `--pages hash-generator,escaped-json-stringifier,image-converter` |

A failed measurement is recorded in `failures`, the run continues, and the exit code is 1. Results are written after every step.

Rules for numbers that will be compared:

- **Measure both builds in one session on one machine.** Timings depend on the CPU, the Chromium version and the live Google Fonts and gstatic responses. Do not compare a new run with a table from another day. Alternate the builds (React, other, React, other) so drift falls on both.
- **Name the React commit.** The recorded baseline is `c3983f81`, built as described in [react-baseline.md](react-baseline.md). `main` still takes fixes, so later commits differ. The `dist` hash in the report identifies a build, but only repeats on the same paths and toolchain, because the WebAssembly files contain absolute paths.
- **Serve what is deployed.** The deploy workflows delete `dist/assets/ort-wasm-*.wasm`; delete it before measuring. Keep `dist/_headers`: without it the repeat load is slower. React's rule caches `/assets/*` only. A build that puts hashed files elsewhere, such as `/wasm/`, needs a rule for that path, or its repeat load is about 1.1 s slower. Never give one to unhashed names.
- **Keep the machine awake, quiet and on AC power**, lid open, with `caffeinate -dims` on macOS. Discard a run that slept or changed power source. Check that the CPU index in the report (Lighthouse's `benchmarkIndex`) is the same for both builds: on the baseline machine it is about 3,300 on AC and 2,350 on battery, where macOS had Low Power Mode on.
- `playwright` and `lighthouse` versions are pinned. `lighthouse` runs through `pnpm dlx`, so its own dependencies can drift. The one that matters, `speedline-core`, affects Speed Index and through it the performance score.

## What is measured

The site is served by `pages-server.ts`, which copies Cloudflare Pages: HTTP/2, brotli at Pages' settings, `_headers`, the 308 to a trailing slash, and the home page for an unknown URL. Pages also sends larger response headers, HTTP/3 and early hints, which are not reproduced.

Tool pages are requested with the trailing slash (`/tools/<key>/`). Without it Pages answers with a redirect, which adds a round trip for both builds.

**Lighthouse.** Mobile and desktop, with the throttle applied in the browser (`--throttling-method=devtools`), not simulated. Simulated throttling, Lighthouse's default and what `lighthouserc.cjs` uses, cannot be trusted for FCP and Speed Index here: it leaves out the scripts and WebAssembly that paint these pages. 1.5 MB more WebAssembly before first paint moved the simulated FCP from 1,620 to 1,625 ms while the real one went from 2.9 to 11.4 s, and the simulated score only from 77 to 74. Simulated LCP does react (6.5 to 14.0 s).

| Profile | Latency per request | Download | Upload | CPU | Device |
|---------|--------------------:|---------:|-------:|----:|--------|
| Mobile ("slow 4G") | 562.5 ms | 1,474.56 kbps | 675 kbps | 4x slower | 412x823 |
| Desktop ("dense 4G") | 150 ms | 9,216 kbps | 9,216 kbps | 1x | Lighthouse desktop preset |

Both are Lighthouse's own profiles in the form DevTools applies.

**Bytes.** A cold load in a fresh browser context, unthrottled, until the network has been quiet for 2 s. The second table adds everything loaded up to the first result, which is where lazily loaded WebAssembly shows up. Compressed bytes are response bodies, without headers. This site's own requests are split by type; third-party requests (Google Fonts, the gstatic emoji image) are a separate total. Every request, with its uncompressed size, is listed under `requests` in the results. A router that rewrites the URL while the page loads can make Chrome fetch the icon twice, so for such a build allow one request and the icon's size (5.2 kB).

**Time to usable.** Mobile profile, fresh context, milliseconds since navigation start.

| Number | Meaning |
|--------|---------|
| Ready | The controls the visitor needs are in the page and can be operated. Today they are still fading in (0.3 s). |
| First result | The correct result of a real interaction, started as soon as the page is ready, is on screen. Includes 50-400 ms of Playwright driving the page, so treat it as tracked, not as a tight budget. |
| Ready, repeat load | Ready, on a second navigation with a warm HTTP cache. |

The interactions are in `pages.ts`. Hash Generator selects MD5, the only algorithm that loads WebAssembly.

A build that ships body markup or a placeholder before its code runs could satisfy Ready too early. Check First result as well for such a build.

## Hooks a build must keep

`pages.ts` finds elements by these. The e2e specs cover most of them by role and name; the literal attributes marked * are asserted by no spec.

| Page | Ready | Interaction | Result |
|------|-------|-------------|--------|
| every tool | `h1` with the tool's name, `[data-slot="tool-surface"]` | | |
| Home | `[data-testid="dashboard-widget"] h3`, six | button "Format" | `[role="dialog"] .cm-content` |
| Hash Generator | `textarea` | button "Select MD5 algorithm" | `pre[data-has-value]` |
| Escaped JSON Stringifier | `.cm-content` | type in it | `pre[data-has-value]` |
| Image Converter | `[aria-label="Upload area"] button` * | `input[name="images"]`, button "Convert 2 images" | `[aria-label="Results"] button[aria-label^="Download csr-dev-tools_"]` *, two |
| UUID Generator | a button containing "Generate" | none, it fills on open | `button[aria-label="Copy all UUIDs to clipboard"]` * enabled |
| JSON Diff | `.cm-content`, two | type in both | `[aria-label="Diff output"]` * |
| Number Base Converter | `input[name="decimal"]` | type in it | `input[name="hex"]` |

Adding a page means adding an entry to `PERF_PAGES` and a row to this table. A page that starts a worker is listed under `workers` in the results, because the worker's own requests are not counted.

## Build time

Time the phases separately, with the tool versions CI uses (`wasm-opt` 129).

- **Cold**: after deleting every build output, compiler output included. For React: `rm -rf wasm/target wasm/pkg dist node_modules/.vite node_modules/.tmp`. The cargo registry and `node_modules` stay.
- **Warm**: the same, but keeping the compiler output (`wasm/target`, `wasm/pkg`), with no source change.

Run each three times on an idle machine and report the median. For React the phases are `pnpm wasm:build`, `pnpm exec tsc -b` and `pnpm exec vite build`, which together are `pnpm build`.
