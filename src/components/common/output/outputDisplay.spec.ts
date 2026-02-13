import { describe, expect, it } from 'vitest'

import type { OutputDisplayEntry, OutputDisplayProps, OutputDisplayVariant } from '@/types'

import { OutputDisplay, outputDisplayVariants } from './OutputDisplay'

describe('OutputDisplay', () => {
  describe('exports', () => {
    it('should export OutputDisplay as a function', () => {
      expect(typeof OutputDisplay).toBe('function')
    })
  })

  describe('type enforcement', () => {
    it('should accept single variant props', () => {
      const singleProps: OutputDisplayProps = {
        label: 'Result',
        value: 'rgb(59, 130, 246)',
        variant: 'single',
      }
      expect(singleProps.value).toBe('rgb(59, 130, 246)')
      expect(singleProps.variant).toBe('single')
    })

    it('should accept table variant with entries', () => {
      const entries: Array<OutputDisplayEntry> = [
        { key: 'HEX', value: '#3B82F6' },
        { key: 'RGB', value: 'rgb(59, 130, 246)' },
        { key: 'HSL', value: 'hsl(217, 91%, 60%)' },
      ]
      const tableProps: OutputDisplayProps = {
        entries,
        label: 'Color values',
        variant: 'table',
      }
      expect(tableProps.entries).toHaveLength(3)
      expect(tableProps.variant).toBe('table')
    })

    it('should accept code variant props', () => {
      const codeProps: OutputDisplayProps = {
        label: 'JSON',
        value: '{"key": "value"}',
        variant: 'code',
      }
      expect(codeProps.value).toBe('{"key": "value"}')
      expect(codeProps.variant).toBe('code')
    })

    it('should accept optional emptyText prop', () => {
      const propsWithEmpty: OutputDisplayProps = {
        emptyText: 'No output',
        variant: 'single',
      }
      expect(propsWithEmpty.emptyText).toBe('No output')
    })
  })

  describe('variant types', () => {
    it('should support single, table, and code variants', () => {
      const variants: Array<OutputDisplayVariant> = ['code', 'single', 'table']
      expect(variants).toHaveLength(3)
      expect(variants).toContain('single')
      expect(variants).toContain('table')
      expect(variants).toContain('code')
    })
  })

  describe('tv() variants', () => {
    it('should produce class string for single variant', () => {
      const classes = outputDisplayVariants({ variant: 'single' })
      expect(typeof classes).toBe('string')
      expect(classes.length).toBeGreaterThan(0)
    })

    it('should produce class string for table variant', () => {
      const classes = outputDisplayVariants({ variant: 'table' })
      expect(typeof classes).toBe('string')
      expect(classes.length).toBeGreaterThan(0)
    })

    it('should produce class string for code variant', () => {
      const classes = outputDisplayVariants({ variant: 'code' })
      expect(typeof classes).toBe('string')
      expect(classes.length).toBeGreaterThan(0)
    })

    it('should produce different classes for each variant', () => {
      const single = outputDisplayVariants({ variant: 'single' })
      const table = outputDisplayVariants({ variant: 'table' })
      const code = outputDisplayVariants({ variant: 'code' })
      expect(single).not.toBe(table)
      expect(table).not.toBe(code)
      expect(single).not.toBe(code)
    })
  })
})
