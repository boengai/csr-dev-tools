export type UrlParam = {
  key: string
  value: string
}

export type UrlParseResult = {
  error?: string
  hash: string
  hostname: string
  pathname: string
  port: string
  protocol: string
  search: string
  searchParams: Array<UrlParam>
}

export const parseUrl = (input: string): UrlParseResult => {
  try {
    const url = new URL(input)
    const searchParams: Array<UrlParam> = []
    url.searchParams.forEach((value, key) => {
      searchParams.push({ key, value })
    })

    return {
      hash: url.hash,
      hostname: url.hostname,
      pathname: url.pathname,
      port: url.port,
      protocol: url.protocol,
      search: url.search,
      searchParams,
    }
  } catch {
    return {
      error: 'Invalid URL — enter a fully qualified URL (e.g., https://example.com)',
      hash: '',
      hostname: '',
      pathname: '',
      port: '',
      protocol: '',
      search: '',
      searchParams: [],
    }
  }
}
