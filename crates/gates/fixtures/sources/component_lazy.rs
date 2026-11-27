// component-lazy: `#[component(lazy)]` silently emits nothing (ADR-0035 §7).
#[component(lazy)]
fn HashGenerator() -> Element {
    rsx! {}
}
