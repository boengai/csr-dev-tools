import type { UseCopyToClipboard } from '@/types'

import { useToast } from './state'

export const useCopyToClipboard = (): UseCopyToClipboard => {
  const showError = useToast((s) => s.showError)
  const showSuccess = useToast((s) => s.showSuccess)

  return async (val: string) => {
    try {
      await navigator.clipboard.writeText(val)
      showSuccess('Copied to clipboard')
    } catch {
      showError('Failed to copy to clipboard')
    }
  }
}
