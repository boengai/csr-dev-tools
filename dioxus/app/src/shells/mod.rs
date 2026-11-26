//! The layout shells (docs/ux): each owns the layout order, the status slot and
//! the output placement, so a tool only supplies its controls and its compute.
mod codec;
mod file_processor;
mod transformer;

pub use codec::{CodecMode, CodecShell};
pub use file_processor::{BatchFileProcessor, Process, Processed};
pub use transformer::TransformerShell;


use dioxus::prelude::*;

use crate::browser;

/// The inline tool surface of the tool route (React `ToolDialogFrame` in the
/// `page` presentation): `data-slot="tool-surface"`, the description, the body.
#[component]
pub fn ToolSurface(title: String, description: String, children: Element) -> Element {
    rsx! {
        section { "aria-label": title, class: "flex w-full grow flex-col gap-4", "data-slot": "tool-surface",
            p { class: "shrink-0 text-body-xs text-gray-400", "{description}" }
            {children}
        }
    }
}

/// `source` as it stands `ms` after the last change: typing waits, the first value does not.
pub fn use_debounced(source: Signal<String>, ms: i32) -> Signal<String> {
    let mut settled = use_signal(|| source.peek().clone());
    let mut generation = use_signal(|| 0u64);
    use_effect(move || {
        let value = source();
        if value == *settled.peek() {
            return;
        }
        let mine = *generation.peek() + 1;
        generation.set(mine);
        spawn(async move {
            browser::sleep(ms).await;
            if *generation.peek() == mine {
                settled.set(value);
            }
        });
    });
    settled
}
