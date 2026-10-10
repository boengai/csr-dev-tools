import { useCallback, useSyncExternalStore } from 'react'

/**
 * Subscribes to a CSS media query and returns its current match state.
 * See CONTEXT.md → "useMediaQuery" for the three invariants:
 *
 *   1. SSR-safe initial — `useSyncExternalStore`'s client snapshot reads
 *      `window.matchMedia(query).matches` synchronously, so the first render already has
 *      the right boolean (no flash before a first effect tick). Without `window` /
 *      `matchMedia` (Vite prerender, SSR, tests), the snapshot is `ssrDefault`.
 *   2. Subscription with cleanup — listens for `change` events and removes the listener
 *      on unmount or when `query` changes.
 *   3. Reactive to query changes — a new query string re-subscribes and re-reads the
 *      snapshot (rare in practice, but the contract supports it).
 *
 * The `ssrDefault` parameter picks which boolean the prerender output assumes.
 * Adopters whose layout differs by viewport pick the *desktop* default
 * (`<DbDiagram>` passes `true` for `(min-width: 48rem)` — desktop layout during
 * prerender, matches the modal hydration path). Adopters whose mobile-only class
 * is purely additive (`<Sidebar>`'s `(max-width: 767px)` mobile width class)
 * keep the default `false`.
 */
export function useMediaQuery(query: string, ssrDefault: boolean = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!hasMatchMedia()) return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )
  const getSnapshot = () => (hasMatchMedia() ? window.matchMedia(query).matches : ssrDefault)

  return useSyncExternalStore(subscribe, getSnapshot, () => ssrDefault)
}

const hasMatchMedia = (): boolean => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
