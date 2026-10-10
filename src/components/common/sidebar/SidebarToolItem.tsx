import { Link } from '@tanstack/react-router'
import type { MouseEvent } from 'react'

import { useSidebarStore } from '@/hooks'
import type { SidebarToolItemProps } from '@/types'

// Active styling keys off the `data-status="active"` TanStack <Link> sets
// (alongside `aria-current="page"`) for the current route.
export const sidebarItemClassName =
  'flex w-full cursor-pointer items-center gap-2 rounded-l border-r-2 border-r-transparent py-2 pl-3 text-gray-300 transition-colors hover:bg-primary/10 hover:text-white data-[status=active]:border-r-primary data-[status=active]:bg-primary/[0.08] data-[status=active]:text-primary-light'

/** Matches the current route exactly, ignoring search params. */
export const sidebarLinkActiveOptions = { exact: true, includeSearch: false } as const

/** Close the drawer on a plain click; leave it open for modified clicks that open a new tab/window. */
export const useCloseSidebarOnNavigate = () => {
  const close = useSidebarStore((state) => state.close)
  return (event: MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    close()
  }
}

export const SidebarToolItem = ({ emoji, name, routePath }: SidebarToolItemProps) => {
  const handleClick = useCloseSidebarOnNavigate()

  return (
    <Link
      activeOptions={sidebarLinkActiveOptions}
      className={sidebarItemClassName}
      onClick={handleClick}
      title={name}
      to={routePath}
    >
      <span className="shrink-0">{emoji}</span>
      <span className="truncate">{name}</span>
    </Link>
  )
}
