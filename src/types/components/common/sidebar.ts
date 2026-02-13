import type { ReactNode } from 'react'

export type SidebarCategoryProps = {
  categoryName: string
  children: ReactNode
}

export type SidebarToolItemProps = {
  emoji: string
  isActive?: boolean
  name: string
  toolKey: string
}
