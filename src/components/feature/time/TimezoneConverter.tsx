import { AnimatePresence, m } from 'motion/react'
import { useCallback, useEffect, useId, useMemo, useReducer, useRef, useState } from 'react'

import { Button, CopyButton, FieldForm, TextInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import type { TargetResult, ConverterState, ConverterAction } from '@/types/components/feature/time/timezoneConverter'
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

function loadFavorites(): Array<string> {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveFavorites(favorites: Array<string>): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
}

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
  index,
  onSelect,
  placeholder,
}: {
  favorites: Array<string>
  index: Array<TimezoneEntry>
  onSelect: (id: string) => void
  placeholder: string
}) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listboxId = useId()

  const sortedIndex = useMemo(() => {
    const favSet = new Set(favorites)
    const favEntries = index.filter((e) => favSet.has(e.id))
    const nonFavEntries = index.filter((e) => !favSet.has(e.id))
    return [...favEntries, ...nonFavEntries]
  }, [favorites, index])

  const filtered = useMemo(() => searchTimezones(query, sortedIndex), [query, sortedIndex])
  const visibleItems = useMemo(() => filtered.slice(0, 50), [filtered])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectItem = (id: string) => {
    onSelect(id)
    setQuery('')
    setIsOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((prev) => (prev < visibleItems.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < visibleItems.length) {
          selectItem(visibleItems[activeIndex].id)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]')
      items[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

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

function converterReducer(state: ConverterState, action: ConverterAction): ConverterState {
  switch (action.type) {
    case 'SET_SOURCE_TZ':
      return { ...state, sourceTz: action.payload }
    case 'SET_DATE_INPUT':
      return { ...state, dateInput: action.payload }
    case 'SET_TIME_INPUT':
      return { ...state, timeInput: action.payload }
    case 'SET_DATE_AND_TIME':
      return { ...state, dateInput: action.payload.dateInput, timeInput: action.payload.timeInput }
    case 'SET_TARGET_TZ_IDS':
      return { ...state, targetTzIds: action.payload }
    case 'ADD_TARGET_TZ':
      if (state.targetTzIds.includes(action.payload)) return { ...state, showAddPicker: false }
      return { ...state, targetTzIds: [...state.targetTzIds, action.payload], showAddPicker: false }
    case 'REMOVE_TARGET_TZ':
      return { ...state, targetTzIds: state.targetTzIds.filter((tz) => tz !== action.payload) }
    case 'SET_FAVORITES':
      return { ...state, favorites: action.payload }
    case 'SET_RESULTS':
      return { ...state, results: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_SHOW_ADD_PICKER':
      return { ...state, showAddPicker: action.payload }
    case 'SET_CONVERSION_RESULT':
      return { ...state, error: action.payload.error, results: action.payload.results }
  }
}

function createInitialConverterState(): ConverterState {
  const sourceTz = getLocalTimezone()
  return {
    sourceTz,
    dateInput: formatNowDate(),
    timeInput: formatNowTime(),
    targetTzIds: getInitialTargets(sourceTz),
    favorites: loadFavorites(),
    results: [],
    error: '',
    showAddPicker: false,
  }
}

export const TimezoneConverter = (_props: ToolComponentProps) => {
  const [state, dispatch] = useReducer(converterReducer, null, createInitialConverterState)
  const { sourceTz, dateInput, timeInput, targetTzIds, favorites, results, error, showAddPicker } = state

  const index = useMemo(() => buildTimezoneIndex(), [])

  // Use refs to avoid stale closures in debounced callback
  const sourceTzRef = useRef(sourceTz)
  const dateInputRef = useRef(dateInput)
  const timeInputRef = useRef(timeInput)
  const targetTzIdsRef = useRef(targetTzIds)
  sourceTzRef.current = sourceTz
  dateInputRef.current = dateInput
  timeInputRef.current = timeInput
  targetTzIdsRef.current = targetTzIds

  const computeResults = useCallback(() => {
    const src = sourceTzRef.current
    const d = dateInputRef.current
    const t = timeInputRef.current
    const targets = targetTzIdsRef.current

    if (!d || !t) {
      dispatch({ type: 'SET_CONVERSION_RESULT', payload: { error: '', results: [] } })
      return
    }

    const parsed = parseDateTimeInput(d, t, src)
    if (!parsed) {
      dispatch({ type: 'SET_CONVERSION_RESULT', payload: { error: 'Invalid date or time input', results: [] } })
      return
    }

    const newResults: Array<TargetResult> = targets.map((tzId) => ({
      result: convertTimezone(parsed, src, tzId),
      timezoneId: tzId,
    }))
    dispatch({ type: 'SET_CONVERSION_RESULT', payload: { error: '', results: newResults } })
  }, [])

  const debouncedCompute = useDebounceCallback(computeResults, 300)

  // Trigger conversion on any input change
  useEffect(() => {
    debouncedCompute()
  }, [sourceTz, dateInput, timeInput, targetTzIds, debouncedCompute])

  const handleNow = () => {
    dispatch({ type: 'SET_DATE_AND_TIME', payload: { dateInput: formatNowDate(), timeInput: formatNowTime() } })
  }

  const handleAddTarget = (id: string) => {
    dispatch({ type: 'ADD_TARGET_TZ', payload: id })
  }

  const handleRemoveTarget = (id: string) => {
    dispatch({ type: 'REMOVE_TARGET_TZ', payload: id })
  }

  const handleToggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id]
    saveFavorites(next)
    dispatch({ type: 'SET_FAVORITES', payload: next })
  }

  const handleSourceSelect = (id: string) => {
    dispatch({ type: 'SET_SOURCE_TZ', payload: id })
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
              index={index}
              onSelect={handleSourceSelect}
              placeholder="Search timezones..."
            />
          </div>

          <div className="flex gap-2">
            <FieldForm
              label="Date"
              name="tz-date"
              onChange={(val: string) => dispatch({ type: 'SET_DATE_INPUT', payload: val })}
              type="date"
              value={dateInput}
            />
            <FieldForm
              label="Time"
              name="tz-time"
              onChange={(val: string) => dispatch({ type: 'SET_TIME_INPUT', payload: val })}
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
              onClick={() => dispatch({ type: 'SET_SHOW_ADD_PICKER', payload: !showAddPicker })}
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
              {results.map(({ result, timezoneId }) => {
                const entry = index.find((e) => e.id === timezoneId)
                const isFav = favorites.includes(timezoneId)
                const copyValue = `${result.date} ${result.time} ${result.abbreviation}`
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
                          {result.abbreviation}, {result.offset}
                        </span>
                      </div>
                      <div className="text-body-md font-semibold text-gray-100">
                        {result.date} {result.time}
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
