import { useCommandPaletteStore } from './state'
import { useKeyboardShortcut } from './useKeyboardShortcut'

export const useKeyboardShortcuts = () => {
  const toggleCommandPalette = useCommandPaletteStore((state) => state.toggle)

  useKeyboardShortcut(
    // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    (event) => (event.metaKey || event.ctrlKey) && event.key === 'k',
    (event) => {
      event.preventDefault()
      toggleCommandPalette()
    },
  )
}
