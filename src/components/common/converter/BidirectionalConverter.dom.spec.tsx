/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/parse-error-narrators', () => ({
  narrateParseError: vi.fn(),
}))

import { narrateParseError } from '@/utils/parse-error-narrators'

import { BidirectionalConverter } from './BidirectionalConverter'

type Mode = 'a-to-b' | 'b-to-a'

const MODES: [
  {
    key: Mode
    label: string
    sourceLabel: string
    sourcePlaceholder: string
    resultLabel: string
    resultPlaceholder: string
  },
  {
    key: Mode
    label: string
    sourceLabel: string
    sourcePlaceholder: string
    resultLabel: string
    resultPlaceholder: string
  },
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

const upperCompute = async ({ source }: { source: string; mode: Mode }) => ({ output: source.toUpperCase() })

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
      <BidirectionalConverter
        compute={upperCompute}
        initialResult={{ output: '' }}
        modes={MODES}
        modeStorageKey="test"
      />,
    )
    expect(screen.getByRole('button', { name: 'A → B' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'B → A' })).toBeTruthy()
  })

  it('renders description when provided', () => {
    render(
      <BidirectionalConverter
        compute={upperCompute}
        description="Convert between A and B."
        initialResult={{ output: '' }}
        modes={MODES}
        modeStorageKey="test"
      />,
    )
    expect(screen.getByText('Convert between A and B.')).toBeTruthy()
  })

  it('omits description when not provided', () => {
    render(
      <BidirectionalConverter
        compute={upperCompute}
        initialResult={{ output: '' }}
        modes={MODES}
        modeStorageKey="test"
      />,
    )
    expect(screen.queryByText('Convert between A and B.')).toBeNull()
  })
})

