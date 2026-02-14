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
      'Decode JWT tokens online. Inspect header, payload, and signature instantly in your browser without external services.',
    path: '/tools/jwt-decoder',
    title: 'JWT Decoder - CSR Dev Tools',
    url: '/tools/jwt-decoder',
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
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsConfigPaths(), tailwindcss(), prerender(toolRoutes)],
})
