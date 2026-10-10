import type { MutableRefObject, SyntheticEvent } from 'react'
import type { Crop, PixelCrop } from 'react-image-crop'

import type { AspectRatioPreset, CropRegion } from '@/types/utils/crop'

export type CropControls = {
  aspectPreset: AspectRatioPreset
  naturalCrop: CropRegion | null
}

export type CropPreviewProps = {
  aspectPreset: AspectRatioPreset
  captureNaturalCrop: (displayCrop: PixelCrop) => CropRegion | null
  crop: Crop | undefined
  imgRef: MutableRefObject<HTMLImageElement | null>
  onCropComplete: (c: PixelCrop) => void
  onImageLoad: (e: SyntheticEvent<HTMLImageElement>) => void
  setCrop: (c: Crop) => void
  sourceUrl: string
}
