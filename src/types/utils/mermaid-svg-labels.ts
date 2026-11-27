/** One row of an HTML label redrawn as SVG text. `bold`: all its text was in `<b>`/`<strong>`. */
export type MermaidLabelRow = {
  bold: boolean
  text: string
}

/** Width in px of `text` drawn in a CSS `font` (`bold 16px "trebuchet ms", …`). */
export type MermaidTextMeasure = (text: string, font: string) => number

/** Whether a line of a label, bold or not, fits the label's box. */
export type MermaidLabelFits = (text: string, bold: boolean) => boolean
