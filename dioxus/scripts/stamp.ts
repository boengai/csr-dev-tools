// Head-stamps the Dioxus build (issue 26): one `tools/<key>/index.html` per
// ported tool, a copy of the home page with that tool's head tags and the same
// empty `#root`. The tags are rewritten by the React build's own function, so
// both builds stamp the same tags the same way. Run after every build: any
// wasm change renames the JS file the pages load.
//
//   node dioxus/scripts/stamp.ts <dist> [--preload-wasm=auto|all|main|low | --no-preload]
//                                       [--preload-via=inline|script|link]
//
// With no option it uses `auto`, as build.sh does: re-stamping a build must not
// silently drop its preloads (that voided session 5, docs/research/dioxus-spike.md).
//
// `--preload-wasm` is the first FCP/LCP remedy of issue 26: each tool page
// preloads the main WebAssembly module and its own route module, which the
// loader would otherwise request only after the JS (and the main module) ran.
// `all` preloads both, `main` only the main module, `low` the route module at
// `fetchpriority="low"`. `auto` (the default) preloads the route module only
// when it is at most AUTO_ROUTE_LIMIT bytes: measured on Image Converter, a
// 356 KB route module preloaded beside the main one pushed FCP from -11% to
// +14% against React, and `fetchpriority="low"` did not change that
// (docs/research/dioxus-spike.md).
//
// `--preload-via` is how the download starts early (issue 35):
// - `link` writes `<link rel="preload" as="fetch">` tags. Chromium hands the
//   preloaded response to the loader's `fetch()`. WebKit does not, with any
//   combination of `type` and `crossorigin`, and downloads the module again.
// - `inline` (the default) and `script` run dioxus/js/wasm-early-fetch.js
//   first in the head. It calls `fetch()` for each module named in a
//   `<meta name="wasm-early-fetch">` and hands that same promise to the
//   loader's first `fetch()` of the URL, so every engine makes one request.
//   `fetchpriority` does not apply, so `low` means the same as `all`.
//   `inline` puts the script in the page and adds its hash to the `script-src`
//   of `_headers`. The script is the same bytes on every page, so one hash
//   covers them all and no `'unsafe-inline'` is needed. `script` writes it to
//   /assets instead, which leaves the CSP alone and costs a request. Measured
//   on the mobile profile, that request puts FCP 3.6 to 11.6% above React and
//   Ready 11 to 16% above the link build, so it fails the budget; `inline`
//   is within 1.3% of the link build on both (docs/perf/wasm-early-fetch.md
//   on `develop`).
import { createHash } from 'node:crypto'
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { TOOL_ROUTES } from '../../src/constants/tool-routes.ts'
import { renderRouteHtml } from '../../vite-plugins/prerender.ts'
import { SPIKE_TOOL_KEYS } from './spike-tools.ts'

const fail = (message: string): never => {
  throw new Error(`[stamp] ${message}`)
}
const option = (name: string) =>
  process.argv
    .find((a) => a.startsWith(`--${name}=`))
    ?.split('=')
    .slice(1)
    .join('=')

const dist = resolve(process.argv[2] ?? 'dioxus/dist')
const preloadWasm = !process.argv.includes('--no-preload')
const preloadMode = option('preload-wasm') ?? 'auto'
const preloadVia = option('preload-via') ?? 'inline'
const AUTO_ROUTE_LIMIT = 128 * 1024
if (!['auto', 'all', 'main', 'low'].includes(preloadMode)) fail(`unknown --preload-wasm=${preloadMode}`)
if (!['inline', 'script', 'link'].includes(preloadVia)) fail(`unknown --preload-via=${preloadVia}`)

const assets = readdirSync(resolve(dist, 'assets'))
const pascal = (key: string) => key.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase())

/** The modules a tool page starts early: the main one, and its route module when the mode allows. */
const preloadFiles = (key: string): Array<{ file: string; priority: string }> => {
  const main = assets.find((f) => /^csr-dev-tools-dioxus_bg-.*\.wasm$/.test(f))
  const route = assets.find((f) => new RegExp(`^module_\\d+_route${pascal(key)}[0-9a-f]{32}-.*\\.wasm$`).test(f))
  if (!main) return fail(`no main module to preload for ${key}`)
  // An unsplit build (--no-split) has no route modules: the main one holds every tool.
  if (!route || preloadMode === 'main') return [{ file: main, priority: '' }]
  if (preloadMode === 'auto' && statSync(resolve(dist, 'assets', route)).size > AUTO_ROUTE_LIMIT)
    return [{ file: main, priority: '' }]
  return [
    { file: main, priority: '' },
    { file: route, priority: preloadMode === 'low' ? ' fetchpriority="low"' : '' },
  ]
}

