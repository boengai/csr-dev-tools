import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

import type { CompVariant, SidebarToolItemProps } from '@/types'

import { ROUTE_PATH } from '@/constants'
import { useSidebarStore } from '@/hooks'
import { tv } from '@/utils'

type SidebarToolItemVariants = {
  active: boolean
}

const sidebarToolItemVariants: CompVariant<SidebarToolItemVariants> = tv({
  base: 'flex w-full cursor-pointer items-center gap-2 rounded-l border-r-2 border-r-transparent py-2 pl-3 text-gray-300 transition-colors',
  defaultVariants: {
    active: false,
  },
  variants: {
    active: {
      false: 'hover:bg-primary/10 hover:text-white',
      true: 'border-r-primary bg-primary/[0.08] text-primary-light',
    },
  },
})

export const SidebarToolItem = ({ emoji, isActive = false, name, toolKey }: SidebarToolItemProps) => {
  const close = useSidebarStore((state) => state.close)
  const navigate = useNavigate()

  const handleClick = useCallback(() => {
    navigate({ to: `${ROUTE_PATH.TOOL}/${toolKey}` })
    close()
  }, [close, navigate, toolKey])

  return (
    <button className={sidebarToolItemVariants({ active: isActive })} onClick={handleClick} type="button">
      <span className="shrink-0">{emoji}</span>
      <span className="truncate">{name}</span>
    </button>
  )
}
