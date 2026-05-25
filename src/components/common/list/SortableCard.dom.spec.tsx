/** @vitest-environment jsdom */
import { DndContext } from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { SortableCard } from './SortableCard'

// dnd-kit's `useSortable` requires a SortableContext ancestor; we wrap each
// render with the minimum envelope it expects.
const wrap = (children: ReactNode, ids: Array<string>) => (
  <DndContext>
    <SortableContext items={ids} strategy={rectSortingStrategy}>
      {children}
    </SortableContext>
  </DndContext>
)

describe('SortableCard', () => {
  it('renders body children inside the card chrome', () => {
    render(
      wrap(
        <SortableCard id="a">
          <span>card-body</span>
        </SortableCard>,
        ['a'],
      ),
    )
    expect(screen.getByText('card-body')).toBeInTheDocument()
  })

  it('SortableCard.Handle wraps its children in the drag-area chrome', () => {
    render(
      wrap(
        <SortableCard id="a">
          <SortableCard.Handle>
            <img alt="thumb" src="blob:mock" />
          </SortableCard.Handle>
        </SortableCard>,
        ['a'],
      ),
    )
    const img = screen.getByAltText('thumb')
    const handleEl = img.parentElement
    expect(handleEl?.className).toContain('cursor-grab')
    expect(handleEl?.className).toContain('aspect-square')
  })

  it('renders the remove badge with the supplied aria-label and fires onRemove', () => {
    const onRemove = vi.fn()
    render(
      wrap(
        <SortableCard id="a" onRemove={onRemove} removeLabel="Remove foo.png">
          <span>body</span>
        </SortableCard>,
        ['a'],
      ),
    )

    const removeBtn = screen.getByRole('button', { name: 'Remove foo.png' })
    fireEvent.click(removeBtn)
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('omits the remove badge when onRemove is not provided', () => {
    render(
      wrap(
        <SortableCard id="a">
          <span>body</span>
        </SortableCard>,
        ['a'],
      ),
    )
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('SortableCard.Handle throws when rendered outside SortableCard', () => {
    // Suppress the React error log noise from the expected throw.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<SortableCard.Handle>x</SortableCard.Handle>)).toThrow(
      /SortableCard\.Handle must be rendered inside <SortableCard>/,
    )
    errorSpy.mockRestore()
  })
})
