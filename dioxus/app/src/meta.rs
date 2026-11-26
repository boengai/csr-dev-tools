//! Tool metadata, generated from src/constants/tool-routes.ts (the single
//! source the React build and the head-stamping step also read).
#[path = "generated/tools.rs"]
mod generated;

pub use generated::{HOME_TAGS, HOME_TITLE, TOOLS};

pub const SITE_ORIGIN: &str = "https://csr-dev-tools.pages.dev";

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ToolMeta {
    pub key: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub route_path: &'static str,
    pub seo_title: &'static str,
    pub seo_description: &'static str,
}

pub fn tool(key: &str) -> ToolMeta {
    *TOOLS.iter().find(|t| t.key == key).unwrap_or_else(|| panic!("unknown tool {key}"))
}
