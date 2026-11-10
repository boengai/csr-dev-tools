import type { ToolStatusProps } from '@/types'

import { Button } from '../button/Button'
import { ErrorBanner } from './ErrorBanner'

const DEFAULT_ERROR = 'Unable to process this input'

const describeError = (error: unknown, errorLabel?: string, errorFallback?: string): string => {
  if (errorLabel !== undefined) return errorLabel
  if (error instanceof Error && error.message) return error.message
  return errorFallback ?? DEFAULT_ERROR
}

/**
 * The [[Tool status slot]]: one fixed spot, owned by the layout shell, for
 * "why is there no output" (error) and "the output is valid, but…" (notices).
 * The wrapper always renders so the slot's position is part of the layout
 * contract even while empty.
 */
export const ToolStatus = ({ error, errorAction, errorFallback, errorLabel, notices }: ToolStatusProps) => (
  <div className="flex flex-col gap-1 empty:hidden" data-slot="tool-status">
    {error != null ? (
      <>
        <ErrorBanner>{describeError(error, errorLabel, errorFallback)}</ErrorBanner>
        {errorAction && (
          <div className="flex">
            <Button onClick={errorAction.onClick} size="small" variant="warning">
              {errorAction.label}
            </Button>
          </div>
        )}
      </>
    ) : (
      notices?.map((notice) => (
        <ErrorBanner key={notice} variant="notice">
          {notice}
        </ErrorBanner>
      ))
    )}
  </div>
)
