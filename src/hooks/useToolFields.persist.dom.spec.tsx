/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToolFields } from './useToolFields'

type Bag = { jsonData: string; jsonSchema: string }

const INITIAL: Bag = { jsonData: '', jsonSchema: '' }
const STORAGE_KEY = 'test-tool-fields-persisted'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToolFields (storageKey) — initialization', () => {
  it('uses options.initial when storageKey has no entry', () => {
    const { result } = renderHook(() =>
      useToolFields<Bag, string>({
        compute: () => 'never',
        initial: INITIAL,
        initialResult: 'EMPTY',
        storageKey: STORAGE_KEY,
      }),
    )
    expect(result.current.inputs).toEqual(INITIAL)
    expect(result.current.result).toBe('EMPTY')
  })

  it('reads bag from localStorage when storageKey has an entry', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ jsonData: 'X', jsonSchema: 'Y' }))
    const { result } = renderHook(() =>
      useToolFields<Bag, string>({
        compute: () => 'never',
        initial: INITIAL,
        initialResult: 'EMPTY',
        storageKey: STORAGE_KEY,
      }),
    )
    expect(result.current.inputs).toEqual({ jsonData: 'X', jsonSchema: 'Y' })
  })

  it('falls back to options.initial when stored JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json{{{')
    const { result } = renderHook(() =>
      useToolFields<Bag, string>({
        compute: () => 'never',
        initial: INITIAL,
        initialResult: 'EMPTY',
        storageKey: STORAGE_KEY,
      }),
    )
    expect(result.current.inputs).toEqual(INITIAL)
  })
})

describe('useToolFields (storageKey) — debounced write-through', () => {
  const setup = () =>
    renderHook(() =>
      useToolFields<Bag, string>({
        compute: () => 'never',
        debounceMs: 300,
        initial: INITIAL,
        initialResult: '',
        storageKey: STORAGE_KEY,
      }),
    )
  const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')

  it('coalesces setFields calls into one write of the merged bag after the debounce', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const { result } = setup()

    act(() => {
      result.current.setFields({ jsonData: 'c' })
      result.current.setFields({ jsonData: 'changed' })
      result.current.setFields({ jsonSchema: 's' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299)
    })
    expect(setItem).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(setItem).toHaveBeenCalledTimes(1)
    expect(stored()).toEqual({ jsonData: 'changed', jsonSchema: 's' })
    setItem.mockRestore()
  })

  it('writes immediately on setFieldsImmediate', () => {
    const { result } = setup()
    act(() => {
      result.current.setFieldsImmediate({ jsonSchema: 'imm' })
    })
    expect(stored()).toEqual({ jsonData: '', jsonSchema: 'imm' })
  })

  it('flushes a pending write on unmount', () => {
    const { result, unmount } = setup()
    act(() => {
      result.current.setFields({ jsonData: 'pending' })
    })
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    unmount()
    expect(stored()).toEqual({ jsonData: 'pending', jsonSchema: '' })
  })

  it('flushes a pending write on pagehide', () => {
    const { result } = setup()
    act(() => {
      result.current.setFields({ jsonData: 'pending' })
    })
    window.dispatchEvent(new Event('pagehide'))
    expect(stored()).toEqual({ jsonData: 'pending', jsonSchema: '' })
  })

  it('reset() restores options.initial (not the restored bag) and persists it', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ jsonData: 'X', jsonSchema: 'Y' }))
    const { result } = setup()
    expect(result.current.inputs).toEqual({ jsonData: 'X', jsonSchema: 'Y' })
    act(() => {
      result.current.reset()
    })
    expect(result.current.inputs).toEqual(INITIAL)
    expect(stored()).toEqual(INITIAL)
  })
})

