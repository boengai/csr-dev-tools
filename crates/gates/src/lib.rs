//! The custom anti-slop checks (ADR-0036 §6, `docs/quality/gates.md`).
//!
//! Each check is a function from manifests, source text or PR data to a list
//! of [`Finding`]s. An empty list passes.

pub mod comments;
pub mod layers;
pub mod manifests;
pub mod paths;
pub mod pr_body;
pub mod pr_kind;
pub mod registry;
pub mod rsx;
pub mod sources;
pub mod syntax;
pub mod tree;
pub mod workspace;

use std::fmt;

/// A rule broken in a file before the file is known: the rule id, the 1-based
/// line (0 for none) and the message. `sources::check_file` makes it a
/// [`Finding`].
pub type RuleHit = (&'static str, usize, String);

/// One rule broken at one place.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Finding {
    /// The rule's id, as named in `docs/quality/gates.md`.
    pub rule: &'static str,
    /// Where: a file path, a package name, or a PR title.
    pub at: String,
    /// The 1-based line, or 0 when the finding has none.
    pub line: usize,
    pub message: String,
}

impl Finding {
    pub fn new(
        rule: &'static str,
        at: impl Into<String>,
        line: usize,
        message: impl Into<String>,
    ) -> Self {
        Self {
            rule,
            at: at.into(),
            line,
            message: message.into(),
        }
    }
}

impl fmt::Display for Finding {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if self.line == 0 {
            write!(f, "[{}] {}: {}", self.rule, self.at, self.message)
        } else {
            write!(
                f,
                "[{}] {}:{}: {}",
                self.rule, self.at, self.line, self.message
            )
        }
    }
}
