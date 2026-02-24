import { useCallback, useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { ChmodState } from '@/utils/chmod-calculator'

import { Button, CopyButton, TextInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import {
  isValidOctal,
  isValidSymbolic,
  octalToState,
  stateToDescription,
  stateToOctal,
  stateToSymbolic,
  symbolicToState,
} from '@/utils/chmod-calculator'

const toolEntry = TOOL_REGISTRY_MAP['chmod-calculator']

const DEFAULT_STATE = octalToState('755')!

const PRESETS = ['644', '755', '777', '600', '400'] as const

const GROUPS = ['owner', 'group', 'other'] as const
const PERMS = ['read', 'write', 'execute'] as const

export const ChmodCalculator = (_props: ToolComponentProps) => {
  const [state, setState] = useState<ChmodState>(DEFAULT_STATE)
  const [octalInput, setOctalInput] = useState('755')
  const [symbolicInput, setSymbolicInput] = useState('rwxr-xr-x')
  const [octalError, setOctalError] = useState('')
  const [symbolicError, setSymbolicError] = useState('')

  const updateFromState = useCallback((newState: ChmodState) => {
    setState(newState)
    setOctalInput(stateToOctal(newState))
    setSymbolicInput(stateToSymbolic(newState))
    setOctalError('')
    setSymbolicError('')
  }, [])

  const handleOctalChange = useCallback((value: string) => {
    setOctalInput(value)
    if (value.length === 0) {
      setOctalError('')
      return
    }
    if (!isValidOctal(value)) {
      setOctalError('Enter a 3-digit octal number (each digit 0-7)')
      return
    }
    const newState = octalToState(value)
    if (newState) {
      setState(newState)
      setSymbolicInput(stateToSymbolic(newState))
      setOctalError('')
      setSymbolicError('')
    }
  }, [])

  const handleSymbolicChange = useCallback((value: string) => {
    setSymbolicInput(value)
    if (value.length === 0) {
      setSymbolicError('')
      return
    }
    if (!isValidSymbolic(value)) {
      setSymbolicError('Enter 9 characters using r, w, x, or - (e.g., rwxr-xr-x)')
      return
    }
    const newState = symbolicToState(value)
    if (newState) {
      setState(newState)
      setOctalInput(stateToOctal(newState))
      setSymbolicError('')
      setOctalError('')
    }
  }, [])

  const handleCheckboxChange = useCallback(
    (group: (typeof GROUPS)[number], perm: (typeof PERMS)[number]) => {
      const newState = {
        ...state,
        [group]: {
          ...state[group],
          [perm]: !state[group][perm],
        },
      }
      updateFromState(newState)
    },
    [state, updateFromState],
  )

  const handlePreset = useCallback(
    (octal: string) => {
      const newState = octalToState(octal)
      if (newState) updateFromState(newState)
    },
    [updateFromState],
  )

  const description = stateToDescription(state)
  const command = `chmod ${stateToOctal(state)} filename`

  return (
    <div className="flex w-full grow flex-col gap-6">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Common permission presets">
        {PRESETS.map((preset) => (
          <Button
            key={preset}
            onClick={() => handlePreset(preset)}
            size="small"
            variant={octalInput === preset ? 'primary' : 'default'}
          >
            {preset}
          </Button>
        ))}
      </div>

      {/* Octal and Symbolic Inputs */}
      <div className="sm:flex-row flex flex-col gap-4">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-body-xs font-medium text-gray-400">Octal</span>
          <TextInput name="octal-input" onChange={handleOctalChange} placeholder="755" type="text" value={octalInput} />
          {octalError && (
            <p className="text-amber-400 text-body-xs" role="alert">
              {octalError}
            </p>
          )}
        </label>

        <label className="flex flex-1 flex-col gap-1">
          <span className="text-body-xs font-medium text-gray-400">Symbolic</span>
          <div className="[&_input]:font-mono">
            <TextInput
              name="symbolic-input"
              onChange={handleSymbolicChange}
              placeholder="rwxr-xr-x"
              type="text"
              value={symbolicInput}
            />
          </div>
          {symbolicError && (
            <p className="text-amber-400 text-body-xs" role="alert">
              {symbolicError}
            </p>
          )}
        </label>
      </div>

      {/* Checkbox Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-body-sm" aria-label="Permission checkboxes">
          <thead>
            <tr className="text-gray-400">
              <th className="py-2 pr-4 text-left font-medium" />
              <th className="px-4 py-2 text-center font-medium">Read</th>
              <th className="px-4 py-2 text-center font-medium">Write</th>
              <th className="px-4 py-2 text-center font-medium">Execute</th>
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((group) => (
              <tr key={group} role="group" aria-labelledby={`label-${group}`}>
                <td className="py-2 pr-4 font-medium text-gray-300 capitalize" id={`label-${group}`}>
                  {group}
                </td>
                {PERMS.map((perm) => (
                  <td key={perm} className="px-4 py-3 text-center">
                    <input
                      aria-label={`${group} ${perm} permission`}
                      checked={state[group][perm]}
                      className="h-5 w-5 cursor-pointer accent-primary"
                      onChange={() => handleCheckboxChange(group, perm)}
                      type="checkbox"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Human-Readable Description */}
      <div aria-live="polite" className="rounded border border-gray-800 bg-gray-950 px-4 py-3">
        <p className="text-body-xs text-gray-400">Permission Description</p>
        <p className="mt-1 text-body-sm text-gray-200">{description}</p>
      </div>

      {/* Command Preview */}
      <div
        aria-live="polite"
        className="flex items-center justify-between gap-2 rounded border border-gray-800 bg-gray-950 px-4 py-3"
      >
        <code className="font-mono text-body-sm text-gray-200">{command}</code>
        <CopyButton label="chmod command" value={command} />
      </div>
    </div>
  )
}
