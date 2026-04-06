use wasm_bindgen::prelude::*;

const DIGITS: &[u8; 36] = b"0123456789abcdefghijklmnopqrstuvwxyz";

fn convert_base_inner(value: &str, from_base: u32, to_base: u32) -> Result<String, String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err("Empty input".to_string());
    }
    if !(2..=36).contains(&from_base) {
        return Err(format!("Invalid fromBase: {}. Must be 2-36.", from_base));
    }
    if !(2..=36).contains(&to_base) {
        return Err(format!("Invalid toBase: {}. Must be 2-36.", to_base));
    }

    let lower = trimmed.to_ascii_lowercase();

    // Parse input to u128
    let mut decimal: u128 = 0;
    for ch in lower.chars() {
        let digit_val = match ch {
            '0'..='9' => (ch as u32) - ('0' as u32),
            'a'..='z' => (ch as u32) - ('a' as u32) + 10,
            _ => {
                return Err(format!(
                    "Invalid character '{}' for base {}",
                    ch, from_base
                ));
            }
        };
        if digit_val >= from_base {
            return Err(format!(
                "Invalid character '{}' for base {}",
                ch, from_base
            ));
        }
        decimal = decimal
            .checked_mul(from_base as u128)
            .and_then(|d| d.checked_add(digit_val as u128))
            .ok_or_else(|| "Number too large".to_string())?;
    }

    // Convert to target base
    if decimal == 0 {
        return Ok("0".to_string());
    }

    let mut result = Vec::new();
    let mut remaining = decimal;
    while remaining > 0 {
        let digit = (remaining % to_base as u128) as usize;
        result.push(DIGITS[digit] as char);
        remaining /= to_base as u128;
    }

    result.reverse();
    Ok(result.into_iter().collect())
}

/// Convert a number string from one base to another (bases 2-36).
/// Returns lowercase. Throws on invalid input.
#[wasm_bindgen]
pub fn convert_base(value: &str, from_base: u32, to_base: u32) -> Result<String, JsError> {
    convert_base_inner(value, from_base, to_base).map_err(|e| JsError::new(&e))
}

/// Check if a string is valid for a given base.
#[wasm_bindgen]
pub fn is_valid_for_base(value: &str, base: u32) -> bool {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return true;
    }
    let lower = trimmed.to_ascii_lowercase();
    lower.chars().all(|ch| {
        let digit_val = match ch {
            '0'..='9' => (ch as u32) - ('0' as u32),
            'a'..='z' => (ch as u32) - ('a' as u32) + 10,
            _ => return false,
        };
        digit_val < base
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decimal_to_binary() {
        assert_eq!(convert_base_inner("42", 10, 2).unwrap(), "101010");
    }

    #[test]
    fn binary_to_decimal() {
        assert_eq!(convert_base_inner("101010", 2, 10).unwrap(), "42");
    }

    #[test]
    fn decimal_to_hex() {
        assert_eq!(convert_base_inner("255", 10, 16).unwrap(), "ff");
    }

    #[test]
    fn hex_to_decimal() {
        assert_eq!(convert_base_inner("ff", 16, 10).unwrap(), "255");
    }

    #[test]
    fn decimal_to_octal() {
        assert_eq!(convert_base_inner("8", 10, 8).unwrap(), "10");
    }

    #[test]
    fn octal_to_decimal() {
        assert_eq!(convert_base_inner("10", 8, 10).unwrap(), "8");
    }

    #[test]
    fn zero_handling() {
        assert_eq!(convert_base_inner("0", 10, 2).unwrap(), "0");
        assert_eq!(convert_base_inner("0", 2, 16).unwrap(), "0");
    }

    #[test]
    fn large_number_roundtrip() {
        let large = "9007199254740993";
        let hex = convert_base_inner(large, 10, 16).unwrap();
        let back = convert_base_inner(&hex, 16, 10).unwrap();
        assert_eq!(back, large);
    }

    #[test]
    fn empty_input_error() {
        assert!(convert_base_inner("", 10, 2).is_err());
    }

    #[test]
    fn invalid_char_for_base() {
        assert!(convert_base_inner("2", 2, 10).is_err());
        assert!(convert_base_inner("g", 16, 10).is_err());
    }

    #[test]
    fn is_valid_binary() {
        assert!(is_valid_for_base("0101", 2));
        assert!(!is_valid_for_base("0123", 2));
    }

    #[test]
    fn is_valid_hex() {
        assert!(is_valid_for_base("ff00", 16));
        assert!(!is_valid_for_base("zz", 16));
    }

    #[test]
    fn is_valid_empty() {
        assert!(is_valid_for_base("", 10));
    }
}
