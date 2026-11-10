import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { Button, TextInput, TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { readJsonStorage, useKeyboardListNav, writeJsonStorage } from '@/hooks'
import type { TimezoneConverterInput, TimezoneSearchPickerProps, ToolComponentProps, TransformerField } from '@/types'
import {
  buildTimezoneIndex,
  convertTimezone,
  getLocalTimezone,
  parseDateTimeInput,
  searchTimezones,
  type TimezoneEntry,
  tv,
} from '@/utils'

const STORAGE_KEY = 'csr-dev-tools-timezone-converter'
const FAVORITES_KEY = 'csr-dev-tools-timezone-favorites'

const loadFavorites = (): Array<string> => readJsonStorage<Array<string>>(FAVORITES_KEY, [])

const saveFavorites = (favorites: Array<string>): void => writeJsonStorage(FAVORITES_KEY, favorites)

const pad = (n: number): string => String(n).padStart(2, '0')

/** Now, as the source text: `YYYY-MM-DD HH:mm` in local time. */
const formatNow = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const DEFAULT_TARGETS = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo']

const getInitialTargets = (localTz: string): Array<string> => DEFAULT_TARGETS.filter((tz) => tz !== localTz).slice(0, 3)

// Bags saved before the shell were `{ dateInput, timeInput, sourceTz, targetTzIds }`.
// Keep the zones; the date and time were always replaced by "now" on open.
const migrateStoredBag = (): true => {
  const stored = readJsonStorage<Record<string, unknown> | null>(STORAGE_KEY, null)
  if (stored && typeof stored === 'object' && !('source' in stored) && typeof stored.sourceTz === 'string') {
    writeJsonStorage<TimezoneConverterInput>(STORAGE_KEY, {
      source: '',
      sourceTz: stored.sourceTz,
      targetTzIds: Array.isArray(stored.targetTzIds) ? stored.targetTzIds.filter((t) => typeof t === 'string') : [],
    })
  }
  return true
}

const cityOf = (tzId: string): string => (tzId.split('/').pop() ?? tzId).replace(/_/g, ' ')

const DATE_TIME = /^(\d{4}-\d{1,2}-\d{1,2})[ T](\d{1,2}:\d{2}(?::\d{2})?)$/

const computeConversion = ({ source, sourceTz, targetTzIds }: TimezoneConverterInput): Array<TransformerField> => {
  const match = DATE_TIME.exec(source.trim())
  const parsed = match ? parseDateTimeInput(match[1] ?? '', match[2] ?? '', sourceTz) : null
  if (!parsed) throw new Error('Enter a date and time as YYYY-MM-DD HH:mm (e.g. 2026-11-10 14:30)')
  return targetTzIds.map((tzId) => {
    const { abbreviation, date, offset, time } = convertTimezone(parsed, sourceTz, tzId)
    return { label: `${cityOf(tzId)} — ${abbreviation}, ${offset}`, value: `${date} ${time} ${abbreviation}` }
  })
}

const toolEntry = TOOL_REGISTRY_MAP['timezone-converter']

const pickerItemStyles = tv({
  base: 'cursor-pointer px-3 py-2 text-body-sm text-gray-300 hover:bg-gray-800',
  variants: {
    active: {
      true: 'bg-gray-800',
      false: '',
    },
  },
})

const favoriteButtonStyles = tv({
  base: 'p-1 text-body-sm',
  variants: {
    favorite: {
      true: 'text-warning',
      false: 'text-gray-600 hover:text-gray-400',
    },
  },
})

const TimezoneSearchPicker = ({
  'aria-label': ariaLabel,
  favorites,
  id,
  index,
  onSelect,
  placeholder,
}: TimezoneSearchPickerProps) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  const sortedIndex = useMemo(() => {
    const favSet = new Set(favorites)
    const favEntries = index.filter((e) => favSet.has(e.id))
    const nonFavEntries = index.filter((e) => !favSet.has(e.id))
    return [...favEntries, ...nonFavEntries]
  }, [favorites, index])

  const filtered = useMemo(() => searchTimezones(query, sortedIndex), [query, sortedIndex])
  const visibleItems = useMemo(() => filtered.slice(0, 50), [filtered])

  const {
    activeDescendantId,
    activeIndex,
    handleKeyDown: handleListNavKeyDown,
    listRef,
    setActiveIndex,
  } = useKeyboardListNav<TimezoneEntry>(visibleItems, {
    getOptionId: (entry) => `${listboxId}-${entry.id}`,
    initialIndex: -1,
    onEnter: (entry) => selectItem(entry.id),
  })

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setActiveIndex])

  const selectItem = (id: string) => {
    onSelect(id)
    setQuery('')
    setIsOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return
    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      setActiveIndex(-1)
      return
    }
    handleListNavKeyDown(e)
  }

  // The input is the combobox (role + expanded/controls/activedescendant), per
  // the ARIA 1.2 pattern; the wrapper only catches the input's bubbled key
  // events for list navigation.
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- keydown bubbles from the input, which owns the combobox state
    <div className="relative" onKeyDown={handleKeyDown} ref={containerRef}>
      <TextInput
        aria-activedescendant={activeDescendantId}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        id={id}
        name="timezone-search"
        onChange={(val) => {
          setQuery(val)
          setIsOpen(true)
          setActiveIndex(-1)
        }}
        placeholder={placeholder}
        role="combobox"
        type="text"
        value={query}
      />
      {isOpen && (
        <ul
          className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-700 bg-gray-900 shadow-lg"
          id={listboxId}
          ref={listRef}
          role="listbox"
        >
          {visibleItems.length === 0 && <li className="px-3 py-2 text-body-xs text-gray-500">No timezones found</li>}
          {visibleItems.map((entry, i) => (
            <li
              aria-selected={i === activeIndex}
              className={pickerItemStyles({ active: i === activeIndex })}
              id={`${listboxId}-${entry.id}`}
              key={entry.id}
              onClick={() => selectItem(entry.id)}
              role="option"
            >
              <span className="font-medium text-gray-100">{entry.city}</span>
              <span className="ml-1 text-gray-500">
                — {entry.abbreviation}, {entry.offset}
              </span>
              {favorites.includes(entry.id) && <span className="ml-1">★</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const TimezoneConverter = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  useState(migrateStoredBag)

  const initial = useMemo<TimezoneConverterInput>(() => {
    const sourceTz = getLocalTimezone()
    return { source: '', sourceTz, targetTzIds: getInitialTargets(sourceTz) }
  }, [])

  // UI-only state lives outside the input bag.
  const [favorites, setFavorites] = useState<Array<string>>(loadFavorites)
  const [showAddPicker, setShowAddPicker] = useState(false)

  const index = useMemo(() => buildTimezoneIndex(), [])

  const handleToggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id]
    saveFavorites(next)
    setFavorites(next)
  }

  return (
    <TransformerShell<TimezoneConverterInput, 'fields'>
      autoOpen={autoOpen}
      compute={computeConversion}
      description={toolEntry?.description}
      initial={initial}
      onAfterClose={onAfterClose}
      outputKind="fields"
      renderControls={({ inputs, setFieldsImmediate }) => {
        const sourceEntry = index.find((e) => e.id === inputs.sourceTz)
        const handleAddTarget = (id: string) => {
          setShowAddPicker(false)
          if (inputs.targetTzIds.includes(id)) return
          setFieldsImmediate({ targetTzIds: [...inputs.targetTzIds, id] })
        }
        return (
          <div className="flex w-full flex-col gap-3">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex w-full flex-col gap-1 tablet:w-72">
                <label className="text-body-xs text-gray-500" htmlFor="source-timezone-search">
                  Source timezone
                  {sourceEntry && (
                    <span className="ml-2 rounded bg-gray-800 px-2 py-0.5 text-gray-200">
                      {sourceEntry.city} ({sourceEntry.abbreviation})
                    </span>
                  )}
                </label>
                <TimezoneSearchPicker
                  favorites={favorites}
                  id="source-timezone-search"
                  index={index}
                  onSelect={(id) => setFieldsImmediate({ sourceTz: id })}
                  placeholder="Search timezones..."
                />
              </div>
              <Button
                data-testid="now-button"
                onClick={() => setFieldsImmediate({ source: formatNow() })}
                size="small"
                variant="primary"
              >
                Now
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-body-xs text-gray-500">Target timezones</span>
                {inputs.targetTzIds.map((tzId) => {
                  const city = index.find((e) => e.id === tzId)?.city ?? cityOf(tzId)
                  const isFav = favorites.includes(tzId)
                  return (
                    <span
                      className="flex items-center gap-1 rounded bg-gray-800 py-0.5 pl-2 text-body-xs text-gray-200"
                      key={tzId}
                    >
                      {city}
                      <button
                        aria-label={isFav ? `Remove ${city} from favorites` : `Add ${city} to favorites`}
                        className={favoriteButtonStyles({ favorite: isFav })}
                        onClick={() => handleToggleFavorite(tzId)}
                        type="button"
                      >
                        {isFav ? '★' : '☆'}
                      </button>
                      <button
                        aria-label={`Remove ${city}`}
                        className="p-1 text-body-xs text-gray-500 hover:text-error"
                        onClick={() =>
                          setFieldsImmediate({ targetTzIds: inputs.targetTzIds.filter((tz) => tz !== tzId) })
                        }
                        type="button"
                      >
                        ✕
                      </button>
                    </span>
                  )
                })}
                <Button
                  aria-label="Add target timezone"
                  data-testid="add-timezone-button"
                  onClick={() => setShowAddPicker((prev) => !prev)}
                  size="small"
                  variant="secondary"
                >
                  + Add Timezone
                </Button>
              </div>
              {showAddPicker && (
                <div className="w-full tablet:w-72">
                  <TimezoneSearchPicker
                    aria-label="Search timezones to add"
                    favorites={favorites}
                    index={index}
                    onSelect={handleAddTarget}
                    placeholder="Search to add timezone..."
                  />
                </div>
              )}
            </div>
          </div>
        )
      }}
      resultLabel="Converted times"
      resultPlaceholder="Enter a date and time (or press Now) to see it in each target timezone"
      sourceKind="text"
      sourceLabel="Date and time"
      sourcePlaceholder="2026-11-10 14:30"
      storageKey={STORAGE_KEY}
      title="Timezone Converter"
      triggerLabel="Convert"
    />
  )
}
