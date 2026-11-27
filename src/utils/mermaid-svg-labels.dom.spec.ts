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

// A stand-in for canvas text measurement: 10px a character, whatever the font.
const tenPxPerChar = (text: string): number => text.length * 10

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
          '<foreignObject class="venn-text-node-fo" width="200" height="200" x="150" y="100" overflow="visible">' +
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

  it('wraps a label at its box width, as the HTML label did', () => {
    const svg = parse(
      redrawHtmlLabels(
        '<svg><g class="venn-text-area">' +
          '<foreignObject class="venn-text-node-fo" width="100" height="200" x="0" y="0" overflow="visible">' +
          '<span class="venn-text-node" xmlns="http://www.w3.org/1999/xhtml" style="display: flex; white-space: normal;">' +
          'Design Systems Team</span></foreignObject></g></svg>',
        tenPxPerChar,
      ),
    )

    const text = svg.querySelector('text')!
    // "Design Systems" is 140px, wider than the 100px box.
    expect(lines(text)).toEqual(['Design', 'Systems', 'Team'])
    expect([...text.querySelectorAll('tspan')].map((t) => t.getAttribute('dy'))).toEqual(['-1.2em', '1.2em', '1.2em'])
  })

  it('keeps a word wider than the box whole, on a line of its own', () => {
    const svg = parse(
      redrawHtmlLabels(
        '<svg><g><foreignObject width="50" height="80"><div xmlns="http://www.w3.org/1999/xhtml">' +
          'a Kubernetes b</div></foreignObject></g></svg>',
        tenPxPerChar,
      ),
    )

    expect(lines(svg.querySelector('text')!)).toEqual(['a', 'Kubernetes', 'b'])
  })

  it("stops an architecture iconText label at its line clamp, ending in '…'", () => {
    // Mermaid sets the clamp to the lines that fit in the icon square.
    const svg = parse(
      redrawHtmlLabels(
        '<svg><g><foreignObject width="80" height="80">' +
          '<div class="node-icon-text" xmlns="http://www.w3.org/1999/xhtml" style="height: 80px;">' +
          '<div style="-webkit-line-clamp: 2;">one two three four five</div></div>' +
          '</foreignObject></g></svg>',
        tenPxPerChar,
      ),
    )

    // Unclamped: "one two" / "three" / "four five".
    expect(lines(svg.querySelector('text')!)).toEqual(['one two', 'three…'])
  })

  it('measures each row in the font the HTML label had: the root rule, bold, or a nearer font-size', () => {
    const fonts = new Map<string, string>()
    const spy = (text: string, font: string) => {
      fonts.set(text, font)
      return 0
    }
    redrawHtmlLabels(
      '<svg id="d"><style>#d{font-family:Inter, sans-serif;font-size:20px;fill:#ccc;}</style>' +
        '<g><foreignObject width="500" height="80"><div xmlns="http://www.w3.org/1999/xhtml"><b>Name</b><br>data</div></foreignObject></g>' +
        // Venn sets its text-node size on the group around them.
        '<g class="venn-text-area" font-size="24px"><foreignObject width="500" height="80">' +
        '<span class="venn-text-node" xmlns="http://www.w3.org/1999/xhtml">Venn</span></foreignObject></g></svg>',
      spy,
    )

    expect(fonts.get('Name')).toBe('bold 20px Inter, sans-serif')
    expect(fonts.get('data')).toBe('20px Inter, sans-serif')
    expect(fonts.get('Venn')).toBe('24px Inter, sans-serif')
  })

  it('breaks lines where the HTML did: inline <code> stays in the line, stacked blocks leave no gap', () => {
    const svg = parse(
      redrawHtmlLabels(
        '<svg><g><foreignObject width="500" height="80"><div xmlns="http://www.w3.org/1999/xhtml">use <code>pnpm</code> now</div></foreignObject></g>' +
          '<g><foreignObject width="500" height="80"><div xmlns="http://www.w3.org/1999/xhtml"><div>one</div><div>two</div></div></foreignObject></g></svg>',
        tenPxPerChar,
      ),
    )

    const [inline, stacked] = svg.querySelectorAll('text')
    expect(lines(inline!)).toEqual(['use pnpm now'])
    expect(lines(stacked!)).toEqual(['one', 'two'])
    expect([...stacked!.querySelectorAll('tspan')].map((t) => t.getAttribute('dy'))).toEqual(['-0.6em', '1.2em'])
  })

  it('keeps a clamped label inside its box: long words break, and the last line makes room for the ellipsis', () => {
    // The HTML clips at the icon (`overflow: hidden`); SVG text would spill out.
    const svg = parse(
      redrawHtmlLabels(
        '<svg><g><foreignObject width="80" height="80">' +
          '<div class="node-icon-text" xmlns="http://www.w3.org/1999/xhtml" style="height: 80px;">' +
          '<div style="-webkit-line-clamp: 2;">supercalifragilistic is long</div></div>' +
          '</foreignObject></g></svg>',
        tenPxPerChar,
      ),
    )

    // 80px holds 8 characters, '…' included.
    expect(lines(svg.querySelector('text')!)).toEqual(['supercal', 'ifragil…'])
  })

  it('does not copy a colour that loads a URL', () => {
    const svg = parse(
      redrawHtmlLabels(
        '<svg><g><foreignObject width="100" height="100">' +
          '<span xmlns="http://www.w3.org/1999/xhtml" style="color: var(--x, url(https://example.invalid/a.png));">React</span>' +
          '</foreignObject></g></svg>',
        tenPxPerChar,
      ),
    )

    expect(svg.querySelector('text')!.getAttribute('fill')).toBeNull()
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

  it('fixes the journey section title fill when the labels are SVG text only (`textPlacement: tspan`)', () => {
    const svg = parse(
      redrawHtmlLabels(
        '<svg><g><rect class="journey-section section-type-0"></rect>' +
          '<text class="journey-section section-type-0"><tspan>Morning</tspan></text></g></svg>',
      ),
    )

    expect(svg.querySelector<SVGTextElement>('text.journey-section')!.style.fill).toBe('inherit')
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
