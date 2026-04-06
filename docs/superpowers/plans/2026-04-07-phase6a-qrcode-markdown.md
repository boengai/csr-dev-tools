# Phase 6a: csr-qrcode + csr-markdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `qrcode` (60KB), `marked` (50KB), `turndown` (30KB), and `turndown-plugin-gfm` (5KB) with two hand-written Rust WASM crates providing QR code generation and bidirectional Markdown↔HTML conversion.

**Architecture:** Two independent Rust crates — `csr-qrcode` (GF(256) Reed-Solomon + matrix construction + PNG/SVG output) and `csr-markdown` (two-pass CommonMark block+inline parser + recursive descent HTML-to-Markdown converter). TypeScript wrappers in `src/wasm/` expose async functions matching existing signatures. Existing Vitest specs validate correctness. `renderMarkdown` migrates from sync to async — the one component caller (`MarkdownPreview.tsx`) needs a minor update.

**Tech Stack:** Rust (wasm-bindgen, flate2 for PNG deflate), TypeScript, Vite WASM integration

---

## File Structure

```
wasm/crates/csr-qrcode/
├── Cargo.toml
└── src/
    ├── lib.rs          # #[wasm_bindgen] exports
    ├── encode.rs       # Byte-mode data encoding, version selection
    ├── ec.rs           # GF(256) math, Reed-Solomon EC generation
    ├── matrix.rs       # QR matrix construction, patterns, masking
    ├── png.rs          # Minimal PNG encoder (IHDR + IDAT + IEND)
    └── svg.rs          # SVG string builder

wasm/crates/csr-markdown/
├── Cargo.toml
└── src/
    ├── lib.rs          # #[wasm_bindgen] exports
    ├── block.rs        # Block-level markdown parser
    ├── inline.rs       # Inline-level markdown parser
    ├── emit.rs         # AST → HTML emitter with sanitization
    ├── html_parse.rs   # Simple recursive descent HTML parser
    └── html_to_md.rs   # HTML node tree → markdown string

src/wasm/csr-qrcode.ts     # TypeScript WASM wrapper (new)
src/wasm/csr-markdown.ts   # TypeScript WASM wrapper (new)
src/utils/qr-code.ts       # Modify: swap qrcode npm → WASM
src/utils/markdown.ts       # Modify: swap marked → WASM (sync → async)
src/utils/html-markdown.ts  # Modify: swap turndown/marked → WASM
src/components/feature/code/MarkdownPreview.tsx  # Modify: handle async renderMarkdown
```

---

### Task 1: Scaffold csr-qrcode crate with GF(256) and Reed-Solomon

**Files:**
- Create: `wasm/crates/csr-qrcode/Cargo.toml`
- Create: `wasm/crates/csr-qrcode/src/lib.rs`
- Create: `wasm/crates/csr-qrcode/src/encode.rs`
- Create: `wasm/crates/csr-qrcode/src/ec.rs`
- Create: `wasm/crates/csr-qrcode/src/matrix.rs`
- Create: `wasm/crates/csr-qrcode/src/png.rs`
- Create: `wasm/crates/csr-qrcode/src/svg.rs`

- [ ] **Step 1: Create Cargo.toml**

```toml
[package]
name = "csr-qrcode"
version = "0.1.0"
edition.workspace = true

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
flate2 = { version = "1", default-features = false, features = ["rust_backend"] }
wasm-bindgen = "0.2"
```

Note: `flate2` with `rust_backend` avoids C dependencies — pure Rust deflate for WASM compatibility.

- [ ] **Step 2: Create ec.rs — GF(256) arithmetic + Reed-Solomon**

This module implements Galois Field arithmetic over GF(256) using the QR code polynomial `x^8 + x^4 + x^3 + x^2 + 1` (0x11D), plus Reed-Solomon error correction codeword generation.

```rust
/// GF(256) log and antilog (exp) tables for QR polynomial 0x11D.
const GF_EXP: [u8; 512] = {
    let mut table = [0u8; 512];
    let mut val: u16 = 1;
    let mut i = 0;
    while i < 256 {
        table[i] = val as u8;
        table[i + 256] = val as u8;
        val <<= 1;
        if val >= 256 {
            val ^= 0x11D;
        }
        i += 1;
    }
    table
};

const GF_LOG: [u8; 256] = {
    let mut table = [0u8; 256];
    let mut i = 0;
    while i < 255 {
        table[GF_EXP[i] as usize] = i as u8;
        i += 1;
    }
    table
};

fn gf_mul(a: u8, b: u8) -> u8 {
    if a == 0 || b == 0 {
        return 0;
    }
    GF_EXP[(GF_LOG[a as usize] as usize) + (GF_LOG[b as usize] as usize)]
}

/// Build Reed-Solomon generator polynomial of given degree.
fn generator_poly(degree: usize) -> Vec<u8> {
    let mut gen = vec![0u8; degree + 1];
    gen[0] = 1; // polynomial starts as 1
    // Stored as exponents? No — stored as coefficients in GF(256).
    // Actually build using standard RS generator construction:
    let mut g = vec![1u8]; // coefficients
    for i in 0..degree {
        let mut next = vec![0u8; g.len() + 1];
        let factor = GF_EXP[i]; // alpha^i
        for (j, &coeff) in g.iter().enumerate() {
            next[j] ^= gf_mul(coeff, factor);
            next[j + 1] ^= coeff;
        }
        g = next;
    }
    g
}

/// Compute Reed-Solomon EC codewords for a data polynomial.
pub fn rs_encode(data: &[u8], ec_count: usize) -> Vec<u8> {
    let gen = generator_poly(ec_count);
    let mut message = Vec::with_capacity(data.len() + ec_count);
    message.extend_from_slice(data);
    message.resize(data.len() + ec_count, 0);

    for i in 0..data.len() {
        let coeff = message[i];
        if coeff != 0 {
            for (j, &g) in gen.iter().enumerate().skip(1) {
                message[i + j] ^= gf_mul(coeff, g);
            }
        }
    }

    message[data.len()..].to_vec()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gf_mul_identity() {
        // a * 1 = a for all a
        for a in 1..=255u8 {
            assert_eq!(gf_mul(a, 1), a);
        }
    }

    #[test]
    fn gf_mul_zero() {
        for a in 0..=255u8 {
            assert_eq!(gf_mul(a, 0), 0);
            assert_eq!(gf_mul(0, a), 0);
        }
    }

    #[test]
    fn rs_encode_known_vector() {
        // QR version 1-M: 16 data codewords, 10 EC codewords
        // Known test: data = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17]
        // Expected EC = [196, 35, 39, 119, 235, 215, 231, 226, 93, 23]
        let data = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17];
        let ec = rs_encode(&data, 10);
        assert_eq!(ec, vec![196, 35, 39, 119, 235, 215, 231, 226, 93, 23]);
    }
}
```

- [ ] **Step 3: Create encode.rs — byte-mode data encoding + version selection**

This module encodes input text into QR data codewords using byte mode encoding, with automatic version selection based on data capacity.

```rust
/// Error correction level.
#[derive(Clone, Copy)]
pub enum EcLevel {
    L,
    M,
    Q,
    H,
}

impl EcLevel {
    pub fn from_str(s: &str) -> Self {
        match s {
            "L" => EcLevel::L,
            "Q" => EcLevel::Q,
            "H" => EcLevel::H,
            _ => EcLevel::M,
        }
    }

    /// Index into capacity/EC tables (L=0, M=1, Q=2, H=3).
    pub fn index(self) -> usize {
        match self {
            EcLevel::L => 0,
            EcLevel::M => 1,
            EcLevel::Q => 2,
            EcLevel::H => 3,
        }
    }
}

/// Data capacity in bytes for byte-mode encoding, per version (1-40) and EC level (L, M, Q, H).
/// Source: QR code specification table.
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
    [1367, 1059, 751, 593],// V26
    [1465, 1125, 805, 625],// V27
    [1528, 1190, 868, 658],// V28
    [1628, 1264, 908, 698],// V29
    [1732, 1370, 982, 742],// V30
    [1840, 1452, 1030, 790],// V31
    [1952, 1538, 1112, 842],// V32
    [2068, 1628, 1168, 898],// V33
    [2188, 1722, 1228, 958],// V34
    [2303, 1809, 1283, 983],// V35
    [2431, 1911, 1351, 1051],// V36
    [2563, 1989, 1423, 1093],// V37
    [2699, 2099, 1499, 1139],// V38
    [2809, 2213, 1579, 1219],// V39
    [2953, 2331, 1663, 1273],// V40
];

/// EC codewords per block and block structure per version/EC level.
/// Format: (ec_codewords_per_block, [(block_count, data_codewords_per_block), ...])
/// Source: QR code specification table.
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

/// Select the smallest QR version that can hold `data_len` bytes at the given EC level.
pub fn select_version(data_len: usize, ec: EcLevel) -> Option<usize> {
    let idx = ec.index();
    for (v, caps) in BYTE_CAPACITY.iter().enumerate() {
        if caps[idx] >= data_len {
            return Some(v + 1); // versions are 1-indexed
        }
    }
    None
}

/// Encode data as QR byte-mode codewords.
/// Returns (version, data_codewords) where data_codewords includes mode indicator,
/// character count, data bytes, terminator, and padding.
pub fn encode_data(data: &[u8], ec: EcLevel) -> Option<(usize, Vec<u8>)> {
    let version = select_version(data.len(), ec)?;
    let ec_idx = ec.index();

    // Total data codewords for this version/EC
    let (ec_per_block, blocks) = &EC_TABLE[version - 1][ec_idx];
    let total_data: usize = blocks.iter().map(|(count, size)| count * size).sum();

    // Character count indicator length: 8 bits for V1-9, 16 bits for V10+
    let cc_bits = if version <= 9 { 8 } else { 16 };

    // Build bit stream
    let mut bits: Vec<bool> = Vec::new();

    // Mode indicator: 0100 (byte mode)
    bits.extend_from_slice(&[false, true, false, false]);

    // Character count
    let count = data.len();
    for i in (0..cc_bits).rev() {
        bits.push((count >> i) & 1 == 1);
    }

    // Data bytes
    for &byte in data {
        for i in (0..8).rev() {
            bits.push((byte >> i) & 1 == 1);
        }
    }

    // Terminator (up to 4 zero bits)
    let total_bits = total_data * 8;
    let terminator = (total_bits - bits.len()).min(4);
    bits.resize(bits.len() + terminator, false);

    // Pad to byte boundary
    while bits.len() % 8 != 0 {
        bits.push(false);
    }

    // Pad with alternating 0xEC 0x11
    let pad_bytes = [0xEC, 0x11];
    let mut pad_idx = 0;
    while bits.len() < total_bits {
        let pad = pad_bytes[pad_idx % 2];
        for i in (0..8).rev() {
            bits.push((pad >> i) & 1 == 1);
        }
        pad_idx += 1;
    }

    // Convert bits to bytes
    let codewords: Vec<u8> = bits
        .chunks(8)
        .map(|chunk| {
            let mut byte = 0u8;
            for (i, &bit) in chunk.iter().enumerate() {
                if bit {
                    byte |= 1 << (7 - i);
                }
            }
            byte
        })
        .collect();

    Some((version, codewords))
}

/// Interleave data blocks and EC blocks according to QR spec.
pub fn interleave(version: usize, ec: EcLevel, data_codewords: &[u8]) -> Vec<u8> {
    let ec_idx = ec.index();
    let (ec_per_block, block_specs) = &EC_TABLE[version - 1][ec_idx];

    // Split data into blocks and compute EC for each
    let mut data_blocks: Vec<Vec<u8>> = Vec::new();
    let mut ec_blocks: Vec<Vec<u8>> = Vec::new();
    let mut offset = 0;

    for &(count, size) in *block_specs {
        for _ in 0..count {
            let block = data_codewords[offset..offset + size].to_vec();
            let ec_codewords = crate::ec::rs_encode(&block, *ec_per_block);
            data_blocks.push(block);
            ec_blocks.push(ec_codewords);
            offset += size;
        }
    }

    // Interleave data codewords
    let max_data_len = data_blocks.iter().map(|b| b.len()).max().unwrap_or(0);
    let mut result = Vec::new();
    for i in 0..max_data_len {
        for block in &data_blocks {
            if i < block.len() {
                result.push(block[i]);
            }
        }
    }

    // Interleave EC codewords
    let max_ec_len = ec_blocks.iter().map(|b| b.len()).max().unwrap_or(0);
    for i in 0..max_ec_len {
        for block in &ec_blocks {
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
        // "hello" = 5 bytes, should fit V1 at all EC levels
        assert_eq!(select_version(5, EcLevel::L), Some(1));
        assert_eq!(select_version(5, EcLevel::M), Some(1));
        assert_eq!(select_version(5, EcLevel::Q), Some(1));
        assert_eq!(select_version(5, EcLevel::H), Some(1));
    }

    #[test]
    fn version_selection_medium() {
        // 100 bytes should need a larger version
        let v = select_version(100, EcLevel::M).unwrap();
        assert!(v >= 5);
        assert!(BYTE_CAPACITY[v - 1][1] >= 100);
    }

    #[test]
    fn version_selection_too_large() {
        // 3000 bytes exceeds V40 capacity
        assert_eq!(select_version(3000, EcLevel::L), None);
    }

    #[test]
    fn encode_hello() {
        let (version, codewords) = encode_data(b"Hello", EcLevel::M).unwrap();
        assert_eq!(version, 1);
        // V1-M has 16 data codewords
        assert_eq!(codewords.len(), 16);
        // First byte: mode(0100) + first 4 bits of count(00000101)
        // = 0100_0000 = 0x40
        assert_eq!(codewords[0], 0x40);
        // Second byte: remaining count bits(0101) + first 4 bits of 'H'(0100)
        // count=5 → 0101, H=0x48 → 0100_1000
        // byte = 0101_0100 = 0x54
        assert_eq!(codewords[1], 0x54);
    }
}
```

