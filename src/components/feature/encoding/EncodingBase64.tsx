import { useCallback } from 'react'

import { BidirectionalConverter } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ConverterMode, ToolComponentProps } from '@/types'
import { decodeBase64, encodeBase64, isValidBase64 } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['base64-codec']

type Base64Mode = 'encode' | 'decode'

const MODES: [ConverterMode<Base64Mode>, ConverterMode<Base64Mode>] = [
  {
    key: 'encode',
    label: 'Base64 Encode',
    resultLabel: 'Result',
    resultPlaceholder: 'SGVsbG8sIFdvcmxkIQ==',
    sourceLabel: 'Source',
    sourcePlaceholder: 'Hello, World!',
  },
  {
    key: 'decode',
    label: 'Base64 Decode',
    resultLabel: 'Result',
    resultPlaceholder: 'Hello, World!',
    sourceLabel: 'Source',
    sourcePlaceholder: 'SGVsbG8sIFdvcmxkIQ==',
  },
]

export const EncodingBase64 = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const compute = useCallback(
    async ({ mode, source }: { mode: Base64Mode; source: string }): Promise<{ output: string }> => {
      try {
        if (mode === 'decode' && !isValidBase64(source)) {
          throw new Error('Enter a valid Base64 string (e.g., SGVsbG8=)')
        }
        const output = mode === 'encode' ? encodeBase64(source) : decodeBase64(source)
        return { output }
      } catch (err) {
        if (err instanceof Error && err.message) throw err
        throw new Error(
          mode === 'encode'
            ? 'Unable to encode text — input contains invalid characters'
            : 'Enter a valid Base64 string (e.g., SGVsbG8=)',
        )
      }
    },
    [],
  )

  return (
    <BidirectionalConverter
      autoOpen={autoOpen}
      compute={compute}
      description={toolEntry?.description}
      initialResult={{ output: '' }}
      modeStorageKey="base64"
      modes={MODES}
      onAfterClose={onAfterClose}
      sourceKeyPrefix="base64"
    />
  )
}
