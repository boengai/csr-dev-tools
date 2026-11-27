// Writes the two #43 corpus files that #42 did not have (not committed):
//
//   node docs/research/hayro-write-merge-trial/harness/make-extra-corpus.mjs <corpusDir>
//
// - markup-annots.pdf: 2 pages. Page 1 has a Text note, a Highlight and a
//   FreeText (each with an /AP), a URI link, and a GoTo link with an explicit
//   destination to page 2. Page 2 has a GoTo back to page 1.
// - inherited-attrs.pdf: 3 pages under a nested page tree. MediaBox,
//   Resources and Rotate are set only on /Pages nodes; page 3 overrides
//   MediaBox.
// The rest of the corpus is #42's (docs/research/hayro-render-trial.md on
// research/hayro-render-trial), reused as-is and pinned by sha256.
import { writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const corpusDir = resolve(process.argv[2] ?? '')
if (!process.argv[2]) throw new Error('usage: make-extra-corpus.mjs <corpusDir>')

/** objs[i] is object i+1; a string, or { dict, stream } for a stream. */
const build = (objs) => {
  let out = '%PDF-1.7\n%\xe2\xe3\xcf\xd3\n'
  const offsets = []
  objs.forEach((o, i) => {
    offsets.push(Buffer.byteLength(out, 'latin1'))
    const body =
      typeof o === 'string'
        ? o
        : `${o.dict.replace(/>>\s*$/, '')} /Length ${Buffer.byteLength(o.stream, 'latin1')} >>\nstream\n${o.stream}\nendstream`
    out += `${i + 1} 0 obj\n${body}\nendobj\n`
  })
  const xref = Buffer.byteLength(out, 'latin1')
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  for (const off of offsets) out += `${String(off).padStart(10, '0')} 00000 n \n`
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(out, 'latin1')
}

// ---------- markup-annots.pdf ----------
{
  const helv = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  const objs = [
    /* 1 */ '<< /Type /Catalog /Pages 2 0 R >>',
    /* 2 */ '<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>',
    /* 3 */ '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R /Annots [8 0 R 9 0 R 10 0 R 11 0 R 12 0 R] >>',
    /* 4 */ '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R /Annots [13 0 R] >>',
    /* 5 */ helv,
    /* 6 */ {
      dict: '<< >>',
      stream: [
        'BT /F1 24 Tf 60 760 Td (Markup annotations) Tj ET',
        'BT /F1 14 Tf 60 700 Td (This line is highlighted.) Tj ET',
        'BT /F1 14 Tf 60 600 Td (Link to example.com) Tj ET',
        'BT /F1 14 Tf 60 560 Td (Go to page 2) Tj ET',
      ].join('\n'),
    },
    /* 7 */ { dict: '<< >>', stream: 'BT /F1 24 Tf 60 760 Td (Page 2) Tj ET\nBT /F1 14 Tf 60 700 Td (Back to page 1) Tj ET' },
    /* 8  Text note */ '<< /Type /Annot /Subtype /Text /Rect [400 740 424 764] /Contents (A sticky note) /Name /Comment /C [1 0.9 0] /P 3 0 R /AP << /N 14 0 R >> >>',
    /* 9  Highlight */ '<< /Type /Annot /Subtype /Highlight /Rect [58 694 240 716] /QuadPoints [58 716 240 716 58 694 240 694] /C [1 1 0] /CA 0.5 /P 3 0 R /AP << /N 15 0 R >> >>',
    /* 10 FreeText */ '<< /Type /Annot /Subtype /FreeText /Rect [300 640 540 670] /Contents (Free text box) /DA (/Helv 12 Tf 1 0 0 rg) /P 3 0 R /AP << /N 16 0 R >> >>',
    /* 11 URI */ '<< /Type /Annot /Subtype /Link /Rect [58 595 220 615] /Border [0 0 1] /A << /S /URI /URI (https://example.com/) >> >>',
    /* 12 GoTo explicit */ '<< /Type /Annot /Subtype /Link /Rect [58 555 170 575] /Border [0 0 1] /Dest [4 0 R /XYZ 0 842 0] >>',
    /* 13 GoTo back */ '<< /Type /Annot /Subtype /Link /Rect [58 695 180 715] /Border [0 0 1] /A << /S /GoTo /D [3 0 R /Fit] >> >>',
    /* 14 */ { dict: '<< /Type /XObject /Subtype /Form /BBox [0 0 24 24] >>', stream: '1 0.9 0 rg 0 0 24 24 re f 0 g 4 6 16 12 re S' },
    /* 15 */ {
      dict: '<< /Type /XObject /Subtype /Form /BBox [58 694 240 716] /Group << /S /Transparency >> /Resources << /ExtGState << /G0 << /CA 0.5 /ca 0.5 /BM /Multiply >> >> >> >>',
      stream: '/G0 gs 1 1 0 rg 58 694 182 22 re f',
    },
    /* 16 */ {
      dict: '<< /Type /XObject /Subtype /Form /BBox [300 640 540 670] /Resources << /Font << /Helv 5 0 R >> >> >>',
      stream: '0 0 1 RG 300.5 640.5 239 29 re S BT /Helv 12 Tf 1 0 0 rg 306 650 Td (Free text box) Tj ET',
    },
  ]
  writeFileSync(join(corpusDir, 'markup-annots.pdf'), build(objs))
}

// ---------- inherited-attrs.pdf ----------
{
  const objs = [
    /* 1 */ '<< /Type /Catalog /Pages 2 0 R >>',
    /* 2 root */ '<< /Type /Pages /Kids [3 0 R 6 0 R] /Count 3 /MediaBox [0 0 400 300] /Resources << /Font << /F1 7 0 R >> >> >>',
    /* 3 mid */ '<< /Type /Pages /Parent 2 0 R /Kids [4 0 R 5 0 R] /Count 2 /Rotate 90 >>',
    /* 4 */ '<< /Type /Page /Parent 3 0 R /Contents 8 0 R >>',
    /* 5 */ '<< /Type /Page /Parent 3 0 R /Contents 9 0 R >>',
    /* 6 */ '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Contents 10 0 R >>',
    /* 7 */ '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>',
    /* 8 */ { dict: '<< >>', stream: '0 0.5 0 rg 10 10 380 280 re f 1 g BT /F1 28 Tf 30 140 Td (Inherited p1, rotate 90) Tj ET' },
    /* 9 */ { dict: '<< >>', stream: '0 0 0.6 rg 10 10 380 280 re f 1 g BT /F1 28 Tf 30 140 Td (Inherited p2, rotate 90) Tj ET' },
    /* 10 */ { dict: '<< >>', stream: '0.6 0 0 rg 10 10 280 280 re f 1 g BT /F1 24 Tf 30 140 Td (Own MediaBox p3) Tj ET' },
  ]
  writeFileSync(join(corpusDir, 'inherited-attrs.pdf'), build(objs))
}
console.log('wrote markup-annots.pdf, inherited-attrs.pdf')
