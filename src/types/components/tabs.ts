import type { ReactElement, ReactNode } from 'react'

export type TabsProps = {
  defaultValue?: string
  inject?: {
    setValue: (open: string) => void
    value: string
  }
  items: Array<{
    content: ReactNode
    trigger?: ReactElement<HTMLButtonElement>
    value: string
  }>
}
