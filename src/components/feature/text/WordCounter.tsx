import { useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { TextStats } from '@/utils/word-counter'

import { Button, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback } from '@/hooks'
import { countTextStats } from '@/utils/word-counter'

const toolEntry = TOOL_REGISTRY_MAP['word-counter']

const EMPTY_STATS: TextStats = {
  characters: 0,
  charactersNoSpaces: 0,
  lines: 0,
  paragraphs: 0,
  readingTime: '< 1 min',
  sentences: 0,
  speakingTime: '< 1 min',
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
  const [source, setSource] = useState('')
  const [stats, setStats] = useState<TextStats>(EMPTY_STATS)
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)

  const processInput = useDebounceCallback((val: string) => {
    setStats(val.length === 0 ? EMPTY_STATS : countTextStats(val))
  }, 300)

  const handleSourceChange = (val: string) => {
    setSource(val)
    processInput(val)
  }

  const handleReset = () => {
    setSource('')
    setStats(EMPTY_STATS)
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Count Words
          </Button>
        </div>
      </div>
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={onAfterDialogClose ?? handleReset}
        size="screen"
        title="Word Counter"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label="Text"
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder="Enter or paste your text here..."
                rows={12}
                type="textarea"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2">
              <span className="text-body-sm font-medium text-gray-400">Statistics</span>
              <div className="grid grid-cols-2 gap-3">
                {STAT_LABELS.map((item) => (
                  <div className="flex flex-col gap-1 rounded-lg border border-gray-800 bg-gray-950 p-3" key={item.key}>
                    <span className="text-body-xs text-gray-500">{item.label}</span>
                    <span className="text-body-md font-semibold text-gray-200">{String(stats[item.key])}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
