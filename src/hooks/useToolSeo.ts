import { useEffect, useRef } from 'react'

import type { UseToolSeoParams } from '@/types'

const BASE_URL = 'https://csr-dev-tools.pages.dev'

const getOrCreateMeta = (property: string, isOg = false): HTMLMetaElement => {
  const attr = isOg ? 'property' : 'name'
  const selector = `meta[${attr}="${property}"]`
  const existing = document.querySelector<HTMLMetaElement>(selector)
  if (existing) return existing

  const meta = document.createElement('meta')
  meta.setAttribute(attr, property)
  document.head.appendChild(meta)
  return meta
}

export const useToolSeo = ({ description, title, url }: UseToolSeoParams) => {
  // Mirror the tool's title onto document.title synchronously during render
  // so the browser tab updates from the very first commit. The previous
  // effect-only implementation lagged visibly when the lazy ToolComponent
  // inside Suspense delayed the surrounding commit. The effect below also
  // re-applies the title — required because in StrictMode the render body
  // is not re-run during the dev-mode mount/unmount/remount cycle, but the
  // effect is, so we need both to land on the right title.
  const initialTitleRef = useRef<string | null>(null)
  if (typeof document !== 'undefined') {
    if (initialTitleRef.current === null) {
      initialTitleRef.current = document.title
    }
    if (document.title !== title) {
      document.title = title
    }
  }

  useEffect(() => {
    const descriptionMeta = getOrCreateMeta('description')
    const previousDescription = descriptionMeta.content

    const ogTitleMeta = getOrCreateMeta('og:title', true)
    const previousOgTitle = ogTitleMeta.content

    const ogDescriptionMeta = getOrCreateMeta('og:description', true)
    const previousOgDescription = ogDescriptionMeta.content

    const ogUrlMeta = getOrCreateMeta('og:url', true)
    const previousOgUrl = ogUrlMeta.content

    document.title = title
    descriptionMeta.content = description
    ogTitleMeta.content = title
    ogDescriptionMeta.content = description
    if (url) {
      ogUrlMeta.content = `${BASE_URL}${url}`
    }

    return () => {
      descriptionMeta.content = previousDescription
      ogTitleMeta.content = previousOgTitle
      ogDescriptionMeta.content = previousOgDescription
      ogUrlMeta.content = previousOgUrl
      if (initialTitleRef.current !== null) {
        document.title = initialTitleRef.current
      }
    }
  }, [description, title, url])
}
