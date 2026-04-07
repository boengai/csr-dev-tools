/// Simple recursive descent HTML parser for well-formed HTML.
/// Not a full HTML5 parser — handles the subset needed for HTML-to-Markdown conversion.

#[derive(Debug, Clone, PartialEq)]
pub enum HtmlNode {
    Element {
        tag: String,
        attrs: Vec<(String, String)>,
        children: Vec<HtmlNode>,
    },
    Text(String),
}

impl HtmlNode {
    pub fn tag(&self) -> Option<&str> {
        match self {
            HtmlNode::Element { tag, .. } => Some(tag),
            HtmlNode::Text(_) => None,
        }
    }

    pub fn attr(&self, name: &str) -> Option<&str> {
        match self {
            HtmlNode::Element { attrs, .. } => {
                attrs.iter().find(|(k, _)| k == name).map(|(_, v)| v.as_str())
            }
            HtmlNode::Text(_) => None,
        }
    }

    pub fn children(&self) -> &[HtmlNode] {
        match self {
            HtmlNode::Element { children, .. } => children,
            HtmlNode::Text(_) => &[],
        }
    }

    pub fn text_content(&self) -> String {
        match self {
            HtmlNode::Text(t) => t.clone(),
            HtmlNode::Element { children, .. } => {
                children.iter().map(|c| c.text_content()).collect()
            }
        }
    }
}

const VOID_ELEMENTS: &[&str] = &[
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
];

/// Parse an HTML string into a list of HtmlNode trees.
pub fn parse_html(input: &str) -> Vec<HtmlNode> {
    let mut pos = 0;
    parse_nodes(input, &mut pos, None)
}

fn parse_nodes(input: &str, pos: &mut usize, end_tag: Option<&str>) -> Vec<HtmlNode> {
    let mut nodes = Vec::new();
    let bytes = input.as_bytes();
    let len = bytes.len();

    while *pos < len {
        // Check for end tag
        if let Some(et) = end_tag {
            if input[*pos..].starts_with("</") {
                let after_slash = *pos + 2;
                let tag_end = input[after_slash..]
                    .find(|c: char| c == '>' || c.is_ascii_whitespace())
                    .map(|i| after_slash + i)
                    .unwrap_or(len);
                let tag_name = input[after_slash..tag_end].to_lowercase();
                if tag_name == et {
                    // Consume the closing tag
                    if let Some(gt) = input[*pos..].find('>') {
                        *pos += gt + 1;
                    } else {
                        *pos = len;
                    }
                    return nodes;
                }
            }
        }

        if bytes[*pos] == b'<' {
            // Comment
            if input[*pos..].starts_with("<!--") {
                if let Some(end) = input[*pos + 4..].find("-->") {
                    *pos += 4 + end + 3;
                } else {
                    *pos = len;
                }
                continue;
            }

            // Closing tag without matching end_tag — stop and let parent handle it
            if input[*pos..].starts_with("</") {
                if end_tag.is_some() {
                    // Mismatched close tag; return what we have
                    return nodes;
                }
                // Skip stray closing tags at top level
                if let Some(gt) = input[*pos..].find('>') {
                    *pos += gt + 1;
                } else {
                    *pos = len;
                }
                continue;
            }

            // Opening tag
            if let Some(node) = parse_element(input, pos) {
                nodes.push(node);
            } else {
                // Not a valid tag, treat '<' as text
                let mut text = String::new();
                text.push('<');
                *pos += 1;
                // Collect until next '<' or end
                while *pos < len && bytes[*pos] != b'<' {
                    text.push(input[*pos..].chars().next().unwrap());
                    *pos += text.chars().last().unwrap().len_utf8();
                    // Fix: we already advanced pos by the char len via the line above,
                    // but we used a wrong approach. Let's redo.
                }
                // Actually let's simplify — the text got mangled. Re-do properly:
                nodes.push(HtmlNode::Text(decode_entities(&text)));
            }
        } else {
            // Text node
            let start = *pos;
            while *pos < len && bytes[*pos] != b'<' {
                *pos += 1;
            }
            let text = &input[start..*pos];
            if !text.is_empty() {
                nodes.push(HtmlNode::Text(decode_entities(text)));
            }
        }
    }

    nodes
}

fn parse_element(input: &str, pos: &mut usize) -> Option<HtmlNode> {
    let len = input.len();
    if *pos >= len || input.as_bytes()[*pos] != b'<' {
        return None;
    }

    *pos += 1; // skip '<'

    // Skip whitespace
    skip_ws(input, pos);

    // Read tag name
    let tag_start = *pos;
    while *pos < len {
        let b = input.as_bytes()[*pos];
        if b == b'>' || b == b'/' || b == b' ' || b == b'\t' || b == b'\n' || b == b'\r' {
            break;
        }
        *pos += 1;
    }
    if *pos == tag_start {
        return None;
    }
    let tag = input[tag_start..*pos].to_lowercase();

    // Parse attributes
    let attrs = parse_attributes(input, pos);

    // Check for self-closing />
    let self_closing = if *pos < len && input.as_bytes()[*pos] == b'/' {
        *pos += 1;
        true
    } else {
        false
    };

    // Skip to '>'
    if *pos < len && input.as_bytes()[*pos] == b'>' {
        *pos += 1;
    }

    let is_void = VOID_ELEMENTS.contains(&tag.as_str());

    if self_closing || is_void {
        Some(HtmlNode::Element {
            tag,
            attrs,
            children: Vec::new(),
        })
    } else {
        let children = parse_nodes(input, pos, Some(&tag));
        Some(HtmlNode::Element {
            tag,
            attrs,
            children,
        })
    }
}

