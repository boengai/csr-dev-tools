use wasm_bindgen::prelude::*;

mod block;
mod emit;
mod html_parse;
mod html_to_md;
mod inline;

// Public for testing across modules
pub use block::parse_blocks;
pub use emit::blocks_to_html;

#[wasm_bindgen]
pub fn markdown_to_html(md: &str) -> String {
    let blocks = block::parse_blocks(md);
    emit::blocks_to_html(&blocks)
}

#[wasm_bindgen]
pub fn html_to_markdown(html: &str) -> String {
    html_to_md::convert(html)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_roundtrip_heading() {
        let html = markdown_to_html("# Hello");
        assert!(html.contains("<h1>"), "md->html should contain <h1>: {}", html);
        let md = html_to_markdown(&html);
        assert!(md.contains("# Hello"), "html->md should contain # Hello: {}", md);
    }

    #[test]
    fn test_markdown_to_html_bold() {
        let html = markdown_to_html("**bold**");
        assert!(html.contains("<strong>bold</strong>"), "got: {}", html);
    }

    #[test]
    fn test_html_to_markdown_heading() {
        let md = html_to_markdown("<h1>Hello</h1>");
        assert!(md.contains("# Hello"), "got: {}", md);
    }

    #[test]
    fn test_sanitization_no_script() {
        let html = markdown_to_html("<script>alert('xss')</script>");
        assert!(!html.contains("<script"), "got: {}", html);
    }
}
