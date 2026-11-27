// style-string: an rsx! inside another macro's tokens.
fn Views() -> Vec<Element> {
    vec![rsx! {
        div { style: "color: red" }
    }]
}
