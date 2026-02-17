let cachedPipeline: Promise<ReturnType<Awaited<typeof import('@huggingface/transformers')>['pipeline']>> | null =
  null

export async function removeBackground(
  image: Blob,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  if (!image.type.startsWith('image/')) {
    throw new Error('Please select an image file (PNG, JPG, or WEBP)')
  }

  const { RawImage, pipeline } = await import('@huggingface/transformers')

  if (!cachedPipeline) {
    cachedPipeline = pipeline('background-removal', 'Xenova/modnet', {
      dtype: 'fp32' as const,
      progress_callback: onProgress
        ? (info: { progress?: number }) => {
            if (info.progress != null) onProgress(info.progress)
          }
        : undefined,
    }) as Promise<ReturnType<typeof pipeline>>
  }

  const segmenter = await cachedPipeline
  const rawImage = await RawImage.fromBlob(image)
  const result = (await (segmenter as (input: unknown) => Promise<{ data: ArrayLike<number>; height: number; width: number }>)(rawImage)) as {
    data: ArrayLike<number>
    height: number
    width: number
  }

  const canvas = document.createElement('canvas')
  canvas.width = result.width
  canvas.height = result.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to create canvas context')

  const clampedData =
    result.data instanceof Uint8ClampedArray ? result.data : new Uint8ClampedArray(result.data as ArrayBufferLike)
  const imageData = new ImageData(clampedData, result.width, result.height)
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
