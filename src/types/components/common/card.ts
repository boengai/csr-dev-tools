import type { PropsWithChildren } from 'react'

export type CardProps = PropsWithChildren<{
  /** When provided, renders a close button in the card header. Omit to hide it entirely. */
  onClose?: () => void
  title: string
}>
