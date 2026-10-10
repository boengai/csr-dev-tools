use pulldown_cmark::{Event, Options, Parser, Tag, TagEnd};

/// Translate a Markdown string into Typst markup.
///
/// Covers the v1 construct set from
/// docs/superpowers/specs/2026-05-22-markdown-to-pdf-typst-design.md
/// §"Markdown → Typst translation". Constructs outside that set
/// (raw HTML, images, math) are silently dropped.
///
/// Injection safety: user-controlled text only ever reaches the Typst source
/// in one of two forms, both of which are inert:
/// - markup text, via [`escape_typst`], which backslash-escapes every ASCII
///   punctuation character that has (or could gain) markup meaning; and
/// - Typst string literals (link targets, inline/block code, code-block
///   language), via [`typst_str`], which escapes `\` and `"` plus control
///   characters.
/// No user text is ever placed in Typst code mode unquoted, and code spans no
/// longer use backtick delimiters, so no delimiter in user text can close them.
pub fn md_to_typst(md: &str) -> String {
    let mut opts = Options::empty();
    opts.insert(Options::ENABLE_TABLES);
    opts.insert(Options::ENABLE_STRIKETHROUGH);
    opts.insert(Options::ENABLE_TASKLISTS);
    let parser = Parser::new_ext(md, opts);

    let mut out = String::new();
    let mut list_stack: Vec<ListKind> = vec![];
    let mut in_table_header = false;
    let mut code_block: Option<CodeBlock> = None;
    let mut in_image = false;

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
                out.push_str("#raw(");
                out.push_str(&typst_str(&s));
                out.push_str(", block: false)");
            }

            Event::Start(Tag::CodeBlock(kind)) => {
                let lang = match kind {
                    pulldown_cmark::CodeBlockKind::Fenced(info) => info
                        .split_whitespace()
                        .next()
                        .unwrap_or("")
                        .to_string(),
                    pulldown_cmark::CodeBlockKind::Indented => String::new(),
                };
                code_block = Some(CodeBlock { lang, text: String::new() });
            }
            Event::End(TagEnd::CodeBlock) => {
                if let Some(block) = code_block.take() {
                    // pulldown-cmark keeps the trailing newline of the last
                    // line; a block-level raw renders it as an empty line.
                    let text = block.text.strip_suffix('\n').unwrap_or(&block.text);
                    out.push_str("\n#raw(");
                    out.push_str(&typst_str(text));
                    out.push_str(", block: true");
                    if !block.lang.is_empty() {
                        out.push_str(", lang: ");
                        out.push_str(&typst_str(&block.lang));
                    }
                    out.push_str(")\n\n");
                }
            }

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
                out.push_str("#link(");
                out.push_str(&typst_str(&dest_url));
                out.push_str(")[");
            }
            Event::End(TagEnd::Link) => out.push(']'),

            Event::Start(Tag::BlockQuote(_)) => out.push_str("#quote[\n"),
            Event::End(TagEnd::BlockQuote(_)) => out.push_str("\n]\n\n"),

            Event::Rule => out.push_str("\n#line(length: 100%)\n\n"),

            Event::SoftBreak => out.push(' '),
            Event::HardBreak => out.push_str(" \\\n"),

            Event::Text(s) => {
                if in_image {
                    // suppress alt text — images are dropped in v1
                } else if let Some(block) = code_block.as_mut() {
                    block.text.push_str(&s);
                } else {
                    out.push_str(&escape_typst(&s));
                }
            }

            // v1 explicit no-ops:
            Event::Html(_) | Event::InlineHtml(_) => {}
            Event::Start(Tag::Image { .. }) => { in_image = true; }
            Event::End(TagEnd::Image) => { in_image = false; }
            Event::TaskListMarker(_) => {}
            Event::FootnoteReference(_) => {}
            Event::Start(Tag::FootnoteDefinition(_)) => {}
            Event::End(TagEnd::FootnoteDefinition) => {}
            Event::Start(Tag::Strikethrough) | Event::End(TagEnd::Strikethrough) => {}

            // GFM tables:
            Event::Start(Tag::Table(alignments)) => {
                out.push_str(&format!("\n#table(columns: {},\n", alignments.len()));
            }
            Event::End(TagEnd::Table) => {
                out.push_str(")\n\n");
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

struct CodeBlock {
    lang: String,
    text: String,
}

/// Escape text for Typst *markup* mode.
///
/// Typst's lexer treats `\` followed by any non-whitespace character as an
/// escape for that literal character (see typst-syntax `Lexer::backslash`),
/// so escaping is always safe. We escape every ASCII punctuation character
/// rather than an allow-list of "known" markup characters: besides the
/// obvious `# $ [ ] * _ \``, Typst markup also gives meaning to `<label>`,
/// `@ref`, `//` / `/*` comments, line-start `=`, `-`, `+`, `/`, `1.` and
/// shorthands (`~`, `--`, `...`), and `(` / `.` directly after an embedded
/// expression like `#link(..)[..]` continue that expression. The only
/// punctuation left unescaped is `'` and `"`, which merely become smart
/// quotes. `\u{..}` is unreachable because `u` is never escaped and a literal
/// `\` is always doubled.
fn escape_typst(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        if c.is_ascii_punctuation() && c != '\'' && c != '"' {
            out.push('\\');
        }
        out.push(c);
    }
    out
}

