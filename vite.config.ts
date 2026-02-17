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
      'Remove image backgrounds instantly using AI running in your browser. No uploads, no API calls — fully private and free.',
    path: '/tools/background-remover',
    title: 'Background Remover - CSR Dev Tools',
    url: '/tools/background-remover',
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
      'Generate CSS box-shadow values visually with a live preview. Adjust offset, blur, spread, color, and opacity — copy the CSS directly into your stylesheet.',
    path: '/tools/box-shadow-generator',
    title: 'Box Shadow Generator - CSR Dev Tools',
    url: '/tools/box-shadow-generator',
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
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsConfigPaths(), tailwindcss(), prerender(toolRoutes)],
})
