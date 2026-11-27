//! Repository paths the gates name. A path for a file not built yet is the
//! one its first PR must use; that PR changes it here if it has to.

/// Generated from `tool-routes.ts` (ADR-0035 §6).
pub const REGISTRY_GENERATED: &str = "crates/registry/src/generated.rs";
/// The hand-written storage-key table (ADR-0035 §6).
pub const STORAGE_TABLE: &str = "crates/registry/src/storage.rs";
/// `app`'s ported-Tool list (ADR-0035 §7).
pub const PORTED_LIST: &str = "crates/app/src/ported_tools.rs";
pub const APP_MANIFEST: &str = "crates/app/Cargo.toml";
/// The byte-ceiling file (`docs/perf/budgets.md` → "CI on `develop`").
pub const CEILING_FILE: &str = "docs/perf/byte-ceilings.json";
/// The stored-value goldens (#38).
pub const GOLDENS: &str = "e2e/stored-values/golden.json";
/// The a11y baseline (#41).
pub const A11Y_BASELINE: &str = "e2e/parity/a11y-baseline.json";
/// The Dioxus Playwright config, which holds the Dioxus spec filter.
pub const DIOXUS_SPEC_FILTER: &str = "playwright.dioxus.config.ts";
/// The post-migration CSP (ADR-0033 Decision 6).
pub const POST_MIGRATION_CSP: &str = "docs/quality/post-migration-csp.txt";
/// The registry's source until cutover.
pub const TOOL_ROUTES: &str = "src/constants/tool-routes.ts";

const GATE_FILES: [&str; 12] = [
    "Cargo.toml",
    "clippy.toml",
    "rustfmt.toml",
    "deny.toml",
    ".jscpd.json",
    "rust-toolchain.toml",
    CEILING_FILE,
    A11Y_BASELINE,
    POST_MIGRATION_CSP,
    "crates/logic/README.md",
    "crates/tools/README.md",
    "crates/workers/README.md",
];

const GATE_DIRS: [&str; 3] = ["crates/gates/", ".github/workflows/", "docs/quality/pr/"];

/// A gate file decides what CI accepts (`docs/quality/gates.md` → "Gate files").
pub fn is_gate_file(path: &str) -> bool {
    GATE_FILES.contains(&path) || GATE_DIRS.iter().any(|dir| path.starts_with(dir))
}

/// Lockfiles and generated files, which the size warning does not count.
pub fn is_generated(path: &str) -> bool {
    let name = path.rsplit('/').next().unwrap_or(path);
    matches!(name, "Cargo.lock" | "pnpm-lock.yaml") || path == REGISTRY_GENERATED
}

/// The key of the Tool crate a path is in, if any.
pub fn tool_key(path: &str) -> Option<&str> {
    path.strip_prefix("crates/tools/")?
        .split_once('/')
        .map(|(key, _)| key)
}

/// The name of the logic crate a path is in, if any.
pub fn logic_name(path: &str) -> Option<&str> {
    path.strip_prefix("crates/logic/")?
        .split_once('/')
        .map(|(name, _)| name)
}