- [ ] **Step 4: Create matrix.rs — QR matrix with patterns and masking**

This is the largest module. It constructs the QR symbol matrix by placing finder patterns, alignment patterns, timing patterns, format/version info, data bits, and applying the best mask.

```rust
use crate::encode::EcLevel;

/// QR module size = 4 * version + 17
pub fn matrix_size(version: usize) -> usize {
    4 * version + 17
}

/// Cell states during matrix construction.
#[derive(Clone, Copy, PartialEq)]
enum Cell {
    Empty,
    Reserved, // reserved for format/version info, will be set later
    Dark,
    Light,
}

impl Cell {
    fn is_dark(self) -> bool {
        matches!(self, Cell::Dark)
    }
}

/// Alignment pattern center coordinates per version.
const ALIGNMENT_POSITIONS: [&[usize]; 40] = [
    &[],                                    // V1
    &[6, 18],                               // V2
    &[6, 22],                               // V3
    &[6, 26],                               // V4
    &[6, 30],                               // V5
    &[6, 34],                               // V6
    &[6, 22, 38],                           // V7
    &[6, 24, 42],                           // V8
    &[6, 26, 46],                           // V9
    &[6, 28, 50],                           // V10
    &[6, 30, 54],                           // V11
    &[6, 32, 58],                           // V12
    &[6, 34, 62],                           // V13
    &[6, 26, 46, 66],                       // V14
    &[6, 26, 48, 70],                       // V15
    &[6, 26, 50, 74],                       // V16
    &[6, 30, 54, 78],                       // V17
    &[6, 30, 56, 82],                       // V18
    &[6, 30, 58, 86],                       // V19
    &[6, 34, 62, 90],                       // V20
    &[6, 28, 50, 72, 94],                   // V21
    &[6, 26, 50, 74, 98],                   // V22
    &[6, 30, 54, 78, 102],                  // V23
    &[6, 28, 54, 80, 106],                  // V24
    &[6, 32, 58, 84, 110],                  // V25
    &[6, 30, 58, 86, 114],                  // V26
    &[6, 34, 62, 90, 118],                  // V27
    &[6, 26, 50, 74, 98, 122],             // V28
    &[6, 30, 54, 78, 102, 126],            // V29
    &[6, 26, 52, 78, 104, 130],            // V30
    &[6, 30, 56, 82, 108, 134],            // V31
    &[6, 34, 60, 86, 112, 138],            // V32
    &[6, 30, 58, 86, 114, 142],            // V33
    &[6, 34, 62, 90, 118, 146],            // V34
    &[6, 30, 54, 78, 102, 126, 150],       // V35
    &[6, 24, 50, 76, 102, 128, 154],       // V36
    &[6, 28, 54, 80, 106, 132, 158],       // V37
    &[6, 32, 58, 84, 110, 136, 162],       // V38
    &[6, 26, 54, 82, 110, 138, 166],       // V39
    &[6, 30, 58, 86, 114, 142, 170],       // V40
];

pub struct QrMatrix {
    size: usize,
    cells: Vec<Cell>,
    version: usize,
}

impl QrMatrix {
    pub fn new(version: usize) -> Self {
        let size = matrix_size(version);
        QrMatrix {
            size,
            cells: vec![Cell::Empty; size * size],
            version,
        }
    }

    fn get(&self, row: usize, col: usize) -> Cell {
        self.cells[row * self.size + col]
    }

    fn set(&mut self, row: usize, col: usize, cell: Cell) {
        self.cells[row * self.size + col] = cell;
    }

    fn set_dark(&mut self, row: usize, col: usize) {
        self.set(row, col, Cell::Dark);
    }

    fn set_light(&mut self, row: usize, col: usize) {
        self.set(row, col, Cell::Light);
    }

    /// Place a finder pattern with top-left at (row, col).
    fn place_finder(&mut self, row: isize, col: isize) {
        for r in 0..7 {
            for c in 0..7 {
                let rr = row + r;
                let cc = col + c;
                if rr < 0 || cc < 0 || rr >= self.size as isize || cc >= self.size as isize {
                    continue;
                }
                let dark = r == 0 || r == 6 || c == 0 || c == 6
                    || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
                self.set(
                    rr as usize,
                    cc as usize,
                    if dark { Cell::Dark } else { Cell::Light },
                );
            }
        }
    }

    /// Place separator (light) around finder patterns.
    fn place_separators(&mut self) {
        let s = self.size;
        // Top-left
        for i in 0..8 {
            if i < s { self.set_light(7, i); }
            if i < s { self.set_light(i, 7); }
        }
        // Top-right
        for i in 0..8 {
            if s >= 8 { self.set_light(7, s - 8 + i); }
            if i < 8 { self.set_light(i, s - 8); }
        }
        // Bottom-left
        for i in 0..8 {
            if s >= 8 { self.set_light(s - 8, i); }
            if i < 8 { self.set_light(s - 8 + i, 7); }
        }
    }

    /// Place alignment patterns.
    fn place_alignment(&mut self) {
        let positions = ALIGNMENT_POSITIONS[self.version - 1];
        for &row in positions {
            for &col in positions {
                // Skip positions that overlap with finder patterns
                if self.get(row, col) != Cell::Empty {
                    continue;
                }
                for r in -2i32..=2 {
                    for c in -2i32..=2 {
                        let rr = (row as i32 + r) as usize;
                        let cc = (col as i32 + c) as usize;
                        let dark = r.abs() == 2 || c.abs() == 2 || (r == 0 && c == 0);
                        self.set(rr, cc, if dark { Cell::Dark } else { Cell::Light });
                    }
                }
            }
        }
    }

    /// Place timing patterns.
    fn place_timing(&mut self) {
        for i in 8..self.size - 8 {
            if self.get(6, i) == Cell::Empty {
                self.set(6, i, if i % 2 == 0 { Cell::Dark } else { Cell::Light });
            }
            if self.get(i, 6) == Cell::Empty {
                self.set(i, 6, if i % 2 == 0 { Cell::Dark } else { Cell::Light });
            }
        }
    }

    /// Reserve format info areas (set to Reserved, filled later).
    fn reserve_format(&mut self) {
        let s = self.size;
        // Around top-left finder
        for i in 0..9 {
            if self.get(8, i) == Cell::Empty { self.set(8, i, Cell::Reserved); }
            if self.get(i, 8) == Cell::Empty { self.set(i, 8, Cell::Reserved); }
        }
        // Around top-right finder
        for i in 0..8 {
            if self.get(8, s - 8 + i) == Cell::Empty { self.set(8, s - 8 + i, Cell::Reserved); }
        }
        // Around bottom-left finder
        for i in 0..7 {
            if self.get(s - 7 + i, 8) == Cell::Empty { self.set(s - 7 + i, 8, Cell::Reserved); }
        }
        // Dark module
        self.set_dark(s - 8, 8);
    }

    /// Reserve version info areas (versions 7+).
    fn reserve_version(&mut self) {
        if self.version < 7 {
            return;
        }
        let s = self.size;
        for i in 0..6 {
            for j in 0..3 {
                self.set(i, s - 11 + j, Cell::Reserved);
                self.set(s - 11 + j, i, Cell::Reserved);
            }
        }
    }

    /// Place data bits into the matrix, right-to-left, bottom-to-top columns.
    fn place_data(&mut self, data: &[u8]) {
        let s = self.size;
        let mut bit_idx = 0;
        let total_bits = data.len() * 8;

        let mut col = s as isize - 1;
        while col >= 0 {
            // Skip timing pattern column
            if col == 6 {
                col -= 1;
                continue;
            }

            let mut row: isize;
            let upward = ((s as isize - 1 - col) / 2) % 2 == 0;
            if upward {
                row = s as isize - 1;
            } else {
                row = 0;
            }

            loop {
                if row < 0 || row >= s as isize {
                    break;
                }
                for dc in [0i32, -1] {
                    let c = col + dc as isize;
                    if c < 0 || c >= s as isize {
                        continue;
                    }
                    if self.get(row as usize, c as usize) != Cell::Empty {
                        continue;
                    }
                    let dark = if bit_idx < total_bits {
                        (data[bit_idx / 8] >> (7 - (bit_idx % 8))) & 1 == 1
                    } else {
                        false
                    };
                    self.set(
                        row as usize,
                        c as usize,
                        if dark { Cell::Dark } else { Cell::Light },
                    );
                    bit_idx += 1;
                }
                if upward { row -= 1; } else { row += 1; }
            }

            col -= 2;
        }
    }

    /// Apply mask pattern (0-7) and return penalty score.
    fn apply_mask(&self, mask_id: u8) -> Vec<Cell> {
        let mut masked = self.cells.clone();
        for row in 0..self.size {
            for col in 0..self.size {
                let cell = self.get(row, col);
                if cell != Cell::Dark && cell != Cell::Light {
                    continue; // skip reserved/empty
                }
                // Only mask data and EC modules (not patterns)
                // We already placed patterns as non-Empty before data
                let should_flip = match mask_id {
                    0 => (row + col) % 2 == 0,
                    1 => row % 2 == 0,
                    2 => col % 3 == 0,
                    3 => (row + col) % 3 == 0,
                    4 => (row / 2 + col / 3) % 2 == 0,
                    5 => (row * col) % 2 + (row * col) % 3 == 0,
                    6 => ((row * col) % 2 + (row * col) % 3) % 2 == 0,
                    7 => ((row + col) % 2 + (row * col) % 3) % 2 == 0,
                    _ => false,
                };
                if should_flip {
                    masked[row * self.size + col] = match cell {
                        Cell::Dark => Cell::Light,
                        Cell::Light => Cell::Dark,
                        other => other,
                    };
                }
            }
        }
        masked
    }

    /// Compute penalty score for a masked matrix.
    fn penalty(cells: &[Cell], size: usize) -> u32 {
        let mut score = 0u32;

        // Rule 1: runs of same color in rows and columns
        for row in 0..size {
            let mut run = 1u32;
            for col in 1..size {
                if cells[row * size + col].is_dark() == cells[row * size + col - 1].is_dark() {
                    run += 1;
                } else {
                    if run >= 5 { score += run - 2; }
                    run = 1;
                }
            }
            if run >= 5 { score += run - 2; }
        }
        for col in 0..size {
            let mut run = 1u32;
            for row in 1..size {
                if cells[row * size + col].is_dark() == cells[(row - 1) * size + col].is_dark() {
                    run += 1;
                } else {
                    if run >= 5 { score += run - 2; }
                    run = 1;
                }
            }
            if run >= 5 { score += run - 2; }
        }

        // Rule 2: 2x2 blocks of same color
        for row in 0..size - 1 {
            for col in 0..size - 1 {
                let d = cells[row * size + col].is_dark();
                if d == cells[row * size + col + 1].is_dark()
                    && d == cells[(row + 1) * size + col].is_dark()
                    && d == cells[(row + 1) * size + col + 1].is_dark()
                {
                    score += 3;
                }
            }
        }

        // Rule 3: finder-like patterns (1011101 0000 or 0000 1011101)
        let pattern_a: [bool; 11] = [true, false, true, true, true, false, true, false, false, false, false];
        let pattern_b: [bool; 11] = [false, false, false, false, true, false, true, true, true, false, true];
        for row in 0..size {
            for col in 0..=size - 11 {
                let mut match_a = true;
                let mut match_b = true;
                for k in 0..11 {
                    let dark = cells[row * size + col + k].is_dark();
                    if dark != pattern_a[k] { match_a = false; }
                    if dark != pattern_b[k] { match_b = false; }
                }
                if match_a { score += 40; }
                if match_b { score += 40; }
            }
        }
        for col in 0..size {
            for row in 0..=size - 11 {
                let mut match_a = true;
                let mut match_b = true;
                for k in 0..11 {
                    let dark = cells[(row + k) * size + col].is_dark();
                    if dark != pattern_a[k] { match_a = false; }
                    if dark != pattern_b[k] { match_b = false; }
                }
                if match_a { score += 40; }
                if match_b { score += 40; }
            }
        }

        // Rule 4: proportion of dark modules
        let total = (size * size) as u32;
        let dark_count = cells.iter().filter(|c| c.is_dark()).count() as u32;
        let pct = (dark_count * 100) / total;
        let prev5 = (pct / 5) * 5;
        let next5 = prev5 + 5;
        let dev_prev = if prev5 >= 50 { prev5 - 50 } else { 50 - prev5 };
        let dev_next = if next5 >= 50 { next5 - 50 } else { 50 - next5 };
        score += (dev_prev / 5).min(dev_next / 5) * 10;

        score
    }

    /// Write format info (EC level + mask) using BCH(15,5).
    fn write_format(cells: &mut [Cell], size: usize, ec: EcLevel, mask: u8) {
        let ec_bits: u8 = match ec {
            EcLevel::L => 0b01,
            EcLevel::M => 0b00,
            EcLevel::Q => 0b11,
            EcLevel::H => 0b10,
        };
        let data = ((ec_bits as u32) << 3) | (mask as u32);

        // BCH(15,5) encoding
        let mut bits = data << 10;
        let gen = 0b10100110111u32; // generator polynomial
        for i in (0..5).rev() {
            if bits & (1 << (i + 10)) != 0 {
                bits ^= gen << i;
            }
        }
        let format_bits = ((data << 10) | bits) ^ 0b101010000010010; // XOR mask

        // Place format bits
        // Horizontal: left of top-left finder
        let positions_h = [0, 1, 2, 3, 4, 5, 7, 8, size - 8, size - 7, size - 6, size - 5, size - 4, size - 3, size - 2];
        for (i, &col) in positions_h.iter().enumerate() {
            let dark = (format_bits >> (14 - i)) & 1 == 1;
            cells[8 * size + col] = if dark { Cell::Dark } else { Cell::Light };
        }

        // Vertical: below top-left finder
        let positions_v = [0, 1, 2, 3, 4, 5, 7, 8, size - 7, size - 6, size - 5, size - 4, size - 3, size - 2, size - 1];
        for (i, &row) in positions_v.iter().rev().enumerate() {
            let dark = (format_bits >> (14 - i)) & 1 == 1;
            cells[row * size + 8] = if dark { Cell::Dark } else { Cell::Light };
        }
    }

    /// Write version info (versions 7+) using BCH(18,6).
    fn write_version(cells: &mut [Cell], size: usize, version: usize) {
        if version < 7 {
            return;
        }
        let data = version as u32;
        let mut bits = data << 12;
        let gen = 0b1111100100101u32;
        for i in (0..6).rev() {
            if bits & (1 << (i + 12)) != 0 {
                bits ^= gen << i;
            }
        }
        let version_bits = (data << 12) | bits;

        for i in 0..18 {
            let dark = (version_bits >> i) & 1 == 1;
            let row = i / 3;
            let col = size - 11 + (i % 3);
            cells[row * size + col] = if dark { Cell::Dark } else { Cell::Light };
            cells[col * size + row] = if dark { Cell::Dark } else { Cell::Light };
        }
    }

    /// Build final QR matrix: returns a flat bool array (true = dark module).
    pub fn build(version: usize, ec: EcLevel, data: &[u8]) -> Vec<bool> {
        let mut m = QrMatrix::new(version);
        let s = m.size;

        // Place finder patterns
        m.place_finder(0, 0);
        m.place_finder(0, s as isize - 7);
        m.place_finder(s as isize - 7, 0);
        m.place_separators();

        // Place alignment patterns
        m.place_alignment();

        // Place timing patterns
        m.place_timing();

        // Reserve format/version areas
        m.reserve_format();
        m.reserve_version();

        // Place data bits
        m.place_data(data);

        // Try all 8 masks, pick best
        let mut best_mask = 0u8;
        let mut best_penalty = u32::MAX;
        let mut best_cells = m.cells.clone();

        for mask in 0..8u8 {
            let mut masked = m.apply_mask(mask);
            QrMatrix::write_format(&mut masked, s, ec, mask);
            QrMatrix::write_version(&mut masked, s, version);
            let p = QrMatrix::penalty(&masked, s);
            if p < best_penalty {
                best_penalty = p;
                best_mask = mask;
                best_cells = masked;
            }
        }

        // Write final format/version info with best mask
        QrMatrix::write_format(&mut best_cells, s, ec, best_mask);
        QrMatrix::write_version(&mut best_cells, s, version);

        best_cells.iter().map(|c| c.is_dark()).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matrix_size_v1() {
        assert_eq!(matrix_size(1), 21);
    }

    #[test]
    fn matrix_size_v10() {
        assert_eq!(matrix_size(10), 57);
    }

    #[test]
    fn build_v1_produces_correct_size() {
        // Minimal data for V1-M
        let data = vec![0u8; 26]; // total codewords for V1-M = 26
        let modules = QrMatrix::build(1, EcLevel::M, &data);
        assert_eq!(modules.len(), 21 * 21);
    }

    #[test]
    fn finder_pattern_present() {
        let data = vec![0u8; 26];
        let modules = QrMatrix::build(1, EcLevel::M, &data);
        // Top-left finder: corners should be dark
        assert!(modules[0]); // (0,0) dark
        assert!(modules[6]); // (0,6) dark
        assert!(modules[6 * 21]); // (6,0) dark
        assert!(modules[6 * 21 + 6]); // (6,6) dark
    }
}
```

