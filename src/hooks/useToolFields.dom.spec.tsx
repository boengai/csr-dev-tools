/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToolFields } from './useToolFields'

type Input = { mode: 'a' | 'b'; pattern: string; testString: string }

const INITIAL: Input = { mode: 'a', pattern: '', testString: '' }

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToolFields', () => {
  it('exposes initial inputs and initialResult', () => {
    const { result } = renderHook(() =>
      useToolFields<Input, string>({
        compute: () => 'never',
        initial: INITIAL,
        initialResult: 'EMPTY',
      }),
    )
    expect(result.current.inputs).toEqual(INITIAL)
    expect(result.current.result).toBe('EMPTY')
    expect(result.current.error).toBeNull()
    expect(result.current.isPending).toBe(false)
  })

  it('setFields(partial) merges, debounces, computes with the full bag', async () => {
    const compute = vi.fn(({ pattern, testString }: Input) => `${pattern}|${testString}`)
    const { result } = renderHook(() =>
      useToolFields<Input, string>({
        compute,
        debounceMs: 300,
        initial: INITIAL,
        initialResult: '',
      }),
    )

    act(() => {
      result.current.setFields({ pattern: 'abc' })
    })
    expect(result.current.inputs).toEqual({ mode: 'a', pattern: 'abc', testString: '' })
    expect(result.current.isPending).toBe(true)
    expect(compute).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(compute).toHaveBeenCalledTimes(1)
    expect(compute).toHaveBeenCalledWith({ mode: 'a', pattern: 'abc', testString: '' })
    expect(result.current.result).toBe('abc|')
  })

  it('back-to-back setFields in one tick: last call wins, never partially applied', async () => {
    const compute = vi.fn(({ pattern, testString }: Input) => `${pattern}|${testString}`)
    const { result } = renderHook(() =>
      useToolFields<Input, string>({
        compute,
        debounceMs: 0,
        initial: INITIAL,
        initialResult: '',
      }),
    )

    act(() => {
      result.current.setFields({ pattern: 'p1' })
      result.current.setFields({ testString: 't1' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    // Both partials chained through the inputs ref → final bag is the union.
    expect(result.current.inputs).toEqual({ mode: 'a', pattern: 'p1', testString: 't1' })
    expect(compute).toHaveBeenCalledTimes(1)
    expect(compute).toHaveBeenCalledWith({ mode: 'a', pattern: 'p1', testString: 't1' })
  })

  it('setFieldsImmediate skips the debounce and updates inputs sync', async () => {
    const compute = vi.fn(({ mode }: Input) => mode.toUpperCase())
    const { result } = renderHook(() =>
      useToolFields<Input, string>({
        compute,
        debounceMs: 300,
        initial: INITIAL,
        initialResult: '',
      }),
    )

    act(() => {
      result.current.setFields({ pattern: 'slow' })
    })
    expect(result.current.isPending).toBe(true)

    act(() => {
      result.current.setFieldsImmediate({ mode: 'b' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(compute).toHaveBeenCalledTimes(1)
    expect(compute).toHaveBeenCalledWith({ mode: 'b', pattern: 'slow', testString: '' })
    expect(result.current.inputs.mode).toBe('b')
    expect(result.current.result).toBe('B')

    // The earlier debounced compute is cancelled.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(compute).toHaveBeenCalledTimes(1)
  })

  it('isEmpty bypasses compute and resets result, then keeps the bag as-is', async () => {
    const compute = vi.fn(({ pattern, testString }: Input) => `${pattern}|${testString}`)
    const { result } = renderHook(() =>
      useToolFields<Input, string>({
        compute,
        debounceMs: 300,
        initial: INITIAL,
        initialResult: 'EMPTY',
        isEmpty: ({ pattern, testString }) => !pattern || !testString,
      }),
    )

    act(() => {
      result.current.setFields({ pattern: 'a', testString: 'b' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(result.current.result).toBe('a|b')

    act(() => {
      result.current.setFields({ testString: '' })
    })
    expect(result.current.result).toBe('EMPTY')
    expect(result.current.isPending).toBe(false)
    expect(result.current.inputs).toEqual({ mode: 'a', pattern: 'a', testString: '' })
  })

  it('reset() restores initial inputs and (via isEmpty) clears the result sync', async () => {
    const compute = vi.fn(({ pattern, testString }: Input) => `${pattern}|${testString}`)
    const { result } = renderHook(() =>
      useToolFields<Input, string>({
        compute,
        debounceMs: 300,
        initial: INITIAL,
        initialResult: 'EMPTY',
        isEmpty: ({ pattern, testString }) => !pattern || !testString,
      }),
    )

    act(() => {
      result.current.setFieldsImmediate({ pattern: 'x', testString: 'y' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.result).toBe('x|y')

    act(() => {
      result.current.reset()
    })

    expect(result.current.inputs).toEqual(INITIAL)
    expect(result.current.result).toBe('EMPTY')
    expect(result.current.error).toBeNull()
    expect(result.current.isPending).toBe(false)
  })

  it('routes compute throws to onError with (error, full input bag)', async () => {
    const compute = vi.fn(() => {
      throw new Error('boom')
    })
    const onError = vi.fn()
    const { result } = renderHook(() =>
      useToolFields<Input, string>({
        compute,
        debounceMs: 0,
        initial: INITIAL,
        initialResult: '',
        onError,
      }),
    )

    act(() => {
      result.current.setFields({ pattern: 'p', testString: 't' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(onError.mock.calls[0][1]).toEqual({ mode: 'a', pattern: 'p', testString: 't' })
  })
})
