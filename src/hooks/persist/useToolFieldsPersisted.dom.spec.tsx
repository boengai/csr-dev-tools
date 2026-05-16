/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToolFieldsPersisted } from './useToolFieldsPersisted'

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

describe('useToolFieldsPersisted — initialization', () => {
  it('uses options.initial when storageKey has no entry', () => {
    const { result } = renderHook(() =>
      useToolFieldsPersisted<Bag, string>({
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
      useToolFieldsPersisted<Bag, string>({
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
      useToolFieldsPersisted<Bag, string>({
        compute: () => 'never',
        initial: INITIAL,
        initialResult: 'EMPTY',
        storageKey: STORAGE_KEY,
      }),
    )
    expect(result.current.inputs).toEqual(INITIAL)
  })
})

describe('useToolFieldsPersisted — write-through', () => {
  it('writes to localStorage on setFields (after debounce settles inputs)', async () => {
    const { result } = renderHook(() =>
      useToolFieldsPersisted<Bag, string>({
        compute: () => 'never',
        debounceMs: 300,
        initial: INITIAL,
        initialResult: '',
        storageKey: STORAGE_KEY,
      }),
    )

    act(() => {
      result.current.setFields({ jsonData: 'changed' })
    })
    // Inputs update synchronously inside setFields; the write-through useEffect
    // fires when React commits the inputs change.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual({
      jsonData: 'changed',
      jsonSchema: '',
    })
  })

  it('writes to localStorage on setFieldsImmediate', async () => {
    const { result } = renderHook(() =>
      useToolFieldsPersisted<Bag, string>({
        compute: () => 'never',
        initial: INITIAL,
        initialResult: '',
        storageKey: STORAGE_KEY,
      }),
    )

    act(() => {
      result.current.setFieldsImmediate({ jsonSchema: 'imm' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual({
      jsonData: '',
      jsonSchema: 'imm',
    })
  })
})

describe('useToolFieldsPersisted — mount-time autorun', () => {
  it('fires compute on mount when restored bag is non-empty (per isEmpty)', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ jsonData: 'restored', jsonSchema: '{}' }))
    const compute = vi.fn(({ jsonData, jsonSchema }: Bag) => `${jsonData}|${jsonSchema}`)
    renderHook(() =>
      useToolFieldsPersisted<Bag, string>({
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
    expect(compute).toHaveBeenCalledWith({ jsonData: 'restored', jsonSchema: '{}' })
  })

  it('does NOT fire compute on mount when restored bag passes isEmpty', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ jsonData: '', jsonSchema: '' }))
    const compute = vi.fn()
    renderHook(() =>
      useToolFieldsPersisted<Bag, string>({
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
      useToolFieldsPersisted<Bag, string>({
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

describe('useToolFieldsPersisted — delegation to useToolFields', () => {
  it('preserves the full pipeline: setFields → debounce → compute → result', async () => {
    const compute = vi.fn(({ jsonData, jsonSchema }: Bag) => `${jsonData}|${jsonSchema}`)
    const { result } = renderHook(() =>
      useToolFieldsPersisted<Bag, string>({
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
    expect(compute).toHaveBeenCalledWith({ jsonData: 'a', jsonSchema: 'b' })
    expect(result.current.result).toBe('a|b')
  })
})
