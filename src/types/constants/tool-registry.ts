import type { ComponentType, LazyExoticComponent } from 'react'

export type ToolCategory =
  | 'Code'
  | 'Color'
  | 'CSS'
  | 'Data'
  | 'Encoding'
  | 'Generator'
  | 'Image'
  | 'Text'
  | 'Time'
  | 'Unit'

export type ToolSeo = {
  description: string
  title: string
}

export type ToolComponentProps = {
  autoOpen?: boolean
  onAfterDialogClose?: () => void
}

export type ToolRegistryEntry = {
  category: ToolCategory
  component: LazyExoticComponent<ComponentType<ToolComponentProps>>
  description: string
  emoji: string
  key: ToolRegistryKey
  name: string
  routePath: string
  seo: ToolSeo
}

export type ToolRegistryKey =
  | 'aes-encrypt-decrypt'
  | 'base64-to-image'
  | 'base64-encoder'
  | 'box-shadow-generator'
  | 'color-converter'
  | 'css-flexbox-playground'
  | 'css-formatter'
  | 'css-gradient-generator'
  | 'hash-generator'
  | 'hmac-generator'
  | 'html-formatter'
  | 'html-to-markdown-converter'
  | 'image-compressor'
  | 'image-to-base64'
  | 'image-converter'
  | 'image-cropper'
  | 'image-resizer'
  | 'javascript-minifier'
  | 'json-formatter'
  | 'json-to-csv-converter'
  | 'json-to-yaml-converter'
  | 'jwt-decoder'
  | 'lorem-ipsum-generator'
  | 'markdown-preview'
  | 'number-base-converter'
  | 'password-generator'
  | 'px-to-rem'
  | 'qr-code-generator'
  | 'regex-tester'
  | 'sql-formatter'
  | 'string-escape-unescape'
  | 'svg-viewer'
  | 'text-case-converter'
  | 'text-diff-checker'
  | 'toml-to-json-converter'
  | 'unix-timestamp'
  | 'url-encoder-decoder'
  | 'uuid-generator'
  | 'word-counter'
  | 'xml-to-json-converter'
