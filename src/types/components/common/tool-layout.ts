import type { ReactNode } from 'react'

export type ToolLayoutMode = 'card' | 'page'

export type ToolLayoutProps = {
  actions?: ReactNode
  description: string
  error?: null | string
  input: ReactNode
  mode: ToolLayoutMode
  output?: ReactNode
  title: string
}

export type ToolLayoutVariants = {
  mode: ToolLayoutMode
}
