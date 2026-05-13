/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BidirectionalConverter } from './BidirectionalConverter'

type Mode = 'a-to-b' | 'b-to-a'

const MODES: [
  { key: Mode; label: string; sourceLabel: string; sourcePlaceholder: string; resultLabel: string; resultPlaceholder: string },
  { key: Mode; label: string; sourceLabel: string; sourcePlaceholder: string; resultLabel: string; resultPlaceholder: string },
] = [
  {
    key: 'a-to-b',
    label: 'A → B',
    sourceLabel: 'A Input',
    sourcePlaceholder: 'enter A',
    resultLabel: 'B Output',
    resultPlaceholder: 'B appears here',
  },
  {
    key: 'b-to-a',
    label: 'B → A',
    sourceLabel: 'B Input',
    sourcePlaceholder: 'enter B',
    resultLabel: 'A Output',
    resultPlaceholder: 'A appears here',
  },
]

const upperCompute = async ({ source }: { source: string; mode: Mode }) => source.toUpperCase()

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('BidirectionalConverter — closed state', () => {
  it('renders both mode buttons with labels', () => {
    render(
      <BidirectionalConverter modes={MODES} modeStorageKey="test" compute={upperCompute} />,
    )
    expect(screen.getByRole('button', { name: 'A → B' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'B → A' })).toBeTruthy()
  })

  it('renders description when provided', () => {
    render(
      <BidirectionalConverter
        modes={MODES}
        modeStorageKey="test"
        compute={upperCompute}
        description="Convert between A and B."
      />,
    )
    expect(screen.getByText('Convert between A and B.')).toBeTruthy()
  })

  it('omits description when not provided', () => {
    render(
      <BidirectionalConverter modes={MODES} modeStorageKey="test" compute={upperCompute} />,
    )
    expect(screen.queryByText('Convert between A and B.')).toBeNull()
  })
})

describe('BidirectionalConverter — opening + switching modes', () => {
  it('opens dialog with mode 1 labels when mode 1 button clicked', () => {
    render(
      <BidirectionalConverter modes={MODES} modeStorageKey="test" compute={upperCompute} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))
    expect(screen.getByText('A Input')).toBeTruthy()
    expect(screen.getByText('B Output')).toBeTruthy()
  })

  it('opens dialog with mode 2 labels when mode 2 button clicked', () => {
    render(
      <BidirectionalConverter modes={MODES} modeStorageKey="test" compute={upperCompute} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'B → A' }))
    expect(screen.getByText('B Input')).toBeTruthy()
    expect(screen.getByText('A Output')).toBeTruthy()
  })
})

describe('BidirectionalConverter — compute pipeline', () => {
  it('fires compute with persisted source when opening a mode', async () => {
    localStorage.setItem('csr-dev-tools-a-to-b-source', JSON.stringify('hello'))
    const compute = vi.fn(upperCompute)
    render(
      <BidirectionalConverter modes={MODES} modeStorageKey="test" compute={compute} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(compute).toHaveBeenCalledWith({ mode: 'a-to-b', source: 'hello' })
  })

  it('calls onError when compute throws', async () => {
    localStorage.setItem('csr-dev-tools-a-to-b-source', JSON.stringify('x'))
    const onError = vi.fn()
    const compute = async () => {
      throw new Error('boom')
    }
    render(
      <BidirectionalConverter
        modes={MODES}
        modeStorageKey="test"
        compute={compute}
        onError={onError}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(onError.mock.calls[0][1]).toBe('a-to-b')
  })

  it('reads per-mode source from localStorage when switching modes', async () => {
    localStorage.setItem('csr-dev-tools-a-to-b-source', JSON.stringify('saved A'))
    localStorage.setItem('csr-dev-tools-b-to-a-source', JSON.stringify('saved B'))

    const compute = vi.fn(upperCompute)
    render(
      <BidirectionalConverter modes={MODES} modeStorageKey="test" compute={compute} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(compute).toHaveBeenLastCalledWith({ mode: 'a-to-b', source: 'saved A' })

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    fireEvent.click(screen.getByRole('button', { name: 'B → A' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(compute).toHaveBeenLastCalledWith({ mode: 'b-to-a', source: 'saved B' })
  })
})

describe('BidirectionalConverter — sourceToolbarSlot', () => {
  it('renders the slot inside the dialog with the current mode', () => {
    const slot = vi.fn(({ mode }: { mode: Mode; recompute: () => void }) => (
      <div data-testid="slot">slot for {mode}</div>
    ))
    render(
      <BidirectionalConverter
        modes={MODES}
        modeStorageKey="test"
        compute={upperCompute}
        sourceToolbarSlot={slot}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'B → A' }))

    expect(screen.getByTestId('slot').textContent).toBe('slot for b-to-a')
  })

  it('slot.recompute fires compute with current source + mode', async () => {
    localStorage.setItem('csr-dev-tools-a-to-b-source', JSON.stringify('hi'))
    const compute = vi.fn(upperCompute)
    const slot = ({ recompute }: { mode: Mode; recompute: () => void }) => (
      <button data-testid="slot-trigger" onClick={recompute}>
        refire
      </button>
    )
    render(
      <BidirectionalConverter
        modes={MODES}
        modeStorageKey="test"
        compute={compute}
        sourceToolbarSlot={slot}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(compute).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId('slot-trigger'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(compute).toHaveBeenCalledTimes(2)
    expect(compute).toHaveBeenLastCalledWith({ mode: 'a-to-b', source: 'hi' })
  })
})

describe('BidirectionalConverter — autoOpen + close', () => {
  it('opens with autoOpen=true on mode 1', () => {
    render(
      <BidirectionalConverter autoOpen modes={MODES} modeStorageKey="test" compute={upperCompute} />,
    )
    expect(screen.getByText('A Input')).toBeTruthy()
  })

  it('calls onAfterDialogClose on close', () => {
    const onAfterDialogClose = vi.fn()
    render(
      <BidirectionalConverter
        autoOpen
        modes={MODES}
        modeStorageKey="test"
        compute={upperCompute}
        onAfterDialogClose={onAfterDialogClose}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onAfterDialogClose).toHaveBeenCalledTimes(1)
  })
})
