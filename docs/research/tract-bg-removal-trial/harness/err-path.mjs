// No-trap check on the wasm build (Node's V8): bad inputs must come back as
// Err (a thrown JsError), never `unreachable`. A trap poisons the instance,
// so each case gets a fresh one.
import { readFileSync, writeFileSync } from 'node:fs'

const model = readFileSync(new URL('./models/model.onnx', import.meta.url))
const wasm = readFileSync(new URL('./pkg/oz.wasm', import.meta.url))
const cases = {
  'garbage model': (m) => new m.WasmSegmenter(new Uint8Array(4096).fill(7)),
  'empty model': (m) => new m.WasmSegmenter(new Uint8Array(0)),
  'truncated model': (m) => new m.WasmSegmenter(model.subarray(0, model.length >> 1)),
  'q8 model (published file)': (m) =>
    new m.WasmSegmenter(readFileSync(new URL('./models/model_quantized.onnx', import.meta.url))).prepare(512, 512),
  'segment: wrong-length rgba': (m) => new m.WasmSegmenter(model).segment(new Uint8Array(10), 512, 512),
  'segment: zero size': (m) => new m.WasmSegmenter(model).segment(new Uint8Array(0), 0, 0),
  'run: wrong-length tensor': (m) => new m.WasmSegmenter(model).run(new Float32Array(5), 512, 512),
  'prepare: zero width': (m) => new m.WasmSegmenter(model).prepare(512, 0),
  'run: 1x1 tensor': (m) => new m.WasmSegmenter(model).run(new Float32Array(3), 1, 1),
}
const out = {}
for (const [name, fn] of Object.entries(cases)) {
  const m = await import(`./pkg/tract_trial.js?case=${encodeURIComponent(name)}`)
  m.initSync({ module: wasm })
  try {
    fn(m)
    out[name] = 'ok (no error)'
  } catch (e) {
    const trap = e instanceof WebAssembly.RuntimeError
    out[name] = `${trap ? 'TRAP' : 'Err'}: ${String(e.message).split('\n')[0].slice(0, 120)}`
  }
  console.log(name, '->', out[name])
}
writeFileSync(new URL('../runs/err-path.json', import.meta.url), JSON.stringify(out, null, 1))
