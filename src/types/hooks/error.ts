export type UseToolError = {
  clearError: () => void
  error: null | string
  setError: (message: string) => void
}
