export type PxRemSource = 'px' | 'rem' | 'base'

export type PxRemLastEdited = 'px' | 'rem'

export type PxRemInput = {
  source: PxRemSource
  px: string
  rem: string
  base: string
  lastEdited: PxRemLastEdited
}

export type PxRemOutput = {
  px: string
  rem: string
  base: string
}
