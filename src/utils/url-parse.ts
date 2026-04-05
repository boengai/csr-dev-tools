import type { UrlParam, UrlParseResult } from "@/types/utils/url-parse";

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

export type { UrlParam, UrlParseResult } from "@/types/utils/url-parse";
