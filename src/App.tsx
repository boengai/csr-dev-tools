import { Outlet } from '@tanstack/react-router'
import { type ComponentType, lazy, Suspense } from 'react'

import { HamburgerIcon, NotoEmoji, Sidebar, ToastProvider, XIcon } from '@/components'
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

  return (
    <>
      <header className="relative z-30 flex h-12 shrink-0 items-center gap-2 px-4 pt-[var(--safe-area-inset-top)]">
        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
          className="flex size-10 items-center justify-center rounded text-gray-400 transition-colors hover:text-white"
          onClick={toggle}
          type="button"
        >
          {isOpen ? <XIcon /> : <HamburgerIcon />}
        </button>
      </header>

      <div className="relative flex grow overflow-hidden">
        <Sidebar />
        <main className="bg-pixel-texture relative flex grow flex-col overflow-y-auto pb-[var(--safe-area-inset-bottom)] [&>*:not(:first-child)]:relative">
          <Suspense fallback={<></>}>
            <TwinkleStarsAnimate />
          </Suspense>
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <ToastProvider />
    </>
  )
}
