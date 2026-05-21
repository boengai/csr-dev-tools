import type { ReactNode } from 'react'

export type DisclosurePanelPadding = 'none' | 'md'

export type DisclosurePanelProps = {
  children: ReactNode
  label: string
  padding?: DisclosurePanelPadding
}
