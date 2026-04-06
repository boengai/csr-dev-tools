use super::types::*;
use serde_json::{Map, Value};
use std::collections::HashSet;

const SCALAR_DEFAULTS: &[(&str, fn() -> Value)] = &[
    ("bool", || Value::Bool(false)),
    ("bytes", || Value::String(String::new())),
    ("double", || Value::Number(0.into())),
    ("fixed32", || Value::Number(0.into())),
    ("fixed64", || Value::String("0".into())),
    ("float", || Value::Number(0.into())),
    ("int32", || Value::Number(0.into())),
    ("int64", || Value::String("0".into())),
    ("sfixed32", || Value::Number(0.into())),
    ("sfixed64", || Value::String("0".into())),
    ("sint32", || Value::Number(0.into())),
    ("sint64", || Value::String("0".into())),
    ("string", || Value::String(String::new())),
    ("uint32", || Value::Number(0.into())),
    ("uint64", || Value::String("0".into())),
];

fn scalar_default(type_name: &str) -> Value {
    for (name, default_fn) in SCALAR_DEFAULTS {
        if *name == type_name {
            return default_fn();
        }
    }
    Value::Null
}

pub fn generate_sample_json(
    message: &ProtobufMessageInfo,
    all_messages: &[ProtobufMessageInfo],
    all_enums: &[ProtobufEnumInfo],
) -> Value {
    let mut visited = HashSet::new();
    generate_sample_inner(message, all_messages, all_enums, &mut visited)
}

fn generate_sample_inner(
    message: &ProtobufMessageInfo,
    all_messages: &[ProtobufMessageInfo],
    all_enums: &[ProtobufEnumInfo],
    visited: &mut HashSet<String>,
) -> Value {
    visited.insert(message.full_name.clone());

    let flat_messages = collect_all_messages(all_messages);
    let flat_enums = collect_all_enums(all_messages, all_enums);

    let mut result = Map::new();

    for field in &message.fields {
        let value = if field.is_map {
            Value::Object(Map::new())
        } else if field.resolved_kind == "enum" {
            if let Some(enum_info) = flat_enums
                .iter()
                .find(|e| Some(&e.full_name) == field.resolved_type_name.as_ref())
            {
                // Find the enum variant with the lowest numeric value (typically 0 = default)
                let default_key = enum_info
                    .values
                    .iter()
                    .min_by_key(|(_k, v)| *v)
                    .map(|(k, _v)| k.clone());
                match default_key {
                    Some(k) => Value::String(k),
                    None => Value::String(String::new()),
                }
            } else {
                Value::String(String::new())
            }
        } else if field.resolved_kind == "message" {
            if let Some(nested_msg) = flat_messages
                .iter()
                .find(|m| Some(&m.full_name) == field.resolved_type_name.as_ref())
            {
                if visited.contains(&nested_msg.full_name) {
                    Value::Object(Map::new())
                } else {
                    let mut new_visited = visited.clone();
                    generate_sample_inner(nested_msg, all_messages, all_enums, &mut new_visited)
                }
            } else {
                Value::Object(Map::new())
            }
        } else {
            scalar_default(&field.field_type)
        };

        let final_value = if field.rule.as_deref() == Some("repeated") {
            Value::Array(vec![value])
        } else {
            value
        };

        result.insert(field.name.clone(), final_value);
    }

    Value::Object(result)
}

fn collect_all_messages(messages: &[ProtobufMessageInfo]) -> Vec<&ProtobufMessageInfo> {
    let mut result = Vec::new();
    for msg in messages {
        result.push(msg);
        result.extend(collect_all_messages(&msg.nested_messages));
    }
    result
}

fn collect_all_enums<'a>(
    messages: &'a [ProtobufMessageInfo],
    top_enums: &'a [ProtobufEnumInfo],
) -> Vec<&'a ProtobufEnumInfo> {
    let mut result: Vec<&ProtobufEnumInfo> = top_enums.iter().collect();
    for msg in messages {
        for e in &msg.nested_enums {
            result.push(e);
        }
        result.extend(collect_all_enums(&msg.nested_messages, &[]));
    }
    result
}
