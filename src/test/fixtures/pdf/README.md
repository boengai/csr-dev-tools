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
