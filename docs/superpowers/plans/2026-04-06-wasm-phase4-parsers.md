# Phase 4: Parsers — WASM Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `csr-parsers` and `csr-json-tools` Rust WASM crates to replace `fast-xml-parser`, `yaml`, `smol-toml`, `protobufjs`, and hand-written JSON/TypeScript utilities.

**Architecture:** Two workspace crates — `csr-parsers` (multi-module: XML, YAML, TOML, protobuf schema, protobuf codec) and `csr-json-tools` (JSON formatting, JSON-to-TypeScript, JSON deep sort/normalize). Each module is a separate Rust file with `#[wasm_bindgen]` exports in `lib.rs`. TypeScript wrappers in `src/wasm/` delegate to WASM; existing `src/utils/*.ts` files swap their imports to point at the WASM wrappers.

**Tech Stack:** Rust (hand-written parsers), wasm-bindgen, serde + serde_json + serde-wasm-bindgen, wasm-pack, Vite

---

## File Structure

### Crate: `csr-parsers`

```
wasm/crates/csr-parsers/
├── Cargo.toml
└── src/
    ├── lib.rs              # #[wasm_bindgen] exports for all parsers
    ├── xml/
    │   ├── mod.rs           # Re-exports parser + builder
    │   ├── parser.rs        # XML -> serde_json::Value
    │   └── builder.rs       # serde_json::Value -> XML string
    ├── yaml/
    │   ├── mod.rs           # Re-exports parser + emitter
    │   ├── parser.rs        # YAML -> serde_json::Value
    │   └── emitter.rs       # serde_json::Value -> YAML string
    ├── toml_parser/
    │   ├── mod.rs           # Re-exports parser + emitter
    │   ├── parser.rs        # TOML -> serde_json::Value
    │   └── emitter.rs       # serde_json::Value -> TOML string
    ├── proto_schema/
    │   ├── mod.rs           # Re-exports lexer + parser + sample gen
    │   ├── lexer.rs         # Proto3/2 tokenizer
    │   ├── parser.rs        # Tokens -> ProtobufSchemaInfo
    │   ├── sample.rs        # Generate sample JSON from schema
    │   └── types.rs         # Rust structs mirroring TS ProtobufMessageInfo etc.
    └── proto_codec/
        ├── mod.rs           # Re-exports encode + decode
        ├── encode.rs        # JSON + schema -> protobuf binary
        ├── decode.rs        # Protobuf binary + schema -> JSON
        └── wire.rs          # Wire format reader/writer (varint, length-delimited, etc.)
```

### Crate: `csr-json-tools`

```
wasm/crates/csr-json-tools/
├── Cargo.toml
└── src/
    ├── lib.rs              # #[wasm_bindgen] exports
    ├── format.rs           # formatJson, getJsonParseError
    ├── json_to_ts.rs       # JSON -> TypeScript interface/type generation
    └── deep_sort.rs        # deepSortJson, normalizeJson
```

### TypeScript Wrappers

```
src/wasm/
├── csr-parsers.ts          # Thin async wrapper for all parser WASM exports
└── csr-json-tools.ts       # Thin async wrapper for json-tools WASM exports
```

### Modified Files (import swap)

```
src/utils/xml.ts            # Swap fast-xml-parser -> @/wasm/csr-parsers
src/utils/yaml.ts           # Swap yaml -> @/wasm/csr-parsers
src/utils/toml.ts           # Swap smol-toml -> @/wasm/csr-parsers
src/utils/json.ts           # Swap native JSON -> @/wasm/csr-json-tools
src/utils/json-to-typescript.ts  # Swap pure TS -> @/wasm/csr-json-tools
src/utils/json-diff.ts      # Swap pure TS -> @/wasm/csr-json-tools
src/utils/protobuf-to-json.ts   # Swap protobufjs -> @/wasm/csr-parsers
src/utils/protobuf-codec.ts     # Swap protobufjs -> @/wasm/csr-parsers
```

---

## Task 1: Scaffold `csr-parsers` crate with XML module

**Files:**
- Create: `wasm/crates/csr-parsers/Cargo.toml`
- Create: `wasm/crates/csr-parsers/src/lib.rs`
- Create: `wasm/crates/csr-parsers/src/xml/mod.rs`
- Create: `wasm/crates/csr-parsers/src/xml/parser.rs`
- Create: `wasm/crates/csr-parsers/src/xml/builder.rs`

- [ ] **Step 1: Create Cargo.toml**

```toml
[package]
name = "csr-parsers"
version = "0.1.0"
edition.workspace = true

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = { version = "1", features = ["preserve_order"] }
serde-wasm-bindgen = "0.6"
wasm-bindgen = "0.2"
```

- [ ] **Step 2: Create XML parser (`src/xml/parser.rs`)**

Hand-written recursive-descent XML parser. Converts XML string to `serde_json::Value`. Must support:
- Element nesting (`<root><child>text</child></root>`)
- Attributes with `@_` prefix (`<item id="1">` -> `{"@_id": "1"}`)
- Text content (stored as `#text` when mixed with attributes/children)
- Self-closing tags (`<br/>`)
- CDATA sections
- XML declaration (`<?xml ... ?>`) — skip/ignore
- Comments (`<!-- ... -->`) — skip/ignore
- Numeric text auto-coercion: `"30"` -> `30` (matching fast-xml-parser default)
- Multiple same-name siblings become JSON arrays

Key behaviors from the test suite:
- `xmlToJson('<root><name>John</name><age>30</age></root>')` must produce `{"root":{"name":"John","age":30}}` (age is number, not string)
- `xmlToJson('<item id="1">test</item>')` must produce `{"item":{"@_id":"1","#text":"test"}}` or `{"item":{"@_id":1,"#text":"test"}}` — attribute `id="1"` should be coerced to number `1`

```rust
// wasm/crates/csr-parsers/src/xml/parser.rs
use serde_json::{Map, Value};

pub fn xml_to_json(input: &str) -> Result<Value, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Empty input".into());
    }

    let mut parser = XmlParser::new(trimmed);
    parser.parse_document()
}

pub fn validate_xml(input: &str) -> Option<String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Some("Empty input".into());
    }
    match xml_to_json(input) {
        Ok(_) => None,
        Err(e) => Some(e),
    }
}

struct XmlParser<'a> {
    input: &'a str,
    pos: usize,
}

impl<'a> XmlParser<'a> {
    fn new(input: &'a str) -> Self {
        Self { input, pos: 0 }
    }

    fn remaining(&self) -> &'a str {
        &self.input[self.pos..]
    }

    fn peek(&self) -> Option<char> {
        self.remaining().chars().next()
    }

    fn advance(&mut self, n: usize) {
        self.pos += n;
    }

    fn skip_whitespace(&mut self) {
        while self.pos < self.input.len()
            && self.input.as_bytes()[self.pos].is_ascii_whitespace()
        {
            self.pos += 1;
        }
    }

    fn starts_with(&self, s: &str) -> bool {
        self.remaining().starts_with(s)
    }

    fn parse_document(&mut self) -> Result<Value, String> {
        self.skip_whitespace();

        // Skip XML declaration <?xml ... ?>
        if self.starts_with("<?") {
            self.skip_processing_instruction()?;
            self.skip_whitespace();
        }

        // Skip comments and whitespace before root element
        self.skip_comments_and_whitespace();

        let (name, value) = self.parse_element()?;
        let mut map = Map::new();
        map.insert(name, value);
        Ok(Value::Object(map))
    }

    fn skip_processing_instruction(&mut self) -> Result<(), String> {
        if !self.starts_with("<?") {
            return Err("Expected processing instruction".into());
        }
        match self.remaining().find("?>") {
            Some(end) => {
                self.advance(end + 2);
                Ok(())
            }
            None => Err("Unterminated processing instruction".into()),
        }
    }

    fn skip_comments_and_whitespace(&mut self) {
        loop {
            self.skip_whitespace();
            if self.starts_with("<!--") {
                if let Some(end) = self.remaining().find("-->") {
                    self.advance(end + 3);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }

    fn parse_element(&mut self) -> Result<(String, Value), String> {
        self.skip_whitespace();
        if self.peek() != Some('<') {
            return Err(format!(
                "Expected '<', found {:?}",
                self.remaining().chars().next()
            ));
        }
        self.advance(1); // skip '<'

        let tag_name = self.parse_name()?;
        let attributes = self.parse_attributes()?;

        self.skip_whitespace();

        // Self-closing tag
        if self.starts_with("/>") {
            self.advance(2);
            if attributes.is_empty() {
                return Ok((tag_name, Value::String(String::new())));
            }
            let mut map = Map::new();
            for (k, v) in attributes {
                map.insert(k, v);
            }
            return Ok((tag_name, Value::Object(map)));
        }

        // Expect '>'
        if self.peek() != Some('>') {
            return Err(format!("Expected '>' in tag <{}>", tag_name));
        }
        self.advance(1);

        // Parse children and text content
        let mut children: Map<String, Value> = Map::new();
        let mut text_parts: Vec<String> = Vec::new();

        loop {
            self.skip_comments_and_whitespace();

            if self.starts_with("</") {
                // Closing tag
                self.advance(2);
                let close_name = self.parse_name()?;
                self.skip_whitespace();
                if self.peek() != Some('>') {
                    return Err(format!("Expected '>' in closing tag </{}>", close_name));
                }
                self.advance(1);
                if close_name != tag_name {
                    return Err(format!(
                        "Mismatched closing tag: expected </{}>, found </{}>",
                        tag_name, close_name
                    ));
                }
                break;
            } else if self.starts_with("<![CDATA[") {
                self.advance(9);
                let cdata_text = self.parse_until("]]>")?;
                text_parts.push(cdata_text);
            } else if self.starts_with("<") {
                // Child element
                let (child_name, child_value) = self.parse_element()?;
                if let Some(existing) = children.remove(&child_name) {
                    // Convert to array for multiple same-name siblings
                    match existing {
                        Value::Array(mut arr) => {
                            arr.push(child_value);
                            children.insert(child_name, Value::Array(arr));
                        }
                        _ => {
                            children
                                .insert(child_name, Value::Array(vec![existing, child_value]));
                        }
                    }
                } else {
                    children.insert(child_name, child_value);
                }
            } else {
                // Text content
                let text = self.parse_text_content();
                if !text.is_empty() {
                    text_parts.push(text);
                }
            }
        }

        let full_text = text_parts.join("");
        let has_children = !children.is_empty();
        let has_attributes = !attributes.is_empty();
        let has_text = !full_text.is_empty();

        // Build result value
        if !has_children && !has_attributes {
            // Text-only element
            return Ok((tag_name, coerce_value(&full_text)));
        }

        let mut map = Map::new();

        // Add attributes
        for (k, v) in attributes {
            map.insert(k, v);
        }

        // Add children
        for (k, v) in children {
            map.insert(k, v);
        }

        // Add text if mixed content
        if has_text && (has_children || has_attributes) {
            map.insert("#text".into(), coerce_value(&full_text));
        }

        Ok((tag_name, Value::Object(map)))
    }

    fn parse_name(&mut self) -> Result<String, String> {
        let start = self.pos;
        while self.pos < self.input.len() {
            let b = self.input.as_bytes()[self.pos];
            if b.is_ascii_alphanumeric()
                || b == b'_'
                || b == b'-'
                || b == b'.'
                || b == b':'
            {
                self.pos += 1;
            } else {
                break;
            }
        }
        if self.pos == start {
            return Err("Expected element/attribute name".into());
        }
        Ok(self.input[start..self.pos].to_string())
    }

    fn parse_attributes(&mut self) -> Result<Vec<(String, Value)>, String> {
        let mut attrs = Vec::new();
        loop {
            self.skip_whitespace();
            if self.peek() == Some('>')
                || self.peek() == Some('/')
                || self.pos >= self.input.len()
            {
                break;
            }
            let name = self.parse_name()?;
            self.skip_whitespace();
            if self.peek() != Some('=') {
                return Err(format!("Expected '=' after attribute {}", name));
            }
            self.advance(1);
            self.skip_whitespace();
            let value = self.parse_attribute_value()?;
            attrs.push((format!("@_{}", name), coerce_value(&value)));
        }
        Ok(attrs)
    }

    fn parse_attribute_value(&mut self) -> Result<String, String> {
        let quote = match self.peek() {
            Some(q @ ('"' | '\'')) => q,
            _ => return Err("Expected quote for attribute value".into()),
        };
        self.advance(1);
        let start = self.pos;
        while self.pos < self.input.len() && self.input.as_bytes()[self.pos] != quote as u8
        {
            self.pos += 1;
        }
        if self.pos >= self.input.len() {
            return Err("Unterminated attribute value".into());
        }
        let value = self.input[start..self.pos].to_string();
        self.advance(1); // skip closing quote
        Ok(value)
    }

    fn parse_text_content(&mut self) -> String {
        let start = self.pos;
        while self.pos < self.input.len() && self.input.as_bytes()[self.pos] != b'<' {
            self.pos += 1;
        }
        let raw = &self.input[start..self.pos];
        decode_xml_entities(raw)
    }

    fn parse_until(&mut self, delimiter: &str) -> Result<String, String> {
        match self.remaining().find(delimiter) {
            Some(idx) => {
                let text = self.input[self.pos..self.pos + idx].to_string();
                self.advance(idx + delimiter.len());
                Ok(text)
            }
            None => Err(format!("Expected '{}'", delimiter)),
        }
    }
}

fn decode_xml_entities(s: &str) -> String {
    s.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&apos;", "'")
}

fn coerce_value(s: &str) -> Value {
    if s.is_empty() {
        return Value::String(String::new());
    }
    // Try integer
    if let Ok(n) = s.parse::<i64>() {
        return Value::Number(n.into());
    }
    // Try float
    if let Ok(f) = s.parse::<f64>() {
        if let Some(n) = serde_json::Number::from_f64(f) {
            return Value::Number(n);
        }
    }
    // Try boolean
    match s {
        "true" => return Value::Bool(true),
        "false" => return Value::Bool(false),
        _ => {}
    }
    Value::String(s.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn simple_element() {
        let result = xml_to_json("<root><name>John</name><age>30</age></root>").unwrap();
        assert_eq!(result["root"]["name"], "John");
        assert_eq!(result["root"]["age"], 30);
    }

    #[test]
    fn attributes() {
        let result = xml_to_json("<item id=\"1\">test</item>").unwrap();
        assert_eq!(result["item"]["@_id"], 1);
    }

    #[test]
    fn empty_input() {
        assert_eq!(xml_to_json("").unwrap_err(), "Empty input");
    }

    #[test]
    fn whitespace_input() {
        assert_eq!(xml_to_json("   ").unwrap_err(), "Empty input");
    }

    #[test]
    fn self_closing() {
        let result = xml_to_json("<root><br/></root>").unwrap();
        assert!(result["root"]["br"].is_string());
    }

    #[test]
    fn xml_declaration_skipped() {
        let result =
            xml_to_json("<?xml version=\"1.0\"?><root><a>1</a></root>").unwrap();
        assert_eq!(result["root"]["a"], 1);
    }

    #[test]
    fn mismatched_tags() {
        assert!(xml_to_json("<a></b>").is_err());
    }

    #[test]
    fn unclosed_tag() {
        assert!(xml_to_json("<root><unclosed>").is_err());
    }
}
```

- [ ] **Step 3: Create XML builder (`src/xml/builder.rs`)**

Converts `serde_json::Value` (from parsed JSON string) back to formatted XML. Must handle:
- Nested objects -> nested XML elements
- `@_` prefixed keys -> XML attributes
- `#text` key -> text content
- Arrays -> repeated elements
- Indented output (2-space)

```rust
// wasm/crates/csr-parsers/src/xml/builder.rs
use serde_json::Value;

pub fn json_to_xml(input: &str) -> Result<String, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Empty input".into());
    }

    let value: Value = serde_json::from_str(trimmed)
        .map_err(|e| e.to_string())?;

    let mut output = String::new();
    build_value(&value, &mut output, 0, None);
    Ok(output)
}

fn build_value(value: &Value, out: &mut String, depth: usize, tag: Option<&str>) {
    match value {
        Value::Object(map) => {
            if let Some(tag_name) = tag {
                // Collect attributes and children
                let mut attrs = Vec::new();
                let mut children = Vec::new();
                let mut text = None;

                for (k, v) in map {
                    if k.starts_with("@_") {
                        attrs.push((&k[2..], v));
                    } else if k == "#text" {
                        text = Some(v);
                    } else {
                        children.push((k.as_str(), v));
                    }
                }

                let indent = "  ".repeat(depth);
                out.push_str(&indent);
                out.push('<');
                out.push_str(tag_name);
                for (name, val) in &attrs {
                    out.push(' ');
                    out.push_str(name);
                    out.push_str("=\"");
                    out.push_str(&value_to_attr_string(val));
                    out.push('"');
                }

                if children.is_empty() && text.is_none() {
                    out.push_str("/>\n");
                    return;
                }

                out.push('>');

                if !children.is_empty() {
                    out.push('\n');
                    for (child_name, child_val) in &children {
                        build_value(child_val, out, depth + 1, Some(child_name));
                    }
                    if let Some(t) = text {
                        let indent_inner = "  ".repeat(depth + 1);
                        out.push_str(&indent_inner);
                        out.push_str(&value_to_text(t));
                        out.push('\n');
                    }
                    out.push_str(&indent);
                } else if let Some(t) = text {
                    out.push_str(&value_to_text(t));
                }

                out.push_str("</");
                out.push_str(tag_name);
                out.push_str(">\n");
            } else {
                // Top-level object: iterate keys as root elements
                for (k, v) in map {
                    build_value(v, out, depth, Some(k));
                }
            }
        }
        Value::Array(arr) => {
            if let Some(tag_name) = tag {
                for item in arr {
                    build_value(item, out, depth, Some(tag_name));
                }
            }
        }
        _ => {
            if let Some(tag_name) = tag {
                let indent = "  ".repeat(depth);
                out.push_str(&indent);
                out.push('<');
                out.push_str(tag_name);
                out.push('>');
                out.push_str(&encode_xml_entities(&value_to_text(value)));
                out.push_str("</");
                out.push_str(tag_name);
                out.push_str(">\n");
            }
        }
    }
}

fn value_to_text(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        Value::Bool(b) => b.to_string(),
        Value::Null => "".into(),
        _ => serde_json::to_string(v).unwrap_or_default(),
    }
}

fn value_to_attr_string(v: &Value) -> String {
    match v {
        Value::String(s) => encode_xml_entities(s),
        Value::Number(n) => n.to_string(),
        Value::Bool(b) => b.to_string(),
        _ => encode_xml_entities(&serde_json::to_string(v).unwrap_or_default()),
    }
}

fn encode_xml_entities(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn simple_json_to_xml() {
        let result = json_to_xml(r#"{"root":{"name":"John","age":30}}"#).unwrap();
        assert!(result.contains("<name>John</name>"));
        assert!(result.contains("<age>30</age>"));
    }

    #[test]
    fn empty_input() {
        assert_eq!(json_to_xml("").unwrap_err(), "Empty input");
    }

    #[test]
    fn invalid_json() {
        assert!(json_to_xml("{invalid}").is_err());
    }
}
```

- [ ] **Step 4: Create XML module and lib.rs**

```rust
// wasm/crates/csr-parsers/src/xml/mod.rs
pub mod builder;
pub mod parser;
```

