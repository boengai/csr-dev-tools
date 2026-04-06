import { describe, expect, it } from 'vitest'

import { formatSql } from '@/utils'

describe('sql formatting utilities', () => {
  describe('formatSql', () => {
    it('should format a simple SELECT', async () => {
      const result = await formatSql('select id, name from users where id = 1')
      expect(result).toContain('SELECT')
      expect(result).toContain('FROM')
      expect(result).toContain('WHERE')
    })

    it('should support different dialects', async () => {
      const result = await formatSql('select * from users limit 10', 'mysql')
      expect(result).toContain('SELECT')
    })

    it('should return empty string for empty input', async () => {
      expect(await formatSql('')).toBe('')
    })
  })
})
