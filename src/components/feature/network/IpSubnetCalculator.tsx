import { useCallback, useMemo, useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { SubnetResult } from '@/utils/ip-subnet'

import { CopyButton } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback } from '@/hooks'
import {
  calculateSubnet,
  maskToPrefix,
  parseCidr,
  prefixToMask,
  validateIpv4,
  validateSubnetMask,
} from '@/utils/ip-subnet'

type InputMode = 'cidr' | 'ip-mask'

const toolEntry = TOOL_REGISTRY_MAP['ip-subnet-calculator']

const DEFAULT_CIDR = '192.168.1.0/24'
const DEFAULT_RESULT = calculateSubnet('192.168.1.0', 24)

const PRESET_PREFIXES = [8, 16, 24, 25, 26, 27, 28, 29, 30, 31, 32] as const

const formatBinarySegment = (bits: string, startBitIndex: number): string => {
  let result = ''
  for (let i = 0; i < bits.length; i++) {
    const globalIndex = startBitIndex + i
    if (globalIndex > 0 && globalIndex % 8 === 0) {
      result += '.'
    }
    result += bits[i]
  }
  return result
}

const BinaryDisplay = ({ binary, prefixLength }: { binary: string; prefixLength: number }) => {
  const bitsOnly = binary.replace(/\./g, '')
  const networkBits = bitsOnly.slice(0, prefixLength)
  const hostBits = bitsOnly.slice(prefixLength)
  const networkDisplay = formatBinarySegment(networkBits, 0)
  const hostDisplay = formatBinarySegment(hostBits, prefixLength)

  return (
    <span className="font-mono text-body-sm">
      {networkDisplay && <span className="text-sky-400">{networkDisplay}</span>}
      {hostDisplay && <span className="text-amber-400">{hostDisplay}</span>}
      <span className="sr-only">
        {` (${prefixLength} network bits in blue, ${32 - prefixLength} host bits in yellow)`}
      </span>
    </span>
  )
}

