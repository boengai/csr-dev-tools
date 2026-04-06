// wasm/crates/csr-json-tools/src/json_to_ts.rs
use serde_json::Value;
use std::collections::HashSet;

pub struct JsonToTsOptions {
    pub optional_properties: bool,
    pub root_name: String,
    pub use_interface: bool,
}

impl Default for JsonToTsOptions {
    fn default() -> Self {
        Self {
            optional_properties: false,
            root_name: "Root".into(),
            use_interface: true,
        }
    }
}

struct Collector {
    types: Vec<(String, String)>, // (name, body)
    built: HashSet<String>,
}

impl Collector {
    fn new() -> Self {
        Self {
            types: Vec::new(),
            built: HashSet::new(),
        }
    }
}

pub fn json_to_typescript(json: &str, options: &JsonToTsOptions) -> Result<String, String> {
    let parsed: Value = serde_json::from_str(json).map_err(|e| e.to_string())?;
    let mut collector = Collector::new();

    if !parsed.is_object() {
        let t = infer_type(&parsed, &options.root_name, &mut collector);
        return Ok(if options.use_interface {
            format!("interface {} {{\n  value: {}\n}}", options.root_name, t)
        } else {
            format!("type {} = {{\n  value: {}\n}}", options.root_name, t)
        });
    }

    build_object_type(
        parsed.as_object().unwrap(),
        &options.root_name,
        &mut collector,
    );

    let output: Vec<String> = collector
        .types
        .iter()
        .rev()
        .map(|(name, body)| {
            if body == "Record<string, unknown>" {
                if options.use_interface {
                    format!("interface {} extends Record<string, unknown> {{}}", name)
                } else {
                    format!("type {} = Record<string, unknown>", name)
                }
            } else {
                let formatted = if options.optional_properties {
                    body.lines()
                        .map(|line| {
                            // Replace "  key: type" with "  key?: type"
                            if line.starts_with("  ") && line.contains(": ") {
                                line.replacen(": ", "?: ", 1)
                            } else {
                                line.to_string()
                            }
                        })
                        .collect::<Vec<_>>()
                        .join("\n")
                } else {
                    body.clone()
                };
                if options.use_interface {
                    format!("interface {} {{\n{}\n}}", name, formatted)
                } else {
                    format!("type {} = {{\n{}\n}}", name, formatted)
                }
            }
        })
        .collect();

    Ok(output.join("\n\n"))
}

fn infer_type(value: &Value, key: &str, collector: &mut Collector) -> String {
    match value {
        Value::Null => "null".into(),
        Value::Bool(_) => "boolean".into(),
        Value::Number(_) => "number".into(),
        Value::String(_) => "string".into(),
        Value::Array(arr) => infer_array_type(arr, key, collector),
        Value::Object(map) => {
            let type_name = to_pascal_case(key);
            build_object_type(map, &type_name, collector);
            type_name
        }
    }
}

fn infer_array_type(arr: &[Value], key: &str, collector: &mut Collector) -> String {
    if arr.is_empty() {
        return "Array<unknown>".into();
    }

    let singular = if key.ends_with('s') && key.len() > 1 {
        &key[..key.len() - 1]
    } else {
        key
    };

    let mut types = Vec::new();
    let mut seen = HashSet::new();
    for item in arr {
        let t = infer_type(item, singular, collector);
        if seen.insert(t.clone()) {
            types.push(t);
        }
    }

    let inner = if types.len() == 1 {
        types[0].clone()
    } else {
        types.join(" | ")
    };

    format!("Array<{}>", inner)
}

fn build_object_type(
    obj: &serde_json::Map<String, Value>,
    name: &str,
    collector: &mut Collector,
) {
    if collector.built.contains(name) {
        return;
    }
    collector.built.insert(name.to_string());

    if obj.is_empty() {
        collector
            .types
            .push((name.to_string(), "Record<string, unknown>".to_string()));
        return;
    }

    let mut lines = Vec::new();
    for (k, v) in obj {
        let ts_type = infer_type(v, k, collector);
        lines.push(format!("  {}: {}", k, ts_type));
    }

    collector.types.push((name.to_string(), lines.join("\n")));
}

fn to_pascal_case(s: &str) -> String {
    let mut result = String::new();
    let mut capitalize_next = true;

    for ch in s.chars() {
        if !ch.is_ascii_alphanumeric() {
            capitalize_next = true;
        } else if capitalize_next {
            result.extend(ch.to_uppercase());
            capitalize_next = false;
        } else {
            result.push(ch);
        }
    }

    if result.starts_with(|c: char| c.is_ascii_digit()) {
        result.insert(0, '_');
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn basic_object() {
        let result = json_to_typescript(
            "{\"name\":\"John\",\"age\":30,\"active\":true}",
            &JsonToTsOptions::default(),
        )
        .unwrap();
        assert!(result.contains("interface Root"));
        assert!(result.contains("name: string"));
        assert!(result.contains("age: number"));
        assert!(result.contains("active: boolean"));
    }

    #[test]
    fn nested_objects() {
        let result = json_to_typescript(
            "{\"user\":{\"name\":\"John\",\"address\":{\"city\":\"NYC\"}}}",
            &JsonToTsOptions::default(),
        )
        .unwrap();
        assert!(result.contains("interface Root"));
        assert!(result.contains("interface User"));
        assert!(result.contains("interface Address"));
    }

    #[test]
    fn use_type_alias() {
        let result = json_to_typescript(
            "{\"name\":\"John\"}",
            &JsonToTsOptions {
                use_interface: false,
                ..Default::default()
            },
        )
        .unwrap();
        assert!(result.contains("type Root = {"));
        assert!(!result.contains("interface"));
    }

    #[test]
    fn optional_properties() {
        let result = json_to_typescript(
            "{\"name\":\"John\",\"age\":30}",
            &JsonToTsOptions {
                optional_properties: true,
                ..Default::default()
            },
        )
        .unwrap();
        assert!(result.contains("name?: string"));
        assert!(result.contains("age?: number"));
    }

    #[test]
    fn custom_root_name() {
        let result = json_to_typescript(
            "{\"id\":1}",
            &JsonToTsOptions {
                root_name: "ApiResponse".into(),
                ..Default::default()
            },
        )
        .unwrap();
        assert!(result.contains("interface ApiResponse"));
    }

    #[test]
    fn empty_object() {
        let result = json_to_typescript("{\"meta\":{}}", &JsonToTsOptions::default()).unwrap();
        assert!(result.contains("Record<string, unknown>"));
    }

    #[test]
    fn empty_array() {
        let result = json_to_typescript("{\"items\":[]}", &JsonToTsOptions::default()).unwrap();
        assert!(result.contains("Array<unknown>"));
    }

    #[test]
    fn null_value() {
        let result = json_to_typescript("{\"value\":null}", &JsonToTsOptions::default()).unwrap();
        assert!(result.contains("value: null"));
    }
}
