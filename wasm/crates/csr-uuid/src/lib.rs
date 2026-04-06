use wasm_bindgen::prelude::*;

const HEX: [u8; 16] = *b"0123456789abcdef";

/// Format 16 random bytes as UUID v4 string.
/// Sets version nibble (4) and variant bits (10xx).
fn format_uuid(bytes: &[u8; 16]) -> String {
    let mut buf = [0u8; 36];
    let mut bi = 0;
    for (i, &b) in bytes.iter().enumerate() {
        if i == 4 || i == 6 || i == 8 || i == 10 {
            buf[bi] = b'-';
            bi += 1;
        }
        buf[bi] = HEX[(b >> 4) as usize];
        buf[bi + 1] = HEX[(b & 0x0f) as usize];
        bi += 2;
    }
    // SAFETY: buf contains only ASCII hex chars and hyphens
    unsafe { String::from_utf8_unchecked(buf.to_vec()) }
}

/// Generate a single UUID v4 string.
#[wasm_bindgen]
pub fn uuid_v4() -> String {
    let mut bytes = [0u8; 16];
    getrandom::fill(&mut bytes).expect("getrandom failed");

    // Set version 4: byte 6 = 0100xxxx
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set variant 1: byte 8 = 10xxxxxx
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    format_uuid(&bytes)
}

/// Generate multiple UUID v4 strings. Count is clamped to 1-100.
#[wasm_bindgen]
pub fn uuid_v4_bulk(count: i32) -> Vec<String> {
    let clamped = if count <= 0 { 1 } else { count.min(100) } as usize;
    (0..clamped).map(|_| uuid_v4()).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    fn is_valid_uuid_v4(s: &str) -> bool {
        let re_like = s.len() == 36
            && s.chars().enumerate().all(|(i, c)| {
                if i == 8 || i == 13 || i == 18 || i == 23 {
                    c == '-'
                } else {
                    c.is_ascii_hexdigit()
                }
            });
        if !re_like {
            return false;
        }
        // Version nibble at position 14 must be '4'
        s.as_bytes()[14] == b'4'
            // Variant nibble at position 19 must be 8, 9, a, or b
            && matches!(s.as_bytes()[19], b'8' | b'9' | b'a' | b'b')
    }

    #[test]
    fn generates_valid_v4() {
        let uuid = uuid_v4();
        assert!(is_valid_uuid_v4(&uuid), "Invalid UUID: {}", uuid);
    }

    #[test]
    fn generates_unique() {
        let a = uuid_v4();
        let b = uuid_v4();
        assert_ne!(a, b);
    }

    #[test]
    fn bulk_count_1() {
        let uuids = uuid_v4_bulk(1);
        assert_eq!(uuids.len(), 1);
        assert!(is_valid_uuid_v4(&uuids[0]));
    }

    #[test]
    fn bulk_count_10() {
        let uuids = uuid_v4_bulk(10);
        assert_eq!(uuids.len(), 10);
        for u in &uuids {
            assert!(is_valid_uuid_v4(u));
        }
    }

    #[test]
    fn bulk_clamp_max() {
        let uuids = uuid_v4_bulk(150);
        assert_eq!(uuids.len(), 100);
    }

    #[test]
    fn bulk_clamp_zero() {
        let uuids = uuid_v4_bulk(0);
        assert_eq!(uuids.len(), 1);
    }

    #[test]
    fn bulk_clamp_negative() {
        let uuids = uuid_v4_bulk(-1);
        assert_eq!(uuids.len(), 1);
        assert!(is_valid_uuid_v4(&uuids[0]));
    }

    #[test]
    fn bulk_uniqueness() {
        let uuids = uuid_v4_bulk(50);
        let unique: HashSet<&String> = uuids.iter().collect();
        assert_eq!(unique.len(), uuids.len());
    }
}
