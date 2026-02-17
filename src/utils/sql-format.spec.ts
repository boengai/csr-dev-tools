import { describe, expect, it } from 'vitest'

import { formatSql } from '@/utils/sql-format'

describe('sql formatting utilities', () => {
  describe('formatSql', () => {
    it('should format a simple SELECT', () => {
      const result = formatSql('select id, name from users where id = 1')
      expect(result).toContain('SELECT')
      expect(result).toContain('FROM')
      expect(result).toContain('WHERE')
    })

    it('should support different dialects', () => {
      const result = formatSql('select * from users limit 10', 'mysql')
      expect(result).toContain('SELECT')
    })

    it('should return empty string for empty input', () => {
      expect(formatSql('')).toBe('')
    })
  })
})
