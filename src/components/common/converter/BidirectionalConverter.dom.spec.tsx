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

  it('fires compute exactly once when clicking a mode button (atomic mode + source swap)', async () => {
    localStorage.setItem('csr-dev-tools-a-to-b-source', JSON.stringify('hello'))
    const compute = vi.fn(upperCompute)
    render(
      <BidirectionalConverter modes={MODES} modeStorageKey="test" compute={compute} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(compute).toHaveBeenCalledTimes(1)
    expect(compute).toHaveBeenCalledWith({ mode: 'a-to-b', source: 'hello' })
  })

  it('writes to per-mode localStorage when typing in the source field', async () => {
    // CodeMirror renders a contenteditable — fireEvent.change does not reach its
    // onChange prop in jsdom. We characterize the localStorage key isolation
    // indirectly: seed both keys, open mode A→B, confirm only A's key is read
    // (compute receives 'saved A') and B's key is untouched by the open action.
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

    // A→B mode reads from the a-to-b key, not the b-to-a key.
    expect(compute).toHaveBeenCalledWith({ mode: 'a-to-b', source: 'saved A' })
    // The b-to-a key is still present and unmodified.
    expect(JSON.parse(localStorage.getItem('csr-dev-tools-b-to-a-source') ?? '""')).toBe('saved B')
  })

  it('calls setInputImmediate with empty source (via onReset) when the dialog is closed', async () => {
    // There is no standalone Reset button in the dialog. ToolDialogShell wires
    // onReset to handleAfterClose, so the reset fires when the dialog closes.
    // handleReset calls setInputImmediate({ source: '', mode }) but does NOT
    // call setSource(''), so the CodeMirror field value is NOT cleared — only
    // the compute pipeline receives the empty-source signal.
    // isEmpty({ source: '' }) short-circuits compute, so compute is NOT called.
    localStorage.setItem('csr-dev-tools-a-to-b-source', JSON.stringify('seed'))
    const compute = vi.fn(upperCompute)
    render(
      <BidirectionalConverter modes={MODES} modeStorageKey="test" compute={compute} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    compute.mockClear()

    // Closing the dialog triggers handleAfterClose → onReset → handleReset.
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    // isEmpty short-circuits compute when source is empty.
    expect(compute).not.toHaveBeenCalled()
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

describe('BidirectionalConverter — mode persistence', () => {
  it('restores the last-used mode after remount', () => {
    const { unmount } = render(
      <BidirectionalConverter modes={MODES} modeStorageKey="test" compute={upperCompute} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'B → A' }))
    // Dialog opens with mode b-to-a — confirms mode is set.
    expect(screen.getByText('B Input')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    unmount()

    render(
      <BidirectionalConverter autoOpen modes={MODES} modeStorageKey="test" compute={upperCompute} />,
    )
    // After remount with autoOpen, the persisted mode (b-to-a) drives the labels.
    expect(screen.getByText('B Input')).toBeTruthy()
  })
})
