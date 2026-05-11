// Imports use a relative path (not `@/types`) so this file stays importable
// from `vite.config.ts` (Node) where the `@/` alias isn't resolved.
import type { ToolCategory, ToolRegistryKey } from '../types/constants/tool-registry'

export type ToolRoute = {
  category: ToolCategory
  description: string
  emoji: string
  key: ToolRegistryKey
  name: string
  routePath: string
  seo: {
    description: string
    title: string
  }
}

export const TOOL_ROUTES: Array<ToolRoute> = [
  {
    category: 'Security',
    description: 'Encrypt and decrypt text using AES-256-GCM with a password. 100% client-side encryption.',
    emoji: '🔐',
    key: 'aes-encrypt-decrypt',
    name: 'AES Encrypt/Decrypt',
    routePath: '/tools/aes-encrypt-decrypt',
    seo: {
      description: 'Encrypt and decrypt text using AES-256-GCM with a password. 100% client-side encryption.',
      title: 'AES Encrypt/Decrypt - CSR Dev Tools',
    },
  },
  {
    category: 'Unit',
    description: 'Calculate dimensions while preserving aspect ratios. Convert between common ratios.',
    emoji: '📐',
    key: 'aspect-ratio-calculator',
    name: 'Aspect Ratio Calculator',
    routePath: '/tools/aspect-ratio-calculator',
    seo: {
      description: 'Calculate image and video dimensions based on aspect ratio. Free online aspect ratio calculator.',
      title: 'Aspect Ratio Calculator - CSR Dev Tools',
    },
  },
  {
    category: 'Image',
    description: 'Remove image backgrounds using AI — fully in your browser',
    emoji: '✂️',
    key: 'background-remover',
    name: 'Background Remover',
    routePath: '/tools/background-remover',
    seo: {
      description:
        'Remove image backgrounds instantly using AI running in your browser. No uploads, no API calls — fully private and free. Download as transparent PNG or choose a custom background color.',
      title: 'Background Remover - CSR Dev Tools',
    },
  },
  {
    category: 'Image',
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
    description: 'Encode and decode Base64 strings in the browser',
    emoji: '🔤',
    key: 'base64-codec',
    name: 'Base64 Codec',
    routePath: '/tools/base64-codec',
    seo: {
      description:
        'Encode and decode Base64 strings online. Convert text to Base64 and back instantly in your browser.',
      title: 'Base64 Codec - CSR Dev Tools',
    },
  },
  {
    category: 'CSS',
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
    description: 'Visually create CSS keyframe animations with live preview and configurable timing',
    emoji: '🎬',
    key: 'css-animation-builder',
    name: 'CSS Animation Builder',
    routePath: '/tools/css-animation-builder',
    seo: {
      description:
        'Build CSS @keyframes animations visually. Define keyframe steps, timing functions, and preview animations in real-time.',
      title: 'CSS Animation Builder - CSR Dev Tools',
    },
  },
  {
    category: 'CSS',
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
    category: 'Color',
    description: 'Generate harmonious color palettes from a base color using color theory.',
    emoji: '🎨',
    key: 'color-palette-generator',
    name: 'Color Palette Generator',
    routePath: '/tools/color-palette-generator',
    seo: {
      description:
        'Generate complementary, analogous, triadic, and monochromatic color palettes. Free online color palette generator.',
      title: 'Color Palette Generator - CSR Dev Tools',
    },
  },
  {
    category: 'Security',
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
    description:
      'Paste a GraphQL schema (SDL) and browse its types, fields, arguments, and relationships. Explore Object, Input, Enum, Interface, Union, and Scalar types with clickable cross-references.',
    emoji: '📊',
    key: 'graphql-schema-viewer',
    name: 'GraphQL Schema Viewer',
    routePath: '/tools/graphql-schema-viewer',
    seo: {
      description:
        'Explore GraphQL schemas online. Paste SDL to browse types, fields, arguments, and relationships. Filter and navigate type definitions. 100% client-side GraphQL schema browser.',
      title: 'GraphQL Schema Viewer - CSR Dev Tools',
    },
  },
  {
    category: 'Security',
    description:
      'Generate HMAC signatures using SHA-256, SHA-384, or SHA-512. Verify API signatures and webhook authentication.',
    emoji: '🔏',
    key: 'hmac-generator',
    name: 'HMAC Generator',
    routePath: '/tools/hmac-generator',
    seo: {
      description:
        'Generate HMAC signatures using SHA-256, SHA-384, or SHA-512. Verify API signatures and webhook authentication.',
      title: 'HMAC Generator - CSR Dev Tools',
    },
  },
  {
    category: 'Code',
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
    description:
      'Generate iOS splash screens, Android/PWA icons (standard + maskable), and configuration files from a single image.',
    emoji: '📱',
    key: 'splash-screen-generator',
    name: 'Splash Screen Generator',
    routePath: '/tools/splash-screen-generator',
    seo: {
      description:
        'Generate iOS splash screens, Android/PWA icons, and manifest files from a single image. All device sizes, maskable icons, meta tags, and ZIP download. 100% client-side.',
      title: 'Splash Screen Generator - CSR Dev Tools',
    },
  },
  {
    category: 'Image',
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
    category: 'Network',
    description:
      'Calculate IPv4 subnet details from CIDR notation or IP and subnet mask. Shows network address, broadcast, host range, and binary representation.',
    emoji: '🌐',
    key: 'ip-subnet-calculator',
    name: 'IP Subnet Calculator',
    routePath: '/tools/ip-subnet-calculator',
    seo: {
      description:
        'Calculate IPv4 subnet details online. Input CIDR notation or IP with subnet mask to see network address, broadcast, host range, wildcard mask, and binary representation. 100% client-side.',
      title: 'IP Subnet Calculator - CSR Dev Tools',
    },
  },
  {
    category: 'Code',
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
    description: 'Compare two JSON objects side-by-side with sorted keys and highlighted differences',
    emoji: '🔀',
    key: 'json-diff-checker',
    name: 'JSON Diff',
    routePath: '/tools/json-diff-checker',
    seo: {
      description:
        'Compare two JSON objects side-by-side with automatically sorted keys and highlighted differences. Detect value changes, missing keys, and type mismatches instantly in your browser.',
      title: 'JSON Diff Checker - CSR Dev Tools',
    },
  },
  {
    category: 'Data',
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
    category: 'Code',
    description: 'Validate JSON data against a JSON Schema (draft-07) and see detailed error paths',
    emoji: '✅',
    key: 'json-schema-validator',
    name: 'JSON Schema Validator',
    routePath: '/tools/json-schema-validator',
    seo: {
      description:
        'Validate JSON data against a JSON Schema (draft-07). See validation errors with JSON paths and keywords — all in the browser.',
      title: 'JSON Schema Validator - CSR Dev Tools',
    },
  },
  {
    category: 'Data',
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
    category: 'Code',
    description:
      'Evaluate JSONPath expressions against JSON data. See matched paths and values in real-time with a cheatsheet of common patterns.',
    emoji: '🎯',
    key: 'jsonpath-evaluator',
    name: 'JSONPath Evaluator',
    routePath: '/tools/jsonpath-evaluator',
    seo: {
      description:
        'Evaluate JSONPath expressions against JSON data online. Test queries like $.store.book[*].author with real-time results showing matched paths and values. 100% client-side JSONPath tester.',
      title: 'JSONPath Evaluator - CSR Dev Tools',
    },
  },
  {
    category: 'Encoding',
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
    category: 'Code',
    description: 'Live Markdown preview with HTML output. Write and preview Markdown in your browser',
    emoji: '📝',
    key: 'markdown-preview',
    name: 'Markdown Preview',
    routePath: '/tools/markdown-preview',
    seo: {
      description: 'Live Markdown preview with HTML output. Write and preview Markdown in your browser.',
      title: 'Markdown Preview - CSR Dev Tools',
    },
  },
  {
    category: 'Encoding',
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
    category: 'Security',
    description:
      'Hash passwords with bcrypt and verify plaintext against bcrypt hashes. Adjust cost factor, view hash breakdown, and track elapsed time.',
    emoji: '🔒',
    key: 'bcrypt-hasher',
    name: 'Bcrypt Hasher',
    routePath: '/tools/bcrypt-hasher',
    seo: {
      description:
        'Hash passwords with bcrypt online. Generate bcrypt hashes with configurable cost factor, verify passwords against hashes, view hash breakdown. Free client-side bcrypt tool.',
      title: 'Bcrypt Hasher - CSR Dev Tools',
    },
  },
  {
    category: 'Security',
    description: 'Paste a PEM-encoded X.509 certificate to view its subject, issuer, validity, extensions, and more.',
    emoji: '📜',
    key: 'certificate-decoder',
    name: 'Certificate Decoder',
    routePath: '/tools/certificate-decoder',
    seo: {
      description:
        'Decode PEM-encoded X.509 certificates online. View subject, issuer, validity dates, public key, signature algorithm, SAN, and extensions. Free client-side SSL/TLS certificate inspector.',
      title: 'Certificate Decoder - CSR Dev Tools',
    },
  },
  {
    category: 'Security',
    description:
      'Convert between symbolic (rwxr-xr-x), octal (755), and visual chmod notations. Toggle permissions with an interactive checkbox grid and common presets.',
    emoji: '\u{1F6E1}\uFE0F',
    key: 'chmod-calculator',
    name: 'Chmod Calculator',
    routePath: '/tools/chmod-calculator',
    seo: {
      description:
        'Calculate Unix file permissions online. Convert between octal (755), symbolic (rwxr-xr-x), and visual checkbox notation. Interactive chmod calculator with common presets. Free client-side tool.',
      title: 'Chmod Calculator - CSR Dev Tools',
    },
  },
  {
    category: 'Security',
    description:
      'Generate RSA key pairs entirely in your browser using Web Crypto API. Download public and private keys in PEM format. Keys never leave your browser.',
    emoji: '🔐',
    key: 'rsa-key-generator',
    name: 'RSA Key Generator',
    routePath: '/tools/rsa-key-generator',
    seo: {
      description:
        'Generate RSA 2048 or 4096-bit key pairs online. Download public and private keys in PEM format. 100% client-side — keys never leave your browser. Free RSA key generator.',
      title: 'RSA Key Generator - CSR Dev Tools',
    },
  },
  {
    category: 'Security',
    description: 'Paste an SSH public key to view its SHA256 and MD5 fingerprints, key type, and bit size.',
    emoji: '🔑',
    key: 'ssh-key-fingerprint',
    name: 'SSH Key Fingerprint',
    routePath: '/tools/ssh-key-fingerprint',
    seo: {
      description:
        'View SSH public key fingerprints in SHA256 and MD5 formats. Supports ssh-rsa, ssh-ed25519, and ECDSA keys. Extract key type, bit size, and comment. Free online SSH key tool.',
      title: 'SSH Key Fingerprint - CSR Dev Tools',
    },
  },
  {
    category: 'Text',
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
    category: 'Code',
    description: 'Format SQL queries with proper indentation. Supports PostgreSQL, MySQL, SQLite, and more',
    emoji: '🗄️',
    key: 'sql-formatter',
    name: 'SQL Formatter',
    routePath: '/tools/sql-formatter',
    seo: {
      description: 'Format SQL queries with proper indentation. Supports PostgreSQL, MySQL, SQLite, and more.',
      title: 'SQL Formatter - CSR Dev Tools',
    },
  },
  {
    category: 'Text',
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
    description: 'Convert between JSON and TOML formats. Perfect for Rust and Go config files.',
    emoji: '⚙️',
    key: 'json-to-toml-converter',
    name: 'JSON ↔ TOML',
    routePath: '/tools/json-to-toml-converter',
    seo: {
      description: 'Convert between JSON and TOML formats. Perfect for Rust and Go config files.',
      title: 'JSON to TOML Converter - CSR Dev Tools',
    },
  },
  {
    category: 'Code',
    description:
      'Write TypeScript with real-time type checking, error squiggles, and hover info. See transpiled JavaScript output instantly. Powered by Monaco Editor.',
    emoji: '🏗️',
    key: 'typescript-playground',
    name: 'TypeScript Playground',
    routePath: '/tools/typescript-playground',
    seo: {
      description:
        'TypeScript playground with real-time type checking and JavaScript transpilation. Write TypeScript code with IntelliSense, error highlighting, and instant JS output. 100% client-side.',
      title: 'TypeScript Playground - CSR Dev Tools',
    },
  },
  {
    category: 'Time',
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
    description: 'Convert between JSON and XML formats. Free online JSON to XML and XML to JSON converter.',
    emoji: '📋',
    key: 'json-to-xml-converter',
    name: 'JSON ↔ XML',
    routePath: '/tools/json-to-xml-converter',
    seo: {
      description: 'Convert between JSON and XML formats. Free online JSON to XML and XML to JSON converter.',
      title: 'JSON to XML Converter - CSR Dev Tools',
    },
  },
  {
    category: 'Code',
    description: 'Generate TypeScript interfaces or types from JSON. Paste JSON, get type-safe code.',
    emoji: '🏗️',
    key: 'json-to-typescript',
    name: 'JSON to TypeScript',
    routePath: '/tools/json-to-typescript',
    seo: {
      description:
        'Generate TypeScript interfaces or types from JSON. Paste JSON, get type-safe code instantly in your browser.',
      title: 'JSON to TypeScript - CSR Dev Tools',
    },
  },
  {
    category: 'Time',
    description: 'Parse cron expressions into human-readable text and see the next scheduled run times.',
    emoji: '⏰',
    key: 'cron-expression-parser',
    name: 'Cron Parser',
    routePath: '/tools/cron-expression-parser',
    seo: {
      description: 'Parse cron expressions into human-readable descriptions and preview the next scheduled run times.',
      title: 'Cron Expression Parser - CSR Dev Tools',
    },
  },
  {
    category: 'Time',
    description:
      'Visually build cron expressions with field selectors, human-readable descriptions, and next run times',
    emoji: '🕰️',
    key: 'crontab-generator',
    name: 'Crontab Generator',
    routePath: '/tools/crontab-generator',
    seo: {
      description:
        'Build cron expressions visually by selecting minute, hour, day, month, and weekday values. See human-readable descriptions and next run times.',
      title: 'Crontab Generator - CSR Dev Tools',
    },
  },
  {
    category: 'CSS',
    description: 'Visual CSS Grid layout builder. Define rows, columns, gaps, and placement — copy the CSS.',
    emoji: '🔲',
    key: 'css-grid-playground',
    name: 'Grid Playground',
    routePath: '/tools/css-grid-playground',
    seo: {
      description: 'Visual CSS Grid layout builder. Experiment with grid properties and copy the CSS.',
      title: 'CSS Grid Playground - CSR Dev Tools',
    },
  },
  {
    category: 'Image',
    description: 'Upload an image and click to extract colors. Get HEX, RGB, and HSL values.',
    emoji: '🎯',
    key: 'image-color-picker',
    name: 'Image Color Picker',
    routePath: '/tools/image-color-picker',
    seo: {
      description: 'Upload an image and click anywhere to extract colors. Get HEX, RGB, and HSL values instantly.',
      title: 'Image Color Picker - CSR Dev Tools',
    },
  },
  {
    category: 'Text',
    description: 'Sort lines alphabetically, numerically, or by length. Remove duplicates and empty lines.',
    emoji: '🔀',
    key: 'text-sort-dedupe',
    name: 'Text Sort & Dedupe',
    routePath: '/tools/text-sort-dedupe',
    seo: {
      description:
        'Sort lines alphabetically, numerically, or by length. Remove duplicates, empty lines, and trim whitespace.',
      title: 'Text Sort & Dedupe - CSR Dev Tools',
    },
  },
  {
    category: 'Time',
    description:
      'Convert date and time between timezones with searchable timezone selection, multiple simultaneous targets, and favorites. Handles DST automatically.',
    emoji: '🌍',
    key: 'timezone-converter',
    name: 'Timezone Converter',
    routePath: '/tools/timezone-converter',
    seo: {
      description:
        'Convert date and time between IANA timezones online. Search by city, abbreviation (PST, EST), or region. Multiple timezone comparison, DST-aware, 100% client-side.',
      title: 'Timezone Converter - CSR Dev Tools',
    },
  },
  {
    category: 'CSS',
    description:
      'Visually configure CSS border-radius with per-corner control. Supports symmetric and asymmetric modes.',
    emoji: '⬜',
    key: 'css-border-radius-generator',
    name: 'Border Radius Generator',
    routePath: '/tools/css-border-radius-generator',
    seo: {
      description: 'Visual CSS border-radius editor with per-corner control, asymmetric mode, and live preview.',
      title: 'CSS Border Radius Generator - CSR Dev Tools',
    },
  },
  {
    category: 'Encoding',
    description: 'Parse a URL into its components: protocol, host, port, path, query parameters, and fragment.',
    emoji: '🔗',
    key: 'url-parser',
    name: 'URL Parser',
    routePath: '/tools/url-parser',
    seo: {
      description: 'Break down URLs into protocol, hostname, port, path, query parameters, and hash fragment.',
      title: 'URL Parser - CSR Dev Tools',
    },
  },
  {
    category: 'Code',
    description: 'Build Markdown tables visually with editable cells, configurable alignment, and instant output.',
    emoji: '📊',
    key: 'markdown-table-generator',
    name: 'Markdown Table Generator',
    routePath: '/tools/markdown-table-generator',
    seo: {
      description: 'Visual Markdown table builder with editable cells, column alignment, and copy-to-clipboard.',
      title: 'Markdown Table Generator - CSR Dev Tools',
    },
  },
  {
    category: 'Code',
    description:
      'Write Mermaid diagram syntax and see a live SVG preview. Supports flowchart, sequence, class, state, gantt, pie, and more. Export as SVG or PNG.',
    emoji: '🧜',
    key: 'mermaid-renderer',
    name: 'Mermaid Renderer',
    routePath: '/tools/mermaid-renderer',
    seo: {
      description:
        'Render Mermaid diagrams to SVG online. Live preview for flowcharts, sequence diagrams, class diagrams, state diagrams, gantt charts, and more. Export SVG or PNG, 100% client-side.',
      title: 'Mermaid Renderer - CSR Dev Tools',
    },
  },
  {
    category: 'Data',
    description: 'Search and browse HTTP status codes with descriptions and common use cases.',
    emoji: '📡',
    key: 'http-status-codes',
    name: 'HTTP Status Codes',
    routePath: '/tools/http-status-codes',
    seo: {
      description: 'Searchable HTTP status code reference with descriptions, categories, and common use cases.',
      title: 'HTTP Status Codes Reference - CSR Dev Tools',
    },
  },
  {
    category: 'Data',
    description: 'Preview Open Graph social cards for Twitter, Facebook, and LinkedIn. Generate meta tags.',
    emoji: '🔖',
    key: 'og-preview',
    name: 'OG Preview',
    routePath: '/tools/og-preview',
    seo: {
      description:
        'Preview how your links will appear on Twitter, Facebook, and LinkedIn. Enter OG meta values and generate ready-to-use meta tags.',
      title: 'OG Preview - CSR Dev Tools',
    },
  },
  {
    category: 'Text',
    description: 'Parse user agent strings into browser, OS, device type, and engine details.',
    emoji: '🕵️',
    key: 'user-agent-parser',
    name: 'User Agent Parser',
    routePath: '/tools/user-agent-parser',
    seo: {
      description: 'Parse user agent strings to identify browser, operating system, device type, and rendering engine.',
      title: 'User Agent Parser - CSR Dev Tools',
    },
  },
  {
    category: 'Image',
    description: 'Upload an image and generate favicons in all standard sizes. Download as ZIP with HTML link tags.',
    emoji: '🖼️',
    key: 'favicon-generator',
    name: 'Favicon Generator',
    routePath: '/tools/favicon-generator',
    seo: {
      description:
        'Generate favicons in 16x16, 32x32, 48x48, 180x180, 192x192, and 512x512 sizes from any image. Download all as ZIP.',
      title: 'Favicon Generator - CSR Dev Tools',
    },
  },
  {
    category: 'Data',
    description: 'Format and validate YAML with configurable indentation and key sorting',
    emoji: '📋',
    key: 'yaml-formatter',
    name: 'YAML Formatter',
    routePath: '/tools/yaml-formatter',
    seo: {
      description:
        'Format and validate YAML online. Configurable indentation, key sorting, and syntax error detection.',
      title: 'YAML Formatter - CSR Dev Tools',
    },
  },
  {
    category: 'Data',
    description: 'Convert files to data URIs and decode data URIs back to files.',
    emoji: '🔗',
    key: 'data-uri-generator',
    name: 'Data URI Generator',
    routePath: '/tools/data-uri-generator',
    seo: {
      description:
        'Convert any file to a data URI for embedding in HTML/CSS. Decode data URIs back to files. Supports images, fonts, SVGs, and more. Free online data URI tool.',
      title: 'Data URI Generator - CSR Dev Tools',
    },
  },
  {
    category: 'Data',
    description: 'Design entity-relationship diagrams with an interactive visual canvas',
    emoji: '🗄️',
    key: 'db-diagram',
    name: 'DB Diagram',
    routePath: '/tools/db-diagram',
    seo: {
      description:
        'Design and visualize database entity-relationship diagrams with an interactive canvas. Add tables, define columns, draw relationships — all in the browser.',
      title: 'DB Diagram - CSR Dev Tools',
    },
  },
  {
    category: 'Data',
    description: 'Convert between .env, JSON, and YAML configuration formats',
    emoji: '🔄',
    key: 'env-file-converter',
    name: 'ENV File Converter',
    routePath: '/tools/env-file-converter',
    seo: {
      description: 'Convert between .env, JSON, and YAML formats. Free online environment file converter.',
      title: 'ENV File Converter - CSR Dev Tools',
    },
  },
  {
    category: 'Data',
    description: 'Escape JSON for embedding in strings and unescape back to formatted JSON',
    emoji: '🔤',
    key: 'escaped-json-stringifier',
    name: 'Escaped JSON Stringifier',
    routePath: '/tools/escaped-json-stringifier',
    seo: {
      description: 'Escape and unescape JSON strings online. Stringify JSON for embedding in code or config files.',
      title: 'Escaped JSON Stringifier - CSR Dev Tools',
    },
  },
  {
    category: 'Data',
    description: 'Encode text to HTML entities and decode HTML entities back to text',
    emoji: '🏷️',
    key: 'html-entity-converter',
    name: 'HTML Entity Converter',
    routePath: '/tools/html-entity-converter',
    seo: {
      description:
        'Encode and decode HTML entities online. Convert special characters to named or numeric HTML entities.',
      title: 'HTML Entity Converter - CSR Dev Tools',
    },
  },
  {
    category: 'Image',
    description: 'Generate placeholder images with custom dimensions, colors, and text.',
    emoji: '🖼️',
    key: 'placeholder-image-generator',
    name: 'Placeholder Image Generator',
    routePath: '/tools/placeholder-image-generator',
    seo: {
      description:
        'Generate customizable placeholder images with dimensions, colors, and text. Download as PNG or SVG. Free online placeholder image generator.',
      title: 'Placeholder Image Generator - CSR Dev Tools',
    },
  },
  {
    category: 'Code',
    description:
      'Encode JSON to protobuf binary (base64/hex/raw) and decode protobuf binary back to JSON using a .proto schema. Full round-trip codec for development and testing.',
    emoji: '🔄',
    key: 'protobuf-codec',
    name: 'Protobuf Codec',
    routePath: '/tools/protobuf-codec',
    seo: {
      description:
        'Encode and decode Protocol Buffer messages online. Convert JSON to protobuf binary (base64, hex, text) and back using .proto schemas. 100% client-side protobuf codec.',
      title: 'Protobuf Codec - CSR Dev Tools',
    },
  },
  {
    category: 'Code',
    description:
      'Paste .proto definitions and see corresponding JSON structures with default values. Browse message types, nested messages, enums, and repeated fields.',
    emoji: '📦',
    key: 'protobuf-to-json',
    name: 'Protobuf to JSON',
    routePath: '/tools/protobuf-to-json',
    seo: {
      description:
        'Convert Protocol Buffer definitions to JSON online. Paste .proto files to browse message types and generate sample JSON structures. 100% client-side Protobuf to JSON converter.',
      title: 'Protobuf to JSON - CSR Dev Tools',
    },
  },
]
