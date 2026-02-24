export type ChmodPermission = {
  execute: boolean
  read: boolean
  write: boolean
}

export type ChmodState = {
  group: ChmodPermission
  other: ChmodPermission
  owner: ChmodPermission
}

const READ_BIT = 4
const WRITE_BIT = 2
const EXECUTE_BIT = 1

export const permissionToDigit = (perm: ChmodPermission): number => {
  return (perm.read ? READ_BIT : 0) + (perm.write ? WRITE_BIT : 0) + (perm.execute ? EXECUTE_BIT : 0)
}

export const digitToPermission = (digit: number): ChmodPermission => ({
  execute: (digit & EXECUTE_BIT) !== 0,
  read: (digit & READ_BIT) !== 0,
  write: (digit & WRITE_BIT) !== 0,
})

export const isValidOctal = (input: string): boolean => {
  return /^[0-7]{3}$/.test(input)
}

export const isValidSymbolic = (input: string): boolean => {
  return /^[r-][w-][x-][r-][w-][x-][r-][w-][x-]$/.test(input)
}

export const octalToState = (octal: string): ChmodState | null => {
  if (!isValidOctal(octal)) return null

  return {
    group: digitToPermission(Number(octal[1])),
    other: digitToPermission(Number(octal[2])),
    owner: digitToPermission(Number(octal[0])),
  }
}

export const stateToOctal = (state: ChmodState): string => {
  return `${permissionToDigit(state.owner)}${permissionToDigit(state.group)}${permissionToDigit(state.other)}`
}

const permissionToSymbolic = (perm: ChmodPermission): string => {
  return `${perm.read ? 'r' : '-'}${perm.write ? 'w' : '-'}${perm.execute ? 'x' : '-'}`
}

const symbolicGroupToPermission = (group: string): ChmodPermission => ({
  execute: group[2] === 'x',
  read: group[0] === 'r',
  write: group[1] === 'w',
})

export const symbolicToState = (symbolic: string): ChmodState | null => {
  if (!isValidSymbolic(symbolic)) return null

  return {
    group: symbolicGroupToPermission(symbolic.slice(3, 6)),
    other: symbolicGroupToPermission(symbolic.slice(6, 9)),
    owner: symbolicGroupToPermission(symbolic.slice(0, 3)),
  }
}

export const stateToSymbolic = (state: ChmodState): string => {
  return `${permissionToSymbolic(state.owner)}${permissionToSymbolic(state.group)}${permissionToSymbolic(state.other)}`
}

const describePermission = (perm: ChmodPermission): string => {
  const parts: Array<string> = []
  if (perm.read) parts.push('read')
  if (perm.write) parts.push('write')
  if (perm.execute) parts.push('execute')
  return parts.length === 0 ? 'none' : parts.join(', ')
}

export const stateToDescription = (state: ChmodState): string => {
  return `Owner: ${describePermission(state.owner)} | Group: ${describePermission(state.group)} | Other: ${describePermission(state.other)}`
}
