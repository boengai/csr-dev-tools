import { type UseCopyToClipboard, type UseToast } from '@/types'

import { useToast } from './state'

export const useCopyToClipboard = (): UseCopyToClipboard => {
  const toast: UseToast = useToast()

  return async (val: string) => {
    await navigator.clipboard.writeText(val)
    toast.toast({ action: 'add', item: { label: 'Copied to clipboard', type: 'success' } })
  }
}
