#!/usr/bin/env node
// Serves a Dioxus build under the post-migration CSP, for the Dioxus
// Playwright project (docs/quality/gates.md → "CSP"). A path with no file
// gets the nearest index.html, as the static host does for client routes.
// Usage: node crates/gates/scripts/serve-dioxus.mjs <dist-dioxus> <port> <csp-file>
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs'
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
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
}

const root = realpathSync(normalize(dist))
/** Inside the build, after following any symlink. */
const inside = (path) => {
  const real = realpathSync(path)
  return real === root || real.startsWith(root + sep)
}
/** The file a request URL serves, or undefined; a URL that does not decode serves nothing. */
const resolve = (url) => {
  let pathname
  try {
    pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname)
  } catch {
    return undefined
  }
  const path = normalize(join(root, pathname))
  if (path !== root && !path.startsWith(root + sep)) return undefined
  if (existsSync(path) && statSync(path).isFile()) return inside(path) ? path : undefined
  // A client route: the nearest index.html above it.
  for (let dir = path; dir.startsWith(root); dir = join(dir, '..')) {
    const index = join(dir, 'index.html')
    if (existsSync(index)) return inside(index) ? index : undefined
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
  // Loopback only: the test run is the one client.
}).listen(Number(port), '127.0.0.1', () =>
  process.stdout.write(`serving ${dist} on ${port} under the post-migration CSP\n`),
)
