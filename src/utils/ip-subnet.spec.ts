import { describe, expect, it } from 'vitest'

import {
  calculateSubnet,
  ipToBinary,
  ipToNumber,
  maskToPrefix,
  numberToIp,
  parseCidr,
  prefixToMask,
  validateIpv4,
  validatePrefixLength,
  validateSubnetMask,
} from './ip-subnet'

describe('ip-subnet', () => {
  describe('validateIpv4', () => {
    it.each(['192.168.1.0', '0.0.0.0', '255.255.255.255', '10.0.0.1'])('returns true for valid IP "%s"', (ip) => {
      expect(validateIpv4(ip)).toBe(true)
    })

    it.each(['256.1.1.1', '1.2.3', '1.2.3.4.5', 'abc.def.ghi.jkl', '01.02.03.04', '', '-1.0.0.0', '1.2.3.256'])(
      'returns false for invalid IP "%s"',
      (ip) => {
        expect(validateIpv4(ip)).toBe(false)
      },
    )
  })

  describe('validateSubnetMask', () => {
    it.each([
      '255.255.255.0',
      '255.255.0.0',
      '255.0.0.0',
      '255.255.255.128',
      '255.255.255.252',
      '255.255.255.255',
      '0.0.0.0',
    ])('returns true for valid mask "%s"', (mask) => {
      expect(validateSubnetMask(mask)).toBe(true)
    })

    it.each(['255.255.128.128', '255.0.255.0', '128.255.0.0'])('returns false for invalid mask "%s"', (mask) => {
      expect(validateSubnetMask(mask)).toBe(false)
    })
  })

  describe('validatePrefixLength', () => {
    it.each([0, 1, 8, 16, 24, 31, 32])('returns true for valid prefix %d', (prefix) => {
      expect(validatePrefixLength(prefix)).toBe(true)
    })

    it.each([-1, 33, 1.5, NaN])('returns false for invalid prefix %d', (prefix) => {
      expect(validatePrefixLength(prefix)).toBe(false)
    })
  })

  describe('parseCidr', () => {
    it('parses 192.168.1.0/24', () => {
      expect(parseCidr('192.168.1.0/24')).toEqual({ ip: '192.168.1.0', prefixLength: 24 })
    })

    it('parses 10.0.0.0/8', () => {
      expect(parseCidr('10.0.0.0/8')).toEqual({ ip: '10.0.0.0', prefixLength: 8 })
    })

    it('returns null for 192.168.1.0/33', () => {
      expect(parseCidr('192.168.1.0/33')).toBeNull()
    })

    it('returns null for not-an-ip/24', () => {
      expect(parseCidr('not-an-ip/24')).toBeNull()
    })

    it('returns null for 192.168.1.0 (no prefix)', () => {
      expect(parseCidr('192.168.1.0')).toBeNull()
    })
  })

  describe('prefixToMask / maskToPrefix', () => {
    const cases: Array<[number, string]> = [
      [0, '0.0.0.0'],
      [8, '255.0.0.0'],
      [16, '255.255.0.0'],
      [24, '255.255.255.0'],
      [25, '255.255.255.128'],
      [30, '255.255.255.252'],
      [32, '255.255.255.255'],
    ]

    it.each(cases)('prefixToMask(%d) returns "%s"', (prefix, mask) => {
      expect(prefixToMask(prefix)).toBe(mask)
    })

    it.each(cases)('maskToPrefix("%s") returns %d', (prefix, mask) => {
      expect(maskToPrefix(mask)).toBe(prefix)
    })
  })

  describe('ipToNumber / numberToIp', () => {
    it('converts 192.168.1.0 to 3232235776', () => {
      expect(ipToNumber('192.168.1.0')).toBe(3232235776)
    })

    it('converts 0.0.0.0 to 0', () => {
      expect(ipToNumber('0.0.0.0')).toBe(0)
    })

    it('converts 255.255.255.255 to 4294967295', () => {
      expect(ipToNumber('255.255.255.255')).toBe(4294967295)
    })

    it('converts 3232235776 back to 192.168.1.0', () => {
      expect(numberToIp(3232235776)).toBe('192.168.1.0')
    })

    it('converts 0 back to 0.0.0.0', () => {
      expect(numberToIp(0)).toBe('0.0.0.0')
    })

    it('converts 4294967295 back to 255.255.255.255', () => {
      expect(numberToIp(4294967295)).toBe('255.255.255.255')
    })
  })

  describe('ipToBinary', () => {
    it('converts 192.168.1.0 to binary', () => {
      expect(ipToBinary('192.168.1.0')).toBe('11000000.10101000.00000001.00000000')
    })

    it('converts 255.255.255.0 to binary', () => {
      expect(ipToBinary('255.255.255.0')).toBe('11111111.11111111.11111111.00000000')
    })

    it('converts 0.0.0.0 to binary', () => {
      expect(ipToBinary('0.0.0.0')).toBe('00000000.00000000.00000000.00000000')
    })

    it('converts 255.255.255.255 to binary', () => {
      expect(ipToBinary('255.255.255.255')).toBe('11111111.11111111.11111111.11111111')
    })
  })

  describe('calculateSubnet', () => {
    describe('standard cases', () => {
      it('calculates 192.168.1.0/24', () => {
        const result = calculateSubnet('192.168.1.0', 24)
        expect(result.networkAddress).toBe('192.168.1.0')
        expect(result.broadcastAddress).toBe('192.168.1.255')
        expect(result.subnetMask).toBe('255.255.255.0')
        expect(result.wildcardMask).toBe('0.0.0.255')
        expect(result.firstUsableHost).toBe('192.168.1.1')
        expect(result.lastUsableHost).toBe('192.168.1.254')
        expect(result.totalHosts).toBe(254)
      })

      it('calculates 10.0.0.0/8', () => {
        const result = calculateSubnet('10.0.0.0', 8)
        expect(result.networkAddress).toBe('10.0.0.0')
        expect(result.broadcastAddress).toBe('10.255.255.255')
        expect(result.firstUsableHost).toBe('10.0.0.1')
        expect(result.lastUsableHost).toBe('10.255.255.254')
        expect(result.totalHosts).toBe(16777214)
      })

      it('calculates 172.16.0.0/12', () => {
        const result = calculateSubnet('172.16.0.0', 12)
        expect(result.networkAddress).toBe('172.16.0.0')
        expect(result.broadcastAddress).toBe('172.31.255.255')
      })
    })

    describe('special cases', () => {
      it('/32 — single host', () => {
        const result = calculateSubnet('10.0.0.1', 32)
        expect(result.networkAddress).toBe('10.0.0.1')
        expect(result.broadcastAddress).toBe('10.0.0.1')
        expect(result.firstUsableHost).toBe('10.0.0.1')
        expect(result.lastUsableHost).toBe('10.0.0.1')
        expect(result.totalHosts).toBe(1)
      })

      it('/31 — point-to-point', () => {
        const result = calculateSubnet('10.0.0.0', 31)
        expect(result.networkAddress).toBe('10.0.0.0')
        expect(result.broadcastAddress).toBe('10.0.0.1')
        expect(result.firstUsableHost).toBe('10.0.0.0')
        expect(result.lastUsableHost).toBe('10.0.0.1')
        expect(result.totalHosts).toBe(2)
      })

      it('/30 — smallest usable subnet', () => {
        const result = calculateSubnet('10.0.0.0', 30)
        expect(result.totalHosts).toBe(2)
      })

      it('/0 — entire IPv4 space', () => {
        const result = calculateSubnet('0.0.0.0', 0)
        expect(result.networkAddress).toBe('0.0.0.0')
        expect(result.broadcastAddress).toBe('255.255.255.255')
        expect(result.subnetMask).toBe('0.0.0.0')
        expect(result.wildcardMask).toBe('255.255.255.255')
        expect(result.firstUsableHost).toBe('0.0.0.1')
        expect(result.lastUsableHost).toBe('255.255.255.254')
        expect(result.totalHosts).toBe(4294967294)
      })
    })

    describe('non-zero host bits', () => {
      it('192.168.1.100/24 — network address strips host bits', () => {
        const result = calculateSubnet('192.168.1.100', 24)
        expect(result.networkAddress).toBe('192.168.1.0')
      })
    })
  })
})
