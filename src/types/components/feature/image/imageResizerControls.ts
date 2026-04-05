import type { ImageProcessingResult } from '@/types'

export type ImageResizerControlsProps = {
  isLossy: boolean
  onConvert: () => void
  onInputChange: (key: keyof ImageProcessingResult, val: unknown) => void
  preview: ImageProcessingResult | null
  source: [File, ImageProcessingResult] | null
}
