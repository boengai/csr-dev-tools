import type { PxRemInput, PxRemOutput } from '@/types'

export const pxToRem = (px: number, base: number): number => {
  return Number((px / base).toFixed(6))
}

export const remToPx = (rem: number, base: number): number => {
  return Number((rem * base).toFixed(6))
}

const INVALID_BASE_MSG = 'Base font size must be a positive number (e.g., 16)'
const INVALID_PX_MSG = 'Enter a valid PX value (e.g., 16)'
const INVALID_REM_MSG = 'Enter a valid REM value (e.g., 1)'

export const solvePxRem = (input: PxRemInput): PxRemOutput => {
  const { source, px, rem, base, lastEdited } = input

  const baseNum = Number(base)
  if (base.trim() === '' || Number.isNaN(baseNum) || baseNum <= 0) {
    throw new Error(INVALID_BASE_MSG)
  }

  if (source === 'px') {
    const pxNum = Number(px)
    if (Number.isNaN(pxNum)) throw new Error(INVALID_PX_MSG)
    return { px, rem: pxToRem(pxNum, baseNum).toString(), base }
  }

  if (source === 'rem') {
    const remNum = Number(rem)
    if (Number.isNaN(remNum)) throw new Error(INVALID_REM_MSG)
    return { px: remToPx(remNum, baseNum).toString(), rem, base }
  }

  // source === 'base' — recompute the side the user wasn't typing in
  if (lastEdited === 'px' && px.trim()) {
    const pxNum = Number(px)
    if (Number.isNaN(pxNum)) throw new Error(INVALID_PX_MSG)
    return { px, rem: pxToRem(pxNum, baseNum).toString(), base }
  }
  if (lastEdited === 'rem' && rem.trim()) {
    const remNum = Number(rem)
    if (Number.isNaN(remNum)) throw new Error(INVALID_REM_MSG)
    return { px: remToPx(remNum, baseNum).toString(), rem, base }
  }

  return { px, rem, base }
}
