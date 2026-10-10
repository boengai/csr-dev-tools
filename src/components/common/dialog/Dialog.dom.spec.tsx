/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { domAnimation, LazyMotion } from 'motion/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Dialog } from './Dialog'

const Harness = ({ onAfterClose, open: initialOpen = true }: { onAfterClose?: () => void; open?: boolean }) => {
  const [open, setOpen] = useState(initialOpen)
  return (
    <LazyMotion features={domAnimation}>
      <button onClick={() => setOpen((prev) => !prev)} type="button">
        toggle
      </button>
      <Dialog onOpenChange={setOpen} open={open} onAfterClose={onAfterClose} title="Test dialog">
        <input aria-label="field" />
      </Dialog>
    </LazyMotion>
  )
}

describe('Dialog', () => {
  it('moves focus into the dialog content on open', async () => {
    render(<Harness />)
    const dialog = screen.getByRole('dialog')
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
  })

  it('returns focus to the opener after a user close', async () => {
    render(<Harness open={false} />)
    const opener = screen.getByText('toggle')
    opener.focus()
    fireEvent.click(opener)

    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))

    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }))

    await waitFor(() => expect(document.activeElement).toBe(opener))
  })

  it('names the close control', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument()
  })

  it('fires onAfterClose once after the exit animation of a user close', async () => {
    const onAfterClose = vi.fn()
    render(<Harness onAfterClose={onAfterClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
    // Not at close start — a reset there would flash empty content mid-fade.
    expect(onAfterClose).not.toHaveBeenCalled()

    await waitFor(() => expect(onAfterClose).toHaveBeenCalledTimes(1))
  })

  it('does not fire onAfterClose when the parent closes it programmatically', async () => {
    const onAfterClose = vi.fn()
    render(<Harness onAfterClose={onAfterClose} />)

    fireEvent.click(screen.getByText('toggle'))

    await waitFor(() => expect(screen.queryByLabelText('field')).toBeNull())
    expect(onAfterClose).not.toHaveBeenCalled()
  })
})
