use crate::block::{Block, ListItem};
use crate::inline::{parse_inline, Inline};

/// Render block AST to sanitized HTML.
pub fn blocks_to_html(blocks: &[Block]) -> String {
    let mut out = String::new();
    for block in blocks {
        render_block(block, &mut out);
    }
    out
}

fn render_block(block: &Block, out: &mut String) {
    match block {
        Block::Heading { level, content } => {
            let tag = format!("h{}", level.min(&6));
            out.push_str(&format!("<{}>", tag));
            render_inlines(&parse_inline(content), out);
            out.push_str(&format!("</{}>", tag));
            out.push('\n');
        }
        Block::Paragraph { content } => {
            out.push_str("<p>");
            render_inlines(&parse_inline(content), out);
            out.push_str("</p>");
            out.push('\n');
        }
        Block::CodeBlock { language, content } => {
            if language.is_empty() {
                out.push_str("<pre><code>");
            } else {
                out.push_str(&format!("<pre><code class=\"language-{}\">", escape_html(language)));
            }
            out.push_str(&escape_html(content));
            out.push_str("</code></pre>");
            out.push('\n');
        }
        Block::Blockquote { children } => {
            out.push_str("<blockquote>\n");
            for child in children {
                render_block(child, out);
            }
            out.push_str("</blockquote>\n");
        }
        Block::UnorderedList { items } => {
            out.push_str("<ul>\n");
            for item in items {
                render_list_item(item, out);
            }
            out.push_str("</ul>\n");
        }
        Block::OrderedList { start, items } => {
            if *start == 1 {
                out.push_str("<ol>\n");
            } else {
                out.push_str(&format!("<ol start=\"{}\">\n", start));
            }
            for item in items {
                render_list_item(item, out);
            }
            out.push_str("</ol>\n");
        }
        Block::ThematicBreak => {
            out.push_str("<hr />\n");
        }
        Block::HtmlBlock { content } => {
            let sanitized = sanitize_html(content);
            if !sanitized.trim().is_empty() {
                out.push_str(&sanitized);
                out.push('\n');
            }
        }
        Block::Table { headers, rows } => {
            out.push_str("<table>\n<thead>\n<tr>\n");
            for h in headers {
                out.push_str("<th>");
                render_inlines(&parse_inline(h), out);
                out.push_str("</th>\n");
            }
            out.push_str("</tr>\n</thead>\n<tbody>\n");
            for row in rows {
                out.push_str("<tr>\n");
                for cell in row {
                    out.push_str("<td>");
                    render_inlines(&parse_inline(cell), out);
                    out.push_str("</td>\n");
                }
                out.push_str("</tr>\n");
            }
            out.push_str("</tbody>\n</table>\n");
        }
    }
}

fn render_list_item(item: &ListItem, out: &mut String) {
    out.push_str("<li>");
    if let Some(checked) = item.checked {
        if checked {
            out.push_str("<input type=\"checkbox\" disabled checked /> ");
        } else {
            out.push_str("<input type=\"checkbox\" disabled /> ");
        }
    }
    render_inlines(&parse_inline(&item.content), out);
    for child in &item.children {
        render_block(child, out);
    }
    out.push_str("</li>\n");
}

fn render_inlines(inlines: &[Inline], out: &mut String) {
    for inline in inlines {
        render_inline(inline, out);
    }
}

fn render_inline(inline: &Inline, out: &mut String) {
    match inline {
        Inline::Text(t) => out.push_str(&escape_html(t)),
        Inline::Strong(children) => {
            out.push_str("<strong>");
            render_inlines(children, out);
            out.push_str("</strong>");
        }
        Inline::Emphasis(children) => {
            out.push_str("<em>");
            render_inlines(children, out);
            out.push_str("</em>");
        }
        Inline::Code(code) => {
            out.push_str("<code>");
            out.push_str(&escape_html(code));
            out.push_str("</code>");
        }
        Inline::Link { text, url, title } => {
            let safe_url = sanitize_url(url);
            match title {
                Some(t) => out.push_str(&format!(
                    "<a href=\"{}\" title=\"{}\">",
                    escape_attr(&safe_url),
                    escape_attr(t)
                )),
                None => out.push_str(&format!("<a href=\"{}\">", escape_attr(&safe_url))),
            }
            render_inlines(text, out);
            out.push_str("</a>");
        }
        Inline::Image { alt, src } => {
            let safe_src = sanitize_url(src);
            out.push_str(&format!(
                "<img src=\"{}\" alt=\"{}\" />",
                escape_attr(&safe_src),
                escape_attr(alt)
            ));
        }
        Inline::LineBreak => {
            out.push_str("<br />\n");
        }
        Inline::Strikethrough(children) => {
            out.push_str("<del>");
            render_inlines(children, out);
            out.push_str("</del>");
        }
        Inline::Html(html) => {
            let sanitized = sanitize_html(html);
            out.push_str(&sanitized);
        }
    }
}

