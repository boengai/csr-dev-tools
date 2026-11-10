import { Navigate, useNavigate, useParams } from '@tanstack/react-router'
import { Suspense, useCallback, useMemo, useRef } from 'react'

import { Card, NotoEmoji, ToolPresentationProvider } from '@/components'
import { getToolEntry, ROUTE_PATH } from '@/constants'
import { useToolSeo } from '@/hooks'
import type { ToolPresentation, ToolRegistryEntry } from '@/types'

export default function ToolsPage() {
  const { toolKey } = useParams({ strict: false })
  const tool = getToolEntry(toolKey)

  if (!tool) {
    return <Navigate to={ROUTE_PATH.HOME} />
  }

  return <ToolsPageContent tool={tool} />
}

const ToolsPageContent = ({ tool }: { tool: ToolRegistryEntry }) => {
  const navigate = useNavigate()

  useToolSeo({
    description: tool.seo.description,
    title: tool.seo.title,
    url: tool.routePath,
  })

  // The Tool renders inline (ADR-0029). Its frame registers the reset it used
  // to run when its dialog closed; the page's close control runs it before
  // going home, so "close" still means "done with this Tool".
  const resetRef = useRef<(() => void) | undefined>(undefined)
  const registerReset = useCallback((reset: (() => void) | undefined) => {
    resetRef.current = reset
  }, [])
  const presentation = useMemo<ToolPresentation>(() => ({ kind: 'page', registerReset }), [registerReset])

  const ToolComponent = tool.component
  const navigateHome = () => navigate({ to: ROUTE_PATH.HOME })
  const handleClose = () => {
    resetRef.current?.()
    navigateHome()
  }

  return (
    <div className="flex min-h-0 grow flex-col p-2 pb-[calc(0.5rem+var(--safe-area-inset-bottom))] tablet:p-4">
      <Suspense
        fallback={
          <div className="flex grow items-center justify-center">
            <NotoEmoji emoji="flying-saucer" size={200} />
          </div>
        }
      >
        <Card onClose={handleClose} title={tool.name} variant="page">
          <ToolPresentationProvider value={presentation}>
            <ToolComponent autoOpen onAfterClose={navigateHome} />
          </ToolPresentationProvider>
        </Card>
      </Suspense>
    </div>
  )
}