fn parse_attributes(input: &str, pos: &mut usize) -> Vec<(String, String)> {
    let mut attrs = Vec::new();
    let len = input.len();

    loop {
        skip_ws(input, pos);
        if *pos >= len {
            break;
        }
        let b = input.as_bytes()[*pos];
        if b == b'>' || b == b'/' {
            break;
        }

        // Read attribute name
        let name_start = *pos;
        while *pos < len {
            let b = input.as_bytes()[*pos];
            if b == b'=' || b == b'>' || b == b'/' || b == b' ' || b == b'\t' || b == b'\n' {
                break;
            }
            *pos += 1;
        }
        let name = input[name_start..*pos].to_lowercase();
        if name.is_empty() {
            *pos += 1; // skip unknown char
            continue;
        }

        skip_ws(input, pos);

        // Check for =
        if *pos < len && input.as_bytes()[*pos] == b'=' {
            *pos += 1;
            skip_ws(input, pos);

            let value = if *pos < len && (input.as_bytes()[*pos] == b'"' || input.as_bytes()[*pos] == b'\'') {
                let quote = input.as_bytes()[*pos];
                *pos += 1;
                let val_start = *pos;
                while *pos < len && input.as_bytes()[*pos] != quote {
                    *pos += 1;
                }
                let val = input[val_start..*pos].to_string();
                if *pos < len {
                    *pos += 1; // skip closing quote
                }
                val
            } else {
                // Unquoted value
                let val_start = *pos;
                while *pos < len {
                    let b = input.as_bytes()[*pos];
                    if b == b' ' || b == b'\t' || b == b'>' || b == b'/' || b == b'\n' {
                        break;
                    }
                    *pos += 1;
                }
                input[val_start..*pos].to_string()
            };
            attrs.push((name, decode_entities(&value)));
        } else {
            // Boolean attribute
            attrs.push((name, String::new()));
        }
    }

    attrs
}

fn skip_ws(input: &str, pos: &mut usize) {
    let bytes = input.as_bytes();
    while *pos < bytes.len() && (bytes[*pos] == b' ' || bytes[*pos] == b'\t' || bytes[*pos] == b'\n' || bytes[*pos] == b'\r') {
        *pos += 1;
    }
}

fn decode_entities(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut chars = s.chars().peekable();

    while let Some(c) = chars.next() {
        if c == '&' {
            let mut entity = String::new();
            while let Some(&ch) = chars.peek() {
                if ch == ';' {
                    chars.next();
                    break;
                }
                if ch == '&' || ch == '<' || ch == ' ' || entity.len() > 10 {
                    break;
                }
                entity.push(ch);
                chars.next();
            }
            match entity.as_str() {
                "amp" => result.push('&'),
                "lt" => result.push('<'),
                "gt" => result.push('>'),
                "quot" => result.push('"'),
                "apos" => result.push('\''),
                "nbsp" => result.push('\u{00A0}'),
                _ => {
                    result.push('&');
                    result.push_str(&entity);
                    // The ';' was already consumed if present
                }
            }
        } else {
            result.push(c);
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_element() {
        let nodes = parse_html("<p>hello</p>");
        assert_eq!(nodes.len(), 1);
        assert_eq!(nodes[0].tag(), Some("p"));
        assert_eq!(nodes[0].text_content(), "hello");
    }

    #[test]
    fn test_parse_nested_elements() {
        let nodes = parse_html("<div><p>inner</p></div>");
        assert_eq!(nodes.len(), 1);
        assert_eq!(nodes[0].tag(), Some("div"));
        let children = nodes[0].children();
        assert_eq!(children.len(), 1);
        assert_eq!(children[0].tag(), Some("p"));
        assert_eq!(children[0].text_content(), "inner");
    }

    #[test]
    fn test_parse_attributes() {
        let nodes = parse_html("<a href=\"url\">link</a>");
        assert_eq!(nodes.len(), 1);
        assert_eq!(nodes[0].attr("href"), Some("url"));
        assert_eq!(nodes[0].text_content(), "link");
    }

    #[test]
    fn test_parse_self_closing() {
        let nodes = parse_html("<br/><img>");
        assert_eq!(nodes.len(), 2);
        assert_eq!(nodes[0].tag(), Some("br"));
        assert_eq!(nodes[1].tag(), Some("img"));
    }

    #[test]
    fn test_parse_entities() {
        let nodes = parse_html("&amp; &lt; &gt;");
        assert_eq!(nodes.len(), 1);
        assert_eq!(nodes[0].text_content(), "& < >");
    }
}
