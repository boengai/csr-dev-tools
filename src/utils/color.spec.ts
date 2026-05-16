import { describe, expect, it, vi } from 'vitest'

import { convertColor } from '@/wasm/color'

import { hexToHsl, normalizeHue } from './color'

vi.mock('@/wasm/color', () => ({
  convertColor: vi.fn(),
}))

const mockedConvertColor = vi.mocked(convertColor)

describe('normalizeHue', () => {
  it('returns the input unchanged when within [0, 360)', () => {
    expect(normalizeHue(0)).toBe(0)
    expect(normalizeHue(90)).toBe(90)
    expect(normalizeHue(359.9)).toBe(359.9)
  })

  it('wraps multiples of 360 down to 0', () => {
    expect(normalizeHue(360)).toBe(0)
    expect(normalizeHue(720)).toBe(0)
  })

  it('wraps values above 360 by modulo', () => {
    expect(normalizeHue(450)).toBe(90)
    expect(normalizeHue(800)).toBe(80)
  })

  it('wraps negatives into [0, 360)', () => {
    expect(normalizeHue(-30)).toBe(330)
    expect(normalizeHue(-360)).toBe(0)
    expect(normalizeHue(-450)).toBe(270)
  })

  it('preserves fractional values', () => {
    expect(normalizeHue(180.5)).toBe(180.5)
    expect(normalizeHue(-0.5)).toBeCloseTo(359.5)
  })
})

describe('hexToHsl', () => {
  it('parses the WASM HSL string into an HSLColor object', async () => {
    mockedConvertColor.mockResolvedValueOnce({
      hex: '#33cc66',
      hsl: 'hsl(140 60% 50%)',
      lab: 'lab(72 -56 39)',
      lch: 'lch(72 68 145)',
      oklch: 'oklch(0.76 0.18 145)',
      rgb: 'rgb(51 204 102)',
    })

    const result = await hexToHsl('#33cc66')
    expect(result).toEqual({ h: 140, s: 60, l: 50 })
    expect(mockedConvertColor).toHaveBeenCalledWith('#33cc66', 'hex')
  })

  it('throws when the WASM HSL string is not parseable', async () => {
    mockedConvertColor.mockResolvedValueOnce({
      hex: '#000',
      hsl: 'unparseable',
      lab: 'lab(0 0 0)',
      lch: 'lch(0 0 0)',
      oklch: 'oklch(0 0 0)',
      rgb: 'rgb(0 0 0)',
    })

    await expect(hexToHsl('#000')).rejects.toThrow('Failed to parse HSL result')
  })
})
