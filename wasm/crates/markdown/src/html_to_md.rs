/// Convert HTML to Markdown.
use crate::html_parse::{parse_html, HtmlNode};

/// Convert an HTML string to a Markdown string.
pub fn convert(html: &str) -> String {
    let nodes = parse_html(html);
    let mut out = String::new();
    for node in &nodes {
        convert_node(node, &mut out, &Context::default());
    }
    clean_output(&out)
}

#[derive(Default, Clone)]
struct Context {
    /// Inside a <pre> block — preserve whitespace
    in_pre: bool,
    /// Current list type for <li> rendering
    list_type: Option<ListType>,
    /// Current ordered list counter
    list_counter: u32,
}

#[derive(Clone)]
enum ListType {
    Unordered,
    Ordered,
}

fn convert_node(node: &HtmlNode, out: &mut String, ctx: &Context) {
    match node {
        HtmlNode::Text(text) => {
            if ctx.in_pre {
                out.push_str(text);
            } else {
                // Collapse whitespace for inline text
                let collapsed = collapse_whitespace(text);
                out.push_str(&collapsed);
            }
        }
        HtmlNode::Element { tag, children, .. } => {
            convert_element(tag, node, children, out, ctx);
        }
    }
}

fn convert_element(
    tag: &str,
    node: &HtmlNode,
    children: &[HtmlNode],
    out: &mut String,
    ctx: &Context,
) {
    match tag {
        "h1" => render_heading(1, children, out, ctx),
        "h2" => render_heading(2, children, out, ctx),
        "h3" => render_heading(3, children, out, ctx),
        "h4" => render_heading(4, children, out, ctx),
        "h5" => render_heading(5, children, out, ctx),
        "h6" => render_heading(6, children, out, ctx),

        "p" => {
            ensure_blank_line(out);
            render_children(children, out, ctx);
            ensure_newline(out);
            out.push('\n');
        }

        "strong" | "b" => {
            out.push_str("**");
            render_children(children, out, ctx);
            out.push_str("**");
        }

        "em" | "i" => {
            out.push_str("_");
            render_children(children, out, ctx);
            out.push_str("_");
        }

        "a" => {
            let href = node.attr("href").unwrap_or("");
            out.push('[');
            render_children(children, out, ctx);
            out.push_str("](");
            out.push_str(href);
            out.push(')');
        }

        "img" => {
            let src = node.attr("src").unwrap_or("");
            let alt = node.attr("alt").unwrap_or("");
            out.push_str("![");
            out.push_str(alt);
            out.push_str("](");
            out.push_str(src);
            out.push(')');
        }

        "code" => {
            // Check if parent is <pre> — if so, this is a fenced code block
            // We handle pre+code in the "pre" arm, so here just inline code
            if ctx.in_pre {
                render_children(children, out, ctx);
            } else {
                out.push('`');
                let text = collect_text(children);
                out.push_str(&text);
                out.push('`');
            }
        }

        "pre" => {
            ensure_blank_line(out);
            // Check if first child is <code>
            let code_child = children.iter().find(|c| c.tag() == Some("code"));
            if let Some(code_node) = code_child {
                // Extract language from class="language-xxx"
                let lang = code_node
                    .attr("class")
                    .and_then(|c| c.strip_prefix("language-"))
                    .unwrap_or("");
                out.push_str("```");
                out.push_str(lang);
                out.push('\n');
                let mut pre_ctx = ctx.clone();
                pre_ctx.in_pre = true;
                render_children(code_node.children(), out, &pre_ctx);
                ensure_newline(out);
                out.push_str("```\n");
            } else {
                out.push_str("```\n");
                let mut pre_ctx = ctx.clone();
                pre_ctx.in_pre = true;
                render_children(children, out, &pre_ctx);
                ensure_newline(out);
                out.push_str("```\n");
            }
        }

        "ul" => {
            ensure_blank_line(out);
            let mut list_ctx = ctx.clone();
            list_ctx.list_type = Some(ListType::Unordered);
            list_ctx.list_counter = 0;
            for child in children {
                convert_node(child, out, &list_ctx);
            }
        }

        "ol" => {
            ensure_blank_line(out);
            let mut list_ctx = ctx.clone();
            list_ctx.list_type = Some(ListType::Ordered);
            list_ctx.list_counter = 0;
            for child in children {
                list_ctx.list_counter += 1;
                convert_node(child, out, &list_ctx);
            }
        }

        "li" => {
            match &ctx.list_type {
                Some(ListType::Unordered) => {
                    out.push_str("- ");
                }
                Some(ListType::Ordered) => {
                    out.push_str(&format!("{}. ", ctx.list_counter));
                }
                None => {
                    out.push_str("- ");
                }
            }
            // Check for checkbox
            for child in children {
                if let HtmlNode::Element { tag, attrs, .. } = child {
                    if tag == "input" {
                        let is_checkbox = attrs.iter().any(|(k, v)| k == "type" && v == "checkbox");
                        if is_checkbox {
                            let checked = attrs.iter().any(|(k, _)| k == "checked");
                            if checked {
                                out.push_str("[x] ");
                            } else {
                                out.push_str("[ ] ");
                            }
                            continue;
                        }
                    }
                }
                convert_node(child, out, &Context::default());
            }
            ensure_newline(out);
        }

        "blockquote" => {
            ensure_blank_line(out);
            let mut inner = String::new();
            render_children(children, &mut inner, ctx);
            let inner = inner.trim();
            for line in inner.lines() {
                out.push_str("> ");
                out.push_str(line);
                out.push('\n');
            }
        }

        "br" => {
            out.push('\n');
        }

        "hr" => {
            ensure_blank_line(out);
            out.push_str("---\n");
        }

        "del" | "s" => {
            out.push_str("~~");
            render_children(children, out, ctx);
            out.push_str("~~");
        }

        "table" => {
            ensure_blank_line(out);
            render_table(children, out);
        }

        "thead" | "tbody" | "tfoot" | "tr" | "th" | "td" => {
            // These are handled by render_table; if encountered standalone, render children
            render_children(children, out, ctx);
        }

        "input" => {
            let is_checkbox = node.attr("type").is_some_and(|v| v == "checkbox");
            if is_checkbox {
                let checked = match node {
                    HtmlNode::Element { attrs, .. } => attrs.iter().any(|(k, _)| k == "checked"),
                    _ => false,
                };
                if checked {
                    out.push_str("[x]");
                } else {
                    out.push_str("[ ]");
                }
            }
        }

        // Transparent containers — just render children
        "div" | "section" | "article" | "main" | "header" | "footer" | "nav" | "aside"
        | "span" | "body" | "html" | "head" | "figure" | "figcaption" | "details" | "summary"
        | "mark" | "small" | "sub" | "sup" | "abbr" | "cite" | "dfn" | "time" | "var"
        | "samp" | "kbd" | "ruby" | "rt" | "rp" | "bdi" | "bdo" | "wbr" | "data"
        | "dl" | "dt" | "dd" | "address" | "hgroup" | "search" => {
            render_children(children, out, ctx);
        }

        // Skip script/style
        "script" | "style" | "noscript" => {}

        // Unknown tags — render children
        _ => {
            render_children(children, out, ctx);
        }
    }
}

