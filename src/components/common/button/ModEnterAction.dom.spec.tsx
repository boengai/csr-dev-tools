import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ModEnterAction } from './ModEnterAction'

const press = (init: KeyboardEventInit) => fireEvent.keyDown(document, init)

describe('ModEnterAction', () => {
  it('fires on ⌘+Enter and Ctrl+Enter, not on a bare Enter, and shows the key hint', () => {
    const onTrigger = vi.fn()
    render(
      <ModEnterAction onTrigger={onTrigger}>
        <button type="button">Go</button>
      </ModEnterAction>,
    )

    press({ key: 'Enter' })
    expect(onTrigger).not.toHaveBeenCalled()
    press({ key: 'Enter', metaKey: true })
    press({ ctrlKey: true, key: 'Enter' })
    expect(onTrigger).toHaveBeenCalledTimes(2)
    expect(screen.getByText(/↵$/).tagName).toBe('KBD')
  })

  it('swallows the shortcut while disabled', () => {
    const onTrigger = vi.fn()
    render(
      <ModEnterAction disabled onTrigger={onTrigger}>
        <button type="button">Go</button>
      </ModEnterAction>,
    )

    const event = new KeyboardEvent('keydown', { cancelable: true, key: 'Enter', metaKey: true })
    document.dispatchEvent(event)
    expect(onTrigger).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
  })

  it('stops listening once unmounted', () => {
    const onTrigger = vi.fn()
    const { unmount } = render(
      <ModEnterAction onTrigger={onTrigger}>
        <button type="button">Go</button>
      </ModEnterAction>,
    )

    unmount()
    press({ key: 'Enter', metaKey: true })
    expect(onTrigger).not.toHaveBeenCalled()
  })
})
