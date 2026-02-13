import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { type ComponentType, lazy, Suspense } from 'react'

import { ArrowIcon, HamburgerIcon, NotoEmoji, Sidebar, ToastProvider } from '@/components'
import { ROUTE_PATH } from '@/constants'
import { useSidebarStore } from '@/hooks'

const TwinkleStarsAnimate = lazy(() =>
  import('@/components/common/animate/TwinkleStarsAnimate').then(
    ({ TwinkleStarsAnimate }: { TwinkleStarsAnimate: ComponentType }) => ({
      default: TwinkleStarsAnimate,
    }),
  ),
)

const PageLoading = () => {
  return (
    <div className="bg-primary/10 flex grow flex-col items-center justify-center rounded-xl">
      <NotoEmoji emoji="flying-saucer" size={200} />
    </div>
  )
}

export default function App() {
  const isOpen = useSidebarStore((state) => state.isOpen)
  const toggle = useSidebarStore((state) => state.toggle)
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

      <ToastProvider />
    </>
  )
}
