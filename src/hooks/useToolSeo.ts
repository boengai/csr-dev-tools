import { useEffect } from 'react'

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
  useEffect(() => {
    const previousTitle = document.title

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
      document.title = previousTitle
      descriptionMeta.content = previousDescription
      ogTitleMeta.content = previousOgTitle
      ogDescriptionMeta.content = previousOgDescription
      ogUrlMeta.content = previousOgUrl
    }
  }, [description, title, url])
}
