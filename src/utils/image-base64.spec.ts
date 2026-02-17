import { describe, expect, it } from 'vitest'

import { formatBase64Size } from './image-base64'

describe('image-base64', () => {
  describe('formatBase64Size', () => {
    it('formats small sizes in chars', () => {
      expect(formatBase64Size(500)).toBe('500 chars')
    })

    it('formats kilobyte sizes', () => {
      expect(formatBase64Size(2048)).toBe('2.0 KB')
    })

    it('formats megabyte sizes', () => {
      expect(formatBase64Size(1024 * 1024 * 2)).toBe('2.0 MB')
    })
  })
})
