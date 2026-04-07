/// SHA-384 implementation — SHA-512 with different IVs, truncated to 384 bits.

use crate::sha512;

const INIT_H: [u64; 8] = [
    0xcbbb9d5dc1059ed8, 0x629a292a367cd507,
    0x9159015a3070dd17, 0x152fecd8f70e5939,
    0x67332667ffc00b31, 0x8eb44a8768581511,
    0xdb0c2e0d64f98fa7, 0x47b5481dbefa4fa4,
];

pub fn compute(message: &[u8]) -> [u8; 48] {
    let full = sha512::compute_with_init(message, &INIT_H);
    let mut digest = [0u8; 48];
    digest.copy_from_slice(&full[..48]);
    digest
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bytes_to_hex;

    #[test]
    fn sha384_empty() {
        let digest = compute(b"");
        assert_eq!(
            bytes_to_hex(&digest),
            "38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b"
        );
    }

    #[test]
    fn sha384_abc() {
        let digest = compute(b"abc");
        assert_eq!(
            bytes_to_hex(&digest),
            "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7"
        );
    }

    #[test]
    fn sha384_hello() {
        let digest = compute(b"hello");
        let hex = bytes_to_hex(&digest);
        assert_eq!(hex.len(), 96, "digest must be 96 hex chars");
    }
}
