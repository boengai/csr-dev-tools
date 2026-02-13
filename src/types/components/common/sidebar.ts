import type { ReactNode } from 'react'

export type CategoryBadgeProps = {
  count: number
}

export type SidebarCategoryProps = {
  categoryName: string
  children: ReactNode
  defaultExpanded?: boolean
  toolCount: number
}

export type SidebarToolItemProps = {
  emoji: string
  isActive?: boolean
  name: string
  toolKey: string
}
