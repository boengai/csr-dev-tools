import { describe, expect, it } from 'vitest'

import { DEFAULT_BORDER_RADIUS, generateBorderRadiusCss } from './border-radius'

describe('generateBorderRadiusCss', () => {
  it('produces default value', () => {
    expect(generateBorderRadiusCss(DEFAULT_BORDER_RADIUS)).toBe('border-radius: 8px;')
  })

  it('collapses all same to single value', () => {
    const config = { ...DEFAULT_BORDER_RADIUS, bottomLeft: 10, bottomRight: 10, topLeft: 10, topRight: 10 }
    expect(generateBorderRadiusCss(config)).toBe('border-radius: 10px;')
  })

  it('handles all different corners', () => {
    const config = { ...DEFAULT_BORDER_RADIUS, bottomLeft: 40, bottomRight: 30, topLeft: 10, topRight: 20 }
    expect(generateBorderRadiusCss(config)).toBe('border-radius: 10px 20px 30px 40px;')
  })

  it('collapses two-value shorthand when TL=BR and TR=BL', () => {
    const config = { ...DEFAULT_BORDER_RADIUS, bottomLeft: 20, bottomRight: 10, topLeft: 10, topRight: 20 }
    expect(generateBorderRadiusCss(config)).toBe('border-radius: 10px 20px;')
  })

  it('handles asymmetric mode with slash syntax', () => {
    const config = {
      ...DEFAULT_BORDER_RADIUS,
      asymmetric: true,
      bottomLeft: 40,
      bottomLeftV: 35,
      bottomRight: 30,
      bottomRightV: 25,
      topLeft: 10,
      topLeftV: 5,
      topRight: 20,
      topRightV: 15,
    }
    expect(generateBorderRadiusCss(config)).toBe('border-radius: 10px 20px 30px 40px / 5px 15px 25px 35px;')
  })

  it('collapses asymmetric when h equals v', () => {
    const config = { ...DEFAULT_BORDER_RADIUS, asymmetric: true }
    expect(generateBorderRadiusCss(config)).toBe('border-radius: 8px;')
  })

  it('handles zero values', () => {
    const config = { ...DEFAULT_BORDER_RADIUS, bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 }
    expect(generateBorderRadiusCss(config)).toBe('border-radius: 0px;')
  })

  it('handles max values', () => {
    const config = { ...DEFAULT_BORDER_RADIUS, bottomLeft: 100, bottomRight: 100, topLeft: 100, topRight: 100 }
    expect(generateBorderRadiusCss(config)).toBe('border-radius: 100px;')
  })

  it('collapses asymmetric all same h and v', () => {
    const config = {
      ...DEFAULT_BORDER_RADIUS,
      asymmetric: true,
      bottomLeft: 10,
      bottomLeftV: 5,
      bottomRight: 10,
      bottomRightV: 5,
      topLeft: 10,
      topLeftV: 5,
      topRight: 10,
      topRightV: 5,
    }
    expect(generateBorderRadiusCss(config)).toBe('border-radius: 10px / 5px;')
  })

  it('handles three-value shorthand', () => {
    const config = { ...DEFAULT_BORDER_RADIUS, bottomLeft: 20, bottomRight: 30, topLeft: 10, topRight: 20 }
    expect(generateBorderRadiusCss(config)).toBe('border-radius: 10px 20px 30px;')
  })
})
