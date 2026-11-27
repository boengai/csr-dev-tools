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
/// lopdf reads a stream's own `/Crypt` filter only from a `/DecodeParms`
/// dictionary. Given any other form it falls back to the document default and
/// can leave the stream encrypted, so such a file is reported, not written out.
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

/// Whether any stream names a crypt filter, other than Identity, in a form lopdf
/// does not read (a `/DecodeParms` array or reference).
fn has_unread_crypt_filter(doc: &Document) -> bool {
    doc.objects
        .values()
        .filter_map(|object| object.as_stream().ok())
        .any(crypt_filter_unread)
}

fn crypt_filter_unread(stream: &Stream) -> bool {
    let Ok(filters) = stream.filters() else {
        return false;
    };
    let Some(index) = filters.iter().position(|name| *name == b"Crypt") else {
        return false;
    };
    match stream.dict.get(b"DecodeParms") {
        // No parameters means Identity; a dictionary is the form lopdf reads.
        Err(_) | Ok(Object::Dictionary(_)) => false,
        Ok(Object::Array(params)) => match params.get(index) {
            None | Some(Object::Null) => false,
            Some(Object::Dictionary(dict)) => names_a_real_filter(dict),
            Some(_) => true,
        },
        Ok(_) => true,
    }
}

fn names_a_real_filter(params: &Dictionary) -> bool {
    params
        .get(b"Name")
        .and_then(Object::as_name)
        .is_ok_and(|name| name != b"Identity")
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

    #[test]
    fn flags_a_crypt_filter_named_in_a_params_array() {
        assert!(crypt_filter_unread(&crypt_stream(Object::Array(vec![
            named("StdCF")
        ]))));
        assert!(crypt_filter_unread(&crypt_stream(Object::Reference((
            9, 0
        )))));
    }

    #[test]
    fn passes_the_crypt_filters_lopdf_reads_or_that_change_nothing() {
        assert!(!crypt_filter_unread(&crypt_stream(named("StdCF"))));
        assert!(!crypt_filter_unread(&crypt_stream(Object::Array(vec![
            named("Identity")
        ]))));
        assert!(!crypt_filter_unread(&crypt_stream(Object::Array(vec![
            Object::Null
        ]))));
        let mut bare = crypt_stream(Object::Null);
        bare.dict.remove(b"DecodeParms");
        assert!(!crypt_filter_unread(&bare));
    }

    #[test]
    fn reports_a_document_with_an_unread_crypt_filter() {
        let mut doc = Document::load_mem(PLAIN).unwrap();
        doc.add_object(crypt_stream(Object::Array(vec![named("StdCF")])));
        let mut bytes = Vec::new();
        doc.save_to(&mut bytes).unwrap();
        assert_eq!(decrypt(&bytes), Err(DecryptError::UnsupportedCryptFilter));
    }

    #[test]
    fn reports_bytes_that_are_not_a_pdf() {
        assert_eq!(decrypt(b"not a pdf"), Err(DecryptError::Unreadable));
    }
}
