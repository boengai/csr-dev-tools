import { readFileSync } from 'node:fs'

import type { Results } from './measure.ts'
import type { Spread } from './spread.ts'

/** Prints results as Markdown tables, one row per page and build: `node e2e/perf/report.ts <results.json>...` */

type Cell = number | string

const builds: Array<Results> = process.argv.slice(2).map((path) => JSON.parse(readFileSync(path, 'utf-8')))
const pageKeys = [...new Set(builds.flatMap((b) => b.environment.pages))]

const table = (
  title: string,
  columns: Array<string>,
  row: (build: Results, page: string) => Array<Cell> | undefined,
) => {
  const header = builds.length > 1 ? ['Page', 'Build', ...columns] : ['Page', ...columns]
  const rows = pageKeys.flatMap((page) =>
    builds.flatMap((build) => {
      const cells = row(build, page)
      if (!cells) return []
      return [builds.length > 1 ? [page, build.environment.site, ...cells] : [page, ...cells]]
    }),
  )
  const lines = [header, header.map((_, i) => (i === 0 ? '---' : '--:')), ...rows].map((r) => `| ${r.join(' | ')} |`)
  process.stdout.write(`### ${title}\n\n${lines.join('\n')}\n\n`)
}

const kb = (bytes: number): string => (bytes / 1000).toFixed(1)

const withRange = (value: Spread | undefined, format: (n: number) => string): string => {
  if (!value) return '-'
  return value.min === value.max
    ? format(value.median)
    : `${format(value.median)} (${format(value.min)}-${format(value.max)})`
}
const whole = (n: number): string => Math.round(n).toLocaleString('en-US')
const thousandths = (n: number): string => n.toFixed(3)

for (const formFactor of ['mobile', 'desktop'] as const) {
  table(
    `Lighthouse, ${formFactor}`,
    ['Performance', 'Accessibility', 'Best practices', 'SEO', 'FCP ms', 'LCP ms', 'TBT ms', 'CLS', 'Speed Index ms'],
    (build, page) => {
      const result = build.lighthouse[page]?.[formFactor]
      if (!result) return undefined
      const { categories, metrics } = result
      return [
        withRange(categories.performance, whole),
        withRange(categories.accessibility, whole),
        withRange(categories['best-practices'], whole),
        withRange(categories.seo, whole),
        withRange(metrics.fcp, whole),
        withRange(metrics.lcp, whole),
        withRange(metrics.tbt, whole),
        withRange(metrics.cls, thousandths),
        withRange(metrics.si, whole),
      ]
    },
  )
}

table('Time to usable, ms', ['Ready', 'First result', 'Ready, repeat load'], (build, page) => {
  const result = build.usable[page]
  return result && [result.ready, result.firstResult, result.repeatReady].map((value) => withRange(value, whole))
})

for (const [phase, title] of [
  ['load', 'First load, kB compressed / uncompressed'],
  ['afterResult', 'First load and first result, kB compressed / uncompressed'],
] as const) {
  table(
    title,
    [
      'HTML',
      'CSS',
      'JS',
      'WASM',
      'Image and other',
      'Own total',
      'Own requests',
      'Third party',
      'Third-party requests',
    ],
    (build, page) => {
      const summary = build.bytes[page]?.[phase]
      if (!summary) return undefined
      const { byKind, firstParty, thirdParty } = summary
      const sizes = (...counts: Array<{ decoded: number; transferred: number }>) =>
        `${kb(counts.reduce((n, c) => n + c.transferred, 0))} / ${kb(counts.reduce((n, c) => n + c.decoded, 0))}`
      return [
        sizes(byKind.html),
        sizes(byKind.css),
        sizes(byKind.js),
        sizes(byKind.wasm),
        sizes(byKind.image, byKind.font, byKind.other),
        sizes(firstParty),
        firstParty.requests,
        sizes(thirdParty),
        thirdParty.requests,
      ]
    },
  )
}

for (const { dist, environment, failures } of builds) {
  process.stdout.write(`### Build output: ${environment.site}\n\n`)
  process.stdout.write(`${whole(dist.bytes)} bytes in ${dist.files} files, sha256 ${dist.sha256}\n\n`)
  const sizes = Object.entries(dist.byExtension).sort(([, a], [, b]) => b.bytes - a.bytes)
  process.stdout.write(sizes.map(([ext, e]) => `- ${ext}: ${whole(e.bytes)} bytes in ${e.files} files`).join('\n'))
  process.stdout.write(`\n\nFailed measurements: ${failures.length === 0 ? 'none' : failures.join('; ')}\n\n`)
}
