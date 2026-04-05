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