```rust
// wasm/crates/csr-parsers/src/lib.rs
use wasm_bindgen::prelude::*;

mod xml;

// ── XML ──

#[wasm_bindgen]
pub fn xml_to_json(input: &str) -> Result<String, JsError> {
    let value = xml::parser::xml_to_json(input).map_err(|e| JsError::new(&e))?;
    serde_json::to_string_pretty(&value).map_err(|e| JsError::new(&e.to_string()))
}

#[wasm_bindgen]
pub fn json_to_xml(input: &str) -> Result<String, JsError> {
    xml::builder::json_to_xml(input).map_err(|e| JsError::new(&e))
}

#[wasm_bindgen]
pub fn get_xml_parse_error(input: &str) -> Option<String> {
    xml::parser::validate_xml(input)
}
```

- [ ] **Step 5: Run Rust tests**

Run: `cd /Users/boe-100x/Documents/projects/labs/boengai/csr-dev-tools/wasm && cargo test -p csr-parsers`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add wasm/crates/csr-parsers/
git commit -m "feat(csr-parsers): add XML parser and builder module

Hand-written recursive-descent XML parser with attribute support (@_ prefix),
numeric coercion, CDATA, self-closing tags. XML builder converts JSON back to
formatted XML.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Add YAML module to `csr-parsers`

**Files:**
- Create: `wasm/crates/csr-parsers/src/yaml/mod.rs`
- Create: `wasm/crates/csr-parsers/src/yaml/parser.rs`
- Create: `wasm/crates/csr-parsers/src/yaml/emitter.rs`
- Modify: `wasm/crates/csr-parsers/src/lib.rs`

- [ ] **Step 1: Create YAML parser (`src/yaml/parser.rs`)**

Hand-written YAML parser covering the 95% use case (maps, sequences, scalars, block scalars, flow sequences/maps, anchors/aliases not required). Must handle:
- Key-value pairs with indent-based nesting
- Sequences (`- item`)
- Block scalars (`|` literal, `>` folded)
- Flow sequences `[1, 2, 3]` and flow maps `{a: 1, b: 2}`
- Quoted strings (single and double)
- Multiline values
- Comments (`#`)
- Type coercion: `true`/`false` -> bool, numbers -> number, `null`/`~` -> null
- Unicode (emoji, CJK)
- Output: `serde_json::Value`

```rust
// wasm/crates/csr-parsers/src/yaml/parser.rs
use serde_json::{Map, Value};

pub fn yaml_to_value(input: &str) -> Result<Value, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Empty input".into());
    }

    let lines = preprocess_lines(trimmed);
    if lines.is_empty() {
        return Ok(Value::Null);
    }

    // Check if it starts with flow syntax
    let first_char = trimmed.chars().next();
    if first_char == Some('[') {
        return parse_flow_sequence(&mut FlowParser::new(trimmed));
    }
    if first_char == Some('{') {
        return parse_flow_map(&mut FlowParser::new(trimmed));
    }

    parse_block(&lines, 0, 0).map(|(val, _)| val)
}

// --- Line-based block parser ---

struct Line<'a> {
    indent: usize,
    content: &'a str,
}

fn preprocess_lines(input: &str) -> Vec<Line<'_>> {
    input
        .lines()
        .filter_map(|line| {
            let stripped = line.trim_end();
            // Remove comment-only lines
            let content_part = strip_inline_comment(stripped);
            if content_part.trim().is_empty() {
                return None;
            }
            let indent = stripped.len() - stripped.trim_start().len();
            Some(Line {
                indent,
                content: content_part,
            })
        })
        .collect()
}

fn strip_inline_comment(line: &str) -> &str {
    // Simple: find # not inside quotes
    let trimmed = line.trim_start();
    if trimmed.starts_with('#') {
        return "";
    }
    // For simplicity, don't strip mid-line comments inside quoted strings
    // A more robust approach would track quote state
    line
}

fn parse_block(lines: &[Line<'_>], start: usize, min_indent: usize) -> Result<(Value, usize), String> {
    if start >= lines.len() {
        return Ok((Value::Null, start));
    }

    let line = &lines[start];
    let content = line.content.trim_start();

    // Sequence item
    if content.starts_with("- ") || content == "-" {
        return parse_sequence(lines, start, line.indent);
    }

    // Map
    if content.contains(": ") || content.ends_with(':') {
        return parse_map(lines, start, line.indent);
    }

    // Scalar
    Ok((parse_scalar(content), start + 1))
}

fn parse_map(lines: &[Line<'_>], start: usize, base_indent: usize) -> Result<(Value, usize), String> {
    let mut map = Map::new();
    let mut pos = start;

    while pos < lines.len() && lines[pos].indent >= base_indent {
        if lines[pos].indent > base_indent {
            // Skip lines that are part of a nested value
            pos += 1;
            continue;
        }

        let content = lines[pos].content.trim_start();

        // Must be a key-value line at this indent
        let (key, value_part) = match split_key_value(content) {
            Some(kv) => kv,
            None => break,
        };

        let value_trimmed = value_part.trim();

        if value_trimmed.is_empty() {
            // Value is a nested block on the next line(s)
            pos += 1;
            if pos < lines.len() && lines[pos].indent > base_indent {
                let (val, new_pos) = parse_block(lines, pos, lines[pos].indent)?;
                map.insert(key.to_string(), val);
                pos = new_pos;
            } else {
                map.insert(key.to_string(), Value::Null);
            }
        } else if value_trimmed == "|" || value_trimmed == "|+" || value_trimmed == "|-" {
            // Literal block scalar
            pos += 1;
            let (text, new_pos) = collect_block_scalar(lines, pos, base_indent, false, value_trimmed);
            map.insert(key.to_string(), Value::String(text));
            pos = new_pos;
        } else if value_trimmed == ">" || value_trimmed == ">+" || value_trimmed == ">-" {
            // Folded block scalar
            pos += 1;
            let (text, new_pos) = collect_block_scalar(lines, pos, base_indent, true, value_trimmed);
            map.insert(key.to_string(), Value::String(text));
            pos = new_pos;
        } else if value_trimmed.starts_with('[') {
            // Flow sequence inline
            let val = parse_flow_sequence(&mut FlowParser::new(value_trimmed))?;
            map.insert(key.to_string(), val);
            pos += 1;
        } else if value_trimmed.starts_with('{') {
            let val = parse_flow_map(&mut FlowParser::new(value_trimmed))?;
            map.insert(key.to_string(), val);
            pos += 1;
        } else {
            map.insert(key.to_string(), parse_scalar(value_trimmed));
            pos += 1;
        }
    }

    Ok((Value::Object(map), pos))
}

fn parse_sequence(lines: &[Line<'_>], start: usize, base_indent: usize) -> Result<(Value, usize), String> {
    let mut arr = Vec::new();
    let mut pos = start;

    while pos < lines.len() && lines[pos].indent >= base_indent {
        if lines[pos].indent > base_indent {
            pos += 1;
            continue;
        }

        let content = lines[pos].content.trim_start();
        if !content.starts_with("- ") && content != "-" {
            break;
        }

        let after_dash = if content == "-" {
            ""
        } else {
            &content[2..]
        };
        let after_trimmed = after_dash.trim();

        if after_trimmed.is_empty() {
            // Nested block under this sequence item
            pos += 1;
            if pos < lines.len() && lines[pos].indent > base_indent {
                let (val, new_pos) = parse_block(lines, pos, lines[pos].indent)?;
                arr.push(val);
                pos = new_pos;
            } else {
                arr.push(Value::Null);
            }
        } else if after_trimmed.contains(": ") || after_trimmed.ends_with(':') {
            // Inline map in sequence item — collect as nested map
            // Create a temporary line set for the inline key-value + subsequent indented lines
            let (key, value_part) = split_key_value(after_trimmed).unwrap_or((after_trimmed, ""));
            let mut inline_map = Map::new();
            let val_trimmed = value_part.trim();
            if val_trimmed.is_empty() {
                pos += 1;
                if pos < lines.len() && lines[pos].indent > base_indent {
                    let (val, new_pos) = parse_block(lines, pos, lines[pos].indent)?;
                    inline_map.insert(key.to_string(), val);
                    pos = new_pos;
                } else {
                    inline_map.insert(key.to_string(), Value::Null);
                }
            } else {
                inline_map.insert(key.to_string(), parse_scalar(val_trimmed));
                pos += 1;
            }
            // Collect remaining map entries at same indent as the dash content
            let item_indent = base_indent + 2;
            while pos < lines.len() && lines[pos].indent >= item_indent {
                let sub_content = lines[pos].content.trim_start();
                if let Some((k, v)) = split_key_value(sub_content) {
                    let v_trimmed = v.trim();
                    if v_trimmed.is_empty() {
                        pos += 1;
                        if pos < lines.len() && lines[pos].indent > item_indent {
                            let (val, new_pos) = parse_block(lines, pos, lines[pos].indent)?;
                            inline_map.insert(k.to_string(), val);
                            pos = new_pos;
                        } else {
                            inline_map.insert(k.to_string(), Value::Null);
                        }
                    } else {
                        inline_map.insert(k.to_string(), parse_scalar(v_trimmed));
                        pos += 1;
                    }
                } else {
                    break;
                }
            }
            arr.push(Value::Object(inline_map));
        } else {
            arr.push(parse_scalar(after_trimmed));
            pos += 1;
        }
    }

    Ok((Value::Array(arr), pos))
}

fn collect_block_scalar(
    lines: &[Line<'_>],
    start: usize,
    parent_indent: usize,
    folded: bool,
    _chomping: &str,
) -> (String, usize) {
    let mut pos = start;
    let mut text_lines = Vec::new();

    // Determine the block indent from first non-empty line
    let block_indent = if pos < lines.len() {
        lines[pos].indent
    } else {
        parent_indent + 2
    };

    while pos < lines.len() && lines[pos].indent >= block_indent {
        let content = &lines[pos].content[block_indent.min(lines[pos].content.len())..];
        text_lines.push(content);
        pos += 1;
    }

    let result = if folded {
        text_lines.join(" ")
    } else {
        text_lines.join("\n")
    };

    // Default chomp: clip (single trailing newline)
    (result + "\n", pos)
}

fn split_key_value(content: &str) -> Option<(&str, &str)> {
    // Handle quoted keys
    if content.starts_with('"') || content.starts_with('\'') {
        let quote = content.as_bytes()[0];
        if let Some(end) = content[1..].find(quote as char) {
            let key = &content[1..end + 1];
            let rest = &content[end + 2..];
            if rest.starts_with(": ") {
                return Some((key, &rest[2..]));
            } else if rest == ":" {
                return Some((key, ""));
            }
        }
        return None;
    }

    // Unquoted key
    if let Some(colon_pos) = content.find(": ") {
        Some((&content[..colon_pos], &content[colon_pos + 2..]))
    } else if content.ends_with(':') && content.len() > 1 {
        Some((&content[..content.len() - 1], ""))
    } else {
        None
    }
}

fn parse_scalar(s: &str) -> Value {
    // Quoted strings
    if (s.starts_with('"') && s.ends_with('"')) || (s.starts_with('\'') && s.ends_with('\'')) {
        let inner = &s[1..s.len() - 1];
        return Value::String(unescape_yaml_string(inner));
    }

    // Null
    if s == "null" || s == "~" || s == "Null" || s == "NULL" {
        return Value::Null;
    }

    // Boolean
    match s {
        "true" | "True" | "TRUE" => return Value::Bool(true),
        "false" | "False" | "FALSE" => return Value::Bool(false),
        _ => {}
    }

    // Integer
    if let Ok(n) = s.parse::<i64>() {
        return Value::Number(n.into());
    }

    // Float
    if let Ok(f) = s.parse::<f64>() {
        if let Some(n) = serde_json::Number::from_f64(f) {
            return Value::Number(n);
        }
    }

    Value::String(s.to_string())
}

fn unescape_yaml_string(s: &str) -> String {
    s.replace("\\n", "\n")
        .replace("\\t", "\t")
        .replace("\\\\", "\\")
        .replace("\\\"", "\"")
}

// --- Flow parser (inline [a, b] and {a: 1}) ---

struct FlowParser<'a> {
    input: &'a str,
    pos: usize,
}

impl<'a> FlowParser<'a> {
    fn new(input: &'a str) -> Self {
        Self { input, pos: 0 }
    }

    fn remaining(&self) -> &'a str {
        &self.input[self.pos..]
    }

    fn peek(&self) -> Option<char> {
        self.remaining().chars().next()
    }

    fn advance(&mut self, n: usize) {
        self.pos += n;
    }

    fn skip_whitespace(&mut self) {
        while self.pos < self.input.len() && self.input.as_bytes()[self.pos].is_ascii_whitespace() {
            self.pos += 1;
        }
    }
}

fn parse_flow_sequence(p: &mut FlowParser<'_>) -> Result<Value, String> {
    if p.peek() != Some('[') {
        return Err("Expected '['".into());
    }
    p.advance(1);
    p.skip_whitespace();

    let mut arr = Vec::new();

    if p.peek() == Some(']') {
        p.advance(1);
        return Ok(Value::Array(arr));
    }

    loop {
        p.skip_whitespace();
        let val = parse_flow_value(p)?;
        arr.push(val);
        p.skip_whitespace();
        match p.peek() {
            Some(',') => {
                p.advance(1);
            }
            Some(']') => {
                p.advance(1);
                break;
            }
            _ => return Err("Expected ',' or ']' in flow sequence".into()),
        }
    }

    Ok(Value::Array(arr))
}

fn parse_flow_map(p: &mut FlowParser<'_>) -> Result<Value, String> {
    if p.peek() != Some('{') {
        return Err("Expected '{'".into());
    }
    p.advance(1);
    p.skip_whitespace();

    let mut map = Map::new();

    if p.peek() == Some('}') {
        p.advance(1);
        return Ok(Value::Object(map));
    }

    loop {
        p.skip_whitespace();
        let key = parse_flow_key(p)?;
        p.skip_whitespace();
        if p.peek() != Some(':') {
            return Err("Expected ':' in flow map".into());
        }
        p.advance(1);
        p.skip_whitespace();
        let val = parse_flow_value(p)?;
        map.insert(key, val);
        p.skip_whitespace();
        match p.peek() {
            Some(',') => {
                p.advance(1);
            }
            Some('}') => {
                p.advance(1);
                break;
            }
            _ => return Err("Expected ',' or '}' in flow map".into()),
        }
    }

    Ok(Value::Object(map))
}

fn parse_flow_key(p: &mut FlowParser<'_>) -> Result<String, String> {
    p.skip_whitespace();
    let start = p.pos;
    while p.pos < p.input.len() {
        let ch = p.input.as_bytes()[p.pos];
        if ch == b':' || ch == b',' || ch == b'}' || ch == b']' {
            break;
        }
        p.pos += 1;
    }
    let key = p.input[start..p.pos].trim();
    if key.is_empty() {
        return Err("Empty key in flow map".into());
    }
    Ok(key.to_string())
}

fn parse_flow_value(p: &mut FlowParser<'_>) -> Result<Value, String> {
    p.skip_whitespace();
    match p.peek() {
        Some('[') => parse_flow_sequence(p),
        Some('{') => parse_flow_map(p),
        _ => {
            let start = p.pos;
            while p.pos < p.input.len() {
                let ch = p.input.as_bytes()[p.pos];
                if ch == b',' || ch == b']' || ch == b'}' {
                    break;
                }
                p.pos += 1;
            }
            let raw = p.input[start..p.pos].trim();
            Ok(parse_scalar(raw))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn simple_map() {
        let val = yaml_to_value("name: John\nage: 30").unwrap();
        assert_eq!(val["name"], "John");
        assert_eq!(val["age"], 30);
    }

    #[test]
    fn nested_map() {
        let val = yaml_to_value("a:\n  b:\n    c: 1").unwrap();
        assert_eq!(val["a"]["b"]["c"], 1);
    }

    #[test]
    fn sequence() {
        let val = yaml_to_value("items:\n  - 1\n  - 2\n  - 3").unwrap();
        assert_eq!(val["items"][0], 1);
        assert_eq!(val["items"][2], 3);
    }

    #[test]
    fn block_literal() {
        let val = yaml_to_value("text: |\n  line one\n  line two").unwrap();
        let text = val["text"].as_str().unwrap();
        assert!(text.contains("line one"));
        assert!(text.contains("line two"));
    }

    #[test]
    fn flow_sequence() {
        let val = yaml_to_value("items: [1, 2, 3]").unwrap();
        assert_eq!(val["items"][0], 1);
    }

    #[test]
    fn empty_input() {
        assert!(yaml_to_value("").is_err());
    }

    #[test]
    fn boolean_and_null() {
        let val = yaml_to_value("a: true\nb: false\nc: null").unwrap();
        assert_eq!(val["a"], true);
        assert_eq!(val["b"], false);
        assert!(val["c"].is_null());
    }

    #[test]
    fn unicode() {
        let val = yaml_to_value("emoji: 🎉\ncjk: 日本語").unwrap();
        assert_eq!(val["emoji"], "🎉");
        assert_eq!(val["cjk"], "日本語");
    }

    #[test]
    fn invalid_flow_sequence() {
        assert!(yaml_to_value("key: [unclosed").is_err());
    }
}
```

- [ ] **Step 2: Create YAML emitter (`src/yaml/emitter.rs`)**

Converts `serde_json::Value` to YAML string. Supports configurable indent and optional key sorting.

