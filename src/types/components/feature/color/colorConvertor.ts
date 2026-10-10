import type { PropsWithChildren } from 'react'

import type { ColorFormat } from '@/types'

export type ConvertInput = { format: ColorFormat; value: string }

export type ColorInputWrapperProps = PropsWithChildren<{ color: string }>

export type ColorFormatField = { format: ColorFormat; label: string; placeholder: string }
