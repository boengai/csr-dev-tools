import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import type { Plugin } from 'vite'

type PreRenderRoute = {
  description: string
  path: string
  title: string
  url: string
}

const escapeHtml = (str: string): string =>
  str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const prerender = (routes: Array<PreRenderRoute>): Plugin => {
  return {
    closeBundle() {
      const distDir = resolve(process.cwd(), 'dist')
      const templatePath = resolve(distDir, 'index.html')

      if (!existsSync(templatePath)) {
        console.warn('[prerender] dist/index.html not found, skipping pre-render')
        return
      }

      const template = readFileSync(templatePath, 'utf-8')

      for (const route of routes) {
        let html = template
        const safeTitle = escapeHtml(route.title)
        const safeDescription = escapeHtml(route.description)

        html = html.replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`)

        html = html.replace(
          /<meta name="description"[^>]*>/,
          `<meta name="description" content="${safeDescription}">`,
        )

        html = html.replace(
          /<meta property="og:title"[^>]*>/,
          `<meta property="og:title" content="${safeTitle}">`,
        )

        html = html.replace(
          /<meta property="og:description"[^>]*>/,
          `<meta property="og:description" content="${safeDescription}">`,
        )

        html = html.replace(
          /<meta property="og:url"[^>]*>/,
          `<meta property="og:url" content="https://csr-dev-tools.pages.dev${route.url}">`,
        )

        html = html.replace(
          /<link rel="canonical"[^>]*>/,
          `<link rel="canonical" href="https://csr-dev-tools.pages.dev${route.url}">`,
        )

        const outputDir = resolve(distDir, route.path.replace(/^\//, ''))
        const outputPath = resolve(outputDir, 'index.html')

        mkdirSync(dirname(outputPath), { recursive: true })
        writeFileSync(outputPath, html, 'utf-8')
      }

      console.log(`[prerender] Generated ${routes.length} static HTML files`)
    },
    name: 'vite-plugin-prerender-seo',
  }
}
