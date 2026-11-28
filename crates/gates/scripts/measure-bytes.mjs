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

// The page loads these at first: a script, an image or media source, and a
// stylesheet, preload or icon link. A link to another page (`<a href>`) is not a load.
const LOADING_TAG = /<(script|img|source|link)\b[^>]*>/gi
const LOADING_LINK = /\brel="(?:[^"]*\s)?(?:stylesheet|modulepreload|preload|icon)(?:\s[^"]*)?"/i
const SITE = 'http://site.invalid'

/** The same-origin files a page's HTML loads at first, as paths in the build. */
const firstLoads = (html, route) => {
  const base = `${SITE}${route === '/' ? '/' : `${route}/`}`
  return [...html.matchAll(LOADING_TAG)].flatMap(([tag, name]) => {
    if (name.toLowerCase() === 'link' && !LOADING_LINK.test(tag)) return []
    const value = tag.match(/\b(?:src|href)="([^"]+)"/i)?.[1]
    if (!value) return []
    // Relative, root-relative and dx's "/./assets/…" resolve against the page;
    // another origin, protocol-relative "//cdn…" included, is not the site's own bytes.
    const url = new URL(value, base)
    return url.origin === SITE ? [decodeURIComponent(url.pathname).slice(1)] : []
  })
}

const files = {}
const pages = {}
for (const path of walk(dist).sort()) {
  const name = relative(dist, path).split(sep).join('/')
  const bytes = readFileSync(path)
  files[name] = brotli(bytes)
  if (!name.endsWith('index.html')) continue
  const route = `/${name.slice(0, -'index.html'.length)}`.replace(/(.)\/$/, '$1')
  pages[route] = [name, ...new Set(firstLoads(bytes.toString('utf8'), route))]
}

process.stdout.write(`${JSON.stringify({ files, pages }, null, 2)}\n`)
