//! Source rules read from the syntax tree: components, props, Tool entries
//! and crate-level exemptions.

use proc_macro2::Span;
use syn::spanned::Spanned;
use syn::visit::{self, Visit};
use syn::{Attribute, Fields, FnArg, ItemFn, ItemStruct, Pat};

use crate::sources::FileContext;
use crate::workspace::Layer;

/// A `#[component]` body is at most this many lines (stands in for
/// `too_many_lines`, which skips components).
pub const MAX_COMPONENT_LINES: usize = 80;

/// Props a common component never takes (ADR-0034).
const BANNED_PROPS: [&str; 2] = ["class", "style"];

type Raw = (&'static str, usize, String);

pub fn line(span: Span) -> usize {
    span.start().line
}

/// Lines held by `#[cfg(test)]` modules, which the file size does not count.
pub fn test_module_lines(file: &syn::File) -> usize {
    file.items
        .iter()
        .filter_map(|item| match item {
            syn::Item::Mod(module) if module.attrs.iter().any(is_cfg_test) => Some(module.span()),
            _ => None,
        })
        .map(|span| span.end().line - span.start().line + 1)
        .sum()
}

fn is_cfg_test(attr: &Attribute) -> bool {
    attr.path().is_ident("cfg")
        && attr
            .meta
            .require_list()
            .is_ok_and(|list| list.tokens.to_string() == "test")
}

pub fn check(context: &FileContext, file: &syn::File) -> Vec<Raw> {
    let mut visitor = Visitor {
        context,
        found: Vec::new(),
    };
    if context.is_tool() && context.crate_root {
        for attr in file
            .attrs
            .iter()
            .filter(|attr| attr.path().is_ident("expect"))
        {
            visitor.found.push((
                "crate-expect",
                line(attr.span()),
                "no crate-level #![expect] in a Tool crate: put it on the smallest item".to_owned(),
            ));
        }
    }
    visitor.visit_file(file);
    visitor.found
}

/// The Tool entries a file declares: `lazy_loader!` or `ui`'s entry macro.
pub fn tool_entries(file: &syn::File) -> usize {
    let mut counter = EntryCounter(0);
    counter.visit_file(file);
    counter.0
}

struct EntryCounter(usize);

impl Visit<'_> for EntryCounter {
    fn visit_macro(&mut self, mac: &syn::Macro) {
        if mac
            .path
            .segments
            .last()
            .is_some_and(|last| last.ident == "lazy_loader" || last.ident == "tool_entry")
        {
            self.0 += 1;
        }
    }
}

struct Visitor<'a> {
    context: &'a FileContext,
    found: Vec<Raw>,
}

fn last_segment_is(attr: &Attribute, name: &str) -> bool {
    attr.path()
        .segments
        .last()
        .is_some_and(|last| last.ident == name)
}

impl Visitor<'_> {
    fn component(
        &mut self,
        attrs: &[Attribute],
        inputs: impl Iterator<Item = FnArg>,
        block: &syn::Block,
    ) {
        let Some(attr) = attrs.iter().find(|attr| last_segment_is(attr, "component")) else {
            return;
        };
        let at = line(attr.span());
        let lazy = attr
            .meta
            .require_list()
            .is_ok_and(|list| list.tokens.to_string().contains("lazy"));
        if lazy {
            self.found.push((
                "component-lazy",
                at,
                "no #[component(lazy)]: a Tool loads through its one Tool entry (ADR-0035 §7)"
                    .to_owned(),
            ));
        }
        let span = block.brace_token.span.join();
        let body = (span.end().line - span.start().line).saturating_sub(1);
        if body > MAX_COMPONENT_LINES {
            self.found.push((
                "component-size",
                at,
                format!(
                    "a #[component] body of {body} lines, over {MAX_COMPONENT_LINES}: split it"
                ),
            ));
        }
        if self.context.layer == Layer::Ui {
            for input in inputs {
                if let FnArg::Typed(typed) = input
                    && let Pat::Ident(ident) = typed.pat.as_ref()
                    && BANNED_PROPS.iter().any(|banned| ident.ident == banned)
                {
                    self.found
                        .push(ui_props(ident.ident.span(), &ident.ident.to_string()));
                }
            }
        }
    }
}

fn ui_props(span: Span, name: &str) -> Raw {
    (
        "ui-props",
        line(span),
        format!(
            "a common component takes no `{name}`: add a named variant prop instead (ADR-0034)"
        ),
    )
}

impl Visit<'_> for Visitor<'_> {
    fn visit_item_fn(&mut self, item: &ItemFn) {
        self.component(&item.attrs, item.sig.inputs.iter().cloned(), &item.block);
        visit::visit_item_fn(self, item);
    }

    fn visit_impl_item_fn(&mut self, item: &syn::ImplItemFn) {
        self.component(&item.attrs, item.sig.inputs.iter().cloned(), &item.block);
        visit::visit_impl_item_fn(self, item);
    }

    fn visit_item_struct(&mut self, item: &ItemStruct) {
        let props = item
            .attrs
            .iter()
            .any(|attr| attr.path().is_ident("derive") && list_contains(attr, "Props"));
        if self.context.layer == Layer::Ui
            && props
            && let Fields::Named(fields) = &item.fields
        {
            for field in &fields.named {
                if let Some(ident) = field
                    .ident
                    .as_ref()
                    .filter(|ident| BANNED_PROPS.iter().any(|banned| *ident == banned))
                {
                    self.found.push(ui_props(ident.span(), &ident.to_string()));
                }
                for attr in field
                    .attrs
                    .iter()
                    .filter(|attr| attr.path().is_ident("props"))
                {
                    if list_contains(attr, "GlobalAttributes") {
                        self.found.push((
                            "ui-props",
                            line(attr.span()),
                            "no `extends = GlobalAttributes` on a common component (ADR-0034)"
                                .to_owned(),
                        ));
                    }
                }
            }
        }
        visit::visit_item_struct(self, item);
    }
}

fn list_contains(attr: &Attribute, needle: &str) -> bool {
    attr.meta
        .require_list()
        .is_ok_and(|list| list.tokens.to_string().contains(needle))
}
