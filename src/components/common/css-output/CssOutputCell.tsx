import { CopyButton } from '@/components/common/button/CopyButton'
import { tv } from '@/utils'

type CssOutputCellSize = 'compact' | 'default'

type CssOutputCellProps = {
  copyLabel: string
  value: string
  size?: CssOutputCellSize
  scrollable?: boolean
}

const labelStyles = tv({
  base: 'font-medium text-gray-400',
  variants: {
    size: {
      compact: 'text-body-xs',
      default: 'text-body-sm',
    },
  },
})

const preStyles = tv({
  base: 'rounded-lg border border-gray-800 bg-gray-950 p-3 font-mono text-gray-300 whitespace-pre-wrap',
  variants: {
    size: {
      compact: 'text-body-xs',
      default: 'text-sm',
    },
  },
})

export const CssOutputCell = ({ copyLabel, value, size = 'default', scrollable }: CssOutputCellProps) => {
  const label = size === 'compact' ? 'CSS' : 'CSS Output'
  const pre = <pre className={preStyles({ size })}>{value}</pre>

  return (
    <div aria-live="polite" className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={labelStyles({ size })}>{label}</span>
        <CopyButton label={copyLabel} value={value} />
      </div>
      {scrollable ? <div className="max-h-64 overflow-auto">{pre}</div> : pre}
    </div>
  )
}
