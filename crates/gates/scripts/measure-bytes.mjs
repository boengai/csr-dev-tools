#!/usr/bin/env node
// Measures a Dioxus build for the byte check (docs/quality/gates.md → "Byte
// ceilings"): each file's brotli size, and the same-origin files each page's
// HTML loads. The `gates` crate turns this into ceiling rows and judges them
// (tests/bytes.rs).
// Usage: node crates/gates/scripts/measure-bytes.mjs <dist-dioxus> > bytes.json
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { brotliCompressSync, constants } from 'node:zlib'

const dist = process.argv[2]
if (!dist) {
  process.stderr.write('usage: measure-bytes.mjs <dist-dioxus>\n')
  process.exit(2)
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  )

const brotli = (bytes) =>
  brotliCompressSync(bytes, {
    params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY },
  }).length

// The page loads these at first: a script, an image or media source, a video's poster,
// and a stylesheet, preload or icon link. A link to another page (`<a href>`) is not a load.
// A quoted attribute may hold `>`, so the tag runs to the first `>` outside quotes.
const LOADING_TAG = /<(script|img|source|link|video)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi
// A commented-out tag loads nothing.
const HTML_COMMENT = /<!--[\s\S]*?-->/g
// The attribute that names what a tag loads; a video's own `src` streams on play, its poster at once.
const LOADED_BY = { link: 'href', video: 'poster' }
const LOADING_REL = /^(?:stylesheet|modulepreload|preload|icon)$/i
const SITE = 'http://site.invalid'

// One attribute: its name, then a double-quoted, single-quoted or bare value, if any.
const ATTRIBUTE = /([^\s=>"'/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g

/** A tag's attributes by lower-case name, read in order, so text inside a quoted value is never a name. */
const attributes = (tag) => {
  const body = tag.replace(/^<\w+/, '').replace(/\/?>$/, '')
  return new Map([...body.matchAll(ATTRIBUTE)].map((m) => [m[1].toLowerCase(), m[2] ?? m[3] ?? m[4] ?? '']))
}

/** A same-origin URL as a path in the build, or undefined for another origin. */
const sitePath = (value, base) => {
  // Relative, root-relative and dx's "/./assets/…" resolve against the page;
  // another origin, protocol-relative "//cdn…" included, is not the site's own bytes.
  const url = new URL(value, base)
  return url.origin === SITE ? decodeURIComponent(url.pathname).slice(1) : undefined
}

/**
 * The same-origin files a page's HTML loads at first, as paths in the build.
 * An image or source with a `srcset` loads one of its candidates (or its `src`);
 * which one depends on the screen, so the largest counts.
 */
const firstLoads = (html, route, files) => {
  // The static host redirects "/tools/x" to "/tools/x/" (e2e/perf/pages-server.ts models it,
  // and serve-dioxus.mjs does the same), so a relative URL resolves against the page's directory.
  const base = `${SITE}${route === '/' ? '/' : `${route}/`}`
  return [...html.replace(HTML_COMMENT, '').matchAll(LOADING_TAG)].flatMap(([tag, name]) => {
    const kind = name.toLowerCase()
    const isLink = kind === 'link'
    const parsed = attributes(tag)
    const attribute = (key) => parsed.get(key)
    if (isLink && !(attribute('rel') ?? '').split(/\s+/).some((rel) => LOADING_REL.test(rel))) return []
    const candidates = [
      attribute(LOADED_BY[kind] ?? 'src'),
      // Each candidate is "<url> [<width>w|<density>x]"; the URL holds no spaces.
      ...(isLink ? [] : (attribute('srcset') ?? '').split(',').map((candidate) => candidate.trim().split(/\s+/)[0])),
    ]
      .filter(Boolean)
      .map((value) => sitePath(value, base))
      .filter((path) => path !== undefined)
    if (candidates.length === 0) return []
    // A candidate the build does not hold is returned too, so the byte check reports it.
    const missing = candidates.filter((path) => files[path] === undefined)
    const held = candidates.filter((path) => files[path] !== undefined)
    const largest = held.reduce(
      (best, path) => (best === undefined || files[path] > files[best] ? path : best),
      undefined,
    )
    return [...missing, ...(largest === undefined ? [] : [largest])]
  })
}

// Every file's size first, so a page can pick its largest srcset candidate.
const paths = walk(dist)
  .sort()
  .map((path) => ({ bytes: readFileSync(path), name: relative(dist, path).split(sep).join('/') }))
const files = Object.fromEntries(paths.map(({ bytes, name }) => [name, brotli(bytes)]))
const pages = {}
for (const { bytes, name } of paths) {
  // A page is a file named exactly index.html, not one whose name ends in it.
  if (name !== 'index.html' && !name.endsWith('/index.html')) continue
  const route = `/${name.slice(0, -'index.html'.length)}`.replace(/(.)\/$/, '$1')
  pages[route] = [name, ...new Set(firstLoads(bytes.toString('utf8'), route, files))]
}

process.stdout.write(`${JSON.stringify({ files, pages }, null, 2)}\n`)
