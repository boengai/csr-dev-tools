import { useEffect, useRef } from 'react'

/**
 * Runs `callback` exactly once after the component mounts — including under
 * React.StrictMode, which double-invokes effects in development. Use this for
 * one-shot mount-time work (e.g., firing a tool's compute pipeline with a
 * persisted input loaded from localStorage).
 *
 * The callback's identity is captured on first run; later changes are ignored.
 */
export function useMountOnce(callback: () => void): void {
  const ranRef = useRef(false)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    callbackRef.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only
  }, [])
}
