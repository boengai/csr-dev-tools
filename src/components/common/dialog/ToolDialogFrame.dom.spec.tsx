/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ToolDialogFrame } from './ToolDialogFrame'

describe('ToolDialogFrame', () => {
  it('renders the description and trigger labels in the tile; dialog body hidden until open', () => {
    render(
      <ToolDialogFrame
        description="The thing this tool does"
        title="Hashes"
        triggers={[{ label: 'Hash It' }]}
      >
        <p>dialog body</p>
      </ToolDialogFrame>,
    )

    expect(screen.getByText('The thing this tool does')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Hash It' })).toBeTruthy()
    expect(screen.queryByText('dialog body')).toBeNull()
  })

  it('opens the dialog when a trigger is clicked', () => {
    render(
      <ToolDialogFrame title="Hashes" triggers={[{ label: 'Hash It' }]}>
        <p>dialog body</p>
      </ToolDialogFrame>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hash It' }))
    expect(screen.getByText('dialog body')).toBeTruthy()
  })

  it("fires the trigger's onOpen synchronously before the dialog opens", () => {
    const calls: Array<string> = []
    const onOpen = vi.fn(() => calls.push('onOpen'))

    render(
      <ToolDialogFrame title="Encrypt" triggers={[{ label: 'Encrypt', onOpen }]}>
        <p>dialog body</p>
      </ToolDialogFrame>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Encrypt' }))

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(screen.getByText('dialog body')).toBeTruthy()
    // Body and onOpen both ran in the same React event — body is in the DOM.
    expect(calls).toEqual(['onOpen'])
  })

  it('renders multiple triggers, each with its own onOpen', () => {
    const encryptOpen = vi.fn()
    const decryptOpen = vi.fn()

    render(
      <ToolDialogFrame
        title="AES"
        triggers={[
          { label: 'Encrypt', onOpen: encryptOpen },
          { label: 'Decrypt', onOpen: decryptOpen },
        ]}
      >
        <p>body</p>
      </ToolDialogFrame>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Decrypt' }))
    expect(encryptOpen).not.toHaveBeenCalled()
    expect(decryptOpen).toHaveBeenCalledTimes(1)
  })

  it('autoOpen opens the dialog on mount without firing any onOpen', () => {
    const onOpen = vi.fn()

    render(
      <ToolDialogFrame autoOpen title="Hashes" triggers={[{ label: 'Hash It', onOpen }]}>
        <p>dialog body</p>
      </ToolDialogFrame>,
    )

    expect(screen.getByText('dialog body')).toBeTruthy()
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('chains onReset then onAfterClose when the dialog closes', () => {
    const onReset = vi.fn()
    const onAfterClose = vi.fn()

    render(
      <ToolDialogFrame autoOpen onAfterClose={onAfterClose} onReset={onReset} title="Hashes" triggers={[{ label: 'X' }]}>
        <p>body</p>
      </ToolDialogFrame>,
    )

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(onAfterClose).toHaveBeenCalledTimes(1)
    expect(onReset.mock.invocationCallOrder[0]).toBeLessThan(onAfterClose.mock.invocationCallOrder[0])
  })

  it('omits the description when not provided', () => {
    const { container } = render(
      <ToolDialogFrame title="Hashes" triggers={[{ label: 'X' }]}>
        <p>body</p>
      </ToolDialogFrame>,
    )
    expect(container.querySelectorAll('p').length).toBe(0)
  })
})
