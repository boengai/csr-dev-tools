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
]

export const TOOL_REGISTRY_MAP = TOOL_REGISTRY.reduce<Partial<Record<string, ToolRegistryEntry>>>((acc, entry) => {
  acc[entry.key] = entry
  return acc
}, {})
