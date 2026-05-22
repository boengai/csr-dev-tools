use pulldown_cmark::{Event, Options, Parser, Tag, TagEnd};

/// Translate a Markdown string into Typst markup.
///
/// Covers the v1 construct set from
/// docs/superpowers/specs/2026-05-22-markdown-to-pdf-typst-design.md
/// §"Markdown → Typst translation". Constructs outside that set
/// (raw HTML, images, math) are silently dropped.
pub fn md_to_typst(md: &str) -> String {
    let mut opts = Options::empty();
    opts.insert(Options::ENABLE_TABLES);
    opts.insert(Options::ENABLE_STRIKETHROUGH);
    let parser = Parser::new_ext(md, opts);

    let mut out = String::new();
    let mut list_stack: Vec<ListKind> = vec![];
    let mut table_columns: usize = 0;
    let mut in_table_header = false;

    for event in parser {
        match event {
            Event::Start(Tag::Heading { level, .. }) => {
                out.push('\n');
                out.push_str(&"=".repeat(level as usize));
                out.push(' ');
            }
            Event::End(TagEnd::Heading(_)) => out.push_str("\n\n"),

            Event::Start(Tag::Paragraph) => {}
            Event::End(TagEnd::Paragraph) => out.push_str("\n\n"),

            Event::Start(Tag::Emphasis) => out.push('_'),
            Event::End(TagEnd::Emphasis) => out.push('_'),

            Event::Start(Tag::Strong) => out.push('*'),
            Event::End(TagEnd::Strong) => out.push('*'),

            Event::Code(s) => {
                out.push('`');
                out.push_str(&s);
                out.push('`');
            }

            Event::Start(Tag::CodeBlock(kind)) => {
                out.push_str("\n```");
                if let pulldown_cmark::CodeBlockKind::Fenced(lang) = kind {
                    out.push_str(&lang);
                }
                out.push('\n');
            }
            Event::End(TagEnd::CodeBlock) => out.push_str("```\n\n"),

            Event::Start(Tag::List(start)) => {
                list_stack.push(match start {
                    Some(_) => ListKind::Ordered,
                    None => ListKind::Bullet,
                });
            }
            Event::End(TagEnd::List(_)) => {
                list_stack.pop();
                out.push('\n');
            }
            Event::Start(Tag::Item) => {
                let marker = match list_stack.last() {
                    Some(ListKind::Bullet) => "- ",
                    Some(ListKind::Ordered) => "+ ",
                    None => "- ",
                };
                out.push_str(marker);
            }
            Event::End(TagEnd::Item) => out.push('\n'),

            Event::Start(Tag::Link { dest_url, .. }) => {
                out.push_str("#link(\"");
                out.push_str(&dest_url);
                out.push_str("\")[");
            }
            Event::End(TagEnd::Link) => out.push(']'),

            Event::Start(Tag::BlockQuote(_)) => out.push_str("#quote[\n"),
            Event::End(TagEnd::BlockQuote(_)) => out.push_str("\n]\n\n"),

            Event::Rule => out.push_str("\n#line(length: 100%)\n\n"),

            Event::SoftBreak => out.push(' '),
            Event::HardBreak => out.push_str(" \\\n"),

            Event::Text(s) => out.push_str(&escape_typst(&s)),

            // v1 explicit no-ops:
            Event::Html(_) | Event::InlineHtml(_) => {}
            Event::Start(Tag::Image { .. }) => {}
            Event::End(TagEnd::Image) => {}
            Event::TaskListMarker(_) => out.push_str("- "),
            Event::FootnoteReference(_) => {}
            Event::Start(Tag::FootnoteDefinition(_)) => {}
            Event::End(TagEnd::FootnoteDefinition) => {}

            // GFM tables:
            Event::Start(Tag::Table(alignments)) => {
                table_columns = alignments.len();
                out.push_str(&format!("\n#table(columns: {},\n", table_columns));
            }
            Event::End(TagEnd::Table) => {
                out.push_str(")\n\n");
                table_columns = 0;
            }
            Event::Start(Tag::TableHead) => {
                in_table_header = true;
            }
            Event::End(TagEnd::TableHead) => {
                in_table_header = false;
            }
            Event::Start(Tag::TableRow) | Event::End(TagEnd::TableRow) => {}
            Event::Start(Tag::TableCell) => {
                if in_table_header {
                    out.push_str("[*");
                } else {
                    out.push('[');
                }
            }
            Event::End(TagEnd::TableCell) => {
                if in_table_header {
                    out.push_str("*], ");
                } else {
                    out.push_str("], ");
                }
            }

            _ => {} // other event variants are no-ops in v1
        }
    }

    out
}

