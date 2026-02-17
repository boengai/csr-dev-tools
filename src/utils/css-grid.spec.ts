import { describe, expect, it } from 'vitest'

import { DEFAULT_GRID_CONTAINER, generateGridCss } from './css-grid'

describe('generateGridCss', () => {
  it('generates default grid CSS', () => {
    const css = generateGridCss(DEFAULT_GRID_CONTAINER)
    expect(css).toContain('display: grid;')
    expect(css).toContain('grid-template-columns: 1fr 1fr 1fr;')
    expect(css).toContain('grid-template-rows: auto auto;')
    expect(css).toContain('gap: 8px;')
    expect(css).toContain('justify-items: stretch;')
    expect(css).toContain('align-items: stretch;')
  })

  it('uses custom columns and rows', () => {
    const css = generateGridCss({ ...DEFAULT_GRID_CONTAINER, columns: '200px 1fr', rows: '100px auto' })
    expect(css).toContain('grid-template-columns: 200px 1fr;')
    expect(css).toContain('grid-template-rows: 100px auto;')
  })

  it('applies gap value', () => {
    const css = generateGridCss({ ...DEFAULT_GRID_CONTAINER, gap: 16 })
    expect(css).toContain('gap: 16px;')
  })

  it('applies alignment options', () => {
    const css = generateGridCss({ ...DEFAULT_GRID_CONTAINER, alignItems: 'center', justifyItems: 'end' })
    expect(css).toContain('justify-items: end;')
    expect(css).toContain('align-items: center;')
  })
})
