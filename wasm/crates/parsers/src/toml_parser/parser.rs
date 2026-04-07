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
            let entry = target
                .entry(last_key.clone())
                .or_insert_with(|| Value::Array(Vec::new()));
            if let Value::Array(arr) = entry {
                arr.push(Value::Object(Map::new()));
            } else {
                return Err(format!(
                    "Line {}: expected array for [[{}]]",
                    line_num + 1,
                    last_key
                ));
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
        // Check what kind of value exists (or doesn't) and auto-create if needed
        if !current.contains_key(key) {
            current.insert(key.clone(), Value::Object(Map::new()));
        }
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
                return Err(format!("Failed to create table for key '{}'", key));
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
    if trimmed.starts_with('"')
        || trimmed.starts_with('\'')
        || trimmed.starts_with('[')
        || trimmed.starts_with('{')
    {
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

    // Datetime -- store as string
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
