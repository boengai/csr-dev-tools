/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'

import { countHiddenMathLabels, redrawHtmlLabels } from './mermaid-svg-labels'

const parse = (svg: string): SVGSVGElement => {
  const root = new DOMParser().parseFromString(svg, 'text/html').querySelector('svg')
  if (!root) throw new Error('no <svg> in output')
  return root
}

const lines = (text: Element): Array<string> => [...text.querySelectorAll('tspan')].map((t) => t.textContent ?? '')

// Shapes below are copied from what mermaid 12.1.0 draws.
describe('redrawHtmlLabels', () => {
  it('redraws an event-modeling box label as SVG text centred in its box', () => {
    const svg = parse(
      redrawHtmlLabels(
        '<svg id="d"><g class="em-box"><rect x="250"></rect><foreignObject x="260" y="25" width="129" height="80">' +
          '<div xmlns="http://www.w3.org/1999/xhtml" style="display: table;"><span style="display: table-cell;"><b>CartUI</b></span></div>' +
          '</foreignObject></g></svg>',
      ),
    )

    expect(svg.querySelector('foreignObject')).toBeNull()
    const text = svg.querySelector('g.em-box > text')
    expect(text).not.toBeNull()
    expect(lines(text!)).toEqual(['CartUI'])
    expect(text!.getAttribute('x')).toBe('324.5')
    expect(text!.getAttribute('y')).toBe('65')
    expect(text!.getAttribute('text-anchor')).toBe('middle')
    expect(text!.getAttribute('dominant-baseline')).toBe('central')
  })

  it('puts each line of a box with data on its own line, keeping the blank line and centring the block', () => {
    const output = redrawHtmlLabels(
      '<svg><g class="em-box"><foreignObject x="339" y="165" width="302" height="96">' +
        '<div xmlns="http://www.w3.org/1999/xhtml"><span><b>AddItem</b><br><br>' +
        '<code style="display: block;">description:&nbsp;\'john\'\n&nbsp;price:&nbsp;20.4<br></code>' +
        '</span></div></foreignObject></g></svg>',
    )

    const text = parse(output).querySelector('text')!
    // Plain spaces: HTML serialises U+00A0 as `&nbsp;`, which isn't an XML
    // entity, so the SVG would no longer load as an image for the PNG export.
    expect(lines(text)).toEqual(['AddItem', "description: 'john'", 'price: 20.4'])
    expect(output).not.toContain('&nbsp;')
    // Four rows (one blank) of 1.2em, centred on the box's middle.
    expect([...text.querySelectorAll('tspan')].map((t) => t.getAttribute('dy'))).toEqual(['-1.8em', '2.4em', '1.2em'])
    // The box name is bold in the HTML label; the data is not.
    expect([...text.querySelectorAll('tspan')].map((t) => t.getAttribute('font-weight'))).toEqual(['bold', null, null])
  })

  it('keeps a venn text node colour set by `style … color:`', () => {
    const svg = parse(
      redrawHtmlLabels(
        '<svg><g class="venn-text-area">' +
          '<foreignObject class="venn-text-node-fo" width="100" height="200" x="50" y="100" overflow="visible">' +
          '<span class="venn-text-node" xmlns="http://www.w3.org/1999/xhtml" style="display: flex; color: red;">React</span>' +
          '</foreignObject>' +
          '<foreignObject class="venn-text-node-fo" width="100" height="200" x="150" y="100" overflow="visible">' +
          '<span class="venn-text-node" xmlns="http://www.w3.org/1999/xhtml" style="display: flex;">Design Systems</span>' +
          '</foreignObject></g></svg>',
      ),
    )

    const [react, design] = svg.querySelectorAll('g.venn-text-area > text')
    expect(lines(react!)).toEqual(['React'])
    expect(react!.getAttribute('fill')).toBe('red')
    expect(lines(design!)).toEqual(['Design Systems'])
    // No colour of its own: it inherits the diagram's text fill.
    expect(design!.getAttribute('fill')).toBeNull()
  })

  it('centres an architecture iconText label in its icon square', () => {
    const svg = parse(
      redrawHtmlLabels(
        '<svg><g><foreignObject width="80" height="80">' +
          '<div class="node-icon-text" xmlns="http://www.w3.org/1999/xhtml"><div>DB text</div></div>' +
          '</foreignObject></g></svg>',
      ),
    )

    const text = svg.querySelector('g > text')!
    expect(lines(text)).toEqual(['DB text'])
    expect([text.getAttribute('x'), text.getAttribute('y')]).toEqual(['40', '40'])
  })

  it('leaves a label alone when its <switch> already has an SVG text fallback', () => {
    const input =
      '<svg><switch><foreignObject x="150" y="50" width="150" height="50">' +
      '<div xmlns="http://www.w3.org/1999/xhtml"><div class="label">Morning</div></div>' +
      '</foreignObject><text x="225" y="75"><tspan x="225">Morning</tspan></text></switch></svg>'
    const svg = parse(redrawHtmlLabels(input))

    expect(svg.querySelectorAll('switch > text')).toHaveLength(1)
    expect(svg.querySelector('switch > foreignObject')).not.toBeNull()
  })

  it("gives a journey section title the diagram's text fill, not its section box's", () => {
    // `.section-type-0 { fill: … }` paints the box and, sharing the class, its title.
    const svg = parse(
      redrawHtmlLabels(
        '<svg><style>.section-type-0{fill:#1f2020;}</style><g>' +
          '<rect class="journey-section section-type-0"></rect><switch>' +
          '<foreignObject x="150" y="50" width="150" height="50"><div xmlns="http://www.w3.org/1999/xhtml">Morning</div></foreignObject>' +
          '<text class="journey-section section-type-0" style="text-anchor: middle;"><tspan>Morning</tspan></text>' +
          '</switch></g></svg>',
      ),
    )

    const title = svg.querySelector<SVGTextElement>('text.journey-section')!
    expect(title.style.fill).toBe('inherit')
    expect(title.style.textAnchor).toBe('middle')
    expect(svg.querySelector<SVGRectElement>('rect.journey-section')!.style.fill).toBe('')
  })
})

describe('countHiddenMathLabels', () => {
  const katex = (mathml: string) =>
    '<div xmlns="http://www.w3.org/1999/xhtml"><span class="katex">' +
    `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow>${mathml}</mrow></math></span></div>`

  it('counts the KaTeX labels and does not redraw them as flat text', () => {
    const output = redrawHtmlLabels(
      '<svg><g><foreignObject x="163" y="88" width="18" height="15">' +
        katex('<msup><mi>x</mi><mn>2</mn></msup>') +
        '</foreignObject></g><g class="label"><foreignObject width="25" height="15">' +
        katex('<mi>α</mi>') +
        '</foreignObject></g></svg>',
    )

    expect(countHiddenMathLabels(output)).toBe(2)
    // x² must not come out as "x2".
    expect(parse(output).querySelector('text')).toBeNull()
  })

  it('is zero when every label could be drawn', () => {
    const output = redrawHtmlLabels(
      '<svg><g><foreignObject width="80" height="80"><div xmlns="http://www.w3.org/1999/xhtml">DB</div></foreignObject></g></svg>',
    )
    expect(countHiddenMathLabels(output)).toBe(0)
    expect(countHiddenMathLabels('<svg><g></g></svg>')).toBe(0)
  })
})
