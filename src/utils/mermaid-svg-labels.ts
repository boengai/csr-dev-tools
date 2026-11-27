import type { MermaidLabelFits, MermaidLabelRow, MermaidTextMeasure } from '@/types/utils/mermaid-svg-labels'

const SVG_NS = 'http://www.w3.org/2000/svg'
// Mermaid's own defaults, used when the diagram's root style doesn't say.
const DEFAULT_FONT_FAMILY = '"trebuchet ms", verdana, arial, sans-serif'
const DEFAULT_FONT_SIZE = '16px'
// Average glyph width in em, for when there is no canvas to measure with.
const ESTIMATED_CHAR_EM = 0.6

// Stamped on the root <svg>: the shell hands its `notices` only the markup
// string, so the count travels in it. DOMPurify keeps `data-` attributes.
const HIDDEN_MATH_ATTR = 'data-hidden-math-labels'
const HIDDEN_MATH_PATTERN = new RegExp(`^\\s*<svg\\b[^>]*\\s${HIDDEN_MATH_ATTR}="(\\d+)"`)
const LINE_HEIGHT_EM = 1.2
// Elements that start a new line in the HTML label, besides any styled
// `display: block|flex|table` (event-modeling's data <code>).
const BLOCK_TAGS = new Set(['div', 'li', 'p', 'pre'])
const BLOCK_DISPLAY = /display:\s*(?:block|flex|table)(?![-\w])/

const numberAttr = (el: Element, name: string): number => parseFloat(el.getAttribute(name) ?? '') || 0

/** Rounds a line offset and writes it as a CSS `em` length. */
const em = (value: number): string => `${Math.round(value * 100) / 100}em`

let measureContext: OffscreenCanvasRenderingContext2D | null | undefined

/** Measures with a canvas, as the browser lays text out; estimates where there is none (jsdom). */
const measureWithCanvas: MermaidTextMeasure = (text, font) => {
  if (measureContext === undefined) {
    measureContext = typeof OffscreenCanvas === 'undefined' ? null : new OffscreenCanvas(1, 1).getContext('2d')
  }
  if (!measureContext)
    return text.length * ESTIMATED_CHAR_EM * (parseFloat(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? '') || 16)
  measureContext.font = font
  return measureContext.measureText(text).width
}

