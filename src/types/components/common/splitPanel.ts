import type { ReactNode } from 'react'

export type PaneGap = 'sm' | 'md' | 'lg'

export type PaneAlign = 'start' | 'center'

export type PaneJustify = 'start' | 'center'

export type PaneProps = {
  align?: PaneAlign
  children: ReactNode
  /** Inner stack gap. `sm` = `gap-2` (default), `md` = `gap-3`, `lg` = `gap-4`. */
  gap?: PaneGap
  /** Main-axis (vertical) alignment of children. */
  justify?: PaneJustify
  /** Sets `aria-live="polite"`. Pick this for the result pane. */
  live?: boolean
  scroll?: boolean
}

export type SplitPanelProps = {
  children: ReactNode
}
