import { useEffect, useState } from 'react'

/**
 * Subscribes to a CSS media query and returns its current match state.
 * See CONTEXT.md → "useMediaQuery" for the three invariants:
 *
 *   1. SSR-safe initial — the lazy initializer reads `window.matchMedia(query).matches`
 *      synchronously when `window` exists, so the first render already has the right
 *      boolean (no flash between hydration and the first effect tick). Without `window`
 *      (Vite prerender, SSR, tests), it returns `ssrDefault`.
 *   2. Subscription with cleanup — listens for `change` events and removes the listener
 *      on unmount or when `query` changes.
 *   3. Reactive to query changes — the effect re-runs if the query string itself
 *      changes (rare in practice, but the contract supports it).
 *
 * The `ssrDefault` parameter picks which boolean the prerender output assumes.
 * Adopters whose layout differs by viewport pick the *desktop* default
 * (`<DbDiagram>` passes `true` for `(min-width: 48rem)` — desktop layout during
 * prerender, matches the modal hydration path). Adopters whose mobile-only class
 * is purely additive (`<Sidebar>`'s `(max-width: 767px)` mobile width class)
 * keep the default `false`.
 */
export function useMediaQuery(query: string, ssrDefault: boolean = false): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return ssrDefault
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}
