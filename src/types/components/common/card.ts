import type { PropsWithChildren } from 'react'

export type CardProps = PropsWithChildren<{
  onClose?: () => void
  title: string
}>
