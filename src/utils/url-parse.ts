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
      searchParams,
    }
  } catch {
    return {
      error: 'Invalid URL',
      hash: '',
      hostname: '',
      pathname: '',
      port: '',
      protocol: '',
      searchParams: [],
    }
  }
}