- [ ] **Step 5: Create png.rs — minimal PNG encoder**

```rust
use flate2::write::ZlibEncoder;
use flate2::Compression;
use std::io::Write;

const PNG_SIGNATURE: [u8; 8] = [137, 80, 78, 71, 13, 10, 26, 10];

fn crc32(data: &[u8]) -> u32 {
    let mut crc: u32 = 0xFFFFFFFF;
    for &byte in data {
        crc ^= byte as u32;
        for _ in 0..8 {
            if crc & 1 != 0 {
                crc = (crc >> 1) ^ 0xEDB88320;
            } else {
                crc >>= 1;
            }
        }
    }
    !crc
}

fn write_chunk(out: &mut Vec<u8>, chunk_type: &[u8; 4], data: &[u8]) {
    out.extend_from_slice(&(data.len() as u32).to_be_bytes());
    out.extend_from_slice(chunk_type);
    out.extend_from_slice(data);
    let mut crc_data = Vec::with_capacity(4 + data.len());
    crc_data.extend_from_slice(chunk_type);
    crc_data.extend_from_slice(data);
    out.extend_from_slice(&crc32(&crc_data).to_be_bytes());
}

/// Parse a hex color string like "#FF00AA" into (R, G, B).
pub fn parse_hex_color(hex: &str) -> (u8, u8, u8) {
    let hex = hex.trim_start_matches('#');
    if hex.len() < 6 {
        return (0, 0, 0);
    }
    let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(0);
    let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0);
    let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0);
    (r, g, b)
}

/// Encode a QR module grid as a PNG image.
/// `modules` is a flat bool array (true = dark), `qr_size` is modules per side.
/// `pixel_size` is the output image width/height in pixels.
/// `margin` is the quiet zone in modules.
pub fn encode_png(
    modules: &[bool],
    qr_size: usize,
    pixel_size: u32,
    margin: usize,
    fg: &str,
    bg: &str,
) -> Vec<u8> {
    let (fg_r, fg_g, fg_b) = parse_hex_color(fg);
    let (bg_r, bg_g, bg_b) = parse_hex_color(bg);

    let total_modules = qr_size + 2 * margin;
    let scale = pixel_size as f64 / total_modules as f64;
    let img_size = pixel_size as usize;

    // Build raw image data (RGB, with filter byte per row)
    let mut raw = Vec::with_capacity(img_size * (img_size * 3 + 1));
    for y in 0..img_size {
        raw.push(0); // filter: None
        for x in 0..img_size {
            let mod_x = (x as f64 / scale) as usize;
            let mod_y = (y as f64 / scale) as usize;
            let is_dark = if mod_x >= margin
                && mod_x < margin + qr_size
                && mod_y >= margin
                && mod_y < margin + qr_size
            {
                modules[(mod_y - margin) * qr_size + (mod_x - margin)]
            } else {
                false
            };
            if is_dark {
                raw.extend_from_slice(&[fg_r, fg_g, fg_b]);
            } else {
                raw.extend_from_slice(&[bg_r, bg_g, bg_b]);
            }
        }
    }

    // Compress with zlib
    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(&raw).unwrap();
    let compressed = encoder.finish().unwrap();

    // Build PNG
    let mut png = Vec::new();
    png.extend_from_slice(&PNG_SIGNATURE);

    // IHDR
    let mut ihdr = Vec::with_capacity(13);
    ihdr.extend_from_slice(&(img_size as u32).to_be_bytes()); // width
    ihdr.extend_from_slice(&(img_size as u32).to_be_bytes()); // height
    ihdr.push(8); // bit depth
    ihdr.push(2); // color type: RGB
    ihdr.push(0); // compression
    ihdr.push(0); // filter
    ihdr.push(0); // interlace
    write_chunk(&mut png, b"IHDR", &ihdr);

    // IDAT
    write_chunk(&mut png, b"IDAT", &compressed);

    // IEND
    write_chunk(&mut png, b"IEND", &[]);

    png
}

/// Base64 encode bytes (no padding variant not needed — standard base64).
pub fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::with_capacity((data.len() + 2) / 3 * 4);

    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let triple = (b0 << 16) | (b1 << 8) | b2;

        result.push(CHARS[((triple >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((triple >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARS[((triple >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARS[(triple & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_black() {
        assert_eq!(parse_hex_color("#000000"), (0, 0, 0));
    }

    #[test]
    fn parse_white() {
        assert_eq!(parse_hex_color("#ffffff"), (255, 255, 255));
    }

    #[test]
    fn parse_color() {
        assert_eq!(parse_hex_color("#FF8800"), (255, 136, 0));
    }

    #[test]
    fn png_starts_with_signature() {
        let modules = vec![true, false, false, true];
        let png = encode_png(&modules, 2, 10, 0, "#000000", "#ffffff");
        assert_eq!(&png[0..8], &PNG_SIGNATURE);
    }

    #[test]
    fn base64_encode_empty() {
        assert_eq!(base64_encode(&[]), "");
    }

    #[test]
    fn base64_encode_hello() {
        assert_eq!(base64_encode(b"Hello"), "SGVsbG8=");
    }
}
```

- [ ] **Step 6: Create svg.rs — SVG string builder**

```rust
/// Build an SVG string from QR modules.
/// `modules` is a flat bool array (true = dark), `qr_size` is modules per side.
/// `pixel_size` is the output image width/height.
/// `margin` is the quiet zone in modules.
pub fn build_svg(
    modules: &[bool],
    qr_size: usize,
    pixel_size: u32,
    margin: usize,
    fg: &str,
    bg: &str,
) -> String {
    let total_modules = qr_size + 2 * margin;
    let module_size = pixel_size as f64 / total_modules as f64;

    let mut svg = String::new();
    svg.push_str(&format!(
        "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {} {}\" width=\"{}\" height=\"{}\">",
        pixel_size, pixel_size, pixel_size, pixel_size
    ));

    // Background rect
    svg.push_str(&format!(
        "<rect width=\"{}\" height=\"{}\" fill=\"{}\"/>",
        pixel_size, pixel_size, bg
    ));

    // Dark modules
    for row in 0..qr_size {
        for col in 0..qr_size {
            if modules[row * qr_size + col] {
                let x = (col + margin) as f64 * module_size;
                let y = (row + margin) as f64 * module_size;
                svg.push_str(&format!(
                    "<rect x=\"{:.2}\" y=\"{:.2}\" width=\"{:.2}\" height=\"{:.2}\" fill=\"{}\"/>",
                    x, y, module_size, module_size, fg
                ));
            }
        }
    }

    svg.push_str("</svg>");
    svg
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn svg_contains_tags() {
        let modules = vec![true, false, false, true];
        let svg = build_svg(&modules, 2, 100, 0, "#000000", "#ffffff");
        assert!(svg.starts_with("<svg"));
        assert!(svg.ends_with("</svg>"));
    }

    #[test]
    fn svg_has_background() {
        let modules = vec![false; 4];
        let svg = build_svg(&modules, 2, 100, 0, "#000000", "#FF0000");
        assert!(svg.contains("fill=\"#FF0000\""));
    }

    #[test]
    fn svg_has_dark_modules() {
        let modules = vec![true, false, false, false];
        let svg = build_svg(&modules, 2, 100, 0, "#112233", "#ffffff");
        assert!(svg.contains("fill=\"#112233\""));
    }
}
```

- [ ] **Step 7: Create lib.rs — wasm_bindgen exports**

```rust
use wasm_bindgen::prelude::*;

mod ec;
mod encode;
mod matrix;
mod png;
mod svg;

use encode::EcLevel;

#[wasm_bindgen]
pub fn generate_qr_png_data_url(
    data: &str,
    size: u32,
    fg: &str,
    bg: &str,
    ec: &str,
) -> Result<String, JsError> {
    if data.is_empty() {
        return Err(JsError::new("Data must not be empty"));
    }

    let ec_level = EcLevel::from_str(ec);
    let data_bytes = data.as_bytes();

    let (version, codewords) = encode::encode_data(data_bytes, ec_level)
        .ok_or_else(|| JsError::new("Data too long for QR code"))?;

    let interleaved = encode::interleave(version, ec_level, &codewords);
    let modules = matrix::QrMatrix::build(version, ec_level, &interleaved);
    let qr_size = matrix::matrix_size(version);

    let png_bytes = png::encode_png(&modules, qr_size, size, 2, fg, bg);
    let b64 = png::base64_encode(&png_bytes);

    Ok(format!("data:image/png;base64,{}", b64))
}

#[wasm_bindgen]
pub fn generate_qr_svg_string(
    data: &str,
    size: u32,
    fg: &str,
    bg: &str,
    ec: &str,
) -> Result<String, JsError> {
    if data.is_empty() {
        return Err(JsError::new("Data must not be empty"));
    }

    let ec_level = EcLevel::from_str(ec);
    let data_bytes = data.as_bytes();

    let (version, codewords) = encode::encode_data(data_bytes, ec_level)
        .ok_or_else(|| JsError::new("Data too long for QR code"))?;

    let interleaved = encode::interleave(version, ec_level, &codewords);
    let modules = matrix::QrMatrix::build(version, ec_level, &interleaved);
    let qr_size = matrix::matrix_size(version);

    Ok(svg::build_svg(&modules, qr_size, size, 2, fg, bg))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn png_data_url_format() {
        let result = generate_qr_png_data_url("hello", 256, "#000000", "#ffffff", "M").unwrap();
        assert!(result.starts_with("data:image/png;base64,"));
    }

    #[test]
    fn svg_string_format() {
        let result = generate_qr_svg_string("hello", 256, "#000000", "#ffffff", "M").unwrap();
        assert!(result.contains("<svg"));
        assert!(result.contains("</svg>"));
    }

    #[test]
    fn empty_data_errors() {
        let result = generate_qr_png_data_url("", 256, "#000000", "#ffffff", "M");
        assert!(result.is_err());
    }

    #[test]
    fn different_ec_levels_differ() {
        let low = generate_qr_png_data_url("hello", 256, "#000000", "#ffffff", "L").unwrap();
        let high = generate_qr_png_data_url("hello", 256, "#000000", "#ffffff", "H").unwrap();
        assert_ne!(low, high);
    }
}
```

