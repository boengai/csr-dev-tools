//! The storage-key table (ADR-0035 §6): every `localStorage` key and key
//! pattern the Dioxus build may write, hand-written because `tool-routes.ts`
//! has none. Keys stay literal. A Tool's `port` PR adds its rows; the keys no
//! single Tool owns come with the code that writes them.

/// A key or key pattern from this table. Only this module can build one, so a
/// shell cannot be handed a key that is missing from the table.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct StorageKey(&'static str);

impl StorageKey {
    pub fn as_str(self) -> &'static str {
        self.0
    }
}

/// Every row of the table. ADR-0032's test compares it with the key list.
pub const STORAGE_KEYS: [StorageKey; 0] = [];
