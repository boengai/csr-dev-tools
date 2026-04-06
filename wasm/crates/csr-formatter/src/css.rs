pub fn format(input: &str, indent: u32, use_tabs: bool) -> String {
    if input.trim().is_empty() {
        return String::new();
    }

    let indent_str: String = if use_tabs {
        "\t".to_string()
    } else {
        " ".repeat(indent as usize)
    };

    let mut result = String::with_capacity(input.len() * 2);
    let mut depth: usize = 0;
    let mut in_string: Option<char> = None;
    let mut in_comment = false;
    let mut in_line_start = true; // tracks if we're at the start of a line (for collapsing whitespace)
    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        let c = chars[i];

        // Handle string literals
        if let Some(quote) = in_string {
            result.push(c);
            if c == '\\' && i + 1 < len {
                i += 1;
                result.push(chars[i]);
            } else if c == quote {
                in_string = None;
            }
            i += 1;
            continue;
        }

        // Check for comment start
        if c == '/' && i + 1 < len && chars[i + 1] == '*' {
            in_comment = true;
            i += 2;
            continue;
        }

        // Check for comment end
        if in_comment {
            if c == '*' && i + 1 < len && chars[i + 1] == '/' {
                in_comment = false;
                i += 2;
            } else {
                i += 1;
            }
            continue;
        }

        // String start
        if c == '"' || c == '\'' {
            in_string = Some(c);
            if in_line_start {
                in_line_start = false;
            }
            result.push(c);
            i += 1;
            continue;
        }

        // Whitespace collapsing
        if c.is_whitespace() {
            i += 1;
            // Skip all contiguous whitespace
            while i < len && chars[i].is_whitespace() {
                i += 1;
            }
            // Only emit a single space if we're not at line start and not before/after structural chars
            if !in_line_start && !result.is_empty() {
                // Peek at next char - don't emit space before { } ; :
                if i < len {
                    let next = chars[i];
                    if next != '{' && next != '}' && next != ';' && next != ':' {
                        result.push(' ');
                    }
                }
            }
            continue;
        }

        in_line_start = false;

        match c {
            '{' => {
                // Trim trailing whitespace from result before emitting
                let trimmed_len = result.trim_end().len();
                result.truncate(trimmed_len);
                depth += 1;
                result.push_str(" {\n");
                for _ in 0..depth {
                    result.push_str(&indent_str);
                }
                in_line_start = true;
            }
            '}' => {
                // Trim trailing whitespace
                let trimmed_len = result.trim_end().len();
                result.truncate(trimmed_len);
                if depth > 0 {
                    depth -= 1;
                }
                result.push('\n');
                for _ in 0..depth {
                    result.push_str(&indent_str);
                }
                result.push_str("}\n");
                if depth > 0 {
                    for _ in 0..depth {
                        result.push_str(&indent_str);
                    }
                }
                in_line_start = true;
            }
            ';' => {
                result.push_str(";\n");
                for _ in 0..depth {
                    result.push_str(&indent_str);
                }
                in_line_start = true;
            }
            ':' => {
                // Property context: emit ": "
                result.push_str(": ");
            }
            _ => {
                result.push(c);
            }
        }

        i += 1;
    }

    // Trim trailing whitespace/newlines, then add final newline
    let trimmed = result.trim_end();
    if trimmed.is_empty() {
        String::new()
    } else {
        let mut final_result = trimmed.to_string();
        final_result.push('\n');
        final_result
    }
}

pub fn minify(input: &str) -> String {
    if input.trim().is_empty() {
        return String::new();
    }

    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();
    let mut result = String::with_capacity(len);
    let mut i = 0;
    let mut in_string: Option<char> = None;

    while i < len {
        let c = chars[i];

        // Handle string literals - preserve them exactly
        if let Some(quote) = in_string {
            result.push(c);
            if c == '\\' && i + 1 < len {
                i += 1;
                result.push(chars[i]);
            } else if c == quote {
                in_string = None;
            }
            i += 1;
            continue;
        }

        // Strip /* */ comments
        if c == '/' && i + 1 < len && chars[i + 1] == '*' {
            i += 2;
            while i + 1 < len && !(chars[i] == '*' && chars[i + 1] == '/') {
                i += 1;
            }
            if i + 1 < len {
                i += 2; // skip */
            }
            continue;
        }

        // String start
        if c == '"' || c == '\'' {
            in_string = Some(c);
            result.push(c);
            i += 1;
            continue;
        }

        // Collapse whitespace
        if c.is_whitespace() {
            i += 1;
            while i < len && chars[i].is_whitespace() {
                i += 1;
            }
            // Only emit space if needed (not around structural chars)
            if !result.is_empty() && i < len {
                let last = result.chars().last().unwrap();
                let next = chars[i];
                let structural = ['{', '}', ':', ';', ','];
                if !structural.contains(&last) && !structural.contains(&next) {
                    result.push(' ');
                }
            }
            continue;
        }

        result.push(c);
        i += 1;
    }

    // Remove trailing ; before }
    let mut final_result = String::with_capacity(result.len());
    let result_chars: Vec<char> = result.chars().collect();
    let rlen = result_chars.len();
    let mut j = 0;
    while j < rlen {
        if result_chars[j] == ';' {
            // Look ahead past whitespace for }
            let mut k = j + 1;
            while k < rlen && result_chars[k].is_whitespace() {
                k += 1;
            }
            if k < rlen && result_chars[k] == '}' {
                // Skip the semicolon
                j += 1;
                continue;
            }
        }
        final_result.push(result_chars[j]);
        j += 1;
    }

    final_result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_basic() {
        let result = format("body{color:red;margin:0}", 2, false);
        assert!(
            result.contains("  color: red;"),
            "Expected '  color: red;' in:\n{}",
            result
        );
    }

    #[test]
    fn test_format_indent_4() {
        let result = format("body{color:red}", 4, false);
        assert!(
            result.contains("    color: red"),
            "Expected '    color: red' in:\n{}",
            result
        );
    }

    #[test]
    fn test_format_empty() {
        assert_eq!(format("", 2, false), "");
    }

    #[test]
    fn test_minify_basic() {
        let result = minify("body {\n  color: red;\n  margin: 0;\n}");
        assert_eq!(result, "body{color:red;margin:0}");
    }

    #[test]
    fn test_minify_strips_comments() {
        let result = minify("/* comment */body { color: red; }");
        assert!(
            !result.contains("comment"),
            "Should not contain 'comment', got: {}",
            result
        );
    }

    #[test]
    fn test_minify_empty() {
        assert_eq!(minify(""), "");
    }

    #[test]
    fn test_minify_preserves_string_with_braces() {
        let result = minify(".foo { content: \"hello { world }\"; }");
        assert!(
            result.contains("\"hello { world }\""),
            "Should contain '\"hello {{ world }}\"', got: {}",
            result
        );
    }

    #[test]
    fn test_minify_preserves_url_string() {
        let result = minify(".bar { background: url(\"data:image/svg+xml;base64,abc\"); }");
        assert!(
            result.contains("\"data:image/svg+xml;base64,abc\""),
            "Should contain URL string, got: {}",
            result
        );
    }
}
