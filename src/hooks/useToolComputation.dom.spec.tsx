/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { nth } from '@/test/nth'

import { useToast } from './state/useToast'
import { useToolComputation } from './useToolComputation'

beforeEach(() => {
  vi.useFakeTimers()
  useToast.setState({ items: [] })
})

afterEach(() => {
  vi.useRealTimers()
})

/** Convenience: read the labels of every toast added during a test. */
const toastLabels = () => useToast.getState().items.map((it) => it.label)

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
    expect(compute).toHaveBeenCalledWith('abc', { signal: expect.any(AbortSignal) })
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
    expect(compute).toHaveBeenCalledWith('abc', { signal: expect.any(AbortSignal) })
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
      nth(resolvers, 1)('SECOND')
      await Promise.resolve()
    })
    expect(result.current.result).toBe('SECOND')

    await act(async () => {
      nth(resolvers, 0)('FIRST')
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
    expect(nth(onError.mock.calls, 0)[0]).toBeInstanceOf(Error)
    expect(nth(onError.mock.calls, 0)[1]).toBe('hello')
  })

  it('errorLabel: toasts the label verbatim on rejection', async () => {
    const compute = vi.fn(async () => {
      throw new Error('underlying error that should not surface')
    })
    const { result } = renderHook(() =>
      useToolComputation(compute, { initial: '', debounceMs: 0, errorLabel: 'Hashing failed' }),
    )

    act(() => {
      result.current.setInput('x')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(toastLabels()).toEqual(['Hashing failed'])
  })

  it('errorFallback: toasts err.message when rejection is an Error', async () => {
    const compute = vi.fn(async () => {
      throw new Error('Invalid format: missing }')
    })
    const { result } = renderHook(() =>
      useToolComputation(compute, { initial: '', debounceMs: 0, errorFallback: 'Could not parse' }),
    )

    act(() => {
      result.current.setInput('x')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(toastLabels()).toEqual(['Invalid format: missing }'])
  })

  it('errorFallback: toasts the fallback when rejection is not an Error', async () => {
    const compute = vi.fn(async () => {
      throw 'string rejection' // eslint-disable-line no-throw-literal -- shape-only test of the unknown-rejection branch
    })
    const { result } = renderHook(() =>
      useToolComputation(compute, { initial: '', debounceMs: 0, errorFallback: 'Could not parse' }),
    )

    act(() => {
      result.current.setInput('x')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(toastLabels()).toEqual(['Could not parse'])
  })

  it('precedence: onError wins over errorFallback and errorLabel', async () => {
    const compute = vi.fn(async () => {
      throw new Error('boom')
    })
    const onError = vi.fn()
    const { result } = renderHook(() =>
      useToolComputation(compute, {
        initial: '',
        debounceMs: 0,
        errorFallback: 'fallback',
        errorLabel: 'label',
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
    expect(toastLabels()).toEqual([])
  })

  it('precedence: errorFallback wins over errorLabel when both set', async () => {
    const compute = vi.fn(async () => {
      throw new Error('typed message')
    })
    const { result } = renderHook(() =>
      useToolComputation(compute, {
        initial: '',
        debounceMs: 0,
        errorFallback: 'fallback',
        errorLabel: 'label',
      }),
    )

    act(() => {
      result.current.setInput('x')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(toastLabels()).toEqual(['typed message'])
  })

  it('no error option set: rejection sets error state but does NOT toast', async () => {
    const compute = vi.fn(async () => {
      throw new Error('boom')
    })
    const { result } = renderHook(() => useToolComputation(compute, { initial: '', debounceMs: 0 }))

    act(() => {
      result.current.setInput('x')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(toastLabels()).toEqual([])
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
    expect(compute).toHaveBeenCalledWith('fast', { signal: expect.any(AbortSignal) })
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

  it('recompute: fires compute with the last input passed to setInput', async () => {
    const compute = vi.fn(async (s: string) => s.toUpperCase())
    const { result } = renderHook(() => useToolComputation(compute, { initial: '', debounceMs: 0 }))

    act(() => {
      result.current.setInput('hello')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(compute).toHaveBeenCalledTimes(1)
    expect(result.current.result).toBe('HELLO')

    act(() => {
      result.current.recompute()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(compute).toHaveBeenCalledTimes(2)
    expect(compute).toHaveBeenLastCalledWith('hello', { signal: expect.any(AbortSignal) })
  })

  it('recompute: is a no-op before any setInput call', async () => {
    const compute = vi.fn(async (s: string) => s)
    const { result } = renderHook(() => useToolComputation(compute, { initial: 'INIT', debounceMs: 0 }))

    act(() => {
      result.current.recompute()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(compute).not.toHaveBeenCalled()
    expect(result.current.result).toBe('INIT')
    expect(result.current.isPending).toBe(false)
  })

  it('recompute: respects isEmpty short-circuit', async () => {
    const compute = vi.fn(async (s: string) => s.toUpperCase())
    const { result } = renderHook(() =>
      useToolComputation(compute, {
        initial: 'INIT',
        debounceMs: 0,
        isEmpty: (s: string) => s === '',
      }),
    )

    act(() => {
      result.current.setInput('hello')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(compute).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.setInputImmediate('')
    })
    expect(result.current.result).toBe('INIT')

    act(() => {
      result.current.recompute()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    // recompute uses last input ('') — isEmpty short-circuits, no new compute.
    expect(compute).toHaveBeenCalledTimes(1)
    expect(result.current.result).toBe('INIT')
  })
})

describe('useToolComputation — AbortSignal', () => {
  /** A compute that never settles on its own; records each call's signal. */
  const hangingCompute = () => {
    const signals: Array<AbortSignal> = []
    const compute = vi.fn(
      (_input: string, { signal }: { signal: AbortSignal }) =>
        new Promise<string>((_resolve, reject) => {
          signals.push(signal)
          signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
    )
    return { compute, signals }
  }

  it('aborts the in-flight signal when a newer input is enqueued, and stays silent', async () => {
    const { compute, signals } = hangingCompute()
    const { result } = renderHook(() =>
      useToolComputation(compute, { debounceMs: 0, errorLabel: 'should not toast', initial: '' }),
    )

    act(() => {
      result.current.setInput('first')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(signals).toHaveLength(1)
    expect(nth(signals, 0).aborted).toBe(false)

    act(() => {
      result.current.setInput('second')
    })
    // Aborted at enqueue time, not when the next compute fires.
    expect(nth(signals, 0).aborted).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(signals).toHaveLength(2)
    expect(nth(signals, 1).aborted).toBe(false)
    expect(result.current.error).toBeNull()
    expect(toastLabels()).toEqual([])
  })

  it('aborts the in-flight signal on the isEmpty bypass', async () => {
    const { compute, signals } = hangingCompute()
    const { result } = renderHook(() =>
      useToolComputation(compute, { debounceMs: 0, initial: 'EMPTY', isEmpty: (s) => s === '' }),
    )

    act(() => {
      result.current.setInput('x')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    act(() => {
      result.current.setInput('')
    })

    expect(nth(signals, 0).aborted).toBe(true)
    expect(result.current.isPending).toBe(false)
    expect(result.current.result).toBe('EMPTY')
  })

  it('aborts the in-flight signal on unmount', async () => {
    const { compute, signals } = hangingCompute()
    const { result, unmount } = renderHook(() => useToolComputation(compute, { debounceMs: 0, initial: '' }))

    act(() => {
      result.current.setInput('x')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    unmount()
    expect(nth(signals, 0).aborted).toBe(true)
  })

  it('treats an AbortError rejection from the current compute as silent (no error, no toast)', async () => {
    const compute = vi.fn(async () => {
      throw new DOMException('Aborted', 'AbortError')
    })
    const { result } = renderHook(() =>
      useToolComputation(compute, { debounceMs: 0, errorFallback: 'should not toast', initial: 'init' }),
    )

    act(() => {
      result.current.setInput('x')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.isPending).toBe(false)
    expect(result.current.result).toBe('init')
    expect(toastLabels()).toEqual([])
  })

  it('does not abort a compute that already resolved when the next input arrives', async () => {
    const signals: Array<AbortSignal> = []
    const compute = vi.fn(async (s: string, { signal }: { signal: AbortSignal }) => {
      signals.push(signal)
      return s
    })
    const { result } = renderHook(() => useToolComputation(compute, { debounceMs: 0, initial: '' }))

    act(() => {
      result.current.setInput('a')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    act(() => {
      result.current.setInput('b')
    })
    expect(nth(signals, 0).aborted).toBe(false)
  })
})
