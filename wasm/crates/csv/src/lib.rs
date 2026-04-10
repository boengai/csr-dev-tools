use wasm_bindgen::prelude::*;

mod parser;
mod writer;

#[wasm_bindgen]
pub fn json_to_csv(input: &str) -> Result<String, JsError> {
    writer::json_to_csv(input).map_err(|e| JsError::new(&e))
}

#[wasm_bindgen]
pub fn csv_to_json(input: &str, indent: u32) -> Result<String, JsError> {
    writer::csv_to_json(input, indent).map_err(|e| JsError::new(&e))
}

#[wasm_bindgen]
pub fn get_csv_parse_error(input: &str) -> Option<String> {
    parser::validate_csv(input)
}

#[cfg(test)]
mod tests {
    use crate::parser::validate_csv;
    use crate::writer::{csv_to_json, json_to_csv};

    // ── json_to_csv tests ──

    #[test]
    fn json_to_csv_simple() {
        let result = json_to_csv(r#"[{"name":"Alice","age":30},{"name":"Bob","age":25}]"#).unwrap();
        assert_eq!(result, "age,name\n30,Alice\n25,Bob");
    }

    #[test]
    fn json_to_csv_nested() {
        let result = json_to_csv(r#"[{"user":{"name":"Alice","city":"NYC"}}]"#).unwrap();
        assert!(result.contains("user.city,user.name"));
        assert!(result.contains("NYC,Alice"));
    }

    #[test]
    fn json_to_csv_commas_in_values() {
        let result = json_to_csv(r#"[{"name":"Smith, Jr.","age":40}]"#).unwrap();
        assert!(result.contains("\"Smith, Jr.\""));
    }

    #[test]
    fn json_to_csv_escape_double_quotes() {
        let result = json_to_csv(r#"[{"quote":"He said \"hello\""}]"#).unwrap();
        assert!(result.contains("\"He said \"\"hello\"\"\""));
    }

    #[test]
    fn json_to_csv_newlines_in_values() {
        let result = json_to_csv("[{\"text\":\"line1\\nline2\"}]").unwrap();
        assert!(result.contains("\"line1\nline2\""));
    }

    #[test]
    fn json_to_csv_unicode() {
        let result = json_to_csv(r#"[{"emoji":"🎉","cjk":"日本語"}]"#).unwrap();
        assert!(result.contains("🎉"));
        assert!(result.contains("日本語"));
    }

    #[test]
    fn json_to_csv_empty_array() {
        let err = json_to_csv("[]").unwrap_err();
        assert_eq!(
            err,
            "JSON array must contain at least one object (e.g., [{\"name\": \"Alice\"}])"
        );
    }

    #[test]
    fn json_to_csv_single_item() {
        let result = json_to_csv(r#"[{"a":1}]"#).unwrap();
        assert_eq!(result, "a\n1");
    }

    #[test]
    fn json_to_csv_different_keys() {
        let result = json_to_csv(r#"[{"a":1,"b":2},{"b":3,"c":4}]"#).unwrap();
        assert_eq!(result, "a,b,c\n1,2,\n,3,4");
    }

    #[test]
    fn json_to_csv_empty_input() {
        let err = json_to_csv("").unwrap_err();
        assert_eq!(err, "Empty input");
    }

    #[test]
    fn json_to_csv_whitespace_input() {
        let err = json_to_csv("   ").unwrap_err();
        assert_eq!(err, "Empty input");
    }

    #[test]
    fn json_to_csv_non_array_object() {
        let err = json_to_csv(r#"{"a":1}"#).unwrap_err();
        assert_eq!(
            err,
            "JSON must be an array of objects (e.g., [{\"name\": \"Alice\"}])"
        );
    }

    #[test]
    fn json_to_csv_non_array_string() {
        let err = json_to_csv(r#""hello""#).unwrap_err();
        assert_eq!(
            err,
            "JSON must be an array of objects (e.g., [{\"name\": \"Alice\"}])"
        );
    }

    #[test]
    fn json_to_csv_array_of_non_objects() {
        let err = json_to_csv("[1,2,3]").unwrap_err();
        assert_eq!(
            err,
            "All array items must be objects (e.g., [{\"name\": \"Alice\"}])"
        );
    }

    #[test]
    fn json_to_csv_deeply_nested() {
        let result = json_to_csv(r#"[{"a":{"b":{"c":"deep"}}}]"#).unwrap();
        assert_eq!(result, "a.b.c\ndeep");
    }

    #[test]
    fn json_to_csv_mid_field_quotes() {
        let result = json_to_csv(r#"[{"note":"foo\"bar"}]"#).unwrap();
        assert!(result.contains("\"foo\"\"bar\""));
    }

    #[test]
    fn json_to_csv_invalid_json() {
        assert!(json_to_csv("{invalid}").is_err());
    }

    #[test]
    fn json_to_csv_array_values() {
        let result = json_to_csv(r#"[{"tags":["dev","tools"]}]"#).unwrap();
        assert!(result.contains("tags"));
        // Array is JSON-stringified then CSV-escaped (quotes doubled, wrapped in quotes)
        assert_eq!(result, "tags\n\"[\"\"dev\"\",\"\"tools\"\"]\"");
    }

    #[test]
    fn json_to_csv_null_and_boolean() {
        let result = json_to_csv(r#"[{"active":true,"deleted":false,"note":null}]"#).unwrap();
        assert!(result.contains("true"));
        assert!(result.contains("false"));
        assert!(result.contains("null"));
    }

    #[test]
    fn json_to_csv_large_dataset() {
        let arr: Vec<String> = (0..100)
            .map(|i| format!(r#"{{"id":{},"name":"user{}"}}"#, i, i))
            .collect();
        let input = format!("[{}]", arr.join(","));
        let result = json_to_csv(&input).unwrap();
        let lines: Vec<&str> = result.split('\n').collect();
        assert_eq!(lines.len(), 101); // 1 header + 100 rows
    }

    // ── csv_to_json tests ──

    #[test]
    fn csv_to_json_simple() {
        let result = csv_to_json("name,age\nAlice,30\nBob,25", 2).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        let arr = parsed.as_array().unwrap();
        assert_eq!(arr.len(), 2);
        assert_eq!(arr[0]["name"], "Alice");
        assert_eq!(arr[0]["age"], "30");
    }

    #[test]
    fn csv_to_json_quoted_commas() {
        let result = csv_to_json("name,title\nAlice,\"CTO, Inc\"", 2).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed[0]["title"], "CTO, Inc");
    }

    #[test]
    fn csv_to_json_quoted_newlines() {
        let result = csv_to_json("name,bio\nAlice,\"line1\nline2\"", 2).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed[0]["bio"], "line1\nline2");
    }

    #[test]
    fn csv_to_json_escaped_quotes() {
        let result = csv_to_json("name,quote\nAlice,\"He said \"\"hello\"\"\"", 2).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed[0]["quote"], "He said \"hello\"");
    }

    #[test]
    fn csv_to_json_crlf() {
        let result = csv_to_json("name,age\r\nAlice,30\r\nBob,25", 2).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed.as_array().unwrap().len(), 2);
    }

    #[test]
    fn csv_to_json_trailing_newline() {
        let result = csv_to_json("name\nAlice\n", 2).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed.as_array().unwrap().len(), 1);
    }

    #[test]
    fn csv_to_json_empty_fields() {
        let result = csv_to_json("a,b,c\n1,,3", 2).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed[0]["a"], "1");
        assert_eq!(parsed[0]["b"], "");
        assert_eq!(parsed[0]["c"], "3");
    }

    #[test]
    fn csv_to_json_header_only() {
        let result = csv_to_json("name,age", 2).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed.as_array().unwrap().len(), 0);
    }

    #[test]
    fn csv_to_json_empty_input() {
        let err = csv_to_json("", 2).unwrap_err();
        assert_eq!(err, "Empty input");
    }

    #[test]
    fn csv_to_json_whitespace_input() {
        let err = csv_to_json("   ", 2).unwrap_err();
        assert_eq!(err, "Empty input");
    }

    #[test]
    fn csv_to_json_custom_indent() {
        let result = csv_to_json("a\n1", 4).unwrap();
        assert!(result.contains("    \"a\""));
    }

    #[test]
    fn csv_to_json_mid_field_quotes() {
        let result = csv_to_json("name\nfoo\"bar", 2).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed[0]["name"], "foo\"bar");
    }

    #[test]
    fn csv_to_json_preserves_header_order() {
        let result = csv_to_json("name,age\nAlice,30", 2).unwrap();
        // Keys should appear in header order: name, age (not alphabetical: age, name)
        let name_pos = result.find("\"name\"").unwrap();
        let age_pos = result.find("\"age\"").unwrap();
        assert!(name_pos < age_pos, "name should appear before age in output");
    }

    // ── validate_csv tests ──

    #[test]
    fn validate_csv_valid() {
        assert!(validate_csv("name,age\nAlice,30").is_none());
    }

    #[test]
    fn validate_csv_empty() {
        assert_eq!(validate_csv("").unwrap(), "Empty input");
    }

    #[test]
    fn validate_csv_whitespace() {
        assert_eq!(validate_csv("   ").unwrap(), "Empty input");
    }

    #[test]
    fn validate_csv_unterminated() {
        assert_eq!(
            validate_csv("name\n\"Alice").unwrap(),
            "Unterminated quoted field"
        );
    }

    #[test]
    fn validate_csv_mid_field_quotes() {
        assert!(validate_csv("name\nfoo\"bar").is_none());
    }

    // ── round-trip tests ──

    #[test]
    fn round_trip_json_csv_json() {
        let original = r#"[{"name":"Alice","age":"30"},{"name":"Bob","age":"25"}]"#;
        let csv = json_to_csv(original).unwrap();
        let round_tripped = csv_to_json(&csv, 2).unwrap();
        let orig_val: serde_json::Value = serde_json::from_str(original).unwrap();
        let rt_val: serde_json::Value = serde_json::from_str(&round_tripped).unwrap();
        assert_eq!(orig_val, rt_val);
    }

    #[test]
    fn round_trip_csv_json_csv() {
        let original = "age,name\n30,Alice\n25,Bob";
        let json = csv_to_json(original, 2).unwrap();
        let round_tripped = json_to_csv(&json).unwrap();
        assert_eq!(round_tripped, original);
    }
}
