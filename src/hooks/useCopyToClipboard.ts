import { type UseCopyToClipboard } from '@/types'

export const useCopyToClipboard = (): UseCopyToClipboard => {
  return async (val: string) => {
    await navigator.clipboard.writeText(val)
  }
}
