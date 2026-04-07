use serde_json::Value;

pub fn value_to_toml(value: &Value) -> Result<String, String> {
    match value {
        Value::Object(map) => {
            let mut output = String::new();
            let mut tables = Vec::new();

            // First pass: emit top-level simple key-values
            for (k, v) in map {
                match v {
                    Value::Object(_) => tables.push((k.clone(), v)),
                    Value::Array(arr) if arr.iter().all(|item| item.is_object()) => {
                        tables.push((k.clone(), v));
                    }
                    _ => {
                        output.push_str(&format!("{} = {}\n", toml_key(k), emit_value(v)));
                    }
                }
            }

            // Second pass: emit tables
            for (key, val) in tables {
                match val {
                    Value::Object(inner_map) => {
                        if !output.is_empty() {
                            output.push('\n');
                        }
                        output.push_str(&format!("[{}]\n", key));
                        emit_table(inner_map, &mut output, &key)?;
                    }
                    Value::Array(arr) => {
                        for item in arr {
                            if !output.is_empty() {
                                output.push('\n');
                            }
                            output.push_str(&format!("[[{}]]\n", key));
                            if let Value::Object(inner) = item {
                                emit_table(inner, &mut output, &key)?;
                            }
                        }
                    }
                    _ => {}
                }
            }

            Ok(output)
        }
        _ => Err("TOML root must be an object".into()),
    }
}

fn emit_table(
    map: &serde_json::Map<String, Value>,
    output: &mut String,
    _prefix: &str,
) -> Result<(), String> {
    for (k, v) in map {
        match v {
            Value::Object(_) | Value::Array(_) if v.is_object() => {
                // Nested table -- emit as inline table for simplicity
                output.push_str(&format!("{} = {}\n", toml_key(k), emit_value(v)));
            }
            _ => {
                output.push_str(&format!("{} = {}\n", toml_key(k), emit_value(v)));
            }
        }
    }
    Ok(())
}

fn emit_value(value: &Value) -> String {
    match value {
        Value::String(s) => format!("\"{}\"", escape_toml_string(s)),
        Value::Number(n) => n.to_string(),
        Value::Bool(b) => b.to_string(),
        Value::Null => "\"\"".to_string(),
        Value::Array(arr) => {
            let items: Vec<String> = arr.iter().map(emit_value).collect();
            format!("[{}]", items.join(", "))
        }
        Value::Object(map) => {
            let entries: Vec<String> = map
                .iter()
                .map(|(k, v)| format!("{} = {}", toml_key(k), emit_value(v)))
                .collect();
            format!("{{{}}}", entries.join(", "))
        }
    }
}

fn escape_toml_string(s: &str) -> String {
    s.replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "\\n")
        .replace('\t', "\\t")
        .replace('\r', "\\r")
}

fn toml_key(key: &str) -> String {
    if key
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        key.to_string()
    } else {
        format!("\"{}\"", escape_toml_string(key))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn simple_object() {
        let val = json!({"name": "John", "age": 30});
        let result = value_to_toml(&val).unwrap();
        assert!(result.contains("name = \"John\""));
        assert!(result.contains("age = 30"));
    }

    #[test]
    fn table_section() {
        let val = json!({"server": {"host": "localhost", "port": 8080}});
        let result = value_to_toml(&val).unwrap();
        assert!(result.contains("[server]"));
        assert!(result.contains("host = \"localhost\""));
    }
}
