// Structural diff of every merge output against pdf-lib's, for #43.
//
//   node docs/research/hayro-write-merge-trial/harness/analyze.mjs <outDir>
//
// Reads <outDir>/summary.json and <outDir>/{pdf-lib,hw,lo}/<id>.pdf (from
// run-merges.mjs). Needs `qpdf` on PATH. For each output it records:
// - `qpdf --check`: ok / warnings / errors (exit 0 / 3 / 2);
// - per page: effective MediaBox, CropBox, Rotate (inheritance resolved);
// - per page: annotations by kind (Link-URI, Link-GoTo-explicit-ok when the
//   target is a page of this output, Link-GoTo-explicit-dangling,
//   Link-GoTo-named, Widget, and other subtypes);
// - catalog: /AcroForm, /Outlines, /Names, /Dests present.
// Writes <outDir>/analysis.json and prints one line per merge and engine.
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const outDir = resolve(process.argv[2] ?? '')
const summary = JSON.parse(readFileSync(join(outDir, 'summary.json'), 'utf8'))
const ENGINES = ['pdf-lib', 'hw', 'lo']

const qpdf = (args) => spawnSync('qpdf', args, { maxBuffer: 1 << 30, encoding: 'utf8' })

const inspect = (file) => {
  const check = qpdf(['--check', file])
  const checkState = check.status === 0 ? 'ok' : check.status === 3 ? 'warnings' : 'errors'
  const checkMsg = (check.stderr + check.stdout)
    .split('\n')
    .filter((l) => /error|WARNING/i.test(l))
    .slice(0, 3)
  const j = qpdf(['--json=2', '--json-key=pages', '--json-key=qpdf', file])
  if (j.status !== 0 && j.status !== 3) return { check: checkState, checkMsg, unreadable: true }
  const json = JSON.parse(j.stdout)
  const objs = json.qpdf[1]
  const get = (ref) => {
    if (typeof ref !== 'string' || !/^\d+ \d+ R$/.test(ref)) return ref
    const o = objs[`obj:${ref}`]
    if (!o) return null
    return o.value ?? o.stream?.dict ?? null
  }
  const trailer = objs.trailer?.value ?? {}
  const catalog = get(trailer['/Root']) ?? {}
  const pageRefs = json.pages.map((p) => p.object)
  const pageSet = new Set(pageRefs)
  const inherit = (pageRef, key) => {
    let node = get(pageRef)
    for (let i = 0; node && i < 64; i++) {
      if (node[key] !== undefined) return get(node[key])
      node = get(node['/Parent'])
    }
    return undefined
  }
  const fmtBox = (b) => (Array.isArray(b) ? b.map((n) => +(+get(n)).toFixed(2)).join(' ') : null)
  const annotKinds = {}
  const pages = pageRefs.map((ref) => {
    const media = fmtBox(inherit(ref, '/MediaBox'))
    const crop = fmtBox(inherit(ref, '/CropBox')) ?? media
    const rotate = +(inherit(ref, '/Rotate') ?? 0)
    const kinds = {}
    const annots = get(get(ref)?.['/Annots']) ?? []
    for (const a of Array.isArray(annots) ? annots : []) {
      const ad = get(a)
      if (!ad || typeof ad !== 'object') {
        kinds['(null)'] = (kinds['(null)'] ?? 0) + 1
        continue
      }
      let k = String(ad['/Subtype'] ?? '?').replace('/', '')
      if (k === 'Link') {
        const act = get(ad['/A'])
        const dest = act && get(act['/S']) === '/GoTo' ? get(act['/D']) : get(ad['/Dest'])
        if (act && get(act['/S']) === '/URI') k = 'Link-URI'
        else if (Array.isArray(dest)) k = pageSet.has(dest[0]) ? 'Link-GoTo-explicit-ok' : 'Link-GoTo-explicit-dangling'
        else if (dest !== undefined && dest !== null) k = 'Link-GoTo-named'
        else if (act) k = `Link-${String(get(act['/S'])).replace('/', '')}`
      }
      kinds[k] = (kinds[k] ?? 0) + 1
      annotKinds[k] = (annotKinds[k] ?? 0) + 1
    }
    return { media, crop, rotate, kinds }
  })
  return {
    check: checkState,
    checkMsg,
    pageCount: pages.length,
    pages,
    annotKinds,
    catalog: Object.fromEntries(['/AcroForm', '/Outlines', '/Names', '/Dests'].map((k) => [k, catalog[k] !== undefined])),
    encrypted: trailer['/Encrypt'] !== undefined,
  }
}

const geometryDiff = (a, b) => {
  const diffs = []
  const n = Math.max(a.pages.length, b.pages.length)
  for (let i = 0; i < n; i++) {
    const x = a.pages[i], y = b.pages[i]
    if (!x || !y) { diffs.push(`p${i + 1}: missing`); continue }
    for (const k of ['media', 'crop', 'rotate']) if (x[k] !== y[k]) diffs.push(`p${i + 1} ${k}: ${x[k]} vs ${y[k]}`)
  }
  return diffs
}
/** Per-page annotation kinds that pdf-lib keeps and the candidate has fewer of. */
const annotLoss = (base, cand) => {
  const lost = {}
  base.pages.forEach((p, i) => {
    for (const [k, n] of Object.entries(p.kinds)) {
      const m = cand.pages[i]?.kinds[k] ?? 0
      if (m < n) lost[k] = (lost[k] ?? 0) + (n - m)
    }
  })
  return lost
}

const analysis = []
for (const row of summary) {
  const res = { id: row.id }
  for (const e of ENGINES) {
    if (!row[e] || row[e].error) { res[e] = { error: row[e]?.error ?? 'missing' }; continue }
    res[e] = inspect(join(outDir, e, `${row.id}.pdf`))
  }
  const base = res['pdf-lib']
  for (const e of ['hw', 'lo']) {
    const c = res[e]
    if (!c || c.error || c.unreadable || !base || base.error || base.unreadable) continue
    c.vsBase = {
      sizeRatio: +(row[e].bytes / row['pdf-lib'].bytes).toFixed(3),
      geometry: geometryDiff(base, c).slice(0, 5),
      annotLost: annotLoss(base, c),
      catalogLost: Object.keys(base.catalog).filter((k) => base.catalog[k] && !c.catalog[k]),
    }
  }
  analysis.push(res)
  for (const e of ENGINES) {
    const r = res[e]
    const s = r.error
      ? `ERROR ${r.error}`
      : `check=${r.check} pages=${r.pageCount} annots=${JSON.stringify(r.annotKinds)} cat=${Object.keys(r.catalog ?? {}).filter((k) => r.catalog[k]).join(',')}` +
        (r.vsBase ? ` | size×${r.vsBase.sizeRatio} geo=${JSON.stringify(r.vsBase.geometry)} lost=${JSON.stringify(r.vsBase.annotLost)} catLost=${r.vsBase.catalogLost}` : '')
    console.log(`${row.id.padEnd(30)} ${e.padEnd(8)} ${s}`)
  }
}
for (const r of analysis) for (const e of ENGINES) if (r[e]?.pages) delete r[e].pages
writeFileSync(join(outDir, 'analysis.json'), JSON.stringify(analysis, null, 2))
