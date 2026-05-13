import type { HmacAlgorithm, HmacEncoding } from '@/utils'

export type HmacInput = {
  algorithm: HmacAlgorithm
  encoding: HmacEncoding
  message: string
  secretKey: string
}
