//! The Dioxus spike (issue 18): the app shell, routing for `/tools/<key>`, three
//! layout shells and one tool each. Disposable evidence, not the foundation.
use dioxus::prelude::*;

mod browser;
mod components;
mod head;
mod icons;
mod meta;
mod shells;
mod tools;

use components::{Emoji, NotoEmoji, PageCard};
use icons::{ArrowIcon, GitHubIcon};

// Built by dioxus/scripts/build.sh with Tailwind 4.3.3 from src/index.css.
// `with_static_head` puts the `<link>` in the HTML, so first paint is styled.
static STYLES: Asset = asset!("/assets/generated/tailwind.css", AssetOptions::css().with_static_head(true));

/// One variant per tool, not `/tools/:key`: with `--wasm-split` each leaf route
/// is its own split point, so this is what gives every tool its own chunk.
#[derive(Routable, Clone, PartialEq)]
#[rustfmt::skip]
enum Route {
    #[layout(AppShell)]
        #[route("/")]
        Home {},
        #[route("/tools/hash-generator")]
        HashGenerator {},
        #[route("/tools/escaped-json-stringifier")]
        EscapedJsonStringifier {},
        #[route("/tools/image-converter")]
        ImageConverter {},
        #[route("/:..segments")]
        NotFound { segments: Vec<String> },
}

impl Route {
    fn tool_key(&self) -> Option<&'static str> {
        match self {
            Route::HashGenerator {} => Some("hash-generator"),
            Route::EscapedJsonStringifier {} => Some("escaped-json-stringifier"),
            Route::ImageConverter {} => Some("image-converter"),
            Route::Home {} | Route::NotFound { .. } => None,
        }
    }
}

fn main() {
    // The stylesheet is referenced so the linker keeps it; dx then writes it into the static head.
    std::hint::black_box(&STYLES);
    // `#root`, not dx's default `#main`: the CSS targets it, and a missing id
    // renders into a detached element (docs/research/dioxus-spike-hazards.md).
    dioxus::LaunchBuilder::new().with_cfg(dioxus::web::Config::new().rootname("root")).launch(App);
}

#[component]
fn App() -> Element {
    rsx! { components::ToastProvider { Router::<Route> {} } }
}

#[component]
fn AppShell() -> Element {
    let route = use_route::<Route>();
    let tool = route.tool_key().map(meta::tool);
    if route == (Route::EscapedJsonStringifier {}) {
        // Fetch the editor bundle beside the tool's chunk, not after it.
        components::code_input::prefetch();
    }
    rsx! {
        if let Some(meta) = tool {
            head::ToolHead { meta }
        }
        header { class: "relative z-30 flex h-12 shrink-0 items-center gap-2 px-4 pt-(--safe-area-inset-top)",
            if tool.is_some() {
                Link {
                    "aria-label": "Back to home",
                    class: "flex items-center gap-1 rounded px-2 py-1 text-gray-400 transition-colors hover:text-white",
                    to: Route::Home {},
                    ArrowIcon {}
                    span { "🏠" }
                }
            }
            div { class: "ml-auto flex items-center gap-2",
                a {
                    "aria-label": "GitHub repository",
                    class: "flex size-10 items-center justify-center rounded text-gray-400 transition-colors hover:text-white",
                    href: "https://github.com/boengai/csr-dev-tools",
                    rel: "noopener noreferrer",
                    target: "_blank",
                    GitHubIcon {}
                }
            }
        }
        main { class: "bg-pixel-texture relative flex grow flex-col overflow-y-auto",
            // Above the Outlet: without it a split route suspends the whole app.
            SuspenseBoundary {
                fallback: |_| rsx! {
                    div { class: "flex grow flex-col items-center justify-center",
                        NotoEmoji { emoji: Emoji::FlyingSaucer, size: 200 }
                    }
                },
                Outlet::<Route> {}
            }
        }
    }
}

/// The tool route's frame (React `pages/tools`), inside each tool's chunk.
#[component]
fn ToolPage(tool_key: &'static str, children: Element) -> Element {
    let nav = navigator();
    let name = meta::tool(tool_key).name;
    rsx! {
        div { class: "flex min-h-0 grow flex-col p-2 pb-[calc(0.5rem+var(--safe-area-inset-bottom))] tablet:p-4",
            PageCard { title: name, onclose: move |_| { nav.push(Route::Home {}); }, {children} }
        }
    }
}

#[component]
fn HashGenerator() -> Element {
    rsx! { ToolPage { tool_key: "hash-generator", tools::HashGenerator {} } }
}

#[component]
fn EscapedJsonStringifier() -> Element {
    rsx! { ToolPage { tool_key: "escaped-json-stringifier", tools::EscapedJsonStringifier {} } }
}

#[component]
fn ImageConverter() -> Element {
    rsx! { ToolPage { tool_key: "image-converter", tools::ImageConverter {} } }
}

/// Not part of the spike's measurements: links to the three tools.
#[component]
fn Home() -> Element {
    rsx! {
        div { class: "flex grow flex-col gap-4 p-4",
            h1 { class: "text-heading-4 text-gray-200", "CSR Dev Tools — Dioxus spike" }
            ul { class: "flex flex-col gap-2",
                for tool in meta::TOOLS {
                    li { key: "{tool.key}",
                        a { class: "text-primary-light underline", href: "{tool.route_path}", onclick: move |e: MouseEvent| {
                                e.prevent_default();
                                navigator().push(tool.route_path);
                            },
                            "{tool.name}"
                        }
                        p { class: "text-body-xs text-gray-400", "{tool.description}" }
                    }
                }
            }
        }
    }
}

/// An unknown URL renders the home page, as Cloudflare Pages' fallback does.
#[component]
fn NotFound(segments: Vec<String>) -> Element {
    let _ = segments;
    rsx! { Home {} }
}
