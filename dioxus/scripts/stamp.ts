// Head-stamps the Dioxus build (issue 26): one `tools/<key>/index.html` per
// ported tool, a copy of the home page with that tool's head tags and the same
// empty `#root`. The tags are rewritten by the React build's own function, so
// both builds stamp the same tags the same way. Run after every build: any
// wasm change renames the JS file the pages load.
//
//   node dioxus/scripts/stamp.ts <dist> [--preload-wasm=auto|all|main|low | --no-preload]
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
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { TOOL_ROUTES } from '../../src/constants/tool-routes.ts'
import { renderRouteHtml } from '../../vite-plugins/prerender.ts'
import { SPIKE_TOOL_KEYS } from './spike-tools.ts'

const dist = resolve(process.argv[2] ?? 'dioxus/dist')
const preloadArg = process.argv.find((a) => a.startsWith('--preload-wasm'))
const preloadWasm = !process.argv.includes('--no-preload')
const preloadMode = preloadArg?.split('=')[1] ?? 'auto'
const AUTO_ROUTE_LIMIT = 128 * 1024
if (!['auto', 'all', 'main', 'low'].includes(preloadMode)) throw new Error(`[stamp] unknown --preload-wasm=${preloadMode}`)
const assets = readdirSync(resolve(dist, 'assets'))
const pascal = (key: string) => key.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase())
const preloadTags = (key: string) => {
  const main = assets.find((f) => /^csr-dev-tools-dioxus_bg-.*\.wasm$/.test(f))
  const route = assets.find((f) => new RegExp(`^module_\\d+_route${pascal(key)}[0-9a-f]{32}-.*\\.wasm$`).test(f))
  const tag = (f: string, priority = '') =>
    `<link rel="preload" href="/assets/${f}" as="fetch" type="application/wasm" crossorigin${priority}>`
  if (!main) throw new Error(`[stamp] no main module to preload for ${key}`)
  // An unsplit build (--no-split) has no route modules: the main one holds every tool.
  if (!route || preloadMode === 'main') return tag(main)
  if (preloadMode === 'auto' && statSync(resolve(dist, 'assets', route)).size > AUTO_ROUTE_LIMIT) return tag(main)
  return tag(main) + tag(route, preloadMode === 'low' ? ' fetchpriority="low"' : '')
}
const template = readFileSync(resolve(dist, 'index.html'), 'utf-8')

const fail = (message: string): never => {
  throw new Error(`[stamp] ${message}`)
}

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
  const page = preloadWasm ? template.replace('</head>', `${preloadTags(key)}</head>`) : template
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
// eslint-disable-next-line no-console -- CLI script output
console.log(`[stamp] wrote ${SPIKE_TOOL_KEYS.length} tool pages into ${dist}`)
