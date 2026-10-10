import type { KeyboardEvent } from 'react'

import type { ToolRegistryEntry } from '@/types/constants'

export type CommandPaletteBodyProps = {
  onSelect: (tool: ToolRegistryEntry) => void
}

export type SearchInputProps = {
  activeDescendantId?: string
  /** Whether the results listbox currently has options (drives `aria-expanded`). */
  expanded: boolean
  onChange: (value: string) => void
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void
  placeholder?: string
  value: string
}
