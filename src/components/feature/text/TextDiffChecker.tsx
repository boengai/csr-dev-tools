import { DiffCheckerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { TextDiffResult, ToolComponentProps } from '@/types'
import { computeSideBySideDiff, createUnifiedDiff } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['text-diff-checker']

const INITIAL_RESULT: TextDiffResult = { rows: [], unifiedDiff: '' }

export const TextDiffChecker = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  return (
    <DiffCheckerShell<TextDiffResult>
      autoOpen={autoOpen}
      compute={async ({ original, modified }) => {
        const [sideBySide, patch] = await Promise.all([
          computeSideBySideDiff(original, modified),
          createUnifiedDiff(original, modified),
        ])
        return { rows: sideBySide, unifiedDiff: patch }
      }}
      description={toolEntry?.description}
      errorLabel="Unable to compute diff"
      initialResult={INITIAL_RESULT}
      modifiedPlaceholder="Paste modified text here..."
      onAfterDialogClose={onAfterDialogClose}
      originalPlaceholder="Paste original text here..."
      storageKey="csr-dev-tools-text-diff"
      title="Text Diff Checker"
    />
  )
}
