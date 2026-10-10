/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SelectInput } from './SelectInput'

const OPTIONS = [
  { label: 'PNG', value: 'image/png' },
  { label: 'JPEG', value: 'image/jpeg' },
]

describe('SelectInput', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stays controlled when the value goes from undefined to a selection', () => {
    // Radix's useControllableState reports the switch with console.warn in development builds.
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const onChange = vi.fn()

    const { rerender } = render(
      <SelectInput name="format" onChange={onChange} options={OPTIONS} placeholder="Select format" />,
    )
    expect(screen.getByRole('combobox')).toHaveTextContent('Select format')

    rerender(
      <SelectInput name="format" onChange={onChange} options={OPTIONS} placeholder="Select format" value="image/png" />,
    )
    expect(screen.getByRole('combobox')).toHaveTextContent('PNG')

    const switchWarnings = consoleWarn.mock.calls.filter((args) =>
      args.some((arg) => typeof arg === 'string' && arg.includes('changing from uncontrolled to controlled')),
    )
    expect(switchWarnings).toEqual([])
  })

  it('shows the placeholder again when the value is cleared back to undefined', () => {
    const { rerender } = render(
      <SelectInput name="format" onChange={vi.fn()} options={OPTIONS} placeholder="Select format" value="image/png" />,
    )
    expect(screen.getByRole('combobox')).toHaveTextContent('PNG')

    rerender(<SelectInput name="format" onChange={vi.fn()} options={OPTIONS} placeholder="Select format" />)
    expect(screen.getByRole('combobox')).toHaveTextContent('Select format')
  })
})
