// The bar's "no timeout, OOM or trap" axis, run in Node (not a browser).
//
//   node docs/research/hayro-render-trial/harness/no-trap.mjs <pkgDir> <corpusDir> <out.json> [scale]
//
// <pkgDir> is the wasm-pack `--target web` output of ./hayro-trial (the judged
// `embed` build). Each file gets a fresh wasm instance: a trap leaves an
// instance unusable, and linear memory never shrinks, so a fresh instance
// also gives each file its own peak.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'

const [pkgDir, corpusDir, outPath] = process.argv.slice(2, 5).map((p) => resolve(p))
const scale = Number(process.argv[5] ?? 0.6)
const PAGE_LIMIT_MS = 10_000
const MEMORY_LIMIT = 1024 ** 3

// A trap is a wasm RuntimeError (panic, unreachable, OOM) or a V8 stack
// overflow, which surfaces as a RangeError rather than a RuntimeError.
const isTrap = (e) =>
  e instanceof WebAssembly.RuntimeError || (e instanceof RangeError && /call stack/i.test(e.message))

// The bar: no trap, no page over 10 s, memory readable and under 1 GiB. A
// `fail-*` input passes only by returning Err from open; any other input
// must open and render every page without an Err.
export const judge = (row) => {
  if (row.trap !== null) return false
  if (row.file.startsWith('fail-')) return row.open !== 'ok'
  return (
    row.open === 'ok' &&
    row.errors.length === 0 &&
    row.rendered === row.pages &&
    row.maxPageMs <= PAGE_LIMIT_MS &&
    row.peakMemory !== null &&
    row.peakMemory <= MEMORY_LIMIT
  )
}

// `--rejudge <out.json>` re-applies judge() to a recorded run without re-rendering.
if (process.argv[2] === '--rejudge') {
  const runPath = resolve(process.argv[3])
  const run = JSON.parse(readFileSync(runPath, 'utf8'))
  for (const row of run.results) row.pass = judge(row)
  writeFileSync(runPath, `${JSON.stringify(run, null, 2)}\n`)
  console.log(run.results.map((r) => `${r.file} pass=${r.pass}`).join('\n'))
  process.exit(0)
}

const wasmBytes = readFileSync(join(pkgDir, 'hayro_trial_bg.wasm'))
const glueUrl = pathToFileURL(join(pkgDir, 'hayro_trial.js'))

const results = []
for (const name of readdirSync(corpusDir)
  .filter((f) => f.endsWith('.pdf'))
  .sort()) {
  // A fresh module record per file, so its wasm instance is fresh too.
  glueUrl.search = `?file=${encodeURIComponent(name)}`
  const glue = await import(glueUrl.href)
  glue.initSync({ module: wasmBytes })

  const row = {
    file: name,
    scale,
    open: null,
    pages: 0,
    rendered: 0,
    maxPageMs: 0,
    totalMs: 0,
    peakMemory: 0,
    trap: null,
    errors: [],
  }
  const t0 = performance.now()
  let doc
  try {
    doc = new glue.Doc(new Uint8Array(readFileSync(join(corpusDir, name))))
    row.open = 'ok'
    row.pages = doc.page_count()
  } catch (e) {
    if (isTrap(e)) row.trap = `open: ${e.message}`
    else row.open = `Err: ${e.message ?? e}`
  }
  if (doc) {
    for (let i = 0; i < row.pages; i++) {
      const p0 = performance.now()
      try {
        const out = doc.render_page(i, scale)
        const w = out[0] | (out[1] << 8)
        const h = out[2] | (out[3] << 8)
        if (w === 0 || h === 0 || out.length !== 4 + w * h * 4) row.errors.push(`page ${i}: bad pixmap ${w}x${h}`)
        else row.rendered++
      } catch (e) {
        if (isTrap(e)) {
          row.trap = `page ${i}: ${e.message}`
          break
        }
        row.errors.push(`page ${i}: Err: ${e.message ?? e}`)
      }
      row.maxPageMs = Math.max(row.maxPageMs, performance.now() - p0)
    }
    try {
      row.peakMemory = glue.memory_bytes()
    } catch {
      row.peakMemory = null // unreadable after a trap; judge() fails the file
    }
  }
  row.totalMs = Math.round(performance.now() - t0)
  row.maxPageMs = Math.round(row.maxPageMs)
  row.pass = judge(row)
  results.push(row)
  const mib = row.peakMemory === null ? '?' : (row.peakMemory / 2 ** 20).toFixed(0)
  console.log(
    `${name.padEnd(40)} open=${row.open ?? '-'} pages=${row.rendered}/${row.pages} maxPage=${row.maxPageMs}ms` +
      ` total=${row.totalMs}ms mem=${mib}MiB trap=${row.trap ?? 'none'} errs=${row.errors.length} pass=${row.pass}`,
  )
}
writeFileSync(outPath, `${JSON.stringify({ node: process.version, scale, results }, null, 2)}\n`)
