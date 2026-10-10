/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { NumberBaseConverter } from './NumberBaseConverter'

describe('NumberBaseConverter', () => {
  it('adopts converted values into the other fields after typing in one base', async () => {
    render(<NumberBaseConverter autoOpen onAfterClose={() => {}} />)
    const decimal = await screen.findByRole('textbox', { name: /Decimal/ })
    fireEvent.change(decimal, { target: { value: '42' } })

    expect(await screen.findByDisplayValue('101010', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Hexadecimal/ })).toHaveValue('2a')
    expect(screen.getByRole('textbox', { name: /Octal/ })).toHaveValue('52')
    expect(decimal).toHaveValue('42')

    act(() => {
      fireEvent.change(decimal, { target: { value: '' } })
    })
    expect(screen.getByRole('textbox', { name: /Binary/ })).toHaveValue('')
  })
})