fn escape_html(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#x27;"),
            _ => out.push(c),
        }
    }
    out
}

fn escape_attr(s: &str) -> String {
    escape_html(s)
}

/// Sanitize a URL: neuter javascript: and data: URIs.
fn sanitize_url(url: &str) -> String {
    let lower = url.trim().to_lowercase();
    if lower.starts_with("javascript:") || lower.starts_with("data:") {
        "#".to_string()
    } else {
        url.to_string()
    }
}

/// Sanitize HTML content by stripping dangerous tags and attributes.
fn sanitize_html(html: &str) -> String {
    let mut result = html.to_string();

    // Strip tags with content: script, iframe, object, form, svg
    let strip_with_content = ["script", "iframe", "object", "form", "svg"];
    for tag in &strip_with_content {
        // Case-insensitive removal of <tag ...>...</tag> including self-closing variants
        let re_open_close = build_strip_regex_with_content(tag);
        result = re_open_close(&result);

        // Also strip self-closing variants like <svg/onload=...>
        result = strip_self_closing_tag(&result, tag);
    }

    // Strip self-closing / void tags: embed, base, meta
    let strip_self = ["embed", "base", "meta"];
    for tag in &strip_self {
        result = strip_tag_any_form(&result, tag);
    }

    // Strip on* event handler attributes
    result = strip_event_handlers(&result);

    // Neuter javascript: and data: URIs in remaining attributes
    result = neuter_dangerous_uris(&result);

    result
}

/// Remove `<tag ...>...</tag>` blocks (case-insensitive).
fn build_strip_regex_with_content(tag: &str) -> impl Fn(&str) -> String {
    let tag = tag.to_string();
    move |input: &str| {
        let mut result = String::new();
        let lower = input.to_lowercase();
        let open_pattern = format!("<{}", tag);
        let close_pattern = format!("</{}", tag);

        let mut i = 0;
        let chars: Vec<char> = input.chars().collect();
        let lower_chars: Vec<char> = lower.chars().collect();
        let len = chars.len();

        while i < len {
            // Check for opening tag
            if i + open_pattern.len() <= len {
                let slice: String = lower_chars[i..i + open_pattern.len()].iter().collect();
                if slice == open_pattern {
                    // Check that it's actually a tag (followed by space, >, /, or end)
                    let next_idx = i + open_pattern.len();
                    if next_idx >= len
                        || lower_chars[next_idx] == ' '
                        || lower_chars[next_idx] == '>'
                        || lower_chars[next_idx] == '/'
                        || lower_chars[next_idx] == '\t'
                        || lower_chars[next_idx] == '\n'
                    {
                        // Find closing tag
                        if let Some(close_start) = find_pattern_ci(&lower_chars, next_idx, &close_pattern) {
                            // Find the > after closing tag
                            let mut j = close_start + close_pattern.len();
                            while j < len && chars[j] != '>' {
                                j += 1;
                            }
                            i = if j < len { j + 1 } else { len };
                            continue;
                        } else {
                            // No closing tag — strip to end of opening tag
                            let mut j = next_idx;
                            while j < len && chars[j] != '>' {
                                j += 1;
                            }
                            i = if j < len { j + 1 } else { len };
                            continue;
                        }
                    }
                }
            }
            result.push(chars[i]);
            i += 1;
        }
        result
    }
}

