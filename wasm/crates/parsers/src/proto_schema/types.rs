use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProtobufFieldInfo {
    pub description: Option<String>,
    pub id: u32,
    pub is_map: bool,
    pub name: String,
    pub resolved_kind: String, // "scalar", "message", "enum"
    pub resolved_type_name: Option<String>,
    pub rule: Option<String>, // "optional", "repeated", "required"
    #[serde(rename = "type")]
    pub field_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProtobufEnumInfo {
    pub full_name: String,
    pub name: String,
    pub values: BTreeMap<String, i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProtobufMessageInfo {
    pub fields: Vec<ProtobufFieldInfo>,
    pub full_name: String,
    pub name: String,
    pub nested_enums: Vec<ProtobufEnumInfo>,
    pub nested_messages: Vec<ProtobufMessageInfo>,
    pub oneofs: Vec<OneofInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OneofInfo {
    pub field_names: Vec<String>,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProtobufSchemaInfo {
    pub enums: Vec<ProtobufEnumInfo>,
    pub messages: Vec<ProtobufMessageInfo>,
    pub package: Option<String>,
    pub syntax: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(untagged)]
pub enum ProtobufParseResult {
    #[serde(rename_all = "camelCase")]
    Success {
        schema: ProtobufSchemaInfo,
        success: bool,
    },
    #[serde(rename_all = "camelCase")]
    Error {
        error: String,
        line: Option<u32>,
        success: bool,
    },
}

impl ProtobufParseResult {
    pub fn ok(schema: ProtobufSchemaInfo) -> Self {
        Self::Success {
            schema,
            success: true,
        }
    }

    pub fn err(error: String, line: Option<u32>) -> Self {
        Self::Error {
            error,
            line,
            success: false,
        }
    }
}
