import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ToolStatus } from './ToolStatus'

describe('ToolStatus', () => {
  it('renders an empty slot when there is nothing to say', () => {
    const { container } = render(<ToolStatus error={null} />)
    expect(container.querySelector('[data-slot="tool-status"]')).not.toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it("shows an Error's own message", () => {
    render(<ToolStatus error={new Error('Invalid JSON: bad token')} />)
    expect(screen.getByRole('alert').textContent).toBe('Invalid JSON: bad token')
  })

  it('prefers errorLabel over the error message', () => {
    render(<ToolStatus error={new Error('wasm trap 0x1f')} errorLabel="Unable to format CSS" />)
    expect(screen.getByRole('alert').textContent).toBe('Unable to format CSS')
  })

  it('uses errorFallback when the rejection has no message', () => {
    render(<ToolStatus error="nope" errorFallback="Unable to compute diff" />)
    expect(screen.getByRole('alert').textContent).toBe('Unable to compute diff')
  })

  it('renders notices politely, and hides them while there is an error', () => {
    const { rerender } = render(<ToolStatus error={null} notices={['Skipped 2 lines']} />)
    expect(screen.getByRole('status').textContent).toBe('Skipped 2 lines')

    rerender(<ToolStatus error={new Error('boom')} notices={['Skipped 2 lines']} />)
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByRole('alert').textContent).toBe('boom')
  })

  it('offers an error action beside the error only', () => {
    const onClick = vi.fn()
    const action = { label: 'Auto-fix', onClick }
    const { rerender } = render(<ToolStatus error={null} errorAction={action} />)
    expect(screen.queryByRole('button', { name: 'Auto-fix' })).toBeNull()

    rerender(<ToolStatus error={new Error('bad syntax')} errorAction={action} />)
    fireEvent.click(screen.getByRole('button', { name: 'Auto-fix' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
