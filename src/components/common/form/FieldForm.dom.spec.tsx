/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { FieldForm } from './FieldForm'

const options = [
  { label: 'One', value: '1' },
  { label: 'Two', value: '2' },
]

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      disconnect() {}
      observe() {}
      unobserve() {}
    },
  )
})

describe('FieldForm label wiring', () => {
  it('labels a select trigger via htmlFor, not its machine name', () => {
    render(<FieldForm label="Algorithm" name="algo" onChange={() => {}} options={options} type="select" value="1" />)
    expect(screen.getByRole('combobox', { name: 'Algorithm' })).toBeInTheDocument()
  })

  it('labels a radio group via aria-labelledby', () => {
    render(<FieldForm label="Mode" name="mode" onChange={() => {}} options={options} type="radio" value="1" />)
    expect(screen.getByRole('radiogroup', { name: 'Mode' })).toBeInTheDocument()
  })

  it('labels the range number input and slider thumb', () => {
    render(<FieldForm label="Rounds" max={10} min={1} name="rounds" onChange={() => {}} type="range" value="4" />)
    expect(screen.getByRole('spinbutton', { name: 'Rounds' })).toBeInTheDocument()
  })

  it('labels the CodeMirror content element', () => {
    const { container } = render(<FieldForm label="Source" name="src" onChange={() => {}} type="code" value="" />)
    const content = container.querySelector('.cm-content')
    const label = screen.getByText('Source')
    expect(content?.getAttribute('aria-labelledby')).toBe(label.id)
    expect(content?.id).toBe(label.getAttribute('for'))
  })
})
