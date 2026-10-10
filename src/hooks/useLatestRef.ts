import { useInsertionEffect, useRef } from 'react'
import type { RefObject } from 'react'

/**
 * "Latest value" ref: `ref.current` always holds the `value` from the most
 * recently committed render, for reading inside handlers, timers and effects
 * without re-subscribing when the value's identity changes.
 *
 * The write happens in `useInsertionEffect` — during commit, before any
 * layout or passive effect (in this component or its children) runs — rather
 * than during render. A render-time write could leak a value from a render
 * React later discards (concurrent rendering), which is what the
 * `react/refs` lint guards against. Never read `ref.current` during render.
 */
export function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef(value)
  useInsertionEffect(() => {
    ref.current = value
  })
  return ref
}
