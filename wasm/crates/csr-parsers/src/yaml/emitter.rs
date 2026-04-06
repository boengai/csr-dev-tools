use serde_json::Value;

pub struct EmitOptions {
    pub indent: usize,
    pub sort_keys: bool,
}

impl Default for EmitOptions {
    fn default() -> Self {
        Self {
            indent: 2,
            sort_keys: false,
        }
    }
}

pub fn value_to_yaml(value: &Value, options: &EmitOptions) -> String {
    let mut output = String::new();
    emit_value(value, &mut output, 0, options, true);
    output
}

fn emit_value(value: &Value, out: &mut String, depth: usize, opts: &EmitOptions, top_level: bool) {
    match value {
        Value::Object(map) => {
            let keys: Vec<&String> = if opts.sort_keys {
                let mut ks: Vec<&String> = map.keys().collect();
                ks.sort();
                ks
            } else {
                map.keys().collect()
            };

            if !top_level {
                out.push('\n');
            }
            let indent_str = " ".repeat(depth * opts.indent);
            for key in keys {
                let val = &map[key];
                out.push_str(&indent_str);
                out.push_str(&yaml_escape_key(key));
                out.push(':');
                match val {
                    Value::Object(_) | Value::Array(_) => {
                        emit_value(val, out, depth + 1, opts, false);
                    }
                    _ => {
                        out.push(' ');
                        emit_scalar(val, out);
                        out.push('\n');
                    }
                }
            }
        }
        Value::Array(arr) => {
            if !top_level {
                out.push('\n');
            }
            let indent_str = " ".repeat(depth * opts.indent);
            for item in arr {
                out.push_str(&indent_str);
                out.push_str("- ");
                match item {
                    Value::Object(_) => {
                        // Inline the first key, indent rest
                        emit_inline_map(item, out, depth, opts);
                    }
                    Value::Array(_) => {
                        emit_value(item, out, depth + 1, opts, false);
                    }
                    _ => {
                        emit_scalar(item, out);
                        out.push('\n');
                    }
                }
            }
        }
        _ => {
            if top_level {
                emit_scalar(value, out);
                out.push('\n');
            }
        }
    }
}

fn emit_inline_map(value: &Value, out: &mut String, depth: usize, opts: &EmitOptions) {
    if let Value::Object(map) = value {
        let keys: Vec<&String> = if opts.sort_keys {
            let mut ks: Vec<&String> = map.keys().collect();
            ks.sort();
            ks
        } else {
            map.keys().collect()
        };

        let indent_str = " ".repeat((depth + 1) * opts.indent);
        for (i, key) in keys.iter().enumerate() {
            if i > 0 {
                out.push_str(&indent_str);
            }
            out.push_str(&yaml_escape_key(key));
            out.push(':');
            let val = &map[*key];
            match val {
                Value::Object(_) | Value::Array(_) => {
                    emit_value(val, out, depth + 2, opts, false);
                }
                _ => {
                    out.push(' ');
                    emit_scalar(val, out);
                    out.push('\n');
                }
            }
        }
    }
}

fn emit_scalar(value: &Value, out: &mut String) {
    match value {
        Value::Null => out.push_str("null"),
        Value::Bool(b) => out.push_str(if *b { "true" } else { "false" }),
        Value::Number(n) => out.push_str(&n.to_string()),
        Value::String(s) => {
            if needs_quoting(s) {
                out.push('"');
                out.push_str(&s.replace('\\', "\\\\").replace('"', "\\\"").replace('\n', "\\n"));
                out.push('"');
            } else {
                out.push_str(s);
            }
        }
        _ => out.push_str(&serde_json::to_string(value).unwrap_or_default()),
    }
}

fn needs_quoting(s: &str) -> bool {
    if s.is_empty() {
        return true;
    }
    if s.contains('\n') || s.contains(':') || s.contains('#') {
        return true;
    }
    // Quote if it looks like a boolean, null, or number
    matches!(
        s,
        "true" | "false" | "True" | "False" | "TRUE" | "FALSE" | "null" | "Null" | "NULL" | "~"
    ) || s.parse::<f64>().is_ok()
}

fn yaml_escape_key(key: &str) -> String {
    if key.contains(':')
        || key.contains('#')
        || key.contains('{')
        || key.contains('}')
        || key.contains('[')
        || key.contains(']')
        || key.contains(',')
        || key.contains('&')
        || key.contains('*')
        || key.contains('?')
        || key.contains('|')
        || key.contains('-')
        || key.contains('<')
        || key.contains('>')
        || key.contains('!')
        || key.contains('%')
        || key.contains('@')
        || key.is_empty()
    {
        format!("\"{}\"", key.replace('"', "\\\""))
    } else {
        key.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn simple_map() {
        let val = json!({"name": "John", "age": 30});
        let result = value_to_yaml(&val, &EmitOptions::default());
        assert!(result.contains("name: John"));
        assert!(result.contains("age: 30"));
    }

    #[test]
    fn sorted_keys() {
        let val = json!({"z": 1, "a": 2, "m": 3});
        let result = value_to_yaml(&val, &EmitOptions { indent: 2, sort_keys: true });
        let lines: Vec<&str> = result.trim().split('\n').collect();
        assert_eq!(lines[0], "a: 2");
        assert_eq!(lines[1], "m: 3");
        assert_eq!(lines[2], "z: 1");
    }

    #[test]
    fn nested_object() {
        let val = json!({"a": {"b": {"c": 1}}});
        let result = value_to_yaml(&val, &EmitOptions::default());
        assert!(result.contains("a:"));
        assert!(result.contains("  b:"));
        assert!(result.contains("    c: 1"));
    }

    #[test]
    fn array() {
        let val = json!({"items": [1, 2, 3]});
        let result = value_to_yaml(&val, &EmitOptions::default());
        assert!(result.contains("items:"));
        assert!(result.contains("  - 1"));
    }

    #[test]
    fn unicode() {
        let val = json!({"emoji": "🎉", "cjk": "日本語"});
        let result = value_to_yaml(&val, &EmitOptions::default());
        assert!(result.contains("🎉"));
        assert!(result.contains("日本語"));
    }
}
