use super::wire::*;
use crate::proto_schema::types::*;
use serde_json::Value;

pub fn encode_message(
    json: &Value,
    message: &ProtobufMessageInfo,
    all_messages: &[ProtobufMessageInfo],
    all_enums: &[ProtobufEnumInfo],
) -> Result<Vec<u8>, String> {
    let obj = json
        .as_object()
        .ok_or("Expected JSON object for message encoding")?;

    let mut buf = Vec::new();

    for field in &message.fields {
        let value = match obj.get(&field.name) {
            Some(v) if !v.is_null() => v,
            _ => continue,
        };

        if field.rule.as_deref() == Some("repeated") {
            if let Value::Array(arr) = value {
                for item in arr {
                    encode_field(&mut buf, field, item, all_messages, all_enums)?;
                }
            }
        } else {
            encode_field(&mut buf, field, value, all_messages, all_enums)?;
        }
    }

    Ok(buf)
}

fn encode_field(
    buf: &mut Vec<u8>,
    field: &ProtobufFieldInfo,
    value: &Value,
    all_messages: &[ProtobufMessageInfo],
    all_enums: &[ProtobufEnumInfo],
) -> Result<(), String> {
    match field.resolved_kind.as_str() {
        "message" => {
            let nested_msg = find_message(all_messages, field.resolved_type_name.as_deref());
            if let Some(msg) = nested_msg {
                let encoded = encode_message(value, msg, all_messages, all_enums)?;
                encode_tag(field.id, WIRE_LENGTH_DELIMITED, buf);
                encode_varint(encoded.len() as u64, buf);
                buf.extend_from_slice(&encoded);
            }
        }
        "enum" => {
            let enum_val =
                resolve_enum_value(value, all_enums, field.resolved_type_name.as_deref());
            encode_tag(field.id, WIRE_VARINT, buf);
            encode_varint(enum_val as u64, buf);
        }
        _ => {
            encode_scalar(buf, field.id, &field.field_type, value)?;
        }
    }
    Ok(())
}

fn encode_scalar(
    buf: &mut Vec<u8>,
    field_id: u32,
    type_name: &str,
    value: &Value,
) -> Result<(), String> {
    match type_name {
        "string" => {
            let owned;
            let s = match value.as_str() {
                Some(s) => s,
                None => {
                    owned = value.to_string().replace('"', "");
                    &owned
                }
            };
            encode_tag(field_id, WIRE_LENGTH_DELIMITED, buf);
            encode_varint(s.len() as u64, buf);
            buf.extend_from_slice(s.as_bytes());
        }
        "bytes" => {
            let s = value.as_str().unwrap_or("");
            encode_tag(field_id, WIRE_LENGTH_DELIMITED, buf);
            encode_varint(s.len() as u64, buf);
            buf.extend_from_slice(s.as_bytes());
        }
        "bool" => {
            let b = value.as_bool().unwrap_or(false);
            encode_tag(field_id, WIRE_VARINT, buf);
            encode_varint(b as u64, buf);
        }
        "int32" | "int64" | "uint32" | "uint64" => {
            let n = value_to_u64(value);
            encode_tag(field_id, WIRE_VARINT, buf);
            encode_varint(n, buf);
        }
        "sint32" => {
            let n = value_to_i64(value) as i32;
            encode_tag(field_id, WIRE_VARINT, buf);
            encode_varint(encode_zigzag32(n), buf);
        }
        "sint64" => {
            let n = value_to_i64(value);
            encode_tag(field_id, WIRE_VARINT, buf);
            encode_varint(encode_zigzag64(n), buf);
        }
        "fixed32" => {
            let n = value_to_u64(value) as u32;
            encode_tag(field_id, WIRE_32BIT, buf);
            buf.extend_from_slice(&n.to_le_bytes());
        }
        "fixed64" | "sfixed64" => {
            let n = value_to_u64(value);
            encode_tag(field_id, WIRE_64BIT, buf);
            buf.extend_from_slice(&n.to_le_bytes());
        }
        "sfixed32" => {
            let n = value_to_i64(value) as i32;
            encode_tag(field_id, WIRE_32BIT, buf);
            buf.extend_from_slice(&n.to_le_bytes());
        }
        "float" => {
            let f = value.as_f64().unwrap_or(0.0) as f32;
            encode_tag(field_id, WIRE_32BIT, buf);
            buf.extend_from_slice(&f.to_le_bytes());
        }
        "double" => {
            let f = value.as_f64().unwrap_or(0.0);
            encode_tag(field_id, WIRE_64BIT, buf);
            buf.extend_from_slice(&f.to_le_bytes());
        }
        _ => {}
    }
    Ok(())
}

fn value_to_u64(v: &Value) -> u64 {
    match v {
        Value::Number(n) => n.as_u64().unwrap_or(n.as_i64().unwrap_or(0) as u64),
        Value::String(s) => s.parse().unwrap_or(0),
        Value::Bool(b) => *b as u64,
        _ => 0,
    }
}

fn value_to_i64(v: &Value) -> i64 {
    match v {
        Value::Number(n) => n.as_i64().unwrap_or(0),
        Value::String(s) => s.parse().unwrap_or(0),
        _ => 0,
    }
}

fn resolve_enum_value(
    value: &Value,
    all_enums: &[ProtobufEnumInfo],
    type_name: Option<&str>,
) -> i32 {
    if let Some(n) = value.as_i64() {
        return n as i32;
    }
    if let Some(s) = value.as_str() {
        if let Some(type_name) = type_name {
            for e in all_enums {
                if e.full_name == type_name {
                    if let Some(&val) = e.values.get(s) {
                        return val;
                    }
                }
            }
        }
    }
    0
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
