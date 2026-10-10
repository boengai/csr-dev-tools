/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToolInput } from './useToolInput'

const STORAGE_KEY = 'test-tool-computation-persisted'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToolInput (storageKey) — initialization', () => {
  it('uses options.initial when storageKey has no entry', () => {
    const { result } = renderHook(() =>
      useToolInput<string, string>({
        compute: () => 'never',
        initial: 'DEFAULT',
        initialResult: 'EMPTY',
        storageKey: STORAGE_KEY,
      }),
    )
    expect(result.current.input).toBe('DEFAULT')
    expect(result.current.result).toBe('EMPTY')
  })

  it('reads input from localStorage when storageKey has an entry', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('RESTORED'))
    const { result } = renderHook(() =>
      useToolInput<string, string>({
        compute: () => 'never',
        initial: 'DEFAULT',
        initialResult: 'EMPTY',
        storageKey: STORAGE_KEY,
      }),
    )
    expect(result.current.input).toBe('RESTORED')
  })

  it('falls back to options.initial when stored JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json{{{')
    const { result } = renderHook(() =>
      useToolInput<string, string>({
        compute: () => 'never',
        initial: 'DEFAULT',
        initialResult: 'EMPTY',
        storageKey: STORAGE_KEY,
      }),
    )
    expect(result.current.input).toBe('DEFAULT')
  })
})

describe('useToolInput (storageKey) — debounced write-through', () => {
  const setup = (debounceMs?: number) =>
    renderHook(() =>
      useToolInput<string, string>({
        compute: (value) => value,
        debounceMs,
        initial: '',
        initialResult: '',
        storageKey: STORAGE_KEY,
      }),
    )
  const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')

  it('does not write on mount (no seed re-persist)', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    setup()
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(setItem).not.toHaveBeenCalled()
    setItem.mockRestore()
  })

  it('coalesces keystrokes into one write after the debounce window', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const { result } = setup(300)

    act(() => {
      result.current.setInput('t')
      result.current.setInput('ty')
      result.current.setInput('typed')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299)
    })
    expect(setItem).not.toHaveBeenCalled()
    expect(result.current.input).toBe('typed')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(setItem).toHaveBeenCalledTimes(1)
    expect(stored()).toBe('typed')
    setItem.mockRestore()
  })

  it('writes immediately on setInputImmediate', () => {
    const { result } = setup()
    act(() => {
      result.current.setInputImmediate('imm')
    })
    expect(stored()).toBe('imm')
    expect(result.current.input).toBe('imm')
  })

  it('persists a clear to empty (empty-bypass still writes)', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('old'))
    const { result } = setup()
    act(() => {
      result.current.setInput('')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(stored()).toBe('')
  })

  it('flushes a pending write on unmount', () => {
    const { result, unmount } = setup()
    act(() => {
      result.current.setInput('pending')
    })
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    unmount()
    expect(stored()).toBe('pending')
  })

  it('flushes a pending write on pagehide', () => {
    const { result } = setup()
    act(() => {
      result.current.setInput('pending')
    })
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    window.dispatchEvent(new Event('pagehide'))
    expect(stored()).toBe('pending')
  })

  it('reset() restores options.initial (not the restored value) and persists it', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('restored'))
    const { result } = renderHook(() =>
      useToolInput<string, string>({
        compute: (value) => value,
        initial: 'DEFAULT',
        initialResult: '',
        storageKey: STORAGE_KEY,
      }),
    )
    expect(result.current.input).toBe('restored')
    act(() => {
      result.current.reset()
    })
    expect(result.current.input).toBe('DEFAULT')
    expect(stored()).toBe('DEFAULT')
  })

  it('never touches localStorage without storageKey', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const { result, unmount } = renderHook(() =>
      useToolInput<string, string>({ compute: (value) => value, initial: '', initialResult: '' }),
    )
    act(() => {
      result.current.setInput('x')
      result.current.setInputImmediate('y')
    })
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    unmount()
    expect(setItem).not.toHaveBeenCalled()
    setItem.mockRestore()
  })
})

describe('useToolInput (storageKey) — mount-time autorun', () => {
  it('fires compute on mount when restored input is non-empty (per isEmpty)', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('restored'))
    const compute = vi.fn((value: string) => value.toUpperCase())
    renderHook(() =>
      useToolInput<string, string>({
        compute,
        initial: '',
        initialResult: '',
        isEmpty: (value) => !value.trim(),
        storageKey: STORAGE_KEY,
      }),
    )

    // Two timer flushes: one for useMountOnce's deferred autorun-fire, a second
    // for the compute pipeline's own setTimeout(0) scheduled by setInputImmediate.
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(compute).toHaveBeenCalledTimes(1)
    expect(compute).toHaveBeenCalledWith('restored')
  })

  it('does NOT fire compute on mount when restored input passes isEmpty', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(''))
    const compute = vi.fn()
    renderHook(() =>
      useToolInput<string, string>({
        compute,
        initial: '',
        initialResult: '',
        isEmpty: (value) => !value.trim(),
        storageKey: STORAGE_KEY,
      }),
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(compute).not.toHaveBeenCalled()
  })

  it('does NOT fire compute on mount when isEmpty is undefined (no autorun without an emptiness rule)', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('non-empty'))
    const compute = vi.fn()
    renderHook(() =>
      useToolInput<string, string>({
        compute,
        initial: '',
        initialResult: '',
        // no isEmpty
        storageKey: STORAGE_KEY,
      }),
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(compute).not.toHaveBeenCalled()
  })
})

describe('useToolInput (storageKey) — delegation to useToolComputation', () => {
  it('preserves the full pipeline: setInput → debounce → compute → result', async () => {
    const compute = vi.fn((value: string) => value.toUpperCase())
    const { result } = renderHook(() =>
      useToolInput<string, string>({
        compute,
        debounceMs: 300,
        initial: '',
        initialResult: '',
        storageKey: STORAGE_KEY,
      }),
    )

    act(() => {
      result.current.setInput('hello')
    })
    expect(result.current.isPending).toBe(true)
    expect(compute).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(compute).toHaveBeenCalledTimes(1)
    expect(compute).toHaveBeenCalledWith('hello')
    expect(result.current.result).toBe('HELLO')
  })
})

describe('useToolInput — restored-value autorun is gated on storageKey', () => {
  it('does NOT autorun without storageKey even when isEmpty is set and initial is non-empty', async () => {
    const compute = vi.fn((value: string) => value)
    renderHook(() =>
      useToolInput<string, string>({
        compute,
        initial: 'non-empty default',
        initialResult: '',
        isEmpty: (value) => !value.trim(),
      }),
    )
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(compute).not.toHaveBeenCalled()
  })

  it('autorunOnMount: true + storageKey fires once with the restored value', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('restored'))
    const compute = vi.fn((value: string) => value)
    renderHook(() =>
      useToolInput<string, string>({
        autorunOnMount: true,
        compute,
        initial: '',
        initialResult: '',
        isEmpty: (value) => !value.trim(),
        storageKey: STORAGE_KEY,
      }),
    )
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(compute).toHaveBeenCalledTimes(1)
    expect(compute.mock.calls[0]?.[0]).toBe('restored')
  })
})
