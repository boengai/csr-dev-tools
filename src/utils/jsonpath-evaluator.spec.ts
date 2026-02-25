import { describe, expect, it } from 'vitest'

import { evaluateJsonPath, formatResultValue, parseJsonInput } from '@/utils/jsonpath-evaluator'

describe('jsonpath-evaluator', () => {
  describe('parseJsonInput', () => {
    it('parses a valid JSON object', () => {
      const result = parseJsonInput('{"name":"test","value":42}')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ name: 'test', value: 42 })
        expect(result.formatted).toBe(JSON.stringify({ name: 'test', value: 42 }, null, 2))
      }
    })

    it('parses a valid JSON array', () => {
      const result = parseJsonInput('[1, 2, 3]')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual([1, 2, 3])
      }
    })

    it('returns error for empty string', () => {
      const result = parseJsonInput('')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Empty input')
      }
    })

    it('returns error for whitespace-only string', () => {
      const result = parseJsonInput('   ')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Empty input')
      }
    })

    it('returns error for invalid JSON (missing quotes)', () => {
      const result = parseJsonInput('{name: "test"}')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
    })

    it('returns error for invalid JSON (trailing comma)', () => {
      const result = parseJsonInput('{"name": "test",}')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
    })

    it('parses deeply nested JSON', () => {
      const deepJson = JSON.stringify({ a: { b: { c: { d: { e: 'deep' } } } } })
      const result = parseJsonInput(deepJson)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ a: { b: { c: { d: { e: 'deep' } } } } })
      }
    })

    it('trims whitespace before parsing', () => {
      const result = parseJsonInput('  {"key": "value"}  ')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ key: 'value' })
      }
    })
  })

  describe('evaluateJsonPath', () => {
    const sampleData = {
      store: {
        bicycle: { color: 'red', price: 19.95 },
        book: [
          { author: 'Nigel Rees', category: 'reference', price: 8.95, title: 'Sayings of the Century' },
          { author: 'Evelyn Waugh', category: 'fiction', price: 12.99, title: 'Sword of Honour' },
          {
            author: 'Herman Melville',
            category: 'fiction',
            isbn: '0-553-21311-3',
            price: 8.99,
            title: 'Moby Dick',
          },
          {
            author: 'J. R. R. Tolkien',
            category: 'fiction',
            isbn: '0-395-19395-8',
            price: 22.99,
            title: 'The Lord of the Rings',
          },
        ],
      },
    }

    it('evaluates simple path `$.store.bicycle.color`', () => {
      const result = evaluateJsonPath(sampleData, '$.store.bicycle.color')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.results).toHaveLength(1)
        expect(result.results[0].value).toBe('red')
      }
    })

    it('evaluates wildcard `$.store.book[*].author`', () => {
      const result = evaluateJsonPath(sampleData, '$.store.book[*].author')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.results).toHaveLength(4)
        expect(result.results.map((r) => r.value)).toEqual([
          'Nigel Rees',
          'Evelyn Waugh',
          'Herman Melville',
          'J. R. R. Tolkien',
        ])
      }
    })

    it('evaluates recursive descent `$..price`', () => {
      const result = evaluateJsonPath(sampleData, '$..price')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.results.length).toBeGreaterThan(1)
        const prices = result.results.map((r) => r.value)
        expect(prices).toContain(8.95)
        expect(prices).toContain(19.95)
      }
    })

    it('evaluates array index `$.store.book[0]`', () => {
      const result = evaluateJsonPath(sampleData, '$.store.book[0]')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.results).toHaveLength(1)
        expect((result.results[0].value as Record<string, unknown>).author).toBe('Nigel Rees')
      }
    })

    it('evaluates filter expression `$..book[?(@.price<10)]`', () => {
      const result = evaluateJsonPath(sampleData, '$..book[?(@.price<10)]')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.results).toHaveLength(2)
        const titles = result.results.map((r) => (r.value as Record<string, unknown>).title)
        expect(titles).toContain('Sayings of the Century')
        expect(titles).toContain('Moby Dick')
      }
    })

    it('evaluates root `$`', () => {
      const result = evaluateJsonPath(sampleData, '$')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.results).toHaveLength(1)
        expect(result.results[0].value).toEqual(sampleData)
      }
    })

    it('returns empty results for non-matching path', () => {
      const result = evaluateJsonPath(sampleData, '$.nonExistent')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.results).toHaveLength(0)
      }
    })

    it('returns error for invalid expression', () => {
      const result = evaluateJsonPath(sampleData, '$[?(@.price<)]')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
    })

    it('returns error for empty expression', () => {
      const result = evaluateJsonPath(sampleData, '')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Empty expression')
      }
    })

    it('returns results with path strings', () => {
      const result = evaluateJsonPath(sampleData, '$.store.book[0].author')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.results[0].path).toBeTruthy()
        expect(typeof result.results[0].path).toBe('string')
      }
    })

    it('handles numeric primitive root (0) gracefully', () => {
      const result = evaluateJsonPath(0, '$')
      expect(typeof result.success).toBe('boolean')
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
    })

    it('handles boolean primitive root (false) gracefully', () => {
      const result = evaluateJsonPath(false, '$')
      expect(typeof result.success).toBe('boolean')
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
    })

    it('handles empty string primitive root gracefully', () => {
      const result = evaluateJsonPath('', '$')
      expect(typeof result.success).toBe('boolean')
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
    })
  })

  describe('formatResultValue', () => {
    it('formats an object as indented JSON', () => {
      const result = formatResultValue({ key: 'value' })
      expect(result).toBe(JSON.stringify({ key: 'value' }, null, 2))
    })

    it('formats an array as indented JSON', () => {
      const result = formatResultValue([1, 2, 3])
      expect(result).toBe(JSON.stringify([1, 2, 3], null, 2))
    })

    it('formats a string with quotes', () => {
      expect(formatResultValue('hello')).toBe('"hello"')
    })

    it('formats a number as string', () => {
      expect(formatResultValue(42)).toBe('42')
    })

    it('formats boolean true', () => {
      expect(formatResultValue(true)).toBe('true')
    })

    it('formats boolean false', () => {
      expect(formatResultValue(false)).toBe('false')
    })

    it('formats null', () => {
      expect(formatResultValue(null)).toBe('null')
    })
  })
})
