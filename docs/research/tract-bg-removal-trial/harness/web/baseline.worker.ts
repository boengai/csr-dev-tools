// Baseline: `segmentImage` on `main` (src/workers/background-removal.segment.ts),
// minus decoding: the page decodes once and both engines get the same RGBA.
import { pipeline, RawImage } from '@huggingface/transformers'

import type { Request, Response } from './protocol'

// `main` uses fp32; the worker name may ask for q8 (the reported 2×2 only).
const { dtype = 'fp32' } = JSON.parse(self.name || '{}') as { dtype?: 'fp32' | 'q8' }
const createSegmenter = () => pipeline('background-removal', 'Xenova/modnet', { dtype })
let segmenter: ReturnType<typeof createSegmenter> | null = null

const post = (r: Response, transfer: Array<Transferable> = []) => self.postMessage(r, { transfer })

self.onmessage = async (e: MessageEvent<Request>) => {
  const req = e.data
  try {
    segmenter ??= createSegmenter()
    const seg = await segmenter
    if (req.cmd === 'segment') {
      const t = performance.now()
      const { data, height, width } = req.image
      const output = await seg(new RawImage(new Uint8ClampedArray(data), width, height, 4))
      const result = Array.isArray(output) ? output[0] : output
      const mask = new Uint8Array(width * height)
      for (let i = 0; i < mask.length; i++) mask[i] = result.data[4 * i + 3]
      const ms = performance.now() - t
      post({ id: req.id, mask: mask.buffer, ms }, [mask.buffer])
    } else if (req.cmd === 'raw') {
      const { data, height, width } = req.image
      const image = new RawImage(new Uint8ClampedArray(data), width, height, 4)
      // The same calls the pipeline makes: processor, then the model.
      const { pixel_values } = await seg.processor(image)
      const out = await seg.model({ input: pixel_values })
      const output = Float32Array.from(out[Object.keys(out)[0]].data as Float32Array)
      const tensor = Float32Array.from(pixel_values.data as Float32Array)
      const [, , h, w] = pixel_values.dims
      post({ id: req.id, inputSize: [w, h], output: output.buffer, tensor: tensor.buffer }, [
        output.buffer,
        tensor.buffer,
      ])
    } else {
      throw new Error(`baseline has no ${req.cmd}`)
    }
  } catch (err) {
    post({ id: req.id, error: err instanceof Error ? err.message : String(err) })
  }
}
