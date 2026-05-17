import { Children, Fragment } from 'react'

import type { SplitPanelProps } from '@/types'

const DIVIDER = 'border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2'

export const SplitPanel = ({ children }: SplitPanelProps) => {
  const panes = Children.toArray(children)
  return (
    <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
      {panes.map((pane, i) => (
        <Fragment key={i}>
          {i > 0 && <div className={DIVIDER} />}
          {pane}
        </Fragment>
      ))}
    </div>
  )
}
