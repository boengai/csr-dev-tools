import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { dedupeFileName, formatFileSize, matchesAccept, parseFileName } from './file'

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

describe('dedupeFileName', () => {
  it('returns the name unchanged when free', () => {
    expect(dedupeFileName('a.webp', () => false)).toBe('a.webp')
  })

  it('suffixes the stem with the first free counter', () => {
    const taken = new Set(['a.webp', 'a-1.webp'])
    expect(dedupeFileName('a.webp', (n) => taken.has(n))).toBe('a-2.webp')
  })

  it('handles names without an extension and dotfiles', () => {
    expect(dedupeFileName('README', (n) => n === 'README')).toBe('README-1')
    expect(dedupeFileName('.env', (n) => n === '.env')).toBe('.env-1')
  })
})

describe('matchesAccept', () => {
  const file = (name: string, type: string) => new File(['x'], name, { type })

  it('matches exact MIME types, case-insensitively', () => {
    expect(matchesAccept(file('a.png', 'image/png'), 'image/png, image/jpeg')).toBe(true)
    expect(matchesAccept(file('a.png', 'IMAGE/PNG'), 'image/png')).toBe(true)
    expect(matchesAccept(file('a.gif', 'image/gif'), 'image/png,image/jpeg')).toBe(false)
  })

  it('matches type/* wildcards', () => {
    expect(matchesAccept(file('a.gif', 'image/gif'), 'image/*')).toBe(true)
    expect(matchesAccept(file('a.txt', 'text/plain'), 'image/*')).toBe(false)
  })

  it('matches .ext suffixes against the file name', () => {
    expect(matchesAccept(file('icon.SVG', ''), '.svg')).toBe(true)
    expect(matchesAccept(file('icon.png', ''), '.svg')).toBe(false)
  })

  it('takes anything when accept is empty', () => {
    expect(matchesAccept(file('a.bin', ''), '')).toBe(true)
  })
})
