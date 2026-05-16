import { useCallback } from 'react'

import { BidirectionalConverter } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ConverterMode, ToolComponentProps } from '@/types'
import { decodeUrl, encodeUrl } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['url-encoder-decoder']

type UrlMode = 'encode' | 'decode'

const MODES: [ConverterMode<UrlMode>, ConverterMode<UrlMode>] = [
  {
    key: 'encode',
    label: 'URL Encode',
    resultLabel: 'Result',
    resultPlaceholder: 'hello%20world%26foo%3Dbar',
    sourceLabel: 'Source',
    sourcePlaceholder: 'hello world&foo=bar',
  },
  {
    key: 'decode',
    label: 'URL Decode',
    resultLabel: 'Result',
    resultPlaceholder: 'hello world&foo=bar',
    sourceLabel: 'Source',
    sourcePlaceholder: 'hello%20world%26foo%3Dbar',
  },
]

export const UrlEncoder = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const compute = useCallback(async ({ mode, source }: { mode: UrlMode; source: string }): Promise<string> => {
    try {
      return mode === 'encode' ? encodeUrl(source) : decodeUrl(source)
    } catch {
      throw new Error(
        mode === 'encode'
          ? 'Unable to encode text — input contains invalid characters'
          : 'Enter a valid URL-encoded string (e.g., hello%20world)',
      )
    }
  }, [])

  return (
    <BidirectionalConverter
      autoOpen={autoOpen}
      compute={compute}
      description={toolEntry?.description}
      modeStorageKey="url-encoder"
      modes={MODES}
      onAfterDialogClose={onAfterDialogClose}
      sourceKeyPrefix="url-encoder"
    />
  )
}
