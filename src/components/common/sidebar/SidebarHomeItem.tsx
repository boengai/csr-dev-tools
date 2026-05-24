import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

import { ROUTE_PATH } from '@/constants'
import { useSidebarStore } from '@/hooks'

import { sidebarItemVariants } from './SidebarToolItem'

export const SidebarHomeItem = ({ isActive = false }: { isActive?: boolean }) => {
  const close = useSidebarStore((state) => state.close)
  const navigate = useNavigate()

  const handleClick = useCallback(() => {
    navigate({ to: ROUTE_PATH.HOME })
    close()
  }, [close, navigate])

  return (
    <button className={sidebarItemVariants({ active: isActive })} onClick={handleClick} type="button">
      <span aria-hidden="true" className="shrink-0">
        🏠
      </span>
      <span className="truncate">Home</span>
    </button>
  )
}
