import type { HmacAlgorithm, HmacEncoding } from '@/utils'

export type HmacInput = {
  algorithm: HmacAlgorithm
  encoding: HmacEncoding
  secretKey: string
  /** The message to sign. */
  source: string
}
