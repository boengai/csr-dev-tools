use lopdf::encryption::EncryptionState;
use lopdf::{Dictionary, Document, Object, Stream};
use wasm_bindgen::prelude::*;

/// Why a PDF could not be turned into an unencrypted one.
#[derive(Debug, PartialEq, Eq)]
pub enum DecryptError {
    /// The bytes are not a PDF lopdf can read, or it could not write them back.
    Unreadable,
    /// The file is encrypted and the empty password does not open it.
    PasswordRequired,
    /// A stream names its own crypt filter in a form lopdf does not read, so
    /// it would come out still encrypted.
    UnsupportedCryptFilter,
}

impl DecryptError {
    fn message(&self) -> &'static str {
        match self {
            DecryptError::Unreadable => "not a readable PDF",
            DecryptError::PasswordRequired => "the PDF needs a password",
            DecryptError::UnsupportedCryptFilter => {
                "the PDF uses encryption this tool can't remove"
            }
        }
    }
}

/// Rewrite a PDF without its encryption.
///
/// lopdf decrypts with the empty user password while it loads, which covers
/// the common "owner password only" files. A file that needs a real user
/// password stays encrypted after the load and is reported, never written out.
///
/// lopdf reads a stream's own `/Crypt` filter only from a direct `/DecodeParms`
/// dictionary. Given any other form, or none, it decrypts the stream with the
/// document default, which scrambles a stream meant for another filter (a
/// clear `/Identity` one, say). Such a file is reported, not written out.
pub fn decrypt(bytes: &[u8]) -> Result<Vec<u8>, DecryptError> {
    let mut doc = Document::load_mem(bytes).map_err(|_| DecryptError::Unreadable)?;
    if doc.is_encrypted() {
        return Err(DecryptError::PasswordRequired);
    }
    if has_unread_crypt_filter(&doc) {
        return Err(DecryptError::UnsupportedCryptFilter);
    }
    doc.trailer.remove(b"Encrypt");
    let mut out = Vec::new();
    doc.save_to(&mut out)
        .map_err(|_| DecryptError::Unreadable)?;
    Ok(out)
}

const IDENTITY: &[u8] = b"Identity";

/// Whether lopdf decrypted any stream with a crypt filter other than its own.
/// A file that was not encrypted was not decrypted, so nothing changed.
fn has_unread_crypt_filter(doc: &Document) -> bool {
    let Some(state) = doc.encryption_state.as_ref() else {
        return false;
    };
    let default = default_stream_filter(state);
    doc.objects
        .values()
        .filter_map(|object| object.as_stream().ok())
        .any(|stream| crypt_filter_unread(stream, default))
}

/// The name of the filter lopdf decrypts a stream with when it does not read
/// the stream's own: the document default. `None` when no stream can name it
/// (RC4 below V4, or a default missing from `/CF`, which lopdf runs as RC4).
fn default_stream_filter(state: &EncryptionState) -> Option<&[u8]> {
    if state.version() < 4 {
        return None;
    }
    let name = state.default_stream_filter();
    if name.is_empty() || name == IDENTITY {
        return Some(IDENTITY);
    }
    state.crypt_filters().contains_key(name).then_some(name)
}

/// Whether lopdf decrypts this stream with `default` although its `/Crypt`
/// filter names another (or one this can't resolve, as a reference).
fn crypt_filter_unread(stream: &Stream, default: Option<&[u8]>) -> bool {
    let Ok(filters) = stream.filters() else {
        return false;
    };
    let Some(index) = filters.iter().position(|name| *name == b"Crypt") else {
        return false;
    };
    let own = match stream.dict.get(b"DecodeParms") {
        // The form lopdf reads.
        Ok(Object::Dictionary(_)) => return false,
        // No parameters for the crypt filter means Identity.
        Err(_) => Some(IDENTITY),
        Ok(Object::Array(params)) => match params.get(index) {
            None | Some(Object::Null) => Some(IDENTITY),
            Some(Object::Dictionary(params)) => Some(filter_name(params)),
            Some(_) => None,
        },
        Ok(_) => None,
    };
    own.is_none() || own != default
}

/// The crypt filter a `/Crypt` parameter dictionary names; Identity when none.
fn filter_name(params: &Dictionary) -> &[u8] {
    params
        .get(b"Name")
        .and_then(Object::as_name)
        .unwrap_or(IDENTITY)
}

/// Rewrite a PDF without its encryption. Throws when the file is unreadable,
/// needs a password, or uses a crypt filter lopdf would leave encrypted.
#[wasm_bindgen]
pub fn decrypt_pdf(bytes: &[u8]) -> Result<Vec<u8>, JsError> {
    decrypt(bytes).map_err(|e| JsError::new(e.message()))
}

#[cfg(test)]
mod tests {
    use super::*;

