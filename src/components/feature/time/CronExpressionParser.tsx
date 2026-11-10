import { ToggleButton, TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ToolComponentProps } from '@/types'
import { CRON_PRESETS, parseCron } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['cron-expression-parser']

const INITIAL: { source: string } = { source: '' }

const NEXT_RUN_COUNT = 10

export const CronExpressionParser = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <TransformerShell<{ source: string }, 'fields'>
    autoOpen={autoOpen}
    compute={({ source }) => {
      const result = parseCron(source, NEXT_RUN_COUNT)
      // parseCron returns its error as data; the shell shows thrown errors in the status slot.
      if (!result.valid) throw new Error(result.error ?? 'Invalid cron expression')
      return [
        { label: 'Description', value: result.description },
        // One row, one run per line: Copy takes the whole schedule.
        { label: `Next ${result.nextRuns.length} runs (UTC)`, value: result.nextRuns.join('\n') },
      ]
    }}
    description={toolEntry?.description}
    initial={INITIAL}
    onAfterClose={onAfterClose}
    outputKind="fields"
    renderControls={({ inputs, setFieldsImmediate }) => (
      <div className="flex flex-wrap gap-2">
        {CRON_PRESETS.map((preset) => (
          <ToggleButton
            aria-label={`Use preset: ${preset.label}`}
            key={preset.expression}
            onClick={() => setFieldsImmediate({ source: preset.expression })}
            pressed={inputs.source.trim() === preset.expression}
          >
            {preset.label}
          </ToggleButton>
        ))}
      </div>
    )}
    resultLabel="Schedule"
    resultPlaceholder="Enter a cron expression, or pick a preset, to see when it runs"
    sourceKind="text"
    sourceLabel="Cron Expression"
    sourcePlaceholder="* * * * *"
    storageKey="csr-dev-tools-cron-expression-parser"
    title="Cron Parser"
    triggerLabel="Parse"
  />
)
