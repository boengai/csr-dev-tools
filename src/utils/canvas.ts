import type {
  CachedResample,
  ClippedDraw,
  PixelRect,
  PixelSize,
  PreparedRgbaPixels,
  ResampleOptions,
  RgbaPixels,
  ScaledDrawPlan,
  ScaledDrawer,
} from '@/types'

import { prepareRgba, resamplePrepared } from './resample'

// Sources are read 1:1 in tiles of at most 4096x4096 = 2^24 px: iOS Safari
// refuses larger canvases (desktop browsers: 2^28 px, 65535 px per side) and
// then silently draws nothing.
const TILE_SIDE = 4096
// Above this (~67 MP, a ~270 MB pixel buffer) reductions fall back to `drawImage`.
const MAX_SOURCE_PIXELS = 2 ** 26
// Pillow documents a reducing gap of 3 as indistinguishable from a full Lanczos pass.
const REDUCING_GAP = 3

export const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string = 'image/png'): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to convert canvas to blob'))
    }, mimeType)
  })

/**
 * Create a canvas of the given size and its 2D context, throwing if the
 * context can't be acquired.
 */
export const createCanvasContext = (
  width: number,
  height: number,
  settings?: CanvasRenderingContext2DSettings,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d', settings)
  if (!ctx) {
    throw new Error('Failed to acquire 2D canvas context')
  }

  return { canvas, ctx }
}

const isUsableRect = ({ height, width, x, y }: PixelRect): boolean =>
  [height, width, x, y].every(Number.isFinite) && width > 0 && height > 0

/**
 * Decide how to render `source` → `target` from an image of size `natural`.
 * Any reduction (on either axis) is resampled; enlargements, 1:1 copies,
 * degenerate rects and sources too big to buffer stay with `drawImage`.
 */
export const planScaledDraw = (source: PixelRect, target: PixelRect, natural: PixelSize): ScaledDrawPlan => {
  if (!isUsableRect(source) || !isUsableRect(target)) return { kind: 'drawImage' }
  if (natural.width * natural.height > MAX_SOURCE_PIXELS) return { kind: 'drawImage' }

  // Round the edges rather than the origin and the size, so centred content stays centred.
  const left = Math.round(target.x)
  const top = Math.round(target.y)
  const size = {
    height: Math.max(1, Math.round(target.y + target.height) - top),
    width: Math.max(1, Math.round(target.x + target.width) - left),
  }
  if (size.width >= source.width && size.height >= source.height) return { kind: 'drawImage' }

  return { kind: 'resample', position: { x: left, y: top }, size }
}

/** Tiles (row-major, at most `TILE_SIDE` square) that cover an image of size `natural` exactly once. */
export const planReadTiles = ({ height, width }: PixelSize): Array<PixelRect> => {
  const tiles: Array<PixelRect> = []
  for (let y = 0; y < height; y += TILE_SIDE) {
    for (let x = 0; x < width; x += TILE_SIDE) {
      tiles.push({ height: Math.min(TILE_SIDE, height - y), width: Math.min(TILE_SIDE, width - x), x, y })
    }
  }
  return tiles
}

/**
 * Clip `source` to the image and `target` in the same proportion — what
 * `drawImage` does with an overhanging source rect. `null` if nothing is left.
 */
export const clipToImage = (source: PixelRect, target: PixelRect, natural: PixelSize): ClippedDraw | null => {
  const x0 = Math.max(0, source.x)
  const y0 = Math.max(0, source.y)
  const x1 = Math.min(natural.width, source.x + source.width)
  const y1 = Math.min(natural.height, source.y + source.height)
  if (x1 <= x0 || y1 <= y0) return null
  if (x0 === source.x && y0 === source.y && x1 === source.x + source.width && y1 === source.y + source.height) {
    return { source, target }
  }

  const scaleX = target.width / source.width
  const scaleY = target.height / source.height
  return {
    source: { height: y1 - y0, width: x1 - x0, x: x0, y: y0 },
    target: {
      height: (y1 - y0) * scaleY,
      width: (x1 - x0) * scaleX,
      x: target.x + (x0 - source.x) * scaleX,
      y: target.y + (y0 - source.y) * scaleY,
    },
  }
}

const naturalSizeOf = (image: HTMLImageElement): PixelSize => ({
  height: image.naturalHeight || image.height,
  width: image.naturalWidth || image.width,
})

/**
 * Read the whole image at full resolution, tile by tile, prepared for
 * resampling. Each tile draws the whole image 1:1, offset so the tile's region
 * lands on the scratch canvas — always the 5-argument `drawImage`, because the
 * 9-argument form mis-maps SVGs that only have a viewBox (Firefox even draws
 * such tiles blank).
 */
