import type { BgRemovalResult, BgRemovalWorkerRequest } from '@/types/utils/background-removal'

import { createWorkerBridge } from '../wasm/worker-bridge'
import { canvasToBlob } from './canvas'
import { loadImageFromBlob } from './image'

// Model load + ONNX inference run in a worker so the UI thread stays
// responsive. transformers.js still fetches the ONNX Runtime wasm from
// jsdelivr at runtime from inside the worker.
const bridge = createWorkerBridge<BgRemovalWorkerRequest>(
  () => new Worker(new URL('../workers/background-removal.worker.ts', import.meta.url), { type: 'module' }),
)

export async function removeBackground(image: Blob, onProgress?: (progress: number) => void): Promise<Blob> {
  if (!image.type.startsWith('image/')) {
    throw new Error('Please select an image file (PNG, JPG, or WEBP)')
  }

  const bytes = await image.arrayBuffer()
  const { height, rgba, width } = await bridge.call<BgRemovalResult>(
    { bytes, type: image.type },
    { onProgress, transfer: [bytes] },
  )

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to create canvas context')

  ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0)

  return canvasToBlob(canvas)
}

/**
 * Composite `foreground` over a solid `color`. Pass `signal` to skip the
 * draw + PNG encode (the expensive half) when the run was superseded while
 * the image was decoding — e.g. a colour-picker drag firing per tick.
 */
export async function applyBackground(foreground: Blob, color: string, signal?: AbortSignal): Promise<Blob> {
  if (!foreground.type.startsWith('image/')) {
    throw new Error('Invalid foreground image')
  }

  const img = await loadImageFromBlob(foreground)
  signal?.throwIfAborted()

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to create canvas context')

  ctx.fillStyle = color
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)

  return canvasToBlob(canvas)
}
