// off-theme-text: a custom Tool colours its own error text.
fn View() -> Element {
    rsx! {
        p { class: "mt-2 text-red-500", "Invalid input" }
    }
}
