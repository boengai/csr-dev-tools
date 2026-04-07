use super::wire::*;
use crate::proto_schema::types::*;
use serde_json::{Map, Value};

pub fn decode_message(
    data: &[u8],
    message: &ProtobufMessageInfo,
    all_messages: &[ProtobufMessageInfo],
    all_enums: &[ProtobufEnumInfo],
) -> Result<Value, String> {
    let mut reader = WireReader::new(data);
    let mut result = Map::new();

    // Initialize defaults
    for field in &message.fields {
        let default = get_default_value(field, all_enums);
        result.insert(field.name.clone(), default);
    }

    while reader.remaining() > 0 {
        let (field_number, wire_type) = reader.read_tag()?;

        let field = message.fields.iter().find(|f| f.id == field_number);

        if let Some(field) = field {
            let value =
                decode_field_value(&mut reader, wire_type, field, all_messages, all_enums)?;

            if field.rule.as_deref() == Some("repeated") {
                let entry = result
                    .entry(field.name.clone())
                    .or_insert_with(|| Value::Array(Vec::new()));
                if let Value::Array(arr) = entry {
                    arr.push(value);
                }
            } else {
                result.insert(field.name.clone(), value);
            }
        } else {
            reader.skip_field(wire_type)?;
        }
    }

    Ok(Value::Object(result))
}

fn decode_field_value(
    reader: &mut WireReader<'_>,
    wire_type: u32,
    field: &ProtobufFieldInfo,
    all_messages: &[ProtobufMessageInfo],
    all_enums: &[ProtobufEnumInfo],
) -> Result<Value, String> {
    if field.resolved_kind == "message" {
        let data = reader.read_bytes()?;
        let msg = find_message(all_messages, field.resolved_type_name.as_deref());
        if let Some(msg) = msg {
            return decode_message(data, msg, all_messages, all_enums);
        }
        return Ok(Value::Object(Map::new()));
    }

    if field.resolved_kind == "enum" {
        let n = reader.read_varint()? as i32;
        // Convert to string name
        if let Some(type_name) = &field.resolved_type_name {
            for e in all_enums {
                if e.full_name == *type_name {
                    for (name, &val) in &e.values {
                        if val == n {
                            return Ok(Value::String(name.clone()));
                        }
                    }
                }
            }
        }
        return Ok(Value::Number(n.into()));
    }

    decode_scalar(reader, wire_type, &field.field_type)
}

fn decode_scalar(
    reader: &mut WireReader<'_>,
    wire_type: u32,
    type_name: &str,
) -> Result<Value, String> {
    match type_name {
        "string" => {
            let data = reader.read_bytes()?;
            let s =
                String::from_utf8(data.to_vec()).map_err(|_| "Invalid UTF-8 in string field")?;
            Ok(Value::String(s))
        }
        "bytes" => {
            let data = reader.read_bytes()?;
            // base64 encode for JSON
            Ok(Value::String(base64_encode(data)))
        }
        "bool" => {
            let n = reader.read_varint()?;
            Ok(Value::Bool(n != 0))
        }
        "int32" => {
            let n = reader.read_varint()? as i32;
            Ok(Value::Number(n.into()))
        }
        "int64" => {
            let n = reader.read_varint()? as i64;
            Ok(Value::String(n.to_string()))
        }
        "uint32" => {
            let n = reader.read_varint()? as u32;
            Ok(Value::Number(n.into()))
        }
        "uint64" => {
            let n = reader.read_varint()?;
            Ok(Value::String(n.to_string()))
        }
        "sint32" => {
            let n = decode_zigzag32(reader.read_varint()? as u32);
            Ok(Value::Number(n.into()))
        }
        "sint64" => {
            let n = decode_zigzag64(reader.read_varint()?);
            Ok(Value::String(n.to_string()))
        }
        "fixed32" => {
            let n = reader.read_fixed32()?;
            Ok(Value::Number(n.into()))
        }
        "fixed64" => {
            let n = reader.read_fixed64()?;
            Ok(Value::String(n.to_string()))
        }
        "sfixed32" => {
            let n = reader.read_fixed32()? as i32;
            Ok(Value::Number(n.into()))
        }
        "sfixed64" => {
            let n = reader.read_fixed64()? as i64;
            Ok(Value::String(n.to_string()))
        }
        "float" => {
            let bits = reader.read_fixed32()?;
            let f = f32::from_le_bytes(bits.to_le_bytes());
            Ok(serde_json::Number::from_f64(f as f64)
                .map(Value::Number)
                .unwrap_or(Value::Number(0.into())))
        }
        "double" => {
            let bits = reader.read_fixed64()?;
            let f = f64::from_le_bytes(bits.to_le_bytes());
            Ok(serde_json::Number::from_f64(f)
                .map(Value::Number)
                .unwrap_or(Value::Number(0.into())))
        }
        _ => {
            reader.skip_field(wire_type)?;
            Ok(Value::Null)
        }
    }
}

fn get_default_value(field: &ProtobufFieldInfo, all_enums: &[ProtobufEnumInfo]) -> Value {
    if field.rule.as_deref() == Some("repeated") {
        return Value::Array(Vec::new());
    }
    if field.resolved_kind == "enum" {
        if let Some(type_name) = &field.resolved_type_name {
            for e in all_enums {
                if e.full_name == *type_name {
                    if let Some(first) = e.values.keys().next() {
                        return Value::String(first.clone());
                    }
                }
            }
        }
        return Value::String(String::new());
    }
    if field.resolved_kind == "message" {
        return Value::Null;
    }
    // Scalar defaults
    match field.field_type.as_str() {
        "string" | "bytes" => Value::String(String::new()),
        "bool" => Value::Bool(false),
        "int64" | "uint64" | "sint64" | "fixed64" | "sfixed64" => Value::String("0".into()),
        _ => Value::Number(0.into()),
    }
}

fn find_message<'a>(
    all_messages: &'a [ProtobufMessageInfo],
    full_name: Option<&str>,
) -> Option<&'a ProtobufMessageInfo> {
    let target = full_name?;
    for msg in all_messages {
        if msg.full_name == target {
            return Some(msg);
        }
        if let Some(found) = find_message(&msg.nested_messages, Some(target)) {
            return Some(found);
        }
    }
    None
}

pub fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::new();
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = chunk.get(1).copied().unwrap_or(0) as u32;
        let b2 = chunk.get(2).copied().unwrap_or(0) as u32;
        let n = (b0 << 16) | (b1 << 8) | b2;
        result.push(CHARS[((n >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((n >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARS[((n >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARS[(n & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}
