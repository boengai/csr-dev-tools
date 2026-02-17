export const htmlToMarkdown = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const TurndownService = (await import('turndown')).default
  const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })
  return turndown.turndown(input)
}

export const markdownToHtml = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const { marked } = await import('marked')
  const result = await marked(input)
  return result
}
