import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import type { Plugin } from 'vite'

type PreRenderRoute = {
  description: string
  path: string
  title: string
  url: string
}

const SITE_ORIGIN = 'https://csr-dev-tools.pages.dev'

const escapeHtml = (str: string): string =>
  str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Replace exactly one tag, throwing when the template no longer contains it so
// a renamed/removed tag in index.html fails the build instead of silently
// shipping the home page's metadata on every tool route. A function replacer
// is used so `$&`, `$'`, `$1`… inside titles are inserted literally.
const replaceTag = (html: string, pattern: RegExp, replacement: string, label: string): string => {
  if (!pattern.test(html)) {
    throw new Error(`[prerender] index.html is missing the expected ${label} tag`)
  }
  return html.replace(pattern, () => replacement)
}

export const renderRouteHtml = (template: string, route: PreRenderRoute): string => {
  const title = escapeHtml(route.title)
  const description = escapeHtml(route.description)
  const url = `${SITE_ORIGIN}${route.url}`

  const replacements: Array<[RegExp, string, string]> = [
    [/<title>[^<]*<\/title>/, `<title>${title}</title>`, '<title>'],
    [/<meta name="description"[^>]*>/, `<meta name="description" content="${description}">`, 'description'],
    [/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}">`, 'og:title'],
    [
      /<meta property="og:description"[^>]*>/,
      `<meta property="og:description" content="${description}">`,
      'og:description',
    ],
    [/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}">`, 'og:url'],
    [/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${title}">`, 'twitter:title'],
    [
      /<meta name="twitter:description"[^>]*>/,
      `<meta name="twitter:description" content="${description}">`,
      'twitter:description',
    ],
    [/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}">`, 'canonical'],
  ]

  return replacements.reduce(
    (html, [pattern, replacement, label]) => replaceTag(html, pattern, replacement, label),
    template,
  )
}

export const prerender = (routes: Array<PreRenderRoute>): Plugin => {
  let outDir = resolve(process.cwd(), 'dist')

  return {
    apply: 'build',
    closeBundle() {
      const templatePath = resolve(outDir, 'index.html')

      if (!existsSync(templatePath)) {
        // eslint-disable-next-line no-console -- build plugin needs console output
        console.warn(`[prerender] ${templatePath} not found, skipping pre-render`)
        return
      }

      const template = readFileSync(templatePath, 'utf-8')

      for (const route of routes) {
        const outputPath = resolve(outDir, route.path.replace(/^\//, ''), 'index.html')
        mkdirSync(dirname(outputPath), { recursive: true })
        writeFileSync(outputPath, renderRouteHtml(template, route), 'utf-8')
      }

      // eslint-disable-next-line no-console -- build plugin needs console output
      console.log(`[prerender] Generated ${routes.length} static HTML files`)
    },
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    name: 'vite-plugin-prerender-seo',
  }
}
