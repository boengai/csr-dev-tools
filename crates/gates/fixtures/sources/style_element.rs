// style-element: a `style {}` element.
fn View() -> Element {
    rsx! {
        if true {
            style { "p {{ color: red }}" }
        }
    }
}