fn find_pattern_ci(lower_chars: &[char], from: usize, pattern: &str) -> Option<usize> {
    let pat_chars: Vec<char> = pattern.chars().collect();
    let pat_len = pat_chars.len();
    let len = lower_chars.len();
    let mut i = from;
    while i + pat_len <= len {
        let mut matches = true;
        for (k, &pc) in pat_chars.iter().enumerate() {
            if lower_chars[i + k] != pc {
                matches = false;
                break;
            }
        }
        if matches {
            return Some(i);
        }
        i += 1;
    }
    None
}

/// Strip self-closing tag variants like `<tag/...>` or `<tag .../>`.
fn strip_self_closing_tag(input: &str, tag: &str) -> String {
    let mut result = String::new();
    let lower = input.to_lowercase();
    let lower_chars: Vec<char> = lower.chars().collect();
    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();
    let pattern = format!("<{}", tag);
    let pat_len = pattern.len();

    let mut i = 0;
    while i < len {
        if i + pat_len <= len {
            let slice: String = lower_chars[i..i + pat_len].iter().collect();
            if slice == pattern {
                let next = i + pat_len;
                if next < len && (lower_chars[next] == '/' || lower_chars[next] == ' ' || lower_chars[next] == '>') {
                    // Skip to closing >
                    let mut j = next;
                    while j < len && chars[j] != '>' {
                        j += 1;
                    }
                    i = if j < len { j + 1 } else { len };
                    continue;
                }
            }
        }
        result.push(chars[i]);
        i += 1;
    }
    result
}

/// Strip any form of a tag (opening, closing, self-closing).
fn strip_tag_any_form(input: &str, tag: &str) -> String {
    let after_open = strip_self_closing_tag(input, tag);
    // Also strip closing tags
    let mut result = String::new();
    let lower = after_open.to_lowercase();
    let lower_chars: Vec<char> = lower.chars().collect();
    let chars: Vec<char> = after_open.chars().collect();
    let len = chars.len();
    let close_pattern = format!("</{}", tag);
    let pat_len = close_pattern.len();

    let mut i = 0;
    while i < len {
        if i + pat_len <= len {
            let slice: String = lower_chars[i..i + pat_len].iter().collect();
            if slice == close_pattern {
                let mut j = i + pat_len;
                while j < len && chars[j] != '>' {
                    j += 1;
                }
                i = if j < len { j + 1 } else { len };
                continue;
            }
        }
        result.push(chars[i]);
        i += 1;
    }
    result
}

/// Remove on* event handler attributes from HTML tags.
fn strip_event_handlers(input: &str) -> String {
    let mut result = String::new();
    let chars: Vec<char> = input.chars().collect();
    let lower: Vec<char> = input.to_lowercase().chars().collect();
    let len = chars.len();
    let mut i = 0;
    let mut in_tag = false;

    while i < len {
        if chars[i] == '<' && !in_tag {
            in_tag = true;
            result.push(chars[i]);
            i += 1;
            continue;
        }
        if in_tag && chars[i] == '>' {
            in_tag = false;
            result.push(chars[i]);
            i += 1;
            continue;
        }
        if in_tag && i + 2 < len && lower[i] == 'o' && lower[i + 1] == 'n' && lower[i + 2].is_ascii_alphabetic() {
            // This looks like an on* attribute — skip it
            let mut j = i;
            // Skip attribute name
            while j < len && chars[j] != '=' && chars[j] != ' ' && chars[j] != '>' {
                j += 1;
            }
            if j < len && chars[j] == '=' {
                j += 1;
                // Skip attribute value
                if j < len && (chars[j] == '"' || chars[j] == '\'') {
                    let quote = chars[j];
                    j += 1;
                    while j < len && chars[j] != quote {
                        j += 1;
                    }
                    if j < len {
                        j += 1; // skip closing quote
                    }
                } else {
                    // Unquoted value — skip to space or >
                    while j < len && chars[j] != ' ' && chars[j] != '>' {
                        j += 1;
                    }
                }
            }
            // Skip trailing whitespace
            while j < len && chars[j] == ' ' {
                j += 1;
            }
            i = j;
            continue;
        }
        result.push(chars[i]);
        i += 1;
    }
    result
}

