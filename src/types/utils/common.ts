import type { TVReturnType } from 'tailwind-variants'

export type CompVariant<T> = TVReturnType<VariantTransform<T>, undefined, string, VariantTransform<T>, undefined>

// export type CompVariant<T extends Required<Record<string, boolean | string>>> = {
//   [K in keyof T]-?: T[K] extends string ? Record<T[K], string> : Record<'false' | 'true', string>
// }
type VariantTransform<T> = T extends infer U
  ? {
      [K in keyof U]-?: U[K] extends string ? Record<U[K], string> : Record<'false' | 'true', string>
    }
  : never
