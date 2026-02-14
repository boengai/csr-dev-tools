import { describe, expect, it } from 'vitest'

import { buildHighlightSegments, executeRegex, formatMatchesForCopy } from '@/utils/regex'

describe('regex utilities', () => {
  describe('executeRegex', () => {
    it('should find all matches with global flag', () => {
      const result = executeRegex('\\d+', 'g', 'abc 123 def 456')
      expect(result.error).toBeNull()
      expect(result.matches).toHaveLength(2)
      expect(result.matches[0].fullMatch).toBe('123')
      expect(result.matches[1].fullMatch).toBe('456')
    })

    it('should find only first match without global flag', () => {
      const result = executeRegex('\\d+', '', 'abc 123 def 456')
      expect(result.error).toBeNull()
      expect(result.matches).toHaveLength(1)
      expect(result.matches[0].fullMatch).toBe('123')
    })

    it('should extract numbered capture groups', () => {
      const result = executeRegex('(\\w+)@(\\w+)', 'g', 'user@host')
      expect(result.matches[0].groups).toEqual(['user', 'host'])
    })

    it('should extract named capture groups', () => {
      const result = executeRegex('(?<user>\\w+)@(?<domain>\\w+)', 'g', 'user@host')
      expect(result.matches[0].namedGroups).toEqual({ domain: 'host', user: 'user' })
    })

    it('should support case-insensitive flag', () => {
      const result = executeRegex('hello', 'gi', 'Hello HELLO hello')
      expect(result.matches).toHaveLength(3)
    })

    it('should support multiline flag', () => {
      const result = executeRegex('^\\w+', 'gm', 'hello\nworld')
      expect(result.matches).toHaveLength(2)
      expect(result.matches[0].fullMatch).toBe('hello')
      expect(result.matches[1].fullMatch).toBe('world')
    })

    it('should return error for invalid pattern', () => {
      const result = executeRegex('[', 'g', 'test')
      expect(result.error).not.toBeNull()
      expect(result.matches).toHaveLength(0)
    })

    it('should return empty matches when no match found', () => {
      const result = executeRegex('xyz', 'g', 'abc def')
      expect(result.error).toBeNull()
      expect(result.matches).toHaveLength(0)
    })

    it('should handle empty text', () => {
      const result = executeRegex('\\d+', 'g', '')
      expect(result.error).toBeNull()
      expect(result.matches).toHaveLength(0)
    })

    it('should handle empty pattern with global flag', () => {
      const result = executeRegex('', 'g', 'abc')
      expect(result.error).toBeNull()
      // Empty pattern matches at every position — capped behavior
      expect(result.matches.length).toBeGreaterThan(0)
    })

    it('should handle Unicode patterns and text', () => {
      const result = executeRegex('[\\u{1F600}-\\u{1F64F}]', 'gu', 'Hello 😀 World 😃!')
      expect(result.error).toBeNull()
      expect(result.matches).toHaveLength(2)
    })

    it('should cap matches at MAX_MATCHES', () => {
      // Pattern that matches every character position
      const text = 'a'.repeat(10000)
      const result = executeRegex('a', 'g', text)
      expect(result.matches.length).toBeLessThanOrEqual(5000)
      expect(result.capped).toBe(true)
    })
  })

  describe('buildHighlightSegments', () => {
    it('should split text into match and non-match segments', () => {
      const matches = [
        { fullMatch: '123', groups: [], index: 4, namedGroups: undefined },
        { fullMatch: '456', groups: [], index: 12, namedGroups: undefined },
      ]
      const segments = buildHighlightSegments('abc 123 def 456 ghi', matches)
      expect(segments).toHaveLength(5)
      expect(segments[0]).toEqual({ isMatch: false, text: 'abc ' })
      expect(segments[1]).toEqual({ isMatch: true, matchIndex: 0, text: '123' })
      expect(segments[2]).toEqual({ isMatch: false, text: ' def ' })
      expect(segments[3]).toEqual({ isMatch: true, matchIndex: 1, text: '456' })
      expect(segments[4]).toEqual({ isMatch: false, text: ' ghi' })
    })

    it('should return single non-match segment when no matches', () => {
      const segments = buildHighlightSegments('hello world', [])
      expect(segments).toHaveLength(1)
      expect(segments[0]).toEqual({ isMatch: false, text: 'hello world' })
    })

    it('should handle match at start of text', () => {
      const matches = [{ fullMatch: 'abc', groups: [], index: 0, namedGroups: undefined }]
      const segments = buildHighlightSegments('abc def', matches)
      expect(segments[0]).toEqual({ isMatch: true, matchIndex: 0, text: 'abc' })
      expect(segments[1]).toEqual({ isMatch: false, text: ' def' })
    })

    it('should handle match at end of text', () => {
      const matches = [{ fullMatch: 'def', groups: [], index: 4, namedGroups: undefined }]
      const segments = buildHighlightSegments('abc def', matches)
      expect(segments[0]).toEqual({ isMatch: false, text: 'abc ' })
      expect(segments[1]).toEqual({ isMatch: true, matchIndex: 0, text: 'def' })
    })

    it('should handle adjacent matches', () => {
      const matches = [
        { fullMatch: 'ab', groups: [], index: 0, namedGroups: undefined },
        { fullMatch: 'cd', groups: [], index: 2, namedGroups: undefined },
      ]
      const segments = buildHighlightSegments('abcd', matches)
      expect(segments).toHaveLength(2)
      expect(segments[0]).toEqual({ isMatch: true, matchIndex: 0, text: 'ab' })
      expect(segments[1]).toEqual({ isMatch: true, matchIndex: 1, text: 'cd' })
    })
  })

  describe('formatMatchesForCopy', () => {
    it('should format matches with groups for clipboard', () => {
      const matches = [{ fullMatch: 'hello@world', groups: ['hello', 'world'], index: 0, namedGroups: undefined }]
      const output = formatMatchesForCopy(matches)
      expect(output).toContain('Match 1')
      expect(output).toContain('hello@world')
      expect(output).toContain('Group 1: hello')
      expect(output).toContain('Group 2: world')
    })

    it('should return empty string for no matches', () => {
      expect(formatMatchesForCopy([])).toBe('')
    })
  })
})
