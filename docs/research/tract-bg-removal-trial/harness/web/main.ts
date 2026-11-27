// Page side of the #44 harness, driven by run-browser.mjs through
// `window.harness`. Decodes each corpus image once (as RawImage.fromBlob
// does) so both engines get the same RGBA.
import type { Request, Response, Rgba } from './protocol'

type Kind = 'baseline' | 'tract'
type WorkerOpts = { dtype?: string; model?: string; wasm?: string }

const images = new Map<string, Rgba>()
const masks = new Map<string, Uint8Array>()
const workers = new Map<Kind, Worker>()
let nextId = 0

async function decode(name: string): Promise<Rgba> {
  const cached = images.get(name)
  if (cached) return cached
  const blob = await (await fetch(`../corpus/${name}`)).blob()
  const img = await createImageBitmap(blob)
  const ctx = new OffscreenCanvas(img.width, img.height).getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, img.width, img.height).data
  const rgba = { data: data.buffer as ArrayBuffer, height: img.height, width: img.width }
  images.set(name, rgba)
  return rgba
}

/** A synthetic image for the failure inputs (1×1, 8000×8000). */
function synthetic(name: string, width: number, height: number): Rgba {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < data.length; i += 4) {
    const p = i / 4
    data[i] = (p % width) & 255
    data[i + 1] = Math.floor(p / width) & 255
    data[i + 2] = 128
    data[i + 3] = 255
  }
  const rgba = { data: data.buffer, height, width }
  images.set(name, rgba)
  return rgba
}

function spawn(kind: Kind, opts: WorkerOpts = {}): void {
  workers.get(kind)?.terminate()
  const url =
    kind === 'baseline'
      ? new URL('./baseline.worker.ts', import.meta.url)
      : new URL('./tract.worker.ts', import.meta.url)
  // The worker's `name` carries the options (dtype, tract build): vite cannot
  // transform a worker URL with an unknown query.
  const name = JSON.stringify({
    dtype: opts.dtype ?? 'fp32',
    model: opts.model ?? 'model.onnx',
    wasm: opts.wasm ?? 'oz.wasm',
  })
  workers.set(kind, new Worker(url, { name, type: 'module' }))
}

function call(kind: Kind, req: Omit<Request, 'id'>, transfer: Array<Transferable> = []): Promise<Response> {
  const worker = workers.get(kind)
  if (!worker) throw new Error(`no ${kind} worker`)
  const id = nextId++
  return new Promise((resolve, reject) => {
    const onMessage = (e: MessageEvent<Response>) => {
      if (e.data.id !== id) return
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      if (e.data.error) reject(new Error(e.data.error))
      else resolve(e.data)
    }
    const onError = (e: ErrorEvent) => {
      worker.removeEventListener('message', onMessage)
      reject(new Error(`worker error: ${e.message}`))
    }
    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)
    worker.postMessage({ ...req, id }, transfer)
  })
}

const copy = (img: Rgba): Rgba => ({ ...img, data: img.data.slice(0) })

/** Segment one image; keeps the mask in the page under `${tag}:${name}`. */
async function segment(kind: Kind, name: string, tag: string = kind) {
  const img = await decode(name)
  const t = performance.now()
  const res = await call(kind, { cmd: 'segment', image: copy(img) })
  const wallMs = performance.now() - t
  masks.set(`${tag}:${name}`, new Uint8Array(res.mask!))
  return { inputSize: res.inputSize, ms: res.ms, wallMs, wasmMemory: res.wasmMemory }
}

/** Worker spawn → first mask, for a fresh worker. */
async function cold(kind: Kind, name: string, opts: WorkerOpts = {}) {
  const img = await decode(name)
  const t = performance.now()
  spawn(kind, opts)
  const res = await call(kind, { cmd: 'segment', image: copy(img) })
  const ms = performance.now() - t
  masks.set(`cold-${kind}:${name}`, new Uint8Array(res.mask!))
  return { ms, wasmMemory: res.wasmMemory }
}