```rust
// wasm/crates/csr-parsers/src/yaml/emitter.rs
use serde_json::Value;

pub struct EmitOptions {
    pub indent: usize,
    pub sort_keys: bool,
}

impl Default for EmitOptions {
    fn default() -> Self {
        Self {
            indent: 2,
            sort_keys: false,
        }
    }
}

pub fn value_to_yaml(value: &Value, options: &EmitOptions) -> String {
    let mut output = String::new();
    emit_value(value, &mut output, 0, options, true);
    output
}

fn emit_value(value: &Value, out: &mut String, depth: usize, opts: &EmitOptions, top_level: bool) {
    match value {
        Value::Object(map) => {
            let keys: Vec<&String> = if opts.sort_keys {
                let mut ks: Vec<&String> = map.keys().collect();
                ks.sort();
                ks
            } else {
                map.keys().collect()
            };

            if !top_level {
                out.push('\n');
            }
            let indent_str = " ".repeat(depth * opts.indent);
            for key in keys {
                let val = &map[key];
                out.push_str(&indent_str);
                out.push_str(&yaml_escape_key(key));
                out.push(':');
                match val {
                    Value::Object(_) | Value::Array(_) => {
                        emit_value(val, out, depth + 1, opts, false);
                    }
                    _ => {
                        out.push(' ');
                        emit_scalar(val, out);
                        out.push('\n');
                    }
                }
            }
        }
        Value::Array(arr) => {
            if !top_level {
                out.push('\n');
            }
            let indent_str = " ".repeat(depth * opts.indent);
            for item in arr {
                out.push_str(&indent_str);
                out.push_str("- ");
                match item {
                    Value::Object(_) => {
                        // Inline the first key, indent rest
                        emit_inline_map(item, out, depth, opts);
                    }
                    Value::Array(_) => {
                        emit_value(item, out, depth + 1, opts, false);
                    }
                    _ => {
                        emit_scalar(item, out);
                        out.push('\n');
                    }
                }
            }
        }
        _ => {
            if top_level {
                emit_scalar(value, out);
                out.push('\n');
            }
        }
    }
}

fn emit_inline_map(value: &Value, out: &mut String, depth: usize, opts: &EmitOptions) {
    if let Value::Object(map) = value {
        let keys: Vec<&String> = if opts.sort_keys {
            let mut ks: Vec<&String> = map.keys().collect();
            ks.sort();
            ks
        } else {
            map.keys().collect()
        };

        let indent_str = " ".repeat((depth + 1) * opts.indent);
        for (i, key) in keys.iter().enumerate() {
            if i > 0 {
                out.push_str(&indent_str);
            }
            out.push_str(&yaml_escape_key(key));
            out.push(':');
            let val = &map[*key];
            match val {
                Value::Object(_) | Value::Array(_) => {
                    emit_value(val, out, depth + 2, opts, false);
                }
                _ => {
                    out.push(' ');
                    emit_scalar(val, out);
                    out.push('\n');
                }
            }
        }
    }
}

fn emit_scalar(value: &Value, out: &mut String) {
    match value {
        Value::Null => out.push_str("null"),
        Value::Bool(b) => out.push_str(if *b { "true" } else { "false" }),
        Value::Number(n) => out.push_str(&n.to_string()),
        Value::String(s) => {
            if needs_quoting(s) {
                out.push('"');
                out.push_str(&s.replace('\\', "\\\\").replace('"', "\\\"").replace('\n', "\\n"));
                out.push('"');
            } else {
                out.push_str(s);
            }
        }
        _ => out.push_str(&serde_json::to_string(value).unwrap_or_default()),
    }
}

fn needs_quoting(s: &str) -> bool {
    if s.is_empty() {
        return true;
    }
    if s.contains('\n') || s.contains(':') || s.contains('#') {
        return true;
    }
    // Quote if it looks like a boolean, null, or number
    matches!(
        s,
        "true" | "false" | "True" | "False" | "TRUE" | "FALSE" | "null" | "Null" | "NULL" | "~"
    ) || s.parse::<f64>().is_ok()
}

fn yaml_escape_key(key: &str) -> String {
    if key.contains(':')
        || key.contains('#')
        || key.contains('{')
        || key.contains('}')
        || key.contains('[')
        || key.contains(']')
        || key.contains(',')
        || key.contains('&')
        || key.contains('*')
        || key.contains('?')
        || key.contains('|')
        || key.contains('-')
        || key.contains('<')
        || key.contains('>')
        || key.contains('!')
        || key.contains('%')
        || key.contains('@')
        || key.is_empty()
    {
        format!("\"{}\"", key.replace('"', "\\\""))
    } else {
        key.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn simple_map() {
        let val = json!({"name": "John", "age": 30});
        let result = value_to_yaml(&val, &EmitOptions::default());
        assert!(result.contains("name: John"));
        assert!(result.contains("age: 30"));
    }

    #[test]
    fn sorted_keys() {
        let val = json!({"z": 1, "a": 2, "m": 3});
        let result = value_to_yaml(&val, &EmitOptions { indent: 2, sort_keys: true });
        let lines: Vec<&str> = result.trim().split('\n').collect();
        assert_eq!(lines[0], "a: 2");
        assert_eq!(lines[1], "m: 3");
        assert_eq!(lines[2], "z: 1");
    }

    #[test]
    fn nested_object() {
        let val = json!({"a": {"b": {"c": 1}}});
        let result = value_to_yaml(&val, &EmitOptions::default());
        assert!(result.contains("a:"));
        assert!(result.contains("  b:"));
        assert!(result.contains("    c: 1"));
    }

    #[test]
    fn array() {
        let val = json!({"items": [1, 2, 3]});
        let result = value_to_yaml(&val, &EmitOptions::default());
        assert!(result.contains("items:"));
        assert!(result.contains("  - 1"));
    }

    #[test]
    fn unicode() {
        let val = json!({"emoji": "🎉", "cjk": "日本語"});
        let result = value_to_yaml(&val, &EmitOptions::default());
        assert!(result.contains("🎉"));
        assert!(result.contains("日本語"));
    }
}
```

- [ ] **Step 3: Create YAML module and add to lib.rs**

```rust
// wasm/crates/csr-parsers/src/yaml/mod.rs
pub mod emitter;
pub mod parser;
```

Add to `lib.rs` after XML exports:

```rust
mod yaml;

// ── YAML ──

#[wasm_bindgen]
pub fn yaml_to_json(input: &str, indent: u32) -> Result<String, JsError> {
    let value = yaml::parser::yaml_to_value(input).map_err(|e| JsError::new(&e))?;
    let indent_str = " ".repeat(indent as usize);
    let formatter = serde_json::ser::PrettyFormatter::with_indent(indent_str.as_bytes());
    let mut buf = Vec::new();
    let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
    serde::Serialize::serialize(&value, &mut ser).map_err(|e| JsError::new(&e.to_string()))?;
    String::from_utf8(buf).map_err(|e| JsError::new(&e.to_string()))
}

#[wasm_bindgen]
pub fn json_to_yaml(input: &str) -> Result<String, JsError> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err(JsError::new("Empty input"));
    }
    let value: serde_json::Value =
        serde_json::from_str(trimmed).map_err(|e| JsError::new(&e.to_string()))?;
    Ok(yaml::emitter::value_to_yaml(
        &value,
        &yaml::emitter::EmitOptions::default(),
    ))
}

#[wasm_bindgen]
pub fn format_yaml(input: &str, indent: u32, sort_keys: bool) -> Result<String, JsError> {
    let value = yaml::parser::yaml_to_value(input).map_err(|e| JsError::new(&e))?;
    Ok(yaml::emitter::value_to_yaml(
        &value,
        &yaml::emitter::EmitOptions {
            indent: indent as usize,
            sort_keys,
        },
    ))
}

#[wasm_bindgen]
pub fn get_yaml_parse_error(input: &str) -> Option<String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Some("Empty input".into());
    }
    match yaml::parser::yaml_to_value(input) {
        Ok(_) => None,
        Err(e) => Some(e),
    }
}
```

- [ ] **Step 4: Run Rust tests**

Run: `cd /Users/boe-100x/Documents/projects/labs/boengai/csr-dev-tools/wasm && cargo test -p csr-parsers`
Expected: All XML and YAML tests pass

- [ ] **Step 5: Commit**

```bash
git add wasm/crates/csr-parsers/src/yaml/ wasm/crates/csr-parsers/src/lib.rs
git commit -m "feat(csr-parsers): add YAML parser and emitter module

Hand-written YAML parser supporting maps, sequences, block scalars, flow syntax,
type coercion, and Unicode. Emitter with configurable indent and key sorting.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Add TOML module to `csr-parsers`

**Files:**
- Create: `wasm/crates/csr-parsers/src/toml_parser/mod.rs`
- Create: `wasm/crates/csr-parsers/src/toml_parser/parser.rs`
- Create: `wasm/crates/csr-parsers/src/toml_parser/emitter.rs`
- Modify: `wasm/crates/csr-parsers/src/lib.rs`

- [ ] **Step 1: Create TOML parser (`src/toml_parser/parser.rs`)**

Hand-written TOML parser. Must support:
- Key-value pairs (`key = "value"`)
- Tables (`[section]`, `[section.subsection]`)
- Array of tables (`[[items]]`)
- Data types: strings (basic `"..."` and literal `'...'`), integers, floats, booleans, datetime, arrays, inline tables
- Multi-line strings (`"""..."""`, `'''...'''`)
- Comments (`#`)
- Dotted keys (`a.b.c = 1`)

```rust
// wasm/crates/csr-parsers/src/toml_parser/parser.rs
use serde_json::{Map, Value};

pub fn toml_to_value(input: &str) -> Result<Value, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Empty input".into());
    }

    let mut root = Map::new();
    let mut current_table: Vec<String> = Vec::new();
    let lines = input.lines().enumerate();

    for (line_num, line) in lines {
        let trimmed_line = line.trim();

        // Skip empty lines and comments
        if trimmed_line.is_empty() || trimmed_line.starts_with('#') {
            continue;
        }

        // Table header [table] or [[array_of_tables]]
        if trimmed_line.starts_with("[[") {
            let end = trimmed_line
                .find("]]")
                .ok_or_else(|| format!("Line {}: unterminated array of tables", line_num + 1))?;
            let key_path = parse_table_key(&trimmed_line[2..end])?;
            current_table = key_path.clone();
            // Ensure array exists and add new table
            let target = navigate_to_parent_mut(&mut root, &key_path[..key_path.len() - 1])?;
            let last_key = key_path.last().unwrap();
            let entry = target.entry(last_key.clone()).or_insert_with(|| Value::Array(Vec::new()));
            if let Value::Array(arr) = entry {
                arr.push(Value::Object(Map::new()));
            } else {
                return Err(format!("Line {}: expected array for [[{}]]", line_num + 1, last_key));
            }
            continue;
        }

        if trimmed_line.starts_with('[') {
            let end = trimmed_line
                .find(']')
                .ok_or_else(|| format!("Line {}: unterminated table header", line_num + 1))?;
            let key_path = parse_table_key(&trimmed_line[1..end])?;
            current_table = key_path;
            // Ensure nested tables exist
            ensure_table_path(&mut root, &current_table)?;
            continue;
        }

        // Key-value pair
        let (key_path, value) = parse_key_value(trimmed_line, line_num)?;
        let target = get_current_table_mut(&mut root, &current_table)?;
        set_dotted_key(target, &key_path, value)?;
    }

    Ok(Value::Object(root))
}

fn parse_table_key(key_str: &str) -> Result<Vec<String>, String> {
    key_str
        .split('.')
        .map(|part| {
            let trimmed = part.trim();
            if trimmed.starts_with('"') && trimmed.ends_with('"') {
                Ok(trimmed[1..trimmed.len() - 1].to_string())
            } else {
                Ok(trimmed.to_string())
            }
        })
        .collect()
}

fn ensure_table_path(root: &mut Map<String, Value>, path: &[String]) -> Result<(), String> {
    let mut current = root;
    for key in path {
        let entry = current
            .entry(key.clone())
            .or_insert_with(|| Value::Object(Map::new()));
        match entry {
            Value::Object(map) => current = map,
            Value::Array(arr) => {
                // Navigate into last element of array of tables
                if let Some(Value::Object(map)) = arr.last_mut() {
                    current = map;
                } else {
                    return Err(format!("Cannot navigate into array for key '{}'", key));
                }
            }
            _ => return Err(format!("Key '{}' is not a table", key)),
        }
    }
    Ok(())
}

fn navigate_to_parent_mut<'a>(
    root: &'a mut Map<String, Value>,
    path: &[String],
) -> Result<&'a mut Map<String, Value>, String> {
    let mut current = root;
    for key in path {
        let entry = current
            .entry(key.clone())
            .or_insert_with(|| Value::Object(Map::new()));
        match entry {
            Value::Object(map) => current = map,
            _ => return Err(format!("Key '{}' is not a table", key)),
        }
    }
    Ok(current)
}

fn get_current_table_mut<'a>(
    root: &'a mut Map<String, Value>,
    table_path: &[String],
) -> Result<&'a mut Map<String, Value>, String> {
    let mut current = root;
    for key in table_path {
        let entry = current.get_mut(key);
        match entry {
            Some(Value::Object(map)) => current = map,
            Some(Value::Array(arr)) => {
                if let Some(Value::Object(map)) = arr.last_mut() {
                    current = map;
                } else {
                    return Err(format!("Cannot navigate into key '{}'", key));
                }
            }
            _ => {
                // Auto-create
                current
                    .entry(key.clone())
                    .or_insert_with(|| Value::Object(Map::new()));
                if let Some(Value::Object(map)) = current.get_mut(key) {
                    current = map;
                } else {
                    return Err(format!("Failed to create table for key '{}'", key));
                }
            }
        }
    }
    Ok(current)
}

fn set_dotted_key(
    target: &mut Map<String, Value>,
    key_path: &[String],
    value: Value,
) -> Result<(), String> {
    if key_path.len() == 1 {
        target.insert(key_path[0].clone(), value);
        return Ok(());
    }

    let entry = target
        .entry(key_path[0].clone())
        .or_insert_with(|| Value::Object(Map::new()));
    if let Value::Object(map) = entry {
        set_dotted_key(map, &key_path[1..], value)
    } else {
        Err(format!("Key '{}' is not a table", key_path[0]))
    }
}

fn parse_key_value(line: &str, line_num: usize) -> Result<(Vec<String>, Value), String> {
    // Find the '=' separator (not inside quotes)
    let eq_pos = find_equals(line)
        .ok_or_else(|| format!("Line {}: expected '=' in key-value pair", line_num + 1))?;

    let key_str = line[..eq_pos].trim();
    let value_str = line[eq_pos + 1..].trim();

    // Strip inline comment from value
    let value_str = strip_value_comment(value_str);

    let key_path = parse_dotted_key(key_str)?;
    let value = parse_toml_value(value_str, line_num)?;

    Ok((key_path, value))
}

fn find_equals(line: &str) -> Option<usize> {
    let mut in_quote = false;
    let mut quote_char = ' ';
    for (i, ch) in line.char_indices() {
        if in_quote {
            if ch == quote_char {
                in_quote = false;
            }
            continue;
        }
        if ch == '"' || ch == '\'' {
            in_quote = true;
            quote_char = ch;
            continue;
        }
        if ch == '=' {
            return Some(i);
        }
    }
    None
}

fn strip_value_comment(value: &str) -> &str {
    // Don't strip # inside strings
    let trimmed = value.trim();
    if trimmed.starts_with('"') || trimmed.starts_with('\'') || trimmed.starts_with('[') || trimmed.starts_with('{') {
        return trimmed;
    }
    if let Some(hash_pos) = trimmed.find(" #") {
        trimmed[..hash_pos].trim()
    } else {
        trimmed
    }
}

fn parse_dotted_key(key_str: &str) -> Result<Vec<String>, String> {
    parse_table_key(key_str)
}

fn parse_toml_value(s: &str, _line_num: usize) -> Result<Value, String> {
    let trimmed = s.trim();

    if trimmed.is_empty() {
        return Err("Empty value".into());
    }

    // String
    if trimmed.starts_with('"') {
        let inner = &trimmed[1..];
        if let Some(end) = inner.find('"') {
            let val = inner[..end]
                .replace("\\n", "\n")
                .replace("\\t", "\t")
                .replace("\\\\", "\\")
                .replace("\\\"", "\"");
            return Ok(Value::String(val));
        }
        return Err("Unterminated string".into());
    }

    if trimmed.starts_with('\'') {
        let inner = &trimmed[1..];
        if let Some(end) = inner.find('\'') {
            return Ok(Value::String(inner[..end].to_string()));
        }
        return Err("Unterminated literal string".into());
    }

    // Boolean
    if trimmed == "true" {
        return Ok(Value::Bool(true));
    }
    if trimmed == "false" {
        return Ok(Value::Bool(false));
    }

    // Array
    if trimmed.starts_with('[') {
        return parse_toml_array(trimmed);
    }

    // Inline table
    if trimmed.starts_with('{') {
        return parse_toml_inline_table(trimmed);
    }

    // Integer (may have underscores)
    let cleaned = trimmed.replace('_', "");
    if let Ok(n) = cleaned.parse::<i64>() {
        return Ok(Value::Number(n.into()));
    }

    // Float
    if let Ok(f) = cleaned.parse::<f64>() {
        if let Some(n) = serde_json::Number::from_f64(f) {
            return Ok(Value::Number(n));
        }
    }

    // Datetime — store as string
    if trimmed.contains('T') || trimmed.contains(':') {
        return Ok(Value::String(trimmed.to_string()));
    }

    Ok(Value::String(trimmed.to_string()))
}

fn parse_toml_array(s: &str) -> Result<Value, String> {
    if !s.starts_with('[') || !s.ends_with(']') {
        return Err("Invalid array".into());
    }
    let inner = s[1..s.len() - 1].trim();
    if inner.is_empty() {
        return Ok(Value::Array(Vec::new()));
    }

    let mut arr = Vec::new();
    // Simple split by comma (does not handle nested arrays with commas)
    for part in split_top_level(inner, ',') {
        let trimmed = part.trim();
        if trimmed.is_empty() {
            continue;
        }
        arr.push(parse_toml_value(trimmed, 0)?);
    }
    Ok(Value::Array(arr))
}

fn parse_toml_inline_table(s: &str) -> Result<Value, String> {
    if !s.starts_with('{') || !s.ends_with('}') {
        return Err("Invalid inline table".into());
    }
    let inner = s[1..s.len() - 1].trim();
    if inner.is_empty() {
        return Ok(Value::Object(Map::new()));
    }

    let mut map = Map::new();
    for part in split_top_level(inner, ',') {
        let trimmed = part.trim();
        if trimmed.is_empty() {
            continue;
        }
        let (key_path, value) = parse_key_value(trimmed, 0)?;
        set_dotted_key(&mut map, &key_path, value)?;
    }
    Ok(Value::Object(map))
}

fn split_top_level(input: &str, delimiter: char) -> Vec<&str> {
    let mut parts = Vec::new();
    let mut depth = 0;
    let mut in_string = false;
    let mut string_char = ' ';
    let mut start = 0;

    for (i, ch) in input.char_indices() {
        if in_string {
            if ch == string_char {
                in_string = false;
            }
            continue;
        }
        if ch == '"' || ch == '\'' {
            in_string = true;
            string_char = ch;
            continue;
        }
        if ch == '[' || ch == '{' {
            depth += 1;
        }
        if ch == ']' || ch == '}' {
            depth -= 1;
        }
        if ch == delimiter && depth == 0 {
            parts.push(&input[start..i]);
            start = i + 1;
        }
    }
    if start < input.len() {
        parts.push(&input[start..]);
    }
    parts
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn simple_kv() {
        let val = toml_to_value("name = \"John\"\nage = 30").unwrap();
        assert_eq!(val["name"], "John");
        assert_eq!(val["age"], 30);
    }

    #[test]
    fn table() {
        let val = toml_to_value("[server]\nhost = \"localhost\"\nport = 8080").unwrap();
        assert_eq!(val["server"]["host"], "localhost");
        assert_eq!(val["server"]["port"], 8080);
    }

    #[test]
    fn empty_input() {
        assert_eq!(toml_to_value("").unwrap_err(), "Empty input");
    }

    #[test]
    fn boolean_values() {
        let val = toml_to_value("a = true\nb = false").unwrap();
        assert_eq!(val["a"], true);
        assert_eq!(val["b"], false);
    }

    #[test]
    fn inline_array() {
        let val = toml_to_value("tags = [\"a\", \"b\", \"c\"]").unwrap();
        assert_eq!(val["tags"][0], "a");
        assert_eq!(val["tags"][2], "c");
    }

    #[test]
    fn unterminated_table_header() {
        assert!(toml_to_value("[invalid").is_err());
    }
}
```

- [ ] **Step 2: Create TOML emitter (`src/toml_parser/emitter.rs`)**

