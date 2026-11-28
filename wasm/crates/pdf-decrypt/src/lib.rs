use std::collections::BTreeSet;

use lopdf::encryption::EncryptionState;
use lopdf::xref::XrefEntry;
use lopdf::{Dictionary, Document, Object, Stream};
use wasm_bindgen::prelude::*;

/// Why a PDF could not be turned into an unencrypted one.
#[derive(Debug, PartialEq, Eq)]
pub enum DecryptError {
    /// The bytes are not a PDF lopdf can read, or it could not write them back.
    Unreadable,
    /// The file is encrypted and the empty password does not open it.
    PasswordRequired,
    /// lopdf would decrypt a stream with the document default instead of its
    /// own crypt filter, so it would come out scrambled or still encrypted.
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
    let doc = Document::load_mem(bytes).map_err(|_| DecryptError::Unreadable)?;
    if doc.is_encrypted() {
        return Err(DecryptError::PasswordRequired);
    }
    if has_object_stream_lopdf_cannot_unpack(&doc) || has_stream_decrypted_with_wrong_filter(&doc) {
        return Err(DecryptError::UnsupportedCryptFilter);
    }
    write_decrypted(doc)
}

/// Writes a document lopdf decrypted as it loaded. Each stream's `/Crypt`
/// stage goes too: lopdf has applied it, and the output has no `/Encrypt`
/// to define the filter it names.
fn write_decrypted(mut doc: Document) -> Result<Vec<u8>, DecryptError> {
    if doc.encryption_state.is_some() {
        for object in doc.objects.values_mut() {
            if let Object::Stream(stream) = object {
                remove_crypt_stage(&mut stream.dict);
            }
        }
    }
    doc.trailer.remove(b"Encrypt");
    let mut out = Vec::new();
    doc.save_to(&mut out)
        .map_err(|_| DecryptError::Unreadable)?;
    Ok(out)
}

fn is_crypt(filter: &Object) -> bool {
    filter.as_name().is_ok_and(|name| name == b"Crypt")
}

/// Removes `/Crypt` from a stream's filters, with the parameters it had.
fn remove_crypt_stage(dict: &mut Dictionary) {
    let mut filters = match dict.get(b"Filter") {
        Ok(Object::Array(filters)) => filters.clone(),
        Ok(filter) if is_crypt(filter) => vec![filter.clone()],
        _ => return,
    };
    let Some(index) = filters.iter().position(is_crypt) else {
        return;
    };
    filters.remove(index);
    match dict.get(b"DecodeParms") {
        Ok(Object::Array(params)) => {
            let mut params = params.clone();
            if index < params.len() {
                params.remove(index);
            }
            if params.iter().all(|p| matches!(p, Object::Null)) {
                dict.remove(b"DecodeParms");
            } else {
                dict.set("DecodeParms", Object::Array(params));
            }
        }
        // lopdf read a dictionary as the crypt filter's.
        Ok(Object::Dictionary(_)) => {
            dict.remove(b"DecodeParms");
        }
        _ => {}
    }
    if filters.is_empty() {
        dict.remove(b"Filter");
    } else {
        dict.set("Filter", Object::Array(filters));
    }
}

const IDENTITY: &[u8] = b"Identity";

/// Whether lopdf decrypted any stream with a crypt filter other than its own.
/// A file that was not encrypted was not decrypted, so nothing changed.
fn has_stream_decrypted_with_wrong_filter(doc: &Document) -> bool {
    let Some(state) = doc.encryption_state.as_ref() else {
        return false;
    };
    doc.objects
        .values()
        .filter_map(|object| object.as_stream().ok())
        .any(|stream| decrypted_with_wrong_filter(stream, state))
}

/// Whether an object stream the file still uses has a `/Crypt` filter. lopdf
/// can't decode that filter, so it couldn't unpack the stream, and the objects
/// in it are lost. One an incremental save superseded holds nothing current.
fn has_object_stream_lopdf_cannot_unpack(doc: &Document) -> bool {
    let in_use: BTreeSet<u32> = doc
        .reference_table
        .entries
        .values()
        .filter_map(|entry| match entry {
            XrefEntry::Compressed { container, .. } => Some(*container),
            _ => None,
        })
        .collect();
    doc.objects
        .iter()
        .filter(|((id, _), _)| in_use.contains(id))
        .filter_map(|(_, object)| object.as_stream().ok())
        .any(|stream| {
            stream
                .filters()
                .is_ok_and(|filters| filters.contains(&&b"Crypt"[..]))
        })
}

/// lopdf leaves a cross-reference stream as it is, and a metadata stream
/// too when the file keeps its metadata clear (`/EncryptMetadata false`).
fn lopdf_decrypts(stream: &Stream, state: &EncryptionState) -> bool {
    !stream.dict.has_type(b"XRef")
        && (state.encrypt_metadata() || !stream.dict.has_type(b"Metadata"))
}

