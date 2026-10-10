import type { SearchInputProps } from '@/types'
import { MOD_KEY_LABEL } from '@/utils'

import { SearchIcon } from '../icon'

export const SearchInput = ({
  activeDescendantId,
  expanded,
  onChange,
  onKeyDown,
  placeholder = 'Search tools...',
  value,
}: SearchInputProps) => {
  return (
    <div className="flex items-center gap-3 border-b border-gray-800 px-4 py-3">
      <SearchIcon size={18} />
      <input
        aria-activedescendant={activeDescendantId}
        aria-autocomplete="list"
        aria-controls="command-palette-results"
        aria-expanded={expanded}
        aria-label="Search tools"
        autoComplete="off"
        className="grow bg-transparent text-white placeholder:text-gray-500 focus:outline-none"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        role="combobox"
        spellCheck="false"
        type="text"
        value={value}
      />
      <kbd className="hidden rounded bg-gray-800 px-1.5 py-0.5 text-body-xs text-gray-500 tablet:inline-block">
        {MOD_KEY_LABEL}K
      </kbd>
    </div>
  )
}