```rust
// wasm/crates/csr-parsers/src/toml_parser/emitter.rs
use serde_json::Value;

pub fn value_to_toml(value: &Value) -> Result<String, String> {
    match value {
        Value::Object(map) => {
            let mut output = String::new();
            let mut tables = Vec::new();

            // First pass: emit top-level simple key-values
            for (k, v) in map {
                match v {
                    Value::Object(_) => tables.push((k.clone(), v)),
                    Value::Array(arr) if arr.iter().all(|item| item.is_object()) => {
                        tables.push((k.clone(), v));
                    }
                    _ => {
                        output.push_str(&format!("{} = {}\n", toml_key(k), emit_value(v)));
                    }
                }
            }

            // Second pass: emit tables
            for (key, val) in tables {
                match val {
                    Value::Object(inner_map) => {
                        if !output.is_empty() {
                            output.push('\n');
                        }
                        output.push_str(&format!("[{}]\n", key));
                        emit_table(inner_map, &mut output, &key)?;
                    }
                    Value::Array(arr) => {
                        for item in arr {
                            if !output.is_empty() {
                                output.push('\n');
                            }
                            output.push_str(&format!("[[{}]]\n", key));
                            if let Value::Object(inner) = item {
                                emit_table(inner, &mut output, &key)?;
                            }
                        }
                    }
                    _ => {}
                }
            }

            Ok(output)
        }
        _ => Err("TOML root must be an object".into()),
    }
}

fn emit_table(
    map: &serde_json::Map<String, Value>,
    output: &mut String,
    _prefix: &str,
) -> Result<(), String> {
    for (k, v) in map {
        match v {
            Value::Object(_) | Value::Array(_) if v.is_object() => {
                // Nested table — emit as inline table for simplicity
                output.push_str(&format!("{} = {}\n", toml_key(k), emit_value(v)));
            }
            _ => {
                output.push_str(&format!("{} = {}\n", toml_key(k), emit_value(v)));
            }
        }
    }
    Ok(())
}

fn emit_value(value: &Value) -> String {
    match value {
        Value::String(s) => format!("\"{}\"", escape_toml_string(s)),
        Value::Number(n) => n.to_string(),
        Value::Bool(b) => b.to_string(),
        Value::Null => "\"\"".to_string(),
        Value::Array(arr) => {
            let items: Vec<String> = arr.iter().map(emit_value).collect();
            format!("[{}]", items.join(", "))
        }
        Value::Object(map) => {
            let entries: Vec<String> = map
                .iter()
                .map(|(k, v)| format!("{} = {}", toml_key(k), emit_value(v)))
                .collect();
            format!("{{{}}}", entries.join(", "))
        }
    }
}

fn escape_toml_string(s: &str) -> String {
    s.replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "\\n")
        .replace('\t', "\\t")
        .replace('\r', "\\r")
}

fn toml_key(key: &str) -> String {
    if key
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        key.to_string()
    } else {
        format!("\"{}\"", escape_toml_string(key))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn simple_object() {
        let val = json!({"name": "John", "age": 30});
        let result = value_to_toml(&val).unwrap();
        assert!(result.contains("name = \"John\""));
        assert!(result.contains("age = 30"));
    }

    #[test]
    fn table_section() {
        let val = json!({"server": {"host": "localhost", "port": 8080}});
        let result = value_to_toml(&val).unwrap();
        assert!(result.contains("[server]"));
        assert!(result.contains("host = \"localhost\""));
    }
}
```

- [ ] **Step 3: Create TOML module and add to lib.rs**

```rust
// wasm/crates/csr-parsers/src/toml_parser/mod.rs
pub mod emitter;
pub mod parser;
```

Add to `lib.rs`:

```rust
mod toml_parser;

// ── TOML ──

#[wasm_bindgen]
pub fn toml_to_json(input: &str) -> Result<String, JsError> {
    let value = toml_parser::parser::toml_to_value(input).map_err(|e| JsError::new(&e))?;
    serde_json::to_string_pretty(&value).map_err(|e| JsError::new(&e.to_string()))
}

#[wasm_bindgen]
pub fn json_to_toml(input: &str) -> Result<String, JsError> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err(JsError::new("Empty input"));
    }
    let value: serde_json::Value =
        serde_json::from_str(trimmed).map_err(|e| JsError::new(&e.to_string()))?;
    toml_parser::emitter::value_to_toml(&value).map_err(|e| JsError::new(&e))
}

#[wasm_bindgen]
pub fn get_toml_parse_error(input: &str) -> Option<String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Some("Empty input".into());
    }
    match toml_parser::parser::toml_to_value(input) {
        Ok(_) => None,
        Err(e) => Some(e),
    }
}
```

- [ ] **Step 4: Run Rust tests**

Run: `cd /Users/boe-100x/Documents/projects/labs/boengai/csr-dev-tools/wasm && cargo test -p csr-parsers`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add wasm/crates/csr-parsers/src/toml_parser/ wasm/crates/csr-parsers/src/lib.rs
git commit -m "feat(csr-parsers): add TOML parser and emitter module

Hand-written TOML parser supporting tables, arrays of tables, inline tables,
dotted keys, all scalar types. Emitter converts JSON back to TOML format.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Add Protobuf Schema module to `csr-parsers`

**Files:**
- Create: `wasm/crates/csr-parsers/src/proto_schema/mod.rs`
- Create: `wasm/crates/csr-parsers/src/proto_schema/types.rs`
- Create: `wasm/crates/csr-parsers/src/proto_schema/lexer.rs`
- Create: `wasm/crates/csr-parsers/src/proto_schema/parser.rs`
- Create: `wasm/crates/csr-parsers/src/proto_schema/sample.rs`
- Modify: `wasm/crates/csr-parsers/src/lib.rs`

- [ ] **Step 1: Create types (`src/proto_schema/types.rs`)**

These structs must serialize to match the existing TypeScript types in `src/types/utils/protobuf-to-json.ts` exactly. Field names use camelCase via serde rename.

```rust
// wasm/crates/csr-parsers/src/proto_schema/types.rs
use serde::Serialize;
use std::collections::BTreeMap;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProtobufFieldInfo {
    pub description: Option<String>,
    pub id: u32,
    pub is_map: bool,
    pub name: String,
    pub resolved_kind: String, // "scalar", "message", "enum"
    pub resolved_type_name: Option<String>,
    pub rule: Option<String>, // "optional", "repeated", "required"
    #[serde(rename = "type")]
    pub field_type: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProtobufEnumInfo {
    pub full_name: String,
    pub name: String,
    pub values: BTreeMap<String, i32>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProtobufMessageInfo {
    pub fields: Vec<ProtobufFieldInfo>,
    pub full_name: String,
    pub name: String,
    pub nested_enums: Vec<ProtobufEnumInfo>,
    pub nested_messages: Vec<ProtobufMessageInfo>,
    pub oneofs: Vec<OneofInfo>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OneofInfo {
    pub field_names: Vec<String>,
    pub name: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProtobufSchemaInfo {
    pub enums: Vec<ProtobufEnumInfo>,
    pub messages: Vec<ProtobufMessageInfo>,
    pub package: Option<String>,
    pub syntax: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(untagged)]
pub enum ProtobufParseResult {
    #[serde(rename_all = "camelCase")]
    Success { schema: ProtobufSchemaInfo, success: bool },
    #[serde(rename_all = "camelCase")]
    Error { error: String, line: Option<u32>, success: bool },
}

impl ProtobufParseResult {
    pub fn ok(schema: ProtobufSchemaInfo) -> Self {
        Self::Success {
            schema,
            success: true,
        }
    }

    pub fn err(error: String, line: Option<u32>) -> Self {
        Self::Error {
            error,
            line,
            success: false,
        }
    }
}
```

- [ ] **Step 2: Create lexer (`src/proto_schema/lexer.rs`)**

Tokenizes proto2/proto3 `.proto` file content into tokens for the parser.

```rust
// wasm/crates/csr-parsers/src/proto_schema/lexer.rs

#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    // Keywords
    Syntax,
    Package,
    Message,
    Enum,
    Oneof,
    Map,
    Repeated,
    Optional,
    Required,
    Reserved,
    Import,
    Option,
    Returns,
    Rpc,
    Service,
    Stream,
    // Symbols
    LBrace,    // {
    RBrace,    // }
    LBracket,  // [
    RBracket,  // ]
    LAngle,    // <
    RAngle,    // >
    LParen,    // (
    RParen,    // )
    Semicolon, // ;
    Equals,    // =
    Comma,     // ,
    Dot,       // .
    // Values
    Ident(String),
    IntLit(i64),
    StringLit(String),
    // Meta
    Eof,
}

pub struct Lexer<'a> {
    input: &'a str,
    pos: usize,
    pub line: usize,
}

impl<'a> Lexer<'a> {
    pub fn new(input: &'a str) -> Self {
        Self {
            input,
            pos: 0,
            line: 1,
        }
    }

    pub fn tokenize(&mut self) -> Result<Vec<(Token, usize)>, String> {
        let mut tokens = Vec::new();
        loop {
            self.skip_whitespace_and_comments();
            if self.pos >= self.input.len() {
                tokens.push((Token::Eof, self.line));
                break;
            }
            let line = self.line;
            let token = self.next_token()?;
            tokens.push((token, line));
        }
        Ok(tokens)
    }

    fn skip_whitespace_and_comments(&mut self) {
        let bytes = self.input.as_bytes();
        loop {
            // Skip whitespace
            while self.pos < bytes.len() && bytes[self.pos].is_ascii_whitespace() {
                if bytes[self.pos] == b'\n' {
                    self.line += 1;
                }
                self.pos += 1;
            }
            // Skip line comments
            if self.pos + 1 < bytes.len() && bytes[self.pos] == b'/' && bytes[self.pos + 1] == b'/' {
                while self.pos < bytes.len() && bytes[self.pos] != b'\n' {
                    self.pos += 1;
                }
                continue;
            }
            // Skip block comments
            if self.pos + 1 < bytes.len() && bytes[self.pos] == b'/' && bytes[self.pos + 1] == b'*' {
                self.pos += 2;
                while self.pos + 1 < bytes.len() {
                    if bytes[self.pos] == b'\n' {
                        self.line += 1;
                    }
                    if bytes[self.pos] == b'*' && bytes[self.pos + 1] == b'/' {
                        self.pos += 2;
                        break;
                    }
                    self.pos += 1;
                }
                continue;
            }
            break;
        }
    }

    fn next_token(&mut self) -> Result<Token, String> {
        let bytes = self.input.as_bytes();
        let ch = bytes[self.pos] as char;

        match ch {
            '{' => { self.pos += 1; Ok(Token::LBrace) }
            '}' => { self.pos += 1; Ok(Token::RBrace) }
            '[' => { self.pos += 1; Ok(Token::LBracket) }
            ']' => { self.pos += 1; Ok(Token::RBracket) }
            '<' => { self.pos += 1; Ok(Token::LAngle) }
            '>' => { self.pos += 1; Ok(Token::RAngle) }
            '(' => { self.pos += 1; Ok(Token::LParen) }
            ')' => { self.pos += 1; Ok(Token::RParen) }
            ';' => { self.pos += 1; Ok(Token::Semicolon) }
            '=' => { self.pos += 1; Ok(Token::Equals) }
            ',' => { self.pos += 1; Ok(Token::Comma) }
            '.' => { self.pos += 1; Ok(Token::Dot) }
            '"' | '\'' => self.read_string(),
            '-' | '0'..='9' => self.read_number(),
            _ if ch.is_ascii_alphabetic() || ch == '_' => self.read_ident(),
            _ => Err(format!("Unexpected character '{}' at line {}", ch, self.line)),
        }
    }

    fn read_string(&mut self) -> Result<Token, String> {
        let quote = self.input.as_bytes()[self.pos] as char;
        self.pos += 1;
        let start = self.pos;
        while self.pos < self.input.len() {
            let ch = self.input.as_bytes()[self.pos] as char;
            if ch == '\\' {
                self.pos += 2;
                continue;
            }
            if ch == quote {
                let val = self.input[start..self.pos].to_string();
                self.pos += 1;
                return Ok(Token::StringLit(val));
            }
            self.pos += 1;
        }
        Err(format!("Unterminated string at line {}", self.line))
    }

    fn read_number(&mut self) -> Result<Token, String> {
        let start = self.pos;
        if self.input.as_bytes()[self.pos] == b'-' {
            self.pos += 1;
        }
        // Hex
        if self.pos + 1 < self.input.len()
            && self.input.as_bytes()[self.pos] == b'0'
            && (self.input.as_bytes()[self.pos + 1] == b'x' || self.input.as_bytes()[self.pos + 1] == b'X')
        {
            self.pos += 2;
            while self.pos < self.input.len() && self.input.as_bytes()[self.pos].is_ascii_hexdigit() {
                self.pos += 1;
            }
        } else {
            while self.pos < self.input.len() && self.input.as_bytes()[self.pos].is_ascii_digit() {
                self.pos += 1;
            }
        }
        let num_str = &self.input[start..self.pos];
        let n = if num_str.starts_with("0x") || num_str.starts_with("0X") || num_str.starts_with("-0x") {
            i64::from_str_radix(&num_str.replace("0x", "").replace("0X", ""), 16)
                .map_err(|e| format!("Invalid hex number at line {}: {}", self.line, e))?
        } else {
            num_str
                .parse::<i64>()
                .map_err(|e| format!("Invalid number '{}' at line {}: {}", num_str, self.line, e))?
        };
        Ok(Token::IntLit(n))
    }

    fn read_ident(&mut self) -> Result<Token, String> {
        let start = self.pos;
        while self.pos < self.input.len() {
            let ch = self.input.as_bytes()[self.pos];
            if ch.is_ascii_alphanumeric() || ch == b'_' {
                self.pos += 1;
            } else {
                break;
            }
        }
        let word = &self.input[start..self.pos];
        let token = match word {
            "syntax" => Token::Syntax,
            "package" => Token::Package,
            "message" => Token::Message,
            "enum" => Token::Enum,
            "oneof" => Token::Oneof,
            "map" => Token::Map,
            "repeated" => Token::Repeated,
            "optional" => Token::Optional,
            "required" => Token::Required,
            "reserved" => Token::Reserved,
            "import" => Token::Import,
            "option" => Token::Option,
            "returns" => Token::Returns,
            "rpc" => Token::Rpc,
            "service" => Token::Service,
            "stream" => Token::Stream,
            _ => Token::Ident(word.to_string()),
        };
        Ok(token)
    }
}
```

- [ ] **Step 3: Create proto schema parser (`src/proto_schema/parser.rs`)**

Parses token stream into `ProtobufSchemaInfo`. Must handle:
- `syntax`, `package` declarations
- `message` with fields, nested messages, nested enums, oneofs
- `enum` with values
- `map<K, V>` fields
- `repeated`, `optional`, `required` rules
- Field numbers
- `import` and `option` statements (skip them)
- `service`/`rpc` declarations (skip them)
- `reserved` statements (skip them)

The parser must convert snake_case field names to camelCase (matching protobufjs behavior: `zip_code` -> `zipCode`, `order_id` -> `orderId`).

