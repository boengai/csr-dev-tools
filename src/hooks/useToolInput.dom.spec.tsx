/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToolInput } from './useToolInput'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToolInput', () => {
  it('exposes initial input and initialResult', () => {
    const { result } = renderHook(() =>
      useToolInput<string, string>({
        compute: () => 'never',
        initial: 'INIT',
        initialResult: 'EMPTY',
      }),
    )
    expect(result.current.input).toBe('INIT')
    expect(result.current.result).toBe('EMPTY')
    expect(result.current.error).toBeNull()
    expect(result.current.isPending).toBe(false)
  })

  it('setInput debounces, updates input sync, computes with the value', async () => {
    const compute = vi.fn((val: string) => val.toUpperCase())
    const { result } = renderHook(() =>
      useToolInput<string, string>({
        compute,
        debounceMs: 300,
        initial: '',
        initialResult: '',
      }),
    )

    act(() => {
      result.current.setInput('abc')
    })
    expect(result.current.input).toBe('abc')
    expect(result.current.isPending).toBe(true)
    expect(compute).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(compute).toHaveBeenCalledTimes(1)
    expect(compute).toHaveBeenCalledWith('abc')
    expect(result.current.result).toBe('ABC')
  })

  it('setInputImmediate skips the debounce and updates input sync', async () => {
    const compute = vi.fn((val: string) => val.toUpperCase())
    const { result } = renderHook(() =>
      useToolInput<string, string>({
        compute,
        debounceMs: 300,
        initial: '',
        initialResult: '',
      }),
    )

    act(() => {
      result.current.setInput('slow')
    })
    expect(result.current.isPending).toBe(true)

    act(() => {
      result.current.setInputImmediate('fast')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(compute).toHaveBeenCalledTimes(1)
    expect(compute).toHaveBeenCalledWith('fast')
    expect(result.current.input).toBe('fast')
    expect(result.current.result).toBe('FAST')

    // The earlier debounced compute is cancelled.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(compute).toHaveBeenCalledTimes(1)
  })

  it('isEmpty bypasses compute and resets result, then keeps input as-is', async () => {
    const compute = vi.fn((val: string) => val.toUpperCase())
    const { result } = renderHook(() =>
      useToolInput<string, string>({
        compute,
        debounceMs: 300,
        initial: '',
        initialResult: 'EMPTY',
        isEmpty: (val) => val.length === 0,
      }),
    )

    act(() => {
      result.current.setInput('hello')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(result.current.result).toBe('HELLO')

    act(() => {
      result.current.setInput('')
    })
    expect(result.current.result).toBe('EMPTY')
    expect(result.current.isPending).toBe(false)
    expect(result.current.input).toBe('')
  })

  it('reset() restores initial input and clears the result via isEmpty', async () => {
    const compute = vi.fn((val: string) => val.toUpperCase())
    const { result } = renderHook(() =>
      useToolInput<string, string>({
        compute,
        debounceMs: 300,
        initial: '',
        initialResult: 'EMPTY',
        isEmpty: (val) => val.length === 0,
      }),
    )

    act(() => {
      result.current.setInputImmediate('hello')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.result).toBe('HELLO')

    act(() => {
      result.current.reset()
    })

    expect(result.current.input).toBe('')
    expect(result.current.result).toBe('EMPTY')
    expect(result.current.error).toBeNull()
    expect(result.current.isPending).toBe(false)
  })

  it('reset() to a non-empty initial recomputes from that value', async () => {
    const compute = vi.fn((val: string) => val.toUpperCase())
    const { result } = renderHook(() =>
      useToolInput<string, string>({
        compute,
        debounceMs: 0,
        initial: 'SEED',
        initialResult: 'EMPTY',
      }),
    )

    act(() => {
      result.current.setInputImmediate('typed')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.result).toBe('TYPED')

    act(() => {
      result.current.reset()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(result.current.input).toBe('SEED')
    expect(result.current.result).toBe('SEED')
  })

  it('routes compute throws to onError with (error, input)', async () => {
    const compute = vi.fn(() => {
      throw new Error('boom')
    })
    const onError = vi.fn()
    const { result } = renderHook(() =>
      useToolInput<string, string>({
        compute,
        debounceMs: 0,
        initial: '',
        initialResult: '',
        onError,
      }),
    )

    act(() => {
      result.current.setInput('x')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(onError.mock.calls[0][1]).toBe('x')
  })

  it('recompute: fires compute with the current input', async () => {
    const compute = vi.fn((val: string) => val.toUpperCase())
    const { result } = renderHook(() =>
      useToolInput<string, string>({
        compute,
        debounceMs: 0,
        initial: '',
        initialResult: 'EMPTY',
      }),
    )

    act(() => {
      result.current.setInputImmediate('x')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(compute).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.recompute()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(compute).toHaveBeenCalledTimes(2)
    expect(compute).toHaveBeenLastCalledWith('x')
    expect(result.current.result).toBe('X')
  })

  it('recompute: respects isEmpty short-circuit', async () => {
    const compute = vi.fn((val: string) => val.toUpperCase())
    const { result } = renderHook(() =>
      useToolInput<string, string>({
        compute,
        debounceMs: 0,
        initial: '',
        initialResult: 'EMPTY',
        isEmpty: (val) => val.length === 0,
      }),
    )

    // Input starts empty. recompute should short-circuit.
    act(() => {
      result.current.recompute()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(compute).not.toHaveBeenCalled()
    expect(result.current.result).toBe('EMPTY')
    expect(result.current.isPending).toBe(false)
  })

  describe('autorunOnMount', () => {
    it('fires compute once on mount with the initial input when autorunOnMount: true', async () => {
      const compute = vi.fn((val: string) => val.toUpperCase())
      renderHook(() =>
        useToolInput<string, string>({
          autorunOnMount: true,
          compute,
          debounceMs: 300,
          initial: 'SEED',
          initialResult: 'EMPTY',
        }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(compute).toHaveBeenCalledTimes(1)
      expect(compute).toHaveBeenCalledWith('SEED')
    })

    it('does NOT fire compute on mount when autorunOnMount is undefined (default)', async () => {
      const compute = vi.fn()
      renderHook(() =>
        useToolInput<string, string>({
          compute,
          initial: 'SEED',
          initialResult: '',
        }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(compute).not.toHaveBeenCalled()
    })

    it('does NOT fire compute on mount when autorunOnMount: false (explicit opt-out)', async () => {
      const compute = vi.fn()
      renderHook(() =>
        useToolInput<string, string>({
          autorunOnMount: false,
          compute,
          initial: 'SEED',
          initialResult: '',
        }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(compute).not.toHaveBeenCalled()
    })

    it('autorunOnMount honors isEmpty: short-circuits when initial input is empty', async () => {
      const compute = vi.fn()
      renderHook(() =>
        useToolInput<string, string>({
          autorunOnMount: true,
          compute,
          initial: '',
          initialResult: 'EMPTY',
          isEmpty: (val) => val.length === 0,
        }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(compute).not.toHaveBeenCalled()
    })
  })

  it('recompute is equivalent to setInputImmediate(current input) — same pipeline path', async () => {
    const compute = vi.fn((val: string) => val.toUpperCase())
    const { result } = renderHook(() =>
      useToolInput<string, string>({
        compute,
        debounceMs: 0,
        initial: '',
        initialResult: 'EMPTY',
      }),
    )

    act(() => {
      result.current.setInputImmediate('x')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    act(() => {
      result.current.recompute()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    act(() => {
      result.current.setInputImmediate(result.current.input)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    // recompute and setInputImmediate(current) each fire one additional compute beyond the initial setInputImmediate call.
    expect(compute).toHaveBeenCalledTimes(3)
    expect(compute).toHaveBeenNthCalledWith(2, 'x')
    expect(compute).toHaveBeenNthCalledWith(3, 'x')
  })
})