- [ ] **Step 8: Run Rust tests**

Run: `cd wasm && cargo test -p csr-qrcode`
Expected: All tests pass (GF(256), RS encoding, version selection, data encoding, PNG, SVG, integration).

- [ ] **Step 9: Build WASM**

Run: `cd wasm && ../node_modules/.bin/wasm-pack build crates/csr-qrcode --target web --dev --out-dir ../../wasm/pkg/csr-qrcode --out-name csr-qrcode`
Expected: Successful build, outputs in `wasm/pkg/csr-qrcode/`.

- [ ] **Step 10: Commit**

```bash
git add wasm/crates/csr-qrcode/ wasm/Cargo.lock
git commit -m "feat(wasm): implement csr-qrcode crate with QR generation"
```

---

### Task 2: Scaffold csr-markdown crate — block parser

**Files:**
- Create: `wasm/crates/csr-markdown/Cargo.toml`
- Create: `wasm/crates/csr-markdown/src/lib.rs`
- Create: `wasm/crates/csr-markdown/src/block.rs`
- Create: `wasm/crates/csr-markdown/src/inline.rs` (stub)
- Create: `wasm/crates/csr-markdown/src/emit.rs` (stub)
- Create: `wasm/crates/csr-markdown/src/html_parse.rs` (stub)
- Create: `wasm/crates/csr-markdown/src/html_to_md.rs` (stub)

- [ ] **Step 1: Create Cargo.toml**

```toml
[package]
name = "csr-markdown"
version = "0.1.0"
edition.workspace = true

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
```

- [ ] **Step 2: Create block.rs — block-level parser**

This module parses markdown text into a tree of block-level elements. Each block contains raw text content that will be processed by the inline parser later.

```rust
/// Block-level AST node.
#[derive(Debug, Clone)]
pub enum Block {
    Heading { level: u8, content: String },
    Paragraph { content: String },
    CodeBlock { language: String, content: String },
    Blockquote { children: Vec<Block> },
    UnorderedList { items: Vec<ListItem> },
    OrderedList { start: u32, items: Vec<ListItem> },
    ThematicBreak,
    HtmlBlock { content: String },
    Table { headers: Vec<String>, rows: Vec<Vec<String>> },
}

#[derive(Debug, Clone)]
pub struct ListItem {
    pub checked: Option<bool>, // None = not a task, Some(true) = [x], Some(false) = [ ]
    pub content: String,
    pub children: Vec<Block>,
}

/// Parse markdown source into a sequence of blocks.
pub fn parse_blocks(input: &str) -> Vec<Block> {
    let lines: Vec<&str> = input.lines().collect();
    let mut blocks = Vec::new();
    let mut i = 0;

    while i < lines.len() {
        let line = lines[i];
        let trimmed = line.trim();

        // Blank line — skip
        if trimmed.is_empty() {
            i += 1;
            continue;
        }

        // Thematic break: ---, ***, ___  (3+ chars, optionally with spaces)
        if is_thematic_break(trimmed) {
            blocks.push(Block::ThematicBreak);
            i += 1;
            continue;
        }

        // ATX heading: # through ######
        if let Some(heading) = parse_atx_heading(trimmed) {
            blocks.push(heading);
            i += 1;
            continue;
        }

        // Fenced code block: ``` or ~~~
        if trimmed.starts_with("```") || trimmed.starts_with("~~~") {
            let fence_char = trimmed.chars().next().unwrap();
            let fence_len = trimmed.chars().take_while(|&c| c == fence_char).count();
            let language = trimmed[fence_len..].trim().to_string();
            let mut content = String::new();
            i += 1;
            while i < lines.len() {
                let l = lines[i];
                let lt = l.trim();
                if lt.starts_with(&fence_char.to_string().repeat(fence_len))
                    && lt.trim_start_matches(fence_char).trim().is_empty()
                {
                    i += 1;
                    break;
                }
                if !content.is_empty() {
                    content.push('\n');
                }
                content.push_str(l);
                i += 1;
            }
            blocks.push(Block::CodeBlock { language, content });
            continue;
        }

        // HTML block: starts with < and a known block tag
        if is_html_block_start(trimmed) {
            let mut content = String::new();
            while i < lines.len() {
                if !content.is_empty() {
                    content.push('\n');
                }
                content.push_str(lines[i]);
                i += 1;
                if lines[i - 1].trim().is_empty() {
                    break;
                }
            }
            blocks.push(Block::HtmlBlock { content });
            continue;
        }

        // Blockquote: > prefix
        if trimmed.starts_with("> ") || trimmed == ">" {
            let mut bq_lines = Vec::new();
            while i < lines.len() {
                let l = lines[i].trim();
                if l.starts_with("> ") {
                    bq_lines.push(&l[2..]);
                } else if l == ">" {
                    bq_lines.push("");
                } else if l.is_empty() {
                    break;
                } else {
                    // Lazy continuation
                    bq_lines.push(l);
                }
                i += 1;
            }
            let inner = bq_lines.join("\n");
            let children = parse_blocks(&inner);
            blocks.push(Block::Blockquote { children });
            continue;
        }

        // Unordered list: - , * , +
        if is_ul_start(trimmed) {
            let (items, new_i) = parse_list_items(&lines, i, false);
            blocks.push(Block::UnorderedList { items });
            i = new_i;
            continue;
        }

        // Ordered list: 1. , 2. , etc.
        if is_ol_start(trimmed) {
            let start = trimmed.split('.').next().unwrap_or("1").parse::<u32>().unwrap_or(1);
            let (items, new_i) = parse_list_items(&lines, i, true);
            blocks.push(Block::OrderedList { start, items });
            i = new_i;
            continue;
        }

        // Table: | col | col |
        if trimmed.starts_with('|') && i + 1 < lines.len() && is_table_separator(lines[i + 1].trim()) {
            let (table, new_i) = parse_table(&lines, i);
            blocks.push(table);
            i = new_i;
            continue;
        }

        // Indented code block: 4 spaces or tab
        if line.starts_with("    ") || line.starts_with('\t') {
            let mut content = String::new();
            while i < lines.len() && (lines[i].starts_with("    ") || lines[i].starts_with('\t') || lines[i].trim().is_empty()) {
                if !content.is_empty() {
                    content.push('\n');
                }
                let l = lines[i];
                if l.starts_with("    ") {
                    content.push_str(&l[4..]);
                } else if l.starts_with('\t') {
                    content.push_str(&l[1..]);
                } else {
                    content.push_str(l);
                }
                i += 1;
            }
            // Trim trailing blank lines from code block
            let content = content.trim_end_matches('\n').to_string();
            blocks.push(Block::CodeBlock { language: String::new(), content });
            continue;
        }

        // Paragraph: collect until blank line or block-level start
        let mut para = String::new();
        while i < lines.len() {
            let l = lines[i];
            let lt = l.trim();
            if lt.is_empty()
                || is_thematic_break(lt)
                || parse_atx_heading(lt).is_some()
                || lt.starts_with("```")
                || lt.starts_with("~~~")
                || (lt.starts_with("> ") || lt == ">")
                || is_ul_start(lt)
                || is_ol_start(lt)
                || is_html_block_start(lt)
            {
                break;
            }
            if !para.is_empty() {
                para.push('\n');
            }
            para.push_str(lt);
            i += 1;
        }
        if !para.is_empty() {
            blocks.push(Block::Paragraph { content: para });
        }
    }

    blocks
}

fn is_thematic_break(line: &str) -> bool {
    let chars: Vec<char> = line.chars().filter(|c| !c.is_whitespace()).collect();
    chars.len() >= 3
        && (chars.iter().all(|&c| c == '-')
            || chars.iter().all(|&c| c == '*')
            || chars.iter().all(|&c| c == '_'))
}

fn parse_atx_heading(line: &str) -> Option<Block> {
    if !line.starts_with('#') {
        return None;
    }
    let level = line.chars().take_while(|&c| c == '#').count();
    if level > 6 {
        return None;
    }
    let rest = &line[level..];
    if !rest.is_empty() && !rest.starts_with(' ') {
        return None;
    }
    let content = rest.trim().trim_end_matches('#').trim().to_string();
    Some(Block::Heading { level: level as u8, content })
}

fn is_html_block_start(line: &str) -> bool {
    let lower = line.to_lowercase();
    lower.starts_with("<script")
        || lower.starts_with("<style")
        || lower.starts_with("<pre")
        || lower.starts_with("<div")
        || lower.starts_with("<table")
        || lower.starts_with("<form")
        || lower.starts_with("<!--")
}

fn is_ul_start(line: &str) -> bool {
    (line.starts_with("- ") || line.starts_with("* ") || line.starts_with("+ "))
        || line == "-" || line == "*" || line == "+"
}

fn is_ol_start(line: &str) -> bool {
    let dot_pos = line.find(". ");
    if let Some(pos) = dot_pos {
        line[..pos].chars().all(|c| c.is_ascii_digit()) && pos > 0
    } else {
        false
    }
}

fn is_table_separator(line: &str) -> bool {
    if !line.starts_with('|') {
        return false;
    }
    let cells: Vec<&str> = line.split('|').filter(|s| !s.is_empty()).collect();
    cells.iter().all(|cell| {
        let t = cell.trim();
        t.chars().all(|c| c == '-' || c == ':' || c == ' ') && t.contains('-')
    })
}

fn parse_table(lines: &[&str], start: usize) -> (Block, usize) {
    let header_line = lines[start].trim();
    let headers: Vec<String> = header_line
        .split('|')
        .filter(|s| !s.is_empty())
        .map(|s| s.trim().to_string())
        .collect();

    let mut i = start + 2; // skip header + separator
    let mut rows = Vec::new();

    while i < lines.len() {
        let line = lines[i].trim();
        if !line.starts_with('|') || line.is_empty() {
            break;
        }
        let row: Vec<String> = line
            .split('|')
            .filter(|s| !s.is_empty())
            .map(|s| s.trim().to_string())
            .collect();
        rows.push(row);
        i += 1;
    }

    (Block::Table { headers, rows }, i)
}

