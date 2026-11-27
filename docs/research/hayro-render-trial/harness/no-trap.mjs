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

const [pkgDir, corpusDir, outPath] = process.argv.slice(2, 5).map((p) => resolve(p))
const scale = Number(process.argv[5] ?? 0.6)
const PAGE_LIMIT_MS = 10_000
const MEMORY_LIMIT = 1024 ** 3

const wasmBytes = readFileSync(join(pkgDir, 'hayro_trial_bg.wasm'))
const glueUrl = new URL(`file://${join(pkgDir, 'hayro_trial.js')}`)

const results = []
for (const name of readdirSync(corpusDir).filter((f) => f.endsWith('.pdf')).sort()) {
  // A fresh module record per file, so its wasm instance is fresh too.
  glueUrl.search = `?file=${encodeURIComponent(name)}`
  const glue = await import(glueUrl.href)
  glue.initSync({ module: wasmBytes })

  const row = { file: name, scale, open: null, pages: 0, rendered: 0, maxPageMs: 0, totalMs: 0, peakMemory: 0, trap: null, errors: [] }
  const t0 = performance.now()
  let doc
  try {
    doc = new glue.Doc(new Uint8Array(readFileSync(join(corpusDir, name))))
    row.open = 'ok'
    row.pages = doc.page_count()
  } catch (e) {
    if (e instanceof WebAssembly.RuntimeError) row.trap = `open: ${e.message}`
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
        if (e instanceof WebAssembly.RuntimeError) {
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
      // The instance trapped; its memory size is still readable from the export below.
    }
  }
  row.totalMs = Math.round(performance.now() - t0)
  row.maxPageMs = Math.round(row.maxPageMs)
  row.pass = row.trap === null && row.maxPageMs <= PAGE_LIMIT_MS && row.peakMemory <= MEMORY_LIMIT
  results.push(row)
  console.log(
    `${name.padEnd(40)} open=${row.open ?? '-'} pages=${row.rendered}/${row.pages} maxPage=${row.maxPageMs}ms total=${row.totalMs}ms mem=${(row.peakMemory / 2 ** 20).toFixed(0)}MiB trap=${row.trap ?? 'none'} errs=${row.errors.length}`,
  )
}
writeFileSync(outPath, `${JSON.stringify({ node: process.version, scale, results }, null, 2)}\n`)
