import { execFile } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { chromium } from '@playwright/test'

import type { PerfPage } from './pages.ts'
import { DENSE_4G, SLOW_4G } from './throttle.ts'

export const LIGHTHOUSE = 'lighthouse@13.6.0'

export const FORM_FACTORS = ['mobile', 'desktop'] as const

export type FormFactor = (typeof FORM_FACTORS)[number]

export type LighthouseRun = {
  benchmarkIndex: number
  categories: Record<string, number>
  lcpElement: string
  metrics: Record<string, number>
}

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']
const METRIC_AUDITS = {
  cls: 'cumulative-layout-shift',
  fcp: 'first-contentful-paint',
  lcp: 'largest-contentful-paint',
  si: 'speed-index',
  tbt: 'total-blocking-time',
}

const execFileAsync = promisify(execFile)

const withoutTrailingSlash = (url: string) => url.replace(/\/$/, '')

const numberFrom = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Lighthouse gave no ${label}`)
  return value
}

export const measureLighthouse = async (
  origin: string,
  chromeFlag: string,
  target: PerfPage,
  formFactor: FormFactor,
): Promise<LighthouseRun> => {
  const dir = mkdtempSync(join(tmpdir(), 'perf-lighthouse-'))
  const reportPath = join(dir, 'report.json')
  const url = `${origin}${target.path}`
  const throttle = formFactor === 'desktop' ? DENSE_4G : SLOW_4G
  try {
    await execFileAsync(
      'pnpm',
      [
        'dlx',
        LIGHTHOUSE,
        url,
        '--quiet',
        '--output=json',
        `--output-path=${reportPath}`,
        `--only-categories=${CATEGORIES.join(',')}`,
        `--chrome-flags=--headless=new ${chromeFlag}`,
        ...(formFactor === 'desktop' ? ['--preset=desktop'] : []),
        // Lighthouse's default simulates the throttle from an unthrottled load, and its estimate of first paint leaves
        // out code a script fetches: 1.5 MB more wasm before first paint moved the simulated FCP from 1,620 to 1,625 ms
        // and the real one from 2.9 to 11.4 s.
        '--throttling-method=devtools',
        `--throttling.cpuSlowdownMultiplier=${throttle.cpuSlowdown}`,
        `--throttling.downloadThroughputKbps=${throttle.downloadKbps}`,
        `--throttling.requestLatencyMs=${throttle.latencyMs}`,
        `--throttling.uploadThroughputKbps=${throttle.uploadKbps}`,
      ],
      { env: { ...process.env, CHROME_PATH: chromium.executablePath() } },
    )
    const report = JSON.parse(readFileSync(reportPath, 'utf-8'))
    // An unknown tool navigates home. A router may drop the trailing slash.
    if (withoutTrailingSlash(report.finalDisplayedUrl) !== withoutTrailingSlash(url)) {
      throw new Error(`${url} ended on ${report.finalDisplayedUrl}`)
    }
    const lcpItems: Array<{ snippet?: string; type?: string }> =
      report.audits['lcp-breakdown-insight']?.details?.items ?? []
    return {
      benchmarkIndex: numberFrom(report.environment.benchmarkIndex, 'benchmarkIndex'),
      categories: Object.fromEntries(
        CATEGORIES.map((category) => [category, numberFrom(report.categories[category]?.score, category) * 100]),
      ),
      lcpElement: lcpItems.find((item) => item.type === 'node')?.snippet ?? '',
      metrics: Object.fromEntries(
        Object.entries(METRIC_AUDITS).map(([name, audit]) => [
          name,
          numberFrom(report.audits[audit]?.numericValue, audit),
        ]),
      ),
    }
  } finally {
    rmSync(dir, { force: true, recursive: true })
  }
}
