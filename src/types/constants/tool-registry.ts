import type { ComponentType, LazyExoticComponent } from 'react'

export type ToolCategory = 'Color' | 'Data' | 'Encoding' | 'Generator' | 'Image' | 'Text' | 'Time' | 'Unit'

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
  | 'hash-generator'
  | 'image-converter'
  | 'image-resizer'
  | 'json-formatter'
  | 'json-to-csv-converter'
  | 'json-to-yaml-converter'
  | 'jwt-decoder'
  | 'password-generator'
  | 'px-to-rem'
  | 'regex-tester'
  | 'text-diff-checker'
  | 'unix-timestamp'
  | 'url-encoder-decoder'
  | 'uuid-generator'
