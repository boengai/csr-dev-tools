import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { domAnimation, LazyMotion } from 'motion/react'
import { lazy, Suspense } from 'react'

import { NotoEmoji } from '@/components/common/emoji' // optimized import
import { ArrowIcon, GitHubIcon, HamburgerIcon, SearchIcon } from '@/components/common/icon' // optimized import
import { ROUTE_PATH } from '@/constants'
import { useCommandPaletteStore, useKeyboardShortcut, usePersistSettings, useSidebarStore } from '@/hooks'
import { loadNamed } from '@/utils'

const TwinkleStarsAnimate = lazy(
  loadNamed(() => import('@/components/common/animate/TwinkleStarsAnimate'), 'TwinkleStarsAnimate'),
)
const CommandPalette = lazy(
  loadNamed(() => import('@/components/common/command-palette/CommandPalette'), 'CommandPalette'),
)
const Sidebar = lazy(loadNamed(() => import('@/components/common/sidebar/Sidebar'), 'Sidebar'))
const SettingsDialog = lazy(loadNamed(() => import('@/components/common/settings/SettingsDialog'), 'SettingsDialog'))
const ToastProvider = lazy(loadNamed(() => import('@/components/common/toast/ToastProvider'), 'ToastProvider'))

const PageLoading = () => {
  return (
    <div className="flex grow flex-col items-center justify-center">
      <NotoEmoji emoji="flying-saucer" size={200} />
    </div>
  )
}

export default function App() {
  const isOpen = useSidebarStore((state) => state.isOpen)
  const toggle = useSidebarStore((state) => state.toggle)
  const openCommandPalette = useCommandPaletteStore((state) => state.open)
  const toggleCommandPalette = useCommandPaletteStore((state) => state.toggle)
  const showBackgroundAnimation = usePersistSettings((s) => s.value.showBackgroundAnimation)

  useKeyboardShortcut(
    (event) => (event.metaKey || event.ctrlKey) && event.key === 'k',
    (event) => {
      event.preventDefault()
      toggleCommandPalette()
    },
  )
  const { pathname } = useLocation()
  const isToolPage = pathname.startsWith(ROUTE_PATH.TOOLS + '/')

  return (
    <LazyMotion features={domAnimation} strict>
      <header className="relative z-30 flex h-12 shrink-0 items-center gap-2 px-4 pt-(--safe-area-inset-top)">
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
        <div className="ml-auto flex items-center gap-2">
          <button
            className="flex items-center gap-2 rounded px-2 py-1 text-gray-400 transition-colors hover:text-white"
            onClick={openCommandPalette}
            type="button"
          >
            <SearchIcon />
            <span className="text-body-xs">Search</span>
            <kbd className="hidden rounded-sm border border-gray-800 bg-gray-950 px-1.5 py-0.5 text-body-xs tablet:inline-block">
              {typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent) ? '⌘K' : 'Ctrl+K'}
            </kbd>
          </button>
          <a
            aria-label="GitHub repository"
            className="flex size-10 items-center justify-center rounded text-gray-400 transition-colors hover:text-white"
            href="https://github.com/boengai/csr-dev-tools"
            rel="noopener noreferrer"
            target="_blank"
          >
            <GitHubIcon />
          </a>
          <Suspense>
            <SettingsDialog />
          </Suspense>
        </div>
      </header>

      <Suspense>
        <Sidebar />
      </Suspense>
      <main className="bg-pixel-texture relative flex grow flex-col overflow-y-auto [&>*:not(:first-child)]:relative">
        {showBackgroundAnimation && (
          <Suspense fallback={<></>}>
            <TwinkleStarsAnimate />
          </Suspense>
        )}
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>

      <Suspense>
        <CommandPalette />
      </Suspense>
      <Suspense>
        <ToastProvider />
      </Suspense>
    </LazyMotion>
  )
}
