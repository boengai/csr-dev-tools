//! The npm licence check (`docs/quality/gates.md` → "Dependencies"). npm
//! packages are held to the licences `deny.toml` allows for crates. pnpm
//! prints the packages (`pnpm licenses list --json --prod`); this judges them.

use crate::Finding;

/// `deny.toml`'s `[licenses] allow` list.
pub fn allowed_licences(deny_toml: &str) -> Result<Vec<String>, String> {
    let table: toml::Table =
        toml::from_str(deny_toml).map_err(|error| format!("deny.toml does not parse: {error}"))?;
    table
        .get("licenses")
        .and_then(|licences| licences.get("allow"))
        .and_then(toml::Value::as_array)
        .ok_or("deny.toml has no [licenses] allow list")?
        .iter()
        .map(|licence| {
            licence
                .as_str()
                .map(str::to_owned)
                .ok_or_else(|| format!("deny.toml allows {licence}, which is not a string"))
        })
        .collect()
}

/// One finding per package whose licence expression the allowed list does
/// not satisfy, sorted by package. pnpm groups packages by expression.
pub fn check_licences(pnpm_json: &str, allowed: &[String]) -> Result<Vec<Finding>, String> {
    let value: serde_json::Value =
        serde_json::from_str(pnpm_json).map_err(|error| format!("is not JSON: {error}"))?;
    let groups = value
        .as_object()
        .ok_or("is not pnpm's object of licences")?;
    let mut findings = Vec::new();
    for (expression, packages) in groups {
        let packages = packages
            .as_array()
            .ok_or_else(|| format!("{expression} does not hold a list of packages"))?;
        let verdict = match satisfies(expression, allowed) {
            Some(true) => None,
            Some(false) => Some(format!(
                "is under {expression}, which deny.toml's allowed licences do not satisfy"
            )),
            None => Some(format!(
                "is under {expression}, which is not a licence expression the check can read"
            )),
        };
        for package in packages {
            let name = package
                .get("name")
                .and_then(serde_json::Value::as_str)
                .ok_or_else(|| format!("a package under {expression} has no name"))?;
            let Some(message) = &verdict else {
                continue;
            };
            let versions: Vec<&str> = package
                .get("versions")
                .and_then(serde_json::Value::as_array)
                .map_or_else(Vec::new, |versions| {
                    versions
                        .iter()
                        .filter_map(serde_json::Value::as_str)
                        .collect()
                });
            let at = format!("{name}@{}", versions.join(", "));
            findings.push(Finding::new("npm-licence", at, 0, message.clone()));
        }
    }
    findings.sort_by(|a, b| a.at.cmp(&b.at));
    Ok(findings)
}

/// Whether an SPDX expression (`OR`, `AND`, `WITH`, parentheses) holds with
/// only the allowed licences, or `None` when it does not parse.
fn satisfies(expression: &str, allowed: &[String]) -> Option<bool> {
    let spaced = expression.replace('(', " ( ").replace(')', " ) ");
    let tokens: Vec<&str> = spaced.split_whitespace().collect();
    let mut parser = Parser {
        tokens: &tokens,
        pos: 0,
        allowed,
    };
    let result = parser.or_expr()?;
    (parser.pos == tokens.len()).then_some(result)
}

struct Parser<'a> {
    tokens: &'a [&'a str],
    pos: usize,
    allowed: &'a [String],
}

impl Parser<'_> {
    fn eat(&mut self, token: &str) -> bool {
        let found = self.tokens.get(self.pos) == Some(&token);
        if found {
            self.pos += 1;
        }
        found
    }

    /// `a OR b OR …`
    fn or_expr(&mut self) -> Option<bool> {
        let mut result = self.and_expr()?;
        while self.eat("OR") {
            result |= self.and_expr()?;
        }
        Some(result)
    }

    /// `a AND b AND …`
    fn and_expr(&mut self) -> Option<bool> {
        let mut result = self.term()?;
        while self.eat("AND") {
            result &= self.term()?;
        }
        Some(result)
    }

    /// `( … )`, or a licence with an optional `WITH` exception.
    fn term(&mut self) -> Option<bool> {
        if self.eat("(") {
            let result = self.or_expr()?;
            return self.eat(")").then_some(result);
        }
        let mut licence = self.atom()?.to_owned();
        if self.eat("WITH") {
            licence = format!("{licence} WITH {}", self.atom()?);
        }
        Some(self.allowed.contains(&licence))
    }

    fn atom(&mut self) -> Option<&str> {
        let token = *self.tokens.get(self.pos)?;
        if matches!(token, "(" | ")" | "OR" | "AND" | "WITH") {
            return None;
        }
        self.pos += 1;
        Some(token)
    }
}
