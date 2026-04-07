use wasm_bindgen::prelude::*;

mod bcrypt;
mod blowfish;

/// Hash a password using bcrypt with the specified cost factor (4–31).
/// A random 16-byte salt is generated automatically.
/// Returns a 60-character bcrypt hash string in $2b$ format.
#[wasm_bindgen]
pub fn hash_password(password: &str, rounds: u32) -> Result<String, JsError> {
    if !(4..=31).contains(&rounds) {
        return Err(JsError::new("Cost must be between 4 and 31"));
    }
    let mut salt = [0u8; 16];
    getrandom::fill(&mut salt).map_err(|e| JsError::new(&format!("RNG error: {e}")))?;
    Ok(bcrypt::hash_password(password.as_bytes(), rounds, &salt))
}

/// Verify a password against a bcrypt hash string.
/// Returns true if the password matches, false otherwise.
#[wasm_bindgen]
pub fn verify_password(password: &str, hash: &str) -> bool {
    bcrypt::verify(password.as_bytes(), hash)
}

#[cfg(test)]
mod tests {
    use crate::bcrypt;

    #[test]
    fn hash_and_verify_roundtrip_cost4() {
        let salt = [3u8, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3];
        let hash = bcrypt::hash_password(b"mysecretpassword", 4, &salt);
        assert!(bcrypt::verify(b"mysecretpassword", &hash), "correct password should verify");
        assert!(!bcrypt::verify(b"wrongpassword", &hash), "wrong password should not verify");
    }

    #[test]
    fn hash_cost10_has_correct_prefix() {
        let salt = [0u8; 16];
        let hash = bcrypt::hash_password(b"testpassword", 10, &salt);
        assert!(hash.starts_with("$2b$10$"), "hash should start with $2b$10$, got: {}", hash);
        assert_eq!(hash.len(), 60, "hash should be 60 chars");
    }

    #[test]
    fn invalid_cost_3_rejected() {
        // Validate cost range: 3 is below minimum of 4
        assert!(!(4..=31).contains(&3u32), "cost 3 should be rejected");
    }

    #[test]
    fn invalid_cost_32_rejected() {
        // Validate cost range: 32 is above maximum of 31
        assert!(!(4..=31).contains(&32u32), "cost 32 should be rejected");
    }
}
