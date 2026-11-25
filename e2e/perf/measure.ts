import { execFile } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { cpus, tmpdir } from 'node:os'
import { extname, join } from 'node:path'
import { parseArgs, promisify } from 'node:util'

import { type Browser, type BrowserContext, chromium, type Page } from '@playwright/test'

import { startPagesServer } from './pages-server.ts'
import { type DomCondition, PERF_PAGES, type PerfPage } from './pages.ts'
import { kindOfMime, RESOURCE_KINDS, type ResourceKind, type Spread, spread } from './stats.ts'

/**
 * Measures a built site. Usage and method: docs/perf/README.md.
 *
 *   node e2e/perf/measure.ts <dist> <out.json> [--runs 5] [--pages home,uuid-generator] [--parts size,bytes,usable,lighthouse]
 */

const LIGHTHOUSE = 'lighthouse@13.6.0'
const LIGHTHOUSE_CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']
const LIGHTHOUSE_METRICS = {
  cls: 'cumulative-layout-shift',
  fcp: 'first-contentful-paint',
  lcp: 'largest-contentful-paint',
  si: 'speed-index',
  tbt: 'total-blocking-time',
}
const FORM_FACTORS = ['mobile', 'desktop'] as const

// Lighthouse's own applied "slow 4G" mobile profile (its mobileSlow4G constants) and device.
const THROTTLE = {
  cpuSlowdown: 4,
  downloadThroughput: (1474.56 * 1024) / 8,
  latency: 562.5,
  uploadThroughput: (675 * 1024) / 8,
}
const MOBILE = { deviceScaleFactor: 1.75, hasTouch: true, isMobile: true, viewport: { height: 823, width: 412 } }

const WAIT_MS = 60_000
const NETWORK_QUIET_MS = 2_000

type ByteCount = { decoded: number; requests: number; transferred: number }

type RequestRecord = ByteCount & { kind: ResourceKind; thirdParty: boolean; url: string }

type ByteSummary = {
  byKind: Record<ResourceKind, ByteCount>
  firstParty: ByteCount
  requests: Array<RequestRecord>
  thirdParty: ByteCount
  total: ByteCount
}

type UsableRun = { firstResult: number; ready: number; repeatReady: number }

type LighthouseRun = {
  benchmarkIndex: number
  categories: Record<string, number>
  lcpElement: string
  metrics: Record<string, number>
  version: string
}

const run = promisify(execFile)

const { positionals, values: options } = parseArgs({
  allowPositionals: true,
  options: {
    pages: { type: 'string' },
    parts: { default: 'size,bytes,usable,lighthouse', type: 'string' },
    runs: { default: '5', type: 'string' },
  },
})
const [dist, outPath] = positionals
if (!dist || !outPath) throw new Error('usage: measure.ts <dist> <out.json> [--runs N] [--pages a,b] [--parts a,b]')

const runs = Number(options.runs)
const parts = new Set(options.parts.split(','))
const pageKeys = options.pages?.split(',')
const perfPages = PERF_PAGES.filter((p) => !pageKeys || pageKeys.includes(p.key))

const progress = (message: string) => process.stderr.write(`${message}\n`)

/** Resolves to the page's own clock (ms since navigation start) at the first frame where the condition holds. */
const timeWhen = async (page: Page, condition: DomCondition): Promise<number> => {
  const handle = await page.waitForFunction(
    ({ count = 1, selector, text }) => {
      const matches = [...document.querySelectorAll<HTMLElement>(selector)].filter(
        (el) =>
          el.getClientRects().length > 0 &&
          !el.matches(':disabled') &&
          (text === undefined || (el instanceof HTMLInputElement ? el.value : (el.textContent ?? '')).includes(text)),
      )
      return matches.length >= count && performance.now()
    },
    condition,
    { polling: 'raf', timeout: WAIT_MS },
  )
  return Number(await handle.jsonValue())
}

const assertOnPage = async (page: Page, target: PerfPage) => {
  if (target.heading) await page.getByRole('heading', { exact: true, level: 1, name: target.heading }).waitFor()
}

const sumBytes = (records: Array<ByteCount>): ByteCount => ({
  decoded: records.reduce((n, r) => n + r.decoded, 0),
  requests: records.reduce((n, r) => n + r.requests, 0),
  transferred: records.reduce((n, r) => n + r.transferred, 0),
})

