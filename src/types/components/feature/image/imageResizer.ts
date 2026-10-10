import type { ImageFormat } from '@/types'

export type ResizeControls = {
  format: ImageFormat | null
  height: number | null
  quality: number | null
  ratio: number | null
  width: number | null
}
