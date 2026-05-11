import type { SvgOptimizeResult } from '@/types/utils/svg-optimize'

export function optimizeSvg(svg: string): SvgOptimizeResult {
  const originalSize = new Blob([svg]).size
  let optimized = svg

  // Remove XML declaration
  optimized = optimized.replace(/<\?xml[^?]*\?>\s*/gi, '')
  // Remove comments
  optimized = optimized.replace(/<!--[\s\S]*?-->/g, '')
  // Remove metadata elements
  optimized = optimized.replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
  // Remove title and desc elements
  optimized = optimized.replace(/<title[\s\S]*?<\/title>/gi, '')
  optimized = optimized.replace(/<desc[\s\S]*?<\/desc>/gi, '')
  // Remove empty attributes (attr="")
  optimized = optimized.replace(/\s+\w+=""/g, '')
  // Collapse multiple whitespace to single space
  optimized = optimized.replace(/\s{2,}/g, ' ')
  // Remove whitespace between tags
  optimized = optimized.replace(/>\s+</g, '><')
  // Trim
  optimized = optimized.trim()

  const optimizedSize = new Blob([optimized]).size
  const savedBytes = originalSize - optimizedSize
  const savedPercent = originalSize > 0 ? ((savedBytes / originalSize) * 100).toFixed(1) : '0.0'
  const savings = `${savedBytes} bytes (${savedPercent}%)`

  return { optimized, optimizedSize, originalSize, savings }
}

export type { SvgOptimizeResult } from '@/types/utils/svg-optimize'
