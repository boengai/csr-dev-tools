//! The source rules Clippy cannot reach (`docs/quality/gates.md` → "Source
//! rules"). Text and comment rules live here; syntax rules in
//! [`crate::syntax`] and `rsx!` rules in [`crate::rsx`].

use crate::comments::{CommentKind, comments};
use crate::paths::REGISTRY_GENERATED;
use crate::workspace::Layer;
use crate::{Finding, RuleHit};
use crate::{rsx, syntax};

/// A source file is at most this many lines, not counting its test module.
pub const MAX_FILE_LINES: usize = 300;

const MARKERS: [&str; 4] = ["TODO", "FIXME", "XXX", "HACK"];

#[derive(Clone, Debug)]
pub struct SourceFile {
    /// Shown in findings.
    pub path: String,
    pub text: String,
}

/// Where a file sits, which decides the rules that apply to it.
#[derive(Clone, Debug)]
pub struct FileContext {
    pub layer: Layer,
    /// The crate's `src/lib.rs` or `src/main.rs`.
    pub crate_root: bool,
    /// A Tool whose registry layout is `custom`.
    pub custom_tool: bool,
}

impl FileContext {
    pub fn is_tool(&self) -> bool {
        matches!(self.layer, Layer::Tool { .. })
    }
}

pub fn check_file(context: &FileContext, file: &SourceFile) -> Vec<Finding> {
    let mut findings = Vec::new();
    let mut report = |rule: &'static str, line: usize, message: String| {
        findings.push(Finding::new(rule, &file.path, line, message));
    };
    let parsed = match syn::parse_file(&file.text) {
        Ok(parsed) => parsed,
        Err(error) => {
            report(
                "parse",
                error.span().start().line,
                format!("cannot parse: {error}"),
            );
            return findings;
        }
    };
    let test_lines = syntax::test_module_lines(&parsed);
    let lines = file.text.lines().count().saturating_sub(test_lines);
    // The generated registry holds one row per Tool, and no one edits it by hand.
    if lines > MAX_FILE_LINES && file.path != REGISTRY_GENERATED {
        report(
            "file-size",
            0,
            format!(
                "{lines} lines outside the test module, over {MAX_FILE_LINES}: split the module"
            ),
        );
    }
    for (rule, line, message) in comment_rules(&file.text) {
        report(rule, line, message);
    }
    for (rule, line, message) in syntax::check(context, &parsed) {
        report(rule, line, message);
    }
    for (rule, line, message) in rsx::check(context, &file.text, &parsed) {
        report(rule, line, message);
    }
    findings.sort_by_key(|finding| finding.line);
    findings
}

/// Exactly one Tool entry per Tool crate (ADR-0035 §7), over all its files.
pub fn check_tool_entries(crate_name: &str, files: &[SourceFile]) -> Vec<Finding> {
    let count: usize = files
        .iter()
        .filter_map(|file| syn::parse_file(&file.text).ok())
        .map(|parsed| syntax::tool_entries(&parsed))
        .sum();
    if count == 1 {
        return Vec::new();
    }
    vec![Finding::new(
        "tool-entry",
        crate_name,
        0,
        format!("a Tool crate declares exactly one Tool entry, not {count}"),
    )]
}

fn comment_rules(text: &str) -> Vec<RuleHit> {
    let found = comments(text);
    let mut raw = Vec::new();
    for comment in &found {
        if comment.text.contains("jscpd:ignore") {
            raw.push((
                "jscpd-ignore",
                comment.line,
                "jscpd's ignore comments are banned: move the copy down instead".to_owned(),
            ));
        }
        for marker in MARKERS {
            if names_marker_without_issue(&comment.text, marker) {
                raw.push((
                    "todo-issue",
                    comment.line,
                    format!("{marker} names an issue, as in {marker}(#123)"),
                ));
            }
        }
    }
    raw.extend(commented_out_code(&found));
    raw.extend(mutants_skip_without_reason(text, &found));
    raw
}

fn names_marker_without_issue(text: &str, marker: &str) -> bool {
    text.match_indices(marker).any(|(at, _)| {
        let before = text.get(..at).and_then(|head| head.chars().next_back());
        let after = text.get(at + marker.len()..).unwrap_or_default();
        let word =
            !before.is_some_and(char::is_alphanumeric) && !after.starts_with(char::is_alphanumeric);
        let named = after
            .strip_prefix("(#")
            .is_some_and(|rest| rest.starts_with(|c: char| c.is_ascii_digit()));
        word && !named
    })
}

/// A run of whole-line `//` comments that parses as Rust items, or as
/// statements that each end in `;` or a block.
fn commented_out_code(found: &[crate::comments::Comment]) -> Vec<RuleHit> {
    let mut raw = Vec::new();
    let mut run: Vec<&crate::comments::Comment> = Vec::new();
    let mut flush = |run: &mut Vec<&crate::comments::Comment>| {
        if let Some(first) = run.first() {
            let code = run
                .iter()
                .fold(String::new(), |code, comment| code + &comment.text + "\n");
            if parses_as_code(&code) {
                raw.push((
                    "commented-out-code",
                    first.line,
                    "delete commented-out code; git keeps it".to_owned(),
                ));
            }
        }
        run.clear();
    };
    for comment in found
        .iter()
        .filter(|comment| comment.kind == CommentKind::Line && comment.whole_line)
    {
        if run.last().is_some_and(|last| last.line + 1 != comment.line) {
            flush(&mut run);
        }
        run.push(comment);
    }
    flush(&mut run);
    raw
}

fn parses_as_code(code: &str) -> bool {
    if syn::parse_file(code).is_ok_and(|file| !file.items.is_empty()) {
        return true;
    }
    syn::parse_str::<syn::Block>(&format!("{{{code}}}")).is_ok_and(|block| {
        !block.stmts.is_empty()
            && block.stmts.iter().all(|stmt| match stmt {
                syn::Stmt::Local(_) | syn::Stmt::Item(_) => true,
                syn::Stmt::Expr(expr, semi) => {
                    semi.is_some()
                        || matches!(
                            expr,
                            syn::Expr::Block(_)
                                | syn::Expr::If(_)
                                | syn::Expr::ForLoop(_)
                                | syn::Expr::Match(_)
                        )
                }
                syn::Stmt::Macro(mac) => mac.semi_token.is_some(),
            })
    })
}

fn mutants_skip_without_reason(text: &str, found: &[crate::comments::Comment]) -> Vec<RuleHit> {
    text.lines()
        .enumerate()
        .filter(|(_, line)| line.trim_start().starts_with("#[mutants::skip]"))
        .filter(|(index, _)| {
            !found.iter().any(|comment| {
                comment.line == *index
                    && comment.kind == CommentKind::Line
                    && comment.whole_line
                    && !comment.text.trim().is_empty()
            })
        })
        .map(|(index, _)| {
            (
                "mutants-skip",
                index + 1,
                "#[mutants::skip] needs a reason comment on the line above".to_owned(),
            )
        })
        .collect()
}
