import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { OutputField } from '@/types'

import { FieldList } from './FieldList'

describe('FieldList', () => {
  const writeText = vi.fn(async () => undefined)

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  })

  afterEach(() => {
    writeText.mockClear()
  })

  it('renders each row as a term/definition pair with a Copy named by its label', () => {
    render(<FieldList fields={[{ label: 'Host', value: 'example.com' }]} />)

    expect(screen.getByRole('term').textContent).toBe('Host')
    expect(screen.getByRole('definition').textContent).toBe('example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Copy Host to clipboard' }))
    expect(writeText).toHaveBeenLastCalledWith('example.com')
  })

  it('drops the Copy button for a row with copy: false', () => {
    render(
      <FieldList
        fields={[
          { label: 'Words', value: '3' },
          { copy: false, label: 'Characters', value: '11' },
        ]}
      />,
    )

    expect(screen.getByRole('button', { name: 'Copy Words to clipboard' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Copy Characters to clipboard' })).toBeNull()
    expect(screen.getByText('11')).toBeTruthy()
  })

  it('copies copyValue instead of the shown value when set', () => {
    render(<FieldList fields={[{ copyValue: '{"exp":1}', label: 'Payload', value: 'exp: 1 (2026-01-01)' }]} />)

    expect(screen.getByText('exp: 1 (2026-01-01)')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Copy Payload to clipboard' }))
    expect(writeText).toHaveBeenLastCalledWith('{"exp":1}')
  })

  it('keeps every row when labels repeat, and keeps line breaks in values', () => {
    const fields: Array<OutputField> = [
      { label: 'SAN', value: 'a.example.com' },
      { label: 'SAN', value: 'b.example.com' },
      { label: 'Next runs', value: 'Mon 09:00\nTue 09:00' },
    ]
    render(<FieldList fields={fields} />)

    expect(screen.getAllByRole('button', { name: 'Copy SAN to clipboard' })).toHaveLength(2)
    expect(screen.getAllByRole('definition').map((dd) => dd.textContent)).toEqual([
      'a.example.com',
      'b.example.com',
      'Mon 09:00\nTue 09:00',
    ])
  })

  it('renders every row in the one shared style', () => {
    render(<FieldList fields={[{ label: 'A', value: 'x' }]} />)
    expect(screen.getByRole('term').className).toContain('text-body-xs')
    expect(screen.getByRole('definition').className).toContain('p-2')
  })
})
