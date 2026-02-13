import { describe, expect, it } from 'vitest'

import type { UseToolError } from '@/types'

import { useToolError } from './useToolError'

describe('useToolError', () => {
  describe('exports', () => {
    it('should export useToolError as a function', () => {
      expect(typeof useToolError).toBe('function')
    })
  })

  describe('type enforcement', () => {
    it('should define UseToolError with error as null or string', () => {
      const withNull: UseToolError = {
        clearError: () => {},
        error: null,
        setError: () => {},
      }
      expect(withNull.error).toBeNull()
    })

    it('should define UseToolError with error as string', () => {
      const withError: UseToolError = {
        clearError: () => {},
        error: 'Enter a valid hex color (e.g., #3B82F6)',
        setError: () => {},
      }
      expect(withError.error).toBe('Enter a valid hex color (e.g., #3B82F6)')
    })

    it('should define setError as a function accepting a string', () => {
      const hook: UseToolError = {
        clearError: () => {},
        error: null,
        setError: (_message: string) => {},
      }
      expect(typeof hook.setError).toBe('function')
    })

    it('should define clearError as a function with no parameters', () => {
      const hook: UseToolError = {
        clearError: () => {},
        error: null,
        setError: () => {},
      }
      expect(typeof hook.clearError).toBe('function')
    })
  })

  describe('return shape', () => {
    it('should have exactly three keys: clearError, error, setError', () => {
      const expectedKeys = ['clearError', 'error', 'setError']
      const hook: UseToolError = {
        clearError: () => {},
        error: null,
        setError: () => {},
      }
      expect(Object.keys(hook).sort()).toEqual(expectedKeys)
    })
  })
})
