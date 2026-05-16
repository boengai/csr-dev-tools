/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToolComputationPersisted } from './useToolComputationPersisted'

const STORAGE_KEY = 'test-tool-computation-persisted'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToolComputationPersisted — initialization', () => {
  it('uses options.initial when storageKey has no entry', () => {
    const { result } = renderHook(() =>
      useToolComputationPersisted<string, string>({
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
      useToolComputationPersisted<string, string>({
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
      useToolComputationPersisted<string, string>({
        compute: () => 'never',
        initial: 'DEFAULT',
        initialResult: 'EMPTY',
        storageKey: STORAGE_KEY,
      }),
    )
    expect(result.current.input).toBe('DEFAULT')
  })
})

describe('useToolComputationPersisted — write-through', () => {
  it('writes to localStorage on setInput (after React state commits)', async () => {
    const { result } = renderHook(() =>
      useToolComputationPersisted<string, string>({
        compute: () => 'never',
        debounceMs: 300,
        initial: '',
        initialResult: '',
        storageKey: STORAGE_KEY,
      }),
    )

    act(() => {
      result.current.setInput('typed')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toBe('typed')
    expect(result.current.input).toBe('typed')
  })

  it('writes to localStorage on setInputImmediate', async () => {
    const { result } = renderHook(() =>
      useToolComputationPersisted<string, string>({
        compute: () => 'never',
        initial: '',
        initialResult: '',
        storageKey: STORAGE_KEY,
      }),
    )

    act(() => {
      result.current.setInputImmediate('imm')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toBe('imm')
    expect(result.current.input).toBe('imm')
  })
})

describe('useToolComputationPersisted — mount-time autorun', () => {
  it('fires compute on mount when restored input is non-empty (per isEmpty)', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('restored'))
    const compute = vi.fn((value: string) => value.toUpperCase())
    renderHook(() =>
      useToolComputationPersisted<string, string>({
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
      useToolComputationPersisted<string, string>({
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
      useToolComputationPersisted<string, string>({
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

describe('useToolComputationPersisted — delegation to useToolComputation', () => {
  it('preserves the full pipeline: setInput → debounce → compute → result', async () => {
    const compute = vi.fn((value: string) => value.toUpperCase())
    const { result } = renderHook(() =>
      useToolComputationPersisted<string, string>({
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
