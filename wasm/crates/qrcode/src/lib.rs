mod ec;
mod encode;
mod matrix;
mod png;
mod svg;

use encode::EcLevel;
use wasm_bindgen::prelude::*;

/// Internal PNG data URL generation (testable without wasm_bindgen).
fn qr_png_data_url(data: &str, size: u32, fg: &str, bg: &str, ec: &str) -> Result<String, String> {
    if data.is_empty() {
        return Err("Data must not be empty".into());
    }

    let ec_level = EcLevel::from_str(ec)
        .ok_or("Invalid EC level. Use L, M, Q, or H")?;

    let (version, codewords) = encode::encode_data(data.as_bytes(), ec_level)
        .ok_or("Data too large for QR code")?;

    let interleaved = encode::interleave(version, ec_level, &codewords);
    let modules = matrix::QrMatrix::build(version, ec_level, &interleaved);
    let qr_size = matrix::matrix_size(version);
    let margin = 2;
    let pixel_size = size.max(1) as usize;

    let fg_color = png::parse_hex_color(fg);
    let bg_color = png::parse_hex_color(bg);

    let png_bytes = png::encode_png(&modules, qr_size, pixel_size, margin, fg_color, bg_color);
    let b64 = png::base64_encode(&png_bytes);

    Ok(format!("data:image/png;base64,{b64}"))
}

/// Internal SVG generation (testable without wasm_bindgen).
fn qr_svg_string(data: &str, size: u32, fg: &str, bg: &str, ec: &str) -> Result<String, String> {
    if data.is_empty() {
        return Err("Data must not be empty".into());
    }

    let ec_level = EcLevel::from_str(ec)
        .ok_or("Invalid EC level. Use L, M, Q, or H")?;

    let (version, codewords) = encode::encode_data(data.as_bytes(), ec_level)
        .ok_or("Data too large for QR code")?;

    let interleaved = encode::interleave(version, ec_level, &codewords);
    let modules = matrix::QrMatrix::build(version, ec_level, &interleaved);
    let qr_size = matrix::matrix_size(version);
    let margin = 2;
    let pixel_size = size.max(1) as usize;

    let svg_str = svg::build_svg(&modules, qr_size, pixel_size, margin, fg, bg);

    Ok(svg_str)
}

/// Generate a QR code as a PNG data URL.
#[wasm_bindgen]
pub fn generate_qr_png_data_url(
    data: &str,
    size: u32,
    fg: &str,
    bg: &str,
    ec: &str,
) -> Result<String, JsError> {
    qr_png_data_url(data, size, fg, bg, ec).map_err(|e| JsError::new(&e))
}

/// Generate a QR code as an SVG string.
#[wasm_bindgen]
pub fn generate_qr_svg_string(
    data: &str,
    size: u32,
    fg: &str,
    bg: &str,
    ec: &str,
) -> Result<String, JsError> {
    qr_svg_string(data, size, fg, bg, ec).map_err(|e| JsError::new(&e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn png_data_url_starts_correctly() {
        let result = qr_png_data_url("Hello", 4, "#000000", "#ffffff", "M").unwrap();
        assert!(
            result.starts_with("data:image/png;base64,"),
            "PNG data URL should start with the correct prefix"
        );
    }

    #[test]
    fn svg_contains_tags() {
        let result = qr_svg_string("Hello", 4, "#000000", "#ffffff", "M").unwrap();
        assert!(result.contains("<svg"), "SVG should contain <svg tag");
        assert!(result.contains("</svg>"), "SVG should contain closing tag");
    }

    #[test]
    fn empty_data_returns_error() {
        let result = qr_png_data_url("", 4, "#000000", "#ffffff", "M");
        assert!(result.is_err(), "Empty data should return error");
    }

    #[test]
    fn different_ec_levels_produce_different_output() {
        let result_l = qr_svg_string("Hello", 4, "#000000", "#ffffff", "L").unwrap();
        let result_h = qr_svg_string("Hello", 4, "#000000", "#ffffff", "H").unwrap();
        assert_ne!(result_l, result_h, "Different EC levels should produce different output");
    }
}
