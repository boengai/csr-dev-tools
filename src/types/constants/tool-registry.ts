import type { ComponentType, LazyExoticComponent } from 'react'

export type ToolCategory =
  | 'Code'
  | 'Color'
  | 'CSS'
  | 'Data'
  | 'Encoding'
  | 'Generator'
  | 'Image'
  | 'Network'
  | 'Security'
  | 'Text'
  | 'Time'
  | 'Unit'

export type ToolSeo = {
  description: string
  title: string
}

export type ToolComponentProps = {
  autoOpen?: boolean
  onAfterClose?: () => void
}

// What a tool author writes in `TOOL_ROUTES` (src/constants/tool-routes.ts).
// `routePath` is derived from `key`; `seo.title` defaults to
// `<name> - CSR Dev Tools` and is only set to override that default.
export type ToolRouteDefinition = {
  category: ToolCategory
  description: string
  emoji: string
  key: ToolRegistryKey
  name: string
  seo: {
    description: string
    title?: string
  }
}

// A definition with the derived fields resolved.
export type ToolRoute = Omit<ToolRouteDefinition, 'seo'> & {
  routePath: string
  seo: ToolSeo
}

export type ToolRegistryEntry = ToolRoute & {
  component: LazyExoticComponent<ComponentType<ToolComponentProps>>
}

export type ToolComponentLoader = () => Promise<{ default: ComponentType }>

export type ToolRegistryKey =
  | 'aes-encrypt-decrypt'
  | 'aspect-ratio-calculator'
  | 'background-remover'
  | 'base64-codec'
  | 'base64-to-image'
  | 'bcrypt-hasher'
  | 'box-shadow-generator'
  | 'certificate-decoder'
  | 'chmod-calculator'
  | 'color-converter'
  | 'color-palette-generator'
  | 'combine-pdf'
  | 'cron-expression-parser'
  | 'crontab-generator'
  | 'css-animation-builder'
  | 'css-border-radius-generator'
  | 'css-flexbox-playground'
  | 'css-formatter'
  | 'css-gradient-generator'
  | 'css-grid-playground'
  | 'data-uri-generator'
  | 'db-diagram'
  | 'env-file-converter'
  | 'escaped-json-stringifier'
  | 'favicon-generator'
  | 'graphql-schema-viewer'
  | 'hash-generator'
  | 'hmac-generator'
  | 'html-entity-converter'
  | 'html-formatter'
  | 'html-to-pdf'
  | 'html-to-markdown-converter'
  | 'http-status-codes'
  | 'image-color-picker'
  | 'image-compressor'
  | 'image-converter'
  | 'image-cropper'
  | 'image-resizer'
  | 'image-to-base64'
  | 'image-to-pdf'
  | 'ip-subnet-calculator'
  | 'javascript-minifier'
  | 'json-diff-checker'
  | 'json-formatter'
  | 'json-schema-validator'
  | 'json-to-csv-converter'
  | 'json-to-toml-converter'
  | 'json-to-typescript'
  | 'json-to-xml-converter'
  | 'json-to-yaml-converter'
  | 'jsonpath-evaluator'
  | 'jwt-decoder'
  | 'lorem-ipsum-generator'
  | 'markdown-preview'
  | 'markdown-table-generator'
  | 'markdown-to-pdf'
  | 'mermaid-renderer'
  | 'number-base-converter'
  | 'og-preview'
  | 'password-generator'
  | 'placeholder-image-generator'
  | 'protobuf-codec'
  | 'protobuf-to-json'
  | 'px-to-rem'
  | 'qr-code-generator'
  | 'regex-tester'
  | 'rsa-key-generator'
  | 'splash-screen-generator'
  | 'sql-formatter'
  | 'ssh-key-fingerprint'
  | 'string-escape-unescape'
  | 'svg-viewer'
  | 'text-case-converter'
  | 'text-diff-checker'
  | 'text-sort-dedupe'
  | 'timezone-converter'
  | 'typescript-playground'
  | 'unix-timestamp'
  | 'url-encoder-decoder'
  | 'url-parser'
  | 'user-agent-parser'
  | 'uuid-generator'
  | 'word-counter'
  | 'yaml-formatter'
