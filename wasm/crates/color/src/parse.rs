/// Color structs for internal representation.

#[derive(Debug, Clone, Copy)]
pub struct Rgb {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

#[derive(Debug, Clone, Copy)]
pub struct Hsl {
    pub h: f64,
    pub s: f64,
    pub l: f64,
}

#[derive(Debug, Clone, Copy)]
pub struct Lab {
    pub l: f64,
    pub a: f64,
    pub b: f64,
}

#[derive(Debug, Clone, Copy)]
pub struct Lch {
    pub l: f64,
    pub c: f64,
    pub h: f64,
}

#[derive(Debug, Clone, Copy)]
pub struct Oklch {
    pub l: f64,
    pub c: f64,
    pub h: f64,
}

/// Parse a hex color string (with or without #, 3 or 6 digits).
pub fn parse_hex(input: &str) -> Result<Rgb, String> {
    let clean = input.trim_start_matches('#').to_ascii_lowercase();

    if clean.len() == 3 && clean.chars().all(|c| c.is_ascii_hexdigit()) {
        let chars: Vec<char> = clean.chars().collect();
        let r = hex_char_to_u8(chars[0]) * 17;
        let g = hex_char_to_u8(chars[1]) * 17;
        let b = hex_char_to_u8(chars[2]) * 17;
        Ok(Rgb { r, g, b })
    } else if clean.len() == 6 && clean.chars().all(|c| c.is_ascii_hexdigit()) {
        let r = u8::from_str_radix(&clean[0..2], 16).unwrap();
        let g = u8::from_str_radix(&clean[2..4], 16).unwrap();
        let b = u8::from_str_radix(&clean[4..6], 16).unwrap();
        Ok(Rgb { r, g, b })
    } else {
        Err("Invalid hex color format. Use #111 or #111111".to_string())
    }
}

fn hex_char_to_u8(c: char) -> u8 {
    match c {
        '0'..='9' => c as u8 - b'0',
        'a'..='f' => c as u8 - b'a' + 10,
        _ => 0,
    }
}

/// Parse `rgb(R, G, B)` format.
pub fn parse_rgb(input: &str) -> Result<Rgb, String> {
    // Match rgb(R, G, B) with comma separation
    let inner = input
        .strip_prefix("rgb(")
        .and_then(|s| s.strip_suffix(')'))
        .ok_or("Invalid RGB color format")?;

    let parts: Vec<&str> = inner.split(',').map(|s| s.trim()).collect();
    if parts.len() != 3 {
        return Err("Invalid RGB color format".to_string());
    }

    let r: i32 = parts[0]
        .parse()
        .map_err(|_| "Invalid RGB color format: contains non-numeric values".to_string())?;
    let g: i32 = parts[1]
        .parse()
        .map_err(|_| "Invalid RGB color format: contains non-numeric values".to_string())?;
    let b: i32 = parts[2]
        .parse()
        .map_err(|_| "Invalid RGB color format: contains non-numeric values".to_string())?;

    if r < 0 || r > 255 {
        return Err(format!(
            "Invalid RGB red value: {}. Must be between 0 and 255",
            r
        ));
    }
    if g < 0 || g > 255 {
        return Err(format!(
            "Invalid RGB green value: {}. Must be between 0 and 255",
            g
        ));
    }
    if b < 0 || b > 255 {
        return Err(format!(
            "Invalid RGB blue value: {}. Must be between 0 and 255",
            b
        ));
    }

    Ok(Rgb {
        r: r as u8,
        g: g as u8,
        b: b as u8,
    })
}

/// Parse `hsl(H S% L%)` format (space-separated).
pub fn parse_hsl(input: &str) -> Result<Hsl, String> {
    let inner = input
        .strip_prefix("hsl(")
        .and_then(|s| s.strip_suffix(')'))
        .ok_or("Invalid HSL color format")?;

    let parts: Vec<&str> = inner.split_whitespace().collect();
    if parts.len() != 3 {
        return Err("Invalid HSL color format".to_string());
    }

    let h: f64 = parts[0]
        .parse()
        .map_err(|_| "Invalid HSL color format: contains non-numeric values".to_string())?;
    let s: f64 = parts[1]
        .trim_end_matches('%')
        .parse()
        .map_err(|_| "Invalid HSL color format: contains non-numeric values".to_string())?;
    let l: f64 = parts[2]
        .trim_end_matches('%')
        .parse()
        .map_err(|_| "Invalid HSL color format: contains non-numeric values".to_string())?;

    if h < 0.0 || h >= 360.0 {
        return Err(format!(
            "Invalid HSL hue value: {}. Must be between 0 and 359",
            format_hsl_val(h)
        ));
    }
    if s < 0.0 || s > 100.0 {
        return Err(format!(
            "Invalid HSL saturation value: {}%. Must be between 0% and 100%",
            format_hsl_val(s)
        ));
    }
    if l < 0.0 || l > 100.0 {
        return Err(format!(
            "Invalid HSL lightness value: {}%. Must be between 0% and 100%",
            format_hsl_val(l)
        ));
    }

    Ok(Hsl { h, s, l })
}

/// Format a float to match JS Number behavior (strip trailing zeros but keep integer form).
fn format_hsl_val(v: f64) -> String {
    if v == v.floor() {
        format!("{}", v as i64)
    } else {
        format!("{}", v)
    }
}

/// Parse `lab(L A B)` format (space-separated).
pub fn parse_lab(input: &str) -> Result<Lab, String> {
    let inner = input
        .strip_prefix("lab(")
        .and_then(|s| s.strip_suffix(')'))
        .ok_or("Invalid LAB color format")?;

    let parts: Vec<&str> = inner.split_whitespace().collect();
    if parts.len() != 3 {
        return Err("Invalid LAB color format".to_string());
    }

    let l: f64 = parts[0]
        .parse()
        .map_err(|_| "Invalid LAB color format: contains non-numeric values".to_string())?;
    let a: f64 = parts[1]
        .parse()
        .map_err(|_| "Invalid LAB color format: contains non-numeric values".to_string())?;
    let b: f64 = parts[2]
        .parse()
        .map_err(|_| "Invalid LAB color format: contains non-numeric values".to_string())?;

    if l < 0.0 || l > 100.0 {
        return Err(format!(
            "Invalid LAB lightness value: {}. Must be between 0 and 100",
            format_hsl_val(l)
        ));
    }
    if a < -200.0 || a > 200.0 {
        return Err(format!(
            "Invalid LAB a value: {}. Must be between -200 and 200",
            format_hsl_val(a)
        ));
    }
    if b < -200.0 || b > 200.0 {
        return Err(format!(
            "Invalid LAB b value: {}. Must be between -200 and 200",
            format_hsl_val(b)
        ));
    }

    Ok(Lab { l, a, b })
}

/// Parse `lch(L C H)` format (space-separated).
pub fn parse_lch(input: &str) -> Result<Lch, String> {
    let inner = input
        .strip_prefix("lch(")
        .and_then(|s| s.strip_suffix(')'))
        .ok_or("Invalid LCH color format")?;

    let parts: Vec<&str> = inner.split_whitespace().collect();
    if parts.len() != 3 {
        return Err("Invalid LCH color format".to_string());
    }

    let l: f64 = parts[0]
        .parse()
        .map_err(|_| "Invalid LCH color format: contains non-numeric values".to_string())?;
    let c: f64 = parts[1]
        .parse()
        .map_err(|_| "Invalid LCH color format: contains non-numeric values".to_string())?;
    let h: f64 = parts[2]
        .parse()
        .map_err(|_| "Invalid LCH color format: contains non-numeric values".to_string())?;

    if l < 0.0 || l > 100.0 {
        return Err(format!(
            "Invalid LCH lightness value: {}. Must be between 0 and 100",
            format_hsl_val(l)
        ));
    }
    if c < 0.0 {
        return Err(format!(
            "Invalid LCH chroma value: {}. Must be 0 or greater",
            format_hsl_val(c)
        ));
    }
    if h < 0.0 || h >= 360.0 {
        return Err(format!(
            "Invalid LCH hue value: {}. Must be between 0 and 359",
            format_hsl_val(h)
        ));
    }

    Ok(Lch { l, c, h })
}

/// Parse `oklch(L C H)` format (space-separated).
pub fn parse_oklch(input: &str) -> Result<Oklch, String> {
    let inner = input
        .strip_prefix("oklch(")
        .and_then(|s| s.strip_suffix(')'))
        .ok_or("Invalid OKLCH color format")?;

    let parts: Vec<&str> = inner.split_whitespace().collect();
    if parts.len() != 3 {
        return Err("Invalid OKLCH color format".to_string());
    }

    let l: f64 = parts[0]
        .parse()
        .map_err(|_| "Invalid OKLCH color format: contains non-numeric values".to_string())?;
    let c: f64 = parts[1]
        .parse()
        .map_err(|_| "Invalid OKLCH color format: contains non-numeric values".to_string())?;
    let h: f64 = parts[2]
        .parse()
        .map_err(|_| "Invalid OKLCH color format: contains non-numeric values".to_string())?;

    if l < 0.0 || l > 1.0 {
        return Err(format!(
            "Invalid OKLCH lightness value: {}. Must be between 0 and 1",
            format_hsl_val(l)
        ));
    }
    if c < 0.0 {
        return Err(format!(
            "Invalid OKLCH chroma value: {}. Must be 0 or greater",
            format_hsl_val(c)
        ));
    }
    if h < 0.0 || h >= 360.0 {
        return Err(format!(
            "Invalid OKLCH hue value: {}. Must be between 0 and 359",
            format_hsl_val(h)
        ));
    }

    Ok(Oklch { l, c, h })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_hex_6digit() {
        let rgb = parse_hex("#c08081").unwrap();
        assert_eq!(rgb.r, 192);
        assert_eq!(rgb.g, 128);
        assert_eq!(rgb.b, 129);
    }

    #[test]
    fn parse_hex_3digit() {
        let rgb = parse_hex("#f00").unwrap();
        assert_eq!(rgb.r, 255);
        assert_eq!(rgb.g, 0);
        assert_eq!(rgb.b, 0);
    }

    #[test]
    fn parse_hex_no_hash() {
        let rgb = parse_hex("ff0000").unwrap();
        assert_eq!(rgb.r, 255);
        assert_eq!(rgb.g, 0);
        assert_eq!(rgb.b, 0);
    }

    #[test]
    fn parse_hex_invalid() {
        assert!(parse_hex("#invalid").is_err());
        assert!(parse_hex("#12345").is_err());
        assert!(parse_hex("#ff000080").is_err());
    }

    #[test]
    fn parse_rgb_valid() {
        let rgb = parse_rgb("rgb(192, 128, 129)").unwrap();
        assert_eq!(rgb.r, 192);
        assert_eq!(rgb.g, 128);
        assert_eq!(rgb.b, 129);
    }

    #[test]
    fn parse_rgb_out_of_range() {
        assert!(parse_rgb("rgb(256, 0, 0)").is_err());
        assert!(parse_rgb("rgb(0, 256, 0)").is_err());
        assert!(parse_rgb("rgb(0, 0, 256)").is_err());
    }

    #[test]
    fn parse_hsl_valid() {
        let hsl = parse_hsl("hsl(359.06 33.68% 62.75%)").unwrap();
        assert!((hsl.h - 359.06).abs() < 0.001);
        assert!((hsl.s - 33.68).abs() < 0.001);
        assert!((hsl.l - 62.75).abs() < 0.001);
    }

    #[test]
    fn parse_lab_valid() {
        let lab = parse_lab("lab(60.10 24.90 9.63)").unwrap();
        assert!((lab.l - 60.10).abs() < 0.001);
        assert!((lab.a - 24.90).abs() < 0.001);
        assert!((lab.b - 9.63).abs() < 0.001);
    }

    #[test]
    fn parse_lch_valid() {
        let lch = parse_lch("lch(60.10 26.70 21.15)").unwrap();
        assert!((lch.l - 60.10).abs() < 0.001);
        assert!((lch.c - 26.70).abs() < 0.001);
        assert!((lch.h - 21.15).abs() < 0.001);
    }

    #[test]
    fn parse_oklch_valid() {
        let oklch = parse_oklch("oklch(0.6655 0.0797 18.38)").unwrap();
        assert!((oklch.l - 0.6655).abs() < 0.0001);
        assert!((oklch.c - 0.0797).abs() < 0.0001);
        assert!((oklch.h - 18.38).abs() < 0.01);
    }
}
