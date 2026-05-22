/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ErrorBanner } from './ErrorBanner'

describe('ErrorBanner', () => {
  it('renders with role=alert by default', () => {
    render(<ErrorBanner>Something broke</ErrorBanner>)
    const banner = screen.getByRole('alert')
    expect(banner).toHaveTextContent('Something broke')
    expect(banner.className).toContain('text-red-400')
  })

  it('uses yellow text for warning variant', () => {
    render(<ErrorBanner variant="warning">Slow down</ErrorBanner>)
    const banner = screen.getByRole('alert')
    expect(banner.className).toContain('text-yellow-400')
  })

  it('accepts JSX children', () => {
    render(
      <ErrorBanner>
        Skipped <strong>1 file</strong>
      </ErrorBanner>,
    )
    expect(screen.getByRole('alert')).toContainHTML('<strong>1 file</strong>')
  })
})
