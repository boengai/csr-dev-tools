import { useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { HighlightSegment, RegexMatch, RegexResult } from '@/utils'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { buildHighlightSegments, executeRegex, formatMatchesForCopy } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['regex-tester']

type Flags = { g: boolean; i: boolean; m: boolean }

const DEFAULT_FLAGS: Flags = { g: true, i: false, m: false }

const flagsToString = (flags: Flags) =>
  Object.entries(flags)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join('')

const FlagToggle = ({ active, flag, onToggle }: { active: boolean; flag: string; onToggle: () => void }) => (
  <button
    aria-label={`Toggle ${flag} flag`}
    aria-pressed={active}
    className={`min-w-8 rounded border px-2 font-mono text-xs leading-7 ${
      active ? 'border-primary bg-primary/20 text-primary font-bold' : 'border-gray-700 bg-transparent text-gray-500'
    }`}
    onClick={onToggle}
    type="button"
  >
    {flag}
  </button>
)

const MatchDetails = ({ matches }: { matches: Array<RegexMatch> }) => (
  <div className="flex flex-col gap-2">
    {matches.map((match, i) => (
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2 text-sm" key={i}>
        <p className="text-gray-300">
          <span className="font-medium text-gray-200">Match {i + 1}:</span>{' '}
          <span className="text-primary font-mono">&quot;{match.fullMatch}&quot;</span> at index {match.index}
        </p>
        {match.groups.length > 0 && (
          <div className="mt-1 flex flex-col gap-0.5 pl-4 text-gray-400">
            {match.groups.map((group, g) => (
              <p key={g}>
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
  const [pattern, setPattern] = useState('')
  const [testString, setTestString] = useState('')
  const [flags, setFlags] = useState<Flags>(DEFAULT_FLAGS)
  const [result, setResult] = useState<RegexResult | null>(null)
  const [segments, setSegments] = useState<Array<HighlightSegment>>([])
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()

  const process = (pat: string, text: string, fl: Flags) => {
    if (pat.trim().length === 0 || text.trim().length === 0) {
      setResult(null)
      setSegments([])
      return
    }

    const regexResult = executeRegex(pat, flagsToString(fl), text)

    if (regexResult.error != null) {
      toast({ action: 'add', item: { label: regexResult.error, type: 'error' } })
      setResult(null)
      setSegments([])
      return
    }

    setResult(regexResult)
    setSegments(buildHighlightSegments(text, regexResult.matches))
  }

  const debouncedProcess = useDebounceCallback((pat: string, text: string, fl: Flags) => {
    process(pat, text, fl)
  }, 300)

  const handlePatternChange = (val: string) => {
    setPattern(val)
    debouncedProcess(val, testString, flags)
  }

  const handleTestStringChange = (val: string) => {
    setTestString(val)
    debouncedProcess(pattern, val, flags)
  }

  const handleFlagToggle = (flag: keyof Flags) => {
    const updated = { ...flags, [flag]: !flags[flag] }
    setFlags(updated)
    debouncedProcess(pattern, testString, updated)
  }

  const handleReset = () => {
    setPattern('')
    setTestString('')
    setFlags(DEFAULT_FLAGS)
    setResult(null)
    setSegments([])
  }

  const handleAfterClose = () => {
    handleReset()
    onAfterDialogClose?.()
  }

  const matchCount = result?.matches.length ?? 0
  const copyText = result ? formatMatchesForCopy(result.matches) : ''

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Test Regex
          </Button>
        </div>
      </div>
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleAfterClose}
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
                    <FlagToggle active={flags.g} flag="g" onToggle={() => handleFlagToggle('g')} />
                    <FlagToggle active={flags.i} flag="i" onToggle={() => handleFlagToggle('i')} />
                    <FlagToggle active={flags.m} flag="m" onToggle={() => handleFlagToggle('m')} />
                  </span>
                </span>
              }
              name="pattern"
              onChange={handlePatternChange}
              placeholder="\d+"
              type="text"
              value={pattern}
            />

            <FieldForm
              label="Test String"
              name="test-string"
              onChange={handleTestStringChange}
              placeholder="Enter text to test against..."
              rows={8}
              type="textarea"
              value={testString}
            />
          </div>

          <div className="border-t-2 border-dashed border-gray-900" />

          <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-body-sm font-medium text-gray-400">
                {result != null ? `${matchCount} ${matchCount === 1 ? 'match' : 'matches'} found` : 'Output'}
              </span>
              {result?.capped && <span className="text-body-xs text-warning">Showing first 5,000 matches</span>}
              {copyText && <CopyButton label="matches" value={copyText} />}
            </div>

            <div className="overflow-auto rounded-lg border border-gray-800 bg-gray-950 p-3 font-mono text-sm break-words whitespace-pre-wrap">
              {segments.length > 0 ? (
                segments.map((segment, i) =>
                  segment.isMatch ? (
                    <span className="bg-primary/20 text-primary rounded-xs" key={i}>
                      {segment.text}
                    </span>
                  ) : (
                    <span className="text-gray-400" key={i}>
                      {segment.text}
                    </span>
                  ),
                )
              ) : (
                <p className="text-gray-600">Highlighted matches will appear here...</p>
              )}
            </div>

            {result != null && result.matches.length > 0 && <MatchDetails matches={result.matches} />}
          </div>

        </div>
      </Dialog>
    </>
  )
}
