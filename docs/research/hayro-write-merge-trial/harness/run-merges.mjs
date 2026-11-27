// Runs the #43 merge calls (M1-M6) through the baseline and each candidate,
// in Node, and writes every output plus a JSON summary.
//
//   node docs/research/hayro-write-merge-trial/harness/run-merges.mjs <corpusDir> <outDir> <pkg-hw> <pkg-lo>
//
// Baseline: combinePdfPages from src/utils/combine-pdf.ts (pdf-lib 1.17.1,
// exactly as on main). Candidates: the merge-trial crate built with
// `--features hw` / `--features lo` (wasm-pack --target web, then wasm-opt).
// Each candidate call gets a fresh wasm instance.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [corpusDir, outDir, pkgHw, pkgLo] = process.argv.slice(2).map((p) => resolve(p))
if (!pkgLo) throw new Error('usage: run-merges.mjs <corpusDir> <outDir> <pkg-hw> <pkg-lo>')
const repo = resolve(import.meta.dirname, '../../../..')
const { combinePdfPages } = await import(join(repo, 'src/utils/combine-pdf.ts'))

const all = (name) => ({ name, pages: 'all' })
const pick = (name, ...pages) => pages.map((p) => ({ name, pages: [p] }))

/** Each merge: a list of { name, pages: 'all' | number[] } in output order. */
const M1_FILES = [
  'arxiv-attention.pdf',
  'irs-fw9.pdf',
  'irs-f1040.pdf',
  'markup-annots.pdf',
  'enc-rc4-128-empty.pdf',
  'enc-aes-128-empty.pdf',
  'enc-aes-256-empty.pdf',
  'edge-std14-rotate-crop.pdf',
  'inherited-attrs.pdf',
  'tool-markdown-to-pdf.pdf',
  'tool-image-to-pdf.pdf',
  'tool-image-to-pdf-grid.pdf',
  'tool-combine-pdf.pdf',
  'naca-scan.pdf',
  'ia-origin-scan.pdf',
]
const MERGES = {
  ...Object.fromEntries(M1_FILES.map((f) => [`M1-${f.replace(/\.pdf$/, '')}`, [all(f)]])),
  'M2-interleaved': [
    ...pick('arxiv-attention.pdf', 0),
    ...pick('irs-fw9.pdf', 0),
    ...pick('arxiv-attention.pdf', 2),
    ...pick('irs-f1040.pdf', 1),
    ...pick('markup-annots.pdf', 0),
  ],
  'M3-arxiv-subset-reversed': pick('arxiv-attention.pdf', 12, 9, 5, 2, 0),
  'M3-markup-reversed': pick('markup-annots.pdf', 1, 0),
  'M4-iso32000-all': [all('iso32000.pdf')],
  'M5-encrypted': [
    all('enc-rc4-128-empty.pdf'),
    ...pick('enc-aes-128-empty.pdf', 0, 1, 2),
    ...pick('enc-aes-256-empty.pdf', 0, 1, 2),
    ...pick('iso32000.pdf', 0, 1, 2),
  ],
  'M6-failures': [
    ...pick('fail-locked-aes-256.pdf', 0),
    ...pick('arxiv-attention.pdf', 0),
    ...pick('fail-truncated.pdf', 0),
    ...pick('fail-not-a-pdf.pdf', 0),
    ...pick('arxiv-attention.pdf', 99),
    ...pick('irs-fw9.pdf', 0),
  ],
}

const bytesCache = new Map()
const bytesOf = (name) => {
  if (!bytesCache.has(name)) bytesCache.set(name, new Uint8Array(readFileSync(join(corpusDir, name))))
  return bytesCache.get(name)
}
const pageCountGuess = { 'iso32000.pdf': 756, 'ia-origin-scan.pdf': 568, 'naca-scan.pdf': 40 }

/** Expand 'all' using pdf-lib's page count (the baseline decides what "all" is). */
const { PDFDocument } = await import('pdf-lib')
const countCache = new Map()
const countPages = async (name) => {
  if (!countCache.has(name)) {
    let n = pageCountGuess[name]
    if (n === undefined) n = (await PDFDocument.load(bytesOf(name), { ignoreEncryption: true })).getPageCount()
    countCache.set(name, n)
  }
  return countCache.get(name)
}
const expand = async (merge) => {
  const items = []
  for (const { name, pages } of merge) {
    const list = pages === 'all' ? [...Array(await countPages(name)).keys()] : pages
    for (const p of list) items.push({ name, pageIndex: p })
  }
  return items
}

const runBaseline = async (items) => {
  const files = new Map()
  const refs = items.map(({ name, pageIndex }) => {
    if (!files.has(name)) files.set(name, new File([bytesOf(name)], name))
    return { file: files.get(name), pageIndex }
  })
  const t0 = performance.now()
  const r = await combinePdfPages(refs)
  return { ms: performance.now() - t0, pdf: r.pdf, pageCount: r.pageCount, skipped: r.skipped }
}

let instance = 0
const runCandidate = async (pkgDir, items) => {
  const mod = await import(`${pathToFileURL(join(pkgDir, 'merge_trial.js')).href}?i=${instance++}`)
  const exports = mod.initSync({ module: readFileSync(join(pkgDir, 'merge_trial_bg.wasm')) })
  const names = []
  const plan = []
  for (const { name, pageIndex } of items) {
    let s = names.indexOf(name)
    if (s < 0) s = names.push(name) - 1
    plan.push(s, pageIndex)
  }
  const sources = names.map((n) => bytesOf(n))
  const t0 = performance.now()
  const r = mod.merge(sources, Uint32Array.from(plan))
  const ms = performance.now() - t0
  const out = {
    ms,
    pdf: r.pdf,
    pageCount: r.pageCount,
    skipped: [...r.skipped].map((i) => names[i]),
    wasmMemBytes: exports.memory.buffer.byteLength,
  }
  r.free()
  return { engine: mod.engine(), ...out }
}

mkdirSync(outDir, { recursive: true })
const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null
const summary = []
for (const [id, merge] of Object.entries(MERGES)) {
  if (only && !only.test(id)) continue
  const items = await expand(merge)
  const row = { id, items: items.length }
  for (const [engine, run] of [
    ['pdf-lib', () => runBaseline(items)],
    ['hw', () => runCandidate(pkgHw, items)],
    ['lo', () => runCandidate(pkgLo, items)],
  ]) {
    mkdirSync(join(outDir, engine), { recursive: true })
    try {
      const r = await run()
      writeFileSync(join(outDir, engine, `${id}.pdf`), r.pdf)
      row[engine] = {
        ms: Math.round(r.ms),
        bytes: r.pdf.length,
        pageCount: r.pageCount,
        skipped: r.skipped,
        ...(r.wasmMemBytes ? { wasmMemMiB: +(r.wasmMemBytes / 2 ** 20).toFixed(1) } : {}),
      }
    } catch (e) {
      row[engine] = { error: String(e?.message ?? e).slice(0, 300) }
    }
  }
  console.log(JSON.stringify(row))
  summary.push(row)
}
writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2))
