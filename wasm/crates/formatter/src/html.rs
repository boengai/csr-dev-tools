const VOID_ELEMENTS: &[&str] = &[
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param",
    "source", "track", "wbr",
];

fn is_void_element(tag: &str) -> bool {
    let name = tag.split_whitespace().next().unwrap_or("");
    VOID_ELEMENTS.contains(&name.to_lowercase().as_str())
}

/// Extract the tag name from a tag string like "div class=\"foo\"" -> "div"
fn tag_name(tag_content: &str) -> &str {
    let trimmed = tag_content.trim();
    // Handle closing tags: "/div" -> "div"
    let s = if trimmed.starts_with('/') {
        &trimmed[1..]
    } else {
        trimmed
    };
    s.split(|c: char| c.is_whitespace() || c == '/' || c == '>')
        .next()
        .unwrap_or("")
}

#[derive(Debug)]
enum Token {
    OpenTag(String),      // e.g. <div class="foo">
    CloseTag(String),     // e.g. </div>
    SelfClosing(String),  // e.g. <br />
    Comment(String),      // e.g. <!-- comment -->
    Text(String),
}

fn tokenize(input: &str) -> Vec<Token> {
    let mut tokens = Vec::new();
    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        if chars[i] == '<' {
            // Check for comment
            if i + 3 < len && chars[i + 1] == '!' && chars[i + 2] == '-' && chars[i + 3] == '-' {
                // Find end of comment
                if let Some(end) = find_comment_end(&chars, i + 4) {
                    let comment: String = chars[i..end].iter().collect();
                    tokens.push(Token::Comment(comment));
                    i = end;
                    continue;
                }
            }

            // Find the closing >
            if let Some(close) = find_tag_end(&chars, i + 1) {
                let tag_str: String = chars[i..=close].iter().collect();
                let inner: String = chars[i + 1..close].iter().collect();
                let inner_trimmed = inner.trim();

                if inner_trimmed.starts_with('/') {
                    tokens.push(Token::CloseTag(tag_str));
                } else if inner_trimmed.ends_with('/') || is_void_element(inner_trimmed) {
                    tokens.push(Token::SelfClosing(tag_str));
                } else {
                    tokens.push(Token::OpenTag(tag_str));
                }
                i = close + 1;
            } else {
                // No closing >, treat as text
                tokens.push(Token::Text(chars[i].to_string()));
                i += 1;
            }
        } else {
            // Collect text until next <
            let start = i;
            while i < len && chars[i] != '<' {
                i += 1;
            }
            let text: String = chars[start..i].iter().collect();
            tokens.push(Token::Text(text));
        }
    }

    tokens
}

fn find_comment_end(chars: &[char], start: usize) -> Option<usize> {
    let len = chars.len();
    let mut i = start;
    while i + 2 < len {
        if chars[i] == '-' && chars[i + 1] == '-' && chars[i + 2] == '>' {
            return Some(i + 3);
        }
        i += 1;
    }
    None
}

fn find_tag_end(chars: &[char], start: usize) -> Option<usize> {
    let len = chars.len();
    let mut i = start;
    let mut in_quote = false;
    let mut quote_char = '"';

    while i < len {
        if in_quote {
            if chars[i] == quote_char {
                in_quote = false;
            }
        } else {
            match chars[i] {
                '"' | '\'' => {
                    in_quote = true;
                    quote_char = chars[i];
                }
                '>' => return Some(i),
                _ => {}
            }
        }
        i += 1;
    }
    None
}