enum ListKind {
    Bullet,
    Ordered,
}

/// Escape characters that are syntactically meaningful in Typst markup.
fn escape_typst(s: &str) -> String {
    s.replace('\\', "\\\\")
        .replace('#', "\\#")
        .replace('$', "\\$")
        .replace('[', "\\[")
        .replace(']', "\\]")
        .replace('*', "\\*")
        .replace('_', "\\_")
        .replace('`', "\\`")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_input() {
        assert_eq!(md_to_typst(""), "");
    }

    #[test]
    fn heading_levels() {
        let out = md_to_typst("# h1\n## h2\n### h3");
        assert!(out.contains("= h1"));
        assert!(out.contains("== h2"));
        assert!(out.contains("=== h3"));
    }

    #[test]
    fn paragraph() {
        let out = md_to_typst("Hello world.");
        assert!(out.contains("Hello world."));
    }

    #[test]
    fn bold_and_italic() {
        let out = md_to_typst("**bold** and *italic*");
        assert!(out.contains("*bold*"));
        assert!(out.contains("_italic_"));
    }

    #[test]
    fn inline_code() {
        let out = md_to_typst("Hello `code`.");
        assert!(out.contains("`code`"));
    }

    #[test]
    fn fenced_code_block() {
        let out = md_to_typst("```rust\nfn main() {}\n```");
        assert!(out.contains("```rust"));
        assert!(out.contains("fn main() {}"));
    }

    #[test]
    fn bullet_list() {
        let out = md_to_typst("- one\n- two");
        assert!(out.contains("- one"));
        assert!(out.contains("- two"));
    }

    #[test]
    fn numbered_list() {
        let out = md_to_typst("1. one\n2. two");
        assert!(out.contains("+ one"));
        assert!(out.contains("+ two"));
    }

    #[test]
    fn link() {
        let out = md_to_typst("[example](https://example.com)");
        assert!(out.contains("#link(\"https://example.com\")[example]"));
    }

    #[test]
    fn block_quote() {
        let out = md_to_typst("> quoted");
        assert!(out.contains("#quote["));
        assert!(out.contains("quoted"));
    }

    #[test]
    fn horizontal_rule() {
        let out = md_to_typst("---");
        assert!(out.contains("#line(length: 100%)"));
    }

    #[test]
    fn hard_break() {
        let out = md_to_typst("line  \nbreak");
        assert!(out.contains("\\\n"));
    }

    #[test]
    fn typst_special_chars_escaped() {
        let out = md_to_typst("Price is $5 and #1");
        assert!(out.contains("\\$5"));
        assert!(out.contains("\\#1"));
    }

    #[test]
    fn raw_html_dropped() {
        let out = md_to_typst("Hello <span>world</span>!");
        assert!(out.contains("Hello"));
        assert!(out.contains("!"));
        assert!(!out.contains("<span>"));
    }

    #[test]
    fn image_dropped() {
        let out = md_to_typst("![alt](url.png)");
        assert!(!out.contains("url.png"));
    }

    #[test]
    fn gfm_table() {
        let md = "| a | b |\n|---|---|\n| 1 | 2 |";
        let out = md_to_typst(md);
        assert!(out.contains("#table(columns: 2"), "got: {}", out);
        assert!(out.contains("[*a*]"));
        assert!(out.contains("[1]"));
        assert!(out.contains("[2]"));
    }
}
