import { useCallback, useState } from 'react'

import { CodecShell, CheckboxInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { CodecMode, EscapedJsonConvertMode, ToolComponentProps } from '@/types'
import { parseStringifiedJson, stringifyJson } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['escaped-json-stringifier']

const MODES: [CodecMode<EscapedJsonConvertMode>, CodecMode<EscapedJsonConvertMode>] = [
  {
    key: 'stringify',
    label: 'Stringify JSON',
    resultLabel: 'Escaped Output',
    resultPlaceholder: 'Paste JSON to escape it as a string',
    sourceFormat: 'json',
    sourceLabel: 'JSON Input',
    sourcePlaceholder: '{"name":"John","age":30}',
  },
  {
    key: 'parse',
    label: 'Parse Escaped JSON',
    resultLabel: 'Parsed JSON',
    resultPlaceholder: 'Paste an escaped JSON string to parse it',
    sourceLabel: 'Escaped String Input',
    sourcePlaceholder: '{\\"name\\":\\"John\\",\\"age\\":30}',
  },
]

export const EscapedJsonStringifier = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const [doubleEscape, setDoubleEscape] = useState(false)

  const compute = useCallback(
    async ({ mode, source }: { mode: EscapedJsonConvertMode; source: string }): Promise<{ output: string }> => {
      const output = mode === 'stringify' ? stringifyJson(source, doubleEscape) : parseStringifiedJson(source)
      return { output }
    },
    [doubleEscape],
  )

  return (
    <CodecShell
      autoOpen={autoOpen}
      compute={compute}
      description={toolEntry?.description}
      initialResult={{ output: '' }}
      modeStorageKey="escaped-json"
      modes={MODES}
      onAfterClose={onAfterClose}
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
