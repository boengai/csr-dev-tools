import { describe, expect, it } from 'vitest'

import type { CopyButtonProps, CopyButtonVariant } from '@/types'

import { CopyButton, copyButtonVariants } from './CopyButton'

describe('CopyButton', () => {
  describe('exports', () => {
    it('should export CopyButton as a function', () => {
      expect(typeof CopyButton).toBe('function')
    })
  })

  describe('type enforcement', () => {
    it('should require value prop', () => {
      const validProps: CopyButtonProps = {
        value: 'test-value',
      }
      expect(validProps.value).toBe('test-value')
    })

    it('should accept optional label prop', () => {
      const propsWithLabel: CopyButtonProps = {
        label: 'HEX',
        value: '#3B82F6',
      }
      expect(propsWithLabel.label).toBe('HEX')
    })

    it('should accept optional variant prop', () => {
      const propsWithVariant: CopyButtonProps = {
        value: 'test',
        variant: 'labeled',
      }
      expect(propsWithVariant.variant).toBe('labeled')
    })
  })

  describe('variant types', () => {
    it('should support icon-only and labeled variants', () => {
      const variants: Array<CopyButtonVariant> = ['icon-only', 'labeled']
      expect(variants).toHaveLength(2)
      expect(variants).toContain('icon-only')
      expect(variants).toContain('labeled')
    })
  })

  describe('tv() variants', () => {
    it('should produce class string for icon-only variant', () => {
      const classes = copyButtonVariants({ variant: 'icon-only' })
      expect(typeof classes).toBe('string')
      expect(classes.length).toBeGreaterThan(0)
    })

    it('should produce class string for labeled variant', () => {
      const classes = copyButtonVariants({ variant: 'labeled' })
      expect(typeof classes).toBe('string')
      expect(classes.length).toBeGreaterThan(0)
    })

    it('should produce different classes for each variant', () => {
      const iconOnly = copyButtonVariants({ variant: 'icon-only' })
      const labeled = copyButtonVariants({ variant: 'labeled' })
      expect(iconOnly).not.toBe(labeled)
    })
  })
})
