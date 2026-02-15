import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { type ComponentType, lazy, Suspense } from 'react'

import { ArrowIcon, CommandPalette, HamburgerIcon, NotoEmoji, SearchIcon, Sidebar, ToastProvider } from '@/components'
import { ROUTE_PATH } from '@/constants'
import { useCommandPaletteStore, useKeyboardShortcuts, useSidebarStore } from '@/hooks'

const TwinkleStarsAnimate = lazy(() =>
  import('@/components/common/animate/TwinkleStarsAnimate').then(
    ({ TwinkleStarsAnimate }: { TwinkleStarsAnimate: ComponentType }) => ({
      default: TwinkleStarsAnimate,
    }),
  ),
)

const PageLoading = () => {
  return (
    <div className="flex grow flex-col items-center justify-center">
      <NotoEmoji emoji="flying-saucer" size={200} />
    </div>
  )
}

export default function App() {
  useKeyboardShortcuts()
  const isOpen = useSidebarStore((state) => state.isOpen)
  const toggle = useSidebarStore((state) => state.toggle)
  const openCommandPalette = useCommandPaletteStore((state) => state.open)
  const { pathname } = useLocation()
  const isToolPage = pathname.startsWith(ROUTE_PATH.TOOL + '/')

  return (
    <>
      <header className="relative z-30 flex h-12 shrink-0 items-center gap-2 px-4 pt-[var(--safe-area-inset-top)]">
        <button
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
          className="flex size-10 items-center justify-center rounded text-gray-400 transition-colors hover:text-white"
          onClick={toggle}
          type="button"
        >
          <HamburgerIcon />
        </button>
        {isToolPage && (
          <Link
            aria-label="Back to home"
            className="flex items-center gap-1 rounded px-2 py-1 text-gray-400 transition-colors hover:text-white"
            to={ROUTE_PATH.HOME}
          >
            <ArrowIcon />
            <span>🏠</span>
          </Link>
        )}
        <button
          aria-label="Search tools"
          className="ml-auto flex items-center gap-2 rounded px-2 py-1 text-gray-400 transition-colors hover:text-white"
          onClick={openCommandPalette}
          type="button"
        >
          <SearchIcon />
          <kbd className="rounded-sm border border-gray-800 bg-gray-950 px-1.5 py-0.5 text-body-xs">
            {typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent) ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </button>
      </header>

      <Sidebar />
      <main className="bg-pixel-texture relative flex grow flex-col overflow-y-auto [&>*:not(:first-child)]:relative">
        <Suspense fallback={<></>}>
          <TwinkleStarsAnimate />
        </Suspense>
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>

      <CommandPalette />
      <ToastProvider />
    </>
  )
}
