/// SHA-512 implementation following FIPS 180-4.

/// First 64 bits of the cube roots of the first 80 prime numbers.
const K: [u64; 80] = [
    0x428a2f98d728ae22, 0x7137449123ef65cd, 0xb5c0fbcfec4d3b2f, 0xe9b5dba58189dbbc,
    0x3956c25bf348b538, 0x59f111f1b605d019, 0x923f82a4af194f9b, 0xab1c5ed5da6d8118,
    0xd807aa98a3030242, 0x12835b0145706fbe, 0x243185be4ee4b28c, 0x550c7dc3d5ffb4e2,
    0x72be5d74f27b896f, 0x80deb1fe3b1696b1, 0x9bdc06a725c71235, 0xc19bf174cf692694,
    0xe49b69c19ef14ad2, 0xefbe4786384f25e3, 0x0fc19dc68b8cd5b5, 0x240ca1cc77ac9c65,
    0x2de92c6f592b0275, 0x4a7484aa6ea6e483, 0x5cb0a9dcbd41fbd4, 0x76f988da831153b5,
    0x983e5152ee66dfab, 0xa831c66d2db43210, 0xb00327c898fb213f, 0xbf597fc7beef0ee4,
    0xc6e00bf33da88fc2, 0xd5a79147930aa725, 0x06ca6351e003826f, 0x142929670a0e6e70,
    0x27b70a8546d22ffc, 0x2e1b21385c26c926, 0x4d2c6dfc5ac42aed, 0x53380d139d95b3df,
    0x650a73548baf63de, 0x766a0abb3c77b2a8, 0x81c2c92e47edaee6, 0x92722c851482353b,
    0xa2bfe8a14cf10364, 0xa81a664bbc423001, 0xc24b8b70d0f89791, 0xc76c51a30654be30,
    0xd192e819d6ef5218, 0xd69906245565a910, 0xf40e35855771202a, 0x106aa07032bbd1b8,
    0x19a4c116b8d2d0c8, 0x1e376c085141ab53, 0x2748774cdf8eeb99, 0x34b0bcb5e19b48a8,
    0x391c0cb3c5c95a63, 0x4ed8aa4ae3418acb, 0x5b9cca4f7763e373, 0x682e6ff3d6b2b8a3,
    0x748f82ee5defb2fc, 0x78a5636f43172f60, 0x84c87814a1f0ab72, 0x8cc702081a6439ec,
    0x90befffa23631e28, 0xa4506cebde82bde9, 0xbef9a3f7b2c67915, 0xc67178f2e372532b,
    0xca273eceea26619c, 0xd186b8c721c0c207, 0xeada7dd6cde0eb1e, 0xf57d4f7fee6ed178,
    0x06f067aa72176fba, 0x0a637dc5a2c898a6, 0x113f9804bef90dae, 0x1b710b35131c471b,
    0x28db77f523047d84, 0x32caab7b40c72493, 0x3c9ebe0a15c9bebc, 0x431d67c49c100d4c,
    0x4cc5d4becb3e42b6, 0x597f299cfc657e2a, 0x5fcb6fab3ad6faec, 0x6c44198c4a475817,
];

/// First 64 bits of the square roots of the first 8 prime numbers.
const INIT_H: [u64; 8] = [
    0x6a09e667f3bcc908, 0xbb67ae8584caa73b, 0x3c6ef372fe94f82b, 0xa54ff53a5f1d36f1,
    0x510e527fade682d1, 0x9b05688c2b3e6c1f, 0x1f83d9abfb41bd6b, 0x5be0cd19137e2179,
];

/// Pad message per FIPS 180-4 §5.1.2.
/// Appends 0x80, zero bytes, then big-endian 128-bit bit-length.
/// Output length is a multiple of 128 bytes.
fn pad(message: &[u8]) -> Vec<u8> {
    let msg_len = message.len();
    let bit_len = (msg_len as u128).wrapping_mul(8);

    // Length after appending 0x80 and the 16-byte length field.
    // We need the total to be ≡ 0 (mod 128).
    let padded_len = {
        // msg + 0x80 byte + 16-byte length
        let min_len = msg_len + 1 + 16;
        // Round up to next multiple of 128
        (min_len + 127) & !127
    };

    let mut padded = Vec::with_capacity(padded_len);
    padded.extend_from_slice(message);
    padded.push(0x80);
    padded.resize(padded_len - 16, 0x00);
    padded.extend_from_slice(&bit_len.to_be_bytes());

    padded
}

