import type { ReactNode } from 'react'

type EmptyStateProps = {
  children: ReactNode
}

export const EmptyState = ({ children }: EmptyStateProps) => (
  <p className="text-body-xs text-gray-500">{children}</p>
)
