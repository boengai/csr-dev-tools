use wasm_bindgen::prelude::*;

/// SHA-256 block size in bytes.
const SHA256_BLOCK_SIZE: usize = 64;

/// SHA-384 and SHA-512 block size in bytes.
const SHA512_BLOCK_SIZE: usize = 128;

/// Compute HMAC per RFC 2104.
///
/// - `key`: secret key bytes
/// - `message`: message bytes
/// - `hash_fn`: hash function that takes a byte slice and returns a `Vec<u8>`
/// - `block_size`: the hash function's internal block size in bytes
fn hmac(key: &[u8], message: &[u8], hash_fn: impl Fn(&[u8]) -> Vec<u8>, block_size: usize) -> Vec<u8> {
    // If key is longer than block size, hash it first.
    let mut key_block = if key.len() > block_size {
        let hashed = hash_fn(key);
        hashed
    } else {
        key.to_vec()
    };

    // Pad key to block_size with zeros.
    key_block.resize(block_size, 0x00);

    // Compute inner and outer padded keys.
    let ipad: Vec<u8> = key_block.iter().map(|&b| b ^ 0x36).collect();
    let opad: Vec<u8> = key_block.iter().map(|&b| b ^ 0x5c).collect();

    // Inner hash: H(ipad || message)
    let mut inner_input = ipad;
    inner_input.extend_from_slice(message);
    let inner_hash = hash_fn(&inner_input);

    // Outer hash: H(opad || inner_hash)
    let mut outer_input = opad;
    outer_input.extend_from_slice(&inner_hash);
    hash_fn(&outer_input)
}

/// SHA-256 wrapper returning Vec<u8>.
fn sha256_vec(data: &[u8]) -> Vec<u8> {
    shared::sha256::compute(data).to_vec()
}

/// SHA-384 wrapper returning Vec<u8>.
fn sha384_vec(data: &[u8]) -> Vec<u8> {
    shared::sha384::compute(data).to_vec()
}

/// SHA-512 wrapper returning Vec<u8>.
fn sha512_vec(data: &[u8]) -> Vec<u8> {
    shared::sha512::compute(data).to_vec()
}

/// Encode bytes as standard base64 with padding.
pub fn bytes_to_base64(bytes: &[u8]) -> String {
    const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    let mut output = String::with_capacity((bytes.len() + 2) / 3 * 4);
    let mut chunks = bytes.chunks_exact(3);

    for chunk in chunks.by_ref() {
        let b0 = chunk[0] as usize;
        let b1 = chunk[1] as usize;
        let b2 = chunk[2] as usize;
        output.push(ALPHABET[b0 >> 2] as char);
        output.push(ALPHABET[((b0 & 0x03) << 4) | (b1 >> 4)] as char);
        output.push(ALPHABET[((b1 & 0x0f) << 2) | (b2 >> 6)] as char);
        output.push(ALPHABET[b2 & 0x3f] as char);
    }

    let remainder = chunks.remainder();
    match remainder.len() {
        1 => {
            let b0 = remainder[0] as usize;
            output.push(ALPHABET[b0 >> 2] as char);
            output.push(ALPHABET[(b0 & 0x03) << 4] as char);
            output.push('=');
            output.push('=');
        }
        2 => {
            let b0 = remainder[0] as usize;
            let b1 = remainder[1] as usize;
            output.push(ALPHABET[b0 >> 2] as char);
            output.push(ALPHABET[((b0 & 0x03) << 4) | (b1 >> 4)] as char);
            output.push(ALPHABET[(b1 & 0x0f) << 2] as char);
            output.push('=');
        }
        _ => {}
    }

    output
}

/// Compute HMAC-SHA256 of `message` with `key`, returned as lowercase hex.
#[wasm_bindgen]
pub fn hmac_sha256(key: &str, message: &str) -> String {
    let digest = hmac(key.as_bytes(), message.as_bytes(), sha256_vec, SHA256_BLOCK_SIZE);
    shared::bytes_to_hex(&digest)
}

/// Compute HMAC-SHA384 of `message` with `key`, returned as lowercase hex.
#[wasm_bindgen]
pub fn hmac_sha384(key: &str, message: &str) -> String {
    let digest = hmac(key.as_bytes(), message.as_bytes(), sha384_vec, SHA512_BLOCK_SIZE);
    shared::bytes_to_hex(&digest)
}

