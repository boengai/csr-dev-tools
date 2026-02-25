import DOMPurify from 'dompurify'
import mermaid from 'mermaid'

export type MermaidRenderResult = {
  diagramType: string
  svg: string
}

let initialized = false

export function initializeMermaid(): void {
  if (initialized) return
  mermaid.initialize({
    flowchart: { useMaxWidth: true },
    logLevel: 'error',
    securityLevel: 'strict',
    startOnLoad: false,
    theme: 'dark',
  })
  initialized = true
}

export function sanitizeMermaidInput(code: string): string {
  return code.replace(/%%\{.*?\}%%/gs, '').trim()
}

export async function renderMermaid(code: string, id: string): Promise<MermaidRenderResult> {
  const sanitizedCode = sanitizeMermaidInput(code)
  if (!sanitizedCode) {
    throw new Error('Empty diagram input')
  }
  const { svg, diagramType } = await mermaid.render(id, sanitizedCode)
  const cleanSvg = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } })
  return { diagramType, svg: cleanSvg }
}

export async function parseMermaid(code: string): Promise<{ diagramType: string } | null> {
  const sanitizedCode = sanitizeMermaidInput(code)
  if (!sanitizedCode) return null
  const result = await mermaid.parse(sanitizedCode, { suppressErrors: true })
  if (!result) return null
  return { diagramType: result.diagramType }
}

export async function svgToPng(svgString: string, scale = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')
    const svgEl = doc.querySelector('svg')
    if (!svgEl) {
      reject(new Error('Invalid SVG'))
      return
    }

    let width = 0
    let height = 0
    const viewBox = svgEl.getAttribute('viewBox')
    const widthAttr = svgEl.getAttribute('width')
    const heightAttr = svgEl.getAttribute('height')

    if (widthAttr && heightAttr) {
      width = parseFloat(widthAttr)
      height = parseFloat(heightAttr)
    } else if (viewBox) {
      const parts = viewBox.split(/[\s,]+/)
      width = parseFloat(parts[2])
      height = parseFloat(parts[3])
    }

    if (!width || !height) {
      width = 800
      height = 600
    }

    const img = new Image()
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Canvas context unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/png'))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG for PNG conversion'))
    }

    img.src = url
  })
}

export function downloadSvg(svgString: string, filename = 'mermaid-diagram.svg'): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadPng(pngDataUrl: string, filename = 'mermaid-diagram.png'): void {
  const a = document.createElement('a')
  a.href = pngDataUrl
  a.download = filename
  a.click()
}
