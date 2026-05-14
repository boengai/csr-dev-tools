/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { CssOutputCell } from './CssOutputCell'

describe('CssOutputCell', () => {
  it('renders the value and a label tied to the variant', () => {
    const { getByText } = render(
      <CssOutputCell copyLabel="CSS box-shadow" value="box-shadow: 1px 2px 3px;" />,
    )
    expect(getByText('CSS Output')).toBeTruthy()
    expect(getByText('box-shadow: 1px 2px 3px;')).toBeTruthy()
  })

  it('uses the compact label "CSS" when size=compact', () => {
    const { getByText, queryByText } = render(
      <CssOutputCell copyLabel="CSS" size="compact" value="border-radius: 8px;" />,
    )
    expect(getByText('CSS')).toBeTruthy()
    expect(queryByText('CSS Output')).toBe(null)
  })

  it('renders a CopyButton with the value', () => {
    const { container } = render(<CssOutputCell copyLabel="CSS gradient" value="background: linear-gradient();" />)
    const copyBtn = container.querySelector('button[aria-label*="Copy"]')
    expect(copyBtn).toBeTruthy()
  })

  it('wraps the pre in a scrollable max-height container when scrollable=true', () => {
    const { container } = render(
      <CssOutputCell copyLabel="CSS animation" scrollable value="@keyframes fade { ... }" />,
    )
    const scroller = container.querySelector('.max-h-64')
    expect(scroller).toBeTruthy()
  })
})
