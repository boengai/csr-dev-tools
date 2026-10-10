export type CssOutputCellSize = 'compact' | 'default'

export type CssOutputCellProps = {
  copyLabel: string
  value: string
  size?: CssOutputCellSize
  scrollable?: boolean
}
