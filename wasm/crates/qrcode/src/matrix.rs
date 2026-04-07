/// QR matrix construction with patterns and masking.

use crate::encode::EcLevel;

/// Compute matrix size for a given version.
pub fn matrix_size(version: usize) -> usize {
    4 * version + 17
}

/// Alignment pattern center coordinates per version (2-40).
/// Version 1 has no alignment patterns.
const ALIGNMENT_POSITIONS: [&[usize]; 40] = [
    &[],                                          // V1
    &[6, 18],                                     // V2
    &[6, 22],                                     // V3
    &[6, 26],                                     // V4
    &[6, 30],                                     // V5
    &[6, 34],                                     // V6
    &[6, 22, 38],                                 // V7
    &[6, 24, 42],                                 // V8
    &[6, 26, 46],                                 // V9
    &[6, 28, 50],                                 // V10
    &[6, 30, 54],                                 // V11
    &[6, 32, 58],                                 // V12
    &[6, 34, 62],                                 // V13
    &[6, 26, 46, 66],                             // V14
    &[6, 26, 48, 70],                             // V15
    &[6, 26, 50, 74],                             // V16
    &[6, 30, 54, 78],                             // V17
    &[6, 30, 56, 82],                             // V18
    &[6, 30, 58, 86],                             // V19
    &[6, 34, 62, 90],                             // V20
    &[6, 28, 50, 72, 94],                         // V21
    &[6, 26, 50, 74, 98],                         // V22
    &[6, 30, 54, 78, 102],                        // V23
    &[6, 28, 54, 80, 106],                        // V24
    &[6, 32, 58, 84, 110],                        // V25
    &[6, 30, 58, 86, 114],                        // V26
    &[6, 34, 62, 90, 118],                        // V27
    &[6, 26, 50, 74, 98, 122],                    // V28
    &[6, 30, 54, 78, 102, 126],                   // V29
    &[6, 26, 52, 78, 104, 130],                   // V30
    &[6, 30, 56, 82, 108, 134],                   // V31
    &[6, 34, 60, 86, 112, 138],                   // V32
    &[6, 30, 58, 86, 114, 142],                   // V33
    &[6, 34, 62, 90, 118, 146],                   // V34
    &[6, 30, 54, 78, 102, 126, 150],              // V35
    &[6, 24, 50, 76, 102, 128, 154],              // V36
    &[6, 28, 54, 80, 106, 132, 158],              // V37
    &[6, 32, 58, 84, 110, 136, 162],              // V38
    &[6, 26, 54, 82, 110, 138, 166],              // V39
    &[6, 30, 58, 86, 114, 142, 170],              // V40
];

/// Cell state in the QR matrix.
#[derive(Clone, Copy, PartialEq)]
enum Cell {
    Empty,
    Reserved,
    Dark,
    Light,
}

/// QR matrix builder.
pub struct QrMatrix {
    cells: Vec<Cell>,
    size: usize,
}

impl QrMatrix {
    fn new(size: usize) -> Self {
        QrMatrix {
            cells: vec![Cell::Empty; size * size],
            size,
        }
    }

    fn get(&self, row: usize, col: usize) -> Cell {
        self.cells[row * self.size + col]
    }

    fn set(&mut self, row: usize, col: usize, cell: Cell) {
        self.cells[row * self.size + col] = cell;
    }

    fn set_if_empty(&mut self, row: usize, col: usize, cell: Cell) {
        let idx = row * self.size + col;
        if self.cells[idx] == Cell::Empty {
            self.cells[idx] = cell;
        }
    }

    /// Place a 7x7 finder pattern with top-left at (row, col).
    fn place_finder(&mut self, row: usize, col: usize) {
        for r in 0..7 {
            for c in 0..7 {
                let dark = r == 0 || r == 6 || c == 0 || c == 6
                    || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
                self.set(
                    row + r,
                    col + c,
                    if dark { Cell::Dark } else { Cell::Light },
                );
            }
        }
    }

    /// Place separators around finder patterns.
    fn place_separators(&mut self, size: usize) {
        // Around top-left finder
        for i in 0..8 {
            if i < size {
                self.set_if_empty(7, i, Cell::Light); // bottom
                self.set_if_empty(i, 7, Cell::Light); // right
            }
        }
        // Around top-right finder
        let right = size - 8;
        for i in 0..8 {
            if right + i < size {
                self.set_if_empty(7, right + i, Cell::Light); // bottom
            }
            self.set_if_empty(i, right, Cell::Light); // left
        }
        // Around bottom-left finder
        let bottom = size - 8;
        for i in 0..8 {
            self.set_if_empty(bottom, i, Cell::Light); // top
            if bottom + i < size {
                self.set_if_empty(bottom + i, 7, Cell::Light); // right
            }
        }
    }

