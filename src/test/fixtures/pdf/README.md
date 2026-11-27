# PDF fixtures

Two-page PDFs whose page 1 reads `Encrypted fixture page one`. `plain.pdf` was
written by pdf-lib; the rest are `plain.pdf` encrypted by qpdf 12.4.2:

| File                 | Command                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `rc4-128.pdf`        | `qpdf --allow-weak-crypto --encrypt "" owner 128 --use-aes=n -- plain.pdf rc4-128.pdf`  |
| `aes-128.pdf`        | `qpdf --encrypt "" owner 128 --use-aes=y -- plain.pdf aes-128.pdf`                      |
| `aes-256-objstm.pdf` | `qpdf --object-streams=generate --encrypt "" owner 256 -- plain.pdf aes-256-objstm.pdf` |
| `locked.pdf`         | `qpdf --encrypt user owner 256 -- plain.pdf locked.pdf`                                 |

All but `locked.pdf` have an empty user password (owner password only), so any
reader opens them. `locked.pdf` needs the user password `user`.

`rc4-identity-array.pdf` is RC4 by default (V4), with page 1's content left
clear: its `/Filter [/Crypt /FlateDecode]` has `/DecodeParms
[<< /Name /Identity >> null]`, which exempts it from the default. lopdf ignores
a crypt filter named in an array and would decrypt that clear stream with RC4.
`qpdf --check` passes and qpdf reads page 1 intact. It is an incremental update
written by `identity-update.mjs` over a qpdf-encrypted `plain.pdf`:

```sh
qpdf --allow-weak-crypto --encrypt "" owner 128 --use-aes=n --force-V4 -- plain.pdf rc4-v4.pdf
qpdf --show-object=6 --filtered-stream-data rc4-v4.pdf > page1.txt   # page 1's content stream
node identity-update.mjs rc4-v4.pdf page1.txt 6 rc4-identity-array.pdf
```
