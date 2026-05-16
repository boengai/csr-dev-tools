import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { formatFileSize, parseFileName } from './file'

describe('parseFileName', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-16T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('prefixes with `csr-dev-tools_` and appends the Date.now() timestamp', () => {
    const result = parseFileName('photo.jpg')
    expect(result).toBe(`csr-dev-tools_photo_${Date.now()}.jpg`)
  })

  it('replaces non-alphanumeric characters in the base name with underscores', () => {
    const result = parseFileName('my photo!@#.png')
    expect(result).toBe(`csr-dev-tools_my_photo____${Date.now()}.png`)
  })

  it('joins multi-dot base names with underscores', () => {
    const result = parseFileName('archive.tar.gz')
    expect(result).toBe(`csr-dev-tools_archive_tar_${Date.now()}.gz`)
  })

  it('overrides the extension when an ImageFormat is supplied', () => {
    const result = parseFileName('photo.png', 'image/webp')
    expect(result).toBe(`csr-dev-tools_photo_${Date.now()}.webp`)
  })

  it('maps image/jpeg to .jpg (not .jpeg)', () => {
    const result = parseFileName('photo.png', 'image/jpeg')
    expect(result.endsWith('.jpg')).toBe(true)
  })
})

describe('formatFileSize', () => {
  it('renders bytes under 1KB without unit conversion', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(1023)).toBe('1023 B')
  })

  it('renders 1KB and above with one decimal of KB', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1024 * 1.5)).toBe('1.5 KB')
    expect(formatFileSize(1024 * 1024 - 1)).toBe('1024.0 KB')
  })

  it('renders 1MB and above with one decimal of MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB')
  })
})
