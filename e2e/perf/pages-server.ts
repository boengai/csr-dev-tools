import { execFileSync } from 'node:child_process'
import { createHash, X509Certificate } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { createSecureServer } from 'node:http2'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { extname, join, resolve, sep } from 'node:path'
import { brotliCompressSync, constants } from 'node:zlib'

/**
 * Serves a built site the way Cloudflare Pages does, so a local run loads the
 * same bodies: HTTP/2, brotli, `_headers`, a 308 to the trailing slash for a
 * directory, and the home page for an unknown URL. Pages also sends larger
 * response headers, HTTP/3 and early hints; those are not reproduced.
 */

// What Pages compresses with, found by comparing with csr-dev-tools.pages.dev.
// Quality: a 233,095-byte chunk is 74,026-74,082 bytes there, 74,095 at 4, 75,443 at 3, 69,942 at 5.
// Window: its streams declare 18 bits. Node's default of 22 makes a 21 MB wasm 9% smaller than Pages sends it.
const BROTLI_PARAMS = { [constants.BROTLI_PARAM_LGWIN]: 18, [constants.BROTLI_PARAM_QUALITY]: 4 }

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/vnd.microsoft.icon',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.mjs': 'application/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
}

const NOT_COMPRESSED = new Set(['.png', '.webp', '.woff2'])

type HeaderRule = { headers: Array<[string, string]>; prefix: string }

type Asset = { body: Buffer; brotli: Buffer | null; contentType: string; etag: string }

const readHeaderRules = (dist: string): Array<HeaderRule> => {
  const path = join(dist, '_headers')
  if (!existsSync(path)) return []
  const rules: Array<HeaderRule> = []
  for (const line of readFileSync(path, 'utf-8').split('\n')) {
    if (line.trim() === '' || line.startsWith('#')) continue
    if (!/^\s/.test(line)) {
      rules.push({ headers: [], prefix: line.trim().replace(/\*$/, '') })
      continue
    }
    const colon = line.indexOf(':')
    rules.at(-1)?.headers.push([line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim()])
  }
  return rules
}

const selfSignedCert = (): { cert: string; key: string; spki: string } => {
  const dir = mkdtempSync(join(tmpdir(), 'perf-cert-'))
  const keyPath = join(dir, 'key.pem')
  const certPath = join(dir, 'cert.pem')
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-days',
      '2',
      '-subj',
      '/CN=localhost',
      '-keyout',
      keyPath,
      '-out',
      certPath,
    ],
    { stdio: 'ignore' },
  )
  const cert = readFileSync(certPath, 'utf-8')
  const key = readFileSync(keyPath, 'utf-8')
  rmSync(dir, { recursive: true })
  const publicKey = new X509Certificate(cert).publicKey.export({ format: 'der', type: 'spki' })
  return { cert, key, spki: createHash('sha256').update(publicKey).digest('base64') }
}

const isFile = (path: string): boolean => existsSync(path) && statSync(path).isFile()

export const startPagesServer = async (distDir: string) => {
  const dist = resolve(distDir)
  const { cert, key, spki } = selfSignedCert()
  const headerRules = readHeaderRules(dist)
  const assets = new Map<string, Asset>()

  const loadAsset = (path: string): Asset => {
    const cached = assets.get(path)
    if (cached) return cached
    const body = readFileSync(path)
    const ext = extname(path)
    const asset = {
      body,
      brotli: NOT_COMPRESSED.has(ext) ? null : brotliCompressSync(body, { params: BROTLI_PARAMS }),
      contentType: CONTENT_TYPES[ext] ?? 'application/octet-stream',
      etag: `"${createHash('sha256').update(body).digest('hex').slice(0, 32)}"`,
    }
    assets.set(path, asset)
    return asset
  }

  const server = createSecureServer({ cert, key }, (req, res) => {
    const url = new URL(req.url, 'https://localhost')
    const requested = resolve(dist, `.${decodeURIComponent(url.pathname)}`)
    if (requested !== dist && !requested.startsWith(dist + sep)) {
      res.writeHead(400).end()
      return
    }
    const indexPath = join(requested, 'index.html')
    if (!isFile(requested) && isFile(indexPath) && !url.pathname.endsWith('/')) {
      res.writeHead(308, { location: `${url.pathname}/${url.search}` }).end()
      return
    }
    const path = [requested, indexPath, join(dist, 'index.html')].find(isFile)
    if (!path) {
      res.writeHead(404).end()
      return
    }

    const asset = loadAsset(path)
    const acceptsBrotli = /\bbr\b/.test(String(req.headers['accept-encoding'] ?? ''))
    const body = asset.brotli && acceptsBrotli ? asset.brotli : asset.body
    const headers: Record<string, string | number> = {
      'cache-control': 'public, max-age=0, must-revalidate',
      'content-type': asset.contentType,
      etag: asset.etag,
      vary: 'accept-encoding',
    }
    for (const rule of headerRules) {
      if (url.pathname.startsWith(rule.prefix)) for (const [name, value] of rule.headers) headers[name] = value
    }
    if (req.headers['if-none-match'] === asset.etag) {
      res.writeHead(304, headers).end()
      return
    }
    headers['content-length'] = body.length
    if (body === asset.brotli) headers['content-encoding'] = 'br'
    res.writeHead(200, headers)
    res.end(body)
  })

  await new Promise<void>((done) => server.listen(0, 'localhost', done))
  const { port } = server.address() as AddressInfo
  return {
    // Trusts this one certificate. `--ignore-certificate-errors` would also turn
    // off Chrome's HTTP cache and break the repeat-load measurement.
    chromeFlag: `--ignore-certificate-errors-spki-list=${spki}`,
    close: () => server.close(),
    origin: `https://localhost:${port}`,
  }
}
