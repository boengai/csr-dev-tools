import { useCallback, useMemo } from 'react'

import { CopyButton, FieldForm, Tabs } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolFields } from '@/hooks'
import type { InputMode, ToolComponentProps } from '@/types'
import {
  calculateSubnet,
  maskToPrefix,
  parseCidr,
  prefixToMask,
  type SubnetResult,
  validateIpv4,
  validateSubnetMask,
} from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['ip-subnet-calculator']

const DEFAULT_CIDR = '192.168.1.0/24'
const DEFAULT_RESULT = calculateSubnet('192.168.1.0', 24)
const INITIAL_BAG = { error: '', result: DEFAULT_RESULT as SubnetResult | null }

const PRESET_PREFIXES = [8, 16, 24, 25, 26, 27, 28, 29, 30, 31, 32] as const

type SubnetInput = { cidrInput: string; ipInput: string; maskInput: string; mode: InputMode }
type SubnetBag = { error: string; result: SubnetResult | null }

const INITIAL_INPUT: SubnetInput = {
  cidrInput: DEFAULT_CIDR,
  ipInput: '',
  maskInput: '',
  mode: 'cidr',
}

const computeSubnet = ({ cidrInput, ipInput, maskInput, mode }: SubnetInput): SubnetBag => {
  if (mode === 'cidr') {
    if (cidrInput.trim().length === 0) return { error: '', result: null }
    const parsed = parseCidr(cidrInput)
    if (!parsed) return { error: 'Invalid CIDR notation — expected format: x.x.x.x/y', result: null }
    return { error: '', result: calculateSubnet(parsed.ip, parsed.prefixLength) }
  }
  if (ipInput.trim().length === 0 && maskInput.trim().length === 0) return { error: '', result: null }
  if (!validateIpv4(ipInput)) return { error: 'Invalid IPv4 address', result: null }
  if (!validateSubnetMask(maskInput)) return { error: 'Invalid subnet mask — mask must be contiguous', result: null }
  return { error: '', result: calculateSubnet(ipInput, maskToPrefix(maskInput)) }
}

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
  const {
    inputs,
    result: bag,
    setFields,
    setFieldsImmediate,
  } = useToolFields<SubnetInput, SubnetBag>({
    compute: computeSubnet,
    debounceMs: 300,
    initial: INITIAL_INPUT,
    initialResult: INITIAL_BAG,
  })

  const { cidrInput, ipInput, maskInput, mode } = inputs
  const { error, result } = bag

  const handleModeChange = useCallback(
    (newMode: InputMode) => {
      if (newMode === 'cidr') {
        setFields({ cidrInput: result?.cidr ?? cidrInput, mode: newMode })
      } else if (result) {
        setFields({ ipInput: result.networkAddress, maskInput: result.subnetMask, mode: newMode })
      } else {
        setFields({ mode: newMode })
      }
    },
    [cidrInput, result, setFields],
  )

  const handlePreset = useCallback(
    (prefix: number) => {
      if (mode === 'cidr') {
        const parsed = parseCidr(cidrInput)
        const ip = parsed ? parsed.ip : '192.168.1.0'
        setFieldsImmediate({ cidrInput: `${ip}/${prefix}` })
      } else {
        const ip = ipInput || '192.168.1.0'
        const mask = prefixToMask(prefix)
        if (validateIpv4(ip)) {
          setFieldsImmediate({ ipInput: ip, maskInput: mask })
        } else {
          setFields({ maskInput: mask })
        }
      }
    },
    [cidrInput, ipInput, mode, setFields, setFieldsImmediate],
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
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

      <div className="md:flex-row flex flex-col gap-4">
        {/* Input Section */}
        <div className="md:w-[35%] flex w-full flex-col gap-4">
          <Tabs
            injected={{ setValue: (v) => handleModeChange(v as InputMode), value: mode }}
            items={[
              {
                content: (
                  <FieldForm
                    label="CIDR Notation"
                    name="cidr-input"
                    onChange={(val) => setFields({ cidrInput: val })}
                    placeholder="192.168.1.0/24"
                    type="text"
                    value={cidrInput}
                  />
                ),
                trigger: <button type="button">CIDR Notation</button>,
                value: 'cidr',
              },
              {
                content: (
                  <div className="flex flex-col gap-3">
                    <FieldForm
                      label="IP Address"
                      name="ip-input"
                      onChange={(val) => setFields({ ipInput: val })}
                      placeholder="192.168.1.0"
                      type="text"
                      value={ipInput}
                    />
                    <FieldForm
                      label="Subnet Mask"
                      name="mask-input"
                      onChange={(val) => setFields({ maskInput: val })}
                      placeholder="255.255.255.0"
                      type="text"
                      value={maskInput}
                    />
                  </div>
                ),
                trigger: <button type="button">IP + Mask</button>,
                value: 'ip-mask',
              },
            ]}
          />

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
                className="rounded-md px-2.5 py-1 text-body-xs font-medium transition-colors data-[state=active]:bg-gray-700 data-[state=active]:text-gray-100 data-[state=inactive]:bg-gray-900 data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:bg-gray-800 data-[state=inactive]:hover:text-gray-300"
                data-state={result?.prefixLength === prefix ? 'active' : 'inactive'}
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
