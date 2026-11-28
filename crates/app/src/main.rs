//! The Dioxus app. For now it renders an empty shell: the smallest code the
//! Dioxus build, byte and CSP gates can judge (ADR-0036, amended).

mod ported_tools;

use dioxus::prelude::*;

fn main() {
    dioxus::launch(App);
}

#[component]
fn App() -> Element {
    rsx! {
        main { id: "app-shell" }
    }
}
