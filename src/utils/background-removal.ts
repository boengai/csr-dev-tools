// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedPipeline: Promise<any> | null = null

export async function removeBackground(
  image: Blob,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  if (!image.type.startsWith('image/')) {
    throw new Error('Please select an image file (PNG, JPG, or WEBP)')
  }

  const { RawImage, pipeline } = await import('@huggingface/transformers')

  if (!cachedPipeline) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cachedPipeline = (pipeline as any)('background-removal', 'Xenova/modnet', {
      dtype: 'fp32',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      progress_callback: onProgress
        ? (info: any) => {
            if (info?.progress != null) onProgress(info.progress)
          }
        : undefined,
    })
  }

  const segmenter = await cachedPipeline
  const rawImage = await RawImage.fromBlob(image)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await segmenter(rawImage) as any

  const width: number = result.width ?? result[0]?.width
  const height: number = result.height ?? result[0]?.height
  const data = result.data ?? result[0]?.data

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to create canvas context')

  const pixelArray = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < pixelArray.length; i++) {
    pixelArray[i] = Number(data[i]) || 0
  }
  const imageData = new ImageData(pixelArray, width, height)
  ctx.putImageData(imageData, 0, 0)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create PNG blob'))
    }, 'image/png')
  })
}

export async function applyBackground(foreground: Blob, color: string): Promise<Blob> {
  if (!foreground.type.startsWith('image/')) {
    throw new Error('Invalid foreground image')
  }

  const img = new Image()
  const url = URL.createObjectURL(foreground)

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load foreground image'))
      img.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to create canvas context')

    ctx.fillStyle = color
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create PNG blob'))
      }, 'image/png')
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Reset the cached pipeline (useful for testing) */
export function resetPipelineCache(): void {
  cachedPipeline = null
}