fn parse_list_items(lines: &[&str], start: usize, ordered: bool) -> (Vec<ListItem>, usize) {
    let mut items = Vec::new();
    let mut i = start;

    while i < lines.len() {
        let line = lines[i].trim();
        if line.is_empty() {
            // Check if next non-blank line continues the list
            let mut j = i + 1;
            while j < lines.len() && lines[j].trim().is_empty() {
                j += 1;
            }
            if j < lines.len() && (if ordered { is_ol_start(lines[j].trim()) } else { is_ul_start(lines[j].trim()) }) {
                i = j;
                continue;
            }
            break;
        }

        let content_start = if ordered {
            if let Some(pos) = line.find(". ") {
                if line[..pos].chars().all(|c| c.is_ascii_digit()) {
                    pos + 2
                } else {
                    break;
                }
            } else {
                break;
            }
        } else if line.starts_with("- ") || line.starts_with("* ") || line.starts_with("+ ") {
            2
        } else {
            break;
        };

        let text = &line[content_start..];

        // Check for task list checkbox
        let (checked, text) = if text.starts_with("[ ] ") {
            (Some(false), &text[4..])
        } else if text.starts_with("[x] ") || text.starts_with("[X] ") {
            (Some(true), &text[4..])
        } else {
            (None, text)
        };

        items.push(ListItem {
            checked,
            content: text.to_string(),
            children: Vec::new(),
        });

        i += 1;
    }

    (items, i)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_heading() {
        let blocks = parse_blocks("# Hello");
        assert_eq!(blocks.len(), 1);
        match &blocks[0] {
            Block::Heading { level, content } => {
                assert_eq!(*level, 1);
                assert_eq!(content, "Hello");
            }
            _ => panic!("Expected heading"),
        }
    }

    #[test]
    fn parse_paragraph() {
        let blocks = parse_blocks("Hello world");
        assert_eq!(blocks.len(), 1);
        match &blocks[0] {
            Block::Paragraph { content } => assert_eq!(content, "Hello world"),
            _ => panic!("Expected paragraph"),
        }
    }

    #[test]
    fn parse_fenced_code() {
        let input = "```rust\nfn main() {}\n```";
        let blocks = parse_blocks(input);
        assert_eq!(blocks.len(), 1);
        match &blocks[0] {
            Block::CodeBlock { language, content } => {
                assert_eq!(language, "rust");
                assert_eq!(content, "fn main() {}");
            }
            _ => panic!("Expected code block"),
        }
    }

    #[test]
    fn parse_blockquote() {
        let blocks = parse_blocks("> quoted text");
        assert_eq!(blocks.len(), 1);
        match &blocks[0] {
            Block::Blockquote { children } => {
                assert_eq!(children.len(), 1);
            }
            _ => panic!("Expected blockquote"),
        }
    }

    #[test]
    fn parse_unordered_list() {
        let input = "- item 1\n- item 2\n- item 3";
        let blocks = parse_blocks(input);
        assert_eq!(blocks.len(), 1);
        match &blocks[0] {
            Block::UnorderedList { items } => {
                assert_eq!(items.len(), 3);
                assert_eq!(items[0].content, "item 1");
            }
            _ => panic!("Expected unordered list"),
        }
    }

    #[test]
    fn parse_ordered_list() {
        let input = "1. first\n2. second";
        let blocks = parse_blocks(input);
        assert_eq!(blocks.len(), 1);
        match &blocks[0] {
            Block::OrderedList { start, items } => {
                assert_eq!(*start, 1);
                assert_eq!(items.len(), 2);
            }
            _ => panic!("Expected ordered list"),
        }
    }

    #[test]
    fn parse_thematic_break() {
        let blocks = parse_blocks("---");
        assert_eq!(blocks.len(), 1);
        assert!(matches!(blocks[0], Block::ThematicBreak));
    }

    #[test]
    fn parse_table() {
        let input = "| Name | Age |\n| --- | --- |\n| John | 30 |";
        let blocks = parse_blocks(input);
        assert_eq!(blocks.len(), 1);
        match &blocks[0] {
            Block::Table { headers, rows } => {
                assert_eq!(headers, &["Name", "Age"]);
                assert_eq!(rows.len(), 1);
                assert_eq!(rows[0], &["John", "30"]);
            }
            _ => panic!("Expected table"),
        }
    }

    #[test]
    fn parse_task_list() {
        let input = "- [ ] todo\n- [x] done";
        let blocks = parse_blocks(input);
        match &blocks[0] {
            Block::UnorderedList { items } => {
                assert_eq!(items[0].checked, Some(false));
                assert_eq!(items[0].content, "todo");
                assert_eq!(items[1].checked, Some(true));
                assert_eq!(items[1].content, "done");
            }
            _ => panic!("Expected list"),
        }
    }
}
```

- [ ] **Step 3: Run block parser tests**

Run: `cd wasm && cargo test -p csr-markdown block::tests`
Expected: All block parser tests pass.

- [ ] **Step 4: Commit**

```bash
git add wasm/crates/csr-markdown/
git commit -m "feat(wasm): scaffold csr-markdown crate with block parser"
```

---

### Task 3: csr-markdown inline parser + HTML emitter

**Files:**
- Create: `wasm/crates/csr-markdown/src/inline.rs`
- Create: `wasm/crates/csr-markdown/src/emit.rs`

- [ ] **Step 1: Create inline.rs — inline element parser**

This module parses inline markdown elements within text content returned by the block parser.

```rust
/// Inline-level AST node.
#[derive(Debug, Clone)]
pub enum Inline {
    Text(String),
    Strong(Vec<Inline>),
    Emphasis(Vec<Inline>),
    Code(String),
    Link { text: Vec<Inline>, url: String, title: Option<String> },
    Image { alt: String, src: String },
    LineBreak,
    Strikethrough(Vec<Inline>),
    Html(String),
}

/// Parse inline markdown content into inline nodes.
pub fn parse_inline(input: &str) -> Vec<Inline> {
    let chars: Vec<char> = input.chars().collect();
    let mut result = Vec::new();
    let mut i = 0;
    let mut text_buf = String::new();

    while i < chars.len() {
        // Hard line break: two spaces + newline, or backslash + newline
        if i + 2 < chars.len() && chars[i] == ' ' && chars[i + 1] == ' ' && chars[i + 2] == '\n' {
            if !text_buf.is_empty() {
                result.push(Inline::Text(std::mem::take(&mut text_buf)));
            }
            result.push(Inline::LineBreak);
            i += 3;
            continue;
        }
        if i + 1 < chars.len() && chars[i] == '\\' && chars[i + 1] == '\n' {
            if !text_buf.is_empty() {
                result.push(Inline::Text(std::mem::take(&mut text_buf)));
            }
            result.push(Inline::LineBreak);
            i += 2;
            continue;
        }

        // Inline code
        if chars[i] == '`' {
            if let Some((code, end)) = parse_code_span(&chars, i) {
                if !text_buf.is_empty() {
                    result.push(Inline::Text(std::mem::take(&mut text_buf)));
                }
                result.push(Inline::Code(code));
                i = end;
                continue;
            }
        }

        // Strikethrough: ~~text~~
        if i + 1 < chars.len() && chars[i] == '~' && chars[i + 1] == '~' {
            if let Some((content, end)) = parse_delimited(&chars, i, "~~") {
                if !text_buf.is_empty() {
                    result.push(Inline::Text(std::mem::take(&mut text_buf)));
                }
                let inner = parse_inline(&content);
                result.push(Inline::Strikethrough(inner));
                i = end;
                continue;
            }
        }

        // Image: ![alt](src)
        if chars[i] == '!' && i + 1 < chars.len() && chars[i + 1] == '[' {
            if let Some((alt, src, end)) = parse_link_or_image(&chars, i + 1) {
                if !text_buf.is_empty() {
                    result.push(Inline::Text(std::mem::take(&mut text_buf)));
                }
                result.push(Inline::Image { alt, src });
                i = end;
                continue;
            }
        }

        // Link: [text](url) or [text](url "title")
        if chars[i] == '[' {
            if let Some((text, url, end)) = parse_link_or_image(&chars, i) {
                if !text_buf.is_empty() {
                    result.push(Inline::Text(std::mem::take(&mut text_buf)));
                }
                let inner = parse_inline(&text);
                result.push(Inline::Link { text: inner, url, title: None });
                i = end;
                continue;
            }
        }

        // Autolink: <https://...>
        if chars[i] == '<' {
            if let Some((url, end)) = parse_autolink(&chars, i) {
                if !text_buf.is_empty() {
                    result.push(Inline::Text(std::mem::take(&mut text_buf)));
                }
                result.push(Inline::Link {
                    text: vec![Inline::Text(url.clone())],
                    url,
                    title: None,
                });
                i = end;
                continue;
            }
            // Raw HTML passthrough
            if let Some((html, end)) = parse_inline_html(&chars, i) {
                if !text_buf.is_empty() {
                    result.push(Inline::Text(std::mem::take(&mut text_buf)));
                }
                result.push(Inline::Html(html));
                i = end;
                continue;
            }
        }

        // Strong (**) and emphasis (*)
        if chars[i] == '*' || chars[i] == '_' {
            let delim = chars[i];
            if i + 1 < chars.len() && chars[i + 1] == delim {
                // Strong: ** or __
                let marker = format!("{}{}", delim, delim);
                if let Some((content, end)) = parse_delimited(&chars, i, &marker) {
                    if !text_buf.is_empty() {
                        result.push(Inline::Text(std::mem::take(&mut text_buf)));
                    }
                    let inner = parse_inline(&content);
                    result.push(Inline::Strong(inner));
                    i = end;
                    continue;
                }
            }
            // Emphasis: * or _
            let marker = delim.to_string();
            if let Some((content, end)) = parse_delimited(&chars, i, &marker) {
                if !text_buf.is_empty() {
                    result.push(Inline::Text(std::mem::take(&mut text_buf)));
                }
                let inner = parse_inline(&content);
                result.push(Inline::Emphasis(inner));
                i = end;
                continue;
            }
        }

        // Newline → space (soft line break)
        if chars[i] == '\n' {
            text_buf.push(' ');
            i += 1;
            continue;
        }

        text_buf.push(chars[i]);
        i += 1;
    }

    if !text_buf.is_empty() {
        result.push(Inline::Text(text_buf));
    }

    result
}

fn parse_code_span(chars: &[char], start: usize) -> Option<(String, usize)> {
    let backtick_count = chars[start..].iter().take_while(|&&c| c == '`').count();
    let content_start = start + backtick_count;
    let closing = find_backtick_run(chars, content_start, backtick_count)?;
    let content: String = chars[content_start..closing].iter().collect();
    let content = content.trim().to_string();
    Some((content, closing + backtick_count))
}

fn find_backtick_run(chars: &[char], start: usize, count: usize) -> Option<usize> {
    let mut i = start;
    while i < chars.len() {
        if chars[i] == '`' {
            let run = chars[i..].iter().take_while(|&&c| c == '`').count();
            if run == count {
                return Some(i);
            }
            i += run;
        } else {
            i += 1;
        }
    }
    None
}

fn parse_delimited(chars: &[char], start: usize, marker: &str) -> Option<(String, usize)> {
    let marker_chars: Vec<char> = marker.chars().collect();
    let mlen = marker_chars.len();
    let content_start = start + mlen;
    if content_start >= chars.len() {
        return None;
    }
    // Find closing marker
    let mut i = content_start;
    while i + mlen <= chars.len() {
        if chars[i..i + mlen] == marker_chars[..] {
            let content: String = chars[content_start..i].iter().collect();
            if !content.is_empty() {
                return Some((content, i + mlen));
            }
        }
        i += 1;
    }
    None
}

fn parse_link_or_image(chars: &[char], start: usize) -> Option<(String, String, usize)> {
    if chars[start] != '[' {
        return None;
    }
    // Find closing ]
    let mut depth = 0;
    let mut i = start;
    while i < chars.len() {
        if chars[i] == '[' { depth += 1; }
        if chars[i] == ']' {
            depth -= 1;
            if depth == 0 { break; }
        }
        i += 1;
    }
    if i >= chars.len() || depth != 0 {
        return None;
    }
    let text: String = chars[start + 1..i].iter().collect();
    i += 1; // skip ]

    // Expect (
    if i >= chars.len() || chars[i] != '(' {
        return None;
    }
    i += 1; // skip (

    // Find closing ) — handle titles like (url "title")
    let url_start = i;
    let mut paren_depth = 1;
    while i < chars.len() && paren_depth > 0 {
        if chars[i] == '(' { paren_depth += 1; }
        if chars[i] == ')' { paren_depth -= 1; }
        if paren_depth > 0 { i += 1; }
    }
    if paren_depth != 0 {
        return None;
    }

    let url: String = chars[url_start..i].iter().collect();
    let url = url.trim().to_string();
    // Strip title if present
    let url = if let Some(quote_start) = url.find('"') {
        url[..quote_start].trim().to_string()
    } else {
        url
    };

    Some((text, url, i + 1))
}

fn parse_autolink(chars: &[char], start: usize) -> Option<(String, usize)> {
    if chars[start] != '<' {
        return None;
    }
    let end = chars[start..].iter().position(|&c| c == '>')?;
    let content: String = chars[start + 1..start + end].iter().collect();
    if content.starts_with("http://") || content.starts_with("https://") || content.starts_with("mailto:") {
        Some((content, start + end + 1))
    } else {
        None
    }
}

