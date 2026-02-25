import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { CopyButton, TextInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback } from '@/hooks'
import {
  type ConversionResult,
  type TimezoneEntry,
  buildTimezoneIndex,
  convertTimezone,
  getLocalTimezone,
  parseDateTimeInput,
  searchTimezones,
} from '@/utils/timezone-converter'

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

type TargetResult = {
  result: ConversionResult
  timezoneId: string
}

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

  // Reset active index when filtered results change
  useEffect(() => {
    setActiveIndex(-1)
  }, [filtered])

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
    <div className="relative" onKeyDown={handleKeyDown} ref={containerRef}>
      <TextInput
        name="timezone-search"
        onChange={(val) => {
          setQuery(val)
          setIsOpen(true)
        }}
        placeholder={placeholder}
        type="text"
        value={query}
      />
      {isOpen && (
        <ul
          className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-700 bg-gray-900 shadow-lg"
          ref={listRef}
          role="listbox"
        >
          {visibleItems.length === 0 && <li className="px-3 py-2 text-body-xs text-gray-500">No timezones found</li>}
          {visibleItems.map((entry, i) => (
            <li
              aria-selected={i === activeIndex}
              className={`cursor-pointer px-3 py-2 text-body-sm text-gray-300 hover:bg-gray-800 ${i === activeIndex ? 'bg-gray-800' : ''}`}
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

export const TimezoneConverter = (_props: ToolComponentProps) => {
  const [sourceTz, setSourceTz] = useState(getLocalTimezone)
  const [dateInput, setDateInput] = useState(formatNowDate)
  const [timeInput, setTimeInput] = useState(formatNowTime)
  const [targetTzIds, setTargetTzIds] = useState<Array<string>>(() => getInitialTargets(getLocalTimezone()))
  const [favorites, setFavorites] = useState<Array<string>>(loadFavorites)
  const [results, setResults] = useState<Array<TargetResult>>([])
  const [error, setError] = useState('')
  const [showAddPicker, setShowAddPicker] = useState(false)

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
      setResults([])
      setError('')
      return
    }

    const parsed = parseDateTimeInput(d, t, src)
    if (!parsed) {
      setError('Invalid date or time input')
      setResults([])
      return
    }

    setError('')
    const newResults: Array<TargetResult> = targets.map((tzId) => ({
      result: convertTimezone(parsed, src, tzId),
      timezoneId: tzId,
    }))
    setResults(newResults)
  }, [])

  const debouncedCompute = useDebounceCallback(computeResults, 300)

  // Trigger conversion on any input change
  useEffect(() => {
    debouncedCompute()
  }, [sourceTz, dateInput, timeInput, targetTzIds, debouncedCompute])

  const handleNow = () => {
    setDateInput(formatNowDate())
    setTimeInput(formatNowTime())
  }

  const handleAddTarget = (id: string) => {
    if (!targetTzIds.includes(id)) {
      setTargetTzIds((prev) => [...prev, id])
    }
    setShowAddPicker(false)
  }

  const handleRemoveTarget = (id: string) => {
    setTargetTzIds((prev) => prev.filter((tz) => tz !== id))
  }

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
      saveFavorites(next)
      return next
    })
  }

  const handleSourceSelect = (id: string) => {
    setSourceTz(id)
  }

  const sourceEntry = useMemo(() => index.find((e) => e.id === sourceTz), [index, sourceTz])

  return (
    <div className="flex grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <div className="md:flex-row flex flex-col gap-4">
        {/* Source Section */}
        <section className="md:w-2/5 flex flex-col gap-3">
          <h3 className="text-body-sm font-semibold text-gray-300">Source</h3>

          <div>
            <label className="mb-1 block text-body-xs text-gray-500">Timezone</label>
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
            <div className="flex-1">
              <label className="mb-1 block text-body-xs text-gray-500" htmlFor="tz-date">
                Date
              </label>
              <input
                className="focus:border-blue-500 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-body-sm text-gray-200 focus:outline-none"
                id="tz-date"
                onChange={(e) => setDateInput(e.target.value)}
                type="date"
                value={dateInput}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-body-xs text-gray-500" htmlFor="tz-time">
                Time
              </label>
              <input
                className="focus:border-blue-500 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-body-sm text-gray-200 focus:outline-none"
                id="tz-time"
                onChange={(e) => setTimeInput(e.target.value)}
                type="time"
                value={timeInput}
              />
            </div>
          </div>

          <button
            aria-label="Set current date and time"
            className="bg-blue-600 hover:bg-blue-700 w-full rounded px-3 py-2 text-body-sm font-medium text-white"
            data-testid="now-button"
            onClick={handleNow}
            type="button"
          >
            Now
          </button>

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
              {results.map(({ result, timezoneId }) => {
                const entry = index.find((e) => e.id === timezoneId)
                const isFav = favorites.includes(timezoneId)
                const copyValue = `${result.date} ${result.time} ${result.abbreviation}`
                return (
                  <motion.div
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
                        className={`p-1 text-body-sm ${isFav ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'}`}
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
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  )
}
