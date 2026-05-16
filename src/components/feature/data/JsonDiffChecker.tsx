import { DiffCheckerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { JsonDiffResult, ToolComponentProps } from '@/types'
import { computeSideBySideDiff, createUnifiedDiff, getJsonDiffError, normalizeJson } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-diff-checker']

const INITIAL_RESULT: JsonDiffResult = { rows: [], unifiedDiff: '', validationError: '' }

export const JsonDiffChecker = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  return (
    <DiffCheckerShell<JsonDiffResult>
      autoOpen={autoOpen}
      compute={async ({ original, modified }) => {
        const origError = await getJsonDiffError(original, 'Original')
        const modError = await getJsonDiffError(modified, 'Modified')
        if (origError || modError) {
          return { rows: [], unifiedDiff: '', validationError: (origError ?? modError) as string }
        }

        const normalizedOrig = original.trim().length === 0 ? '' : await normalizeJson(original)
        const normalizedMod = modified.trim().length === 0 ? '' : await normalizeJson(modified)

        const [sideBySide, patch] = await Promise.all([
          computeSideBySideDiff(normalizedOrig, normalizedMod),
          createUnifiedDiff(normalizedOrig, normalizedMod),
        ])
        return { rows: sideBySide, unifiedDiff: patch, validationError: '' }
      }}
      description={toolEntry?.description}
      errorLabel="Unable to compute JSON diff"
      initialResult={INITIAL_RESULT}
      modifiedPlaceholder='{"key": "paste JSON here..."}'
      onAfterDialogClose={onAfterDialogClose}
      originalPlaceholder='{"key": "paste JSON here..."}'
      renderBanner={(result) =>
        result.validationError ? (
          <p className="text-body-sm text-error" role="alert">
            {result.validationError}
          </p>
        ) : null
      }
      storageKey="csr-dev-tools-json-diff"
      title="JSON Diff Checker"
    />
  )
}
