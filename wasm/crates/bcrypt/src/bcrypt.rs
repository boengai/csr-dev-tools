use crate::blowfish::Blowfish;

/// "OrpheanBeholderScryDoubt" as big-endian u32 words
const CTEXT: [u32; 6] = [
    0x4f727068, 0x65616e42, 0x65686f6c, 0x64657253, 0x63727944, 0x6f756274,
];

/// bcrypt custom base64 alphabet
const BCRYPT_BASE64: &[u8] = b"./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/// Encode bytes using bcrypt's custom base64 alphabet (no padding, MSB-first).
/// Uses the same bit ordering as standard base64 but with bcrypt's character set:
/// `./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`
pub(crate) fn bcrypt_base64_encode(data: &[u8]) -> String {
    let n = data.len();
    let out_len = (n * 4 + 2) / 3;
    let mut out = Vec::with_capacity(out_len);
    let mut i = 0;
    while i < n {
        let b0 = data[i] as u32;
        let b1 = if i + 1 < n { data[i + 1] as u32 } else { 0 };
        let b2 = if i + 2 < n { data[i + 2] as u32 } else { 0 };

        // Standard base64 MSB-first packing: take 6 bits at a time from the combined 24-bit group
        let c0 = (b0 >> 2) & 0x3f;
        let c1 = ((b0 << 4) | (b1 >> 4)) & 0x3f;
        let c2 = ((b1 << 2) | (b2 >> 6)) & 0x3f;
        let c3 = b2 & 0x3f;

        out.push(BCRYPT_BASE64[c0 as usize]);
        out.push(BCRYPT_BASE64[c1 as usize]);
        if i + 1 < n {
            out.push(BCRYPT_BASE64[c2 as usize]);
        }
        if i + 2 < n {
            out.push(BCRYPT_BASE64[c3 as usize]);
        }

        i += 3;
    }
    // SAFETY: all bytes are from BCRYPT_BASE64 which is ASCII
    unsafe { String::from_utf8_unchecked(out) }
}

/// Decode bcrypt base64 string back to bytes.
/// Uses MSB-first bit ordering (same as standard base64) with bcrypt's alphabet.
pub(crate) fn bcrypt_base64_decode(encoded: &str) -> Vec<u8> {
    // Build reverse lookup table
    let mut table = [0xffu8; 256];
    for (i, &c) in BCRYPT_BASE64.iter().enumerate() {
        table[c as usize] = i as u8;
    }

    let bytes = encoded.as_bytes();
    let n = bytes.len();
    let mut out = Vec::with_capacity((n * 3) / 4);
    let mut i = 0;
    while i < n {
        let c0 = table[bytes[i] as usize] as u32;
        let c1 = if i + 1 < n { table[bytes[i + 1] as usize] as u32 } else { 0 };
        let c2 = if i + 2 < n { table[bytes[i + 2] as usize] as u32 } else { 0 };
        let c3 = if i + 3 < n { table[bytes[i + 3] as usize] as u32 } else { 0 };

        // Reverse MSB-first: reconstruct bytes from 6-bit values
        let b0 = (c0 << 2) | (c1 >> 4);
        let b1 = ((c1 & 0xf) << 4) | (c2 >> 2);
        let b2 = ((c2 & 0x3) << 6) | c3;

        out.push(b0 as u8);
        if i + 2 < n {
            out.push(b1 as u8);
        }
        if i + 3 < n {
            out.push(b2 as u8);
        }

        i += 4;
    }
    out
}

/// Hash a password using bcrypt with the given cost and salt.
/// Returns a bcrypt hash string in $2b$ format (60 chars total).
pub(crate) fn hash_password(password: &[u8], cost: u32, salt: &[u8; 16]) -> String {
    // Truncate password to 72 bytes, append null terminator
    let pw_len = password.len().min(72);
    let mut key = Vec::with_capacity(pw_len + 1);
    key.extend_from_slice(&password[..pw_len]);
    key.push(0u8);

    // Create and set up Blowfish with Eksblowfish schedule
    let mut bf = Blowfish::new();
    bf.eks_setup(cost, salt, &key);

    // Encrypt CTEXT 64 times (3 pairs of u32)
    let mut ctext = CTEXT;
    for _ in 0..64 {
        // Encrypt each of the 3 pairs
        for pair in 0..3 {
            (ctext[pair * 2], ctext[pair * 2 + 1]) = bf.encrypt(ctext[pair * 2], ctext[pair * 2 + 1]);
        }
    }

    // Convert ctext to bytes (big-endian), then truncate to 23 bytes
    let mut hash_bytes = Vec::with_capacity(24);
    for w in &ctext {
        hash_bytes.extend_from_slice(&w.to_be_bytes());
    }
    hash_bytes.truncate(23);

    // Encode salt and hash using bcrypt base64
    let salt_encoded = bcrypt_base64_encode(salt);   // 22 chars
    let hash_encoded = bcrypt_base64_encode(&hash_bytes); // 31 chars

    // Format: $2b$XX$<22-char-salt><31-char-hash>
    format!("$2b${:02}${}{}", cost, salt_encoded, hash_encoded)
}

