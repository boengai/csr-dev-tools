import { useState } from 'react'

import { Button, CopyButton, FieldForm, ToggleButton } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolFields } from '@/hooks'
import type { Flags, ToolComponentProps } from '@/types'
import {
  buildHighlightSegments,
  executeRegex,
  formatMatchesForCopy,
  type HighlightSegment,
  type RegexMatch,
  type RegexResult,
} from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['regex-tester']
const DEFAULT_FLAGS: Flags = { g: true, i: false, m: false }

type RegexInput = { flags: Flags; pattern: string; testString: string }
type RegexComputed = { regex: RegexResult | null; segments: Array<HighlightSegment> }
const INITIAL_INPUT: RegexInput = { flags: DEFAULT_FLAGS, pattern: '', testString: '' }
const INITIAL_COMPUTED: RegexComputed = { regex: null, segments: [] }

const flagsToString = (flags: Flags) =>
  Object.entries(flags)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join('')

const FlagToggle = ({ active, flag, onToggle }: { active: boolean; flag: string; onToggle: () => void }) => (
  <ToggleButton aria-label={`Toggle ${flag} flag`} onClick={onToggle} pressed={active} size="compact">
    {flag}
  </ToggleButton>
)

const MatchDetails = ({ matches }: { matches: Array<RegexMatch> }) => (
  <div className="flex flex-col gap-2">
    {matches.map((match, i) => (
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
  </div>
)

export const RegexTester = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()

  const {
    inputs,
    isPending: loading,
    reset,
    result: computed,
    setFields,
  } = useToolFields<RegexInput, RegexComputed>({
    compute: ({ flags: fl, pattern: pat, testString: text }) => {
      const r = executeRegex(pat, flagsToString(fl), text)
      if (r.error != null) throw new Error(r.error)
      return { regex: r, segments: buildHighlightSegments(text, r.matches) }
    },
    debounceMs: 300,
    initial: INITIAL_INPUT,
    initialResult: INITIAL_COMPUTED,
    isEmpty: ({ pattern: pat, testString: text }) => pat.trim() === '' || text.trim() === '',
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Invalid regex'
      toast({ action: 'add', item: { label: message, type: 'error' } })
    },
  })

  const { flags, pattern, testString } = inputs
  const matches = computed.regex?.matches ?? []
  const matchCount = matches.length
  const copyText = computed.regex ? formatMatchesForCopy(matches) : ''

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Test Regex
          </Button>
        </div>
      </div>
      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDialogOpen}
        onReset={reset}
        open={dialogOpen}
        size="screen"
        title="Regex Tester"
      >
        <div className="flex w-full grow flex-col gap-4">
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

          <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
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
          </div>
        </div>
      </ToolDialogShell>
    </>
  )
}
