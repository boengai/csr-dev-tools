// Checks that empty-password decryption yields real pages: the encrypted arXiv
// copies must render byte-identical to the plain file, and ISO 32000 (real-world R3)
// must have ink. Prints dark-pixel counts and a pixmap hash per page.
//
//   node docs/research/hayro-render-trial/harness/decrypt-check.mjs <pkgDir> <corpusDir>
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
const [pkg, dir] = process.argv.slice(2).map((p) => resolve(p))
const glue = await import(`file://${pkg}/hayro_trial.js`)
glue.initSync({ module: readFileSync(`${pkg}/hayro_trial_bg.wasm`) })
const probe = (file, pages) => {
  const doc = new glue.Doc(new Uint8Array(readFileSync(`${dir}/${file}`)))
  for (const i of pages) {
    const out = doc.render_page(i, 0.6)
    let ink = 0
    for (let p = 4; p < out.length; p += 4) if (out[p] < 200 || out[p + 1] < 200 || out[p + 2] < 200) ink++
    console.log(
      file.padEnd(24),
      'page',
      i,
      'ink',
      String(ink).padStart(6),
      createHash('sha256').update(out).digest('hex').slice(0, 12),
    )
  }
}
for (const f of ['arxiv-attention.pdf', 'enc-rc4-128-empty.pdf', 'enc-aes-128-empty.pdf', 'enc-aes-256-empty.pdf'])
  probe(f, [0, 2])
probe('iso32000.pdf', [0, 10, 100, 400])
