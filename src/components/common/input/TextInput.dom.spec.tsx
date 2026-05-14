/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { TextInput } from './TextInput'

describe('TextInput', () => {
  it('calls onEnter when Enter is pressed', () => {
    const onEnter = vi.fn()
    const { getByRole } = render(
      <TextInput name="t" onChange={() => {}} onEnter={onEnter} type="text" value="" />,
    )
    fireEvent.keyDown(getByRole('textbox'), { key: 'Enter' })
    expect(onEnter).toHaveBeenCalledTimes(1)
  })

  it('calls onEscape when Escape is pressed', () => {
    const onEscape = vi.fn()
    const { getByRole } = render(
      <TextInput name="t" onChange={() => {}} onEscape={onEscape} type="text" value="" />,
    )
    fireEvent.keyDown(getByRole('textbox'), { key: 'Escape' })
    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('does not call onEnter for other keys', () => {
    const onEnter = vi.fn()
    const { getByRole } = render(
      <TextInput name="t" onChange={() => {}} onEnter={onEnter} type="text" value="" />,
    )
    fireEvent.keyDown(getByRole('textbox'), { key: 'a' })
    expect(onEnter).not.toHaveBeenCalled()
  })
})
