export type PlaceholderOptions = {
  bgColor: string
  height: number
  text: string
  textColor: string
  width: number
}

export type PlaceholderPreset = {
  height: number
  label: string
  width: number
}

export const PLACEHOLDER_PRESETS: Array<PlaceholderPreset> = [
  { height: 150, label: 'Thumbnail', width: 150 },
  { height: 200, label: 'Avatar', width: 200 },
  { height: 200, label: 'Card', width: 300 },
  { height: 630, label: 'Banner', width: 1200 },
  { height: 1080, label: 'Hero', width: 1920 },
]

const escapeXml = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

const estimateSvgFontSize = (text: string, maxWidth: number, maxHeight: number): number => {
  let fontSize = Math.min(maxWidth, maxHeight) / 8
  const avgCharWidthRatio = 0.6

  while (fontSize * avgCharWidthRatio * text.length > maxWidth * 0.8 && fontSize > 10) {
    fontSize -= 1
  }

  return Math.max(10, fontSize)
}

export const generatePlaceholderSvg = (options: PlaceholderOptions): string => {
  const displayText = options.text || `${options.width}x${options.height}`
  const fontSize = estimateSvgFontSize(displayText, options.width, options.height)

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${options.width}" height="${options.height}" viewBox="0 0 ${options.width} ${options.height}">`,
    `  <rect width="100%" height="100%" fill="${escapeXml(options.bgColor)}" />`,
    `  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-weight="bold" font-size="${fontSize}" fill="${escapeXml(options.textColor)}">${escapeXml(displayText)}</text>`,
    '</svg>',
  ].join('\n')
}

export const autoSizeFont = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
): number => {
  let fontSize = Math.min(maxWidth, maxHeight) / 8
  ctx.font = `bold ${fontSize}px sans-serif`
  let measured = ctx.measureText(text)

  while (measured.width > maxWidth * 0.8 && fontSize > 10) {
    fontSize -= 1
    ctx.font = `bold ${fontSize}px sans-serif`
    measured = ctx.measureText(text)
  }

  return Math.max(10, fontSize)
}

export const generatePlaceholderCanvas = (options: PlaceholderOptions): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = options.width
  canvas.height = options.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  ctx.fillStyle = options.bgColor
  ctx.fillRect(0, 0, options.width, options.height)

  const displayText = options.text || `${options.width}x${options.height}`
  const fontSize = autoSizeFont(ctx, displayText, options.width, options.height)

  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.fillStyle = options.textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(displayText, options.width / 2, options.height / 2)

  return canvas
}

export const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to convert canvas to blob'))
      }
    }, 'image/png')
  })

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const downloadSvg = (svgString: string, filename: string) => {
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  downloadBlob(blob, filename)
}
