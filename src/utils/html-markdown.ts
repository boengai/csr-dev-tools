export const htmlToMarkdown = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const TurndownService = (await import('turndown')).default
  const { gfm } = await import('turndown-plugin-gfm')
  const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })
  turndown.use(gfm)
  return turndown.turndown(input)
}

export const markdownToHtml = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const { marked } = await import('marked')
  const raw = await marked(input)
  // Sanitize dangerous elements — output is displayed as text in a textarea,
  // but we sanitize defensively in case rendering context changes
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<(iframe|embed|object)\b[^>]*>(?:[\s\S]*?<\/\1>)?/gi, '')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*["']?\s*javascript\s*:/gi, 'href="#"')
    .replace(/href\s*=\s*["']?\s*data\s*:/gi, 'href="#"')
}
