// Pre-check (not the judged run): warm inference time, tract wasm vs ORT web
// wasm (single thread, SIMD), on the same constant tensor, in Node's V8.
// Usage: node node-precheck.mjs <model.onnx> <ort-dist-dir> <h> <w> [wasm]
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { initSync, WasmSegmenter } from './pkg/tract_trial.js'

const [modelPath, ortDist, hs, ws, wasmFile = 'oz.wasm'] = process.argv.slice(2)
const h = Number(hs),
  w = Number(ws)
const model = readFileSync(modelPath)
const input = new Float32Array(3 * h * w)
for (let i = 0; i < input.length; i++) input[i] = Math.sin(i * 0.001) * 0.9

const median = (a) => [...a].sort((x, y) => x - y)[a.length >> 1]
const N = 5

// tract
let t = performance.now()
initSync({ module: readFileSync(new URL(`./pkg/${wasmFile}`, import.meta.url)) })
const seg = new WasmSegmenter(model)
seg.prepare(h, w)
const tractCold = performance.now() - t
const tractRuns = []
let tractOut
for (let i = 0; i < N; i++) {
  t = performance.now()
  tractOut = seg.run(input, h, w)
  tractRuns.push(performance.now() - t)
}

console.error('tract done', tractRuns.map((x) => x.toFixed(0)).join(' '))
// ORT web, wasm EP, 1 thread
const ort = await import(pathToFileURL(`${ortDist}/ort.wasm.min.mjs`).href)
ort.env.wasm.numThreads = 1
ort.env.wasm.wasmPaths = pathToFileURL(`${ortDist}/`).href
t = performance.now()
const sess = await ort.InferenceSession.create(model, { executionProviders: ['wasm'] })
const ortCold = performance.now() - t
const feeds = { [sess.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, h, w]) }
const ortRuns = []
let ortOut
for (let i = 0; i < N; i++) {
  t = performance.now()
  ortOut = (await sess.run(feeds))[sess.outputNames[0]].data
  ortRuns.push(performance.now() - t)
}

let se = 0,
  maxd = 0
for (let i = 0; i < ortOut.length; i++) {
  const d = ortOut[i] - tractOut[i]
  se += d * d
  maxd = Math.max(maxd, Math.abs(d))
}
const mse = se / ortOut.length
console.log(
  JSON.stringify(
    {
      shape: [h, w],
      wasmFile,
      tract: {
        coldMs: +tractCold.toFixed(0),
        runsMs: tractRuns.map((x) => +x.toFixed(0)),
        median: +median(tractRuns).toFixed(0),
      },
      ort: {
        coldMs: +ortCold.toFixed(0),
        runsMs: ortRuns.map((x) => +x.toFixed(0)),
        median: +median(ortRuns).toFixed(0),
      },
      ratio: +(median(tractRuns) / median(ortRuns)).toFixed(2),
      rawTensor: { psnrDb: +(10 * Math.log10(1 / mse)).toFixed(1), maxAbsDiff: maxd },
    },
    null,
    1,
  ),
)
