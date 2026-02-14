import type { ImageFormat, ImageProcessingOptions, ImageProcessingResult } from '@/types'

/**
 * Validate if a string is a valid ImageFormat
 */
const VALID_IMAGE_FORMATS: ReadonlySet<string> = new Set([
  'image/avif',
  'image/bmp',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
])

export const isValidImageFormat = (format: string): format is ImageFormat => {
  return VALID_IMAGE_FORMATS.has(format)
}

/**
 * Get safe ImageFormat with fallback
 */
export const getSafeImageFormat = (format: string | undefined, fallback: ImageFormat = 'image/jpeg'): ImageFormat => {
  if (format && isValidImageFormat(format)) {
    return format
  }
  return fallback
}

/**
 * Cleanup image element to prevent memory leaks
 */
const cleanupImage = (img: HTMLImageElement): void => {
  img.onload = null
  img.onerror = null
  img.src = ''
}

/**
 * Cleanup canvas to prevent memory leaks
 */
const cleanupCanvas = (canvas: HTMLCanvasElement): void => {
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  canvas.width = 0
  canvas.height = 0
}

/**
 * Load image from File and return HTMLImageElement
 */
const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    const cleanup = () => {
      img.onload = null
      img.onerror = null
    }

    img.onload = () => {
      cleanup()
      resolve(img)
    }

    img.onerror = (event) => {
      cleanup()
      const errorMsg = event instanceof ErrorEvent ? event.message : 'Failed to load image'
      reject(new Error(`Image loading failed: ${errorMsg}`))
    }

    const reader = new FileReader()

    reader.onerror = (e) => {
      cleanup()
      reject(new Error(`File reading failed: ${e.target?.error?.message ?? 'Unknown error'}`))
    }

    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        img.src = reader.result
      } else {
        cleanup()
        reject(new Error('Failed to read file as data URL'))
      }
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Create canvas and get 2D context with error handling
 */
const createCanvasContext = (
  width: number,
  height: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to acquire 2D canvas context')
  }

  return { canvas, ctx }
}

/**
 * Validate and clamp coordinates within bounds
 */
