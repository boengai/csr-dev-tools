use wasm_bindgen::prelude::*;

pub mod convert;
pub mod format;
pub mod parse;

/// Convert a color string from one format to all 6 formats.
/// Returns a JS object with keys: hex, rgb, hsl, lab, lch, oklch.
/// The source format key preserves the original input string exactly.
#[wasm_bindgen]
pub fn convert_color(source: &str, source_format: &str) -> Result<JsValue, JsError> {
    let result = convert_color_inner(source, source_format)
        .map_err(|e| JsError::new(&format!("Failed to convert color: {}", e)))?;

    let obj = js_sys::Object::new();
    js_sys::Reflect::set(&obj, &"hex".into(), &result.hex.into()).unwrap();
    js_sys::Reflect::set(&obj, &"rgb".into(), &result.rgb.into()).unwrap();
    js_sys::Reflect::set(&obj, &"hsl".into(), &result.hsl.into()).unwrap();
    js_sys::Reflect::set(&obj, &"lab".into(), &result.lab.into()).unwrap();
    js_sys::Reflect::set(&obj, &"lch".into(), &result.lch.into()).unwrap();
    js_sys::Reflect::set(&obj, &"oklch".into(), &result.oklch.into()).unwrap();

    // Override source format with original input
    js_sys::Reflect::set(&obj, &source_format.into(), &source.into()).unwrap();

    Ok(obj.into())
}

struct ColorResult {
    hex: String,
    rgb: String,
    hsl: String,
    lab: String,
    lch: String,
    oklch: String,
}

fn convert_color_inner(source: &str, source_format: &str) -> Result<ColorResult, String> {
    let rgb = match source_format {
        "hex" => {
            let _ = validate_hex(source)?;
            parse::parse_hex(source)?
        }
        "rgb" => parse::parse_rgb(source)?,
        "hsl" => {
            let hsl = parse::parse_hsl(source)?;
            convert::hsl_to_rgb(hsl)
        }
        "lab" => {
            let lab = parse::parse_lab(source)?;
            convert::lab_to_rgb(lab)
        }
        "lch" => {
            let lch = parse::parse_lch(source)?;
            convert::lch_to_rgb(lch)
        }
        "oklch" => {
            let oklch = parse::parse_oklch(source)?;
            convert::oklch_to_rgb(oklch)
        }
        _ => return Err(format!("Unsupported color format: {}", source_format)),
    };

    Ok(ColorResult {
        hex: format::format_hex(rgb),
        rgb: format::format_rgb(rgb),
        hsl: format::format_hsl(convert::rgb_to_hsl(rgb)),
        lab: format::format_lab(convert::rgb_to_lab(rgb)),
        lch: format::format_lch(convert::rgb_to_lch(rgb)),
        oklch: format::format_oklch(convert::rgb_to_oklch(rgb)),
    })
}

