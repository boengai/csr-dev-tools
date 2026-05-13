import { useCallback, useState } from 'react'

import { BidirectionalConverter, SelectInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ConverterMode, EntityMode, HtmlEntityConvertMode, ToolComponentProps } from '@/types'
import { decodeHtmlEntities, encodeHtmlEntities } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['html-entity-converter']

const MODES: [ConverterMode<HtmlEntityConvertMode>, ConverterMode<HtmlEntityConvertMode>] = [
  {
    key: 'encode',
    label: 'Encode HTML Entities',
    resultLabel: 'Encoded Output',
    resultPlaceholder: '&lt;div class=&quot;hello&quot;&gt;&amp;copy; 2024&lt;/div&gt;',
    sourceLabel: 'Text Input',
    sourcePlaceholder: '<div class="hello">&copy; 2024</div>',
  },
  {
    key: 'decode',
    label: 'Decode HTML Entities',
    resultLabel: 'Decoded Output',
    resultPlaceholder: '<div>&copy; 2024</div>',
    sourceLabel: 'HTML Entity Input',
    sourcePlaceholder: '&lt;div&gt;&amp;copy; 2024&lt;/div&gt;',
  },
]

const ENTITY_MODE_OPTIONS = [
  { label: 'Named Entities', value: 'named' },
  { label: 'Numeric Entities', value: 'numeric' },
]

export const HtmlEntityConverter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [entityMode, setEntityMode] = useState<EntityMode>('named')

  const compute = useCallback(
    async ({ mode, source }: { mode: HtmlEntityConvertMode; source: string }): Promise<string> =>
      mode === 'encode' ? encodeHtmlEntities(source, entityMode) : decodeHtmlEntities(source),
    [entityMode],
  )

  return (
    <BidirectionalConverter
      autoOpen={autoOpen}
      compute={compute}
      description={toolEntry?.description}
      modeStorageKey="html-entity"
      modes={MODES}
      onAfterDialogClose={onAfterDialogClose}
      sourceKeyPrefix="html-entity"
      sourceToolbarSlot={({ mode, recompute }) =>
        mode === 'encode' ? (
          <SelectInput
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
