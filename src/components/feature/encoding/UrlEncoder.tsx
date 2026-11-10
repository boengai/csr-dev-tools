import { useCallback } from 'react'

import { CodecShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { CodecMode, ToolComponentProps, UrlMode } from '@/types'

const toolEntry = TOOL_REGISTRY_MAP['url-encoder-decoder']

const MODES: [CodecMode<UrlMode>, CodecMode<UrlMode>] = [
  {
    key: 'encode',
    label: 'URL Encode',
    resultLabel: 'Result',
    resultPlaceholder: 'Enter text to URL-encode it',
    sourceLabel: 'Source',
    sourcePlaceholder: 'hello world&foo=bar',
  },
  {
    key: 'decode',
    label: 'URL Decode',
    resultLabel: 'Result',
    resultPlaceholder: 'Paste URL-encoded text to decode it',
    sourceLabel: 'Source',
    sourcePlaceholder: 'hello%20world%26foo%3Dbar',
  },
]

export const UrlEncoder = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const compute = useCallback(
    async ({ mode, source }: { mode: UrlMode; source: string }): Promise<{ output: string }> => {
      try {
        const output = mode === 'encode' ? encodeURIComponent(source) : decodeURIComponent(source)
        return { output }
      } catch {
        throw new Error(
          mode === 'encode'
            ? 'Unable to encode text — input contains invalid characters'
            : 'Enter a valid URL-encoded string (e.g., hello%20world)',
        )
      }
    },
    [],
  )

  return (
    <CodecShell
      autoOpen={autoOpen}
      compute={compute}
      description={toolEntry?.description}
      initialResult={{ output: '' }}
      modeStorageKey="url-encoder"
      modes={MODES}
      onAfterClose={onAfterClose}
      sourceKeyPrefix="url-encoder"
    />
  )
}
