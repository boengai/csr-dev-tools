/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { nth } from '@/test/nth'

import { ToolDialogShell } from './ToolDialogShell'

const Harness = ({
  initialOpen = true,
  onAfterClose,
  onReset,
}: {
  initialOpen?: boolean
  onAfterClose?: () => void
  onReset?: () => void
}) => {
  const [open, setOpen] = useState(initialOpen)
  return (
    <ToolDialogShell onAfterClose={onAfterClose} onOpenChange={setOpen} onReset={onReset} open={open} title="Test">
      <p>body</p>
    </ToolDialogShell>
  )
}

describe('ToolDialogShell', () => {
  it('renders the body when open', () => {
    render(<Harness />)
    expect(screen.getByText('body')).toBeTruthy()
  })

  it('stays closed when open is false', () => {
    render(<Harness initialOpen={false} />)
    expect(screen.queryByText('body')).toBeNull()
  })

  it('follows the open prop', () => {
    const { rerender } = render(
      <ToolDialogShell onOpenChange={() => undefined} open={false} title="Test">
        <p>body</p>
      </ToolDialogShell>,
    )
    expect(screen.queryByText('body')).toBeNull()
    rerender(
      <ToolDialogShell onOpenChange={() => undefined} open title="Test">
        <p>body</p>
      </ToolDialogShell>,
    )
    expect(screen.getByText('body')).toBeTruthy()
  })

  it('fires onOpenChange(false) on close', () => {
    const onOpenChange = vi.fn()
    render(
      <ToolDialogShell onOpenChange={onOpenChange} open title="Test">
        <p>body</p>
      </ToolDialogShell>,
    )
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('chains onReset then onAfterClose after a user close', async () => {
    const onReset = vi.fn()
    const onAfter = vi.fn()
    render(<Harness onAfterClose={onAfter} onReset={onReset} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    await waitFor(() => expect(onAfter).toHaveBeenCalledTimes(1))
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(nth(onReset.mock.invocationCallOrder, 0)).toBeLessThan(nth(onAfter.mock.invocationCallOrder, 0))
  })

  it('does not call onReset on initial mount', () => {
    const onReset = vi.fn()
    render(<Harness onReset={onReset} />)
    expect(onReset).not.toHaveBeenCalled()
  })

  it('callbacks are optional', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    await waitFor(() => expect(screen.queryByText('body')).toBeNull())
  })
})
