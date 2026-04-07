// wasm/crates/csr-json-tools/src/lib.rs
use wasm_bindgen::prelude::*;

mod deep_sort;
mod format;
mod json_to_ts;

// -- JSON Formatting --

#[wasm_bindgen]
pub fn format_json(input: &str, indent: u32) -> Result<String, JsError> {
    format::format_json(input, indent).map_err(|e| JsError::new(&e))
}

#[wasm_bindgen]
pub fn get_json_parse_error(input: &str) -> Option<String> {
    format::get_json_parse_error(input)
}

// -- JSON to TypeScript --

#[wasm_bindgen]
pub fn json_to_typescript(
    json: &str,
    use_interface: bool,
    optional_properties: bool,
    root_name: &str,
) -> Result<String, JsError> {
    let options = json_to_ts::JsonToTsOptions {
        optional_properties,
        root_name: root_name.to_string(),
        use_interface,
    };
    json_to_ts::json_to_typescript(json, &options).map_err(|e| JsError::new(&e))
}

// -- Deep Sort / Normalize --

#[wasm_bindgen]
pub fn deep_sort_json(input: &str) -> Result<String, JsError> {
    let value: serde_json::Value =
        serde_json::from_str(input).map_err(|e| JsError::new(&e.to_string()))?;
    let sorted = deep_sort::deep_sort_json(&value);
    serde_json::to_string(&sorted).map_err(|e| JsError::new(&e.to_string()))
}

#[wasm_bindgen]
pub fn normalize_json(input: &str) -> Result<String, JsError> {
    deep_sort::normalize_json(input).map_err(|e| JsError::new(&e))
}

#[wasm_bindgen]
pub fn get_json_diff_error(input: &str, label: &str) -> Option<String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return None;
    }
    match serde_json::from_str::<serde_json::Value>(trimmed) {
        Ok(_) => None,
        Err(e) => Some(format!("{} JSON is invalid: {}", label, e)),
    }
}