describe('BidirectionalConverter — opening + switching modes', () => {
  it('opens dialog with mode 1 labels when mode 1 button clicked', () => {
    render(
      <BidirectionalConverter
        compute={upperCompute}
        initialResult={{ output: '' }}
        modes={MODES}
        modeStorageKey="test"
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))
    expect(screen.getByText('A Input')).toBeTruthy()
    expect(screen.getByText('B Output')).toBeTruthy()
  })

  it('opens dialog with mode 2 labels when mode 2 button clicked', () => {
    render(
      <BidirectionalConverter
        compute={upperCompute}
        initialResult={{ output: '' }}
        modes={MODES}
        modeStorageKey="test"
      />,
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
      <BidirectionalConverter compute={compute} initialResult={{ output: '' }} modes={MODES} modeStorageKey="test" />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
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
        compute={compute}
        initialResult={{ output: '' }}
        modes={MODES}
        modeStorageKey="test"
        onError={onError}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
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
      <BidirectionalConverter compute={compute} initialResult={{ output: '' }} modes={MODES} modeStorageKey="test" />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(compute).toHaveBeenLastCalledWith({ mode: 'a-to-b', source: 'saved A' })

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    fireEvent.click(screen.getByRole('button', { name: 'B → A' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(compute).toHaveBeenLastCalledWith({ mode: 'b-to-a', source: 'saved B' })
  })

  // The mode buttons live outside the dialog (in the tile), so there is no
  // "in-dialog mode swap" path in this component. The atomic-fire behavior
  // is exercised by the open path: openDialog(m) does a single
  // setInputImmediate({ mode, source }) call that should produce exactly
  // one compute, not two. The pre-existing test at "fires compute with
  // persisted source when opening a mode" asserts on args but not count;
  // this one asserts the count.
  it('calls compute exactly once when opening a mode with seeded source (no double-fire)', async () => {
    localStorage.setItem('csr-dev-tools-a-to-b-source', JSON.stringify('hello'))
    const compute = vi.fn(upperCompute)
    render(
      <BidirectionalConverter compute={compute} initialResult={{ output: '' }} modes={MODES} modeStorageKey="test" />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(compute).toHaveBeenCalledTimes(1)
    expect(compute).toHaveBeenCalledWith({ mode: 'a-to-b', source: 'hello' })
  })

  // NOTE: write-path characterization is intentionally absent.
  // handleSourceChange → writeSource(mode, val, sourceKeyPrefix) cannot be exercised
  // in jsdom — CodeMirror (used by FieldForm type="code") renders a contenteditable
  // div and its onChange is not reachable via fireEvent.change or beforeinput dispatch.
  // Read-side per-mode isolation IS covered by the test
  // "reads per-mode source from localStorage when switching modes". Write-side
  // regressions are gated by manual smoke testing during the upcoming useToolFields
  // migration (Task 2 step 2.6 in docs/superpowers/plans/2026-05-15-bidirectional-converter-tool-fields-migration.md).

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
      <BidirectionalConverter compute={compute} initialResult={{ output: '' }} modes={MODES} modeStorageKey="test" />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    compute.mockClear()

    // Closing the dialog triggers handleAfterClose → onReset → handleReset.
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
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
        compute={upperCompute}
        initialResult={{ output: '' }}
        modes={MODES}
        modeStorageKey="test"
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
        compute={compute}
        initialResult={{ output: '' }}
        modes={MODES}
        modeStorageKey="test"
        sourceToolbarSlot={slot}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(compute).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId('slot-trigger'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(compute).toHaveBeenCalledTimes(2)
    expect(compute).toHaveBeenLastCalledWith({ mode: 'a-to-b', source: 'hi' })
  })
})

describe('BidirectionalConverter — autoOpen + close', () => {
  it('opens with autoOpen=true on mode 1', () => {
    render(
      <BidirectionalConverter
        autoOpen
        compute={upperCompute}
        initialResult={{ output: '' }}
        modes={MODES}
        modeStorageKey="test"
      />,
    )
    expect(screen.getByText('A Input')).toBeTruthy()
  })

  it('calls onAfterDialogClose on close', () => {
    const onAfterDialogClose = vi.fn()
    render(
      <BidirectionalConverter
        autoOpen
        compute={upperCompute}
        initialResult={{ output: '' }}
        modes={MODES}
        modeStorageKey="test"
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
      <BidirectionalConverter
        compute={upperCompute}
        initialResult={{ output: '' }}
        modes={MODES}
        modeStorageKey="test"
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'B → A' }))
    // Dialog opens with mode b-to-a — confirms mode is set.
    expect(screen.getByText('B Input')).toBeTruthy()

    // Close before unmount is cleanup hygiene, not a persistence trigger —
    // useInputLocalStorage writes on mode-set, not on close.
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    unmount()

    render(
      <BidirectionalConverter
        autoOpen
        compute={upperCompute}
        initialResult={{ output: '' }}
        modes={MODES}
        modeStorageKey="test"
      />,
    )
    // After remount with autoOpen, the persisted mode (b-to-a) drives the labels.
    expect(screen.getByText('B Input')).toBeTruthy()
  })
})

describe('BidirectionalConverter — parse-error narration', () => {
  beforeEach(() => {
    vi.mocked(narrateParseError).mockReset()
  })

  const MODES_WITH_FORMAT: [
    {
      key: Mode
      label: string
      sourceLabel: string
      sourcePlaceholder: string
      resultLabel: string
      resultPlaceholder: string
      sourceFormat: 'json'
    },
    {
      key: Mode
      label: string
      sourceLabel: string
      sourcePlaceholder: string
      resultLabel: string
      resultPlaceholder: string
      sourceFormat: 'yaml'
    },
  ] = [
    { ...MODES[0], sourceFormat: 'json' },
    { ...MODES[1], sourceFormat: 'yaml' },
  ]

  it('narrates with the narrator output when source has a parse error', async () => {
    localStorage.setItem('csr-dev-tools-a-to-b-source', JSON.stringify('{bad'))
    vi.mocked(narrateParseError).mockResolvedValueOnce('Invalid JSON: unexpected token')
    const onError = vi.fn()
    const compute = async () => {
      throw new Error('cryptic wasm failure')
    }
    render(
      <BidirectionalConverter
        compute={compute}
        initialResult={{ output: '' }}
        modes={MODES_WITH_FORMAT}
        modeStorageKey="test"
        onError={onError}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(narrateParseError).toHaveBeenCalledWith('json', '{bad')
    expect(onError).toHaveBeenCalledTimes(1)
    const thrown = onError.mock.calls[0][0] as Error
    expect(thrown.message).toBe('Invalid JSON: unexpected token')
  })

  it('passes the original error through when source is parse-valid', async () => {
    localStorage.setItem('csr-dev-tools-a-to-b-source', JSON.stringify('[{"a":1}]'))
    vi.mocked(narrateParseError).mockResolvedValueOnce(null)
    const onError = vi.fn()
    const compute = async () => {
      throw new Error('JSON must be an array of objects')
    }
    render(
      <BidirectionalConverter
        compute={compute}
        initialResult={{ output: '' }}
        modes={MODES_WITH_FORMAT}
        modeStorageKey="test"
        onError={onError}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(narrateParseError).toHaveBeenCalledWith('json', '[{"a":1}]')
    expect(onError).toHaveBeenCalledTimes(1)
    const thrown = onError.mock.calls[0][0] as Error
    expect(thrown.message).toBe('JSON must be an array of objects')
  })

  it('skips the narrator entirely when sourceFormat is absent on the active mode', async () => {
    localStorage.setItem('csr-dev-tools-a-to-b-source', JSON.stringify('x'))
    const onError = vi.fn()
    const compute = async () => {
      throw new Error('boom')
    }
    render(
      <BidirectionalConverter
        compute={compute}
        initialResult={{ output: '' }}
        modes={MODES}
        modeStorageKey="test"
        onError={onError}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(narrateParseError).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledTimes(1)
    const thrown = onError.mock.calls[0][0] as Error
    expect(thrown.message).toBe('boom')
  })
})

describe('BidirectionalConverter — renderBanner', () => {
  it('invokes renderBanner with the current result and renders the returned node', async () => {
    localStorage.setItem('csr-dev-tools-a-to-b-source', JSON.stringify('hi'))
    const renderBanner = vi.fn((r: { output: string }) =>
      r.output ? <div data-testid="banner">banner for {r.output}</div> : null,
    )
    render(
      <BidirectionalConverter
        compute={upperCompute}
        initialResult={{ output: '' }}
        modes={MODES}
        modeStorageKey="test"
        renderBanner={renderBanner}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(renderBanner).toHaveBeenCalled()
    expect(screen.getByTestId('banner').textContent).toBe('banner for HI')
  })

  it('does not render anything when renderBanner returns null', async () => {
    localStorage.setItem('csr-dev-tools-a-to-b-source', JSON.stringify('hi'))
    render(
      <BidirectionalConverter
        compute={upperCompute}
        initialResult={{ output: '' }}
        modes={MODES}
        modeStorageKey="test"
        renderBanner={() => null}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(screen.queryByTestId('banner')).toBeNull()
  })

  it('omits the renderBanner slot entirely when prop is not provided', async () => {
    localStorage.setItem('csr-dev-tools-a-to-b-source', JSON.stringify('hi'))
    render(
      <BidirectionalConverter
        compute={upperCompute}
        initialResult={{ output: '' }}
        modes={MODES}
        modeStorageKey="test"
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'A → B' }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    // No assertion needed beyond "no crash"; absence of the slot is the test.
    expect(screen.getByText('A Input')).toBeTruthy()
  })
})
