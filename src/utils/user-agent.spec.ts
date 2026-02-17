import { describe, expect, it } from 'vitest'

import { parseUserAgent } from './user-agent'

describe('parseUserAgent', () => {
  it('parses Chrome on Windows 10', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    const result = parseUserAgent(ua)
    expect(result.browser.name).toBe('Chrome')
    expect(result.os.name).toBe('Windows')
    expect(result.device).toBe('Desktop')
    expect(result.engine.name).toBe('Blink')
  })

  it('parses Firefox on macOS', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
    const result = parseUserAgent(ua)
    expect(result.browser.name).toBe('Firefox')
    expect(result.os.name).toBe('macOS')
    expect(result.engine.name).toBe('Gecko')
  })

  it('parses Safari on iOS iPhone — Mobile', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
    const result = parseUserAgent(ua)
    expect(result.browser.name).toBe('Safari')
    expect(result.os.name).toBe('iOS')
    expect(result.device).toBe('Mobile')
    expect(result.engine.name).toBe('WebKit')
  })

  it('parses Edge on Windows', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
    const result = parseUserAgent(ua)
    expect(result.browser.name).toBe('Edge')
  })

  it('parses Chrome on Android — Mobile', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
    const result = parseUserAgent(ua)
    expect(result.browser.name).toBe('Chrome')
    expect(result.os.name).toBe('Android')
    expect(result.device).toBe('Mobile')
  })

  it('parses Android tablet — Tablet', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 13; SM-X800) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    const result = parseUserAgent(ua)
    expect(result.device).toBe('Tablet')
  })

  it('parses Googlebot', () => {
    const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    const result = parseUserAgent(ua)
    expect(result.browser.name).toBe('Unknown')
  })

  it('returns Unknown for empty string', () => {
    const result = parseUserAgent('')
    expect(result.browser.name).toBe('Unknown')
    expect(result.os.name).toBe('Unknown')
    expect(result.device).toBe('Unknown')
    expect(result.engine.name).toBe('Unknown')
  })

  it('returns Unknown for garbage string', () => {
    const result = parseUserAgent('not a real user agent string at all')
    expect(result.browser.name).toBe('Unknown')
  })
})
