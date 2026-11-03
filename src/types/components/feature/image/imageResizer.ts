import type { ImageFormat, SelectInputProps } from '@/types'

/** Output format choice for batch tools: a fixed format, or each file's own. */
export type ImageOutputFormat = ImageFormat | 'original'

export type ImageFormatSelectInputProps = Pick<SelectInputProps, 'disabled' | 'onChange' | 'value'> & {
  /** Prepend a "Keep original format" option (value `'original'`). */
  includeOriginal?: boolean
}

/**
 * - `fit`: shrink to fit within width × height, keeping the aspect ratio (a blank side is unconstrained; never enlarges).
 * - `cover`: exactly width × height — scale to cover the box, then centre-crop the overflow.
 * - `stretch`: exactly width × height — scale each axis independently (distorts a different shape).
 */
export type ImageResizeMode = 'cover' | 'fit' | 'stretch'

export type ImageResizerSettings = {
  format: ImageOutputFormat
  height: number | null
  mode: ImageResizeMode
  quality: string
  width: number | null
}
