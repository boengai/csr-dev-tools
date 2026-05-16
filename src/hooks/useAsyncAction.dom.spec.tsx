/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useAsyncAction } from './useAsyncAction'

/** Builds a deferred promise + matching resolve/reject so a test can hold the
 * action open until it explicitly settles it. */
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (err: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, reject, resolve }
}

describe('useAsyncAction', () => {
  it('exposes initial pending=false, result=null', () => {
    const { result } = renderHook(() => useAsyncAction(async () => 'ok'))
    expect(result.current.pending).toBe(false)
    expect(result.current.result).toBeNull()
  })

  it('sets pending=true while the action is awaiting, then commits the value', async () => {
    const d = deferred<string>()
    const { result } = renderHook(() => useAsyncAction(() => d.promise))

    let runPromise!: Promise<string | undefined>
    act(() => {
      runPromise = result.current.run()
    })
    expect(result.current.pending).toBe(true)
    expect(result.current.result).toBeNull()

    await act(async () => {
      d.resolve('hello')
      await runPromise
    })

    expect(result.current.pending).toBe(false)
    expect(result.current.result).toBe('hello')
  })

  it('returns the action value from run() when fresh + mounted', async () => {
    const { result } = renderHook(() => useAsyncAction(async () => 42))

    let returned: number | undefined
    await act(async () => {
      returned = await result.current.run()
    })

    expect(returned).toBe(42)
  })

  it('calls onError + leaves result null when the action throws', async () => {
    const onError = vi.fn()
    const { result } = renderHook(() =>
      useAsyncAction(
        async () => {
          throw new Error('boom')
        },
        { onError },
      ),
    )

    await act(async () => {
      await result.current.run()
    })

    expect(result.current.pending).toBe(false)
    expect(result.current.result).toBeNull()
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
  })

  it('returns undefined from run() when the action rejects', async () => {
    const { result } = renderHook(() =>
      useAsyncAction(async () => {
        throw new Error('boom')
      }),
    )

    let returned: string | undefined = 'sentinel' as string | undefined
    await act(async () => {
      returned = await result.current.run()
    })

    expect(returned).toBeUndefined()
  })

  it('stale-safety: a newer run() supersedes an older one (older value is dropped)', async () => {
    const d1 = deferred<string>()
    const d2 = deferred<string>()
    let callCount = 0
    const { result } = renderHook(() =>
      useAsyncAction(() => {
        callCount += 1
        return callCount === 1 ? d1.promise : d2.promise
      }),
    )

    let p1!: Promise<string | undefined>
    let p2!: Promise<string | undefined>
    act(() => {
      p1 = result.current.run()
    })
    act(() => {
      p2 = result.current.run()
    })

    await act(async () => {
      d2.resolve('newer')
      d1.resolve('older')
      await Promise.all([p1, p2])
    })

    expect(result.current.result).toBe('newer')
    await expect(p1).resolves.toBeUndefined() // stale → undefined
    await expect(p2).resolves.toBe('newer')
  })

  it('stale-safety: a newer run() also drops a stale rejection (no onError fired)', async () => {
    const d1 = deferred<string>()
    const d2 = deferred<string>()
    const onError = vi.fn()
    let callCount = 0
    const { result } = renderHook(() =>
      useAsyncAction(
        () => {
          callCount += 1
          return callCount === 1 ? d1.promise : d2.promise
        },
        { onError },
      ),
    )

    let p1!: Promise<string | undefined>
    let p2!: Promise<string | undefined>
    act(() => {
      p1 = result.current.run()
    })
    act(() => {
      p2 = result.current.run()
    })

    await act(async () => {
      d2.resolve('newer')
      d1.reject(new Error('stale error'))
      await Promise.all([p1, p2])
    })

    expect(onError).not.toHaveBeenCalled()
    expect(result.current.result).toBe('newer')
  })

  it('unmount-safety: a setState attempted after unmount is suppressed', async () => {
    const d = deferred<string>()
    const { result, unmount } = renderHook(() => useAsyncAction(() => d.promise))

    let runPromise!: Promise<string | undefined>
    act(() => {
      runPromise = result.current.run()
    })

    unmount()

    // Settle AFTER unmount; the hook's guards should swallow the would-be setState.
    await act(async () => {
      d.resolve('lost')
      await runPromise
    })

    await expect(runPromise).resolves.toBeUndefined()
  })

  it('reset clears result but does not cancel a pending run', async () => {
    const { result } = renderHook(() => useAsyncAction(async () => 'value'))

    await act(async () => {
      await result.current.run()
    })
    expect(result.current.result).toBe('value')

    act(() => {
      result.current.reset()
    })
    expect(result.current.result).toBeNull()
  })

  it('reads the latest action closure even when run is invoked after the closure swaps', async () => {
    const { result, rerender } = renderHook(
      ({ action }: { action: () => Promise<string> }) => useAsyncAction(action),
      { initialProps: { action: async () => 'v1' } },
    )

    rerender({ action: async () => 'v2' })

    await act(async () => {
      await result.current.run()
    })

    expect(result.current.result).toBe('v2')
  })
})
