import { useReducer } from 'react'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import type { Flags, State, Action } from '@/types/components/feature/text/regexTester'
import { buildHighlightSegments, executeRegex, formatMatchesForCopy, type RegexMatch } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['regex-tester']
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
    className="text-xs min-w-8 rounded border px-2 font-mono leading-7 data-[state=active]:border-primary data-[state=active]:bg-primary/20 data-[state=active]:font-bold data-[state=active]:text-primary data-[state=inactive]:border-gray-700 data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500"
    data-state={active ? 'active' : 'inactive'}
    onClick={onToggle}
    type="button"
  >
    {flag}
  </button>
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

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_PATTERN':
      return { ...state, pattern: action.payload }
    case 'SET_TEST_STRING':
      return { ...state, testString: action.payload }
    case 'SET_FLAGS':
      return { ...state, flags: action.payload }
    case 'SET_RESULT':
      return { ...state, result: action.payload.result, segments: action.payload.segments }
    case 'SET_DIALOG_OPEN':
      return { ...state, dialogOpen: action.payload }
    case 'RESET':
      return { ...state, pattern: '', testString: '', flags: DEFAULT_FLAGS, result: null, segments: [] }
  }
}

export const RegexTester = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [state, dispatch] = useReducer(reducer, {
    pattern: '',
    testString: '',
    flags: DEFAULT_FLAGS,
    result: null,
    segments: [],
    dialogOpen: autoOpen ?? false,
  })
  const { pattern, testString, flags, result, segments, dialogOpen } = state
  const { toast } = useToast()

  const process = (pat: string, text: string, fl: Flags) => {
    if (pat.trim().length === 0 || text.trim().length === 0) {
      dispatch({ type: 'SET_RESULT', payload: { result: null, segments: [] } })
      return
    }

    const regexResult = executeRegex(pat, flagsToString(fl), text)

    if (regexResult.error != null) {
      toast({ action: 'add', item: { label: regexResult.error, type: 'error' } })
      dispatch({ type: 'SET_RESULT', payload: { result: null, segments: [] } })
      return
    }

    dispatch({
      type: 'SET_RESULT',
      payload: { result: regexResult, segments: buildHighlightSegments(text, regexResult.matches) },
    })
  }

  const debouncedProcess = useDebounceCallback((pat: string, text: string, fl: Flags) => {
    process(pat, text, fl)
  }, 300)

  const handlePatternChange = (val: string) => {
    dispatch({ type: 'SET_PATTERN', payload: val })
    debouncedProcess(val, testString, flags)
  }

  const handleTestStringChange = (val: string) => {
    dispatch({ type: 'SET_TEST_STRING', payload: val })
    debouncedProcess(pattern, val, flags)
  }

  const handleFlagToggle = (flag: keyof Flags) => {
    const updated = { ...flags, [flag]: !flags[flag] }
    dispatch({ type: 'SET_FLAGS', payload: updated })
    debouncedProcess(pattern, testString, updated)
  }

  const handleReset = () => {
    dispatch({ type: 'RESET' })
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
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => dispatch({ type: 'SET_DIALOG_OPEN', payload: true })} variant="default">
            Test Regex
          </Button>
        </div>
      </div>
      <Dialog
        injected={{
          open: dialogOpen,
          setOpen: (open: boolean) => dispatch({ type: 'SET_DIALOG_OPEN', payload: open }),
        }}
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
              type="code"
              value={testString}
            />
          </div>

          <div className="border-t-2 border-dashed border-gray-900" />

          <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-body-sm font-medium text-gray-400">
                {result != null ? `${matchCount} ${matchCount === 1 ? 'match' : 'matches'} found` : 'Output'}
              </span>
              {result?.capped && <span className="text-body-xs text-warning">Showing first 5,000 matches</span>}
              {copyText && <CopyButton label="matches" value={copyText} />}
            </div>

            <div className="text-sm wrap-break-words overflow-auto rounded-lg border border-gray-800 bg-gray-950 p-3 font-mono whitespace-pre-wrap">
              {segments.length > 0 ? (
                (() => {
                  let offset = 0
                  return segments.map((segment) => {
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

            {result != null && result.matches.length > 0 && <MatchDetails matches={result.matches} />}
          </div>
        </div>
      </Dialog>
    </>
  )
}
