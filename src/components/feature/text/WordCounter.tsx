import { FieldForm, Pane, SplitPanel } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolInput } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { countTextStats, type TextStats } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['word-counter']

const EMPTY_STATS: TextStats = {
  characters: 0,
  charactersNoSpaces: 0,
  lines: 0,
  paragraphs: 0,
  readingTime: '0 min',
  sentences: 0,
  speakingTime: '0 min',
  words: 0,
}

const STAT_LABELS: Array<{ key: keyof TextStats; label: string }> = [
  { key: 'characters', label: 'Characters' },
  { key: 'charactersNoSpaces', label: 'Characters (no spaces)' },
  { key: 'words', label: 'Words' },
  { key: 'sentences', label: 'Sentences' },
  { key: 'paragraphs', label: 'Paragraphs' },
  { key: 'lines', label: 'Lines' },
  { key: 'readingTime', label: 'Reading Time' },
  { key: 'speakingTime', label: 'Speaking Time' },
]

export const WordCounter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const {
    input: source,
    result: stats,
    setInput,
    reset,
  } = useToolInput<string, TextStats>({
    compute: (val) => countTextStats(val),
    debounceMs: 300,
    initial: '',
    initialResult: EMPTY_STATS,
    isEmpty: (val) => val.length === 0,
  })

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={reset}
      title="Word Counter"
      triggers={[{ label: 'Count Words' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <SplitPanel>
          <Pane>
            <FieldForm
              label="Text"
              name="dialog-source"
              onChange={setInput}
              placeholder="Enter or paste your text here..."
              rows={12}
              type="textarea"
              value={source}
            />
          </Pane>

          <Pane live>
            <span className="text-body-sm font-medium text-gray-400">Statistics</span>
            <div className="grid grid-cols-2 gap-3">
              {STAT_LABELS.map((item) => (
                <div className="flex flex-col gap-1 rounded-lg border border-gray-800 bg-gray-950 p-3" key={item.key}>
                  <span className="text-body-xs text-gray-500">{item.label}</span>
                  <span className="text-body-md font-semibold text-gray-200">{String(stats[item.key])}</span>
                </div>
              ))}
            </div>
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
