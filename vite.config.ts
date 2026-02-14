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
      'Encode and decode Base64 strings online. Convert text to Base64 and back instantly in your browser.',
    path: '/tools/base64-encoder',
    title: 'Base64 Encoder - CSR Dev Tools',
    url: '/tools/base64-encoder',
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
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsConfigPaths(), tailwindcss(), prerender(toolRoutes)],
})
