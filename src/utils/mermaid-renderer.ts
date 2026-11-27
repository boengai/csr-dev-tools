import DOMPurify from 'dompurify'
import mermaid from 'mermaid'

import type { MermaidRenderResult } from '@/types/utils/mermaid-renderer'
import { loadImageFromBlob } from '@/utils/image'
import { redrawHtmlLabels } from '@/utils/mermaid-svg-labels'

let initialized = false

export function initializeMermaid(): void {
  if (initialized) return
  mermaid.initialize({
    // Swimlane's cluster labels still read this deprecated key, which
    // defaults to true, so the root `htmlLabels` below doesn't reach them.
    flowchart: { htmlLabels: false, useMaxWidth: true },
    // HTML labels live in <foreignObject>, which the sanitizer strips and which
    // taints the PNG export's canvas. SVG <text> labels survive both.
    htmlLabels: false,
    logLevel: 'error',
    // Mermaid adds these keys to its secure list, so frontmatter cannot set them
    // and a diagram cannot turn HTML labels back on.
    secure: ['htmlLabels'],
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
  // Some labels are HTML whatever `htmlLabels` says; the sanitizer would strip them.
  const cleanSvg = DOMPurify.sanitize(redrawHtmlLabels(svg), { USE_PROFILES: { svg: true, svgFilters: true } })
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

  // Only plain or px lengths: mermaid often sets `width="100%"` (journey also
  // sets a px height), and parsing that as 100px squashes the PNG.
  const isAbsolute = (length: string | null): length is string => /^\s*\d+(?:\.\d+)?(?:px)?\s*$/.test(length ?? '')

  if (isAbsolute(widthAttr) && isAbsolute(heightAttr)) {
    width = parseFloat(widthAttr)
    height = parseFloat(heightAttr)
  } else if (viewBox) {
    // A short viewBox leaves NaN here, which the fallback below replaces.
    const [, , viewBoxWidth = '', viewBoxHeight = ''] = viewBox.split(/[\s,]+/)
    width = parseFloat(viewBoxWidth)
    height = parseFloat(viewBoxHeight)
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

export type { MermaidRenderResult } from '@/types/utils/mermaid-renderer'
