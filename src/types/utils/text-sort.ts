export type SortMode = 'az' | 'length-asc' | 'length-desc' | 'numeric' | 'za'

export type TextSortOptions = {
  removeDuplicates: boolean
  removeEmpty: boolean
  sortMode: SortMode
  trimLines: boolean
}

export type TextSortResult = {
  lineCountAfter: number
  lineCountBefore: number
  output: string
}
