import { resolve } from 'node:path'

import { defineConfig } from 'vite'

// Bundles the CodeMirror bridge on its own, one ES module with no imports, so
// `dx` can hash it as an asset and the app can `import()` it on demand.
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, 'codemirror-bridge.ts'),
      fileName: () => 'codemirror-bridge.js',
      formats: ['es'],
    },
    minify: true,
    outDir: resolve(import.meta.dirname, '../app/assets/generated'),
  },
  publicDir: false,
})
