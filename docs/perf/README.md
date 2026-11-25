# Measuring a build

`e2e/perf/` measures a built site: Lighthouse, bytes and requests, and time until a tool is usable. It works on any `dist` directory that keeps the DOM hooks below, so the React site and a Dioxus build are measured the same way. Results are in [react-baseline.md](react-baseline.md).

## Run it

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
node e2e/perf/measure.ts <dist> <out.json> --site "<name and commit of the build>"
node e2e/perf/report.ts <out.json> [<other.json>...]   # Markdown tables, builds side by side
```

| Option | Default | Meaning |
|--------|---------|---------|
| `--runs` | 5 | Rounds. Each round measures every page once, so drift on the machine spreads over all pages. |
| `--pages` | all seven | Comma-separated keys. The spike has three: `--pages hash-generator,escaped-json-stringifier,image-converter` |

A failed measurement is recorded in `failures`, the run continues, and the exit code is 1. Results are written after every step.

Rules for numbers that will be compared:

- **Measure both builds in one session on one machine**, React first. Timings depend on the CPU, the Chromium version and the live Google Fonts and gstatic responses. Do not compare a new run with a table from another day.
- **Serve what is deployed.** The deploy workflows delete `dist/assets/ort-wasm-*.wasm`; delete it before measuring. Keep `dist/_headers`: without it the repeat load is slower.
- **Keep the machine awake and quiet**: AC power, lid open, `caffeinate -dims` on macOS. A run that slept in the middle must be discarded.
- `playwright` and `lighthouse` versions are pinned. `lighthouse` runs through `pnpm dlx`, so its own dependencies can drift. The one that matters, `speedline-core`, affects Speed Index and through it the performance score.

## What is measured

The site is served by `pages-server.ts`, which copies Cloudflare Pages: HTTP/2, brotli at Pages' settings, `_headers`, the 308 to a trailing slash, and the home page for an unknown URL. Pages also sends larger response headers, HTTP/3 and early hints, which are not reproduced.

Tool pages are requested with the trailing slash (`/tools/<key>/`). Without it Pages answers with a redirect, which adds a round trip for both builds.

**Lighthouse.** Mobile and desktop, with the throttle applied in the browser (`--throttling-method=devtools`), not simulated. Simulated throttling, Lighthouse's default and what `lighthouserc.cjs` uses, cannot judge this migration. Its first paint leaves out code fetched by a script, so 1.5 MB more WebAssembly before first paint moved the simulated FCP from 1,620 to 1,625 ms while the real one went from 2.9 to 11.4 s.

| Profile | Latency per request | Download | Upload | CPU | Device |
|---------|--------------------:|---------:|-------:|----:|--------|
| Mobile ("slow 4G") | 562.5 ms | 1,474.56 kbps | 675 kbps | 4x slower | 412x823 |
| Desktop ("dense 4G") | 150 ms | 9,216 kbps | 9,216 kbps | 1x | Lighthouse desktop preset |

Both are Lighthouse's own profiles in the form DevTools applies.

**Bytes.** A cold load in a fresh browser context, unthrottled, until the network has been quiet for 2 s. The second table adds everything loaded up to the first result, which is where lazily loaded WebAssembly shows up. Compressed bytes are response bodies, without headers. This site's own requests are split by type; third-party requests (Google Fonts, the gstatic emoji image) are a separate total.

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

Adding a page means adding an entry to `PERF_PAGES`. A page that starts a worker is listed under `workers` in the results, because the worker's own requests are not counted.

## Build time

Time the phases separately, with the tool versions CI uses (`wasm-opt` 129).

- **Cold**: after deleting every build output, compiler output included. For React: `rm -rf wasm/target wasm/pkg dist node_modules/.vite node_modules/.tmp`. The cargo registry and `node_modules` stay.
- **Warm**: the same, but keeping the compiler output (`wasm/target`, `wasm/pkg`), with no source change.

Run each three times on an idle machine and report the median. For React the phases are `pnpm wasm:build`, `pnpm exec tsc -b` and `pnpm exec vite build`, which together are `pnpm build`.