fn parse_inline_html(chars: &[char], start: usize) -> Option<(String, usize)> {
    if chars[start] != '<' {
        return None;
    }
    let end = chars[start..].iter().position(|&c| c == '>')?;
    let tag: String = chars[start..start + end + 1].iter().collect();
    // Basic check: starts with < and a letter or /
    if tag.len() >= 3 && (tag.chars().nth(1)?.is_ascii_alphabetic() || tag.chars().nth(1)? == '/') {
        Some((tag, start + end + 1))
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn plain_text() {
        let nodes = parse_inline("hello world");
        assert_eq!(nodes.len(), 1);
        assert!(matches!(&nodes[0], Inline::Text(t) if t == "hello world"));
    }

    #[test]
    fn strong_asterisks() {
        let nodes = parse_inline("**bold**");
        assert_eq!(nodes.len(), 1);
        assert!(matches!(&nodes[0], Inline::Strong(_)));
    }

    #[test]
    fn emphasis_asterisk() {
        let nodes = parse_inline("*italic*");
        assert_eq!(nodes.len(), 1);
        assert!(matches!(&nodes[0], Inline::Emphasis(_)));
    }

    #[test]
    fn inline_code() {
        let nodes = parse_inline("`code`");
        assert_eq!(nodes.len(), 1);
        assert!(matches!(&nodes[0], Inline::Code(c) if c == "code"));
    }

    #[test]
    fn link() {
        let nodes = parse_inline("[text](https://example.com)");
        assert_eq!(nodes.len(), 1);
        match &nodes[0] {
            Inline::Link { url, .. } => assert_eq!(url, "https://example.com"),
            _ => panic!("Expected link"),
        }
    }

    #[test]
    fn image() {
        let nodes = parse_inline("![alt](image.png)");
        assert_eq!(nodes.len(), 1);
        match &nodes[0] {
            Inline::Image { alt, src } => {
                assert_eq!(alt, "alt");
                assert_eq!(src, "image.png");
            }
            _ => panic!("Expected image"),
        }
    }

    #[test]
    fn strikethrough() {
        let nodes = parse_inline("~~deleted~~");
        assert_eq!(nodes.len(), 1);
        assert!(matches!(&nodes[0], Inline::Strikethrough(_)));
    }
}
```

- [ ] **Step 2: Create emit.rs — block AST + inline → HTML with sanitization**

```rust
use crate::block::{Block, ListItem};
use crate::inline::{self, Inline};

/// Render markdown blocks to HTML string, with sanitization.
pub fn blocks_to_html(blocks: &[Block]) -> String {
    let mut out = String::new();
    for block in blocks {
        render_block(block, &mut out);
    }
    sanitize_html(&out)
}

fn render_block(block: &Block, out: &mut String) {
    match block {
        Block::Heading { level, content } => {
            out.push_str(&format!("<h{}>", level));
            render_inlines(&inline::parse_inline(content), out);
            out.push_str(&format!("</h{}>\n", level));
        }
        Block::Paragraph { content } => {
            out.push_str("<p>");
            render_inlines(&inline::parse_inline(content), out);
            out.push_str("</p>\n");
        }
        Block::CodeBlock { language, content } => {
            if language.is_empty() {
                out.push_str("<pre><code>");
            } else {
                out.push_str(&format!("<pre><code class=\"language-{}\">", escape_html(language)));
            }
            out.push_str(&escape_html(content));
            out.push_str("</code></pre>\n");
        }
        Block::Blockquote { children } => {
            out.push_str("<blockquote>\n");
            for child in children {
                render_block(child, out);
            }
            out.push_str("</blockquote>\n");
        }
        Block::UnorderedList { items } => {
            out.push_str("<ul>\n");
            for item in items {
                render_list_item(item, out);
            }
            out.push_str("</ul>\n");
        }
        Block::OrderedList { start, items } => {
            if *start == 1 {
                out.push_str("<ol>\n");
            } else {
                out.push_str(&format!("<ol start=\"{}\">\n", start));
            }
            for item in items {
                render_list_item(item, out);
            }
            out.push_str("</ol>\n");
        }
        Block::ThematicBreak => {
            out.push_str("<hr />\n");
        }
        Block::HtmlBlock { content } => {
            out.push_str(content);
            out.push('\n');
        }
        Block::Table { headers, rows } => {
            out.push_str("<table>\n<thead>\n<tr>\n");
            for header in headers {
                out.push_str("<th>");
                render_inlines(&inline::parse_inline(header), out);
                out.push_str("</th>\n");
            }
            out.push_str("</tr>\n</thead>\n<tbody>\n");
            for row in rows {
                out.push_str("<tr>\n");
                for cell in row {
                    out.push_str("<td>");
                    render_inlines(&inline::parse_inline(cell), out);
                    out.push_str("</td>\n");
                }
                out.push_str("</tr>\n");
            }
            out.push_str("</tbody>\n</table>\n");
        }
    }
}

fn render_list_item(item: &ListItem, out: &mut String) {
    out.push_str("<li>");
    if let Some(checked) = item.checked {
        out.push_str(&format!(
            "<input type=\"checkbox\" disabled{}> ",
            if checked { " checked" } else { "" }
        ));
    }
    render_inlines(&inline::parse_inline(&item.content), out);
    for child in &item.children {
        render_block(child, out);
    }
    out.push_str("</li>\n");
}

fn render_inlines(inlines: &[Inline], out: &mut String) {
    for inline in inlines {
        render_inline(inline, out);
    }
}

fn render_inline(node: &Inline, out: &mut String) {
    match node {
        Inline::Text(text) => out.push_str(&escape_html(text)),
        Inline::Strong(children) => {
            out.push_str("<strong>");
            render_inlines(children, out);
            out.push_str("</strong>");
        }
        Inline::Emphasis(children) => {
            out.push_str("<em>");
            render_inlines(children, out);
            out.push_str("</em>");
        }
        Inline::Code(code) => {
            out.push_str("<code>");
            out.push_str(&escape_html(code));
            out.push_str("</code>");
        }
        Inline::Link { text, url, title } => {
            out.push_str(&format!("<a href=\"{}\">", escape_attr(url)));
            render_inlines(text, out);
            out.push_str("</a>");
        }
        Inline::Image { alt, src } => {
            out.push_str(&format!(
                "<img src=\"{}\" alt=\"{}\">",
                escape_attr(src),
                escape_attr(alt)
            ));
        }
        Inline::LineBreak => {
            out.push_str("<br />\n");
        }
        Inline::Strikethrough(children) => {
            out.push_str("<del>");
            render_inlines(children, out);
            out.push_str("</del>");
        }
        Inline::Html(html) => {
            out.push_str(html);
        }
    }
}

fn escape_html(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

fn escape_attr(s: &str) -> String {
    escape_html(s)
}

/// Sanitize HTML output: strip dangerous elements and attributes.
fn sanitize_html(html: &str) -> String {
    let mut result = html.to_string();

    // Strip dangerous tags (with content)
    let tag_patterns = [
        (r"<script\b[^<]*(?:(?!</script>)<[^<]*)*</script>", ""),
        (r"<iframe\b[^<]*(?:(?!</iframe>)<[^<]*)*</iframe>", ""),
        (r"<object\b[^<]*(?:(?!</object>)<[^<]*)*</object>", ""),
        (r"<form\b[^<]*(?:(?!</form>)<[^<]*)*</form>", ""),
        (r"<svg\b[^<]*(?:(?!</svg>)<[^<]*)*</svg>", ""),
    ];

    // Simple string-based sanitization (no regex crate needed)
    result = strip_tag_with_content(&result, "script");
    result = strip_tag_with_content(&result, "iframe");
    result = strip_tag_with_content(&result, "object");
    result = strip_tag_with_content(&result, "form");
    result = strip_tag_with_content(&result, "svg");

    // Strip self-closing dangerous tags
    result = strip_self_closing(&result, "embed");
    result = strip_self_closing(&result, "base");
    result = strip_self_closing(&result, "meta");

    // Strip event handlers: on* attributes
    result = strip_event_handlers(&result);

    // Neuter javascript: and data: URIs
    result = neuter_dangerous_uris(&result);

    result
}

fn strip_tag_with_content(html: &str, tag: &str) -> String {
    let mut result = html.to_string();
    loop {
        let open_tag = format!("<{}", tag);
        let close_tag = format!("</{}>", tag);
        let lower = result.to_lowercase();
        if let Some(start) = lower.find(&open_tag) {
            if let Some(end) = lower[start..].find(&close_tag) {
                let remove_end = start + end + close_tag.len();
                result = format!("{}{}", &result[..start], &result[remove_end..]);
                continue;
            }
        }
        break;
    }
    result
}

fn strip_self_closing(html: &str, tag: &str) -> String {
    let mut result = html.to_string();
    loop {
        let lower = result.to_lowercase();
        let pattern = format!("<{}", tag);
        if let Some(start) = lower.find(&pattern) {
            if let Some(end) = result[start..].find('>') {
                result = format!("{}{}", &result[..start], &result[start + end + 1..]);
                continue;
            }
        }
        break;
    }
    result
}

fn strip_event_handlers(html: &str) -> String {
    let mut result = String::with_capacity(html.len());
    let chars: Vec<char> = html.chars().collect();
    let mut i = 0;

    while i < chars.len() {
        // Look for on* attributes (preceded by space or /)
        if i > 0 && (chars[i - 1] == ' ' || chars[i - 1] == '/' || chars[i - 1] == '\t' || chars[i - 1] == '\n') {
            let rest: String = chars[i..].iter().take(20).collect();
            let rest_lower = rest.to_lowercase();
            if rest_lower.starts_with("on") && rest_lower.chars().nth(2).is_some_and(|c| c.is_ascii_alphabetic()) {
                // Skip until end of attribute value
                if let Some(eq_pos) = rest.find('=') {
                    let after_eq = i + eq_pos + 1;
                    if after_eq < chars.len() {
                        // Skip whitespace
                        let mut j = after_eq;
                        while j < chars.len() && chars[j].is_whitespace() { j += 1; }
                        if j < chars.len() {
                            if chars[j] == '"' {
                                j += 1;
                                while j < chars.len() && chars[j] != '"' { j += 1; }
                                if j < chars.len() { j += 1; }
                            } else if chars[j] == '\'' {
                                j += 1;
                                while j < chars.len() && chars[j] != '\'' { j += 1; }
                                if j < chars.len() { j += 1; }
                            } else {
                                while j < chars.len() && !chars[j].is_whitespace() && chars[j] != '>' { j += 1; }
                            }
                        }
                        i = j;
                        continue;
                    }
                }
            }
        }
        result.push(chars[i]);
        i += 1;
    }

    result
}

fn neuter_dangerous_uris(html: &str) -> String {
    let mut result = html.to_string();
    // Replace javascript: URIs in href/src attributes
    let patterns = ["href=\"javascript:", "href='javascript:", "src=\"javascript:", "src='javascript:",
                     "href=\"data:", "href='data:", "action=\"javascript:", "formaction=\"javascript:"];
    for pattern in &patterns {
        let lower = result.to_lowercase();
        while let Some(pos) = lower.find(pattern) {
            let attr_name_end = pattern.find('=').unwrap();
            let replacement = &pattern[..attr_name_end + 1];
            result = format!("{}{}\"#\"{}", &result[..pos], replacement, &result[pos + pattern.len()..].split_once('"').map(|(_, rest)| rest).unwrap_or(""));
            break; // re-check from start
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::block;

    fn md_to_html(md: &str) -> String {
        let blocks = block::parse_blocks(md);
        blocks_to_html(&blocks)
    }

    #[test]
    fn heading_rendering() {
        let html = md_to_html("# Hello");
        assert!(html.contains("<h1>"));
        assert!(html.contains("Hello"));
        assert!(html.contains("</h1>"));
    }

    #[test]
    fn bold_rendering() {
        let html = md_to_html("**bold**");
        assert!(html.contains("<strong>bold</strong>"));
    }

    #[test]
    fn link_rendering() {
        let html = md_to_html("[link](https://example.com)");
        assert!(html.contains("<a href=\"https://example.com\">link</a>"));
    }

    #[test]
    fn code_block_rendering() {
        let html = md_to_html("```rust\nfn main() {}\n```");
        assert!(html.contains("<pre><code class=\"language-rust\">"));
        assert!(html.contains("fn main() {}"));
    }

    #[test]
    fn strip_script_tags() {
        let html = sanitize_html("<p>hello</p><script>alert('xss')</script>");
        assert!(!html.contains("<script"));
        assert!(!html.contains("alert"));
    }

    #[test]
    fn strip_event_handlers() {
        let html = sanitize_html("<div onload=\"alert(1)\">test</div>");
        assert!(!html.contains("onload"));
    }

    #[test]
    fn empty_input() {
        let html = md_to_html("");
        assert!(html.is_empty() || html.trim().is_empty());
    }
}
```

- [ ] **Step 3: Run inline + emit tests**

Run: `cd wasm && cargo test -p csr-markdown`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add wasm/crates/csr-markdown/src/inline.rs wasm/crates/csr-markdown/src/emit.rs
git commit -m "feat(wasm): add inline parser and HTML emitter to csr-markdown"
```

---

### Task 4: csr-markdown HTML-to-Markdown converter

**Files:**
- Create: `wasm/crates/csr-markdown/src/html_parse.rs`
- Create: `wasm/crates/csr-markdown/src/html_to_md.rs`
- Modify: `wasm/crates/csr-markdown/src/lib.rs`

- [ ] **Step 1: Create html_parse.rs — simple recursive descent HTML parser**

```rust
/// Simple HTML DOM node.
#[derive(Debug, Clone)]
pub enum HtmlNode {
    Element {
        tag: String,
        attrs: Vec<(String, String)>,
        children: Vec<HtmlNode>,
    },
    Text(String),
}

impl HtmlNode {
    pub fn tag(&self) -> Option<&str> {
        match self {
            HtmlNode::Element { tag, .. } => Some(tag),
            _ => None,
        }
    }

    pub fn attr(&self, name: &str) -> Option<&str> {
        match self {
            HtmlNode::Element { attrs, .. } => {
                attrs.iter().find(|(k, _)| k == name).map(|(_, v)| v.as_str())
            }
            _ => None,
        }
    }

    pub fn children(&self) -> &[HtmlNode] {
        match self {
            HtmlNode::Element { children, .. } => children,
            _ => &[],
        }
    }

    pub fn text_content(&self) -> String {
        match self {
            HtmlNode::Text(t) => t.clone(),
            HtmlNode::Element { children, .. } => {
                children.iter().map(|c| c.text_content()).collect::<Vec<_>>().join("")
            }
        }
    }
}

/// Parse an HTML string into a list of nodes.
pub fn parse_html(input: &str) -> Vec<HtmlNode> {
    let chars: Vec<char> = input.chars().collect();
    let mut nodes = Vec::new();
    let mut i = 0;
    parse_nodes(&chars, &mut i, None, &mut nodes);
    nodes
}

fn parse_nodes(chars: &[char], i: &mut usize, end_tag: Option<&str>, nodes: &mut Vec<HtmlNode>) {
    let mut text_buf = String::new();

    while *i < chars.len() {
        if chars[*i] == '<' {
            // Flush text buffer
            if !text_buf.is_empty() {
                nodes.push(HtmlNode::Text(std::mem::take(&mut text_buf)));
            }

            // Check for closing tag
            if *i + 1 < chars.len() && chars[*i + 1] == '/' {
                if let Some(etag) = end_tag {
                    let close = read_close_tag(chars, i);
                    if close.to_lowercase() == etag.to_lowercase() {
                        return;
                    }
                    // Mismatched close tag — treat as text
                    text_buf.push_str(&format!("</{}>", close));
                    continue;
                } else {
                    // Orphan close tag — skip
                    let _ = read_close_tag(chars, i);
                    continue;
                }
            }

            // Comment
            if *i + 3 < chars.len() && chars[*i + 1] == '!' && chars[*i + 2] == '-' && chars[*i + 3] == '-' {
                skip_comment(chars, i);
                continue;
            }

            // Open tag
            if let Some((tag, attrs, self_closing)) = read_open_tag(chars, i) {
                let tag_lower = tag.to_lowercase();

                if self_closing || is_void_element(&tag_lower) {
                    nodes.push(HtmlNode::Element {
                        tag: tag_lower,
                        attrs,
                        children: Vec::new(),
                    });
                } else {
                    let mut children = Vec::new();
                    parse_nodes(chars, i, Some(&tag_lower), &mut children);
                    nodes.push(HtmlNode::Element {
                        tag: tag_lower,
                        attrs,
                        children,
                    });
                }
            } else {
                text_buf.push(chars[*i]);
                *i += 1;
            }
        } else {
            // Decode basic HTML entities
            if chars[*i] == '&' {
                if let Some((entity, end)) = read_entity(chars, *i) {
                    text_buf.push_str(&entity);
                    *i = end;
                    continue;
                }
            }
            text_buf.push(chars[*i]);
            *i += 1;
        }
    }

    if !text_buf.is_empty() {
        nodes.push(HtmlNode::Text(text_buf));
    }
}

fn read_open_tag(chars: &[char], i: &mut usize) -> Option<(String, Vec<(String, String)>, bool)> {
    if chars[*i] != '<' {
        return None;
    }
    *i += 1; // skip <

    // Read tag name
    let mut tag = String::new();
    while *i < chars.len() && !chars[*i].is_whitespace() && chars[*i] != '>' && chars[*i] != '/' {
        tag.push(chars[*i]);
        *i += 1;
    }
    if tag.is_empty() || !tag.chars().next()?.is_ascii_alphabetic() {
        return None;
    }

    // Read attributes
    let mut attrs = Vec::new();
    loop {
        skip_whitespace(chars, i);
        if *i >= chars.len() { break; }
        if chars[*i] == '>' { *i += 1; return Some((tag, attrs, false)); }
        if chars[*i] == '/' && *i + 1 < chars.len() && chars[*i + 1] == '>' {
            *i += 2;
            return Some((tag, attrs, true));
        }

        // Read attribute name
        let mut name = String::new();
        while *i < chars.len() && !chars[*i].is_whitespace() && chars[*i] != '=' && chars[*i] != '>' && chars[*i] != '/' {
            name.push(chars[*i]);
            *i += 1;
        }
        skip_whitespace(chars, i);

        let value = if *i < chars.len() && chars[*i] == '=' {
            *i += 1;
            skip_whitespace(chars, i);
            read_attr_value(chars, i)
        } else {
            String::new()
        };

        if !name.is_empty() {
            attrs.push((name.to_lowercase(), value));
        }
    }

    None
}

fn read_attr_value(chars: &[char], i: &mut usize) -> String {
    if *i >= chars.len() { return String::new(); }

    if chars[*i] == '"' || chars[*i] == '\'' {
        let quote = chars[*i];
        *i += 1;
        let mut val = String::new();
        while *i < chars.len() && chars[*i] != quote {
            val.push(chars[*i]);
            *i += 1;
        }
        if *i < chars.len() { *i += 1; } // skip closing quote
        val
    } else {
        let mut val = String::new();
        while *i < chars.len() && !chars[*i].is_whitespace() && chars[*i] != '>' {
            val.push(chars[*i]);
            *i += 1;
        }
        val
    }
}

fn read_close_tag(chars: &[char], i: &mut usize) -> String {
    *i += 2; // skip </
    let mut tag = String::new();
    while *i < chars.len() && chars[*i] != '>' {
        tag.push(chars[*i]);
        *i += 1;
    }
    if *i < chars.len() { *i += 1; } // skip >
    tag.trim().to_string()
}

fn skip_comment(chars: &[char], i: &mut usize) {
    *i += 4; // skip <!--
    while *i + 2 < chars.len() {
        if chars[*i] == '-' && chars[*i + 1] == '-' && chars[*i + 2] == '>' {
            *i += 3;
            return;
        }
        *i += 1;
    }
    *i = chars.len();
}

fn skip_whitespace(chars: &[char], i: &mut usize) {
    while *i < chars.len() && chars[*i].is_whitespace() {
        *i += 1;
    }
}

fn read_entity(chars: &[char], start: usize) -> Option<(String, usize)> {
    let mut i = start + 1;
    let mut name = String::new();
    while i < chars.len() && chars[i] != ';' && name.len() < 10 {
        name.push(chars[i]);
        i += 1;
    }
    if i < chars.len() && chars[i] == ';' {
        let decoded = match name.as_str() {
            "amp" => "&",
            "lt" => "<",
            "gt" => ">",
            "quot" => "\"",
            "apos" => "'",
            "nbsp" => " ",
            _ => return None,
        };
        Some((decoded.to_string(), i + 1))
    } else {
        None
    }
}

fn is_void_element(tag: &str) -> bool {
    matches!(tag, "area" | "base" | "br" | "col" | "embed" | "hr" | "img" | "input" | "link" | "meta" | "source" | "track" | "wbr")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_simple_element() {
        let nodes = parse_html("<p>hello</p>");
        assert_eq!(nodes.len(), 1);
        assert_eq!(nodes[0].tag(), Some("p"));
        assert_eq!(nodes[0].text_content(), "hello");
    }

    #[test]
    fn parse_nested_elements() {
        let nodes = parse_html("<div><p>text</p></div>");
        assert_eq!(nodes.len(), 1);
        assert_eq!(nodes[0].children().len(), 1);
    }

    #[test]
    fn parse_attributes() {
        let nodes = parse_html("<a href=\"https://example.com\">link</a>");
        assert_eq!(nodes[0].attr("href"), Some("https://example.com"));
    }

    #[test]
    fn parse_self_closing() {
        let nodes = parse_html("<br/><img src=\"test.png\">");
        assert_eq!(nodes.len(), 2);
    }

    #[test]
    fn parse_entities() {
        let nodes = parse_html("&amp; &lt; &gt;");
        assert_eq!(nodes[0].text_content(), "& < >");
    }
}
```

- [ ] **Step 2: Create html_to_md.rs — HTML node tree → markdown**

```rust
use crate::html_parse::HtmlNode;

/// Convert an HTML string to markdown.
pub fn convert(html: &str) -> String {
    let nodes = crate::html_parse::parse_html(html);
    let mut out = String::new();
    render_nodes(&nodes, &mut out, &Context::default());
    // Clean up excessive newlines
    clean_output(&out)
}

#[derive(Default, Clone)]
struct Context {
    list_depth: usize,
    ordered: bool,
    item_index: usize,
}

fn render_nodes(nodes: &[HtmlNode], out: &mut String, ctx: &Context) {
    for node in nodes {
        render_node(node, out, ctx);
    }
}

fn render_node(node: &HtmlNode, out: &mut String, ctx: &Context) {
    match node {
        HtmlNode::Text(text) => {
            out.push_str(text);
        }
        HtmlNode::Element { tag, attrs, children } => {
            match tag.as_str() {
                "h1" | "h2" | "h3" | "h4" | "h5" | "h6" => {
                    let level = tag[1..].parse::<usize>().unwrap_or(1);
                    ensure_newline(out);
                    for _ in 0..level { out.push('#'); }
                    out.push(' ');
                    render_text_content(children, out);
                    out.push_str("\n\n");
                }
                "p" => {
                    ensure_newline(out);
                    render_nodes(children, out, ctx);
                    out.push_str("\n\n");
                }
                "strong" | "b" => {
                    out.push_str("**");
                    render_nodes(children, out, ctx);
                    out.push_str("**");
                }
                "em" | "i" => {
                    out.push('_');
                    render_nodes(children, out, ctx);
                    out.push('_');
                }
                "del" | "s" | "strike" => {
                    out.push_str("~~");
                    render_nodes(children, out, ctx);
                    out.push_str("~~");
                }
                "a" => {
                    let href = attrs.iter()
                        .find(|(k, _)| k == "href")
                        .map(|(_, v)| v.as_str())
                        .unwrap_or("#");
                    out.push('[');
                    render_nodes(children, out, ctx);
                    out.push_str(&format!("]({})", href));
                }
                "img" => {
                    let src = attrs.iter()
                        .find(|(k, _)| k == "src")
                        .map(|(_, v)| v.as_str())
                        .unwrap_or("");
                    let alt = attrs.iter()
                        .find(|(k, _)| k == "alt")
                        .map(|(_, v)| v.as_str())
                        .unwrap_or("");
                    out.push_str(&format!("![{}]({})", alt, src));
                }
                "code" => {
                    // Check if inside <pre>
                    out.push('`');
                    render_text_content(children, out);
                    out.push('`');
                }
                "pre" => {
                    ensure_newline(out);
                    out.push_str("```\n");
                    // Render children (usually <code>) as plain text
                    for child in children {
                        match child {
                            HtmlNode::Element { tag, children: inner, .. } if tag == "code" => {
                                render_text_content(inner, out);
                            }
                            _ => {
                                render_text_content(&[child.clone()], out);
                            }
                        }
                    }
                    out.push_str("\n```\n\n");
                }
                "ul" => {
                    ensure_newline(out);
                    let new_ctx = Context { list_depth: ctx.list_depth + 1, ordered: false, item_index: 0 };
                    for (idx, child) in children.iter().enumerate() {
                        let item_ctx = Context { item_index: idx, ..new_ctx.clone() };
                        render_node(child, out, &item_ctx);
                    }
                    if ctx.list_depth == 0 { out.push('\n'); }
                }
                "ol" => {
                    ensure_newline(out);
                    let new_ctx = Context { list_depth: ctx.list_depth + 1, ordered: true, item_index: 0 };
                    for (idx, child) in children.iter().enumerate() {
                        let item_ctx = Context { item_index: idx, ..new_ctx.clone() };
                        render_node(child, out, &item_ctx);
                    }
                    if ctx.list_depth == 0 { out.push('\n'); }
                }
                "li" => {
                    let indent = "  ".repeat(ctx.list_depth.saturating_sub(1));
                    // Check for checkbox
                    let has_checkbox = children.iter().any(|c| {
                        matches!(c, HtmlNode::Element { tag, .. } if tag == "input")
                    });
                    if ctx.ordered {
                        out.push_str(&format!("{}{}. ", indent, ctx.item_index + 1));
                    } else {
                        out.push_str(&format!("{}- ", indent));
                    }
                    if has_checkbox {
                        let checked = children.iter().any(|c| {
                            if let HtmlNode::Element { tag, attrs, .. } = c {
                                tag == "input" && attrs.iter().any(|(k, _)| k == "checked")
                            } else {
                                false
                            }
                        });
                        out.push_str(if checked { "[x] " } else { "[ ] " });
                    }
                    // Render li content (skip input elements)
                    for child in children {
                        if let HtmlNode::Element { tag, .. } = child {
                            if tag == "input" { continue; }
                        }
                        render_node(child, out, ctx);
                    }
                    out.push('\n');
                }
                "blockquote" => {
                    ensure_newline(out);
                    let inner = {
                        let mut s = String::new();
                        render_nodes(children, &mut s, ctx);
                        s
                    };
                    for line in inner.trim().lines() {
                        out.push_str("> ");
                        out.push_str(line);
                        out.push('\n');
                    }
                    out.push('\n');
                }
                "br" => {
                    out.push('\n');
                }
                "hr" => {
                    ensure_newline(out);
                    out.push_str("---\n\n");
                }
                "table" => {
                    ensure_newline(out);
                    render_table(children, out);
                    out.push('\n');
                }
                "thead" | "tbody" | "tfoot" => {
                    // Transparent — render children directly
                    render_nodes(children, out, ctx);
                }
                "div" | "section" | "article" | "main" | "header" | "footer" | "nav" | "aside" | "span" => {
                    render_nodes(children, out, ctx);
                }
                _ => {
                    // Unknown tags — render children
                    render_nodes(children, out, ctx);
                }
            }
        }
    }
}

