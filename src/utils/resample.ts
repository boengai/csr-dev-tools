import type {
  PixelBounds,
  PixelRect,
  PrepareRgbaOptions,
  PreparedRgbaPixels,
  ResampleOptions,
  RgbaPixels,
} from '@/types'

/**
 * Lanczos-3 resampling that mirrors Pillow's
 * `Image.resize(size, LANCZOS, box, reducing_gap)` (libImaging/Resample.c and
 * Reduce.c): an optional integer box-average pre-reduction, then separable
 * passes with a kernel whose support widens with the reduction ratio so every
 * source pixel contributes, 22-bit fixed-point weights, an 8-bit intermediate,
 * premultiplied alpha, and float32 box edges.
 *
 * Canvas `drawImage` can't be used for large reductions: browsers sample a
 * small fixed neighbourhood (Firefox always; Chrome / Safari at the default
 * `imageSmoothingQuality`), which aliases into moiré and broken strokes.
 *
 * Typed-array reads below are in bounds by construction, hence the `!`s.
 */

const LANCZOS_SUPPORT = 3
const PRECISION_BITS = 22
const ONE = 1 << PRECISION_BITS
const HALF = 1 << (PRECISION_BITS - 1)
const OVERFLOW = 256 * ONE
const REDUCE_SHIFT = 2 ** 24
// Absorbs float error in caller-computed boxes (e.g. `x + width` of a centred crop).
const BOX_EPSILON = 1e-6

const sinc = (x: number): number => {
  if (x === 0) return 1
  const px = x * Math.PI
  return Math.sin(px) / px
}

const lanczosKernel = (x: number): number =>
  x >= -LANCZOS_SUPPORT && x < LANCZOS_SUPPORT ? sinc(x) * sinc(x / LANCZOS_SUPPORT) : 0

/** Fixed-point accumulator (seeded with HALF) → rounded, clamped byte. */
const clip8 = (sum: number): number => (sum <= 0 ? 0 : sum >= OVERFLOW ? 255 : sum >> PRECISION_BITS)

/**
 * For each output index along one axis: the first contributing source index,
 * the tap count, and up to `kSize` fixed-point weights. Spans source `[in0, in1)`,
 * which Pillow holds as C floats.
 */
const computeCoefficients = (inSize: number, in0: number, in1: number, outSize: number) => {
  // Float32 subtraction, double division — exactly Pillow's `(double)(in1 - in0) / outSize`.
  const scale = Math.fround(in1 - in0) / outSize
  const filterScale = Math.max(1, scale)
  const support = LANCZOS_SUPPORT * filterScale
  const kSize = Math.ceil(support) * 2 + 1
  const inverseFilterScale = 1 / filterScale
  const bounds = new Int32Array(outSize * 2)
  const weights = new Int32Array(outSize * kSize)
  const raw = new Float64Array(kSize)

  for (let xx = 0; xx < outSize; xx++) {
    const center = in0 + (xx + 0.5) * scale
    const first = Math.max(0, Math.trunc(center - support + 0.5))
    const count = Math.min(inSize, Math.trunc(center + support + 0.5)) - first

    let total = 0
    for (let x = 0; x < count; x++) {
      const w = lanczosKernel((x + first - center + 0.5) * inverseFilterScale)
      raw[x] = w
      total += w
    }
    for (let x = 0; x < count; x++) {
      const w = total === 0 ? raw[x]! : raw[x]! / total
      weights[xx * kSize + x] = w < 0 ? Math.trunc(w * ONE - 0.5) : Math.trunc(w * ONE + 0.5)
    }

    bounds[xx * 2] = first
    bounds[xx * 2 + 1] = count
  }

  return { bounds, kSize, weights }
}

