import type { FieldListProps } from '@/types'

import { CopyButton } from '../button/CopyButton'

/**
 * A [[Field list]]: label/value rows, each with a Copy button named by its
 * label unless the row sets `copy: false`. Copy takes `copyValue` when set,
 * else the shown value. Values keep their line breaks. The `fields` output
 * of both the Transformer and Generator shells — one look in both; each shell
 * owns the pane label and the empty state around it.
 */
export const FieldList = ({ fields }: FieldListProps) => (
  <dl className="flex min-h-0 grow flex-col gap-3 overflow-y-auto">
    {fields.map((field, index) => (
      // Labels may repeat (several SANs, several JSONPath matches).
      <div className="flex flex-col gap-1" key={`${index}-${field.label}`}>
        <dt className="flex min-h-8 items-center gap-1 text-body-xs font-medium text-gray-500">
          <span>{field.label}</span>
          {field.copy !== false && <CopyButton label={field.label} value={field.copyValue ?? field.value} />}
        </dt>
        <dd className="rounded-sm border border-gray-800 bg-gray-950 p-2 font-mono text-body-sm break-all whitespace-pre-wrap text-gray-200">
          {field.value}
        </dd>
      </div>
    ))}
  </dl>
)
