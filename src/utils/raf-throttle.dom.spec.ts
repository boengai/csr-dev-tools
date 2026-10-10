/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { rafThrottle } from './raf-throttle'

let callbacks: Array<FrameRequestCallback> = []
const flushFrame = () => {
  const pending = callbacks
  callbacks = []
  for (const cb of pending) cb(0)
}

beforeEach(() => {
  callbacks = []
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    callbacks.push(cb)
    return callbacks.length
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('rafThrottle', () => {
  it('runs once per frame with the latest arguments', () => {
    const fn = vi.fn()
    const throttled = rafThrottle(fn)

    throttled(1)
    throttled(2)
    throttled(3)
    expect(window.requestAnimationFrame).toHaveBeenCalledOnce()
    expect(fn).not.toHaveBeenCalled()

    flushFrame()
    expect(fn).toHaveBeenCalledOnce()
    expect(fn).toHaveBeenCalledWith(3)
  })

  it('schedules a new frame after the previous one ran', () => {
    const fn = vi.fn()
    const throttled = rafThrottle(fn)

    throttled('a')
    flushFrame()
    throttled('b')
    flushFrame()

    expect(fn.mock.calls).toEqual([['a'], ['b']])
  })
})
