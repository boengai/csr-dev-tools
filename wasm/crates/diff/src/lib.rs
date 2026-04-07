use wasm_bindgen::prelude::*;

mod myers;
mod types;

/// Compute line-level diff between two texts.
/// Returns a JSON array of {added: bool, removed: bool, value: string}.
#[wasm_bindgen]
pub fn diff_lines(old: &str, new: &str) -> JsValue {
    let changes = myers::diff(old, new);
    serde_wasm_bindgen::to_value(&changes).unwrap()
}

/// Compute word-level diff between two strings.
/// Returns a JSON array of {added: bool, removed: bool, value: string}.
#[wasm_bindgen]
pub fn diff_words(old_line: &str, new_line: &str) -> JsValue {
    let changes = myers::diff_words_fn(old_line, new_line);
    serde_wasm_bindgen::to_value(&changes).unwrap()
}

/// Create unified diff format string.
#[wasm_bindgen]
pub fn create_unified_diff(old: &str, new: &str, context: u32) -> String {
    myers::create_unified_diff(old, new, context)
}

#[cfg(test)]
mod tests {
    use super::myers;

    #[test]
    fn integration_diff_lines() {
        let changes = myers::diff("a\nb\nc\n", "a\nx\nc\n");
        assert!(changes.iter().any(|c| c.removed));
        assert!(changes.iter().any(|c| c.added));
        assert!(changes.iter().any(|c| !c.added && !c.removed));
    }

    #[test]
    fn integration_diff_words() {
        let changes = myers::diff_words_fn("hello world", "hello earth");
        // Should have: "hello " (equal), "world" (removed), "earth" (added)
        let removed: Vec<_> = changes.iter().filter(|c| c.removed).collect();
        let added: Vec<_> = changes.iter().filter(|c| c.added).collect();
        assert!(!removed.is_empty());
        assert!(!added.is_empty());
    }

    #[test]
    fn integration_unified_diff() {
        let result = myers::create_unified_diff("hello\n", "world\n", 3);
        assert!(result.contains("---"));
        assert!(result.contains("+++"));
        assert!(result.contains("@@"));
    }

    #[test]
    fn integration_empty_inputs() {
        let changes = myers::diff("", "");
        assert!(changes.is_empty());
    }

    #[test]
    fn integration_multiline_partial() {
        let original = "line1\nline2\nline3\nline4\n";
        let modified = "line1\nmodified\nline3\nline4\nnew line\n";
        let result = myers::diff(original, modified);
        assert!(result.len() > 1);
    }
}
