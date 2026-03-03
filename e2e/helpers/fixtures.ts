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

// --- Text Tool Test Data ---

export const textToolData = {
  caseInput: 'hello world example',
  wordCountInput: 'The quick brown fox jumps over the lazy dog. This is a second sentence.',
  sortInput: 'banana\napple\ncherry\napple\ndate',
  sortedOutput: 'apple\napple\nbanana\ncherry\ndate',
}

// --- Code Tool Test Data ---

export const codeData = {
  jsonInput: '{"name":"test","value":123}',
}

export const toolNames = [
  'JSON Formatter',
  'UUID Generator',
  'Base64 Encoder',
  'JWT Decoder',
  'Unix Timestamp',
  'Regex Tester',
] as const

// --- Crypto Test Data ---

export const cryptoData = {
  hashInput: 'Hello, World!',
  hmacSecret: 'my-secret-key',
}

// --- JWT Test Data ---

export const jwtData = {
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
}

// --- Code Formatting Test Data ---

export const codeFormattingData = {
  html: '<div><p>hello</p></div>',
  css: 'body{color:red;margin:0}',
  js: 'function hello(  ) {  return   "world" ;  }',
  sql: 'SELECT id,name FROM users WHERE active=1 ORDER BY name',
  markdown: '# Hello\n\nThis is **bold** and *italic*.',
  jsonForTs: '{"name": "string", "age": 0, "active": true}',
}

// --- Data Conversion Test Data ---

export const dataConversionData = {
  jsonArray: '[{"name":"Alice","age":30},{"name":"Bob","age":25}]',
  jsonForYaml: '{"name": "test", "version": 1, "enabled": true}',
  xml: '<root><name>test</name><value>123</value></root>',
  toml: '[database]\nserver = "192.168.1.1"\nport = 5432',
  htmlForMd: '<h1>Title</h1><p>Hello <strong>world</strong></p>',
}

