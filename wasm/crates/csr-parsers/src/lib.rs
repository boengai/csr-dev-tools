use wasm_bindgen::prelude::*;

mod xml;

// -- XML --

#[wasm_bindgen]
pub fn xml_to_json(input: &str) -> Result<String, JsError> {
    let value = xml::parser::xml_to_json(input).map_err(|e| JsError::new(&e))?;
    serde_json::to_string_pretty(&value).map_err(|e| JsError::new(&e.to_string()))
}

#[wasm_bindgen]
pub fn json_to_xml(input: &str) -> Result<String, JsError> {
    xml::builder::json_to_xml(input).map_err(|e| JsError::new(&e))
}

#[wasm_bindgen]
pub fn get_xml_parse_error(input: &str) -> Option<String> {
    xml::parser::validate_xml(input)
}
