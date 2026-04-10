import type { GridContainerProps } from '@/types/utils/css-grid'

export const DEFAULT_GRID_CONTAINER: GridContainerProps = {
  alignItems: 'stretch',
  columns: '1fr 1fr 1fr',
  gap: 8,
  justifyItems: 'stretch',
  rows: 'auto auto',
}

const sanitizeGridTrack = (value: string): string => value.replace(/[;{}\\<>]/g, '')

export const generateGridCss = (container: GridContainerProps): string => {
  const lines = [
    'display: grid;',
    `grid-template-columns: ${sanitizeGridTrack(container.columns)};`,
    `grid-template-rows: ${sanitizeGridTrack(container.rows)};`,
    `gap: ${container.gap}px;`,
    `justify-items: ${container.justifyItems};`,
    `align-items: ${container.alignItems};`,
  ]

  return lines.join('\n')
}

export type { GridJustifyItems, GridAlignItems, GridContainerProps } from '@/types/utils/css-grid'
