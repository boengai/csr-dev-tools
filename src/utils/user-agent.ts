export type UserAgentResult = {
  browser: { name: string; version: string }
  device: string
  engine: { name: string; version: string }
  os: { name: string; version: string }
}

const match = (ua: string, pattern: RegExp): string => {
  const m = ua.match(pattern)
  return m?.[1] ?? ''
}

const detectBrowser = (ua: string): { name: string; version: string } => {
  if (/Edg\//i.test(ua)) return { name: 'Edge', version: match(ua, /Edg\/([\d.]+)/) }
  if (/OPR\//i.test(ua)) return { name: 'Opera', version: match(ua, /OPR\/([\d.]+)/) }
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return { name: 'Chrome', version: match(ua, /Chrome\/([\d.]+)/) }
  if (/Safari\//i.test(ua) && /Version\//i.test(ua) && !/Chrome/i.test(ua) && !/CriOS/i.test(ua)) return { name: 'Safari', version: match(ua, /Version\/([\d.]+)/) }
  if (/Firefox\//i.test(ua)) return { name: 'Firefox', version: match(ua, /Firefox\/([\d.]+)/) }
  if (/Trident\//i.test(ua) || /MSIE/i.test(ua)) return { name: 'Internet Explorer', version: match(ua, /(?:MSIE |rv:)([\d.]+)/) }
  return { name: 'Unknown', version: '' }
}

const detectOs = (ua: string): { name: string; version: string } => {
  if (/iPhone|iPad|iPod/i.test(ua)) return { name: 'iOS', version: match(ua, /OS ([\d_]+)/).replace(/_/g, '.') }
  if (/Android/i.test(ua)) return { name: 'Android', version: match(ua, /Android ([\d.]+)/) }
  if (/Mac OS X/i.test(ua)) return { name: 'macOS', version: match(ua, /Mac OS X ([\d_.]+)/).replace(/_/g, '.') }
  if (/Windows NT/i.test(ua)) {
    const ver = match(ua, /Windows NT ([\d.]+)/)
    const names: Record<string, string> = { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7' }
    return { name: 'Windows', version: names[ver] ?? ver }
  }
  if (/CrOS/i.test(ua)) return { name: 'Chrome OS', version: '' }
  if (/Linux/i.test(ua)) return { name: 'Linux', version: '' }
  return { name: 'Unknown', version: '' }
}

const detectDevice = (ua: string): string => {
  if (/iPhone|Android.*Mobile/i.test(ua)) return 'Mobile'
  if (/iPad|Android(?!.*Mobile)/i.test(ua)) return 'Tablet'
  return 'Desktop'
}

const detectEngine = (ua: string): { name: string; version: string } => {
  if (/Trident/i.test(ua)) return { name: 'Trident', version: match(ua, /Trident\/([\d.]+)/) }
  if (/Gecko\//i.test(ua) && /Firefox/i.test(ua)) return { name: 'Gecko', version: match(ua, /rv:([\d.]+)/) }
  if (/AppleWebKit/i.test(ua)) {
    if (/Chrome/i.test(ua)) return { name: 'Blink', version: match(ua, /AppleWebKit\/([\d.]+)/) }
    return { name: 'WebKit', version: match(ua, /AppleWebKit\/([\d.]+)/) }
  }
  return { name: 'Unknown', version: '' }
}

export const parseUserAgent = (ua: string): UserAgentResult => {
  if (!ua.trim()) {
    return {
      browser: { name: 'Unknown', version: '' },
      device: 'Unknown',
      engine: { name: 'Unknown', version: '' },
      os: { name: 'Unknown', version: '' },
    }
  }

  return {
    browser: detectBrowser(ua),
    device: detectDevice(ua),
    engine: detectEngine(ua),
    os: detectOs(ua),
  }
}
