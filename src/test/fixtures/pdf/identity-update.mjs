// Appends an incremental update that redefines one content stream as clear
// bytes exempted from the default crypt filter by /Identity in a
// /DecodeParms array: Filter [/Crypt /FlateDecode], DecodeParms [<< /Name /Identity >> null].
import { readFileSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
const [, , input, contentFile, objNum, output] = process.argv
const base = readFileSync(input)
const text = base.toString('latin1')
const trailer = text.slice(text.lastIndexOf('trailer'))
const dict = /trailer\s*<<([\s\S]*?)>>\s*startxref/.exec(trailer)[1]
const prev = /startxref\s+(\d+)/.exec(trailer.slice(trailer.indexOf('startxref')))[1]
const size = /\/Size (\d+)/.exec(dict)[1]
const data = deflateSync(readFileSync(contentFile))
const head = Buffer.from(
  `\n${objNum} 0 obj\n<< /Length ${data.length} /Filter [ /Crypt /FlateDecode ] /DecodeParms [ << /Name /Identity >> null ] >>\nstream\n`,
  'latin1',
)
const objOffset = base.length + 1
const tail = Buffer.from('\nendstream\nendobj\n', 'latin1')
const xrefOffset = base.length + head.length + data.length + tail.length
const keep = dict
  .replace(/\/Size \d+/, '')
  .replace(/\/Prev \d+/, '')
  .trim()
const xref = Buffer.from(
  `xref\n${objNum} 1\n${String(objOffset).padStart(10, '0')} 00000 n \ntrailer << ${keep} /Size ${size} /Prev ${prev} >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  'latin1',
)
writeFileSync(output, Buffer.concat([base, head, data, tail, xref]))