/// Verify a password against a bcrypt hash string.
/// Supports $2a$, $2b$, $2y$ versions.
pub(crate) fn verify(password: &[u8], hash_str: &str) -> bool {
    // Parse hash string
    // Format: $2b$XX$<53 chars of salt+hash>
    if hash_str.len() != 60 {
        return false;
    }
    let bytes = hash_str.as_bytes();
    if bytes[0] != b'$' {
        return false;
    }
    // Check version ($2a$, $2b$, $2y$)
    if bytes[1] != b'2' || !matches!(bytes[2], b'a' | b'b' | b'y') || bytes[3] != b'$' {
        return false;
    }
    // Parse cost
    let cost_str = &hash_str[4..6];
    let cost: u32 = match cost_str.parse() {
        Ok(c) => c,
        Err(_) => return false,
    };
    if bytes[6] != b'$' {
        return false;
    }
    // Remaining 53 chars: 22 salt + 31 hash
    let rest = &hash_str[7..];
    if rest.len() != 53 {
        return false;
    }
    let salt_encoded = &rest[..22];
    // Decode salt
    let salt_bytes = bcrypt_base64_decode(salt_encoded);
    if salt_bytes.len() < 16 {
        return false;
    }
    let salt: [u8; 16] = match salt_bytes[..16].try_into() {
        Ok(s) => s,
        Err(_) => return false,
    };

    // Re-hash with the same salt and cost
    let candidate = hash_password(password, cost, &salt);

    // Constant-time comparison
    constant_time_eq(hash_str.as_bytes(), candidate.as_bytes())
}

/// Constant-time byte slice comparison
fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut diff = 0u8;
    for (x, y) in a.iter().zip(b.iter()) {
        diff |= x ^ y;
    }
    diff == 0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn base64_roundtrip() {
        let data = b"hello world!";
        let encoded = bcrypt_base64_encode(data);
        let decoded = bcrypt_base64_decode(&encoded);
        assert_eq!(&decoded[..data.len()], data.as_slice());
    }

    #[test]
    fn base64_salt_roundtrip() {
        let salt = [0u8, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        let encoded = bcrypt_base64_encode(&salt);
        assert_eq!(encoded.len(), 22); // 16 bytes -> 22 base64 chars
        let decoded = bcrypt_base64_decode(&encoded);
        assert_eq!(&decoded[..16], &salt);
    }

    #[test]
    fn hash_produces_valid_format() {
        let salt = [0u8; 16];
        let hash = hash_password(b"password", 4, &salt);
        assert!(hash.starts_with("$2b$04$"), "hash should start with $2b$04$, got: {}", hash);
        assert_eq!(hash.len(), 60, "hash should be 60 chars, got: {} ({})", hash.len(), hash);
    }

    #[test]
    fn hash_and_verify_correct_password() {
        let salt = [1u8, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
        let hash = hash_password(b"correcthorsebatterystaple", 4, &salt);
        assert!(verify(b"correcthorsebatterystaple", &hash), "correct password should verify");
    }

    #[test]
    fn verify_wrong_password_fails() {
        let salt = [1u8, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
        let hash = hash_password(b"correcthorsebatterystaple", 4, &salt);
        assert!(!verify(b"wrongpassword", &hash), "wrong password should not verify");
    }

    #[test]
    fn different_passwords_produce_different_hashes() {
        let salt = [42u8; 16];
        let h1 = hash_password(b"password1", 4, &salt);
        let h2 = hash_password(b"password2", 4, &salt);
        assert_ne!(h1, h2);
    }

    #[test]
    fn different_costs_produce_different_hashes() {
        let salt = [7u8; 16];
        let h4 = hash_password(b"password", 4, &salt);
        let h5 = hash_password(b"password", 5, &salt);
        assert_ne!(h4, h5);
        assert!(h4.starts_with("$2b$04$"));
        assert!(h5.starts_with("$2b$05$"));
    }

    #[test]
    fn verify_invalid_hash_returns_false() {
        assert!(!verify(b"password", "not-a-hash"));
        assert!(!verify(b"password", "$2b$04$tooshort"));
    }

    /// Test against known bcrypt test vectors.
    /// Vector from: https://www.openwall.com/crypt/
    /// password: "" (empty), cost: 6
    /// expected: $2a$06$DCq7YPn5Rq63x1Lad4cll.TV4S6ytwfsfvkgY8jIucDrjc8deX1s.
    #[test]
    fn known_test_vector_empty_password() {
        let known_hash = "$2a$06$DCq7YPn5Rq63x1Lad4cll.TV4S6ytwfsfvkgY8jIucDrjc8deX1s.";
        let salt_encoded = &known_hash[7..29];
        let salt_bytes = bcrypt_base64_decode(salt_encoded);
        let salt: [u8; 16] = salt_bytes[..16].try_into().unwrap();
        let our_hash = hash_password(b"", 6, &salt);
        eprintln!("our hash:    {}", our_hash);
        eprintln!("known hash:  {}", known_hash);
        assert_eq!(our_hash[7..], known_hash[7..],
            "hash mismatch:\n  our:   {}\n  known: {}", our_hash, known_hash);
    }

    /// Test vector: password="a", cost=6
    /// expected: $2a$06$m0CrhHm10qJ3lXRY.5zDGO3rS2KdeeWLuGmsfGlMfOxih58VYVfxe
    #[test]
    fn known_test_vector_single_char() {
        let known_hash = "$2a$06$m0CrhHm10qJ3lXRY.5zDGO3rS2KdeeWLuGmsfGlMfOxih58VYVfxe";
        let salt_encoded = &known_hash[7..29];
        let salt_bytes = bcrypt_base64_decode(salt_encoded);
        let salt: [u8; 16] = salt_bytes[..16].try_into().unwrap();
        let our_hash = hash_password(b"a", 6, &salt);
        eprintln!("our hash:    {}", our_hash);
        eprintln!("known hash:  {}", known_hash);
        assert_eq!(our_hash[7..], known_hash[7..],
            "hash mismatch:\n  our:   {}\n  known: {}", our_hash, known_hash);
    }
}