/** Resample source rows `[firstRow, firstRow + rowCount)` to `outWidth` columns. */
const resampleHorizontal = (
  pixels: Uint8ClampedArray,
  pixelsWidth: number,
  firstRow: number,
  rowCount: number,
  outWidth: number,
  { bounds, kSize, weights }: ReturnType<typeof computeCoefficients>,
): Uint8ClampedArray => {
  const out = new Uint8ClampedArray(outWidth * rowCount * 4)

  for (let y = 0; y < rowCount; y++) {
    const row = (firstRow + y) * pixelsWidth * 4
    for (let xx = 0; xx < outWidth; xx++) {
      const first = bounds[xx * 2]!
      const count = bounds[xx * 2 + 1]!
      const k = xx * kSize
      let r = HALF
      let g = HALF
      let b = HALF
      let a = HALF
      for (let x = 0; x < count; x++) {
        const w = weights[k + x]!
        const i = row + (first + x) * 4
        r += pixels[i]! * w
        g += pixels[i + 1]! * w
        b += pixels[i + 2]! * w
        a += pixels[i + 3]! * w
      }
      const o = (y * outWidth + xx) * 4
      out[o] = clip8(r)
      out[o + 1] = clip8(g)
      out[o + 2] = clip8(b)
      out[o + 3] = clip8(a)
    }
  }

  return out
}

/** Resample to `outHeight` rows; `rowOffset` is the source row `pixels` starts at. */
const resampleVertical = (
  pixels: Uint8ClampedArray,
  pixelsWidth: number,
  rowOffset: number,
  outHeight: number,
  { bounds, kSize, weights }: ReturnType<typeof computeCoefficients>,
): Uint8ClampedArray => {
  const stride = pixelsWidth * 4
  const out = new Uint8ClampedArray(stride * outHeight)
  const sums = new Float64Array(stride)

  for (let yy = 0; yy < outHeight; yy++) {
    const first = bounds[yy * 2]! - rowOffset
    const count = bounds[yy * 2 + 1]!
    const k = yy * kSize
    sums.fill(HALF)
    // Row-at-a-time accumulation keeps the reads sequential.
    for (let y = 0; y < count; y++) {
      const w = weights[k + y]!
      const row = (first + y) * stride
      for (let i = 0; i < stride; i++) {
        sums[i] = sums[i]! + pixels[row + i]! * w
      }
    }
    const o = yy * stride
    for (let i = 0; i < stride; i++) {
      out[o + i] = clip8(sums[i]!)
    }
  }

  return out
}

/**
 * Pillow's two-pass LANCZOS (`ImagingResampleInner`) of the `[x0, x1) × [y0, y1)`
 * region of `pixels` to `width` × `height`. Always returns a new buffer.
 */
const lanczos = (
  pixels: Uint8ClampedArray,
  pixelsWidth: number,
  pixelsHeight: number,
  region: PixelBounds,
  width: number,
  height: number,
): Uint8ClampedArray => {
  const x0 = Math.fround(region.x0)
  const y0 = Math.fround(region.y0)
  const x1 = Math.fround(region.x1)
  const y1 = Math.fround(region.y1)
  const needHorizontal = width !== pixelsWidth || x0 !== 0 || x1 !== width
  const needVertical = height !== pixelsHeight || y0 !== 0 || y1 !== height
  if (!needHorizontal && !needVertical) return pixels.slice()

  const horizontal = computeCoefficients(pixelsWidth, x0, x1, width)
  const vertical = computeCoefficients(pixelsHeight, y0, y1, height)

  // Pillow's pass order (it changes the bytes, via the 8-bit intermediate): the
  // vertical pass goes first only when it removes over twice as many rows as
  // the horizontal pass removes columns.
  if (pixelsHeight - height > 0 && pixelsHeight - height > (pixelsWidth - width) * 2) {
    const columns = resampleVertical(pixels, pixelsWidth, 0, height, vertical)
    return needHorizontal ? resampleHorizontal(columns, pixelsWidth, 0, height, width, horizontal) : columns
  }
  if (!needHorizontal) return resampleVertical(pixels, pixelsWidth, 0, height, vertical)
  // Only the rows the vertical pass will read.
  const firstRow = vertical.bounds[0]!
  const lastRow = vertical.bounds[height * 2 - 2]! + vertical.bounds[height * 2 - 1]!
  const rows = resampleHorizontal(pixels, pixelsWidth, firstRow, lastRow - firstRow, width, horizontal)
  return needVertical ? resampleVertical(rows, width, firstRow, height, vertical) : rows
}

