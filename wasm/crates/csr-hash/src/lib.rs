use wasm_bindgen::prelude::*;

mod md5;

/// Compute the MD5 hash of a UTF-8 string, returned as lowercase hex.
#[wasm_bindgen]
pub fn md5(input: &str) -> String {
    let digest = md5::compute(input.as_bytes());
    csr_shared::bytes_to_hex(&digest)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn md5_empty_string() {
        assert_eq!(md5(""), "d41d8cd98f00b204e9800998ecf8427e");
    }

    #[test]
    fn md5_hello() {
        assert_eq!(md5("hello"), "5d41402abc4b2a76b9719d911017c592");
    }

    #[test]
    fn md5_hello_world() {
        assert_eq!(md5("Hello, World!"), "65a8e27d8879283831b664bd8b7f0ad4");
    }

    #[test]
    fn md5_unicode() {
        let result = md5("Hello, World! 🌍");
        assert_eq!(result.len(), 32);
        assert!(result.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn md5_large_input() {
        let input = "a".repeat(10000);
        let result = md5(&input);
        assert_eq!(result.len(), 32);
        assert!(result.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn md5_abc() {
        assert_eq!(md5("abc"), "900150983cd24fb0d6963f7d28e17f72");
    }

    #[test]
    fn md5_56_bytes() {
        let input = "a".repeat(56);
        let result = md5(&input);
        assert_eq!(result.len(), 32);
    }
}
