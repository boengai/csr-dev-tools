use std::collections::BTreeSet;
use serde_json::Value;

/// Flatten a JSON object using dot-notation for nested keys.
/// Keys are sorted at each level. Arrays are JSON-stringified.
/// Null becomes "null". Non-object/non-array values use their string representation.
fn flatten_object(obj: &serde_json::Map<String, Value>, prefix: &str) -> Vec<(String, String)> {
    let mut result = Vec::new();
    let mut keys: Vec<&String> = obj.keys().collect();
    keys.sort();

    for key in keys {
        let full_key = if prefix.is_empty() {
            key.clone()
        } else {
            format!("{}.{}", prefix, key)
        };
        let value = &obj[key];
        match value {
            Value::Object(nested) => {
                result.extend(flatten_object(nested, &full_key));
            }
            Value::Array(_) => {
                result.push((full_key, serde_json::to_string(value).unwrap()));
            }
            Value::Null => {
                result.push((full_key, "null".to_string()));
            }
            Value::Bool(b) => {
                result.push((full_key, b.to_string()));
            }
            Value::Number(n) => {
                result.push((full_key, n.to_string()));
            }
            Value::String(s) => {
                result.push((full_key, s.clone()));
            }
        }
    }
    result
}

/// Escape a CSV field per RFC 4180.
/// Quote if field contains comma, double-quote, newline, or carriage return.
/// Double-quotes within the field are escaped by doubling them.
pub fn escape_csv_field(value: &str) -> String {
    if value.contains(',') || value.contains('"') || value.contains('\n') || value.contains('\r') {
        let escaped = value.replace('"', "\"\"");
        format!("\"{}\"", escaped)
    } else {
        value.to_string()
    }
}

/// Convert a JSON string (array of objects) to CSV.
pub fn json_to_csv(input: &str) -> Result<String, String> {
    if input.trim().is_empty() {
        return Err("Empty input".to_string());
    }

    let parsed: Value = serde_json::from_str(input)
        .map_err(|e| e.to_string())?;

    let arr = match parsed {
        Value::Array(a) => a,
        _ => return Err("JSON must be an array of objects (e.g., [{\"name\": \"Alice\"}])".to_string()),
    };

    if arr.is_empty() {
        return Err("JSON array must contain at least one object (e.g., [{\"name\": \"Alice\"}])".to_string());
    }

    // Validate all items are objects
    for item in &arr {
        if !item.is_object() {
            return Err("All array items must be objects (e.g., [{\"name\": \"Alice\"}])".to_string());
        }
    }

    // Flatten all objects and collect all keys
    let mut all_keys = BTreeSet::new();
    let mut flat_rows: Vec<Vec<(String, String)>> = Vec::new();

    for item in &arr {
        let obj = item.as_object().unwrap();
        let flat = flatten_object(obj, "");
        for (key, _) in &flat {
            all_keys.insert(key.clone());
        }
        flat_rows.push(flat);
    }

    // BTreeSet is already sorted
    let headers: Vec<String> = all_keys.into_iter().collect();
    let header_row = headers.iter().map(|h| escape_csv_field(h)).collect::<Vec<_>>().join(",");

    let mut lines = vec![header_row];
    for flat in &flat_rows {
        let flat_map: std::collections::HashMap<&str, &str> =
            flat.iter().map(|(k, v)| (k.as_str(), v.as_str())).collect();
        let row = headers
            .iter()
            .map(|h| escape_csv_field(flat_map.get(h.as_str()).copied().unwrap_or("")))
            .collect::<Vec<_>>()
            .join(",");
        lines.push(row);
    }

    Ok(lines.join("\n"))
}

/// Convert CSV text to a JSON string (array of objects).
/// Keys are in header order (insertion order), not sorted.
pub fn csv_to_json(input: &str, indent: u32) -> Result<String, String> {
    if input.trim().is_empty() {
        return Err("Empty input".to_string());
    }

    let rows = crate::parser::parse_csv_rows(input);
    if rows.is_empty() {
        return Err("Empty input".to_string());
    }

    let headers = &rows[0];
    let data_rows = &rows[1..];

    let mut objects: Vec<Value> = Vec::new();
    for row in data_rows {
        let mut map = serde_json::Map::new();
        for (i, header) in headers.iter().enumerate() {
            let value = row.get(i).map(|s| s.as_str()).unwrap_or("");
            map.insert(header.clone(), Value::String(value.to_string()));
        }
        objects.push(Value::Object(map));
    }

    let value = Value::Array(objects);

    // Custom formatting with specified indent
    let indent_str = " ".repeat(indent as usize);
    let mut buf = Vec::new();
    let mut serializer = serde_json::Serializer::with_formatter(
        &mut buf,
        serde_json::ser::PrettyFormatter::with_indent(indent_str.as_bytes()),
    );
    use serde::Serialize;
    value.serialize(&mut serializer).map_err(|e| e.to_string())?;

    String::from_utf8(buf).map_err(|e| e.to_string())
}
