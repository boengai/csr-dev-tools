use wasm_bindgen::prelude::*;

mod proto_codec;
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
pub fn parse_protobuf_schema(input: &str) -> Result<String, JsError> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        let result = proto_schema::types::ProtobufParseResult::err(
            "Empty input \u{2014} paste a .proto definition to parse".into(),
            None,
        );
        return serde_json::to_string(&result).map_err(|e| JsError::new(&e.to_string()));
    }

    let mut lexer = proto_schema::lexer::Lexer::new(trimmed);
    let tokens = match lexer.tokenize() {
        Ok(t) => t,
        Err(e) => {
            let line_match = extract_line_number(&e);
            let result = proto_schema::types::ProtobufParseResult::err(e, line_match);
            return serde_json::to_string(&result).map_err(|e| JsError::new(&e.to_string()));
        }
    };

    let mut parser = proto_schema::parser::ProtoParser::new(tokens);
    match parser.parse() {
        Ok(schema) => {
            let result = proto_schema::types::ProtobufParseResult::ok(schema);
            serde_json::to_string(&result).map_err(|e| JsError::new(&e.to_string()))
        }
        Err(e) => {
            let line_match = extract_line_number(&e);
            let result = proto_schema::types::ProtobufParseResult::err(e, line_match);
            serde_json::to_string(&result).map_err(|e| JsError::new(&e.to_string()))
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

// ── Protobuf Codec ──

#[wasm_bindgen]
pub fn encode_protobuf(
    schema_input: &str,
    message_type_name: &str,
    json_string: &str,
    output_format: &str,
) -> String {
    let result =
        encode_protobuf_inner(schema_input, message_type_name, json_string, output_format);
    serde_json::to_string(&result).unwrap()
}

#[wasm_bindgen]
pub fn decode_protobuf(
    schema_input: &str,
    message_type_name: &str,
    input: &str,
    input_format: &str,
) -> String {
    let result = decode_protobuf_inner(schema_input, message_type_name, input, input_format);
    serde_json::to_string(&result).unwrap()
}

#[wasm_bindgen]
pub fn detect_protobuf_format(input: &str) -> String {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return "binary".to_string();
    }

    // Check hex: even-length, all hex chars
    let stripped: String = trimmed.chars().filter(|c| !c.is_whitespace()).collect();
    if stripped.len() >= 2
        && stripped.len() % 2 == 0
        && stripped.chars().all(|c| c.is_ascii_hexdigit())
    {
        return "hex".to_string();
    }

    // Check base64
    if trimmed.len() >= 4
        && trimmed
            .trim_end_matches('=')
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '+' || c == '/')
    {
        return "base64".to_string();
    }

    "binary".to_string()
}

fn encode_protobuf_inner(
    schema_input: &str,
    message_type_name: &str,
    json_string: &str,
    output_format: &str,
) -> CodecResultInternal {
    if schema_input.trim().is_empty() {
        return CodecResultInternal::err("Empty schema".into());
    }

    // Parse schema
    let mut lexer = proto_schema::lexer::Lexer::new(schema_input.trim());
    let tokens = match lexer.tokenize() {
        Ok(t) => t,
        Err(e) => return CodecResultInternal::err(e),
    };
    let mut parser = proto_schema::parser::ProtoParser::new(tokens);
    let schema = match parser.parse() {
        Ok(s) => s,
        Err(e) => return CodecResultInternal::err(e),
    };

    // Find message type
    let all_msgs = collect_all_flat_messages_owned(&schema.messages);
    let msg = match all_msgs.iter().find(|m| m.name == message_type_name) {
        Some(m) => m,
        None => {
            return CodecResultInternal::err(format!("no such type: {}", message_type_name))
        }
    };

    // Parse JSON
    let json_value: serde_json::Value = match serde_json::from_str(json_string) {
        Ok(v) => v,
        Err(e) => return CodecResultInternal::err(e.to_string()),
    };

    // Encode
    let all_enums = collect_all_flat_enums(&schema.messages, &schema.enums);
    match proto_codec::encode::encode_message(&json_value, msg, &schema.messages, &all_enums) {
        Ok(bytes) => {
            let output = format_binary_output(&bytes, output_format);
            CodecResultInternal::ok(output)
        }
        Err(e) => CodecResultInternal::err(e),
    }
}