```rust
// wasm/crates/csr-parsers/src/proto_schema/parser.rs
use super::lexer::Token;
use super::types::*;
use std::collections::BTreeMap;

pub struct ProtoParser {
    tokens: Vec<(Token, usize)>,
    pos: usize,
}

impl ProtoParser {
    pub fn new(tokens: Vec<(Token, usize)>) -> Self {
        Self { tokens, pos: 0 }
    }

    fn peek(&self) -> &Token {
        &self.tokens[self.pos].0
    }

    fn line(&self) -> usize {
        self.tokens[self.pos].1
    }

    fn advance(&mut self) -> &Token {
        let tok = &self.tokens[self.pos].0;
        self.pos += 1;
        tok
    }

    fn expect(&mut self, expected: &Token) -> Result<(), String> {
        if self.peek() == expected {
            self.advance();
            Ok(())
        } else {
            Err(format!(
                "Expected {:?}, found {:?} at line {}",
                expected,
                self.peek(),
                self.line()
            ))
        }
    }

    fn expect_ident(&mut self) -> Result<String, String> {
        match self.advance().clone() {
            Token::Ident(s) => Ok(s),
            other => Err(format!("Expected identifier, found {:?} at line {}", other, self.line())),
        }
    }

    fn expect_int(&mut self) -> Result<i64, String> {
        match self.advance().clone() {
            Token::IntLit(n) => Ok(n),
            other => Err(format!("Expected integer, found {:?} at line {}", other, self.line())),
        }
    }

    pub fn parse(&mut self) -> Result<ProtobufSchemaInfo, String> {
        let mut schema = ProtobufSchemaInfo {
            enums: Vec::new(),
            messages: Vec::new(),
            package: None,
            syntax: None,
        };

        let mut namespace_prefix = String::new();

        while *self.peek() != Token::Eof {
            match self.peek().clone() {
                Token::Syntax => {
                    self.advance();
                    self.expect(&Token::Equals)?;
                    if let Token::StringLit(s) = self.advance().clone() {
                        schema.syntax = Some(s);
                    }
                    self.expect(&Token::Semicolon)?;
                }
                Token::Package => {
                    self.advance();
                    let mut pkg = self.expect_ident()?;
                    while *self.peek() == Token::Dot {
                        self.advance();
                        pkg.push('.');
                        pkg.push_str(&self.expect_ident()?);
                    }
                    schema.package = Some(pkg.clone());
                    namespace_prefix = format!(".{}", pkg);
                    self.expect(&Token::Semicolon)?;
                }
                Token::Message => {
                    let msg = self.parse_message(&namespace_prefix)?;
                    schema.messages.push(msg);
                }
                Token::Enum => {
                    let enum_info = self.parse_enum(&namespace_prefix)?;
                    schema.enums.push(enum_info);
                }
                Token::Import => {
                    // Skip import statements
                    self.advance();
                    self.advance(); // string
                    self.expect(&Token::Semicolon)?;
                }
                Token::Option => {
                    self.skip_option()?;
                }
                Token::Service => {
                    self.skip_service()?;
                }
                _ => {
                    return Err(format!(
                        "Unexpected token {:?} at line {}",
                        self.peek(),
                        self.line()
                    ));
                }
            }
        }

        // Resolve field types
        self.resolve_fields(&mut schema);

        Ok(schema)
    }

    fn parse_message(&mut self, prefix: &str) -> Result<ProtobufMessageInfo, String> {
        self.expect(&Token::Message)?;
        let name = self.expect_ident()?;
        let full_name = format!("{}.{}", prefix, name);
        self.expect(&Token::LBrace)?;

        let mut msg = ProtobufMessageInfo {
            fields: Vec::new(),
            full_name,
            name,
            nested_enums: Vec::new(),
            nested_messages: Vec::new(),
            oneofs: Vec::new(),
        };

        while *self.peek() != Token::RBrace {
            match self.peek().clone() {
                Token::Message => {
                    let nested = self.parse_message(&msg.full_name)?;
                    msg.nested_messages.push(nested);
                }
                Token::Enum => {
                    let nested = self.parse_enum(&msg.full_name)?;
                    msg.nested_enums.push(nested);
                }
                Token::Oneof => {
                    let (oneof, fields) = self.parse_oneof(&msg.full_name)?;
                    msg.oneofs.push(oneof);
                    msg.fields.extend(fields);
                }
                Token::Map => {
                    let field = self.parse_map_field()?;
                    msg.fields.push(field);
                }
                Token::Repeated | Token::Optional | Token::Required => {
                    let field = self.parse_field(Some(self.peek().clone()))?;
                    msg.fields.push(field);
                }
                Token::Reserved => {
                    self.skip_reserved()?;
                }
                Token::Option => {
                    self.skip_option()?;
                }
                Token::Ident(_) => {
                    let field = self.parse_field(None)?;
                    msg.fields.push(field);
                }
                _ => {
                    return Err(format!(
                        "Unexpected token {:?} in message at line {}",
                        self.peek(),
                        self.line()
                    ));
                }
            }
        }

        self.expect(&Token::RBrace)?;
        Ok(msg)
    }

    fn parse_field(&mut self, rule_token: Option<Token>) -> Result<ProtobufFieldInfo, String> {
        let rule = match &rule_token {
            Some(Token::Repeated) => { self.advance(); Some("repeated".to_string()) }
            Some(Token::Optional) => { self.advance(); Some("optional".to_string()) }
            Some(Token::Required) => { self.advance(); Some("required".to_string()) }
            _ => None,
        };

        let field_type = self.parse_type_name()?;
        let name = self.expect_ident()?;
        self.expect(&Token::Equals)?;
        let id = self.expect_int()? as u32;

        // Skip field options [...]
        if *self.peek() == Token::LBracket {
            self.skip_field_options()?;
        }
        self.expect(&Token::Semicolon)?;

        Ok(ProtobufFieldInfo {
            description: None,
            id,
            is_map: false,
            name: snake_to_camel(&name),
            resolved_kind: "scalar".to_string(), // resolved later
            resolved_type_name: None,            // resolved later
            rule,
            field_type,
        })
    }

    fn parse_map_field(&mut self) -> Result<ProtobufFieldInfo, String> {
        self.expect(&Token::Map)?;
        self.expect(&Token::LAngle)?;
        let _key_type = self.parse_type_name()?;
        self.expect(&Token::Comma)?;
        let value_type = self.parse_type_name()?;
        self.expect(&Token::RAngle)?;
        let name = self.expect_ident()?;
        self.expect(&Token::Equals)?;
        let id = self.expect_int()? as u32;

        if *self.peek() == Token::LBracket {
            self.skip_field_options()?;
        }
        self.expect(&Token::Semicolon)?;

        Ok(ProtobufFieldInfo {
            description: None,
            id,
            is_map: true,
            name: snake_to_camel(&name),
            resolved_kind: "scalar".to_string(),
            resolved_type_name: None,
            rule: None,
            field_type: value_type,
        })
    }

    fn parse_oneof(&mut self, _prefix: &str) -> Result<(OneofInfo, Vec<ProtobufFieldInfo>), String> {
        self.expect(&Token::Oneof)?;
        let name = self.expect_ident()?;
        self.expect(&Token::LBrace)?;

        let mut fields = Vec::new();
        let mut field_names = Vec::new();

        while *self.peek() != Token::RBrace {
            if *self.peek() == Token::Option {
                self.skip_option()?;
                continue;
            }
            let field = self.parse_field(None)?;
            field_names.push(field.name.clone());
            fields.push(field);
        }
        self.expect(&Token::RBrace)?;

        Ok((
            OneofInfo {
                field_names,
                name: snake_to_camel(&name),
            },
            fields,
        ))
    }

    fn parse_enum(&mut self, prefix: &str) -> Result<ProtobufEnumInfo, String> {
        self.expect(&Token::Enum)?;
        let name = self.expect_ident()?;
        let full_name = format!("{}.{}", prefix, name);
        self.expect(&Token::LBrace)?;

        let mut values = BTreeMap::new();

        while *self.peek() != Token::RBrace {
            match self.peek().clone() {
                Token::Option => {
                    self.skip_option()?;
                }
                Token::Reserved => {
                    self.skip_reserved()?;
                }
                Token::Ident(val_name) => {
                    self.advance();
                    self.expect(&Token::Equals)?;
                    let num = self.expect_int()? as i32;
                    // Skip options
                    if *self.peek() == Token::LBracket {
                        self.skip_field_options()?;
                    }
                    self.expect(&Token::Semicolon)?;
                    values.insert(val_name, num);
                }
                _ => {
                    return Err(format!(
                        "Unexpected token {:?} in enum at line {}",
                        self.peek(),
                        self.line()
                    ));
                }
            }
        }
        self.expect(&Token::RBrace)?;

        Ok(ProtobufEnumInfo {
            full_name,
            name,
            values,
        })
    }

    fn parse_type_name(&mut self) -> Result<String, String> {
        let mut name = match self.peek().clone() {
            Token::Dot => {
                self.advance();
                ".".to_string()
            }
            _ => String::new(),
        };

        let ident = self.expect_ident()?;
        name.push_str(&ident);

        while *self.peek() == Token::Dot {
            self.advance();
            name.push('.');
            name.push_str(&self.expect_ident()?);
        }

        Ok(name)
    }

    fn skip_field_options(&mut self) -> Result<(), String> {
        self.expect(&Token::LBracket)?;
        let mut depth = 1;
        while depth > 0 {
            match self.advance().clone() {
                Token::LBracket => depth += 1,
                Token::RBracket => depth -= 1,
                Token::Eof => return Err("Unterminated field options".into()),
                _ => {}
            }
        }
        Ok(())
    }

    fn skip_option(&mut self) -> Result<(), String> {
        self.expect(&Token::Option)?;
        // Skip until semicolon
        while *self.peek() != Token::Semicolon && *self.peek() != Token::Eof {
            self.advance();
        }
        self.expect(&Token::Semicolon)?;
        Ok(())
    }

    fn skip_reserved(&mut self) -> Result<(), String> {
        self.advance(); // 'reserved'
        while *self.peek() != Token::Semicolon && *self.peek() != Token::Eof {
            self.advance();
        }
        self.expect(&Token::Semicolon)?;
        Ok(())
    }

    fn skip_service(&mut self) -> Result<(), String> {
        self.advance(); // 'service'
        self.expect_ident()?; // name
        self.expect(&Token::LBrace)?;
        let mut depth = 1;
        while depth > 0 {
            match self.advance().clone() {
                Token::LBrace => depth += 1,
                Token::RBrace => depth -= 1,
                Token::Eof => return Err("Unterminated service block".into()),
                _ => {}
            }
        }
        Ok(())
    }

    fn resolve_fields(&self, schema: &mut ProtobufSchemaInfo) {
        let all_messages = collect_all_message_names(&schema.messages);
        let all_enums = collect_all_enum_names(&schema.messages, &schema.enums);

        for msg in &mut schema.messages {
            resolve_message_fields(msg, &all_messages, &all_enums);
        }
    }
}

fn collect_all_message_names(messages: &[ProtobufMessageInfo]) -> Vec<String> {
    let mut names = Vec::new();
    for msg in messages {
        names.push(msg.full_name.clone());
        names.extend(collect_all_message_names(&msg.nested_messages));
    }
    names
}

fn collect_all_enum_names(
    messages: &[ProtobufMessageInfo],
    top_enums: &[ProtobufEnumInfo],
) -> Vec<String> {
    let mut names: Vec<String> = top_enums.iter().map(|e| e.full_name.clone()).collect();
    for msg in messages {
        for e in &msg.nested_enums {
            names.push(e.full_name.clone());
        }
        names.extend(collect_all_enum_names(&msg.nested_messages, &[]));
    }
    names
}

fn resolve_message_fields(
    msg: &mut ProtobufMessageInfo,
    all_messages: &[String],
    all_enums: &[String],
) {
    for field in &mut msg.fields {
        if field.is_map {
            // Map value type might be a message or enum
            resolve_field_type(field, &msg.full_name, all_messages, all_enums);
        } else {
            resolve_field_type(field, &msg.full_name, all_messages, all_enums);
        }
    }
    for nested in &mut msg.nested_messages {
        resolve_message_fields(nested, all_messages, all_enums);
    }
}

fn resolve_field_type(
    field: &mut ProtobufFieldInfo,
    parent_full_name: &str,
    all_messages: &[String],
    all_enums: &[String],
) {
    let ft = &field.field_type;

    // Scalar types
    if is_scalar(ft) {
        field.resolved_kind = "scalar".to_string();
        return;
    }

    // Try resolving as nested type first (parent.Type), then as top-level
    let candidates = vec![
        format!("{}.{}", parent_full_name, ft),
        format!(".{}", ft),
        ft.clone(),
    ];

    for candidate in &candidates {
        if all_messages.iter().any(|m| m == candidate) {
            field.resolved_kind = "message".to_string();
            field.resolved_type_name = Some(candidate.clone());
            return;
        }
        if all_enums.iter().any(|e| e == candidate) {
            field.resolved_kind = "enum".to_string();
            field.resolved_type_name = Some(candidate.clone());
            return;
        }
    }

    // Default to scalar if unresolved
    field.resolved_kind = "scalar".to_string();
}

fn is_scalar(t: &str) -> bool {
    matches!(
        t,
        "double"
            | "float"
            | "int32"
            | "int64"
            | "uint32"
            | "uint64"
            | "sint32"
            | "sint64"
            | "fixed32"
            | "fixed64"
            | "sfixed32"
            | "sfixed64"
            | "bool"
            | "string"
            | "bytes"
    )
}

fn snake_to_camel(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut capitalize_next = false;
    for ch in s.chars() {
        if ch == '_' {
            capitalize_next = true;
        } else if capitalize_next {
            result.extend(ch.to_uppercase());
            capitalize_next = false;
        } else {
            result.push(ch);
        }
    }
    result
}
```

- [ ] **Step 4: Create sample JSON generator (`src/proto_schema/sample.rs`)**

Generates sample JSON from parsed schema, matching existing `generateSampleJson` behavior exactly.

```rust
// wasm/crates/csr-parsers/src/proto_schema/sample.rs
use super::types::*;
use serde_json::{Map, Value};
use std::collections::HashSet;

const SCALAR_DEFAULTS: &[(&str, fn() -> Value)] = &[
    ("bool", || Value::Bool(false)),
    ("bytes", || Value::String(String::new())),
    ("double", || Value::Number(0.into())),
    ("fixed32", || Value::Number(0.into())),
    ("fixed64", || Value::String("0".into())),
    ("float", || Value::Number(0.into())),
    ("int32", || Value::Number(0.into())),
    ("int64", || Value::String("0".into())),
    ("sfixed32", || Value::Number(0.into())),
    ("sfixed64", || Value::String("0".into())),
    ("sint32", || Value::Number(0.into())),
    ("sint64", || Value::String("0".into())),
    ("string", || Value::String(String::new())),
    ("uint32", || Value::Number(0.into())),
    ("uint64", || Value::String("0".into())),
];

fn scalar_default(type_name: &str) -> Value {
    for (name, default_fn) in SCALAR_DEFAULTS {
        if *name == type_name {
            return default_fn();
        }
    }
    Value::Null
}

pub fn generate_sample_json(
    message: &ProtobufMessageInfo,
    all_messages: &[ProtobufMessageInfo],
    all_enums: &[ProtobufEnumInfo],
) -> Value {
    let mut visited = HashSet::new();
    generate_sample_inner(message, all_messages, all_enums, &mut visited)
}

fn generate_sample_inner(
    message: &ProtobufMessageInfo,
    all_messages: &[ProtobufMessageInfo],
    all_enums: &[ProtobufEnumInfo],
    visited: &mut HashSet<String>,
) -> Value {
    visited.insert(message.full_name.clone());

    let flat_messages = collect_all_messages(all_messages);
    let flat_enums = collect_all_enums(all_messages, all_enums);

    let mut result = Map::new();

    for field in &message.fields {
        let value = if field.is_map {
            Value::Object(Map::new())
        } else if field.resolved_kind == "enum" {
            if let Some(enum_info) = flat_enums
                .iter()
                .find(|e| Some(&e.full_name) == field.resolved_type_name.as_ref())
            {
                let first_key = enum_info.values.keys().next();
                match first_key {
                    Some(k) => Value::String(k.clone()),
                    None => Value::String(String::new()),
                }
            } else {
                Value::String(String::new())
            }
        } else if field.resolved_kind == "message" {
            if let Some(nested_msg) = flat_messages
                .iter()
                .find(|m| Some(&m.full_name) == field.resolved_type_name.as_ref())
            {
                if visited.contains(&nested_msg.full_name) {
                    Value::Object(Map::new())
                } else {
                    let mut new_visited = visited.clone();
                    generate_sample_inner(nested_msg, all_messages, all_enums, &mut new_visited)
                }
            } else {
                Value::Object(Map::new())
            }
        } else {
            scalar_default(&field.field_type)
        };

        let final_value = if field.rule.as_deref() == Some("repeated") {
            Value::Array(vec![value])
        } else {
            value
        };

        result.insert(field.name.clone(), final_value);
    }

    Value::Object(result)
}

fn collect_all_messages(messages: &[ProtobufMessageInfo]) -> Vec<&ProtobufMessageInfo> {
    let mut result = Vec::new();
    for msg in messages {
        result.push(msg);
        result.extend(collect_all_messages(&msg.nested_messages));
    }
    result
}

fn collect_all_enums<'a>(
    messages: &'a [ProtobufMessageInfo],
    top_enums: &'a [ProtobufEnumInfo],
) -> Vec<&'a ProtobufEnumInfo> {
    let mut result: Vec<&ProtobufEnumInfo> = top_enums.iter().collect();
    for msg in messages {
        for e in &msg.nested_enums {
            result.push(e);
        }
        result.extend(collect_all_enums(&msg.nested_messages, &[]));
    }
    result
}
```

- [ ] **Step 5: Create proto_schema module and add to lib.rs**

```rust
// wasm/crates/csr-parsers/src/proto_schema/mod.rs
pub mod lexer;
pub mod parser;
pub mod sample;
pub mod types;
```

Add to `lib.rs`:

```rust
mod proto_schema;

// ── Protobuf Schema ──

#[wasm_bindgen]
pub fn parse_protobuf_schema(input: &str) -> JsValue {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        let result = proto_schema::types::ProtobufParseResult::err(
            "Empty input \u{2014} paste a .proto definition to parse".into(),
            None,
        );
        return serde_wasm_bindgen::to_value(&result).unwrap();
    }

    let mut lexer = proto_schema::lexer::Lexer::new(trimmed);
    let tokens = match lexer.tokenize() {
        Ok(t) => t,
        Err(e) => {
            let line_match = extract_line_number(&e);
            let result = proto_schema::types::ProtobufParseResult::err(e, line_match);
            return serde_wasm_bindgen::to_value(&result).unwrap();
        }
    };

    let mut parser = proto_schema::parser::ProtoParser::new(tokens);
    match parser.parse() {
        Ok(schema) => {
            let result = proto_schema::types::ProtobufParseResult::ok(schema);
            serde_wasm_bindgen::to_value(&result).unwrap()
        }
        Err(e) => {
            let line_match = extract_line_number(&e);
            let result = proto_schema::types::ProtobufParseResult::err(e, line_match);
            serde_wasm_bindgen::to_value(&result).unwrap()
        }
    }
}

#[wasm_bindgen]
pub fn generate_sample_json_from_schema(
    schema_json: &str,
    message_name: &str,
) -> Result<String, JsError> {
    let schema: proto_schema::types::ProtobufSchemaInfo =
        serde_json::from_str(schema_json).map_err(|e| JsError::new(&e.to_string()))?;

    let all_messages = collect_all_flat_messages(&schema.messages);
    let msg = all_messages
        .iter()
        .find(|m| m.name == message_name)
        .ok_or_else(|| JsError::new(&format!("Message '{}' not found", message_name)))?;

    let sample =
        proto_schema::sample::generate_sample_json(msg, &schema.messages, &schema.enums);
    serde_json::to_string_pretty(&sample).map_err(|e| JsError::new(&e.to_string()))
}

fn extract_line_number(error: &str) -> Option<u32> {
    // Extract "line N" from error message
    let re_like = error.find("line ");
    if let Some(pos) = re_like {
        let after = &error[pos + 5..];
        let num_str: String = after.chars().take_while(|c| c.is_ascii_digit()).collect();
        num_str.parse().ok()
    } else {
        None
    }
}

fn collect_all_flat_messages(messages: &[proto_schema::types::ProtobufMessageInfo]) -> Vec<&proto_schema::types::ProtobufMessageInfo> {
    let mut result = Vec::new();
    for msg in messages {
        result.push(msg);
        result.extend(collect_all_flat_messages(&msg.nested_messages));
    }
    result
}
```

Also add `serde::Deserialize` to the types that need to be deserialized in `generate_sample_json_from_schema`. Update the `#[derive]` on `ProtobufSchemaInfo`, `ProtobufMessageInfo`, `ProtobufEnumInfo`, `ProtobufFieldInfo`, `OneofInfo` to include `Deserialize`:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
```

- [ ] **Step 6: Run Rust tests**

Run: `cd /Users/boe-100x/Documents/projects/labs/boengai/csr-dev-tools/wasm && cargo test -p csr-parsers`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add wasm/crates/csr-parsers/src/proto_schema/ wasm/crates/csr-parsers/src/lib.rs
git commit -m "feat(csr-parsers): add protobuf schema parser module

Hand-written proto2/3 lexer and parser. Extracts messages, enums, fields,
oneofs, map fields. Includes sample JSON generator with cycle detection.
Snake_case to camelCase field name conversion matching protobufjs behavior.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Add Protobuf Codec module to `csr-parsers`

**Files:**
- Create: `wasm/crates/csr-parsers/src/proto_codec/mod.rs`
- Create: `wasm/crates/csr-parsers/src/proto_codec/wire.rs`
- Create: `wasm/crates/csr-parsers/src/proto_codec/encode.rs`
- Create: `wasm/crates/csr-parsers/src/proto_codec/decode.rs`
- Modify: `wasm/crates/csr-parsers/src/lib.rs`

- [ ] **Step 1: Create wire format helpers (`src/proto_codec/wire.rs`)**

Implements protobuf wire format: varint encoding/decoding, length-delimited fields, fixed32/fixed64, zigzag encoding.

```rust
// wasm/crates/csr-parsers/src/proto_codec/wire.rs

pub const WIRE_VARINT: u32 = 0;
pub const WIRE_64BIT: u32 = 1;
pub const WIRE_LENGTH_DELIMITED: u32 = 2;
pub const WIRE_32BIT: u32 = 5;

// ── Encoding ──

pub fn encode_varint(mut value: u64, buf: &mut Vec<u8>) {
    loop {
        let mut byte = (value & 0x7F) as u8;
        value >>= 7;
        if value != 0 {
            byte |= 0x80;
        }
        buf.push(byte);
        if value == 0 {
            break;
        }
    }
}

pub fn encode_tag(field_number: u32, wire_type: u32, buf: &mut Vec<u8>) {
    encode_varint(((field_number as u64) << 3) | (wire_type as u64), buf);
}

pub fn encode_zigzag32(n: i32) -> u64 {
    ((n << 1) ^ (n >> 31)) as u32 as u64
}

pub fn encode_zigzag64(n: i64) -> u64 {
    ((n << 1) ^ (n >> 63)) as u64
}

// ── Decoding ──

pub struct WireReader<'a> {
    buf: &'a [u8],
    pos: usize,
}

impl<'a> WireReader<'a> {
    pub fn new(buf: &'a [u8]) -> Self {
        Self { buf, pos: 0 }
    }

    pub fn remaining(&self) -> usize {
        self.buf.len() - self.pos
    }

    pub fn read_varint(&mut self) -> Result<u64, String> {
        let mut result: u64 = 0;
        let mut shift = 0;
        loop {
            if self.pos >= self.buf.len() {
                return Err("Unexpected end of buffer reading varint".into());
            }
            let byte = self.buf[self.pos];
            self.pos += 1;
            result |= ((byte & 0x7F) as u64) << shift;
            if byte & 0x80 == 0 {
                break;
            }
            shift += 7;
            if shift >= 64 {
                return Err("Varint too long".into());
            }
        }
        Ok(result)
    }

    pub fn read_tag(&mut self) -> Result<(u32, u32), String> {
        let val = self.read_varint()?;
        let field_number = (val >> 3) as u32;
        let wire_type = (val & 0x7) as u32;
        Ok((field_number, wire_type))
    }

