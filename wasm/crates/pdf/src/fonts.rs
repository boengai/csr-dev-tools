use typst::text::{Font, FontBook};
use typst::foundations::Bytes;

/// Bundled font bytes, baked into the crate via `include_bytes!`.
///
/// Order matters: index in this array == font index referenced by the
/// Typst `World::font(index)` lookup.
///
/// Only the families named in `preamble.rs` are bundled. Every font here
/// adds its full size to `pdf_bg.wasm`, which must stay under Cloudflare
/// Pages' 25 MiB per-file limit. Inter and NewCMMath were dropped: nothing
/// selects Inter, and math mode is unreachable (`md_to_typst` escapes `$`
/// and never enables pulldown-cmark math; the HTML path goes through
/// Markdown first).
const FONT_DATA: &[&[u8]] = &[
    // New Computer Modern — default serif
    include_bytes!("../assets/fonts/NewCM10-Regular.otf"),
    include_bytes!("../assets/fonts/NewCM10-Bold.otf"),
    include_bytes!("../assets/fonts/NewCM10-Italic.otf"),
    // JetBrains Mono — monospace for code
    include_bytes!("../assets/fonts/JetBrainsMono-Regular.ttf"),
    include_bytes!("../assets/fonts/JetBrainsMono-Bold.ttf"),
    include_bytes!("../assets/fonts/JetBrainsMono-Italic.ttf"),
];

pub struct Fonts {
    pub book: FontBook,
    pub fonts: Vec<Font>,
}

impl Fonts {
    pub fn load() -> Self {
        let mut book = FontBook::new();
        let mut fonts = Vec::with_capacity(FONT_DATA.len());

        for bytes in FONT_DATA {
            let data = Bytes::new(*bytes);
            if let Some(font) = Font::new(data, 0) {
                book.push(font.info().clone());
                fonts.push(font);
            }
        }

        Self { book, fonts }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_bundled_font_parses() {
        let fonts = Fonts::load();
        assert_eq!(fonts.fonts.len(), FONT_DATA.len());
        let families: Vec<_> = fonts.book.families().map(|(name, _)| name.to_string()).collect();
        assert!(families.iter().any(|f| f == "New Computer Modern"), "{families:?}");
        assert!(families.iter().any(|f| f == "JetBrains Mono"), "{families:?}");
    }
}
