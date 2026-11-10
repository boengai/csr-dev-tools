import { useCallback, useState } from 'react'

import { CodecShell, SelectInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { CodecMode, EntityMode, HtmlEntityConvertMode, ToolComponentProps } from '@/types'
import { decodeHtmlEntities, encodeHtmlEntities } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['html-entity-converter']

const MODES: [CodecMode<HtmlEntityConvertMode>, CodecMode<HtmlEntityConvertMode>] = [
  {
    key: 'encode',
    label: 'Encode HTML Entities',
    resultLabel: 'Encoded Output',
    resultPlaceholder: 'Enter text to encode it as HTML entities',
    sourceLabel: 'Text Input',
    sourcePlaceholder: '<div class="hello">&copy; 2024</div>',
  },
  {
    key: 'decode',
    label: 'Decode HTML Entities',
    resultLabel: 'Decoded Output',
    resultPlaceholder: 'Paste HTML entities to decode them',
    sourceLabel: 'HTML Entity Input',
    sourcePlaceholder: '&lt;div&gt;&amp;copy; 2024&lt;/div&gt;',
  },
]

const ENTITY_MODE_OPTIONS = [
  { label: 'Named Entities', value: 'named' },
  { label: 'Numeric Entities', value: 'numeric' },
]

export const HtmlEntityConverter = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const [entityMode, setEntityMode] = useState<EntityMode>('named')

  const compute = useCallback(
    async ({ mode, source }: { mode: HtmlEntityConvertMode; source: string }): Promise<{ output: string }> => {
      const output = mode === 'encode' ? encodeHtmlEntities(source, entityMode) : decodeHtmlEntities(source)
      return { output }
    },
    [entityMode],
  )

  return (
    <CodecShell
      autoOpen={autoOpen}
      compute={compute}
      description={toolEntry?.description}
      initialResult={{ output: '' }}
      modeStorageKey="html-entity"
      modes={MODES}
      onAfterClose={onAfterClose}
      sourceKeyPrefix="html-entity"
      sourceToolbarSlot={({ mode, recompute }) =>
        mode === 'encode' ? (
          <SelectInput
            aria-label="Entity encoding mode"
            name="entity-mode-select"
            onChange={(val) => {
              setEntityMode(val as EntityMode)
              recompute()
            }}
            options={ENTITY_MODE_OPTIONS}
            value={entityMode}
          />
        ) : null
      }
    />
  )
}