    pub fn read_bytes(&mut self) -> Result<&'a [u8], String> {
        let len = self.read_varint()? as usize;
        if self.pos + len > self.buf.len() {
            return Err("Unexpected end of buffer reading bytes".into());
        }
        let data = &self.buf[self.pos..self.pos + len];
        self.pos += len;
        Ok(data)
    }

    pub fn read_fixed32(&mut self) -> Result<u32, String> {
        if self.pos + 4 > self.buf.len() {
            return Err("Unexpected end of buffer reading fixed32".into());
        }
        let bytes = [
            self.buf[self.pos],
            self.buf[self.pos + 1],
            self.buf[self.pos + 2],
            self.buf[self.pos + 3],
        ];
        self.pos += 4;
        Ok(u32::from_le_bytes(bytes))
    }

    pub fn read_fixed64(&mut self) -> Result<u64, String> {
        if self.pos + 8 > self.buf.len() {
            return Err("Unexpected end of buffer reading fixed64".into());
        }
        let mut bytes = [0u8; 8];
        bytes.copy_from_slice(&self.buf[self.pos..self.pos + 8]);
        self.pos += 8;
        Ok(u64::from_le_bytes(bytes))
    }

    pub fn skip_field(&mut self, wire_type: u32) -> Result<(), String> {
        match wire_type {
            WIRE_VARINT => { self.read_varint()?; }
            WIRE_64BIT => { self.read_fixed64()?; }
            WIRE_LENGTH_DELIMITED => { self.read_bytes()?; }
            WIRE_32BIT => { self.read_fixed32()?; }
            _ => return Err(format!("Unknown wire type {}", wire_type)),
        }
        Ok(())
    }
}

pub fn decode_zigzag32(n: u32) -> i32 {
    ((n >> 1) as i32) ^ (-((n & 1) as i32))
}

pub fn decode_zigzag64(n: u64) -> i64 {
    ((n >> 1) as i64) ^ (-((n & 1) as i64))
}
```

- [ ] **Step 2: Create encoder (`src/proto_codec/encode.rs`)**

Encodes JSON object to protobuf binary using a parsed schema.

```rust
// wasm/crates/csr-parsers/src/proto_codec/encode.rs
use super::wire::*;
use crate::proto_schema::types::*;
use serde_json::Value;

pub fn encode_message(
    json: &Value,
    message: &ProtobufMessageInfo,
    all_messages: &[ProtobufMessageInfo],
    all_enums: &[ProtobufEnumInfo],
) -> Result<Vec<u8>, String> {
    let obj = json
        .as_object()
        .ok_or("Expected JSON object for message encoding")?;

    let mut buf = Vec::new();

    for field in &message.fields {
        let value = match obj.get(&field.name) {
            Some(v) if !v.is_null() => v,
            _ => continue,
        };

        if field.rule.as_deref() == Some("repeated") {
            if let Value::Array(arr) = value {
                for item in arr {
                    encode_field(&mut buf, field, item, all_messages, all_enums)?;
                }
            }
        } else {
            encode_field(&mut buf, field, value, all_messages, all_enums)?;
        }
    }

    Ok(buf)
}

fn encode_field(
    buf: &mut Vec<u8>,
    field: &ProtobufFieldInfo,
    value: &Value,
    all_messages: &[ProtobufMessageInfo],
    all_enums: &[ProtobufEnumInfo],
) -> Result<(), String> {
    match field.resolved_kind.as_str() {
        "message" => {
            let nested_msg = find_message(all_messages, field.resolved_type_name.as_deref());
            if let Some(msg) = nested_msg {
                let encoded = encode_message(value, msg, all_messages, all_enums)?;
                encode_tag(field.id, WIRE_LENGTH_DELIMITED, buf);
                encode_varint(encoded.len() as u64, buf);
                buf.extend_from_slice(&encoded);
            }
        }
        "enum" => {
            let enum_val = resolve_enum_value(value, all_enums, field.resolved_type_name.as_deref());
            encode_tag(field.id, WIRE_VARINT, buf);
            encode_varint(enum_val as u64, buf);
        }
        _ => {
            encode_scalar(buf, field.id, &field.field_type, value)?;
        }
    }
    Ok(())
}

fn encode_scalar(buf: &mut Vec<u8>, field_id: u32, type_name: &str, value: &Value) -> Result<(), String> {
    match type_name {
        "string" => {
            let s = value.as_str().unwrap_or(&value.to_string().replace('"', ""));
            encode_tag(field_id, WIRE_LENGTH_DELIMITED, buf);
            encode_varint(s.len() as u64, buf);
            buf.extend_from_slice(s.as_bytes());
        }
        "bytes" => {
            let s = value.as_str().unwrap_or("");
            encode_tag(field_id, WIRE_LENGTH_DELIMITED, buf);
            encode_varint(s.len() as u64, buf);
            buf.extend_from_slice(s.as_bytes());
        }
        "bool" => {
            let b = value.as_bool().unwrap_or(false);
            encode_tag(field_id, WIRE_VARINT, buf);
            encode_varint(b as u64, buf);
        }
        "int32" | "int64" | "uint32" | "uint64" => {
            let n = value_to_u64(value);
            encode_tag(field_id, WIRE_VARINT, buf);
            encode_varint(n, buf);
        }
        "sint32" => {
            let n = value_to_i64(value) as i32;
            encode_tag(field_id, WIRE_VARINT, buf);
            encode_varint(encode_zigzag32(n), buf);
        }
        "sint64" => {
            let n = value_to_i64(value);
            encode_tag(field_id, WIRE_VARINT, buf);
            encode_varint(encode_zigzag64(n), buf);
        }
        "fixed32" => {
            let n = value_to_u64(value) as u32;
            encode_tag(field_id, WIRE_32BIT, buf);
            buf.extend_from_slice(&n.to_le_bytes());
        }
        "fixed64" | "sfixed64" => {
            let n = value_to_u64(value);
            encode_tag(field_id, WIRE_64BIT, buf);
            buf.extend_from_slice(&n.to_le_bytes());
        }
        "sfixed32" => {
            let n = value_to_i64(value) as i32;
            encode_tag(field_id, WIRE_32BIT, buf);
            buf.extend_from_slice(&n.to_le_bytes());
        }
        "float" => {
            let f = value.as_f64().unwrap_or(0.0) as f32;
            encode_tag(field_id, WIRE_32BIT, buf);
            buf.extend_from_slice(&f.to_le_bytes());
        }
        "double" => {
            let f = value.as_f64().unwrap_or(0.0);
            encode_tag(field_id, WIRE_64BIT, buf);
            buf.extend_from_slice(&f.to_le_bytes());
        }
        _ => {}
    }
    Ok(())
}

fn value_to_u64(v: &Value) -> u64 {
    match v {
        Value::Number(n) => n.as_u64().unwrap_or(n.as_i64().unwrap_or(0) as u64),
        Value::String(s) => s.parse().unwrap_or(0),
        Value::Bool(b) => *b as u64,
        _ => 0,
    }
}

fn value_to_i64(v: &Value) -> i64 {
    match v {
        Value::Number(n) => n.as_i64().unwrap_or(0),
        Value::String(s) => s.parse().unwrap_or(0),
        _ => 0,
    }
}

fn resolve_enum_value(
    value: &Value,
    all_enums: &[ProtobufEnumInfo],
    type_name: Option<&str>,
) -> i32 {
    if let Some(n) = value.as_i64() {
        return n as i32;
    }
    if let Some(s) = value.as_str() {
        if let Some(type_name) = type_name {
            for e in all_enums {
                if e.full_name == type_name {
                    if let Some(&val) = e.values.get(s) {
                        return val;
                    }
                }
            }
        }
    }
    0
}

fn find_message<'a>(
    all_messages: &'a [ProtobufMessageInfo],
    full_name: Option<&str>,
) -> Option<&'a ProtobufMessageInfo> {
    let target = full_name?;
    for msg in all_messages {
        if msg.full_name == target {
            return Some(msg);
        }
        if let Some(found) = find_message(&msg.nested_messages, Some(target)) {
            return Some(found);
        }
    }
    None
}
```

- [ ] **Step 3: Create decoder (`src/proto_codec/decode.rs`)**

Decodes protobuf binary back to JSON using a parsed schema.

```rust
// wasm/crates/csr-parsers/src/proto_codec/decode.rs
use super::wire::*;
use crate::proto_schema::types::*;
use serde_json::{Map, Value};

pub fn decode_message(
    data: &[u8],
    message: &ProtobufMessageInfo,
    all_messages: &[ProtobufMessageInfo],
    all_enums: &[ProtobufEnumInfo],
) -> Result<Value, String> {
    let mut reader = WireReader::new(data);
    let mut result = Map::new();

    // Initialize defaults
    for field in &message.fields {
        let default = get_default_value(field, all_enums);
        result.insert(field.name.clone(), default);
    }

    while reader.remaining() > 0 {
        let (field_number, wire_type) = reader.read_tag()?;

        let field = message.fields.iter().find(|f| f.id == field_number);

        if let Some(field) = field {
            let value = decode_field_value(&mut reader, wire_type, field, all_messages, all_enums)?;

            if field.rule.as_deref() == Some("repeated") {
                let entry = result
                    .entry(field.name.clone())
                    .or_insert_with(|| Value::Array(Vec::new()));
                if let Value::Array(arr) = entry {
                    arr.push(value);
                }
            } else {
                result.insert(field.name.clone(), value);
            }
        } else {
            reader.skip_field(wire_type)?;
        }
    }

    Ok(Value::Object(result))
}

fn decode_field_value(
    reader: &mut WireReader<'_>,
    wire_type: u32,
    field: &ProtobufFieldInfo,
    all_messages: &[ProtobufMessageInfo],
    all_enums: &[ProtobufEnumInfo],
) -> Result<Value, String> {
    if field.resolved_kind == "message" {
        let data = reader.read_bytes()?;
        let msg = find_message(all_messages, field.resolved_type_name.as_deref());
        if let Some(msg) = msg {
            return decode_message(data, msg, all_messages, all_enums);
        }
        return Ok(Value::Object(Map::new()));
    }

    if field.resolved_kind == "enum" {
        let n = reader.read_varint()? as i32;
        // Convert to string name
        if let Some(type_name) = &field.resolved_type_name {
            for e in all_enums {
                if e.full_name == *type_name {
                    for (name, &val) in &e.values {
                        if val == n {
                            return Ok(Value::String(name.clone()));
                        }
                    }
                }
            }
        }
        return Ok(Value::Number(n.into()));
    }

    decode_scalar(reader, wire_type, &field.field_type)
}

fn decode_scalar(
    reader: &mut WireReader<'_>,
    wire_type: u32,
    type_name: &str,
) -> Result<Value, String> {
    match type_name {
        "string" => {
            let data = reader.read_bytes()?;
            let s = String::from_utf8(data.to_vec())
                .map_err(|_| "Invalid UTF-8 in string field")?;
            Ok(Value::String(s))
        }
        "bytes" => {
            let data = reader.read_bytes()?;
            // base64 encode for JSON
            Ok(Value::String(base64_encode(data)))
        }
        "bool" => {
            let n = reader.read_varint()?;
            Ok(Value::Bool(n != 0))
        }
        "int32" => {
            let n = reader.read_varint()? as i32;
            Ok(Value::Number(n.into()))
        }
        "int64" => {
            let n = reader.read_varint()? as i64;
            Ok(Value::String(n.to_string()))
        }
        "uint32" => {
            let n = reader.read_varint()? as u32;
            Ok(Value::Number(n.into()))
        }
        "uint64" => {
            let n = reader.read_varint()?;
            Ok(Value::String(n.to_string()))
        }
        "sint32" => {
            let n = decode_zigzag32(reader.read_varint()? as u32);
            Ok(Value::Number(n.into()))
        }
        "sint64" => {
            let n = decode_zigzag64(reader.read_varint()?);
            Ok(Value::String(n.to_string()))
        }
        "fixed32" => {
            let n = reader.read_fixed32()?;
            Ok(Value::Number(n.into()))
        }
        "fixed64" => {
            let n = reader.read_fixed64()?;
            Ok(Value::String(n.to_string()))
        }
        "sfixed32" => {
            let n = reader.read_fixed32()? as i32;
            Ok(Value::Number(n.into()))
        }
        "sfixed64" => {
            let n = reader.read_fixed64()? as i64;
            Ok(Value::String(n.to_string()))
        }
        "float" => {
            let bits = reader.read_fixed32()?;
            let f = f32::from_le_bytes(bits.to_le_bytes());
            Ok(serde_json::Number::from_f64(f as f64)
                .map(Value::Number)
                .unwrap_or(Value::Number(0.into())))
        }
        "double" => {
            let bits = reader.read_fixed64()?;
            let f = f64::from_le_bytes(bits.to_le_bytes());
            Ok(serde_json::Number::from_f64(f)
                .map(Value::Number)
                .unwrap_or(Value::Number(0.into())))
        }
        _ => {
            reader.skip_field(wire_type)?;
            Ok(Value::Null)
        }
    }
}

fn get_default_value(field: &ProtobufFieldInfo, all_enums: &[ProtobufEnumInfo]) -> Value {
    if field.rule.as_deref() == Some("repeated") {
        return Value::Array(Vec::new());
    }
    if field.resolved_kind == "enum" {
        if let Some(type_name) = &field.resolved_type_name {
            for e in all_enums {
                if e.full_name == *type_name {
                    if let Some(first) = e.values.keys().next() {
                        return Value::String(first.clone());
                    }
                }
            }
        }
        return Value::String(String::new());
    }
    if field.resolved_kind == "message" {
        return Value::Null;
    }
    // Scalar defaults
    match field.field_type.as_str() {
        "string" | "bytes" => Value::String(String::new()),
        "bool" => Value::Bool(false),
        "int64" | "uint64" | "sint64" | "fixed64" | "sfixed64" => Value::String("0".into()),
        _ => Value::Number(0.into()),
    }
}