    /// Place alignment patterns.
    fn place_alignment(&mut self, version: usize) {
        let positions = ALIGNMENT_POSITIONS[version - 1];
        if positions.is_empty() {
            return;
        }
        for &row in positions {
            for &col in positions {
                // Skip if overlapping with finder patterns
                if self.get(row, col) != Cell::Empty {
                    continue;
                }
                for r in 0..5 {
                    for c in 0..5 {
                        let dark = r == 0 || r == 4 || c == 0 || c == 4 || (r == 2 && c == 2);
                        self.set(
                            row - 2 + r,
                            col - 2 + c,
                            if dark { Cell::Dark } else { Cell::Light },
                        );
                    }
                }
            }
        }
    }

    /// Place timing patterns (row 6, col 6).
    fn place_timing(&mut self, size: usize) {
        for i in 8..size - 8 {
            let cell = if i % 2 == 0 { Cell::Dark } else { Cell::Light };
            self.set_if_empty(6, i, cell); // horizontal
            self.set_if_empty(i, 6, cell); // vertical
        }
    }

    /// Reserve format info areas (will be written later).
    fn reserve_format(&mut self, size: usize) {
        // Around top-left finder
        for i in 0..9 {
            if i < size {
                self.set_if_empty(8, i, Cell::Reserved);
                self.set_if_empty(i, 8, Cell::Reserved);
            }
        }
        // Around top-right finder
        for i in 0..8 {
            self.set_if_empty(8, size - 8 + i, Cell::Reserved);
        }
        // Around bottom-left finder
        for i in 0..7 {
            self.set_if_empty(size - 7 + i, 8, Cell::Reserved);
        }
        // Dark module (always present)
        self.set(size - 8, 8, Cell::Dark);
    }

    /// Reserve version info areas (V7+).
    fn reserve_version(&mut self, version: usize, size: usize) {
        if version < 7 {
            return;
        }
        // Bottom-left of top-right finder
        for i in 0..6 {
            for j in 0..3 {
                self.set_if_empty(i, size - 11 + j, Cell::Reserved);
                self.set_if_empty(size - 11 + j, i, Cell::Reserved);
            }
        }
    }

    /// Place data bits in the matrix.
    fn place_data(&mut self, data: &[u8], size: usize) {
        let total_bits = data.len() * 8;
        let mut bit_idx = 0;

        // Columns go right-to-left in pairs, skipping column 6
        let mut col = size as isize - 1;
        while col >= 0 {
            if col == 6 {
                col -= 1;
                continue;
            }

            // Determine direction: upward for even column-pair, downward for odd
            let col_pair = if col > 6 {
                (size as isize - 1 - col) / 2
            } else {
                (size as isize - 2 - col) / 2
            };
            let upward = col_pair % 2 == 0;

            for step in 0..size {
                let row = if upward { size - 1 - step } else { step };

                for dc in 0..2 {
                    let c = (col - dc) as usize;
                    if c >= size {
                        continue;
                    }
                    if self.get(row, c) != Cell::Empty {
                        continue;
                    }
                    if bit_idx < total_bits {
                        let byte = data[bit_idx / 8];
                        let bit = (byte >> (7 - (bit_idx % 8))) & 1;
                        self.set(row, c, if bit == 1 { Cell::Dark } else { Cell::Light });
                        bit_idx += 1;
                    } else {
                        self.set(row, c, Cell::Light);
                    }
                }
            }

            col -= 2;
        }
    }

