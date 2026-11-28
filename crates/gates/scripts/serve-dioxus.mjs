#!/usr/bin/env node
// Serves a Dioxus build under the post-migration CSP, for the Dioxus
// Playwright project (docs/quality/gates.md → "CSP"). A path with no file
// gets the nearest index.html, as the static host does for client routes.
// Usage: node crates/gates/scripts/serve-dioxus.mjs <dist-dioxus> <port> <csp-file>
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, sep } from 'node:path'

const [dist, port, cspFile] = process.argv.slice(2)
if (!dist || !port || !cspFile) {
  process.stderr.write('usage: serve-dioxus.mjs <dist-dioxus> <port> <csp-file>\n')
  process.exit(2)
}

const csp = readFileSync(cspFile, 'utf8')
  .split('\n')
  .filter((line) => line.trim() && !line.startsWith('#'))
  .map((line) => line.trim())
  .join(' ')

const TYPES = {
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
}

const root = normalize(dist)
const resolve = (url) => {
  const path = normalize(join(root, decodeURIComponent(new URL(url, 'http://x').pathname)))
  if (path !== root && !path.startsWith(root + sep)) return undefined
  if (existsSync(path) && statSync(path).isFile()) return path
  // A client route: the nearest index.html above it.
  for (let dir = path; dir.startsWith(root); dir = join(dir, '..')) {
    const index = join(dir, 'index.html')
    if (existsSync(index)) return index
    if (dir === root) break
  }
  return undefined
}

createServer((request, response) => {
  const path = resolve(request.url ?? '/')
  if (!path) {
    response.writeHead(404).end()
    return
  }
  response.writeHead(200, {
    'Content-Security-Policy': csp,
    'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream',
  })
  response.end(readFileSync(path))
}).listen(Number(port), () => process.stdout.write(`serving ${dist} on ${port} under the post-migration CSP\n`))
