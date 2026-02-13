import { useEffect } from 'react'

import { useCommandPaletteStore } from '@/hooks/state'

export const useKeyboardShortcuts = () => {
  const toggleCommandPalette = useCommandPaletteStore((state) => state.toggle)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        toggleCommandPalette()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleCommandPalette])
}