describe('useToolFields (storageKey) — mount-time autorun', () => {
  it('fires compute on mount when restored bag is non-empty (per isEmpty)', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ jsonData: 'restored', jsonSchema: '{}' }))
    const compute = vi.fn(({ jsonData, jsonSchema }: Bag) => `${jsonData}|${jsonSchema}`)
    renderHook(() =>
      useToolFields<Bag, string>({
        compute,
        initial: INITIAL,
        initialResult: '',
        isEmpty: ({ jsonData, jsonSchema }) => !jsonData.trim() || !jsonSchema.trim(),
        storageKey: STORAGE_KEY,
      }),
    )

    // Two timer flushes: one for useMountOnce's deferred autorun-fire, a second
    // for the compute pipeline's own setTimeout(0) scheduled by setFieldsImmediate.
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(compute).toHaveBeenCalledTimes(1)
    expect(compute).toHaveBeenCalledWith(
      { jsonData: 'restored', jsonSchema: '{}' },
      { signal: expect.any(AbortSignal) },
    )
  })

  it('does NOT fire compute on mount when restored bag passes isEmpty', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ jsonData: '', jsonSchema: '' }))
    const compute = vi.fn()
    renderHook(() =>
      useToolFields<Bag, string>({
        compute,
        initial: INITIAL,
        initialResult: '',
        isEmpty: ({ jsonData, jsonSchema }) => !jsonData.trim() || !jsonSchema.trim(),
        storageKey: STORAGE_KEY,
      }),
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(compute).not.toHaveBeenCalled()
  })

  it('does NOT fire compute on mount when isEmpty is undefined (no autorun without an emptiness rule)', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ jsonData: 'X', jsonSchema: 'Y' }))
    const compute = vi.fn()
    renderHook(() =>
      useToolFields<Bag, string>({
        compute,
        initial: INITIAL,
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

describe('useToolFields (storageKey) — autorunOnMount override', () => {
  it('fires compute on mount when autorunOnMount: true, even with isEmpty undefined', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ jsonData: 'X', jsonSchema: 'Y' }))
    const compute = vi.fn(({ jsonData, jsonSchema }: Bag) => `${jsonData}|${jsonSchema}`)
    renderHook(() =>
      useToolFields<Bag, string>({
        autorunOnMount: true,
        compute,
        initial: INITIAL,
        initialResult: '',
        // no isEmpty — without the option, no autorun fires.
        storageKey: STORAGE_KEY,
      }),
    )

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(compute).toHaveBeenCalledTimes(1)
    expect(compute).toHaveBeenCalledWith({ jsonData: 'X', jsonSchema: 'Y' }, { signal: expect.any(AbortSignal) })
  })

  it('does NOT double-fire when autorunOnMount: true AND the isEmpty gate would also fire', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ jsonData: 'X', jsonSchema: 'Y' }))
    const compute = vi.fn(({ jsonData, jsonSchema }: Bag) => `${jsonData}|${jsonSchema}`)
    renderHook(() =>
      useToolFields<Bag, string>({
        autorunOnMount: true,
        compute,
        initial: INITIAL,
        initialResult: '',
        // isEmpty defined + restored bag is non-empty → existing gate would fire,
        // and autorunOnMount would also fire. They must collapse to one call.
        isEmpty: ({ jsonData, jsonSchema }) => !jsonData.trim() || !jsonSchema.trim(),
        storageKey: STORAGE_KEY,
      }),
    )

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(compute).toHaveBeenCalledTimes(1)
  })

  it('fires compute on mount when autorunOnMount: true overrides an isEmpty-passing restored bag (still short-circuits inside the pipeline)', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL))
    const compute = vi.fn()
    renderHook(() =>
      useToolFields<Bag, string>({
        autorunOnMount: true,
        compute,
        initial: INITIAL,
        initialResult: '',
        isEmpty: ({ jsonData, jsonSchema }) => !jsonData.trim() || !jsonSchema.trim(),
        storageKey: STORAGE_KEY,
      }),
    )

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    // autorunOnMount fires recompute(); the pipeline's isEmpty short-circuits compute.
    expect(compute).not.toHaveBeenCalled()
  })
})

describe('useToolFields (storageKey) — delegation to useToolFields', () => {
  it('preserves the full pipeline: setFields → debounce → compute → result', async () => {
    const compute = vi.fn(({ jsonData, jsonSchema }: Bag) => `${jsonData}|${jsonSchema}`)
    const { result } = renderHook(() =>
      useToolFields<Bag, string>({
        compute,
        debounceMs: 300,
        initial: INITIAL,
        initialResult: '',
        storageKey: STORAGE_KEY,
      }),
    )

    act(() => {
      result.current.setFields({ jsonData: 'a', jsonSchema: 'b' })
    })
    expect(result.current.isPending).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(compute).toHaveBeenCalledTimes(1)
    expect(compute).toHaveBeenCalledWith({ jsonData: 'a', jsonSchema: 'b' }, { signal: expect.any(AbortSignal) })
    expect(result.current.result).toBe('a|b')
  })
})

describe('useToolFields — restored-bag autorun is gated on storageKey', () => {
  it('does NOT autorun without storageKey even when isEmpty is set and initial is non-empty', async () => {
    const compute = vi.fn(({ jsonData, jsonSchema }: Bag) => `${jsonData}|${jsonSchema}`)
    renderHook(() =>
      useToolFields<Bag, string>({
        compute,
        initial: { jsonData: 'X', jsonSchema: 'Y' },
        initialResult: '',
        isEmpty: ({ jsonData, jsonSchema }) => !jsonData.trim() || !jsonSchema.trim(),
      }),
    )
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(compute).not.toHaveBeenCalled()
  })
})
