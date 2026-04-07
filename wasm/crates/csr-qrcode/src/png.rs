/// Minimal PNG encoder for QR codes.

use flate2::write::ZlibEncoder;
use flate2::Compression;
use std::io::Write;

/// Parse a hex color string like "#FF8800" or "#ff8800" into (R, G, B).
pub fn parse_hex_color(hex: &str) -> (u8, u8, u8) {
    let hex = hex.trim_start_matches('#');
    let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(0);
    let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0);
    let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0);
    (r, g, b)
}

/// CRC32 for PNG chunks (IEEE polynomial).
pub fn crc32(data: &[u8]) -> u32 {
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
    crc ^ 0xFFFFFFFF
}

/// Standard base64 encoding.
pub fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::new();

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

/// Encode QR modules as a PNG image.
/// Returns raw PNG bytes.
pub fn encode_png(
    modules: &[bool],
    qr_size: usize,
    pixel_size: usize,
    margin: usize,
    fg: (u8, u8, u8),
    bg: (u8, u8, u8),
) -> Vec<u8> {
    let img_size = qr_size * pixel_size + 2 * margin * pixel_size;

    let mut png = Vec::new();

    // PNG signature
    png.extend_from_slice(&[137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk
    let mut ihdr_data = Vec::new();
    ihdr_data.extend_from_slice(b"IHDR");
    ihdr_data.extend_from_slice(&(img_size as u32).to_be_bytes()); // width
    ihdr_data.extend_from_slice(&(img_size as u32).to_be_bytes()); // height
    ihdr_data.push(8);  // bit depth
    ihdr_data.push(2);  // color type: RGB
    ihdr_data.push(0);  // compression
    ihdr_data.push(0);  // filter
    ihdr_data.push(0);  // interlace
    write_chunk(&mut png, &ihdr_data);

    // Build raw image data (filter byte 0 + RGB pixels per row)
    let mut raw = Vec::new();
    for y in 0..img_size {
        raw.push(0); // filter: None
        for x in 0..img_size {
            let qr_col = (x as isize - (margin * pixel_size) as isize) / pixel_size as isize;
            let qr_row = (y as isize - (margin * pixel_size) as isize) / pixel_size as isize;

            let (r, g, b) = if qr_row >= 0
                && qr_row < qr_size as isize
                && qr_col >= 0
                && qr_col < qr_size as isize
                && modules[qr_row as usize * qr_size + qr_col as usize]
            {
                fg
            } else {
                bg
            };
            raw.push(r);
            raw.push(g);
            raw.push(b);
        }
    }

    // Compress with zlib
    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(&raw).unwrap();
    let compressed = encoder.finish().unwrap();

    // IDAT chunk
    let mut idat_data = Vec::new();
    idat_data.extend_from_slice(b"IDAT");
    idat_data.extend_from_slice(&compressed);
    write_chunk(&mut png, &idat_data);

    // IEND chunk
    let mut iend_data = Vec::new();
    iend_data.extend_from_slice(b"IEND");
    write_chunk(&mut png, &iend_data);

    png
}

/// Write a PNG chunk: length + type+data + CRC.
fn write_chunk(out: &mut Vec<u8>, type_and_data: &[u8]) {
    let data_len = (type_and_data.len() - 4) as u32;
    out.extend_from_slice(&data_len.to_be_bytes());
    out.extend_from_slice(type_and_data);
    let crc = crc32(type_and_data);
    out.extend_from_slice(&crc.to_be_bytes());
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
    fn parse_orange() {
        assert_eq!(parse_hex_color("#FF8800"), (255, 136, 0));
    }

    #[test]
    fn png_starts_with_signature() {
        let modules = vec![true, false, false, true];
        let png = encode_png(&modules, 2, 1, 0, (0, 0, 0), (255, 255, 255));
        assert_eq!(&png[0..8], &[137, 80, 78, 71, 13, 10, 26, 10]);
    }

    #[test]
    fn base64_encodes_correctly() {
        assert_eq!(base64_encode(b"Hello"), "SGVsbG8=");
        assert_eq!(base64_encode(b"Man"), "TWFu");
    }
}
