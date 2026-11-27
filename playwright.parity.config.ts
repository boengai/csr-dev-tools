import { defineParityConfig } from './e2e/parity/config'

// The parity run against the React build (docs/ux/parity.md, e2e/parity/README.md).
//   pnpm build && pnpm test:parity
// PARITY_BASE_URL=<url> runs it against a site that is already up instead.
const PORT = 4173
const url = process.env.PARITY_BASE_URL ?? `http://localhost:${PORT}`

export default defineParityConfig({
  baseURL: url,
  build: 'react',
  webServer: process.env.PARITY_BASE_URL
    ? undefined
    : {
        command: `pnpm exec vite preview --port ${PORT} --strictPort`,
        // Never reuse: an old server on the port could be serving another build.
        reuseExistingServer: false,
        url,
      },
})
