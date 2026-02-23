import type { HSLColor } from '@/types'

import { convertColor, hexToHsl, normalizeHue } from '@/utils/color'

export type HarmonyType = 'analogous' | 'complementary' | 'monochromatic' | 'split-complementary' | 'triadic'

export type PaletteColor = {
  hex: string
  hsl: HSLColor
  rgb: string
}

const createPaletteColor = (hsl: HSLColor): PaletteColor => {
  const hslString = `hsl(${hsl.h.toFixed(2)} ${hsl.s.toFixed(2)}% ${hsl.l.toFixed(2)}%)`
  const converted = convertColor(hslString, 'hsl')
  return {
    hex: converted.hex,
    hsl,
    rgb: converted.rgb,
  }
}

const clampLightness = (l: number): number => Math.min(Math.max(l, 0), 100)

const createLightnessVariant = (hsl: HSLColor, lightness: number): HSLColor => ({
  h: hsl.h,
  l: clampLightness(lightness),
  s: hsl.s,
})

export const generateComplementaryPalette = (baseHsl: HSLColor): Array<PaletteColor> => {
  const complement: HSLColor = { h: normalizeHue(baseHsl.h + 180), l: baseHsl.l, s: baseHsl.s }
  return [
    createPaletteColor(baseHsl),
    createPaletteColor(createLightnessVariant(baseHsl, baseHsl.l - 15)),
    createPaletteColor(complement),
    createPaletteColor(createLightnessVariant(complement, complement.l - 15)),
    createPaletteColor(createLightnessVariant(complement, complement.l + 15)),
  ]
}

export const generateAnalogousPalette = (baseHsl: HSLColor): Array<PaletteColor> => {
  return [
    createPaletteColor({ h: normalizeHue(baseHsl.h - 60), l: baseHsl.l, s: baseHsl.s }),
    createPaletteColor({ h: normalizeHue(baseHsl.h - 30), l: baseHsl.l, s: baseHsl.s }),
    createPaletteColor(baseHsl),
    createPaletteColor({ h: normalizeHue(baseHsl.h + 30), l: baseHsl.l, s: baseHsl.s }),
    createPaletteColor({ h: normalizeHue(baseHsl.h + 60), l: baseHsl.l, s: baseHsl.s }),
  ]
}

export const generateTriadicPalette = (baseHsl: HSLColor): Array<PaletteColor> => {
  const second: HSLColor = { h: normalizeHue(baseHsl.h + 120), l: baseHsl.l, s: baseHsl.s }
  const third: HSLColor = { h: normalizeHue(baseHsl.h + 240), l: baseHsl.l, s: baseHsl.s }
  return [
    createPaletteColor(baseHsl),
    createPaletteColor(second),
    createPaletteColor(createLightnessVariant(second, second.l + 15)),
    createPaletteColor(third),
    createPaletteColor(createLightnessVariant(third, third.l + 15)),
  ]
}

export const generateSplitComplementaryPalette = (baseHsl: HSLColor): Array<PaletteColor> => {
  const split1: HSLColor = { h: normalizeHue(baseHsl.h + 150), l: baseHsl.l, s: baseHsl.s }
  const split2: HSLColor = { h: normalizeHue(baseHsl.h + 210), l: baseHsl.l, s: baseHsl.s }
  return [
    createPaletteColor(baseHsl),
    createPaletteColor(split1),
    createPaletteColor(createLightnessVariant(split1, split1.l + 15)),
    createPaletteColor(split2),
    createPaletteColor(createLightnessVariant(split2, split2.l + 15)),
  ]
}

export const generateMonochromaticPalette = (baseHsl: HSLColor): Array<PaletteColor> => {
  return [
    createPaletteColor({ h: baseHsl.h, l: 15, s: baseHsl.s }),
    createPaletteColor({ h: baseHsl.h, l: 30, s: baseHsl.s }),
    createPaletteColor({ h: baseHsl.h, l: 50, s: baseHsl.s }),
    createPaletteColor({ h: baseHsl.h, l: 70, s: baseHsl.s }),
    createPaletteColor({ h: baseHsl.h, l: 85, s: baseHsl.s }),
  ]
}

export const generatePalette = (baseColor: string, harmonyType: HarmonyType): Array<PaletteColor> => {
  const baseHsl = hexToHsl(baseColor)

  switch (harmonyType) {
    case 'analogous':
      return generateAnalogousPalette(baseHsl)
    case 'complementary':
      return generateComplementaryPalette(baseHsl)
    case 'monochromatic':
      return generateMonochromaticPalette(baseHsl)
    case 'split-complementary':
      return generateSplitComplementaryPalette(baseHsl)
    case 'triadic':
      return generateTriadicPalette(baseHsl)
  }
}

export const formatPaletteAsCss = (palette: Array<PaletteColor>): string => {
  return palette.map((color, i) => `--palette-${i + 1}: ${color.hex};`).join('\n')
}
