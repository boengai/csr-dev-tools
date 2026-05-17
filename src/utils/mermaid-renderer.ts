import DOMPurify from 'dompurify'
import mermaid from 'mermaid'

import type { MermaidRenderResult } from '@/types/utils/mermaid-renderer'
import { downloadBlob } from '@/utils/download'
import { loadImageFromBlob } from '@/utils/image'

let initialized = false

export function initializeMermaid(): void {
  if (initialized) return
  mermaid.initialize({
    flowchart: { useMaxWidth: true },
    logLevel: 'error',
    securityLevel: 'strict',
    startOnLoad: false,
    suppressErrorRendering: true,
    theme: 'dark',
  })
  initialized = true
}

function sanitizeMermaidInput(code: string): string {
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

export async function svgToPng(svgString: string, scale = 2): Promise<string> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgString, 'image/svg+xml')
  const svgEl = doc.querySelector('svg')
  if (!svgEl) {
    throw new Error('Invalid SVG')
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

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const img = await loadImageFromBlob(svgBlob)

  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas context unavailable')
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

export function downloadSvg(svgString: string, filename = 'mermaid-diagram.svg'): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  downloadBlob(blob, filename)
}

export type { MermaidRenderResult } from '@/types/utils/mermaid-renderer'
