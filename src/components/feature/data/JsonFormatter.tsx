import { FormatterShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ToolComponentProps } from '@/types'
import { formatJson } from '@/utils'
import { narrateParseError } from '@/utils/parse-error-narrators'

const toolEntry = TOOL_REGISTRY_MAP['json-formatter']

const INITIAL: { source: string } = { source: '' }

export const JsonFormatter = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  return (
    <FormatterShell<{ source: string }>
      autoOpen={autoOpen}
      compute={async ({ source }) => {
        const narrated = await narrateParseError('json', source)
        if (narrated != null) throw new Error(narrated)
        try {
          return await formatJson(source)
        } catch {
          throw new Error('Unable to format JSON')
        }
      }}
      description={toolEntry?.description}
      initial={INITIAL}
      onAfterClose={onAfterClose}
      renderBanner={(error) =>
        error instanceof Error ? (
          <p className="text-body-sm text-error" role="alert">
            {error.message}
          </p>
        ) : null
      }
      resultLabel="Formatted JSON"
      resultPlaceholder={'{\n  "name": "John",\n  "age": 30,\n  "tags": [\n    "dev",\n    "tools"\n  ]\n}'}
      sourceLabel="JSON Input"
      sourcePlaceholder='{"name":"John","age":30,"tags":["dev","tools"]}'
      storageKey="csr-dev-tools-json-formatter"
      title="JSON Formatter"
      triggerLabel="Format"
    />
  )
}
