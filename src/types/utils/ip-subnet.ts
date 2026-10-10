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

export type SubnetComputeInput = {
  cidrInput: string
  ipInput: string
  maskInput: string
  mode: 'cidr' | 'ip-mask'
}

export type SubnetComputeOutput = { error: string; result: SubnetResult | null }

export type ParsedCidr = { ip: string; prefixLength: number }
