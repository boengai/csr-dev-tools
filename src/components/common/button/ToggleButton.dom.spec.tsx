/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ToggleButton } from './ToggleButton'

describe('ToggleButton', () => {
  it('wires aria-pressed from the pressed prop and toggles data-state', () => {
    const { rerender } = render(
      <ToggleButton onClick={() => {}} pressed={false}>
        Toggle
      </ToggleButton>,
    )
    const button = screen.getByRole('button', { name: 'Toggle' })
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(button.getAttribute('data-state')).toBe('inactive')

    rerender(
      <ToggleButton onClick={() => {}} pressed>
        Toggle
      </ToggleButton>,
    )
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(button.getAttribute('data-state')).toBe('active')
  })

  it('fires onClick when clicked', () => {
    const onClick = vi.fn()
    render(
      <ToggleButton onClick={onClick} pressed={false}>
        Toggle
      </ToggleButton>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders the default variant with mono + leading-7 typography', () => {
    render(
      <ToggleButton onClick={() => {}} pressed={false}>
        Toggle
      </ToggleButton>,
    )
    const button = screen.getByRole('button', { name: 'Toggle' })
    expect(button.className).toContain('font-mono')
    expect(button.className).toContain('leading-7')
    expect(button.className).toContain('text-xs')
  })

  it('renders the subtle variant without font-mono or leading-7, using py-1 + text-body-xs', () => {
    render(
      <ToggleButton onClick={() => {}} pressed={false} variant="subtle">
        Toggle
      </ToggleButton>,
    )
    const button = screen.getByRole('button', { name: 'Toggle' })
    expect(button.className).not.toContain('font-mono')
    expect(button.className).not.toContain('leading-7')
    expect(button.className).toContain('py-1')
    expect(button.className).toContain('text-body-xs')
  })

  it('shares the active color recipe across variants', () => {
    const { rerender } = render(
      <ToggleButton onClick={() => {}} pressed variant="default">
        Toggle
      </ToggleButton>,
    )
    const button = screen.getByRole('button', { name: 'Toggle' })
    // The active color rules live on the base so both variants pick them up.
    const defaultActiveClass = button.className
    expect(defaultActiveClass).toContain('data-[state=active]:border-primary')
    expect(defaultActiveClass).toContain('data-[state=active]:text-primary')

    rerender(
      <ToggleButton onClick={() => {}} pressed variant="subtle">
        Toggle
      </ToggleButton>,
    )
    expect(button.className).toContain('data-[state=active]:border-primary')
    expect(button.className).toContain('data-[state=active]:text-primary')
  })

  it('disables click + applies disabled visual recipe when disabled', () => {
    const onClick = vi.fn()
    render(
      <ToggleButton disabled onClick={onClick} pressed={false}>
        Toggle
      </ToggleButton>,
    )
    const button = screen.getByRole('button', { name: 'Toggle' })
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
    expect(button.className).toContain('disabled:opacity-50')
  })
})