const earlyFetch = readFileSync(resolve(import.meta.dirname, '../js/wasm-early-fetch.js'), 'utf-8').trim()
const sha256 = (encoding: 'base64' | 'hex') => createHash('sha256').update(earlyFetch).digest(encoding)
const earlyFetchHash = `'sha256-${sha256('base64')}'`
const earlyFetchFile = `wasm-early-fetch-${sha256('hex').slice(0, 16)}.js`
const earlyFetchScript =
  preloadVia === 'inline' ? `<script>${earlyFetch}</script>` : `<script src="/assets/${earlyFetchFile}"></script>`
const CHARSET = /<meta charset="[^"]*"\s*\/?>/

/** The page with its WebAssembly downloads started early, by link tags or by the early-fetch script. */
const withPreloads = (page: string, key: string) => {
  const files = preloadFiles(key)
  if (preloadVia === 'link') {
    const tags = files.map(
      ({ file, priority }) =>
        `<link rel="preload" href="/assets/${file}" as="fetch" type="application/wasm" crossorigin${priority}>`,
    )
    return page.replace('</head>', `${tags.join('')}</head>`)
  }
  const meta = `<meta name="wasm-early-fetch" content="${files.map(({ file }) => `/assets/${file}`).join(' ')}">`
  // Straight after the charset: a script below a stylesheet waits for that stylesheet.
  if (!CHARSET.test(page)) fail('index.html has no <meta charset> to put the early fetch after')
  return page.replace(CHARSET, (charset) => `${charset}${meta}${earlyFetchScript}`)
}

/** `_headers` allows exactly the inline script this run stamps, and no script hash otherwise. */
const stampCsp = () => {
  const path = resolve(dist, '_headers')
  const CSP_SCRIPT_SRC = /^(\s+Content-Security-Policy:.*script-src 'self')((?: 'sha256-[A-Za-z0-9+/=]+')*)/m
  const headers = readFileSync(path, 'utf-8')
  const inline = preloadWasm && preloadVia === 'inline'
  if (inline && !CSP_SCRIPT_SRC.test(headers)) fail("_headers has no script-src 'self' to add the script hash to")
  writeFileSync(
    path,
    headers.replace(CSP_SCRIPT_SRC, (_, start: string) => (inline ? `${start} ${earlyFetchHash}` : start)),
  )
}

const template = readFileSync(resolve(dist, 'index.html'), 'utf-8')

// What dx must have produced for the pages to work at all.
if (!template.includes('<div id="root"></div>')) fail('index.html has no empty #root')
if (!/<link rel="stylesheet" href="[^"]*\/assets\/tailwind-[^"]+\.css"/.test(template))
  fail('index.html has no stylesheet in the static head')
if ((template.match(/<title>/g) ?? []).length !== 1) fail('index.html must have exactly one <title>')
const reactTitle = /<title>([^<]*)<\/title>/.exec(readFileSync(resolve(import.meta.dirname, '../../index.html'), 'utf-8'))?.[1]
if (!template.includes(`<title>${reactTitle}</title>`)) fail(`home <title> is not "${reactTitle}"`)

for (const key of SPIKE_TOOL_KEYS) {
  const route = TOOL_ROUTES.find((r) => r.key === key) ?? fail(`unknown tool ${key}`)
  const out = resolve(dist, route.routePath.replace(/^\//, ''), 'index.html')
  mkdirSync(dirname(out), { recursive: true })
  const page = preloadWasm ? withPreloads(template, key) : template
  writeFileSync(
    out,
    renderRouteHtml(page, {
      description: route.seo.description,
      path: route.routePath,
      title: route.seo.title,
      url: route.routePath,
    }),
  )
}
stampCsp()
if (preloadWasm && preloadVia === 'script') writeFileSync(resolve(dist, 'assets', earlyFetchFile), earlyFetch)
// eslint-disable-next-line no-console -- CLI script output
console.log(`[stamp] wrote ${SPIKE_TOOL_KEYS.length} tool pages into ${dist}`)
