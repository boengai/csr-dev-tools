import { useEffect, useRef } from 'react'

/**
 * Runs `callback` exactly once after the component mounts — including under
 * React.StrictMode, which double-invokes effects in development. Use this for
 * one-shot mount-time work (e.g., firing a tool's compute pipeline with a
 * persisted input loaded from localStorage).
 *
 * The callback's identity is captured on first run; later changes are ignored.
 *
 * **Timing:** the callback fires one tick after mount (via `setTimeout(0)`),
 * NOT synchronously in the mount effect. This is what makes the hook
 * strict-mode-safe: the deferred call scheduled by the first mount effect is
 * canceled by its cleanup, then re-scheduled by the second mount, and fires
 * after the cleanup-remount cycle settles. Any state mutations the callback
 * makes (e.g. triggering a compute pipeline via `setFieldsImmediate`) will
 * therefore observe the post-remount state, not the soon-to-be-invalidated
 * first-mount state.
 */
export function useMountOnce(callback: () => void): void {
  const ranRef = useRef(false)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (ranRef.current) return
    const id = window.setTimeout(() => {
      if (ranRef.current) return
      ranRef.current = true
      callbackRef.current()
    }, 0)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only
  }, [])
}