/// Render `s` as a Typst string literal (including the surrounding quotes).
fn typst_str(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    out.push('"');
    for c in s.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            '"' => out.push_str("\\\""),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if c.is_control() => out.push_str(&format!("\\u{{{:x}}}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
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
        assert!(out.contains("Hello world\\."), "got: {out}");
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
        assert!(out.contains("#raw(\"code\", block: false)"), "got: {out}");
    }

    #[test]
    fn fenced_code_block() {
        let out = md_to_typst("```rust\nfn main() {}\n```");
        assert!(
            out.contains("#raw(\"fn main() {}\", block: true, lang: \"rust\")"),
            "got: {out}"
        );
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
        let out = md_to_typst("![sunset photo](url.png)");
        assert!(!out.contains("url.png"));
        assert!(!out.contains("sunset photo"), "alt text should not leak, got: {}", out);
    }

    #[test]
    fn code_block_preserves_typst_chars() {
        let out = md_to_typst("```rust\nlet x = arr[0];\nlet h = #1;\n```");
        assert!(out.contains("arr[0]"), "expected literal '[' in code, got: {}", out);
        assert!(out.contains("#1"), "expected literal '#' in code, got: {}", out);
        assert!(!out.contains("\\["), "did not expect escaped '[' in code, got: {}", out);
        assert!(!out.contains("\\#"), "did not expect escaped '#' in code, got: {}", out);
    }

    #[test]
    fn task_list_is_plain_bullet_no_double_marker() {
        let out = md_to_typst("- [ ] todo\n- [x] done");
        assert!(out.contains("- todo"), "got: {}", out);
        assert!(out.contains("- done"), "got: {}", out);
        assert!(!out.contains("- - "), "double-marker bug detected: {}", out);
    }

    #[test]
    fn strikethrough_emits_text_no_decoration() {
        let out = md_to_typst("~~deleted~~");
        assert!(out.contains("deleted"));
        // For v1, strikethrough is dropped; text content emits naturally.
        // No assertion about decoration — just confirming no panic and text survives.
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

    // ---- Typst injection / break-out regression tests ----
    // Each payload tries to escape into Typst code mode and call
    // `panic("pwned")`. If the escape works, compilation fails with a panic
    // diagnostic; when the translator is safe, the document compiles.

    fn compiles(md: &str) -> Result<(), String> {
        let typst = md_to_typst(md);
        crate::compile::compile(typst.clone())
            .map(|_| ())
            .map_err(|e| format!("{e}\n--- typst source ---\n{typst}"))
    }

    #[test]
    fn link_dest_quote_cannot_break_out() {
        compiles(r#"[x](a"+panic("pwned")+")"#).unwrap();
    }

    #[test]
    fn link_dest_trailing_backslash_cannot_break_out() {
        compiles(r#"[x](<a\\>) and more"#).unwrap();
    }

    #[test]
    fn inline_code_with_backticks_cannot_break_out() {
        compiles(r#"`` `#panic("pwned")` ``"#).unwrap();
    }

    #[test]
    fn code_block_with_inner_fence_cannot_break_out() {
        compiles("````\n```\n#panic(\"pwned\")\n```\n````").unwrap();
    }

    #[test]
    fn code_block_lang_cannot_break_out() {
        compiles("```a\"+panic(\"pwned\")+\"\nx\n```").unwrap();
    }

    #[test]
    fn text_comment_markers_do_not_swallow_markup() {
        let md = "[a /* b](https://example.com) and c // d";
        compiles(md).unwrap();
        let out = md_to_typst(md);
        assert!(out.contains("\\/\\*") && out.contains("\\/\\/"), "got: {out}");
    }

    #[test]
    fn text_label_and_ref_syntax_is_literal() {
        compiles("see @missing and <lbl> here").unwrap();
    }

    #[test]
    fn text_after_link_cannot_call_link_result() {
        compiles(r#"[x](https://example.com)("pwned")"#).unwrap();
        compiles(r#"`x`("pwned") and `y`.text"#).unwrap();
    }

    #[test]
    fn table_cell_content_cannot_break_out() {
        compiles("| a | b |\n|---|---|\n| ], panic(\"pwned\"), [ | `` ` ``#panic(\"x\") |").unwrap();
    }

    #[test]
    fn heading_text_cannot_break_out() {
        compiles("# `` `#panic(\"pwned\")` ``").unwrap();
    }

    #[test]
    fn line_start_markup_is_literal() {
        let out = md_to_typst("= not a heading");
        assert!(out.starts_with("\\="), "got: {out}");
        let out = md_to_typst("1\\. not a list");
        assert!(out.starts_with("1\\."), "got: {out}");
    }
}
