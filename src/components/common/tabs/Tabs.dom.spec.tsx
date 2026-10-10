/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Tabs } from './Tabs'

const observed: Array<Element> = []

beforeEach(() => {
  observed.length = 0
  vi.stubGlobal(
    'ResizeObserver',
    class {
      disconnect() {}
      observe(el: Element) {
        observed.push(el)
      }
      unobserve() {}
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const items = [
  { content: <p>first body</p>, trigger: <button type="button">First</button>, value: 'first' },
  { content: <p>second body</p>, trigger: <button type="button">Second</button>, value: 'second' },
]

describe('Tabs', () => {
  it('switches tabs when uncontrolled and re-measures the newly active trigger', () => {
    render(<Tabs defaultValue="first" items={items} />)

    expect(screen.getByRole('tab', { name: 'First' })).toHaveAttribute('aria-selected', 'true')
    expect(observed).toContain(screen.getByRole('tab', { name: 'First' }))

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Second' }))

    expect(screen.getByRole('tab', { name: 'Second' })).toHaveAttribute('aria-selected', 'true')
    expect(observed).toContain(screen.getByRole('tab', { name: 'Second' }))
  })

  it('defers to the injected value when controlled', () => {
    const setValue = vi.fn()
    render(<Tabs injected={{ setValue, value: 'first' }} items={items} />)

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Second' }))

    expect(setValue).toHaveBeenCalledWith('second')
    expect(screen.getByRole('tab', { name: 'First' })).toHaveAttribute('aria-selected', 'true')
  })
})
