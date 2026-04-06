// wasm/crates/csr-json-tools/src/deep_sort.rs
use serde_json::Value;

pub fn deep_sort_json(value: &Value) -> Value {
    match value {
        Value::Object(map) => {
            let mut sorted: serde_json::Map<String, Value> = serde_json::Map::new();
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            for key in keys {
                sorted.insert(key.clone(), deep_sort_json(&map[key]));
            }
            Value::Object(sorted)
        }
        Value::Array(arr) => {
            let mut sorted: Vec<Value> = arr.iter().map(deep_sort_json).collect();
            sorted.sort_by(|a, b| {
                let a_str = serde_json::to_string(a).unwrap_or_default();
                let b_str = serde_json::to_string(b).unwrap_or_default();
                a_str.cmp(&b_str)
            });
            Value::Array(sorted)
        }
        _ => value.clone(),
    }
}

pub fn normalize_json(input: &str) -> Result<String, String> {
    let parsed: Value = serde_json::from_str(input).map_err(|e| e.to_string())?;
    let sorted = deep_sort_json(&parsed);
    serde_json::to_string_pretty(&sorted).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn sort_object_keys() {
        let val = json!({"z": 1, "a": 2, "m": 3});
        let sorted = deep_sort_json(&val);
        let keys: Vec<&String> = sorted.as_object().unwrap().keys().collect();
        assert_eq!(keys, vec!["a", "m", "z"]);
    }

    #[test]
    fn sort_array() {
        let sorted = deep_sort_json(&json!([3, 1, 2]));
        assert_eq!(sorted, json!([1, 2, 3]));
    }

    #[test]
    fn normalize_different_key_order() {
        let a = normalize_json("{\"z\":1,\"a\":2}").unwrap();
        let b = normalize_json("{\"a\":2,\"z\":1}").unwrap();
        assert_eq!(a, b);
    }

    #[test]
    fn primitives_pass_through() {
        assert_eq!(deep_sort_json(&json!(null)), json!(null));
        assert_eq!(deep_sort_json(&json!(42)), json!(42));
        assert_eq!(deep_sort_json(&json!("hello")), json!("hello"));
    }
}