/// Replace javascript: and data: URIs in href/src attributes with #.
fn neuter_dangerous_uris(input: &str) -> String {
    let mut result = String::new();
    let chars: Vec<char> = input.chars().collect();
    let lower: Vec<char> = input.to_lowercase().chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        // Look for href=" or src="
        let check_attrs = ["href=", "src="];
        let mut matched_attr = false;

        for attr in &check_attrs {
            let attr_len = attr.len();
            if i + attr_len < len {
                let slice: String = lower[i..i + attr_len].iter().collect();
                if slice == *attr {
                    // Push the attr name and =
                    for ch in &chars[i..i + attr_len] {
                        result.push(*ch);
                    }
                    let mut j = i + attr_len;

                    if j < len && (chars[j] == '"' || chars[j] == '\'') {
                        let quote = chars[j];
                        result.push(quote);
                        j += 1;

                        // Read the URI value
                        let uri_start = j;
                        while j < len && chars[j] != quote {
                            j += 1;
                        }
                        let uri: String = chars[uri_start..j].iter().collect();
                        let uri_lower = uri.to_lowercase();

                        if uri_lower.trim_start().starts_with("javascript:")
                            || uri_lower.trim_start().starts_with("data:")
                        {
                            result.push('#');
                        } else {
                            result.push_str(&uri);
                        }

                        if j < len {
                            result.push(quote);
                            j += 1;
                        }
                        i = j;
                        matched_attr = true;
                        break;
                    }
                }
            }
        }

        if !matched_attr {
            result.push(chars[i]);
            i += 1;
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use crate::block::parse_blocks;
    use super::blocks_to_html;

    #[test]
    fn test_heading_rendering() {
        let blocks = parse_blocks("# Hello");
        let html = blocks_to_html(&blocks);
        assert!(html.contains("<h1>"));
        assert!(html.contains("Hello"));
    }

    #[test]
    fn test_bold_rendering() {
        let blocks = parse_blocks("**bold**");
        let html = blocks_to_html(&blocks);
        assert!(html.contains("<strong>bold</strong>"));
    }

    #[test]
    fn test_link_rendering() {
        let blocks = parse_blocks("[link](https://example.com)");
        let html = blocks_to_html(&blocks);
        assert!(html.contains("<a href=\"https://example.com\">link</a>"));
    }

    #[test]
    fn test_code_block_rendering() {
        let blocks = parse_blocks("```rust\nfn main() {}\n```");
        let html = blocks_to_html(&blocks);
        assert!(html.contains("<pre><code class=\"language-rust\">"));
    }

    #[test]
    fn test_strip_script_tags() {
        let blocks = parse_blocks("<script>alert(\"xss\")</script>");
        let html = blocks_to_html(&blocks);
        assert!(!html.contains("<script"));
        assert!(!html.contains("alert"));
    }

    #[test]
    fn test_strip_event_handlers() {
        let blocks = parse_blocks("<div onload=\"alert(1)\">test</div>");
        let html = blocks_to_html(&blocks);
        assert!(!html.contains("onload"));
    }

    #[test]
    fn test_empty_input() {
        let blocks = parse_blocks("");
        let html = blocks_to_html(&blocks);
        assert!(html.trim().is_empty());
    }

    #[test]
    fn test_strip_svg_onload() {
        let blocks = parse_blocks("<svg/onload=alert(1)>");
        let html = blocks_to_html(&blocks);
        assert!(!html.contains("onload"));
        assert!(!html.contains("<svg"));
    }

    #[test]
    fn test_neuter_javascript_uri() {
        let blocks = parse_blocks("<img src=\"javascript:alert(1)\">");
        let html = blocks_to_html(&blocks);
        assert!(!html.contains("javascript:"));
    }

    #[test]
    fn test_strip_form() {
        let blocks = parse_blocks("<form action=\"https://evil.com\"><input></form>");
        let html = blocks_to_html(&blocks);
        assert!(!html.contains("<form"));
    }

    #[test]
    fn test_strip_base() {
        let blocks = parse_blocks("<base href=\"https://evil.com\">");
        let html = blocks_to_html(&blocks);
        assert!(!html.contains("<base"));
    }
}