fn find_message<'a>(
    all_messages: &'a [ProtobufMessageInfo],
    full_name: Option<&str>,
) -> Option<&'a ProtobufMessageInfo> {
    let target = full_name?;
    for msg in all_messages {
        if msg.full_name == target {
            return Some(msg);
        }
        if let Some(found) = find_message(&msg.nested_messages, Some(target)) {
            return Some(found);
        }
    }
    None
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::new();
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = chunk.get(1).copied().unwrap_or(0) as u32;
        let b2 = chunk.get(2).copied().unwrap_or(0) as u32;
        let n = (b0 << 16) | (b1 << 8) | b2;
        result.push(CHARS[((n >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((n >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARS[((n >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARS[(n & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}
```

- [ ] **Step 4: Create proto_codec module and add WASM exports to lib.rs**

```rust
// wasm/crates/csr-parsers/src/proto_codec/mod.rs
pub mod decode;
pub mod encode;
pub mod wire;
```

Add to `lib.rs`:

```rust
mod proto_codec;

// ── Protobuf Codec ──

#[wasm_bindgen]
pub fn encode_protobuf(
    schema_input: &str,
    message_type_name: &str,
    json_string: &str,
    output_format: &str,
) -> JsValue {
    let result = encode_protobuf_inner(schema_input, message_type_name, json_string, output_format);
    serde_wasm_bindgen::to_value(&result).unwrap()
}

#[wasm_bindgen]
pub fn decode_protobuf(
    schema_input: &str,
    message_type_name: &str,
    input: &str,
    input_format: &str,
) -> JsValue {
    let result = decode_protobuf_inner(schema_input, message_type_name, input, input_format);
    serde_wasm_bindgen::to_value(&result).unwrap()
}

#[wasm_bindgen]
pub fn detect_protobuf_format(input: &str) -> String {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return "raw".to_string();
    }

    // Check hex: even-length, all hex chars
    let stripped: String = trimmed.chars().filter(|c| !c.is_whitespace()).collect();
    if stripped.len() >= 2
        && stripped.len() % 2 == 0
        && stripped.chars().all(|c| c.is_ascii_hexdigit())
    {
        return "hex".to_string();
    }

    // Check base64
    if trimmed.len() >= 4
        && trimmed
            .trim_end_matches('=')
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '+' || c == '/')
    {
        return "base64".to_string();
    }

    "raw".to_string()
}

fn encode_protobuf_inner(
    schema_input: &str,
    message_type_name: &str,
    json_string: &str,
    output_format: &str,
) -> CodecResultInternal {
    if schema_input.trim().is_empty() {
        return CodecResultInternal::err("Empty schema".into());
    }

    // Parse schema
    let mut lexer = proto_schema::lexer::Lexer::new(schema_input.trim());
    let tokens = match lexer.tokenize() {
        Ok(t) => t,
        Err(e) => return CodecResultInternal::err(e),
    };
    let mut parser = proto_schema::parser::ProtoParser::new(tokens);
    let schema = match parser.parse() {
        Ok(s) => s,
        Err(e) => return CodecResultInternal::err(e),
    };

    // Find message type
    let all_msgs = collect_all_flat_messages_owned(&schema.messages);
    let msg = match all_msgs.iter().find(|m| m.name == message_type_name) {
        Some(m) => m,
        None => return CodecResultInternal::err(format!("no such type: {}", message_type_name)),
    };

    // Parse JSON
    let json_value: serde_json::Value = match serde_json::from_str(json_string) {
        Ok(v) => v,
        Err(e) => return CodecResultInternal::err(e.to_string()),
    };

    // Encode
    let all_enums = collect_all_flat_enums(&schema.messages, &schema.enums);
    match proto_codec::encode::encode_message(&json_value, msg, &schema.messages, &all_enums) {
        Ok(bytes) => {
            let output = format_binary_output(&bytes, output_format);
            CodecResultInternal::ok(output)
        }
        Err(e) => CodecResultInternal::err(e),
    }
}

fn decode_protobuf_inner(
    schema_input: &str,
    message_type_name: &str,
    input: &str,
    input_format: &str,
) -> CodecResultInternal {
    if schema_input.trim().is_empty() {
        return CodecResultInternal::err("Empty schema".into());
    }

    // Parse schema
    let mut lexer = proto_schema::lexer::Lexer::new(schema_input.trim());
    let tokens = match lexer.tokenize() {
        Ok(t) => t,
        Err(e) => return CodecResultInternal::err(e),
    };
    let mut parser = proto_schema::parser::ProtoParser::new(tokens);
    let schema = match parser.parse() {
        Ok(s) => s,
        Err(e) => return CodecResultInternal::err(e),
    };

    // Find message type
    let all_msgs = collect_all_flat_messages_owned(&schema.messages);
    let msg = match all_msgs.iter().find(|m| m.name == message_type_name) {
        Some(m) => m,
        None => return CodecResultInternal::err(format!("no such type: {}", message_type_name)),
    };

    // Decode binary input
    let bytes = match parse_binary_input(input, input_format) {
        Ok(b) => b,
        Err(e) => return CodecResultInternal::err(e),
    };

    let all_enums = collect_all_flat_enums(&schema.messages, &schema.enums);
    match proto_codec::decode::decode_message(&bytes, msg, &schema.messages, &all_enums) {
        Ok(value) => match serde_json::to_string_pretty(&value) {
            Ok(s) => CodecResultInternal::ok(s),
            Err(e) => CodecResultInternal::err(e.to_string()),
        },
        Err(e) => CodecResultInternal::err(e),
    }
}

#[derive(serde::Serialize)]
struct CodecResultInternal {
    #[serde(skip_serializing_if = "Option::is_none")]
    output: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
    success: bool,
}

impl CodecResultInternal {
    fn ok(output: String) -> Self {
        Self { output: Some(output), error: None, success: true }
    }
    fn err(error: String) -> Self {
        Self { output: None, error: Some(error), success: false }
    }
}

fn format_binary_output(bytes: &[u8], format: &str) -> String {
    match format {
        "hex" => bytes.iter().map(|b| format!("{:02x}", b)).collect(),
        "base64" => proto_codec::decode::base64_encode(bytes), // reuse the base64 impl
        "raw" => bytes.iter().map(|b| *b as char).collect(),
        _ => String::new(),
    }
}

fn parse_binary_input(input: &str, format: &str) -> Result<Vec<u8>, String> {
    match format {
        "base64" => base64_decode(input),
        "hex" => hex_decode(input),
        "raw" => Ok(input.bytes().collect()),
        _ => Err(format!("Unknown format: {}", format)),
    }
}

fn base64_decode(input: &str) -> Result<Vec<u8>, String> {
    const DECODE: [i8; 128] = {
        let mut table = [-1i8; 128];
        let chars = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        let mut i = 0;
        while i < 64 {
            table[chars[i] as usize] = i as i8;
            i += 1;
        }
        table
    };

    let input = input.trim();
    let mut bytes = Vec::new();
    let chars: Vec<u8> = input.bytes().filter(|b| *b != b'=').collect();

    let mut i = 0;
    while i < chars.len() {
        let a = *DECODE.get(chars[i] as usize).ok_or("Invalid base64")? as u32;
        let b = if i + 1 < chars.len() { *DECODE.get(chars[i + 1] as usize).ok_or("Invalid base64")? as u32 } else { 0 };
        let c = if i + 2 < chars.len() { *DECODE.get(chars[i + 2] as usize).ok_or("Invalid base64")? as u32 } else { 0 };
        let d = if i + 3 < chars.len() { *DECODE.get(chars[i + 3] as usize).ok_or("Invalid base64")? as u32 } else { 0 };

        if a as i8 == -1 || b as i8 == -1 { return Err("Invalid base64 character".into()); }

        let n = (a << 18) | (b << 12) | (c << 6) | d;
        bytes.push((n >> 16) as u8);
        if i + 2 < chars.len() { bytes.push((n >> 8) as u8); }
        if i + 3 < chars.len() { bytes.push(n as u8); }
        i += 4;
    }
    Ok(bytes)
}

fn hex_decode(input: &str) -> Result<Vec<u8>, String> {
    let stripped: String = input.chars().filter(|c| !c.is_whitespace()).collect();
    if stripped.len() % 2 != 0 {
        return Err("Invalid hex string: odd length".into());
    }
    if !stripped.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err("Invalid hex string: non-hex characters".into());
    }
    (0..stripped.len())
        .step_by(2)
        .map(|i| {
            u8::from_str_radix(&stripped[i..i + 2], 16)
                .map_err(|e| format!("Invalid hex: {}", e))
        })
        .collect()
}

fn collect_all_flat_messages_owned(messages: &[proto_schema::types::ProtobufMessageInfo]) -> Vec<proto_schema::types::ProtobufMessageInfo> {
    let mut result = Vec::new();
    for msg in messages {
        result.push(msg.clone());
        result.extend(collect_all_flat_messages_owned(&msg.nested_messages));
    }
    result
}

fn collect_all_flat_enums(
    messages: &[proto_schema::types::ProtobufMessageInfo],
    top_enums: &[proto_schema::types::ProtobufEnumInfo],
) -> Vec<proto_schema::types::ProtobufEnumInfo> {
    let mut result = top_enums.to_vec();
    for msg in messages {
        result.extend(msg.nested_enums.clone());
        result.extend(collect_all_flat_enums(&msg.nested_messages, &[]));
    }
    result
}
```

Note: Move the `base64_encode` function from `decode.rs` to be `pub` so it can be reused in `lib.rs`, or duplicate it in the codec module.

- [ ] **Step 5: Run Rust tests**

Run: `cd /Users/boe-100x/Documents/projects/labs/boengai/csr-dev-tools/wasm && cargo test -p csr-parsers`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add wasm/crates/csr-parsers/src/proto_codec/ wasm/crates/csr-parsers/src/lib.rs
git commit -m "feat(csr-parsers): add protobuf binary codec module

Wire format reader/writer with varint, length-delimited, fixed32/64 support.
Encoder converts JSON to protobuf binary. Decoder converts back. Supports
base64, hex, and raw output formats. Format auto-detection.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Scaffold `csr-json-tools` crate

**Files:**
- Create: `wasm/crates/csr-json-tools/Cargo.toml`
- Create: `wasm/crates/csr-json-tools/src/lib.rs`
- Create: `wasm/crates/csr-json-tools/src/format.rs`
- Create: `wasm/crates/csr-json-tools/src/json_to_ts.rs`
- Create: `wasm/crates/csr-json-tools/src/deep_sort.rs`

- [ ] **Step 1: Create Cargo.toml**

```toml
[package]
name = "csr-json-tools"
version = "0.1.0"
edition.workspace = true

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = { version = "1", features = ["preserve_order"] }
wasm-bindgen = "0.2"
```

- [ ] **Step 2: Create JSON formatter (`src/format.rs`)**

```rust
// wasm/crates/csr-json-tools/src/format.rs

pub fn format_json(input: &str, indent: u32) -> Result<String, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Empty input".into());
    }

    let value: serde_json::Value =
        serde_json::from_str(trimmed).map_err(|e| e.to_string())?;

    let indent_str = " ".repeat(indent as usize);
    let formatter = serde_json::ser::PrettyFormatter::with_indent(indent_str.as_bytes());
    let mut buf = Vec::new();
    let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
    serde::Serialize::serialize(&value, &mut ser).map_err(|e| e.to_string())?;
    String::from_utf8(buf).map_err(|e| e.to_string())
}

pub fn get_json_parse_error(input: &str) -> Option<String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Some("Empty input".into());
    }
    match serde_json::from_str::<serde_json::Value>(trimmed) {
        Ok(_) => None,
        Err(e) => Some(e.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn format_simple() {
        let result = format_json("{\"name\":\"John\",\"age\":30}", 2).unwrap();
        assert_eq!(result, "{\n  \"name\": \"John\",\n  \"age\": 30\n}");
    }

    #[test]
    fn format_array() {
        let result = format_json("[1,2,3]", 2).unwrap();
        assert_eq!(result, "[\n  1,\n  2,\n  3\n]");
    }

    #[test]
    fn empty_input() {
        assert_eq!(format_json("", 2).unwrap_err(), "Empty input");
    }

    #[test]
    fn invalid_json() {
        assert!(format_json("{invalid}", 2).is_err());
    }

    #[test]
    fn custom_indent() {
        let result = format_json("{\"a\":1}", 4).unwrap();
        assert_eq!(result, "{\n    \"a\": 1\n}");
    }

    #[test]
    fn parse_error_valid() {
        assert!(get_json_parse_error("{\"key\":\"value\"}").is_none());
    }

    #[test]
    fn parse_error_empty() {
        assert!(get_json_parse_error("").is_some());
    }

    #[test]
    fn parse_error_invalid() {
        assert!(get_json_parse_error("{invalid}").is_some());
    }
}
```

- [ ] **Step 3: Create JSON-to-TypeScript (`src/json_to_ts.rs`)**

```rust
// wasm/crates/csr-json-tools/src/json_to_ts.rs
use serde_json::Value;
use std::collections::HashSet;

pub struct JsonToTsOptions {
    pub optional_properties: bool,
    pub root_name: String,
    pub use_interface: bool,
}

impl Default for JsonToTsOptions {
    fn default() -> Self {
        Self {
            optional_properties: false,
            root_name: "Root".into(),
            use_interface: true,
        }
    }
}

struct Collector {
    types: Vec<(String, String)>, // (name, body)
    built: HashSet<String>,
}

impl Collector {
    fn new() -> Self {
        Self {
            types: Vec::new(),
            built: HashSet::new(),
        }
    }
}

pub fn json_to_typescript(json: &str, options: &JsonToTsOptions) -> Result<String, String> {
    let parsed: Value = serde_json::from_str(json).map_err(|e| e.to_string())?;
    let mut collector = Collector::new();

    if !parsed.is_object() {
        let t = infer_type(&parsed, &options.root_name, &mut collector);
        return Ok(if options.use_interface {
            format!("interface {} {{\n  value: {}\n}}", options.root_name, t)
        } else {
            format!("type {} = {{\n  value: {}\n}}", options.root_name, t)
        });
    }

    build_object_type(
        parsed.as_object().unwrap(),
        &options.root_name,
        &mut collector,
    );

    let output: Vec<String> = collector
        .types
        .iter()
        .rev()
        .map(|(name, body)| {
            if body == "Record<string, unknown>" {
                if options.use_interface {
                    format!("interface {} extends Record<string, unknown> {{}}", name)
                } else {
                    format!("type {} = Record<string, unknown>", name)
                }
            } else {
                let formatted = if options.optional_properties {
                    body.lines()
                        .map(|line| {
                            // Replace "  key: type" with "  key?: type"
                            if line.starts_with("  ") && line.contains(": ") {
                                line.replacen(": ", "?: ", 1)
                            } else {
                                line.to_string()
                            }
                        })
                        .collect::<Vec<_>>()
                        .join("\n")
                } else {
                    body.clone()
                };
                if options.use_interface {
                    format!("interface {} {{\n{}\n}}", name, formatted)
                } else {
                    format!("type {} = {{\n{}\n}}", name, formatted)
                }
            }
        })
        .collect();

    Ok(output.join("\n\n"))
}

fn infer_type(value: &Value, key: &str, collector: &mut Collector) -> String {
    match value {
        Value::Null => "null".into(),
        Value::Bool(_) => "boolean".into(),
        Value::Number(_) => "number".into(),
        Value::String(_) => "string".into(),
        Value::Array(arr) => infer_array_type(arr, key, collector),
        Value::Object(map) => {
            let type_name = to_pascal_case(key);
            build_object_type(map, &type_name, collector);
            type_name
        }
    }
}

fn infer_array_type(arr: &[Value], key: &str, collector: &mut Collector) -> String {
    if arr.is_empty() {
        return "Array<unknown>".into();
    }

    let singular = if key.ends_with('s') && key.len() > 1 {
        &key[..key.len() - 1]
    } else {
        key
    };

    let mut types = Vec::new();
    let mut seen = HashSet::new();
    for item in arr {
        let t = infer_type(item, singular, collector);
        if seen.insert(t.clone()) {
            types.push(t);
        }
    }

    let inner = if types.len() == 1 {
        types[0].clone()
    } else {
        types.join(" | ")
    };

    format!("Array<{}>", inner)
}

fn build_object_type(
    obj: &serde_json::Map<String, Value>,
    name: &str,
    collector: &mut Collector,
) {
    if collector.built.contains(name) {
        return;
    }
    collector.built.insert(name.to_string());

    if obj.is_empty() {
        collector
            .types
            .push((name.to_string(), "Record<string, unknown>".to_string()));
        return;
    }

    let mut lines = Vec::new();
    for (k, v) in obj {
        let ts_type = infer_type(v, k, collector);
        lines.push(format!("  {}: {}", k, ts_type));
    }

    collector.types.push((name.to_string(), lines.join("\n")));
}

fn to_pascal_case(s: &str) -> String {
    let mut result = String::new();
    let mut capitalize_next = true;

    for ch in s.chars() {
        if !ch.is_ascii_alphanumeric() {
            capitalize_next = true;
        } else if capitalize_next {
            result.extend(ch.to_uppercase());
            capitalize_next = false;
        } else {
            result.push(ch);
        }
    }

    if result.starts_with(|c: char| c.is_ascii_digit()) {
        result.insert(0, '_');
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn basic_object() {
        let result = json_to_typescript(
            "{\"name\":\"John\",\"age\":30,\"active\":true}",
            &JsonToTsOptions::default(),
        )
        .unwrap();
        assert!(result.contains("interface Root"));
        assert!(result.contains("name: string"));
        assert!(result.contains("age: number"));
        assert!(result.contains("active: boolean"));
    }

    #[test]
    fn nested_objects() {
        let result = json_to_typescript(
            "{\"user\":{\"name\":\"John\",\"address\":{\"city\":\"NYC\"}}}",
            &JsonToTsOptions::default(),
        )
        .unwrap();
        assert!(result.contains("interface Root"));
        assert!(result.contains("interface User"));
        assert!(result.contains("interface Address"));
    }

    #[test]
    fn use_type_alias() {
        let result = json_to_typescript(
            "{\"name\":\"John\"}",
            &JsonToTsOptions {
                use_interface: false,
                ..Default::default()
            },
        )
        .unwrap();
        assert!(result.contains("type Root = {"));
        assert!(!result.contains("interface"));
    }

    #[test]
    fn optional_properties() {
        let result = json_to_typescript(
            "{\"name\":\"John\",\"age\":30}",
            &JsonToTsOptions {
                optional_properties: true,
                ..Default::default()
            },
        )
        .unwrap();
        assert!(result.contains("name?: string"));
        assert!(result.contains("age?: number"));
    }

    #[test]
    fn custom_root_name() {
        let result = json_to_typescript(
            "{\"id\":1}",
            &JsonToTsOptions {
                root_name: "ApiResponse".into(),
                ..Default::default()
            },
        )
        .unwrap();
        assert!(result.contains("interface ApiResponse"));
    }

    #[test]
    fn empty_object() {
        let result = json_to_typescript("{\"meta\":{}}", &JsonToTsOptions::default()).unwrap();
        assert!(result.contains("Record<string, unknown>"));
    }

    #[test]
    fn empty_array() {
        let result = json_to_typescript("{\"items\":[]}", &JsonToTsOptions::default()).unwrap();
        assert!(result.contains("Array<unknown>"));
    }

    #[test]
    fn null_value() {
        let result = json_to_typescript("{\"value\":null}", &JsonToTsOptions::default()).unwrap();
        assert!(result.contains("value: null"));
    }
}
```

- [ ] **Step 4: Create deep sort (`src/deep_sort.rs`)**

```rust
// wasm/crates/csr-json-tools/src/deep_sort.rs
use serde_json::Value;

pub fn deep_sort_json(value: &Value) -> Value {
    match value {
        Value::Object(map) => {
            let mut sorted: serde_json::Map<String, Value> = serde_json::Map::new();
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            for key in keys {
                sorted.insert(key.clone(), deep_sort_json(&map[key]));
            }
            Value::Object(sorted)
        }
        Value::Array(arr) => {
            let mut sorted: Vec<Value> = arr.iter().map(deep_sort_json).collect();
            sorted.sort_by(|a, b| {
                let a_str = serde_json::to_string(a).unwrap_or_default();
                let b_str = serde_json::to_string(b).unwrap_or_default();
                a_str.cmp(&b_str)
            });
            Value::Array(sorted)
        }
        _ => value.clone(),
    }
}

pub fn normalize_json(input: &str) -> Result<String, String> {
    let parsed: Value = serde_json::from_str(input).map_err(|e| e.to_string())?;
    let sorted = deep_sort_json(&parsed);
    serde_json::to_string_pretty(&sorted).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn sort_object_keys() {
        let val = json!({"z": 1, "a": 2, "m": 3});
        let sorted = deep_sort_json(&val);
        let keys: Vec<&String> = sorted.as_object().unwrap().keys().collect();
        assert_eq!(keys, vec!["a", "m", "z"]);
    }

    #[test]
    fn sort_array() {
        let sorted = deep_sort_json(&json!([3, 1, 2]));
        assert_eq!(sorted, json!([1, 2, 3]));
    }

    #[test]
    fn normalize_different_key_order() {
        let a = normalize_json("{\"z\":1,\"a\":2}").unwrap();
        let b = normalize_json("{\"a\":2,\"z\":1}").unwrap();
        assert_eq!(a, b);
    }

    #[test]
    fn primitives_pass_through() {
        assert_eq!(deep_sort_json(&json!(null)), json!(null));
        assert_eq!(deep_sort_json(&json!(42)), json!(42));
        assert_eq!(deep_sort_json(&json!("hello")), json!("hello"));
    }
}
```

- [ ] **Step 5: Create lib.rs with all exports**

```rust
// wasm/crates/csr-json-tools/src/lib.rs
use wasm_bindgen::prelude::*;

mod deep_sort;
mod format;
mod json_to_ts;

// ── JSON Formatting ──

#[wasm_bindgen]
pub fn format_json(input: &str, indent: u32) -> Result<String, JsError> {
    format::format_json(input, indent).map_err(|e| JsError::new(&e))
}

#[wasm_bindgen]
pub fn get_json_parse_error(input: &str) -> Option<String> {
    format::get_json_parse_error(input)
}

// ── JSON to TypeScript ──

#[wasm_bindgen]
pub fn json_to_typescript(
    json: &str,
    use_interface: bool,
    optional_properties: bool,
    root_name: &str,
) -> Result<String, JsError> {
    let options = json_to_ts::JsonToTsOptions {
        optional_properties,
        root_name: root_name.to_string(),
        use_interface,
    };
    json_to_ts::json_to_typescript(json, &options).map_err(|e| JsError::new(&e))
}

// ── Deep Sort / Normalize ──

#[wasm_bindgen]
pub fn deep_sort_json(input: &str) -> Result<String, JsError> {
    let value: serde_json::Value =
        serde_json::from_str(input).map_err(|e| JsError::new(&e.to_string()))?;
    let sorted = deep_sort::deep_sort_json(&value);
    serde_json::to_string(&sorted).map_err(|e| JsError::new(&e.to_string()))
}

#[wasm_bindgen]
pub fn normalize_json(input: &str) -> Result<String, JsError> {
    deep_sort::normalize_json(input).map_err(|e| JsError::new(&e))
}

#[wasm_bindgen]
pub fn get_json_diff_error(input: &str, label: &str) -> Option<String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return None;
    }
    match serde_json::from_str::<serde_json::Value>(trimmed) {
        Ok(_) => None,
        Err(e) => Some(format!("{} JSON is invalid: {}", label, e)),
    }
}
```

- [ ] **Step 6: Run Rust tests**

Run: `cd /Users/boe-100x/Documents/projects/labs/boengai/csr-dev-tools/wasm && cargo test -p csr-json-tools`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add wasm/crates/csr-json-tools/
git commit -m "feat(csr-json-tools): add JSON formatting, TypeScript generation, and deep sort

JSON formatter with configurable indent. JSON-to-TypeScript with interface/type
modes, optional properties, nested object handling. Deep sort and normalize for
JSON diff support.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Build WASM and create TypeScript wrappers

**Files:**
- Create: `src/wasm/csr-parsers.ts`
- Create: `src/wasm/csr-json-tools.ts`

- [ ] **Step 1: Build both crates**

Run: `cd /Users/boe-100x/Documents/projects/labs/boengai/csr-dev-tools && pnpm wasm:build:dev`
Expected: Both csr-parsers and csr-json-tools build successfully, output in `wasm/pkg/`

- [ ] **Step 2: Create `src/wasm/csr-parsers.ts`**

```typescript
import type {
  CodecResult,
  OutputFormat,
} from '@/types/utils/protobuf-codec'
import type {
  ProtobufParseResult,
} from '@/types/utils/protobuf-to-json'

import { loadWasm } from './init'

type CsrParsers = {
  decode_protobuf: (schema: string, messageType: string, input: string, format: string) => CodecResult
  detect_protobuf_format: (input: string) => string
  encode_protobuf: (schema: string, messageType: string, json: string, format: string) => CodecResult
  format_yaml: (input: string, indent: number, sortKeys: boolean) => string
  generate_sample_json_from_schema: (schemaJson: string, messageName: string) => string
  get_toml_parse_error: (input: string) => string | undefined
  get_xml_parse_error: (input: string) => string | undefined
  get_yaml_parse_error: (input: string) => string | undefined
  json_to_toml: (input: string) => string
  json_to_xml: (input: string) => string
  json_to_yaml: (input: string) => string
  parse_protobuf_schema: (input: string) => ProtobufParseResult
  toml_to_json: (input: string) => string
  xml_to_json: (input: string) => string
  yaml_to_json: (input: string, indent: number) => string
}

// ── XML ──

export async function xmlToJson(input: string): Promise<string> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.xml_to_json(input)
}

export async function jsonToXml(input: string): Promise<string> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.json_to_xml(input)
}

export async function getXmlParseError(input: string): Promise<string | null> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.get_xml_parse_error(input) ?? null
}

// ── YAML ──

export async function yamlToJson(input: string, indent = 2): Promise<string> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.yaml_to_json(input, indent)
}

