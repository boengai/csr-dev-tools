import { CopyButton } from '@/components/common/button'
import type { InlineLabeledRowProps } from '@/types'

export const InlineLabeledRow = ({ label, value, displayValue }: InlineLabeledRowProps) => {
  const display = displayValue ?? value
  if (display === '') return null

  return (
    <div className="flex items-center justify-between gap-2 rounded border border-gray-800 bg-gray-950 px-3 py-2">
      <span className="text-body-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-1">
        <span className="font-mono text-body-xs text-gray-200">{display}</span>
        {value !== '' && <CopyButton label={label} value={value} />}
      </div>
    </div>
  )
}
