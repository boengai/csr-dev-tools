import { motion } from 'motion/react'

import type { CompVariant, OutputDisplayProps, OutputDisplayVariants } from '@/types'

import { tv } from '@/utils'

import { CopyButton } from '../button'

const HIGHLIGHT_COLOR = 'oklch(0.55 0.22 310 / 0.15)'

export const outputDisplayVariants: CompVariant<OutputDisplayVariants> = tv({
  base: 'relative w-full rounded-md',
  defaultVariants: {
    variant: 'single',
  },
  variants: {
    variant: {
      code: 'text-body-sm overflow-x-auto bg-gray-900 p-4 font-mono',
      single: 'flex items-center justify-between gap-2',
      table: 'flex flex-col gap-1',
    },
  },
})

const SingleOutput = ({ emptyText = '\u2014', label, value }: OutputDisplayProps) => {
  const displayValue = value || emptyText
  const isEmpty = !value

  return (
    <div aria-label={label} aria-live="polite" className={outputDisplayVariants({ variant: 'single' })}>
      <motion.span
        key={displayValue}
        animate={{ backgroundColor: isEmpty ? 'transparent' : [HIGHLIGHT_COLOR, 'transparent'] }}
        className="text-body-sm min-w-0 flex-1 truncate rounded-sm px-1 font-mono"
        transition={{ duration: 0.2 }}
      >
        {displayValue}
      </motion.span>
      <CopyButton label={label} value={value ?? ''} variant="icon-only" />
    </div>
  )
}

const TableOutput = ({ emptyText = '\u2014', entries, label }: OutputDisplayProps) => {
  const hasEntries = entries && entries.length > 0
  const tableKey = hasEntries ? entries.map((e) => e.value).join(',') : 'empty'

  return (
    <div aria-label={label} aria-live="polite" className={outputDisplayVariants({ variant: 'table' })}>
      {hasEntries ? (
        <motion.div
          key={tableKey}
          animate={{ backgroundColor: [HIGHLIGHT_COLOR, 'transparent'] }}
          className="flex flex-col gap-1 rounded-sm"
          transition={{ duration: 0.2 }}
        >
          {entries.map((entry) => (
            <div key={entry.key} className="flex items-center justify-between gap-2 px-1 py-0.5">
              <span className="text-body-xs shrink-0 text-gray-400">{entry.key}</span>
              <span className="text-body-sm min-w-0 flex-1 truncate text-right font-mono">
                {entry.value || emptyText}
              </span>
              <CopyButton label={entry.key} value={entry.value} variant="icon-only" />
            </div>
          ))}
        </motion.div>
      ) : (
        <span className="text-body-sm px-1 text-gray-400">{emptyText}</span>
      )}
    </div>
  )
}

const CodeOutput = ({ emptyText = '\u2014', label, value }: OutputDisplayProps) => {
  const displayValue = value || emptyText

  return (
    <div aria-label={label} aria-live="polite" className={outputDisplayVariants({ variant: 'code' })}>
      <div className="absolute top-2 right-2">
        <CopyButton label={label} value={value ?? ''} variant="icon-only" />
      </div>
      <motion.pre
        key={displayValue}
        animate={{ backgroundColor: value ? [HIGHLIGHT_COLOR, 'transparent'] : 'transparent' }}
        className="rounded-sm"
        transition={{ duration: 0.2 }}
      >
        <code>{displayValue}</code>
      </motion.pre>
    </div>
  )
}

export const OutputDisplay = ({ variant = 'single', ...props }: OutputDisplayProps) => {
  switch (variant) {
    case 'code':
      return <CodeOutput {...props} variant="code" />
    case 'table':
      return <TableOutput {...props} variant="table" />
    case 'single':
    default:
      return <SingleOutput {...props} variant="single" />
  }
}
