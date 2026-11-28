//! The ported-Tool list (ADR-0035 §7): one Tool key per line, added by the
//! Tool's `port` PR. The gates read it for the four-set check and for the
//! check that every ported Tool emits its own wasm module.

/// Takes the ported Tools' keys. It emits nothing yet: the routes and the
/// Tool entry match it is to emit come with the first `shell` PR, which
/// brings in `ui` and the registry.
macro_rules! ported_tools {
    ($($key:literal),* $(,)?) => {};
}

ported_tools![];
