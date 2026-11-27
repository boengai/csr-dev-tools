//! Near misses that no rule may flag.
//!
//! ```
//! let doc_examples = "are exempt";
//! ```

// See (ADR-0035) for why this is not code; it ends without a semicolon
// TODO(#57): this names its issue.
// The string below holds `//`, a marker and a style: "x" lookalike.
const TEXT: &str = "// TODO not a comment, style: \"color: red\"";
const RAW: &str = r#"/* jscpd:ignore-start */ "quoted" "#;
const CHAR: char = '"';

fn lifetimes<'a>(value: &'a str) -> &'a str {
    value
}

// Skipped because the mutant only reorders a log line.
#[mutants::skip]
fn reasoned() {}

#[component]
fn Short(label: String) -> Element {
    let style = "computed elsewhere";
    rsx! {
        div { class: "text-error", style, "{label}" }
    }
}
