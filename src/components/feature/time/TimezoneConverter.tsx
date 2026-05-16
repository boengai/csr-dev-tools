import { AnimatePresence, m } from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { Button, CopyButton, FieldForm, TextInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { readJsonStorage, useKeyboardListNav, useToolFieldsPersisted, writeJsonStorage } from '@/hooks'
import type { TargetResult, ToolComponentProps } from '@/types'
import {
  buildTimezoneIndex,
  convertTimezone,
  getLocalTimezone,
  parseDateTimeInput,
  searchTimezones,
  type TimezoneEntry,
  tv,
} from '@/utils'

const FAVORITES_KEY = 'csr-dev-tools-timezone-favorites'

const loadFavorites = (): Array<string> => readJsonStorage<Array<string>>(FAVORITES_KEY, [])

const saveFavorites = (favorites: Array<string>): void => writeJsonStorage(FAVORITES_KEY, favorites)

function formatNowDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatNowTime(): string {
  const d = new Date()
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

const DEFAULT_TARGETS = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo']

function getInitialTargets(localTz: string): Array<string> {
  return DEFAULT_TARGETS.filter((tz) => tz !== localTz).slice(0, 3)
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
      true: 'text-yellow-400',
      false: 'text-gray-600 hover:text-gray-400',
    },
  },
})

