/// GF(256) arithmetic and Reed-Solomon error correction for QR codes.
/// Uses the QR code polynomial 0x11D (x^8 + x^4 + x^3 + x^2 + 1).

const GF_POLY: u16 = 0x11D;

/// GF(256) exponent table: GF_EXP[i] = alpha^i
const GF_EXP: [u8; 512] = {
    let mut table = [0u8; 512];
    let mut val: u16 = 1;
    let mut i = 0;
    while i < 256 {
        table[i] = val as u8;
        val <<= 1;
        if val >= 256 {
            val ^= GF_POLY;
        }
        i += 1;
    }
    // Duplicate for easy mod-free lookup
    let mut i = 256;
    while i < 512 {
        table[i] = table[i - 255];
        i += 1;
    }
    table
};

/// GF(256) logarithm table: GF_LOG[alpha^i] = i
const GF_LOG: [u8; 256] = {
    let mut table = [0u8; 256];
    let mut i = 0;
    while i < 255 {
        table[GF_EXP[i] as usize] = i as u8;
        i += 1;
    }
    table
};

/// Multiply two GF(256) elements using log/exp tables.
pub fn gf_mul(a: u8, b: u8) -> u8 {
    if a == 0 || b == 0 {
        return 0;
    }
    let log_a = GF_LOG[a as usize] as usize;
    let log_b = GF_LOG[b as usize] as usize;
    GF_EXP[log_a + log_b]
}

/// Build the Reed-Solomon generator polynomial of given degree.
/// Returns coefficients in descending order (highest degree first).
pub fn generator_poly(degree: usize) -> Vec<u8> {
    let mut poly = vec![0u8; degree + 1];
    poly[0] = 1;
    // length tracks how many coefficients are "active"
    let mut len = 1;

    for i in 0..degree {
        // Multiply current poly by (x - alpha^i) = (x + alpha^i) in GF(256)
        let alpha_i = GF_EXP[i];
        // Work backwards to multiply in-place
        let mut j = len;
        while j >= 1 {
            poly[j] = poly[j] ^ gf_mul(poly[j - 1], alpha_i);
            j -= 1;
        }
        // poly[0] stays as is (leading coefficient)
        // Actually poly[0] *= 1, which is itself. But the root multiplication:
        // poly[0] = gf_mul(poly[0], alpha_i) is wrong - we need to be more careful.
        // Let me redo this properly.
        len += 1;
    }

    // Redo properly
    let mut poly = vec![1u8]; // Start with [1] meaning "1"

    for i in 0..degree {
        let alpha_i = GF_EXP[i];
        let mut new_poly = vec![0u8; poly.len() + 1];
        for j in 0..poly.len() {
            new_poly[j] ^= poly[j]; // * x term
            new_poly[j + 1] ^= gf_mul(poly[j], alpha_i); // * alpha^i term
        }
        poly = new_poly;
    }

    poly
}

/// Compute Reed-Solomon error correction codewords.
/// Returns `ec_count` EC codewords for the given data.
pub fn rs_encode(data: &[u8], ec_count: usize) -> Vec<u8> {
    let gp = generator_poly(ec_count);

    // Polynomial long division
    let mut remainder = vec![0u8; ec_count];
    for &byte in data {
        let factor = byte ^ remainder[0];
        // Shift remainder left by 1
        for j in 0..ec_count - 1 {
            remainder[j] = remainder[j + 1];
        }
        remainder[ec_count - 1] = 0;
        // XOR with generator * factor
        for j in 0..ec_count {
            remainder[j] ^= gf_mul(gp[j + 1], factor);
        }
    }

    remainder
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gf_mul_identity() {
        for a in 0..=255u16 {
            assert_eq!(gf_mul(a as u8, 1), a as u8, "a * 1 should equal a for a={a}");
        }
    }

    #[test]
    fn gf_mul_zero() {
        for a in 0..=255u16 {
            assert_eq!(gf_mul(a as u8, 0), 0, "a * 0 should equal 0 for a={a}");
        }
    }

    #[test]
    fn rs_encode_known_vector() {
        // QR V1-M known test vector
        let data = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17];
        let ec = rs_encode(&data, 10);
        assert_eq!(ec, vec![196, 35, 39, 119, 235, 215, 231, 226, 93, 23]);
    }
}