    const PLAIN: &[u8] = include_bytes!("../../../../src/test/fixtures/pdf/plain.pdf");
    const RC4_128: &[u8] = include_bytes!("../../../../src/test/fixtures/pdf/rc4-128.pdf");
    const AES_128: &[u8] = include_bytes!("../../../../src/test/fixtures/pdf/aes-128.pdf");
    const AES_256: &[u8] = include_bytes!("../../../../src/test/fixtures/pdf/aes-256-objstm.pdf");
    const LOCKED: &[u8] = include_bytes!("../../../../src/test/fixtures/pdf/locked.pdf");

    /// The decoded content stream of page 1, as text.
    fn page_one_content(pdf: &[u8]) -> String {
        let doc = Document::load_mem(pdf).unwrap();
        let page = *doc.get_pages().get(&1).unwrap();
        String::from_utf8_lossy(&doc.get_page_content(page)).into_owned()
    }

    /// Whether the raw bytes name an encryption dictionary. lopdf drops the
    /// trailer entry as it loads, so this reads the file itself.
    fn has_encrypt(pdf: &[u8]) -> bool {
        pdf.windows(8).any(|w| w == b"/Encrypt")
    }

    #[test]
    fn decrypts_every_empty_password_scheme() {
        let expected = page_one_content(PLAIN);
        assert!(expected.contains("Tj"), "fixture page 1 should draw text");
        for (name, bytes) in [
            ("rc4-128", RC4_128),
            ("aes-128", AES_128),
            ("aes-256", AES_256),
        ] {
            assert!(has_encrypt(bytes), "{name} fixture should be encrypted");
            let out = decrypt(bytes).unwrap();
            assert!(!has_encrypt(&out), "{name} output should carry no /Encrypt");
            assert_eq!(page_one_content(&out), expected, "{name}");
        }
    }

    #[test]
    fn leaves_a_plain_pdf_readable() {
        let out = decrypt(PLAIN).unwrap();
        assert_eq!(page_one_content(&out), page_one_content(PLAIN));
    }

    #[test]
    fn reports_a_file_that_needs_a_password() {
        assert_eq!(decrypt(LOCKED), Err(DecryptError::PasswordRequired));
    }

    /// A stream filtered by `/Crypt` with the given `/DecodeParms`.
    fn crypt_stream(params: Object) -> Stream {
        let mut dict = Dictionary::new();
        dict.set(
            "Filter",
            Object::Array(vec![Object::Name(b"Crypt".to_vec())]),
        );
        dict.set("DecodeParms", params);
        Stream::new(dict, b"ciphertext".to_vec())
    }

    fn named(filter: &str) -> Object {
        let mut dict = Dictionary::new();
        dict.set("Name", Object::Name(filter.as_bytes().to_vec()));
        Object::Dictionary(dict)
    }

    const STD_CF: Option<&[u8]> = Some(b"StdCF");

    #[test]
    fn flags_a_stream_lopdf_would_decrypt_with_another_filter() {
        // Its own filter is Identity, but lopdf applies the default.
        for params in [
            Object::Array(vec![named("Identity")]),
            Object::Array(vec![Object::Null]),
        ] {
            assert!(crypt_filter_unread(&crypt_stream(params), STD_CF));
        }
        let mut bare = crypt_stream(Object::Null);
        bare.dict.remove(b"DecodeParms");
        assert!(crypt_filter_unread(&bare, STD_CF));
        // Named in an array, but not the default.
        assert!(crypt_filter_unread(
            &crypt_stream(Object::Array(vec![named("StdCF")])),
            Some(IDENTITY)
        ));
        // Below V4 the default is RC4, which no stream names.
        assert!(crypt_filter_unread(
            &crypt_stream(Object::Array(vec![named("Identity")])),
            None
        ));
        // A reference is not followed.
        assert!(crypt_filter_unread(
            &crypt_stream(Object::Reference((9, 0))),
            STD_CF
        ));
    }

    #[test]
    fn passes_a_stream_lopdf_decrypts_with_its_own_filter() {
        // The form lopdf reads.
        assert!(!crypt_filter_unread(
            &crypt_stream(named("Identity")),
            STD_CF
        ));
        // Another form, naming the default lopdf applies anyway.
        assert!(!crypt_filter_unread(
            &crypt_stream(Object::Array(vec![named("StdCF")])),
            STD_CF
        ));
        assert!(!crypt_filter_unread(
            &crypt_stream(Object::Array(vec![Object::Null])),
            Some(IDENTITY)
        ));
    }

    /// RC4 by default (V4), with page 1's content left clear and exempted by
    /// `/Identity` in a `/DecodeParms` array. qpdf reads page 1 intact.
    const RC4_IDENTITY_ARRAY: &[u8] =
        include_bytes!("../../../../src/test/fixtures/pdf/rc4-identity-array.pdf");

    #[test]
    fn reports_a_clear_stream_lopdf_would_decrypt_with_the_default_filter() {
        assert_eq!(
            decrypt(RC4_IDENTITY_ARRAY),
            Err(DecryptError::UnsupportedCryptFilter)
        );
    }

    #[test]
    fn reports_bytes_that_are_not_a_pdf() {
        assert_eq!(decrypt(b"not a pdf"), Err(DecryptError::Unreadable));
    }
}
