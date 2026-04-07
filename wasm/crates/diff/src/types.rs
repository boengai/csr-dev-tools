use serde::Serialize;

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct DiffChange {
    pub added: bool,
    pub removed: bool,
    pub value: String,
}
