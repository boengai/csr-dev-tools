import type { Browser } from '@playwright/test'

import { assertOnPage, MOBILE, timeWhen, WAIT_MS } from './dom.ts'
import type { PerfPage } from './pages.ts'

const NETWORK_QUIET_MS = 2_000

const KINDS = ['html', 'css', 'js', 'wasm', 'font', 'image', 'other'] as const

type Kind = (typeof KINDS)[number]

/** `transferred` is the compressed body. A response without Content-Length counts its headers too. */
type ByteCount = { decoded: number; requests: number; transferred: number }

type RequestRecord = { decoded: number; kind: Kind; thirdParty: boolean; transferred: number; url: string }

type ByteSummary = {
  /** This site's own requests; `thirdParty` holds the rest. */
  byKind: Record<Kind, ByteCount>
  firstParty: ByteCount
  thirdParty: ByteCount
}

export type PageBytes = {
  /** Everything since navigation, once `act` has its result. */
  afterResult: ByteSummary
  load: ByteSummary
  requests: Array<RequestRecord>
  /** Requests a worker makes are not counted, so a page that starts one is under-counted. */
  workers: Array<string>
}

const kindOfMime = (mime: string): Kind => {
  if (mime.includes('wasm')) return 'wasm'
  if (mime.includes('javascript')) return 'js'
  if (mime.startsWith('text/html')) return 'html'
  if (mime.startsWith('text/css')) return 'css'
  if (mime.startsWith('font/') || mime.includes('font-')) return 'font'
  if (mime.startsWith('image/')) return 'image'
  return 'other'
}

const sum = (requests: Array<RequestRecord>): ByteCount => ({
  decoded: requests.reduce((n, r) => n + r.decoded, 0),
  requests: requests.length,
  transferred: requests.reduce((n, r) => n + r.transferred, 0),
})

const summarise = (requests: Array<RequestRecord>): ByteSummary => {
  const firstParty = requests.filter((r) => !r.thirdParty)
  return {
    byKind: Object.fromEntries(KINDS.map((kind) => [kind, sum(firstParty.filter((r) => r.kind === kind))])) as Record<
      Kind,
      ByteCount
    >,
    firstParty: sum(firstParty),
    thirdParty: sum(requests.filter((r) => r.thirdParty)),
  }
}

export const measureBytes = async (browser: Browser, origin: string, target: PerfPage): Promise<PageBytes> => {
  const context = await browser.newContext(MOBILE)
  const page = await context.newPage()
  const workers: Array<string> = []
  page.on('worker', (worker) => workers.push(worker.url()))
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')

  const records = new Map<string, RequestRecord>()
  const redirects: Array<RequestRecord> = []
  const failures: Array<string> = []
  const open = new Map<string, string>()
  let lastActivity = Date.now()

  const recordOf = (response: { mimeType: string; url: string }): RequestRecord => ({
    decoded: 0,
    kind: kindOfMime(response.mimeType),
    thirdParty: !response.url.startsWith(origin),
    transferred: 0,
    url: response.url.replace(origin, ''),
  })
  cdp.on('Network.requestWillBeSent', (e) => {
    if (!e.request.url.startsWith('http')) return
    if (e.redirectResponse) redirects.push(recordOf(e.redirectResponse))
    open.set(e.requestId, e.request.url)
    lastActivity = Date.now()
  })
  cdp.on('Network.requestServedFromCache', (e) => {
    open.delete(e.requestId)
  })
  cdp.on('Network.responseReceived', (e) => {
    if (!open.has(e.requestId) || e.response.fromDiskCache) return
    const contentLength = Object.entries(e.response.headers).find(([name]) => name.toLowerCase() === 'content-length')
    records.set(e.requestId, { ...recordOf(e.response), transferred: Number(contentLength?.[1] ?? 0) })
  })
  cdp.on('Network.dataReceived', (e) => {
    const record = records.get(e.requestId)
    if (record) record.decoded += e.dataLength
    lastActivity = Date.now()
  })
  cdp.on('Network.loadingFinished', (e) => {
    const record = records.get(e.requestId)
    if (record) record.transferred ||= e.encodedDataLength
    open.delete(e.requestId)
    lastActivity = Date.now()
  })
  cdp.on('Network.loadingFailed', (e) => {
    if (open.has(e.requestId)) failures.push(`${open.get(e.requestId)} (${e.errorText})`)
    open.delete(e.requestId)
    lastActivity = Date.now()
  })

  const summaryWhenQuiet = async (): Promise<ByteSummary> => {
    const started = Date.now()
    while (open.size > 0 || Date.now() - lastActivity < NETWORK_QUIET_MS) {
      if (Date.now() - started > WAIT_MS) throw new Error(`still loading: ${[...open.values()].join(', ')}`)
      await page.waitForTimeout(100)
    }
    if (failures.length > 0) throw new Error(`failed requests: ${failures.join(', ')}`)
    return summarise([...redirects, ...records.values()])
  }

  try {
    await page.goto(`${origin}${target.path}`)
    await timeWhen(page, target.ready)
    await assertOnPage(page, target)
    const load = await summaryWhenQuiet()
    await target.act(page)
    await timeWhen(page, target.result)
    const afterResult = await summaryWhenQuiet()
    return { afterResult, load, requests: [...redirects, ...records.values()], workers }
  } finally {
    await context.close()
  }
}