fn render_heading(level: u8, children: &[HtmlNode], out: &mut String, ctx: &Context) {
    ensure_blank_line(out);
    for _ in 0..level {
        out.push('#');
    }
    out.push(' ');
    render_children(children, out, ctx);
    ensure_newline(out);
    out.push('\n');
}

fn render_children(children: &[HtmlNode], out: &mut String, ctx: &Context) {
    for child in children {
        convert_node(child, out, ctx);
    }
}

fn collect_text(nodes: &[HtmlNode]) -> String {
    nodes.iter().map(|n| n.text_content()).collect()
}

fn render_table(children: &[HtmlNode], out: &mut String) {
    let mut header_cells: Vec<String> = Vec::new();
    let mut body_rows: Vec<Vec<String>> = Vec::new();

    // Collect thead rows and tbody rows
    for child in children {
        match child.tag() {
            Some("thead") => {
                for tr in child.children() {
                    if tr.tag() == Some("tr") {
                        let row = extract_row_cells(tr);
                        if header_cells.is_empty() {
                            header_cells = row;
                        }
                    }
                }
            }
            Some("tbody") => {
                for tr in child.children() {
                    if tr.tag() == Some("tr") {
                        body_rows.push(extract_row_cells(tr));
                    }
                }
            }
            Some("tfoot") => {
                for tr in child.children() {
                    if tr.tag() == Some("tr") {
                        body_rows.push(extract_row_cells(tr));
                    }
                }
            }
            Some("tr") => {
                let row = extract_row_cells(child);
                if header_cells.is_empty() {
                    header_cells = row;
                } else {
                    body_rows.push(row);
                }
            }
            _ => {}
        }
    }

    if header_cells.is_empty() && body_rows.is_empty() {
        return;
    }

    // If no headers but we have rows, use first row as header
    if header_cells.is_empty() && !body_rows.is_empty() {
        header_cells = body_rows.remove(0);
    }

    // Render header
    out.push('|');
    for cell in &header_cells {
        out.push(' ');
        out.push_str(cell.trim());
        out.push_str(" |");
    }
    out.push('\n');

    // Separator
    out.push('|');
    for _ in &header_cells {
        out.push_str(" --- |");
    }
    out.push('\n');

    // Body rows
    for row in &body_rows {
        out.push('|');
        for (i, cell) in row.iter().enumerate() {
            out.push(' ');
            out.push_str(cell.trim());
            out.push_str(" |");
            let _ = i;
        }
        out.push('\n');
    }
}

