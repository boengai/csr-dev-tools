//! Source rules that read inside `rsx!` (with `dioxus-rsx`, as the macro
//! itself does) and inside macro tokens in general.

use std::collections::BTreeSet;

use dioxus_rsx::{
    AttributeName, AttributeValue, BodyNode, CallBody, ElementName, HotLiteral, IfChain,
    TemplateBody,
};
use proc_macro2::{TokenStream, TokenTree};
use syn::visit::Visit;

use crate::RuleHit;
use crate::sources::FileContext;
use crate::syntax::line;

/// `ui`'s app-only items: the dialog primitive and the modal frame. A Tool
/// builds no dialog of its own (the React layout guard).
const APP_ONLY: [&str; 4] = ["Dialog", "dialog", "ModalFrame", "modal_frame"];

pub fn check(context: &FileContext, text: &str, file: &syn::File) -> Vec<RuleHit> {
    let mut visitor = RsxVisitor { found: Vec::new() };
    visitor.visit_file(file);
    let mut found = visitor.found;
    if context.is_tool() {
        found.extend(token_rules(context, text));
    }
    found
}

struct RsxVisitor {
    found: Vec<RuleHit>,
}

impl Visit<'_> for RsxVisitor {
    fn visit_macro(&mut self, mac: &syn::Macro) {
        if mac
            .path
            .segments
            .last()
            .is_none_or(|last| last.ident != "rsx")
        {
            return;
        }
        match syn::parse2::<CallBody>(mac.tokens.clone()) {
            Ok(body) => self.body(&body.body),
            Err(error) => self.found.push((
                "parse",
                line(error.span()),
                format!("cannot parse rsx!: {error}"),
            )),
        }
    }
}

impl RsxVisitor {
    fn body(&mut self, body: &TemplateBody) {
        for node in &body.roots {
            self.node(node);
        }
    }

    fn node(&mut self, node: &BodyNode) {
        match node {
            BodyNode::Element(element) => {
                if let ElementName::Ident(name) = &element.name
                    && name == "style"
                {
                    self.found.push((
                        "style-element",
                        line(name.span()),
                        "no <style> element in our own rsx! (ADR-0034)".to_owned(),
                    ));
                }
                for attr in &element.raw_attributes {
                    let is_style =
                        matches!(&attr.name, AttributeName::BuiltIn(name) if name == "style");
                    if is_style
                        && matches!(
                            attr.value,
                            AttributeValue::AttrLiteral(HotLiteral::Fmted(_))
                        )
                    {
                        let at = match &attr.name {
                            AttributeName::BuiltIn(name) => line(name.span()),
                            _ => 0,
                        };
                        self.found.push((
                            "style-string",
                            at,
                            "no `style: \"…\"` string: use a class (ADR-0034)".to_owned(),
                        ));
                    }
                }
                for child in &element.children {
                    self.node(child);
                }
            }
            BodyNode::Component(component) => self.body(&component.children),
            BodyNode::ForLoop(for_loop) => self.body(&for_loop.body),
            BodyNode::IfChain(chain) => self.if_chain(chain),
            _ => {}
        }
    }

    fn if_chain(&mut self, chain: &IfChain) {
        self.body(&chain.then_branch);
        if let Some(next) = &chain.else_if_branch {
            self.if_chain(next);
        }
        if let Some(branch) = &chain.else_branch {
            self.body(branch);
        }
    }
}

/// Rules over every token, macros included: app-only `ui` items and
/// off-theme text colours in a Tool.
fn token_rules(context: &FileContext, text: &str) -> Vec<RuleHit> {
    let Ok(tokens) = text.parse::<TokenStream>() else {
        return Vec::new();
    };
    let mut app_only_lines = BTreeSet::new();
    let mut off_theme_lines = BTreeSet::new();
    walk(tokens, &mut |tree| match tree {
        TokenTree::Ident(ident) if APP_ONLY.iter().any(|name| ident == name) => {
            app_only_lines.insert(line(ident.span()));
        }
        TokenTree::Literal(literal)
            if context.custom_tool && is_off_theme(&literal.to_string()) =>
        {
            off_theme_lines.insert(line(literal.span()));
        }
        _ => {}
    });
    let app_only = app_only_lines.into_iter().map(|at| {
        (
            "tool-app-only",
            at,
            "a Tool reaches no app-only ui item (the dialog primitive, the modal frame)".to_owned(),
        )
    });
    let off_theme = off_theme_lines.into_iter().map(|at| {
        ("off-theme-text", at, "a custom Tool uses no text-red-* or text-yellow-* class: use the theme's error and warning colours".to_owned())
    });
    app_only.chain(off_theme).collect()
}

fn walk(tokens: TokenStream, visit: &mut impl FnMut(&TokenTree)) {
    for tree in tokens {
        visit(&tree);
        if let TokenTree::Group(group) = tree {
            walk(group.stream(), visit);
        }
    }
}

/// `text-red-500` or `text-yellow-300`, as a whole class.
fn is_off_theme(literal: &str) -> bool {
    literal
        .split(|c: char| c.is_whitespace() || c == '"' || c == ':')
        .filter_map(|class| {
            class
                .strip_prefix("text-red-")
                .or_else(|| class.strip_prefix("text-yellow-"))
        })
        .any(|shade| !shade.is_empty() && shade.chars().all(|c| c.is_ascii_digit()))
}
