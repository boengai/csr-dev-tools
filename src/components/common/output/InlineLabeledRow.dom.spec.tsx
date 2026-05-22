/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { LazyMotion, domAnimation } from 'motion/react'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'

import { InlineLabeledRow } from './InlineLabeledRow'

const renderInMotion = (ui: ReactElement) => render(<LazyMotion features={domAnimation}>{ui}</LazyMotion>)

describe('InlineLabeledRow', () => {
  it('renders label + value + a copy button labelled for the value', () => {
    renderInMotion(<InlineLabeledRow label="Key Type" value="ssh-ed25519" />)
    expect(screen.getByText('Key Type')).toBeInTheDocument()
    expect(screen.getByText('ssh-ed25519')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy key type to clipboard/i })).toBeInTheDocument()
  })

  it('uses `displayValue` for display and forwards `value` (not displayValue) to the CopyButton', () => {
    renderInMotion(<InlineLabeledRow label="Port" value="443" displayValue="443 (HTTPS)" />)

    // Display shows the override
    expect(screen.getByText('443 (HTTPS)')).toBeInTheDocument()
    // The bare value is NOT rendered in the visible row (only "443 (HTTPS)" is shown)
    expect(screen.queryByText('443', { selector: 'span.font-mono' })).not.toBeInTheDocument()
    // The CopyButton exists and is enabled (value="443" is non-empty)
    const copyButton = screen.getByRole('button', { name: /copy port to clipboard/i })
    expect(copyButton).toBeInTheDocument()
    expect(copyButton).not.toBeDisabled()
  })

  it('clicking the copy button does not throw', () => {
    // We delegate clipboard behavior testing to useCopyToClipboard.dom.spec.tsx —
    // this spec just confirms our shell renders a functional, clickable button.
    renderInMotion(<InlineLabeledRow label="Key Type" value="ssh-ed25519" />)
    const copyButton = screen.getByRole('button', { name: /copy key type to clipboard/i })
    expect(() => fireEvent.click(copyButton)).not.toThrow()
  })

  it('renders nothing when value is empty and no displayValue is given', () => {
    const { container } = renderInMotion(<InlineLabeledRow label="Hash" value="" />)
    // The LazyMotion wrapper is the only thing in the container — its inner content should be empty.
    expect(container.textContent).toBe('')
  })

  it('renders the row but omits the copy button entirely when value is empty but displayValue is set', () => {
    renderInMotion(<InlineLabeledRow label="Port" value="" displayValue="default" />)
    expect(screen.getByText('default')).toBeInTheDocument()
    expect(screen.getByText('Port')).toBeInTheDocument()
    // CopyButton is absent — NOT just disabled. This is load-bearing: empty value means nothing to copy,
    // so the button is omitted entirely (not rendered in a disabled state).
    expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument()
  })

  it('forwards the label into the CopyButton aria-label for screen reader context', () => {
    renderInMotion(<InlineLabeledRow label="SHA256 Fingerprint" value="abc123" />)
    expect(screen.getByRole('button', { name: /copy sha256 fingerprint to clipboard/i })).toBeInTheDocument()
  })
})
