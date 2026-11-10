import { TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { CaseResult, ToolComponentProps } from '@/types'
import {
  toCamelCase,
  toConstantCase,
  toDotCase,
  toKebabCase,
  toLowerCase,
  toPathCase,
  toPascalCase,
  toSentenceCase,
  toSnakeCase,
  toTitleCase,
  toUpperCase,
} from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['text-case-converter']

const CASES: Array<CaseResult> = [
  { fn: toCamelCase, label: 'camelCase' },
  { fn: toPascalCase, label: 'PascalCase' },
  { fn: toSnakeCase, label: 'snake_case' },
  { fn: toKebabCase, label: 'kebab-case' },
  { fn: toConstantCase, label: 'CONSTANT_CASE' },
  { fn: toTitleCase, label: 'Title Case' },
  { fn: toSentenceCase, label: 'Sentence case' },
  { fn: toUpperCase, label: 'UPPERCASE' },
  { fn: toLowerCase, label: 'lowercase' },
  { fn: toDotCase, label: 'dot.case' },
  { fn: toPathCase, label: 'path/case' },
]

const INITIAL: { source: string } = { source: '' }

export const TextCaseConverter = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <TransformerShell<{ source: string }, 'fields'>
    autoOpen={autoOpen}
    compute={({ source }) => CASES.map((c) => ({ label: c.label, value: c.fn(source) }))}
    description={toolEntry?.description}
    initial={INITIAL}
    onAfterClose={onAfterClose}
    outputKind="fields"
    resultLabel="Results"
    resultPlaceholder="Enter text to see it in every case"
    sourceKind="textarea"
    sourceLabel="Source"
    sourcePlaceholder="Enter text to convert..."
    storageKey="csr-dev-tools-text-case-converter"
    title="Text Case Converter"
    triggerLabel="Convert Text Case"
  />
)
