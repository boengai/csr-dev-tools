//! The React icons (src/components/common/icon), same paths and sizes.
use dioxus::prelude::*;

#[component]
fn Stroke(size: Option<u32>, children: Element) -> Element {
    let size = size.map_or("1em".to_string(), |s| s.to_string());
    rsx! {
        svg {
            fill: "none",
            height: "{size}",
            stroke: "currentColor",
            stroke_linecap: "round",
            stroke_linejoin: "round",
            stroke_width: "2",
            view_box: "0 0 24 24",
            width: "{size}",
            xmlns: "http://www.w3.org/2000/svg",
            {children}
        }
    }
}

#[component]
pub fn ArrowIcon() -> Element {
    rsx! { Stroke { path { d: "m12 19-7-7 7-7" } path { d: "M19 12H5" } } }
}

#[component]
pub fn UploadIcon(size: Option<u32>) -> Element {
    rsx! {
        Stroke { size, path { d: "M12 3v12" } path { d: "m17 8-5-5-5 5" } path { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" } }
    }
}

#[component]
pub fn DownloadIcon() -> Element {
    rsx! {
        Stroke { path { d: "M12 15V3" } path { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" } path { d: "m7 10 5 5 5-5" } }
    }
}

#[component]
pub fn XIcon(size: Option<u32>) -> Element {
    rsx! { Stroke { size, path { d: "M18 6 6 18" } path { d: "m6 6 12 12" } } }
}

#[component]
pub fn ImageIcon() -> Element {
    rsx! {
        Stroke {
            rect { height: "18", rx: "2", ry: "2", width: "18", x: "3", y: "3" }
            circle { cx: "9", cy: "9", r: "2" }
            path { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }
        }
    }
}

#[component]
pub fn CopyIcon() -> Element {
    rsx! {
        Stroke {
            size: 16,
            rect { height: "14", rx: "2", ry: "2", width: "14", x: "8", y: "8" }
            path { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }
        }
    }
}

#[component]
pub fn CheckIcon() -> Element {
    rsx! { Stroke { size: 16, path { d: "M20 6 9 17l-5-5" } } }
}

#[component]
pub fn ChevronDownIcon() -> Element {
    rsx! { Stroke { path { d: "m6 9 6 6 6-6" } } }
}

#[component]
pub fn GitHubIcon() -> Element {
    rsx! {
        svg {
            fill: "currentColor",
            height: "1em",
            view_box: "0 0 24 24",
            width: "1em",
            xmlns: "http://www.w3.org/2000/svg",
            path { d: "M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" }
        }
    }
}
