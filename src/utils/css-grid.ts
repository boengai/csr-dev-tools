export type GridJustifyItems = 'center' | 'end' | 'start' | 'stretch'
export type GridAlignItems = 'center' | 'end' | 'start' | 'stretch'

export type GridContainerProps = {
  alignItems: GridAlignItems
  columns: string
  gap: number
  justifyItems: GridJustifyItems
  rows: string
}

export const DEFAULT_GRID_CONTAINER: GridContainerProps = {
  alignItems: 'stretch',
  columns: '1fr 1fr 1fr',
  gap: 8,
  justifyItems: 'stretch',
  rows: 'auto auto',
}

export const generateGridCss = (container: GridContainerProps): string => {
  const lines = [
    'display: grid;',
    `grid-template-columns: ${container.columns};`,
    `grid-template-rows: ${container.rows};`,
    `gap: ${container.gap}px;`,
    `justify-items: ${container.justifyItems};`,
    `align-items: ${container.alignItems};`,
  ]

  return lines.join('\n')
}
