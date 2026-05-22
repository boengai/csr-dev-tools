/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ImportSidePanel } from './ImportSidePanel'

vi.mock('@/components/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/common')>()
  return {
    ...actual,
    // CodeMirror doesn't expose a value setter in jsdom; swap for a textarea so
    // fireEvent.change works in tests while all other common components stay real.
    CodeInput: ({ name, onChange, placeholder }: { name?: string; onChange: (v: string) => void; placeholder?: string }) => (
      <textarea name={name} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    ),
  }
})

const noop = () => {}

describe('ImportSidePanel', () => {
  it('renders the title', () => {
    render(
      <ImportSidePanel
        extensions={[]}
        onClose={noop}
        onImport={() => []}
        placeholder="Paste here..."
        testId="test-panel"
        title="Import SQL"
      />,
    )
    expect(screen.getByText('Import SQL')).toBeTruthy()
  })

  it('disables the Import button when text is empty', () => {
    render(
      <ImportSidePanel
        extensions={[]}
        onClose={noop}
        onImport={() => []}
        placeholder="Paste here..."
        testId="test-panel"
        title="x"
      />,
    )
    expect(screen.getByTestId('test-panel-submit')).toHaveProperty('disabled', true)
  })

  it('does not call onImport when text is empty and Import is clicked', () => {
    const onImport = vi.fn(() => [])
    render(
      <ImportSidePanel
        extensions={[]}
        onClose={noop}
        onImport={onImport}
        placeholder="Paste here..."
        testId="test-panel"
        title="x"
      />,
    )
    fireEvent.click(screen.getByTestId('test-panel-submit'))
    expect(onImport).not.toHaveBeenCalled()
  })

  it('calls onImport with text and merge flag when Import is clicked', () => {
    const onImport = vi.fn(() => [])
    render(
      <ImportSidePanel
        extensions={[]}
        onClose={noop}
        onImport={onImport}
        placeholder="Paste here..."
        testId="test-panel"
        title="x"
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'CREATE TABLE foo ();' } })
    fireEvent.click(screen.getByTestId('test-panel-submit'))
    expect(onImport).toHaveBeenCalledWith('CREATE TABLE foo ();', { merge: false })
  })

  it('renders errors returned by onImport', () => {
    const onImport = vi.fn(() => [{ line: 1, message: 'unexpected token' }])
    render(
      <ImportSidePanel
        extensions={[]}
        onClose={noop}
        onImport={onImport}
        placeholder="Paste here..."
        testId="test-panel"
        title="x"
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'bad input' } })
    fireEvent.click(screen.getByTestId('test-panel-submit'))
    expect(screen.getByText('unexpected token')).toBeTruthy()
  })

  it('renders the controls slot when provided', () => {
    render(
      <ImportSidePanel
        controls={<span>dialect picker</span>}
        extensions={[]}
        onClose={noop}
        onImport={() => []}
        placeholder="Paste here..."
        testId="test-panel"
        title="x"
      />,
    )
    expect(screen.getByText('dialect picker')).toBeTruthy()
  })

  it('fires onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <ImportSidePanel
        extensions={[]}
        onClose={onClose}
        onImport={() => []}
        placeholder="Paste here..."
        testId="test-panel"
        title="x"
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
