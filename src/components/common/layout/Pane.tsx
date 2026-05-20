import type { PaneProps } from '@/types'
import { tv } from '@/utils'

export const paneStyles = tv({
  base: 'flex min-h-0 min-w-0 flex-1 flex-col',
  defaultVariants: {
    align: 'start',
    gap: 'sm',
    justify: 'start',
    scroll: false,
  },
  variants: {
    align: { center: 'items-center', start: '' },
    gap: { lg: 'gap-4', md: 'gap-3', sm: 'gap-2' },
    justify: { center: 'justify-center', start: '' },
    scroll: { false: '', true: 'overflow-y-auto' },
  },
})

export const Pane = ({ align, children, gap, justify, live, scroll }: PaneProps) => (
  <div aria-live={live ? 'polite' : undefined} className={paneStyles({ align, gap, justify, scroll })}>
    {children}
  </div>
)