fn extract_row_cells(tr: &HtmlNode) -> Vec<String> {
    let mut cells = Vec::new();
    for child in tr.children() {
        match child.tag() {
            Some("th") | Some("td") => {
                let mut cell_out = String::new();
                render_children(child.children(), &mut cell_out, &Context::default());
                cells.push(cell_out);
            }
            _ => {}
        }
    }
    cells
}

fn ensure_newline(out: &mut String) {
    if !out.is_empty() && !out.ends_with('\n') {
        out.push('\n');
    }
}

fn ensure_blank_line(out: &mut String) {
    if out.is_empty() {
        return;
    }
    if !out.ends_with('\n') {
        out.push('\n');
    }
    if !out.ends_with("\n\n") {
        out.push('\n');
    }
}

fn collapse_whitespace(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut last_was_ws = false;
    for c in s.chars() {
        if c.is_ascii_whitespace() {
            if !last_was_ws {
                result.push(' ');
                last_was_ws = true;
            }
        } else {
            result.push(c);
            last_was_ws = false;
        }
    }
    result
}

fn clean_output(s: &str) -> String {
    let mut result = String::new();
    let mut blank_count = 0;

    for line in s.lines() {
        let trimmed_right = line.trim_end();
        if trimmed_right.is_empty() {
            blank_count += 1;
            if blank_count <= 1 {
                result.push('\n');
            }
        } else {
            blank_count = 0;
            result.push_str(trimmed_right);
            result.push('\n');
        }
    }

    // Trim leading/trailing whitespace
    let trimmed = result.trim().to_string();
    if trimmed.is_empty() {
        trimmed
    } else {
        format!("{}\n", trimmed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_heading_conversion() {
        let md = convert("<h1>Hello</h1>");
        assert!(md.contains("# Hello"), "got: {}", md);
    }

    #[test]
    fn test_bold_italic() {
        let md = convert("<strong>bold</strong>");
        assert!(md.contains("**bold**"), "got: {}", md);

        let md = convert("<em>italic</em>");
        assert!(md.contains("_italic_"), "got: {}", md);
    }

    #[test]
    fn test_link_conversion() {
        let md = convert("<a href=\"url\">link</a>");
        assert!(md.contains("[link](url)"), "got: {}", md);
    }

    #[test]
    fn test_image_conversion() {
        let md = convert("<img src=\"test.png\" alt=\"Test image\">");
        assert!(md.contains("![Test image](test.png)"), "got: {}", md);
    }

    #[test]
    fn test_table_conversion() {
        let html = "<table><thead><tr><th>Name</th><th>Age</th></tr></thead><tbody><tr><td>John</td><td>30</td></tr></tbody></table>";
        let md = convert(html);
        assert!(md.contains("| Name | Age |"), "got: {}", md);
        assert!(md.contains("| John | 30 |"), "got: {}", md);
    }
}
