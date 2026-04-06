use wasm_bindgen::prelude::*;

mod proto_schema;
mod toml_parser;
mod xml;
mod yaml;

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

// -- TOML --

#[wasm_bindgen]
pub fn toml_to_json(input: &str) -> Result<String, JsError> {
    let value = toml_parser::parser::toml_to_value(input).map_err(|e| JsError::new(&e))?;
    serde_json::to_string_pretty(&value).map_err(|e| JsError::new(&e.to_string()))
}

#[wasm_bindgen]
pub fn json_to_toml(input: &str) -> Result<String, JsError> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err(JsError::new("Empty input"));
    }
    let value: serde_json::Value =
        serde_json::from_str(trimmed).map_err(|e| JsError::new(&e.to_string()))?;
    toml_parser::emitter::value_to_toml(&value).map_err(|e| JsError::new(&e))
}

#[wasm_bindgen]
pub fn get_toml_parse_error(input: &str) -> Option<String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Some("Empty input".into());
    }
    match toml_parser::parser::toml_to_value(input) {
        Ok(_) => None,
        Err(e) => Some(e),
    }
}

// ── YAML ──

#[wasm_bindgen]
pub fn yaml_to_json(input: &str, indent: u32) -> Result<String, JsError> {
    let value = yaml::parser::yaml_to_value(input).map_err(|e| JsError::new(&e))?;
    let indent_str = " ".repeat(indent as usize);
    let formatter = serde_json::ser::PrettyFormatter::with_indent(indent_str.as_bytes());
    let mut buf = Vec::new();
    let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
    serde::Serialize::serialize(&value, &mut ser).map_err(|e| JsError::new(&e.to_string()))?;
    String::from_utf8(buf).map_err(|e| JsError::new(&e.to_string()))
}

#[wasm_bindgen]
pub fn json_to_yaml(input: &str) -> Result<String, JsError> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err(JsError::new("Empty input"));
    }
    let value: serde_json::Value =
        serde_json::from_str(trimmed).map_err(|e| JsError::new(&e.to_string()))?;
    Ok(yaml::emitter::value_to_yaml(
        &value,
        &yaml::emitter::EmitOptions::default(),
    ))
}

#[wasm_bindgen]
pub fn format_yaml(input: &str, indent: u32, sort_keys: bool) -> Result<String, JsError> {
    let value = yaml::parser::yaml_to_value(input).map_err(|e| JsError::new(&e))?;
    Ok(yaml::emitter::value_to_yaml(
        &value,
        &yaml::emitter::EmitOptions {
            indent: indent as usize,
            sort_keys,
        },
    ))
}

#[wasm_bindgen]
pub fn get_yaml_parse_error(input: &str) -> Option<String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Some("Empty input".into());
    }
    match yaml::parser::yaml_to_value(input) {
        Ok(_) => None,
        Err(e) => Some(e),
    }
}

// ── Protobuf Schema ──

#[wasm_bindgen]
pub fn parse_protobuf_schema(input: &str) -> JsValue {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        let result = proto_schema::types::ProtobufParseResult::err(
            "Empty input \u{2014} paste a .proto definition to parse".into(),
            None,
        );
        return serde_wasm_bindgen::to_value(&result).unwrap();
    }

    let mut lexer = proto_schema::lexer::Lexer::new(trimmed);
    let tokens = match lexer.tokenize() {
        Ok(t) => t,
        Err(e) => {
            let line_match = extract_line_number(&e);
            let result = proto_schema::types::ProtobufParseResult::err(e, line_match);
            return serde_wasm_bindgen::to_value(&result).unwrap();
        }
    };

    let mut parser = proto_schema::parser::ProtoParser::new(tokens);
    match parser.parse() {
        Ok(schema) => {
            let result = proto_schema::types::ProtobufParseResult::ok(schema);
            serde_wasm_bindgen::to_value(&result).unwrap()
        }
        Err(e) => {
            let line_match = extract_line_number(&e);
            let result = proto_schema::types::ProtobufParseResult::err(e, line_match);
            serde_wasm_bindgen::to_value(&result).unwrap()
        }
    }
}

#[wasm_bindgen]
pub fn generate_sample_json_from_schema(
    schema_json: &str,
    message_name: &str,
) -> Result<String, JsError> {
    let schema: proto_schema::types::ProtobufSchemaInfo =
        serde_json::from_str(schema_json).map_err(|e| JsError::new(&e.to_string()))?;

    let all_messages = collect_all_flat_messages(&schema.messages);
    let msg = all_messages
        .iter()
        .find(|m| m.name == message_name)
        .ok_or_else(|| JsError::new(&format!("Message '{}' not found", message_name)))?;

    let sample =
        proto_schema::sample::generate_sample_json(msg, &schema.messages, &schema.enums);
    serde_json::to_string_pretty(&sample).map_err(|e| JsError::new(&e.to_string()))
}

fn extract_line_number(error: &str) -> Option<u32> {
    // Extract "line N" from error message
    let re_like = error.find("line ");
    if let Some(pos) = re_like {
        let after = &error[pos + 5..];
        let num_str: String = after.chars().take_while(|c| c.is_ascii_digit()).collect();
        num_str.parse().ok()
    } else {
        None
    }
}

fn collect_all_flat_messages(
    messages: &[proto_schema::types::ProtobufMessageInfo],
) -> Vec<&proto_schema::types::ProtobufMessageInfo> {
    let mut result = Vec::new();
    for msg in messages {
        result.push(msg);
        result.extend(collect_all_flat_messages(&msg.nested_messages));
    }
    result
}