const summarise = (requests: Array<RequestRecord>): ByteSummary => ({
  byKind: Object.fromEntries(
    RESOURCE_KINDS.map((kind) => [kind, sumBytes(requests.filter((r) => r.kind === kind))]),
  ) as Record<ResourceKind, ByteCount>,
  firstParty: sumBytes(requests.filter((r) => !r.thirdParty)),
  requests,
  thirdParty: sumBytes(requests.filter((r) => r.thirdParty)),
  total: sumBytes(requests),
})

const measureBytes = async (browser: Browser, origin: string, target: PerfPage) => {
  const context = await browser.newContext(MOBILE)
  const page = await context.newPage()
  page.on('worker', (worker) => {
    throw new Error(`${target.key} started a worker (${worker.url()}); its requests would not be counted`)
  })
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')

  const records = new Map<string, RequestRecord>()
  const open = new Set<string>()
  let lastActivity = Date.now()
  const touch = () => {
    lastActivity = Date.now()
  }
  cdp.on('Network.requestWillBeSent', (e) => {
    if (!e.request.url.startsWith('http')) return
    open.add(e.requestId)
    touch()
  })
  cdp.on('Network.responseReceived', (e) => {
    if (!e.response.url.startsWith('http')) return
    records.set(e.requestId, {
      decoded: 0,
      kind: kindOfMime(e.response.mimeType),
      requests: 1,
      thirdParty: !e.response.url.startsWith(origin),
      transferred: 0,
      url: e.response.url.replace(origin, ''),
    })
  })
  cdp.on('Network.dataReceived', (e) => {
    const record = records.get(e.requestId)
    if (record) record.decoded += e.dataLength
    touch()
  })
  cdp.on('Network.loadingFinished', (e) => {
    const record = records.get(e.requestId)
    if (record) record.transferred = e.encodedDataLength
    open.delete(e.requestId)
    touch()
  })
  cdp.on('Network.loadingFailed', (e) => {
    open.delete(e.requestId)
    touch()
  })
  const quiet = async () => {
    while (open.size > 0 || Date.now() - lastActivity < NETWORK_QUIET_MS) await page.waitForTimeout(100)
  }
  const snapshot = () => summarise([...records.values()].map((r) => ({ ...r })))

  await page.goto(`${origin}${target.path}`)
  await timeWhen(page, target.ready)
  await assertOnPage(page, target)
  await quiet()
  const load = snapshot()
  await target.act(page)
  await timeWhen(page, target.result)
  await quiet()
  const afterResult = snapshot()
  await context.close()
  return { afterResult, load }
}

const openThrottled = async (context: BrowserContext): Promise<Page> => {
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', { offline: false, ...THROTTLE })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE.cpuSlowdown })
  return page
}

const measureUsable = async (browser: Browser, origin: string, target: PerfPage): Promise<UsableRun> => {
  const context = await browser.newContext(MOBILE)
  const page = await openThrottled(context)
  await page.goto(`${origin}${target.path}`, { waitUntil: 'commit' })
  const ready = await timeWhen(page, target.ready)
  await target.act(page)
  const firstResult = await timeWhen(page, target.result)
  await assertOnPage(page, target)
  await page.waitForLoadState('networkidle')
  await page.close()

  const repeatPage = await openThrottled(context)
  await repeatPage.goto(`${origin}${target.path}`, { waitUntil: 'commit' })
  const repeatReady = await timeWhen(repeatPage, target.ready)
  await context.close()
  return { firstResult, ready, repeatReady }
}

