import type { ReactNode } from 'react'

export type ErrorBannerProps = {
  children: ReactNode
  variant?: 'error' | 'warning'
}
