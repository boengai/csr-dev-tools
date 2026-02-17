export type SvgOptimizeResult = {
  optimized: string
  optimizedSize: number
  originalSize: number
  savings: string
}

export function sanitizeSvg(svg: string): string {
  let result = svg
  // Remove script tags
  result = result.replace(/<script[\s\S]*?<\/script>/gi, '')
  result = result.replace(/<script[\s\S]*?\/>/gi, '')
  // Remove event handler attributes
  result = result.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
  // Remove javascript: URIs from href/xlink:href
  result = result.replace(/\s(?:xlink:)?href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '')
  // Remove <set>/<animate> targeting event handlers
  result = result.replace(/<(?:set|animate)\s[^>]*attributeName\s*=\s*(?:"on\w+"|'on\w+')/gi, '<!-- removed -->')
  // Remove foreignObject elements
  result = result.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
  result = result.replace(/<foreignObject[\s\S]*?\/>/gi, '')
  // Remove <use> with external references (potential SSRF/XSS)
  result = result.replace(/<use\s[^>]*href\s*=\s*(?:"(?!#)[^"]*"|'(?!#)[^']*')[^>]*\/?>/gi, '')
  return result
}

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