const TimezoneSearchPicker = ({
  favorites,
  id,
  index,
  onSelect,
  placeholder,
}: {
  favorites: Array<string>
  id?: string
  index: Array<TimezoneEntry>
  onSelect: (id: string) => void
  placeholder: string
}) => {
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
    activeIndex,
    handleKeyDown: handleListNavKeyDown,
    listRef,
    setActiveIndex,
  } = useKeyboardListNav<TimezoneEntry>(visibleItems, {
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

  return (
    <div
      aria-controls={listboxId}
      aria-expanded={isOpen}
      className="relative"
      onKeyDown={handleKeyDown}
      ref={containerRef}
      role="combobox"
    >
      <TextInput
        aria-label="Search timezones"
        id={id}
        name="timezone-search"
        onChange={(val) => {
          setQuery(val)
          setIsOpen(true)
          setActiveIndex(-1)
        }}
        placeholder={placeholder}
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
              key={entry.id}
              onClick={() => selectItem(entry.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') selectItem(entry.id)
              }}
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

type ConverterInput = {
  dateInput: string
  sourceTz: string
  targetTzIds: Array<string>
  timeInput: string
}

type ConverterOutput = {
  error: string
  results: Array<TargetResult>
}

const INITIAL_OUTPUT: ConverterOutput = { error: '', results: [] }

const computeConversion = ({ dateInput, sourceTz, targetTzIds, timeInput }: ConverterInput): ConverterOutput => {
  if (!dateInput || !timeInput) return { error: '', results: [] }

  const parsed = parseDateTimeInput(dateInput, timeInput, sourceTz)
  if (!parsed) return { error: 'Invalid date or time input', results: [] }

  return {
    error: '',
    results: targetTzIds.map((tzId) => ({
      result: convertTimezone(parsed, sourceTz, tzId),
      timezoneId: tzId,
    })),
  }
}

export const TimezoneConverter = (_props: ToolComponentProps) => {
  const initialInput = useMemo<ConverterInput>(() => {
    const sourceTz = getLocalTimezone()
    return {
      dateInput: formatNowDate(),
      sourceTz,
      targetTzIds: getInitialTargets(sourceTz),
      timeInput: formatNowTime(),
    }
  }, [])

  const { inputs, result, setFields, setFieldsImmediate } = useToolFieldsPersisted<ConverterInput, ConverterOutput>({
    compute: computeConversion,
    debounceMs: 300,
    initial: initialInput,
    initialResult: INITIAL_OUTPUT,
    storageKey: 'csr-dev-tools-timezone-converter',
  })

  const { dateInput, sourceTz, targetTzIds, timeInput } = inputs
  const { error, results } = result

  // Persisted bag may hold stale date/time from last session. Override them with
  // "now" on mount; sourceTz + targetTzIds keep their persisted values. This
  // setFieldsImmediate also kicks the compute (the hook doesn't autorun without
  // an `isEmpty` gate, which doesn't fit this Tool's defaults-from-`getLocalTimezone`
  // initial bag).
  useEffect(() => {
    setFieldsImmediate({ dateInput: formatNowDate(), timeInput: formatNowTime() })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, [])

  // UI-only state lives outside the input bag.
  const [favorites, setFavorites] = useState<Array<string>>(loadFavorites)
  const [showAddPicker, setShowAddPicker] = useState(false)

  const index = useMemo(() => buildTimezoneIndex(), [])

  const handleNow = () => {
    setFieldsImmediate({ dateInput: formatNowDate(), timeInput: formatNowTime() })
  }

  const handleAddTarget = (id: string) => {
    setShowAddPicker(false)
    if (targetTzIds.includes(id)) return
    setFields({ targetTzIds: [...targetTzIds, id] })
  }

  const handleRemoveTarget = (id: string) => {
    setFields({ targetTzIds: targetTzIds.filter((tz) => tz !== id) })
  }

  const handleToggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id]
    saveFavorites(next)
    setFavorites(next)
  }

  const sourceEntry = useMemo(() => index.find((e) => e.id === sourceTz), [index, sourceTz])

  return (
    <div className="flex grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

      <div className="md:flex-row flex flex-col gap-4">
        {/* Source Section */}
        <section className="md:w-2/5 flex flex-col gap-3">
          <h3 className="text-body-sm font-semibold text-gray-300">Source</h3>

          <div>
            <label className="mb-1 block text-body-xs text-gray-500" htmlFor="source-timezone-search">
              Timezone
            </label>
            {sourceEntry && (
              <div className="mb-1 flex items-center gap-1">
                <span className="rounded bg-gray-800 px-2 py-0.5 text-body-xs text-gray-200">
                  {sourceEntry.city} ({sourceEntry.abbreviation})
                </span>
              </div>
            )}
            <TimezoneSearchPicker
              favorites={favorites}
              id="source-timezone-search"
              index={index}
              onSelect={(id) => setFields({ sourceTz: id })}
              placeholder="Search timezones..."
            />
          </div>

          <div className="flex gap-2">
            <FieldForm
              label="Date"
              name="tz-date"
              onChange={(val: string) => setFields({ dateInput: val })}
              type="date"
              value={dateInput}
            />
            <FieldForm
              label="Time"
              name="tz-time"
              onChange={(val: string) => setFields({ timeInput: val })}
              type="time"
              value={timeInput}
            />
          </div>

          <Button block data-testid="now-button" onClick={handleNow} variant="primary">
            Now
          </Button>

          {error && (
            <p className="text-red-400 text-body-xs" role="alert">
              {error}
            </p>
          )}
        </section>

        {/* Target Timezones Section */}
        <section className="md:w-3/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-body-sm font-semibold text-gray-300">Target Timezones</h3>
            <button
              aria-label="Add target timezone"
              className="rounded bg-gray-700 px-3 py-1 text-body-xs text-gray-200 hover:bg-gray-600"
              data-testid="add-timezone-button"
              onClick={() => setShowAddPicker((prev) => !prev)}
              type="button"
            >
              + Add Timezone
            </button>
          </div>

          {showAddPicker && (
            <div className="rounded border border-gray-700 bg-gray-900/50 p-2">
              <TimezoneSearchPicker
                favorites={favorites}
                index={index}
                onSelect={handleAddTarget}
                placeholder="Search to add timezone..."
              />
            </div>
          )}

          <div aria-live="polite" className="flex flex-col gap-2">
            {results.length === 0 && targetTzIds.length === 0 && (
              <p className="text-body-xs text-gray-500">Add a target timezone to see conversions</p>
            )}
            <AnimatePresence mode="popLayout">
              {results.map(({ result: tzResult, timezoneId }) => {
                const entry = index.find((e) => e.id === timezoneId)
                const isFav = favorites.includes(timezoneId)
                const copyValue = `${tzResult.date} ${tzResult.time} ${tzResult.abbreviation}`
                return (
                  <m.div
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between rounded border border-gray-700 bg-gray-900 p-3"
                    exit={{ opacity: 0, y: -10 }}
                    initial={{ opacity: 0, y: 10 }}
                    key={timezoneId}
                    layout
                    role="status"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="text-body-sm font-medium text-gray-200">
                        {entry?.city ?? timezoneId}
                        <span className="ml-1 text-gray-500">
                          {tzResult.abbreviation}, {tzResult.offset}
                        </span>
                      </div>
                      <div className="text-body-md font-semibold text-gray-100">
                        {tzResult.date} {tzResult.time}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <CopyButton label={entry?.city ?? timezoneId} value={copyValue} />
                      <button
                        aria-label={
                          isFav
                            ? `Remove ${entry?.city ?? timezoneId} from favorites`
                            : `Add ${entry?.city ?? timezoneId} to favorites`
                        }
                        className={favoriteButtonStyles({ favorite: isFav })}
                        onClick={() => handleToggleFavorite(timezoneId)}
                        type="button"
                      >
                        {isFav ? '★' : '☆'}
                      </button>
                      <button
                        aria-label={`Remove ${entry?.city ?? timezoneId}`}
                        className="hover:text-red-400 p-1 text-body-sm text-gray-600"
                        onClick={() => handleRemoveTarget(timezoneId)}
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  </m.div>
                )
              })}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  )
}
