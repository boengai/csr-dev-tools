import { Navigate, useParams } from '@tanstack/react-router'
import { Suspense } from 'react'

import type { ToolRegistryEntry } from '@/types'

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
    <div className="flex grow flex-col p-6">
      <header className="mb-6">
        <h1 className="text-heading-3 text-white">{tool.name}</h1>
        <p className="text-body text-text-secondary mt-1">{tool.description}</p>
      </header>
      <div className="flex grow flex-col">
        <Suspense fallback={<ToolPageLoading />}>
          <ToolComponent />
        </Suspense>
      </div>
    </div>
  )
}

const ToolPageLoading = () => {
  return (
    <div className="bg-primary/10 flex grow flex-col items-center justify-center rounded-xl">
      <span className="text-text-secondary">Loading...</span>
    </div>
  )
}
