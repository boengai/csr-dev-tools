import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { cpus } from 'node:os'
import { extname, join, relative } from 'node:path'
import { parseArgs } from 'node:util'

import { chromium } from '@playwright/test'

import { measureBytes, type PageBytes } from './bytes.ts'
import { FORM_FACTORS, type FormFactor, LIGHTHOUSE, type LighthouseRun, measureLighthouse } from './lighthouse.ts'
import { startPagesServer } from './pages-server.ts'
import { PERF_PAGES } from './pages.ts'
import { spread, spreadByKey } from './spread.ts'
import { DENSE_4G, SLOW_4G } from './throttle.ts'
import { measureUsable, type UsableRun } from './usable.ts'

/** Measures a built site. Usage and method: docs/perf/README.md. */

const USAGE = 'usage: measure.ts <dist> <out.json> --site <name and commit of the build> [--runs 5] [--pages a,b]'

const { positionals, values: options } = parseArgs({
  allowPositionals: true,
  options: {
    pages: { default: PERF_PAGES.map((p) => p.key).join(','), type: 'string' },
    runs: { default: '5', type: 'string' },
    site: { type: 'string' },
  },
})
const [dist, outPath] = positionals
const { site } = options
const runs = Number(options.runs)
if (!dist || !outPath || !site || !Number.isInteger(runs) || runs < 1) throw new Error(USAGE)

const pages = options.pages.split(',').map((key) => {
  const page = PERF_PAGES.find((p) => p.key === key)
  if (!page) throw new Error(`unknown page ${key}; known: ${PERF_PAGES.map((p) => p.key).join(', ')}`)
  return page
})

const describeDist = (dir: string) => {
  const paths = readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .sort()
  const digest = createHash('sha256')
  const byExtension: Record<string, { bytes: number; files: number }> = {}
  for (const path of paths) {
    const body = readFileSync(path)
    digest.update(relative(dir, path)).update(body)
    const entry = (byExtension[extname(path) || 'none'] ??= { bytes: 0, files: 0 })
    entry.bytes += body.length
    entry.files += 1
  }
  return {
    byExtension,
    bytes: Object.values(byExtension).reduce((n, e) => n + e.bytes, 0),
    files: paths.length,
    sha256: digest.digest('hex'),
  }
}

const server = await startPagesServer(dist)
const browser = await chromium.launch({ args: [server.chromeFlag], channel: 'chromium' })

const bytes: Record<string, PageBytes> = {}
const usable: Record<string, Array<UsableRun>> = {}
const lighthouse: Record<string, Partial<Record<FormFactor, Array<LighthouseRun>>>> = {}
const failures: Array<string> = []

const environment = {
  chromium: browser.version(),
  cpu: cpus()[0]?.model,
  date: new Date().toISOString(),
  harnessCommit: execFileSync('git', ['describe', '--always', '--dirty', '--abbrev=40'], { encoding: 'utf-8' }).trim(),
  lighthouse: LIGHTHOUSE,
  node: process.version,
  pages: pages.map((p) => p.key),
  platform: `${process.platform}-${process.arch}`,
  runs,
  site,
  throttle: { desktop: DENSE_4G, mobile: SLOW_4G },
}
const distDescription = describeDist(dist)

const buildResults = () => ({
  bytes,
  dist: distDescription,
  environment,
  failures,
  lighthouse: Object.fromEntries(
    Object.entries(lighthouse).map(([key, byFormFactor]) => [
      key,
      Object.fromEntries(
        Object.entries(byFormFactor).map(([formFactor, samples]) => [
          formFactor,
          {
            benchmarkIndex: spread(samples.map((s) => s.benchmarkIndex)),
            categories: spreadByKey(samples.map((s) => s.categories)),
            lcpElements: samples.map((s) => s.lcpElement),
            metrics: spreadByKey(samples.map((s) => s.metrics)),
          },
        ]),
      ),
    ]),
  ),
  usable: Object.fromEntries(Object.entries(usable).map(([key, samples]) => [key, spreadByKey(samples)])),
})

export type Results = ReturnType<typeof buildResults>

const writeResults = () => writeFileSync(outPath, `${JSON.stringify(buildResults(), null, 2)}\n`)

/** Runs one measurement. A failure is recorded and the rest of the run goes on. */
const step = async (label: string, measure: () => Promise<void>) => {
  process.stderr.write(`${label}\n`)
  try {
    await measure()
  } catch (error) {
    failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`)
    process.stderr.write(`  failed: ${failures.at(-1)}\n`)
  }
  writeResults()
}

try {
  writeResults()
  for (const page of pages) {
    await step(`bytes ${page.key}`, async () => {
      bytes[page.key] = await measureBytes(browser, server.origin, page)
    })
  }
  // Each round visits every page once, so drift on the machine spreads over all of them.
  for (let round = 1; round <= runs; round++) {
    for (const page of pages) {
      await step(`usable ${round}/${runs} ${page.key}`, async () => {
        const sample = await measureUsable(browser, server.origin, page)
        ;(usable[page.key] ??= []).push(sample)
      })
      for (const formFactor of FORM_FACTORS) {
        await step(`lighthouse ${round}/${runs} ${page.key} ${formFactor}`, async () => {
          const sample = await measureLighthouse(server.origin, server.chromeFlag, page, formFactor)
          ;((lighthouse[page.key] ??= {})[formFactor] ??= []).push(sample)
        })
      }
    }
  }
} finally {
  await browser.close()
  server.close()
}
if (failures.length > 0) process.exitCode = 1