/** The font labels inherit from the diagram's root rule (`#id{font-family:…;font-size:…}`). */
const rootFont = (root: Element): { family: string; size: string } => {
  const id = root.getAttribute('id')
  const css = root.querySelector('style')?.textContent ?? ''
  const rule = id ? (css.split(`#${id}{`)[1]?.split('}')[0] ?? '') : ''
  const value = (name: string) => new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`).exec(rule)?.[1]?.trim()
  return { family: value('font-family') ?? DEFAULT_FONT_FAMILY, size: value('font-size') ?? DEFAULT_FONT_SIZE }
}

/** A `font-size` set between the label and the root (venn sets one on its text-node group). */
const nearerFontSize = (fo: Element, root: Element): string | undefined => {
  for (let el = fo.parentElement; el && el !== root; el = el.parentElement) {
    const size =
      el.getAttribute('font-size') ?? /font-size:\s*([^;]+)/.exec(el.getAttribute('style') ?? '')?.[1]?.trim()
    if (size) return /^\d+(?:\.\d+)?$/.test(size) ? `${size}px` : size
  }
  return undefined
}

/** Architecture's iconText sets `-webkit-line-clamp` (and clips): its line limit, or 0 for none. */
const lineClamp = (fo: Element): number => {
  for (const el of fo.querySelectorAll('[style]')) {
    const clamp = /-webkit-line-clamp:\s*(\d+)/.exec(el.getAttribute('style') ?? '')?.[1]
    if (clamp) return parseInt(clamp, 10)
  }
  return 0
}

/**
 * Breaks a row into lines no wider than `maxWidth`, at spaces, as the HTML
 * label wrapped. A word wider than the box keeps a line of its own, unless
 * `breakWords`: a clipped label breaks it by character instead, so it stays
 * inside the box.
 */
const wrapRow = (row: MermaidLabelRow, maxWidth: number, fits: MermaidLabelFits, breakWords: boolean) => {
  if (row.text === '' || maxWidth <= 0 || fits(row.text, row.bold)) return [row]
  const lines: Array<MermaidLabelRow> = []
  let line = ''
  const flush = () => {
    if (line) lines.push({ bold: row.bold, text: line })
    line = ''
  }
  for (const word of row.text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word
    if (fits(candidate, row.bold)) {
      line = candidate
      continue
    }
    flush()
    if (!breakWords || fits(word, row.bold)) {
      line = word
      continue
    }
    for (const char of word) {
      if (line && !fits(line + char, row.bold)) flush()
      line += char
    }
  }
  flush()
  return lines
}

/** At most `clamp` lines; the last ends in '…', trimmed until it fits, as line-clamp shows it. */
const clampRows = (rows: Array<MermaidLabelRow>, clamp: number, fits: MermaidLabelFits): Array<MermaidLabelRow> => {
  if (!clamp || rows.length <= clamp) return rows
  const kept = rows.slice(0, clamp)
  const last = kept[clamp - 1]
  if (!last) return kept
  let text = last.text
  // Drops a code point, not a UTF-16 unit: half an emoji is a lone surrogate in the SVG.
  while (text && !fits(`${text}…`, last.bold)) text = [...text].slice(0, -1).join('').trimEnd()
  kept[clamp - 1] = { bold: last.bold, text: `${text}…` }
  return kept
}

/**
 * The label's rows as SVG would lay them out: a break at `<br>`, around block
 * elements and at a newline (mermaid joins event-modeling data fields with
 * one). Runs of blank rows become one; blank rows at either end are dropped.
 */
const labelRows = (fo: Element): Array<MermaidLabelRow> => {
  const raw: Array<MermaidLabelRow> = []
  // A row starts bold and stays bold only while all its text is in <b>/<strong>.
  const breakRow = () => raw.push({ bold: true, text: '' })
  // A block edge only ends a row that has text: stacked blocks leave no gap.
  const endRow = () => {
    if (raw.at(-1)?.text.trim()) breakRow()
  }
  const append = (part: string, bold: boolean) => {
    const row = raw.at(-1)
    if (!row) return
    row.text += part
    if (part.trim()) row.bold &&= bold
  }
  const walk = (node: Node, bold: boolean): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      ;(node.textContent ?? '').split('\n').forEach((part, index) => {
        if (index > 0) breakRow()
        append(part, bold)
      })
      return
    }
    if (!(node instanceof Element)) return
    const tag = node.localName
    if (tag === 'br') return void breakRow()
    const block = BLOCK_TAGS.has(tag) || BLOCK_DISPLAY.test(node.getAttribute('style') ?? '')
    if (block) endRow()
    for (const child of node.childNodes) walk(child, bold || tag === 'b' || tag === 'strong')
    if (block) endRow()
  }
  breakRow()
  walk(fo, false)

  const rows: Array<MermaidLabelRow> = []
  for (const { bold, text } of raw) {
    // `\s` takes U+00A0 too: HTML serialises it as `&nbsp;`, which isn't an XML entity,
    // and the SVG then fails to load as an image for the PNG export.
    const row = { bold, text: text.replace(/\s+/g, ' ').trim() }
    if (row.text === '' && (rows.length === 0 || rows.at(-1)?.text === '')) continue
    rows.push(row)
  }
  if (rows.at(-1)?.text === '') rows.pop()
  return rows
}

/**
 * Journey, C4 and timeline put the HTML label in a `<switch>` next to an SVG
 * text copy, which is what's left once the sanitizer strips the HTML.
 */
const hasTextFallback = (fo: Element): boolean => {
  const parent = fo.parentElement
  return parent?.localName === 'switch' && [...parent.children].some((child) => child.localName !== 'foreignObject')
}

/**
 * Swaps one HTML label for an SVG `<text>` centred where the label was,
 * wrapped at the label's width. `width` measures a row in the label's font.
 */
const redrawAsText = (fo: Element, width: (text: string, bold: boolean) => number): void => {
  const doc = fo.ownerDocument
  const boxWidth = numberAttr(fo, 'width')
  const x = String(numberAttr(fo, 'x') + boxWidth / 2)
  const y = String(numberAttr(fo, 'y') + numberAttr(fo, 'height') / 2)
  const fits: MermaidLabelFits = (line, bold) => width(line, bold) <= boxWidth
  const clamp = lineClamp(fo)
  const rows = clampRows(
    labelRows(fo).flatMap((row) => wrapRow(row, boxWidth, fits, clamp > 0)),
    clamp,
    fits,
  )

  const text = doc.createElementNS(SVG_NS, 'text')
  text.setAttribute('x', x)
  text.setAttribute('y', y)
  text.setAttribute('text-anchor', 'middle')
  text.setAttribute('dominant-baseline', 'central')
  // An HTML label's own colour (venn's `style … color:`). Without one the text
  // inherits the diagram's text fill.
  // Not one that loads a URL (`var(--x, url(…))`): a fill would fetch it.
  const color = [...fo.querySelectorAll<HTMLElement>('[style]')].find((el) => el.style.color)?.style.color
  if (color && !/url\(/i.test(color)) text.setAttribute('fill', color)
  // A blank row has no tspan: the next line's dy steps over it.
  let previous = -1
  rows.forEach(({ bold, text: row }, index) => {
    if (row === '') return
    const tspan = doc.createElementNS(SVG_NS, 'tspan')
    tspan.setAttribute('x', x)
    const dy = previous < 0 ? (-(rows.length - 1) / 2) * LINE_HEIGHT_EM : (index - previous) * LINE_HEIGHT_EM
    tspan.setAttribute('dy', em(dy))
    if (bold) tspan.setAttribute('font-weight', 'bold')
    tspan.textContent = row
    text.append(tspan)
    previous = index
  })
  fo.replaceWith(text)
}

/**
 * Makes mermaid's labels survive the sanitizer. Run it on mermaid's output
 * before sanitizing.
 * - Some renderers draw labels as HTML in `<foreignObject>` whatever
 *   `htmlLabels` says. The sanitizer strips those, and they would taint the
 *   PNG export's canvas, so they are redrawn as SVG `<text>`.
 * - KaTeX labels are counted instead (see `countHiddenMathLabels`).
 * - Journey section titles get back a readable fill.
 *
 * `measure` is for tests; the browser measures with a canvas.
 */
export const redrawHtmlLabels = (svg: string, measure: MermaidTextMeasure = measureWithCanvas): string => {
  if (!svg.includes('<foreignObject') && !svg.includes('journey-section')) return svg
  const root = new DOMParser().parseFromString(svg, 'text/html').querySelector('svg')
  if (!root) return svg

  const font = rootFont(root)
  // The size a label inherits: venn's group sets one; the rest use the root's.
  const widthIn = (size: string) => (text: string, bold: boolean) =>
    measure(text, `${bold ? 'bold ' : ''}${size} ${font.family}`)

  let hiddenMath = 0
  for (const fo of root.querySelectorAll('foreignObject')) {
    if (hasTextFallback(fo)) continue
    // KaTeX as flat text is wrong math (x² reads "x2"), so it is left for the
    // sanitizer to drop and counted for the notice instead.
    if (fo.querySelector('math, .katex')) hiddenMath++
    else redrawAsText(fo, widthIn(nearerFontSize(fo, root) ?? font.size))
  }
  if (hiddenMath > 0) root.setAttribute(HIDDEN_MATH_ATTR, String(hiddenMath))

  // A journey section title shares its box's `section-type-N` class, whose
  // `fill` paints the text the colour of the box behind it. Inline, so the
  // fix also holds in the downloaded SVG and PNG.
  for (const title of root.querySelectorAll<SVGTextElement>('text.journey-section')) {
    title.style.setProperty('fill', 'inherit')
  }
  return root.outerHTML
}

/** How many `$$…$$` math labels `redrawHtmlLabels` had to leave out of this SVG. */
export const countHiddenMathLabels = (svg: string): number => Number(HIDDEN_MATH_PATTERN.exec(svg)?.[1] ?? 0)

export type { MermaidLabelRow, MermaidTextMeasure } from '@/types/utils/mermaid-svg-labels'
