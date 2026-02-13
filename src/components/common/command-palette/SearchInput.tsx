import { useEffect, useRef } from 'react'

import type { SearchInputProps } from '@/types'

import { SearchIcon } from '@/components/common/icon'

export const SearchInput = ({
  activeDescendantId,
  onChange,
  placeholder = 'Search tools...',
  value,
}: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="flex items-center gap-3 border-b border-gray-800 px-4 py-3">
      <SearchIcon size={18} />
      <input
        aria-activedescendant={activeDescendantId}
        aria-autocomplete="list"
        aria-controls="command-palette-results"
        aria-expanded="true"
        aria-label="Search tools"
        autoComplete="off"
        className="grow bg-transparent text-white placeholder:text-gray-500 focus:outline-none"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        ref={inputRef}
        role="combobox"
        spellCheck="false"
        type="text"
        value={value}
      />
      <kbd className="text-body-xs rounded bg-gray-800 px-1.5 py-0.5 text-gray-500">
        {typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent) ? '⌘K' : 'Ctrl+K'}
      </kbd>
    </div>
  )
}
