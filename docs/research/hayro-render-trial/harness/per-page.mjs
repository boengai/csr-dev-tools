// Per-page hayro render times for one file, two runs (the second with the JIT warm).
//   node per-page.mjs <pkgDir> <file.pdf> <scale>
import { readFileSync } from 'node:fs'
const [pkg, file, scale] = process.argv.slice(2)
const glue = await import(`file://${pkg}/hayro_trial.js`)
glue.initSync({ module: readFileSync(`${pkg}/hayro_trial_bg.wasm`) })
for (let run = 0; run < 2; run++) {
  const doc = new glue.Doc(new Uint8Array(readFileSync(file)))
  const t = []
  for (let i = 0; i < doc.page_count(); i++) { const p = performance.now(); doc.render_page(i, Number(scale)); t.push(Math.round(performance.now() - p)) }
  console.log(`run ${run}:`, t.join(' '))
}
