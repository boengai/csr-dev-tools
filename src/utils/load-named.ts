/**
 * Adapts a dynamic-import loader of a module with a named export to the
 * `{ default: T }` shape `React.lazy` requires.
 *
 * The `import().then(({ Name }) => ({ default: Name }))` ceremony was
 * inlined at 85 sites across `tool-registry.ts` and `App.tsx`. This seam
 * collapses each to:
 *
 *   loadNamed(() => import('@/x/Y'), 'Y')
 *
 * `K extends keyof M` makes the export-name lookup type-checked — a typo
 * fails at typecheck rather than at `React.lazy`'s first render.
 */
export function loadNamed<M extends Record<string, unknown>, K extends keyof M>(
  loader: () => Promise<M>,
  exportName: K,
): () => Promise<{ default: M[K] }> {
  return () => loader().then((m) => ({ default: m[exportName] }))
}
