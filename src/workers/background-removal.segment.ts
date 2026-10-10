import { pipeline, RawImage } from '@huggingface/transformers'

import type { BgRemovalResult } from '@/types/utils/background-removal'

import { retryableOnce } from './retryable-once'

// The model download fires progress through the pipeline's construction-time
// `progress_callback`. Route it to whichever caller is currently waiting, not
// the first caller that happened to trigger the load.
let progressListener: ((progress: number) => void) | null = null

const createSegmenter = () =>
  pipeline('background-removal', 'Xenova/modnet', {
    dtype: 'fp32',
    progress_callback: (info) => {
      if ('progress' in info && typeof info.progress === 'number') progressListener?.(info.progress)
    },
  })

let loadSegmenter = retryableOnce(createSegmenter)

/**
 * Remove the background from an encoded image. Runs inside the
 * background-removal worker so model load + ONNX inference stay off the UI
 * thread. Returns RGBA pixels whose alpha channel is the foreground mask.
 */
export async function segmentImage(
  bytes: ArrayBuffer,
  type: string,
  onProgress?: (progress: number) => void,
): Promise<BgRemovalResult> {
  progressListener = onProgress ?? null
  try {
    const segmenter = await loadSegmenter()
    const image = await RawImage.fromBlob(new Blob([bytes], { type }))
    const output = await segmenter(image)
    const result = Array.isArray(output) ? output[0] : output
    const { data, height, width } = result

    const rgba = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < rgba.length; i++) {
      rgba[i] = Number(data[i]) || 0
    }
    return { height, rgba: rgba.buffer, width }
  } finally {
    if (progressListener === onProgress) progressListener = null
  }
}

/** Drop the cached pipeline (specs). */
export function resetSegmenterCache(): void {
  loadSegmenter = retryableOnce(createSegmenter)
}