const measureLighthouse = async (
  origin: string,
  chromeFlag: string,
  target: PerfPage,
  formFactor: (typeof FORM_FACTORS)[number],
): Promise<LighthouseRun> => {
  const dir = mkdtempSync(join(tmpdir(), 'perf-lh-'))
  const reportPath = join(dir, 'report.json')
  const url = `${origin}${target.path}`
  await run(
    'pnpm',
    [
      'dlx',
      LIGHTHOUSE,
      url,
      '--quiet',
      '--output=json',
      `--output-path=${reportPath}`,
      `--only-categories=${LIGHTHOUSE_CATEGORIES.join(',')}`,
      `--chrome-flags=--headless=new ${chromeFlag}`,
      ...(formFactor === 'desktop' ? ['--preset=desktop'] : []),
    ],
    { env: { ...process.env, CHROME_PATH: chromium.executablePath() } },
  )
  const report = JSON.parse(readFileSync(reportPath, 'utf-8'))
  rmSync(dir, { recursive: true })
  if (report.finalDisplayedUrl !== url) throw new Error(`${url} ended on ${report.finalDisplayedUrl}`)
  if (report.runtimeError) throw new Error(`${url}: ${report.runtimeError.message}`)
  return {
    benchmarkIndex: report.environment.benchmarkIndex,
    categories: Object.fromEntries(LIGHTHOUSE_CATEGORIES.map((c) => [c, report.categories[c].score * 100])),
    lcpElement:
      JSON.stringify(report.audits['lcp-breakdown-insight']?.details ?? null).match(
        /"snippet":"((?:[^"\\]|\\.)*)"/,
      )?.[1] ?? '',
    metrics: Object.fromEntries(
      Object.entries(LIGHTHOUSE_METRICS).map(([name, audit]) => [name, report.audits[audit].numericValue]),
    ),
    version: report.lighthouseVersion,
  }
}

const measureSize = (dir: string) => {
  const files = readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile())
  const byExtension: Record<string, { bytes: number; files: number }> = {}
  for (const file of files) {
    const entry = (byExtension[extname(file.name) || file.name] ??= { bytes: 0, files: 0 })
    entry.bytes += statSync(join(file.parentPath, file.name)).size
    entry.files += 1
  }
  return {
    byExtension,
    bytes: Object.values(byExtension).reduce((n, e) => n + e.bytes, 0),
    files: files.length,
  }
}

const spreadBy = <T extends object>(samples: Array<T>): Record<string, Spread> =>
  Object.fromEntries(
    Object.keys(samples[0] ?? {}).map((key) => [key, spread(samples.map((s) => Number(s[key as keyof T])))]),
  )

const server = await startPagesServer(dist)
const browser = await chromium.launch({ args: [server.chromeFlag], channel: 'chromium' })

const bytes: Record<string, Awaited<ReturnType<typeof measureBytes>>> = {}
const usable: Record<string, Array<UsableRun>> = {}
const lighthouse: Record<string, Array<LighthouseRun>> = {}

if (parts.has('bytes')) {
  for (const target of perfPages) {
    progress(`bytes ${target.key}`)
    bytes[target.key] = await measureBytes(browser, server.origin, target)
  }
}

// Each round visits every page once, so drift on the machine spreads over all of them.
for (let i = 1; i <= runs; i++) {
  for (const target of perfPages) {
    if (parts.has('usable')) {
      progress(`usable ${i}/${runs} ${target.key}`)
      ;(usable[target.key] ??= []).push(await measureUsable(browser, server.origin, target))
    }
    if (parts.has('lighthouse')) {
      for (const formFactor of FORM_FACTORS) {
        progress(`lighthouse ${i}/${runs} ${target.key} ${formFactor}`)
        ;(lighthouse[`${target.key}/${formFactor}`] ??= []).push(
          await measureLighthouse(server.origin, server.chromeFlag, target, formFactor),
        )
      }
    }
  }
}

const results = {
  bytes,
  environment: {
    chromium: browser.version(),
    cpu: cpus()[0]?.model,
    date: new Date().toISOString(),
    lighthouse: LIGHTHOUSE,
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    runs,
    throttle: THROTTLE,
  },
  lighthouse: Object.fromEntries(
    Object.entries(lighthouse).map(([key, samples]) => [
      key,
      {
        benchmarkIndex: spread(samples.map((s) => s.benchmarkIndex)),
        categories: spreadBy(samples.map((s) => s.categories)),
        lcpElements: samples.map((s) => s.lcpElement),
        metrics: spreadBy(samples.map((s) => s.metrics)),
      },
    ]),
  ),
  size: parts.has('size') ? measureSize(dist) : undefined,
  usable: Object.fromEntries(Object.entries(usable).map(([key, samples]) => [key, spreadBy(samples)])),
}
writeFileSync(outPath, `${JSON.stringify(results, null, 2)}\n`)

await browser.close()
server.close()