/** Pillow's `division_UINT32(count, 8)`: 2^32 / (256 · count) in float32, truncated. */
const reduceMultiplier = (count: number): number => Math.trunc(Math.fround(2 ** 32 / (256 * count)))

/**
 * Pillow's `reduce((xScale, yScale), box)` (libImaging/Reduce.c): the rounded
 * average of each `xScale` × `yScale` block of the integer box; blocks cut off
 * by the right / bottom edge average only the pixels they hold.
 */
const reduceBlocks = (
  pixels: Uint8ClampedArray,
  pixelsWidth: number,
  box: PixelBounds,
  xScale: number,
  yScale: number,
): RgbaPixels => {
  const width = Math.floor((box.x1 - box.x0 - 1) / xScale) + 1
  const height = Math.floor((box.y1 - box.y0 - 1) / yScale) + 1
  const out = new Uint8ClampedArray(width * height * 4)
  const fullMultiplier = reduceMultiplier(xScale * yScale)

  for (let y = 0; y < height; y++) {
    const top = box.y0 + y * yScale
    const rows = Math.min(yScale, box.y1 - top)
    for (let x = 0; x < width; x++) {
      const left = box.x0 + x * xScale
      const columns = Math.min(xScale, box.x1 - left)
      const count = rows * columns
      const amend = count >> 1
      let r = amend
      let g = amend
      let b = amend
      let a = amend
      for (let yy = top; yy < top + rows; yy++) {
        const end = (yy * pixelsWidth + left + columns) * 4
        for (let i = (yy * pixelsWidth + left) * 4; i < end; i += 4) {
          r += pixels[i]!
          g += pixels[i + 1]!
          b += pixels[i + 2]!
          a += pixels[i + 3]!
        }
      }
      const multiplier = count === xScale * yScale ? fullMultiplier : reduceMultiplier(count)
      const o = (y * width + x) * 4
      out[o] = Math.floor((r * multiplier) / REDUCE_SHIFT)
      out[o + 1] = Math.floor((g * multiplier) / REDUCE_SHIFT)
      out[o + 2] = Math.floor((b * multiplier) / REDUCE_SHIFT)
      out[o + 3] = Math.floor((a * multiplier) / REDUCE_SHIFT)
    }
  }

  return { data: out, height, width }
}

const isOpaque = (data: Uint8ClampedArray): boolean => {
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 255) return false
  }
  return true
}

/** Pillow's RGBA → RGBa: `c * a / 255`, rounded, written into `out`. */
const premultiply = (data: Uint8ClampedArray, out: Uint8ClampedArray): Uint8ClampedArray => {
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]!
    for (let c = 0; c < 3; c++) {
      const t = data[i + c]! * a + 128
      out[i + c] = ((t >> 8) + t) >> 8
    }
    out[i + 3] = a
  }
  return out
}

/** Pillow's RGBa → RGBA, in place: `c * 255 / a`, truncated and clamped. */
const unpremultiply = (data: Uint8ClampedArray): void => {
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]!
    if (a === 0 || a === 255) continue
    for (let c = 0; c < 3; c++) {
      data[i + c] = Math.trunc((255 * data[i + c]!) / a)
    }
  }
}

/**
 * Prepare pixels once for any number of `resamplePrepared` calls (e.g. one
 * source, many icon sizes): premultiplies alpha unless the image is opaque —
 * into `source.data` itself with `inPlace`, when the caller owns the buffer.
 */
export const prepareRgba = (source: RgbaPixels, { inPlace = false }: PrepareRgbaOptions = {}): PreparedRgbaPixels => {
  const opaque = isOpaque(source.data)
  const data = opaque
    ? source.data
    : premultiply(source.data, inPlace ? source.data : new Uint8ClampedArray(source.data.length))
  return { data, height: source.height, opaque, width: source.width }
}

