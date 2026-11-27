//! The `pr-body` check (`docs/quality/gates.md` → "The PR body"): the
//! kind's headings, the case-mapping table, the automated review and the
//! maintainer's ticked hand check.

use crate::Finding;
use crate::pr_kind::Kind;

const REVIEW: &str = "## Automated review";
const HAND_CHECK: &str = "## Hand check";
const CASES: &str = "## Case mapping";

/// The template in `docs/quality/pr/` a kind's body is checked against.
pub fn template_name(kind: &Kind) -> Option<&'static str> {
    match kind {
        Kind::Port { .. } => Some("port"),
        Kind::Split { .. } => Some("split"),
        Kind::Shell { .. } => Some("shell"),
        Kind::Foundation { .. } => Some("foundation"),
        Kind::Gates => Some("gates"),
        Kind::Docs => Some("docs"),
        Kind::Sync => None,
    }
}

/// `template` is the kind's template text; a `sync` PR has none.
pub fn check_body(kind: &Kind, body: &str, template: Option<&str>) -> Vec<Finding> {
    let Some(template) = template else {
        return Vec::new();
    };
    let body = body.replace("\r\n", "\n");
    let mut findings = Vec::new();
    for heading in headings(template) {
        if !headings(&body).contains(&heading) {
            findings.push(Finding::new(
                "pr-body-heading",
                "body",
                0,
                format!("missing `{heading}` from the template"),
            ));
        }
    }
    if matches!(kind, Kind::Port { .. } | Kind::Shell { .. })
        && !has_filled_row(section(&body, CASES))
    {
        findings.push(Finding::new(
            "pr-body-cases",
            "body",
            0,
            "the case-mapping table maps no React case to a Rust test",
        ));
    }
    if strip_comments(section(&body, REVIEW)).trim().is_empty() {
        findings.push(Finding::new(
            "pr-body-review",
            "body",
            0,
            "`## Automated review` lists no finding or outcome",
        ));
    }
    // Every box the template lists must be in the body, ticked.
    let ticked: Vec<&str> = section(&body, HAND_CHECK)
        .lines()
        .filter_map(|line| {
            line.trim_start()
                .strip_prefix("- [x] ")
                .or_else(|| line.trim_start().strip_prefix("- [X] "))
        })
        .map(str::trim)
        .collect();
    for item in section(template, HAND_CHECK)
        .lines()
        .filter_map(|line| line.trim_start().strip_prefix("- [ ] "))
    {
        if !ticked.contains(&item.trim()) {
            let message = format!(
                "\"{}\" is not ticked: the maintainer ticks it before merging",
                item.trim()
            );
            findings.push(Finding::new("pr-body-hand-check", "body", 0, message));
        }
    }
    findings
}

fn headings(text: &str) -> Vec<String> {
    text.lines()
        .filter(|line| line.starts_with("## "))
        .map(|line| line.trim_end().to_owned())
        .collect()
}

/// The text under `heading`, up to the next `## ` heading.
fn section<'a>(body: &'a str, heading: &str) -> &'a str {
    let Some((_, after)) = body.split_once(&format!("{heading}\n")) else {
        return "";
    };
    after.split("\n## ").next().unwrap_or_default()
}

fn strip_comments(text: &str) -> String {
    let mut kept = String::new();
    let mut rest = text;
    while let Some((before, after)) = rest.split_once("<!--") {
        kept.push_str(before);
        rest = after.split_once("-->").map_or("", |(_, tail)| tail);
    }
    kept.push_str(rest);
    kept
}

/// A table row after the header and separator, with every cell filled.
fn has_filled_row(section: &str) -> bool {
    section
        .lines()
        .filter(|line| line.trim_start().starts_with('|'))
        .skip(2)
        .any(|row| {
            let cells: Vec<&str> = row
                .trim()
                .trim_matches('|')
                .split('|')
                .map(str::trim)
                .collect();
            cells.iter().all(|cell| !cell.is_empty())
        })
}
