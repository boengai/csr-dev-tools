import type { ReactElement, ReactNode } from 'react'

export type DialogProps = Partial<DialogVariants> & {
  children: ReactNode
  description: string
  title: string
  trigger?: ReactElement<HTMLButtonElement>
}

export type DialogVariants = {
  size: 'default' | 'screen' | 'small'
}
