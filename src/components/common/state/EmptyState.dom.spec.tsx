/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders message text', () => {
    render(<EmptyState>Enter JSON to see types</EmptyState>)
    expect(screen.getByText('Enter JSON to see types')).toBeInTheDocument()
  })

  it('uses muted gray styling', () => {
    render(<EmptyState>x</EmptyState>)
    const p = screen.getByText('x')
    expect(p.className).toContain('text-gray-500')
    expect(p.className).toContain('text-body-xs')
  })
})
