import type { UseCopyToClipboard } from '@/types'

import { useToast } from './state'

export const useCopyToClipboard = (): UseCopyToClipboard => {
  const toast = useToast()

  return async (val: string) => {
    try {
      await navigator.clipboard.writeText(val)
      toast.toast({ action: 'add', item: { label: 'Copied to clipboard', type: 'success' } })
    } catch {
      toast.toast({ action: 'add', item: { label: 'Failed to copy to clipboard', type: 'error' } })
    }
  }
}
