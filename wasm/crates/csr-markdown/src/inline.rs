/// Inline-level AST nodes for markdown.
#[derive(Debug, Clone, PartialEq)]
pub enum Inline {
    Text(String),
    Strong(Vec<Inline>),
    Emphasis(Vec<Inline>),
    Code(String),
    Link {
        text: Vec<Inline>,
        url: String,
        title: Option<String>,
    },
    Image {
        alt: String,
        src: String,
    },
    LineBreak,
    Strikethrough(Vec<Inline>),
    Html(String),
}

/// Parse inline markdown elements from text content.
///
/// Parsing priority: code spans > strikethrough > images > links > autolinks > strong > emphasis > hard line breaks > text
pub fn parse_inline(input: &str) -> Vec<Inline> {
    let mut result: Vec<Inline> = Vec::new();
    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();
    let mut i = 0;
    let mut text_buf = String::new();

    while i < len {
        // Code span (highest priority)
        if chars[i] == '`' {
            if !text_buf.is_empty() {
                result.push(Inline::Text(text_buf.clone()));
                text_buf.clear();
            }
            if let Some((code, next)) = parse_code_span(&chars, i) {
                result.push(Inline::Code(code));
                i = next;
                continue;
            }
        }

        // Strikethrough ~~
        if i + 1 < len && chars[i] == '~' && chars[i + 1] == '~' {
            if let Some((content, next)) = find_delimited(&chars, i, "~~", "~~") {
                if !text_buf.is_empty() {
                    result.push(Inline::Text(text_buf.clone()));
                    text_buf.clear();
                }
                let inner = parse_inline(&content);
                result.push(Inline::Strikethrough(inner));
                i = next;
                continue;
            }
        }

        // Image ![alt](src)
        if i + 1 < len && chars[i] == '!' && chars[i + 1] == '[' {
            if let Some((alt, src, next)) = parse_image_or_link(&chars, i + 1, true) {
                if !text_buf.is_empty() {
                    result.push(Inline::Text(text_buf.clone()));
                    text_buf.clear();
                }
                result.push(Inline::Image { alt, src });
                i = next;
                continue;
            }
        }

        // Link [text](url)
        if chars[i] == '[' {
            if let Some((text, url, next)) = parse_image_or_link(&chars, i, false) {
                if !text_buf.is_empty() {
                    result.push(Inline::Text(text_buf.clone()));
                    text_buf.clear();
                }
                let inner = parse_inline(&text);
                result.push(Inline::Link {
                    text: inner,
                    url,
                    title: None,
                });
                i = next;
                continue;
            }
        }

        // Autolink <url>
        if chars[i] == '<' {
            if let Some((url, next)) = parse_autolink(&chars, i) {
                if !text_buf.is_empty() {
                    result.push(Inline::Text(text_buf.clone()));
                    text_buf.clear();
                }
                let display = parse_inline(&url);
                result.push(Inline::Link {
                    text: display,
                    url: url.clone(),
                    title: None,
                });
                i = next;
                continue;
            }
        }

        // Strong ** or __
        if i + 1 < len && chars[i] == '*' && chars[i + 1] == '*' {
            if let Some((content, next)) = find_delimited(&chars, i, "**", "**") {
                if !text_buf.is_empty() {
                    result.push(Inline::Text(text_buf.clone()));
                    text_buf.clear();
                }
                let inner = parse_inline(&content);
                result.push(Inline::Strong(inner));
                i = next;
                continue;
            }
        }
        if i + 1 < len && chars[i] == '_' && chars[i + 1] == '_' {
            if let Some((content, next)) = find_delimited(&chars, i, "__", "__") {
                if !text_buf.is_empty() {
                    result.push(Inline::Text(text_buf.clone()));
                    text_buf.clear();
                }
                let inner = parse_inline(&content);
                result.push(Inline::Strong(inner));
                i = next;
                continue;
            }
        }

        // Emphasis * or _
        if chars[i] == '*' {
            if let Some((content, next)) = find_delimited(&chars, i, "*", "*") {
                if !text_buf.is_empty() {
                    result.push(Inline::Text(text_buf.clone()));
                    text_buf.clear();
                }
                let inner = parse_inline(&content);
                result.push(Inline::Emphasis(inner));
                i = next;
                continue;
            }
        }
        if chars[i] == '_' {
            if let Some((content, next)) = find_delimited(&chars, i, "_", "_") {
                if !text_buf.is_empty() {
                    result.push(Inline::Text(text_buf.clone()));
                    text_buf.clear();
                }
                let inner = parse_inline(&content);
                result.push(Inline::Emphasis(inner));
                i = next;
                continue;
            }
        }

        // Hard line break: trailing two spaces or backslash before newline
        if chars[i] == '\\' && i + 1 < len && chars[i + 1] == '\n' {
            if !text_buf.is_empty() {
                result.push(Inline::Text(text_buf.clone()));
                text_buf.clear();
            }
            result.push(Inline::LineBreak);
            i += 2;
            continue;
        }
        if chars[i] == ' ' && i + 1 < len && chars[i + 1] == ' ' {
            // Check if followed by newline
            let mut j = i + 2;
            while j < len && chars[j] == ' ' {
                j += 1;
            }
            if j < len && chars[j] == '\n' {
                if !text_buf.is_empty() {
                    result.push(Inline::Text(text_buf.clone()));
                    text_buf.clear();
                }
                result.push(Inline::LineBreak);
                i = j + 1;
                continue;
            }
        }

        // Default: accumulate text
        text_buf.push(chars[i]);
        i += 1;
    }

    if !text_buf.is_empty() {
        result.push(Inline::Text(text_buf));
    }

    result
}

