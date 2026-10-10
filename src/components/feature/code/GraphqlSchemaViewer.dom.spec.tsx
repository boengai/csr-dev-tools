/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GraphqlSchemaViewer } from './GraphqlSchemaViewer'

vi.mock('@/components/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/common')>()
  return {
    ...actual,
    CodeInput: ({
      'aria-label': ariaLabel,
      onChange,
      value,
    }: {
      'aria-label'?: string
      onChange: (v: string) => void
      value: string
    }) => <textarea aria-label={ariaLabel} onChange={(e) => onChange(e.target.value)} value={value} />,
  }
})

const flush = async () => {
  await act(async () => {
    for (let i = 0; i < 4; i++) {
      await vi.runAllTimersAsync()
      await vi.dynamicImportSettled()
    }
  })
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(
    'csr-dev-tools-graphql-schema-viewer-input',
    JSON.stringify('type Query { user: User }\ntype User { id: ID! }'),
  )
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('GraphqlSchemaViewer', () => {
  it('keeps the selected type across a schema edit, and drops it once the type is gone', async () => {
    render(<GraphqlSchemaViewer autoOpen />)
    await flush()

    fireEvent.click(screen.getByRole('button', { name: 'User - Object type' }))
    expect(screen.getByRole('heading', { name: 'User' })).toBeInTheDocument()

    const input = screen.getByLabelText('GraphQL SDL input')
    fireEvent.change(input, { target: { value: 'type Query { user: User }\ntype User { id: ID!\n name: String }' } })
    await flush()

    expect(screen.getByRole('heading', { name: 'User' })).toBeInTheDocument()
    expect(screen.getByText('name')).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'type Query { id: ID }' } })
    await flush()

    expect(screen.queryByRole('heading', { name: 'User' })).not.toBeInTheDocument()
    expect(screen.getByText('Select a type from the list to view details')).toBeInTheDocument()
  })
})