/// Compute SHA-512 digest of `message` using custom initial hash values.
/// This is the core function used by SHA-384 (and SHA-512/t variants) with different IVs.
pub fn compute_with_init(message: &[u8], init: &[u64; 8]) -> [u8; 64] {
    let padded = pad(message);
    let mut h = *init;

    // Process each 1024-bit (128-byte) block.
    for block in padded.chunks(128) {
        // Prepare message schedule W[0..80].
        let mut w = [0u64; 80];
        for i in 0..16 {
            w[i] = u64::from_be_bytes([
                block[i * 8],
                block[i * 8 + 1],
                block[i * 8 + 2],
                block[i * 8 + 3],
                block[i * 8 + 4],
                block[i * 8 + 5],
                block[i * 8 + 6],
                block[i * 8 + 7],
            ]);
        }
        for i in 16..80 {
            let s0 = w[i - 15].rotate_right(1) ^ w[i - 15].rotate_right(8) ^ (w[i - 15] >> 7);
            let s1 = w[i - 2].rotate_right(19) ^ w[i - 2].rotate_right(61) ^ (w[i - 2] >> 6);
            w[i] = w[i - 16]
                .wrapping_add(s0)
                .wrapping_add(w[i - 7])
                .wrapping_add(s1);
        }

        // Initialize working variables.
        let [mut a, mut b, mut c, mut d, mut e, mut f, mut g, mut hh] = h;

        // Compression function — 80 rounds.
        for i in 0..80 {
            let s1 = e.rotate_right(14) ^ e.rotate_right(18) ^ e.rotate_right(41);
            let ch = (e & f) ^ ((!e) & g);
            let temp1 = hh
                .wrapping_add(s1)
                .wrapping_add(ch)
                .wrapping_add(K[i])
                .wrapping_add(w[i]);
            let s0 = a.rotate_right(28) ^ a.rotate_right(34) ^ a.rotate_right(39);
            let maj = (a & b) ^ (a & c) ^ (b & c);
            let temp2 = s0.wrapping_add(maj);

            hh = g;
            g = f;
            f = e;
            e = d.wrapping_add(temp1);
            d = c;
            c = b;
            b = a;
            a = temp1.wrapping_add(temp2);
        }

        // Add compressed chunk to current hash value.
        h[0] = h[0].wrapping_add(a);
        h[1] = h[1].wrapping_add(b);
        h[2] = h[2].wrapping_add(c);
        h[3] = h[3].wrapping_add(d);
        h[4] = h[4].wrapping_add(e);
        h[5] = h[5].wrapping_add(f);
        h[6] = h[6].wrapping_add(g);
        h[7] = h[7].wrapping_add(hh);
    }

    // Produce the final hash as big-endian bytes.
    let mut digest = [0u8; 64];
    for (i, &word) in h.iter().enumerate() {
        digest[i * 8..i * 8 + 8].copy_from_slice(&word.to_be_bytes());
    }
    digest
}

/// Compute SHA-512 digest of `message`, returning a 64-byte array.
pub fn compute(message: &[u8]) -> [u8; 64] {
    compute_with_init(message, &INIT_H)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bytes_to_hex;

    #[test]
    fn sha512_empty() {
        let digest = compute(b"");
        assert_eq!(
            bytes_to_hex(&digest),
            "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e"
        );
    }

    #[test]
    fn sha512_abc() {
        let digest = compute(b"abc");
        assert_eq!(
            bytes_to_hex(&digest),
            "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f"
        );
    }

    #[test]
    fn sha512_hello() {
        let digest = compute(b"hello");
        let hex = bytes_to_hex(&digest);
        assert_eq!(hex.len(), 128, "digest must be 128 hex chars");
        assert!(hex.starts_with("9b71d224bd62f378"), "unexpected prefix: {}", &hex[..16]);
    }

    #[test]
    fn sha512_large_input() {
        let input = vec![b'a'; 10_000];
        let digest = compute(&input);
        let hex = bytes_to_hex(&digest);
        assert_eq!(hex.len(), 128, "digest must be 128 hex chars");
    }
}
