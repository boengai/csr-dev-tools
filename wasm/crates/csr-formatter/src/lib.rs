use wasm_bindgen::prelude::*;

mod css;
mod html;
mod js;
mod sql;

#[wasm_bindgen]
pub fn format_css(input: &str, indent: u32, use_tabs: bool) -> String {
    css::format(input, indent, use_tabs)
}

#[wasm_bindgen]
pub fn minify_css(input: &str) -> String {
    css::minify(input)
}

#[wasm_bindgen]
pub fn format_html(input: &str, indent: u32, use_tabs: bool) -> String {
    html::format(input, indent, use_tabs)
}

#[wasm_bindgen]
pub fn minify_html(input: &str) -> String {
    html::minify(input)
}

#[wasm_bindgen]
pub fn format_js(input: &str, indent: u32, use_tabs: bool) -> String {
    js::format(input, indent, use_tabs)
}

#[wasm_bindgen]
pub fn minify_js(input: &str) -> String {
    js::minify(input)
}

#[wasm_bindgen]
pub fn format_sql(input: &str, dialect: &str, indent: u32) -> String {
    sql::format(input, dialect, indent)
}