/**
 * Resample the `box` region of a prepared source (fractional edges allowed) to
 * `width` × `height`, returning straight-alpha pixels. Pixels just outside the
 * box but inside the source feed the filter at the box edges, as in Pillow.
 * `source` is not modified.
 */
export const resamplePrepared = (
  source: PreparedRgbaPixels,
  box: PixelRect,
  width: number,
  height: number,
  { reduceCache, reducingGap }: ResampleOptions = {},
): RgbaPixels => {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new Error('Invalid resample size: width and height must be positive integers')
  }
  if (reducingGap !== undefined && !(reducingGap >= 1)) {
    throw new Error('Invalid reducing gap: it must be 1 or greater')
  }
  let x0 = box.x
  let y0 = box.y
  let x1 = Math.min(box.x + box.width, source.width)
  let y1 = Math.min(box.y + box.height, source.height)
  if (
    !(box.width > 0 && box.height > 0 && box.x >= 0 && box.y >= 0) ||
    box.x + box.width > source.width + BOX_EPSILON ||
    box.y + box.height > source.height + BOX_EPSILON
  ) {
    throw new Error('Invalid resample box: it must have a positive size and lie within the source')
  }

  let pixels = source.data
  let pixelsWidth = source.width
  let pixelsHeight = source.height

  if (reducingGap !== undefined) {
    const xScale = Math.trunc((x1 - x0) / width / reducingGap) || 1
    const yScale = Math.trunc((y1 - y0) / height / reducingGap) || 1
    if (xScale > 1 || yScale > 1) {
      // Pillow's `_get_safe_box`: the box plus the pixels Lanczos may read around it.
      const supportX = (LANCZOS_SUPPORT - 0.5) * ((x1 - x0) / width)
      const supportY = (LANCZOS_SUPPORT - 0.5) * ((y1 - y0) / height)
      const safe = {
        x0: Math.max(0, Math.trunc(x0 - supportX)),
        x1: Math.min(source.width, Math.ceil(x1 + supportX)),
        y0: Math.max(0, Math.trunc(y0 - supportY)),
        y1: Math.min(source.height, Math.ceil(y1 + supportY)),
      }
      const key = `${xScale},${yScale},${safe.x0},${safe.y0},${safe.x1},${safe.y1}`
      const reduced = reduceCache?.get(key) ?? reduceBlocks(pixels, pixelsWidth, safe, xScale, yScale)
      reduceCache?.set(key, reduced)
      pixels = reduced.data
      pixelsWidth = reduced.width
      pixelsHeight = reduced.height
      x0 = (x0 - safe.x0) / xScale
      x1 = (x1 - safe.x0) / xScale
      y0 = (y0 - safe.y0) / yScale
      y1 = (y1 - safe.y0) / yScale
    }
  }

  const out = lanczos(pixels, pixelsWidth, pixelsHeight, { x0, x1, y0, y1 }, width, height)
  // Even for opaque sources: Pillow's reduce() can lower alpha to 254 (and then un-premultiplies).
  unpremultiply(out)
  return { data: out, height, width }
}

/**
 * Resample the `box` region of `source` to `width` × `height` (see
 * `resamplePrepared`). Returns a new buffer; `source` is not modified.
 */
export const resampleRgba = (
  source: RgbaPixels,
  box: PixelRect,
  width: number,
  height: number,
  options?: ResampleOptions,
): RgbaPixels => {
  const isIdentity =
    width === source.width &&
    height === source.height &&
    box.x === 0 &&
    box.y === 0 &&
    box.width === width &&
    box.height === height
  // Pillow returns a plain copy here, skipping the lossy premultiply round trip.
  if (isIdentity) return { data: source.data.slice(), height, width }
  return resamplePrepared(prepareRgba(source), box, width, height, options)
}
