/**
 * Axis-aligned rectangle in pixel units. `x` / `y` / `width` / `height` may be
 * fractional (e.g. a centred `cover` crop).
 */
export type PixelRect = {
  height: number
  width: number
  x: number
  y: number
}

/** Half-open pixel bounds `[x0, x1) × [y0, y1)`; may be fractional. */
export type PixelBounds = {
  x0: number
  x1: number
  y0: number
  y1: number
}

export type PixelSize = {
  height: number
  width: number
}

/**
 * How a scaled draw renders: hand it to the browser's `drawImage`, or resample
 * on the CPU to `size` and paint the result unscaled at `position`.
 */
export type ScaledDrawPlan =
  | { kind: 'drawImage' }
  | {
      kind: 'resample'
      position: { x: number; y: number }
      size: PixelSize
    }

/** A source rect and its target after clipping the source to the image. */
export type ClippedDraw = { source: PixelRect; target: PixelRect }

/** A scaled drawer's memo of its latest resample, keyed by source rect and size. */
export type CachedResample = { key: string; resampled: RgbaPixels }

/**
 * `RgbaPixels` read once and prepared for any number of resamples: alpha is
 * premultiplied (Pillow's `RGBa`) unless every pixel is opaque.
 */
export type PreparedRgbaPixels = RgbaPixels & { opaque: boolean }

export type PrepareRgbaOptions = {
  /** Premultiply into `source.data` itself — only when the caller owns that buffer. */
  inPlace?: boolean
}

export type ResampleOptions = {
  /**
   * Caller-owned memo of `reduce()` results, keyed by factor and box. Share one
   * across resamples of the same prepared source (e.g. many icon sizes).
   */
  reduceCache?: Map<string, RgbaPixels>
  /**
   * Pillow's `reducing_gap`: first shrink by an integer factor with a box
   * average, leaving at least this ratio for the Lanczos pass. Pillow
   * documents ≥ 3 as indistinguishable from a full Lanczos pass in most cases.
   */
  reducingGap?: number
}

/** Draws `image` (the drawer's) from `source` into `target` on `ctx`, like a 9-argument `drawImage`. */
export type ScaledDrawer = (ctx: CanvasRenderingContext2D, source: PixelRect, target: PixelRect) => void

/**
 * Row-major RGBA buffer, 4 bytes per pixel, straight (non-premultiplied) alpha.
 * Structurally an `ImageData`, so `getImageData()` results pass straight in.
 */
export type RgbaPixels = {
  data: Uint8ClampedArray
  height: number
  width: number
}
