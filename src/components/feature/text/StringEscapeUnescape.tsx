import { useCallback, useState } from 'react'

import { CodecShell, SelectInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { CodecMode, EscapeDirection, ToolComponentProps } from '@/types'
import { type EscapeMode, escapeString, unescapeString } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['string-escape-unescape']

const FORMAT_OPTIONS = [
  { label: 'HTML', value: 'html' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'JSON', value: 'json' },
  { label: 'URL', value: 'url' },
  { label: 'XML', value: 'xml' },
]

const MODES: [CodecMode<EscapeDirection>, CodecMode<EscapeDirection>] = [
  {
    key: 'escape',
    label: 'Escape',
    resultLabel: 'Escaped Output',
    resultPlaceholder: 'Enter text to escape it for the selected format',
    sourceLabel: 'Text Input',
    sourcePlaceholder: '<a href="x">Tom & "Jerry"</a>',
  },
  {
    key: 'unescape',
    label: 'Unescape',
    resultLabel: 'Unescaped Output',
    resultPlaceholder: 'Paste escaped text to turn it back into plain text',
    sourceLabel: 'Escaped Input',
    sourcePlaceholder: '&lt;a href=&quot;x&quot;&gt;Tom &amp; &quot;Jerry&quot;&lt;/a&gt;',
  },
]

export const StringEscapeUnescape = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const [format, setFormat] = useState<EscapeMode>('html')

  const compute = useCallback(
    async ({ mode, source }: { mode: EscapeDirection; source: string }): Promise<{ output: string }> => {
      try {
        return { output: mode === 'escape' ? escapeString(source, format) : unescapeString(source, format) }
      } catch {
        throw new Error(`Unable to ${mode} — input contains invalid sequences`)
      }
    },
    [format],
  )

  return (
    <CodecShell<EscapeDirection>
      autoOpen={autoOpen}
      compute={compute}
      description={toolEntry?.description}
      initialResult={{ output: '' }}
      modeStorageKey="string-escape-unescape"
      modes={MODES}
      onAfterClose={onAfterClose}
      sourceKeyPrefix="string-escape"
      sourceToolbarSlot={({ recompute }) => (
        <SelectInput
          aria-label="Escape format"
          name="escape-format-select"
          onChange={(val) => {
            setFormat(val as EscapeMode)
            recompute()
          }}
          options={FORMAT_OPTIONS}
          value={format}
        />
      )}
    />
  )
}