    /// Apply one of 8 mask patterns.
    fn apply_mask(&mut self, mask_id: u8, size: usize) {
        for row in 0..size {
            for col in 0..size {
                let idx = row * size + col;
                match self.cells[idx] {
                    Cell::Dark | Cell::Light => {}
                    _ => continue,
                }
                // Only mask data/ec modules (not function patterns)
                // Since we placed function patterns as Dark/Light and data as Dark/Light,
                // we need to track which are "data" modules. But our approach places
                // everything as Dark/Light. So we need a different approach.
                // Actually, we apply mask BEFORE writing format info, and only on
                // modules that were placed during place_data.
                // Let's just check if it should be masked.
                let should_mask = match mask_id {
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
                if should_mask {
                    self.cells[idx] = match self.cells[idx] {
                        Cell::Dark => Cell::Light,
                        Cell::Light => Cell::Dark,
                        other => other,
                    };
                }
            }
        }
    }

    /// Compute penalty score (all 4 rules).
    fn penalty(cells: &[bool], size: usize) -> u32 {
        let mut score = 0u32;

        // Rule 1: 5+ same-color in a row/column
        // Rows
        for row in 0..size {
            let mut count = 1;
            for col in 1..size {
                if cells[row * size + col] == cells[row * size + col - 1] {
                    count += 1;
                } else {
                    if count >= 5 {
                        score += count - 2;
                    }
                    count = 1;
                }
            }
            if count >= 5 {
                score += count - 2;
            }
        }
        // Columns
        for col in 0..size {
            let mut count = 1;
            for row in 1..size {
                if cells[row * size + col] == cells[(row - 1) * size + col] {
                    count += 1;
                } else {
                    if count >= 5 {
                        score += count - 2;
                    }
                    count = 1;
                }
            }
            if count >= 5 {
                score += count - 2;
            }
        }

        // Rule 2: 2x2 blocks of same color
        for row in 0..size - 1 {
            for col in 0..size - 1 {
                let c = cells[row * size + col];
                if c == cells[row * size + col + 1]
                    && c == cells[(row + 1) * size + col]
                    && c == cells[(row + 1) * size + col + 1]
                {
                    score += 3;
                }
            }
        }

        // Rule 3: finder-like patterns (1:1:3:1:1 with 4 light before/after)
        let pattern_a: [bool; 11] = [
            true, false, true, true, true, false, true, false, false, false, false,
        ];
        let pattern_b: [bool; 11] = [
            false, false, false, false, true, false, true, true, true, false, true,
        ];
        // Rows
        for row in 0..size {
            for col in 0..=size.saturating_sub(11) {
                let slice: Vec<bool> = (0..11).map(|i| cells[row * size + col + i]).collect();
                if slice == pattern_a || slice == pattern_b {
                    score += 40;
                }
            }
        }
        // Columns
        for col in 0..size {
            for row in 0..=size.saturating_sub(11) {
                let slice: Vec<bool> = (0..11).map(|i| cells[(row + i) * size + col]).collect();
                if slice == pattern_a || slice == pattern_b {
                    score += 40;
                }
            }
        }

        // Rule 4: proportion of dark modules
        let total = (size * size) as u32;
        let dark_count = cells.iter().filter(|&&c| c).count() as u32;
        let percent = (dark_count * 100) / total;
        let prev5 = (percent / 5) * 5;
        let next5 = prev5 + 5;
        let diff_prev = if prev5 >= 50 { prev5 - 50 } else { 50 - prev5 };
        let diff_next = if next5 >= 50 { next5 - 50 } else { 50 - next5 };
        score += (diff_prev / 5).min(diff_next / 5) * 10;

        score
    }

    /// Write BCH(15,5) format information.
    fn write_format(&mut self, ec: EcLevel, mask_id: u8, size: usize) {
        let ec_bits: u8 = match ec {
            EcLevel::L => 0b01,
            EcLevel::M => 0b00,
            EcLevel::Q => 0b11,
            EcLevel::H => 0b10,
        };
        let format_data = ((ec_bits as u32) << 3) | (mask_id as u32);

        // BCH(15,5) encoding
        let mut format_ecc = format_data << 10;
        let generator = 0b10100110111u32; // BCH generator
        for i in (0..=4).rev() {
            if format_ecc & (1 << (i + 10)) != 0 {
                format_ecc ^= generator << i;
            }
        }
        let format_bits = ((format_data << 10) | format_ecc) ^ 0b101010000010010;

        // Place format bits
        // Horizontal: row 8
        let h_positions: [usize; 15] = [0, 1, 2, 3, 4, 5, 7, 8, size - 8, size - 7, size - 6, size - 5, size - 4, size - 3, size - 2];
        // Vertical: column 8
        let v_positions: [usize; 15] = [size - 1, size - 2, size - 3, size - 4, size - 5, size - 6, size - 7, 8, 7, 5, 4, 3, 2, 1, 0];

        for i in 0..15 {
            let bit = (format_bits >> (14 - i)) & 1 == 1;
            let cell = if bit { Cell::Dark } else { Cell::Light };
            self.set(8, h_positions[i], cell);
            self.set(v_positions[i], 8, cell);
        }
    }

    /// Write BCH(18,6) version information (V7+).
    fn write_version(&mut self, version: usize, size: usize) {
        if version < 7 {
            return;
        }

        // BCH(18,6) encoding
        let mut version_ecc = (version as u32) << 12;
        let generator = 0b1111100100101u32; // BCH generator for version
        for i in (0..=5).rev() {
            if version_ecc & (1 << (i + 12)) != 0 {
                version_ecc ^= generator << i;
            }
        }
        let version_bits = ((version as u32) << 12) | version_ecc;

        // Place version bits in two 6x3 rectangles
        for i in 0..6 {
            for j in 0..3 {
                let bit_idx = i * 3 + j;
                let bit = (version_bits >> bit_idx) & 1 == 1;
                let cell = if bit { Cell::Dark } else { Cell::Light };
                // Bottom-left area
                self.set(size - 11 + j, i, cell);
                // Top-right area
                self.set(i, size - 11 + j, cell);
            }
        }
    }

    /// Build the complete QR matrix. Returns a flat Vec<bool> (true = dark).
    pub fn build(version: usize, ec: EcLevel, data: &[u8]) -> Vec<bool> {
        let size = matrix_size(version);
        let mut mat = QrMatrix::new(size);

        // 1. Place function patterns
        mat.place_finder(0, 0);
        mat.place_finder(0, size - 7);
        mat.place_finder(size - 7, 0);
        mat.place_separators(size);
        mat.place_alignment(version);
        mat.place_timing(size);
        mat.reserve_format(size);
        mat.reserve_version(version, size);

        // 2. Place data
        mat.place_data(data, size);

        // 3. Try all 8 masks, pick the one with lowest penalty
        let mut best_mask = 0u8;
        let mut best_penalty = u32::MAX;

        for mask_id in 0..8u8 {
            let mut trial = mat.clone();
            trial.apply_mask_data_only(mask_id, size);
            trial.write_format(ec, mask_id, size);
            trial.write_version(version, size);

            let bool_cells: Vec<bool> = trial.cells.iter().map(|c| *c == Cell::Dark).collect();
            let p = Self::penalty(&bool_cells, size);
            if p < best_penalty {
                best_penalty = p;
                best_mask = mask_id;
            }
        }

        // 4. Apply best mask
        mat.apply_mask_data_only(best_mask, size);
        mat.write_format(ec, best_mask, size);
        mat.write_version(version, size);

        mat.cells.iter().map(|c| *c == Cell::Dark).collect()
    }

    /// Apply mask only to data modules (those that were Empty before data placement).
    /// We need to track which modules are "data" vs "function pattern".
    /// Since apply_mask is called after place_data, we mark which cells were placed
    /// as data by checking the original function pattern matrix.
    fn apply_mask_data_only(&mut self, mask_id: u8, size: usize) {
        // We need to know which cells are data cells.
        // Data cells are those that were Empty before place_data.
        // We rebuild the function pattern mask to determine this.
        let mut func_mat = QrMatrix::new(size);
        // Rebuild function patterns to know which cells are function vs data
        // This is a bit wasteful but correct.
        let version = (size - 17) / 4;
        func_mat.place_finder(0, 0);
        func_mat.place_finder(0, size - 7);
        func_mat.place_finder(size - 7, 0);
        func_mat.place_separators(size);
        func_mat.place_alignment(version);
        func_mat.place_timing(size);
        func_mat.reserve_format(size);
        func_mat.reserve_version(version, size);

        for row in 0..size {
            for col in 0..size {
                let idx = row * size + col;
                // Only mask data modules (those that were Empty in func_mat)
                if func_mat.cells[idx] != Cell::Empty {
                    continue;
                }

                let should_mask = match mask_id {
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
                if should_mask {
                    self.cells[idx] = match self.cells[idx] {
                        Cell::Dark => Cell::Light,
                        Cell::Light => Cell::Dark,
                        other => other,
                    };
                }
            }
        }
    }
}

impl Clone for QrMatrix {
    fn clone(&self) -> Self {
        QrMatrix {
            cells: self.cells.clone(),
            size: self.size,
        }
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
    fn build_v1_produces_correct_count() {
        // V1-M "Hello" - we just need some valid data
        let data = vec![0u8; 26]; // enough for V1
        let modules = QrMatrix::build(1, EcLevel::M, &data);
        assert_eq!(modules.len(), 21 * 21);
    }

    #[test]
    fn finder_pattern_corners_are_dark() {
        let data = vec![0u8; 26];
        let modules = QrMatrix::build(1, EcLevel::M, &data);
        let size = 21;
        // Top-left finder: corners at (0,0), (0,6), (6,0), (6,6)
        assert!(modules[0 * size + 0], "top-left corner should be dark");
        assert!(modules[0 * size + 6], "top-right of TL finder should be dark");
        assert!(modules[6 * size + 0], "bottom-left of TL finder should be dark");
        assert!(modules[6 * size + 6], "bottom-right of TL finder should be dark");
    }
}
