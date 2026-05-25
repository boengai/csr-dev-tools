import type { ComponentType } from 'react'
import { lazy } from 'react'

import type { ToolCategory, ToolRegistryEntry } from '@/types'
import { loadNamed } from '@/utils'

import { TOOL_ROUTES } from './tool-routes'

const COMPONENT_LOADERS: Record<string, () => Promise<{ default: ComponentType }>> = {
  'aes-encrypt-decrypt': loadNamed(
    () => import('@/components/feature/security/AesEncryptDecrypt'),
    'AesEncryptDecrypt',
  ),
  'aspect-ratio-calculator': loadNamed(
    () => import('@/components/feature/unit/AspectRatioCalculator'),
    'AspectRatioCalculator',
  ),
  'background-remover': loadNamed(() => import('@/components/feature/image/BackgroundRemover'), 'BackgroundRemover'),
  'base64-to-image': loadNamed(() => import('@/components/feature/image/Base64ToImage'), 'Base64ToImage'),
  'base64-codec': loadNamed(() => import('@/components/feature/encoding/EncodingBase64'), 'EncodingBase64'),
  'box-shadow-generator': loadNamed(() => import('@/components/feature/css/BoxShadowGenerator'), 'BoxShadowGenerator'),
  'css-animation-builder': loadNamed(
    () => import('@/components/feature/css/CssAnimationBuilder'),
    'CssAnimationBuilder',
  ),
  'css-flexbox-playground': loadNamed(() => import('@/components/feature/css/FlexboxPlayground'), 'FlexboxPlayground'),
  'css-formatter': loadNamed(() => import('@/components/feature/code/CssFormatter'), 'CssFormatter'),
  'css-gradient-generator': loadNamed(() => import('@/components/feature/css/GradientGenerator'), 'GradientGenerator'),
  'color-converter': loadNamed(() => import('@/components/feature/color/ColorConvertor'), 'ColorConvertor'),
  'color-palette-generator': loadNamed(
    () => import('@/components/feature/color/ColorPaletteGenerator'),
    'ColorPaletteGenerator',
  ),
  'combine-pdf': loadNamed(() => import('@/components/feature/data/CombinePdf'), 'CombinePdf'),
  'hash-generator': loadNamed(() => import('@/components/feature/security/HashGenerator'), 'HashGenerator'),
  'graphql-schema-viewer': loadNamed(
    () => import('@/components/feature/code/GraphqlSchemaViewer'),
    'GraphqlSchemaViewer',
  ),
  'hmac-generator': loadNamed(() => import('@/components/feature/security/HmacGenerator'), 'HmacGenerator'),
  'html-formatter': loadNamed(() => import('@/components/feature/code/HtmlFormatter'), 'HtmlFormatter'),
  'html-to-pdf': loadNamed(() => import('@/components/feature/code/HtmlToPdf'), 'HtmlToPdf'),
  'html-to-markdown-converter': loadNamed(
    () => import('@/components/feature/data/HtmlToMarkdownConverter'),
    'HtmlToMarkdownConverter',
  ),
  'svg-viewer': loadNamed(() => import('@/components/feature/image/SvgViewer'), 'SvgViewer'),
  'splash-screen-generator': loadNamed(
    () => import('@/components/feature/image/SplashScreenGenerator'),
    'SplashScreenGenerator',
  ),
  'image-converter': loadNamed(() => import('@/components/feature/image/ImageConvertor'), 'ImageConvertor'),
  'image-compressor': loadNamed(() => import('@/components/feature/image/ImageCompressor'), 'ImageCompressor'),
  'image-cropper': loadNamed(() => import('@/components/feature/image/ImageCropper'), 'ImageCropper'),
  'image-to-base64': loadNamed(() => import('@/components/feature/image/ImageToBase64'), 'ImageToBase64'),
  'image-to-pdf': loadNamed(() => import('@/components/feature/image/ImageToPdf'), 'ImageToPdf'),
  'image-resizer': loadNamed(() => import('@/components/feature/image/ImageResizer'), 'ImageResizer'),
  'ip-subnet-calculator': loadNamed(
    () => import('@/components/feature/network/IpSubnetCalculator'),
    'IpSubnetCalculator',
  ),
  'javascript-minifier': loadNamed(() => import('@/components/feature/code/JavaScriptMinifier'), 'JavaScriptMinifier'),
  'json-diff-checker': loadNamed(() => import('@/components/feature/data/JsonDiffChecker'), 'JsonDiffChecker'),
  'json-formatter': loadNamed(() => import('@/components/feature/data/JsonFormatter'), 'JsonFormatter'),
  'json-schema-validator': loadNamed(
    () => import('@/components/feature/code/JsonSchemaValidator'),
    'JsonSchemaValidator',
  ),
  'json-to-csv-converter': loadNamed(
    () => import('@/components/feature/data/JsonToCsvConverter'),
    'JsonToCsvConverter',
  ),
  'json-to-yaml-converter': loadNamed(
    () => import('@/components/feature/data/JsonToYamlConverter'),
    'JsonToYamlConverter',
  ),
  'jsonpath-evaluator': loadNamed(() => import('@/components/feature/code/JsonpathEvaluator'), 'JsonpathEvaluator'),
  'jwt-decoder': loadNamed(() => import('@/components/feature/encoding/JwtDecoder'), 'JwtDecoder'),
  'lorem-ipsum-generator': loadNamed(
    () => import('@/components/feature/text/LoremIpsumGenerator'),
    'LoremIpsumGenerator',
  ),
  'markdown-preview': loadNamed(() => import('@/components/feature/code/MarkdownPreview'), 'MarkdownPreview'),
  'markdown-table-generator': loadNamed(
    () => import('@/components/feature/code/MarkdownTableGenerator'),
    'MarkdownTableGenerator',
  ),
  'markdown-to-pdf': loadNamed(() => import('@/components/feature/code/MarkdownToPdf'), 'MarkdownToPdf'),
  'number-base-converter': loadNamed(
    () => import('@/components/feature/encoding/NumberBaseConverter'),
    'NumberBaseConverter',
  ),
  'password-generator': loadNamed(
    () => import('@/components/feature/generator/PasswordGenerator'),
    'PasswordGenerator',
  ),
  'qr-code-generator': loadNamed(() => import('@/components/feature/generator/QrCodeGenerator'), 'QrCodeGenerator'),
  'px-to-rem': loadNamed(() => import('@/components/feature/unit/UnitPxToRem'), 'UnitPxToRem'),
  'regex-tester': loadNamed(() => import('@/components/feature/text/RegexTester'), 'RegexTester'),
  'bcrypt-hasher': loadNamed(() => import('@/components/feature/security/BcryptHasher'), 'BcryptHasher'),
  'certificate-decoder': loadNamed(
    () => import('@/components/feature/security/CertificateDecoder'),
    'CertificateDecoder',
  ),
  'chmod-calculator': loadNamed(() => import('@/components/feature/security/ChmodCalculator'), 'ChmodCalculator'),
  'rsa-key-generator': loadNamed(() => import('@/components/feature/security/RsaKeyGenerator'), 'RsaKeyGenerator'),
  'ssh-key-fingerprint': loadNamed(
    () => import('@/components/feature/security/SshKeyFingerprint'),
    'SshKeyFingerprint',
  ),
  'string-escape-unescape': loadNamed(
    () => import('@/components/feature/text/StringEscapeUnescape'),
    'StringEscapeUnescape',
  ),
  'sql-formatter': loadNamed(() => import('@/components/feature/code/SqlFormatter'), 'SqlFormatter'),
  'text-case-converter': loadNamed(() => import('@/components/feature/text/TextCaseConverter'), 'TextCaseConverter'),
  'text-diff-checker': loadNamed(() => import('@/components/feature/text/TextDiffChecker'), 'TextDiffChecker'),
  'json-to-toml-converter': loadNamed(
    () => import('@/components/feature/data/JsonToTomlConverter'),
    'JsonToTomlConverter',
  ),
  'typescript-playground': loadNamed(
    () => import('@/components/feature/code/TypescriptPlayground'),
    'TypescriptPlayground',
  ),
  'unix-timestamp': loadNamed(() => import('@/components/feature/time/TimeUnixTimestamp'), 'TimeUnixTimestamp'),
  'url-encoder-decoder': loadNamed(() => import('@/components/feature/encoding/UrlEncoder'), 'UrlEncoder'),
  'uuid-generator': loadNamed(() => import('@/components/feature/generator/UuidGenerator'), 'UuidGenerator'),
  'word-counter': loadNamed(() => import('@/components/feature/text/WordCounter'), 'WordCounter'),
  'json-to-xml-converter': loadNamed(
    () => import('@/components/feature/data/JsonToXmlConverter'),
    'JsonToXmlConverter',
  ),
  'json-to-typescript': loadNamed(() => import('@/components/feature/code/JsonToTypeScript'), 'JsonToTypeScript'),
  'cron-expression-parser': loadNamed(
    () => import('@/components/feature/time/CronExpressionParser'),
    'CronExpressionParser',
  ),
  'crontab-generator': loadNamed(() => import('@/components/feature/time/CrontabGenerator'), 'CrontabGenerator'),
  'css-grid-playground': loadNamed(() => import('@/components/feature/css/GridPlayground'), 'GridPlayground'),
  'image-color-picker': loadNamed(() => import('@/components/feature/image/ImageColorPicker'), 'ImageColorPicker'),
  'text-sort-dedupe': loadNamed(() => import('@/components/feature/text/TextSortDedupe'), 'TextSortDedupe'),
  'timezone-converter': loadNamed(() => import('@/components/feature/time/TimezoneConverter'), 'TimezoneConverter'),
  'css-border-radius-generator': loadNamed(
    () => import('@/components/feature/css/BorderRadiusGenerator'),
    'BorderRadiusGenerator',
  ),
  'url-parser': loadNamed(() => import('@/components/feature/encoding/UrlParser'), 'UrlParser'),
  'mermaid-renderer': loadNamed(() => import('@/components/feature/code/MermaidRenderer'), 'MermaidRenderer'),
  'http-status-codes': loadNamed(() => import('@/components/feature/data/HttpStatusCodes'), 'HttpStatusCodes'),
  'og-preview': loadNamed(() => import('@/components/feature/data/OgPreview'), 'OgPreview'),
  'user-agent-parser': loadNamed(() => import('@/components/feature/text/UserAgentParser'), 'UserAgentParser'),
  'favicon-generator': loadNamed(() => import('@/components/feature/image/FaviconGenerator'), 'FaviconGenerator'),
  'yaml-formatter': loadNamed(() => import('@/components/feature/data/YamlFormatter'), 'YamlFormatter'),
  'data-uri-generator': loadNamed(() => import('@/components/feature/data/DataUriGenerator'), 'DataUriGenerator'),
  'db-diagram': loadNamed(() => import('@/components/feature/data/db-diagram'), 'DbDiagram'),
  'env-file-converter': loadNamed(() => import('@/components/feature/data/EnvFileConverter'), 'EnvFileConverter'),
  'escaped-json-stringifier': loadNamed(
    () => import('@/components/feature/data/EscapedJsonStringifier'),
    'EscapedJsonStringifier',
  ),
  'html-entity-converter': loadNamed(
    () => import('@/components/feature/data/HtmlEntityConverter'),
    'HtmlEntityConverter',
  ),
  'placeholder-image-generator': loadNamed(
    () => import('@/components/feature/image/PlaceholderImageGenerator'),
    'PlaceholderImageGenerator',
  ),
  'protobuf-codec': loadNamed(() => import('@/components/feature/code/ProtobufCodec'), 'ProtobufCodec'),
  'protobuf-to-json': loadNamed(() => import('@/components/feature/code/ProtobufToJson'), 'ProtobufToJson'),
}

export const TOOL_REGISTRY: Array<ToolRegistryEntry> = TOOL_ROUTES.map((route) => {
  const loader = COMPONENT_LOADERS[route.key]
  if (!loader) {
    throw new Error(`No component loader registered for tool key: ${route.key}`)
  }
  return { ...route, component: lazy(loader) }
})

export const CATEGORY_ORDER: Array<ToolCategory> = [
  'Code',
  'Color',
  'CSS',
  'Data',
  'Encoding',
  'Generator',
  'Image',
  'Network',
  'Security',
  'Text',
  'Time',
  'Unit',
]

export const groupToolsByCategory = (tools: Array<ToolRegistryEntry>) => {
  return tools.reduce<Record<string, Array<ToolRegistryEntry>>>((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = []
    }
    acc[tool.category].push(tool)
    return acc
  }, {})
}

export const TOOL_REGISTRY_MAP = TOOL_REGISTRY.reduce<Partial<Record<string, ToolRegistryEntry>>>((acc, entry) => {
  acc[entry.key] = entry
  return acc
}, {})