export const validateCoordinates = (
  x: number,
  y: number,
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { height: number; width: number; x: number; y: number } => {
  const clampedX = Math.max(0, Math.min(x, maxWidth - width))
  const clampedY = Math.max(0, Math.min(y, maxHeight - height))
  const clampedWidth = Math.max(1, Math.min(width, maxWidth - clampedX))
  const clampedHeight = Math.max(1, Math.min(height, maxHeight - clampedY))

  return {
    height: clampedHeight,
    width: clampedWidth,
    x: clampedX,
    y: clampedY,
  }
}

/**
 * Calculate dimensions based on resize strategy
 */
export const calculateDimensions = (
  source: { height: number; width: number; x?: number; y?: number },
  target: { height: number; width: number },
  strategy: ImageProcessingOptions['strategy'],
): {
  canvas: { height: number; width: number }
  source: { height: number; width: number; x: number; y: number }
} => {
  // Validate input dimensions
  if (source.width <= 0 || source.height <= 0 || target.width <= 0 || target.height <= 0) {
    throw new Error('Invalid dimensions: width and height must be positive numbers')
  }

  switch (strategy) {
    case 'contain': {
      // Scale down preserving aspect ratio
      const scale = Math.min(target.width / source.width, target.height / source.height)

      // If scale is exactly 1 or greater, use target dimensions directly to avoid rounding issues
      if (scale >= 1) {
        return {
          canvas: { height: target.height, width: target.width },
          source: { height: source.height, width: source.width, x: 0, y: 0 },
        }
      }

      const finalWidth = Math.max(1, Math.round(source.width * scale))
      const finalHeight = Math.max(1, Math.round(source.height * scale))

      return {
        canvas: { height: finalHeight, width: finalWidth },
        source: { height: source.height, width: source.width, x: 0, y: 0 },
      }
    }

    case 'cover': {
      // Prevent division by zero
      if (source.height === 0 || target.height === 0) {
        throw new Error('Invalid dimensions: height cannot be zero for cover strategy')
      }

      // Crop while maintaining minimum of source width or height
      const minSourceDimension = Math.min(source.width, source.height)
      const sourceAspectRatio = source.width / source.height
      const targetAspectRatio = target.width / target.height

      let sourceX = 0
      let sourceY = 0
      let cropSourceWidth = source.width
      let cropSourceHeight = source.height

      if (Math.abs(targetAspectRatio) < Number.EPSILON) {
        throw new Error('Invalid target aspect ratio: width cannot be zero')
      }

      if (sourceAspectRatio > targetAspectRatio) {
        // Source is wider, crop width - but ensure we maintain minimum dimension
        cropSourceWidth = source.height * targetAspectRatio
        // Ensure we don't go below minimum dimension
        if (cropSourceWidth < minSourceDimension) {
          cropSourceWidth = minSourceDimension
          cropSourceHeight = cropSourceWidth / targetAspectRatio
        }
        sourceX = (source.width - cropSourceWidth) / 2
      } else {
        // Source is taller, crop height - but ensure we maintain minimum dimension
        cropSourceHeight = source.width / targetAspectRatio
        // Ensure we don't go below minimum dimension
        if (cropSourceHeight < minSourceDimension) {
          cropSourceHeight = minSourceDimension
          cropSourceWidth = cropSourceHeight * targetAspectRatio
        }
        sourceY = (source.height - cropSourceHeight) / 2
      }

      // Validate and clamp user-provided coordinates
      if (typeof source.x === 'number' || typeof source.y === 'number') {
        const validated = validateCoordinates(
          source.x ?? sourceX,
          source.y ?? sourceY,
          cropSourceWidth,
          cropSourceHeight,
          source.width,
          source.height,
        )
        sourceX = validated.x
        sourceY = validated.y
        cropSourceWidth = validated.width
        cropSourceHeight = validated.height
      }

      return {
        canvas: { height: target.height, width: target.width },
        source: { height: cropSourceHeight, width: cropSourceWidth, x: sourceX, y: sourceY },
      }
    }

    case 'stretch':
    default: {
      return {
        canvas: { height: target.height, width: target.width },
        source: { height: source.height, width: source.width, x: 0, y: 0 },
      }
    }
  }
}

/**
 * Generate canvas data URL with format and quality options
 */
const canvasToDataUrl = (canvas: HTMLCanvasElement, format: ImageFormat, quality?: number): string => {
  const normalizedQuality = typeof quality === 'number' ? Math.min(1, Math.max(0, quality)) : 1

  switch (format) {
    case 'image/png':
    case 'image/gif':
    case 'image/bmp':
      return canvas.toDataURL(format)
    case 'image/avif':
    case 'image/webp':
      return canvas.toDataURL(format, normalizedQuality)
    case 'image/jpeg':
    default:
      return canvas.toDataURL('image/jpeg', normalizedQuality)
  }
}

/**
 * Core image processing function - handles loading, resizing, and format conversion
 */
export const processImage = async (
  file: File,
  options: ImageProcessingOptions = { strategy: 'stretch' },
): Promise<ImageProcessingResult> => {
  let img: HTMLImageElement | null = null
  let canvas: HTMLCanvasElement | null = null

  try {
    img = await loadImageFromFile(file)
    const sourceWidth = img.naturalWidth || img.width
    const sourceHeight = img.naturalHeight || img.height

    // Validate source dimensions
    if (sourceWidth <= 0 || sourceHeight <= 0) {
      throw new Error('Invalid image dimensions: image appears to be corrupted or empty')
    }

    // Determine target format safely
    const targetFormat = getSafeImageFormat(options.format, getSafeImageFormat(file.type))

    // Check if we need any processing
    const needsResize = Boolean(options.maxWidth || options.maxHeight || options.width || options.height)
    const needsFormatChange = file.type !== targetFormat
    const needsQualityChange =
      (targetFormat === 'image/avif' || targetFormat === 'image/jpeg' || targetFormat === 'image/webp') &&
      typeof options.quality === 'number'

    // If no processing needed, return original as data URL
    if (!needsResize && !needsFormatChange && !needsQualityChange) {
      const reader = new FileReader()

      return new Promise((resolve, reject) => {
        reader.onload = () => {
          if (reader.result && typeof reader.result === 'string') {
            resolve({
              dataUrl: reader.result,
              format: targetFormat,
              height: sourceHeight,
              quality: options.quality ?? 1,
              ratio: sourceWidth / sourceHeight,
              size:
                Math.ceil((reader.result.length * 3) / 4) -
                (reader.result.endsWith('==') ? 2 : reader.result.endsWith('=') ? 1 : 0),
              width: sourceWidth,
            })
          } else {
            reject(new Error('Failed to read file as data URL'))
          }
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })
    }

    // Calculate target dimensions
    let targetWidth = options.width || sourceWidth
    let targetHeight = options.height || sourceHeight

    // Apply max constraints if specified
    if (options.maxWidth || options.maxHeight) {
      const maxW = options.maxWidth ?? Number.POSITIVE_INFINITY
      const maxH = options.maxHeight ?? Number.POSITIVE_INFINITY

      // Prevent division by zero
      if (sourceWidth <= 0 || sourceHeight <= 0) {
        throw new Error('Invalid source dimensions for scaling')
      }

      const widthScale = maxW / sourceWidth
      const heightScale = maxH / sourceHeight
      const scale = Math.min(widthScale, heightScale)

      if (Number.isFinite(scale) && scale < 1) {
        targetWidth = Math.max(1, Math.round(sourceWidth * scale))
        targetHeight = Math.max(1, Math.round(sourceHeight * scale))
      }
    }

    const dimensions = calculateDimensions(
      {
        height: sourceHeight,
        width: sourceWidth,
        x: options.strategy === 'cover' ? options.x : undefined,
        y: options.strategy === 'cover' ? options.y : undefined,
      },
      { height: targetHeight, width: targetWidth },
      options.strategy,
    )

    const { canvas: canvasElement, ctx } = createCanvasContext(dimensions.canvas.width, dimensions.canvas.height)
    canvas = canvasElement

    // Fill background for JPEG to avoid transparency issues
    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = options.backgroundColor ?? '#000000'
      ctx.fillRect(0, 0, dimensions.canvas.width, dimensions.canvas.height)
    }

    // Draw the image
    ctx.drawImage(
      img,
      dimensions.source.x,
      dimensions.source.y,
      dimensions.source.width,
      dimensions.source.height,
      0,
      0,
      dimensions.canvas.width,
      dimensions.canvas.height,
    )

    const dataUrl = canvasToDataUrl(canvas, targetFormat, options.quality)

    return {
      dataUrl,
      format: targetFormat,
      height: dimensions.canvas.height,
      quality: options.quality ?? 1,
      ratio: dimensions.canvas.width / dimensions.canvas.height,
      size: Math.ceil((dataUrl.length * 3) / 4) - (dataUrl.endsWith('==') ? 2 : dataUrl.endsWith('=') ? 1 : 0),
      width: dimensions.canvas.width,
    }
  } finally {
    // Cleanup resources
    if (img) {
      cleanupImage(img)
    }
    if (canvas) {
      cleanupCanvas(canvas)
    }
  }
}

/**
 * convert a image to a given format
 * @param file - The file to convert.
 * @param targetFormat - The format to convert to.
 * @returns A promise that resolves to the converted image.
 */
export const convertImageFormat = async (
  file: File,
  targetFormat: ImageFormat,
  options?: Pick<ImageProcessingOptions, 'backgroundColor' | 'maxHeight' | 'maxWidth' | 'quality'>,
): Promise<string> => {
  // Validate input format
  if (!isValidImageFormat(targetFormat)) {
    throw new Error(`Invalid target format: ${targetFormat}`)
  }

  const result = await processImage(file, {
    backgroundColor: options?.backgroundColor,
    format: targetFormat,
    maxHeight: options?.maxHeight,
    maxWidth: options?.maxWidth,
    quality: options?.quality,
    strategy: 'stretch',
  })

  return result.dataUrl
}

/**
 * Resize image maintaining aspect ratio
 */
export const resizeImage = async (
  file: File,
  target: Required<Pick<ImageProcessingOptions, 'height' | 'width'>>,
  options?: Partial<Pick<ImageProcessingOptions, 'format' | 'maxHeight' | 'maxWidth' | 'quality'>>,
): Promise<ImageProcessingResult> => {
  // Validate target dimensions
  if (target.width <= 0 || target.height <= 0) {
    throw new Error('Invalid target dimensions: width and height must be positive numbers')
  }

  return processImage(file, {
    format: options?.format ?? 'image/jpeg',
    height: target.height,
    maxHeight: options?.maxHeight,
    maxWidth: options?.maxWidth,
    quality: options?.quality,
    strategy: 'contain',
    width: target.width,
  })
}
