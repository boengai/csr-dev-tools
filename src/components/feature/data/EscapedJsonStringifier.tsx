import { useCallback, useState } from 'react'

import { BidirectionalConverter, CheckboxInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ConverterMode, EscapedJsonConvertMode, ToolComponentProps } from '@/types'
import { parseStringifiedJson, stringifyJson } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['escaped-json-stringifier']

const MODES: [ConverterMode<EscapedJsonConvertMode>, ConverterMode<EscapedJsonConvertMode>] = [
  {
    key: 'stringify',
    label: 'Stringify JSON',
    resultLabel: 'Escaped Output',
    resultPlaceholder: '{\\"name\\":\\"John\\",\\"age\\":30}',
    sourceLabel: 'JSON Input',
    sourcePlaceholder: '{"name":"John","age":30}',
  },
  {
    key: 'parse',
    label: 'Parse Escaped JSON',
    resultLabel: 'Parsed JSON',
    resultPlaceholder: '{\n  "name": "John"\n}',
    sourceLabel: 'Escaped String Input',
    sourcePlaceholder: '{\\"name\\":\\"John\\",\\"age\\":30}',
  },
]

export const EscapedJsonStringifier = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [doubleEscape, setDoubleEscape] = useState(false)

  const compute = useCallback(
    async ({ mode, source }: { mode: EscapedJsonConvertMode; source: string }): Promise<string> =>
      mode === 'stringify' ? stringifyJson(source, doubleEscape) : parseStringifiedJson(source),
    [doubleEscape],
  )

  return (
    <BidirectionalConverter
      autoOpen={autoOpen}
      compute={compute}
      description={toolEntry?.description}
      modeStorageKey="escaped-json"
      modes={MODES}
      onAfterDialogClose={onAfterDialogClose}
      sourceKeyPrefix="escaped-json"
      sourceToolbarSlot={({ mode, recompute }) =>
        mode === 'stringify' ? (
          <div className="flex items-center gap-4">
            <label
              className="flex cursor-pointer items-center gap-2 text-body-xs text-gray-400"
              htmlFor="double-escape"
            >
              <CheckboxInput
                checked={doubleEscape}
                id="double-escape"
                onChange={() => {
                  setDoubleEscape((v) => !v)
                  recompute()
                }}
              />
              Double Escape
            </label>
          </div>
        ) : null
      }
    />
  )
}
