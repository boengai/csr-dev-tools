import type { ImageFormat } from '@/types/constants'

/**
 * Common options for image processing operations
 */
export type ImageProcessingOptions = ImageProcessingStrategyOption & {
  backgroundColor?: string // Background color for JPEG (defaults to white)
  format?: ImageFormat
  height?: number
  maxHeight?: number
  maxWidth?: number
  quality?: number // 0-1 for lossy formats (webp/jpeg). Defaults to 0.8
  width?: number
}

/**
 * Image processing result
 */
export type ImageProcessingResult = {
  dataUrl: string
  format: ImageFormat
  height: number
  quality?: number
  ratio: number // width / height aspect ratio
  size: number
  width: number
}

type ImageProcessingStrategyContainOption = {
  strategy: 'contain'
}

type ImageProcessingStrategyCoverOption = {
  strategy: 'cover'
  x?: number
  y?: number
}

type ImageProcessingStrategyOption =
  | ImageProcessingStrategyContainOption
  | ImageProcessingStrategyCoverOption
  | ImageProcessingStrategyStretchOption

type ImageProcessingStrategyStretchOption = {
  strategy: 'stretch'
}
