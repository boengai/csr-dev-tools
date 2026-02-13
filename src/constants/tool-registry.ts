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
]

export const TOOL_REGISTRY_MAP = TOOL_REGISTRY.reduce<Partial<Record<string, ToolRegistryEntry>>>((acc, entry) => {
  acc[entry.key] = entry
  return acc
}, {})
