//! One violation per denied lint and banned method. Never fix this file: the
//! gate is proven by it failing. Its expected lint names are in `expected.txt`.

mod nested;

use dioxus::prelude::*;
use dioxus::web::{WebEventExt, WebFileExt};

// unreachable_pub
mod inner {
    pub fn reachable_only_in_crate() {}
}

pub fn use_inner() {
    inner::reachable_only_in_crate();
}

// unsafe_code
pub fn unsafe_block() -> u8 {
    unsafe { core::mem::transmute::<i8, u8>(-1) }
}

pub fn unwrap_used(value: Option<u8>) -> u8 {
    value.unwrap()
}

pub fn expect_used(value: Option<u8>) -> u8 {
    value.expect("present")
}

pub fn panic() {
    panic!("boom");
}

pub fn todo() {
    todo!();
}

pub fn unimplemented() {
    unimplemented!();
}

pub fn unwrap_in_result(text: &str) -> Result<u8, String> {
    let value: u8 = text.parse().unwrap();
    Ok(value)
}

pub fn panic_in_result_fn(value: u8) -> Result<u8, ()> {
    if value == 0 {
        panic!("zero");
    }
    Ok(value)
}

pub fn string_slice(text: &str) -> &str {
    &text[1..]
}

pub fn dbg_macro(value: u8) -> u8 {
    dbg!(value)
}

pub fn print_stdout() {
    println!("out");
}

pub fn print_stderr() {
    eprintln!("err");
}

#[must_use]
fn must_be_used() -> u8 {
    1
}

pub fn let_underscore_must_use() {
    let _ = must_be_used();
}

#[allow(dead_code)]
fn allow_attributes_without_reason() {}

#[allow(dead_code, reason = "allow_attributes: #[allow] is denied even with a reason")]
fn allow_attributes() {}

/// pedantic, by one of its lints (`doc_markdown`): see DioxusLabs here.
pub fn pedantic_doc_markdown() {
    nested::nested();
}

pub fn eval() {
    let _ = dioxus::document::eval("1");
    let _ = dioxus::document::document().eval("1".into());
}

pub fn web_event(event: &Event<MouseData>, form: &Event<FormData>) {
    let _ = event.as_web_event();
    let _ = event.try_as_web_event();
    let _ = form.files().first().map(|file| file.get_web_file());
}

pub fn downcasts(
    platform: &mut dioxus::html::PlatformEventData,
    animation: &AnimationData,
    cancel: &CancelData,
    clipboard: &ClipboardData,
    composition: &CompositionData,
    drag: &DragData,
    focus: &FocusData,
    form: &FormData,
    image: &ImageData,
    keyboard: &KeyboardData,
    media: &MediaData,
    mounted: &MountedData,
    mouse: &MouseData,
    pointer: &PointerData,
    resize: &ResizeData,
    scroll: &ScrollData,
    selection: &SelectionData,
    toggle: &ToggleData,
    touch: &TouchData,
    touch_point: &dioxus::html::TouchPoint,
    transition: &TransitionData,
    visible: &VisibleData,
    wheel: &WheelData,
) {
    let _ = platform.downcast::<u8>().is_some();
    let _ = platform.downcast_mut::<u8>().is_some();
    let _ = animation.downcast::<u8>().is_some();
    let _ = cancel.downcast::<u8>().is_some();
    let _ = clipboard.downcast::<u8>().is_some();
    let _ = composition.downcast::<u8>().is_some();
    let _ = drag.downcast::<u8>().is_some();
    let _ = focus.downcast::<u8>().is_some();
    let _ = form.downcast::<u8>().is_some();
    let _ = image.downcast::<u8>().is_some();
    let _ = keyboard.downcast::<u8>().is_some();
    let _ = media.downcast::<u8>().is_some();
    let _ = mounted.downcast::<u8>().is_some();
    let _ = mouse.downcast::<u8>().is_some();
    let _ = pointer.downcast::<u8>().is_some();
    let _ = resize.downcast::<u8>().is_some();
    let _ = scroll.downcast::<u8>().is_some();
    let _ = selection.downcast::<u8>().is_some();
    let _ = toggle.downcast::<u8>().is_some();
    let _ = touch.downcast::<u8>().is_some();
    let _ = touch_point.downcast::<u8>().is_some();
    let _ = transition.downcast::<u8>().is_some();
    let _ = visible.downcast::<u8>().is_some();
    let _ = wheel.downcast::<u8>().is_some();
}

pub fn wasm_traps() {
    let _ = std::time::Instant::now();
    let _ = std::time::SystemTime::now();
    let _ = std::thread::spawn(|| {});
    std::thread::sleep(std::time::Duration::from_millis(1));
}
