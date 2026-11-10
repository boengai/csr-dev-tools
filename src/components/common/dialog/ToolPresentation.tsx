import { createContext, useContext } from 'react'

import type { ToolPresentation, ToolPresentationProviderProps } from '@/types'

const DIALOG: ToolPresentation = { kind: 'dialog' }

const ToolPresentationContext = createContext<ToolPresentation>(DIALOG)

/** Which [[Tool presentation]] the nearest provider asks for — `dialog` unless a page says otherwise. */
export const useToolPresentation = (): ToolPresentation => useContext(ToolPresentationContext)

export const ToolPresentationProvider = ({ children, value }: ToolPresentationProviderProps) => (
  <ToolPresentationContext.Provider value={value}>{children}</ToolPresentationContext.Provider>
)

/** Children of an inline Tool see `dialog` again, so any dialog they open stays a real one. */
export const DialogPresentation = ({ children }: { children: ToolPresentationProviderProps['children'] }) => (
  <ToolPresentationContext.Provider value={DIALOG}>{children}</ToolPresentationContext.Provider>
)
