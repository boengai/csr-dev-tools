import type { ConvertImageOptions, ImageFormat } from '@/types'

/**
 * convert a image to a given format
 * @param file - The file to convert.
 * @param targetFormat - The format to convert to.
 * @returns A promise that resolves to the converted image.
 */
export const convertImageFormat = (
  file: File,
  targetFormat: ImageFormat,
  options?: ConvertImageOptions,
): Promise<string> => {
  return new Promise((resolve: (result: string) => void, reject: (error: Error) => void) => {
    const img: HTMLImageElement = new Image()
    // Local files are same-origin; this is defensive for potential blobs
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const sourceWidth: number = img.naturalWidth || img.width
        const sourceHeight: number = img.naturalHeight || img.height

        // Compute target dimensions with optional downscale preserving aspect ratio
        let targetWidth: number = sourceWidth
        let targetHeight: number = sourceHeight
        if (options?.maxWidth != null || options?.maxHeight != null) {
          const maxW: number = options.maxWidth ?? Number.POSITIVE_INFINITY
          const maxH: number = options.maxHeight ?? Number.POSITIVE_INFINITY
          const widthScale: number = maxW / sourceWidth
          const heightScale: number = maxH / sourceHeight
          const scale: number = Math.min(widthScale, heightScale)
          if (Number.isFinite(scale) && scale < 1) {
            targetWidth = Math.max(1, Math.floor(sourceWidth * scale))
            targetHeight = Math.max(1, Math.floor(sourceHeight * scale))
          }
        }

        const canvas: HTMLCanvasElement = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight

        const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d')
        if (ctx == null) {
          reject(new Error('Failed to acquire 2D canvas context'))
          return
        }

        // For JPEG, fill background to avoid black for transparent areas
        if (targetFormat === 'image/jpeg') {
          ctx.fillStyle = options?.backgroundColor ?? '#ffffff'
          ctx.fillRect(0, 0, targetWidth, targetHeight)
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

        let dataUrl: string
        const normalizedQuality: number | undefined =
          typeof options?.quality === 'number' ? Math.min(1, Math.max(0, options.quality)) : undefined
        const defaultQuality: number = 0.8
        if (targetFormat === 'image/png') {
          dataUrl = canvas.toDataURL('image/png')
        } else if (targetFormat === 'image/webp') {
          dataUrl = canvas.toDataURL('image/webp', normalizedQuality ?? defaultQuality)
        } else {
          dataUrl = canvas.toDataURL('image/jpeg', normalizedQuality ?? defaultQuality)
        }

        resolve(dataUrl)
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to convert image'))
      }
    }

    img.onerror = () => reject(new Error('Failed to load image for conversion'))

    // Load from the given File
    const reader: FileReader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      // If no transform requested and formats match, return original
      const isSameFormat: boolean = file.type === targetFormat
      const requestedResize: boolean = Boolean(options?.maxWidth || options?.maxHeight)
      const providedLossyQuality: boolean =
        (targetFormat === 'image/webp' || targetFormat === 'image/jpeg') && typeof options?.quality === 'number'
      if (isSameFormat && !requestedResize && !providedLossyQuality) {
        resolve(reader.result as string)
        return
      }

      img.src = reader.result as string
    }
    reader.onerror = (e: ProgressEvent<FileReader>) => reject(new Error(e.target?.error?.message ?? 'Unknown error'))
  })
}
