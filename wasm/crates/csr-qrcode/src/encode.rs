/// QR Code byte-mode data encoding, version selection, and interleaving.

use crate::ec;

/// Error correction level.
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum EcLevel {
    L,
    M,
    Q,
    H,
}

impl EcLevel {
    pub fn from_str(s: &str) -> Option<EcLevel> {
        match s.to_uppercase().as_str() {
            "L" => Some(EcLevel::L),
            "M" => Some(EcLevel::M),
            "Q" => Some(EcLevel::Q),
            "H" => Some(EcLevel::H),
            _ => None,
        }
    }

    pub fn index(self) -> usize {
        match self {
            EcLevel::L => 0,
            EcLevel::M => 1,
            EcLevel::Q => 2,
            EcLevel::H => 3,
        }
    }
}

/// Byte-mode data capacity for versions 1-40 at EC levels [L, M, Q, H].
pub const BYTE_CAPACITY: [[usize; 4]; 40] = [
    [17, 14, 11, 7],       // V1
    [32, 26, 20, 14],      // V2
    [53, 42, 32, 24],      // V3
    [78, 62, 46, 34],      // V4
    [106, 84, 60, 44],     // V5
    [134, 106, 74, 58],    // V6
    [154, 122, 86, 64],    // V7
    [192, 152, 108, 84],   // V8
    [230, 180, 130, 98],   // V9
    [271, 213, 151, 119],  // V10
    [321, 251, 177, 137],  // V11
    [367, 287, 203, 155],  // V12
    [425, 331, 241, 177],  // V13
    [458, 362, 258, 194],  // V14
    [520, 412, 292, 220],  // V15
    [586, 450, 322, 250],  // V16
    [644, 504, 364, 280],  // V17
    [718, 560, 394, 310],  // V18
    [792, 624, 442, 338],  // V19
    [858, 666, 482, 382],  // V20
    [929, 711, 509, 403],  // V21
    [1003, 779, 565, 439], // V22
    [1091, 857, 611, 461], // V23
    [1171, 911, 661, 511], // V24
    [1273, 997, 715, 535], // V25
    [1367, 1059, 751, 593], // V26
    [1465, 1125, 805, 625], // V27
    [1528, 1190, 868, 658], // V28
    [1628, 1264, 908, 698], // V29
    [1732, 1370, 982, 742], // V30
    [1840, 1452, 1030, 790], // V31
    [1952, 1538, 1112, 842], // V32
    [2068, 1628, 1168, 898], // V33
    [2188, 1722, 1228, 958], // V34
    [2303, 1809, 1283, 983], // V35
    [2431, 1911, 1351, 1051], // V36
    [2563, 1989, 1423, 1093], // V37
    [2699, 2099, 1499, 1139], // V38
    [2809, 2213, 1579, 1219], // V39
    [2953, 2331, 1663, 1273], // V40
];

