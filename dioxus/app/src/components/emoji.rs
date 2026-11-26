use dioxus::prelude::*;

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Emoji {
    FlyingSaucer,
    Robot,
}

impl Emoji {
    const fn code(self) -> &'static str {
        match self {
            Self::FlyingSaucer => "1f6f8",
            Self::Robot => "1f916",
        }
    }

    const fn alt(self) -> &'static str {
        match self {
            Self::FlyingSaucer => "flying-saucer",
            Self::Robot => "robot",
        }
    }
}

/// The animated Noto emoji from fonts.gstatic.com (React `NotoEmoji`). Without
/// the `emoji` feature it keeps its box and loads nothing: budget runs measure
/// both builds without these images (docs/perf/budgets.md).
#[component]
pub fn NotoEmoji(emoji: Emoji, size: u32) -> Element {
    let code = emoji.code();
    rsx! {
        picture { class: "shrink-0", style: "height: {size}px; width: {size}px",
            if cfg!(feature = "emoji") {
                source { "srcset": "https://fonts.gstatic.com/s/e/notoemoji/latest/{code}/512.webp", r#type: "image/webp" }
                img {
                    alt: emoji.alt(),
                    height: "{size}",
                    src: "https://fonts.gstatic.com/s/e/notoemoji/latest/{code}/512.gif",
                    width: "{size}",
                }
            }
        }
    }
}
