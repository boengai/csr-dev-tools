import type { ColorFormat, HSLColor, LABColor, LCHColor, OKLCHColor, RGBColor } from '@/types'

// Color types

// Utility functions
const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max)
export const normalizeHue = (hue: number): number => ((hue % 360) + 360) % 360
const srgbToLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
const linearToSrgb = (c: number): number => {
  const abs_c = Math.abs(c)
  if (abs_c > 0.0031308) {
    return Math.sign(c) * (1.055 * Math.pow(abs_c, 1 / 2.4) - 0.055)
  }
  return 12.92 * c
}
const fInverse = (t: number, delta: number, deltaSquared: number): number => {
  if (t > delta) {
    return t * t * t
  } else {
    return 3 * deltaSquared * (t - 4 / 29)
  }
}

const gammaCorrection = (c: number): number => {
  if (c > 0.0031308) {
    return 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  } else {
    return 12.92 * c
  }
}

// From RGB Convert functions
const rgbToHex = (source: RGBColor): string => {
  const toHex = (c: number) => {
    const hex = Math.round(clamp(c, 0, 255)).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(source.r)}${toHex(source.g)}${toHex(source.b)}`
}

const rgbToHsl = (source: RGBColor): HSLColor => {
  const r = source.r / 255
  const g = source.g / 255
  const b = source.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case b:
        h = (r - g) / d + 4
        break
      case g:
        h = (b - r) / d + 2
        break
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
    }
    h /= 6
  }

  return {
    h: normalizeHue(h * 360),
    l: clamp(l * 100, 0, 100),
    s: clamp(s * 100, 0, 100),
  }
}

const rgbToLab = (source: RGBColor): LABColor => {
  // 1. Convert sRGB to linear RGB
  const lr = srgbToLinear(source.r / 255)
  const lg = srgbToLinear(source.g / 255)
  const lb = srgbToLinear(source.b / 255)

  // 2. Linear RGB to XYZ (D65)
  const x = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175
  const z = lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041

  // Normalize for D65 white point
  const xn = x / 0.95047
  const yn = y / 1.0
  const zn = z / 1.08883

  // 3. XYZ to Lab
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : (t * 903.3 + 16) / 116)

  const fx = f(xn)
  const fy = f(yn)
  const fz = f(zn)

  const L = 116 * fy - 16
  const a = 500 * (fx - fy)
  const b = 200 * (fy - fz)

  return { a, b, l: L }
}

const rgbToLch = (source: RGBColor): LCHColor => {
  // Step 1: sRGB → Linear RGB
  const lr = srgbToLinear(source.r / 255)
  const lg = srgbToLinear(source.g / 255)
  const lb = srgbToLinear(source.b / 255)

  // Step 2: Linear RGB → XYZ (D65)
  const x = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175
  const z = lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041

  // Normalize for D65
  const xn = x / 0.95047
  const yn = y / 1.0
  const zn = z / 1.08883

  // Step 3: XYZ → Lab
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : (t * 903.3 + 16) / 116)

  const fx = f(xn)
  const fy = f(yn)
  const fz = f(zn)

  const L = 116 * fy - 16
  const a = 500 * (fx - fy)
  const bVal = 200 * (fy - fz)

  // Step 4: Lab → LCH
  const C = Math.sqrt(a * a + bVal * bVal)
  let H = Math.atan2(bVal, a) * (180 / Math.PI)
  if (H < 0) H += 360

  return { c: C, h: H, l: L }
}

const rgbToOklch = (source: RGBColor): OKLCHColor => {
  // 1. sRGB to linear
  const lr = srgbToLinear(source.r / 255)
  const lg = srgbToLinear(source.g / 255)
  const lb = srgbToLinear(source.b / 255)

  // 2. Linear RGB to LMS (OKLab)
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb

  const l = Math.cbrt(l_)
  const m = Math.cbrt(m_)
  const s = Math.cbrt(s_)

  // 3. OKLab
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const b2 = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s

  // 4. OKLab → OKLCH
  const C = Math.sqrt(a * a + b2 * b2)
  let h = Math.atan2(b2, a) * (180 / Math.PI)
  if (h < 0) h += 360

  return { c: C, h, l: L }
}

// To RGB Convert functions
const hexToRgb = (hex: string): RGBColor => {
  const cleanHex = hex.replace('#', '')

  // Handle both 3-digit and 6-digit hex
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16)
    const g = parseInt(cleanHex[1] + cleanHex[1], 16)
    const b = parseInt(cleanHex[2] + cleanHex[2], 16)
    return { b, g, r }
  }

  // Handle 6-digit hex
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16)
    const g = parseInt(cleanHex.substring(2, 4), 16)
    const b = parseInt(cleanHex.substring(4, 6), 16)
    return { b, g, r }
  }

  throw new Error('Invalid hex color format. Use #RGB or #RRGGBB')
}

const hslToRgb = (source: HSLColor): RGBColor => {
  // Normalize input values
  const h = source.h % 360 // Ensure hue is within 0-360
  const s = source.s / 100 // Convert saturation to 0-1
  const l = source.l / 100 // Convert lightness to 0-1

  // Calculate chroma
  const c = (1 - Math.abs(2 * l - 1)) * s

  // Calculate intermediate value
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))

  // Calculate lightness match value
  const m = l - c / 2

  let b: number, g: number, r: number

  // Determine RGB values based on hue sector
  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }

  // Add lightness match and convert to 0-255 scale
  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)

  return {
    b: b,
    g: g,
    r: r,
  }
}

const labToRgb = (source: LABColor): RGBColor => {
  // Convert LAB to XYZ
  let y = (source.l + 16) / 116
  let x = source.a / 500 + y
  let z = y - source.b / 200

  // Apply inverse f function
  const delta = 6 / 29
  const deltaSquared = delta * delta

  x = fInverse(x, delta, deltaSquared)
  y = fInverse(y, delta, deltaSquared)
  z = fInverse(z, delta, deltaSquared)

  // Scale by D65 illuminant reference white point
  x = x * 95.047
  y = y * 100.0
  z = z * 108.883

  // Convert XYZ to RGB using sRGB matrix
  x = x / 100
  y = y / 100
  z = z / 100

  let r = x * 3.2406 + y * -1.5372 + z * -0.4986
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415
  let b = x * 0.0557 + y * -0.204 + z * 1.057

  // Apply gamma correction (inverse companding)
  r = gammaCorrection(r)
  g = gammaCorrection(g)
  b = gammaCorrection(b)

  // Clamp to valid range and convert to 0-255
  r = Math.max(0, Math.min(1, r)) * 255
  g = Math.max(0, Math.min(1, g)) * 255
  b = Math.max(0, Math.min(1, b)) * 255

  return {
    b: Math.round(b),
    g: Math.round(g),
    r: Math.round(r),
  }
}

const lchToRgb = (source: LCHColor): RGBColor => {
  // Convert LCH to LAB
  const hRad = (source.h * Math.PI) / 180
  const a = source.c * Math.cos(hRad)
  const b_lab = source.c * Math.sin(hRad)

  // Convert LAB to XYZ
  let y = (source.l + 16) / 116
  let x = a / 500 + y
  let z = y - b_lab / 200

  // Apply inverse f function
  const delta = 6 / 29
  const deltaSquared = delta * delta

  x = fInverse(x, delta, deltaSquared)
  y = fInverse(y, delta, deltaSquared)
  z = fInverse(z, delta, deltaSquared)

  // Scale by D65 illuminant reference white point
  x = x * 95.047
  y = y * 100.0
  z = z * 108.883

  // Convert XYZ to RGB using sRGB matrix
  x = x / 100
  y = y / 100
  z = z / 100

  let r = x * 3.2406 + y * -1.5372 + z * -0.4986
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415
  let b = x * 0.0557 + y * -0.204 + z * 1.057

  // Apply gamma correction (inverse companding)
  r = gammaCorrection(r)
  g = gammaCorrection(g)
  b = gammaCorrection(b)

  // Clamp to valid range and convert to 0-255
  r = Math.max(0, Math.min(1, r)) * 255
  g = Math.max(0, Math.min(1, g)) * 255
  b = Math.max(0, Math.min(1, b)) * 255

  return {
    b: Math.round(b),
    g: Math.round(g),
    r: Math.round(r),
  }
}

const oklchToRgb = (source: OKLCHColor): RGBColor => {
  // Convert hue from degrees to radians
  const hRad = (source.h * Math.PI) / 180

  // Convert OKLCH to OKLAB
  const a = source.c * Math.cos(hRad)
  const b_oklab = source.c * Math.sin(hRad)

  // Convert OKLAB to linear RGB
  const l_ = source.l + 0.3963377774 * a + 0.2158037573 * b_oklab
  const m_ = source.l - 0.1055613458 * a - 0.0638541728 * b_oklab
  const s_ = source.l - 0.0894841775 * a - 1.291485548 * b_oklab

  const l3 = l_ * l_ * l_
  const m3 = m_ * m_ * m_
  const s3 = s_ * s_ * s_

  const r_lin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3
  const g_lin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3
  const b_lin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3

  let r = linearToSrgb(r_lin)
  let g = linearToSrgb(g_lin)
  let b = linearToSrgb(b_lin)

  // Clamp to valid range and convert to 0-255
  r = Math.max(0, Math.min(1, r)) * 255
  g = Math.max(0, Math.min(1, g)) * 255
  b = Math.max(0, Math.min(1, b)) * 255

  return {
    b: Math.round(b),
    g: Math.round(g),
    r: Math.round(r),
  }
}

// ... rest of existing code ...

// Parse functions
const parseHex = (hex: string) => {
  const cleanHex = hex.replace('#', '').toLowerCase()
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/.test(cleanHex)) {
    throw new Error('Invalid hex color format. Use #111 or #111111')
  }
  return hex
}

const parseRgb = (rgb: string): RGBColor => {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!match) {
    throw new Error('Invalid RGB color format')
  }

  const r = Number(match[1])
  const g = Number(match[2])
  const b = Number(match[3])

  // Check for invalid numbers
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error('Invalid RGB color format: contains non-numeric values')
  }

  // Validate RGB boundaries (0-255)
  if (r < 0 || r > 255) {
    throw new Error(`Invalid RGB red value: ${r}. Must be between 0 and 255`)
  }
  if (g < 0 || g > 255) {
    throw new Error(`Invalid RGB green value: ${g}. Must be between 0 and 255`)
  }
  if (b < 0 || b > 255) {
    throw new Error(`Invalid RGB blue value: ${b}. Must be between 0 and 255`)
  }

  return { b, g, r }
}

const parseHsl = (hsl: string): HSLColor => {
  const match = hsl.match(/hsl\(([0-9.]+)\s+([0-9.]+%)\s+([0-9.]+%)\)/)
  if (!match) {
    throw new Error('Invalid HSL color format')
  }

  const h = Number(match[1])
  const s = Number(match[2].replace('%', ''))
  const l = Number(match[3].replace('%', ''))

  // Check for invalid numbers
  if (isNaN(h) || isNaN(s) || isNaN(l)) {
    throw new Error('Invalid HSL color format: contains non-numeric values')
  }

  // Validate HSL boundaries
  if (h < 0 || h >= 360) {
    throw new Error(`Invalid HSL hue value: ${h}. Must be between 0 and 359`)
  }
  if (s < 0 || s > 100) {
    throw new Error(`Invalid HSL saturation value: ${s}%. Must be between 0% and 100%`)
  }
  if (l < 0 || l > 100) {
    throw new Error(`Invalid HSL lightness value: ${l}%. Must be between 0% and 100%`)
  }

  return { h, l, s }
}

const parseLab = (lab: string): LABColor => {
  const match = lab.match(/lab\(([+-]?[0-9.]+)\s+([+-]?[0-9.]+)\s+([+-]?[0-9.]+)\)/)
  if (!match) {
    throw new Error('Invalid LAB color format')
  }

  const l = Number(match[1])
  const a = Number(match[2])
  const b = Number(match[3])

  // Check for invalid numbers
  if (isNaN(l) || isNaN(a) || isNaN(b)) {
    throw new Error('Invalid LAB color format: contains non-numeric values')
  }

  // Validate LAB boundaries
  if (l < 0 || l > 100) {
    throw new Error(`Invalid LAB lightness value: ${l}. Must be between 0 and 100`)
  }
  if (a < -200 || a > 200) {
    throw new Error(`Invalid LAB a value: ${a}. Must be between -200 and 200`)
  }
  if (b < -200 || b > 200) {
    throw new Error(`Invalid LAB b value: ${b}. Must be between -200 and 200`)
  }

  return { a, b, l }
}

const parseLch = (lch: string): LCHColor => {
  const match = lch.match(/lch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/)
  if (!match) {
    throw new Error('Invalid LCH color format')
  }

  const l = Number(match[1])
  const c = Number(match[2])
  const h = Number(match[3])

  // Check for invalid numbers
  if (isNaN(l) || isNaN(c) || isNaN(h)) {
    throw new Error('Invalid LCH color format: contains non-numeric values')
  }

  // Validate LCH boundaries
  if (l < 0 || l > 100) {
    throw new Error(`Invalid LCH lightness value: ${l}. Must be between 0 and 100`)
  }
  if (c < 0) {
    throw new Error(`Invalid LCH chroma value: ${c}. Must be 0 or greater`)
  }
  if (h < 0 || h >= 360) {
    throw new Error(`Invalid LCH hue value: ${h}. Must be between 0 and 359`)
  }

  return { c, h, l }
}

const parseOklch = (oklch: string): OKLCHColor => {
  // extract the numbers from the string for example: oklch(0.3309 0.0282 281.94)
  const match = oklch.match(/oklch\(([0-9.]+)\s+([0-9.]+)(\s+[0-9.]+)\)/)
  if (!match) {
    throw new Error('Invalid OKLCH color format')
  }

  const l = Number(match[1])
  const c = Number(match[2])
  const h = Number(match[3])

  // Check for invalid numbers
  if (isNaN(l) || isNaN(c) || isNaN(h)) {
    throw new Error('Invalid OKLCH color format: contains non-numeric values')
  }

  // Validate OKLCH boundaries
  if (l < 0 || l > 1) {
    throw new Error(`Invalid OKLCH lightness value: ${l}. Must be between 0 and 1`)
  }
  if (c < 0) {
    throw new Error(`Invalid OKLCH chroma value: ${c}. Must be 0 or greater`)
  }
  if (h < 0 || h >= 360) {
    throw new Error(`Invalid OKLCH hue value: ${h}. Must be between 0 and 359`)
  }

  return { c, h, l }
}

// Format functions
const formatRgb = (source: RGBColor): string => {
  return `rgb(${Math.round(source.r)}, ${Math.round(source.g)}, ${Math.round(source.b)})`
}

const formatHsl = (source: HSLColor): string => {
  return `hsl(${source.h.toFixed(2)} ${source.s.toFixed(2)}% ${source.l.toFixed(2)}%)`
}

const formatLab = (source: LABColor): string => {
  return `lab(${source.l.toFixed(2)} ${source.a.toFixed(2)} ${source.b.toFixed(2)})`
}

const formatLch = (source: LCHColor): string => {
  return `lch(${source.l.toFixed(2)} ${source.c.toFixed(2)} ${source.h.toFixed(2)})`
}

const formatOklch = (source: OKLCHColor): string => {
  return `oklch(${source.l.toFixed(4)} ${source.c.toFixed(4)} ${source.h.toFixed(2)})`
}

export const hexToHsl = (hex: string): HSLColor => rgbToHsl(hexToRgb(parseHex(hex)))

// Main conversion function that takes any color format and converts to all others
export const convertColor = (source: string, sourceFormat: ColorFormat): Record<ColorFormat, string> => {
  try {
    let rgb: RGBColor

    // Parse input color to RGB
    switch (sourceFormat) {
      case 'hex':
        rgb = hexToRgb(parseHex(source))
        break
      case 'hsl': {
        rgb = hslToRgb(parseHsl(source))
        break
      }
      case 'lab': {
        rgb = labToRgb(parseLab(source))
        break
      }
      case 'lch': {
        rgb = lchToRgb(parseLch(source))
        break
      }
      case 'oklch': {
        rgb = oklchToRgb(parseOklch(source))
        break
      }
      case 'rgb':
        rgb = parseRgb(source)
        break
      default:
        throw new Error(`Unsupported color format: ${sourceFormat}`)
    }

    // Convert RGB to all other formats
    return {
      ...{
        hex: rgbToHex(rgb),
        hsl: formatHsl(rgbToHsl(rgb)),
        lab: formatLab(rgbToLab(rgb)),
        lch: formatLch(rgbToLch(rgb)),
        oklch: formatOklch(rgbToOklch(rgb)),
        rgb: formatRgb(rgb),
      },
      [sourceFormat]: source,
    }
  } catch (error) {
    throw new Error(`Failed to convert color: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      cause: error,
    })
  }
}