pub fn format(input: &str, indent: u32, use_tabs: bool) -> String {
    if input.trim().is_empty() {
        return String::new();
    }

    let indent_str = if use_tabs {
        "\t".repeat(1)
    } else {
        " ".repeat(indent as usize)
    };

    let tokens = tokenize(input);
    let mut result = String::new();
    let mut depth: usize = 0;

    for token in &tokens {
        match token {
            Token::OpenTag(tag) => {
                let inner = &tag[1..tag.len() - 1];
                let name = tag_name(inner);
                if !result.is_empty() {
                    result.push('\n');
                }
                for _ in 0..depth {
                    result.push_str(&indent_str);
                }
                result.push_str(tag);
                if !is_void_element(name) {
                    depth += 1;
                }
            }
            Token::CloseTag(tag) => {
                if depth > 0 {
                    depth -= 1;
                }
                if !result.is_empty() {
                    result.push('\n');
                }
                for _ in 0..depth {
                    result.push_str(&indent_str);
                }
                result.push_str(tag);
            }
            Token::SelfClosing(tag) => {
                if !result.is_empty() {
                    result.push('\n');
                }
                for _ in 0..depth {
                    result.push_str(&indent_str);
                }
                result.push_str(tag);
            }
            Token::Comment(comment) => {
                if !result.is_empty() {
                    result.push('\n');
                }
                for _ in 0..depth {
                    result.push_str(&indent_str);
                }
                result.push_str(comment);
            }
            Token::Text(text) => {
                let trimmed = text.trim();
                if !trimmed.is_empty() {
                    if !result.is_empty() {
                        result.push('\n');
                    }
                    for _ in 0..depth {
                        result.push_str(&indent_str);
                    }
                    result.push_str(trimmed);
                }
            }
        }
    }

    result
}

const WHITESPACE_SENSITIVE_TAGS: &[&str] = &["pre", "script", "style", "code"];

pub fn minify(input: &str) -> String {
    if input.trim().is_empty() {
        return String::new();
    }

    let mut result = input.to_string();

    // Step 1: Preserve whitespace-sensitive blocks with placeholders
    let mut preserved: Vec<String> = Vec::new();

    for &tag in WHITESPACE_SENSITIVE_TAGS {
        loop {
            let open_tag = format!("<{}", tag);
            let close_tag = format!("</{}>", tag);

            let open_pos = result.to_lowercase().find(&open_tag);
            if open_pos.is_none() {
                break;
            }
            let open_pos = open_pos.unwrap();

            // Find the end of the opening tag
            let tag_end = result[open_pos..].find('>');
            if tag_end.is_none() {
                break;
            }

            let close_pos = result.to_lowercase().find(&close_tag);
            if close_pos.is_none() {
                break;
            }
            let close_pos = close_pos.unwrap();

            let block_end = close_pos + close_tag.len();
            let block = result[open_pos..block_end].to_string();
            let placeholder = format!("\x00PRESERVE_{}\x00", preserved.len());
            preserved.push(block);
            result = format!("{}{}{}", &result[..open_pos], placeholder, &result[block_end..]);
        }
    }

    // Step 2: Remove HTML comments
    loop {
        if let Some(start) = result.find("<!--") {
            if let Some(end) = result[start..].find("-->") {
                result = format!("{}{}", &result[..start], &result[start + end + 3..]);
                continue;
            }
        }
        break;
    }

    // Step 3: Collapse all whitespace runs to a single space
    let mut collapsed = String::with_capacity(result.len());
    let mut prev_ws = false;
    for ch in result.chars() {
        if ch.is_whitespace() {
            if !prev_ws {
                collapsed.push(' ');
            }
            prev_ws = true;
        } else {
            collapsed.push(ch);
            prev_ws = false;
        }
    }
    result = collapsed.trim().to_string();

    // Step 4: Remove whitespace between > and <
    let mut cleaned = String::with_capacity(result.len());
    let chars: Vec<char> = result.chars().collect();
    let len = chars.len();
    let mut i = 0;
    while i < len {
        cleaned.push(chars[i]);
        if chars[i] == '>' {
            // Skip whitespace until next <
            let mut j = i + 1;
            while j < len && chars[j].is_whitespace() {
                j += 1;
            }
            if j < len && chars[j] == '<' {
                i = j;
            } else {
                i += 1;
            }
        } else {
            i += 1;
        }
    }
    result = cleaned;

    // Step 5: Collapse multiple spaces between attributes inside tags
    // We need to handle spaces inside tags but outside of quoted attribute values
    let mut tag_cleaned = String::with_capacity(result.len());
    let chars: Vec<char> = result.chars().collect();
    let len = chars.len();
    let mut i = 0;
    let mut in_tag = false;
    let mut in_quote = false;
    let mut quote_char = '"';

    while i < len {
        let ch = chars[i];

        if !in_tag && ch == '<' && !is_placeholder_at(&chars, i) {
            in_tag = true;
            tag_cleaned.push(ch);
            i += 1;
            continue;
        }

        if in_tag && !in_quote && ch == '>' {
            in_tag = false;
            tag_cleaned.push(ch);
            i += 1;
            continue;
        }

        if in_tag {
            if in_quote {
                tag_cleaned.push(ch);
                if ch == quote_char {
                    in_quote = false;
                }
            } else if ch == '"' || ch == '\'' {
                in_quote = true;
                quote_char = ch;
                tag_cleaned.push(ch);
            } else if ch == ' ' {
                tag_cleaned.push(' ');
                // Skip additional spaces
                while i + 1 < len && chars[i + 1] == ' ' {
                    i += 1;
                }
            } else {
                tag_cleaned.push(ch);
            }
        } else {
            tag_cleaned.push(ch);
        }

        i += 1;
    }
    result = tag_cleaned;

    // Step 6: Restore preserved blocks
    for (idx, block) in preserved.iter().enumerate() {
        let placeholder = format!("\x00PRESERVE_{}\x00", idx);
        result = result.replace(&placeholder, block);
    }

    result
}

