// Bytes check for #44. Every file is brotli-compressed here at quality 11, so
// both sides use the same compressor. Run from the repo root after
// `pnpm build` and build-wasm.sh. Prints JSON.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { brotliCompressSync, constants } from 'node:zlib'

const H = 'docs/research/tract-bg-removal-trial/harness'
const ORT = readdirSync('node_modules/.pnpm').find((d) => d.startsWith('onnxruntime-web@1.31'))
const ORT_DIST = join('node_modules/.pnpm', ORT, 'node_modules/onnxruntime-web/dist')
const worker = readdirSync('dist/assets').find((f) => f.startsWith('background-removal.worker-') && f.endsWith('.js'))

const br = (path) => {
  const b = readFileSync(path)
  const c = brotliCompressSync(b, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: b.length },
  })
  return { brotli: c.length, path, raw: statSync(path).size }
}
const total = (files) => files.reduce((s, f) => s + f.brotli, 0)

const baseline = [
  br(join('dist/assets', worker)), // transformers.js + our segment code, as built today
  br(join(ORT_DIST, 'ort-wasm-simd-threaded.asyncify.mjs')), // fetched from jsdelivr at runtime
  br(join(ORT_DIST, 'ort-wasm-simd-threaded.asyncify.wasm')), // fetched from jsdelivr at runtime
]
const candidate = (wasm) => [
  br(join(H, 'pkg', wasm)),
  br(join(H, 'pkg/tract_trial.js')),
  br(join(H, 'web/tract.worker.ts')),
]
const oz = candidate('oz.wasm')
const o3 = candidate('o3.wasm')
const models = ['model.onnx', 'model_quantized.onnx'].map((m) => ({
  path: m,
  raw: statSync(join(H, 'models', m)).size,
}))

console.log(
  JSON.stringify(
    {
      baseline: { files: baseline, total: total(baseline) },
      candidateOz: { files: oz, total: total(oz) },
      candidateO3: { files: o3, total: total(o3) },
      models,
      ratioOz: total(oz) / total(baseline),
    },
    null,
    1,
  ),
)
