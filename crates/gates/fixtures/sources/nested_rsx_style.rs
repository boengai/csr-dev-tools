// style-string: a `style: "…"` string inside an rsx! nested in a closure.
fn View(items: Vec<String>) -> Element {
    rsx! {
        ul {
            {items.iter().map(|item| rsx! {
                li { style: "color: red", "{item}" }
            })}
        }
    }
}
