export type OgConfig = {
  description: string
  image: string
  siteName: string
  title: string
  url: string
}

const escapeHtml = (str: string): string =>
  str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const generateOgMetaTags = (config: OgConfig): string => {
  const tags: Array<string> = []

  if (config.title) {
    tags.push(`<meta property="og:title" content="${escapeHtml(config.title)}" />`)
  }
  if (config.description) {
    tags.push(`<meta property="og:description" content="${escapeHtml(config.description)}" />`)
  }
  if (config.image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(config.image)}" />`)
  }
  if (config.siteName) {
    tags.push(`<meta property="og:site_name" content="${escapeHtml(config.siteName)}" />`)
  }
  if (config.url) {
    tags.push(`<meta property="og:url" content="${escapeHtml(config.url)}" />`)
  }

  if (config.title || config.description || config.image) {
    tags.push(`<meta property="og:type" content="website" />`)
  }

  // Twitter cards
  if (config.image) {
    tags.push(`<meta name="twitter:card" content="summary_large_image" />`)
  } else if (config.title || config.description) {
    tags.push(`<meta name="twitter:card" content="summary" />`)
  }
  if (config.title) {
    tags.push(`<meta name="twitter:title" content="${escapeHtml(config.title)}" />`)
  }
  if (config.description) {
    tags.push(`<meta name="twitter:description" content="${escapeHtml(config.description)}" />`)
  }
  if (config.image) {
    tags.push(`<meta name="twitter:image" content="${escapeHtml(config.image)}" />`)
  }

  return tags.join('\n')
}
