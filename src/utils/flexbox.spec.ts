import { describe, expect, it } from 'vitest'

import { DEFAULT_CONTAINER, DEFAULT_ITEM, generateFlexboxCss } from '@/utils/flexbox'

describe('flexbox utilities', () => {
  describe('generateFlexboxCss', () => {
    it('should generate default container CSS', () => {
      const { containerCss } = generateFlexboxCss(DEFAULT_CONTAINER, [DEFAULT_ITEM])
      expect(containerCss).toContain('  display: flex;')
      expect(containerCss).toContain('  flex-direction: row;')
      expect(containerCss).toContain('  justify-content: flex-start;')
      expect(containerCss).toContain('  align-items: stretch;')
      expect(containerCss).toContain('  flex-wrap: nowrap;')
      expect(containerCss).toContain('  gap: 8px;')
    })

    it('should generate item CSS', () => {
      const { itemsCss } = generateFlexboxCss(DEFAULT_CONTAINER, [{ flexGrow: 1, flexShrink: 0, order: 2 }])
      expect(itemsCss).toHaveLength(1)
      expect(itemsCss[0]).toContain('  flex-grow: 1;')
      expect(itemsCss[0]).toContain('  flex-shrink: 0;')
      expect(itemsCss[0]).toContain('  order: 2;')
    })

    it('should generate CSS for multiple items', () => {
      const { itemsCss } = generateFlexboxCss(DEFAULT_CONTAINER, [DEFAULT_ITEM, DEFAULT_ITEM, DEFAULT_ITEM])
      expect(itemsCss).toHaveLength(3)
    })

    it('should handle column direction', () => {
      const { containerCss } = generateFlexboxCss({ ...DEFAULT_CONTAINER, direction: 'column' }, [])
      expect(containerCss).toContain('  flex-direction: column;')
    })

    it('should handle space-between justify', () => {
      const { containerCss } = generateFlexboxCss({ ...DEFAULT_CONTAINER, justifyContent: 'space-between' }, [])
      expect(containerCss).toContain('  justify-content: space-between;')
    })

    it('should handle zero gap', () => {
      const { containerCss } = generateFlexboxCss({ ...DEFAULT_CONTAINER, gap: 0 }, [])
      expect(containerCss).toContain('  gap: 0px;')
    })

    it('should clamp negative gap to zero', () => {
      const { containerCss } = generateFlexboxCss({ ...DEFAULT_CONTAINER, gap: -5 }, [])
      expect(containerCss).toContain('  gap: 0px;')
    })
  })

  describe('DEFAULT_CONTAINER', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_CONTAINER).toEqual({
        alignItems: 'stretch',
        direction: 'row',
        gap: 8,
        justifyContent: 'flex-start',
        wrap: 'nowrap',
      })
    })
  })

  describe('DEFAULT_ITEM', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_ITEM).toEqual({
        flexGrow: 0,
        flexShrink: 1,
        order: 0,
      })
    })
  })
})
