/// Convert a byte slice to a lowercase hex string.
pub fn bytes_to_hex(bytes: &[u8]) -> String {
    let mut hex = String::with_capacity(bytes.len() * 2);
    for &b in bytes {
        hex.push(HEX_CHARS[(b >> 4) as usize]);
        hex.push(HEX_CHARS[(b & 0x0f) as usize]);
    }
    hex
}

const HEX_CHARS: [char; 16] = [
    '0', '1', '2', '3', '4', '5', '6', '7',
    '8', '9', 'a', 'b', 'c', 'd', 'e', 'f',
];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hex_empty() {
        assert_eq!(bytes_to_hex(&[]), "");
    }

    #[test]
    fn hex_single_byte() {
        assert_eq!(bytes_to_hex(&[0xff]), "ff");
        assert_eq!(bytes_to_hex(&[0x00]), "00");
        assert_eq!(bytes_to_hex(&[0x0a]), "0a");
    }

    #[test]
    fn hex_multiple_bytes() {
        assert_eq!(bytes_to_hex(&[0xde, 0xad, 0xbe, 0xef]), "deadbeef");
    }
}
