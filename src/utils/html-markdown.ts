export const htmlToMarkdown = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const TurndownService = (await import('turndown')).default
  const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })
  return turndown.turndown(input)
}

export const markdownToHtml = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const [{ marked }, DOMPurify] = await Promise.all([import('marked'), import('dompurify')])
  const raw = await marked(input)
  return DOMPurify.default.sanitize(raw)
}