fn decode_protobuf_inner(
    schema_input: &str,
    message_type_name: &str,
    input: &str,
    input_format: &str,
) -> CodecResultInternal {
    if schema_input.trim().is_empty() {
        return CodecResultInternal::err("Empty schema".into());
    }

    // Parse schema
    let mut lexer = proto_schema::lexer::Lexer::new(schema_input.trim());
    let tokens = match lexer.tokenize() {
        Ok(t) => t,
        Err(e) => return CodecResultInternal::err(e),
    };
    let mut parser = proto_schema::parser::ProtoParser::new(tokens);
    let schema = match parser.parse() {
        Ok(s) => s,
        Err(e) => return CodecResultInternal::err(e),
    };

    // Find message type
    let all_msgs = collect_all_flat_messages_owned(&schema.messages);
    let msg = match all_msgs.iter().find(|m| m.name == message_type_name) {
        Some(m) => m,
        None => {
            return CodecResultInternal::err(format!("no such type: {}", message_type_name))
        }
    };

    // Decode binary input
    let bytes = match parse_binary_input(input, input_format) {
        Ok(b) => b,
        Err(e) => return CodecResultInternal::err(e),
    };

    let all_enums = collect_all_flat_enums(&schema.messages, &schema.enums);
    match proto_codec::decode::decode_message(&bytes, msg, &schema.messages, &all_enums) {
        Ok(value) => match serde_json::to_string_pretty(&value) {
            Ok(s) => CodecResultInternal::ok(s),
            Err(e) => CodecResultInternal::err(e.to_string()),
        },
        Err(e) => CodecResultInternal::err(e),
    }
}

#[derive(serde::Serialize)]
struct CodecResultInternal {
    #[serde(skip_serializing_if = "Option::is_none")]
    output: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
    success: bool,
}

impl CodecResultInternal {
    fn ok(output: String) -> Self {
        Self {
            output: Some(output),
            error: None,
            success: true,
        }
    }
    fn err(error: String) -> Self {
        Self {
            output: None,
            error: Some(error),
            success: false,
        }
    }
}

fn format_binary_output(bytes: &[u8], format: &str) -> String {
    match format {
        "hex" => bytes.iter().map(|b| format!("{:02x}", b)).collect(),
        "base64" => proto_codec::decode::base64_encode(bytes),
        "binary" => bytes.iter().map(|b| *b as char).collect(),
        _ => String::new(),
    }
}

fn parse_binary_input(input: &str, format: &str) -> Result<Vec<u8>, String> {
    match format {
        "base64" => base64_decode(input),
        "hex" => hex_decode(input),
        "binary" => Ok(input.chars().map(|c| c as u8).collect()),
        _ => Err(format!("Unknown format: {}", format)),
    }
}

fn base64_decode(input: &str) -> Result<Vec<u8>, String> {
    const DECODE: [i8; 128] = {
        let mut table = [-1i8; 128];
        let chars = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        let mut i = 0;
        while i < 64 {
            table[chars[i] as usize] = i as i8;
            i += 1;
        }
        table
    };

    let input = input.trim();
    let mut bytes = Vec::new();
    let chars: Vec<u8> = input.bytes().filter(|b| *b != b'=').collect();

    let mut i = 0;
    while i < chars.len() {
        let a = *DECODE
            .get(chars[i] as usize)
            .ok_or("Invalid base64")? as u32;
        let b = if i + 1 < chars.len() {
            *DECODE
                .get(chars[i + 1] as usize)
                .ok_or("Invalid base64")? as u32
        } else {
            0
        };
        let c = if i + 2 < chars.len() {
            *DECODE
                .get(chars[i + 2] as usize)
                .ok_or("Invalid base64")? as u32
        } else {
            0
        };
        let d = if i + 3 < chars.len() {
            *DECODE
                .get(chars[i + 3] as usize)
                .ok_or("Invalid base64")? as u32
        } else {
            0
        };

        if a as i8 == -1 || b as i8 == -1 {
            return Err("Invalid base64 character".into());
        }

        let n = (a << 18) | (b << 12) | (c << 6) | d;
        bytes.push((n >> 16) as u8);
        if i + 2 < chars.len() {
            bytes.push((n >> 8) as u8);
        }
        if i + 3 < chars.len() {
            bytes.push(n as u8);
        }
        i += 4;
    }
    Ok(bytes)
}

fn hex_decode(input: &str) -> Result<Vec<u8>, String> {
    let stripped: String = input.chars().filter(|c| !c.is_whitespace()).collect();
    if stripped.len() % 2 != 0 {
        return Err("Invalid hex string: odd length".into());
    }
    if !stripped.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err("Invalid hex string: non-hex characters".into());
    }
    (0..stripped.len())
        .step_by(2)
        .map(|i| {
            u8::from_str_radix(&stripped[i..i + 2], 16)
                .map_err(|e| format!("Invalid hex: {}", e))
        })
        .collect()
}

fn collect_all_flat_messages_owned(
    messages: &[proto_schema::types::ProtobufMessageInfo],
) -> Vec<proto_schema::types::ProtobufMessageInfo> {
    let mut result = Vec::new();
    for msg in messages {
        result.push(msg.clone());
        result.extend(collect_all_flat_messages_owned(&msg.nested_messages));
    }
    result
}

fn collect_all_flat_enums(
    messages: &[proto_schema::types::ProtobufMessageInfo],
    top_enums: &[proto_schema::types::ProtobufEnumInfo],
) -> Vec<proto_schema::types::ProtobufEnumInfo> {
    let mut result = top_enums.to_vec();
    for msg in messages {
        result.extend(msg.nested_enums.clone());
        result.extend(collect_all_flat_enums(&msg.nested_messages, &[]));
    }
    result
}
