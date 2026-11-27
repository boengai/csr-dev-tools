# Starting the WebAssembly download early

The answer to [Safari downloads preloaded WebAssembly twice](https://github.com/boengai/csr-dev-tools/issues/35), measured 2026-11-27. It is the first go condition of [ADR-0031](../adr/0031-migrate-to-dioxus.md). The code is on the branch `fix/issue-35-wasm-preload`, cut from `spike/dioxus`, because `develop` has no Dioxus code yet. The port starts from zero, so this file carries what it needs.

## Answer

**Do not preload WebAssembly with `<link rel="preload" as="fetch">`. Start it with `fetch()` from a small inline script, first in the head, and hand that promise to the loader.**

- Every engine then downloads each module once. A Playwright test checks this in Chromium and WebKit on the three spike pages.
- It passed every budget against React, and the remedy's adoption rule against the preload-tag build, in a session that counts.
- It needs one `'sha256-…'` hash in the `script-src` of `_headers`. The same script as a file in `/assets` needs no CSP change, but it **fails** the FCP budget.

**Decided 2026-11-27: the hash is accepted.** The issue says the fix must not "loosen the CSP". The hash allows exactly one more script, with fixed bytes, and no `'unsafe-inline'`. The maintainer agreed this is not loosening; the only variant without a hash fails the budget.

**Still owed:** a check on a real iPhone. Safari on macOS and in the iOS Simulator are confirmed below. The budgets and the Playwright test ran in Playwright's WebKit build (Playwright 1.64).

## What WebKit does with a preload tag

The loader that `dx` writes calls `fetch(url)` for the main module and for each route module. Chromium answers that call from a matching preload. WebKit starts a second request.

No form of the tag changes that. On Hash Generator, with both responses held for 400 ms so that neither request could be answered from the other's cache entry, requests per module were:

| Tag | WebKit | Chromium |
|---|--:|--:|
| `as="fetch" type="application/wasm" crossorigin` (the spike's) | 2 | 1 |
| `as="fetch" crossorigin` | 2 | 1 |
| `as="fetch" type="application/wasm"` | 2 | 2 |
| `as="fetch"` | 2 | 2 |
| `as="fetch" crossorigin="use-credentials"` | 2 | 2 |
| the spike's, with `href` spelled as the loader spells it (`/./assets/…`) | 2 | 1 |
| `rel="prefetch"` | 1 | 2 |

WebKit made one request under `rel="prefetch"`. Whether that request started early was not checked. Chromium doubles it either way, so it is not a remedy.

## The remedy

Each tool page names its early modules in a `<meta>` and runs this script, both straight after `<meta charset>`:

```html
<meta name="wasm-early-fetch" content="/assets/<main>.wasm /assets/<route>.wasm">
<script>…</script>
```

```js
(() => {
  const meta = document.querySelector('meta[name="wasm-early-fetch"]')
  if (!meta) return
  const nativeFetch = window.fetch
  const key = (url) => new URL(url, location.href).href
  const started = new Map()
  for (const url of meta.content.split(' ')) {
    const response = nativeFetch(url)
    response.catch(() => {})
    started.set(key(url), response)
  }
  window.fetch = function (input, init) {
    const url = typeof input === 'string' && init === undefined ? key(input) : ''
    const response = started.get(url)
    if (!response) return nativeFetch.apply(this, arguments)
    started.delete(url)
    if (!started.size) window.fetch = nativeFetch
    return response.catch(() => nativeFetch(input))
  }
})()
```

This is `dioxus/js/wasm-early-fetch.js` as measured, at `f68cef16`. What matters in it:

- **It is the same request the loader would make**, a plain `fetch(url)`, so there is nothing for an engine to match or miss.
- **`window.fetch` is wrapped only until each early response has been handed over once.** The loader's URLs are hard-coded in `dx`'s output, so the hand-off is done at `fetch` and the loader is not patched. A later call for the same URL, a call with options, and a failed early request all go to the real `fetch`.
- **The URLs are in the `<meta>`, not in the script**, so the script is the same bytes on every page and one hash covers them all. The build computes the hash from the script and writes it into `_headers`. The CSP keeps no `'unsafe-inline'`, and nothing uses `document::eval`.
- **It sits above every stylesheet.** A script below a stylesheet waits for that stylesheet, and the head links one from Google Fonts.
- **The `auto` rule is unchanged:** the main module always, the route module only when it is at most 128 KiB.

If the real port can pass the promise to the loader's init directly, it should, and drop the `fetch` wrapper. The requirement is one request, started before the loader's JavaScript arrives.

## Real Safari on macOS

Safari 27.2 on macOS, driven through `safaridriver` on 2026-11-27, against the same two local builds. Requests were counted at the server, which held each `.wasm` response for 400 ms. Every load used a fresh origin, so nothing came from an earlier load's cache.

| Build | Page | Main module | Route module |
|---|---|--:|--:|
| Preload tags | Hash Generator | 2 | 1 |
| Preload tags | Escaped JSON Stringifier | 2 | 1 |
| Preload tags | Image Converter | 2 | 1 (not preloaded) |
| Inline script | all three | 1 | 1 |

- **Safari downloads the preloaded main module twice**, as Playwright's WebKit does. Resource Timing shows a `link` and a `fetch` entry of 531,282 bytes each.
- **The preloaded route module reached the server once.** Its second entry is a `fetch` of 300 bytes: the preload had finished by the time the loader asked, so the HTTP cache answered. Playwright's WebKit, with both requests in flight together, downloaded it twice. So in Safari the route module's second download depends on timing, and the main module's does not.
- **With the inline script every module is requested once,** and all three pages render, so Safari accepts the script under its CSP hash.

This was an automated run, not the network panel, and one load per page.

## Safari in the iOS Simulator

Xcode 27.2, 2026-11-27, the same two builds and the same server-side count. Each page was opened with `simctl openurl` on a fresh origin. The Simulator runs iOS's WebKit on the Mac, not on a phone. Requests for the main module, then the route module:

| Build | Page | iOS 18.4 (iPhone 16), one load | iOS 27.0 (iPhone 18 Pro), four loads |
|---|---|--:|--:|
| Preload tags | Hash Generator | 2, 2 | 2, 1 in three loads; 1, 1 in one |
| Preload tags | Escaped JSON Stringifier | 2, 2 | 2, 1 in all four |
| Preload tags | Image Converter | 2, 1 (not preloaded) | 1, 1 in all four |
| Inline script | all three | 1, 1 | 1, 1 in all four |

- **iOS 18.4 downloads every preloaded module twice,** as Playwright's WebKit does.
- **iOS 27.0 downloads the preloaded main module twice on most loads, not all.** When the preload had finished before the loader asked, the cache answered instead. The preload tags are therefore unreliable there, not always doubled.
- **With the inline script every module is requested once on both versions,** on every load, and the pages render.

## The test

`dioxus/e2e/wasm-downloads.spec.ts`, in the `spike` (Chromium) and `spike-webkit` projects of `dioxus/playwright.config.ts`. On each of the three pages it holds every `.wasm` response and the loader's JavaScript for 400 ms, then asserts that:

- every module was requested exactly once, and
- the main module was requested before the loader arrived.

The second assertion is what stops a build with no early download from passing.

| Build | Chromium | WebKit |
|---|---|---|
| Preload tags (the spike's) | 3 of 3 pass | 3 of 3 fail: two requests per preloaded module |
| No early download | 3 of 3 fail: main module requested late | 3 of 3 fail, the same |
| Early fetch, inline script | 3 of 3 pass | 3 of 3 pass |
| Early fetch, script file | 3 of 3 pass | 3 of 3 pass |

The whole Dioxus Playwright run passes with the inline script, 17 of 17. The Dioxus CI workflow installs WebKit for it.

## Measured as a remedy

By the method in [budgets.md](budgets.md): mobile profile, no emoji, four builds alternating in one session, three runs of five rounds, so each number is the median of 15.

- **Builds:** React `4f82adf8`, the tip of `main`, and one `dx` output (Dioxus `7b865710`, the spike's adopted build) stamped three ways: preload tags, inline script, script file. The stamped pages are the only difference between the three.
- **Session:** 2026-11-27, 01:02 to 03:30, MacBook with an M3 Pro, AC power throughout, `caffeinate -dims`, no sleep or wake event, no failed measurement.
- **It counts.** Pooled mobile CPU index medians are within 0.6% between builds. React's run medians spread at most 0.6% on FCP, 0.4% on Ready and 0.6% on repeat Ready. On LCP they spread 5.4% and 0.3% on the first two pages and 14.0% on Image Converter, which is the one exception `budgets.md` allows: that LCP is checked against React's lowest run median, 4,198 ms.
- **Not measured:** the builds as shipped, with their emoji images. `budgets.md` asks for that in the same session, tracked only. The stamped head is the only thing that changed, and the spike's as-shipped runs stand for the rest.
- **Raw results:** [runs/issue-35/](runs/issue-35), with the pooled tables in [report.md](runs/issue-35/report.md).

### Inline script against React

| Page | FCP | LCP | Ready | Ready, repeat | TBT | CLS |
|---|--:|--:|--:|--:|--:|--:|
| Limit | +5% | +10% | +5% | +10% | +50 ms | 0.01 |
| Hash Generator | −5.4% | −39.3% | −45.2% | −33.2% | 0 ms | 0.000 |
| Escaped JSON Stringifier | −3.4% | −41.3% | −14.1% | −29.4% | +14 ms | 0.000 |
| Image Converter | −11.7% | +1.3% (lowest React run) | −11.4% | −31.4% | 0 ms | 0.000 |

Accessibility, best practices and SEO scores equal React's on every page. **Every budget passes.**

### Adoption rule: inline script against the preload tags

| Page | Ready (limit +1%) | First result (limit +3.6%) | FCP, for information |
|---|--:|--:|--:|
| Hash Generator | −0.2% | −0.1% | +1.3% |
| Escaped JSON Stringifier | +0.1% | +0.1% | +0.7% |
| Image Converter | −0.1% | 0.0% | −0.3% |

**The rule passes.** FCP is 20 to 34 ms later on two pages. The page's HTML is 0.3 kB larger compressed.

### The script file fails

The same script as `/assets/wasm-early-fetch-<hash>.js`, with the CSP untouched:

| Page | FCP against React (limit +5%) | Ready against the preload tags (limit +1%) |
|---|--:|--:|
| Hash Generator | +9.8% | +16.3% |
| Escaped JSON Stringifier | +11.6% | +10.5% |
| Image Converter | +3.6% | +11.2% |

On slow 4G the extra request costs about 440 ms before any module starts. It is not an option.

## What the port must keep

- The inline script and its `<meta>`, first in the head of every tool page, with its hash added to `script-src` by the build. The hash is computed from the script's bytes, so it changes whenever the script does; never add `'unsafe-inline'` instead.
- The two-engine download test, running in CI.
- No `<link rel="preload">` for a `.wasm` file.