fn render_table(children: &[HtmlNode], out: &mut String) {
    let mut headers: Vec<String> = Vec::new();
    let mut rows: Vec<Vec<String>> = Vec::new();

    for child in children {
        if let HtmlNode::Element { tag, children: inner, .. } = child {
            match tag.as_str() {
                "thead" => {
                    for tr in inner {
                        if let HtmlNode::Element { tag: tr_tag, children: cells, .. } = tr {
                            if tr_tag == "tr" {
                                headers = cells.iter()
                                    .filter(|c| c.tag() == Some("th") || c.tag() == Some("td"))
                                    .map(|c| c.text_content().trim().to_string())
                                    .collect();
                            }
                        }
                    }
                }
                "tbody" => {
                    for tr in inner {
                        if let HtmlNode::Element { tag: tr_tag, children: cells, .. } = tr {
                            if tr_tag == "tr" {
                                let row: Vec<String> = cells.iter()
                                    .filter(|c| c.tag() == Some("td") || c.tag() == Some("th"))
                                    .map(|c| c.text_content().trim().to_string())
                                    .collect();
                                rows.push(row);
                            }
                        }
                    }
                }
                "tr" => {
                    // Direct tr without thead/tbody
                    let has_th = inner.iter().any(|c| c.tag() == Some("th"));
                    let cells: Vec<String> = inner.iter()
                        .filter(|c| c.tag() == Some("td") || c.tag() == Some("th"))
                        .map(|c| c.text_content().trim().to_string())
                        .collect();
                    if has_th && headers.is_empty() {
                        headers = cells;
                    } else {
                        rows.push(cells);
                    }
                }
                _ => {}
            }
        }
    }

    if headers.is_empty() && !rows.is_empty() {
        headers = vec!["".to_string(); rows[0].len()];
    }

    // Render header
    out.push('|');
    for h in &headers {
        out.push_str(&format!(" {} |", h));
    }
    out.push('\n');

    // Separator
    out.push('|');
    for _ in &headers {
        out.push_str(" --- |");
    }
    out.push('\n');

    // Rows
    for row in &rows {
        out.push('|');
        for cell in row {
            out.push_str(&format!(" {} |", cell));
        }
        out.push('\n');
    }
}

