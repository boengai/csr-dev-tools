import { TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { TextStats, ToolComponentProps } from '@/types'
import { countTextStats } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['word-counter']

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

const INITIAL: { source: string } = { source: '' }

export const WordCounter = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <TransformerShell<{ source: string }, 'fields'>
    autoOpen={autoOpen}
    compute={({ source }) => {
      const stats = countTextStats(source)
      // Counts are read, not pasted elsewhere: no Copy per row.
      return STAT_LABELS.map(({ key, label }) => ({ copy: false, label, value: String(stats[key]) }))
    }}
    description={toolEntry?.description}
    initial={INITIAL}
    onAfterClose={onAfterClose}
    outputKind="fields"
    resultLabel="Statistics"
    resultPlaceholder="Enter or paste text to count its words"
    sourceKind="textarea"
    sourceLabel="Text"
    sourcePlaceholder="Enter or paste your text here..."
    storageKey="csr-dev-tools-word-counter"
    title="Word Counter"
    triggerLabel="Count Words"
  />
)
