import type { SortMode } from '@/types'

export type TextSortInput = {
  input: string
  removeDuplicates: boolean
  removeEmpty: boolean
  sortMode: SortMode
  trimLines: boolean
}