fn render_text_content(nodes: &[HtmlNode], out: &mut String) {
    for node in nodes {
        match node {
            HtmlNode::Text(t) => out.push_str(t),
            HtmlNode::Element { children, .. } => render_text_content(children, out),
        }
    }
}

fn ensure_newline(out: &mut String) {
    if !out.is_empty() && !out.ends_with('\n') {
        out.push('\n');
    }
}

fn clean_output(s: &str) -> String {
    let mut result = String::new();
    let mut prev_blank = false;
    for line in s.lines() {
        if line.trim().is_empty() {
            if !prev_blank {
                result.push('\n');
                prev_blank = true;
            }
        } else {
            result.push_str(line);
            result.push('\n');
            prev_blank = false;
        }
    }
    result.trim().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn heading_conversion() {
        let md = convert("<h1>Hello</h1>");
        assert!(md.contains("# Hello"));
    }

    #[test]
    fn bold_italic_conversion() {
        let md = convert("<p><strong>bold</strong> and <em>italic</em></p>");
        assert!(md.contains("**bold**"));
        assert!(md.contains("_italic_"));
    }

    #[test]
    fn link_conversion() {
        let md = convert("<a href=\"https://example.com\">link</a>");
        assert!(md.contains("[link](https://example.com)"));
    }

    #[test]
    fn image_conversion() {
        let md = convert("<img src=\"test.png\" alt=\"Test image\">");
        assert!(md.contains("![Test image](test.png)"));
    }

    #[test]
    fn table_conversion() {
        let html = "<table><thead><tr><th>Name</th><th>Age</th></tr></thead><tbody><tr><td>John</td><td>30</td></tr></tbody></table>";
        let md = convert(html);
        assert!(md.contains("| Name | Age |"));
        assert!(md.contains("| John | 30 |"));
    }
}
```

- [ ] **Step 3: Create lib.rs with wasm_bindgen exports**

```rust
use wasm_bindgen::prelude::*;

mod block;
mod emit;
mod html_parse;
mod html_to_md;
mod inline;

#[wasm_bindgen]
pub fn markdown_to_html(md: &str) -> String {
    let blocks = block::parse_blocks(md);
    emit::blocks_to_html(&blocks)
}

#[wasm_bindgen]
pub fn html_to_markdown(html: &str) -> String {
    html_to_md::convert(html)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn markdown_round_trip_heading() {
        let html = markdown_to_html("# Hello");
        assert!(html.contains("<h1>"));
        let md = html_to_markdown(&html);
        assert!(md.contains("# Hello"));
    }

    #[test]
    fn markdown_to_html_bold() {
        let html = markdown_to_html("**bold**");
        assert!(html.contains("<strong>bold</strong>"));
    }

    #[test]
    fn html_to_markdown_basic() {
        let md = html_to_markdown("<h1>Hello</h1>");
        assert!(md.contains("# Hello"));
    }

    #[test]
    fn sanitizes_script() {
        let html = markdown_to_html("<script>alert('xss')</script>");
        assert!(!html.contains("<script"));
    }
}
```

- [ ] **Step 4: Run all csr-markdown tests**

Run: `cd wasm && cargo test -p csr-markdown`
Expected: All tests pass.

- [ ] **Step 5: Build WASM**

Run: `cd wasm && ../node_modules/.bin/wasm-pack build crates/csr-markdown --target web --dev --out-dir ../../wasm/pkg/csr-markdown --out-name csr-markdown`
Expected: Successful build.

- [ ] **Step 6: Commit**

```bash
git add wasm/crates/csr-markdown/
git commit -m "feat(wasm): implement HTML-to-Markdown converter and wasm exports in csr-markdown"
```

---

### Task 5: TypeScript WASM wrappers

**Files:**
- Create: `src/wasm/csr-qrcode.ts`
- Create: `src/wasm/csr-markdown.ts`

- [ ] **Step 1: Create `src/wasm/csr-qrcode.ts`**

```typescript
import type { QrCodeOptions } from '@/types/utils/qr-code'

import { loadWasm } from './init'

type CsrQrcode = {
  generate_qr_png_data_url: (data: string, size: number, fg: string, bg: string, ec: string) => string
  generate_qr_svg_string: (data: string, size: number, fg: string, bg: string, ec: string) => string
}

export const generateQrCodeDataUrl = async (text: string, options: QrCodeOptions = {}): Promise<string> => {
  const { size = 256, foreground = '#000000', background = '#ffffff', errorCorrectionLevel = 'M' } = options
  const wasm = await loadWasm<CsrQrcode>('csr-qrcode')
  return wasm.generate_qr_png_data_url(text, size, foreground, background, errorCorrectionLevel)
}

export const generateQrCodeSvgString = async (text: string, options: QrCodeOptions = {}): Promise<string> => {
  const { size = 256, foreground = '#000000', background = '#ffffff', errorCorrectionLevel = 'M' } = options
  const wasm = await loadWasm<CsrQrcode>('csr-qrcode')
  return wasm.generate_qr_svg_string(text, size, foreground, background, errorCorrectionLevel)
}
```

- [ ] **Step 2: Create `src/wasm/csr-markdown.ts`**

```typescript
import { loadWasm } from './init'

type CsrMarkdown = {
  markdown_to_html: (md: string) => string
  html_to_markdown: (html: string) => string
}

export const renderMarkdown = async (md: string): Promise<string> => {
  if (md.trim().length === 0) return ''
  const wasm = await loadWasm<CsrMarkdown>('csr-markdown')
  return wasm.markdown_to_html(md)
}

export const markdownToHtml = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const wasm = await loadWasm<CsrMarkdown>('csr-markdown')
  return wasm.markdown_to_html(input)
}

export const htmlToMarkdown = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const wasm = await loadWasm<CsrMarkdown>('csr-markdown')
  return wasm.html_to_markdown(input)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/wasm/csr-qrcode.ts src/wasm/csr-markdown.ts
git commit -m "feat: add TypeScript WASM wrappers for csr-qrcode and csr-markdown"
```

---

### Task 6: Migrate utils to WASM + update MarkdownPreview component

**Files:**
- Modify: `src/utils/qr-code.ts`
- Modify: `src/utils/markdown.ts`
- Modify: `src/utils/html-markdown.ts`
- Modify: `src/components/feature/code/MarkdownPreview.tsx`

- [ ] **Step 1: Migrate `src/utils/qr-code.ts`**

Replace full file contents with:

```typescript
import type { QrCodeOptions } from '@/types/utils/qr-code'
import { generateQrCodeDataUrl, generateQrCodeSvgString } from '@/wasm/csr-qrcode'

export { generateQrCodeDataUrl, generateQrCodeSvgString }
export type { QrErrorCorrectionLevel } from '@/types/utils/qr-code'
```

- [ ] **Step 2: Migrate `src/utils/markdown.ts`**

Replace full file contents with:

```typescript
import { renderMarkdown } from '@/wasm/csr-markdown'

export { renderMarkdown }
```

- [ ] **Step 3: Migrate `src/utils/html-markdown.ts`**

Replace full file contents with:

```typescript
import { htmlToMarkdown, markdownToHtml } from '@/wasm/csr-markdown'

export { htmlToMarkdown, markdownToHtml }
```

- [ ] **Step 4: Update `MarkdownPreview.tsx` for async `renderMarkdown`**

The `process` function currently calls `renderMarkdown` synchronously. It needs to become async:

Change the `process` function (lines 24-30) from:

```typescript
  const process = (val: string) => {
    if (val.trim().length === 0) {
      setHtmlOutput('')
      return
    }
    setHtmlOutput(renderMarkdown(val))
  }
```

To:

```typescript
  const process = async (val: string) => {
    if (val.trim().length === 0) {
      setHtmlOutput('')
      return
    }
    const html = await renderMarkdown(val)
    setHtmlOutput(html)
  }
```

No other changes needed — `useDebounceCallback` already handles async callbacks since the return value is ignored.

- [ ] **Step 5: Commit**

```bash
git add src/utils/qr-code.ts src/utils/markdown.ts src/utils/html-markdown.ts src/components/feature/code/MarkdownPreview.tsx
git commit -m "feat: migrate QR code and markdown utils from npm packages to WASM"
```

---

### Task 7: Update tests for async renderMarkdown + run all tests

**Files:**
- Modify: `src/utils/markdown.spec.ts`

- [ ] **Step 1: Update markdown.spec.ts for async renderMarkdown**

The existing tests call `renderMarkdown` synchronously. All assertions need `await`:

```typescript
import { describe, expect, it } from 'vitest'

import { renderMarkdown } from '@/utils'

describe('markdown utilities', () => {
  describe('renderMarkdown', () => {
    it('should render headings', async () => {
      const result = await renderMarkdown('# Hello')
      expect(result).toContain('<h1')
      expect(result).toContain('Hello')
    })

    it('should render bold text', async () => {
      const result = await renderMarkdown('**bold**')
      expect(result).toContain('<strong>')
    })

    it('should render links', async () => {
      const result = await renderMarkdown('[link](https://example.com)')
      expect(result).toContain('<a ')
      expect(result).toContain('https://example.com')
    })

    it('should strip script tags', async () => {
      const result = await renderMarkdown('<script>alert("xss")</script>')
      expect(result).not.toContain('<script')
    })

    it('should strip event handlers', async () => {
      const result = await renderMarkdown('<div onload="alert(1)">test</div>')
      expect(result).not.toContain('onload')
    })

    it('should strip event handlers after slash delimiter (svg/onload)', async () => {
      const result = await renderMarkdown('<svg/onload=alert(1)>')
      expect(result).not.toContain('onload')
    })

    it('should strip javascript: URIs in src attributes', async () => {
      const result = await renderMarkdown('<img src="javascript:alert(1)">')
      expect(result).not.toContain('javascript:')
    })

    it('should strip form tags', async () => {
      const result = await renderMarkdown('<form action="https://evil.com"><input></form>')
      expect(result).not.toContain('<form')
    })

    it('should strip base tags', async () => {
      const result = await renderMarkdown('<base href="https://evil.com">')
      expect(result).not.toContain('<base')
    })

    it('should return empty string for empty input', async () => {
      expect(await renderMarkdown('')).toBe('')
      expect(await renderMarkdown('   ')).toBe('')
    })
  })
})
```

- [ ] **Step 2: Build WASM (prerequisite for vitest)**

Run: `pnpm wasm:build:dev`
Expected: All crates build successfully.

- [ ] **Step 3: Run all related vitest specs**

Run: `pnpm vitest run src/utils/qr-code.spec.ts src/utils/markdown.spec.ts src/utils/html-markdown.spec.ts`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/utils/markdown.spec.ts
git commit -m "test: update markdown spec for async renderMarkdown"
```

---

### Task 8: Remove npm dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove packages**

Run: `pnpm remove qrcode @types/qrcode marked turndown @types/turndown turndown-plugin-gfm`
Expected: Packages removed from `package.json` and `pnpm-lock.yaml` updated.

- [ ] **Step 2: Verify no remaining imports**

Run: `grep -r "from 'qrcode'" src/ && grep -r "from 'marked'" src/ && grep -r "from 'turndown'" src/` (all should return nothing)
Expected: No matches — all imports now go through `@/wasm/`.

- [ ] **Step 3: Run full test suite**

Run: `pnpm vitest run`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: remove qrcode, marked, turndown dependencies (replaced by WASM)"
```

---

### Task 9: Verify and fix — full build + all tests

- [ ] **Step 1: Full WASM build (release)**

Run: `pnpm wasm:build`
Expected: All crates build with release optimization.

- [ ] **Step 2: TypeScript build**

Run: `pnpm build`
Expected: Vite build succeeds with no errors.

- [ ] **Step 3: Full test suite**

Run: `pnpm vitest run`
Expected: All tests pass.

- [ ] **Step 4: Fix any failures**

If tests fail, debug and fix. Common issues:
- Output format differences (whitespace, newlines) between WASM and npm implementations
- Async handling issues in tests
- Missing edge cases in Rust parsers

- [ ] **Step 5: Final commit (if fixes needed)**

```bash
git add -A
git commit -m "fix: resolve Phase 6a migration issues"
```
