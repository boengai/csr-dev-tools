import { describe, expect, it, vi } from 'vitest'

vi.mock('@/wasm/csv', () => ({ getCsvParseError: vi.fn() }))
vi.mock('@/wasm/json-tools', () => ({ getJsonParseError: vi.fn() }))
vi.mock('@/wasm/parsers', () => ({
  getTomlParseError: vi.fn(),
  getXmlParseError: vi.fn(),
  getYamlParseError: vi.fn(),
}))

import { getCsvParseError } from '@/wasm/csv'
import { getJsonParseError } from '@/wasm/json-tools'
import { getTomlParseError, getXmlParseError, getYamlParseError } from '@/wasm/parsers'

import { narrateParseError } from './parse-error-narrators'

describe('narrateParseError', () => {
  it('returns a narrated message when the source has a parse error', async () => {
    vi.mocked(getJsonParseError).mockResolvedValueOnce('unexpected token at line 1')
    const result = await narrateParseError('json', '{bad')
    expect(result).toBe('Invalid JSON: unexpected token at line 1')
  })

  it('returns null when the source has no parse error', async () => {
    vi.mocked(getYamlParseError).mockResolvedValueOnce(null)
    const result = await narrateParseError('yaml', 'name: ok')
    expect(result).toBeNull()
  })

  it.each([
    ['csv', 'CSV', getCsvParseError] as const,
    ['json', 'JSON', getJsonParseError] as const,
    ['toml', 'TOML', getTomlParseError] as const,
    ['xml', 'XML', getXmlParseError] as const,
    ['yaml', 'YAML', getYamlParseError] as const,
  ])('uses the %s narrator with label %s', async (format, label, helper) => {
    vi.mocked(helper).mockResolvedValueOnce('reason')
    const result = await narrateParseError(format, 'src')
    expect(helper).toHaveBeenCalledWith('src')
    expect(result).toBe(`Invalid ${label}: reason`)
  })
})
