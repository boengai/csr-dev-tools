/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToolComputation } from './useToolComputation'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToolComputation', () => {
  it('exposes initial result, no error, not pending', () => {
    const { result } = renderHook(() => useToolComputation(async (s: string) => s, { initial: 'init' }))
    expect(result.current.result).toBe('init')
    expect(result.current.error).toBeNull()
    expect(result.current.isPending).toBe(false)
  })

  it('debounces input then commits the compute result', async () => {
    const compute = vi.fn(async (s: string) => s.toUpperCase())
    const { result } = renderHook(() => useToolComputation(compute, { initial: '', debounceMs: 300 }))

    act(() => {
      result.current.setInput('abc')
    })
    expect(result.current.isPending).toBe(true)
    expect(compute).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(compute).toHaveBeenCalledTimes(1)
    expect(compute).toHaveBeenCalledWith('abc')
    expect(result.current.result).toBe('ABC')
    expect(result.current.isPending).toBe(false)
  })

  it('coalesces rapid inputs — only the latest value computes', async () => {
    const compute = vi.fn(async (s: string) => s.toUpperCase())
    const { result } = renderHook(() => useToolComputation(compute, { initial: '', debounceMs: 300 }))

    act(() => {
      result.current.setInput('a')
    })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    act(() => {
      result.current.setInput('ab')
    })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    act(() => {
      result.current.setInput('abc')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(compute).toHaveBeenCalledTimes(1)
    expect(compute).toHaveBeenCalledWith('abc')
    expect(result.current.result).toBe('ABC')
  })

  it('drops stale results: a slow earlier compute cannot overwrite a newer one', async () => {
    const resolvers: Array<(value: string) => void> = []
    const compute = vi.fn(
      (_s: string) =>
        new Promise<string>((resolve) => {
          resolvers.push(resolve)
        }),
    )
    const { result } = renderHook(() => useToolComputation(compute, { initial: '', debounceMs: 0 }))

    act(() => {
      result.current.setInput('first')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    act(() => {
      result.current.setInput('second')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(resolvers.length).toBe(2)

    await act(async () => {
      resolvers[1]('SECOND')
      await Promise.resolve()
    })
    expect(result.current.result).toBe('SECOND')

    await act(async () => {
      resolvers[0]('FIRST')
      await Promise.resolve()
    })
    expect(result.current.result).toBe('SECOND')
  })

  it('isEmpty: synchronously resets to initial and cancels pending compute', async () => {
    const compute = vi.fn(async (s: string) => s.toUpperCase())
    const { result } = renderHook(() =>
      useToolComputation(compute, {
        initial: '',
        debounceMs: 300,
        isEmpty: (s) => s === '',
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
      result.current.setInput('next')
    })
    act(() => {
      result.current.setInput('')
    })
    expect(result.current.result).toBe('')
    expect(result.current.isPending).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(compute).toHaveBeenCalledTimes(1)
  })

  it('isEmpty: clears any prior error synchronously', async () => {
    const compute = vi.fn(async () => {
      throw new Error('boom')
    })
    const { result } = renderHook(() =>
      useToolComputation(compute, {
        initial: '',
        debounceMs: 0,
        isEmpty: (s: string) => s === '',
      }),
    )

    act(() => {
      result.current.setInput('x')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.error).toBeInstanceOf(Error)

    act(() => {
      result.current.setInput('')
    })
    expect(result.current.error).toBeNull()
  })

  it('isPending is true through debounce and through async resolution', async () => {
    let resolveCompute: (value: string) => void = () => {}
    const compute = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveCompute = resolve
        }),
    )
    const { result } = renderHook(() => useToolComputation(compute, { initial: '', debounceMs: 100 }))

    act(() => {
      result.current.setInput('x')
    })
    expect(result.current.isPending).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(result.current.isPending).toBe(true)
    expect(compute).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveCompute('X')
      await Promise.resolve()
    })
    expect(result.current.isPending).toBe(false)
    expect(result.current.result).toBe('X')
  })

  it('captures async errors in error state and preserves the prior result', async () => {
    let attempt = 0
    const compute = vi.fn(async () => {
      attempt += 1
      if (attempt === 2) throw new Error('boom')
      return `r${attempt}`
    })
    const { result } = renderHook(() => useToolComputation(compute, { initial: 'INIT', debounceMs: 0 }))

    act(() => {
      result.current.setInput('a')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.result).toBe('r1')
    expect(result.current.error).toBeNull()

    act(() => {
      result.current.setInput('b')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.error).toBeInstanceOf(Error)
    expect((result.current.error as Error).message).toBe('boom')
    expect(result.current.result).toBe('r1')
  })

  it('clears a prior error when the next compute succeeds', async () => {
    let first = true
    const compute = vi.fn(async (s: string) => {
      if (first) {
        first = false
        throw new Error('boom')
      }
      return s
    })
    const { result } = renderHook(() => useToolComputation(compute, { initial: '', debounceMs: 0 }))

    act(() => {
      result.current.setInput('a')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.error).toBeInstanceOf(Error)

    act(() => {
      result.current.setInput('b')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.error).toBeNull()
    expect(result.current.result).toBe('b')
  })

  it('calls onError with (error, input)', async () => {
    const compute = vi.fn(async () => {
      throw new Error('boom')
    })
    const onError = vi.fn()
    const { result } = renderHook(() => useToolComputation(compute, { initial: '', debounceMs: 0, onError }))

    act(() => {
      result.current.setInput('hello')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(onError.mock.calls[0][1]).toBe('hello')
  })

  it('does not commit results after unmount', async () => {
    let resolveCompute: (value: string) => void = () => {}
    const compute = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveCompute = resolve
        }),
    )
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result, unmount } = renderHook(() => useToolComputation(compute, { initial: '', debounceMs: 0 }))

    act(() => {
      result.current.setInput('x')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    unmount()
    await act(async () => {
      resolveCompute('X')
      await Promise.resolve()
    })

    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('setInputImmediate skips the debounce wait and cancels any pending debounced compute', async () => {
    const compute = vi.fn(async (s: string) => s.toUpperCase())
    const { result } = renderHook(() => useToolComputation(compute, { initial: '', debounceMs: 300 }))

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
    expect(result.current.result).toBe('FAST')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(compute).toHaveBeenCalledTimes(1)
  })

  it('setInputImmediate respects isEmpty', () => {
    const compute = vi.fn(async (s: string) => s.toUpperCase())
    const { result } = renderHook(() =>
      useToolComputation(compute, {
        initial: 'INIT',
        debounceMs: 300,
        isEmpty: (s: string) => s === '',
      }),
    )

    act(() => {
      result.current.setInputImmediate('')
    })
    expect(result.current.result).toBe('INIT')
    expect(result.current.isPending).toBe(false)
    expect(compute).not.toHaveBeenCalled()
  })

  it('debounceMs: 0 fires on the next tick', async () => {
    const compute = vi.fn(async (s: string) => s)
    const { result } = renderHook(() => useToolComputation(compute, { initial: '', debounceMs: 0 }))

    act(() => {
      result.current.setInput('go')
    })
    expect(compute).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(compute).toHaveBeenCalledTimes(1)
    expect(result.current.result).toBe('go')
  })
})
