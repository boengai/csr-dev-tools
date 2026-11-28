//! The registry (ADR-0035 §6): every Tool's data, generated from
//! `tool-routes.ts` until cutover, and the storage-key table. Data only: no
//! components and no function pointers, so a native build step can read it.

mod generated;
mod storage;

pub use generated::{Category, Layout, TOOLS, ToolKey};
pub use storage::{STORAGE_KEYS, StorageKey};

/// One Tool, as `tool-routes.ts` resolves it.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Tool {
    pub key: ToolKey,
    pub name: &'static str,
    pub category: Category,
    pub emoji: &'static str,
    pub description: &'static str,
    pub seo: Seo,
    pub layout: Layout,
    /// The ADR that says why a `custom` Tool builds by hand.
    pub layout_opt_out_adr: Option<&'static str>,
}

/// A Tool page's head text. `title` is already resolved: `<name> - CSR Dev
/// Tools` unless `tool-routes.ts` overrides it.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Seo {
    pub title: &'static str,
    pub description: &'static str,
}

impl ToolKey {
    /// The key as `tool-routes.ts` spells it, which is also its route segment.
    /// `KEYS` and `TOOLS` are generated in `ToolKey` order, so the discriminant
    /// is the row; a match would trip `too_many_lines` at 84 arms.
    pub fn as_str(self) -> &'static str {
        generated::KEYS[self as usize]
    }

    pub fn tool(self) -> &'static Tool {
        &TOOLS[self as usize]
    }
}
