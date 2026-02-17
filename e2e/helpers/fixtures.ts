// --- Color Converter Test Data ---

export const colors = {
  valid: {
    hex: '#3B82F6',
    rgb: 'rgb(59, 130, 246)',
    hsl: 'hsl(217 91% 60%)',
  },
  invalid: {
    hex: '#ZZZZZZ',
  },
}

// --- Base64 Test Data ---

export const base64 = {
  valid: {
    decoded: 'Hello, World!',
    encoded: 'SGVsbG8sIFdvcmxkIQ==',
  },
  invalid: {
    encoded: '!!!not-base64!!!',
  },
}

// --- Timestamp Test Data ---

export const timestamps = {
  epoch: 0,
  epochDate: 'January 1, 1970',
  sample: 1700000000,
  sampleDate: '2023',
}

// --- PX to REM Conversion Pairs ---

export const pxRem = {
  baseFontSize: 16,
  pairs: [
    { px: '16', rem: '1' },
    { px: '32', rem: '2' },
    { px: '8', rem: '0.5' },
  ],
}

// --- Tool Registry Keys for Navigation ---

export const toolKeys = [
  'json-formatter',
  'uuid-generator',
  'base64-encoder',
  'jwt-decoder',
  'unix-timestamp',
  'regex-tester',
] as const

export const toolNames = [
  'JSON Formatter',
  'UUID Generator',
  'Base64 Encoder',
  'JWT Decoder',
  'Unix Timestamp',
  'Regex Tester',
] as const

export const toolRoutes = {
  'json-formatter': '/tools/json-formatter',
  'uuid-generator': '/tools/uuid-generator',
  'base64-encoder': '/tools/base64-encoder',
  'jwt-decoder': '/tools/jwt-decoder',
  'unix-timestamp': '/tools/unix-timestamp',
  'regex-tester': '/tools/regex-tester',
} as const
