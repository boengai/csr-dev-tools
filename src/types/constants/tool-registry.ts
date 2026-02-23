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
  | 'aspect-ratio-calculator'
  | 'background-remover'
  | 'base64-encoder'
  | 'base64-to-image'
  | 'box-shadow-generator'
  | 'color-converter'
  | 'color-palette-generator'
  | 'cron-expression-parser'
  | 'crontab-generator'
  | 'css-animation-builder'
  | 'css-border-radius-generator'
  | 'css-flexbox-playground'
  | 'css-formatter'
  | 'css-gradient-generator'
  | 'css-grid-playground'
  | 'env-file-converter'
  | 'escaped-json-stringifier'
  | 'favicon-generator'
  | 'hash-generator'
  | 'hmac-generator'
  | 'html-entity-converter'
  | 'html-formatter'
  | 'html-to-markdown-converter'
  | 'http-status-codes'
  | 'image-color-picker'
  | 'image-compressor'
  | 'image-converter'
  | 'image-cropper'
  | 'image-resizer'
  | 'image-to-base64'
  | 'javascript-minifier'
  | 'json-formatter'
  | 'json-schema-validator'
  | 'json-to-csv-converter'
  | 'json-to-typescript'
  | 'json-to-yaml-converter'
  | 'jwt-decoder'
  | 'lorem-ipsum-generator'
  | 'markdown-preview'
  | 'markdown-table-generator'
  | 'number-base-converter'
  | 'og-preview'
  | 'password-generator'
  | 'px-to-rem'
  | 'qr-code-generator'
  | 'regex-tester'
  | 'sql-formatter'
  | 'string-escape-unescape'
  | 'svg-viewer'
  | 'text-case-converter'
  | 'text-diff-checker'
  | 'text-sort-dedupe'
  | 'toml-to-json-converter'
  | 'unix-timestamp'
  | 'url-encoder-decoder'
  | 'url-parser'
  | 'user-agent-parser'
  | 'uuid-generator'
  | 'word-counter'
  | 'xml-to-json-converter'
  | 'yaml-formatter'
