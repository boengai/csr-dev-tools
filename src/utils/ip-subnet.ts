export type SubnetResult = {
  binaryIp: string
  binaryMask: string
  broadcastAddress: string
  cidr: string
  firstUsableHost: string
  lastUsableHost: string
  networkAddress: string
  prefixLength: number
  subnetMask: string
  totalHosts: number
  wildcardMask: string
}

export const validateIpv4 = (ip: string): boolean => {
  const parts = ip.split('.')
  if (parts.length !== 4) return false

  for (const part of parts) {
    if (part.length === 0) return false
    if (!/^\d+$/.test(part)) return false
    if (part.length > 1 && part[0] === '0') return false
    const num = Number(part)
    if (num < 0 || num > 255) return false
  }

  return true
}

export const validateSubnetMask = (mask: string): boolean => {
  if (!validateIpv4(mask)) return false

  const num = ipToNumber(mask)
  if (num === 0) return true

  const inverted = ~num >>> 0
  return (inverted & (inverted + 1)) === 0
}

export const validatePrefixLength = (prefix: number): boolean => {
  return Number.isInteger(prefix) && prefix >= 0 && prefix <= 32
}

export const parseCidr = (input: string): { ip: string; prefixLength: number } | null => {
  const parts = input.split('/')
  if (parts.length !== 2) return null

  const ip = parts[0]
  const prefixStr = parts[1]

  if (!validateIpv4(ip)) return null
  if (!/^\d+$/.test(prefixStr)) return null

  const prefixLength = Number(prefixStr)
  if (!validatePrefixLength(prefixLength)) return null

  return { ip, prefixLength }
}

export const prefixToMask = (prefix: number): string => {
  if (prefix === 0) return '0.0.0.0'
  const mask = (~0 << (32 - prefix)) >>> 0
  return numberToIp(mask)
}

export const maskToPrefix = (mask: string): number => {
  const num = ipToNumber(mask)
  let count = 0
  let n = num
  for (let i = 31; i >= 0; i--) {
    if ((n >>> i) & 1) {
      count++
    } else {
      break
    }
  }
  return count
}

export const ipToNumber = (ip: string): number => {
  const parts = ip.split('.')
  return ((Number(parts[0]) << 24) | (Number(parts[1]) << 16) | (Number(parts[2]) << 8) | Number(parts[3])) >>> 0
}

export const numberToIp = (num: number): string => {
  return `${(num >>> 24) & 0xff}.${(num >>> 16) & 0xff}.${(num >>> 8) & 0xff}.${num & 0xff}`
}

export const ipToBinary = (ip: string): string => {
  return ip
    .split('.')
    .map((octet) => Number(octet).toString(2).padStart(8, '0'))
    .join('.')
}

export const calculateSubnet = (ip: string, prefixLength: number): SubnetResult => {
  const maskNum = prefixLength === 0 ? 0 : (~0 << (32 - prefixLength)) >>> 0
  const ipNum = ipToNumber(ip)
  const networkNum = (ipNum & maskNum) >>> 0
  const wildcardNum = ~maskNum >>> 0
  const broadcastNum = (networkNum | wildcardNum) >>> 0

  const networkAddress = numberToIp(networkNum)
  const broadcastAddress = numberToIp(broadcastNum)
  const subnetMask = numberToIp(maskNum)
  const wildcardMask = numberToIp(wildcardNum)

  let firstUsableHost: string
  let lastUsableHost: string
  let totalHosts: number

  if (prefixLength === 32) {
    firstUsableHost = networkAddress
    lastUsableHost = networkAddress
    totalHosts = 1
  } else if (prefixLength === 31) {
    firstUsableHost = networkAddress
    lastUsableHost = broadcastAddress
    totalHosts = 2
  } else {
    firstUsableHost = numberToIp((networkNum + 1) >>> 0)
    lastUsableHost = numberToIp((broadcastNum - 1) >>> 0)
    totalHosts = Math.pow(2, 32 - prefixLength) - 2
  }

  return {
    binaryIp: ipToBinary(ip),
    binaryMask: ipToBinary(subnetMask),
    broadcastAddress,
    cidr: `${networkAddress}/${prefixLength}`,
    firstUsableHost,
    lastUsableHost,
    networkAddress,
    prefixLength,
    subnetMask,
    totalHosts,
    wildcardMask,
  }
}
