import type { ReactNode } from 'react'

export type SidebarCategoryProps = {
  categoryName: string
  children: ReactNode
}

export type SidebarToolItemProps = {
  emoji: string
  name: string
  routePath: string
}
