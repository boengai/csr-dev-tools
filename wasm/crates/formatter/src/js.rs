pub fn format(input: &str, indent: u32, use_tabs: bool) -> String {
    if input.trim().is_empty() {
        return String::new();
    }

    let indent_str = if use_tabs {
        "\t".to_string()
    } else {
        " ".repeat(indent as usize)
    };

    let mut result = String::new();
    let mut depth: usize = 0;
    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();
    let mut i = 0;

    // Skip leading whitespace
    while i < len && (chars[i] == ' ' || chars[i] == '\t' || chars[i] == '\n' || chars[i] == '\r') {
        i += 1;
    }

    while i < len {
        let ch = chars[i];

        // Handle string literals
        if ch == '\'' || ch == '"' || ch == '`' {
            result.push(ch);
            i += 1;
            while i < len && chars[i] != ch {
                if chars[i] == '\\' && i + 1 < len {
                    result.push(chars[i]);
                    result.push(chars[i + 1]);
                    i += 2;
                } else {
                    result.push(chars[i]);
                    i += 1;
                }
            }
            if i < len {
                result.push(chars[i]);
                i += 1;
            }
            continue;
        }

        // Handle line comments
        if ch == '/' && i + 1 < len && chars[i + 1] == '/' {
            while i < len && chars[i] != '\n' {
                result.push(chars[i]);
                i += 1;
            }
            continue;
        }

        // Handle block comments
        if ch == '/' && i + 1 < len && chars[i + 1] == '*' {
            result.push('/');
            result.push('*');
            i += 2;
            while i < len {
                if chars[i] == '*' && i + 1 < len && chars[i + 1] == '/' {
                    result.push('*');
                    result.push('/');
                    i += 2;
                    break;
                }
                result.push(chars[i]);
                i += 1;
            }
            continue;
        }

        if ch == '{' {
            depth += 1;
            result.push_str(" {\n");
            for _ in 0..depth {
                result.push_str(&indent_str);
            }
            i += 1;
            // Skip whitespace after {
            while i < len && (chars[i] == ' ' || chars[i] == '\t' || chars[i] == '\n' || chars[i] == '\r') {
                i += 1;
            }
            continue;
        }

        if ch == '}' {
            if depth > 0 {
                depth -= 1;
            }
            // Remove trailing whitespace/indent before }
            let trimmed = result.trim_end().len();
            result.truncate(trimmed);
            result.push('\n');
            for _ in 0..depth {
                result.push_str(&indent_str);
            }
            result.push('}');
            result.push('\n');
            // Add indent for next line if there's more content
            i += 1;
            // Skip whitespace after }
            while i < len && (chars[i] == ' ' || chars[i] == '\t' || chars[i] == '\n' || chars[i] == '\r') {
                i += 1;
            }
            if i < len {
                for _ in 0..depth {
                    result.push_str(&indent_str);
                }
            }
            continue;
        }

        if ch == ';' {
            result.push(';');
            i += 1;
            // Skip whitespace after ;
            while i < len && (chars[i] == ' ' || chars[i] == '\t' || chars[i] == '\n' || chars[i] == '\r') {
                i += 1;
            }
            // If next char is not } and not end, add newline + indent
            if i < len && chars[i] != '}' {
                result.push('\n');
                for _ in 0..depth {
                    result.push_str(&indent_str);
                }
            }
            continue;
        }

        // Collapse whitespace
        if ch == ' ' || ch == '\t' || ch == '\n' || ch == '\r' {
            // Emit a single space
            if !result.is_empty() && !result.ends_with(' ') && !result.ends_with('\n') && !result.ends_with('\t') {
                result.push(' ');
            }
            i += 1;
            while i < len && (chars[i] == ' ' || chars[i] == '\t' || chars[i] == '\n' || chars[i] == '\r') {
                i += 1;
            }
            continue;
        }

        result.push(ch);
        i += 1;
    }

    // Trim trailing whitespace
    let trimmed = result.trim_end().to_string();
    trimmed
}

