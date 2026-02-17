import { describe, expect, it } from 'vitest'

import { pixelToColor, rgbToHex, rgbToHsl } from './color-picker'

describe('color-picker utils', () => {
  it('converts RGB to hex', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000')
    expect(rgbToHex(0, 128, 255)).toBe('#0080ff')
    expect(rgbToHex(0, 0, 0)).toBe('#000000')
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff')
  })

  it('converts RGB to HSL', () => {
    expect(rgbToHsl(255, 0, 0)).toBe('hsl(0 100% 50%)')
    expect(rgbToHsl(0, 0, 0)).toBe('hsl(0 0% 0%)')
    expect(rgbToHsl(255, 255, 255)).toBe('hsl(0 0% 100%)')
  })

  it('pixelToColor returns all formats', () => {
    const color = pixelToColor(59, 130, 246)
    expect(color.hex).toBe('#3b82f6')
    expect(color.rgb).toBe('rgb(59, 130, 246)')
    expect(color.hsl).toMatch(/^hsl\(\d+ \d+% \d+%\)$/)
  })
})
