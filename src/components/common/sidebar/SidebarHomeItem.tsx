import { Link } from '@tanstack/react-router'

import { ROUTE_PATH } from '@/constants'

import { sidebarItemClassName, sidebarLinkActiveOptions, useCloseSidebarOnNavigate } from './SidebarToolItem'

export const SidebarHomeItem = () => {
  const handleClick = useCloseSidebarOnNavigate()

  return (
    <Link
      activeOptions={sidebarLinkActiveOptions}
      className={sidebarItemClassName}
      onClick={handleClick}
      to={ROUTE_PATH.HOME}
    >
      <span aria-hidden="true" className="shrink-0">
        🏠
      </span>
      <span className="truncate">Home</span>
    </Link>
  )
}
