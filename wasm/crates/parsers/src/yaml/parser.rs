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

fn parse_block(lines: &[Line<'_>], start: usize, _min_indent: usize) -> Result<(Value, usize), String> {
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
