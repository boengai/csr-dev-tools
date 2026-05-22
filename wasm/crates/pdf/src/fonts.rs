use typst::text::{Font, FontBook};
use typst::foundations::Bytes;

/// Bundled font bytes, baked into the crate via `include_bytes!`.
///
/// Order matters: index in this array == font index referenced by the
/// Typst `World::font(index)` lookup.
const FONT_DATA: &[&[u8]] = &[
    // New Computer Modern — default serif
    include_bytes!("../assets/fonts/NewCM10-Regular.otf"),
    include_bytes!("../assets/fonts/NewCM10-Bold.otf"),
    include_bytes!("../assets/fonts/NewCM10-Italic.otf"),
    include_bytes!("../assets/fonts/NewCMMath-Regular.otf"),
    // Inter — sans alternative
    include_bytes!("../assets/fonts/Inter-Regular.otf"),
    include_bytes!("../assets/fonts/Inter-Bold.otf"),
    include_bytes!("../assets/fonts/Inter-Italic.otf"),
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
