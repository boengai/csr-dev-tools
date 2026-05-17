export function gridLayoutPositions(count: number): Array<{ x: number; y: number }> {
  const GRID_COLS = 3
  const H_SPACING = 600
  const V_SPACING = 550

  return Array.from({ length: count }, (_, i) => ({
    x: (i % GRID_COLS) * H_SPACING,
    y: Math.floor(i / GRID_COLS) * V_SPACING,
  }))
}
