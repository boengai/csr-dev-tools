import type { ImageProcessingResult } from '@/types'

export type ResizeInput = {
  preview: ImageProcessingResult | null
  source: [File, ImageProcessingResult] | null
}
