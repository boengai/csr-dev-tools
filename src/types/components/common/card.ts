import type { PropsWithChildren } from 'react'

export type CardProps = PropsWithChildren<{
  /** When provided, renders a close button in the card header. Omit to hide it entirely. */
  onClose?: () => void
  title: string
  /**
   * `tile` (default): a dashboard tile that lifts and glows on hover.
   * `page`: a Tool's whole page (ADR-0029) — no hover lift, and the title is
   * the page heading (`h1`).
   */
  variant?: 'page' | 'tile'
}>
