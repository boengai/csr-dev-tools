# ADR 0037 — Combine PDF decrypts its inputs with lopdf, in its own WASM crate

- **Status:** Accepted
- **Date:** 2026-11-27

Numbers 0031–0036 are taken by ADRs on `develop` and in open pull requests.

## Context

Combine PDF wrote blank pages for every input encrypted with an empty user
password ([#61](https://github.com/boengai/csr-dev-tools/issues/61)). Files
with only an owner password are common: ISO 32000 itself is one.

pdf-lib 1.17.1 cannot decrypt. `combinePdfPages` loaded each source with
`ignoreEncryption: true` and copied the still-encrypted streams into an
output with no `/Encrypt`. A file with a real user password became a blank
page the same way, and an encrypted file with object streams failed the
whole merge. The thumbnails looked right throughout, because pdf.js decrypts.

## Decision

1. **A `pdf-decrypt` crate** (`wasm/crates/pdf-decrypt`, lopdf 0.47.0)
   rewrites a PDF without its encryption. It tries the empty user password
   only. A file that needs a real password is an error, never an output.
2. **pdf-lib still does the merge.** `combinePdfPages` loads each source
   strictly, without `ignoreEncryption`. A source that fails goes through
   the decrypt step and is loaded strictly again. A document that still
   declares `/Encrypt` therefore never reaches `copyPages`.
3. **A file that can't be decrypted lands in `skipped`**, and
   `SortablePdfShell` now names the pipeline's skipped files in its status
   slot. It used to name only the files the upload rejected.
   A decrypt step that fails to load (offline, a failed fetch) is not a
   property of the file: the merge fails with an error instead, so no
   download is offered with a file quietly missing.
4. **The crate returns bytes** (`Vec<u8>`, thrown `JsError`). It is the
   second crate to leave the string convention of [[ADR 0018]], after
   `pdf` in [[ADR 0022]]. The rule that comes out of the two: a crate
   whose output is a binary file returns the bytes; everything else keeps
   the string return.
5. **The decrypted bytes are kept per `File`** in a `WeakMap`, because the
   merge reruns on every re-order and decrypting ISO 32000 (22 MB, 756
   pages) takes seconds.

## Considered

- **Skip encrypted inputs with a warning.** Small, but it loses files that
  every PDF reader opens without asking.
- **A pdf-lib fork that decrypts.** It would replace the engine under
  `image-to-pdf` as well, or ship a second copy of pdf-lib beside the
  first. Not measured.
- **Hand-written RC4 and AES over pdf-lib's parsed objects.** pdf-lib has
  already tried to read the encrypted object streams by then.
- **lopdf for the whole merge.** The #43 trial turned that down on bytes
  and on what it drops. Decrypting only keeps pdf-lib's behaviour for
  everything else.

## Consequences

- **Bytes:** `pdf-decrypt_bg.wasm` is 713 KB, 331 KB gzipped. It is fetched
  only when a source fails pdf-lib's strict load, so a merge of plain PDFs
  pays nothing.
- **A broken but unencrypted PDF** also goes through lopdf now. If lopdf
  can read it, it is merged where it used to be skipped.
- **Unusual crypt filters:** lopdf reads a stream's own `/Crypt` filter
  only from a direct `/DecodeParms` dictionary. Given an array, a
  reference or no parameters at all (which means Identity), it decrypts the
  stream with the document default instead. Unless the default runs the
  same method (`/CFM`; none means Identity) as the stream's own filter, the
  stream comes out scrambled or still encrypted, so the crate reports such a
  file and the merge skips it by name (issue 69: a clear stream marked
  Identity in an array was scrambled). An indirect filter name is not
  followed, so it is reported too. None was seen in RC4-128, AES-128,
  AES-256 or ISO 32000.
- **The `/Crypt` stage is dropped on write.** lopdf has applied it, and the
  output has no `/Encrypt` to define the filter it names, so a strict reader
  would fail on it.
- **Non-empty passwords are not asked for.** The upload already rejects
  such a file, because pdf.js cannot draw its thumbnails.
- **Attachment-only encryption is skipped.** A file that encrypts only its
  attachments (`StmF` and `StrF` Identity, `AuthEvent /EFOpen`) opens in
  pdf.js without a password, so it shows page cards, but lopdf needs the
  password, so the merge skips it by name. The old `ignoreEncryption` path
  copied its clear pages.
- **Memory:** an encrypted file is held about three times while it loads
  (source, decrypted bytes, parsed document), and its decrypted bytes stay
  until the file is removed.

## Revisit when

- A user needs to merge a file with a real user password: add a password
  prompt and pass the password to lopdf.
- The Dioxus port reaches Combine PDF: its engine choice (ADR-0033 on
  `develop`) decides whether this crate carries over.
