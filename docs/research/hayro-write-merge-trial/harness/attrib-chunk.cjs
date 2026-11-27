// Attribute each byte of a built chunk to its source module via the sourcemap,
// then brotli the bytes that belong to pdf-lib and its dependencies.
const fs = require('fs'), z = require('zlib')
const { SourceMapConsumer } = require(process.argv[4])
const code = fs.readFileSync(process.argv[2], 'utf8')
const map = new SourceMapConsumer(JSON.parse(fs.readFileSync(process.argv[3], 'utf8')))
const lines = code.split('\n')
const segs = []
map.eachMapping((m) => segs.push(m), null, SourceMapConsumer.GENERATED_ORDER)
const owner = lines.map((l) => new Array(l.length).fill(null))
for (let i = 0; i < segs.length; i++) {
  const m = segs[i], n = segs[i + 1]
  const line = m.generatedLine - 1
  const end = n && n.generatedLine === m.generatedLine ? n.generatedColumn : lines[line].length
  for (let c = m.generatedColumn; c < end; c++) owner[line][c] = m.source
}
const group = (src) => {
  if (!src) return '(unmapped)'
  const m = src.match(/node_modules\/\.pnpm\/[^/]+\/node_modules\/((?:@[^/]+\/)?[^/]+)/)
  return m ? m[1] : 'app:' + src.replace(/.*\/src\//, 'src/')
}
const isPdfLib = (g) => /^(pdf-lib|@pdf-lib\/.*|pako|tslib)$/.test(g)
const by = {}, pdfParts = [], restParts = []
lines.forEach((l, li) => {
  for (let c = 0; c < l.length; c++) {
    const g = group(owner[li][c])
    by[g] = (by[g] || 0) + 1
    ;(isPdfLib(g) ? pdfParts : restParts).push(l[c])
  }
})
const br = (s) => z.brotliCompressSync(Buffer.from(s), { params: { [z.constants.BROTLI_PARAM_QUALITY]: 11 } }).length
const sorted = Object.entries(by).sort((a, b) => b[1] - a[1])
for (const [g, n] of sorted.slice(0, 25)) console.log(String(n).padStart(8), g)
const pdf = pdfParts.join(''), rest = restParts.join('')
console.log('pdf-lib + deps: raw', Buffer.byteLength(pdf), 'brotli', br(pdf))
console.log('rest of chunk : raw', Buffer.byteLength(rest), 'brotli', br(rest))
console.log('whole chunk   : raw', Buffer.byteLength(code), 'brotli', br(code))
