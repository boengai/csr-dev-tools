import type { MermaidLabelRow } from '@/types/utils/mermaid-svg-labels'

const SVG_NS = 'http://www.w3.org/2000/svg'

// Stamped on the root <svg> so the count travels with the markup to the notice.
const HIDDEN_MATH_ATTR = 'data-hidden-math-labels'
const HIDDEN_MATH_PATTERN = new RegExp(`^\\s*<svg\\b[^>]*\\s${HIDDEN_MATH_ATTR}="(\\d+)"`)
const LINE_HEIGHT_EM = 1.2
// Elements that start a new line in the HTML label.
const BLOCK_TAGS = new Set(['code', 'div', 'li', 'p', 'pre'])

const numberAttr = (el: Element, name: string): number => parseFloat(el.getAttribute(name) ?? '') || 0

const em = (value: number): string => `${Math.round(value * 100) / 100}em`

/**
 * The label's rows as SVG would lay them out: a break at `<br>`, around block
 * elements and at a newline (mermaid joins event-modeling data fields with
 * one). Runs of blank rows become one; blank rows at either end are dropped.
 */
const labelRows = (fo: Element): Array<MermaidLabelRow> => {
  const raw: Array<MermaidLabelRow> = []
  const breakRow = () => raw.push({ bold: true, text: '' })
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
    const block = BLOCK_TAGS.has(tag)
    if (block) breakRow()
    for (const child of node.childNodes) walk(child, bold || tag === 'b' || tag === 'strong')
    if (block) breakRow()
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

/** Swaps one HTML label for an SVG `<text>` centred where the label was. */
const redrawAsText = (fo: Element): void => {
  const doc = fo.ownerDocument
  const x = String(numberAttr(fo, 'x') + numberAttr(fo, 'width') / 2)
  const y = String(numberAttr(fo, 'y') + numberAttr(fo, 'height') / 2)
  const rows = labelRows(fo)

  const text = doc.createElementNS(SVG_NS, 'text')
  text.setAttribute('x', x)
  text.setAttribute('y', y)
  text.setAttribute('text-anchor', 'middle')
  text.setAttribute('dominant-baseline', 'central')
  // An HTML label's own colour (venn's `style … color:`). Without one the text
  // inherits the diagram's text fill.
  const color = [...fo.querySelectorAll<HTMLElement>('[style]')].find((el) => el.style.color)?.style.color
  if (color) text.setAttribute('fill', color)
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
 * Some mermaid renderers draw labels as HTML in `<foreignObject>` whatever
 * `htmlLabels` says. The sanitizer strips those, and they would taint the PNG
 * export's canvas, so this redraws them as SVG `<text>` first. Run it on
 * mermaid's output before sanitizing.
 */
export const redrawHtmlLabels = (svg: string): string => {
  if (!svg.includes('<foreignObject')) return svg
  const root = new DOMParser().parseFromString(svg, 'text/html').querySelector('svg')
  if (!root) return svg

  let hiddenMath = 0
  for (const fo of root.querySelectorAll('foreignObject')) {
    if (hasTextFallback(fo)) continue
    // KaTeX as flat text is wrong math (x² reads "x2"), so it is left for the
    // sanitizer to drop and counted for the notice instead.
    if (fo.querySelector('math, .katex')) hiddenMath++
    else redrawAsText(fo)
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
