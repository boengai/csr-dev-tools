use wasm_bindgen::prelude::*;

mod algorithms;
mod decode;
mod extensions;

/// Parse a PEM-encoded X.509 certificate and return a serialized CertificateDecodedDto as JSON, or Err(JsError) on parse failure.
#[wasm_bindgen]
pub fn parse_pem_certificate(pem: &str) -> Result<String, JsError> {
    let dto = decode::decode_pem(pem).map_err(|e| JsError::new(&e.to_string()))?;
    serde_json::to_string(&dto).map_err(|e| JsError::new(&e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_self_signed_rsa_fixture() {
        let pem = include_str!("../tests/fixtures/self_signed_rsa.pem");
        let json = parse_pem_certificate(pem).expect("fixture should parse");
        assert!(json.contains("test.example.com"));
        assert!(json.contains("\"publicKeyAlgorithm\":\"RSA\""));
        assert!(json.contains("\"publicKeySize\":2048"));
    }

    #[test]
    fn parses_short_lived_fixture() {
        let pem = include_str!("../tests/fixtures/short_lived.pem");
        let json = parse_pem_certificate(pem).expect("fixture should parse");
        assert!(json.contains("expired.example.com"));
    }

    // `parse_pem_certificate`'s error path constructs a `JsError`, which
    // panics on non-wasm targets. Exercise the same failure mode through
    // `decode::decode_pem` instead so this test is host-runnable.
    #[test]
    fn rejects_garbage_input() {
        assert!(decode::decode_pem("this is not a certificate").is_err());
    }
}