fn parse_code_span(chars: &[char], start: usize) -> Option<(String, usize)> {
    let len = chars.len();
    // Count opening backticks
    let mut ticks = 0;
    let mut i = start;
    while i < len && chars[i] == '`' {
        ticks += 1;
        i += 1;
    }
    // Find matching closing backticks
    let mut j = i;
    while j < len {
        if chars[j] == '`' {
            let mut close_ticks = 0;
            let close_start = j;
            while j < len && chars[j] == '`' {
                close_ticks += 1;
                j += 1;
            }
            if close_ticks == ticks {
                let content: String = chars[i..close_start].iter().collect();
                // Trim single leading/trailing space if content has them
                let trimmed = if content.starts_with(' ')
                    && content.ends_with(' ')
                    && content.len() > 1
                {
                    &content[1..content.len() - 1]
                } else {
                    &content
                };
                return Some((trimmed.to_string(), j));
            }
        } else {
            j += 1;
        }
    }
    None
}

fn find_delimited(
    chars: &[char],
    start: usize,
    open: &str,
    close: &str,
) -> Option<(String, usize)> {
    let open_chars: Vec<char> = open.chars().collect();
    let close_chars: Vec<char> = close.chars().collect();
    let len = chars.len();

    // Verify opening delimiter
    if start + open_chars.len() > len {
        return None;
    }
    for (k, &oc) in open_chars.iter().enumerate() {
        if chars[start + k] != oc {
            return None;
        }
    }

    let content_start = start + open_chars.len();
    let mut i = content_start;

    while i + close_chars.len() <= len {
        let mut matches = true;
        for (k, &cc) in close_chars.iter().enumerate() {
            if chars[i + k] != cc {
                matches = false;
                break;
            }
        }
        if matches && i > content_start {
            let content: String = chars[content_start..i].iter().collect();
            return Some((content, i + close_chars.len()));
        }
        i += 1;
    }
    None
}

fn parse_image_or_link(
    chars: &[char],
    start: usize,
    is_image: bool,
) -> Option<(String, String, usize)> {
    let len = chars.len();
    if start >= len || chars[start] != '[' {
        return None;
    }

    // Find closing ]
    let mut depth = 0;
    let mut i = start + 1;
    let mut text_end = None;
    while i < len {
        if chars[i] == '[' {
            depth += 1;
        } else if chars[i] == ']' {
            if depth == 0 {
                text_end = Some(i);
                break;
            }
            depth -= 1;
        }
        i += 1;
    }
    let text_end = text_end?;

    // Must be followed by (
    if text_end + 1 >= len || chars[text_end + 1] != '(' {
        return None;
    }

    // Find closing )
    let url_start = text_end + 2;
    let mut paren_depth = 0;
    let mut j = url_start;
    let mut url_end = None;
    while j < len {
        if chars[j] == '(' {
            paren_depth += 1;
        } else if chars[j] == ')' {
            if paren_depth == 0 {
                url_end = Some(j);
                break;
            }
            paren_depth -= 1;
        }
        j += 1;
    }
    let url_end = url_end?;

    let text: String = chars[start + 1..text_end].iter().collect();
    let url: String = chars[url_start..url_end].iter().collect();

    let advance = if is_image {
        url_end + 1 // after the closing )
    } else {
        url_end + 1
    };

    Some((text, url, advance))
}

fn parse_autolink(chars: &[char], start: usize) -> Option<(String, usize)> {
    if chars[start] != '<' {
        return None;
    }
    let mut i = start + 1;
    let len = chars.len();
    while i < len && chars[i] != '>' && chars[i] != ' ' && chars[i] != '\n' {
        i += 1;
    }
    if i >= len || chars[i] != '>' {
        return None;
    }
    let content: String = chars[start + 1..i].iter().collect();
    // Must look like a URL
    if content.contains("://") || content.contains('@') {
        Some((content, i + 1))
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plain_text() {
        let result = parse_inline("Hello world");
        assert_eq!(result, vec![Inline::Text("Hello world".to_string())]);
    }

    #[test]
    fn test_strong() {
        let result = parse_inline("**bold**");
        assert_eq!(
            result,
            vec![Inline::Strong(vec![Inline::Text("bold".to_string())])]
        );
    }

    #[test]
    fn test_emphasis() {
        let result = parse_inline("*italic*");
        assert_eq!(
            result,
            vec![Inline::Emphasis(vec![Inline::Text("italic".to_string())])]
        );
    }

    #[test]
    fn test_inline_code() {
        let result = parse_inline("`code`");
        assert_eq!(result, vec![Inline::Code("code".to_string())]);
    }

    #[test]
    fn test_link() {
        let result = parse_inline("[text](https://example.com)");
        assert_eq!(
            result,
            vec![Inline::Link {
                text: vec![Inline::Text("text".to_string())],
                url: "https://example.com".to_string(),
                title: None,
            }]
        );
    }

    #[test]
    fn test_image() {
        let result = parse_inline("![alt](image.png)");
        assert_eq!(
            result,
            vec![Inline::Image {
                alt: "alt".to_string(),
                src: "image.png".to_string(),
            }]
        );
    }

    #[test]
    fn test_strikethrough() {
        let result = parse_inline("~~text~~");
        assert_eq!(
            result,
            vec![Inline::Strikethrough(vec![Inline::Text(
                "text".to_string()
            )])]
        );
    }
}
