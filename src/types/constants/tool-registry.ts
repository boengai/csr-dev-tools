import type { ComponentType, LazyExoticComponent } from 'react'

export type ToolCategory = 'Color' | 'Encoding' | 'Image' | 'Time' | 'Unit'

export type ToolSeo = {
  description: string
  title: string
}

export type ToolRegistryEntry = {
  category: ToolCategory
  component: LazyExoticComponent<ComponentType>
  description: string
  emoji: string
  key: ToolRegistryKey
  name: string
  routePath: string
  seo: ToolSeo
}

export type ToolRegistryKey =
  | 'base64-encoder'
  | 'color-converter'
  | 'image-converter'
  | 'image-resizer'
  | 'jwt-decoder'
  | 'px-to-rem'
  | 'unix-timestamp'
  | 'url-encoder-decoder'