/// EC table: for each version (1-40) and EC level [L, M, Q, H],
/// stores (ec_codewords_per_block, &[(block_count, data_codewords_per_block)]).
pub const EC_TABLE: [[(usize, &[(usize, usize)]); 4]; 40] = [
    // V1
    [(7, &[(1, 19)]), (10, &[(1, 16)]), (13, &[(1, 13)]), (17, &[(1, 9)])],
    // V2
    [(10, &[(1, 34)]), (16, &[(1, 28)]), (22, &[(1, 22)]), (28, &[(1, 16)])],
    // V3
    [(15, &[(1, 55)]), (26, &[(1, 44)]), (18, &[(2, 17)]), (22, &[(2, 13)])],
    // V4
    [(20, &[(1, 80)]), (18, &[(2, 32)]), (26, &[(2, 24)]), (16, &[(4, 9)])],
    // V5
    [(26, &[(1, 108)]), (24, &[(2, 43)]), (18, &[(2, 15), (2, 16)]), (22, &[(2, 11), (2, 12)])],
    // V6
    [(18, &[(2, 68)]), (16, &[(4, 27)]), (24, &[(4, 19)]), (28, &[(4, 15)])],
    // V7
    [(20, &[(2, 78)]), (18, &[(4, 31)]), (18, &[(2, 14), (4, 15)]), (26, &[(4, 13), (1, 14)])],
    // V8
    [(24, &[(2, 97)]), (22, &[(2, 38), (2, 39)]), (22, &[(4, 18), (2, 19)]), (26, &[(4, 14), (2, 15)])],
    // V9
    [(30, &[(2, 116)]), (22, &[(3, 36), (2, 37)]), (20, &[(4, 16), (4, 17)]), (24, &[(4, 12), (4, 13)])],
    // V10
    [(18, &[(2, 68), (2, 69)]), (26, &[(4, 43), (1, 44)]), (24, &[(6, 19), (2, 20)]), (28, &[(6, 15), (2, 16)])],
    // V11
    [(20, &[(4, 81)]), (30, &[(1, 50), (4, 51)]), (28, &[(4, 22), (4, 23)]), (24, &[(3, 12), (8, 13)])],
    // V12
    [(24, &[(2, 92), (2, 93)]), (22, &[(6, 36), (2, 37)]), (26, &[(4, 20), (6, 21)]), (28, &[(7, 14), (4, 15)])],
    // V13
    [(26, &[(4, 107)]), (22, &[(8, 37), (1, 38)]), (24, &[(8, 20), (4, 21)]), (22, &[(12, 11), (4, 12)])],
    // V14
    [(30, &[(3, 115), (1, 116)]), (24, &[(4, 40), (5, 41)]), (20, &[(11, 16), (5, 17)]), (24, &[(11, 12), (5, 13)])],
    // V15
    [(22, &[(5, 87), (1, 88)]), (24, &[(5, 41), (5, 42)]), (30, &[(5, 24), (7, 25)]), (24, &[(11, 12), (7, 13)])],
    // V16
    [(24, &[(5, 98), (1, 99)]), (28, &[(7, 45), (3, 46)]), (24, &[(15, 19), (2, 20)]), (30, &[(3, 15), (13, 16)])],
    // V17
    [(28, &[(1, 107), (5, 108)]), (28, &[(10, 46), (1, 47)]), (28, &[(1, 22), (15, 23)]), (28, &[(2, 14), (17, 15)])],
    // V18
    [(30, &[(5, 120), (1, 121)]), (26, &[(9, 43), (4, 44)]), (28, &[(17, 22), (1, 23)]), (28, &[(2, 14), (19, 15)])],
    // V19
    [(28, &[(3, 113), (4, 114)]), (26, &[(3, 44), (11, 45)]), (26, &[(17, 21), (4, 22)]), (26, &[(9, 13), (16, 14)])],
    // V20
    [(28, &[(3, 107), (5, 108)]), (26, &[(3, 41), (13, 42)]), (30, &[(15, 24), (5, 25)]), (28, &[(15, 15), (10, 16)])],
    // V21
    [(28, &[(4, 116), (4, 117)]), (26, &[(17, 42)]), (28, &[(17, 22), (6, 23)]), (30, &[(19, 16), (6, 17)])],
    // V22
    [(28, &[(2, 111), (7, 112)]), (28, &[(17, 46)]), (30, &[(7, 24), (16, 25)]), (24, &[(34, 13)])],
    // V23
    [(30, &[(4, 121), (5, 122)]), (28, &[(4, 47), (14, 48)]), (30, &[(11, 24), (14, 25)]), (30, &[(16, 15), (14, 16)])],
    // V24
    [(30, &[(6, 117), (4, 118)]), (28, &[(6, 45), (14, 46)]), (30, &[(11, 24), (16, 25)]), (30, &[(30, 16), (2, 17)])],
    // V25
    [(26, &[(8, 106), (4, 107)]), (28, &[(8, 47), (13, 48)]), (30, &[(7, 24), (22, 25)]), (30, &[(22, 15), (13, 16)])],
    // V26
    [(28, &[(10, 114), (2, 115)]), (28, &[(19, 46), (4, 47)]), (28, &[(28, 22), (6, 23)]), (30, &[(33, 16), (4, 17)])],
    // V27
    [(30, &[(8, 122), (4, 123)]), (28, &[(22, 45), (3, 46)]), (30, &[(8, 23), (26, 24)]), (30, &[(12, 15), (28, 16)])],
    // V28
    [(30, &[(3, 117), (10, 118)]), (28, &[(3, 45), (23, 46)]), (30, &[(4, 24), (31, 25)]), (30, &[(11, 15), (31, 16)])],
    // V29
    [(30, &[(7, 116), (7, 117)]), (28, &[(21, 45), (7, 46)]), (30, &[(1, 23), (37, 24)]), (30, &[(19, 15), (26, 16)])],
    // V30
    [(30, &[(5, 115), (10, 116)]), (28, &[(19, 47), (10, 48)]), (30, &[(15, 24), (25, 25)]), (30, &[(23, 15), (25, 16)])],
    // V31
    [(30, &[(13, 115), (3, 116)]), (28, &[(2, 46), (29, 47)]), (30, &[(42, 24), (1, 25)]), (30, &[(23, 15), (28, 16)])],
    // V32
    [(30, &[(17, 115)]), (28, &[(10, 46), (23, 47)]), (30, &[(10, 24), (35, 25)]), (30, &[(19, 15), (35, 16)])],
    // V33
    [(30, &[(17, 115), (1, 116)]), (28, &[(14, 46), (21, 47)]), (30, &[(29, 24), (19, 25)]), (30, &[(11, 15), (46, 16)])],
    // V34
    [(30, &[(13, 115), (6, 116)]), (28, &[(14, 46), (23, 47)]), (30, &[(44, 24), (7, 25)]), (30, &[(59, 16), (1, 17)])],
    // V35
    [(30, &[(12, 121), (7, 122)]), (28, &[(12, 47), (26, 48)]), (30, &[(39, 24), (14, 25)]), (30, &[(22, 15), (41, 16)])],
    // V36
    [(30, &[(6, 121), (14, 122)]), (28, &[(6, 47), (34, 48)]), (30, &[(46, 24), (10, 25)]), (30, &[(2, 15), (64, 16)])],
    // V37
    [(30, &[(17, 122), (4, 123)]), (28, &[(29, 46), (14, 47)]), (30, &[(49, 24), (10, 25)]), (30, &[(24, 15), (46, 16)])],
    // V38
    [(30, &[(4, 122), (18, 123)]), (28, &[(13, 46), (32, 47)]), (30, &[(48, 24), (14, 25)]), (30, &[(42, 15), (32, 16)])],
    // V39
    [(30, &[(20, 117), (4, 118)]), (28, &[(40, 47), (7, 48)]), (30, &[(43, 24), (22, 25)]), (30, &[(10, 15), (67, 16)])],
    // V40
    [(30, &[(19, 118), (6, 119)]), (28, &[(18, 47), (31, 48)]), (30, &[(34, 24), (34, 25)]), (30, &[(20, 15), (61, 16)])],
];

