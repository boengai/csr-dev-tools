// Per-page hayro render times for one file, two runs (the second with the JIT warm).
//
//   node docs/research/hayro-render-trial/harness/per-page.mjs <pkgDir> <file.pdf> <scale>
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [pkgDir, file] = process.argv.slice(2, 4).map((p) => resolve(p))
const scale = Number(process.argv[4] ?? 0.6)
const glue = await import(pathToFileURL(join(pkgDir, 'hayro_trial.js')).href)
glue.initSync({ module: readFileSync(join(pkgDir, 'hayro_trial_bg.wasm')) })

for (let run = 0; run < 2; run++) {
  const doc = new glue.Doc(new Uint8Array(readFileSync(file)))
  const times = []
  for (let i = 0; i < doc.page_count(); i++) {
    const start = performance.now()
    doc.render_page(i, scale)
    times.push(Math.round(performance.now() - start))
  }
  console.log(`run ${run}:`, times.join(' '))
}
