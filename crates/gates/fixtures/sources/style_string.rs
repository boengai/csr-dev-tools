// style-string: a `style: "…"` string attribute.
fn View() -> Element {
    rsx! {
        div { class: "p-2",
            span { style: "color: red", "hi" }
        }
    }
}
