// ui-props: a class prop, a style field and extends = GlobalAttributes in ui.
#[component]
fn Button(label: String, class: String) -> Element {
    rsx! {
        button { "{label}" }
    }
}

#[derive(Props, Clone, PartialEq)]
struct CardProps {
    style: String,
    #[props(extends = GlobalAttributes)]
    attributes: Vec<Attribute>,
}