/// What a crypt filter a stream names does to the bytes: its method (`/CFM`,
/// Identity when absent). Filters with one method give the same bytes, since
/// all use the file key. `None` for a name missing from `/CF`, the empty
/// name included: only an empty default means Identity.
fn filter_method<'a>(state: &'a EncryptionState, name: &[u8]) -> Option<&'a [u8]> {
    if name == IDENTITY {
        return Some(IDENTITY);
    }
    state
        .crypt_filters()
        .get(name)
        .map(|filter| filter.method())
}

/// The method lopdf applies to a stream whose own filter it does not read:
/// the document default's, Identity when it is empty. `None` when no stream
/// can name it (RC4 below V4, or a default missing from `/CF`, which lopdf
/// runs as RC4).
fn default_stream_method(state: &EncryptionState) -> Option<&[u8]> {
    if state.version() < 4 {
        return None;
    }
    let name = state.default_stream_filter();
    if name.is_empty() {
        return Some(IDENTITY);
    }
    filter_method(state, name)
}

/// The method a `/Crypt` parameter dictionary asks for: Identity when it
/// names none (a null entry is an absent one). `None` for an indirect name,
/// which is not followed.
fn named_method<'a>(state: &'a EncryptionState, params: &Dictionary) -> Option<&'a [u8]> {
    match params.get(b"Name") {
        Err(_) | Ok(Object::Null) => Some(IDENTITY),
        Ok(Object::Name(name)) => filter_method(state, name),
        Ok(_) => None,
    }
}

/// Whether lopdf left this stream decrypted with another method than its
/// `/Crypt` filter asks for (or one this can't resolve, as a reference).
fn decrypted_with_wrong_filter(stream: &Stream, state: &EncryptionState) -> bool {
    let Ok(filters) = stream.filters() else {
        return false;
    };
    let Some(index) = filters.iter().position(|name| *name == b"Crypt") else {
        return false;
    };
    let decrypts = lopdf_decrypts(stream, state);
    let own = match stream.dict.get(b"DecodeParms") {
        // The form lopdf reads, on a stream it decrypts, unless the name is
        // indirect: lopdf reads that as Identity.
        Ok(Object::Dictionary(params)) if decrypts => {
            return named_method(state, params).is_none();
        }
        Ok(Object::Dictionary(params)) => named_method(state, params),
        // No parameters for the crypt filter (or null ones) means Identity.
        Err(_) | Ok(Object::Null) => Some(IDENTITY),
        Ok(Object::Array(params)) => match params.get(index) {
            None | Some(Object::Null) => Some(IDENTITY),
            Some(Object::Dictionary(params)) => named_method(state, params),
            Some(_) => None,
        },
        Ok(_) => None,
    };
    // A stream lopdf skips keeps its bytes, as Identity would.
    let applied = if decrypts {
        default_stream_method(state)
    } else {
        Some(IDENTITY)
    };
    own.is_none() || own != applied
}

