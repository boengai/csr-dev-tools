// Serves a built site over plain HTTP for the e2e run, with Cloudflare Pages'
// routing rules: `_headers`, a 308 to the trailing slash for a directory, and
// the home page for an unknown URL. The perf harness has an HTTP/2 copy
// (e2e/perf/pages-server.ts); Playwright's webServer needs a fixed port.
//
//   node dioxus/scripts/serve.ts <dist> <port>
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'

const dist = resolve(process.argv[2] ?? 'dioxus/dist')
const port = Number(process.argv[3] ?? 5174)

const TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/vnd.microsoft.icon',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.xml': 'application/xml',
}

const rules: Array<{ headers: Array<[string, string]>; prefix: string }> = []
for (const line of existsSync(join(dist, '_headers')) ? readFileSync(join(dist, '_headers'), 'utf-8').split('\n') : []) {
  if (line.trim() === '' || line.startsWith('#')) continue
  if (!/^\s/.test(line)) rules.push({ headers: [], prefix: line.trim().replace(/\*$/, '') })
  else {
    const colon = line.indexOf(':')
    rules.at(-1)?.headers.push([line.slice(0, colon).trim(), line.slice(colon + 1).trim()])
  }
}

const isFile = (p: string) => existsSync(p) && statSync(p).isFile()

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const requested = resolve(dist, `.${decodeURIComponent(url.pathname)}`)
  if (requested !== dist && !requested.startsWith(dist + sep)) return void res.writeHead(400).end()
  const index = join(requested, 'index.html')
  if (!isFile(requested) && isFile(index) && !url.pathname.endsWith('/'))
    return void res.writeHead(308, { location: `${url.pathname}/${url.search}` }).end()
  const path = [requested, index, join(dist, 'index.html')].find(isFile)
  if (!path) return void res.writeHead(404).end()
  const headers: Record<string, string> = { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }
  for (const rule of rules) if (url.pathname.startsWith(rule.prefix)) for (const [k, v] of rule.headers) headers[k] = v
  res.writeHead(200, headers).end(readFileSync(path))
}).listen(port, () => console.log(`[serve] ${dist} on http://localhost:${port}`))
