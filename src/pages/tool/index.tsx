import { Navigate, useParams } from '@tanstack/react-router'
import { Suspense } from 'react'

import type { ToolRegistryEntry } from '@/types'

import { Card, NotoEmoji } from '@/components'
import { ROUTE_PATH, TOOL_REGISTRY_MAP } from '@/constants'
import { useToolSeo } from '@/hooks'

export default function ToolPage() {
  const { toolKey } = useParams({ strict: false })
  const tool = TOOL_REGISTRY_MAP[toolKey]

  if (!tool) {
    return <Navigate to={ROUTE_PATH.HOME} />
  }

  return <ToolPageContent tool={tool} />
}

const ToolPageContent = ({ tool }: { tool: ToolRegistryEntry }) => {
  useToolSeo({
    description: tool.seo.description,
    title: tool.seo.title,
    url: tool.routePath,
  })

  const ToolComponent = tool.component

  return (
    <div className="flex grow flex-col items-center justify-center p-6 pb-[calc(1.5rem+var(--safe-area-inset-bottom))]">
      <div className="flex max-h-full w-full max-w-[768px] flex-col">
        <Suspense fallback={<NotoEmoji emoji="flying-saucer" size={200} />}>
          <Card title={tool.name}>
            <ToolComponent />
          </Card>
        </Suspense>
      </div>
    </div>
  )
}