/// Compute HMAC-SHA512 of `message` with `key`, returned as lowercase hex.
#[wasm_bindgen]
pub fn hmac_sha512(key: &str, message: &str) -> String {
    let digest = hmac(key.as_bytes(), message.as_bytes(), sha512_vec, SHA512_BLOCK_SIZE);
    shared::bytes_to_hex(&digest)
}

/// Compute HMAC-SHA256 of `message` with `key`, returned as base64.
#[wasm_bindgen]
pub fn hmac_sha256_base64(key: &str, message: &str) -> String {
    let digest = hmac(key.as_bytes(), message.as_bytes(), sha256_vec, SHA256_BLOCK_SIZE);
    bytes_to_base64(&digest)
}

/// Compute HMAC-SHA384 of `message` with `key`, returned as base64.
#[wasm_bindgen]
pub fn hmac_sha384_base64(key: &str, message: &str) -> String {
    let digest = hmac(key.as_bytes(), message.as_bytes(), sha384_vec, SHA512_BLOCK_SIZE);
    bytes_to_base64(&digest)
}

/// Compute HMAC-SHA512 of `message` with `key`, returned as base64.
#[wasm_bindgen]
pub fn hmac_sha512_base64(key: &str, message: &str) -> String {
    let digest = hmac(key.as_bytes(), message.as_bytes(), sha512_vec, SHA512_BLOCK_SIZE);
    bytes_to_base64(&digest)
}

#[cfg(test)]
mod tests {
    use super::*;

    // --- Critical test vectors ---

    #[test]
    fn hmac_sha256_secret_hello() {
        assert_eq!(
            hmac_sha256("secret", "hello"),
            "88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b"
        );
    }

    #[test]
    fn hmac_sha256_base64_secret_hello() {
        assert_eq!(
            hmac_sha256_base64("secret", "hello"),
            "iKqz7ejTrflNJquQ07r9SiCDBww7zOnAFO4EpEOEfAs="
        );
    }

    // --- Output length checks ---

    #[test]
    fn hmac_sha384_output_length() {
        let result = hmac_sha384("secret", "hello");
        assert_eq!(result.len(), 96, "SHA-384 HMAC must be 96 hex chars");
        assert!(result.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn hmac_sha512_output_length() {
        let result = hmac_sha512("secret", "hello");
        assert_eq!(result.len(), 128, "SHA-512 HMAC must be 128 hex chars");
        assert!(result.chars().all(|c| c.is_ascii_hexdigit()));
    }

    // --- Different keys produce different results ---

    #[test]
    fn different_keys_produce_different_results() {
        let r1 = hmac_sha256("key1", "hello");
        let r2 = hmac_sha256("key2", "hello");
        assert_ne!(r1, r2);
    }

    // --- Empty message ---

    #[test]
    fn hmac_sha256_empty_message() {
        let result = hmac_sha256("secret", "");
        assert_eq!(result.len(), 64);
        assert!(result.chars().all(|c| c.is_ascii_hexdigit()));
    }

    // --- Long key (> SHA-256 block size of 64 bytes) ---

    #[test]
    fn hmac_sha256_long_key() {
        let long_key = "a".repeat(128);
        let result = hmac_sha256(&long_key, "hello");
        assert_eq!(result.len(), 64);
        assert!(result.chars().all(|c| c.is_ascii_hexdigit()));
    }

    // --- Base64 helper ---

    #[test]
    fn base64_hello() {
        assert_eq!(bytes_to_base64(b"hello"), "aGVsbG8=");
    }

    #[test]
    fn base64_empty() {
        assert_eq!(bytes_to_base64(b""), "");
    }

    #[test]
    fn base64_one_byte() {
        assert_eq!(bytes_to_base64(b"M"), "TQ==");
    }

    #[test]
    fn base64_two_bytes() {
        assert_eq!(bytes_to_base64(b"Ma"), "TWE=");
    }

    #[test]
    fn base64_three_bytes() {
        assert_eq!(bytes_to_base64(b"Man"), "TWFu");
    }
}
