import { readFileSync } from 'node:fs'

import type { Results } from './measure.ts'
import { type Spread, spread } from './spread.ts'

/**
 * Prints results as Markdown tables: `node e2e/perf/report.ts <results.json>...`
 * Runs of the same build (the same `--site`) are pooled; different builds get a row each.
 */

const builds = new Map<string, Array<Results>>()
for (const path of process.argv.slice(2)) {
  const results: Results = JSON.parse(readFileSync(path, 'utf-8'))
  const { site } = results.environment
  const other = builds.get(site)?.find((r) => r.dist.sha256 !== results.dist.sha256)
  if (other) throw new Error(`"${site}" names two different builds; give each its own --site`)
  builds.set(site, [...(builds.get(site) ?? []), results])
}
const pageKeys = [...new Set([...builds.values()].flat().flatMap((r) => r.environment.pages))]

const table = (
  title: string,
  columns: Array<string>,
  row: (runs: Array<Results>, page: string) => Array<number | string> | undefined,
) => {
  const several = builds.size > 1
  const header = several ? ['Page', 'Build', ...columns] : ['Page', ...columns]
  const rows = pageKeys.flatMap((page) =>
    [...builds].flatMap(([site, runs]) => {
      const cells = row(runs, page)
      if (!cells) return []
      return [several ? [page, site, ...cells] : [page, ...cells]]
    }),
  )
  const lines = [header, header.map((_, i) => (i === 0 ? '---' : '--:')), ...rows].map((r) => `| ${r.join(' | ')} |`)
  process.stdout.write(`### ${title}\n\n${lines.join('\n')}\n\n`)
}

const kb = (bytes: number): string => (bytes / 1000).toFixed(1)
const whole = (n: number): string => Math.round(n).toLocaleString('en-US')
const thousandths = (n: number): string => n.toFixed(3)

/** Median, and the range when it shows at this precision, over the samples of every run. */
const pooled = (spreads: Array<Spread | undefined>, format: (n: number) => string): string => {
  const samples = spreads.flatMap((s) => s?.runs ?? [])
  if (samples.length === 0) return '-'
  const { max, median, min } = spread(samples)
  return format(min) === format(max) ? format(median) : `${format(median)} (${format(min)}-${format(max)})`
}

for (const formFactor of ['mobile', 'desktop'] as const) {
  table(
    `Lighthouse, ${formFactor}`,
    [
      'Performance',
      'Accessibility',
      'Best practices',
      'SEO',
      'FCP ms',
      'LCP ms',
      'TBT ms',
      'CLS',
      'Speed Index ms',
      'CPU index',
    ],
    (runs, page) => {
      const results = runs.map((r) => r.lighthouse[page]?.[formFactor]).filter((r) => r !== undefined)
      if (results.length === 0) return undefined
      const category = (name: string) =>
        pooled(
          results.map((r) => r.categories[name]),
          whole,
        )
      const metric = (name: string, format = whole) =>
        pooled(
          results.map((r) => r.metrics[name]),
          format,
        )
      return [
        ...['performance', 'accessibility', 'best-practices', 'seo'].map(category),
        ...['fcp', 'lcp', 'tbt'].map((name) => metric(name)),
        metric('cls', thousandths),
        metric('si'),
        pooled(
          results.map((r) => r.benchmarkIndex),
          whole,
        ),
      ]
    },
  )
}

table('Time to usable, ms', ['Ready', 'First result', 'Ready, repeat load'], (runs, page) => {
  const results = runs.map((r) => r.usable[page]).filter((r) => r !== undefined)
  if (results.length === 0) return undefined
  return ['ready', 'firstResult', 'repeatReady'].map((name) =>
    pooled(
      results.map((r) => r[name]),
      whole,
    ),
  )
})

for (const [phase, title] of [
  ['load', 'First load, kB compressed / uncompressed (requests)'],
  ['afterResult', 'First load and first result, kB compressed / uncompressed (requests)'],
] as const) {
  table(title, ['HTML', 'CSS', 'JS', 'WASM', 'Image and other', 'Own total', 'Third party'], (runs, page) => {
    // Bytes are measured once per run and do not depend on timing.
    const summary = runs.find((r) => r.bytes[page])?.bytes[page]?.[phase]
    if (!summary) return undefined
    const { byKind, firstParty, thirdParty } = summary
    const sizes = (...counts: Array<{ decoded: number; requests: number; transferred: number }>) => {
      const total = (key: 'decoded' | 'requests' | 'transferred') => counts.reduce((n, c) => n + c[key], 0)
      return `${kb(total('transferred'))} / ${kb(total('decoded'))} (${total('requests')})`
    }
    return [
      sizes(byKind.html),
      sizes(byKind.css),
      sizes(byKind.js),
      sizes(byKind.wasm),
      sizes(byKind.image, byKind.font, byKind.other),
      sizes(firstParty),
      sizes(thirdParty),
    ]
  })
}

for (const [site, runs] of builds) {
  const dist = runs[0]?.dist
  if (!dist) continue
  process.stdout.write(`### Build output: ${site}\n\n`)
  process.stdout.write(`${whole(dist.bytes)} bytes in ${dist.files} files, sha256 ${dist.sha256}\n\n`)
  const sizes = Object.entries(dist.byExtension).sort(([, a], [, b]) => b.bytes - a.bytes)
  process.stdout.write(sizes.map(([ext, e]) => `- ${ext}: ${whole(e.bytes)} bytes in ${e.files} files`).join('\n'))
  const failures = runs.flatMap((r) => r.failures)
  process.stdout.write(`\n\nFailed measurements: ${failures.length === 0 ? 'none' : failures.join('; ')}\n\n`)
}
