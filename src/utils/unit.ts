export const pxToRem = (px: number, base: number): number => {
  return Number((px / base).toFixed(6))
}

export const remToPx = (rem: number, base: number): number => {
  return Number((rem * base).toFixed(6))
}