export const readImagePixels = (image: HTMLImageElement, natural: PixelSize): PreparedRgbaPixels => {
  const tiles = planReadTiles(natural)
  const [first] = tiles
  if (!first) throw new Error('Cannot read an empty image')

  const { canvas, ctx } = createCanvasContext(first.width, first.height, { willReadFrequently: true })
  try {
    if (tiles.length === 1) {
      ctx.drawImage(image, 0, 0, natural.width, natural.height)
      const { data } = ctx.getImageData(0, 0, natural.width, natural.height)
      return prepareRgba({ data, height: natural.height, width: natural.width }, { inPlace: true })
    }

    const data = new Uint8ClampedArray(natural.width * natural.height * 4)
    for (const tile of tiles) {
      ctx.clearRect(0, 0, tile.width, tile.height)
      ctx.drawImage(image, -tile.x, -tile.y, natural.width, natural.height)
      const pixels = ctx.getImageData(0, 0, tile.width, tile.height).data
      const rowBytes = tile.width * 4
      for (let row = 0; row < tile.height; row++) {
        data.set(pixels.subarray(row * rowBytes, (row + 1) * rowBytes), ((tile.y + row) * natural.width + tile.x) * 4)
      }
    }
    // The buffers are ours, so premultiply in place rather than hold a second full-size copy.
    return prepareRgba({ data, height: natural.height, width: natural.width }, { inPlace: true })
  } finally {
    canvas.width = 0
  }
}

/**
 * A `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)` with Pillow-quality
 * reductions. Browsers' `drawImage` samples too few source pixels when
 * shrinking a lot (moiré, broken strokes), so reductions are resampled with
 * Lanczos-3 on the CPU and painted 1:1 — which keeps normal compositing over
 * whatever `ctx` already holds (e.g. a JPEG / splash background fill).
 *
 * The image is read on the first reduction and kept, with its `reduce()`
 * results and the last resample, so make one drawer per image when rendering
 * several sizes of it — and drop it afterwards. Don't change the image's `src`
 * while a drawer for it is alive.
 *
 * Output matches Pillow's `resize(size, LANCZOS, reducing_gap=reducingGap)`.
 * The default gap of 3 is, per Pillow, indistinguishable from a full Lanczos
 * pass in most cases; a smaller gap trades a little fidelity for speed.
 */
export const createScaledDrawer = (
  image: HTMLImageElement,
  { reducingGap = REDUCING_GAP }: Pick<ResampleOptions, 'reducingGap'> = {},
): ScaledDrawer => {
  let pixels: PreparedRgbaPixels | undefined
  const reduceCache = new Map<string, RgbaPixels>()
  let last: CachedResample | undefined

  return (ctx, sourceRect, targetRect) => {
    const natural = naturalSizeOf(image)
    const clipped = clipToImage(sourceRect, targetRect, natural)
    if (!clipped) return
    const { source, target } = clipped

    const plan = planScaledDraw(source, target, natural)
    if (plan.kind === 'drawImage') {
      const isWholeImage =
        source.x === 0 && source.y === 0 && source.width === natural.width && source.height === natural.height
      if (isWholeImage) {
        // See `readImagePixels` for why whole-image draws use the 5-argument form.
        ctx.drawImage(image, target.x, target.y, target.width, target.height)
      } else {
        // Crops of SVGs that only have a viewBox can mis-map here (pre-existing; no UI
        // path draws an enlarging crop) — see `readImagePixels`.
        ctx.drawImage(
          image,
          source.x,
          source.y,
          source.width,
          source.height,
          target.x,
          target.y,
          target.width,
          target.height,
        )
      }
      return
    }

    pixels ??= readImagePixels(image, natural)
    // Splash screens of a square-ish image draw the same size twice in a row
    // (portrait, then landscape).
    const key = `${source.x},${source.y},${source.width},${source.height}→${plan.size.width}x${plan.size.height}`
    if (last?.key !== key) {
      const resampled = resamplePrepared(pixels, source, plan.size.width, plan.size.height, {
        reduceCache,
        reducingGap,
      })
      last = { key, resampled }
    }

    const writer = createCanvasContext(plan.size.width, plan.size.height)
    try {
      const output = writer.ctx.createImageData(plan.size.width, plan.size.height)
      output.data.set(last.resampled.data)
      writer.ctx.putImageData(output, 0, 0)
      ctx.drawImage(writer.canvas, plan.position.x, plan.position.y)
    } finally {
      writer.canvas.width = 0
    }
  }
}

/** One-off `createScaledDrawer(image)(ctx, source, target)`. */
export const drawImageScaled = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  source: PixelRect,
  target: PixelRect,
): void => createScaledDrawer(image)(ctx, source, target)
