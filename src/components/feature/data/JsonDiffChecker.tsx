import { ComparatorShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { DiffOutput, ToolComponentProps } from '@/types'
import { computeSideBySideDiff, createUnifiedDiff, getJsonDiffError, normalizeJson } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-diff-checker']

const INITIAL_RESULT: DiffOutput = { rows: [], unifiedDiff: '' }

export const JsonDiffChecker = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  return (
    <ComparatorShell<DiffOutput>
      autoOpen={autoOpen}
      compute={async ({ original, modified }) => {
        // Invalid JSON is an input error, not a result field: reject so the
        // shell shows it in the status slot and clears the diff.
        const validationError =
          (await getJsonDiffError(original, 'Original')) ?? (await getJsonDiffError(modified, 'Modified'))
        if (validationError) throw new Error(validationError)

        const normalizedOrig = original.trim().length === 0 ? '' : await normalizeJson(original)
        const normalizedMod = modified.trim().length === 0 ? '' : await normalizeJson(modified)

        const [sideBySide, patch] = await Promise.all([
          computeSideBySideDiff(normalizedOrig, normalizedMod),
          createUnifiedDiff(normalizedOrig, normalizedMod),
        ])
        return { rows: sideBySide, unifiedDiff: patch }
      }}
      description={toolEntry?.description}
      errorFallback="Unable to compute JSON diff"
      initialResult={INITIAL_RESULT}
      modifiedPlaceholder='{"key": "paste JSON here..."}'
      onAfterClose={onAfterClose}
      originalPlaceholder='{"key": "paste JSON here..."}'
      storageKey="csr-dev-tools-json-diff"
      title="JSON Diff Checker"
    />
  )
}
