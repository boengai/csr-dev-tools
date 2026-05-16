/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ToolDialogShell } from './ToolDialogShell'

describe('ToolDialogShell uncontrolled', () => {
  it('opens when autoOpen is true', () => {
    render(
      <ToolDialogShell autoOpen title="Test">
        <p>body</p>
      </ToolDialogShell>,
    )
    expect(screen.getByText('body')).toBeTruthy()
  })

  it('stays closed when autoOpen is false', () => {
    render(
      <ToolDialogShell title="Test">
        <p>body</p>
      </ToolDialogShell>,
    )
    expect(screen.queryByText('body')).toBeNull()
  })

  it('chains onReset then onAfterDialogClose on close', () => {
    const onReset = vi.fn()
    const onAfter = vi.fn()
    render(
      <ToolDialogShell autoOpen title="Test" onReset={onReset} onAfterDialogClose={onAfter}>
        <p>body</p>
      </ToolDialogShell>,
    )
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(onAfter).toHaveBeenCalledTimes(1)
    expect(onReset.mock.invocationCallOrder[0]).toBeLessThan(onAfter.mock.invocationCallOrder[0])
  })

  it('does not call onReset on initial mount', () => {
    const onReset = vi.fn()
    render(
      <ToolDialogShell autoOpen title="Test" onReset={onReset}>
        <p>body</p>
      </ToolDialogShell>,
    )
    expect(onReset).not.toHaveBeenCalled()
  })

  it('callbacks are optional', () => {
    expect(() =>
      render(
        <ToolDialogShell autoOpen title="Test">
          <p>body</p>
        </ToolDialogShell>,
      ),
    ).not.toThrow()
  })
})

describe('ToolDialogShell controlled', () => {
  it('respects open prop and ignores autoOpen', () => {
    const { rerender } = render(
      <ToolDialogShell open={false} onOpenChange={() => undefined} autoOpen title="Test">
        <p>body</p>
      </ToolDialogShell>,
    )
    expect(screen.queryByText('body')).toBeNull()
    rerender(
      <ToolDialogShell open onOpenChange={() => undefined} title="Test">
        <p>body</p>
      </ToolDialogShell>,
    )
    expect(screen.getByText('body')).toBeTruthy()
  })

  it('fires onOpenChange(false) on close', () => {
    const onOpenChange = vi.fn()
    render(
      <ToolDialogShell open onOpenChange={onOpenChange} title="Test">
        <p>body</p>
      </ToolDialogShell>,
    )
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
