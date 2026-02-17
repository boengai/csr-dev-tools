export type BorderRadiusConfig = {
  asymmetric: boolean
  bottomLeft: number
  bottomLeftV: number
  bottomRight: number
  bottomRightV: number
  topLeft: number
  topLeftV: number
  topRight: number
  topRightV: number
}

export const DEFAULT_BORDER_RADIUS: BorderRadiusConfig = {
  asymmetric: false,
  bottomLeft: 8,
  bottomLeftV: 8,
  bottomRight: 8,
  bottomRightV: 8,
  topLeft: 8,
  topLeftV: 8,
  topRight: 8,
  topRightV: 8,
}

export const generateBorderRadiusCss = (config: BorderRadiusConfig): string => {
  const { asymmetric, bottomLeft, bottomLeftV, bottomRight, bottomRightV, topLeft, topLeftV, topRight, topRightV } = config

  const h = [topLeft, topRight, bottomRight, bottomLeft]
  const v = [topLeftV, topRightV, bottomRightV, bottomLeftV]

  const needsSlash = asymmetric && (h[0] !== v[0] || h[1] !== v[1] || h[2] !== v[2] || h[3] !== v[3])

  const collapseValues = (vals: Array<number>): string => {
    if (vals[0] === vals[1] && vals[1] === vals[2] && vals[2] === vals[3]) {
      return `${vals[0]}px`
    }
    if (vals[0] === vals[2] && vals[1] === vals[3]) {
      return `${vals[0]}px ${vals[1]}px`
    }
    if (vals[1] === vals[3]) {
      return `${vals[0]}px ${vals[1]}px ${vals[2]}px`
    }
    return `${vals[0]}px ${vals[1]}px ${vals[2]}px ${vals[3]}px`
  }

  if (needsSlash) {
    return `border-radius: ${collapseValues(h)} / ${collapseValues(v)};`
  }

  return `border-radius: ${collapseValues(h)};`
}
