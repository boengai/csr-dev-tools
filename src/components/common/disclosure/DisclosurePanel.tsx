import { AnimatePresence, m } from 'motion/react'
import { useId, useState } from 'react'

import type { DisclosurePanelProps } from '@/types'
import { tv } from '@/utils'

const panelStyles = tv({
  base: 'rounded border border-gray-800 bg-gray-950',
  defaultVariants: { padding: 'md' },
  variants: {
    padding: {
      md: 'p-3',
      none: '',
    },
  },
})

const chevronStyles = tv({
  base: 'inline-block transition-transform',
  variants: {
    open: {
      true: 'rotate-90',
      false: '',
    },
  },
})

export const DisclosurePanel = ({ children, label, padding = 'md' }: DisclosurePanelProps) => {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div className="flex flex-col gap-2">
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="relative flex cursor-pointer items-center gap-2 text-body-xs text-gray-400 before:absolute before:inset-x-0 before:inset-y-[-8px] before:content-[''] hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span className={chevronStyles({ open })}>▶</span>
        {label}
      </button>

      <div id={panelId}>
        <AnimatePresence>
          {open && (
            <m.div
              animate={{ height: 'auto', opacity: 1 }}
              className="overflow-hidden"
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={panelStyles({ padding })}>{children}</div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
