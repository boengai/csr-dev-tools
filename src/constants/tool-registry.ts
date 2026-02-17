import type { ComponentType } from 'react'

import { lazy } from 'react'

import type { ToolCategory, ToolRegistryEntry } from '@/types'

export const TOOL_REGISTRY: Array<ToolRegistryEntry> = [
  {
    category: 'Image',
    component: lazy(() =>
      import('@/components/feature/image/Base64ToImage').then(
        ({ Base64ToImage }: { Base64ToImage: ComponentType }) => ({
          default: Base64ToImage,
        }),
      ),
    ),
    description: 'Convert Base64 strings to downloadable images',
    emoji: '🖼️',
    key: 'base64-to-image',
    name: 'Base64 to Image',
    routePath: '/tools/base64-to-image',
    seo: {
      description:
        'Convert Base64 strings to downloadable images. Preview and extract images from Base64-encoded data.',
      title: 'Base64 to Image - CSR Dev Tools',
    },
  },
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
    category: 'CSS',
    component: lazy(() =>
      import('@/components/feature/css/FlexboxPlayground').then(
        ({ FlexboxPlayground }: { FlexboxPlayground: ComponentType }) => ({
          default: FlexboxPlayground,
        }),
      ),
    ),
    description: 'Visual CSS flexbox layout builder. Experiment with flex properties and copy the CSS.',
    emoji: '📐',
    key: 'css-flexbox-playground',
    name: 'Flexbox Playground',
    routePath: '/tools/css-flexbox-playground',
    seo: {
      description: 'Visual CSS flexbox layout builder. Experiment with flex properties and copy the CSS.',
      title: 'CSS Flexbox Playground - CSR Dev Tools',
    },
  },
  {
    category: 'Code',
    component: lazy(() =>
      import('@/components/feature/code/CssFormatter').then(({ CssFormatter }: { CssFormatter: ComponentType }) => ({
        default: CssFormatter,
      })),
    ),
    description: 'Beautify or minify CSS stylesheets',
    emoji: '🎨',
    key: 'css-formatter',
    name: 'CSS Formatter',
    routePath: '/tools/css-formatter',
    seo: {
      description: 'Beautify or minify CSS stylesheets. Free online CSS formatter.',
      title: 'CSS Formatter - CSR Dev Tools',
    },
  },
  {
    category: 'CSS',
    component: lazy(() =>
      import('@/components/feature/css/GradientGenerator').then(
        ({ GradientGenerator }: { GradientGenerator: ComponentType }) => ({
          default: GradientGenerator,
        }),
      ),
    ),
    description:
      'Create CSS gradients visually with a live preview. Linear and radial gradients with multiple color stops.',
    emoji: '🌈',
    key: 'css-gradient-generator',
    name: 'Gradient Generator',
    routePath: '/tools/css-gradient-generator',
    seo: {
      description:
        'Create CSS gradients visually with a live preview. Linear and radial gradients with multiple color stops.',
      title: 'CSS Gradient Generator - CSR Dev Tools',
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
    category: 'Code',
    component: lazy(() =>
      import('@/components/feature/code/HtmlFormatter').then(({ HtmlFormatter }: { HtmlFormatter: ComponentType }) => ({
        default: HtmlFormatter,
      })),
    ),
    description: 'Format and beautify HTML with proper indentation, or minify for production',
    emoji: '📄',
    key: 'html-formatter',
    name: 'HTML Formatter',
    routePath: '/tools/html-formatter',
    seo: {
      description: 'Format and beautify HTML with proper indentation, or minify for production.',
      title: 'HTML Formatter - CSR Dev Tools',
    },
  },
  {
    category: 'Data',
    component: lazy(() =>
      import('@/components/feature/data/HtmlToMarkdownConverter').then(
        ({ HtmlToMarkdownConverter }: { HtmlToMarkdownConverter: ComponentType }) => ({
          default: HtmlToMarkdownConverter,
        }),
      ),
    ),
    description: 'Convert between HTML and Markdown. Transform web content to Markdown and back.',
    emoji: '🔄',
    key: 'html-to-markdown-converter',
    name: 'HTML ↔ Markdown',
    routePath: '/tools/html-to-markdown-converter',
    seo: {
      description: 'Convert between HTML and Markdown. Transform web content to Markdown and back.',
      title: 'HTML to Markdown Converter - CSR Dev Tools',
    },
  },
  {
    category: 'Image',
    component: lazy(() =>
      import('@/components/feature/image/SvgViewer').then(({ SvgViewer }: { SvgViewer: ComponentType }) => ({
        default: SvgViewer,
      })),
    ),
    description: 'View and optimize SVG code with a live preview. Remove metadata and reduce file size.',
    emoji: '🖼️',
    key: 'svg-viewer',
    name: 'SVG Viewer',
    routePath: '/tools/svg-viewer',
    seo: {
      description: 'View and optimize SVG code with a live preview. Remove metadata and reduce file size.',
      title: 'SVG Viewer - CSR Dev Tools',
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
      import('@/components/feature/image/ImageCompressor').then(
        ({ ImageCompressor }: { ImageCompressor: ComponentType }) => ({
          default: ImageCompressor,
        }),
      ),
    ),
    description: 'Compress JPEG and WebP images with a quality slider and live size preview',
    emoji: '🗜️',
    key: 'image-compressor',
    name: 'Image Compressor',
    routePath: '/tools/image-compressor',
    seo: {
      description:
        'Compress JPEG and WebP images online. Adjust quality with a slider and see file size savings instantly in your browser.',
      title: 'Image Compressor - CSR Dev Tools',
    },
  },
  {
    category: 'Image',
    component: lazy(() =>
      import('@/components/feature/image/ImageCropper').then(({ ImageCropper }: { ImageCropper: ComponentType }) => ({
        default: ImageCropper,
      })),
    ),
    description: 'Crop images using freeform selection or common aspect ratio presets',
    emoji: '✂️',
    key: 'image-cropper',
    name: 'Image Cropper',
    routePath: '/tools/image-cropper',
    seo: {
      description:
        'Crop images online using freeform selection or aspect ratio presets like 16:9, 4:3, 1:1, and 3:2. Free browser-based image cropper.',
      title: 'Image Cropper - CSR Dev Tools',
    },
  },
  {
    category: 'Image',
    component: lazy(() =>
      import('@/components/feature/image/ImageToBase64').then(
        ({ ImageToBase64 }: { ImageToBase64: ComponentType }) => ({
          default: ImageToBase64,
        }),
      ),
    ),
    description: 'Convert images to Base64 data URIs for embedding in HTML or CSS',
    emoji: '🖼️',
    key: 'image-to-base64',
    name: 'Image to Base64',
    routePath: '/tools/image-to-base64',
    seo: {
      description: 'Convert images to Base64 data URIs. Embed images directly in HTML or CSS.',
      title: 'Image to Base64 - CSR Dev Tools',
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
    category: 'Code',
    component: lazy(() =>
      import('@/components/feature/code/JavaScriptMinifier').then(
        ({ JavaScriptMinifier }: { JavaScriptMinifier: ComponentType }) => ({
          default: JavaScriptMinifier,
        }),
      ),
    ),
    description: 'Minify or beautify JavaScript code. See size comparison and copy the result',
    emoji: '⚡',
    key: 'javascript-minifier',
    name: 'JavaScript Minifier',
    routePath: '/tools/javascript-minifier',
    seo: {
      description: 'Minify or beautify JavaScript code. See size comparison and copy the result.',
      title: 'JavaScript Minifier - CSR Dev Tools',
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
    category: 'Text',
    component: lazy(() =>
      import('@/components/feature/text/LoremIpsumGenerator').then(
        ({ LoremIpsumGenerator }: { LoremIpsumGenerator: ComponentType }) => ({
          default: LoremIpsumGenerator,
        }),
      ),
    ),
    description: 'Generate lorem ipsum placeholder text. Configure paragraphs, sentences, or words',
    emoji: '📜',
    key: 'lorem-ipsum-generator',
    name: 'Lorem Ipsum Generator',
    routePath: '/tools/lorem-ipsum-generator',
    seo: {
      description: 'Generate lorem ipsum placeholder text. Configure paragraphs, sentences, or words.',
      title: 'Lorem Ipsum Generator - CSR Dev Tools',
    },
  },
  {
    category: "Code",
    component: lazy(() =>
      import("@/components/feature/code/MarkdownPreview").then(
        ({ MarkdownPreview }: { MarkdownPreview: ComponentType }) => ({
          default: MarkdownPreview,
        }),
      ),
    ),
    description:
      "Live Markdown preview with HTML output. Write and preview Markdown in your browser",
    emoji: "📝",
    key: "markdown-preview",
    name: "Markdown Preview",
    routePath: "/tools/markdown-preview",
    seo: {
      description:
        "Live Markdown preview with HTML output. Write and preview Markdown in your browser.",
      title: "Markdown Preview - CSR Dev Tools",
    },
  },
  {
    category: 'Encoding',
    component: lazy(() =>
      import('@/components/feature/encoding/NumberBaseConverter').then(
        ({ NumberBaseConverter }: { NumberBaseConverter: ComponentType }) => ({
          default: NumberBaseConverter,
        }),
      ),
    ),
    description: 'Convert numbers between binary, octal, decimal, and hexadecimal',
    emoji: '🔢',
    key: 'number-base-converter',
    name: 'Number Base Converter',
    routePath: '/tools/number-base-converter',
    seo: {
      description: 'Convert numbers between binary, octal, decimal, and hexadecimal. Free online base converter.',
      title: 'Number Base Converter - CSR Dev Tools',
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
    category: 'Generator',
    component: lazy(() =>
      import('@/components/feature/generator/QrCodeGenerator').then(
        ({ QrCodeGenerator }: { QrCodeGenerator: ComponentType }) => ({
          default: QrCodeGenerator,
        }),
      ),
    ),
    description: 'Generate QR codes from text or URLs with customizable size, colors, and error correction',
    emoji: '📱',
    key: 'qr-code-generator',
    name: 'QR Code Generator',
    routePath: '/tools/qr-code-generator',
    seo: {
      description:
        'Generate QR codes from text or URLs. Customize size, colors, and error correction. Free browser-based QR code generator.',
      title: 'QR Code Generator - CSR Dev Tools',
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
      import('@/components/feature/text/StringEscapeUnescape').then(
        ({ StringEscapeUnescape }: { StringEscapeUnescape: ComponentType }) => ({
          default: StringEscapeUnescape,
        }),
      ),
    ),
    description: 'Escape and unescape strings for HTML, JavaScript, JSON, URL, and XML',
    emoji: '🔡',
    key: 'string-escape-unescape',
    name: 'String Escape/Unescape',
    routePath: '/tools/string-escape-unescape',
    seo: {
      description: 'Escape and unescape strings for HTML, JavaScript, JSON, URL, and XML.',
      title: 'String Escape/Unescape - CSR Dev Tools',
    },
  },
  {
    category: "Code",
    component: lazy(() =>
      import("@/components/feature/code/SqlFormatter").then(
        ({ SqlFormatter }: { SqlFormatter: ComponentType }) => ({
          default: SqlFormatter,
        }),
      ),
    ),
    description:
      "Format SQL queries with proper indentation. Supports PostgreSQL, MySQL, SQLite, and more",
    emoji: "🗄️",
    key: "sql-formatter",
    name: "SQL Formatter",
    routePath: "/tools/sql-formatter",
    seo: {
      description:
        "Format SQL queries with proper indentation. Supports PostgreSQL, MySQL, SQLite, and more.",
      title: "SQL Formatter - CSR Dev Tools",
    },
  },
  {
    category: 'Text',
    component: lazy(() =>
      import('@/components/feature/text/TextCaseConverter').then(
        ({ TextCaseConverter }: { TextCaseConverter: ComponentType }) => ({
          default: TextCaseConverter,
        }),
      ),
    ),
    description: 'Convert text between camelCase, PascalCase, snake_case, kebab-case, and more',
    emoji: '🔤',
    key: 'text-case-converter',
    name: 'Text Case Converter',
    routePath: '/tools/text-case-converter',
    seo: {
      description:
        'Convert text between camelCase, PascalCase, snake_case, kebab-case, and more. Free browser-based tool.',
      title: 'Text Case Converter - CSR Dev Tools',
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
    category: 'Data',
    component: lazy(() =>
      import('@/components/feature/data/TomlToJsonConverter').then(
        ({ TomlToJsonConverter }: { TomlToJsonConverter: ComponentType }) => ({
          default: TomlToJsonConverter,
        }),
      ),
    ),
    description: 'Convert between TOML and JSON formats. Perfect for Rust and Go config files.',
    emoji: '⚙️',
    key: 'toml-to-json-converter',
    name: 'TOML ↔ JSON',
    routePath: '/tools/toml-to-json-converter',
    seo: {
      description: 'Convert between TOML and JSON formats. Perfect for Rust and Go config files.',
      title: 'TOML to JSON Converter - CSR Dev Tools',
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
  {
    category: 'Text',
    component: lazy(() =>
      import('@/components/feature/text/WordCounter').then(({ WordCounter }: { WordCounter: ComponentType }) => ({
        default: WordCounter,
      })),
    ),
    description: 'Count words, characters, sentences, paragraphs, and reading time',
    emoji: '📊',
    key: 'word-counter',
    name: 'Word Counter',
    routePath: '/tools/word-counter',
    seo: {
      description: 'Count words, characters, sentences, paragraphs, and reading time. Free online word counter.',
      title: 'Word Counter - CSR Dev Tools',
    },
  },
  {
    category: 'Data',
    component: lazy(() =>
      import('@/components/feature/data/XmlToJsonConverter').then(
        ({ XmlToJsonConverter }: { XmlToJsonConverter: ComponentType }) => ({
          default: XmlToJsonConverter,
        }),
      ),
    ),
    description: 'Convert between XML and JSON formats. Free online XML to JSON and JSON to XML converter.',
    emoji: '📋',
    key: 'xml-to-json-converter',
    name: 'XML ↔ JSON',
    routePath: '/tools/xml-to-json-converter',
    seo: {
      description: 'Convert between XML and JSON formats. Free online XML to JSON and JSON to XML converter.',
      title: 'XML to JSON Converter - CSR Dev Tools',
    },
  },
]

export const CATEGORY_ORDER: Array<ToolCategory> = [
  'Color',
  'CSS',
  'Data',
  'Encoding',
  'Generator',
  'Image',
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