pub fn minify(input: &str) -> String {
    if input.trim().is_empty() {
        return String::new();
    }

    let mut result = String::new();
    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        let ch = chars[i];

        // Handle single-quoted strings
        if ch == '\'' {
            result.push(ch);
            i += 1;
            while i < len && chars[i] != '\'' {
                if chars[i] == '\\' && i + 1 < len {
                    result.push(chars[i]);
                    result.push(chars[i + 1]);
                    i += 2;
                } else {
                    result.push(chars[i]);
                    i += 1;
                }
            }
            if i < len {
                result.push(chars[i]);
                i += 1;
            }
            continue;
        }

        // Handle double-quoted strings
        if ch == '"' {
            result.push(ch);
            i += 1;
            while i < len && chars[i] != '"' {
                if chars[i] == '\\' && i + 1 < len {
                    result.push(chars[i]);
                    result.push(chars[i + 1]);
                    i += 2;
                } else {
                    result.push(chars[i]);
                    i += 1;
                }
            }
            if i < len {
                result.push(chars[i]);
                i += 1;
            }
            continue;
        }

        // Handle line comments - strip them
        if ch == '/' && i + 1 < len && chars[i + 1] == '/' {
            i += 2;
            while i < len && chars[i] != '\n' {
                i += 1;
            }
            continue;
        }

        // Handle block comments - strip them
        if ch == '/' && i + 1 < len && chars[i + 1] == '*' {
            i += 2;
            while i < len {
                if chars[i] == '*' && i + 1 < len && chars[i + 1] == '/' {
                    i += 2;
                    break;
                }
                i += 1;
            }
            continue;
        }

        // Replace newlines with spaces
        if ch == '\n' || ch == '\r' {
            result.push(' ');
            i += 1;
            continue;
        }

        result.push(ch);
        i += 1;
    }

    // Collapse multiple spaces
    let mut collapsed = String::with_capacity(result.len());
    let mut prev_space = false;
    for ch in result.chars() {
        if ch == ' ' {
            if !prev_space {
                collapsed.push(' ');
            }
            prev_space = true;
        } else {
            prev_space = false;
            collapsed.push(ch);
        }
    }

    collapsed.trim().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_basic_function() {
        let result = format("function foo(){return 1}", 2, false);
        println!("format result: {:?}", result);
        assert!(result.contains("  return 1"), "Expected '  return 1' in: {}", result);
    }

    #[test]
    fn test_format_empty() {
        assert_eq!(format("", 2, false), "");
    }

    #[test]
    fn test_minify_strips_line_comment() {
        let result = minify("var a = 1; // comment\nvar b = 2;");
        println!("minify result: {:?}", result);
        assert!(!result.contains("comment"), "Should not contain 'comment' in: {}", result);
    }

    #[test]
    fn test_minify_strips_block_comment() {
        let result = minify("/* block */var a = 1;");
        println!("minify result: {:?}", result);
        assert!(!result.contains("block"), "Should not contain 'block' in: {}", result);
    }

    #[test]
    fn test_minify_empty() {
        assert_eq!(minify(""), "");
    }

    #[test]
    fn test_minify_preserves_double_quoted_url() {
        let result = minify("var url = \"http://example.com\";");
        println!("minify result: {:?}", result);
        assert!(result.contains("\"http://example.com\""), "Should contain URL in: {}", result);
    }

    #[test]
    fn test_minify_preserves_single_quoted_fake_comment() {
        let result = minify("var s = '/* not a comment */';");
        println!("minify result: {:?}", result);
        assert!(result.contains("'/* not a comment */'"), "Should contain fake comment in: {}", result);
    }

    #[test]
    fn test_minify_replaces_newlines_with_spaces() {
        let result = minify("var a = 1;\nvar b = 2;");
        println!("minify result: {:?}", result);
        assert!(result.contains("var a = 1; var b = 2;"), "Should join lines in: {}", result);
    }
}
