import { describe, expect, it } from 'vitest'

import { generateMarkdownTable } from './markdown-table'

describe('generateMarkdownTable', () => {
  it('generates basic 3x3 table with left alignment', () => {
    const data = [
      ['A', 'B', 'C'],
      ['1', '2', '3'],
      ['4', '5', '6'],
    ]
    const result = generateMarkdownTable(data, ['left', 'left', 'left'])
    expect(result).toContain('| A')
    expect(result).toContain(':--')
    expect(result.split('\n')).toHaveLength(4) // header + separator + 2 data rows
  })

  it('generates center alignment separator', () => {
    const data = [['H1'], ['D1']]
    const result = generateMarkdownTable(data, ['center'])
    expect(result).toMatch(/:\S+:/)
  })

  it('generates right alignment separator', () => {
    const data = [['H1'], ['D1']]
    const result = generateMarkdownTable(data, ['right'])
    expect(result).toMatch(/\S+-:/)
  })

  it('handles mixed alignments', () => {
    const data = [
      ['L', 'C', 'R'],
      ['1', '2', '3'],
    ]
    const result = generateMarkdownTable(data, ['left', 'center', 'right'])
    const lines = result.split('\n')
    expect(lines[1]).toMatch(/:--/)
    expect(lines[1]).toMatch(/:-+:/)
    expect(lines[1]).toMatch(/-+:/)
  })

  it('handles empty cells', () => {
    const data = [
      ['H1', 'H2'],
      ['', 'data'],
    ]
    const result = generateMarkdownTable(data, ['left', 'left'])
    expect(result).toContain('|')
    expect(result.split('\n')).toHaveLength(3)
  })

  it('escapes pipe characters in content', () => {
    const data = [['Header'], ['a|b']]
    const result = generateMarkdownTable(data, ['left'])
    expect(result).toContain('a\\|b')
  })

  it('generates single data row', () => {
    const data = [
      ['H1', 'H2'],
      ['D1', 'D2'],
    ]
    const result = generateMarkdownTable(data, ['left', 'left'])
    expect(result.split('\n')).toHaveLength(3)
  })

  it('pads cells for consistent width', () => {
    const data = [
      ['Short', 'LongerHeader'],
      ['A', 'B'],
    ]
    const result = generateMarkdownTable(data, ['left', 'left'])
    const lines = result.split('\n')
    // All lines should have same structure
    expect(lines.every((l) => l.startsWith('|') && l.endsWith('|'))).toBe(true)
  })

  it('generates header-only table', () => {
    const data = [['H1', 'H2']]
    const result = generateMarkdownTable(data, ['left', 'left'])
    expect(result.split('\n')).toHaveLength(2) // header + separator
  })

  it('returns empty for empty data', () => {
    expect(generateMarkdownTable([], [])).toBe('')
    expect(generateMarkdownTable([[]], [])).toBe('')
  })
})
