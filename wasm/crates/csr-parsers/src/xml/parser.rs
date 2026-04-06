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
            } else if self.pos >= self.input.len() {
                return Err(format!("Unclosed tag <{}>", tag_name));
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
