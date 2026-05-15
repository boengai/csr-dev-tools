import type { MermaidFixSuggestion } from '@/utils'

/**
 * Pipeline result for the Mermaid render. A discriminated union so an `error`
 * and its `fixSuggestion` always travel atomically with the input that
 * produced them — there is no representable state where both an `svg` and an
 * `error` exist for the same compute.
 */
export type MermaidComputeResult =
  | { kind: 'svg'; svg: string }
  | { kind: 'error'; message: string; fixSuggestion: MermaidFixSuggestion | null }
