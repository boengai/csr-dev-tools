use lopdf::Document;
use wasm_bindgen::prelude::*;

/// Why a PDF could not be turned into an unencrypted one.
#[derive(Debug, PartialEq, Eq)]
pub enum DecryptError {
    /// The bytes are not a PDF lopdf can read.
    Unreadable,
    /// The file is encrypted and the empty password does not open it.
    PasswordRequired,
}

impl DecryptError {
    fn message(&self) -> &'static str {
        match self {
            DecryptError::Unreadable => "not a readable PDF",
            DecryptError::PasswordRequired => "the PDF needs a password",
        }
    }
}

/// Rewrite a PDF without its encryption.
///
/// lopdf decrypts with the empty user password while it loads, which covers
/// the common "owner password only" files. A file that needs a real user
/// password stays encrypted after the load and is reported, never written out.
pub fn decrypt(bytes: &[u8]) -> Result<Vec<u8>, DecryptError> {
    let mut doc = Document::load_mem(bytes).map_err(|_| DecryptError::Unreadable)?;
    if doc.is_encrypted() {
        return Err(DecryptError::PasswordRequired);
    }
    doc.trailer.remove(b"Encrypt");
    let mut out = Vec::new();
    doc.save_to(&mut out)
        .map_err(|_| DecryptError::Unreadable)?;
    Ok(out)
}

/// Rewrite a PDF without its encryption. Throws when the file is unreadable
/// or needs a password.
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

    #[test]
    fn reports_bytes_that_are_not_a_pdf() {
        assert_eq!(decrypt(b"not a pdf"), Err(DecryptError::Unreadable));
    }
}
