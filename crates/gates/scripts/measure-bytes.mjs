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

const files = {}
const pages = {}
for (const path of walk(dist).sort()) {
  const name = relative(dist, path).split(sep).join('/')
  const bytes = readFileSync(path)
  files[name] = brotli(bytes)
  if (!name.endsWith('index.html')) continue
  const route = `/${name.slice(0, -'index.html'.length)}`.replace(/(.)\/$/, '$1')
  // `src` and `href` on the same origin; dx writes them as "/./assets/…".
  // A query or fragment (`?v=2`) still names the same file.
  const loads = [...bytes.toString('utf8').matchAll(/\b(?:src|href)="\/(?:\.\/)?([^"?#:]+)(?:[?#][^"]*)?"/g)].map(
    (m) => m[1],
  )
  pages[route] = [name, ...new Set(loads)]
}

process.stdout.write(`${JSON.stringify({ files, pages }, null, 2)}\n`)
