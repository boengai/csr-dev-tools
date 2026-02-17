import DOMPurify from 'dompurify'
import { marked } from 'marked'

export const renderMarkdown = (md: string): string => {
  if (md.trim().length === 0) return ''

  const raw = marked.parse(md, { async: false }) as string
  return DOMPurify.sanitize(raw)
}
