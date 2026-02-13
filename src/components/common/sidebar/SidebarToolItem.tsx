import { useCallback } from 'react'

import type { CompVariant, SidebarToolItemProps } from '@/types'

import { useSidebarStore } from '@/hooks'
import { tv } from '@/utils'

type SidebarToolItemVariants = {
  active: boolean
}

const sidebarToolItemVariants: CompVariant<SidebarToolItemVariants> = tv({
  base: 'flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-gray-300 transition-colors',
  defaultVariants: {
    active: false,
  },
  variants: {
    active: {
      false: 'hover:bg-primary/10 hover:text-white',
      true: 'border-primary bg-primary/10 border-l-2 text-white',
    },
  },
})

export const SidebarToolItem = ({ emoji, isActive = false, name, toolKey }: SidebarToolItemProps) => {
  const close = useSidebarStore((state) => state.close)

  const handleClick = useCallback(() => {
    const element = document.querySelector(`[data-tool-key="${toolKey}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.classList.add('highlight-pulse')
      setTimeout(() => {
        element.classList.remove('highlight-pulse')
      }, 500)
    }

    // Auto-close on mobile
    if (window.matchMedia('(max-width: 767px)').matches) {
      close()
    }
  }, [close, toolKey])

  return (
    <button className={sidebarToolItemVariants({ active: isActive })} onClick={handleClick} type="button">
      <span>{emoji}</span>
      <span>{name}</span>
    </button>
  )
}
