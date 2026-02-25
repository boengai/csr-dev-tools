import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'

import { prerender } from './vite-plugins/prerender'

// SYNC: This data MUST match TOOL_REGISTRY seo fields in src/constants/tool-registry.ts.
// When adding or updating tools, update BOTH locations.
const toolRoutes = [
  {
    description:
      'Calculate image and video dimensions based on aspect ratio. Free online aspect ratio calculator.',
    path: '/tools/aspect-ratio-calculator',
    title: 'Aspect Ratio Calculator - CSR Dev Tools',
    url: '/tools/aspect-ratio-calculator',
  },
  {
    description:
      'Remove image backgrounds instantly using AI running in your browser. No uploads, no API calls — fully private and free.',
    path: '/tools/background-remover',
    title: 'Background Remover - CSR Dev Tools',
    url: '/tools/background-remover',
  },
  {
    description:
      'Convert Base64 strings to downloadable images. Preview and extract images from Base64-encoded data.',
    path: '/tools/base64-to-image',
    title: 'Base64 to Image - CSR Dev Tools',
    url: '/tools/base64-to-image',
  },
  {
    description:
      'Encode and decode Base64 strings online. Convert text to Base64 and back instantly in your browser.',
    path: '/tools/base64-encoder',
    title: 'Base64 Encoder - CSR Dev Tools',
    url: '/tools/base64-encoder',
  },
  {
    description:
      'Hash passwords with bcrypt online. Generate bcrypt hashes with configurable cost factor, verify passwords against hashes, view hash breakdown. Free client-side bcrypt tool.',
    path: '/tools/bcrypt-hasher',
    title: 'Bcrypt Hasher - CSR Dev Tools',
    url: '/tools/bcrypt-hasher',
  },
  {
    description:
      'Generate CSS box-shadow values visually with a live preview. Adjust offset, blur, spread, color, and opacity — copy the CSS directly into your stylesheet.',
    path: '/tools/box-shadow-generator',
    title: 'Box Shadow Generator - CSR Dev Tools',
    url: '/tools/box-shadow-generator',
  },
  {
    description:
      'Decode PEM-encoded X.509 certificates online. View subject, issuer, validity dates, public key, signature algorithm, SAN, and extensions. Free client-side SSL/TLS certificate inspector.',
    path: '/tools/certificate-decoder',
    title: 'Certificate Decoder - CSR Dev Tools',
    url: '/tools/certificate-decoder',
  },
  {
    description:
      'Calculate Unix file permissions online. Convert between octal (755), symbolic (rwxr-xr-x), and visual checkbox notation. Interactive chmod calculator with common presets. Free client-side tool.',
    path: '/tools/chmod-calculator',
    title: 'Chmod Calculator - CSR Dev Tools',
    url: '/tools/chmod-calculator',
  },
  {
    description:
      'Convert colors between HEX, RGB, HSL, OKLCH, LAB, and LCH formats online. Free browser-based color converter.',
    path: '/tools/color-converter',
    title: 'Color Converter - CSR Dev Tools',
    url: '/tools/color-converter',
  },
  {
    description:
      'Generate complementary, analogous, triadic, and monochromatic color palettes. Free online color palette generator.',
    path: '/tools/color-palette-generator',
    title: 'Color Palette Generator - CSR Dev Tools',
    url: '/tools/color-palette-generator',
  },
  {
    description:
      'Explore GraphQL schemas online. Paste SDL to browse types, fields, arguments, and relationships. Filter and navigate type definitions. 100% client-side GraphQL schema browser.',
    path: '/tools/graphql-schema-viewer',
    title: 'GraphQL Schema Viewer - CSR Dev Tools',
    url: '/tools/graphql-schema-viewer',
  },
  {
    description:
      'Generate MD5, SHA-1, SHA-256, and SHA-512 hash values from text online. Compute checksums instantly in your browser — no server processing.',
    path: '/tools/hash-generator',
    title: 'Hash Generator - CSR Dev Tools',
    url: '/tools/hash-generator',
  },
  {
    description:
      'Convert images between PNG, JPG, WebP, GIF, BMP, and AVIF formats online. Free browser-based image converter.',
    path: '/tools/image-converter',
    title: 'Image Converter - CSR Dev Tools',
    url: '/tools/image-converter',
  },
  {
    description:
      'Compress JPEG and WebP images online. Adjust quality with a slider and see file size savings instantly in your browser.',
    path: '/tools/image-compressor',
    title: 'Image Compressor - CSR Dev Tools',
    url: '/tools/image-compressor',
  },
  {
    description:
      'Crop images online using freeform selection or aspect ratio presets like 16:9, 4:3, 1:1, and 3:2. Free browser-based image cropper.',
    path: '/tools/image-cropper',
    title: 'Image Cropper - CSR Dev Tools',
    url: '/tools/image-cropper',
  },
  {
    description: 'Resize images to custom width and height dimensions online. Free browser-based image resizer.',
    path: '/tools/image-resizer',
    title: 'Image Resizer - CSR Dev Tools',
    url: '/tools/image-resizer',
  },
  {
    description: 'Convert images to Base64 data URIs. Embed images directly in HTML or CSS.',
    path: '/tools/image-to-base64',
    title: 'Image to Base64 - CSR Dev Tools',
    url: '/tools/image-to-base64',
  },
  {
    description:
      'Format, validate, and beautify JSON online. Paste minified JSON and get clean, indented output instantly in your browser.',
    path: '/tools/json-formatter',
    title: 'JSON Formatter - CSR Dev Tools',
    url: '/tools/json-formatter',
  },
  {
    description:
      'Convert JSON to CSV and CSV to JSON online. Transform data between formats for spreadsheets and APIs instantly in your browser.',
    path: '/tools/json-to-csv-converter',
    title: 'JSON to CSV Converter - CSR Dev Tools',
    url: '/tools/json-to-csv-converter',
  },
  {
    description:
      'Convert JSON to YAML and YAML to JSON online. Switch between configuration formats instantly in your browser.',
    path: '/tools/json-to-yaml-converter',
    title: 'JSON to YAML Converter - CSR Dev Tools',
    url: '/tools/json-to-yaml-converter',
  },
  {
    description:
      'Evaluate JSONPath expressions against JSON data online. Test queries like $.store.book[*].author with real-time results showing matched paths and values. 100% client-side JSONPath tester.',
    path: '/tools/jsonpath-evaluator',
    title: 'JSONPath Evaluator - CSR Dev Tools',
    url: '/tools/jsonpath-evaluator',
  },
  {
    description:
      'Decode JWT tokens online. Inspect header, payload, and signature instantly in your browser without external services.',
    path: '/tools/jwt-decoder',
    title: 'JWT Decoder - CSR Dev Tools',
    url: '/tools/jwt-decoder',
  },
  {
    description:
      'Generate secure random passwords online. Configure length, uppercase, lowercase, digits, and symbols. Cryptographically secure — runs entirely in your browser.',
    path: '/tools/password-generator',
    title: 'Password Generator - CSR Dev Tools',
    url: '/tools/password-generator',
  },
  {
    description:
      'Generate QR codes from text or URLs. Customize size, colors, and error correction. Free browser-based QR code generator.',
    path: '/tools/qr-code-generator',
    title: 'QR Code Generator - CSR Dev Tools',
    url: '/tools/qr-code-generator',
  },
  {
    description:
      'Convert between PX and REM CSS units online. Configurable base font size. Free browser-based unit converter.',
    path: '/tools/px-to-rem',
    title: 'PX to REM - CSR Dev Tools',
    url: '/tools/px-to-rem',
  },
  {
    description:
      'Test regular expressions against sample text with live match highlighting and capture group details. Iterate on regex patterns instantly in your browser.',
    path: '/tools/regex-tester',
    title: 'Regex Tester - CSR Dev Tools',
    url: '/tools/regex-tester',
  },
  {
    description:
      'Generate RSA 2048 or 4096-bit key pairs online. Download public and private keys in PEM format. 100% client-side — keys never leave your browser. Free RSA key generator.',
    path: '/tools/rsa-key-generator',
    title: 'RSA Key Generator - CSR Dev Tools',
    url: '/tools/rsa-key-generator',
  },
  {
    description:
      'Compare two text blocks and see line-by-line differences highlighted online. Spot changes between versions of code or text instantly in your browser.',
    path: '/tools/text-diff-checker',
    title: 'Text Diff Checker - CSR Dev Tools',
    url: '/tools/text-diff-checker',
  },
  {
    description:
      'Convert between Unix timestamps and human-readable dates online. Free browser-based timestamp converter.',
    path: '/tools/unix-timestamp',
    title: 'Unix Timestamp - CSR Dev Tools',
    url: '/tools/unix-timestamp',
  },
  {
    description:
      'Encode and decode URL strings online. Convert special characters to percent-encoded format instantly in your browser.',
    path: '/tools/url-encoder-decoder',
    title: 'URL Encoder/Decoder - CSR Dev Tools',
    url: '/tools/url-encoder-decoder',
  },
  {
    description:
      'Generate random UUID v4 identifiers online. Create single or bulk unique IDs instantly in your browser with one click.',
    path: '/tools/uuid-generator',
    title: 'UUID Generator - CSR Dev Tools',
    url: '/tools/uuid-generator',
  },
  {
    description: 'Visual CSS border-radius editor with per-corner control, asymmetric mode, and live preview.',
    path: '/tools/css-border-radius-generator',
    title: 'CSS Border Radius Generator - CSR Dev Tools',
    url: '/tools/css-border-radius-generator',
  },
  {
    description: 'Break down URLs into protocol, hostname, port, path, query parameters, and hash fragment.',
    path: '/tools/url-parser',
    title: 'URL Parser - CSR Dev Tools',
    url: '/tools/url-parser',
  },
  {
    description: 'Visual Markdown table builder with editable cells, column alignment, and copy-to-clipboard.',
    path: '/tools/markdown-table-generator',
    title: 'Markdown Table Generator - CSR Dev Tools',
    url: '/tools/markdown-table-generator',
  },
  {
    description:
      'Validate JSON data against a JSON Schema (draft-07). See validation errors with JSON paths and keywords — all in the browser.',
    path: '/tools/json-schema-validator',
    title: 'JSON Schema Validator - CSR Dev Tools',
    url: '/tools/json-schema-validator',
  },
  {
    description: 'Searchable HTTP status code reference with descriptions, categories, and common use cases.',
    path: '/tools/http-status-codes',
    title: 'HTTP Status Codes Reference - CSR Dev Tools',
    url: '/tools/http-status-codes',
  },
  {
    description: 'Parse user agent strings to identify browser, operating system, device type, and rendering engine.',
    path: '/tools/user-agent-parser',
    title: 'User Agent Parser - CSR Dev Tools',
    url: '/tools/user-agent-parser',
  },
  {
    description:
      'Generate favicons in 16x16, 32x32, 48x48, 180x180, 192x192, and 512x512 sizes from any image. Download all as ZIP.',
    path: '/tools/favicon-generator',
    title: 'Favicon Generator - CSR Dev Tools',
    url: '/tools/favicon-generator',
  },
  {
    description:
      'Build CSS @keyframes animations visually. Define keyframe steps, timing functions, and preview animations in real-time.',
    path: '/tools/css-animation-builder',
    title: 'CSS Animation Builder - CSR Dev Tools',
    url: '/tools/css-animation-builder',
  },
  {
    description:
      'Build cron expressions visually by selecting minute, hour, day, month, and weekday values. See human-readable descriptions and next run times.',
    path: '/tools/crontab-generator',
    title: 'Crontab Generator - CSR Dev Tools',
    url: '/tools/crontab-generator',
  },
  {
    description:
      'Preview how your links will appear on Twitter, Facebook, and LinkedIn. Enter OG meta values and generate ready-to-use meta tags.',
    path: '/tools/og-preview',
    title: 'OG Preview - CSR Dev Tools',
    url: '/tools/og-preview',
  },
  {
    description:
      'Generate HMAC signatures using SHA-256, SHA-384, or SHA-512. Verify API signatures and webhook authentication.',
    path: '/tools/hmac-generator',
    title: 'HMAC Generator - CSR Dev Tools',
    url: '/tools/hmac-generator',
  },
  {
    description: 'Encrypt and decrypt text using AES-256-GCM with a password. 100% client-side encryption.',
    path: '/tools/aes-encrypt-decrypt',
    title: 'AES Encrypt/Decrypt - CSR Dev Tools',
    url: '/tools/aes-encrypt-decrypt',
  },
  {
    description: 'Visual CSS flexbox layout builder. Experiment with flex properties and copy the CSS.',
    path: '/tools/css-flexbox-playground',
    title: 'CSS Flexbox Playground - CSR Dev Tools',
    url: '/tools/css-flexbox-playground',
  },
  {
    description:
      'Create CSS gradients visually with a live preview. Linear and radial gradients with multiple color stops.',
    path: '/tools/css-gradient-generator',
    title: 'CSS Gradient Generator - CSR Dev Tools',
    url: '/tools/css-gradient-generator',
  },
  {
    description: 'View and optimize SVG code with a live preview. Remove metadata and reduce file size.',
    path: '/tools/svg-viewer',
    title: 'SVG Viewer - CSR Dev Tools',
    url: '/tools/svg-viewer',
  },
  {
    description:
      'Parse cron expressions into human-readable descriptions and preview the next scheduled run times.',
    path: '/tools/cron-expression-parser',
    title: 'Cron Expression Parser - CSR Dev Tools',
    url: '/tools/cron-expression-parser',
  },
  {
    description: 'Visual CSS Grid layout builder. Experiment with grid properties and copy the CSS.',
    path: '/tools/css-grid-playground',
    title: 'CSS Grid Playground - CSR Dev Tools',
    url: '/tools/css-grid-playground',
  },
  {
    description:
      'Upload an image and click anywhere to extract colors. Get HEX, RGB, and HSL values instantly.',
    path: '/tools/image-color-picker',
    title: 'Image Color Picker - CSR Dev Tools',
    url: '/tools/image-color-picker',
  },
  {
    description:
      'Generate TypeScript interfaces or types from JSON. Paste JSON, get type-safe code instantly in your browser.',
    path: '/tools/json-to-typescript',
    title: 'JSON to TypeScript - CSR Dev Tools',
    url: '/tools/json-to-typescript',
  },
  {
    description:
      'View SSH public key fingerprints in SHA256 and MD5 formats. Supports ssh-rsa, ssh-ed25519, and ECDSA keys. Extract key type, bit size, and comment. Free online SSH key tool.',
    path: '/tools/ssh-key-fingerprint',
    title: 'SSH Key Fingerprint - CSR Dev Tools',
    url: '/tools/ssh-key-fingerprint',
  },
  {
    description:
      'Sort lines alphabetically, numerically, or by length. Remove duplicates, empty lines, and trim whitespace.',
    path: '/tools/text-sort-dedupe',
    title: 'Text Sort & Dedupe - CSR Dev Tools',
    url: '/tools/text-sort-dedupe',
  },
  {
    description:
      'Convert any file to a data URI for embedding in HTML/CSS. Decode data URIs back to files. Supports images, fonts, SVGs, and more. Free online data URI tool.',
    path: '/tools/data-uri-generator',
    title: 'Data URI Generator - CSR Dev Tools',
    url: '/tools/data-uri-generator',
  },
  {
    description: 'Convert between .env, JSON, and YAML formats. Free online environment file converter.',
    path: '/tools/env-file-converter',
    title: 'ENV File Converter - CSR Dev Tools',
    url: '/tools/env-file-converter',
  },
  {
    description: 'Escape and unescape JSON strings online. Stringify JSON for embedding in code or config files.',
    path: '/tools/escaped-json-stringifier',
    title: 'Escaped JSON Stringifier - CSR Dev Tools',
    url: '/tools/escaped-json-stringifier',
  },
  {
    description:
      'Encode and decode HTML entities online. Convert special characters to named or numeric HTML entities.',
    path: '/tools/html-entity-converter',
    title: 'HTML Entity Converter - CSR Dev Tools',
    url: '/tools/html-entity-converter',
  },
  {
    description:
      'Format and validate YAML online. Configurable indentation, key sorting, and syntax error detection.',
    path: '/tools/yaml-formatter',
    title: 'YAML Formatter - CSR Dev Tools',
    url: '/tools/yaml-formatter',
  },
  {
    description:
      'Generate customizable placeholder images with dimensions, colors, and text. Download as PNG or SVG. Free online placeholder image generator.',
    path: '/tools/placeholder-image-generator',
    title: 'Placeholder Image Generator - CSR Dev Tools',
    url: '/tools/placeholder-image-generator',
  },
  {
    description:
      'Convert Protocol Buffer definitions to JSON online. Paste .proto files to browse message types and generate sample JSON structures. 100% client-side Protobuf to JSON converter.',
    path: '/tools/protobuf-to-json',
    title: 'Protobuf to JSON - CSR Dev Tools',
    url: '/tools/protobuf-to-json',
  },
  {
    description:
      'TypeScript playground with real-time type checking and JavaScript transpilation. Write TypeScript code with IntelliSense, error highlighting, and instant JS output. 100% client-side.',
    path: '/tools/typescript-playground',
    title: 'TypeScript Playground - CSR Dev Tools',
    url: '/tools/typescript-playground',
  },
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsConfigPaths(), tailwindcss(), prerender(toolRoutes)],
})
