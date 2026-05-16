import { CopyButton } from '@/components/common/button'
import type { MonoOutputCellProps } from '@/types'

export const MonoOutputCell = ({ copyAriaLabel, label, value }: MonoOutputCellProps) => {
  return (
    <div aria-live="polite" className="flex min-h-0 flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-body-sm font-medium text-gray-400">{label}</span>
        {value && <CopyButton label={copyAriaLabel} value={value} />}
      </div>
      <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
        <span className="text-sm font-mono break-all text-gray-300">{value || '—'}</span>
      </div>
    </div>
  )
}
