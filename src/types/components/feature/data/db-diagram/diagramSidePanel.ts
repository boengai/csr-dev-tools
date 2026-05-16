import type { ReactNode } from 'react'

export type DiagramSidePanelSize = 'default' | 'wide'

export type DiagramSidePanelProps = {
  title: string
  onClose: () => void
  controls?: ReactNode
  children: ReactNode
  footer: ReactNode
  size?: DiagramSidePanelSize
  testId?: string
}