/// Find the smallest QR version that can hold `data_len` bytes at the given EC level.
pub fn select_version(data_len: usize, ec: EcLevel) -> Option<usize> {
    let idx = ec.index();
    for v in 0..40 {
        if BYTE_CAPACITY[v][idx] >= data_len {
            return Some(v + 1);
        }
    }
    None
}

/// Encode data in byte mode. Returns (version, codewords) or None if too large.
pub fn encode_data(data: &[u8], ec: EcLevel) -> Option<(usize, Vec<u8>)> {
    let version = select_version(data.len(), ec)?;

    // Total data codewords for this version/ec
    let ec_entry = &EC_TABLE[version - 1][ec.index()];
    let total_data_codewords: usize = ec_entry.1.iter().map(|&(cnt, dcw)| cnt * dcw).sum();

    let mut bits: Vec<bool> = Vec::new();

    // Mode indicator: 0100 (byte mode)
    bits.extend_from_slice(&[false, true, false, false]);

    // Character count indicator
    let cc_bits = if version <= 9 { 8 } else { 16 };
    for i in (0..cc_bits).rev() {
        bits.push((data.len() >> i) & 1 == 1);
    }

    // Data
    for &byte in data {
        for i in (0..8).rev() {
            bits.push((byte >> i) & 1 == 1);
        }
    }

    // Terminator (up to 4 zero bits)
    let remaining = total_data_codewords * 8 - bits.len();
    let term_len = remaining.min(4);
    for _ in 0..term_len {
        bits.push(false);
    }

    // Pad to byte boundary
    while bits.len() % 8 != 0 {
        bits.push(false);
    }

    // Convert bits to bytes
    let mut codewords: Vec<u8> = Vec::new();
    for chunk in bits.chunks(8) {
        let mut byte = 0u8;
        for (i, &bit) in chunk.iter().enumerate() {
            if bit {
                byte |= 1 << (7 - i);
            }
        }
        codewords.push(byte);
    }

    // Pad with alternating 0xEC, 0x11
    let pad_bytes = [0xEC, 0x11];
    let mut pad_idx = 0;
    while codewords.len() < total_data_codewords {
        codewords.push(pad_bytes[pad_idx % 2]);
        pad_idx += 1;
    }

    Some((version, codewords))
}

