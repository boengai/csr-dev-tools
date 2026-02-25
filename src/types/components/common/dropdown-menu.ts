import type { ReactElement } from 'react'

export type DropdownMenuProps = {
  items: Array<{
    active?: boolean
    'data-testid'?: string
    label: string
    onSelect: () => void
  }>
  trigger: ReactElement
}