/// Validate hex format (same as parse_hex but returns the cleaned string).
fn validate_hex(hex: &str) -> Result<String, String> {
    let clean = hex.trim_start_matches('#').to_ascii_lowercase();
    if (clean.len() == 3 || clean.len() == 6) && clean.chars().all(|c| c.is_ascii_hexdigit()) {
        Ok(clean)
    } else {
        Err("Invalid hex color format. Use #111 or #111111".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn convert(source: &str, format: &str) -> ColorResult {
        convert_color_inner(source, format).unwrap()
    }

    // --- Canonical example ---

    #[test]
    fn hex_to_all_formats() {
        let r = convert("#c08081", "hex");
        assert_eq!(r.hex, "#c08081");
        assert_eq!(r.rgb, "rgb(192, 128, 129)");
        assert_eq!(r.hsl, "hsl(359.06 33.68% 62.75%)");
        assert_eq!(r.lab, "lab(60.10 24.90 9.63)");
        assert_eq!(r.lch, "lch(60.10 26.70 21.15)");
        assert_eq!(r.oklch, "oklch(0.6655 0.0797 18.38)");
    }

    #[test]
    fn rgb_to_all_formats() {
        let r = convert("rgb(192, 128, 129)", "rgb");
        assert_eq!(r.hex, "#c08081");
        assert_eq!(r.hsl, "hsl(359.06 33.68% 62.75%)");
        assert_eq!(r.lab, "lab(60.10 24.90 9.63)");
        assert_eq!(r.lch, "lch(60.10 26.70 21.15)");
        assert_eq!(r.oklch, "oklch(0.6655 0.0797 18.38)");
    }

    #[test]
    fn hsl_to_all_formats() {
        let r = convert("hsl(359.06 33.68% 62.75%)", "hsl");
        assert_eq!(r.hex, "#c08081");
        assert_eq!(r.rgb, "rgb(192, 128, 129)");
        assert_eq!(r.lab, "lab(60.10 24.90 9.63)");
        assert_eq!(r.lch, "lch(60.10 26.70 21.15)");
        assert_eq!(r.oklch, "oklch(0.6655 0.0797 18.38)");
    }

    #[test]
    fn lab_to_all_formats() {
        let r = convert("lab(60.10 24.90 9.63)", "lab");
        assert_eq!(r.hex, "#c08081");
        assert_eq!(r.rgb, "rgb(192, 128, 129)");
        assert_eq!(r.hsl, "hsl(359.06 33.68% 62.75%)");
        assert_eq!(r.lch, "lch(60.10 26.70 21.15)");
        assert_eq!(r.oklch, "oklch(0.6655 0.0797 18.38)");
    }

    #[test]
    fn lch_to_all_formats() {
        let r = convert("lch(60.10 26.70 21.15)", "lch");
        assert_eq!(r.hex, "#c08081");
        assert_eq!(r.rgb, "rgb(192, 128, 129)");
        assert_eq!(r.hsl, "hsl(359.06 33.68% 62.75%)");
        assert_eq!(r.lab, "lab(60.10 24.90 9.63)");
        assert_eq!(r.oklch, "oklch(0.6655 0.0797 18.38)");
    }

    #[test]
    fn oklch_to_all_formats() {
        let r = convert("oklch(0.6655 0.0797 18.38)", "oklch");
        assert_eq!(r.hex, "#c08081");
        assert_eq!(r.rgb, "rgb(192, 128, 129)");
        assert_eq!(r.hsl, "hsl(359.06 33.68% 62.75%)");
        assert_eq!(r.lab, "lab(60.10 24.90 9.63)");
        assert_eq!(r.lch, "lch(60.10 26.70 21.15)");
    }

    // --- 3-digit hex ---

    #[test]
    fn hex_3digit_f00() {
        let r = convert("#f00", "hex");
        assert_eq!(r.rgb, "rgb(255, 0, 0)");
    }

    #[test]
    fn hex_3digit_abc() {
        let r = convert("#abc", "hex");
        assert_eq!(r.rgb, "rgb(170, 187, 204)");
    }

    #[test]
    fn hex_3digit_fff() {
        let r = convert("#fff", "hex");
        assert_eq!(r.rgb, "rgb(255, 255, 255)");
    }

    #[test]
    fn hex_3digit_000() {
        let r = convert("#000", "hex");
        assert_eq!(r.rgb, "rgb(0, 0, 0)");
    }

    // --- Hex without # ---

    #[test]
    fn hex_no_hash_6digit() {
        let r = convert("ff0000", "hex");
        assert_eq!(r.rgb, "rgb(255, 0, 0)");
    }

    #[test]
    fn hex_no_hash_3digit() {
        let r = convert("abc", "hex");
        assert_eq!(r.rgb, "rgb(170, 187, 204)");
    }

    // --- Pure colors ---

    #[test]
    fn pure_black() {
        let r = convert("#000000", "hex");
        assert_eq!(r.rgb, "rgb(0, 0, 0)");
        assert_eq!(r.hsl, "hsl(0.00 0.00% 0.00%)");
    }

    #[test]
    fn pure_white() {
        let r = convert("#ffffff", "hex");
        assert_eq!(r.rgb, "rgb(255, 255, 255)");
        assert_eq!(r.hsl, "hsl(0.00 0.00% 100.00%)");
    }

    #[test]
    fn pure_red() {
        let r = convert("#ff0000", "hex");
        assert_eq!(r.rgb, "rgb(255, 0, 0)");
        assert_eq!(r.hsl, "hsl(0.00 100.00% 50.00%)");
    }

    #[test]
    fn pure_green() {
        let r = convert("#00ff00", "hex");
        assert_eq!(r.rgb, "rgb(0, 255, 0)");
        assert_eq!(r.hsl, "hsl(120.00 100.00% 50.00%)");
    }

    #[test]
    fn pure_blue() {
        let r = convert("#0000ff", "hex");
        assert_eq!(r.rgb, "rgb(0, 0, 255)");
        assert_eq!(r.hsl, "hsl(240.00 100.00% 50.00%)");
    }

    // --- Boundary values ---

    #[test]
    fn rgb_min() {
        let r = convert("rgb(0, 0, 0)", "rgb");
        assert_eq!(r.hex, "#000000");
    }

    #[test]
    fn rgb_max() {
        let r = convert("rgb(255, 255, 255)", "rgb");
        assert_eq!(r.hex, "#ffffff");
    }

    #[test]
    fn hsl_min() {
        let r = convert("hsl(0 0% 0%)", "hsl");
        assert_eq!(r.hex, "#000000");
    }

    #[test]
    fn hsl_white() {
        let r = convert("hsl(0 0% 100%)", "hsl");
        assert_eq!(r.hex, "#ffffff");
    }

    #[test]
    fn hsl_red() {
        let r = convert("hsl(0 100% 50%)", "hsl");
        assert_eq!(r.hex, "#ff0000");
    }

    #[test]
    fn oklch_min() {
        let r = convert("oklch(0 0 0)", "oklch");
        assert_eq!(r.hex, "#000000");
    }

    #[test]
    fn oklch_white() {
        let r = convert("oklch(1 0 0)", "oklch");
        assert_eq!(r.hex, "#ffffff");
    }

    // --- Error handling ---

    #[test]
    fn invalid_hex() {
        assert!(convert_color_inner("#invalid", "hex").is_err());
        assert!(convert_color_inner("invalid", "hex").is_err());
        assert!(convert_color_inner("#12345", "hex").is_err());
        assert!(convert_color_inner("#ff000080", "hex").is_err());
    }

    #[test]
    fn invalid_rgb() {
        assert!(convert_color_inner("rgb(invalid)", "rgb").is_err());
        assert!(convert_color_inner("rgb(256, 0, 0)", "rgb").is_err());
        assert!(convert_color_inner("rgb(0, 256, 0)", "rgb").is_err());
        assert!(convert_color_inner("rgb(0, 0, 256)", "rgb").is_err());
    }

    #[test]
    fn invalid_hsl() {
        assert!(convert_color_inner("hsl(invalid)", "hsl").is_err());
        assert!(convert_color_inner("hsl(0, 101%, 50%)", "hsl").is_err());
        assert!(convert_color_inner("hsl(0, 0%, 101%)", "hsl").is_err());
    }

    #[test]
    fn invalid_lab() {
        assert!(convert_color_inner("lab(invalid)", "lab").is_err());
    }

    #[test]
    fn invalid_lch() {
        assert!(convert_color_inner("lch(invalid)", "lch").is_err());
    }

    #[test]
    fn invalid_oklch() {
        assert!(convert_color_inner("oklch(invalid)", "oklch").is_err());
    }

    #[test]
    fn unsupported_format() {
        assert!(convert_color_inner("#ff0000", "unsupported").is_err());
    }

    #[test]
    fn empty_input() {
        assert!(convert_color_inner("", "hex").is_err());
        assert!(convert_color_inner("", "rgb").is_err());
        assert!(convert_color_inner("", "hsl").is_err());
        assert!(convert_color_inner("", "oklch").is_err());
        assert!(convert_color_inner("", "lab").is_err());
        assert!(convert_color_inner("", "lch").is_err());
    }

    #[test]
    fn whitespace_input() {
        assert!(convert_color_inner("   ", "hex").is_err());
        assert!(convert_color_inner("   ", "rgb").is_err());
    }

    // --- LAB/LCH boundary ---

    #[test]
    fn lab_black() {
        let r = convert("lab(0 0 0)", "lab");
        assert_eq!(r.hex, "#000000");
    }

    #[test]
    fn lab_white() {
        let r = convert("lab(100 0 0)", "lab");
        assert_eq!(r.hex, "#ffffff");
    }

    #[test]
    fn lch_black() {
        let r = convert("lch(0 0 0)", "lch");
        assert_eq!(r.hex, "#000000");
    }

    #[test]
    fn lch_white() {
        let r = convert("lch(100 0 0)", "lch");
        assert_eq!(r.hex, "#ffffff");
    }

    // --- Round-trip consistency ---

    #[test]
    fn roundtrip_hex_rgb_hsl() {
        let hex = "#3b82f6";
        let from_hex = convert(hex, "hex");
        let from_rgb = convert(&from_hex.rgb, "rgb");
        let from_hsl = convert(&from_rgb.hsl, "hsl");

        assert_eq!(from_hex.hex, from_rgb.hex);
        assert_eq!(from_rgb.hex, from_hsl.hex);
    }

    #[test]
    fn roundtrip_hex_lab_lch() {
        let hex = "#3b82f6";
        let from_hex = convert(hex, "hex");
        let from_lab = convert(&from_hex.lab, "lab");
        let from_lch = convert(&from_lab.lch, "lch");

        assert_eq!(from_hex.hex, from_lab.hex);
        assert_eq!(from_lab.hex, from_lch.hex);
    }

    #[test]
    fn roundtrip_hex_oklch() {
        let hex = "#3b82f6";
        let from_hex = convert(hex, "hex");
        let from_oklch = convert(&from_hex.oklch, "oklch");

        assert_eq!(from_hex.hex, from_oklch.hex);
    }

    #[test]
    fn roundtrip_rgb_oklch() {
        let rgb = "rgb(59, 130, 246)";
        let from_rgb = convert(rgb, "rgb");
        let from_oklch = convert(&from_rgb.oklch, "oklch");

        assert_eq!(from_rgb.hex, from_oklch.hex);
        assert_eq!(from_rgb.rgb, from_oklch.rgb);
    }

    #[test]
    fn roundtrip_hsl_lab() {
        let hsl = "hsl(217 91% 60%)";
        let from_hsl = convert(hsl, "hsl");
        let from_lab = convert(&from_hsl.lab, "lab");

        assert_eq!(from_hsl.hex, from_lab.hex);
        assert_eq!(from_hsl.rgb, from_lab.rgb);
    }

    #[test]
    fn roundtrip_oklch_lch() {
        let oklch = "oklch(0.6655 0.0797 18.38)";
        let from_oklch = convert(oklch, "oklch");
        let from_lch = convert(&from_oklch.lch, "lch");

        assert_eq!(from_oklch.hex, from_lch.hex);
        assert_eq!(from_oklch.oklch, from_lch.oklch);
    }

    #[test]
    fn roundtrip_lab_rgb() {
        let lab = "lab(54 -4 49)";
        let from_lab = convert(lab, "lab");
        let from_rgb = convert(&from_lab.rgb, "rgb");

        assert_eq!(from_lab.hex, from_rgb.hex);
        assert_eq!(from_lab.rgb, from_rgb.rgb);
    }

    #[test]
    fn multi_conversion_consistency() {
        let hex = "#c08081";
        let first = convert(hex, "hex");
        let second = convert(&first.rgb, "rgb");
        let third = convert(&second.hsl, "hsl");

        assert_eq!(first.hex, second.hex);
        assert_eq!(second.hex, third.hex);
        assert_eq!(first.rgb, second.rgb);
        assert_eq!(second.rgb, third.rgb);
    }

    // --- Out-of-range ---

    #[test]
    fn rgb_out_of_range() {
        assert!(convert_color_inner("rgb(256, 0, 0)", "rgb").is_err());
    }

    #[test]
    fn hsl_out_of_range() {
        assert!(convert_color_inner("hsl(360 101% 50%)", "hsl").is_err());
        assert!(convert_color_inner("hsl(0 0% 101%)", "hsl").is_err());
    }
}
