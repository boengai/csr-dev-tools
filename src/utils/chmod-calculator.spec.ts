import { describe, expect, it } from 'vitest'

import {
  digitToPermission,
  isValidOctal,
  isValidSymbolic,
  octalToState,
  permissionToDigit,
  stateToDescription,
  stateToOctal,
  stateToSymbolic,
  symbolicToState,
} from './chmod-calculator'

describe('octalToState', () => {
  it('converts "755" to owner:rwx, group:rx, other:rx', () => {
    const result = octalToState('755')
    expect(result).toEqual({
      group: { execute: true, read: true, write: false },
      other: { execute: true, read: true, write: false },
      owner: { execute: true, read: true, write: true },
    })
  })

  it('converts "644" to owner:rw, group:r, other:r', () => {
    const result = octalToState('644')
    expect(result).toEqual({
      group: { execute: false, read: true, write: false },
      other: { execute: false, read: true, write: false },
      owner: { execute: false, read: true, write: true },
    })
  })

  it('converts "000" to all false', () => {
    const result = octalToState('000')
    expect(result).toEqual({
      group: { execute: false, read: false, write: false },
      other: { execute: false, read: false, write: false },
      owner: { execute: false, read: false, write: false },
    })
  })

  it('converts "777" to all true', () => {
    const result = octalToState('777')
    expect(result).toEqual({
      group: { execute: true, read: true, write: true },
      other: { execute: true, read: true, write: true },
      owner: { execute: true, read: true, write: true },
    })
  })

  it('returns null for invalid input', () => {
    expect(octalToState('888')).toBeNull()
    expect(octalToState('abc')).toBeNull()
    expect(octalToState('75')).toBeNull()
    expect(octalToState('7777')).toBeNull()
  })
})

describe('stateToOctal', () => {
  it('roundtrips octalToState("755") → stateToOctal → "755"', () => {
    const state = octalToState('755')!
    expect(stateToOctal(state)).toBe('755')
  })

  it('roundtrips octalToState("000") → stateToOctal → "000"', () => {
    const state = octalToState('000')!
    expect(stateToOctal(state)).toBe('000')
  })

  it('roundtrips octalToState("644") → stateToOctal → "644"', () => {
    const state = octalToState('644')!
    expect(stateToOctal(state)).toBe('644')
  })

  it('roundtrips octalToState("777") → stateToOctal → "777"', () => {
    const state = octalToState('777')!
    expect(stateToOctal(state)).toBe('777')
  })
})

describe('symbolicToState', () => {
  it('converts "rwxr-xr-x" to owner:rwx, group:rx, other:rx', () => {
    const result = symbolicToState('rwxr-xr-x')
    expect(result).toEqual({
      group: { execute: true, read: true, write: false },
      other: { execute: true, read: true, write: false },
      owner: { execute: true, read: true, write: true },
    })
  })

  it('converts "rw-r--r--" to owner:rw, group:r, other:r', () => {
    const result = symbolicToState('rw-r--r--')
    expect(result).toEqual({
      group: { execute: false, read: true, write: false },
      other: { execute: false, read: true, write: false },
      owner: { execute: false, read: true, write: true },
    })
  })

  it('converts "---------" to all false', () => {
    const result = symbolicToState('---------')
    expect(result).toEqual({
      group: { execute: false, read: false, write: false },
      other: { execute: false, read: false, write: false },
      owner: { execute: false, read: false, write: false },
    })
  })

  it('returns null for invalid input', () => {
    expect(symbolicToState('rwxrwxrw')).toBeNull()
    expect(symbolicToState('abc')).toBeNull()
    expect(symbolicToState('rwx')).toBeNull()
  })
})

describe('stateToSymbolic', () => {
  it('roundtrips symbolicToState("rwxr-xr-x") → stateToSymbolic → "rwxr-xr-x"', () => {
    const state = symbolicToState('rwxr-xr-x')!
    expect(stateToSymbolic(state)).toBe('rwxr-xr-x')
  })

  it('roundtrips symbolicToState("---------") → stateToSymbolic → "---------"', () => {
    const state = symbolicToState('---------')!
    expect(stateToSymbolic(state)).toBe('---------')
  })

  it('roundtrips symbolicToState("rw-r--r--") → stateToSymbolic → "rw-r--r--"', () => {
    const state = symbolicToState('rw-r--r--')!
    expect(stateToSymbolic(state)).toBe('rw-r--r--')
  })

  it('roundtrips symbolicToState("rwxrwxrwx") → stateToSymbolic → "rwxrwxrwx"', () => {
    const state = symbolicToState('rwxrwxrwx')!
    expect(stateToSymbolic(state)).toBe('rwxrwxrwx')
  })
})

describe('stateToDescription', () => {
  it('describes "755" state correctly', () => {
    const state = octalToState('755')!
    expect(stateToDescription(state)).toBe('Owner: read, write, execute | Group: read, execute | Other: read, execute')
  })

  it('describes "000" state as all none', () => {
    const state = octalToState('000')!
    expect(stateToDescription(state)).toBe('Owner: none | Group: none | Other: none')
  })

  it('describes "400" state correctly', () => {
    const state = octalToState('400')!
    expect(stateToDescription(state)).toBe('Owner: read | Group: none | Other: none')
  })
})

describe('isValidOctal', () => {
  it('returns true for valid octals', () => {
    expect(isValidOctal('000')).toBe(true)
    expect(isValidOctal('755')).toBe(true)
    expect(isValidOctal('644')).toBe(true)
    expect(isValidOctal('777')).toBe(true)
  })

  it('returns false for invalid octals', () => {
    expect(isValidOctal('888')).toBe(false)
    expect(isValidOctal('9')).toBe(false)
    expect(isValidOctal('abc')).toBe(false)
    expect(isValidOctal('')).toBe(false)
    expect(isValidOctal('0755')).toBe(false)
  })
})

describe('isValidSymbolic', () => {
  it('returns true for valid symbolic', () => {
    expect(isValidSymbolic('rwxrwxrwx')).toBe(true)
    expect(isValidSymbolic('---------')).toBe(true)
    expect(isValidSymbolic('rw-r--r--')).toBe(true)
  })

  it('returns false for invalid symbolic', () => {
    expect(isValidSymbolic('rwx')).toBe(false)
    expect(isValidSymbolic('abcdefghi')).toBe(false)
  })
})

describe('permissionToDigit', () => {
  it('converts rwx to 7', () => {
    expect(permissionToDigit({ execute: true, read: true, write: true })).toBe(7)
  })

  it('converts r to 4', () => {
    expect(permissionToDigit({ execute: false, read: true, write: false })).toBe(4)
  })

  it('converts none to 0', () => {
    expect(permissionToDigit({ execute: false, read: false, write: false })).toBe(0)
  })
})

describe('digitToPermission', () => {
  it('converts 7 to rwx', () => {
    expect(digitToPermission(7)).toEqual({ execute: true, read: true, write: true })
  })

  it('converts 5 to rx', () => {
    expect(digitToPermission(5)).toEqual({ execute: true, read: true, write: false })
  })

  it('converts 4 to r', () => {
    expect(digitToPermission(4)).toEqual({ execute: false, read: true, write: false })
  })

  it('converts 0 to none', () => {
    expect(digitToPermission(0)).toEqual({ execute: false, read: false, write: false })
  })
})
