/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DiagramSidePanel } from './DiagramSidePanel'

describe('DiagramSidePanel', () => {
  it('renders the title', () => {
    render(
      <DiagramSidePanel footer={<button>action</button>} onClose={() => {}} title="My Panel">
        <p>body</p>
      </DiagramSidePanel>,
    )
    expect(screen.getByText('My Panel')).toBeTruthy()
  })

  it('renders the children body slot', () => {
    render(
      <DiagramSidePanel footer={<button>action</button>} onClose={() => {}} title="x">
        <p>body content</p>
      </DiagramSidePanel>,
    )
    expect(screen.getByText('body content')).toBeTruthy()
  })

  it('renders the footer slot', () => {
    render(
      <DiagramSidePanel footer={<button>my action</button>} onClose={() => {}} title="x">
        <p>body</p>
      </DiagramSidePanel>,
    )
    expect(screen.getByRole('button', { name: 'my action' })).toBeTruthy()
  })

  it('renders the controls slot when provided', () => {
    render(
      <DiagramSidePanel
        controls={<span>dialect picker</span>}
        footer={<button>action</button>}
        onClose={() => {}}
        title="x"
      >
        <p>body</p>
      </DiagramSidePanel>,
    )
    expect(screen.getByText('dialect picker')).toBeTruthy()
  })

  it('does not render the controls row when controls prop is omitted', () => {
    render(
      <DiagramSidePanel footer={<button>action</button>} onClose={() => {}} title="x">
        <p>body</p>
      </DiagramSidePanel>,
    )
    expect(screen.queryByText('dialect picker')).toBeNull()
  })

  it('fires onClose when the CloseButton is clicked', () => {
    const onClose = vi.fn()
    render(
      <DiagramSidePanel footer={<button>action</button>} onClose={onClose} title="x">
        <p>body</p>
      </DiagramSidePanel>,
    )
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('applies w-80 for default size', () => {
    const { container } = render(
      <DiagramSidePanel footer={<button>action</button>} onClose={() => {}} title="x">
        <p>body</p>
      </DiagramSidePanel>,
    )
    expect(container.firstElementChild?.className).toContain('w-80')
    expect(container.firstElementChild?.className).not.toContain('w-96')
  })

  it('applies w-96 for size="wide"', () => {
    const { container } = render(
      <DiagramSidePanel footer={<button>action</button>} onClose={() => {}} size="wide" title="x">
        <p>body</p>
      </DiagramSidePanel>,
    )
    expect(container.firstElementChild?.className).toContain('w-96')
    expect(container.firstElementChild?.className).not.toContain('w-80')
  })

  it('forwards testId to the outer container', () => {
    render(
      <DiagramSidePanel footer={<button>action</button>} onClose={() => {}} testId="my-panel" title="x">
        <p>body</p>
      </DiagramSidePanel>,
    )
    expect(screen.getByTestId('my-panel')).toBeTruthy()
  })
})