/// Rewrite a PDF without its encryption. Throws when the file is unreadable,
/// needs a password, or has a stream lopdf would decrypt with the wrong filter.
#[wasm_bindgen]
pub fn decrypt_pdf(bytes: &[u8]) -> Result<Vec<u8>, JsError> {
    decrypt(bytes).map_err(|e| JsError::new(e.message()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use lopdf::encryption::crypt_filters::{CryptFilter, IdentityCryptFilter, Rc4CryptFilter};
    use lopdf::{EncryptionVersion, Permissions};
    use std::sync::Arc;

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

    /// `[<< /Name 9 0 R >>]`: the filter's name is an indirect object.
    fn indirect_name() -> Object {
        let mut dict = Dictionary::new();
        dict.set("Name", Object::Reference((9, 0)));
        Object::Array(vec![Object::Dictionary(dict)])
    }

    fn in_array(params: Object) -> Object {
        Object::Array(vec![params])
    }

    /// A V4 state with these `/CF` filters and this `/StmF` default.
    fn v4(filters: Vec<(&str, Arc<dyn CryptFilter>)>, stream_filter: &str) -> EncryptionState {
        v4_metadata(filters, stream_filter, true)
    }

    fn v4_metadata(
        filters: Vec<(&str, Arc<dyn CryptFilter>)>,
        stream_filter: &str,
        encrypt_metadata: bool,
    ) -> EncryptionState {
        let doc = Document::load_mem(AES_128).unwrap();
        EncryptionState::try_from(EncryptionVersion::V4 {
            document: &doc,
            encrypt_metadata,
            crypt_filters: filters
                .into_iter()
                .map(|(name, filter)| (name.as_bytes().to_vec(), filter))
                .collect(),
            stream_filter: stream_filter.as_bytes().to_vec(),
            string_filter: b"StdCF".to_vec(),
            owner_password: "owner",
            user_password: "",
            permissions: Permissions::default(),
        })
        .unwrap()
    }

    fn rc4() -> Arc<dyn CryptFilter> {
        Arc::new(Rc4CryptFilter)
    }

    fn clear() -> Arc<dyn CryptFilter> {
        Arc::new(IdentityCryptFilter)
    }

    #[test]
    fn flags_a_stream_lopdf_would_decrypt_with_another_filter() {
        let std_cf = v4(vec![("StdCF", rc4())], "StdCF");
        // Its own filter is Identity, but lopdf applies the RC4 default.
        let mut bare = crypt_stream(Object::Null);
        bare.dict.remove(b"DecodeParms");
        for stream in [
            crypt_stream(in_array(named("Identity"))),
            crypt_stream(in_array(Object::Null)),
            bare,
        ] {
            assert!(decrypted_with_wrong_filter(&stream, &std_cf));
        }
        // A name missing from /CF, and references, are not resolved.
        for params in [
            in_array(named("Other")),
            Object::Reference((9, 0)),
            indirect_name(),
        ] {
            assert!(decrypted_with_wrong_filter(&crypt_stream(params), &std_cf));
        }
        // Named in an array, but lopdf applies the Identity default.
        let identity_default = v4(vec![("StdCF", rc4())], "Identity");
        for params in [in_array(named("StdCF")), indirect_name()] {
            assert!(decrypted_with_wrong_filter(
                &crypt_stream(params),
                &identity_default
            ));
        }
    }

    #[test]
    fn passes_a_stream_lopdf_decrypts_as_its_own_filter_would() {
        let std_cf = v4(vec![("StdCF", rc4()), ("AlsoRc4", rc4())], "StdCF");
        // The form lopdf reads.
        assert!(!decrypted_with_wrong_filter(
            &crypt_stream(named("Identity")),
            &std_cf
        ));
        // Another form, naming the default, or a filter that runs the same way.
        for params in [in_array(named("StdCF")), in_array(named("AlsoRc4"))] {
            assert!(!decrypted_with_wrong_filter(&crypt_stream(params), &std_cf));
        }
        let identity_default = v4(vec![("StdCF", rc4())], "Identity");
        assert!(!decrypted_with_wrong_filter(
            &crypt_stream(in_array(Object::Null)),
            &identity_default
        ));
        // A default with no /CFM changes nothing, as Identity doesn't.
        let clear_default = v4(vec![("StdCF", rc4()), ("ClearCF", clear())], "ClearCF");
        assert!(!decrypted_with_wrong_filter(
            &crypt_stream(in_array(named("Identity"))),
            &clear_default
        ));
    }

    #[test]
    fn resolves_an_explicit_empty_name_through_cf() {
        // `/Name /` is a name like any other; only an empty default means Identity.
        let empty_rc4 = v4(vec![("", rc4())], "Identity");
        assert!(decrypted_with_wrong_filter(
            &crypt_stream(in_array(named(""))),
            &empty_rc4
        ));
        let undeclared = v4(vec![("StdCF", rc4())], "Identity");
        assert!(decrypted_with_wrong_filter(
            &crypt_stream(in_array(named(""))),
            &undeclared
        ));
        let empty_default = v4(vec![("StdCF", rc4())], "");
        assert!(!decrypted_with_wrong_filter(
            &crypt_stream(in_array(Object::Null)),
            &empty_default
        ));
    }

    #[test]
    fn flags_metadata_lopdf_leaves_encrypted() {
        // Under /EncryptMetadata false lopdf skips metadata, so it applies Identity.
        let clear_metadata = v4_metadata(vec![("StdCF", rc4())], "StdCF", false);
        let metadata = |params| {
            let mut stream = crypt_stream(params);
            stream.dict.set("Type", Object::Name(b"Metadata".to_vec()));
            stream
        };
        assert!(decrypted_with_wrong_filter(
            &metadata(in_array(named("StdCF"))),
            &clear_metadata
        ));
        // A null entry is an absent one: no parameters, or no name, means Identity.
        let mut null_name = Dictionary::new();
        null_name.set("Name", Object::Null);
        for params in [
            in_array(Object::Null),
            Object::Null,
            Object::Dictionary(null_name.clone()),
            in_array(Object::Dictionary(null_name)),
        ] {
            assert!(!decrypted_with_wrong_filter(
                &metadata(params),
                &clear_metadata
            ));
        }
    }

    #[test]
    fn flags_an_indirect_name_in_the_form_lopdf_reads() {
        // lopdf reads a referenced /Name as Identity, so a StdCF stream stays encrypted.
        let std_cf = v4(vec![("StdCF", rc4())], "StdCF");
        let mut dict = Dictionary::new();
        dict.set("Name", Object::Reference((9, 0)));
        assert!(decrypted_with_wrong_filter(
            &crypt_stream(Object::Dictionary(dict)),
            &std_cf
        ));
    }

    #[test]
    fn reports_an_object_stream_lopdf_cannot_unpack() {
        // lopdf can't decode a /Crypt filter, so the objects inside would be lost.
        let mut doc = Document::load_mem(PLAIN).unwrap();
        let mut dict = Dictionary::new();
        dict.set("Type", Object::Name(b"ObjStm".to_vec()));
        dict.set(
            "Filter",
            Object::Array(vec![
                Object::Name(b"Crypt".to_vec()),
                Object::Name(b"FlateDecode".to_vec()),
            ]),
        );
        dict.set("DecodeParms", named("Identity"));
        let (container, _) = doc.add_object(Stream::new(dict, b"x".to_vec()));
        // Superseded by an incremental save: no current entry points into it.
        assert!(!has_object_stream_lopdf_cannot_unpack(&doc));
        doc.reference_table.entries.insert(
            99,
            XrefEntry::Compressed {
                container,
                index: 0,
            },
        );
        assert!(has_object_stream_lopdf_cannot_unpack(&doc));
        // Object streams lopdf unpacked, as AES-256 has, are fine.
        let objstm = Document::load_mem(AES_256).unwrap();
        // Its containers stay loaded, and the xref still points into them.
        let used = objstm
            .reference_table
            .entries
            .values()
            .find_map(|e| match e {
                XrefEntry::Compressed { container, .. } => Some(*container),
                _ => None,
            });
        let container = used.expect("AES-256 fixture should use an object stream");
        assert!(
            objstm
                .get_object((container, 0))
                .unwrap()
                .as_stream()
                .unwrap()
                .dict
                .has_type(b"ObjStm")
        );
        assert!(!has_object_stream_lopdf_cannot_unpack(&objstm));
    }

    #[test]
    fn flags_a_crypt_filter_below_v4() {
        // RC4-128 is V2: no crypt filters, so RC4 is applied whatever a stream names.
        let mut doc = Document::load_mem(RC4_128).unwrap();
        assert!(!has_stream_decrypted_with_wrong_filter(&doc));
        doc.add_object(crypt_stream(in_array(named("Identity"))));
        assert!(has_stream_decrypted_with_wrong_filter(&doc));
    }

    #[test]
    fn ignores_streams_lopdf_never_decrypts() {
        // AES-128: lopdf decrypted it while loading, with StdCF by default.
        let mut doc = Document::load_mem(AES_128).unwrap();
        assert!(!has_stream_decrypted_with_wrong_filter(&doc));
        let mut xref = crypt_stream(Object::Null);
        xref.dict.remove(b"DecodeParms");
        xref.dict.set("Type", Object::Name(b"XRef".to_vec()));
        doc.add_object(xref);
        assert!(!has_stream_decrypted_with_wrong_filter(&doc));
    }

    #[test]
    fn drops_the_crypt_stage_lopdf_has_applied() {
        // AES-128 decrypts streams with StdCF; one stream names it in an array.
        let mut doc = Document::load_mem(AES_128).unwrap();
        let mut dict = Dictionary::new();
        dict.set(
            "Filter",
            Object::Array(vec![
                Object::Name(b"Crypt".to_vec()),
                Object::Name(b"FlateDecode".to_vec()),
            ]),
        );
        dict.set(
            "DecodeParms",
            Object::Array(vec![named("StdCF"), Object::Null]),
        );
        let id = doc.add_object(Stream::new(dict, b"x".to_vec()));
        let mut only = Dictionary::new();
        only.set("Filter", Object::Name(b"Crypt".to_vec()));
        only.set("DecodeParms", named("StdCF"));
        let only_id = doc.add_object(Stream::new(only, b"y".to_vec()));

        let out = Document::load_mem(&write_decrypted(doc).unwrap()).unwrap();
        let dict = &out.get_object(id).unwrap().as_stream().unwrap().dict;
        assert_eq!(
            dict.get(b"Filter").unwrap(),
            &Object::Array(vec![Object::Name(b"FlateDecode".to_vec())])
        );
        assert!(dict.get(b"DecodeParms").is_err());
        let only = &out.get_object(only_id).unwrap().as_stream().unwrap().dict;
        assert!(only.get(b"Filter").is_err());
        assert!(only.get(b"DecodeParms").is_err());
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
