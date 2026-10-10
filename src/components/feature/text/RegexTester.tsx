import { useState } from 'react'

import { Button, CopyButton, FieldForm, Pane, ToggleButton } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolFields } from '@/hooks'
import type {
  Flags,
  RegexComputed,
  RegexFlagToggleProps,
  RegexInput,
  RegexMatchDetailsProps,
  ToolComponentProps,
} from '@/types'
import { buildHighlightSegments, formatMatchesForCopy } from '@/utils'
import { runRegex } from '@/utils/regex-runner'

const toolEntry = TOOL_REGISTRY_MAP['regex-tester']
const DEFAULT_FLAGS: Flags = { g: true, i: false, m: false }

// Rendering thousands of match cards stalls React; page them in.
const MATCH_PAGE_SIZE = 200
const INITIAL_INPUT: RegexInput = { flags: DEFAULT_FLAGS, pattern: '', testString: '' }
const INITIAL_COMPUTED: RegexComputed = { regex: null, segments: [] }

// Curated set of common patterns developers reach for. Each preset only sets
// the pattern; the user's existing flags are preserved so they don't lose
// state by clicking a chip.
const PRESETS: ReadonlyArray<{ label: string; pattern: string }> = [
  { label: 'Email', pattern: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}' },
  { label: 'URL', pattern: 'https?://[^\\s]+' },
  { label: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b' },
  { label: 'UUID', pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}' },
  { label: 'Hex color', pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b' },
]

const flagsToString = (flags: Flags) =>
  Object.entries(flags)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join('')

const FlagToggle = ({ active, flag, onToggle }: RegexFlagToggleProps) => (
  <ToggleButton aria-label={`Toggle ${flag} flag`} onClick={onToggle} pressed={active} size="compact">
    {flag}
  </ToggleButton>
)

const MatchDetails = ({ matches }: RegexMatchDetailsProps) => {
  const [limit, setLimit] = useState(MATCH_PAGE_SIZE)
  const [shownFor, setShownFor] = useState(matches)
  // New result set → collapse back to the first page (render-phase reset).
  if (shownFor !== matches) {
    setShownFor(matches)
    setLimit(MATCH_PAGE_SIZE)
  }
  const remaining = matches.length - limit

  return (
    <div className="flex flex-col gap-2">
      {matches.slice(0, limit).map((match, i) => (
        <div
          className="text-sm rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2"
          key={`${match.index}-${match.fullMatch}`}
        >
          <p className="text-gray-300">
            <span className="font-medium text-gray-200">Match {i + 1}:</span>{' '}
            <span className="font-mono text-primary">&quot;{match.fullMatch}&quot;</span> at index {match.index}
          </p>
          {match.groups.length > 0 && (
            <div className="mt-1 flex flex-col gap-0.5 pl-4 text-gray-400">
              {match.groups.map((group, g) => (
                <p key={`group-${g}`}>
                  Group {g + 1}:{' '}
                  {group === undefined ? (
                    <span className="text-gray-600 italic">undefined</span>
                  ) : (
                    <span className="font-mono">{group}</span>
                  )}
                </p>
              ))}
            </div>
          )}
          {match.namedGroups != null && (
            <div className="mt-1 flex flex-col gap-0.5 pl-4 text-gray-400">
              {Object.entries(match.namedGroups).map(([name, value]) => (
                <p key={name}>
                  {name}: <span className="font-mono">{value}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
      {remaining > 0 && (
        <Button onClick={() => setLimit((l) => l + MATCH_PAGE_SIZE)} variant="secondary">
          {`Show ${Math.min(remaining, MATCH_PAGE_SIZE)} more (${remaining} hidden)`}
        </Button>
      )}
    </div>
  )
}

export const RegexTester = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const {
    error,
    inputs,
    isPending: loading,
    reset,
    result: computed,
    setFields,
  } = useToolFields<RegexInput, RegexComputed>({
    // The pipeline aborts `signal` when a newer input supersedes this run, on
    // clear, and on unmount — which terminates a still-running (possibly
    // runaway) pattern in the worker.
    compute: async ({ flags: fl, pattern: pat, testString: text }, { signal }) => {
      const r = await runRegex(pat, flagsToString(fl), text, signal)
      if (r.error != null) throw new Error(r.error)
      return { regex: r, segments: buildHighlightSegments(text, r.matches) }
    },
    debounceMs: 300,
    errorFallback: 'Invalid regex',
    initial: INITIAL_INPUT,
    initialResult: INITIAL_COMPUTED,
    isEmpty: ({ pattern: pat, testString: text }) => pat.trim() === '' || text.trim() === '',
  })

  const { flags, pattern, testString } = inputs
  const matches = computed.regex?.matches ?? []
  const matchCount = matches.length
  const copyText = computed.regex ? formatMatchesForCopy(matches) : ''
  const errorMessage = error instanceof Error ? error.message : null

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterClose}
      onReset={reset}
      title="Regex Tester"
      triggers={[{ label: 'Test Regex' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <div className="flex items-center gap-2 text-body-xs text-gray-400">
          <span>Presets:</span>
          {PRESETS.map((preset) => (
            <button
              className="cursor-pointer rounded border border-gray-700 px-2 py-0.5 transition-colors hover:border-primary hover:text-primary"
              key={preset.label}
              onClick={() => setFields({ pattern: preset.pattern })}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <FieldForm
            label={
              <span className="flex items-center gap-2">
                <span>Pattern</span>
                <span className="flex gap-1">
                  <FlagToggle
                    active={flags.g}
                    flag="g"
                    onToggle={() => setFields({ flags: { ...flags, g: !flags.g } })}
                  />
                  <FlagToggle
                    active={flags.i}
                    flag="i"
                    onToggle={() => setFields({ flags: { ...flags, i: !flags.i } })}
                  />
                  <FlagToggle
                    active={flags.m}
                    flag="m"
                    onToggle={() => setFields({ flags: { ...flags, m: !flags.m } })}
                  />
                </span>
              </span>
            }
            name="pattern"
            onChange={(val) => setFields({ pattern: val })}
            placeholder="\d+"
            type="text"
            value={pattern}
          />

          <FieldForm
            label="Test String"
            name="test-string"
            onChange={(val) => setFields({ testString: val })}
            placeholder="Enter text to test against..."
            type="code"
            value={testString}
          />
        </div>

        <div className="border-t-2 border-dashed border-gray-900" />

        <Pane live>
          {errorMessage && (
            <p className="rounded border border-error/50 bg-error/10 px-3 py-2 text-body-xs text-error" role="alert">
              {errorMessage}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-body-sm font-medium text-gray-400">
              {loading
                ? 'Computing...'
                : computed.regex != null
                  ? `${matchCount} ${matchCount === 1 ? 'match' : 'matches'} found`
                  : 'Output'}
            </span>
            {computed.regex?.capped && <span className="text-body-xs text-warning">Showing first 5,000 matches</span>}
            {copyText && <CopyButton label="matches" value={copyText} />}
          </div>

          <div className="text-sm wrap-break-words overflow-auto rounded-lg border border-gray-800 bg-gray-950 p-3 font-mono whitespace-pre-wrap">
            {computed.segments.length > 0 ? (
              (() => {
                let offset = 0
                return computed.segments.map((segment) => {
                  const key = `seg-${offset}`
                  offset += segment.text.length
                  return segment.isMatch ? (
                    <span className="rounded-xs bg-primary/20 text-primary" key={key}>
                      {segment.text}
                    </span>
                  ) : (
                    <span className="text-gray-400" key={key}>
                      {segment.text}
                    </span>
                  )
                })
              })()
            ) : (
              <p className="text-gray-600">Highlighted matches will appear here...</p>
            )}
          </div>

          {matches.length > 0 && <MatchDetails matches={matches} />}
        </Pane>
      </div>
    </ToolDialogFrame>
  )
}
