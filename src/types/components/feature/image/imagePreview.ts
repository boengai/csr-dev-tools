import type { ImgHTMLAttributes } from 'react'
import type { ImageFormat } from '@/types'

export type ImagePreviewMetadata = {
  format?: ImageFormat
  height?: number
  size?: number
  width?: number
}

export type ImagePreviewProps = Pick<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  metadata?: ImagePreviewMetadata
}
