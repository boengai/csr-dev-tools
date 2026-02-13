import { useCallback, useState } from 'react'

import type { UseToolError } from '@/types'

export const useToolError = (): UseToolError => {
  const [error, setError] = useState<null | string>(null)
  const clearError = useCallback(() => setError(null), [])
  return {
    clearError,
    error,
    setError,
  }
}