export const IpSubnetCalculator = (_props: ToolComponentProps) => {
  const [mode, setMode] = useState<InputMode>('cidr')
  const [cidrInput, setCidrInput] = useState(DEFAULT_CIDR)
  const [ipInput, setIpInput] = useState('')
  const [maskInput, setMaskInput] = useState('')
  const [result, setResult] = useState<SubnetResult | null>(DEFAULT_RESULT)
  const [error, setError] = useState('')

  const ipInputRef = useRef(ipInput)
  ipInputRef.current = ipInput
  const maskInputRef = useRef(maskInput)
  maskInputRef.current = maskInput
  const cidrInputRef = useRef(cidrInput)
  cidrInputRef.current = cidrInput

  const performCalculation = useCallback(
    (cidrValue: string, ipValue: string, maskValue: string, currentMode: InputMode) => {
      if (currentMode === 'cidr') {
        if (cidrValue.trim().length === 0) {
          setResult(null)
          setError('')
          return
        }
        const parsed = parseCidr(cidrValue)
        if (!parsed) {
          setResult(null)
          setError('Invalid CIDR notation — expected format: x.x.x.x/y')
          return
        }
        setError('')
        setResult(calculateSubnet(parsed.ip, parsed.prefixLength))
      } else {
        if (ipValue.trim().length === 0 && maskValue.trim().length === 0) {
          setResult(null)
          setError('')
          return
        }
        if (!validateIpv4(ipValue)) {
          setResult(null)
          setError('Invalid IPv4 address')
          return
        }
        if (!validateSubnetMask(maskValue)) {
          setResult(null)
          setError('Invalid subnet mask — mask must be contiguous')
          return
        }
        const prefix = maskToPrefix(maskValue)
        setError('')
        setResult(calculateSubnet(ipValue, prefix))
      }
    },
    [],
  )

  const debouncedCalculate = useDebounceCallback(performCalculation, 300)

  const handleCidrChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setCidrInput(value)
      debouncedCalculate(value, '', '', 'cidr')
    },
    [debouncedCalculate],
  )

  const handleIpChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setIpInput(value)
      debouncedCalculate('', value, maskInputRef.current, 'ip-mask')
    },
    [debouncedCalculate],
  )

  const handleMaskChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setMaskInput(value)
      debouncedCalculate('', ipInputRef.current, value, 'ip-mask')
    },
    [debouncedCalculate],
  )

  const handleModeChange = useCallback(
    (newMode: InputMode) => {
      setMode(newMode)
      setError('')
      if (newMode === 'cidr') {
        if (result) {
          setCidrInput(result.cidr)
        }
      } else {
        if (result) {
          setIpInput(result.networkAddress)
          setMaskInput(result.subnetMask)
          ipInputRef.current = result.networkAddress
          maskInputRef.current = result.subnetMask
        }
      }
    },
    [result],
  )

  const handlePreset = useCallback(
    (prefix: number) => {
      if (mode === 'cidr') {
        const currentCidr = cidrInputRef.current
        const parsed = parseCidr(currentCidr)
        const ip = parsed ? parsed.ip : '192.168.1.0'
        const newCidr = `${ip}/${prefix}`
        setCidrInput(newCidr)
        performCalculation(newCidr, '', '', 'cidr')
      } else {
        const ip = ipInputRef.current || '192.168.1.0'
        const mask = prefixToMask(prefix)
        setMaskInput(mask)
        maskInputRef.current = mask
        if (validateIpv4(ip)) {
          performCalculation('', ip, mask, 'ip-mask')
        }
      }
    },
    [mode, performCalculation],
  )

  const resultRows = useMemo(() => {
    if (!result) return []
    return [
      { label: 'Network Address', value: result.networkAddress },
      { label: 'Broadcast Address', value: result.broadcastAddress },
      { label: 'Subnet Mask', value: result.subnetMask },
      { label: 'Wildcard Mask', value: result.wildcardMask },
      { label: 'First Usable Host', value: result.firstUsableHost },
      { label: 'Last Usable Host', value: result.lastUsableHost },
      { label: 'Total Hosts', value: result.totalHosts.toLocaleString() },
      { label: 'CIDR Notation', value: result.cidr },
    ]
  }, [result])

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <div className="md:flex-row flex flex-col gap-4">
        {/* Input Section */}
        <div className="md:w-[35%] flex w-full flex-col gap-4">
          {/* Mode Toggle */}
          <div className="flex gap-2" role="group" aria-label="Input mode">
            <button
              aria-pressed={mode === 'cidr'}
              className={`rounded-md px-4 py-2 text-body-sm font-medium transition-colors ${
                mode === 'cidr'
                  ? 'bg-gray-700 text-gray-100'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-300'
              }`}
              onClick={() => handleModeChange('cidr')}
              type="button"
            >
              CIDR Notation
            </button>
            <button
              aria-pressed={mode === 'ip-mask'}
              className={`rounded-md px-4 py-2 text-body-sm font-medium transition-colors ${
                mode === 'ip-mask'
                  ? 'bg-gray-700 text-gray-100'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-300'
              }`}
              onClick={() => handleModeChange('ip-mask')}
              type="button"
            >
              IP + Mask
            </button>
          </div>

          {/* Input Fields */}
          {mode === 'cidr' ? (
            <label className="flex flex-col gap-1">
              <span className="text-body-xs font-medium text-gray-400">CIDR Notation</span>
              <input
                className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-body-sm text-gray-100 transition-colors outline-none placeholder:text-gray-600 focus:border-gray-500"
                data-testid="cidr-input"
                name="cidr-input"
                onChange={handleCidrChange}
                placeholder="192.168.1.0/24"
                type="text"
                value={cidrInput}
              />
            </label>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-body-xs font-medium text-gray-400">IP Address</span>
                <input
                  className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-body-sm text-gray-100 transition-colors outline-none placeholder:text-gray-600 focus:border-gray-500"
                  data-testid="ip-input"
                  name="ip-input"
                  onChange={handleIpChange}
                  placeholder="192.168.1.0"
                  type="text"
                  value={ipInput}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-body-xs font-medium text-gray-400">Subnet Mask</span>
                <input
                  className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-body-sm text-gray-100 transition-colors outline-none placeholder:text-gray-600 focus:border-gray-500"
                  data-testid="mask-input"
                  name="mask-input"
                  onChange={handleMaskChange}
                  placeholder="255.255.255.0"
                  type="text"
                  value={maskInput}
                />
              </label>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <p className="text-amber-400 text-body-xs" role="alert">
              {error}
            </p>
          )}

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Common prefix lengths">
            {PRESET_PREFIXES.map((prefix) => (
              <button
                aria-label={`Set prefix length to ${prefix}`}
                className={`rounded-md px-2.5 py-1 text-body-xs font-medium transition-colors ${
                  result?.prefixLength === prefix
                    ? 'bg-gray-700 text-gray-100'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                }`}
                key={prefix}
                onClick={() => handlePreset(prefix)}
                type="button"
              >
                /{prefix}
              </button>
            ))}
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="md:w-[65%] flex w-full flex-col gap-4" aria-live="polite">
            {/* Results Grid */}
            <div className="md:grid-cols-2 grid grid-cols-1 gap-2">
              {resultRows.map((row) => (
                <div
                  className="flex items-center justify-between gap-2 rounded-md border border-gray-800 bg-gray-950 px-3 py-2"
                  key={row.label}
                >
                  <div className="min-w-0">
                    <p className="text-body-xs text-gray-500">{row.label}</p>
                    <p className="truncate font-mono text-body-sm text-gray-200">
                      {row.value}
                      {row.label === 'Total Hosts' && result.prefixLength === 32 && (
                        <span className="bg-sky-900/50 text-sky-400 ml-2 rounded px-1.5 py-0.5 font-sans text-body-xs">
                          Single Host
                        </span>
                      )}
                      {row.label === 'Total Hosts' && result.prefixLength === 31 && (
                        <span className="bg-sky-900/50 text-sky-400 ml-2 rounded px-1.5 py-0.5 font-sans text-body-xs">
                          Point-to-Point Link (RFC 3021)
                        </span>
                      )}
                    </p>
                  </div>
                  <CopyButton label={row.label} value={row.value} />
                </div>
              ))}
            </div>

            {/* Binary Representation */}
            <div className="flex flex-col gap-3 rounded-md border border-gray-800 bg-gray-950 p-3">
              <p className="text-body-xs font-medium text-gray-400">Binary Representation</p>
              <div className="flex flex-col gap-2">
                <div>
                  <p className="mb-1 text-body-xs text-gray-500">IP Address (binary)</p>
                  <BinaryDisplay binary={result.binaryIp} prefixLength={result.prefixLength} />
                </div>
                <div>
                  <p className="mb-1 text-body-xs text-gray-500">Subnet Mask (binary)</p>
                  <BinaryDisplay binary={result.binaryMask} prefixLength={result.prefixLength} />
                </div>
              </div>
              <div className="flex gap-4 text-body-xs">
                <span className="flex items-center gap-1">
                  <span className="bg-sky-400 inline-block h-2.5 w-2.5 rounded-sm" />
                  <span className="text-gray-500">Network bits</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="bg-amber-400 inline-block h-2.5 w-2.5 rounded-sm" />
                  <span className="text-gray-500">Host bits</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
