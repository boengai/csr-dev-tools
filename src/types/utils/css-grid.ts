export type GridJustifyItems = 'center' | 'end' | 'start' | 'stretch'

export type GridAlignItems = 'center' | 'end' | 'start' | 'stretch'

export type GridContainerProps = {
  alignItems: GridAlignItems
  columns: string
  gap: number
  justifyItems: GridJustifyItems
  rows: string
}
