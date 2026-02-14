import { lazy } from 'react'

import type { ComponentType } from 'react'
import type { ToolRegistryEntry } from '@/types'

export const TOOL_REGISTRY: Array<ToolRegistryEntry> = [
  {
    category: 'Encoding',
    component: lazy(() =>
      import('@/components/feature/encoding/EncodingBase64').then(
        ({ EncodingBase64 }: { EncodingBase64: ComponentType }) => ({
          default: EncodingBase64,
        }),
      ),
    ),
    description: 'Encode and decode Base64 strings in the browser',
    emoji: '🔤',
    key: 'base64-encoder',
    name: 'Base64 Encoder',
    routePath: '/tools/base64-encoder',
    seo: {
      description:
        'Encode and decode Base64 strings online. Convert text to Base64 and back instantly in your browser.',
      title: 'Base64 Encoder - CSR Dev Tools',
    },
  },
  {
    category: 'CSS',
    component: lazy(() =>
      import('@/components/feature/css/BoxShadowGenerator').then(
        ({ BoxShadowGenerator }: { BoxShadowGenerator: ComponentType }) => ({
          default: BoxShadowGenerator,
        }),
      ),
    ),
    description: 'Visually create CSS box-shadow values with a live preview',
    emoji: '🔲',
    key: 'box-shadow-generator',
    name: 'Box Shadow Generator',
    routePath: '/tools/box-shadow-generator',
    seo: {
      description:
        'Generate CSS box-shadow values visually with a live preview. Adjust offset, blur, spread, color, and opacity — copy the CSS directly into your stylesheet.',
      title: 'Box Shadow Generator - CSR Dev Tools',
    },
  },
  {
    category: 'Color',
    component: lazy(() =>
      import('@/components/feature/color/ColorConvertor').then(
        ({ ColorConvertor }: { ColorConvertor: ComponentType }) => ({
          default: ColorConvertor,
        }),
      ),
    ),
    description: 'Convert colors between HEX, RGB, HSL, OKLCH, LAB, and LCH formats',
    emoji: '🎨',
    key: 'color-converter',
    name: 'Color Converter',
    routePath: '/tools/color-converter',
    seo: {
      description:
        'Convert colors between HEX, RGB, HSL, OKLCH, LAB, and LCH formats online. Free browser-based color converter.',
      title: 'Color Converter - CSR Dev Tools',
    },
  },
  {
    category: 'Generator',
    component: lazy(() =>
      import('@/components/feature/generator/HashGenerator').then(
        ({ HashGenerator }: { HashGenerator: ComponentType }) => ({
          default: HashGenerator,
        }),
      ),
    ),
    description: 'Compute hash values from text using MD5, SHA-1, SHA-256, and SHA-512',
    emoji: '#️⃣',
    key: 'hash-generator',
    name: 'Hash Generator',
    routePath: '/tools/hash-generator',
    seo: {
      description:
        'Generate MD5, SHA-1, SHA-256, and SHA-512 hash values from text online. Compute checksums instantly in your browser — no server processing.',
      title: 'Hash Generator - CSR Dev Tools',
    },
  },
  {
    category: 'Image',
    component: lazy(() =>
      import('@/components/feature/image/ImageConvertor').then(
        ({ ImageConvertor }: { ImageConvertor: ComponentType }) => ({
          default: ImageConvertor,
        }),
      ),
    ),
    description: 'Convert images between PNG, JPG, WebP, GIF, BMP, and AVIF formats',
    emoji: '🖼️',
    key: 'image-converter',
    name: 'Image Converter',
    routePath: '/tools/image-converter',
    seo: {
      description:
        'Convert images between PNG, JPG, WebP, GIF, BMP, and AVIF formats online. Free browser-based image converter.',
      title: 'Image Converter - CSR Dev Tools',
    },
  },
  {
    category: 'Image',
    component: lazy(() =>
      import('@/components/feature/image/ImageResizer').then(({ ImageResizer }: { ImageResizer: ComponentType }) => ({
        default: ImageResizer,
      })),
    ),
    description: 'Resize images to custom dimensions with aspect ratio control',
    emoji: '📐',
    key: 'image-resizer',
    name: 'Image Resizer',
    routePath: '/tools/image-resizer',
    seo: {
      description: 'Resize images to custom width and height dimensions online. Free browser-based image resizer.',
      title: 'Image Resizer - CSR Dev Tools',
    },
  },
  {
    category: 'Data',
    component: lazy(() =>
      import('@/components/feature/data/JsonFormatter').then(({ JsonFormatter }: { JsonFormatter: ComponentType }) => ({
        default: JsonFormatter,
      })),
    ),
    description: 'Format and validate JSON with clean indentation',
    emoji: '📋',
    key: 'json-formatter',
    name: 'JSON Formatter',
    routePath: '/tools/json-formatter',
    seo: {
      description:
        'Format, validate, and beautify JSON online. Paste minified JSON and get clean, indented output instantly in your browser.',
      title: 'JSON Formatter - CSR Dev Tools',
    },
  },
  {
    category: 'Data',
    component: lazy(() =>
      import('@/components/feature/data/JsonToCsvConverter').then(
        ({ JsonToCsvConverter }: { JsonToCsvConverter: ComponentType }) => ({
          default: JsonToCsvConverter,
        }),
      ),
    ),
    description: 'Convert between JSON arrays and CSV spreadsheet format',
    emoji: '📊',
    key: 'json-to-csv-converter',
    name: 'JSON ↔ CSV',
    routePath: '/tools/json-to-csv-converter',
    seo: {
      description:
        'Convert JSON to CSV and CSV to JSON online. Transform data between formats for spreadsheets and APIs instantly in your browser.',
      title: 'JSON to CSV Converter - CSR Dev Tools',
    },
  },
  {
    category: 'Data',
    component: lazy(() =>
      import('@/components/feature/data/JsonToYamlConverter').then(
        ({ JsonToYamlConverter }: { JsonToYamlConverter: ComponentType }) => ({
          default: JsonToYamlConverter,
        }),
      ),
    ),
    description: 'Convert between JSON and YAML configuration formats',
    emoji: '🔄',
    key: 'json-to-yaml-converter',
    name: 'JSON ↔ YAML',
    routePath: '/tools/json-to-yaml-converter',
    seo: {
      description:
        'Convert JSON to YAML and YAML to JSON online. Switch between configuration formats instantly in your browser.',
      title: 'JSON to YAML Converter - CSR Dev Tools',
    },
  },
  {
    category: 'Encoding',
    component: lazy(() =>
      import('@/components/feature/encoding/JwtDecoder').then(({ JwtDecoder }: { JwtDecoder: ComponentType }) => ({
        default: JwtDecoder,
      })),
    ),
    description: 'Decode JWT tokens to inspect header and payload',
    emoji: '🔐',
    key: 'jwt-decoder',
    name: 'JWT Decoder',
    routePath: '/tools/jwt-decoder',
    seo: {
      description:
        'Decode JWT tokens online. Inspect header, payload, and signature instantly in your browser without external services.',
      title: 'JWT Decoder - CSR Dev Tools',
    },
  },
  {
    category: 'Generator',
    component: lazy(() =>
      import('@/components/feature/generator/PasswordGenerator').then(
        ({ PasswordGenerator }: { PasswordGenerator: ComponentType }) => ({
          default: PasswordGenerator,
        }),
      ),
    ),
    description: 'Generate random passwords with configurable length and character types',
    emoji: '🔑',
    key: 'password-generator',
    name: 'Password Generator',
    routePath: '/tools/password-generator',
    seo: {
      description:
        'Generate secure random passwords online. Configure length, uppercase, lowercase, digits, and symbols. Cryptographically secure — runs entirely in your browser.',
      title: 'Password Generator - CSR Dev Tools',
    },
  },
  {
    category: 'Unit',
    component: lazy(() =>
      import('@/components/feature/unit/UnitPxToRem').then(({ UnitPxToRem }: { UnitPxToRem: ComponentType }) => ({
        default: UnitPxToRem,
      })),
    ),
    description: 'Convert between PX and REM units with configurable base font size',
    emoji: '📏',
    key: 'px-to-rem',
    name: 'PX to REM',
    routePath: '/tools/px-to-rem',
    seo: {
      description:
        'Convert between PX and REM CSS units online. Configurable base font size. Free browser-based unit converter.',
      title: 'PX to REM - CSR Dev Tools',
    },
  },
  {
    category: 'Text',
    component: lazy(() =>
      import('@/components/feature/text/RegexTester').then(({ RegexTester }: { RegexTester: ComponentType }) => ({
        default: RegexTester,
      })),
    ),
    description: 'Test regex patterns against sample text with live match highlighting',
    emoji: '🔍',
    key: 'regex-tester',
    name: 'Regex Tester',
    routePath: '/tools/regex-tester',
    seo: {
      description:
        'Test regular expressions against sample text with live match highlighting and capture group details. Iterate on regex patterns instantly in your browser.',
      title: 'Regex Tester - CSR Dev Tools',
    },
  },
  {
    category: 'Text',
    component: lazy(() =>
      import('@/components/feature/text/TextDiffChecker').then(
        ({ TextDiffChecker }: { TextDiffChecker: ComponentType }) => ({
          default: TextDiffChecker,
        }),
      ),
    ),
    description: 'Compare two text blocks and see line-by-line differences highlighted',
    emoji: '📝',
    key: 'text-diff-checker',
    name: 'Text Diff',
    routePath: '/tools/text-diff-checker',
    seo: {
      description:
        'Compare two text blocks and see line-by-line differences highlighted online. Spot changes between versions of code or text instantly in your browser.',
      title: 'Text Diff Checker - CSR Dev Tools',
    },
  },
  {
    category: 'Time',
    component: lazy(() =>
      import('@/components/feature/time/TimeUnixTimestamp').then(
        ({ TimeUnixTimestamp }: { TimeUnixTimestamp: ComponentType }) => ({
          default: TimeUnixTimestamp,
        }),
      ),
    ),
    description: 'Convert between Unix timestamps and human-readable dates',
    emoji: '🕐',
    key: 'unix-timestamp',
    name: 'Unix Timestamp',
    routePath: '/tools/unix-timestamp',
    seo: {
      description:
        'Convert between Unix timestamps and human-readable dates online. Free browser-based timestamp converter.',
      title: 'Unix Timestamp - CSR Dev Tools',
    },
  },
  {
    category: 'Encoding',
    component: lazy(() =>
      import('@/components/feature/encoding/UrlEncoder').then(({ UrlEncoder }: { UrlEncoder: ComponentType }) => ({
        default: UrlEncoder,
      })),
    ),
    description: 'Encode and decode URL strings in the browser',
    emoji: '🔗',
    key: 'url-encoder-decoder',
    name: 'URL Encoder/Decoder',
    routePath: '/tools/url-encoder-decoder',
    seo: {
      description:
        'Encode and decode URL strings online. Convert special characters to percent-encoded format instantly in your browser.',
      title: 'URL Encoder/Decoder - CSR Dev Tools',
    },
  },
  {
    category: 'Generator',
    component: lazy(() =>
      import('@/components/feature/generator/UuidGenerator').then(
        ({ UuidGenerator }: { UuidGenerator: ComponentType }) => ({
          default: UuidGenerator,
        }),
      ),
    ),
    description: 'Generate random UUID v4 identifiers, single or in bulk',
    emoji: '🆔',
    key: 'uuid-generator',
    name: 'UUID Generator',
    routePath: '/tools/uuid-generator',
    seo: {
      description:
        'Generate random UUID v4 identifiers online. Create single or bulk unique IDs instantly in your browser with one click.',
      title: 'UUID Generator - CSR Dev Tools',
    },
  },
]

export const TOOL_REGISTRY_MAP = TOOL_REGISTRY.reduce<Partial<Record<string, ToolRegistryEntry>>>((acc, entry) => {
  acc[entry.key] = entry
  return acc
}, {})
