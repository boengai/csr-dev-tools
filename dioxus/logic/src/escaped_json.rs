//! Escaped JSON Stringifier, matching src/utils/escaped-json.ts.

/// Validates `input` as JSON, then escapes it as the body of a JSON string
/// (`JSON.stringify(input).slice(1, -1)`). `double` escapes the result again.
pub fn stringify(input: &str, double: bool) -> Result<String, String> {
    if input.trim().is_empty() {
        return Err("Empty input".into());
    }
    serde_json::from_str::<serde_json::Value>(input).map_err(|e| e.to_string())?;
    let once = escape_body(input);
    Ok(if double { escape_body(&once) } else { once })
}

/// Reads `input` as the body of a JSON string, then pretty-prints the JSON it holds
/// with two-space indents (`JSON.stringify(JSON.parse(`"${input}"`), null, 2)`).
pub fn parse(input: &str) -> Result<String, String> {
    if input.trim().is_empty() {
        return Err("Empty input".into());
    }
    let unescaped: String =
        serde_json::from_str(&format!("\"{input}\"")).map_err(|_| "Invalid escaped JSON string".to_string())?;
    let value: serde_json::Value = serde_json::from_str(&unescaped).map_err(|e| e.to_string())?;
    Ok(serde_json::to_string_pretty(&value).expect("a JSON value always serialises"))
}

fn escape_body(s: &str) -> String {
    let quoted = serde_json::to_string(s).expect("a string always serialises");
    quoted[1..quoted.len() - 1].to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn double_escape_escapes_the_escaped_body_again() {
        assert_eq!(stringify("{\"a\":\"x\\ny\"}", true).unwrap(), r#"{\\\"a\\\":\\\"x\\\\ny\\\"}"#);
    }

    #[test]
    fn control_characters_use_short_escapes() {
        assert_eq!(stringify("{\n\t\"k\": \"é\\u0001\"}", false).unwrap(), r#"{\n\t\"k\": \"é\\u0001\"}"#);
    }

    #[test]
    fn invalid_json_is_an_error() {
        assert!(stringify("{name:1}", false).is_err());
        assert_eq!(stringify("   ", false).unwrap_err(), "Empty input");
    }

    #[test]
    fn parse_unescapes_then_pretty_prints_with_two_spaces() {
        assert_eq!(
            parse(r#"{\"name\":\"John\",\"n\":[1,2]}"#).unwrap(),
            "{\n  \"name\": \"John\",\n  \"n\": [\n    1,\n    2\n  ]\n}"
        );
    }

    #[test]
    fn parse_rejects_a_broken_escape() {
        assert_eq!(parse(r#"{\"a\":\q}"#).unwrap_err(), "Invalid escaped JSON string");
    }

    #[test]
    fn stringify_escapes_quotes_like_json_stringify() {
        assert_eq!(stringify(r#"{"name":"John"}"#, false).unwrap(), r#"{\"name\":\"John\"}"#);
    }
}
