import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'

import { TOOL_ROUTES } from './src/constants/tool-routes'
import { prerender } from './vite-plugins/prerender'

const toolRoutes = TOOL_ROUTES.map((r) => ({
  description: r.seo.description,
  path: r.routePath,
  title: r.seo.title,
  url: r.routePath,
}))

// https://vite.dev/config/
export default defineConfig({
  plugins: [wasm(), react(), tailwindcss(), prerender(toolRoutes)],
  resolve: {
    tsconfigPaths: true,
    alias: {
      mermaid: path.join(import.meta.dirname, 'node_modules/mermaid/dist/mermaid.esm.min.mjs'),
    },
  },
})
