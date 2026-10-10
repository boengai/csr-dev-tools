import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { renderRouteHtml } from './prerender'

const template = readFileSync(resolve(import.meta.dirname, '../index.html'), 'utf-8')

const route = {
  description: 'Format & validate JSON',
  path: '/tools/json-formatter',
  title: 'JSON Formatter - CSR Dev Tools',
  url: '/tools/json-formatter',
}

const metaContent = (html: string, attr: 'name' | 'property', key: string): string | undefined =>
  html.match(new RegExp(`<meta ${attr}="${key}"[^>]*content="([^"]*)"`))?.[1]

describe('renderRouteHtml', () => {
  it('rewrites title, description, og, twitter and canonical tags', () => {
    const html = renderRouteHtml(template, route)
    expect(html).toContain('<title>JSON Formatter - CSR Dev Tools</title>')
    expect(metaContent(html, 'name', 'description')).toBe('Format &amp; validate JSON')
    expect(metaContent(html, 'property', 'og:title')).toBe('JSON Formatter - CSR Dev Tools')
    expect(metaContent(html, 'property', 'og:description')).toBe('Format &amp; validate JSON')
    expect(metaContent(html, 'property', 'og:url')).toBe('https://csr-dev-tools.pages.dev/tools/json-formatter')
    expect(metaContent(html, 'name', 'twitter:title')).toBe('JSON Formatter - CSR Dev Tools')
    expect(metaContent(html, 'name', 'twitter:description')).toBe('Format &amp; validate JSON')
    expect(html).toContain('<link rel="canonical" href="https://csr-dev-tools.pages.dev/tools/json-formatter">')
  })

  it('leaves no home-page title or description behind', () => {
    const html = renderRouteHtml(template, route)
    expect(html).not.toContain('Free Web Developer Tools Collection')
  })

  it('inserts replacement-pattern sequences literally', () => {
    const html = renderRouteHtml(template, { ...route, description: "costs $& and $' too", title: 'A $1 $& tool' })
    expect(html).toContain('<title>A $1 $&amp; tool</title>')
    expect(metaContent(html, 'name', 'twitter:title')).toBe('A $1 $&amp; tool')
    expect(metaContent(html, 'name', 'description')).toBe("costs $&amp; and $' too")
  })

  it('escapes HTML-significant characters', () => {
    const html = renderRouteHtml(template, { ...route, title: '<script>"x"</script>' })
    expect(html).toContain('<title>&lt;script&gt;&quot;x&quot;&lt;/script&gt;</title>')
  })

  it('throws when the template lacks an expected tag', () => {
    const broken = template.replace(/<meta name="twitter:title"[^>]*>/, '')
    expect(() => renderRouteHtml(broken, route)).toThrow(/twitter:title/)
  })
})