export async function jsonToYaml(input: string): Promise<string> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.json_to_yaml(input)
}

export async function formatYaml(
  input: string,
  options?: { indent?: number; sortKeys?: boolean },
): Promise<string> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.format_yaml(input, options?.indent ?? 2, options?.sortKeys ?? false)
}

export async function getYamlParseError(input: string): Promise<string | null> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.get_yaml_parse_error(input) ?? null
}

// ── TOML ──

export async function tomlToJson(input: string): Promise<string> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.toml_to_json(input)
}

export async function jsonToToml(input: string): Promise<string> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.json_to_toml(input)
}

export async function getTomlParseError(input: string): Promise<string | null> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.get_toml_parse_error(input) ?? null
}

// ── Protobuf Schema ──

export async function parseProtobufSchema(input: string): Promise<ProtobufParseResult> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.parse_protobuf_schema(input)
}

export async function generateSampleJsonFromSchema(
  schemaJson: string,
  messageName: string,
): Promise<string> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.generate_sample_json_from_schema(schemaJson, messageName)
}

// ── Protobuf Codec ──

export async function encodeProtobuf(
  schema: string,
  messageTypeName: string,
  jsonString: string,
  outputFormat: OutputFormat,
): Promise<CodecResult> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.encode_protobuf(schema, messageTypeName, jsonString, outputFormat)
}

export async function decodeProtobuf(
  schema: string,
  messageTypeName: string,
  input: string,
  inputFormat: OutputFormat,
): Promise<CodecResult> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.decode_protobuf(schema, messageTypeName, input, inputFormat)
}

export async function detectProtobufFormat(input: string): Promise<OutputFormat> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.detect_protobuf_format(input) as OutputFormat
}
```

- [ ] **Step 3: Create `src/wasm/csr-json-tools.ts`**

```typescript
import type { JsonToTsOptions } from '@/types/utils/json-to-typescript'

import { loadWasm } from './init'

type CsrJsonTools = {
  deep_sort_json: (input: string) => string
  format_json: (input: string, indent: number) => string
  get_json_diff_error: (input: string, label: string) => string | undefined
  get_json_parse_error: (input: string) => string | undefined
  json_to_typescript: (json: string, useInterface: boolean, optionalProperties: boolean, rootName: string) => string
  normalize_json: (input: string) => string
}

export async function formatJson(input: string, indent = 2): Promise<string> {
  const wasm = await loadWasm<CsrJsonTools>('csr-json-tools')
  return wasm.format_json(input, indent)
}

export async function getJsonParseError(input: string): Promise<string | null> {
  const wasm = await loadWasm<CsrJsonTools>('csr-json-tools')
  return wasm.get_json_parse_error(input) ?? null
}

export async function jsonToTypeScript(
  json: string,
  opts?: Partial<JsonToTsOptions>,
): Promise<string> {
  const wasm = await loadWasm<CsrJsonTools>('csr-json-tools')
  return wasm.json_to_typescript(
    json,
    opts?.useInterface ?? true,
    opts?.optionalProperties ?? false,
    opts?.rootName ?? 'Root',
  )
}

export async function deepSortJson(input: string): Promise<string> {
  const wasm = await loadWasm<CsrJsonTools>('csr-json-tools')
  return wasm.deep_sort_json(input)
}

export async function normalizeJson(input: string): Promise<string> {
  const wasm = await loadWasm<CsrJsonTools>('csr-json-tools')
  return wasm.normalize_json(input)
}

export async function getJsonDiffError(input: string, label: string): Promise<string | null> {
  const wasm = await loadWasm<CsrJsonTools>('csr-json-tools')
  return wasm.get_json_diff_error(input, label) ?? null
}
```

- [ ] **Step 4: Commit**

```bash
git add src/wasm/csr-parsers.ts src/wasm/csr-json-tools.ts
git commit -m "feat: add TypeScript WASM wrappers for csr-parsers and csr-json-tools

Thin async wrappers matching existing util signatures. All functions load WASM
lazily via shared loadWasm helper.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Swap `src/utils/` imports to use WASM

**Files:**
- Modify: `src/utils/xml.ts`
- Modify: `src/utils/yaml.ts`
- Modify: `src/utils/toml.ts`
- Modify: `src/utils/json.ts`
- Modify: `src/utils/json-to-typescript.ts`
- Modify: `src/utils/json-diff.ts`
- Modify: `src/utils/protobuf-to-json.ts`
- Modify: `src/utils/protobuf-codec.ts`

- [ ] **Step 1: Swap `src/utils/xml.ts`**

Replace entire file:

```typescript
import {
  getXmlParseError as wasmGetXmlParseError,
  jsonToXml as wasmJsonToXml,
  xmlToJson as wasmXmlToJson,
} from '@/wasm/csr-parsers'

export async function xmlToJson(input: string): Promise<string> {
  return wasmXmlToJson(input)
}

export async function jsonToXml(input: string): Promise<string> {
  return wasmJsonToXml(input)
}

export async function getXmlParseError(input: string): Promise<string | null> {
  return wasmGetXmlParseError(input)
}
```

- [ ] **Step 2: Swap `src/utils/yaml.ts`**

Note: YAML functions were previously synchronous. They become async (Promise-based) since WASM loading is async. Update the file and any call sites.

```typescript
import {
  formatYaml as wasmFormatYaml,
  getYamlParseError as wasmGetYamlParseError,
  jsonToYaml as wasmJsonToYaml,
  yamlToJson as wasmYamlToJson,
} from '@/wasm/csr-parsers'

export async function formatYaml(
  input: string,
  options?: { indent?: number; sortKeys?: boolean },
): Promise<string> {
  return wasmFormatYaml(input, options)
}

export async function getYamlParseError(input: string): Promise<string | null> {
  return wasmGetYamlParseError(input)
}

export async function jsonToYaml(input: string): Promise<string> {
  return wasmJsonToYaml(input)
}

export async function yamlToJson(input: string, indent = 2): Promise<string> {
  return wasmYamlToJson(input, indent)
}
```

- [ ] **Step 3: Swap `src/utils/toml.ts`**

```typescript
import {
  getTomlParseError as wasmGetTomlParseError,
  jsonToToml as wasmJsonToToml,
  tomlToJson as wasmTomlToJson,
} from '@/wasm/csr-parsers'

export async function tomlToJson(input: string): Promise<string> {
  return wasmTomlToJson(input)
}

export async function jsonToToml(input: string): Promise<string> {
  return wasmJsonToToml(input)
}

export async function getTomlParseError(input: string): Promise<string | null> {
  return wasmGetTomlParseError(input)
}
```

- [ ] **Step 4: Swap `src/utils/json.ts`**

Note: These were synchronous. They become async. Check and update call sites.

```typescript
import {
  formatJson as wasmFormatJson,
  getJsonParseError as wasmGetJsonParseError,
} from '@/wasm/csr-json-tools'

export async function formatJson(input: string, indent = 2): Promise<string> {
  return wasmFormatJson(input, indent)
}

export async function getJsonParseError(input: string): Promise<string | null> {
  return wasmGetJsonParseError(input)
}
```

- [ ] **Step 5: Swap `src/utils/json-to-typescript.ts`**

```typescript
import type { JsonToTsOptions } from '@/types/utils/json-to-typescript'

import { jsonToTypeScript as wasmJsonToTypeScript } from '@/wasm/csr-json-tools'

export async function jsonToTypeScript(
  json: string,
  opts?: Partial<JsonToTsOptions>,
): Promise<string> {
  return wasmJsonToTypeScript(json, opts)
}
```

- [ ] **Step 6: Swap `src/utils/json-diff.ts`**

```typescript
import {
  deepSortJson as wasmDeepSortJson,
  getJsonDiffError as wasmGetJsonDiffError,
  normalizeJson as wasmNormalizeJson,
} from '@/wasm/csr-json-tools'

export async function deepSortJson(input: string): Promise<string> {
  return wasmDeepSortJson(input)
}

export async function normalizeJson(input: string): Promise<string> {
  return wasmNormalizeJson(input)
}

export async function getJsonDiffError(input: string, label: string): Promise<string | null> {
  return wasmGetJsonDiffError(input, label)
}
```

- [ ] **Step 7: Swap `src/utils/protobuf-to-json.ts`**

```typescript
import type { ProtobufEnumInfo, ProtobufMessageInfo, ProtobufParseResult, ProtobufSchemaInfo } from '@/types/utils/protobuf-to-json'

import {
  generateSampleJsonFromSchema,
  parseProtobufSchema as wasmParseProtobufSchema,
} from '@/wasm/csr-parsers'

export async function parseProtobufSchema(protoSource: string): Promise<ProtobufParseResult> {
  return wasmParseProtobufSchema(protoSource)
}

export async function generateSampleJson(
  message: ProtobufMessageInfo,
  allMessages: Array<ProtobufMessageInfo>,
  allEnums: Array<ProtobufEnumInfo>,
): Promise<Record<string, unknown>> {
  const schemaJson = JSON.stringify({ enums: allEnums, messages: allMessages, package: null, syntax: null })
  const result = await generateSampleJsonFromSchema(schemaJson, message.name)
  return JSON.parse(result) as Record<string, unknown>
}

export type { ProtobufEnumInfo, ProtobufMessageInfo, ProtobufSchemaInfo } from '@/types/utils/protobuf-to-json'
```

- [ ] **Step 8: Swap `src/utils/protobuf-codec.ts`**

```typescript
import type { CodecResult, OutputFormat } from '@/types/utils/protobuf-codec'

import {
  decodeProtobuf as wasmDecodeProtobuf,
  detectProtobufFormat as wasmDetectProtobufFormat,
  encodeProtobuf as wasmEncodeProtobuf,
} from '@/wasm/csr-parsers'

export async function detectProtobufFormat(input: string): Promise<OutputFormat> {
  return wasmDetectProtobufFormat(input)
}

export async function encodeProtobuf(
  schema: string,
  messageTypeName: string,
  jsonString: string,
  outputFormat: OutputFormat,
): Promise<CodecResult> {
  return wasmEncodeProtobuf(schema, messageTypeName, jsonString, outputFormat)
}

export async function decodeProtobuf(
  schema: string,
  messageTypeName: string,
  input: string,
  inputFormat: OutputFormat,
): Promise<CodecResult> {
  return wasmDecodeProtobuf(schema, messageTypeName, input, inputFormat)
}

export type { OutputFormat } from '@/types/utils/protobuf-codec'
```

- [ ] **Step 9: Update call sites for sync-to-async changes**

Search for all call sites of the previously synchronous functions that are now async:
- `formatJson` -> add `await`
- `getJsonParseError` -> add `await`
- `formatYaml`, `getYamlParseError`, `jsonToYaml`, `yamlToJson` -> add `await`
- `jsonToTypeScript` -> add `await`
- `deepSortJson`, `normalizeJson`, `getJsonDiffError` -> add `await`
- `parseProtobufSchema`, `generateSampleJson` -> add `await`
- `encodeProtobuf`, `decodeProtobuf`, `detectProtobufFormat` -> add `await`

Run: `grep -rn "formatJson\|getJsonParseError\|formatYaml\|getYamlParseError\|jsonToYaml\|yamlToJson\|jsonToTypeScript\|deepSortJson\|normalizeJson\|getJsonDiffError\|parseProtobufSchema\|generateSampleJson\|encodeProtobuf\|decodeProtobuf\|detectProtobufFormat" src/ --include="*.ts" --include="*.tsx" | grep -v "spec.ts" | grep -v "wasm/" | grep -v "utils/" | grep -v "types/"`

For each call site, add `await` if not already present and ensure the containing function is `async`.

- [ ] **Step 10: Commit**

```bash
git add src/utils/xml.ts src/utils/yaml.ts src/utils/toml.ts src/utils/json.ts src/utils/json-to-typescript.ts src/utils/json-diff.ts src/utils/protobuf-to-json.ts src/utils/protobuf-codec.ts
git commit -m "feat: swap Phase 4 utils to use WASM implementations

XML, YAML, TOML, JSON formatting, JSON-to-TypeScript, JSON diff, and protobuf
utilities now delegate to csr-parsers and csr-json-tools WASM crates.
Previously synchronous functions are now async (WASM loading).

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Run existing Vitest specs and fix failures

**Files:**
- Modify: Various spec files if async changes are needed
- Modify: Rust source if output doesn't match expectations

- [ ] **Step 1: Run all Phase 4 related tests**

Run: `cd /Users/boe-100x/Documents/projects/labs/boengai/csr-dev-tools && pnpm wasm:build:dev && pnpm vitest run src/utils/xml.spec.ts src/utils/yaml.spec.ts src/utils/toml.spec.ts src/utils/json.spec.ts src/utils/json-to-typescript.spec.ts src/utils/json-diff.spec.ts src/utils/protobuf-to-json.spec.ts src/utils/protobuf-codec.spec.ts`

Expected: Tests may fail due to sync-to-async changes or output format differences.

- [ ] **Step 2: Update spec files for async changes**

For specs that call previously-sync functions (yaml, json, json-to-typescript, json-diff), add `async`/`await`:

- `yaml.spec.ts`: Change all `it` callbacks to `async`, add `await` to all function calls
- `json.spec.ts`: Change to async, add await
- `json-to-typescript.spec.ts`: Change to async, add await
- `json-diff.spec.ts`: Change to async, add await for `deepSortJson`, `normalizeJson`, `getJsonDiffError` (note: `deepSortJson` now returns a JSON string, not a Value — update assertions)
- `protobuf-to-json.spec.ts`: Add await to `parseProtobufSchema`, `generateSampleJson`
- `protobuf-codec.spec.ts`: Add await to `encodeProtobuf`, `decodeProtobuf`, `detectProtobufFormat`

- [ ] **Step 3: Fix any Rust output differences**

Common issues to watch for:
- JSON key ordering (use `preserve_order` serde feature)
- Numeric coercion differences (XML `"30"` -> `30`)
- YAML formatting whitespace differences
- Protobuf field name casing (`zip_code` vs `zipCode`)

Fix Rust implementations to match expected outputs.

- [ ] **Step 4: Re-run tests until all pass**

Run: `cd /Users/boe-100x/Documents/projects/labs/boengai/csr-dev-tools && pnpm vitest run src/utils/xml.spec.ts src/utils/yaml.spec.ts src/utils/toml.spec.ts src/utils/json.spec.ts src/utils/json-to-typescript.spec.ts src/utils/json-diff.spec.ts src/utils/protobuf-to-json.spec.ts src/utils/protobuf-codec.spec.ts`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: update Phase 4 specs for async WASM migration

Update test files to use async/await for functions that switched from sync to
async. Fix any Rust output format differences to match existing expectations.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Remove replaced JS dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove dependencies**

Run: `cd /Users/boe-100x/Documents/projects/labs/boengai/csr-dev-tools && pnpm remove fast-xml-parser yaml smol-toml protobufjs`

- [ ] **Step 2: Verify no remaining imports**

Run: `grep -rn "from 'fast-xml-parser'\|from 'yaml'\|from 'smol-toml'\|from 'protobufjs'\|import \* as protobuf" src/`
Expected: No matches

- [ ] **Step 3: Run full test suite**

Run: `cd /Users/boe-100x/Documents/projects/labs/boengai/csr-dev-tools && pnpm vitest run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: remove fast-xml-parser, yaml, smol-toml, protobufjs dependencies

Replaced by hand-written Rust implementations in csr-parsers WASM crate.
Removes ~465KB of JS dependencies.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Add Phase 4 benchmarks

**Files:**
- Create: `benchmarks/parsers.bench.ts`
- Create: `benchmarks/json-tools.bench.ts`

- [ ] **Step 1: Create parsers benchmark**

```typescript
// benchmarks/parsers.bench.ts
import { bench } from './bench'

const SMALL_XML = '<root><name>John</name><age>30</age></root>'
const SMALL_YAML = 'name: John\nage: 30\ntags:\n  - dev\n  - tools'
const SMALL_TOML = 'name = "John"\nage = 30\n\n[server]\nhost = "localhost"'
const SMALL_PROTO = `
syntax = "proto3";
message Person {
  string name = 1;
  int32 age = 2;
  bool active = 3;
}
`

// Generate large inputs
const LARGE_YAML_OBJ: Record<string, unknown> = {}
for (let i = 0; i < 1000; i++) LARGE_YAML_OBJ[`key${i}`] = i
const LARGE_YAML = Object.entries(LARGE_YAML_OBJ).map(([k, v]) => `${k}: ${v}`).join('\n')

await bench('XML: xmlToJson (small)', 1000, async () => {
  const { xmlToJson } = await import('@/utils')
  return () => xmlToJson(SMALL_XML)
})

await bench('YAML: yamlToJson (small)', 1000, async () => {
  const { yamlToJson } = await import('@/utils')
  return () => yamlToJson(SMALL_YAML)
})

await bench('YAML: yamlToJson (1000 keys)', 100, async () => {
  const { yamlToJson } = await import('@/utils')
  return () => yamlToJson(LARGE_YAML)
})

await bench('TOML: tomlToJson (small)', 1000, async () => {
  const { tomlToJson } = await import('@/utils')
  return () => tomlToJson(SMALL_TOML)
})

await bench('Protobuf: parseSchema (small)', 500, async () => {
  const { parseProtobufSchema } = await import('@/utils')
  return () => parseProtobufSchema(SMALL_PROTO)
})
```

- [ ] **Step 2: Create json-tools benchmark**

```typescript
// benchmarks/json-tools.bench.ts
import { bench } from './bench'

const SMALL_JSON = '{"name":"John","age":30,"tags":["dev","tools"]}'
const LARGE_JSON_OBJ: Record<string, number> = {}
for (let i = 0; i < 1000; i++) LARGE_JSON_OBJ[`key${i}`] = i
const LARGE_JSON = JSON.stringify(LARGE_JSON_OBJ)

await bench('JSON: formatJson (small)', 5000, async () => {
  const { formatJson } = await import('@/utils')
  return () => formatJson(SMALL_JSON)
})

await bench('JSON: formatJson (1000 keys)', 500, async () => {
  const { formatJson } = await import('@/utils')
  return () => formatJson(LARGE_JSON)
})

await bench('JSON: jsonToTypeScript (small)', 2000, async () => {
  const { jsonToTypeScript } = await import('@/utils')
  return () => jsonToTypeScript(SMALL_JSON)
})

await bench('JSON: normalizeJson (1000 keys)', 500, async () => {
  const { normalizeJson } = await import('@/utils')
  return () => normalizeJson(LARGE_JSON)
})
```

- [ ] **Step 3: Commit**

```bash
git add benchmarks/parsers.bench.ts benchmarks/json-tools.bench.ts
git commit -m "bench: add Phase 4 benchmarks (parsers, json-tools WASM)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```