function psnr(a: ArrayLike<number>, b: ArrayLike<number>, peak: number) {
  if (a.length !== b.length) throw new Error(`length ${a.length} vs ${b.length}`)
  let se = 0
  let maxAbs = 0
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i]
    se += d * d
    if (Math.abs(d) > maxAbs) maxAbs = Math.abs(d)
  }
  const mse = se / a.length
  return { maxAbs, mse, psnrDb: mse === 0 ? Infinity : 10 * Math.log10((peak * peak) / mse) }
}

/** Whole-mask PSNR plus the edge band (either mask in 8..247). */
function compareMasks(tagA: string, tagB: string, name: string) {
  const a = masks.get(`${tagA}:${name}`)
  const b = masks.get(`${tagB}:${name}`)
  if (!a || !b) throw new Error(`missing mask ${tagA}/${tagB}:${name}`)
  const whole = psnr(a, b, 255)
  let n = 0
  let sum = 0
  let max = 0
  let differing = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) differing++
    const edge = (a[i] >= 8 && a[i] <= 247) || (b[i] >= 8 && b[i] <= 247)
    if (!edge) continue
    const d = Math.abs(a[i] - b[i])
    n++
    sum += d
    if (d > max) max = d
  }
  return {
    differingPixels: differing,
    edgeBand: { maxAbs: max, meanAbs: n ? sum / n : 0, pixels: n },
    pixels: a.length,
    ...whole,
  }
}

/** Engine only: transformers.js's own input tensor through tract vs ORT. */
async function rawCompare(name: string) {
  const img = await decode(name)
  const base = await call('baseline', { cmd: 'raw', image: copy(img) })
  const [w, h] = base.inputSize!
  const ort = new Float32Array(base.output!)
  const res = await call('tract', { cmd: 'engine', height: h, tensor: base.tensor!, width: w }, [base.tensor!])
  const tract = new Float32Array(res.output!)
  return { inputSize: [w, h], ...psnr(ort, tract, 1), wasmMemory: res.wasmMemory }
}

/** The mask as a PNG (grey in RGB), for saving and for the Firefox floor. */
async function maskPng(tag: string, name: string): Promise<string> {
  const img = images.get(name)!
  const m = masks.get(`${tag}:${name}`)!
  const rgba = new Uint8ClampedArray(m.length * 4)
  for (let i = 0; i < m.length; i++) {
    rgba[4 * i] = rgba[4 * i + 1] = rgba[4 * i + 2] = m[i]
    rgba[4 * i + 3] = 255
  }
  const canvas = new OffscreenCanvas(img.width, img.height)
  canvas.getContext('2d')!.putImageData(new ImageData(rgba, img.width, img.height), 0, 0)
  const buf = new Uint8Array(await (await canvas.convertToBlob({ type: 'image/png' })).arrayBuffer())
  let s = ''
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000))
  return btoa(s)
}

/** Load a saved mask PNG (e.g. Firefox's) back in under `tag`. */
async function loadMaskPng(tag: string, name: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/png' }), {
    colorSpaceConversion: 'none',
    premultiplyAlpha: 'none',
  })
  const ctx = new OffscreenCanvas(bmp.width, bmp.height).getContext('2d')!
  ctx.drawImage(bmp, 0, 0)
  const d = ctx.getImageData(0, 0, bmp.width, bmp.height).data
  const m = new Uint8Array(bmp.width * bmp.height)
  for (let i = 0; i < m.length; i++) m[i] = d[4 * i]
  masks.set(`${tag}:${name}`, m)
}

Object.assign(window, {
  harness: {
    cold,
    compareMasks,
    decode: async (n: string) => {
      const i = await decode(n)
      return [i.width, i.height]
    },
    loadMaskPng,
    maskPng,
    rawCompare,
    segment,
    spawn,
    synthetic: (n: string, w: number, h: number) => {
      synthetic(n, w, h)
    },
  },
})
document.getElementById('status')!.textContent = 'ready'
