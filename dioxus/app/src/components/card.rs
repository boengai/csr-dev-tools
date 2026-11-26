use dioxus::prelude::*;

/// The tool route's card (React `Card variant="page"`): the tool name as the
/// page's `h1`, and a close dot that goes home.
#[component]
pub fn PageCard(title: String, onclose: EventHandler<()>, children: Element) -> Element {
    rsx! {
        article { class: "relative flex size-full grow flex-col overflow-hidden rounded-card border border-gray-800 bg-gray-900 animate-[card-in_0.3s_cubic-bezier(0.4,0,0.2,1)]",
            div { class: "flex w-full shrink-0 items-center gap-3 border-b border-gray-800 px-4 py-2",
                button {
                    class: "relative size-3 shrink-0 rounded-full bg-error transition-[opacity,transform] duration-150 ease-out before:absolute before:inset-[-12px] before:content-[''] hover:scale-115 hover:opacity-80 active:scale-90",
                    r#type: "button",
                    onclick: move |_| onclose.call(()),
                    span { class: "sr-only", "Close" }
                }
                h1 { class: "grow truncate text-body-sm text-gray-400", "{title}" }
            }
            div { class: "flex size-full grow flex-col overflow-y-auto p-4", {children} }
        }
    }
}
