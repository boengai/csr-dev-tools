import type { AspectRatioOption, AspectRatioPreset, CropRegion } from '@/types/utils/crop'

export const ASPECT_RATIO_OPTIONS: Array<AspectRatioOption> = [
  { label: 'Free', ratio: undefined, value: 'free' },
  { label: '16:9', ratio: 16 / 9, value: '16:9' },
  { label: '4:3', ratio: 4 / 3, value: '4:3' },
  { label: '1:1', ratio: 1, value: '1:1' },
  { label: '3:2', ratio: 3 / 2, value: '3:2' },
]

export const getAspectRatio = (preset: AspectRatioPreset): number | undefined => {
  return ASPECT_RATIO_OPTIONS.find((o) => o.value === preset)?.ratio
}

export const scaleCropToNatural = (
  crop: CropRegion,
  displayWidth: number,
  displayHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): CropRegion => {
  const scaleX = naturalWidth / displayWidth
  const scaleY = naturalHeight / displayHeight
  return {
    height: Math.round(crop.height * scaleY),
    width: Math.round(crop.width * scaleX),
    x: Math.round(crop.x * scaleX),
    y: Math.round(crop.y * scaleY),
  }
}

export const clampCropRegion = (crop: CropRegion, maxWidth: number, maxHeight: number): CropRegion => {
  const x = Math.max(0, Math.min(crop.x, maxWidth - 1))
  const y = Math.max(0, Math.min(crop.y, maxHeight - 1))
  const width = Math.max(1, Math.min(crop.width, maxWidth - x))
  const height = Math.max(1, Math.min(crop.height, maxHeight - y))
  return { height, width, x, y }
}

export const getDefaultCrop = (imageWidth: number, imageHeight: number, aspectRatio?: number): CropRegion => {
  const cropWidth = Math.round(imageWidth * 0.8)
  const cropHeight = aspectRatio ? Math.round(cropWidth / aspectRatio) : Math.round(imageHeight * 0.8)
  const clampedHeight = Math.min(cropHeight, imageHeight)
  const clampedWidth = aspectRatio ? Math.round(clampedHeight * aspectRatio) : cropWidth
  return {
    height: clampedHeight,
    width: Math.min(clampedWidth, imageWidth),
    x: Math.round((imageWidth - Math.min(clampedWidth, imageWidth)) / 2),
    y: Math.round((imageHeight - clampedHeight) / 2),
  }
}
