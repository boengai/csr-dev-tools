import type { SortMode } from '@/types'

export type TextSortInput = {
  removeDuplicates: boolean
  removeEmpty: boolean
  sortMode: SortMode
  /** One item per line. */
  source: string
  trimLines: boolean
}
