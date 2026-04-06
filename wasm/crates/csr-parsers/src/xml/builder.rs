use serde_json::Value;

pub fn json_to_xml(input: &str) -> Result<String, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Empty input".into());
    }

    let value: Value = serde_json::from_str(trimmed)
        .map_err(|e| e.to_string())?;

    let mut output = String::new();
    build_value(&value, &mut output, 0, None);
    Ok(output)
}

fn build_value(value: &Value, out: &mut String, depth: usize, tag: Option<&str>) {
    match value {
        Value::Object(map) => {
            if let Some(tag_name) = tag {
                // Collect attributes and children
                let mut attrs = Vec::new();
                let mut children = Vec::new();
                let mut text = None;

                for (k, v) in map {
                    if k.starts_with("@_") {
                        attrs.push((&k[2..], v));
                    } else if k == "#text" {
                        text = Some(v);
                    } else {
                        children.push((k.as_str(), v));
                    }
                }

                let indent = "  ".repeat(depth);
                out.push_str(&indent);
                out.push('<');
                out.push_str(tag_name);
                for (name, val) in &attrs {
                    out.push(' ');
                    out.push_str(name);
                    out.push_str("=\"");
                    out.push_str(&value_to_attr_string(val));
                    out.push('"');
                }

                if children.is_empty() && text.is_none() {
                    out.push_str("/>\n");
                    return;
                }

                out.push('>');

                if !children.is_empty() {
                    out.push('\n');
                    for (child_name, child_val) in &children {
                        build_value(child_val, out, depth + 1, Some(child_name));
                    }
                    if let Some(t) = text {
                        let indent_inner = "  ".repeat(depth + 1);
                        out.push_str(&indent_inner);
                        out.push_str(&value_to_text(t));
                        out.push('\n');
                    }
                    out.push_str(&indent);
                } else if let Some(t) = text {
                    out.push_str(&value_to_text(t));
                }

                out.push_str("</");
                out.push_str(tag_name);
                out.push_str(">\n");
            } else {
                // Top-level object: iterate keys as root elements
                for (k, v) in map {
                    build_value(v, out, depth, Some(k));
                }
            }
        }
        Value::Array(arr) => {
            if let Some(tag_name) = tag {
                for item in arr {
                    build_value(item, out, depth, Some(tag_name));
                }
            }
        }
        _ => {
            if let Some(tag_name) = tag {
                let indent = "  ".repeat(depth);
                out.push_str(&indent);
                out.push('<');
                out.push_str(tag_name);
                out.push('>');
                out.push_str(&encode_xml_entities(&value_to_text(value)));
                out.push_str("</");
                out.push_str(tag_name);
                out.push_str(">\n");
            }
        }
    }
}

fn value_to_text(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        Value::Bool(b) => b.to_string(),
        Value::Null => "".into(),
        _ => serde_json::to_string(v).unwrap_or_default(),
    }
}

fn value_to_attr_string(v: &Value) -> String {
    match v {
        Value::String(s) => encode_xml_entities(s),
        Value::Number(n) => n.to_string(),
        Value::Bool(b) => b.to_string(),
        _ => encode_xml_entities(&serde_json::to_string(v).unwrap_or_default()),
    }
}

fn encode_xml_entities(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn simple_json_to_xml() {
        let result = json_to_xml(r#"{"root":{"name":"John","age":30}}"#).unwrap();
        assert!(result.contains("<name>John</name>"));
        assert!(result.contains("<age>30</age>"));
    }

    #[test]
    fn empty_input() {
        assert_eq!(json_to_xml("").unwrap_err(), "Empty input");
    }

    #[test]
    fn invalid_json() {
        assert!(json_to_xml("{invalid}").is_err());
    }
}
