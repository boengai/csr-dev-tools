// wasm/crates/csr-json-tools/src/format.rs

pub fn format_json(input: &str, indent: u32) -> Result<String, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Empty input".into());
    }

    let value: serde_json::Value =
        serde_json::from_str(trimmed).map_err(|e| e.to_string())?;

    let indent_str = " ".repeat(indent as usize);
    let formatter = serde_json::ser::PrettyFormatter::with_indent(indent_str.as_bytes());
    let mut buf = Vec::new();
    let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
    serde::Serialize::serialize(&value, &mut ser).map_err(|e| e.to_string())?;
    String::from_utf8(buf).map_err(|e| e.to_string())
}

pub fn get_json_parse_error(input: &str) -> Option<String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Some("Empty input".into());
    }
    match serde_json::from_str::<serde_json::Value>(trimmed) {
        Ok(_) => None,
        Err(e) => Some(e.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn format_simple() {
        let result = format_json("{\"name\":\"John\",\"age\":30}", 2).unwrap();
        assert_eq!(result, "{\n  \"name\": \"John\",\n  \"age\": 30\n}");
    }

    #[test]
    fn format_array() {
        let result = format_json("[1,2,3]", 2).unwrap();
        assert_eq!(result, "[\n  1,\n  2,\n  3\n]");
    }

    #[test]
    fn empty_input() {
        assert_eq!(format_json("", 2).unwrap_err(), "Empty input");
    }

    #[test]
    fn invalid_json() {
        assert!(format_json("{invalid}", 2).is_err());
    }

    #[test]
    fn custom_indent() {
        let result = format_json("{\"a\":1}", 4).unwrap();
        assert_eq!(result, "{\n    \"a\": 1\n}");
    }

    #[test]
    fn parse_error_valid() {
        assert!(get_json_parse_error("{\"key\":\"value\"}").is_none());
    }

    #[test]
    fn parse_error_empty() {
        assert!(get_json_parse_error("").is_some());
    }

    #[test]
    fn parse_error_invalid() {
        assert!(get_json_parse_error("{invalid}").is_some());
    }
}
