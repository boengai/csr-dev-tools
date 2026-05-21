/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import { LazyMotion, domAnimation } from 'motion/react'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'

import { DisclosurePanel } from './DisclosurePanel'

const renderInMotion = (ui: ReactElement) => render(<LazyMotion features={domAnimation}>{ui}</LazyMotion>)

describe('DisclosurePanel', () => {
  it('renders the label button collapsed by default; children hidden', () => {
    renderInMotion(
      <DisclosurePanel label="Show stuff">
        <p>secret content</p>
      </DisclosurePanel>,
    )

    const button = screen.getByRole('button', { name: /show stuff/i })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('secret content')).toBeNull()
  })

  it('opens when the button is clicked and reveals children', () => {
    renderInMotion(
      <DisclosurePanel label="Show stuff">
        <p>secret content</p>
      </DisclosurePanel>,
    )

    const button = screen.getByRole('button', { name: /show stuff/i })
    fireEvent.click(button)

    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('secret content')).toBeTruthy()
  })

  it('toggles closed on a second click and removes children from the DOM', async () => {
    renderInMotion(
      <DisclosurePanel label="Show stuff">
        <p>secret content</p>
      </DisclosurePanel>,
    )

    const button = screen.getByRole('button', { name: /show stuff/i })
    fireEvent.click(button)
    const content = screen.getByText('secret content')
    fireEvent.click(button)

    expect(button.getAttribute('aria-expanded')).toBe('false')
    await waitForElementToBeRemoved(content)
  })

  it('wires aria-controls to a panel element that exists in the DOM even when closed', () => {
    renderInMotion(
      <DisclosurePanel label="Show stuff">
        <p>secret content</p>
      </DisclosurePanel>,
    )

    const button = screen.getByRole('button', { name: /show stuff/i })
    const controlsId = button.getAttribute('aria-controls')
    expect(controlsId).toBeTruthy()
    expect(document.getElementById(controlsId as string)).toBeTruthy()
  })

  it('applies p-3 to the inner panel by default (padding="md")', () => {
    renderInMotion(
      <DisclosurePanel label="Show stuff">
        <p data-testid="content">secret content</p>
      </DisclosurePanel>,
    )

    fireEvent.click(screen.getByRole('button', { name: /show stuff/i }))
    // The inner panel is the direct parent of the children.
    const innerPanel = screen.getByTestId('content').parentElement
    expect(innerPanel?.className).toContain('p-3')
  })

  it('omits padding when padding="none" (for table-shaped content)', () => {
    renderInMotion(
      <DisclosurePanel label="Show stuff" padding="none">
        <p data-testid="content">secret content</p>
      </DisclosurePanel>,
    )

    fireEvent.click(screen.getByRole('button', { name: /show stuff/i }))
    const innerPanel = screen.getByTestId('content').parentElement
    expect(innerPanel?.className).not.toContain('p-3')
  })
})
