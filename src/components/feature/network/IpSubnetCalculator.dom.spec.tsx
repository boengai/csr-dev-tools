/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { IpSubnetCalculator } from './IpSubnetCalculator'

describe('IpSubnetCalculator', () => {
  it('switching to IP + Mask right after editing the CIDR uses the edited value', () => {
    render(<IpSubnetCalculator autoOpen />)

    fireEvent.change(screen.getByPlaceholderText('192.168.1.0/24'), { target: { value: '10.0.0.0/8' } })
    // No timers advanced — the mode switch happens inside the old 300ms debounce window.
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'IP + Mask' }), { button: 0 })

    expect(screen.getByPlaceholderText('192.168.1.0')).toHaveValue('10.0.0.0')
    expect(screen.getByPlaceholderText('255.255.255.0')).toHaveValue('255.0.0.0')
  })

  it('shows results for the typed CIDR synchronously', () => {
    render(<IpSubnetCalculator autoOpen />)

    fireEvent.change(screen.getByPlaceholderText('192.168.1.0/24'), { target: { value: '10.1.2.3/30' } })

    expect(screen.getByText('10.1.2.3')).toBeInTheDocument()
    expect(screen.getByText('10.1.2.0/30')).toBeInTheDocument()
  })
})