/// Interleave data and EC blocks per QR spec.
pub fn interleave(version: usize, ec: EcLevel, data_codewords: &[u8]) -> Vec<u8> {
    let ec_entry = &EC_TABLE[version - 1][ec.index()];
    let ec_per_block = ec_entry.0;
    let block_spec = ec_entry.1;

    // Split data into blocks
    let mut blocks_data: Vec<Vec<u8>> = Vec::new();
    let mut offset = 0;
    for &(count, dcw) in block_spec {
        for _ in 0..count {
            blocks_data.push(data_codewords[offset..offset + dcw].to_vec());
            offset += dcw;
        }
    }

    // Generate EC for each block
    let mut blocks_ec: Vec<Vec<u8>> = Vec::new();
    for block in &blocks_data {
        blocks_ec.push(ec::rs_encode(block, ec_per_block));
    }

    // Interleave data codewords
    let max_data = blocks_data.iter().map(|b| b.len()).max().unwrap_or(0);
    let mut result: Vec<u8> = Vec::new();
    for i in 0..max_data {
        for block in &blocks_data {
            if i < block.len() {
                result.push(block[i]);
            }
        }
    }

    // Interleave EC codewords
    for i in 0..ec_per_block {
        for block in &blocks_ec {
            if i < block.len() {
                result.push(block[i]);
            }
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn version_selection_small() {
        assert_eq!(select_version(5, EcLevel::M), Some(1));
    }

    #[test]
    fn version_selection_medium() {
        assert_eq!(select_version(100, EcLevel::L), Some(5));
    }

    #[test]
    fn version_selection_too_large() {
        assert_eq!(select_version(5000, EcLevel::L), None);
    }

    #[test]
    fn encode_data_hello_v1m() {
        let (version, codewords) = encode_data(b"Hello", EcLevel::M).unwrap();
        assert_eq!(version, 1);
        assert_eq!(codewords.len(), 16); // V1-M has 16 data codewords
        assert_eq!(codewords[0], 0x40); // Mode indicator 0100 + high nibble of count 0000
        assert_eq!(codewords[1], 0x54); // low nibble of count (5=0101) + first nibble of 'H' (0100)
    }
}