fn is_placeholder_at(_chars: &[char], _pos: usize) -> bool {
    // Placeholders start with \x00, regular tags start with <
    // This is just to differentiate, but since placeholders don't start with <, this won't be called for them
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_basic_nesting() {
        let result = format("<div><p>hello</p></div>", 2, false);
        println!("format basic:\n{}", result);
        assert!(result.contains("  <p>"));
    }

    #[test]
    fn test_format_indent_4() {
        let result = format("<div><p>hello</p></div>", 4, false);
        println!("format indent 4:\n{}", result);
        assert!(result.contains("    <p>"));
    }

    #[test]
    fn test_format_tabs() {
        let result = format("<div><p>hello</p></div>", 1, true);
        println!("format tabs:\n{}", result);
        assert!(result.contains("\t<p>"));
    }

    #[test]
    fn test_format_empty() {
        assert_eq!(format("", 2, false), "");
    }

    #[test]
    fn test_format_whitespace_only() {
        assert_eq!(format("   ", 2, false), "");
    }

    #[test]
    fn test_minify_basic() {
        let result = minify("<div>\n  <p>hello</p>\n</div>");
        println!("minify basic: {}", result);
        assert_eq!(result, "<div><p>hello</p></div>");
    }

    #[test]
    fn test_minify_removes_comments() {
        let result = minify("<div><!-- comment --><p>hi</p></div>");
        println!("minify comments: {}", result);
        assert_eq!(result, "<div><p>hi</p></div>");
    }

    #[test]
    fn test_minify_empty() {
        assert_eq!(minify(""), "");
    }

    #[test]
    fn test_minify_preserves_pre() {
        let result = minify("<div>\n  <pre>\n    code here\n  </pre>\n</div>");
        println!("minify pre: {}", result);
        assert!(result.contains("<pre>\n    code here\n  </pre>"));
    }

    #[test]
    fn test_minify_preserves_script() {
        let result = minify("<div>\n  <script>\n    const x = 1;\n  </script>\n</div>");
        println!("minify script: {}", result);
        assert!(result.contains("<script>\n    const x = 1;\n  </script>"));
    }

    #[test]
    fn test_minify_preserves_style() {
        let result = minify("<div>\n  <style>\n    .foo { color: red; }\n  </style>\n</div>");
        println!("minify style: {}", result);
        assert!(result.contains("<style>\n    .foo { color: red; }\n  </style>"));
    }

    #[test]
    fn test_minify_preserves_code() {
        let result = minify("<div>\n  <code>  spaced  text  </code>\n</div>");
        println!("minify code: {}", result);
        assert!(result.contains("<code>  spaced  text  </code>"));
    }

    #[test]
    fn test_minify_self_closing_tags() {
        let result = minify("<div>\n  <br />\n  <img src=\"test.png\" />\n</div>");
        println!("minify self-closing: {}", result);
        assert!(result.contains("<br />"));
        assert!(result.contains("<img src=\"test.png\" />"));
    }

    #[test]
    fn test_minify_collapses_attribute_spaces() {
        let result =
            minify("<div class=\"foo bar\"  data-x=\"hello\">\n  <p>hi</p>\n</div>");
        println!("minify attrs: {}", result);
        assert_eq!(
            result,
            "<div class=\"foo bar\" data-x=\"hello\"><p>hi</p></div>"
        );
    }
}
