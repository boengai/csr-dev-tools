// Candidate: tract-onnx in a Rust worker. The two resizes use OffscreenCanvas
// `drawImage`, as transformers.js does on `main` (and as ADR-0033's platform
// layer would); normalisation, inference and the uint8 conversion are Rust.
import init, { WasmSegmenter } from '../pkg/tract_trial.js'
import type { Request, Response } from './protocol'
import { modelInputSize } from './protocol'

const opts = JSON.parse(self.name || '{}') as { model?: string; wasm?: string }
// Root-absolute on purpose: vite rewrites `new URL(template, import.meta.url)`.
const HARNESS = '/docs/research/tract-bg-removal-trial/harness'
const WASM = new URL(HARNESS + '/pkg/' + (opts.wasm ?? 'oz.wasm'), self.location.origin)
const MODEL = new URL(HARNESS + '/models/' + (opts.model ?? 'model.onnx'), self.location.origin)

// Model bytes come from Cache Storage after the first visit, like
// transformers.js's own cache.
async function modelBytes(): Promise<Uint8Array> {
  const cache = await caches.open('tract-trial-model')
  let res = await cache.match(MODEL)
  if (!res) {
    await cache.add(MODEL)
    res = await cache.match(MODEL)
  }
  return new Uint8Array(await res!.arrayBuffer())
}

let ready: Promise<{ seg: WasmSegmenter; memory: WebAssembly.Memory }> | null = null
const load = async () => {
  const wasm = await init({ module_or_path: WASM })
  return { memory: wasm.memory, seg: new WasmSegmenter(await modelBytes()) }
}

const resize = (src: Uint8ClampedArray, w: number, h: number, nw: number, nh: number): Uint8ClampedArray => {
  if (w === nw && h === nh) return src
  const from = new OffscreenCanvas(w, h)
  from.getContext('2d')!.putImageData(new ImageData(src, w, h), 0, 0)
  const ctx = new OffscreenCanvas(nw, nh).getContext('2d')!
  ctx.drawImage(from, 0, 0, nw, nh)
  return ctx.getImageData(0, 0, nw, nh).data
}

const post = (r: Response, transfer: Array<Transferable> = []) => self.postMessage(r, { transfer })

self.onmessage = async (e: MessageEvent<Request>) => {
  const req = e.data
  try {
    ready ??= load()
    const { memory, seg } = await ready
    if (req.cmd === 'segment') {
      const t = performance.now()
      const { data, height, width } = req.image
      // rgb(): drop alpha; toCanvas() puts it back as 255.
      const rgba = new Uint8ClampedArray(data.slice(0))
      for (let i = 3; i < rgba.length; i += 4) rgba[i] = 255
      const [nw, nh] = modelInputSize(width, height)
      const input = resize(rgba, width, height, nw, nh)
      const small = seg.segment(new Uint8Array(input.buffer, input.byteOffset, input.byteLength), nh, nw)
      // fromTensor(1 channel).resize(): rgba() grey, drawImage, grayscale().
      const grey = new Uint8ClampedArray(nw * nh * 4)
      for (let i = 0; i < small.length; i++) {
        grey[4 * i] = grey[4 * i + 1] = grey[4 * i + 2] = small[i]
        grey[4 * i + 3] = 255
      }
      const big = resize(grey, nw, nh, width, height)
      // putAlpha(): the full-size RGBA output the tool needs (source RGB,
      // mask as alpha). The baseline's timed call builds the same image.
      const output = new Uint8ClampedArray(width * height * 4)
      for (let i = 0; i < width * height; i++) {
        output[4 * i] = rgba[4 * i]
        output[4 * i + 1] = rgba[4 * i + 1]
        output[4 * i + 2] = rgba[4 * i + 2]
        output[4 * i + 3] = Math.round(0.2989 * big[4 * i] + 0.587 * big[4 * i + 1] + 0.114 * big[4 * i + 2])
      }
      // Read the alpha back out, as the baseline worker does, for the comparison.
      const mask = new Uint8Array(width * height)
      for (let i = 0; i < mask.length; i++) mask[i] = output[4 * i + 3]
      const ms = performance.now() - t
      post({ id: req.id, inputSize: [nw, nh], mask: mask.buffer, ms, wasmMemory: memory.buffer.byteLength }, [
        mask.buffer,
      ])
    } else if (req.cmd === 'engine') {
      const t = performance.now()
      const out = seg.run(new Float32Array(req.tensor), req.height, req.width)
      const ms = performance.now() - t
      post({ id: req.id, ms, output: out.buffer, wasmMemory: memory.buffer.byteLength }, [out.buffer])
    } else {
      throw new Error(`tract has no ${req.cmd}`)
    }
  } catch (err) {
    post({ id: req.id, error: err instanceof Error ? err.message : String(err) })
  }
}
