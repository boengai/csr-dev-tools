import { marked } from 'marked'

const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*\/?>/gi, '')
    .replace(/href\s*=\s*["']?\s*javascript\s*:/gi, 'href="#"')
}

export const renderMarkdown = (md: string): string => {
  if (md.trim().length === 0) return ''

  const raw = marked.parse(md, { async: false }) as string
  return sanitizeHtml(raw)
}
