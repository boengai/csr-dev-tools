import type { ComponentType } from 'react'
import { lazy } from 'react'

import type { ToolCategory, ToolRegistryEntry } from '@/types'

import { TOOL_ROUTES } from './tool-routes'

const COMPONENT_LOADERS: Record<string, () => Promise<{ default: ComponentType }>> = {
  'aes-encrypt-decrypt': () =>
    import('@/components/feature/security/AesEncryptDecrypt').then(({ AesEncryptDecrypt }: { AesEncryptDecrypt: ComponentType }) => ({ default: AesEncryptDecrypt })),
  'aspect-ratio-calculator': () =>
    import('@/components/feature/unit/AspectRatioCalculator').then(({ AspectRatioCalculator }: { AspectRatioCalculator: ComponentType }) => ({ default: AspectRatioCalculator })),
  'background-remover': () =>
    import('@/components/feature/image/BackgroundRemover').then(({ BackgroundRemover }: { BackgroundRemover: ComponentType }) => ({ default: BackgroundRemover })),
  'base64-to-image': () =>
    import('@/components/feature/image/Base64ToImage').then(({ Base64ToImage }: { Base64ToImage: ComponentType }) => ({ default: Base64ToImage })),
  'base64-codec': () =>
    import('@/components/feature/encoding/EncodingBase64').then(({ EncodingBase64 }: { EncodingBase64: ComponentType }) => ({ default: EncodingBase64 })),
  'box-shadow-generator': () =>
    import('@/components/feature/css/BoxShadowGenerator').then(({ BoxShadowGenerator }: { BoxShadowGenerator: ComponentType }) => ({ default: BoxShadowGenerator })),
  'css-animation-builder': () =>
    import('@/components/feature/css/CssAnimationBuilder').then(({ CssAnimationBuilder }: { CssAnimationBuilder: ComponentType }) => ({ default: CssAnimationBuilder })),
  'css-flexbox-playground': () =>
    import('@/components/feature/css/FlexboxPlayground').then(({ FlexboxPlayground }: { FlexboxPlayground: ComponentType }) => ({ default: FlexboxPlayground })),
  'css-formatter': () =>
    import('@/components/feature/code/CssFormatter').then(({ CssFormatter }: { CssFormatter: ComponentType }) => ({ default: CssFormatter })),
  'css-gradient-generator': () =>
    import('@/components/feature/css/GradientGenerator').then(({ GradientGenerator }: { GradientGenerator: ComponentType }) => ({ default: GradientGenerator })),
  'color-converter': () =>
    import('@/components/feature/color/ColorConvertor').then(({ ColorConvertor }: { ColorConvertor: ComponentType }) => ({ default: ColorConvertor })),
  'color-palette-generator': () =>
    import('@/components/feature/color/ColorPaletteGenerator').then(({ ColorPaletteGenerator }: { ColorPaletteGenerator: ComponentType }) => ({ default: ColorPaletteGenerator })),
  'hash-generator': () =>
    import('@/components/feature/security/HashGenerator').then(({ HashGenerator }: { HashGenerator: ComponentType }) => ({ default: HashGenerator })),
  'graphql-schema-viewer': () =>
    import('@/components/feature/code/GraphqlSchemaViewer').then(({ GraphqlSchemaViewer }: { GraphqlSchemaViewer: ComponentType }) => ({ default: GraphqlSchemaViewer })),
  'hmac-generator': () =>
    import('@/components/feature/security/HmacGenerator').then(({ HmacGenerator }: { HmacGenerator: ComponentType }) => ({ default: HmacGenerator })),
  'html-formatter': () =>
    import('@/components/feature/code/HtmlFormatter').then(({ HtmlFormatter }: { HtmlFormatter: ComponentType }) => ({ default: HtmlFormatter })),
  'html-to-markdown-converter': () =>
    import('@/components/feature/data/HtmlToMarkdownConverter').then(({ HtmlToMarkdownConverter }: { HtmlToMarkdownConverter: ComponentType }) => ({ default: HtmlToMarkdownConverter })),
  'svg-viewer': () =>
    import('@/components/feature/image/SvgViewer').then(({ SvgViewer }: { SvgViewer: ComponentType }) => ({ default: SvgViewer })),
  'splash-screen-generator': () =>
    import('@/components/feature/image/SplashScreenGenerator').then(({ SplashScreenGenerator }: { SplashScreenGenerator: ComponentType }) => ({ default: SplashScreenGenerator })),
  'image-converter': () =>
    import('@/components/feature/image/ImageConvertor').then(({ ImageConvertor }: { ImageConvertor: ComponentType }) => ({ default: ImageConvertor })),
  'image-compressor': () =>
    import('@/components/feature/image/ImageCompressor').then(({ ImageCompressor }: { ImageCompressor: ComponentType }) => ({ default: ImageCompressor })),
  'image-cropper': () =>
    import('@/components/feature/image/ImageCropper').then(({ ImageCropper }: { ImageCropper: ComponentType }) => ({ default: ImageCropper })),
  'image-to-base64': () =>
    import('@/components/feature/image/ImageToBase64').then(({ ImageToBase64 }: { ImageToBase64: ComponentType }) => ({ default: ImageToBase64 })),
  'image-resizer': () =>
    import('@/components/feature/image/ImageResizer').then(({ ImageResizer }: { ImageResizer: ComponentType }) => ({ default: ImageResizer })),
  'ip-subnet-calculator': () =>
    import('@/components/feature/network/IpSubnetCalculator').then(({ IpSubnetCalculator }: { IpSubnetCalculator: ComponentType }) => ({ default: IpSubnetCalculator })),
  'javascript-minifier': () =>
    import('@/components/feature/code/JavaScriptMinifier').then(({ JavaScriptMinifier }: { JavaScriptMinifier: ComponentType }) => ({ default: JavaScriptMinifier })),
  'json-diff-checker': () =>
    import('@/components/feature/data/JsonDiffChecker').then(({ JsonDiffChecker }: { JsonDiffChecker: ComponentType }) => ({ default: JsonDiffChecker })),
  'json-formatter': () =>
    import('@/components/feature/data/JsonFormatter').then(({ JsonFormatter }: { JsonFormatter: ComponentType }) => ({ default: JsonFormatter })),
  'json-schema-validator': () =>
    import('@/components/feature/code/JsonSchemaValidator').then(({ JsonSchemaValidator }: { JsonSchemaValidator: ComponentType }) => ({ default: JsonSchemaValidator })),
  'json-to-csv-converter': () =>
    import('@/components/feature/data/JsonToCsvConverter').then(({ JsonToCsvConverter }: { JsonToCsvConverter: ComponentType }) => ({ default: JsonToCsvConverter })),
  'json-to-yaml-converter': () =>
    import('@/components/feature/data/JsonToYamlConverter').then(({ JsonToYamlConverter }: { JsonToYamlConverter: ComponentType }) => ({ default: JsonToYamlConverter })),
  'jsonpath-evaluator': () =>
    import('@/components/feature/code/JsonpathEvaluator').then(({ JsonpathEvaluator }: { JsonpathEvaluator: ComponentType }) => ({ default: JsonpathEvaluator })),
  'jwt-decoder': () =>
    import('@/components/feature/encoding/JwtDecoder').then(({ JwtDecoder }: { JwtDecoder: ComponentType }) => ({ default: JwtDecoder })),
  'lorem-ipsum-generator': () =>
    import('@/components/feature/text/LoremIpsumGenerator').then(({ LoremIpsumGenerator }: { LoremIpsumGenerator: ComponentType }) => ({ default: LoremIpsumGenerator })),
  'markdown-preview': () =>
    import('@/components/feature/code/MarkdownPreview').then(({ MarkdownPreview }: { MarkdownPreview: ComponentType }) => ({ default: MarkdownPreview })),
  'number-base-converter': () =>
    import('@/components/feature/encoding/NumberBaseConverter').then(({ NumberBaseConverter }: { NumberBaseConverter: ComponentType }) => ({ default: NumberBaseConverter })),
  'password-generator': () =>
    import('@/components/feature/generator/PasswordGenerator').then(({ PasswordGenerator }: { PasswordGenerator: ComponentType }) => ({ default: PasswordGenerator })),
  'qr-code-generator': () =>
    import('@/components/feature/generator/QrCodeGenerator').then(({ QrCodeGenerator }: { QrCodeGenerator: ComponentType }) => ({ default: QrCodeGenerator })),
  'px-to-rem': () =>
    import('@/components/feature/unit/UnitPxToRem').then(({ UnitPxToRem }: { UnitPxToRem: ComponentType }) => ({ default: UnitPxToRem })),
  'regex-tester': () =>
    import('@/components/feature/text/RegexTester').then(({ RegexTester }: { RegexTester: ComponentType }) => ({ default: RegexTester })),
  'bcrypt-hasher': () =>
    import('@/components/feature/security/BcryptHasher').then(({ BcryptHasher }: { BcryptHasher: ComponentType }) => ({ default: BcryptHasher })),
  'certificate-decoder': () =>
    import('@/components/feature/security/CertificateDecoder').then(({ CertificateDecoder }: { CertificateDecoder: ComponentType }) => ({ default: CertificateDecoder })),
  'chmod-calculator': () =>
    import('@/components/feature/security/ChmodCalculator').then(({ ChmodCalculator }: { ChmodCalculator: ComponentType }) => ({ default: ChmodCalculator })),
  'rsa-key-generator': () =>
    import('@/components/feature/security/RsaKeyGenerator').then(({ RsaKeyGenerator }: { RsaKeyGenerator: ComponentType }) => ({ default: RsaKeyGenerator })),
  'ssh-key-fingerprint': () =>
    import('@/components/feature/security/SshKeyFingerprint').then(({ SshKeyFingerprint }: { SshKeyFingerprint: ComponentType }) => ({ default: SshKeyFingerprint })),
  'string-escape-unescape': () =>
    import('@/components/feature/text/StringEscapeUnescape').then(({ StringEscapeUnescape }: { StringEscapeUnescape: ComponentType }) => ({ default: StringEscapeUnescape })),
  'sql-formatter': () =>
    import('@/components/feature/code/SqlFormatter').then(({ SqlFormatter }: { SqlFormatter: ComponentType }) => ({ default: SqlFormatter })),
  'text-case-converter': () =>
    import('@/components/feature/text/TextCaseConverter').then(({ TextCaseConverter }: { TextCaseConverter: ComponentType }) => ({ default: TextCaseConverter })),
  'text-diff-checker': () =>
    import('@/components/feature/text/TextDiffChecker').then(({ TextDiffChecker }: { TextDiffChecker: ComponentType }) => ({ default: TextDiffChecker })),
  'json-to-toml-converter': () =>
    import('@/components/feature/data/JsonToTomlConverter').then(({ JsonToTomlConverter }: { JsonToTomlConverter: ComponentType }) => ({ default: JsonToTomlConverter })),
  'typescript-playground': () =>
    import('@/components/feature/code/TypescriptPlayground').then(({ TypescriptPlayground }: { TypescriptPlayground: ComponentType }) => ({ default: TypescriptPlayground })),
  'unix-timestamp': () =>
    import('@/components/feature/time/TimeUnixTimestamp').then(({ TimeUnixTimestamp }: { TimeUnixTimestamp: ComponentType }) => ({ default: TimeUnixTimestamp })),
  'url-encoder-decoder': () =>
    import('@/components/feature/encoding/UrlEncoder').then(({ UrlEncoder }: { UrlEncoder: ComponentType }) => ({ default: UrlEncoder })),
  'uuid-generator': () =>
    import('@/components/feature/generator/UuidGenerator').then(({ UuidGenerator }: { UuidGenerator: ComponentType }) => ({ default: UuidGenerator })),
  'word-counter': () =>
    import('@/components/feature/text/WordCounter').then(({ WordCounter }: { WordCounter: ComponentType }) => ({ default: WordCounter })),
  'json-to-xml-converter': () =>
    import('@/components/feature/data/JsonToXmlConverter').then(({ JsonToXmlConverter }: { JsonToXmlConverter: ComponentType }) => ({ default: JsonToXmlConverter })),
  'json-to-typescript': () =>
    import('@/components/feature/code/JsonToTypeScript').then(({ JsonToTypeScript }: { JsonToTypeScript: ComponentType }) => ({ default: JsonToTypeScript })),
  'cron-expression-parser': () =>
    import('@/components/feature/time/CronExpressionParser').then(({ CronExpressionParser }: { CronExpressionParser: ComponentType }) => ({ default: CronExpressionParser })),
  'crontab-generator': () =>
    import('@/components/feature/time/CrontabGenerator').then(({ CrontabGenerator }: { CrontabGenerator: ComponentType }) => ({ default: CrontabGenerator })),
  'css-grid-playground': () =>
    import('@/components/feature/css/GridPlayground').then(({ GridPlayground }: { GridPlayground: ComponentType }) => ({ default: GridPlayground })),
  'image-color-picker': () =>
    import('@/components/feature/image/ImageColorPicker').then(({ ImageColorPicker }: { ImageColorPicker: ComponentType }) => ({ default: ImageColorPicker })),
  'text-sort-dedupe': () =>
    import('@/components/feature/text/TextSortDedupe').then(({ TextSortDedupe }: { TextSortDedupe: ComponentType }) => ({ default: TextSortDedupe })),
  'timezone-converter': () =>
    import('@/components/feature/time/TimezoneConverter').then(({ TimezoneConverter }: { TimezoneConverter: ComponentType }) => ({ default: TimezoneConverter })),
  'css-border-radius-generator': () =>
    import('@/components/feature/css/BorderRadiusGenerator').then(({ BorderRadiusGenerator }: { BorderRadiusGenerator: ComponentType }) => ({ default: BorderRadiusGenerator })),
  'url-parser': () =>
    import('@/components/feature/encoding/UrlParser').then(({ UrlParser }: { UrlParser: ComponentType }) => ({ default: UrlParser })),
  'markdown-table-generator': () =>
    import('@/components/feature/code/MarkdownTableGenerator').then(({ MarkdownTableGenerator }: { MarkdownTableGenerator: ComponentType }) => ({ default: MarkdownTableGenerator })),
  'mermaid-renderer': () =>
    import('@/components/feature/code/MermaidRenderer').then(({ MermaidRenderer }: { MermaidRenderer: ComponentType }) => ({ default: MermaidRenderer })),
  'http-status-codes': () =>
    import('@/components/feature/data/HttpStatusCodes').then(({ HttpStatusCodes }: { HttpStatusCodes: ComponentType }) => ({ default: HttpStatusCodes })),
  'og-preview': () =>
    import('@/components/feature/data/OgPreview').then(({ OgPreview }: { OgPreview: ComponentType }) => ({ default: OgPreview })),
  'user-agent-parser': () =>
    import('@/components/feature/text/UserAgentParser').then(({ UserAgentParser }: { UserAgentParser: ComponentType }) => ({ default: UserAgentParser })),
  'favicon-generator': () =>
    import('@/components/feature/image/FaviconGenerator').then(({ FaviconGenerator }: { FaviconGenerator: ComponentType }) => ({ default: FaviconGenerator })),
  'yaml-formatter': () =>
    import('@/components/feature/data/YamlFormatter').then(({ YamlFormatter }: { YamlFormatter: ComponentType }) => ({ default: YamlFormatter })),
  'data-uri-generator': () =>
    import('@/components/feature/data/DataUriGenerator').then(({ DataUriGenerator }: { DataUriGenerator: ComponentType }) => ({ default: DataUriGenerator })),
  'db-diagram': () =>
    import('@/components/feature/data/db-diagram').then(({ DbDiagram }: { DbDiagram: ComponentType }) => ({ default: DbDiagram })),
  'env-file-converter': () =>
    import('@/components/feature/data/EnvFileConverter').then(({ EnvFileConverter }: { EnvFileConverter: ComponentType }) => ({ default: EnvFileConverter })),
  'escaped-json-stringifier': () =>
    import('@/components/feature/data/EscapedJsonStringifier').then(({ EscapedJsonStringifier }: { EscapedJsonStringifier: ComponentType }) => ({ default: EscapedJsonStringifier })),
  'html-entity-converter': () =>
    import('@/components/feature/data/HtmlEntityConverter').then(({ HtmlEntityConverter }: { HtmlEntityConverter: ComponentType }) => ({ default: HtmlEntityConverter })),
  'placeholder-image-generator': () =>
    import('@/components/feature/image/PlaceholderImageGenerator').then(({ PlaceholderImageGenerator }: { PlaceholderImageGenerator: ComponentType }) => ({ default: PlaceholderImageGenerator })),
  'protobuf-codec': () =>
    import('@/components/feature/code/ProtobufCodec').then(({ ProtobufCodec }: { ProtobufCodec: ComponentType }) => ({ default: ProtobufCodec })),
  'protobuf-to-json': () =>
    import('@/components/feature/code/ProtobufToJson').then(({ ProtobufToJson }: { ProtobufToJson: ComponentType }) => ({ default: ProtobufToJson })),
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
